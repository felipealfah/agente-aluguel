---
# DESIGN.md — formato getdesign.md (referência estrutural: getdesign.md/sentry/design-md)
version: alpha
name: "Full Estratégias Digitais"
theme: "Dark Tech Gradient"
description: "Design system das ferramentas internas da Full ED: tela da meia-noite azulada, gradiente ciano→azul extraído da logo, ações em pílula e tipografia geométrica arredondada. Dark-only."

colors:
  canvas-dark: "#0B0C14"        # Fundo quase preto com leve tom azulado
  surface-card: "#141624"       # Superfície dos cards secundários
  surface-raised: "#1B1E31"     # PROPOSTO — hover de linha/card, dropdown, popover
  hairline: "#262A40"           # PROPOSTO — bordas de 1px entre superfícies
  brand-cyan: "#2BE4DE"         # Ciano brilhante do ícone (início do gradiente)
  brand-blue: "#4B7AEC"         # Azul elétrico médio (meio do gradiente)
  brand-purple: "#635BFF"       # Roxo vibrante (acento / fim do gradiente)
  text-primary: "#FFFFFF"       # Texto principal
  text-muted: "#8E9AA8"         # Texto secundário, descrições, rótulos
  ring-focus: "#2BE4DE"         # PROPOSTO — anel de foco (cyan), 2px
  # Semânticas (PROPOSTO — dashboards de decisão do Board precisam de status)
  state-go: "#34D399"           # GO / aprovado / sucesso
  state-nogo: "#F87171"         # NO-GO / rejeitado / erro
  state-warn: "#FBBF24"         # alerta / pendente de revisão
  state-info: "#4B7AEC"         # informativo (reusa brand-blue)

gradients:
  brand: "linear-gradient(to right, #2BE4DE, #4B7AEC)"
  brand-diagonal: "linear-gradient(to bottom right, #2BE4DE, #4B7AEC)"
  brand-ai: "linear-gradient(to right, #4B7AEC, #635BFF)"   # PROPOSTO — só para IA/agentes

typography:
  display:
    fontFamily: "Outfit, Montserrat, sans-serif"
    fontWeight: "700"
  body:
    fontFamily: "Inter, sans-serif"
    fontWeight: "400"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"   # PROPOSTO — IDs, logs, valores tabulares
    fontWeight: "400"
  scale:                         # PROPOSTO
    display-xl: { size: "48px", lineHeight: 1.1, family: display }
    display-lg: { size: "36px", lineHeight: 1.15, family: display }
    heading-md: { size: "24px", lineHeight: 1.25, family: display }
    heading-sm: { size: "18px", lineHeight: 1.3, family: display }
    body-md:    { size: "14px", lineHeight: 1.5, family: body }
    body-sm:    { size: "13px", lineHeight: 1.5, family: body }
    caption:    { size: "12px", lineHeight: 1.4, family: body }

spacing:                         # PROPOSTO — base 4px
  unit: "4px"
  scale: ["4px", "8px", "12px", "16px", "24px", "32px", "48px", "64px"]

shapes:
  rounded-pill: "9999px"         # Formato pílula idêntico ao elemento do ícone
  rounded-card: "16px"           # Cantos arredondados suaves para os blocos
  rounded-input: "12px"          # PROPOSTO
  rounded-chip: "9999px"         # PROPOSTO

assets:
  logo-horizontal: "logo.png"    # 748×386, fundo escuro, ícone + "Full" + "Estratégias Digitais"
  logo-cover: "full.webp"        # 1024×1024, logo centralizada + blocos de canto (ciano / roxo)
---

# Design System: Full Estratégias Digitais

Aceleração digital e infraestrutura de marcas na web. Um sistema construído inteiramente sobre uma lona da meia-noite escura azulada, acentuada por gradientes vivos de ciano e azul elétrico que sugerem conexões de dados e inovação contínua.

> **Escopo:** vale para toda ferramenta interna e fluxo da holding (dashboard da STACK, `/lowticket`, ferramenta de orquestração do YOUTUBE, painéis novos). Marcado **PROPOSTO** = sugestão do Rex ainda não validada pelo Board; o resto vem do rascunho original do Board.
> **Tema:** só dark. Não há variante clara.

## Marca e logo

Arquivos nesta pasta: `logo.png` (horizontal) e `full.webp` (capa quadrada).

