# Disparo Automático de Solicitações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a SOL is liberated from Análise, the system automatically finds the registered suppliers for each material, e-mails them a quote request via the Nexora Gmail account, and moves the SOL straight to `negotiating` — falling back to the existing manual Disparo screen (with a visible reason) whenever a material has no supplier on file or the send fails.

**Architecture:** All the new business logic lives in the existing Edge Function `review-request` (Deno), which already handles the `release_to_dispatch` action. It gains an `attemptAutoDispatch` step that runs right after the SOL is released, plus a new `retry_dispatch` action for the manual retry button. A new SQL function `fn_mark_request_negotiating` is the only path allowed to move a SOL from `released_to_dispatch` to `negotiating` this way (same pattern as the existing `fn_release_request_to_dispatch`). The pure decision logic (grouping items by supplier, building the e-mail text) lives in a separate, unit-tested module so it doesn't depend on Supabase or SMTP to test.

**Tech Stack:** Supabase Edge Function (Deno + TypeScript), Postgres (plpgsql functions + enum), `denomailer` (SMTP client for Deno) against Gmail, React + TanStack Query on the front end.

**Reference spec:** `docs/superpowers/specs/2026-09-17-disparo-automatico-design.md`

---

## Before you start

This plan touches the shared Supabase dev project (migrations, secrets, a deployed Edge Function) and sends **real e-mails** once deployed. Two things a human must do — an agent should not do these on its own:

