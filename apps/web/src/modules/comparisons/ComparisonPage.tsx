import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button } from '../../components'
import { useUserPermissions } from '../../core/permissions'
import { ComparisonTable } from './ComparisonTable'
import { ImportQuotationPdfModal } from './ImportQuotationPdfModal'
import { PendingApprovalsSection } from './PendingApprovalsSection'
import {
  useComparableRequests,
  useGetOrCreateDraftComparison,
  useSendToApproval,
  useSetWinningQuotation,
} from './queries'

export interface ComparisonPageProps {
  tenantId: string
  userId: string
}

export function ComparisonPage({ tenantId, userId }: ComparisonPageProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [createdComparisonIds, setCreatedComparisonIds] = useState<Record<string, string>>({})
  const [importOpen, setImportOpen] = useState(false)

  const requestsQuery = useComparableRequests()
  const getOrCreateDraftComparison = useGetOrCreateDraftComparison(tenantId)
  const setWinningQuotation = useSetWinningQuotation()
  const sendToApproval = useSendToApproval()
  const permissionsQuery = useUserPermissions(userId)
  const canApprove = (permissionsQuery.data ?? []).includes('comparisons.approve')

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

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link to="/suprimentos" className="text-sm text-ink-muted hover:text-ink">
        ← Suprimentos
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-ink">Equalização de Orçamentos</h1>

      {canApprove && <PendingApprovalsSection />}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-2">
          {requests.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Nenhuma requisição com cotações para comparar no momento.
            </p>
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">{selectedRequest.unitName}</h2>
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  Adicionar cotação por PDF
                </Button>
              </div>

              <ComparisonTable
                requestItems={selectedRequest.requestItems}
                quotations={selectedRequest.quotations}
                winningQuotationId={selectedRequest.winningQuotationId}
                onSelectWinner={(quotationId) => {
                  if (!resolvedComparisonId) return
                  setWinningQuotation.mutate({ comparisonId: resolvedComparisonId, quotationId })
                }}
                onSendToApproval={() => {
                  if (!resolvedComparisonId) return
                  sendToApproval.mutate(resolvedComparisonId)
                }}
                canSendToApproval={
                  Boolean(resolvedComparisonId) &&
                  Boolean(selectedRequest.winningQuotationId) &&
                  selectedRequest.comparisonStatus !== 'pending_approval'
                }
              />

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
  )
}
