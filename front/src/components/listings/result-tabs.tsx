import Link from "next/link";
import { listUrl } from "@/lib/url";
import { cn } from "@/lib/utils";
import type { ListingSort, ResultTab } from "@/lib/types";

const TABS: { value: ResultTab; label: string }[] = [
  { value: "ultima", label: "Última busca" },
  { value: "todos", label: "Todos os resultados" },
];

type Props = {
  active: ResultTab;
  sort: ListingSort;
  counts: Record<ResultTab, number>;
};

/** Abas via URL (?tab=): a escolha sobrevive ao recarregar e preserva a ordenação. */
export function ResultTabs({ active, sort, counts }: Props) {
  return (
    <nav role="tablist" aria-label="Escopo dos resultados" className="flex gap-1">
      {TABS.map(({ value, label }) => {
        const selected = value === active;
        return (
          <Link
            key={value}
            role="tab"
            aria-selected={selected}
            href={listUrl({ tab: value, sort })}
            replace
            scroll={false}
            className={cn(
              "relative flex items-center gap-2 px-3 pb-2.5 text-sm transition-colors",
              selected ? "font-medium text-foreground" : "text-text-muted hover:text-foreground",
            )}
          >
            {label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums",
                selected ? "bg-brand-cyan/12 text-brand-cyan" : "bg-surface-raised text-text-muted",
              )}
            >
              {counts[value]}
            </span>
            {selected && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-gradient" />}
          </Link>
        );
      })}
    </nav>
  );
}
