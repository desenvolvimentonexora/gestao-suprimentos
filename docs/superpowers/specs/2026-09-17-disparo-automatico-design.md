# Disparo automático de solicitações — design

Data: 2026-09-17
Fase: 3 (`feature/f3-disparo-automatico`, a criar a partir de `main`)

## Contexto

Hoje o fluxo Análise → Disparo → Em Negociação tem um degrau manual no meio:
depois que uma SOL é liberada da Análise (`fn_release_request_to_dispatch`,
status `released_to_dispatch`), ela cai na tela de Disparo e alguém precisa
abrir um modal, escolher a obra/categoria/insumos e clicar num link
`mailto:` que abre o Gmail com o texto pronto — o envio de verdade é manual,
e não há seleção automática de fornecedor.

A Agenda de Fornecedores já modela fornecedor ↔ insumo (`supplier_materials`)
e já existe uma consulta pronta no módulo suppliers
(`fetchSupplierEmailsByMaterial`) que retorna, pra um material, os
fornecedores vinculados que têm e-mail cadastrado. Esse design usa essa
mesma lógica, do lado do servidor, para eliminar o passo manual no caminho
feliz.

## Objetivo

Quando uma SOL é liberada da Análise, o sistema tenta despachá-la
automaticamente: acha os fornecedores certos por insumo, manda o e-mail de
cotação pra cada um, e já move a SOL direto pra Em Negociação — sem alguém
abrir modal nenhum. Se não for possível (falta fornecedor pra algum insumo,
ou o envio falha), a SOL cai no Disparo como hoje, com o motivo visível,
pra alguém completar manualmente.

Fora de escopo deste design (decisões já tomadas em conversa, adiadas de
propósito):

- Decidir se uma SOL deveria pular a Análise/Disparo por algum critério de
  "julgamento" (urgência, histórico) — não existe julgamento aqui, é busca
  determinística de cadastro.
- Ler e interpretar as respostas de cotação dos fornecedores, ou detectar
  quando 3 orçamentos chegaram — isso continua exatamente como está hoje
  (entrada manual/futura leitura de PDF na Fase 4).
- Qualquer envio parcial: se um insumo da SOL não tem fornecedor válido, a
  SOL inteira fica bloqueada, nenhum e-mail sai.

## Fluxo

```
Análise: "Liberar pro Disparo"
        │
        ▼
Edge Function review-request, action release_to_dispatch
        │
        ├─ fn_release_request_to_dispatch (já existe)
        │     → status = released_to_dispatch, audit em request_reviews
        │
        ├─ tentativa de despacho automático (novo):
        │     1. carrega itens da SOL e, pra cada material, busca
        │        fornecedores vinculados com e-mail cadastrado
        │     2. se ALGUM material não tiver nenhum → aborta, marca
        │        dispatch_blocked_reason, não manda nada
        │     3. se todos tiverem → agrupa por fornecedor (um fornecedor
        │        pode cobrir mais de um insumo → 1 e-mail só), envia via
        │        Gmail SMTP
        │     4. se todos os e-mails saírem bem → fn_mark_request_negotiating
        │        (status = negotiating, audit em request_reviews,
        │        registra destinatários em request_dispatch_recipients)
        │     5. se algum e-mail falhar no envio → aborta como no passo 2,
        │        sem meio-termo (nenhum outro e-mail dessa SOL é confirmado
        │        como enviado, mesmo que a chamada SMTP já tenha saído —
        │        ver "Falha parcial de envio" em Erros)
        │
        ▼
SOL aparece em Em Negociação (caminho feliz)
   ou em Disparo com dispatch_blocked_reason preenchido (bloqueio)
```

No caminho feliz a SOL nunca fica "visível" parada no Disparo — ela pula
direto pra Em Negociação. A tela de Disparo, na prática, passa a ser a
fila de exceções: só aparecem lá as SOLs que a automação não conseguiu
resolver sozinha, mais qualquer SOL que alguém prefira disparar manualmente
pelo modal (que continua existindo).

## Seleção de fornecedores

- Por item da SOL, busca fornecedores vinculados àquele `material_id` em
  `supplier_materials`, com pelo menos um `supplier_contacts.email` não
  nulo — mesma regra de `fetchSupplierEmailsByMaterial`, portada pro lado
  do Edge Function (que não pode importar código do front).
- Fornecedor vinculado mas sem e-mail cadastrado não conta.
- Sem cap: todos os fornecedores válidos daquele insumo recebem e-mail —
  mais concorrência é melhor que menos.
- Agrupamento por fornecedor: um fornecedor que atende 2+ insumos da mesma
  SOL recebe um único e-mail listando só os insumos dele, não um e-mail por
  insumo.
