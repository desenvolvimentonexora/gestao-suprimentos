import type { NegotiatingRequestRow } from './types'

export function filterNegotiatingRequests(
  requests: NegotiatingRequestRow[],
  search: string,
): NegotiatingRequestRow[] {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) return requests

  return requests.filter((request) => {
    const matchesUnit = request.unitName.toLowerCase().includes(normalizedSearch)
    const matchesRef = request.externalRef?.toLowerCase().includes(normalizedSearch) ?? false
    return matchesUnit || matchesRef
  })
}