1. **Confirm before pushing migrations** (`npm run db:migrate`) and before deploying the Edge Function (`npx supabase functions deploy review-request`) — both affect the shared dev database/project. Ask the user first, same as any other shared-resource change.
2. **Gmail secrets.** The user must generate a Gmail app password (Google Account → Security → 2-Step Verification → App passwords) and set it themselves — never paste a real password into chat. Have them run, in their own terminal or via `!` in the session:
   ```bash
   npx supabase secrets set GMAIL_USER="the-nexora-gmail-address@gmail.com" GMAIL_APP_PASSWORD="the-16-char-app-password"
   ```
   Task 11 below is blocked until this is done (the Edge Function will fail at send time otherwise — that's fine to deploy and test the blocked-path first).

---

## File Structure

New files:
- `supabase/migrations/0033_dispatch_automatico_enum.sql` — adds the new `request_review_type` enum value alone (Postgres forbids using a brand-new enum value in the same transaction that creates it — same constraint the codebase already hit in `0030`/`0031`).
- `supabase/migrations/0034_dispatch_automatico.sql` — `requests.dispatch_blocked_reason` column, `request_dispatch_recipients` table, `fn_mark_request_negotiating`.
- `supabase/functions/review-request/dispatch-logic.ts` — pure functions: group SOL items by eligible supplier, build the blocked-reason message, build the per-supplier e-mail.
- `supabase/functions/review-request/dispatch-logic.test.ts` — `Deno.test` coverage for the above.
- `docs/superpowers/plans/2026-09-17-disparo-automatico.md` — this file.

Modified files:
- `supabase/functions/review-request/index.ts` — auto-dispatch orchestration, new `retry_dispatch` action, permission check switched to the shared helper.
- `apps/web/src/modules/requests/types.ts` — `RequestRow.dispatchBlockedReason`.
- `apps/web/src/modules/requests/api.ts` — select the new column; `releaseRequestToDispatch`/new `retryDispatch` return `{ dispatched: boolean }`.
- `apps/web/src/modules/requests/queries.ts` — new `useRetryDispatch`.
- `apps/web/src/modules/requests/RequestCard.tsx` — blocked-reason banner + retry button.
- `apps/web/src/modules/requests/RequestsTable.tsx` — threads `onRetryDispatch` through.
- `apps/web/src/modules/requests/DisparoSolicitacoesPage.tsx` — wires the retry mutation + a toast.
- `apps/web/src/modules/requests/AnaliseSolicitacoesPage.tsx` — toast reflects whether auto-dispatch actually happened.
- Six existing test files that build a full `RequestRow` literal, updated only to add the new required field: `RequestCard.test.tsx`, `RequestsTable.test.tsx`, `AnalysisRequestCard.test.tsx`, `DisparoSolModal.test.tsx`, `filterRequests.test.ts`, `filterAnalysisRequests.test.ts`, `requestIndicators.test.ts`, `analysisIndicators.test.ts`.

---

### Task 1: Migration — new enum value alone

**Files:**
- Create: `supabase/migrations/0033_dispatch_automatico_enum.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Disparo automático de solicitações: novo tipo de evento em
-- request_reviews para quando o próprio sistema despacha a SOL pros
-- fornecedores. Só o valor de enum aqui — Postgres não deixa usar um valor
-- recém-criado na mesma transação que o cria (mesmo motivo documentado em
-- 0030/0031). O resto (coluna, tabela, função) fica em 0034.

alter type request_review_type add value 'dispatched_to_suppliers';
```

- [ ] **Step 2: Confirm with the user, then apply**

Ask the user before running this (it modifies the shared dev database). Once confirmed:

Run: `npm run db:migrate`
Expected output includes: `"message":"Finished ..."` or similar success line (not `"Remote database is up to date."` — that would mean the file wasn't picked up, check the filename/number).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0033_dispatch_automatico_enum.sql
git commit -m "feat(db): novo tipo de evento dispatched_to_suppliers em request_reviews"
```

---

### Task 2: Migration — column, audit table, transition function

**Files:**
- Create: `supabase/migrations/0034_dispatch_automatico.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Disparo automático de solicitações (spec em
-- docs/superpowers/specs/2026-09-17-disparo-automatico-design.md).
--
-- dispatch_blocked_reason: preenchido quando uma tentativa de despacho
-- automático não conseguiu concluir (falta fornecedor pra algum insumo, ou
-- o envio de e-mail falhou) — null quando não há bloqueio. Reflete só a
-- tentativa mais recente.
alter table requests add column dispatch_blocked_reason text;

-- request_dispatch_recipients: auditoria de quem foi de fato contatado por
-- uma SOL despachada automaticamente. Tabela de log, sem soft delete —
-- mesmo raciocínio de supplier_materials. Escrita só pela Edge Function
-- review-request (service_role); a policy de RLS cobre apenas leitura.
create table request_dispatch_recipients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  request_id uuid not null references requests(id),
  supplier_id uuid not null references suppliers(id),
  material_id uuid not null references materials(id),
  email text not null,
  sent_at timestamptz not null default now()
);

create index request_dispatch_recipients_tenant_id_idx on request_dispatch_recipients(tenant_id);
create index request_dispatch_recipients_request_id_idx on request_dispatch_recipients(request_id);

alter table request_dispatch_recipients enable row level security;
create policy "request_dispatch_recipients_select_own_tenant" on request_dispatch_recipients
  for select
  to authenticated
  using (tenant_id = current_tenant_id());

-- fn_mark_request_negotiating: única forma de levar uma SOL de
-- released_to_dispatch pra negotiating pelo caminho do despacho automático
-- (regra 5 do CLAUDE.md — a regra crítica mora no banco). O guard de status
-- evita corrida entre duas tentativas simultâneas (ex.: alguém clica
-- "tentar novamente" duas vezes rápido).
create function fn_mark_request_negotiating(
  p_request_id uuid,
  p_reviewer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_current_status request_status;
begin
  select tenant_id, status into v_tenant_id, v_current_status
  from requests
  where id = p_request_id and deleted_at is null;

  if v_tenant_id is null then
    raise exception 'Requisição não encontrada: %', p_request_id;
  end if;

  if v_current_status <> 'released_to_dispatch' then
    raise exception 'A requisição não está liberada pro Disparo (status atual: %).', v_current_status;
  end if;

  update requests
  set status = 'negotiating',
      dispatch_blocked_reason = null,
      updated_at = now()
  where id = p_request_id;

  insert into request_reviews (tenant_id, request_id, type, reviewer_id, created_by)
  values (v_tenant_id, p_request_id, 'dispatched_to_suppliers', p_reviewer_id, p_reviewer_id);
end;
$$;
```

- [ ] **Step 2: Confirm with the user, then apply and regenerate types**

Run: `npm run db:migrate`
Expected: success output listing `0034_dispatch_automatico.sql` as applied.

Run: `npm run db:types`
Expected: `apps/web/src/types/database.ts` is rewritten (git diff shows `dispatch_blocked_reason` and `request_dispatch_recipients` added).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0034_dispatch_automatico.sql apps/web/src/types/database.ts
git commit -m "feat(db): coluna dispatch_blocked_reason, tabela request_dispatch_recipients e fn_mark_request_negotiating"
```

---

### Task 3: Pure dispatch logic — grouping and e-mail template (TDD)

**Files:**
- Create: `supabase/functions/review-request/dispatch-logic.ts`
- Test: `supabase/functions/review-request/dispatch-logic.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  buildBlockedReason,
  buildDispatchEmail,
  buildSendFailureReason,
  formatRequestNumber,
  groupItemsBySupplier,
  type DispatchRequestItem,
  type SupplierEmailOption,
} from './dispatch-logic.ts'

const cimento: DispatchRequestItem = {
  materialId: 'mat-cimento',
  materialName: 'Cimento CP-32',
  quantity: 50,
  unitOfMeasure: 'saco',
}
const areia: DispatchRequestItem = {
  materialId: 'mat-areia',
  materialName: 'Areia',
  quantity: 10,
  unitOfMeasure: 'm³',
}

const fornecedorA: SupplierEmailOption = {
  supplierId: 'sup-a',
  supplierName: 'Fornecedor A',
  email: 'fornecedora@example.com',
}
const fornecedorB: SupplierEmailOption = {
  supplierId: 'sup-b',
  supplierName: 'Fornecedor B',
  email: 'fornecedorb@example.com',
}

Deno.test('groupItemsBySupplier agrupa um fornecedor que atende dois insumos num só grupo', () => {
  const result = groupItemsBySupplier(
    [cimento, areia],
    new Map([
      ['mat-cimento', [fornecedorA]],
      ['mat-areia', [fornecedorA]],
    ]),
  )
  if (!result.ok) throw new Error('esperava sucesso')
  assertEquals(result.groups.length, 1)
  assertEquals(result.groups[0].supplierId, 'sup-a')
  assertEquals(result.groups[0].items, [cimento, areia])
})

Deno.test('groupItemsBySupplier manda pra todos os fornecedores cadastrados do insumo, sem cap', () => {
  const result = groupItemsBySupplier([cimento], new Map([['mat-cimento', [fornecedorA, fornecedorB]]]))
  if (!result.ok) throw new Error('esperava sucesso')
  assertEquals(result.groups.length, 2)
})

Deno.test('groupItemsBySupplier bloqueia tudo (sem envio parcial) quando um insumo não tem fornecedor', () => {
  const result = groupItemsBySupplier(
    [cimento, areia],
    new Map([
      ['mat-cimento', [fornecedorA]],
      ['mat-areia', []],
    ]),
  )
  assertEquals(result.ok, false)
  if (result.ok) throw new Error('esperava bloqueio')
  assertEquals(result.missingMaterialNames, ['Areia'])
})

Deno.test('groupItemsBySupplier lista todos os insumos sem fornecedor, não só o primeiro', () => {
  const result = groupItemsBySupplier(
    [cimento, areia],
    new Map([
      ['mat-cimento', []],
      ['mat-areia', []],
    ]),
  )
  assertEquals(result.ok, false)
  if (result.ok) throw new Error('esperava bloqueio')
  assertEquals(result.missingMaterialNames, ['Cimento CP-32', 'Areia'])
})

Deno.test('buildBlockedReason monta a mensagem com os insumos separados por vírgula', () => {
  assertEquals(
    buildBlockedReason(['Cimento CP-32', 'Areia']),
    'Sem fornecedor cadastrado para: Cimento CP-32, Areia',
  )
})

Deno.test('buildSendFailureReason menciona quem falhou e quem já recebeu e-mail', () => {
  assertEquals(
    buildSendFailureReason('Fornecedor B', ['Fornecedor A']),
    'Falha ao enviar pra Fornecedor B; Fornecedor A já recebeu e-mail — não reenviar.',
  )
})

Deno.test('buildSendFailureReason não menciona "já recebeu" quando ninguém recebeu ainda', () => {
  assertEquals(buildSendFailureReason('Fornecedor A', []), 'Falha ao enviar pra Fornecedor A.')
})

Deno.test('formatRequestNumber usa o número externo quando existe', () => {
  assertEquals(formatRequestNumber('1243', 42), '1243')
})

Deno.test('formatRequestNumber cai pra "SOL {sequência}" sem número externo', () => {
  assertEquals(formatRequestNumber(null, 42), 'SOL 42')
})

Deno.test('buildDispatchEmail lista só os insumos do grupo, com quantidade e unidade', () => {
  const email = buildDispatchEmail(
    { supplierId: 'sup-a', supplierName: 'Fornecedor A', email: 'fornecedora@example.com', items: [cimento] },
    { requestNumber: '1243', unitName: 'Depósito Simões Filho', neededBy: '2026-09-20' },
  )
  assertEquals(email.to, 'fornecedora@example.com')
  assertEquals(email.subject, 'Cotação — 1243')
  assertEquals(email.body.includes('Cimento CP-32: 50 saco'), true)
  assertEquals(email.body.includes('Depósito Simões Filho'), true)
  assertEquals(email.body.includes('20/09/2026'), true)
})

Deno.test('buildDispatchEmail usa "a definir" quando não há prazo', () => {
  const email = buildDispatchEmail(
    { supplierId: 'sup-a', supplierName: 'Fornecedor A', email: 'fornecedora@example.com', items: [cimento] },
    { requestNumber: '1243', unitName: 'Depósito Simões Filho', neededBy: null },
  )
  assertEquals(email.body.includes('a definir'), true)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd supabase/functions/review-request && deno test dispatch-logic.test.ts`
Expected: FAIL — `dispatch-logic.ts` doesn't exist yet (module not found).

- [ ] **Step 3: Write the implementation**

```typescript
export interface DispatchRequestItem {
  materialId: string
  materialName: string
  quantity: number
  unitOfMeasure: string | null
}

export interface SupplierEmailOption {
  supplierId: string
  supplierName: string
  email: string
}

export interface SupplierEmailGroup {
  supplierId: string
  supplierName: string
  email: string
  items: DispatchRequestItem[]
}

export type GroupItemsResult =
  | { ok: true; groups: SupplierEmailGroup[] }
  | { ok: false; missingMaterialNames: string[] }

// Sem envio parcial: se qualquer insumo não tiver fornecedor elegível, o
// resultado inteiro é de bloqueio — nenhum grupo é retornado, mesmo que
// outros insumos tivessem fornecedor.
export function groupItemsBySupplier(
  items: DispatchRequestItem[],
  suppliersByMaterialId: Map<string, SupplierEmailOption[]>,
): GroupItemsResult {
  const missingMaterialNames: string[] = []
  const groupsBySupplierId = new Map<string, SupplierEmailGroup>()

  for (const item of items) {
    const suppliers = suppliersByMaterialId.get(item.materialId) ?? []
    if (suppliers.length === 0) {
      missingMaterialNames.push(item.materialName)
      continue
    }
    for (const supplier of suppliers) {
      const existing = groupsBySupplierId.get(supplier.supplierId)
      if (existing) {
        existing.items.push(item)
      } else {
        groupsBySupplierId.set(supplier.supplierId, {
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName,
          email: supplier.email,
          items: [item],
        })
      }
    }
  }

  if (missingMaterialNames.length > 0) {
    return { ok: false, missingMaterialNames }
  }
  return { ok: true, groups: [...groupsBySupplierId.values()] }
}

export function buildBlockedReason(missingMaterialNames: string[]): string {
  return `Sem fornecedor cadastrado para: ${missingMaterialNames.join(', ')}`
}

export function buildSendFailureReason(failedSupplierName: string, alreadySentSupplierNames: string[]): string {
  if (alreadySentSupplierNames.length === 0) {
    return `Falha ao enviar pra ${failedSupplierName}.`
  }
  return `Falha ao enviar pra ${failedSupplierName}; ${alreadySentSupplierNames.join(', ')} já recebeu e-mail — não reenviar.`
}

export function formatRequestNumber(externalRef: string | null, sequenceNumber: number | null): string {
  if (externalRef) return externalRef
  if (sequenceNumber != null) return `SOL ${sequenceNumber}`
  return '—'
}

export interface DispatchEmailContext {
  requestNumber: string
  unitName: string
  neededBy: string | null
}

export interface DispatchEmail {
  to: string
  subject: string
  body: string
}

function formatNeededBy(neededBy: string | null): string {
  if (!neededBy) return 'a definir'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${neededBy}T00:00:00`))
}

