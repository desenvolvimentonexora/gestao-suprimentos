# Fidelidade Visual — Equalização de Orçamentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `apps/web/src/modules/comparisons` so the Equalização screen shows a setup view when no request is selected and a "calculada" view (identification header, toolbar, restructured table, observações) once one is — plus badge counts on the queue buttons and a stronger "melhor preço combinado" banner. Structure only — no client colors/names, no AI extraction changes, no two-step approval changes.

**Architecture:** Two new small presentational components (`ComparisonIdentificationHeader`, `ComparisonNotes`), a restructured `ComparisonTable` (two-row header, per-supplier V.Unit./Total subcolumns, reordered footer rows), one new DB column (`comparisons.notes`), and `ComparisonPage` reorganized around a single `!selectedRequest` conditional that already exists today (no new React state needed for the two-state toggle).

**Tech Stack:** React + TypeScript, Tailwind CSS, TanStack Query, Supabase, Vitest + Testing Library.

**Reference spec:** `docs/superpowers/specs/2026-09-18-equalizacao-fidelidade-design.md`

---

## Before you start

Task 1 applies a migration to the shared Supabase dev database — confirm with the user before running `npm run db:migrate`, same as any other shared-resource change. Task 9's `npm run lint`/`typecheck`/`test` are local and need no confirmation.

## File Structure

New files:
- `supabase/migrations/0035_comparisons_notes.sql`
- `apps/web/src/modules/comparisons/ComparisonNotes.tsx` + `.test.tsx`
- `apps/web/src/modules/comparisons/ComparisonIdentificationHeader.tsx` + `.test.tsx`

Modified files:
- `apps/web/src/modules/comparisons/types.ts` — `ComparableRequestRow` gains `sequenceNumber`, `createdByName`, `createdAt`, `notes`.
- `apps/web/src/modules/comparisons/api.ts` — `fetchComparableRequests` selects/maps the new fields; new `updateComparisonNotes`.
- `apps/web/src/modules/comparisons/queries.ts` — new `useUpdateComparisonNotes`.
- `apps/web/src/modules/comparisons/ComparisonTable.tsx` + `.test.tsx` — Und./Qtde. split, V.Unit./Total subcolumns, footer row reorder, banner restyle.
- `apps/web/src/modules/comparisons/ComparisonPage.tsx` — two-state layout, badge counts, wires the two new components.

---

### Task 1: Migration — `comparisons.notes`

**Files:**
- Create: `supabase/migrations/0035_comparisons_notes.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Fidelidade visual da Equalização — bloco "OBSERVAÇÕES" da própria
-- comparação (equalização), separado de requests.notes (Análise/Disparo)
-- e de suppliers.notes (outra entidade).
alter table comparisons add column notes text;
```

- [ ] **Step 2: Confirm with the user, then apply**

Ask the user before running this (it modifies the shared dev database). Once confirmed:

