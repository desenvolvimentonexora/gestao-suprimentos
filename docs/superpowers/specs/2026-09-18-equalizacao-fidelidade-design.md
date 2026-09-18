# Fidelidade visual — Equalização de Orçamentos — design

Data: 2026-09-18
Fase: 4 (`feature/f4-equalizacao-fidelidade`, a criar a partir de `main`)

## Contexto

A tela de Equalização (`apps/web/src/modules/comparisons/ComparisonPage.tsx`)
hoje mistura, numa view só, o setup (tipo de equalização, cards de fornecedor
via `SourceCards`, seleção de requisição) e o resultado (tabela comparativa
via `ComparisonTable`). O pedido é alinhar a estrutura ao sistema de
referência do cliente (Ampla) — só estrutura/layout, nunca cor, logo ou nome
do cliente antigo, que continuam vindo de `config.theme`/`settings.brand`
(regra 4 do CLAUDE.md).

O arquivo `docs/Documentacao_Tecnica_Consolidada_v4.docx`, citado no CLAUDE.md
como leitura obrigatória, não existe neste repositório — não foi possível
consultá-lo. Os prints de referência mencionados também não chegaram nesta
conversa. Este design foi construído só a partir da descrição textual do
pedido e da leitura do código atual — qualquer ponto onde a descrição foi
ambígua está marcado explicitamente abaixo para revisão.

## Objetivo

Reestruturar a tela de Equalização em dois estados condicionais da mesma
rota (não duas rotas), reordenar/dividir colunas da tabela comparativa,
adicionar um cabeçalho de identificação, contadores nas filas, um bloco de
observações, e reforçar o destaque visual do "melhor preço combinado" — sem
tocar em extração por IA, aprovação em duas etapas, ou cor por negociador.

## 1. Dois estados da mesma tela

**Correção importante feita durante a leitura do código (antes deste ponto
a spec assumia uma condição errada):** `fetchComparableRequests` já filtra
fora qualquer requisição sem nenhuma cotação com `status === 'received'`
(`api.ts`, `.filter((row) => row.quotations.length > 0)`, mais o filtro de
status dentro do map). Ou seja, **toda** requisição que aparece na lista à
esquerda desta tela já chega com pelo menos 1 cotação — uma condição como
`quotations.length > 0` nunca seria falsa aqui, então não serve pra
distinguir "setup" de "calculada".

O sinal correto — e que já existe no código, só não está sendo usado assim
— é simplesmente **ter ou não uma requisição selecionada**:

```ts
const isCalculated = selectedRequest !== null
```

- **Setup** (`!isCalculated`, nada selecionado): mostra os 3 cards de tipo
  de equalização + o checkbox "Anexar foto..." (hoje sempre visíveis, viram
  condicionados a `!selectedRequest`) + a lista de requisições à esquerda +
  o prompt "Selecione uma requisição para comparar." no lugar do painel
  direito. Nada de `SourceCards`/`ComparisonTable` aqui.
- **Calculada** (`isCalculated`, uma requisição selecionada — e por
  construção do dado, ela já tem cotação): os cards de tipo + checkbox
  somem. Entram, nessa ordem, no painel direito: cabeçalho de identificação
  (seção 2 abaixo), toolbar de ações existente (Imprimir/Excel/Pedido/
  Editar/Enviar p/ Aprovação/Nova — já implementada, só reposicionada),
  `SourceCards` (continua útil pra adicionar mais cotações a uma comparação
  em andamento — os slots vazios "+ Fornecedor N" continuam ali) e
  `ComparisonTable`.

**Ambiguidade resolvida:** o pedido original cita, na descrição do estado
calculado, "cabeçalho de identificação (item 2) + toolbar de ações (item 3)
+ tabela (item 4)" — mas a seção 3 do pedido é sobre os contadores nos
botões de fila (Aprovações/Alterações/Pedidos/Histórico), que ficam na faixa
de topo em degradê e são navegação global, independente de qual requisição
está selecionada. Interpretação adotada: os contadores de fila (seção 3)
continuam sempre visíveis no topo, em ambos os estados; "toolbar de ações"
no estado calculado se refere à barra de botões que já existe hoje ao lado
do nome da unidade (Imprimir/Excel/.../Nova). Se a intenção era outra,
ajustar antes da implementação.

**Correção 2 (pedida depois da primeira implementação):** o layout de duas
colunas lado a lado (lista `280px` à esquerda + painel de resultado à
direita) não é o padrão certo. A interação correta é **acordeão**: cada
requisição da lista é ela mesma o gatilho — ao clicar, o próprio card se
expande verticalmente no lugar (empurrando os cards abaixo), revelando
cabeçalho de identificação + toolbar + `SourceCards` + `ComparisonTable` +
Observações dentro da área expandida, em vez de abrir um painel separado ao
lado. Só uma requisição fica expandida por vez — expandir uma recolhe
qualquer outra que estivesse aberta; clicar de novo na que já está expandida
recolhe ela.

- Estado local único `expandedRequestId: string | null` (substitui o antigo
  `selectedRequestId` — mesmo papel, nome mais fiel ao comportamento).
