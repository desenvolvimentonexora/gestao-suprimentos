import { Modal, Spinner } from '../../components'
import { ExtractedItemsReview } from './ExtractedItemsReview'
import { useResolveUnmatchedQuotationItems, useUnmatchedQuotationItems } from './queries'
import type { ComparisonRequestItemRow, ExtractedItemReview } from './types'

export interface ReviewUnmatchedItemsModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  comparisonId: string | null
  quotationId: string | null
  supplierName: string
  requestItems: ComparisonRequestItemRow[]
}

export function ReviewUnmatchedItemsModal({
  isOpen,
  onClose,
  tenantId,
  comparisonId,
  quotationId,
  supplierName,
  requestItems,
}: ReviewUnmatchedItemsModalProps) {
  const unmatchedQuery = useUnmatchedQuotationItems(quotationId, isOpen)
  const resolveItems = useResolveUnmatchedQuotationItems(tenantId)
  const unmatchedItems = unmatchedQuery.data ?? []

  function handleConfirm(reviewedItems: ExtractedItemReview[]) {
    if (!comparisonId || !quotationId) return
    const items = reviewedItems.map((item, index) => ({
      ...item,
      unmatchedItemId: unmatchedItems[index]?.id ?? '',
    }))
    resolveItems.mutate({ comparisonId, quotationId, items }, { onSuccess: onClose })
  }

  const reviewItems: ExtractedItemReview[] = unmatchedItems.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    leadTimeDays: item.leadTimeDays,
    requestItemId: null,
    confidence: 0,
  }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Itens não identificados — ${supplierName}`}>
      {unmatchedQuery.isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : unmatchedItems.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhum item pendente de revisão.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted">
            A captura automática não conseguiu identificar estes itens com confiança suficiente. Selecione a que
            item da SOL cada um corresponde antes de confirmar.
          </p>
          <ExtractedItemsReview
            items={reviewItems}
            requestItems={requestItems}
            freight={null}
            paymentTerms={null}
            hideTerms
            onConfirm={handleConfirm}
            onCancel={onClose}
            isSubmitting={resolveItems.isPending}
          />
        </>
      )}
    </Modal>
  )
}
