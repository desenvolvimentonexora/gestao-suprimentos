import { supabase } from '../../lib/supabase'
import type {
  ComparableRequestRow,
  ComparisonStatus,
  ComparisonWinner,
  ExtractedItemReview,
  ExtractedQuoteItem,
  HistoryRow,
  PendingApprovalRow,
  PendingReleaseRow,
  SupplierOption,
} from './types'

export async function fetchComparableRequests(): Promise<ComparableRequestRow[]> {
  const { data, error } = await supabase
    .from('requests')
    .select(
      'id, units(name), external_ref, request_items(id, quantity, unit_of_measure, deleted_at, materials(name)), quotations(id, status, deleted_at, suppliers(name), quotation_items(id, request_item_id, unit_price, lead_time_days))',
    )
    .eq('status', 'negotiating')
    .is('deleted_at', null)

  if (error) throw error

  const requestIds = data.map((row) => row.id)
  const { data: comparisonsData, error: comparisonsError } = await supabase
    .from('comparisons')
    .select('id, request_id, status')
    .in('request_id', requestIds.length > 0 ? requestIds : [''])
    .is('deleted_at', null)
    .in('status', ['draft', 'pending_approval'])

  if (comparisonsError) throw comparisonsError

  const comparisonByRequestId = new Map(
    comparisonsData.map((comparison) => [
      comparison.request_id,
      { id: comparison.id, status: comparison.status as ComparisonStatus },
    ]),
  )

  const comparisonIds = comparisonsData.map((comparison) => comparison.id)
  const { data: winnersData, error: winnersError } = await supabase
    .from('comparison_winners')
    .select('comparison_id, request_item_id, quotation_item_id')
    .in('comparison_id', comparisonIds.length > 0 ? comparisonIds : [''])

  if (winnersError) throw winnersError

  const winnersByComparisonId = new Map<string, ComparisonWinner[]>()
  for (const winner of winnersData) {
    const list = winnersByComparisonId.get(winner.comparison_id) ?? []
    list.push({ requestItemId: winner.request_item_id, quotationItemId: winner.quotation_item_id })
    winnersByComparisonId.set(winner.comparison_id, list)
  }

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
        comparisonId: comparison?.id ?? null,
        comparisonStatus: comparison?.status ?? null,
        winners: comparison ? (winnersByComparisonId.get(comparison.id) ?? []) : [],
        requestItems,
        quotations,
      }
    })
    .filter((row) => row.quotations.length > 0)
}

export async function fetchSupplierOptions(): Promise<SupplierOption[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data
}

export async function getOrCreateDraftComparison(tenantId: string, requestId: string): Promise<string> {
  const { data: existing, error: existingError } = await supabase
    .from('comparisons')
    .select('id')
    .eq('request_id', requestId)
    .is('deleted_at', null)
    .in('status', ['draft', 'pending_approval'])
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) return existing.id

  const { data: created, error: createError } = await supabase
    .from('comparisons')
    .insert({ tenant_id: tenantId, request_id: requestId })
    .select('id')
    .single()
  if (createError) throw createError
  return created.id
}

