import { supabase } from '../../lib/supabase'
import { getOrderTotal } from './getOrderTotal'
import type {
  ComparableRequestRow,
  ComparisonQuotationRow,
  ComparisonRequestItemRow,
  ComparisonStatus,
  ExtractedItemReview,
  ExtractedQuoteData,
  HistoryRow,
  OrderImportColumnMapping,
  OrderImportContext,
  OrderImportGroup,
  OrderStatus,
  PendingApprovalRow,
  PendingReleaseRow,
  ReleasedComparisonRow,
  SupplierOption,
} from './types'

const IMPORT_TYPE_ORDERS = 'orders'

export async function fetchComparableRequests(): Promise<ComparableRequestRow[]> {
  const { data, error } = await supabase
    .from('requests')
    .select(
      'id, units(name), external_ref, request_items(id, quantity, unit_of_measure, deleted_at, materials(name)), quotations(id, status, deleted_at, freight_amount, payment_terms, delivery_days, suppliers(name), quotation_items(id, request_item_id, unit_price, lead_time_days))',
    )
    .eq('status', 'negotiating')
    .is('deleted_at', null)

  if (error) throw error

  const requestIds = data.map((row) => row.id)
  const { data: comparisonsData, error: comparisonsError } = await supabase
    .from('comparisons')
    .select('id, request_id, status, winning_quotation_id')
    .in('request_id', requestIds.length > 0 ? requestIds : [''])
    .is('deleted_at', null)
    .in('status', ['draft', 'pending_approval'])

  if (comparisonsError) throw comparisonsError

  const comparisonByRequestId = new Map(
    comparisonsData.map((comparison) => [
      comparison.request_id,
      {
        id: comparison.id,
        status: comparison.status as ComparisonStatus,
        winningQuotationId: comparison.winning_quotation_id,
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
        comparisonId: comparison?.id ?? null,
        comparisonStatus: comparison?.status ?? null,
        winningQuotationId: comparison?.winningQuotationId ?? null,
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

export async function runExtraction(attachmentId: string): Promise<ExtractedQuoteData> {
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
  terms: { freight: number | null; paymentTerms: string | null },
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
    .update({
      status: 'received',
      submitted_at: new Date().toISOString(),
      freight_amount: terms.freight,
      payment_terms: terms.paymentTerms,
    })
    .eq('id', quotationId)
  if (quotationError) throw quotationError
}

export interface QuotationTermsInput {
  freight: number | null
  paymentTerms: string | null
  deliveryDays: number | null
}

export async function updateQuotationTerms(quotationId: string, terms: QuotationTermsInput): Promise<void> {
  const { error } = await supabase
    .from('quotations')
    .update({
      freight_amount: terms.freight,
      payment_terms: terms.paymentTerms,
      delivery_days: terms.deliveryDays,
    })
    .eq('id', quotationId)
  if (error) throw error
}

// Define o vencedor único da comparação (menor Total). Também preenche
// comparison_winners a partir dessa cotação vencedora — não para uso do
// modelo de vencedor por item (abandonado), mas só para o rascunho de
// pedido da Fase 5 continuar lendo a mesma tabela sem nenhuma alteração
// (essa parte está pausada até confirmação).
export async function setComparisonWinner(
  tenantId: string,
  comparisonId: string,
  quotation: ComparisonQuotationRow | null,
  requestItems: ComparisonRequestItemRow[],
): Promise<void> {
  const { error: updateError } = await supabase
    .from('comparisons')
    .update({ winning_quotation_id: quotation?.quotationId ?? null })
    .eq('id', comparisonId)
  if (updateError) throw updateError

  const { error: deleteError } = await supabase
    .from('comparison_winners')
    .delete()
    .eq('comparison_id', comparisonId)
  if (deleteError) throw deleteError

  if (!quotation) return

  const rows = requestItems
    .map((item) => {
      const price = quotation.prices.find((p) => p.requestItemId === item.id)
      if (!price || !price.quotationItemId || price.unitPrice === null) return null
      return {
        tenant_id: tenantId,
        comparison_id: comparisonId,
        request_item_id: item.id,
        quotation_item_id: price.quotationItemId,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  if (rows.length === 0) return

  const { error: insertError } = await supabase.from('comparison_winners').insert(rows)
  if (insertError) throw insertError
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

  const comparisonIds = data.map((row) => row.id)
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('comparison_id, order_number, status')
    .in('comparison_id', comparisonIds.length > 0 ? comparisonIds : [''])
    .is('deleted_at', null)
  if (ordersError) throw ordersError

  const orderByComparisonId = new Map(
    orders.map((order) => [order.comparison_id, { orderNumber: order.order_number, status: order.status as OrderStatus }]),
  )

  return data.map((row) => ({
    comparisonId: row.id,
    unitName: row.requests?.units?.name ?? '',
    externalRef: row.requests?.external_ref ?? null,
    status: row.status as ComparisonStatus,
    rejectionReason: row.rejection_reason,
    releasedAt: row.released_at,
    order: orderByComparisonId.get(row.id) ?? null,
  }))
}

export async function fetchReleasedAwaitingOrder(): Promise<ReleasedComparisonRow[]> {
  const { data: comparisons, error } = await supabase
    .from('comparisons')
    .select('id, requests(id, external_ref, unit_id, units(name))')
    .eq('status', 'released')
    .is('deleted_at', null)
  if (error) throw error

  const { data: existingOrders, error: ordersError } = await supabase
    .from('orders')
    .select('comparison_id')
    .is('deleted_at', null)
  if (ordersError) throw ordersError

  const orderedComparisonIds = new Set(existingOrders.map((order) => order.comparison_id))
  const awaiting = comparisons.filter((comparison) => !orderedComparisonIds.has(comparison.id))
  const comparisonIds = awaiting.map((comparison) => comparison.id)

  const { data: winnerRows, error: winnersError } = await supabase
    .from('comparison_winners')
    .select('comparison_id, request_items(quantity), quotation_items(unit_price)')
    .in('comparison_id', comparisonIds.length > 0 ? comparisonIds : [''])
  if (winnersError) throw winnersError

  const itemsByComparisonId = new Map<string, { quantity: number; unitPrice: number }[]>()
  for (const row of winnerRows) {
    const list = itemsByComparisonId.get(row.comparison_id) ?? []
    list.push({
      quantity: Number(row.request_items?.quantity ?? 0),
      unitPrice: Number(row.quotation_items?.unit_price ?? 0),
    })
    itemsByComparisonId.set(row.comparison_id, list)
  }

  return awaiting.map((comparison) => ({
    comparisonId: comparison.id,
    requestId: comparison.requests?.id ?? '',
    unitId: comparison.requests?.unit_id ?? '',
    unitName: comparison.requests?.units?.name ?? '',
    externalRef: comparison.requests?.external_ref ?? null,
    totalValue: getOrderTotal(itemsByComparisonId.get(comparison.id) ?? []),
  }))
}

export async function fetchOrderImportMapping(): Promise<OrderImportColumnMapping | null> {
  const { data, error } = await supabase
    .from('import_mappings')
    .select('column_mapping')
    .eq('import_type', IMPORT_TYPE_ORDERS)
    .maybeSingle()
  if (error) throw error
  return (data?.column_mapping as OrderImportColumnMapping | undefined) ?? null
}

export async function saveOrderImportMapping(tenantId: string, mapping: OrderImportColumnMapping): Promise<void> {
  const { error } = await supabase
    .from('import_mappings')
    .upsert(
      {
        tenant_id: tenantId,
        import_type: IMPORT_TYPE_ORDERS,
        column_mapping: mapping as unknown as Record<string, string>,
      },
      { onConflict: 'tenant_id,import_type' },
    )
  if (error) throw error
}

// Contexto necessário para casar cada linha do Excel do pedido (vindo do
// ERP) com a comparação liberada, o fornecedor, o material e o item da
// requisição correspondentes.
export async function fetchOrderImportContext(): Promise<OrderImportContext> {
  const { data: comparisons, error } = await supabase
    .from('comparisons')
    .select('id, request_id, requests(external_ref, unit_id)')
    .eq('status', 'released')
    .is('deleted_at', null)
  if (error) throw error

  const { data: existingOrders, error: ordersError } = await supabase
    .from('orders')
    .select('comparison_id')
    .is('deleted_at', null)
  if (ordersError) throw ordersError
  const orderedComparisonIds = new Set(existingOrders.map((order) => order.comparison_id))

  const suppliers = await fetchSupplierOptions()

  const { data: materials, error: materialsError } = await supabase
    .from('materials')
    .select('id, name, code')
    .is('deleted_at', null)
  if (materialsError) throw materialsError

  const requestIds = comparisons.map((comparison) => comparison.request_id)
  const { data: requestItems, error: requestItemsError } = await supabase
    .from('request_items')
    .select('id, request_id, material_id')
    .in('request_id', requestIds.length > 0 ? requestIds : [''])
    .is('deleted_at', null)
  if (requestItemsError) throw requestItemsError

  return {
    comparisons: comparisons
      .filter((comparison) => Boolean(comparison.requests?.external_ref))
      .map((comparison) => ({
        comparisonId: comparison.id,
        requestId: comparison.request_id,
        unitId: comparison.requests!.unit_id,
        externalRef: comparison.requests!.external_ref!,
        hasOrder: orderedComparisonIds.has(comparison.id),
      })),
    suppliers,
    materials,
    requestItems: requestItems.map((item) => ({
      id: item.id,
      requestId: item.request_id,
      materialId: item.material_id,
    })),
  }
}

export async function bulkImportOrders(tenantId: string, groups: OrderImportGroup[]): Promise<void> {
  for (const group of groups) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        comparison_id: group.comparisonId,
        request_id: group.requestId,
        unit_id: group.unitId,
        order_number: group.orderNumber,
        expected_delivery_date: group.expectedDeliveryDate,
      })
      .select('id')
      .single()
    if (orderError) throw orderError

    const { error: itemsError } = await supabase.from('order_items').insert(
      group.items.map((item) => ({
        tenant_id: tenantId,
        order_id: order.id,
        request_item_id: item.requestItemId,
        material_id: item.materialId,
        material_name_raw: item.materialNameRaw,
        supplier_id: item.supplierId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    )
    if (itemsError) throw itemsError
  }
}

