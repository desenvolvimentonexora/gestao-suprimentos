# Fidelidade visual — Início (Home) e cards de módulo (design)

Data: 2026-09-22
Branch: `feature/fidelidade-home`

## Contexto

Segunda rodada de fidelidade visual, depois do Login (`feature/fidelidade-login`,
já mesclada em `main`). O cliente quer cópia fiel de layout/proporção em
relação à tela de Início do sistema real da Ampla (referência de terceiro,
captura de tela compartilhada pelo usuário nesta conversa, não commitada
no repositório) — **exceto cor**, que continua vindo de
`config.theme`/`settings.brand`, regra 4.1 do CLAUDE.md.

Reaproveita os tokens de raio de borda (`--radius-sm/md/lg`) já criados na
rodada do Login — nenhuma escala nova é criada aqui.

## Descrição da referência

Grade de cards de setor centralizada, ocupando uma faixa bem mais estreita
que a largura total da tela (bastante espaço vazio nas laterais em telas
largas). Cards pequenos e compactos: ícone discreto, pouco padding interno,
proporção larga (mais largo que alto). Os três estados de card
(Disponível, Beta, Em Breve) têm o **mesmo fundo sólido** — a única
diferença visual é o texto/cor do badge no canto superior direito. Botão
"Sair da conta" centralizado abaixo da grade.

## Investigação: menu de usuário no topo

A Home (`/`) e o hub de Suprimentos (`/suprimentos`) são renderizados sem
`AppShell` — não têm menu de usuário no topo. O menu "usuário ⌄ / Sair"
existe só nas telas de trabalho mais profundas (`/suprimentos/unidades`
etc.), que usam `ProtectedLayout`/`AppShell`. Logo, o botão "Sair da conta"
abaixo da grade, em ambas as telas, é a **única** forma de logout ali —
não há duplicação. Decisão: manter como está, sem mudança.

## 1. Container centralizado

`HomePage.tsx` e `SuprimentosPage.tsx` compartilham o mesmo padrão de
container (`mx-auto mt-10 max-w-6xl`, 1152px) e o mesmo botão "Sair da
conta" abaixo da grade — decisão do usuário nesta conversa: alinhar as
duas telas na mesma branch, não só a Home, para não deixá-las
inconsistentes entre si logo após esta rodada.

Trocar `max-w-6xl` por `max-w-[960px]` nos dois arquivos — valor
arbitrário do Tailwind (meio da faixa 900–1000px sugerida), seguindo o
padrão já usado no projeto para medidas de layout específicas de tela
(`max-w-[380px]` no formulário de Login), já que isso não é um token de
design reutilizável como raio/espaçamento, é proporção específica desta
tela.

## 2. Cards mais compactos (`ModuleCard.tsx`, componente compartilhado)

`ModuleCard`/`ModuleGrid` são usados por Home e Suprimentos — a mudança
aqui afeta as duas telas automaticamente, o que é desejado.

- `CARD_HEIGHT`: `h-44` (176px) → `h-32` (128px).
- Padding interno (nos três estados: link, botão, em-breve): `p-4` (16px)
  → `p-3` (12px).
- Ícone (`CardBody`): `size={28}` → `size={20}`.
- Título: ganha `text-sm` (14px) explícito — hoje herda o tamanho base
  (16px) sem classe própria.
- Descrição: `text-sm`/`line-clamp-3` → `text-xs`/`line-clamp-2` — card
  mais baixo tem menos espaço vertical; 2 linhas evita corte no meio de
  uma terceira linha que não cabe mais.
- Gap da grade (`ModuleGrid.tsx`): `gap-4` (16px) → `gap-3` (12px).

Contas de espaço vertical: `h-32` (128px) menos `p-3` dos dois lados
(24px) sobra 104px de área útil. Conteúdo estimado: linha ícone+badge
(~20px) + `mt-2` (8px) + título `text-sm` (~20px) + `mt-1` (4px) +
descrição `text-xs` em 2 linhas (~34px) = ~86px. Cabe com folga.

## 3. Cards "Em Breve" com fundo sólido

Remover a classe `opacity-50` do card em-breve em `ModuleCard.tsx` — hoje
ela deixa o card inteiro (fundo incluso) translúcido, deixando o degradê
da página vazar através dele. Mantém `cursor-not-allowed` e
`aria-disabled="true"` (nenhuma mudança de comportamento de clique) — só
a aparência passa a usar `bg-surface` sólido, igual aos outros dois
estados. A única diferença visual entre os três estados volta a ser o
`StatusBadge`.

## 4. Botão "Sair da conta"

Nenhuma mudança — ver "Investigação" acima.

## 5. Responsivo

`ModuleGrid` já cai para 2 colunas (`sm:grid-cols-2`) e 1 coluna (mobile,
`grid-cols-1`) antes de virar 4 (`lg:grid-cols-4`) — não muda com a
redução do container. Testar visualmente que a compactação do card não
introduz quebra de texto estranha em nenhum breakpoint.

## Fora de escopo

- Lista de módulos, nomes, descrições, quais estão disponíveis/beta/em
  breve — conteúdo de produto, não fidelidade visual. `modules/registry.ts`
  não é tocado.
- O card "Suprimentos" (existe hoje, não está na referência) permanece
  como está.
- Qualquer tela além de Início e Suprimentos (hubs de setor futuros ficam
  para rodadas seguintes, herdando `ModuleCard`/`ModuleGrid` daqui).

## Testes

- `ModuleCard.test.tsx`: os testes existentes de altura fixa
  (`/\bh-\d+\b/`) e truncamento (`toContain('line-clamp')`) continuam
  válidos sem alteração — checam o padrão da classe, não o valor exato.
  Nenhum teste novo necessário: não há teste que assuma o valor antigo de
  `opacity-50`, `p-4`, `size={28}` ou `gap-4` explicitamente.
- `HomePage.test.tsx` / `SuprimentosPage.test.tsx`: sem mudança —
  nenhum teste assume `max-w-6xl`.
- Manual: `npm run dev`, abrir `/` e `/suprimentos` em ~1440px, ~1024px,
  ~768px e ~360px; conferir os três estados de card (disponível, beta,
  em-breve) lado a lado com fundo sólido idêntico.

## Definição de pronto

- Responsivo (grade cai para 2/1 coluna, testado visualmente).
- Raio e espaçamento reaproveitando os tokens já existentes da rodada do
  Login (`rounded-lg` do `ModuleCard` já vem de lá, sem mudança nesta
  rodada; gap/padding usam a escala padrão do Tailwind, não valores
  soltos fora dela).
- Cor 100% de config — nenhuma cor nova introduzida nesta rodada.
- Lint, typecheck, testes e build passando.
- PR descreve: o `max-width` escolhido (960px) e por quê, os tamanhos
  escolhidos para o card compacto (altura, padding, ícone, tipografia), e
  a decisão tomada sobre o botão "Sair da conta" (mantido, sem
  duplicação).
