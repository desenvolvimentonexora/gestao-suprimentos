export function suggestOrderNumber(sequence: number): string {
  return `PED-${String(sequence).padStart(4, '0')}`
}
