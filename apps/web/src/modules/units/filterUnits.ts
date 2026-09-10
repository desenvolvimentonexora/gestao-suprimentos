import type { UnitRow, UnitStatus, UnitType } from './types'

export interface FilterUnitsOptions {
  search: string
  status: UnitStatus | null
  type: UnitType | null
}

export function filterUnits(units: UnitRow[], { search, status, type }: FilterUnitsOptions): UnitRow[] {
  const normalizedSearch = search.trim().toLowerCase()

  return units.filter((unit) => {
    if (status && unit.status !== status) return false
    if (type && unit.type !== type) return false
    if (normalizedSearch && !unit.name.toLowerCase().includes(normalizedSearch)) return false
    return true
  })
}
