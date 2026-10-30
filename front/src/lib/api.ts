import type { AgentRun, Listing, ListingSort, SearchProfile } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  }).catch(() => {
    // "Failed to fetch" do navegador não diz nada; as causas reais são API fora do ar ou CORS
    throw new Error(`Não foi possível conectar à API (${API_URL}). Ela está rodando? Rode \`npm run dev:api\`.`);
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `API ${res.status}: ${path}`);
  return body as T;
}

export const api = {
  profiles: () => request<SearchProfile[]>("/profiles"),
  updateProfile: (id: number, data: Partial<SearchProfile>) =>
    request<SearchProfile>(`/profiles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  listings: (profileId?: number, sort: ListingSort = "match") =>
    request<Listing[]>(`/listings?${new URLSearchParams({ ...(profileId ? { profileId: String(profileId) } : {}), sort })}`),
  startAgentRun: (profileId: number) =>
    request<AgentRun>("/agent/runs", { method: "POST", body: JSON.stringify({ profileId }) }),
  agentRun: (id: number) => request<AgentRun>(`/agent/runs/${id}`),
  agentRuns: (profileId: number) => request<AgentRun[]>(`/agent/runs?profileId=${profileId}`),
};

export const brl = (value: number | null | undefined) =>
  value == null
    ? "—"
    : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** "há 3 dias", "há 2 horas"… em pt-BR; null quando a fonte não informa a data. */
export function timeAgo(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return null;
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "agora";
}
