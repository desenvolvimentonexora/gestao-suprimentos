import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ComingSoonButton } from '../../components'
import { DisparoSolModal } from './DisparoSolModal'
import { filterRequests } from './filterRequests'
import { ImportRequestsModal } from './ImportRequestsModal'
import { IndicatorCards } from './IndicatorCards'
import { getRequestIndicators } from './requestIndicators'
import { RequestFormModal } from './RequestFormModal'
import { RequestsTable } from './RequestsTable'
import {
  useCancelRequest,
  useCreateRequest,
  useDispatchRequest,
  useMaterialOptions,
  useMaterialsWithSupplierCount,
  useRequests,
  useUnitOptions,
  useUpdateRequest,
  useUpdateRequestNotes,
  useUpdateRequestStatus,
} from './queries'
import type { RequestFormValues, RequestStatus } from './types'

export interface DisparoSolicitacoesPageProps {
  tenantId: string
}

export function DisparoSolicitacoesPage({ tenantId }: DisparoSolicitacoesPageProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | null>(null)
  const [unitFilter, setUnitFilter] = useState<string | null>(null)
  const [formState, setFormState] = useState<
    { mode: 'create' } | { mode: 'edit'; requestId: string } | null
  >(null)
  const [importOpen, setImportOpen] = useState(false)
  const [dispatchRequestId, setDispatchRequestId] = useState<string | null>(null)

  const requestsQuery = useRequests()
  const unitsQuery = useUnitOptions()
  const materialsQuery = useMaterialOptions()
  const materialsWithSupplierCountQuery = useMaterialsWithSupplierCount()
  const createRequest = useCreateRequest(tenantId)
  const updateRequest = useUpdateRequest(tenantId)
  const dispatchRequest = useDispatchRequest()
  const cancelRequest = useCancelRequest()
  const updateRequestStatus = useUpdateRequestStatus()
  const updateRequestNotes = useUpdateRequestNotes()

  const requests = requestsQuery.data ?? []
  const units = unitsQuery.data ?? []
  const materials = materialsQuery.data ?? []
  const materialsWithSupplierCount = materialsWithSupplierCountQuery.data ?? []
  const filteredRequests = filterRequests(requests, { search, status: statusFilter, unitId: unitFilter })
  const editingRequest =
    formState?.mode === 'edit' ? requests.find((request) => request.id === formState.requestId) : undefined
  const dispatchingRequest = requests.find((request) => request.id === dispatchRequestId)

  function handleSubmit(values: RequestFormValues) {
    if (formState?.mode === 'edit') {
      updateRequest.mutate(
        { requestId: formState.requestId, values },
        { onSuccess: () => setFormState(null) },
      )
    } else {
      createRequest.mutate(values, { onSuccess: () => setFormState(null) })
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
            <h1 className="text-2xl font-semibold text-on-primary">Disparo de Solicitações</h1>
            <div className="flex gap-2">
              <ComingSoonButton label="Limpar NF" variant="on-primary" />
              <Button variant="on-primary" onClick={() => setImportOpen(true)}>
                Importar Excel
              </Button>
              <ComingSoonButton label="Buscar SOL sumida" variant="on-primary" />
            </div>
          </div>

          <div className="mt-6">
            <IndicatorCards indicators={getRequestIndicators(requests)} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <RequestsTable
          requests={filteredRequests}
          units={units}
          today={new Date()}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          unitFilter={unitFilter}
          onUnitFilterChange={setUnitFilter}
          onAddRequest={() => setFormState({ mode: 'create' })}
          onEditRequest={(requestId) => setFormState({ mode: 'edit', requestId })}
          onDispatch={setDispatchRequestId}
          onCancelRequest={(requestId) => cancelRequest.mutate(requestId)}
          onNegotiateDirectly={(requestId) =>
            updateRequestStatus.mutate({ requestId, status: 'negotiating' })
          }
          onUpdateNotes={(requestId, notes) => updateRequestNotes.mutate({ requestId, notes })}
        />
      </div>

      {formState && (formState.mode === 'create' || editingRequest) && (
        <RequestFormModal
          key={formState.mode === 'edit' ? formState.requestId : 'create'}
          isOpen
          onClose={() => setFormState(null)}
          mode={formState.mode}
          units={units}
          materials={materials}
          initialValues={
            editingRequest
              ? {
                  unitId: editingRequest.unitId,
                  neededBy: editingRequest.neededBy ?? '',
                  externalRef: editingRequest.externalRef ?? '',
                  items: editingRequest.items.map((item) => ({
                    materialId: item.materialId,
                    quantity: item.quantity,
                    unitOfMeasure: item.unitOfMeasure ?? '',
                  })),
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={createRequest.isPending || updateRequest.isPending}
        />
      )}

      {dispatchingRequest && (
        <DisparoSolModal
          isOpen
          onClose={() => setDispatchRequestId(null)}
          request={dispatchingRequest}
          units={units}
          materials={materialsWithSupplierCount}
          onSubmit={(values) =>
            dispatchRequest.mutate(
              { requestId: dispatchingRequest.id, values },
              { onSuccess: () => setDispatchRequestId(null) },
            )
          }
          isSubmitting={dispatchRequest.isPending}
        />
      )}

      <ImportRequestsModal isOpen={importOpen} onClose={() => setImportOpen(false)} tenantId={tenantId} />
    </div>
  )
}
