import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, ComingSoonButton } from '../../components'
import { loadSettings } from '../../core/config'
import { useUserPermissions } from '../../core/permissions'
import { subscribeToTableChanges } from '../../core/realtime'
import { AnalysisIndicatorCards } from './AnalysisIndicatorCards'
import { AnalysisRequestCard } from './AnalysisRequestCard'
import { getAnalysisIndicators } from './analysisIndicators'
import { ClarificationModal } from './ClarificationModal'
import { ExtensionModal } from './ExtensionModal'
import { filterAnalysisRequests } from './filterAnalysisRequests'
import { ImportRequestsModal } from './ImportRequestsModal'
import type { UrgencyTier } from './getUrgencyTier'
import {
  useCancelRequest,
  useReleaseRequestToDispatch,
  useRequestClarification,
  useRequestExtension,
  useRequests,
  useToggleItemPendency,
  useUnitOptions,
  useUpdateRequestNotes,
} from './queries'
import type { RequestRow } from './types'

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
  const [clarificationRequestId, setClarificationRequestId] = useState<string | null>(null)
  const [extensionRequestId, setExtensionRequestId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const today = new Date()
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({ queryKey: ['settings', tenantId], queryFn: () => loadSettings(tenantId) })
  const requestLabel = settingsQuery.data?.vocabulary.request ?? 'SOL'

  const requestsQuery = useRequests()
  const unitsQuery = useUnitOptions()
  const permissionsQuery = useUserPermissions(userId)
  const canAnalyze = (permissionsQuery.data ?? []).includes('requests.analyze')

  const toggleItemPendency = useToggleItemPendency()
  const updateRequestNotes = useUpdateRequestNotes()
  const cancelRequest = useCancelRequest()
  const requestClarification = useRequestClarification()
  const requestExtension = useRequestExtension()
  const releaseToDispatch = useReleaseRequestToDispatch()

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
  const analysisScoped = filterAnalysisRequests(requests, { search: '', unitId: null, tier: null, today })
  const indicators = getAnalysisIndicators(analysisScoped, today)
  const filteredRequests = filterAnalysisRequests(requests, {
    search,
    unitId: unitFilter,
    tier: tierFilter,
    today,
  })

  const clarificationRequest = requests.find((request) => request.id === clarificationRequestId)
  const extensionRequest = requests.find((request) => request.id === extensionRequestId)
  const pendingItems = (clarificationRequest?.items ?? [])
    .filter((item) => item.pendente)
    .map((item) => ({ materialName: item.materialName, motivo: item.motivoPendencia }))

  function handleDeleteRequest(request: RequestRow) {
    if (window.confirm(`Excluir a ${requestLabel} de "${request.unitName}"?`)) {
      cancelRequest.mutate(request.id)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
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
                onToggleItemPendency={(itemId, pendente, motivo) =>
                  toggleItemPendency.mutate({ itemId, pendente, motivoPendencia: motivo })
                }
                onUpdateNotes={(requestId, notes) => updateRequestNotes.mutate({ requestId, notes })}
                onDeleteRequest={handleDeleteRequest}
                onOpenClarificationModal={setClarificationRequestId}
                onOpenExtensionModal={setExtensionRequestId}
                onReleaseToDispatch={(requestId) => releaseToDispatch.mutate(requestId)}
              />
            ))
          )}
        </div>
      </div>

      {clarificationRequest && (
        <ClarificationModal
          key={clarificationRequest.id}
          isOpen
          onClose={() => setClarificationRequestId(null)}
          pendingItems={pendingItems}
          onSubmit={(message) =>
            requestClarification.mutate(
              { requestId: clarificationRequest.id, message },
              { onSuccess: () => setClarificationRequestId(null) },
            )
          }
          isSubmitting={requestClarification.isPending}
          submitError={errorMessage(requestClarification.error)}
        />
      )}

      {extensionRequest && (
        <ExtensionModal
          key={extensionRequest.id}
          isOpen
          onClose={() => setExtensionRequestId(null)}
          currentNeededBy={extensionRequest.neededBy}
          onSubmit={(values) =>
            requestExtension.mutate(
              { requestId: extensionRequest.id, newNeededBy: values.newNeededBy, reason: values.reason },
              { onSuccess: () => setExtensionRequestId(null) },
            )
          }
          isSubmitting={requestExtension.isPending}
          submitError={errorMessage(requestExtension.error)}
        />
      )}

      <ImportRequestsModal isOpen={importOpen} onClose={() => setImportOpen(false)} tenantId={tenantId} />
    </div>
  )
}
