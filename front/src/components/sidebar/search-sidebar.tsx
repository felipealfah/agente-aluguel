"use client";

import { Bot, CircleAlert, CircleCheck, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api, brl } from "@/lib/api";
import { categoryLabels, dfRegions, subtypeLabels } from "@/lib/options";
import {
  propertyCategories,
  propertySubtypes,
  roomCounts,
  type AgentRun,
  type RoomCount,
  type SearchProfile,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const RENT_SHARE_RECOMMENDED = 0.3; // regra comum: até 30% da renda com moradia
const POLL_INTERVAL_MS = 2000;

/** Chip em pílula (DESIGN.md): ativo com borda e texto ciano sobre fundo ciano a 12%. */
const chipClass =
  "h-7 rounded-full border-hairline bg-transparent px-2.5 text-xs font-normal text-text-muted hover:bg-surface-raised hover:text-foreground data-[state=on]:border-brand-cyan data-[state=on]:bg-brand-cyan/12 data-[state=on]:text-brand-cyan";

type Props = { profile: SearchProfile; lastRun: AgentRun | null };

export function SearchSidebar({ profile, lastRun }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(profile);
  const [regionDraft, setRegionDraft] = useState("");
  const [run, setRun] = useState(lastRun);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof SearchProfile>(key: K, value: SearchProfile[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const numberOrNull = (v: string) => (v === "" ? null : Number(v));

  const addRegion = (name: string) => {
    const region = name.trim();
    if (region && !form.regions.includes(region)) set("regions", [...form.regions, region]);
    setRegionDraft("");
  };

  const averagePrice =
    form.priceMin != null && form.priceMax != null ? (form.priceMin + form.priceMax) / 2 : form.priceMax;
  const incomeShare = form.monthlyIncome && form.priceMax ? form.priceMax / form.monthlyIncome : null;

  const waitForRun = async (id: number) => {
    let current = await api.agentRun(id);
    while (current.status === "running") {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      current = await api.agentRun(id);
      setRun(current);
    }
    return current;
  };

  const searchWithAgent = async () => {
    setBusy(true);
    setError(null);
    try {
      const { id, ...data } = form;
      await api.updateProfile(id, data);
      const started = await api.startAgentRun(id);
      setRun(started);
      setRun(await waitForRun(started.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-card">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        <Section title="Região">
          <p className="text-xs text-text-muted">
            {form.city} · {form.state}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {form.regions.map((region) => (
              <span
                key={region}
                className="inline-flex h-6 items-center gap-1 rounded-full bg-brand-cyan/12 pr-1 pl-2.5 text-xs text-brand-cyan"
              >
                {region}
                <button
                  type="button"
                  aria-label={`Remover ${region}`}
                  onClick={() => set("regions", form.regions.filter((r) => r !== region))}
                  className="rounded-full p-0.5 hover:bg-brand-cyan/20"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <Input
            list="df-regions"
            placeholder="Adicionar região"
            className="h-10 bg-canvas-dark"
            value={regionDraft}
            onChange={(e) => {
              const value = e.target.value;
              // escolher uma opção do datalist adiciona direto
              if (dfRegions.includes(value)) addRegion(value);
              else setRegionDraft(value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRegion(regionDraft);
              }
            }}
          />
          <datalist id="df-regions">
            {dfRegions
              .filter((r) => !form.regions.includes(r))
              .map((r) => (
                <option key={r} value={r} />
              ))}
          </datalist>
        </Section>

        <Section title="Tipo do imóvel">
          {propertyCategories.map((category) => (
            <label key={category} className="flex items-center gap-2.5 text-sm">
              <Checkbox
                checked={form.categories.includes(category)}
                onCheckedChange={(checked) =>
                  set(
                    "categories",
                    checked ? [...form.categories, category] : form.categories.filter((c) => c !== category),
                  )
                }
              />
              {categoryLabels[category]}
            </label>
          ))}
        </Section>

        <Section title="Subtipo do imóvel">
          <ToggleGroup
            type="multiple"
            variant="outline"
            spacing={1.5}
            className="w-full flex-wrap"
            value={form.subtypes}
            onValueChange={(v) => set("subtypes", v as SearchProfile["subtypes"])}
          >
            {propertySubtypes.map((subtype) => (
              <ToggleGroupItem key={subtype} value={subtype} className={chipClass}>
                {subtypeLabels[subtype]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>

        <Section title="Preço">
          <div className="grid grid-cols-2 gap-2">
            <MoneyInput placeholder="Mín." value={form.priceMin} onChange={(v) => set("priceMin", numberOrNull(v))} />
            <MoneyInput placeholder="Máx." value={form.priceMax} onChange={(v) => set("priceMax", numberOrNull(v))} />
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox
              checked={form.includeCondoFee}
              onCheckedChange={(v) => set("includeCondoFee", v === true)}
            />
            Incluir valor do condomínio
          </label>
          <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-canvas-dark p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-text-muted">Média desejada</span>
              <span className="font-mono text-sm font-medium tabular-nums">{brl(averagePrice)}</span>
            </div>
            <MoneyInput
              placeholder="Renda mensal"
              value={form.monthlyIncome}
              onChange={(v) => set("monthlyIncome", numberOrNull(v))}
            />
            {incomeShare != null && <IncomeShare share={incomeShare} />}
          </div>
        </Section>

        <Section title="Número de quartos">
          <RoomPicker value={form.bedrooms} onChange={(v) => set("bedrooms", v)} />
        </Section>

        <Section title="Número de banheiros">
          <RoomPicker value={form.bathrooms} onChange={(v) => set("bathrooms", v)} />
        </Section>
      </div>

      <div className="flex flex-col gap-2 border-t border-hairline p-4">
        <button
          type="button"
          onClick={searchWithAgent}
          disabled={busy || form.regions.length === 0}
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 font-bold text-canvas-dark transition-all hover:shadow-[0_0_20px_rgba(43,228,222,0.4)] disabled:opacity-40 disabled:hover:shadow-none"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
          {busy ? "Agente buscando..." : "Buscar com o agente"}
        </button>
        <RunStatus run={run} error={error} />
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-medium tracking-wide text-text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

function MoneyInput(props: { placeholder: string; value: number | null; onChange: (v: string) => void }) {
  return (
    <Input
      type="number"
      min={0}
      placeholder={props.placeholder}
      className="h-10 bg-canvas-dark font-mono tabular-nums"
      value={props.value ?? ""}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}

function IncomeShare({ share }: { share: number }) {
  const ok = share <= RENT_SHARE_RECOMMENDED;
  const Icon = ok ? CircleCheck : CircleAlert;
  return (
    <p className={cn("flex items-center gap-1.5 text-xs", ok ? "text-state-go" : "text-state-warn")}>
      <Icon className="size-3.5" />
      {(share * 100).toFixed(0)}% da renda {ok ? "· dentro dos 30%" : "· acima dos 30% recomendados"}
    </p>
  );
}

function RoomPicker({ value, onChange }: { value: RoomCount[]; onChange: (v: RoomCount[]) => void }) {
  return (
    <ToggleGroup
      type="multiple"
      variant="outline"
      spacing={1.5}
      value={value.map(String)}
      onValueChange={(v) => onChange(v.map(Number).sort() as RoomCount[])}
    >
      {roomCounts.map((n) => (
        <ToggleGroupItem key={n} value={String(n)} className={cn(chipClass, "size-8 h-8 px-0")}>
          {n === 5 ? "5+" : n}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function RunStatus({ run, error }: { run: AgentRun | null; error: string | null }) {
  if (error) return <p className="text-xs text-state-nogo">{error}</p>;
  if (!run) return null;

  if (run.status === "running") {
    return (
      <p className="flex items-start gap-1.5 text-xs text-state-info">
        <span className="mt-1 size-1.5 shrink-0 animate-pulse rounded-full bg-state-info" />
        {run.stage ?? "Busca em andamento..."}
      </p>
    );
  }

  const when = new Date(run.finishedAt ?? run.startedAt).toLocaleString("pt-BR");
  const summary =
    run.status === "success"
      ? `Última busca: ${run.listingsFound} aprovados, ${run.listingsNew} novos · ${when}`
      : `Última busca falhou: ${run.error ?? "erro desconhecido"}`;

  return (
    <details className="group text-xs">
      <summary className={cn("cursor-pointer list-none", run.status === "error" ? "text-state-nogo" : "text-text-muted")}>
        {summary} <span className="text-brand-cyan group-open:hidden">· detalhes</span>
      </summary>
      <ul className="mt-2 flex flex-col gap-1 font-mono text-[11px] text-text-muted">
        {run.log.map((line) => (
          <li key={line} className={cn(/bloqueado|erro/.test(line) && "text-state-warn")}>
            {line}
          </li>
        ))}
      </ul>
    </details>
  );
}
