import type { PropertyCategory, PropertySubtype, SearchProfile } from "../db/schema.js";
import { runBrowserScript } from "./browser.js";

/** Fontes lidas pelo navegador (bloqueiam HTTP direto) e fontes lidas por HTTP. */
type BrowserSource = "olx" | "dfimoveis";
export type SourceName = BrowserSource | "quintoandar";

/** Uma página de busca a ser aberta no navegador. */
export type SearchJob = { source: BrowserSource; region: string; category: PropertyCategory | null; url: string };

/** Card como extraído da página (strings cruas). */
type RawCard = {
  url: string;
  title?: string;
  subtitle?: string;
  price?: string;
  priceInfo?: string[];
  location?: string;
  details?: string[];
  description?: string;
  image?: string;
  postedAt?: string;
};

type JobResult = { job: SearchJob; items?: RawCard[]; blocked?: boolean; error?: string; title?: string };

/** Anúncio normalizado, pronto para análise. */
export type Candidate = {
  source: SourceName;
  url: string;
  externalId: string | null;
  title: string;
  description: string | null;
  searchedRegion: string;
  locationText: string | null;
  category: PropertyCategory | null;
  subtype: PropertySubtype | null;
  rent: number;
  condoFee: number | null;
  iptu: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  area: number | null;
  image: string | null;
  publishedAt: string | null;
};

const OLX_MAX_PAGES = 2; // 50 anúncios por página
const OLX_CATEGORY_PATH: Record<PropertyCategory, string> = {
  apartamento: "apartamentos",
  casa: "casas",
  quarto: "aluguel-de-quartos",
};
const DF_CATEGORY_TYPES: Record<PropertyCategory, string[]> = {
  apartamento: ["apartamento", "kitnet"],
  casa: ["casa", "casa-condominio"],
  quarto: [],
};
/** Slugs do DFimóveis que diferem do nome da região administrativa. */
const DF_CITY_SLUG: Record<string, string> = { arniqueiras: "arniqueira", "plano-piloto": "brasilia" };

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function buildJobs(profile: SearchProfile): SearchJob[] {
  const categories: (PropertyCategory | null)[] = profile.categories.length ? profile.categories : [null];
  const jobs: SearchJob[] = [];

  for (const region of profile.regions) {
    for (const category of categories) {
      // OLX: busca por texto da região + filtros de preço/quartos/banheiros na URL
      const params = new URLSearchParams({ q: region });
      if (profile.priceMin) params.set("ps", String(profile.priceMin));
      if (profile.priceMax) params.set("pe", String(profile.priceMax));
      profile.bedrooms.forEach((n) => params.append("ros", String(n)));
      profile.bathrooms.forEach((n) => params.append("bae", String(n)));
      const path = category ? `/${OLX_CATEGORY_PATH[category]}` : "";
      for (let page = 1; page <= OLX_MAX_PAGES; page++) {
        if (page > 1) params.set("o", String(page));
        jobs.push({
          source: "olx",
          region,
          category,
          url: `https://www.olx.com.br/imoveis/aluguel${path}/estado-df?${params}`,
        });
      }

      // DFimóveis: região e tipo no caminho; filtros aplicados depois
      const city = DF_CITY_SLUG[slugify(region)] ?? slugify(region);
      const types = category ? DF_CATEGORY_TYPES[category] : ["imoveis"];
      for (const type of types) {
        jobs.push({ source: "dfimoveis", region, category, url: `https://www.dfimoveis.com.br/aluguel/df/${city}/${type}` });
      }
    }
  }
  return jobs;
}

/**
 * Extratores executados dentro da página. Se a página mostrar um desafio
 * anti-bot, retornam `blocked` e a fonte é pulada — o agente não tenta contorná-lo.
 */
