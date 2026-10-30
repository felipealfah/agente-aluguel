import { House } from "lucide-react";
import type { Listing } from "@/lib/types";
import { ListingCard } from "./listing-card";

export function ListingGrid({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <div className="relative flex h-72 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-hairline bg-surface-card text-center">
        <div className="absolute -top-6 -right-6 size-24 rounded-3xl bg-brand-cyan/80" />
        <div className="absolute -bottom-6 -left-6 size-24 rounded-3xl bg-brand-purple/80" />
        <House className="size-8 text-text-muted" />
        <p className="text-text-muted">Nenhum imóvel ainda. Ajuste os filtros e clique em “Buscar com o agente”.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