- Essa seleção depende inteiramente da Agenda de Fornecedores estar
  completa. Um fornecedor real que não está vinculado ao insumo (ou está,
  mas sem e-mail) faz o sistema bloquear a SOL do mesmo jeito — é o
  comportamento esperado: a automação torna visível um problema de cadastro
  que hoje fica escondido dentro da memória de quem despacha manualmente. A
  correção é sempre completar o cadastro em Suppliers, nunca contornar no
  código do Disparo.

## Envio de e-mail

- Provedor: Gmail comum (`@gmail.com`) da Nexora, via SMTP
  (`smtp.gmail.com:465`), autenticado com uma senha de app (a conta precisa
  ter verificação em duas etapas ativada pra gerar uma).
- Credenciais como secrets do Supabase (`GMAIL_USER`, `GMAIL_APP_PASSWORD`),
  nunca no front — regra 7 do CLAUDE.md.
- Biblioteca: `denomailer` (cliente SMTP para Deno/Edge Functions).
- Remetente e reply-to: a própria conta Gmail. Resposta do fornecedor cai
  na caixa de entrada normal; ninguém desta etapa lê essa resposta
  automaticamente (fora de escopo, ver Objetivo).
- Conteúdo por fornecedor:
  - Assunto: `Cotação — SOL {número formatado}` (reaproveita a mesma lógica
    de `formatRequestNumber`, duplicada como função pura em
    `supabase/functions/_shared/` já que Edge Functions não importam código
    de `apps/web`).
  - Corpo: obra, prazo (`neededBy`), lista dos insumos daquele fornecedor
    (nome + quantidade + unidade), texto pedindo pra responder o e-mail com
    a cotação.

## Mudanças no banco

Migration `0033_dispatch_automatico.sql`:

- `alter table requests add column dispatch_blocked_reason text;` — null
  quando não há bloqueio; texto curto explicando o motivo quando há
  (ex.: `"Sem fornecedor cadastrado para: Cimento CP-32"`, ou uma mensagem
  de falha de envio). Limpo (`= null`) sempre que uma tentativa de
  despacho automático é concluída, com sucesso ou não — o valor reflete só
  a tentativa mais recente.
- Tabela nova `request_dispatch_recipients`: auditoria de quem foi
  contatado por essa SOL.
  ```sql
  create table request_dispatch_recipients (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id),
    request_id uuid not null references requests(id),
    supplier_id uuid not null references suppliers(id),
    material_id uuid not null references materials(id),
    email text not null,
    sent_at timestamptz not null default now()
  );
  ```
  RLS por `tenant_id`, mesmo padrão das demais tabelas. Tabela de log,
  sem soft delete (mesmo raciocínio de `supplier_materials`).
- Função `fn_mark_request_negotiating(p_request_id uuid, p_reviewer_id uuid)`,
  mesmo padrão de `fn_release_request_to_dispatch`: só ela leva
  `released_to_dispatch` → `negotiating` por essa via (regra de negócio no
  banco, regra 5 do CLAUDE.md). Insere em `request_reviews` com um novo
  valor de `type`, `'dispatched_to_suppliers'`.
- `npm run db:types` depois de aplicar.

## Mudanças na Edge Function `review-request`

A ação `release_to_dispatch` passa a, depois de chamar
`fn_release_request_to_dispatch` com sucesso:

1. Buscar os itens da SOL e, para cada `material_id`, os fornecedores
   elegíveis (query direta com `service_role`, mesma forma de
   `fetchSupplierEmailsByMaterial`).
2. Se qualquer item não tiver fornecedor elegível: `update requests set
   dispatch_blocked_reason = '...' where id = requestId` e retornar
   `{ ok: true, dispatched: false }` — a ação de liberar pro Disparo em si
   não falhou, só o despacho automático não rodou.
3. Se todos tiverem: montar os e-mails agrupados por fornecedor, enviar via
   SMTP. Se **todos** os envios funcionarem: inserir as linhas em
   `request_dispatch_recipients`, chamar `fn_mark_request_negotiating`, e
   limpar `dispatch_blocked_reason`. Retornar
   `{ ok: true, dispatched: true }`.
4. Se **algum** envio falhar (erro de SMTP): não chama
   `fn_mark_request_negotiating` (a SOL fica em `released_to_dispatch`),
   grava `dispatch_blocked_reason` com o erro, retorna
   `{ ok: true, dispatched: false }`.

Ação nova, `retry_dispatch`, reaproveitando os passos 1–4 acima pra uma SOL
que já está em `released_to_dispatch` — é o que o botão "Tentar disparo
automático novamente" do Disparo chama. Mesma checagem de permissão
(`requests.analyze`) das outras ações.

