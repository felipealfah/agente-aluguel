import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { propertySubtypes, type PropertySubtype, type SearchProfile } from "../db/schema.js";
import { slugify, type Candidate } from "./sources.js";

/** Modelo da análise; troque com ANTHROPIC_MODEL (ex.: claude-sonnet-5-5 para gastar menos). */
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
/** Modelos que aceitam `fallbacks: "default"` (rota para outro modelo se o classificador de segurança recusar). */
const FALLBACK_MODELS = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);
const BATCH_SIZE = 25;

export type Analyzed = Candidate & {
  region: string | null;
  totalCost: number;
  score: number;
  agentNotes: string;
};

export const hasClaudeCredentials = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const totalCost = (c: Candidate, profile: SearchProfile) =>
  c.rent + (profile.includeCondoFee ? (c.condoFee ?? 0) : 0);

/** 5 no perfil significa "5 ou mais". */
const roomMatches = (wanted: number[], actual: number | null) =>
  wanted.length === 0 || actual == null || wanted.some((w) => (w === 5 ? actual >= 5 : actual === w));

/**
 * Região do perfil citada no anúncio, se houver. Olha primeiro a localização e só depois título e
 * descrição; entre várias regiões citadas, vale a que aparece primeiro — o bairro vem antes da
 * cidade ("Setor Habitacional Arniqueira (Águas Claras)" é Arniqueiras, não Águas Claras).
 */
function matchRegion(c: Candidate, regions: string[]) {
  for (const text of [c.locationText ?? "", `${c.title} ${c.description ?? ""}`]) {
    const haystack = slugify(text);
    let best: { region: string; at: number } | null = null;
    for (const region of regions) {
      const at = haystack.indexOf(slugify(region).replace(/s$/, ""));
      if (at >= 0 && (!best || at < best.at)) best = { region, at };
    }
    if (best) return best.region;
  }
  return null;
}

/** Filtros objetivos: descarta só o que contradiz o perfil com dados conhecidos. */
export function ruleFilter(candidates: Candidate[], profile: SearchProfile) {
  return candidates.filter((c) => {
    const total = totalCost(c, profile);
    if (profile.priceMin != null && total < profile.priceMin) return false;
    if (profile.priceMax != null && total > profile.priceMax) return false;
    if (!roomMatches(profile.bedrooms, c.bedrooms)) return false;
    if (!roomMatches(profile.bathrooms, c.bathrooms)) return false;
    if (profile.categories.length && c.category && !profile.categories.includes(c.category)) return false;
    if (profile.subtypes.length && c.subtype && !profile.subtypes.includes(c.subtype)) return false;
    return true;
  });
}

/** Análise sem LLM: exige a região no texto e pontua pela proximidade do preço médio. */
function analyzeByRules(candidates: Candidate[], profile: SearchProfile): Analyzed[] {
  const mid =
    profile.priceMin != null && profile.priceMax != null ? (profile.priceMin + profile.priceMax) / 2 : null;
  return candidates.flatMap((c) => {
    const region = matchRegion(c, profile.regions);
    if (!region) return [];
    const total = totalCost(c, profile);
    const priceScore = mid ? Math.max(0, 1 - Math.abs(total - mid) / mid) : 0.5;
    const completeness = [c.bedrooms, c.bathrooms, c.area, c.image].filter((v) => v != null).length / 4;
    return [
      {
        ...c,
        region,
        totalCost: total,
        score: Math.round(50 + priceScore * 30 + completeness * 20),
        agentNotes: "Analisado por regras (sem Claude): região encontrada no anúncio e preço dentro da faixa.",
      },
    ];
  });
}

const AnalysisSchema = z.object({
  results: z.array(
    z.object({
      id: z.number().int(),
      matches: z.boolean().describe("true só se o imóvel realmente atende ao perfil"),
      region: z.string().nullable().describe("Uma das regiões do perfil onde o imóvel fica, ou null"),
      subtype: z.enum(propertySubtypes).nullable(),
      score: z.number().int().describe("Aderência ao perfil, de 0 a 100"),
      title: z.string().describe("Título curto e limpo em pt-BR, sem caixa alta"),
      reason: z.string().describe("Uma frase em pt-BR explicando a decisão"),
    }),
  ),
});

