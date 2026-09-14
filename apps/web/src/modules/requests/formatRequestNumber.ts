export function formatRequestNumber(externalRef: string | null, sequenceNumber: number | null): string {
  if (externalRef) return externalRef
  if (sequenceNumber != null) return `SOL ${sequenceNumber}`
  return '—'
}
