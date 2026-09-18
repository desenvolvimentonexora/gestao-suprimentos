# Leitura Automática de Cotações por E-mail — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `pg_cron`-triggered Edge Function checks the Nexora Gmail inbox every 10 minutes for supplier replies with a PDF quote, matches each one to the right SOL/supplier via `request_dispatch_recipients`, and feeds the PDF into the AI extraction pipeline that already exists — writing `quotation_items`/`comparison_lines` directly, with no human review gate. A new "Ver PDF" link in Em Negociação lets someone check the source document, since that's the safety net this design relies on instead of a confidence gate.

**Architecture:** One new Edge Function (`poll-supplier-quotes`) owns the Gmail API calls (OAuth token refresh, list/get/attachment/modify) and the matching logic (duplicated pure functions, same pattern as `dispatch-logic.ts` in the dispatch-automation feature). It reuses the existing extraction call (`extractQuoteDataFromPdf`, promoted from `compare-quotations/` to `_shared/` since two functions need it now) and replicates, server-side, the same sequence the manual PDF-import flow already does (`getOrCreateDraftComparison` → create quotation → upload attachment → extract → match → write items/lines → mark quotation `received`). A new `email_ingestions` table is both the audit trail and the idempotency guard (unique per Gmail message id).

**Tech Stack:** Supabase Edge Function (Deno + TypeScript), Postgres (`pg_cron`, `pg_net`), Gmail REST API (OAuth2, plain `fetch`), reuses the existing Anthropic-based PDF extraction.

**Reference spec:** `docs/superpowers/specs/2026-09-19-leitura-automatica-cotacoes-design.md`

---

## Before you start

This plan needs three things only a human can do — an agent should not attempt them:

1. **Gmail OAuth setup** (Task 6): create a Google Cloud project, enable the Gmail API, create OAuth credentials, and run a one-time authorization flow to get a refresh token. Full step-by-step is in Task 6.
2. **Confirm before applying the migration** (Task 1) and before enabling the `pg_cron` schedule / deploying the Edge Function (Task 6) — both touch the shared dev project.
3. **Manual end-to-end verification** (Task 8) needs a real inbox and a real test SOL, same caution as the dispatch-automation feature: use a test supplier/material with an email you control, never a real supplier, when testing.

## File Structure

New files:
- `supabase/migrations/0036_email_ingestions.sql`
- `supabase/functions/_shared/ai-provider.ts` (moved from `compare-quotations/ai-provider.ts`)
- `supabase/functions/_shared/ai-provider.test.ts` (moved from `compare-quotations/ai-provider.test.ts`)
- `supabase/functions/poll-supplier-quotes/matching.ts`
- `supabase/functions/poll-supplier-quotes/matching.test.ts`
- `supabase/functions/poll-supplier-quotes/index.ts`

Modified files:
- `supabase/functions/compare-quotations/index.ts` — import path update only.
- `apps/web/src/modules/quotations/api.ts` — new `fetchQuotationAttachmentUrl`.
- `apps/web/src/modules/quotations/queries.ts` — new `useViewQuotationPdf`.
- `apps/web/src/modules/quotations/NegotiatingRequestCard.tsx` + test — new "Ver PDF" link per quotation.
- `apps/web/src/modules/quotations/EmNegociacaoPage.tsx` — wires the new callback.

Removed files:
- `supabase/functions/compare-quotations/ai-provider.ts` (moved, not duplicated)
- `supabase/functions/compare-quotations/ai-provider.test.ts` (moved, not duplicated)

---

### Task 1: Migration — `quotations.source` and `email_ingestions`

**Files:**
- Create: `supabase/migrations/0036_email_ingestions.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Leitura automática de cotações por e-mail (spec em
-- docs/superpowers/specs/2026-09-19-leitura-automatica-cotacoes-design.md).
--
-- source: de onde a cotação veio — 'manual' (upload por alguém, como já
-- era) ou 'email_auto' (a Edge Function poll-supplier-quotes criou sozinha).
alter table quotations add column source text not null default 'manual'
  check (source in ('manual', 'email_auto'));

-- email_ingestions: registro de toda mensagem candidata (não lida, com PDF)
-- que a Edge Function poll-supplier-quotes examinou — casada ou não. Serve
-- de auditoria (o que aconteceu com cada e-mail) e de trava de idempotência
-- (única por gmail_message_id): se marcar como lida falhar depois de já
-- ter gravado a cotação, uma segunda tentativa encontra a linha aqui e não
-- duplica nada.
create table email_ingestions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  gmail_message_id text not null,
  from_email text not null,
  subject text,
  request_id uuid references requests(id),
  supplier_id uuid references suppliers(id),
  quotation_id uuid references quotations(id),
  status text not null check (status in ('matched', 'unmatched', 'error')),
  detail text,
  created_at timestamptz not null default now(),
  unique (tenant_id, gmail_message_id)
);
create index email_ingestions_tenant_id_idx on email_ingestions(tenant_id);

alter table email_ingestions enable row level security;
create policy "email_ingestions_select_own_tenant" on email_ingestions
  for select
  to authenticated
  using (tenant_id = current_tenant_id());
```

