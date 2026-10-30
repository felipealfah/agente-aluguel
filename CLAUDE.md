# Agente Aluguel

Instalação, execução, pré-requisitos e limitações: veja o README.md (mantê-lo atualizado ao mudar scripts, variáveis de ambiente ou comportamento do agente).

Monorepo npm workspaces: `api/` (Hono + Drizzle + SQLite) e `front/` (Next.js 15 + Tailwind v4 + shadcn, estilo radix-nova).

- Idioma: código em inglês, textos de UI e comentários em português.
- Schema do banco: `api/src/db/schema.ts`. Os tipos do front em `front/src/lib/types.ts` espelham o schema — atualizar os dois juntos.
- Migrações: `npm run db:generate` (gera SQL em `api/drizzle/`) e `npm run db:migrate`.
- Validação de entrada na API com zod via `@hono/zod-validator`.
- Componentes shadcn: `npx shadcn@latest add <comp>` dentro de `front/`.
- Layout (docs/wireframe/front.png): sidebar à esquerda com filtros no padrão OLX (docs/Captura de Tela...png) e botão "Buscar com o agente"; grid de cards à direita.
- Agente (`api/src/agent/`): `sources.ts` monta as buscas (OLX e DFimóveis) e roda os extratores no Ego Lite via `ego-browser nodejs` (`browser.ts`); `analyze.ts` aplica filtros por regra e valida com Claude (saída estruturada, fallback por regras sem `ANTHROPIC_API_KEY`); `run-agent.ts` orquestra e grava (upsert por URL). Disparado por `POST /agent/runs`; o front acompanha `agent_runs.stage`/`log` por polling.
- Fontes: nunca contornar desafios anti-bot/CAPTCHA. Se uma página mostrar desafio, a fonte é marcada como bloqueada e pulada. Requisições diretas por HTTP recebem 403 nesses sites; por isso o navegador real (Ego Lite precisa estar aberto).
- Quartos/banheiros são arrays de 0..5, onde 5 = "5+".
- Checagens: `npx tsc --noEmit` em cada workspace; `npx eslint src` no front.
- Visual: seguir docs/DESIGN.md (Full ED, só dark). Tokens em front/src/app/globals.css (`bg-surface-card`, `border-hairline`, `text-text-muted`, `bg-brand-gradient`, `text-brand-gradient`, `state-*`). Um único botão primário em gradiente por tela; chips/ações em pílula.
- IPTU não é filtro de busca (removido do perfil).
- Data de publicação (`listings.published_at`, ISO UTC): OLX mostra "Hoje/Ontem/8 de out"; DFimóveis, "dd/mm/aa" no fim da descrição; QuintoAndar não informa (fica null — nunca inventar). Parsers em `sources.ts` (`parsePostedAt`, `parseTrailingDate`).
- Categoria do anúncio vem do título (`inferCategory`) antes da aba da busca: os portais misturam apartamentos na aba de casas.
- Modelo da análise: `ANTHROPIC_MODEL` (padrão claude-opus-5-5). `fallbacks: "default"` só é enviado para os modelos de `FALLBACK_MODELS` em analyze.ts. Falha da API do Claude não derruba a busca: o restante cai para regras e o aviso vai para `agent_runs.log`.
- Buscas "running" órfãs (API reiniciada) são marcadas como erro na inicialização (`agent/recover.ts`).
- Hoje só o DF é suportado (cidade/UF/URLs fixos em sources.ts e run-agent.ts, regiões em front/src/lib/options.ts).
- Requisitos: Node >= 22 (better-sqlite3 13).
- `allowScripts` (package.json): NÃO autorizar `better-sqlite3` — ele traz binários prontos (`prebuilds/`); autorizar faz o npm rodar `node-gyp rebuild` e falhar sem Python. Validar mudanças de instalação com uma cópia limpa (só os arquivos não ignorados pelo git).
- `front/.gitignore` ignora `.env*`, com exceção de `.env.example` (necessário para o passo de instalação).