export async function createPdfQuotation(
  tenantId: string,
  requestId: string,
  supplierId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('quotations')
    .insert({ tenant_id: tenantId, request_id: requestId, supplier_id: supplierId, status: 'pending' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function uploadQuotationAttachment(
  tenantId: string,
  quotationId: string,
  file: File,
): Promise<string> {
  const storagePath = `${tenantId}/${quotationId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('quotation-attachments')
    .upload(storagePath, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('quotation_attachments')
    .insert({ tenant_id: tenantId, quotation_id: quotationId, file_name: file.name, storage_path: storagePath })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function runExtraction(attachmentId: string): Promise<{ items: ExtractedQuoteItem[] }> {
  const { data, error } = await supabase.functions.invoke('compare-quotations', {
    body: { attachmentId },
  })
  if (error) throw error
  return data
}

export async function confirmExtractedItems(
  tenantId: string,
  comparisonId: string,
  quotationId: string,
  reviewedItems: ExtractedItemReview[],
): Promise<void> {
  const matchedItems = reviewedItems.filter(
    (item): item is ExtractedItemReview & { requestItemId: string } => item.requestItemId !== null,
  )

  const { data: insertedItems, error: itemsError } = await supabase
    .from('quotation_items')
    .insert(
      matchedItems.map((item) => ({
        tenant_id: tenantId,
        quotation_id: quotationId,
        request_item_id: item.requestItemId,
        unit_price: item.unitPrice,
        lead_time_days: item.leadTimeDays,
      })),
    )
    .select('id, request_item_id')
  if (itemsError) throw itemsError

  const { error: linesError } = await supabase.from('comparison_lines').insert(
    insertedItems.map((inserted, index) => ({
      tenant_id: tenantId,
      comparison_id: comparisonId,
      request_item_id: inserted.request_item_id,
      quotation_item_id: inserted.id,
      extracted_by_ai: true,
      ai_confidence: matchedItems[index]?.confidence ?? null,
    })),
  )
  if (linesError) throw linesError

  const { error: quotationError } = await supabase
    .from('quotations')
    .update({ status: 'received', submitted_at: new Date().toISOString() })
    .eq('id', quotationId)
  if (quotationError) throw quotationError
}

export async function setItemWinner(
  tenantId: string,
  comparisonId: string,
  requestItemId: string,
  quotationItemId: string,
): Promise<void> {
  const { error } = await supabase.from('comparison_winners').upsert(
    {
      tenant_id: tenantId,
      comparison_id: comparisonId,
      request_item_id: requestItemId,
      quotation_item_id: quotationItemId,
    },
    { onConflict: 'comparison_id,request_item_id' },
  )
  if (error) throw error
}

export async function sendToApproval(comparisonId: string): Promise<void> {
  const { error } = await supabase
    .from('comparisons')
    .update({ status: 'pending_approval' })
    .eq('id', comparisonId)
  if (error) throw error
}

export async function fetchPendingApprovals(): Promise<PendingApprovalRow[]> {
  const { data, error } = await supabase
    .from('comparisons')
    .select('id, requests(id, external_ref, units(name))')
    .eq('status', 'pending_approval')
    .is('deleted_at', null)

  if (error) throw error

  return data.map((row) => ({
    comparisonId: row.id,
    requestId: row.requests?.id ?? '',
    unitName: row.requests?.units?.name ?? '',
    externalRef: row.requests?.external_ref ?? null,
  }))
}

export interface DecideComparisonInput {
  comparisonId: string
  decision: 'approved' | 'rejected'
  rejectionReason?: string
}

export async function decideComparison(input: DecideComparisonInput): Promise<void> {
  const { error } = await supabase.functions.invoke('decide-comparison', { body: input })
  if (error) throw error
}

export async function fetchPendingReleases(): Promise<PendingReleaseRow[]> {
  const { data, error } = await supabase
    .from('comparisons')
    .select('id, requests(id, external_ref, units(name))')
    .eq('status', 'approved')
    .is('deleted_at', null)

  if (error) throw error

  return data.map((row) => ({
    comparisonId: row.id,
    requestId: row.requests?.id ?? '',
    unitName: row.requests?.units?.name ?? '',
    externalRef: row.requests?.external_ref ?? null,
  }))
}

export interface ReleaseComparisonInput {
  comparisonId: string
  decision: 'released' | 'rejected'
  paymentConditionNote?: string
  rejectionReason?: string
}

export async function releaseComparison(input: ReleaseComparisonInput): Promise<void> {
  const { error } = await supabase.functions.invoke('release-comparison', { body: input })
  if (error) throw error
}

export async function setFinancialChargeRequested(comparisonId: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from('comparisons')
    .update({ financial_charge_requested: value })
    .eq('id', comparisonId)
  if (error) throw error
}

export async function fetchHistory(): Promise<HistoryRow[]> {
  const { data, error } = await supabase
    .from('comparisons')
    .select('id, status, rejection_reason, released_at, requests(external_ref, units(name))')
    .in('status', ['released', 'rejected'])
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return data.map((row) => ({
    comparisonId: row.id,
    unitName: row.requests?.units?.name ?? '',
    externalRef: row.requests?.external_ref ?? null,
    status: row.status as ComparisonStatus,
    rejectionReason: row.rejection_reason,
    releasedAt: row.released_at,
  }))
}
