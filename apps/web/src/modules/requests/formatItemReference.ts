export function formatItemReference(externalRef: string | null, requestId: string, index: number): string {
  const sequence = String(index + 1).padStart(3, '0')
  return `${externalRef ?? requestId}/${sequence}`
}
