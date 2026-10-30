import { Bath, BedDouble, Car, Clock, House, Ruler } from "lucide-react";
import { brl, timeAgo } from "@/lib/api";
import { subtypeLabels } from "@/lib/options";
import type { Listing } from "@/lib/types";

const sourceLabels: Record<string, string> = { olx: "OLX", dfimoveis: "DFimóveis", quintoandar: "QuintoAndar" };

export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images[0];
  const total = listing.rent + (listing.condoFee ?? 0);
  const published = timeAgo(listing.publishedAt);

  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-card transition-colors hover:border-brand-cyan/40 hover:bg-surface-raised"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-raised">
        {cover ? (
          // sem referer: os portais recusam imagens pedidas a partir de outro domínio
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={listing.title} referrerPolicy="no-referrer" loading="lazy" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-text-muted">
            <House className="size-8" />
          </div>
        )}
        <span className="absolute top-2 left-2 inline-flex h-6 items-center rounded-full bg-canvas-dark/80 px-2 text-xs text-foreground backdrop-blur">
          {sourceLabels[listing.source] ?? listing.source}
        </span>
        {listing.score != null && (
          <span className="absolute top-2 right-2 inline-flex h-6 items-center gap-1 rounded-full bg-canvas-dark/80 px-2 text-xs text-state-go backdrop-blur">
            <span className="size-1.5 rounded-full bg-state-go" />
            {Math.round(listing.score)}% match
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-base leading-snug font-semibold">{listing.title}</h3>
          <p className="text-xs text-text-muted">
            {[listing.subtype && subtypeLabels[listing.subtype], listing.region].filter(Boolean).join(" · ")}
          </p>
          <p className="flex items-center gap-1 text-xs text-text-muted" title={listing.publishedAt ?? undefined}>
            <Clock className="size-3" />
            {published ? `Publicado ${published}` : "Data não informada"}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
          {listing.bedrooms != null && <Spec icon={BedDouble} label={`${listing.bedrooms} qts`} />}
          {listing.bathrooms != null && <Spec icon={Bath} label={`${listing.bathrooms} banh`} />}
          {listing.parking != null && <Spec icon={Car} label={`${listing.parking} vagas`} />}
          {listing.area != null && <Spec icon={Ruler} label={`${listing.area} m²`} />}
        </div>

        {listing.agentNotes && (
          <p className="line-clamp-2 text-xs text-text-muted italic" title={listing.agentNotes}>
            {listing.agentNotes}
          </p>
        )}

        <div className="mt-auto border-t border-hairline pt-3">
          <p className="font-display text-xl font-bold">
            <span className="text-brand-gradient">{brl(total)}</span>
            <span className="text-xs font-normal text-text-muted"> /mês</span>
          </p>
          <p className="truncate font-mono text-[11px] text-text-muted tabular-nums">
            {listing.condoFee ? `${brl(listing.rent)} + ${brl(listing.condoFee)} cond.` : "sem condomínio"}
          </p>
        </div>
      </div>
    </a>
  );
}

function Spec({ icon: Icon, label }: { icon: typeof House; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
