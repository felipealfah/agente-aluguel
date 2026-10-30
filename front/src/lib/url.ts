import type { ListingSort, ResultTab } from "./types";

/** URL da lista: aba, ordenação e regiões escolhidas (?region= repetido). Uma única fonte para todos os links. */
export function listUrl({ tab, sort, regions = [] }: { tab: ResultTab; sort: ListingSort; regions?: string[] }) {
  const params = new URLSearchParams({ tab, sort });
  for (const region of regions) params.append("region", region);
  return `/?${params}`;
}
