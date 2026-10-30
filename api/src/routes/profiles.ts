import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db/client.js";

const money = z.number().nonnegative().nullish();
// 0..4 e 5 = "5 ou mais"
const roomCounts = z.array(z.number().int().min(0).max(5).transform((n) => n as schema.RoomCount));

const profileInput = z.object({
  name: z.string().min(1),
  active: z.boolean().optional(),
  state: z.string().length(2),
  city: z.string().min(1),
  regions: z.array(z.string().min(1)).optional(),
  categories: z.array(z.enum(schema.propertyCategories)).optional(),
  subtypes: z.array(z.enum(schema.propertySubtypes)).optional(),
  priceMin: money,
  priceMax: money,
  includeCondoFee: z.boolean().optional(),
  monthlyIncome: money,
  bedrooms: roomCounts.optional(),
  bathrooms: roomCounts.optional(),
  notes: z.string().nullish(),
});

const idParam = z.object({ id: z.coerce.number().int() });

export const profilesRoutes = new Hono()
  .get("/", async (c) => {
    const rows = await db.select().from(schema.searchProfiles).orderBy(desc(schema.searchProfiles.updatedAt));
    return c.json(rows);
  })
  .get("/:id", zValidator("param", idParam), async (c) => {
    const { id } = c.req.valid("param");
    const row = await db.query.searchProfiles.findFirst({ where: eq(schema.searchProfiles.id, id) });
    return row ? c.json(row) : c.json({ error: "Perfil não encontrado" }, 404);
  })
  .post("/", zValidator("json", profileInput), async (c) => {
    const [row] = await db.insert(schema.searchProfiles).values(c.req.valid("json")).returning();
    return c.json(row, 201);
  })
  .patch("/:id", zValidator("param", idParam), zValidator("json", profileInput.partial()), async (c) => {
    const { id } = c.req.valid("param");
    const [row] = await db
      .update(schema.searchProfiles)
      .set(c.req.valid("json"))
      .where(eq(schema.searchProfiles.id, id))
      .returning();
    return row ? c.json(row) : c.json({ error: "Perfil não encontrado" }, 404);
  });
