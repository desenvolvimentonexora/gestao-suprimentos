import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../../components'
import { subscribeToTableChanges } from '../../core/realtime'
import { filterNegotiatingRequests } from './filterNegotiatingRequests'
import { formatRequestNumber } from './formatRequestNumber'
import { getNegotiatorCounts } from './getNegotiatorCounts'
import { NegotiatingAttachmentsModal } from './NegotiatingAttachmentsModal'
import { NegotiatingRequestCard } from './NegotiatingRequestCard'
import { NegotiatorChips } from './NegotiatorChips'
import { QuotationFormModal } from './QuotationFormModal'
import {
  useCreateQuotation,
  useDiscardQuotation,
  useNegotiatingAttachments,
  useNegotiatingRequests,
  useNegotiatorOptions,
  useSendBackToDispatch,
  useSupplierOptions,
  useUpdateNegotiationNotes,
  useUpdateNegotiator,
  useViewNegotiatingAttachment,
} from './queries'
import type { QuotationFormValues } from './types'

export interface EmNegociacaoPageProps {
  tenantId: string
}

export function EmNegociacaoPage({ tenantId }: EmNegociacaoPageProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState<string | null>(null)
  const [negotiatorFilter, setNegotiatorFilter] = useState<string | null>(null)
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [attachmentsRequestId, setAttachmentsRequestId] = useState<string | null>(null)

  const requestsQuery = useNegotiatingRequests()
  const suppliersQuery = useSupplierOptions()
  const negotiatorsQuery = useNegotiatorOptions()
  const createQuotation = useCreateQuotation(tenantId)
  const discardQuotation = useDiscardQuotation()
  const updateNegotiator = useUpdateNegotiator()
  const updateNotes = useUpdateNegotiationNotes()
  const sendBackToDispatch = useSendBackToDispatch()
  const attachmentsQuery = useNegotiatingAttachments(attachmentsRequestId)
  const viewAttachment = useViewNegotiatingAttachment()
  const queryClient = useQueryClient()

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['negotiating-requests'] })
    const unsubscribeRequests = subscribeToTableChanges('requests', invalidate)
    const unsubscribeQuotations = subscribeToTableChanges('quotations', invalidate)
    return () => {
      unsubscribeRequests()
      unsubscribeQuotations()
    }
  }, [queryClient])

  const requests = requestsQuery.data ?? []
  const suppliers = suppliersQuery.data ?? []
  const negotiators = negotiatorsQuery.data ?? []
  const units = [...new Map(requests.map((request) => [request.unitId, request.unitName])).entries()].map(
    ([id, name]) => ({ id, name }),
  )
  const negotiatorCounts = getNegotiatorCounts(requests, negotiators)
  const filteredRequests = filterNegotiatingRequests(requests, {
    search,
    unitId: unitFilter,
    negotiatorFilter,
  })
  const activeRequest = requests.find((request) => request.id === activeRequestId)
  const attachmentsRequest = requests.find((request) => request.id === attachmentsRequestId)

  function handleSubmit(values: QuotationFormValues) {
    if (!activeRequestId) return
    createQuotation.mutate(
      { requestId: activeRequestId, values },
      { onSuccess: () => setActiveRequestId(null) },
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-gradient-to-b from-primary-dark to-primary px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <Link to="/suprimentos" className="text-sm text-on-primary hover:underline">
            ← Suprimentos
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-on-primary">🤝 Em Negociação</h1>
              <p className="text-sm text-on-primary/80">
                Requisições enviadas, aguardando cotação dos fornecedores.
              </p>
            </div>
            <Badge>{requests.length} SOLs na fila</Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mt-4">
        <NegotiatorChips counts={negotiatorCounts} selected={negotiatorFilter} onSelect={setNegotiatorFilter} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Buscar SOL, centro ou material"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
        />
        <select
          aria-label="Filtrar por unidade"
          value={unitFilter ?? ''}
          onChange={(e) => setUnitFilter(e.target.value || null)}
          className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
        >
          <option value="">Todos os centros</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {filteredRequests.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhuma requisição em negociação no momento.</p>
        ) : (
          filteredRequests.map((request) => (
            <NegotiatingRequestCard
              key={request.id}
              request={request}
              negotiators={negotiators}
              today={new Date()}
              onAssignNegotiator={(requestId, negotiatorId) =>
                updateNegotiator.mutate({ requestId, negotiatorId })
              }
              onRegisterQuotation={setActiveRequestId}
              onUpdateNotes={(requestId, notes) => updateNotes.mutate({ requestId, notes })}
              onSendBackToDispatch={(requestId) => sendBackToDispatch.mutate(requestId)}
              onFinalizeNegotiation={() => navigate('/suprimentos/equalizacao')}
              onOpenAttachments={setAttachmentsRequestId}
            />
          ))
        )}
      </div>
      </div>

      {activeRequest && (
        <QuotationFormModal
          isOpen
          onClose={() => setActiveRequestId(null)}
          suppliers={suppliers}
          requestItems={activeRequest.items}
          onSubmit={handleSubmit}
          isSubmitting={createQuotation.isPending}
        />
      )}

      <NegotiatingAttachmentsModal
        isOpen={attachmentsRequestId !== null}
        onClose={() => setAttachmentsRequestId(null)}
        requestLabel={
          attachmentsRequest
            ? formatRequestNumber(attachmentsRequest.externalRef, attachmentsRequest.sequenceNumber)
            : ''
        }
        attachments={attachmentsQuery.data ?? []}
        isLoading={attachmentsQuery.isLoading}
        onView={(attachment) => viewAttachment.mutate(attachment)}
        onDiscardQuotation={(quotationId) => discardQuotation.mutate(quotationId)}
      />
    </div>
  )
}
