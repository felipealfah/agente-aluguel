import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { runAgent } from "../agent/run-agent.js";
import { db, schema } from "../db/client.js";

const idParam = z.object({ id: z.coerce.number().int() });

export const agentRoutes = new Hono()
  /** Dispara o agente em background com o perfil atual. Retorna 202 com o run criado. */
  .post("/runs", zValidator("json", z.object({ profileId: z.number().int() })), async (c) => {
    const { profileId } = c.req.valid("json");
    const profile = await db.query.searchProfiles.findFirst({ where: eq(schema.searchProfiles.id, profileId) });
    if (!profile) return c.json({ error: "Perfil não encontrado" }, 404);

    const running = await db.query.agentRuns.findFirst({
      where: and(eq(schema.agentRuns.profileId, profileId), eq(schema.agentRuns.status, "running")),
    });
    if (running) return c.json({ error: "Já existe uma busca em andamento", run: running }, 409);

    const { id, createdAt, updatedAt, ...filters } = profile;
    const [run] = await db.insert(schema.agentRuns).values({ profileId, filters }).returning();

    void runAgent(run.id, profile);
    return c.json(run, 202);
  })
  .get("/runs", zValidator("query", z.object({ profileId: z.coerce.number().int() })), async (c) => {
    const { profileId } = c.req.valid("query");
    const rows = await db
      .select()
      .from(schema.agentRuns)
      .where(eq(schema.agentRuns.profileId, profileId))
      .orderBy(desc(schema.agentRuns.id))
      .limit(20);
    return c.json(rows);
  })
  .get("/runs/:id", zValidator("param", idParam), async (c) => {
    const { id } = c.req.valid("param");
    const run = await db.query.agentRuns.findFirst({ where: eq(schema.agentRuns.id, id) });
    return run ? c.json(run) : c.json({ error: "Execução não encontrada" }, 404);
  });
