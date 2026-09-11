import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card } from '../../components'
import { useUserPermissions } from '../../core/permissions'
import { ComparisonTable } from './ComparisonTable'
import { HistoryList } from './HistoryList'
import { ImportQuotationPdfModal } from './ImportQuotationPdfModal'
import { PendingApprovalsSection } from './PendingApprovalsSection'
import { PendingReleaseSection } from './PendingReleaseSection'
import {
  useComparableRequests,
  useGetOrCreateDraftComparison,
  useHistory,
  useSendToApproval,
  useSetItemWinner,
} from './queries'

type QueueView = 'approvals' | 'releases' | 'history' | null

export interface ComparisonPageProps {
  tenantId: string
  userId: string
}

export function ComparisonPage({ tenantId, userId }: ComparisonPageProps) {
  const navigate = useNavigate()
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [createdComparisonIds, setCreatedComparisonIds] = useState<Record<string, string>>({})
  const [importOpen, setImportOpen] = useState(false)
  const [queueView, setQueueView] = useState<QueueView>(null)

  const requestsQuery = useComparableRequests()
  const getOrCreateDraftComparison = useGetOrCreateDraftComparison(tenantId)
  const setItemWinner = useSetItemWinner(tenantId)
  const sendToApproval = useSendToApproval()
  const permissionsQuery = useUserPermissions(userId)
  const canApprove = (permissionsQuery.data ?? []).includes('comparisons.approve')
  const historyQuery = useHistory(queueView === 'history')

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

  const allItemsHaveWinner =
    Boolean(selectedRequest) &&
    selectedRequest!.requestItems.every((item) =>
      selectedRequest!.winners.some((winner) => winner.requestItemId === item.id),
    )

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
                Fila de Aprovações
              </Button>
            )}
            {canApprove && (
              <Button
                variant={queueView === 'releases' ? 'primary' : 'on-primary'}
                onClick={() => setQueueView(queueView === 'releases' ? null : 'releases')}
              >
                Fila de Alterações
              </Button>
            )}
            <Button variant="on-primary" onClick={() => navigate('/suprimentos/pedidos')}>
              Fila de Pedidos
            </Button>
            <Button
              variant={queueView === 'history' ? 'primary' : 'on-primary'}
              onClick={() => setQueueView(queueView === 'history' ? null : 'history')}
            >
              Histórico
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
      {queueView === 'approvals' && canApprove && <PendingApprovalsSection />}
      {queueView === 'releases' && canApprove && <PendingReleaseSection />}
      {queueView === 'history' && (
        <div className="mt-4">
          <HistoryList rows={historyQuery.data ?? []} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                <div>
                  <h2 className="text-lg font-semibold text-ink">{selectedRequest.unitName}</h2>
                  <p className="text-xs text-ink-muted">Fontes: Solicitação + até 4 fornecedores.</p>
                </div>
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  Adicionar cotação por PDF
                </Button>
              </div>

              <ComparisonTable
                requestItems={selectedRequest.requestItems}
                quotations={selectedRequest.quotations}
                winners={selectedRequest.winners}
                onSelectWinner={(requestItemId, quotationItemId) => {
                  if (!resolvedComparisonId) return
                  setItemWinner.mutate({ comparisonId: resolvedComparisonId, requestItemId, quotationItemId })
                }}
                onSendToApproval={() => {
                  if (!resolvedComparisonId) return
                  sendToApproval.mutate(resolvedComparisonId)
                }}
                canSendToApproval={
                  Boolean(resolvedComparisonId) &&
                  allItemsHaveWinner &&
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
    </div>
  )
}