const SYSTEM = `Você analisa anúncios de aluguel de imóveis no Distrito Federal para uma pessoa que procura casa.
Para cada anúncio, decida se ele realmente atende ao perfil de busca:
- A região deve ser uma das regiões administrativas do perfil. Bairros/setores pertencentes a ela contam (ex.: "Guará II" é Guará, "QNL" é Taguatinga Norte, "Colônia Agrícola Samambaia" fica em Vicente Pires, "Setor Habitacional Arniqueira" é Arniqueiras). Anúncios que só citam a região como referência ("próximo a Taguatinga") ou ficam em outra região não atendem.
- Tipo, subtipo, preço, quartos e banheiros devem bater com o perfil quando a informação existir no anúncio.
- Desconfie de anúncios que não são de aluguel residencial (venda, temporada, comercial, vaga em república quando o perfil não pede quarto).
O score combina aderência (região, tipo, cômodos), preço perto da média desejada e qualidade/completude do anúncio.`;

function profileSummary(p: SearchProfile) {
  return {
    regioes: p.regions,
    tipos: p.categories,
    subtipos: p.subtypes,
    preco: { min: p.priceMin, max: p.priceMax, incluiCondominio: p.includeCondoFee },
    quartos: p.bedrooms.map((n) => (n === 5 ? "5+" : n)),
    banheiros: p.bathrooms.map((n) => (n === 5 ? "5+" : n)),
    observacoes: p.notes,
  };
}

async function analyzeBatchWithClaude(client: Anthropic, batch: Candidate[], profile: SearchProfile) {
  const listings = batch.map((c, id) => ({
    id,
    fonte: c.source,
    titulo: c.title,
    localizacao: c.locationText,
    descricao: c.description?.slice(0, 500),
    tipo: c.category,
    aluguel: c.rent,
    condominio: c.condoFee,
    quartos: c.bedrooms,
    banheiros: c.bathrooms,
    vagas: c.parking,
    area: c.area,
  }));

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...(FALLBACK_MODELS.has(MODEL) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    output_config: { effort: "low", format: betaZodOutputFormat(AnalysisSchema) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Perfil de busca:\n${JSON.stringify(profileSummary(profile))}\n\nAnúncios:\n${JSON.stringify(listings)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  return response.parsed_output.results;
}

/** Valida os candidatos com o Claude (ou por regras, sem credenciais) e devolve só os aprovados. */
export async function analyze(
  candidates: Candidate[],
  profile: SearchProfile,
  onProgress: (msg: string) => Promise<void>,
): Promise<{ approved: Analyzed[]; usedClaude: boolean; warnings: string[] }> {
  if (!hasClaudeCredentials()) return { approved: analyzeByRules(candidates, profile), usedClaude: false, warnings: [] };

  const client = new Anthropic();
  const approved: Analyzed[] = [];
  const warnings: string[] = [];
  let claudeFailure: string | null = null; // depois da 1ª falha, não insiste: o resto vai por regras
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    if (claudeFailure) {
      approved.push(...analyzeByRules(batch, profile));
      continue;
    }
    await onProgress(`Claude analisando anúncios ${i + 1}–${i + batch.length} de ${candidates.length}`);

    let results: Awaited<ReturnType<typeof analyzeBatchWithClaude>> = null;
    try {
      results = await analyzeBatchWithClaude(client, batch, profile);
    } catch (err) {
      claudeFailure = err instanceof Anthropic.APIError ? `HTTP ${err.status}: ${err.message}` : String(err);
      warnings.push(`Claude indisponível (${claudeFailure.slice(0, 200)}) — o restante foi analisado por regras`);
    }
    if (!results) {
      approved.push(...analyzeByRules(batch, profile)); // recusa ou saída inválida: cai para as regras
      continue;
    }
    for (const r of results) {
      const c = batch[r.id];
      if (!c || !r.matches) continue;
      const region = profile.regions.find((p) => slugify(p) === slugify(r.region ?? "")) ?? matchRegion(c, profile.regions);
      approved.push({
        ...c,
        title: r.title || c.title,
        subtype: (r.subtype as PropertySubtype | null) ?? c.subtype,
        region,
        totalCost: totalCost(c, profile),
        score: Math.max(0, Math.min(100, r.score)),
        agentNotes: r.reason,
      });
    }
  }
  return { approved, usedClaude: !claudeFailure, warnings };
}