Run: `npm run db:migrate`
Expected output includes a success line naming `0035_comparisons_notes.sql` as applied (not `"Remote database is up to date."` — that would mean the file wasn't picked up).

Run: `npm run db:types`
Expected: `apps/web/src/types/database.ts` changes to include `notes` on the `comparisons` table type.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0035_comparisons_notes.sql apps/web/src/types/database.ts
git commit -m "feat(db): comparisons.notes para o bloco de observações da Equalização"
```

---

### Task 2: `types.ts` — extend `ComparableRequestRow`

**Files:**
- Modify: `apps/web/src/modules/comparisons/types.ts`

- [ ] **Step 1: Add the four fields**

Replace:

```typescript
export interface ComparableRequestRow {
  requestId: string
  unitName: string
  externalRef: string | null
  comparisonId: string | null
  comparisonStatus: ComparisonStatus | null
  winningQuotationId: string | null
  requestItems: ComparisonRequestItemRow[]
  quotations: ComparisonQuotationRow[]
}
```

with:

```typescript
export interface ComparableRequestRow {
  requestId: string
  unitName: string
  externalRef: string | null
  sequenceNumber: number | null
  comparisonId: string | null
  comparisonStatus: ComparisonStatus | null
  winningQuotationId: string | null
  createdByName: string | null
  createdAt: string | null
  notes: string | null
  requestItems: ComparisonRequestItemRow[]
  quotations: ComparisonQuotationRow[]
}
```

- [ ] **Step 2: Commit**

Nothing to run yet — this alone will not typecheck cleanly until Task 3 updates `api.ts` to return the new fields (`fetchComparableRequests` builds this exact object literal). Stage together with Task 3's commit instead of committing this file alone.

---

### Task 3: `api.ts` — extend `fetchComparableRequests`, add `updateComparisonNotes`

**Files:**
- Modify: `apps/web/src/modules/comparisons/api.ts`

- [ ] **Step 1: Replace `fetchComparableRequests`**

Read the current function first (it's the one right after the `fetchUserNames` helper near the top of the file) to confirm it matches, then replace it with:

```typescript
export async function fetchComparableRequests(): Promise<ComparableRequestRow[]> {
  const { data, error } = await supabase
    .from('requests')
    .select(
      'id, units(name), external_ref, sequence_number, request_items(id, quantity, unit_of_measure, deleted_at, materials(name)), quotations(id, status, deleted_at, freight_amount, payment_terms, delivery_days, suppliers(name), quotation_items(id, request_item_id, unit_price, lead_time_days))',
    )
    .eq('status', 'negotiating')
    .is('deleted_at', null)

  if (error) throw error

  const requestIds = data.map((row) => row.id)
  const { data: comparisonsData, error: comparisonsError } = await supabase
    .from('comparisons')
    .select('id, request_id, status, winning_quotation_id, created_by, created_at, notes')
    .in('request_id', requestIds.length > 0 ? requestIds : [''])
    .is('deleted_at', null)
    .in('status', ['draft', 'pending_approval'])

  if (comparisonsError) throw comparisonsError

  const namesByUserId = await fetchUserNames(comparisonsData.map((comparison) => comparison.created_by))

  const comparisonByRequestId = new Map(
    comparisonsData.map((comparison) => [
      comparison.request_id,
      {
        id: comparison.id,
        status: comparison.status as ComparisonStatus,
        winningQuotationId: comparison.winning_quotation_id,
        createdByName: comparison.created_by ? (namesByUserId.get(comparison.created_by) ?? null) : null,
        createdAt: comparison.created_at,
        notes: comparison.notes,
      },
    ]),
  )

  return data
    .map((row) => {
      const requestItems = row.request_items
        .filter((item) => !item.deleted_at)
        .map((item) => ({
          id: item.id,
          materialName: item.materials?.name ?? '',
          quantity: Number(item.quantity),
          unitOfMeasure: item.unit_of_measure,
        }))

      const quotations = row.quotations
        .filter((quotation) => !quotation.deleted_at && quotation.status === 'received')
        .map((quotation) => ({
          quotationId: quotation.id,
          supplierName: quotation.suppliers?.name ?? '',
          freight: quotation.freight_amount === null ? null : Number(quotation.freight_amount),
          paymentTerms: quotation.payment_terms,
          deliveryDays: quotation.delivery_days,
          prices: quotation.quotation_items.map((item) => ({
            requestItemId: item.request_item_id,
            quotationItemId: item.id,
            unitPrice: item.unit_price === null ? null : Number(item.unit_price),
            leadTimeDays: item.lead_time_days,
          })),
        }))

      const comparison = comparisonByRequestId.get(row.id) ?? null

      return {
        requestId: row.id,
        unitName: row.units?.name ?? '',
        externalRef: row.external_ref,
        sequenceNumber: row.sequence_number,
        comparisonId: comparison?.id ?? null,
        comparisonStatus: comparison?.status ?? null,
        winningQuotationId: comparison?.winningQuotationId ?? null,
        createdByName: comparison?.createdByName ?? null,
        createdAt: comparison?.createdAt ?? null,
        notes: comparison?.notes ?? null,
        requestItems,
        quotations,
      }
    })
    .filter((row) => row.quotations.length > 0)
}
```

- [ ] **Step 2: Add `updateComparisonNotes`**

Right after `updateQuotationTerms` (search for `export async function updateQuotationTerms`), add:

```typescript
export async function updateComparisonNotes(comparisonId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('comparisons')
    .update({ notes: notes.trim() === '' ? null : notes })
    .eq('id', comparisonId)
  if (error) throw error
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (this closes the gap left by Task 2 — `ComparableRequestRow`'s new fields are now actually populated).

- [ ] **Step 4: Commit (together with Task 2's change)**

```bash
git add apps/web/src/modules/comparisons/types.ts apps/web/src/modules/comparisons/api.ts
git commit -m "feat(comparisons): expõe sequenceNumber/createdByName/createdAt/notes da comparação"
```

---

### Task 4: `queries.ts` — `useUpdateComparisonNotes`

**Files:**
- Modify: `apps/web/src/modules/comparisons/queries.ts`

- [ ] **Step 1: Add `updateComparisonNotes` to the import from `./api`**

In the big import block at the top, add `updateComparisonNotes` alphabetically (between `updateQuotationTerms` — no wait, alphabetically `updateComparisonNotes` comes before `updateQuotationTerms`; insert it right before `updateQuotationTerms`):

```typescript
  setFinancialChargeRequested,
  updateComparisonNotes,
  updateQuotationTerms,
  uploadQuotationAttachment,
```

- [ ] **Step 2: Add the hook**

Right after `useUpdateQuotationTerms`, add:

```typescript
export function useUpdateComparisonNotes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ comparisonId, notes }: { comparisonId: string; notes: string }) =>
      updateComparisonNotes(comparisonId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparable-requests'] })
    },
  })
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/modules/comparisons/queries.ts
git commit -m "feat(comparisons): useUpdateComparisonNotes"
```

---

### Task 5: `ComparisonNotes` component (TDD)

**Files:**
- Create: `apps/web/src/modules/comparisons/ComparisonNotes.tsx`
- Test: `apps/web/src/modules/comparisons/ComparisonNotes.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ComparisonNotes } from './ComparisonNotes'

describe('ComparisonNotes', () => {
  it('mostra o texto salvo', () => {
    render(<ComparisonNotes notes="Confirmar consumo com o engenheiro" onUpdateNotes={vi.fn()} />)
    expect(screen.getByLabelText('Observações')).toHaveValue('Confirmar consumo com o engenheiro')
  })

  it('mostra vazio quando não há observação salva', () => {
    render(<ComparisonNotes notes={null} onUpdateNotes={vi.fn()} />)
    expect(screen.getByLabelText('Observações')).toHaveValue('')
  })

  it('chama onUpdateNotes ao sair do campo', async () => {
    const user = userEvent.setup()
    const onUpdateNotes = vi.fn()
    render(<ComparisonNotes notes={null} onUpdateNotes={onUpdateNotes} />)

    await user.type(screen.getByLabelText('Observações'), 'Pedido de complemento')
    await user.tab()

    expect(onUpdateNotes).toHaveBeenCalledWith('Pedido de complemento')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- ComparisonNotes.test.tsx`
Expected: FAIL — module `./ComparisonNotes` doesn't exist.

- [ ] **Step 3: Implement**

```typescript
import { useState } from 'react'

export interface ComparisonNotesProps {
  notes: string | null
  onUpdateNotes: (notes: string) => void
}

export function ComparisonNotes({ notes, onUpdateNotes }: ComparisonNotesProps) {
  const [draft, setDraft] = useState(notes ?? '')

  return (
    <div className="flex flex-col gap-1 rounded border border-line bg-surface p-4">
      <label htmlFor="comparison-notes" className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        Observações
      </label>
      <textarea
        id="comparison-notes"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onUpdateNotes(draft)}
        rows={3}
        className="rounded border border-line bg-bg px-3 py-2 text-sm text-ink"
      />
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- ComparisonNotes.test.tsx`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/comparisons/ComparisonNotes.tsx apps/web/src/modules/comparisons/ComparisonNotes.test.tsx
git commit -m "feat(comparisons): bloco de Observações da Equalização"
```

---

### Task 6: `ComparisonIdentificationHeader` component (TDD)

**Files:**
- Create: `apps/web/src/modules/comparisons/ComparisonIdentificationHeader.tsx`
- Test: `apps/web/src/modules/comparisons/ComparisonIdentificationHeader.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ComparisonIdentificationHeader } from './ComparisonIdentificationHeader'

function baseProps() {
  return {
    logoUrl: '/assets/logo-nexora.svg',
    brandName: 'Nexora',
    externalRef: '1243' as string | null,
    sequenceNumber: 42 as number | null,
    unitName: 'Depósito Simões Filho',
    createdByName: 'Maria Souza' as string | null,
    createdAt: '2026-09-18T12:00:00Z' as string | null,
  }
}

describe('ComparisonIdentificationHeader', () => {
  it('mostra o número da solicitação usando o número externo quando existe', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} />)
    expect(screen.getByText('SOLICITAÇÃO Nº 1243')).toBeInTheDocument()
  })

  it('cai pra "SOL {sequência}" sem número externo', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} externalRef={null} />)
    expect(screen.getByText('SOLICITAÇÃO Nº SOL 42')).toBeInTheDocument()
  })

  it('mostra o rótulo fixo do produto e o nome da unidade', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} />)
    expect(screen.getByText('Equalização de Orçamentos')).toBeInTheDocument()
    expect(screen.getByText('Depósito Simões Filho')).toBeInTheDocument()
  })

  it('mostra quem equalizou e a data formatada em pt-BR', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} />)
    expect(screen.getByText('EQUALIZADO POR Maria Souza')).toBeInTheDocument()
    expect(screen.getByText('18/09/2026')).toBeInTheDocument()
  })

  it('mostra travessão quando não há responsável', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} createdByName={null} />)
    expect(screen.getByText('EQUALIZADO POR —')).toBeInTheDocument()
  })

  it('mostra o logo da marca quando configurado', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/logo-nexora.svg')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- ComparisonIdentificationHeader.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement**

```typescript
import { formatSolNumber } from './formatSolNumber'

export interface ComparisonIdentificationHeaderProps {
  logoUrl: string | undefined
  brandName: string | undefined
  externalRef: string | null
  sequenceNumber: number | null
  unitName: string
  createdByName: string | null
  createdAt: string | null
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

export function ComparisonIdentificationHeader({
  logoUrl,
  brandName,
  externalRef,
  sequenceNumber,
  unitName,
  createdByName,
  createdAt,
}: ComparisonIdentificationHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        {logoUrl && <img src={logoUrl} alt={brandName ?? ''} className="h-6" />}
        <span className="text-sm font-medium text-ink">
          SOLICITAÇÃO Nº {formatSolNumber(externalRef, sequenceNumber)}
        </span>
      </div>

      <div className="flex flex-col items-center text-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Equalização de Orçamentos
        </span>
        <span className="text-sm text-ink">{unitName}</span>
      </div>

      <div className="flex flex-col items-end text-right text-xs text-ink-muted">
        <span>EQUALIZADO POR {createdByName ?? '—'}</span>
        {createdAt && <span>{formatDate(createdAt)}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- ComparisonIdentificationHeader.test.tsx`
Expected: PASS, 6/6.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/comparisons/ComparisonIdentificationHeader.tsx apps/web/src/modules/comparisons/ComparisonIdentificationHeader.test.tsx
git commit -m "feat(comparisons): cabeçalho de identificação da Equalização"
```

---

### Task 7: Restructure `ComparisonTable`

**Files:**
- Modify: `apps/web/src/modules/comparisons/ComparisonTable.tsx`
- Modify: `apps/web/src/modules/comparisons/ComparisonTable.test.tsx`

- [ ] **Step 1: Update the test file first**

Replace the whole file with:

```typescript
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ComparisonTable } from './ComparisonTable'
import type { ComparisonQuotationRow, ComparisonRequestItemRow } from './types'