- Sem biblioteca de UI pronta (regra 2 do CLAUDE.md). Sem animação de altura
  — a área expandida só aparece/desaparece (`{isExpanded && (...)}`), sem
  transição CSS. Decisão do usuário: simplicidade em vez de esforço visual
  extra numa fase de protótipo.
- O bloco de setup (3 cards de tipo + checkbox) muda sua condição de
  `!selectedRequest` para `!expandedRequestId` — mesmo comportamento,
  variável renomeada.
- Efeito colateral bom: como cada linha da lista já é author da própria
  área expandida, o "prompt" antigo ("Selecione uma requisição para
  comparar.") deixa de fazer sentido — sem nada expandido, a lista de cards
  recolhidos já comunica isso sozinha. Removido.

**Correção 3 (pedida depois da segunda implementação):** o título do card,
fechado ou aberto, passa a ser o próprio `ComparisonIdentificationHeader`
(seção 2) — não um resumo à parte ("Nome da unidade / número · N cotações").
O `<button>` de abrir/fechar envolve o `ComparisonIdentificationHeader`
diretamente; a área expandida não repete o cabeçalho, só mostra a partir da
toolbar de ações pra baixo. Como o cabeçalho já mostra o nome da unidade na
coluna central, o `<h2>` redundante que existia na toolbar (repetindo o
mesmo nome) saiu também. O badge "Aguardando aprovação" continua, fora do
cabeçalho (informação que ele não cobre).

## 2. Cabeçalho de identificação (novo componente `ComparisonIdentificationHeader.tsx`)

Só aparece no estado calculado, dentro da área `--color-bg` (não na faixa de
degradê do topo — regra da seção 7 do CLAUDE.md para telas de trabalho).

- **Esquerda**: `settings.brand.logoUrl` (via `useSettings`, mesmo hook já
  usado em `DisparoSolicitacoesPage`) + `"SOLICITAÇÃO Nº " + formatSolNumber(externalRef, sequenceNumber)`
  — `formatSolNumber` já existe em `modules/comparisons/formatSolNumber.ts`;
  `ComparableRequestRow` já expõe `externalRef`, falta expor `sequenceNumber`
  (hoje só tem `externalRef` — ver "Mudanças de dados" abaixo).
- **Centro**: rótulo fixo de produto "EQUALIZAÇÃO DE ORÇAMENTOS" (não é
  vocabulário de cliente, é nome do módulo) + `selectedRequest.unitName`
  (já existe).
- **Direita**: `"EQUALIZADO POR " + nome` + data em `Intl.DateTimeFormat('pt-BR')`.
  A tabela `comparisons` já tem `created_by uuid` e `created_at timestamptz`
  (migration `0010_comparisons.sql`) — **não precisa de migration nova**
  para isso. Falta só: (a) expor `createdBy`/`createdAt` em
  `ComparableRequestRow` (hoje `fetchComparableRequests` não seleciona essas
  colunas) e (b) resolver o nome via a mesma função `fetchUserNames` já
  usada em `fetchPendingApprovals`/`fetchPendingReleases`.

## 3. Contadores nos botões de fila

Os 4 botões da faixa de topo (Fila de Aprovações, Fila de Alterações, Fila
de Pedidos, Histórico) ganham a contagem entre parênteses, ex.: "Fila de
Alterações (9)".

Fonte dos números — reaproveitar os hooks que já existem, sem endpoint novo
e sem importar de outro módulo (todos já vivem em `modules/comparisons`):

| Botão | Hook já existente | Contagem |
|---|---|---|
| Fila de Aprovações | `usePendingApprovals` | `.data.length` |
| Fila de Alterações | `usePendingReleases` | `.data.length` |
| Fila de Pedidos | `useReleasedAwaitingOrder` | `.data.length` |
| Histórico | `useHistory` | `.data.length` |

Hoje essas queries só rodam quando o respectivo modal abre
(`usePendingApprovals(queueView === 'approvals')` etc.) — para mostrar a
contagem no botão antes de abrir, elas passam a rodar sempre
(`enabled: true` fixo, sem depender de `queueView`). Approvals/Releases já
são só visíveis para quem tem `comparisons.approve` — o `enabled` dessas
duas continua condicionado a `canApprove`, só troca a dependência de
`queueView` por `canApprove`.

**Ambiguidade menor:** "Histórico" ter contador é estranho conceitualmente
(histórico não é uma fila "pendente" — é um log). Interpretação adotada:
mostra o total de itens no histórico mesmo assim, já que foi pedido
explicitamente; se não fizer sentido depois de ver funcionando, é fácil
remover só esse badge.

## 4. Reestruturar `ComparisonTable`

- **Cabeçalho em duas linhas**: a primeira coluna dividida em "Und." e
  "Qtde." (dado já existe em `ComparisonRequestItemRow.unitOfMeasure`/
  `.quantity` — troca de renderização, sem mudança de tipo). Cada coluna de
  fornecedor ganha duas subcolunas "V.Unit." e "Total" via uma segunda
  linha de `<tr>` no `<thead>` (a primeira linha usa `colSpan={2}` no nome
  do fornecedor).
- **Total por item por fornecedor**: `price.unitPrice * item.quantity`
  quando `unitPrice` não é nulo — cálculo simples, sem novo helper
  (mesmo padrão inline já usado em `combinedPrice.ts`).
- **Reordenar linhas de rodapé**: hoje é Frete → Pagamento → Entrega →
  Total; passa a ser Frete → **Total** → Pagamento → Entrega (a linha
  "Descrição"/itens continua no topo do corpo da tabela, antes dessas
  quatro linhas de rodapé — o pedido usa "Descrição" para se referir à
  seção de itens que já existe, não uma linha nova).
- Larguras/responsividade: a tabela já rola horizontalmente
  (`overflow-x-auto`) — com o dobro de colunas por fornecedor, isso importa
  mais ainda em telas de 360px; manter o scroll horizontal, não tentar
  encolher tudo pra caber.

## 5. Bloco "OBSERVAÇÕES"

Abaixo da faixa de melhor preço (seção 6), um bloco com label "OBSERVAÇÕES"
e uma `textarea` de texto livre, salva em `onBlur` (mesmo padrão do campo
"Observação" em `RequestCard`/`AnaliseSolicitacoesPage`).

**Decisão de schema** (você já confirmou): coluna nova e dedicada
`comparisons.notes text` (nullable), **não** reaproveita `requests.notes`
(que já é outro campo — mostrado como `note` em `PendingApprovalRow`/
`PendingReleaseRow`, vindo de `requests.notes`, ligado à Análise/Disparo) nem
`suppliers.notes`. Migration nova `00XX_comparisons_notes.sql` (número exato
= próximo disponível no momento da implementação, hoje seria `0035`, mas
confirmar no início da implementação já que outras branches podem ter
avançado a numeração).

Mutation nova: `useUpdateComparisonNotes` (`api.ts`/`queries.ts`), invalida
`['comparable-requests']` no sucesso (mesma query key de
`useComparableRequests`, a confirmar o nome exato lendo `queries.ts`).

## 6. Peso visual do "Melhor preço combinado"

Troca de `bg-badge-available/10 text-ink` (fundo claro, baixo contraste) para
uma faixa sólida usando o tema: `bg-gradient-to-r from-primary-dark to-primary text-on-primary`
(mesmo par de cores do degradê já usado nas faixas de topo — reaproveita o
padrão visual existente em vez de inventar um novo). Emoji 🏆 mantido, texto
em negrito, padding maior (`px-4 py-3` em vez de `px-4 py-2`) pra dar mais
peso.

## Mudanças de dados (resumo)

- **Migration nova**: `comparisons.notes text null` — única mudança de
  schema real deste design.
- **Sem migration**: `created_by`/`created_at` de `comparisons` já existem;
  só precisam ser selecionados e expostos no tipo `ComparableRequestRow`
  (novos campos `createdByName: string | null`, `createdAt: string`) e
  `sequenceNumber: number | null` (a requisição já tem essa coluna, só não
  está sendo selecionada em `fetchComparableRequests` hoje).
- `npm run db:migrate` (com aviso prévio, é banco compartilhado) e
  `npm run db:types` depois de aplicar.

## Testes

- `ComparisonTable.test.tsx`: atualizar para as duas subcolunas por
  fornecedor (`V.Unit.`/`Total`) e a nova ordem de linhas de rodapé
  (Frete → Total → Pagamento → Entrega); adicionar teste da coluna
  Und./Qtde. separada.
- Novo `ComparisonIdentificationHeader.test.tsx`: renderiza logo, número da
  solicitação, nome da unidade, nome de quem equalizou e data formatada.
- Nova função pura testável para a condição de estado, se fizer sentido
  extrair (`isComparisonCalculated(quotations): boolean` ou similar) —
  avaliar ao implementar; se ficar uma linha só inline em `ComparisonPage`,
  não precisa de arquivo próprio nem teste dedicado (`ComparisonPage` não
  tem teste hoje, mesmo padrão de `DisparoSolicitacoesPage`/
  `AnaliseSolicitacoesPage`).
- Testes de contagem nos botões de fila: cobertos indiretamente pelos testes
  já existentes de `usePendingApprovals`/etc. (se existirem) — o `.length`
  em si não precisa de teste novo, é `Array.prototype.length`.

## Fora de escopo (confirmado no pedido original)

Lógica de extração por IA, fluxo de aprovação em duas etapas, paleta de
cores por negociador em Requisições/Cotações.

## Auto-revisão da spec

- Sem "TBD" pendente, exceto o número exato da migration (depende do estado
  do repo no momento de implementar — não é ambiguidade de design, é
  sequenciamento mecânico).
- Duas ambiguidades do pedido original foram resolvidas explicitamente
  acima (toolbar do estado calculado; contador no Histórico) em vez de
  deixadas implícitas.
- Escopo focado: mexe só em `modules/comparisons` (mais uma migration) —
  não toca em `requests`, `suppliers`, nem outros módulos.
- Consistência: o cabeçalho de identificação, a tabela e o bloco de
  observações usam os mesmos nomes de campo (`ComparableRequestRow`) em
  todas as seções.
