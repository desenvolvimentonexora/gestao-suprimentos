export interface WinnerLine {
  quantity: number
  unitPrice: number
  supplierId: string
}

export interface WinnersSummary {
  totalValue: number
  itemCount: number
  supplierCount: number
}

export function summarizeWinners(lines: WinnerLine[]): WinnersSummary {
  return {
    totalValue: lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
    itemCount: lines.length,
    supplierCount: new Set(lines.map((line) => line.supplierId)).size,
  }
}