- [ ] **Step 2: Confirm with the user, then apply**

Ask the user before running this (it modifies the shared dev database). Once confirmed:

Run: `npm run db:migrate`
Expected: success output naming `0036_email_ingestions.sql` as applied.

Run: `npm run db:types`
Expected: `apps/web/src/types/database.ts` changes to include `source` on `quotations` and the new `email_ingestions` table.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0036_email_ingestions.sql apps/web/src/types/database.ts
git commit -m "feat(db): quotations.source e tabela email_ingestions para leitura automática de cotações"
```

---

### Task 2: Move `ai-provider.ts` to `_shared/`

**Files:**
- Create: `supabase/functions/_shared/ai-provider.ts` (moved content)
- Create: `supabase/functions/_shared/ai-provider.test.ts` (moved content)
- Delete: `supabase/functions/compare-quotations/ai-provider.ts`
- Delete: `supabase/functions/compare-quotations/ai-provider.test.ts`
- Modify: `supabase/functions/compare-quotations/index.ts`

No behavior change — this is a pure file move, needed because a second Edge Function (Task 4) is about to need the same `extractQuoteDataFromPdf` function, and Edge Functions in this repo don't import across each other's own directories (only from `_shared/`).

- [ ] **Step 1: Move the two files**

```bash
git mv supabase/functions/compare-quotations/ai-provider.ts supabase/functions/_shared/ai-provider.ts
git mv supabase/functions/compare-quotations/ai-provider.test.ts supabase/functions/_shared/ai-provider.test.ts
```

Their content does not change — `_shared/ai-provider.ts` and `_shared/ai-provider.test.ts` are byte-identical to the files they replace (the test file imports `from './ai-provider.ts'`, a relative import that still resolves correctly since both files moved together).

- [ ] **Step 2: Update the import in `compare-quotations/index.ts`**

Find:

```typescript
import { extractQuoteDataFromPdf } from './ai-provider.ts'
```

Replace with:

```typescript
import { extractQuoteDataFromPdf } from '../_shared/ai-provider.ts'
```

- [ ] **Step 3: Run the moved test and type-check both functions**

Run: `cd supabase/functions/_shared && deno test ai-provider.test.ts`
Expected: PASS, same tests as before (this file didn't change, only moved).

Run: `cd supabase/functions/compare-quotations && deno check index.ts`
Expected: no errors — confirms the updated import path resolves.

- [ ] **Step 4: Commit**

```bash
git add -A supabase/functions/_shared/ai-provider.ts supabase/functions/_shared/ai-provider.test.ts supabase/functions/compare-quotations/
git commit -m "refactor(functions): move ai-provider.ts para _shared, pra ser usado por uma segunda Edge Function"
```

---

### Task 3: Pure matching logic for `poll-supplier-quotes` (TDD)

**Files:**
- Create: `supabase/functions/poll-supplier-quotes/matching.ts`
- Test: `supabase/functions/poll-supplier-quotes/matching.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  base64UrlToBase64,
  matchExtractedItems,
  parseQuoteSubject,
  parseRequestNumber,
  type ExtractedQuoteItem,
  type QuoteRequestItem,
} from './matching.ts'

Deno.test('parseQuoteSubject extrai o número depois de "Cotação — "', () => {
  assertEquals(parseQuoteSubject('Cotação — 1243'), '1243')
})

Deno.test('parseQuoteSubject remove um "Re: " antes de casar', () => {
  assertEquals(parseQuoteSubject('Re: Cotação — 1243'), '1243')
})

Deno.test('parseQuoteSubject remove múltiplos prefixos Re:/Fwd: aninhados', () => {
  assertEquals(parseQuoteSubject('Fwd: Re: Fwd: Cotação — SOL 42'), 'SOL 42')
})

Deno.test('parseQuoteSubject aceita hífen simples além de travessão', () => {
  assertEquals(parseQuoteSubject('Cotação - 1243'), '1243')
})

Deno.test('parseQuoteSubject retorna null quando o assunto não bate com o padrão', () => {
  assertEquals(parseQuoteSubject('Segue orçamento em anexo'), null)
})

Deno.test('parseQuoteSubject retorna null quando não sobra número depois do padrão', () => {
  assertEquals(parseQuoteSubject('Cotação —   '), null)
})

Deno.test('parseRequestNumber reconhece o formato "SOL {sequência}"', () => {
  assertEquals(parseRequestNumber('SOL 42'), { sequenceNumber: 42 })
})

