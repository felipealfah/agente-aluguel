import { ListingGrid } from "@/components/listings/listing-grid";
import { SortBar } from "@/components/listings/sort-bar";
import { SearchSidebar } from "@/components/sidebar/search-sidebar";
import { api } from "@/lib/api";
import { listingSorts, type ListingSort } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort: sortParam } = await searchParams;
  const sort = listingSorts.find((s) => s === sortParam) ?? ("match" satisfies ListingSort);

  const [profile] = await api.profiles();
  const [listings, runs] = profile
    ? await Promise.all([api.listings(profile.id, sort), api.agentRuns(profile.id)])
    : [[], []];

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
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold">
              Imóveis <span className="text-brand-gradient">encontrados</span>
            </h1>
            <span className="font-mono text-xs text-text-muted tabular-nums">{listings.length} resultados</span>
          </div>
          <SortBar active={sort} />
        </header>
        <ListingGrid listings={listings} />
      </main>
    </div>
  );
}