Limpeza pequena, feita já que o arquivo está sendo editado: a checagem de
permissão hoje duplicada inline em `review-request/index.ts` passa a usar
`userHasPermission` de `_shared/checkPermission.ts` (helper que a Fase 5
Administração já introduziu e que faz exatamente a mesma consulta).

### Falha parcial de envio

Não existe transação distribuída cobrindo "mandar e-mail" + "gravar no
banco" — se o SMTP confirma o envio pro fornecedor A e falha pro
fornecedor B, o e-mail do fornecedor A **já saiu de verdade** e não tem
como desfazer isso. Nesse caso o sistema:

- Não chama `fn_mark_request_negotiating` (a SOL não avança).
- Grava em `dispatch_blocked_reason` algo como "Falha ao enviar pra
  {fornecedor B}; {fornecedor A} já recebeu e-mail — não reenviar."
- Registra em `request_dispatch_recipients` só os envios que de fato
  saíram (fornecedor A), pra manter o rastro.
- Um retry subsequente (`retry_dispatch`) recalcula os fornecedores do
  zero — se fornecedor A ainda aparecer na lista (ele deveria, o material
  dele não muda), ele recebe o e-mail de novo. Isso é uma limitação
  aceita: evitar reenvio duplicado exigiria guardar "e-mails já confirmados
  como enviados" e excluir esses fornecedores de um retry, o que não faz
  parte deste design — se aparecer na prática (SMTP falhando no meio do
  lote), tratamos como melhoria futura.

## Mudanças de tela

- **Análise** (`AnaliseSolicitacoesPage`): sem mudança de layout. O toast
  de sucesso ao liberar passa a refletir o resultado real:
  `dispatched: true` → "SOL enviada pra Em Negociação."; `dispatched:
  false` → mantém "SOL liberada pro Disparo." (é onde ela de fato ficou).
- **Disparo** (`DisparoSolicitacoesPage` / `RequestsTable`): SOLs com
  `dispatch_blocked_reason` preenchido mostram esse texto em destaque na
  linha/card. Ganha um botão "Tentar disparo automático novamente" que
  chama a ação `retry_dispatch`. O modal manual atual ("Abrir Gmail e
  marcar como enviada") continua existindo sem mudança, como opção pra
  quem preferir não esperar a Agenda ser corrigida.

## Testes

- Unitários (Vitest), do lado do front: `buildRequestSummaryForSupplier`
  ou equivalente (se alguma lógica de agrupamento/formatting acabar
  duplicada no front pra exibição do motivo de bloqueio) — a lógica de
  seleção de fornecedor e envio em si mora na Edge Function e é testada
  separadamente.
- Edge Function `review-request`: testes com mocks do client Supabase e do
  client SMTP cobrindo:
  - todos os insumos com fornecedor válido → e-mails agrupados
    corretamente, `fn_mark_request_negotiating` chamada, recipients
    gravados.
  - um insumo sem fornecedor válido → nenhum e-mail enviado,
    `dispatch_blocked_reason` gravado, status permanece
    `released_to_dispatch`.
  - fornecedor cobrindo dois insumos → um e-mail só, com os dois insumos
    listados.
  - falha de SMTP no meio do lote → comportamento de "Falha parcial de
    envio" acima.
  - `retry_dispatch` numa SOL bloqueada → mesmo comportamento de
    `release_to_dispatch`, sem chamar `fn_release_request_to_dispatch` de
    novo (SOL já está em `released_to_dispatch`).
- Migration: `fn_mark_request_negotiating` só aceita transição a partir de
  `released_to_dispatch` (rejeita se o status já não for esse — evita corrida
  entre dois retries simultâneos).

## Auto-revisão da spec

- Sem "TBD" pendente — toda decisão em aberto durante a conversa foi
  resolvida (envio parcial: não; cap de fornecedor: não; gatilho:
  automático na liberação; conta: Gmail comum).
- Consistência: o fluxo, as mudanças de banco e as mudanças de tela
  batem entre si (o mesmo nome `dispatch_blocked_reason` e a mesma ação
  `retry_dispatch` aparecem em todas as seções relevantes).
- Escopo: focado — não inclui leitura de resposta de fornecedor nem
  detecção de "3 orçamentos prontos", que ficam pra uma spec futura caso o
  usuário queira avançar nisso depois.
- Ambiguidade resolvida: "falha parcial de envio" tinha um caminho não
  óbvio (o que fazer com e-mails que já saíram) — explicitado acima em vez
  de deixar implícito.