const EXTRACTORS = `

const cardSelectors = { olx: "section.olx-adcard", dfimoveis: "a.imovel-card" };

const extractors = {
  olx: () => {
    const blockText = document.title + " " + (document.body?.innerText ?? "").slice(0, 300);
    if (/just a moment|attention required|captcha|verifique que você é humano|access denied/i.test(blockText)) return { blocked: true, title: document.title };
    const items = [...document.querySelectorAll("section.olx-adcard")].map((c) => {
      const a = c.querySelector("a[data-testid='adcard-link'], a.olx-adcard__link");
      return {
        url: a?.href,
        title: a?.getAttribute("title") || c.querySelector("h2")?.textContent?.trim(),
        price: c.querySelector(".olx-adcard__price")?.textContent?.trim(),
        priceInfo: [...c.querySelectorAll(".olx-adcard__price-info")].map((e) => e.textContent.trim()),
        location: c.querySelector(".olx-adcard__location")?.textContent?.trim(),
        details: [...c.querySelectorAll(".olx-adcard__detail")].map((d) => d.getAttribute("aria-label") || d.textContent.trim()),
        image: c.querySelector("img")?.src,
        postedAt: (c.querySelector(".olx-adcard__location-date")?.textContent ?? "").replace(c.querySelector(".olx-adcard__location")?.textContent ?? "", "").trim(),
      };
    }).filter((i) => i.url);
    return { items, title: document.title };
  },
  dfimoveis: () => {
    const blockText = document.title + " " + (document.body?.innerText ?? "").slice(0, 300);
    if (/just a moment|attention required|captcha|verifique que você é humano|access denied/i.test(blockText)) return { blocked: true, title: document.title };
    const items = [...document.querySelectorAll("a.imovel-card")].map((c) => ({
      url: c.href,
      title: c.querySelector("h2")?.textContent?.trim(),
      subtitle: c.querySelector("h3")?.textContent?.trim(),
      price: c.querySelector("[itemprop=price]")?.getAttribute("content"),
      location: c.querySelector("h2")?.textContent?.trim(),
      details: [...c.querySelectorAll(".imovel-feature > div")].map((d) => d.textContent.trim()),
      description: c.querySelector("p[itemprop=description]")?.textContent?.trim(),
      image: c.querySelector(".imovel-image img")?.src,
    })).filter((i) => i.url);
    return { items, title: document.title };
  },
};
`;

function buildScript(runId: number, jobs: SearchJob[], resultPath: string) {
  return `
${EXTRACTORS}
const jobs = ${JSON.stringify(jobs)};
const task = await taskSpace(${JSON.stringify(`agente-aluguel-run-${runId}`)});
const page = task.page("p1");
const results = [];
const blockedSources = new Set();
const { writeFile } = await import("node:fs/promises");
const save = () => writeFile(${JSON.stringify(resultPath)}, JSON.stringify(results));
let handedOff = false;
for (const job of jobs) {
  if (blockedSources.has(job.source)) { results.push({ job, blocked: true }); continue; }
  try {
    try {
      await page.goto(job.url);
    } catch (e) {
      // páginas com anúncios carregando sem parar não disparam "load"; se já navegou, segue
      if (!String(e).includes("navigation committed")) throw e;
    }
    await page
      .waitForFunction((sel) => document.querySelector(sel) !== null, cardSelectors[job.source], { timeout: 10000 })
      .catch(() => {});
    await page.waitForTimeout(1000);
    const r = await page.evaluate(extractors[job.source]);
    if (r.blocked) blockedSources.add(job.source);
    results.push({ job, ...r });
  } catch (e) {
    // prompt de permissão (notificações etc.): o navegador passa o controle ao usuário; para aqui
    if (/permission prompt|no longer assigned|user now controls/i.test(String(e))) {
      results.push({ job, error: "o site abriu um pedido de permissão do navegador; busca no navegador interrompida" });
      handedOff = true;
      break;
    }
    results.push({ job, error: String(e).slice(0, 300) });
  }
  await save();
  await page.waitForTimeout(1000 + Math.floor(Math.random() * 1500)); // ritmo de navegação humana
}
await save();
if (!handedOff) await task.finish({ keep: [] });
`;
}

// ---------- Normalização ----------

// ---------- Datas de publicação (horário de Brasília, UTC-3) ----------

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Ano/mês/dia de hoje em Brasília. */
function todayInBrasilia(now: Date) {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now).split("-").map(Number);
  return { y, m, d };
}

