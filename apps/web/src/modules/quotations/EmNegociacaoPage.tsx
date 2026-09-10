import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { subscribeToTableChanges } from '../../core/realtime'
import { filterNegotiatingRequests } from './filterNegotiatingRequests'
import { NegotiatingRequestCard } from './NegotiatingRequestCard'
import { QuotationFormModal } from './QuotationFormModal'
import {
  useCreateQuotation,
  useDiscardQuotation,
  useNegotiatingRequests,
  useSupplierOptions,
} from './queries'
import type { QuotationFormValues } from './types'

export interface EmNegociacaoPageProps {
  tenantId: string
}

export function EmNegociacaoPage({ tenantId }: EmNegociacaoPageProps) {
  const [search, setSearch] = useState('')
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)

  const requestsQuery = useNegotiatingRequests()
  const suppliersQuery = useSupplierOptions()
  const createQuotation = useCreateQuotation(tenantId)
  const discardQuotation = useDiscardQuotation()
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
  const filteredRequests = filterNegotiatingRequests(requests, search)
  const activeRequest = requests.find((request) => request.id === activeRequestId)

  function handleSubmit(values: QuotationFormValues) {
    if (!activeRequestId) return
    createQuotation.mutate(
      { requestId: activeRequestId, values },
      { onSuccess: () => setActiveRequestId(null) },
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link to="/suprimentos" className="text-sm text-ink-muted hover:text-ink">
        ← Suprimentos
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-ink">Em Negociação</h1>

      <input
        type="search"
        placeholder="Buscar por unidade ou n° externo"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-6 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
      />

      <div className="mt-4 flex flex-col gap-4">
        {filteredRequests.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhuma requisição em negociação no momento.</p>
        ) : (
          filteredRequests.map((request) => (
            <NegotiatingRequestCard
              key={request.id}
              request={request}
              onRegisterQuotation={setActiveRequestId}
              onDiscardQuotation={(quotationId) => discardQuotation.mutate(quotationId)}
            />
          ))
        )}
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
    </div>
  )
}