Deno.test('parseRequestNumber trata qualquer outro texto como número externo', () => {
  assertEquals(parseRequestNumber('1243'), { externalRef: '1243' })
})

Deno.test('parseRequestNumber retorna null pra string vazia', () => {
  assertEquals(parseRequestNumber('   '), null)
})

Deno.test('base64UrlToBase64 troca os caracteres e completa o padding', () => {
  // "hi" em base64url é "aGk" (sem padding); em base64 padrão é "aGk="
  assertEquals(base64UrlToBase64('aGk'), 'aGk=')
})

Deno.test('base64UrlToBase64 troca - e _ pelos caracteres padrão', () => {
  assertEquals(base64UrlToBase64('-_-_'), '+/+/')
})

const cimento: QuoteRequestItem = { id: 'ri1', materialName: 'Cimento CP-32', quantity: 50, unitOfMeasure: 'saco' }
const areia: QuoteRequestItem = { id: 'ri2', materialName: 'Areia', quantity: 10, unitOfMeasure: 'm³' }

Deno.test('matchExtractedItems casa por nome igual (confiança 1)', () => {
  const extracted: ExtractedQuoteItem[] = [
    { description: 'Cimento CP-32', quantity: 50, unitPrice: 32.5, leadTimeDays: 5 },
  ]
  const result = matchExtractedItems(extracted, [cimento, areia])
  assertEquals(result[0].requestItemId, 'ri1')
  assertEquals(result[0].confidence, 1)
})

Deno.test('matchExtractedItems não casa quando a descrição não tem nada em comum', () => {
  const extracted: ExtractedQuoteItem[] = [
    { description: 'Parafuso sextavado', quantity: 100, unitPrice: 0.5, leadTimeDays: 2 },
  ]
  const result = matchExtractedItems(extracted, [cimento, areia])
  assertEquals(result[0].requestItemId, null)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd supabase/functions/poll-supplier-quotes && deno test matching.test.ts`
Expected: FAIL — `matching.ts` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```typescript
export function parseQuoteSubject(subject: string): string | null {
  let stripped = subject.trim()
  const prefixPattern = /^(re|fwd|fw)\s*:\s*/i
  while (prefixPattern.test(stripped)) {
    stripped = stripped.replace(prefixPattern, '').trim()
  }
  const match = stripped.match(/^Cota[cç][aã]o\s*[—-]\s*(.+)$/i)
  if (!match) return null
  const number = match[1].trim()
  return number === '' ? null : number
}

export type ParsedRequestNumber = { externalRef: string } | { sequenceNumber: number }

export function parseRequestNumber(value: string): ParsedRequestNumber | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const solMatch = trimmed.match(/^SOL\s+(\d+)$/i)
  if (solMatch) return { sequenceNumber: Number(solMatch[1]) }
  return { externalRef: trimmed }
}

export function base64UrlToBase64(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddingNeeded = (4 - (base64.length % 4)) % 4
  return base64 + '='.repeat(paddingNeeded)
}

export interface QuoteRequestItem {
  id: string
  materialName: string
  quantity: number
  unitOfMeasure: string | null
}

export interface ExtractedQuoteItem {
  description: string
  quantity: number | null
  unitPrice: number
  leadTimeDays: number | null
}

export interface MatchedQuoteItem extends ExtractedQuoteItem {
  requestItemId: string | null
  confidence: number
}

const MATCH_THRESHOLD = 0.3

// Mesmo algoritmo de apps/web/src/modules/comparisons/matchExtractedItems.ts,
// duplicado aqui porque uma Edge Function não importa código do front — a
// duplicação é intencional (mesmo padrão já usado em dispatch-logic.ts).
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function similarity(a: string, b: string): number {
  const normalizedA = normalize(a)
  const normalizedB = normalize(b)

  if (normalizedA === normalizedB) return 1
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) return 0.8

  const wordsA = new Set(normalizedA.split(/\s+/).filter(Boolean))
  const wordsB = new Set(normalizedB.split(/\s+/).filter(Boolean))
  const intersection = [...wordsA].filter((word) => wordsB.has(word))
  const union = new Set([...wordsA, ...wordsB])

  return union.size === 0 ? 0 : intersection.length / union.size
}