export function buildDispatchEmail(group: SupplierEmailGroup, context: DispatchEmailContext): DispatchEmail {
  const subject = `Cotação — ${context.requestNumber}`
  const itemLines = group.items
    .map((item) => `- ${item.materialName}: ${item.quantity} ${item.unitOfMeasure ?? ''}`.trim())
    .join('\n')
  const body = [
    `Olá, ${group.supplierName}.`,
    '',
    `Pedimos uma cotação para os itens abaixo, referente à ${context.requestNumber} (obra ${context.unitName}):`,
    '',
    itemLines,
    '',
    `Prazo de entrega desejado: ${formatNeededBy(context.neededBy)}.`,
    '',
    'Por favor, responda este e-mail com sua cotação (preço, prazo de entrega e condição de pagamento).',
    '',
    'Obrigado,',
    'Nexora',
  ].join('\n')
  return { to: group.email, subject, body }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd supabase/functions/review-request && deno test dispatch-logic.test.ts`
Expected: PASS — all 11 tests green.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/review-request/dispatch-logic.ts supabase/functions/review-request/dispatch-logic.test.ts
git commit -m "feat(requests): lógica pura de agrupamento por fornecedor e template de e-mail de cotação"
```

---

### Task 4: Wire auto-dispatch into `review-request`

**Files:**
- Modify: `supabase/functions/review-request/index.ts` (full rewrite of the file below)

This task has no unit tests of its own — same convention already used by `compare-quotations` in this repo, where the pure logic (`ai-provider.ts`) is tested but the `index.ts` handler that talks to Supabase and an external HTTP API is not. Verification here is the manual smoke test in Task 12.

- [ ] **Step 1: Replace the whole file**

```typescript
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { userHasPermission } from '../_shared/checkPermission.ts'
import {
  buildBlockedReason,
  buildDispatchEmail,
  buildSendFailureReason,
  formatRequestNumber,
  groupItemsBySupplier,
  type DispatchRequestItem,
  type SupplierEmailOption,
} from './dispatch-logic.ts'

type ReviewAction = 'request_clarification' | 'request_extension' | 'release_to_dispatch' | 'retry_dispatch'

interface ReviewBody {
  requestId: string
  action: ReviewAction
  message?: string
  newNeededBy?: string
}

interface RequestForDispatch {
  tenantId: string
  requestNumber: string
  unitName: string
  neededBy: string | null
  items: DispatchRequestItem[]
}

async function fetchRequestForDispatch(
  adminClient: SupabaseClient,
  requestId: string,
): Promise<RequestForDispatch> {
  const { data, error } = await adminClient
    .from('requests')
    .select(
      'tenant_id, external_ref, sequence_number, needed_by, units(name), request_items(material_id, quantity, unit_of_measure, deleted_at, materials(name))',
    )
    .eq('id', requestId)
    .single()
  if (error) throw error

  const items = (
    data.request_items as {
      material_id: string
      quantity: number
      unit_of_measure: string | null
      deleted_at: string | null
      materials: { name: string } | null
    }[]
  )
    .filter((item) => !item.deleted_at)
    .map((item) => ({
      materialId: item.material_id,
      materialName: item.materials?.name ?? '',
      quantity: item.quantity,
      unitOfMeasure: item.unit_of_measure,
    }))

  return {
    tenantId: data.tenant_id,
    requestNumber: formatRequestNumber(data.external_ref, data.sequence_number),
    unitName: (data.units as { name: string } | null)?.name ?? '',
    neededBy: data.needed_by,
    items,
  }
}

async function fetchSuppliersForMaterial(
  adminClient: SupabaseClient,
  materialId: string,
): Promise<SupplierEmailOption[]> {
  const { data, error } = await adminClient
    .from('suppliers')
    .select('id, name, supplier_contacts(email), supplier_materials!inner(material_id)')
    .eq('supplier_materials.material_id', materialId)
    .is('deleted_at', null)
  if (error) throw error

  return (data as { id: string; name: string; supplier_contacts: { email: string | null }[] }[])
    .map((row) => ({
      supplierId: row.id,
      supplierName: row.name,
      email: row.supplier_contacts[0]?.email ?? null,
    }))
    .filter((row): row is SupplierEmailOption => Boolean(row.email))
}

async function sendDispatchEmails(
  emails: { to: string; subject: string; body: string }[],
): Promise<{ sentCount: number; failedAt: number | null }> {
  const gmailUser = Deno.env.get('GMAIL_USER')!
  const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD')!
  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: gmailUser, password: gmailAppPassword },
    },
  })

  try {
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i]
      try {
        await client.send({ from: gmailUser, to: email.to, subject: email.subject, content: email.body })
      } catch {
        return { sentCount: i, failedAt: i }
      }
    }
    return { sentCount: emails.length, failedAt: null }
  } finally {
    await client.close()
  }
}

async function attemptAutoDispatch(
  adminClient: SupabaseClient,
  requestId: string,
  reviewerId: string,
): Promise<{ dispatched: boolean }> {
  const request = await fetchRequestForDispatch(adminClient, requestId)

  const uniqueMaterialIds = [...new Set(request.items.map((item) => item.materialId))]
  const suppliersByMaterialId = new Map<string, SupplierEmailOption[]>()
  for (const materialId of uniqueMaterialIds) {
    suppliersByMaterialId.set(materialId, await fetchSuppliersForMaterial(adminClient, materialId))
  }

  const groupResult = groupItemsBySupplier(request.items, suppliersByMaterialId)
  if (!groupResult.ok) {
    await adminClient
      .from('requests')
      .update({ dispatch_blocked_reason: buildBlockedReason(groupResult.missingMaterialNames) })
      .eq('id', requestId)
    return { dispatched: false }
  }

  const emails = groupResult.groups.map((group) =>
    buildDispatchEmail(group, {
      requestNumber: request.requestNumber,
      unitName: request.unitName,
      neededBy: request.neededBy,
    }),
  )
  const { failedAt } = await sendDispatchEmails(emails)

  if (failedAt !== null) {
    const failedGroup = groupResult.groups[failedAt]
    const alreadySent = groupResult.groups.slice(0, failedAt).map((group) => group.supplierName)
    await adminClient
      .from('requests')
      .update({ dispatch_blocked_reason: buildSendFailureReason(failedGroup.supplierName, alreadySent) })
      .eq('id', requestId)
    return { dispatched: false }
  }

  const recipients = groupResult.groups.flatMap((group) =>
    group.items.map((item) => ({
      tenant_id: request.tenantId,
      request_id: requestId,
      supplier_id: group.supplierId,
      material_id: item.materialId,
      email: group.email,
    })),
  )
  const { error: recipientsError } = await adminClient.from('request_dispatch_recipients').insert(recipients)
  if (recipientsError) throw recipientsError

  const { error: negotiatingError } = await adminClient.rpc('fn_mark_request_negotiating', {
    p_request_id: requestId,
    p_reviewer_id: reviewerId,
  })
  if (negotiatingError) throw negotiatingError

  return { dispatched: true }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

    const body = (await req.json()) as Partial<ReviewBody>
    const { requestId, action, message, newNeededBy } = body

    const validActions: ReviewAction[] = [
      'request_clarification',
      'request_extension',
      'release_to_dispatch',
      'retry_dispatch',
    ]
    if (!requestId || !action || !validActions.includes(action)) {
      return jsonResponse({ error: 'Parâmetros inválidos.' }, 400)
    }
    if (action === 'request_extension' && !newNeededBy) {
      return jsonResponse({ error: 'Informe a nova data de entrega proposta.' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await callerClient.auth.getUser()
    if (userError || !userData.user) return jsonResponse({ error: 'Não autenticado.' }, 401)
    const userId = userData.user.id

    const hasAnalyzePermission = await userHasPermission(callerClient, userId, 'requests.analyze')
    if (!hasAnalyzePermission) return jsonResponse({ error: 'Sem permissão para analisar solicitações.' }, 403)

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    if (action === 'release_to_dispatch' || action === 'retry_dispatch') {
      if (action === 'release_to_dispatch') {
        const { error: releaseError } = await adminClient.rpc('fn_release_request_to_dispatch', {
          p_request_id: requestId,
          p_reviewer_id: userId,
        })
        if (releaseError) return jsonResponse({ error: releaseError.message }, 500)
      }

      const { dispatched } = await attemptAutoDispatch(adminClient, requestId, userId)
      return jsonResponse({ ok: true, dispatched }, 200)
    }

    const rpcCall =
      action === 'request_clarification'
        ? adminClient.rpc('fn_request_clarification', {
            p_request_id: requestId,
            p_reviewer_id: userId,
            p_message: message ?? null,
          })
        : adminClient.rpc('fn_request_extension', {
            p_request_id: requestId,
            p_reviewer_id: userId,
            p_new_needed_by: newNeededBy,
            p_reason: message ?? null,
          })

    const { error: rpcError } = await rpcCall
    if (rpcError) return jsonResponse({ error: rpcError.message }, 500)

    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
```

- [ ] **Step 2: Type-check with Deno**

Run: `cd supabase/functions/review-request && deno check index.ts`
Expected: no errors. If `denomailer@1.6.0` fails to resolve, check https://deno.land/x/denomailer for the current published version and update the import line in both this file and any place that pins it (none elsewhere in this plan).

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/review-request/index.ts
git commit -m "feat(requests): despacho automático de SOL liberada — busca fornecedor, envia e-mail, marca em negociação"
```

---

### Task 5: Front end — `RequestRow.dispatchBlockedReason` and API plumbing

**Files:**
- Modify: `apps/web/src/modules/requests/types.ts`
- Modify: `apps/web/src/modules/requests/api.ts`
- Modify: `apps/web/src/modules/requests/queries.ts`

- [ ] **Step 1: Add the field to the type**

In `apps/web/src/modules/requests/types.ts`, in the `RequestRow` interface:

```typescript
export interface RequestRow {
  id: string
  unitId: string
  unitName: string
  status: RequestStatus
  neededBy: string | null
  externalRef: string | null
  sequenceNumber: number | null
  createdAt: string
  subjectCategory: string | null
  notes: string | null
  negotiatorId: string | null
  negotiatorName: string | null
  negotiatingStartedAt: string | null
  quotationsCount: number
  dispatchBlockedReason: string | null
  items: RequestItemRow[]
}
```

(Only the `dispatchBlockedReason: string | null` line is new, placed right before `items`.)

- [ ] **Step 2: Select and map the new column in `fetchRequests`**

In `apps/web/src/modules/requests/api.ts`, the `.select(...)` string in `fetchRequests` gains `dispatch_blocked_reason`:

```typescript
    .select(
      'id, status, needed_by, external_ref, sequence_number, created_at, subject_category, notes, negotiating_started_at, dispatch_blocked_reason, units(id, name), negotiator:users!negotiator_id(id, full_name), request_items(id, material_id, quantity, unit_of_measure, status_code, authorized_at, pendente, motivo_pendencia, deleted_at, materials(name, code, description)), quotations(id, deleted_at)',
    )
```

And the returned object gains the mapped field, right after `negotiatingStartedAt`:

```typescript
    negotiatingStartedAt: row.negotiating_started_at,
    dispatchBlockedReason: row.dispatch_blocked_reason,
    quotationsCount: row.quotations.filter((quotation) => !quotation.deleted_at).length,
```

- [ ] **Step 3: Change `releaseRequestToDispatch` to return the dispatch outcome, add `retryDispatch`**

Replace the current `releaseRequestToDispatch` function with:

```typescript
export async function releaseRequestToDispatch(requestId: string): Promise<{ dispatched: boolean }> {
  const { data, error } = await supabase.functions.invoke('review-request', {
    body: { requestId, action: 'release_to_dispatch' },
  })
  if (error) throw await parseReviewError(error)
  return { dispatched: Boolean((data as { dispatched?: boolean } | null)?.dispatched) }
}

export async function retryDispatch(requestId: string): Promise<{ dispatched: boolean }> {
  const { data, error } = await supabase.functions.invoke('review-request', {
    body: { requestId, action: 'retry_dispatch' },
  })
  if (error) throw await parseReviewError(error)
  return { dispatched: Boolean((data as { dispatched?: boolean } | null)?.dispatched) }
}
```

- [ ] **Step 4: Add `useRetryDispatch`**

In `apps/web/src/modules/requests/queries.ts`, add `retryDispatch` to the import from `./api` (alphabetical, next to `requestExtension`):

```typescript
import {
  bulkCreateRequests,
  cancelRequest,
  createRequest,
  dispatchRequest,
  fetchImportMapping,
  fetchMaterialOptions,
  fetchMaterialsWithSupplierCount,
  fetchRequests,
  fetchUnitOptions,
  releaseRequestToDispatch,
  requestClarification,
  requestExtension,
  retryDispatch,
  saveImportMapping,
  toggleItemPendency,
  updateRequest,
  updateRequestNotes,
  updateRequestStatus,
  type DispatchDetailsValues,
} from './api'
```

Then, right after `useReleaseRequestToDispatch`:

```typescript
export function useRetryDispatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => retryDispatch(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}
```

- [ ] **Step 5: Run typecheck — it will fail on the six test files that build a full `RequestRow` literal, that's expected**

Run: `npm run typecheck`
Expected: FAIL, errors listing `Property 'dispatchBlockedReason' is missing` in `RequestCard.test.tsx`, `RequestsTable.test.tsx`, `AnalysisRequestCard.test.tsx`, `DisparoSolModal.test.tsx`, `filterRequests.test.ts`, `filterAnalysisRequests.test.ts`, `requestIndicators.test.ts`, `analysisIndicators.test.ts`. Fixed in Task 6.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/requests/types.ts apps/web/src/modules/requests/api.ts apps/web/src/modules/requests/queries.ts
git commit -m "feat(requests): plumbing pro resultado do despacho automático (dispatched) e retry"
```

---

### Task 6: Fix the eight `RequestRow` test literals

**Files:**
- Modify: `apps/web/src/modules/requests/RequestsTable.test.tsx:23`
- Modify: `apps/web/src/modules/requests/AnalysisRequestCard.test.tsx:38`
- Modify: `apps/web/src/modules/requests/filterRequests.test.ts:19`
- Modify: `apps/web/src/modules/requests/filterAnalysisRequests.test.ts:36`
- Modify: `apps/web/src/modules/requests/DisparoSolModal.test.tsx:30`
- Modify: `apps/web/src/modules/requests/RequestCard.test.tsx:20`
- Modify: `apps/web/src/modules/requests/requestIndicators.test.ts:19`
- Modify: `apps/web/src/modules/requests/analysisIndicators.test.ts:19`

Each of these files has a line `negotiatingStartedAt: null,` immediately followed by `quotationsCount: 0,`, at the indentation shown. In every one of them, insert a `dispatchBlockedReason: null,` line between the two, matching that file's indentation.

- [ ] **Step 1: `RequestsTable.test.tsx`** (4-space indent)

```typescript
    negotiatingStartedAt: null,
    dispatchBlockedReason: null,
    quotationsCount: 0,
```

- [ ] **Step 2: `AnalysisRequestCard.test.tsx`** (4-space indent)

```typescript
    negotiatingStartedAt: null,
    dispatchBlockedReason: null,
    quotationsCount: 0,
```

- [ ] **Step 3: `filterRequests.test.ts`** (4-space indent)

```typescript
    negotiatingStartedAt: null,
    dispatchBlockedReason: null,
    quotationsCount: 0,
```

- [ ] **Step 4: `filterAnalysisRequests.test.ts`** (4-space indent)

```typescript
    negotiatingStartedAt: null,
    dispatchBlockedReason: null,
    quotationsCount: 0,
```

- [ ] **Step 5: `DisparoSolModal.test.tsx`** (2-space indent)

```typescript
  negotiatingStartedAt: null,
  dispatchBlockedReason: null,
  quotationsCount: 0,
```

- [ ] **Step 6: `RequestCard.test.tsx`** (2-space indent)

```typescript
  negotiatingStartedAt: null,
  dispatchBlockedReason: null,
  quotationsCount: 0,
```

- [ ] **Step 7: `requestIndicators.test.ts`** (4-space indent)

```typescript
    negotiatingStartedAt: null,
    dispatchBlockedReason: null,
    quotationsCount: 0,
```

- [ ] **Step 8: `analysisIndicators.test.ts`** (4-space indent)

```typescript
    negotiatingStartedAt: null,
    dispatchBlockedReason: null,
    quotationsCount: 0,
```

- [ ] **Step 9: Run typecheck and the full test suite**

Run: `npm run typecheck && npm run test`
Expected: both PASS (the test suite was already green before this plan; these edits only satisfy the type, they don't change behavior).

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/modules/requests/RequestsTable.test.tsx apps/web/src/modules/requests/AnalysisRequestCard.test.tsx apps/web/src/modules/requests/filterRequests.test.ts apps/web/src/modules/requests/filterAnalysisRequests.test.ts apps/web/src/modules/requests/DisparoSolModal.test.tsx apps/web/src/modules/requests/RequestCard.test.tsx apps/web/src/modules/requests/requestIndicators.test.ts apps/web/src/modules/requests/analysisIndicators.test.ts
git commit -m "test(requests): adiciona dispatchBlockedReason nos fixtures de RequestRow"
```

---

### Task 7: `RequestCard` — blocked-reason banner and retry button (TDD)

**Files:**
- Modify: `apps/web/src/modules/requests/RequestCard.tsx`
- Test: `apps/web/src/modules/requests/RequestCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add to the end of the `describe('RequestCard', ...)` block in `RequestCard.test.tsx` (before the final closing `})`):

```typescript
  it('mostra o motivo do bloqueio e o botão de tentar de novo quando o despacho automático falhou', () => {
    render(
      <RequestCard
        {...baseProps()}
        request={{
          ...baseRequest,
          status: 'released_to_dispatch',
          dispatchBlockedReason: 'Sem fornecedor cadastrado para: Cimento CP-32',
        }}
      />,
    )
    expect(screen.getByText('Sem fornecedor cadastrado para: Cimento CP-32')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tentar disparo automático novamente/i })).toBeInTheDocument()
  })

  it('não mostra o banner de bloqueio quando não há motivo', () => {
    render(<RequestCard {...baseProps()} request={{ ...baseRequest, dispatchBlockedReason: null }} />)
    expect(screen.queryByRole('button', { name: /tentar disparo automático novamente/i })).not.toBeInTheDocument()
  })

  it('chama onRetryDispatch ao clicar em tentar disparo automático novamente', async () => {
    const user = userEvent.setup()
    const onRetryDispatch = vi.fn()
    render(
      <RequestCard
        {...baseProps()}
        onRetryDispatch={onRetryDispatch}
        request={{
          ...baseRequest,
          status: 'released_to_dispatch',
          dispatchBlockedReason: 'Sem fornecedor cadastrado para: Cimento CP-32',
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: /tentar disparo automático novamente/i }))
    expect(onRetryDispatch).toHaveBeenCalledWith('r1')
  })
```

Also add `onRetryDispatch: vi.fn(),` to `baseProps()` in the same file, right after `onUpdateNotes: vi.fn(),`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- RequestCard.test.tsx`
Expected: FAIL — `onRetryDispatch` is not an accepted prop / the banner text and button don't exist yet.

- [ ] **Step 3: Add the prop and the banner to `RequestCard.tsx`**

Extend the props interface:

```typescript
export interface RequestCardProps {
  request: RequestRow
  today: Date
  onEditRequest: (requestId: string) => void
  onDispatch: (requestId: string) => void
  onCancelRequest: (request: RequestRow) => void
  onNegotiateDirectly: (requestId: string) => void
  onUpdateNotes: (requestId: string, notes: string) => void
  onRetryDispatch: (requestId: string) => void
}
```

Add `onRetryDispatch` to the destructured function params:

```typescript
export function RequestCard({
  request,
  today,
  onEditRequest,
  onDispatch,
  onCancelRequest,
  onNegotiateDirectly,
  onUpdateNotes,
  onRetryDispatch,
}: RequestCardProps) {
```

Insert the banner right after the header row's closing `</div>` (the one that closes `<div className="flex flex-wrap items-center gap-4">`) and before `{isExpanded && (`:

```tsx
      {request.dispatchBlockedReason && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>{request.dispatchBlockedReason}</span>
          <Button variant="secondary" onClick={() => onRetryDispatch(request.id)}>
            Tentar disparo automático novamente
          </Button>
        </div>
      )}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- RequestCard.test.tsx`
Expected: PASS — all tests in the file green, including the three new ones.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/requests/RequestCard.tsx apps/web/src/modules/requests/RequestCard.test.tsx
git commit -m "feat(requests): RequestCard mostra motivo do bloqueio e botão de retry do despacho automático"
```

---

### Task 8: Thread `onRetryDispatch` through `RequestsTable`

**Files:**
- Modify: `apps/web/src/modules/requests/RequestsTable.tsx`
- Test: `apps/web/src/modules/requests/RequestsTable.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `RequestsTable.test.tsx`, inside the `describe` block:

```typescript
  it('chama onRetryDispatch ao clicar em tentar disparo automático novamente', async () => {
    const user = userEvent.setup()
    const onRetryDispatch = vi.fn()
    render(
      <RequestsTable
        {...baseProps()}
        requests={[
          makeRequest({ status: 'released_to_dispatch', dispatchBlockedReason: 'Sem fornecedor cadastrado para: Cimento' }),
        ]}
        onRetryDispatch={onRetryDispatch}
      />,
    )
    await user.click(screen.getByRole('button', { name: /tentar disparo automático novamente/i }))
    expect(onRetryDispatch).toHaveBeenCalledWith('r1')
  })
```

Also add `dispatchBlockedReason: null,` to the object returned by `makeRequest`, right after `negotiatingStartedAt: null,`, and `onRetryDispatch: vi.fn(),` to `baseProps()`, right after `onUpdateNotes: vi.fn(),`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- RequestsTable.test.tsx`
Expected: FAIL — `RequestsTable` doesn't accept/forward `onRetryDispatch` yet.

- [ ] **Step 3: Add the prop and forward it**

Add to `RequestsTableProps`, right after `onUpdateNotes`:

```typescript
  onUpdateNotes: (requestId: string, notes: string) => void
  onRetryDispatch: (requestId: string) => void
}
```

Add to the destructured params of `RequestsTable`, right after `onUpdateNotes`:

```typescript
  onUpdateNotes,
  onRetryDispatch,
}: RequestsTableProps) {
```

Pass it to `RequestCard` inside the `.map`, right after `onUpdateNotes`:

```tsx
              onUpdateNotes={onUpdateNotes}
              onRetryDispatch={onRetryDispatch}
            />
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- RequestsTable.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/requests/RequestsTable.tsx apps/web/src/modules/requests/RequestsTable.test.tsx
git commit -m "feat(requests): RequestsTable encaminha onRetryDispatch pro RequestCard"
```

---

### Task 9: Wire the retry mutation and toast into `DisparoSolicitacoesPage`

**Files:**
- Modify: `apps/web/src/modules/requests/DisparoSolicitacoesPage.tsx`

No test file exists for this page today (it's a TanStack Query container, same as `AnaliseSolicitacoesPage.tsx`, which also has no dedicated test file) — verified manually in Task 10.

- [ ] **Step 1: Update imports**

Replace:

```typescript
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ComingSoonButton } from '../../components'
```

with:

```typescript
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ComingSoonButton, Toast, type ToastVariant } from '../../components'
```

Replace the `./queries` import block:

```typescript
import {
  useCancelRequest,
  useCreateRequest,
  useDispatchRequest,
  useMaterialOptions,
  useMaterialsWithSupplierCount,
  useRequests,
  useUnitOptions,
  useUpdateRequest,
  useUpdateRequestNotes,
  useUpdateRequestStatus,
} from './queries'
```

with:

```typescript
import {
  useCancelRequest,
  useCreateRequest,
  useDispatchRequest,
  useMaterialOptions,
  useMaterialsWithSupplierCount,
  useRequests,
  useRetryDispatch,
  useUnitOptions,
  useUpdateRequest,
  useUpdateRequestNotes,
  useUpdateRequestStatus,
} from './queries'
```

- [ ] **Step 2: Add toast state and the retry mutation**

Right after the existing `const [dispatchRequestId, setDispatchRequestId] = useState<string | null>(null)` line, add:

```typescript
  const [toast, setToast] = useState<{ variant: ToastVariant; message: string } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])
```

Right after the existing `const updateRequestNotes = useUpdateRequestNotes()` line, add:

```typescript
  const retryDispatch = useRetryDispatch()
```

- [ ] **Step 3: Add a small error-message helper**

Right after the imports and before the `DisparoSolicitacoesPage` function declaration, add:

```typescript
function errorMessage(error: unknown): string | null {
  if (!error) return null
  return error instanceof Error ? error.message : 'Não foi possível concluir a ação. Tente novamente.'
}
```

- [ ] **Step 4: Render the toast and wire `onRetryDispatch`**

Right after the opening `<div className="min-h-screen bg-bg">`, add the toast markup (same pattern as `AnaliseSolicitacoesPage.tsx`):

```tsx
    <div className="min-h-screen bg-bg">
      {toast && (
        <div className="fixed right-4 top-4 z-50 w-full max-w-sm">
          <Toast variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
        </div>
      )}
```

In the `<RequestsTable ... />` JSX, add the new prop right after `onUpdateNotes`:

```tsx
          onUpdateNotes={(requestId, notes) => updateRequestNotes.mutate({ requestId, notes })}
          onRetryDispatch={(requestId) =>
            retryDispatch.mutate(requestId, {
              onSuccess: ({ dispatched }) =>
                setToast({
                  variant: 'success',
                  message: dispatched
                    ? 'SOL despachada automaticamente — já está em Em Negociação.'
                    : 'Ainda não deu — o motivo do bloqueio foi atualizado.',
                }),
              onError: (error) =>
                setToast({ variant: 'error', message: errorMessage(error) ?? 'Não foi possível tentar de novo.' }),
            })
          }
        />
```

- [ ] **Step 5: Run lint, typecheck and tests**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/requests/DisparoSolicitacoesPage.tsx
git commit -m "feat(requests): Disparo ganha botão de retry do despacho automático com feedback de toast"
```

---

### Task 10: `AnaliseSolicitacoesPage` — toast reflects the real outcome

**Files:**
- Modify: `apps/web/src/modules/requests/AnaliseSolicitacoesPage.tsx:195-202`

- [ ] **Step 1: Update the `onReleaseToDispatch` handler**

Replace:

```tsx
                onReleaseToDispatch={(requestId) =>
                  releaseToDispatch.mutate(requestId, {
                    onSuccess: () =>
                      setToast({ variant: 'success', message: 'SOL liberada pro Disparo.' }),
                    onError: (error) =>
                      setToast({ variant: 'error', message: errorMessage(error) ?? 'Não foi possível liberar.' }),
                  })
                }
```

with:

```tsx
                onReleaseToDispatch={(requestId) =>
                  releaseToDispatch.mutate(requestId, {
                    onSuccess: ({ dispatched }) =>
                      setToast({
                        variant: 'success',
                        message: dispatched
                          ? 'SOL despachada automaticamente — já está em Em Negociação.'
                          : 'SOL liberada pro Disparo.',
                      }),
                    onError: (error) =>
                      setToast({ variant: 'error', message: errorMessage(error) ?? 'Não foi possível liberar.' }),
                  })
                }
```

- [ ] **Step 2: Run lint, typecheck and tests**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/requests/AnaliseSolicitacoesPage.tsx
git commit -m "feat(requests): toast da Análise reflete se a SOL foi de fato despachada automaticamente"
```

---

### Task 11: Gmail secret and Edge Function deploy (manual, user-confirmed)

**Files:** none — operational step.

- [ ] **Step 1: User sets the Gmail secret**

Confirm the user has generated a Gmail app password for the Nexora account (2-Step Verification must be on first) and ask them to run, in their own terminal (never paste the password into chat):

```bash
npx supabase secrets set GMAIL_USER="the-nexora-gmail-address@gmail.com" GMAIL_APP_PASSWORD="the-16-char-app-password"
```

- [ ] **Step 2: Confirm with the user, then deploy the Edge Function**

This redeploys a function used by the shared dev project — ask before running.

Run: `npx supabase functions deploy review-request`
Expected: success output ending with a deployed function URL/status.

---

### Task 12: Manual smoke test

**Files:** none — manual verification against the linked dev project.

- [ ] **Step 1: Blocked path — insumo sem fornecedor**

In the running app (`npm run dev`), go to Análise de Solicitações, pick (or create) a SOL that has at least one material with zero suppliers registered in the Agenda de Fornecedores. Click "Liberar pro Disparo".
Expected: toast says "SOL liberada pro Disparo." (not the auto-dispatched message); the SOL shows up in Disparo de Solicitações with an amber banner reading `Sem fornecedor cadastrado para: <nome do material>` and a "Tentar disparo automático novamente" button.

- [ ] **Step 2: Fix the data and retry**

In Agenda de Fornecedores, register a supplier (with an e-mail) for that material. Back in Disparo, click "Tentar disparo automático novamente" on the blocked SOL.
Expected: toast says "SOL despachada automaticamente — já está em Em Negociação."; the SOL disappears from Disparo (status is now `negotiating`); the Gmail sent-mail folder shows the quote-request e-mail to that supplier; `select * from request_dispatch_recipients where request_id = '<id>'` (via `npx supabase db query --linked`) shows one row.

- [ ] **Step 3: Happy path end to end**

Create a new SOL (via "+ Nova solicitação" in Análise) using only materials that already have registered suppliers with e-mail. Release it to Disparo.
Expected: toast says "SOL despachada automaticamente — já está em Em Negociação." immediately, without the SOL ever visibly sitting in Disparo; each covered supplier receives exactly one e-mail (check the Gmail sent folder) listing only the materials that supplier is registered for.

---

## Self-Review

**Spec coverage:** every section of `2026-09-17-disparo-automatico-design.md` maps to a task — fluxo/gatilho → Tasks 4, 9, 10; seleção de fornecedores + bloqueio total → Tasks 3, 4; envio por Gmail → Tasks 4, 11; mudanças de banco → Tasks 1, 2; mudanças de tela → Tasks 5–10; falha parcial de envio → Task 3 (`buildSendFailureReason`) and Task 4 (`sentCount`/`failedAt` handling); testes → Tasks 3, 6, 7, 8, plus the manual smoke test in Task 12.

**Placeholder scan:** no TBDs — every step has real code or an exact command with expected output.

**Type consistency:** `dispatched: boolean` is the field name used consistently across `attemptAutoDispatch` (Task 4), `releaseRequestToDispatch`/`retryDispatch` (Task 5), and both page-level toast handlers (Tasks 9, 10). `dispatchBlockedReason` (camelCase, front end) vs. `dispatch_blocked_reason` (snake_case, DB/Edge Function) is the same mapping convention already used for every other column in this file (`negotiatingStartedAt`/`negotiating_started_at`, etc.).
