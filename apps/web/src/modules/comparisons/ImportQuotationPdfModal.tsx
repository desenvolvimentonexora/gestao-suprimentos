import { useState } from 'react'
import { Button, Modal, Spinner } from '../../components'
import { ExtractedItemsReview } from './ExtractedItemsReview'
import { matchExtractedItems } from './matchExtractedItems'
import {
  useConfirmExtractedItems,
  useCreatePdfQuotation,
  useRunExtraction,
  useSupplierOptions,
  useUploadQuotationAttachment,
} from './queries'
import type { ComparisonRequestItemRow, ExtractedItemReview } from './types'

export interface ImportQuotationPdfModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  requestId: string
  comparisonId: string
  requestItems: ComparisonRequestItemRow[]
}

type Step =
  | { name: 'pick-supplier' }
  | { name: 'extracting' }
  | { name: 'review'; quotationId: string; items: ExtractedItemReview[] }
  | { name: 'error'; message: string }

export function ImportQuotationPdfModal({
  isOpen,
  onClose,
  tenantId,
  requestId,
  comparisonId,
  requestItems,
}: ImportQuotationPdfModalProps) {
  const [step, setStep] = useState<Step>({ name: 'pick-supplier' })
  const [supplierId, setSupplierId] = useState('')

  const suppliersQuery = useSupplierOptions()
  const createQuotation = useCreatePdfQuotation(tenantId)
  const uploadAttachment = useUploadQuotationAttachment(tenantId)
  const runExtraction = useRunExtraction()
  const confirmItems = useConfirmExtractedItems(tenantId)

  function handleClose() {
    setStep({ name: 'pick-supplier' })
    setSupplierId('')
    onClose()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !supplierId) return

    setStep({ name: 'extracting' })
    try {
      const quotationId = await createQuotation.mutateAsync({ requestId, supplierId })
      const attachmentId = await uploadAttachment.mutateAsync({ quotationId, file })
      const extracted = await runExtraction.mutateAsync(attachmentId)
      const reviewed = matchExtractedItems(extracted.items, requestItems)
      setStep({ name: 'review', quotationId, items: reviewed })
    } catch (error) {
      setStep({
        name: 'error',
        message: error instanceof Error ? error.message : 'Falha ao processar o PDF.',
      })
    }
  }

  function handleConfirm(reviewedItems: ExtractedItemReview[]) {
    if (step.name !== 'review') return
    confirmItems.mutate(
      { comparisonId, quotationId: step.quotationId, reviewedItems },
      { onSuccess: handleClose },
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar cotação por PDF">
      {step.name === 'pick-supplier' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="pdf-supplier" className="text-sm font-medium text-ink">
              Fornecedor
            </label>
            <select
              id="pdf-supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Selecione…</option>
              {(suppliersQuery.data ?? []).map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="pdf-file" className="text-sm font-medium text-ink">
              PDF do orçamento
            </label>
            <input
              id="pdf-file"
              type="file"
              accept="application/pdf"
              disabled={!supplierId}
              onChange={handleFileChange}
            />
          </div>
        </div>
      )}

      {step.name === 'extracting' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <Spinner />
          <p className="text-sm text-ink-muted">Extraindo dados do PDF…</p>
        </div>
      )}

      {step.name === 'review' && (
        <ExtractedItemsReview
          items={step.items}
          requestItems={requestItems}
          onConfirm={handleConfirm}
          onCancel={handleClose}
          isSubmitting={confirmItems.isPending}
        />
      )}

      {step.name === 'error' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-accent">{step.message}</p>
          <Button variant="secondary" onClick={() => setStep({ name: 'pick-supplier' })}>
            Tentar novamente
          </Button>
        </div>
      )}
    </Modal>
  )
}