/** Monta o instante UTC (ISO) a partir de uma data/hora de Brasília. */
function brasiliaToIso(y: number, m: number, d: number, hh = 12, mm = 0) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = new Date(`${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Data exibida nos cards da OLX: "Hoje, 17:43", "Ontem, 00:55", "8 de out, 22:39" (sem ano)
 * ou "6/10/2026, 0:50". Sem ano, vale a data mais recente que não esteja no futuro.
 */
export function parsePostedAt(text?: string | null, now = new Date()): string | null {
  if (!text) return null;
  const t = text.toLowerCase().trim();
  const time = t.match(/(\d{1,2}):(\d{2})/);
  const hh = time ? Number(time[1]) : 12;
  const mm = time ? Number(time[2]) : 0;
  const today = todayInBrasilia(now);

  if (t.startsWith("hoje")) return brasiliaToIso(today.y, today.m, today.d, hh, mm);
  if (t.startsWith("ontem")) {
    const yesterday = todayInBrasilia(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    return brasiliaToIso(yesterday.y, yesterday.m, yesterday.d, hh, mm);
  }

  const full = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (full) return brasiliaToIso(Number(full[3]), Number(full[2]), Number(full[1]), hh, mm);

  const short = t.match(/(\d{1,2})\s+de\s+([a-zç]{3})/);
  const month = short ? MONTHS.indexOf(short[2]) + 1 : 0;
  if (short && month) {
    let iso = brasiliaToIso(today.y, month, Number(short[1]), hh, mm);
    if (iso && new Date(iso).getTime() > now.getTime() + 2 * 60 * 60 * 1000) {
      iso = brasiliaToIso(today.y - 1, month, Number(short[1]), hh, mm);
    }
    return iso;
  }
  return null;
}

/** DFimóveis termina a descrição do card com a data, ex.: "... 27/08/26" (sem hora). */
export function parseTrailingDate(text?: string | null): string | null {
  const m = text?.match(/(\d{2})\/(\d{2})\/(\d{2})\s*$/);
  return m ? brasiliaToIso(2000 + Number(m[3]), Number(m[2]), Number(m[1])) : null;
}

const parseMoney = (s?: string | null) => {
  if (!s) return null;
  const digits = s.replace(/[^\d,]/g, "").replace(/,\d{1,2}$/, "");
  return digits ? Number(digits.replace(/\D/g, "")) : null;
};

const firstNumber = (texts: string[], pattern: RegExp) => {
  for (const t of texts) {
    const m = t.match(pattern);
    if (m) return Number(m[1].replace(",", "."));
  }
  return null;
};

function parseDetails(details: string[]) {
  return {
    area: firstNumber(details, /(\d+(?:[.,]\d+)?)\s*(?:metros quadrados|m²)/i),
    bedrooms: firstNumber(details, /(\d+)\s*(?:ou mais\s*)?quartos?/i),
    bathrooms: firstNumber(details, /(\d+)\s*(?:ou mais\s*)?banheiros?/i),
    parking: firstNumber(details, /(\d+)\s*(?:ou mais\s*)?vagas?/i),
  };
}

/**
 * Categoria pelo texto do anúncio: portais misturam apartamentos na aba de casas, então o título
 * vale mais que a aba da busca. Só conclui quando o título cita um tipo e não o outro.
 */
function inferCategory(text: string): PropertyCategory | null {
  const t = text.toLowerCase();
  const apartment = /apartamento|\bapto?\b|kit\s?net|kitnet|studio|\bflat\b|cobertura/.test(t);
  const house = /\bcasa\b|sobrado/.test(t);
  if (apartment && !house) return "apartamento";
  if (house && !apartment) return "casa";
  return null;
}

function inferSubtype(text: string): PropertySubtype | null {
  const t = text.toLowerCase();
  if (/condom[ií]nio/.test(t) && /casa/.test(t)) return "casa_condominio";
  if (/kit\s?net|kitnet|quitinete/.test(t)) return "kitnet";
  if (/cobertura/.test(t)) return "cobertura";
  if (/duplex|triplex/.test(t)) return "duplex_triplex";
  if (/\bloft\b/.test(t)) return "loft";
  if (/casa de vila|\bvila\b/.test(t)) return "casa_vila";
  return null;
}

function normalize({ job, items = [] }: JobResult): Candidate[] {
  return items.flatMap((c) => {
    const rent = parseMoney(c.price);
    if (!rent) return [];
    const info = c.priceInfo ?? [];
    const details = parseDetails(c.details ?? []);
    const title =
      job.source === "dfimoveis"
        ? [c.subtitle, c.title].filter(Boolean).join(" — ")
        : (c.title ?? "Imóvel sem título");
    const text = `${title} ${c.description ?? ""}`;
    return [
      {
        source: job.source,
        url: c.url.split("?")[0],
        externalId: c.url.match(/-(\d{5,})(?:\?|$)/)?.[1] ?? null,
        title,
        description: c.description ?? null,
        searchedRegion: job.region,
        locationText: c.location ?? null,
        category: inferCategory(title) ?? job.category ?? inferCategory(text),
        subtype: inferSubtype(text),
        rent,
        condoFee: parseMoney(info.find((i) => /condom/i.test(i))),
        iptu: parseMoney(info.find((i) => /iptu/i.test(i))),
        ...details,
        image: c.image ?? null,
        publishedAt: job.source === "olx" ? parsePostedAt(c.postedAt) : parseTrailingDate(c.description),
      },
    ];
  });
}

// ---------- QuintoAndar (HTTP direto; robots.txt permite /alugar/imovel) ----------

const QA_REGION_SLUG: Record<string, string> = { arniqueiras: "arniqueira" };
const QA_CATEGORY_PATH: Record<PropertyCategory, string> = { casa: "casa", apartamento: "apartamento", quarto: "" };
const QA_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

type QaHouse = {
  id: string;
  rentPrice?: number;
  totalCost?: number;
  condoIptu?: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpots?: number;
  type?: string;
  neighbourhood?: string;
  address?: { address?: string; city?: string };
  photos?: { url: string }[];
  forRent?: boolean;
};

function qaUrls(profile: SearchProfile) {
  const minRooms = profile.bedrooms.length ? Math.min(...profile.bedrooms) : 0;
  const categories: (PropertyCategory | null)[] = profile.categories.length ? profile.categories : [null];
  return profile.regions.flatMap((region) =>
    categories.flatMap((category) => {
      const path = category ? QA_CATEGORY_PATH[category] : "";
      if (category && !path) return [];
      const slug = QA_REGION_SLUG[slugify(region)] ?? slugify(region);
      const rooms = minRooms > 0 ? `/${minRooms}-quartos` : "";
      const url = `https://www.quintoandar.com.br/alugar/imovel/${slug}-brasilia-df-brasil${path ? `/${path}` : ""}${rooms}`;
      return [{ region, category, url }];
    }),
  );
}