export function matchExtractedItems(
  extractedItems: ExtractedQuoteItem[],
  requestItems: QuoteRequestItem[],
): MatchedQuoteItem[] {
  return extractedItems.map((extracted) => {
    let bestMatch: { requestItemId: string; confidence: number } | null = null

    for (const requestItem of requestItems) {
      const confidence = similarity(extracted.description, requestItem.materialName)
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { requestItemId: requestItem.id, confidence }
      }
    }

    const matched = bestMatch && bestMatch.confidence >= MATCH_THRESHOLD ? bestMatch : null

    return {
      ...extracted,
      requestItemId: matched?.requestItemId ?? null,
      confidence: matched?.confidence ?? 0,
    }
  })
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd supabase/functions/poll-supplier-quotes && deno test matching.test.ts`
Expected: PASS, all 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/poll-supplier-quotes/matching.ts supabase/functions/poll-supplier-quotes/matching.test.ts
git commit -m "feat(functions): lógica pura de casamento de e-mail de resposta com SOL/fornecedor"
```

---

### Task 4: `poll-supplier-quotes` Edge Function

**Files:**
- Create: `supabase/functions/poll-supplier-quotes/index.ts`

This task has no unit tests of its own — same convention as `review-request`/`compare-quotations`: the pure logic (Task 3) is tested, the orchestration handler that talks to Gmail and Supabase is verified manually (Task 8).

- [ ] **Step 1: Write the whole file**

