export function formatItemReference(requestDisplayNumber: string, index: number): string {
  const sequence = String(index + 1).padStart(3, '0')
  return `${requestDisplayNumber}/${sequence}`
}
