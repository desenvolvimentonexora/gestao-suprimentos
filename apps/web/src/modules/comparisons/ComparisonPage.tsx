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
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null)
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
  const expandedRequest = requests.find((request) => request.requestId === expandedRequestId) ?? null

  useEffect(() => {
    if (!expandedRequest || expandedRequest.comparisonId || createdComparisonIds[expandedRequest.requestId]) {
      return
    }
    getOrCreateDraftComparison.mutate(expandedRequest.requestId, {
      onSuccess: (comparisonId) =>
        setCreatedComparisonIds((current) => ({ ...current, [expandedRequest.requestId]: comparisonId })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve rodar quando a requisição expandida muda, não a cada render do mutation
  }, [expandedRequest?.requestId, expandedRequest?.comparisonId])

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
        {!expandedRequestId && (
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

        <div className="mt-6 flex flex-col gap-3">
          {requests.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhuma requisição com cotações para comparar no momento.</p>
          ) : (
            requests.map((request) => {
              const isExpanded = expandedRequestId === request.requestId
              const comparisonId = request.comparisonId ?? createdComparisonIds[request.requestId] ?? null
              const requestHasWinner = Boolean(request.winningQuotationId)

              return (
                <div key={request.requestId} className="overflow-hidden rounded border border-line">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRequestId((current) => (current === request.requestId ? null : request.requestId))
                    }
                    className="block w-full text-left"
                  >
                    <ComparisonIdentificationHeader
                      logoUrl={settingsQuery.data?.brand.logoUrl}
                      brandName={settingsQuery.data?.brand.name}
                      externalRef={request.externalRef}
                      sequenceNumber={request.sequenceNumber}
                      unitName={request.unitName}
                      createdByName={request.createdByName}
                      createdAt={request.createdAt}
                    />
                  </button>

                  {request.comparisonStatus === 'pending_approval' && (
                    <div className="bg-surface px-4 pb-2">
                      <Badge>Aguardando aprovação</Badge>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="flex flex-col gap-4 border-t border-line bg-bg p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <ComingSoonButton label="Imprimir" variant="secondary" />
                        <ComingSoonButton label="Excel" variant="secondary" />
                        <ComingSoonButton label="Pedido" variant="secondary" />
                        <ComingSoonButton label="Editar" variant="secondary" />
                        <Button
                          variant="accent"
                          disabled={
                            !(
                              Boolean(comparisonId) &&
                              requestHasWinner &&
                              request.comparisonStatus !== 'pending_approval'
                            )
                          }
                          onClick={() => {
                            if (!comparisonId) return
                            sendToApproval.mutate(comparisonId)
                          }}
                        >
                          Enviar p/ Aprovação
                        </Button>
                        <ComingSoonButton label="Nova" variant="secondary" />
                      </div>

                      <SourceCards
                        itemCount={request.requestItems.length}
                        quotations={request.quotations}
                        onAddQuotation={() => setImportOpen(true)}
                      />

                      <ComparisonTable
                        requestItems={request.requestItems}
                        quotations={request.quotations}
                        onWinnerChange={(quotationId) => {
                          if (!comparisonId) return
                          const quotation = request.quotations.find((q) => q.quotationId === quotationId) ?? null
                          setComparisonWinner.mutate({
                            comparisonId,
                            quotation,
                            requestItems: request.requestItems,
                          })
                        }}
                        onUpdateQuotationTerms={(quotationId, terms) => {
                          updateQuotationTerms.mutate({ quotationId, terms })
                        }}
                      />

                      {comparisonId && (
                        <ComparisonNotes
                          key={comparisonId}
                          notes={request.notes}
                          onUpdateNotes={(notes) => updateComparisonNotes.mutate({ comparisonId, notes })}
                        />
                      )}

                      {comparisonId && (
                        <ImportQuotationPdfModal
                          isOpen={importOpen}
                          onClose={() => setImportOpen(false)}
                          tenantId={tenantId}
                          requestId={request.requestId}
                          comparisonId={comparisonId}
                          requestItems={request.requestItems}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