```typescript
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { extractQuoteDataFromPdf } from '../_shared/ai-provider.ts'
import {
  base64UrlToBase64,
  matchExtractedItems,
  parseQuoteSubject,
  parseRequestNumber,
  type MatchedQuoteItem,
  type QuoteRequestItem,
} from './matching.ts'

// Protótipo: um tenant só (CLAUDE.md seção 1) — esta função roda por cron,
// sem usuário autenticado por trás, então não há de onde ler um tenant_id
// de sessão. Mesmo id fixo usado no seed de demonstração
// (supabase/seed/0001_demo.sql). Revisar quando a Fase 6 (segundo tenant)
// chegar.
const TENANT_ID = '00000000-0000-0000-0000-000000000001'

interface GmailHeader {
  name: string
  value: string
}

interface GmailMessagePart {
  mimeType?: string
  body?: { attachmentId?: string; size?: number }
  parts?: GmailMessagePart[]
}

interface GmailMessage {
  id: string
  payload: {
    headers: GmailHeader[]
    parts?: GmailMessagePart[]
  }
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GMAIL_OAUTH_CLIENT_ID')!
  const clientSecret = Deno.env.get('GMAIL_OAUTH_CLIENT_SECRET')!
  const refreshToken = Deno.env.get('GMAIL_OAUTH_REFRESH_TOKEN')!

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!response.ok) throw new Error(`Falha ao renovar token do Gmail: ${await response.text()}`)
  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

async function listCandidateMessageIds(accessToken: string): Promise<string[]> {
  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
  url.searchParams.set('q', 'is:unread has:attachment filename:pdf')
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) throw new Error(`Falha ao listar e-mails: ${await response.text()}`)
  const data = (await response.json()) as { messages?: { id: string }[] }
  return (data.messages ?? []).map((message) => message.id)
}

async function getMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) throw new Error(`Falha ao buscar e-mail ${messageId}: ${await response.text()}`)
  return response.json()
}

function findHeader(message: GmailMessage, name: string): string | null {
  const header = message.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
  return header?.value ?? null
}

function extractSenderEmail(fromHeader: string): string {
  const angleMatch = fromHeader.match(/<([^>]+)>/)
  return (angleMatch ? angleMatch[1] : fromHeader).trim().toLowerCase()
}

function findPdfAttachmentId(parts: GmailMessagePart[] | undefined): string | null {
  if (!parts) return null
  for (const part of parts) {
    if (part.mimeType === 'application/pdf' && part.body?.attachmentId) {
      return part.body.attachmentId
    }
    const nested = findPdfAttachmentId(part.parts)
    if (nested) return nested
  }
  return null
}

async function getAttachmentBase64(accessToken: string, messageId: string, attachmentId: string): Promise<string> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) throw new Error(`Falha ao baixar anexo: ${await response.text()}`)
  const data = (await response.json()) as { data: string }
  return base64UrlToBase64(data.data)
}

async function markMessageAsRead(accessToken: string, messageId: string): Promise<void> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  })
  if (!response.ok) throw new Error(`Falha ao marcar e-mail como lido: ${await response.text()}`)
}

interface IngestionExtra {
  requestId?: string
  supplierId?: string
  quotationId?: string
}

async function recordIngestion(
  adminClient: SupabaseClient,
  messageId: string,
  fromEmail: string,
  subject: string,
  status: 'matched' | 'unmatched' | 'error',
  detail: string | null,
  extra?: IngestionExtra,
): Promise<void> {
  await adminClient.from('email_ingestions').insert({
    tenant_id: TENANT_ID,
    gmail_message_id: messageId,
    from_email: fromEmail,
    subject,
    request_id: extra?.requestId ?? null,
    supplier_id: extra?.supplierId ?? null,
    quotation_id: extra?.quotationId ?? null,
    status,
    detail,
  })
}

async function processMessage(adminClient: SupabaseClient, accessToken: string, messageId: string): Promise<void> {
  const { data: existing } = await adminClient
    .from('email_ingestions')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('gmail_message_id', messageId)
    .maybeSingle()
  if (existing) return

  const message = await getMessage(accessToken, messageId)
  const fromEmail = extractSenderEmail(findHeader(message, 'From') ?? '')
  const subject = findHeader(message, 'Subject') ?? ''

  const parsedNumber = parseQuoteSubject(subject)
  if (!parsedNumber) {
    await recordIngestion(adminClient, messageId, fromEmail, subject, 'unmatched', 'Assunto não bate com o padrão "Cotação — {número}".')
    return
  }

  const requestNumber = parseRequestNumber(parsedNumber)
  if (!requestNumber) {
    await recordIngestion(adminClient, messageId, fromEmail, subject, 'unmatched', 'Número da SOL vazio após o assunto.')
    return
  }

  const baseRequestQuery = adminClient.from('requests').select('id').eq('tenant_id', TENANT_ID).is('deleted_at', null)
  const { data: requestRow } =
    'externalRef' in requestNumber
      ? await baseRequestQuery.eq('external_ref', requestNumber.externalRef).maybeSingle()
      : await baseRequestQuery.eq('sequence_number', requestNumber.sequenceNumber).maybeSingle()

  if (!requestRow) {
    await recordIngestion(adminClient, messageId, fromEmail, subject, 'unmatched', `SOL não encontrada para "${parsedNumber}".`)
    return
  }

  const { data: recipientRow } = await adminClient
    .from('request_dispatch_recipients')
    .select('supplier_id')
    .eq('request_id', requestRow.id)
    .ilike('email', fromEmail)
    .limit(1)
    .maybeSingle()

  if (!recipientRow) {
    await recordIngestion(
      adminClient,
      messageId,
      fromEmail,
      subject,
      'unmatched',
      `Remetente ${fromEmail} não bate com nenhum destinatário conhecido dessa SOL.`,
      { requestId: requestRow.id },
    )
    return
  }

  const attachmentId = findPdfAttachmentId(message.payload.parts)
  if (!attachmentId) {
    await recordIngestion(adminClient, messageId, fromEmail, subject, 'unmatched', 'Sem anexo PDF identificável no e-mail.', {
      requestId: requestRow.id,
      supplierId: recipientRow.supplier_id,
    })
    return
  }

  try {
    const pdfBase64 = await getAttachmentBase64(accessToken, messageId, attachmentId)

    const { data: requestItemsData, error: itemsError } = await adminClient
      .from('request_items')
      .select('id, quantity, unit_of_measure, deleted_at, materials(name)')
      .eq('request_id', requestRow.id)
      .is('deleted_at', null)
    if (itemsError) throw itemsError

    const requestItems: QuoteRequestItem[] = requestItemsData.map((item) => ({
      id: item.id,
      materialName: item.materials?.name ?? '',
      quantity: Number(item.quantity),
      unitOfMeasure: item.unit_of_measure,
    }))

    const { data: existingComparison } = await adminClient
      .from('comparisons')
      .select('id')
      .eq('request_id', requestRow.id)
      .is('deleted_at', null)
      .in('status', ['draft', 'pending_approval'])
      .maybeSingle()

    let comparisonId = existingComparison?.id as string | undefined
    if (!comparisonId) {
      const { data: createdComparison, error: comparisonError } = await adminClient
        .from('comparisons')
        .insert({ tenant_id: TENANT_ID, request_id: requestRow.id })
        .select('id')
        .single()
      if (comparisonError) throw comparisonError
      comparisonId = createdComparison.id
    }

    const { data: quotationRow, error: quotationError } = await adminClient
      .from('quotations')
      .insert({
        tenant_id: TENANT_ID,
        request_id: requestRow.id,
        supplier_id: recipientRow.supplier_id,
        status: 'pending',
        source: 'email_auto',
      })
      .select('id')
      .single()
    if (quotationError) throw quotationError
    const quotationId = quotationRow.id as string

    const storagePath = `${TENANT_ID}/${quotationId}/${Date.now()}-cotacao.pdf`
    const pdfBytes = Uint8Array.from(atob(pdfBase64), (char) => char.charCodeAt(0))
    const { error: uploadError } = await adminClient.storage
      .from('quotation-attachments')
      .upload(storagePath, pdfBytes, { contentType: 'application/pdf' })
    if (uploadError) throw uploadError

    const { error: attachmentError } = await adminClient.from('quotation_attachments').insert({
      tenant_id: TENANT_ID,
      quotation_id: quotationId,
      file_name: 'cotacao.pdf',
      storage_path: storagePath,
    })
    if (attachmentError) throw attachmentError

    const extracted = await extractQuoteDataFromPdf(pdfBase64)
    const reviewedItems = matchExtractedItems(extracted.items, requestItems)
    const matchedItems = reviewedItems.filter(
      (item): item is MatchedQuoteItem & { requestItemId: string } => item.requestItemId !== null,
    )

    const { data: insertedItems, error: quotationItemsError } = await adminClient
      .from('quotation_items')
      .insert(
        matchedItems.map((item) => ({
          tenant_id: TENANT_ID,
          quotation_id: quotationId,
          request_item_id: item.requestItemId,
          unit_price: item.unitPrice,
          lead_time_days: item.leadTimeDays,
        })),
      )
      .select('id, request_item_id')
    if (quotationItemsError) throw quotationItemsError

    const { error: linesError } = await adminClient.from('comparison_lines').insert(
      insertedItems.map((inserted, index) => ({
        tenant_id: TENANT_ID,
        comparison_id: comparisonId,
        request_item_id: inserted.request_item_id,
        quotation_item_id: inserted.id,
        extracted_by_ai: true,
        ai_confidence: matchedItems[index]?.confidence ?? null,
      })),
    )
    if (linesError) throw linesError

    const { error: updateQuotationError } = await adminClient
      .from('quotations')
      .update({
        status: 'received',
        submitted_at: new Date().toISOString(),
        freight_amount: extracted.freight,
        payment_terms: extracted.paymentTerms,
      })
      .eq('id', quotationId)
    if (updateQuotationError) throw updateQuotationError

    await recordIngestion(adminClient, messageId, fromEmail, subject, 'matched', null, {
      requestId: requestRow.id,
      supplierId: recipientRow.supplier_id,
      quotationId,
    })
  } catch (error) {
    await recordIngestion(
      adminClient,
      messageId,
      fromEmail,
      subject,
      'error',
      error instanceof Error ? error.message : 'Erro desconhecido.',
      { requestId: requestRow.id, supplierId: recipientRow.supplier_id },
    )
    // Não marca como lido — a próxima execução tenta de novo. A trava de
    // idempotência (checagem em email_ingestions, no topo desta função) só
    // vale depois que ESSE insert de status 'error' acontecer; ver a
    // limitação registrada na spec sobre falha parcial.
    throw error
  }

  await markMessageAsRead(accessToken, messageId)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const accessToken = await getAccessToken()
    const messageIds = await listCandidateMessageIds(accessToken)

    let processed = 0
    let failed = 0
    for (const messageId of messageIds) {
      try {
        await processMessage(adminClient, accessToken, messageId)
        processed++
      } catch (error) {
        failed++
        console.error(`Falha ao processar e-mail ${messageId}:`, error)
      }
    }

    return jsonResponse({ ok: true, candidates: messageIds.length, processed, failed }, 200)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500)
  }
})
```