const requestItems: ComparisonRequestItemRow[] = [
  { id: 'ri1', materialName: 'Argamassa', quantity: 20, unitOfMeasure: 'sc' },
  { id: 'ri2', materialName: 'Tintas', quantity: 5, unitOfMeasure: 'lt' },
]

const sika: ComparisonQuotationRow = {
  quotationId: 'q1',
  supplierName: 'Sika',
  freight: 0,
  paymentTerms: '30 dias',
  deliveryDays: 5,
  prices: [
    { requestItemId: 'ri1', quotationItemId: 'qi1', unitPrice: 30, leadTimeDays: 5 },
    { requestItemId: 'ri2', quotationItemId: 'qi2', unitPrice: 110, leadTimeDays: 5 },
  ],
}

const votorantim: ComparisonQuotationRow = {
  quotationId: 'q2',
  supplierName: 'Votorantim',
  freight: 0,
  paymentTerms: null,
  deliveryDays: 7,
  prices: [
    { requestItemId: 'ri1', quotationItemId: 'qi3', unitPrice: 25, leadTimeDays: 7 },
    { requestItemId: 'ri2', quotationItemId: 'qi4', unitPrice: 120, leadTimeDays: 4 },
  ],
}

function baseProps() {
  return {
    requestItems,
    quotations: [sika, votorantim],
    onWinnerChange: vi.fn(),
    onUpdateQuotationTerms: vi.fn(),
  }
}