*   O ícone é um nó conectado: 4 círculos ligados por hastes, com gradiente do ciano (topo direito) ao azul (demais nós). É a origem da **pílula** e do **gradiente** do sistema.
*   O logotipo "Full" é branco, geométrico, de cantos arredondados; "Estratégias Digitais" vai abaixo, em peso regular. Só aparecem sobre `canvas-dark`.
*   A capa `full.webp` usa dois blocos de canto arredondado (ciano no topo direito, roxo no canto inferior esquerdo) sobre o canvas: é o vocabulário visual para telas de login, vazias e de boas-vindas.
*   Respiro mínimo ao redor da logo: a altura de um círculo do ícone. Nunca esticar, nunca recolorir, nunca pôr sobre superfície clara.

## Cores

A marca se apoia no contraste absoluto de tons frios e vibrantes sobre superfícies profundas de baixa iluminação.

*   `canvas-dark`: A fundação do layout. Nunca use preto puro `#000000`. Use o tom escuro azulado para manter a profundidade técnica.
*   `surface-card` e `surface-raised`: dois degraus acima do canvas. Card sobre canvas; hover, dropdown e popover sobre card.
*   `brand-gradient`: O gradiente principal que conecta o nó superior `brand-cyan` ao nó inferior e lateral `brand-blue`.
*   `brand-purple`: Reservado estritamente para acentos de hover, sombras de brilho em IA, ou elementos de estado ativos em segundo nível.
*   `text-primary` para títulos e dados; `text-muted` para rótulos e descrições. Texto muted nunca em cima de gradiente.

### Cores de estado (PROPOSTO)

Os dashboards de decisão do Board (Gate 1/2, GO/NO-GO, status de execução) precisam de verde, vermelho e âmbar. A regra "sem cores quentes" do rascunho original vale para **decoração e marca**; estado é função, não decoração.

| Estado | Token | Uso |
|--------|-------|-----|
| GO / aprovado / concluído | `state-go` | badge, ícone, borda esquerda de linha |
| NO-GO / rejeitado / falhou | `state-nogo` | badge, mensagem de erro, ação destrutiva |
| Alerta / pendente de revisão | `state-warn` | badge, banner de aviso |
| Informativo / em andamento | `state-info` | badge, banner |

Regras: cor de estado sempre acompanhada de rótulo ou ícone (nunca só a cor); em fundo, usar a cor a 12–15% de opacidade com texto na cor cheia; nunca usar cor de estado como acento de marca.

## Tipografia

A escala tipográfica é dividida para expressar robustez geométrica nos títulos e legibilidade de tela limpa no corpo:

*   **Display:** Uso de fontes geométricas pesadas (`Outfit` ou `Montserrat`). Os títulos principais devem simular as curvas arredondadas e amigáveis do logo "Full".
*   **Body:** Tipografia altamente legível (`Inter`) focada em densidade de informações e clareza para mercados de conversão digital.
*   **Mono (PROPOSTO):** `JetBrains Mono` para IDs, slugs, logs, comandos e números em tabela (`font-variant-numeric: tabular-nums`). Substitui o `font-mono` onipresente do dashboard atual: mono é para dado, não para tudo.

Escala (PROPOSTO): 48 / 36 / 24 / 18 para títulos (Outfit 700) e 14 / 13 / 12 para corpo (Inter 400). Em ferramenta interna o corpo padrão é 14px, não 16px.

## Layout e espaçamento (PROPOSTO)

*   Base de 4px; escala `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`.
*   Espaçamento amplo e arejado em telas de marca e vazias. Em tela de dados (tabelas, filas de revisão) usar o degrau denso: padding de célula `8px 12px`.
*   Conteúdo em container de até `1280px`; tela de leitura/decisão em coluna de até `720px`.
*   Navegação lateral fixa de `240px` (colapsa em `64px` só com ícones).

## Elevação e profundidade (PROPOSTO)

Em tema escuro a profundidade vem de **degraus de superfície e de borda**, não de sombra preta:

*   Nível 0 `canvas-dark` · nível 1 `surface-card` · nível 2 `surface-raised`.
*   Borda de 1px `hairline` em cards e inputs.
*   Brilho (`box-shadow` colorido) só em hover de ação primária e em elementos de IA: `0 0 20px rgba(43,228,222,0.4)` (ciano) ou o equivalente roxo para `brand-ai`.
*   Blocos decorativos de canto (como em `full.webp`) só em login, tela vazia e onboarding. Nunca atrás de tabela ou formulário.

## Formas

*   Ações e chips: **pílula** (`9999px`).
*   Cards e painéis: `16px`.
*   Inputs, selects, textareas: `12px`.
*   Nunca `0px`.

## Componentes