- [ ] **Step 2: Type-check with Deno**

Run: `cd supabase/functions/poll-supplier-quotes && deno check index.ts`
Expected: no errors. Fix casting issues the same way already used elsewhere in this codebase (casting through `unknown` first) if PostgREST's generic embedded-relation typing complains — don't change the underlying logic to work around a type-check failure without understanding why first.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/poll-supplier-quotes/index.ts
git commit -m "feat(functions): poll-supplier-quotes — lê resposta de fornecedor por e-mail e alimenta a extração por IA"
```

---

### Task 5: "Ver PDF" in Em Negociação

**Files:**
- Modify: `apps/web/src/modules/quotations/api.ts`
- Modify: `apps/web/src/modules/quotations/queries.ts`
- Modify: `apps/web/src/modules/quotations/NegotiatingRequestCard.tsx`
- Modify: `apps/web/src/modules/quotations/NegotiatingRequestCard.test.tsx`
- Modify: `apps/web/src/modules/quotations/EmNegociacaoPage.tsx`

- [ ] **Step 1: `api.ts` — fetch the signed URL for a quotation's most recent attachment**

Read the current file first. Add, near the other fetch functions:

```typescript
export async function fetchQuotationAttachmentUrl(quotationId: string): Promise<string | null> {
  const { data: attachment, error: attachmentError } = await supabase
    .from('quotation_attachments')
    .select('storage_path')
    .eq('quotation_id', quotationId)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (attachmentError) throw attachmentError
  if (!attachment) return null

  const { data: signed, error: signError } = await supabase.storage
    .from('quotation-attachments')
    .createSignedUrl(attachment.storage_path, 60)
  if (signError) throw signError
  return signed.signedUrl
}
```

- [ ] **Step 2: `queries.ts` — mutation that fetches and opens the PDF**

Read the current file first, add the import for `fetchQuotationAttachmentUrl` to the existing `./api` import block (alphabetical position), then add:

```typescript
export function useViewQuotationPdf() {
  return useMutation({
    mutationFn: (quotationId: string) => fetchQuotationAttachmentUrl(quotationId),
    onSuccess: (url) => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    },
  })
}
```

- [ ] **Step 3: `NegotiatingRequestCard.test.tsx` — add a failing test**

Read the current file first. Add `onViewPdf: vi.fn(),` to `baseProps()`, right after `onDiscardQuotation: vi.fn(),`. Then add this test near "chama onDiscardQuotation ao descartar uma cotação":

```typescript
  it('chama onViewPdf ao clicar em Ver PDF de uma cotação', async () => {
    const user = userEvent.setup()
    const onViewPdf = vi.fn()
    render(<NegotiatingRequestCard {...baseProps()} onViewPdf={onViewPdf} />)
    await user.click(screen.getByRole('button', { name: /expandir/i }))
    await user.click(screen.getByRole('button', { name: /ver pdf de fornecedor alfa/i }))
    expect(onViewPdf).toHaveBeenCalledWith('q1')
  })
