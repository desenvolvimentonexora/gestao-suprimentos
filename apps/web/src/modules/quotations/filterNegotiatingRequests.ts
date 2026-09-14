import type { NegotiatingRequestRow } from './types'

export interface FilterNegotiatingRequestsOptions {
  search: string
  unitId: string | null
  negotiatorFilter: string | null
}

export function filterNegotiatingRequests(
  requests: NegotiatingRequestRow[],
  { search, unitId, negotiatorFilter }: FilterNegotiatingRequestsOptions,
): NegotiatingRequestRow[] {
  const normalizedSearch = search.trim().toLowerCase()

  return requests.filter((request) => {
    if (unitId && request.unitId !== unitId) return false
    if (negotiatorFilter === 'unassigned' && request.negotiatorId) return false
    if (negotiatorFilter && negotiatorFilter !== 'unassigned' && request.negotiatorId !== negotiatorFilter) {
      return false
    }
    if (normalizedSearch) {
      const matchesUnit = request.unitName.toLowerCase().includes(normalizedSearch)
      const matchesRef = request.externalRef?.toLowerCase().includes(normalizedSearch) ?? false
      const matchesMaterial = request.items.some((item) =>
        item.materialName.toLowerCase().includes(normalizedSearch),
      )
      if (!matchesUnit && !matchesRef && !matchesMaterial) return false
    }
    return true
  })
}
