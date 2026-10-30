import { eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "../db/client.js";
import type { SearchProfile } from "../db/schema.js";
import { analyze, ruleFilter } from "./analyze.js";
import { collect } from "./sources.js";

/**
 * Pipeline do agente: coleta (navegador) → filtro por regras → análise (Claude) → gravação.
 * Atualiza `agent_runs.stage` a cada etapa para o front acompanhar.
 */
export async function runAgent(runId: number, profile: SearchProfile) {
  const log: string[] = [];
  const update = (data: Partial<typeof schema.agentRuns.$inferInsert>) =>
    db.update(schema.agentRuns).set(data).where(eq(schema.agentRuns.id, runId));
  const stage = async (text: string) => {
    await update({ stage: text });
  };

  try {
    await stage(`Abrindo OLX e DFimóveis para ${profile.regions.join(", ")}`);
    const { candidates, log: collectLog } = await collect(runId, profile);
    log.push(...collectLog);

    await stage(`Filtrando ${candidates.length} anúncios`);
    const filtered = ruleFilter(candidates, profile);
    log.push(`${filtered.length} de ${candidates.length} passaram nos filtros de preço/cômodos/tipo`);

    const { approved, usedClaude, warnings } = await analyze(filtered, profile, stage);
    log.push(...warnings);
    log.push(`${approved.length} aprovados na análise ${usedClaude ? "do Claude" : "por regras (sem ANTHROPIC_API_KEY)"}`);

    await stage("Salvando imóveis");
    const urls = approved.map((a) => a.url);
    const existing = urls.length
      ? new Set(
          (await db.select({ url: schema.listings.url }).from(schema.listings).where(inArray(schema.listings.url, urls))).map(
            (r) => r.url,
          ),
        )
      : new Set<string>();

    for (const a of approved) {
      const values = {
        profileId: profile.id,
        agentRunId: runId,
        source: a.source,
        externalId: a.externalId,
        url: a.url,
        title: a.title,
        description: a.description,
        category: a.category,
        subtype: a.subtype,
        address: a.locationText,
        region: a.region,
        city: "Brasília",
        state: "DF",
        rent: a.rent,
        condoFee: a.condoFee,
        iptu: a.iptu,
        totalCost: a.totalCost,
        bedrooms: a.bedrooms,
        bathrooms: a.bathrooms,
        parking: a.parking,
        area: a.area,
        images: a.image ? [a.image] : [],
        publishedAt: a.publishedAt,
        score: a.score,
        agentNotes: a.agentNotes,
      };
      const { url, profileId, ...changes } = values;
      await db
        .insert(schema.listings)
        .values(values)
        .onConflictDoUpdate({ target: schema.listings.url, set: { ...changes, updatedAt: sql`(CURRENT_TIMESTAMP)` } });
    }

    const created = approved.filter((a) => !existing.has(a.url)).length;
    await update({
      status: "success",
      stage: null,
      log,
      listingsFound: approved.length,
      listingsNew: created,
      finishedAt: new Date().toISOString(),
    });
    console.log(`[agent] run #${runId} ok`, log);
  } catch (err) {
    console.error(`[agent] run #${runId} falhou`, err);
    await update({
      status: "error",
      stage: null,
      log,
      error: err instanceof Error ? err.message : String(err),
      finishedAt: new Date().toISOString(),
    });
  }
}
