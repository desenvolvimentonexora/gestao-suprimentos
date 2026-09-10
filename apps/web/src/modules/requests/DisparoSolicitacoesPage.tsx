import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components'
import { filterRequests } from './filterRequests'
import { ImportRequestsModal } from './ImportRequestsModal'
import { RequestFormModal } from './RequestFormModal'
import { RequestsTable } from './RequestsTable'
import {
  useCancelRequest,
  useCreateRequest,
  useMaterialOptions,
  useRequests,
  useUnitOptions,
  useUpdateRequest,
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

  const requestsQuery = useRequests()
  const unitsQuery = useUnitOptions()
  const materialsQuery = useMaterialOptions()
  const createRequest = useCreateRequest(tenantId)
  const updateRequest = useUpdateRequest(tenantId)
  const updateStatus = useUpdateRequestStatus()
  const cancelRequest = useCancelRequest()

  const requests = requestsQuery.data ?? []
  const units = unitsQuery.data ?? []
  const materials = materialsQuery.data ?? []
  const filteredRequests = filterRequests(requests, { search, status: statusFilter, unitId: unitFilter })
  const editingRequest =
    formState?.mode === 'edit' ? requests.find((request) => request.id === formState.requestId) : undefined

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
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link to="/suprimentos" className="text-sm text-ink-muted hover:text-ink">
        ← Suprimentos
      </Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Disparo de Solicitações</h1>
        <Button variant="secondary" onClick={() => setImportOpen(true)}>
          Importar planilha
        </Button>
      </div>

      <div className="mt-6">
        <RequestsTable
          requests={filteredRequests}
          units={units}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          unitFilter={unitFilter}
          onUnitFilterChange={setUnitFilter}
          onAddRequest={() => setFormState({ mode: 'create' })}
          onEditRequest={(requestId) => setFormState({ mode: 'edit', requestId })}
          onSendToNegotiation={(requestId) =>
            updateStatus.mutate({ requestId, status: 'negotiating' })
          }
          onCancelRequest={(requestId) => cancelRequest.mutate(requestId)}
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

      <ImportRequestsModal isOpen={importOpen} onClose={() => setImportOpen(false)} tenantId={tenantId} />
    </div>
  )
}
