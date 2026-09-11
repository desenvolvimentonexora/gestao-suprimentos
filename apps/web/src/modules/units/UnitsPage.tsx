import { useState } from 'react'
import { Link } from 'react-router-dom'
import { filterUnits } from './filterUnits'
import { UnitFormModal } from './UnitFormModal'
import { UnitsTable } from './UnitsTable'
import { useCreateUnit, useDeleteUnit, useUnitsList, useUpdateUnit } from './queries'
import type { UnitFormValues, UnitStatus, UnitType } from './types'

export interface UnitsPageProps {
  tenantId: string
}

export function UnitsPage({ tenantId }: UnitsPageProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<UnitStatus | null>(null)
  const [typeFilter, setTypeFilter] = useState<UnitType | null>(null)
  const [formState, setFormState] = useState<{ mode: 'create' } | { mode: 'edit'; unitId: string } | null>(
    null,
  )

  const unitsQuery = useUnitsList()
  const createUnit = useCreateUnit(tenantId)
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()

  const units = unitsQuery.data ?? []
  const filteredUnits = filterUnits(units, { search, status: statusFilter, type: typeFilter })
  const editingUnit =
    formState?.mode === 'edit' ? units.find((unit) => unit.id === formState.unitId) : undefined

  function handleSubmit(values: UnitFormValues) {
    if (formState?.mode === 'edit') {
      updateUnit.mutate(
        { unitId: formState.unitId, values },
        { onSuccess: () => setFormState(null) },
      )
    } else {
      createUnit.mutate(values, { onSuccess: () => setFormState(null) })
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-gradient-to-b from-primary-dark to-primary px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <Link to="/suprimentos" className="text-sm text-on-primary hover:underline">
            ← Suprimentos
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-on-primary">Unidades</h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <UnitsTable
          units={filteredUnits}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onAddUnit={() => setFormState({ mode: 'create' })}
          onEditUnit={(unitId) => setFormState({ mode: 'edit', unitId })}
          onDeleteUnit={(unitId) => deleteUnit.mutate(unitId)}
        />
      </div>

      {formState && (formState.mode === 'create' || editingUnit) && (
        <UnitFormModal
          key={formState.mode === 'edit' ? formState.unitId : 'create'}
          isOpen
          onClose={() => setFormState(null)}
          mode={formState.mode}
          initialValues={
            editingUnit
              ? {
                  name: editingUnit.name,
                  cnpj: editingUnit.cnpj ?? '',
                  zipCode: editingUnit.zipCode ?? '',
                  street: editingUnit.street ?? '',
                  number: editingUnit.number ?? '',
                  neighborhood: editingUnit.neighborhood ?? '',
                  city: editingUnit.city ?? '',
                  state: editingUnit.state ?? '',
                  type: editingUnit.type,
                  status: editingUnit.status,
                  startDate: editingUnit.startDate ?? '',
                  endDate: editingUnit.endDate ?? '',
                  engineerName: editingUnit.engineerName ?? '',
                  engineerPhone: editingUnit.engineerPhone ?? '',
                  engineerEmail: editingUnit.engineerEmail ?? '',
                  adminName: editingUnit.adminName ?? '',
                  adminPhone: editingUnit.adminPhone ?? '',
                  adminEmail: editingUnit.adminEmail ?? '',
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={createUnit.isPending || updateUnit.isPending}
        />
      )}
    </div>
  )
}