describe('ComparisonTable', () => {
  it('mostra Descrição, Und. e Qtde. como colunas separadas', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText('Descrição')).toBeInTheDocument()
    expect(screen.getByText('Und.')).toBeInTheDocument()
    expect(screen.getByText('Qtde.')).toBeInTheDocument()

    const row = screen.getByText('Argamassa').closest('tr')
    expect(row).not.toBeNull()
    expect(within(row!).getByText('sc')).toBeInTheDocument()
    expect(within(row!).getByText('20')).toBeInTheDocument()
  })

  it('mostra V.Unit. e Total como subcolunas de cada fornecedor', () => {
    render(<ComparisonTable {...baseProps()} />)
    const unitHeaders = screen.getAllByText('V.Unit.')
    const totalHeaders = screen.getAllByText('Total')
    expect(unitHeaders).toHaveLength(2)
    // "Total" também aparece no rótulo da linha de rodapé — pelo menos 2 subcabeçalhos + 1 rótulo
    expect(totalHeaders.length).toBeGreaterThanOrEqual(3)
  })

  it('uma linha por item, com nome do fornecedor na coluna certa', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText('Sika')).toBeInTheDocument()
    expect(screen.getByText('Votorantim')).toBeInTheDocument()
    expect(screen.getByText('Argamassa')).toBeInTheDocument()
  })

  it('destaca visualmente a célula de menor preço unitário da linha', () => {
    render(<ComparisonTable {...baseProps()} />)
    const cheapestCell = screen.getByTestId('price-q2-ri1')
    const pricierCell = screen.getByTestId('price-q1-ri1')
    expect(cheapestCell.className).toContain('bg-badge-available/30')
    expect(pricierCell.className).not.toContain('bg-badge-available/30')
  })

  it('mostra o total por item (preço unitário × quantidade) na subcoluna Total', () => {
    render(<ComparisonTable {...baseProps()} />)
    // ri1 (20 un) a R$25 na Votorantim = R$500,00
    expect(screen.getByTestId('itemTotal-q2-ri1')).toHaveTextContent('R$ 500,00')
    // ri2 (5 un) a R$110 na Sika = R$550,00
    expect(screen.getByTestId('itemTotal-q1-ri2')).toHaveTextContent('R$ 550,00')
  })

  it('mostra a coluna "Melhor Forn." com o fornecedor e o preço mais barato de cada item', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText('Melhor Forn.')).toBeInTheDocument()
    const bestRi1 = screen.getByTestId('best-ri1')
    const bestRi2 = screen.getByTestId('best-ri2')
    expect(bestRi1).toHaveTextContent('Votorantim')
    expect(bestRi1).toHaveTextContent('R$ 25,00')
    expect(bestRi2).toHaveTextContent('Sika')
    expect(bestRi2).toHaveTextContent('R$ 110,00')
  })

  it('mostra — quando o fornecedor não cotou aquele item, no preço unitário e no total do item', () => {
    const partialQuotations: ComparisonQuotationRow[] = [
      { quotationId: 'q3', supplierName: 'Gama', freight: 0, paymentTerms: null, deliveryDays: null, prices: [] },
    ]
    render(<ComparisonTable {...baseProps()} quotations={partialQuotations} />)
    expect(screen.getByTestId('price-q3-ri1')).toHaveTextContent('—')
    expect(screen.getByTestId('itemTotal-q3-ri1')).toHaveTextContent('—')
  })

  it('mostra as linhas de Frete, Pagamento, Entrega e Total', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByText('Frete')).toBeInTheDocument()
    expect(screen.getByText('Pagamento')).toBeInTheDocument()
    expect(screen.getByText('Entrega (dias)')).toBeInTheDocument()
  })

  it('mostra as linhas de rodapé na ordem Frete, Total, Pagamento, Entrega', () => {
    const { container } = render(<ComparisonTable {...baseProps()} />)
    const footerLabels = [...container.querySelectorAll('tbody tr td:first-child')]
      .map((cell) => cell.textContent)
      .filter((text) => ['Frete', 'Total', 'Pagamento', 'Entrega (dias)'].includes(text ?? ''))
    expect(footerLabels).toEqual(['Frete', 'Total', 'Pagamento', 'Entrega (dias)'])
  })

  it('calcula o total de cada fornecedor somando itens e frete', () => {
    const withFreight = { ...sika, freight: 50 }
    render(<ComparisonTable {...baseProps()} quotations={[withFreight, votorantim]} />)
    // sika: 20*30 + 5*110 + 50 = 1200; votorantim: 20*25 + 5*120 = 1100
    expect(screen.getByTestId('total-q1')).toHaveTextContent('R$ 1.200,00')
    expect(screen.getByTestId('total-q2')).toHaveTextContent('R$ 1.100,00')
  })

  it('mostra — no total de um fornecedor que não cotou todos os itens', () => {
    const partial: ComparisonQuotationRow = {
      quotationId: 'q3',
      supplierName: 'Gama',
      freight: 0,
      paymentTerms: null,
      deliveryDays: null,
      prices: [{ requestItemId: 'ri1', quotationItemId: 'qi5', unitPrice: 10, leadTimeDays: 5 }],
    }
    render(<ComparisonTable {...baseProps()} quotations={[partial]} />)
    expect(screen.getByTestId('total-q3')).toHaveTextContent('—')
  })

  it('avisa o vencedor (menor total) ao renderizar', () => {
    const onWinnerChange = vi.fn()
    render(<ComparisonTable {...baseProps()} onWinnerChange={onWinnerChange} />)
    // sika: 20*30 + 5*110 = 1150; votorantim: 20*25 + 5*120 = 1100 (menor)
    expect(onWinnerChange).toHaveBeenCalledWith('q2')
  })

  it('destaca a célula de Total do fornecedor vencedor', () => {
    render(<ComparisonTable {...baseProps()} />)
    expect(screen.getByTestId('total-q2').className).toContain('bg-blue-900')
    expect(screen.getByTestId('total-q1').className).not.toContain('bg-blue-900')
  })

  it('exclui um fornecedor da comparação e recalcula o vencedor', async () => {
    const user = userEvent.setup()
    const onWinnerChange = vi.fn()
    render(<ComparisonTable {...baseProps()} onWinnerChange={onWinnerChange} />)

    await user.click(screen.getByRole('button', { name: /excluir votorantim/i }))

    expect(onWinnerChange).toHaveBeenLastCalledWith('q1')
  })

  it('mostra a faixa de melhor preço combinado com o total do vencedor, com destaque forte do tema', () => {
    render(<ComparisonTable {...baseProps()} />)
    const banner = screen.getByText(/melhor preço combinado/i).closest('div')
    expect(banner).toHaveTextContent('R$ 1.100,00')
    expect(banner!.className).toContain('bg-gradient-to-r')
    expect(banner!.className).toContain('text-on-primary')
  })

  it('não mostra a faixa de melhor preço combinado quando nenhum fornecedor cotou todos os itens', () => {
    const partial: ComparisonQuotationRow = {
      quotationId: 'q3',
      supplierName: 'Gama',
      freight: 0,
      paymentTerms: null,
      deliveryDays: null,
      prices: [{ requestItemId: 'ri1', quotationItemId: 'qi5', unitPrice: 10, leadTimeDays: 5 }],
    }
    render(<ComparisonTable {...baseProps()} quotations={[partial]} />)
    expect(screen.queryByText(/melhor preço combinado/i)).not.toBeInTheDocument()
  })

  it('chama onUpdateQuotationTerms ao editar o frete de um fornecedor', async () => {
    const user = userEvent.setup()
    const onUpdateQuotationTerms = vi.fn()
    render(<ComparisonTable {...baseProps()} onUpdateQuotationTerms={onUpdateQuotationTerms} />)

    const freightInput = screen.getByLabelText(/frete sika/i)
    await user.clear(freightInput)
    await user.type(freightInput, '80')
    await user.tab()

    expect(onUpdateQuotationTerms).toHaveBeenCalledWith('q1', {
      freight: 80,
      paymentTerms: '30 dias',
      deliveryDays: 5,
    })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- ComparisonTable.test.tsx`
Expected: FAIL — the new column-split tests, `itemTotal-*` testids, and footer-order test fail against the current implementation (existing tests referring to unchanged behavior still pass).

- [ ] **Step 3: Replace `ComparisonTable.tsx`**

```typescript
import { Fragment, useEffect, useState } from 'react'
import { Card } from '../../components'
import { getCheapestQuotationId, getQuotationTotal } from './combinedPrice'
import { getSupplierColor } from './supplierColor'
import type { ComparisonQuotationRow, ComparisonRequestItemRow } from './types'

export interface QuotationTerms {
  freight: number | null
  paymentTerms: string | null
  deliveryDays: number | null
}

export interface ComparisonTableProps {
  requestItems: ComparisonRequestItemRow[]
  quotations: ComparisonQuotationRow[]
  onWinnerChange: (quotationId: string | null) => void
  onUpdateQuotationTerms: (quotationId: string, terms: QuotationTerms) => void
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const COLUMN_DIVIDER = 'border-l border-line'

function parseNumberInput(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

export function ComparisonTable({
  requestItems,
  quotations,
  onWinnerChange,
  onUpdateQuotationTerms,
}: ComparisonTableProps) {
  const [excludedQuotationIds, setExcludedQuotationIds] = useState<string[]>([])

  function priceFor(quotation: ComparisonQuotationRow, requestItemId: string) {
    return quotation.prices.find((price) => price.requestItemId === requestItemId) ?? null
  }

  function cheapestPriceFor(requestItemId: string): number | null {
    const prices = quotations
      .map((quotation) => priceFor(quotation, requestItemId)?.unitPrice ?? null)
      .filter((price): price is number => price !== null)
    return prices.length > 0 ? Math.min(...prices) : null
  }

  function cheapestSupplierFor(requestItemId: string): { supplierName: string; unitPrice: number } | null {
    let cheapest: { supplierName: string; unitPrice: number } | null = null
    for (const quotation of quotations) {
      const price = priceFor(quotation, requestItemId)
      if (price?.unitPrice == null) continue
      if (!cheapest || price.unitPrice < cheapest.unitPrice) {
        cheapest = { supplierName: quotation.supplierName, unitPrice: price.unitPrice }
      }
    }
    return cheapest
  }

  const winningQuotationId = getCheapestQuotationId(requestItems, quotations, excludedQuotationIds)

  useEffect(() => {
    onWinnerChange(winningQuotationId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve disparar quando o vencedor calculado muda, não a cada render
  }, [winningQuotationId])

  function toggleExcluded(quotationId: string) {
    setExcludedQuotationIds((current) =>
      current.includes(quotationId) ? current.filter((id) => id !== quotationId) : [...current, quotationId],
    )
  }

  const winningQuotation = quotations.find((quotation) => quotation.quotationId === winningQuotationId) ?? null
  const combinedBestPrice = winningQuotation ? getQuotationTotal(requestItems, winningQuotation) : null

  return (
    <Card className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th rowSpan={2} className="py-2 pr-4 font-medium">
                Descrição
              </th>
              <th rowSpan={2} className={`${COLUMN_DIVIDER} px-3 py-2 font-medium`}>
                Und.
              </th>
              <th rowSpan={2} className={`${COLUMN_DIVIDER} px-3 py-2 font-medium`}>
                Qtde.
              </th>
              {quotations.map((quotation) => {
                const isExcluded = excludedQuotationIds.includes(quotation.quotationId)
                const color = getSupplierColor(quotation.quotationId)
                return (
                  <th
                    key={quotation.quotationId}
                    colSpan={2}
                    className={`${COLUMN_DIVIDER} px-3 py-2 font-medium ${isExcluded ? 'bg-surface text-ink-muted opacity-40' : color.header}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{quotation.supplierName}</span>
                      <button
                        type="button"
                        onClick={() => toggleExcluded(quotation.quotationId)}
                        aria-label={
                          isExcluded ? `Reincluir ${quotation.supplierName}` : `Excluir ${quotation.supplierName}`
                        }
                        className="rounded px-1 text-ink-muted hover:bg-white/50"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                )
              })}
              <th rowSpan={2} className={`${COLUMN_DIVIDER} py-2 px-3 font-medium`}>
                Melhor Forn.
              </th>
            </tr>
            <tr className="border-b border-line text-ink-muted">
              {quotations.map((quotation) => (
                <Fragment key={quotation.quotationId}>
                  <th className={`${COLUMN_DIVIDER} px-3 py-1 text-xs font-medium`}>V.Unit.</th>
                  <th className="px-3 py-1 text-xs font-medium">Total</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {requestItems.map((item) => {
              const cheapest = cheapestPriceFor(item.id)
              const bestSupplier = cheapestSupplierFor(item.id)
              return (
                <tr key={item.id} className="border-b border-line">
                  <td className="py-2.5 pr-4 text-ink">{item.materialName}</td>
                  <td className={`${COLUMN_DIVIDER} px-3 py-2.5 text-ink-muted`}>{item.unitOfMeasure ?? '—'}</td>
                  <td className={`${COLUMN_DIVIDER} px-3 py-2.5 text-ink-muted`}>{item.quantity}</td>
                  {quotations.map((quotation) => {
                    const isExcluded = excludedQuotationIds.includes(quotation.quotationId)
                    const price = priceFor(quotation, item.id)
                    const isCheapest =
                      price?.unitPrice !== null && price?.unitPrice !== undefined && price.unitPrice === cheapest
                    const itemTotal = price?.unitPrice != null ? price.unitPrice * item.quantity : null
                    const cellClasses = `${isExcluded ? 'opacity-40' : ''} ${isCheapest ? 'bg-badge-available/30 font-semibold text-ink' : 'text-ink-muted'}`
                    return (
                      <Fragment key={quotation.quotationId}>
                        <td
                          data-testid={`price-${quotation.quotationId}-${item.id}`}
                          className={`${COLUMN_DIVIDER} px-3 py-2.5 ${cellClasses}`}
                        >
                          {price?.unitPrice == null ? '—' : currencyFormatter.format(price.unitPrice)}
                        </td>
                        <td
                          data-testid={`itemTotal-${quotation.quotationId}-${item.id}`}
                          className={`px-3 py-2.5 ${cellClasses}`}
                        >
                          {itemTotal === null ? '—' : currencyFormatter.format(itemTotal)}
                        </td>
                      </Fragment>
                    )
                  })}
                  <td
                    data-testid={`best-${item.id}`}
                    className={`${COLUMN_DIVIDER} bg-ink px-3 py-2.5 font-medium text-white`}
                  >
                    {bestSupplier
                      ? `${bestSupplier.supplierName} — ${currencyFormatter.format(bestSupplier.unitPrice)}`
                      : '—'}
                  </td>
                </tr>
              )
            })}

            <tr className="border-b border-line bg-bg/60">
              <td colSpan={3} className="py-2.5 pr-4 text-ink-muted">
                Frete
              </td>
              {quotations.map((quotation) => (
                <td key={quotation.quotationId} colSpan={2} className={`${COLUMN_DIVIDER} px-3 py-2`}>
                  <input
                    type="number"
                    defaultValue={quotation.freight ?? ''}
                    aria-label={`Frete ${quotation.supplierName}`}
                    className="w-24 rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
                    onBlur={(e) =>
                      onUpdateQuotationTerms(quotation.quotationId, {
                        freight: parseNumberInput(e.target.value),
                        paymentTerms: quotation.paymentTerms,
                        deliveryDays: quotation.deliveryDays,
                      })
                    }
                  />
                </td>
              ))}
              <td className={COLUMN_DIVIDER} />
            </tr>

            <tr>
              <td colSpan={3} className="py-2.5 pr-4 font-medium text-ink">
                Total
              </td>
              {quotations.map((quotation) => {
                const total = getQuotationTotal(requestItems, quotation)
                const isWinner = quotation.quotationId === winningQuotationId
                return (
                  <td
                    key={quotation.quotationId}
                    data-testid={`total-${quotation.quotationId}`}
                    colSpan={2}
                    className={`${COLUMN_DIVIDER} px-3 py-2.5 font-semibold ${isWinner ? 'rounded bg-blue-900 text-white' : 'text-ink'}`}
                  >
                    {total === null ? '—' : currencyFormatter.format(total)}
                  </td>
                )
              })}
              <td className={COLUMN_DIVIDER} />
            </tr>

            <tr className="border-b border-line bg-bg/60">
              <td colSpan={3} className="py-2.5 pr-4 text-ink-muted">
                Pagamento
              </td>
              {quotations.map((quotation) => (
                <td key={quotation.quotationId} colSpan={2} className={`${COLUMN_DIVIDER} px-3 py-2`}>
                  <input
                    type="text"
                    defaultValue={quotation.paymentTerms ?? ''}
                    aria-label={`Pagamento ${quotation.supplierName}`}
                    className="w-32 rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
                    onBlur={(e) =>
                      onUpdateQuotationTerms(quotation.quotationId, {
                        freight: quotation.freight,
                        paymentTerms: e.target.value.trim() === '' ? null : e.target.value,
                        deliveryDays: quotation.deliveryDays,
                      })
                    }
                  />
                </td>
              ))}
              <td className={COLUMN_DIVIDER} />
            </tr>

            <tr className="border-b border-line bg-bg/60">
              <td colSpan={3} className="py-2.5 pr-4 text-ink-muted">
                Entrega (dias)
              </td>
              {quotations.map((quotation) => (
                <td key={quotation.quotationId} colSpan={2} className={`${COLUMN_DIVIDER} px-3 py-2`}>
                  <input
                    type="number"
                    defaultValue={quotation.deliveryDays ?? ''}
                    aria-label={`Entrega ${quotation.supplierName}`}
                    className="w-20 rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
                    onBlur={(e) =>
                      onUpdateQuotationTerms(quotation.quotationId, {
                        freight: quotation.freight,
                        paymentTerms: quotation.paymentTerms,
                        deliveryDays: parseNumberInput(e.target.value),
                      })
                    }
                  />
                </td>
              ))}
              <td className={COLUMN_DIVIDER} />
            </tr>
          </tbody>
        </table>
      </div>

      {combinedBestPrice !== null && (
        <div className="rounded bg-gradient-to-r from-primary-dark to-primary px-4 py-3 text-base font-semibold text-on-primary">
          🏆 Melhor preço combinado: {currencyFormatter.format(combinedBestPrice)}
        </div>
      )}
    </Card>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- ComparisonTable.test.tsx`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/comparisons/ComparisonTable.tsx apps/web/src/modules/comparisons/ComparisonTable.test.tsx
git commit -m "feat(comparisons): tabela com Und./Qtde., V.Unit./Total por fornecedor, Total logo após Frete, e faixa de melhor preço com mais destaque"
```

---

### Task 8: `ComparisonPage` — two states, badge counts, wire the new pieces

**Files:**
- Modify: `apps/web/src/modules/comparisons/ComparisonPage.tsx`

No test file exists for this page today (same pattern as `AnaliseSolicitacoesPage.tsx`/`DisparoSolicitacoesPage.tsx`) — verified manually in Task 9.

- [ ] **Step 1: Replace the whole file**

```typescript
import { useEffect, useState } from 'react'
import { ClipboardCheck, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, ComingSoonButton, Modal } from '../../components'
import { useSettings } from '../../core/config'
import { useUserPermissions } from '../../core/permissions'
import { ComparisonIdentificationHeader } from './ComparisonIdentificationHeader'
import { ComparisonNotes } from './ComparisonNotes'
import { ComparisonTable } from './ComparisonTable'
import { HistoryList } from './HistoryList'
import { ImportQuotationPdfModal } from './ImportQuotationPdfModal'
import { OrdersQueueModal } from './OrdersQueueModal'
import { PendingApprovalsSection } from './PendingApprovalsSection'
import { PendingReleaseSection } from './PendingReleaseSection'
import { SourceCards } from './SourceCards'
import {
  useComparableRequests,
  useGetOrCreateDraftComparison,
  useHistory,
  usePendingApprovals,
  usePendingReleases,
  useReleasedAwaitingOrder,
  useSendToApproval,
  useSetComparisonWinner,
  useUpdateComparisonNotes,
  useUpdateQuotationTerms,
} from './queries'

type QueueView = 'approvals' | 'releases' | 'orders' | 'history' | null

export interface ComparisonPageProps {
  tenantId: string
  userId: string
}

function queueLabel(label: string, count: number | undefined): string {
  return count === undefined ? label : `${label} (${count})`
}

export function ComparisonPage({ tenantId, userId }: ComparisonPageProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [createdComparisonIds, setCreatedComparisonIds] = useState<Record<string, string>>({})
  const [importOpen, setImportOpen] = useState(false)
  const [queueView, setQueueView] = useState<QueueView>(null)

  const settingsQuery = useSettings(tenantId)
  const requestsQuery = useComparableRequests()
  const getOrCreateDraftComparison = useGetOrCreateDraftComparison(tenantId, userId)
  const setComparisonWinner = useSetComparisonWinner(tenantId)
  const updateQuotationTerms = useUpdateQuotationTerms()
  const updateComparisonNotes = useUpdateComparisonNotes()
  const sendToApproval = useSendToApproval()
  const permissionsQuery = useUserPermissions(userId)
  const canApprove = (permissionsQuery.data ?? []).includes('comparisons.approve')
  const pendingApprovalsQuery = usePendingApprovals(canApprove)
  const pendingReleasesQuery = usePendingReleases(canApprove)
  const releasedAwaitingOrderQuery = useReleasedAwaitingOrder(true)
  const historyQuery = useHistory(true)

  const requests = requestsQuery.data ?? []
  const selectedRequest = requests.find((request) => request.requestId === selectedRequestId) ?? null
  const resolvedComparisonId =
    selectedRequest?.comparisonId ??
    (selectedRequest ? (createdComparisonIds[selectedRequest.requestId] ?? null) : null)

  useEffect(() => {
    if (!selectedRequest || selectedRequest.comparisonId || createdComparisonIds[selectedRequest.requestId]) {
      return
    }
    getOrCreateDraftComparison.mutate(selectedRequest.requestId, {
      onSuccess: (comparisonId) =>
        setCreatedComparisonIds((current) => ({ ...current, [selectedRequest.requestId]: comparisonId })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve rodar quando a requisição selecionada muda, não a cada render do mutation
  }, [selectedRequest?.requestId, selectedRequest?.comparisonId])

  const hasWinner = Boolean(selectedRequest?.winningQuotationId)

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-gradient-to-b from-primary-dark to-primary px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <Link to="/suprimentos" className="text-sm text-on-primary hover:underline">
            ← Suprimentos
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-on-primary">Nova Equalização</h1>

          <div className="mt-4 flex flex-wrap gap-2">
            {canApprove && (
              <Button
                variant={queueView === 'approvals' ? 'primary' : 'on-primary'}
                onClick={() => setQueueView(queueView === 'approvals' ? null : 'approvals')}
              >
                {queueLabel('Fila de Aprovações', pendingApprovalsQuery.data?.length)}
              </Button>
            )}
            {canApprove && (
              <Button
                variant={queueView === 'releases' ? 'primary' : 'on-primary'}
                onClick={() => setQueueView(queueView === 'releases' ? null : 'releases')}
              >
                {queueLabel('Fila de Alterações', pendingReleasesQuery.data?.length)}
              </Button>
            )}
            <Button
              variant={queueView === 'orders' ? 'primary' : 'on-primary'}
              onClick={() => setQueueView(queueView === 'orders' ? null : 'orders')}
            >
              {queueLabel('Fila de Pedidos', releasedAwaitingOrderQuery.data?.length)}
            </Button>
            <Button
              variant={queueView === 'history' ? 'primary' : 'on-primary'}
              onClick={() => setQueueView(queueView === 'history' ? null : 'history')}
            >
              {queueLabel('Histórico', historyQuery.data?.length)}
            </Button>
          </div>
        </div>
      </div>

      {canApprove && (
        <Modal
          isOpen={queueView === 'approvals'}
          onClose={() => setQueueView(null)}
          title="Fila de Aprovações"
          icon={ClipboardCheck}
          titleClassName="text-amber-800"
        >
          <PendingApprovalsSection />
        </Modal>
      )}

      {canApprove && (
        <Modal
          isOpen={queueView === 'releases'}
          onClose={() => setQueueView(null)}
          title="Fila de Alterações"
          icon={Pencil}
          titleClassName="text-blue-700"
        >
          <PendingReleaseSection />
        </Modal>
      )}

      <OrdersQueueModal isOpen={queueView === 'orders'} onClose={() => setQueueView(null)} tenantId={tenantId} />

      <Modal isOpen={queueView === 'history'} onClose={() => setQueueView(null)} title="Histórico">
        <HistoryList rows={historyQuery.data ?? []} />
      </Modal>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {!selectedRequest && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="border-primary">
                <p className="text-sm font-medium text-ink">Equalização Padrão</p>
                <p className="text-xs text-ink-muted">Compare cotações item a item.</p>
              </Card>
              <Card className="opacity-50">
                <p className="text-sm font-medium text-ink">Detalhada (Itens A)</p>
                <p className="text-xs text-ink-muted">Em breve — depende de classificação por curva ABC.</p>
              </Card>
              <Card className="opacity-50">
                <p className="text-sm font-medium text-ink">Pela Concorrência</p>
                <p className="text-xs text-ink-muted">Em breve — módulo futuro do roadmap.</p>
              </Card>
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm text-ink-muted opacity-50">
              <input type="checkbox" disabled />
              Anexar foto do produto por fornecedor (Decoração)
            </label>
          </>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-2">
            {requests.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhuma requisição com cotações para comparar no momento.</p>
            ) : (
              requests.map((request) => (
                <button
                  key={request.requestId}
                  type="button"
                  onClick={() => setSelectedRequestId(request.requestId)}
                  className={`flex flex-col items-start rounded border px-3 py-2 text-left text-sm ${
                    selectedRequestId === request.requestId
                      ? 'border-primary bg-bg'
                      : 'border-line bg-surface hover:bg-bg'
                  }`}
                >
                  <span className="font-medium text-ink">{request.unitName}</span>
                  <span className="text-xs text-ink-muted">
                    {request.externalRef ?? '—'} · {request.quotations.length} cotações
                  </span>
                  {request.comparisonStatus === 'pending_approval' && (
                    <Badge className="mt-1">Aguardando aprovação</Badge>
                  )}
                </button>
              ))
            )}
          </div>

          <div>
            {!selectedRequest ? (
              <p className="text-sm text-ink-muted">Selecione uma requisição para comparar.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <ComparisonIdentificationHeader
                  logoUrl={settingsQuery.data?.brand.logoUrl}
                  brandName={settingsQuery.data?.brand.name}
                  externalRef={selectedRequest.externalRef}
                  sequenceNumber={selectedRequest.sequenceNumber}
                  unitName={selectedRequest.unitName}
                  createdByName={selectedRequest.createdByName}
                  createdAt={selectedRequest.createdAt}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-ink">{selectedRequest.unitName}</h2>
                  <div className="flex flex-wrap gap-2">
                    <ComingSoonButton label="Imprimir" variant="secondary" />
                    <ComingSoonButton label="Excel" variant="secondary" />
                    <ComingSoonButton label="Pedido" variant="secondary" />
                    <ComingSoonButton label="Editar" variant="secondary" />
                    <Button
                      variant="accent"
                      disabled={
                        !(
                          Boolean(resolvedComparisonId) &&
                          hasWinner &&
                          selectedRequest.comparisonStatus !== 'pending_approval'
                        )
                      }
                      onClick={() => {
                        if (!resolvedComparisonId) return
                        sendToApproval.mutate(resolvedComparisonId)
                      }}
                    >
                      Enviar p/ Aprovação
                    </Button>
                    <ComingSoonButton label="Nova" variant="secondary" />
                  </div>
                </div>

                <SourceCards
                  itemCount={selectedRequest.requestItems.length}
                  quotations={selectedRequest.quotations}
                  onAddQuotation={() => setImportOpen(true)}
                />

                <ComparisonTable
                  requestItems={selectedRequest.requestItems}
                  quotations={selectedRequest.quotations}
                  onWinnerChange={(quotationId) => {
                    if (!resolvedComparisonId) return
                    const quotation =
                      selectedRequest.quotations.find((q) => q.quotationId === quotationId) ?? null
                    setComparisonWinner.mutate({
                      comparisonId: resolvedComparisonId,
                      quotation,
                      requestItems: selectedRequest.requestItems,
                    })
                  }}
                  onUpdateQuotationTerms={(quotationId, terms) => {
                    updateQuotationTerms.mutate({ quotationId, terms })
                  }}
                />

                {resolvedComparisonId && (
                  <ComparisonNotes
                    notes={selectedRequest.notes}
                    onUpdateNotes={(notes) =>
                      updateComparisonNotes.mutate({ comparisonId: resolvedComparisonId, notes })
                    }
                  />
                )}

                {resolvedComparisonId && (
                  <ImportQuotationPdfModal
                    isOpen={importOpen}
                    onClose={() => setImportOpen(false)}
                    tenantId={tenantId}
                    requestId={selectedRequest.requestId}
                    comparisonId={resolvedComparisonId}
                    requestItems={selectedRequest.requestItems}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run lint, typecheck and tests**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/comparisons/ComparisonPage.tsx
git commit -m "feat(comparisons): estados setup/calculada, contadores de fila e cabeçalho/observações na Equalização"
```

---

### Task 9: Manual verification

**Files:** none — manual check against the running app.

- [ ] **Step 1: Setup state**

Run `npm run dev`, go to Suprimentos → Equalização de Orçamentos. With no requisição selected: confirm the 3 type cards + the "Anexar foto" checkbox show, and the queue buttons at top show counts (e.g. "Fila de Pedidos (N)") if there's any data.

- [ ] **Step 2: Calculada state**

Select a requisição from the left list. Confirm: type cards + checkbox disappear; the identification header shows (logo if configured, "SOLICITAÇÃO Nº ...", "EQUALIZAÇÃO DE ORÇAMENTOS" + unit name, "EQUALIZADO POR ..." + date); the table shows Descrição/Und./Qtde. as separate columns and V.Unit./Total per supplier; footer rows read Frete → Total → Pagamento → Entrega; the melhor-preço banner is a solid degradê stripe; an Observações textarea appears below the table and persists text across a page reload (saves on blur).

- [ ] **Step 3: Responsive check**

Resize to ~360px width — the table should scroll horizontally (`overflow-x-auto`), not overflow the page; the identification header should wrap its three blocks instead of overflowing.

---

## Self-Review

**Spec coverage:** section 1 (two states) → Task 8; section 2 (identification header) → Tasks 2, 3, 6, 8; section 3 (queue counts) → Task 8; section 4 (table restructure) → Task 7; section 5 (observações) → Tasks 1, 3, 4, 5, 8; section 6 (melhor preço banner) → Task 7.

**Placeholder scan:** no TBDs — every step has real code or an exact command with expected output.

**Type consistency:** `ComparableRequestRow.notes`/`.createdByName`/`.createdAt`/`.sequenceNumber` (Task 2) match exactly what `fetchComparableRequests` returns (Task 3) and what `ComparisonPage` reads (Task 8). `ComparisonNotesProps`/`ComparisonIdentificationHeaderProps` field names match their call sites in `ComparisonPage`.