```

- [ ] **Step 4: Run to verify it fails**

Run: `npm run test -- NegotiatingRequestCard.test.tsx`
Expected: FAIL — `onViewPdf` isn't an accepted prop / the button doesn't exist yet.

- [ ] **Step 5: `NegotiatingRequestCard.tsx` — add the prop and the button**

Read the current file first. Add `onViewPdf: (quotationId: string) => void` to `NegotiatingRequestCardProps`, right after `onDiscardQuotation`. Add it to the destructured function params in the same position.

Find the quotations table's "Ações" cell:

```tsx
                      <td className="py-1">
                        {quotation.status !== 'discarded' && (
                          <button
                            type="button"
                            aria-label={`Descartar cotação de ${quotation.supplierName}`}
                            onClick={() => onDiscardQuotation(quotation.id)}
                            className="text-ink-muted hover:text-accent"
                          >
                            Descartar
                          </button>
                        )}
                      </td>
```

Replace with:

```tsx
                      <td className="py-1">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            aria-label={`Ver PDF de ${quotation.supplierName}`}
                            onClick={() => onViewPdf(quotation.id)}
                            className="text-ink-muted hover:text-ink"
                          >
                            Ver PDF
                          </button>
                          {quotation.status !== 'discarded' && (
                            <button
                              type="button"
                              aria-label={`Descartar cotação de ${quotation.supplierName}`}
                              onClick={() => onDiscardQuotation(quotation.id)}
                              className="text-ink-muted hover:text-accent"
                            >
                              Descartar
                            </button>
                          )}
                        </div>
                      </td>
```

- [ ] **Step 6: Run to verify it passes**

Run: `npm run test -- NegotiatingRequestCard.test.tsx`
Expected: PASS, all tests including the new one.

- [ ] **Step 7: `EmNegociacaoPage.tsx` — wire it up**

Read the current file first. Add `useViewQuotationPdf` to the `./queries` import block. Add, right after `const sendBackToDispatch = useSendBackToDispatch()`:

```typescript
  const viewQuotationPdf = useViewQuotationPdf()
```

On the `<NegotiatingRequestCard ... />` element, add the prop right after `onDiscardQuotation={...}`:

```tsx
              onDiscardQuotation={(quotationId) => discardQuotation.mutate(quotationId)}
              onViewPdf={(quotationId) => viewQuotationPdf.mutate(quotationId)}
```

- [ ] **Step 8: Full verification**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: all PASS. Report the total test count.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/modules/quotations/api.ts apps/web/src/modules/quotations/queries.ts apps/web/src/modules/quotations/NegotiatingRequestCard.tsx apps/web/src/modules/quotations/NegotiatingRequestCard.test.tsx apps/web/src/modules/quotations/EmNegociacaoPage.tsx
git commit -m "feat(quotations): link Ver PDF em Em Negociação, abre o anexo original da cotação"
```

---

### Task 6: Gmail OAuth setup, secrets, `pg_cron` schedule, deploy (manual, user-confirmed)

**Files:** none — operational steps.

- [ ] **Step 1: Create Google Cloud OAuth credentials**

Walk the user through this (or have them do it and report back the client ID/secret):

1. Go to https://console.cloud.google.com/, create a new project (or reuse one).
2. APIs & Services → Library → search "Gmail API" → Enable.
3. APIs & Services → OAuth consent screen → External (unless the account is Workspace) → fill the required fields (app name, support email) → add scope `https://www.googleapis.com/auth/gmail.modify` → add the Nexora Gmail address as a test user (consent screen stays in "Testing" mode, fine for a prototype — no Google review needed for internal/test use).
4. APIs & Services → Credentials → Create Credentials → OAuth client ID → Application type "Desktop app" → note the Client ID and Client Secret.

