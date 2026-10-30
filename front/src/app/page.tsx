import { ListingGrid } from "@/components/listings/listing-grid";
import { RegionFilter } from "@/components/listings/region-filter";
import { ResultTabs } from "@/components/listings/result-tabs";
import { SortBar } from "@/components/listings/sort-bar";
import { SearchSidebar } from "@/components/sidebar/search-sidebar";
import { api } from "@/lib/api";
import { buildRegionOptions, regionKey } from "@/lib/regions";
import { listingSorts, resultTabs, type ListingSort, type ResultTab } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ sort?: string; tab?: string; region?: string | string[] }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { sort: sortParam, tab: tabParam, region: regionParam } = await searchParams;
  const sort = listingSorts.find((s) => s === sortParam) ?? ("match" satisfies ListingSort);

  const [profile] = await api.profiles();
  const [allListings, runs] = profile
    ? await Promise.all([api.listings(profile.id, sort), api.agentRuns(profile.id)])
    : [[], []];

  // "Última busca" = imóveis que a última busca concluída aprovou (cada imóvel guarda a última que o aprovou).
  const lastRun = runs.find((r) => r.status === "success") ?? null;
  const lastRunListings = lastRun ? allListings.filter((l) => l.agentRunId === lastRun.id) : [];

  // Sem ?tab=, abre na última busca (se existir): é o que a pessoa acabou de pedir.
  const tab: ResultTab = resultTabs.find((t) => t === tabParam) ?? (lastRun ? "ultima" : "todos");

  // Filtro de região (só em "Todos os resultados"): ignora regiões que não existem nos dados.
  const regionOptions = buildRegionOptions(allListings);
  const requested = [regionParam ?? []].flat();
  const selectedRegions = regionOptions.filter((o) => requested.includes(o.key)).map((o) => o.key);
  const filteredAll = selectedRegions.length
    ? allListings.filter((l) => selectedRegions.includes(regionKey(l.region)))
    : allListings;
  const listings = tab === "ultima" ? lastRunListings : filteredAll;
  const lastRunAt = lastRun?.finishedAt
    ? new Date(lastRun.finishedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 lg:h-screen lg:flex-row">
      <div className="lg:w-64 lg:shrink-0">
        {profile ? (
          <SearchSidebar profile={profile} lastRun={runs[0] ?? null} />
        ) : (
          <p className="text-text-muted">Nenhum perfil de busca. Rode `npm run db:seed`.</p>
        )}
      </div>
      <main className="flex-1 overflow-y-auto">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">
            Imóveis <span className="text-brand-gradient">encontrados</span>
          </h1>
          <SortBar active={sort} tab={tab} regions={selectedRegions} />
        </header>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-hairline">
          <ResultTabs active={tab} sort={sort} counts={{ ultima: lastRunListings.length, todos: allListings.length }} />
          {tab === "ultima" && lastRunAt && (
            <span className="pb-2.5 text-xs text-text-muted">Busca concluída em {lastRunAt}</span>
          )}
        </div>

        {tab === "todos" && regionOptions.length > 0 && (
          <RegionFilter
            options={regionOptions}
            selected={selectedRegions}
            tab={tab}
            sort={sort}
            shown={filteredAll.length}
            total={allListings.length}
          />
        )}

        <ListingGrid
          listings={listings}
          emptyMessage={
            tab === "ultima"
              ? lastRun
                ? "A última busca não aprovou nenhum imóvel. Veja “Todos os resultados” ou ajuste os filtros."
                : "Nenhuma busca concluída ainda. Ajuste os filtros e clique em “Buscar com o agente”."
              : undefined
          }
        />
      </main>
    </div>
  );
}
