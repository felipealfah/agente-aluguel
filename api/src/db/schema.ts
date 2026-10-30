import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
};

// Filtros no padrão da OLX (Aluguel - casas e apartamentos)
export const propertyCategories = ["apartamento", "casa", "quarto"] as const;
export const propertySubtypes = [
  "casa_condominio",
  "casa_vila",
  "cobertura",
  "duplex_triplex",
  "kitnet",
  "loft",
  "padrao",
] as const;
export const listingStatuses = ["novo", "favorito", "descartado", "contatado", "visitado"] as const;
export const agentRunStatuses = ["running", "success", "error"] as const;
/** Contagens de quartos/banheiros: 0..4 e 5 = "5 ou mais". */
export const roomCounts = [0, 1, 2, 3, 4, 5] as const;

export type PropertyCategory = (typeof propertyCategories)[number];
export type PropertySubtype = (typeof propertySubtypes)[number];
export type RoomCount = (typeof roomCounts)[number];

/** Perfil de busca: o que a sidebar edita e o que o agente usa para procurar. */
export const searchProfiles = sqliteTable("search_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),

  // Região
  state: text("state").notNull(), // UF, ex.: DF
  city: text("city").notNull(),
  regions: text("regions", { mode: "json" }).$type<string[]>().notNull().default([]),

  // Tipo do imóvel
  categories: text("categories", { mode: "json" }).$type<PropertyCategory[]>().notNull().default([]),
  subtypes: text("subtypes", { mode: "json" }).$type<PropertySubtype[]>().notNull().default([]),

  // Preço (aluguel mensal, em reais) e previsão de orçamento — IPTU não é filtro
  priceMin: real("price_min"),
  priceMax: real("price_max"),
  includeCondoFee: integer("include_condo_fee", { mode: "boolean" }).notNull().default(false),
  monthlyIncome: real("monthly_income"),

  // Cômodos (seleção múltipla; 5 = 5+)
  bedrooms: text("bedrooms", { mode: "json" }).$type<RoomCount[]>().notNull().default([]),
  bathrooms: text("bathrooms", { mode: "json" }).$type<RoomCount[]>().notNull().default([]),

  notes: text("notes"), // preferências livres para o agente interpretar

  ...timestamps,
});

/** Histórico de execuções do agente. */
export const agentRuns = sqliteTable("agent_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").references(() => searchProfiles.id, { onDelete: "cascade" }),
  status: text("status").$type<(typeof agentRunStatuses)[number]>().notNull().default("running"),
  filters: text("filters", { mode: "json" }).$type<Record<string, unknown>>(), // snapshot do perfil usado
  listingsFound: integer("listings_found").notNull().default(0),
  listingsNew: integer("listings_new").notNull().default(0),
  stage: text("stage"), // etapa atual, exibida no front enquanto roda
  log: text("log", { mode: "json" }).$type<string[]>().notNull().default([]), // resumo por fonte/região
  error: text("error"),
  startedAt: text("started_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  finishedAt: text("finished_at"),
});

/** Imóveis encontrados pelo agente. */
export const listings = sqliteTable(
  "listings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    profileId: integer("profile_id").references(() => searchProfiles.id, { onDelete: "set null" }),
    agentRunId: integer("agent_run_id").references(() => agentRuns.id, { onDelete: "set null" }),

    source: text("source").notNull(), // ex.: olx, zapimoveis, vivareal
    externalId: text("external_id"),
    url: text("url").notNull().unique(),

    title: text("title").notNull(),
    description: text("description"),
    category: text("category").$type<PropertyCategory>(),
    subtype: text("subtype").$type<PropertySubtype>(),

    address: text("address"),
    region: text("region"), // região administrativa / bairro
    city: text("city"),
    state: text("state"),
    latitude: real("latitude"),
    longitude: real("longitude"),

    rent: real("rent").notNull(),
    condoFee: real("condo_fee"),
    iptu: real("iptu"),
    totalCost: real("total_cost"),

    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    parking: integer("parking"),
    area: real("area"),

    images: text("images", { mode: "json" }).$type<string[]>().notNull().default([]),
    status: text("status").$type<(typeof listingStatuses)[number]>().notNull().default("novo"),
    score: real("score"), // aderência ao perfil (0–100), calculada pelo agente
    agentNotes: text("agent_notes"),

    publishedAt: text("published_at"), // ISO UTC; data exibida no anúncio (null quando a fonte não informa)
    foundAt: text("found_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
    ...timestamps,
  },
  (t) => [
    index("listings_profile_idx").on(t.profileId),
    index("listings_status_idx").on(t.status),
    index("listings_total_cost_idx").on(t.totalCost),
  ],
);

export type SearchProfile = typeof searchProfiles.$inferSelect;
export type NewSearchProfile = typeof searchProfiles.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type AgentRun = typeof agentRuns.$inferSelect;