- [ ] **Step 2: Get a refresh token (one-time, run locally)**

Ask the user to run this in their own terminal (never paste the client secret into chat) — it opens a browser for them to log into the Nexora Gmail account and approve access, then prints a refresh token:

```bash
npx google-auth-library-cli
```

(If that specific package isn't available/maintained, the fallback is the manual OAuth2 "installed app" flow: build the authorization URL with `client_id`, `redirect_uri=http://localhost`, `scope=https://www.googleapis.com/auth/gmail.modify`, `access_type=offline`, `prompt=consent`; open it, log in, copy the `code` query param from the redirect; then `curl -X POST https://oauth2.googleapis.com/token -d client_id=... -d client_secret=... -d code=... -d grant_type=authorization_code -d redirect_uri=http://localhost` and read `refresh_token` from the JSON response. Confirm which path actually works at implementation time — this is the one step in this plan that depends on tooling availability at the moment it's run.)

- [ ] **Step 3: Set the secrets**

```bash
npx supabase secrets set GMAIL_OAUTH_CLIENT_ID="..." GMAIL_OAUTH_CLIENT_SECRET="..." GMAIL_OAUTH_REFRESH_TOKEN="..."
```

- [ ] **Step 4: Confirm with the user, then deploy the Edge Function**

```bash
npx supabase functions deploy poll-supplier-quotes
```

- [ ] **Step 5: Confirm with the user, then schedule the cron**

Run via `npx supabase db query --linked -f <file>` (same tool already used earlier in this project for manual SQL):

```sql
select cron.schedule(
  'poll-supplier-quotes',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := '<PROJECT_URL>/functions/v1/poll-supplier-quotes',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
  );
  $$
);
```

Replace `<PROJECT_URL>` with the linked project's URL and `<SERVICE_ROLE_KEY>` with its service role key (same value already used for `SUPABASE_SERVICE_ROLE_KEY` elsewhere in this project) — confirm both `pg_cron` and `pg_net` extensions are enabled first (`create extension if not exists pg_cron; create extension if not exists pg_net;`, both available on Supabase's free tier).

---

### Task 7: Manual verification

**Files:** none — manual check against the linked dev project and a real Gmail inbox.

- [ ] **Step 1: Happy path with a safe test SOL**

Using the exact same safe test-data pattern as the dispatch-automation feature (a throwaway material + a throwaway supplier whose contact email is one you control, linked via `request_dispatch_recipients` after actually going through the real dispatch flow so a real "Cotação — {number}" email goes out): reply to that dispatch email from the test supplier's inbox, attach a real-looking PDF quote. Trigger the function manually once instead of waiting for the cron: `curl -X POST <PROJECT_URL>/functions/v1/poll-supplier-quotes -H "Authorization: Bearer <SERVICE_ROLE_KEY>"`.

Expected: `email_ingestions` gets a `matched` row; `quotations` gets a new row with `source = 'email_auto'` and `status = 'received'`; `quotation_items`/`comparison_lines` are populated; opening Equalização for that SOL shows the new quotation's column already filled in, no manual import needed.

- [ ] **Step 2: Unmatched subject**

Send a PDF reply with a subject that doesn't match the pattern (e.g. "Segue anexo"). Expected: `email_ingestions` gets an `unmatched` row with a clear `detail`; nothing else changes; the email stays unread in Gmail.

- [ ] **Step 3: "Ver PDF" in Em Negociação**

For the quotation created in Step 1, go to Em Negociação, expand the request, click "Ver PDF" on that quotation's row. Expected: opens the original PDF in a new tab.

---

## Self-Review

**Spec coverage:** section 1 (Gmail OAuth) → Task 6; section 2 (cron) → Task 6; section 3 (Edge Function flow) → Tasks 3, 4; section 4 (confirmação automática) → Task 4; section 5 (`email_ingestions`) → Task 1; section 6 (`quotations.source`) → Task 1; section 7 ("Ver PDF") → Task 5; section 8 (limitações) → reflected in Task 4's error handling and Task 7's test cases.

**Placeholder scan:** no TBDs, except the OAuth refresh-token retrieval command in Task 6 Step 2, which is explicitly flagged as needing a tooling-availability check at implementation time (not a design ambiguity — the design doesn't depend on which specific CLI gets the token, only that a refresh token is obtained).

**Type consistency:** `QuoteRequestItem`/`ExtractedQuoteItem`/`MatchedQuoteItem` (Task 3) are used consistently in `poll-supplier-quotes/index.ts` (Task 4). `source: 'email_auto'` (Task 4's quotation insert) matches the check constraint added in Task 1. `email_ingestions` column names match between the migration (Task 1) and every insert in Task 4's `recordIngestion`.
