import { eq } from "drizzle-orm";
import { db, schema } from "../db/client.js";

/**
 * Buscas rodam em segundo plano dentro do processo da API. Se ela reinicia no meio de uma,
 * a linha fica "running" para sempre e a trava de "uma busca por vez" bloqueia as próximas.
 * Na inicialização, qualquer busca ainda "running" é, por definição, órfã.
 */
export async function recoverInterruptedRuns() {
  const orphans = await db
    .update(schema.agentRuns)
    .set({
      status: "error",
      stage: null,
      error: "Busca interrompida: a API foi reiniciada enquanto ela rodava. Rode de novo.",
      finishedAt: new Date().toISOString(),
    })
    .where(eq(schema.agentRuns.status, "running"))
    .returning({ id: schema.agentRuns.id });
  if (orphans.length) console.warn(`[agent] ${orphans.length} busca(s) órfã(s) marcada(s) como erro: #${orphans.map((o) => o.id).join(", #")}`);
}
