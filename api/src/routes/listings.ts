import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq, lte, sql, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db/client.js";

const listQuery = z.object({
  profileId: z.coerce.number().int().optional(),
  status: z.enum(schema.listingStatuses).optional(),
  totalCostMax: z.coerce.number().optional(),
  sort: z.enum(["match", "recentes", "preco_desc", "preco_asc"]).default("match"),
});

const L = schema.listings;
/** Anúncios sem data de publicação (ex.: QuintoAndar) ficam sempre no fim de "mais recentes". */
const publishedNullsLast = sql`${L.publishedAt} is null`;
const orderings = {
  match: [desc(L.score), publishedNullsLast, desc(L.publishedAt)],
  recentes: [publishedNullsLast, desc(L.publishedAt), desc(L.score)],
  preco_desc: [desc(L.totalCost), desc(L.score)],
  preco_asc: [asc(L.totalCost), desc(L.score)],
};

const idParam = z.object({ id: z.coerce.number().int() });

export const listingsRoutes = new Hono()
  .get("/", zValidator("query", listQuery), async (c) => {
    const { profileId, status, totalCostMax, sort } = c.req.valid("query");
    const filters: SQL[] = [];
    if (profileId) filters.push(eq(schema.listings.profileId, profileId));
    if (status) filters.push(eq(schema.listings.status, status));
    if (totalCostMax) filters.push(lte(schema.listings.totalCost, totalCostMax));

    const rows = await db
      .select()
      .from(schema.listings)
      .where(and(...filters))
      .orderBy(...orderings[sort]);
    return c.json(rows);
  })
  .patch(
    "/:id/status",
    zValidator("param", idParam),
    zValidator("json", z.object({ status: z.enum(schema.listingStatuses) })),
    async (c) => {
      const { id } = c.req.valid("param");
      const [row] = await db
        .update(schema.listings)
        .set({ status: c.req.valid("json").status })
        .where(eq(schema.listings.id, id))
        .returning();
      return row ? c.json(row) : c.json({ error: "Imóvel não encontrado" }, 404);
    },
  );
