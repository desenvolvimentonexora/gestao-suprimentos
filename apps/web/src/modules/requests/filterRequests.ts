import type { RequestRow, RequestStatus } from './types'

export interface FilterRequestsOptions {
  search: string
  status: RequestStatus | null
  unitId: string | null
}

export function filterRequests(
  requests: RequestRow[],
  { search, status, unitId }: FilterRequestsOptions,
): RequestRow[] {
  const normalizedSearch = search.trim().toLowerCase()

  return requests.filter((request) => {
    if (status && request.status !== status) return false
    if (unitId && request.unitId !== unitId) return false
    if (normalizedSearch) {
      const matchesUnit = request.unitName.toLowerCase().includes(normalizedSearch)
      const matchesRef = request.externalRef?.toLowerCase().includes(normalizedSearch) ?? false
      if (!matchesUnit && !matchesRef) return false
    }
    return true
  })
}
