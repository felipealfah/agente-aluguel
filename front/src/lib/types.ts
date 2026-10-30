// Espelha api/src/db/schema.ts — manter em sincronia.
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
export const roomCounts = [0, 1, 2, 3, 4, 5] as const;

export type PropertyCategory = (typeof propertyCategories)[number];
export type PropertySubtype = (typeof propertySubtypes)[number];
export type RoomCount = (typeof roomCounts)[number];
export type ListingStatus = "novo" | "favorito" | "descartado" | "contatado" | "visitado";
export type AgentRunStatus = "running" | "success" | "error";

export type SearchProfile = {
  id: number;
  name: string;
  active: boolean;
  state: string;
  city: string;
  regions: string[];
  categories: PropertyCategory[];
  subtypes: PropertySubtype[];
  priceMin: number | null;
  priceMax: number | null;
  includeCondoFee: boolean;
  monthlyIncome: number | null;
  bedrooms: RoomCount[];
  bathrooms: RoomCount[];
  notes: string | null;
};

export type Listing = {
  id: number;
  profileId: number | null;
  source: string;
  url: string;
  title: string;
  description: string | null;
  category: PropertyCategory | null;
  subtype: PropertySubtype | null;
  region: string | null;
  city: string | null;
  rent: number;
  condoFee: number | null;
  iptu: number | null;
  totalCost: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  area: number | null;
  images: string[];
  status: ListingStatus;
  score: number | null;
  publishedAt: string | null;
  agentNotes: string | null;
};

export type AgentRun = {
  id: number;
  profileId: number | null;
  status: AgentRunStatus;
  listingsFound: number;
  listingsNew: number;
  stage: string | null;
  log: string[];
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export const listingSorts = ["match", "recentes", "preco_desc", "preco_asc"] as const;
export type ListingSort = (typeof listingSorts)[number];
