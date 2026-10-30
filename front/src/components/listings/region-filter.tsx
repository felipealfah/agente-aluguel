import Link from "next/link";
import { listUrl } from "@/lib/url";
import type { RegionOption } from "@/lib/regions";
import type { ListingSort, ResultTab } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  options: RegionOption[];
  selected: string[];
  tab: ResultTab;
  sort: ListingSort;
  shown: number;
  total: number;
};

/** Filtro por região, com seleção múltipla ("Guará" ou "Vicente Pires"). Sem nenhuma marcada, mostra todas. */
export function RegionFilter({ options, selected, tab, sort, shown, total }: Props) {
  const chip = "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors";
  const on = "border-brand-cyan bg-brand-cyan/12 text-brand-cyan";
  const off = "border-hairline text-text-muted hover:bg-surface-raised hover:text-foreground";

  const toggle = (key: string) =>
    listUrl({ tab, sort, regions: selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key] });

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-text-muted">Região</span>
      <Link href={listUrl({ tab, sort })} replace scroll={false} aria-current={selected.length === 0 ? "true" : undefined} className={cn(chip, selected.length === 0 ? on : off)}>
        Todas
        <span className="font-mono text-[11px] tabular-nums">{total}</span>
      </Link>
      {options.map((option) => {
        const active = selected.includes(option.key);
        return (
          <Link key={option.key} href={toggle(option.key)} replace scroll={false} aria-current={active ? "true" : undefined} className={cn(chip, active ? on : off)}>
            {option.label}
            <span className="font-mono text-[11px] tabular-nums">{option.count}</span>
          </Link>
        );
      })}
      {selected.length > 0 && (
        <span className="ml-auto font-mono text-xs text-text-muted tabular-nums">
          Mostrando {shown} de {total}
        </span>
      )}
    </div>
  );
}