function qaCandidate(h: QaHouse, region: string, category: PropertyCategory | null): Candidate | null {
  if (!h.rentPrice || h.forRent === false) return null;
  const type = h.type ?? "Imóvel";
  const street = h.address?.address ?? "";
  return {
    source: "quintoandar",
    url: `https://www.quintoandar.com.br/imovel/${h.id}/alugar`,
    externalId: h.id,
    title: `${type}${h.bedrooms ? ` com ${h.bedrooms} quartos` : ""}${street ? ` — ${street}` : ""}`,
    description: null,
    searchedRegion: region,
    locationText: [h.neighbourhood, street].filter(Boolean).join(", ") || null,
    category: /apartamento|kitnet|studio/i.test(type) ? "apartamento" : /casa/i.test(type) ? "casa" : category,
    subtype: inferSubtype(type),
    rent: h.rentPrice,
    condoFee: h.condoIptu ?? null, // o QuintoAndar informa condomínio + IPTU juntos
    iptu: null,
    bedrooms: h.bedrooms ?? null,
    bathrooms: h.bathrooms ?? null,
    parking: h.parkingSpots ?? null,
    area: h.area ?? null,
    image: h.photos?.[0]?.url ?? null,
    publishedAt: null, // o QuintoAndar não informa data de publicação
  };
}

async function collectQuintoAndar(profile: SearchProfile): Promise<{ candidates: Candidate[]; log: string[] }> {
  const candidates: Candidate[] = [];
  const log: string[] = [];
  for (const { region, category, url } of qaUrls(profile)) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": QA_USER_AGENT, "Accept-Language": "pt-BR" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const raw = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)?.[1];
      if (!raw) throw new Error("dados da página não encontrados");
      const state = JSON.parse(raw).props.pageProps.initialState;
      const houses = Object.values(state.houses ?? {}) as QaHouse[];
      for (const h of houses) {
        const c = qaCandidate(h, region, category);
        if (c) candidates.push(c);
      }
    } catch (err) {
      log.push(`quintoandar · ${region}: erro — ${err instanceof Error ? err.message : String(err)}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return { candidates, log };
}

export type CollectResult = { candidates: Candidate[]; log: string[] };

/** Coleta em paralelo (navegador + HTTP) e devolve os anúncios normalizados e deduplicados. */
export async function collect(runId: number, profile: SearchProfile): Promise<CollectResult> {
  const jobs = buildJobs(profile);
  const [browser, quintoAndar] = await Promise.allSettled([
    runBrowserScript<JobResult[]>((path) => buildScript(runId, jobs, path)),
    collectQuintoAndar(profile),
  ]);

  const log: string[] = [];
  const byUrl = new Map<string, Candidate>();
  const add = (c: Candidate) => !byUrl.has(c.url) && byUrl.set(c.url, c);

  if (browser.status === "fulfilled") {
    for (const r of browser.value) {
      const label = `${r.job.source} · ${r.job.region}${r.job.category ? ` · ${r.job.category}` : ""}`;
      if (r.blocked) log.push(`${label}: bloqueado pelo site (desafio anti-bot) — fonte pulada`);
      else if (r.error) log.push(`${label}: erro — ${r.error}`);
      normalize(r).forEach(add);
    }
  } else {
    log.push(`navegador: ${browser.reason instanceof Error ? browser.reason.message : String(browser.reason)}`);
  }
  if (quintoAndar.status === "fulfilled") {
    log.push(...quintoAndar.value.log);
    quintoAndar.value.candidates.forEach(add);
  }

  for (const source of ["quintoandar", "dfimoveis", "olx"] as const) {
    const n = [...byUrl.values()].filter((c) => c.source === source).length;
    log.unshift(`${source}: ${n} anúncios coletados`);
  }
  return { candidates: [...byUrl.values()], log };
}
