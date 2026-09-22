import { SupplierFormModal, type SupplierFormValues } from './SupplierFormModal'
import { useCreateSupplier, useSupplierDetail, useUpdateSupplier } from './queries'
import type { MaterialVariantRow } from './types'

export interface SupplierFormState {
  mode: 'create' | 'edit'
  supplierId?: string
}

export interface SupplierFormContainerProps {
  tenantId: string
  state: SupplierFormState | null
  onClose: () => void
  allMaterialVariants: MaterialVariantRow[]
}

export function SupplierFormContainer({
  tenantId,
  state,
  onClose,
  allMaterialVariants,
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
    state.mode === 'edit' ? detailQuery.data : undefined

  return (
    <SupplierFormModal
      isOpen
      onClose={onClose}
      mode={state.mode}
      initialValues={initialValues}
      allMaterialVariants={allMaterialVariants}
      onSubmit={handleSubmit}
      isSubmitting={createSupplier.isPending || updateSupplier.isPending}
    />
  )
}
