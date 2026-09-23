import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, ComingSoonButton, Toast, type ToastVariant } from '../../components'
import { loadSettings } from '../../core/config'
import { useUserPermissions } from '../../core/permissions'
import { subscribeToTableChanges } from '../../core/realtime'
import { AnalysisIndicatorCards } from './AnalysisIndicatorCards'
import { AnalysisRequestCard } from './AnalysisRequestCard'
import { getAnalysisIndicators } from './analysisIndicators'
import { buildExtensionMessage } from './buildExtensionMessage'
import { openMailto } from './buildMailtoUrl'
import { ExtensionModal } from './ExtensionModal'
import { filterAnalysisRequests } from './filterAnalysisRequests'
import { formatRequestNumber } from './formatRequestNumber'
import { ImportRequestsModal } from './ImportRequestsModal'
import { RequestFormModal } from './RequestFormModal'
import type { UrgencyTier } from './getUrgencyTier'
import {
  useCancelRequest,
  useCreateRequest,
  useMaterialOptions,
  useReleaseRequestToDispatch,
  useRequestExtension,
  useRequests,
  useUnitOptions,
  useUpdateRequestNotes,
} from './queries'
import type { RequestFormValues, RequestRow } from './types'

export interface AnaliseSolicitacoesPageProps {
  tenantId: string
  userId: string
}

function errorMessage(error: unknown): string | null {
  if (!error) return null
  return error instanceof Error ? error.message : 'Não foi possível concluir a ação. Tente novamente.'
}

export function AnaliseSolicitacoesPage({ tenantId, userId }: AnaliseSolicitacoesPageProps) {
  const [search, setSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState<string | null>(null)
  const [tierFilter, setTierFilter] = useState<UrgencyTier | null>(null)
  const [extensionRequestId, setExtensionRequestId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [toast, setToast] = useState<{ variant: ToastVariant; message: string } | null>(null)

  const today = new Date()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  const settingsQuery = useQuery({ queryKey: ['settings', tenantId], queryFn: () => loadSettings(tenantId) })
  const requestLabel = settingsQuery.data?.vocabulary.request ?? 'SOL'

  const requestsQuery = useRequests()
  const unitsQuery = useUnitOptions()
  const materialsQuery = useMaterialOptions()
  const permissionsQuery = useUserPermissions(userId)
  const canAnalyze = (permissionsQuery.data ?? []).includes('requests.analyze')

  const updateRequestNotes = useUpdateRequestNotes()
  const cancelRequest = useCancelRequest()
  const requestExtension = useRequestExtension()
  const releaseToDispatch = useReleaseRequestToDispatch()
  const createRequest = useCreateRequest(tenantId)

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['requests'] })
    const unsubscribeRequests = subscribeToTableChanges('requests', invalidate)
    const unsubscribeItems = subscribeToTableChanges('request_items', invalidate)
    return () => {
      unsubscribeRequests()
      unsubscribeItems()
    }
  }, [queryClient])

  const requests = requestsQuery.data ?? []
  const units = unitsQuery.data ?? []
  const materials = materialsQuery.data ?? []
  const analysisScoped = filterAnalysisRequests(requests, { search: '', unitId: null, tier: null, today })
  const indicators = getAnalysisIndicators(analysisScoped, today)
  const filteredRequests = filterAnalysisRequests(requests, {
    search,
    unitId: unitFilter,
    tier: tierFilter,
    today,
  })

  const extensionRequest = requests.find((request) => request.id === extensionRequestId)

  function handleDeleteRequest(request: RequestRow) {
    if (window.confirm(`Excluir a ${requestLabel} de "${request.unitName}"?`)) {
      cancelRequest.mutate(request.id)
    }
  }

  function handleCreateSubmit(values: RequestFormValues) {
    createRequest.mutate(values, { onSuccess: () => setFormOpen(false) })
  }

  return (
    <div className="min-h-screen bg-bg">
      {toast && (
        <div className="fixed right-4 top-4 z-50 w-full max-w-sm">
          <Toast variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
        </div>
      )}

      <div className="bg-gradient-to-b from-primary-dark to-primary px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <Link to="/suprimentos" className="text-sm text-on-primary hover:underline">
            ← Suprimentos
          </Link>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-semibold text-on-primary">Análise de Solicitações</h1>
            <div className="flex gap-2">
              <ComingSoonButton label="Engenheiros" variant="on-primary" />
              <Button variant="on-primary" onClick={() => setImportOpen(true)}>
                Importar Solicitações do Dia
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <AnalysisIndicatorCards
              indicators={indicators}
              selectedTier={tierFilter}
              onSelectTier={setTierFilter}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder={`Buscar ${requestLabel}, centro ou material...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          <select
            aria-label="Filtrar por centro"
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
          <Button onClick={() => setFormOpen(true)}>+ Nova solicitação</Button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {filteredRequests.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Nenhuma {requestLabel} aguardando análise no momento.
            </p>
          ) : (
            filteredRequests.map((request) => (
              <AnalysisRequestCard
                key={request.id}
                request={request}
                today={today}
                canAnalyze={canAnalyze}
                onUpdateNotes={(requestId, notes) => updateRequestNotes.mutate({ requestId, notes })}
                onDeleteRequest={handleDeleteRequest}
                onOpenExtensionModal={setExtensionRequestId}
                onReleaseToDispatch={(requestId) =>
                  releaseToDispatch.mutate(requestId, {
                    onSuccess: ({ dispatched }) =>
                      setToast({
                        variant: 'success',
                        message: dispatched
                          ? 'SOL despachada automaticamente — já está em Em Negociação.'
                          : 'SOL liberada pro Disparo.',
                      }),
                    onError: (error) =>
                      setToast({ variant: 'error', message: errorMessage(error) ?? 'Não foi possível liberar.' }),
                  })
                }
              />
            ))
          )}
        </div>
      </div>

      {extensionRequest && (
        <ExtensionModal
          key={extensionRequest.id}
          isOpen
          onClose={() => setExtensionRequestId(null)}
          currentNeededBy={extensionRequest.neededBy}
          onSubmit={(values) =>
            requestExtension.mutate(
              { requestId: extensionRequest.id, newNeededBy: values.newNeededBy, reason: values.reason },
              {
                onSuccess: () => {
                  setExtensionRequestId(null)
                  setToast({
                    variant: 'success',
                    message:
                      'Prorrogação registrada. Abrindo seu e-mail com o texto pronto — se nada abrir, seu navegador não tem um cliente de e-mail padrão configurado; copie o texto e envie manualmente.',
                  })
                  openMailto({
                    subject: `Prorrogação de prazo — ${formatRequestNumber(extensionRequest.externalRef, extensionRequest.sequenceNumber)}`,
                    body: buildExtensionMessage({
                      currentNeededBy: extensionRequest.neededBy,
                      newNeededBy: values.newNeededBy,
                      reason: values.reason,
                    }),
                  })
                },
              },
            )
          }
          isSubmitting={requestExtension.isPending}
          submitError={errorMessage(requestExtension.error)}
        />
      )}

      <ImportRequestsModal isOpen={importOpen} onClose={() => setImportOpen(false)} tenantId={tenantId} />

      {formOpen && (
        <RequestFormModal
          isOpen
          onClose={() => setFormOpen(false)}
          mode="create"
          units={units}
          materials={materials}
          onSubmit={handleCreateSubmit}
          isSubmitting={createRequest.isPending}
        />
      )}
    </div>
  )
}
