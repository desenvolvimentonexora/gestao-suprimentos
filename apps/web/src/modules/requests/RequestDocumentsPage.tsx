import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components'
import { formatRequestNumber } from './formatRequestNumber'
import { RequestAttachmentsModal } from './RequestAttachmentsModal'
import { STATUS_LABELS } from './requestStatusLabels'
import {
  useDiscardQuotationAttachment,
  useRequestAttachments,
  useRequests,
  useUnitOptions,
  useViewRequestAttachment,
} from './queries'

export function RequestDocumentsPage() {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [attachmentsRequestId, setAttachmentsRequestId] = useState<string | null>(null)

  const unitsQuery = useUnitOptions()
  const requestsQuery = useRequests()
  const attachmentsQuery = useRequestAttachments(attachmentsRequestId)
  const viewAttachment = useViewRequestAttachment()
  const discardQuotationAttachment = useDiscardQuotationAttachment()

  const units = unitsQuery.data ?? []
  const requests = requestsQuery.data ?? []
  const unitRequests = selectedUnitId ? requests.filter((request) => request.unitId === selectedUnitId) : []
  const attachmentsRequest = requests.find((request) => request.id === attachmentsRequestId)

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-gradient-to-b from-primary-dark to-primary px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <Link to="/suprimentos" className="text-sm text-on-primary hover:underline">
            ← Suprimentos
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-on-primary">Documentos</h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-1">
          <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Obras</span>
          {units.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhuma obra cadastrada.</p>
          ) : (
            units.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => setSelectedUnitId(unit.id)}
                className={`rounded-md border px-3 py-2 text-left text-sm ${
                  selectedUnitId === unit.id
                    ? 'border-primary bg-primary/5 font-medium text-ink'
                    : 'border-line bg-surface text-ink-muted hover:bg-bg'
                }`}
              >
                {unit.name}
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3">
          {!selectedUnitId ? (
            <p className="text-sm text-ink-muted">Selecione uma obra pra ver as Solicitações.</p>
          ) : unitRequests.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhuma Solicitação encontrada para esta obra.</p>
          ) : (
            unitRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface p-3 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-ink">
                    {formatRequestNumber(request.externalRef, request.sequenceNumber)}
                  </span>
                  <span className="text-xs text-ink-muted">{STATUS_LABELS[request.status]}</span>
                </div>
                <Button variant="secondary" onClick={() => setAttachmentsRequestId(request.id)}>
                  Ver arquivos
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <RequestAttachmentsModal
        isOpen={Boolean(attachmentsRequest)}
        onClose={() => setAttachmentsRequestId(null)}
        requestLabel={
          attachmentsRequest
            ? formatRequestNumber(attachmentsRequest.externalRef, attachmentsRequest.sequenceNumber)
            : ''
        }
        attachments={attachmentsQuery.data ?? []}
        isLoading={attachmentsQuery.isLoading}
        onView={(attachment) => viewAttachment.mutate(attachment)}
        onDiscardQuotation={(quotationId) => discardQuotationAttachment.mutate(quotationId)}
      />
    </div>
  )
}
