import type { Listing } from "./types";

const NO_REGION = "sem-regiao";

/** Chave estável da região: sem acento, minúscula, com hífen ("Águas Claras" → "aguas-claras"). */
export function regionKey(region: string | null | undefined) {
  const key = (region ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return key || NO_REGION;
}

/** Regiões digitadas em minúsculas na sidebar ("ponte alta") viram "Ponte Alta"; as demais ficam como estão. */
function regionLabel(region: string | null) {
  if (!region) return "Sem região";
  return region === region.toLowerCase() ? region.replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : region;
}

export type RegionOption = { key: string; label: string; count: number };

/** Regiões que existem nos imóveis, com contagem, da mais cheia para a mais vazia. */
export function buildRegionOptions(listings: Listing[]): RegionOption[] {
  const byKey = new Map<string, RegionOption>();
  for (const l of listings) {
    const key = regionKey(l.region);
    const option = byKey.get(key) ?? { key, label: regionLabel(l.region), count: 0 };
    option.count += 1;
    byKey.set(key, option);
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
}
