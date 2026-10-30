"use client";

import { useRouter } from "next/navigation";
import { listUrl } from "@/lib/url";
import { cn } from "@/lib/utils";
import type { ListingSort, ResultTab } from "@/lib/types";

const OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "match", label: "Maior % match" },
  { value: "preco_desc", label: "Maior preço" },
  { value: "preco_asc", label: "Menor preço" },
];

type Props = { active: ListingSort; tab: ResultTab; regions: string[] };

/** Ordenação feita no servidor; a escolha fica na URL (?sort=) e preserva a aba e as regiões marcadas. */
export function SortBar({ active, tab, regions }: Props) {
  const router = useRouter();

  return (
    <div role="radiogroup" aria-label="Ordenar imóveis" className="flex flex-wrap gap-1.5">
      {OPTIONS.map(({ value, label }) => {
        const selected = value === active;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => router.replace(listUrl({ tab, sort: value, regions }), { scroll: false })}
            className={cn(
              "h-8 rounded-full border px-3 text-xs transition-colors",
              selected
                ? "border-brand-cyan bg-brand-cyan/12 text-brand-cyan"
                : "border-hairline text-text-muted hover:bg-surface-raised hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
