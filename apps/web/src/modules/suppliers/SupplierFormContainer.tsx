import { SupplierFormModal, type SupplierFormValues } from './SupplierFormModal'
import { useCreateSupplier, useSupplierDetail, useUpdateSupplier } from './queries'
import type { MaterialRow } from './types'

export interface SupplierFormState {
  mode: 'create' | 'edit'
  supplierId?: string
  defaultMaterialId?: string
}

export interface SupplierFormContainerProps {
  tenantId: string
  state: SupplierFormState | null
  onClose: () => void
  allMaterials: MaterialRow[]
}

export function SupplierFormContainer({
  tenantId,
  state,
  onClose,
  allMaterials,
}: SupplierFormContainerProps) {
  const detailQuery = useSupplierDetail(state?.mode === 'edit' ? (state.supplierId ?? null) : null)
  const createSupplier = useCreateSupplier(tenantId)
  const updateSupplier = useUpdateSupplier(tenantId)

  if (!state) return null
  if (state.mode === 'edit' && !detailQuery.data) return null

  function handleSubmit(values: SupplierFormValues) {
    if (state?.mode === 'edit' && state.supplierId) {
      updateSupplier.mutate({ supplierId: state.supplierId, values }, { onSuccess: onClose })
    } else {
      createSupplier.mutate(values, { onSuccess: onClose })
    }
  }

  const initialValues: SupplierFormValues | undefined =
    state.mode === 'edit'
      ? detailQuery.data
      : state.defaultMaterialId
        ? {
            name: '',
            type: '',
            city: '',
            status: 'active',
            notes: '',
            cnpjs: [],
            contactName: '',
            contactPhone: '',
            contactEmail: '',
            materialIds: [state.defaultMaterialId],
          }
        : undefined

  return (
    <SupplierFormModal
      isOpen
      onClose={onClose}
      mode={state.mode}
      initialValues={initialValues}
      allMaterials={allMaterials}
      onSubmit={handleSubmit}
      isSubmitting={createSupplier.isPending || updateSupplier.isPending}
    />
  )
}