### Botões e Actions (Pill Variants)
Seguindo o elemento conectado do símbolo da logo, todas as ações primárias devem usar bordas ou preenchimentos no formato **Pílula (`rounded-pill`)**.

```tsx
// Exemplo de botão primário sugerido para agentes de IA
<button className="bg-gradient-to-r from-brand-cyan to-brand-blue text-canvas-dark font-bold px-6 py-3 rounded-full hover:shadow-[0_0_20px_rgba(43,228,222,0.4)] transition-all">
  Iniciar Estratégia
</button>
```

Hierarquia (PROPOSTO): **primário** = gradiente (no máximo 1 por tela); **secundário** = pílula com borda `hairline` e texto `text-primary`; **terciário** = texto `text-muted` sem fundo; **destrutivo** = pílula com borda `state-nogo`, nunca preenchida em vermelho vivo. Desabilitado: 40% de opacidade, sem brilho.

### Cards e Blocos de Conteúdo
Os containers de informações utilizam o fundo `#141624` com cantos de `16px`. Podem receber uma sutil borda superior transparente ou gradiente de 1px simulando reflexo de luz física (*glassmorphism* controlado).

### Inputs e formulários (PROPOSTO)
Fundo `canvas-dark`, borda `hairline`, raio `12px`, altura `40px`. Foco: borda e anel `ring-focus` de 2px. Rótulo acima em `text-muted` 12px; erro abaixo em `state-nogo` 12px, em pt-BR e dizendo o que corrigir.

### Tabelas e filas de decisão (PROPOSTO)
Cabeçalho `text-muted` 12px em caixa alta; linhas separadas por `hairline`, hover em `surface-raised`; números alinhados à direita em mono tabular. Linha pendente de decisão leva borda esquerda de 3px em `state-warn`. Ações da linha em pílula pequena, sempre visíveis (não só no hover).

### Badges e chips (PROPOSTO)
Pílula de `24px` de altura, texto 12px, fundo da cor de estado a 12% e texto na cor cheia, com ícone ou ponto antes do rótulo.

### Navegação (PROPOSTO)
Item ativo: fundo `surface-raised` e barra de 2px em gradiente `brand` à esquerda. Item inativo em `text-muted`.

### Estados de carga, vazio e erro (PROPOSTO)
Carregando: *skeleton* em `surface-raised` com pulso suave, nunca spinner em tela inteira. Vazio: bloco de canto decorativo, uma frase e uma ação primária. Erro: banner `state-nogo`, mensagem em pt-BR e botão de tentar de novo.

## Diretrizes (Do's and Don'ts)

### O que Fazer (Do)
*   Use gradientes nas direções `to right` ou `to bottom right` partindo do Ciano para o Azul.
*   Mantenha um espaçamento amplo e arejado para destacar os elementos brilhantes em neon.
*   Destaque palavras-chave nos títulos aplicando a classe do gradiente de texto.
*   Use cor de estado (verde, vermelho, âmbar) para status e gates, sempre com rótulo ou ícone junto.
*   Escreva toda a interface em português (pt-BR), inclusive erros e estados vazios.

### O que Não Fazer (Don't)
*   **Não** utilize cantos completamente retos (0px) em botões, pois quebra a suavidade orgânica da fonte da logo.
*   **Não** use cores quentes (vermelho, laranja, amarelo) fora de sinalizações de estado (erro, alerta, NO-GO).
*   **Não** aplique o gradiente em textos longos de parágrafo; use-o apenas em títulos curtos ou ícones de destaque.
*   **Não** use preto puro `#000000` nem fundo claro.
*   **Não** ponha mais de um botão primário em gradiente por tela.
*   **Não** use o roxo como cor de fundo grande: é acento.

## Comportamento responsivo (PROPOSTO)

Breakpoints `640 · 1024 · 1280`. Ferramenta interna é desktop-first: abaixo de 1024px a navegação lateral vira gaveta e as tabelas rolam na horizontal dentro do próprio card. Alvos de toque de pelo menos 40px.

## Guia de iteração

1. Comece pelo canvas e pelos degraus de superfície; só depois acrescente gradiente.
2. Um único primário por tela. Todo o resto é secundário ou terciário.
3. Antes de inventar token novo, procure um existente neste arquivo.
4. Mapeamento para Tailwind: declarar `canvas-dark`, `surface-card`, `surface-raised`, `hairline`, `brand-cyan`, `brand-blue`, `brand-purple` e `state-*` em `theme.extend.colors`; `Outfit` e `Inter` em `fontFamily`. Os exemplos `bg-gradient-to-r from-brand-cyan to-brand-blue` acima já assumem isso.
