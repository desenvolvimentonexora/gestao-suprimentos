import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button, Modal } from '../../components'
import { OrderImportMappingForm } from './OrderImportMappingForm'
import { parseOrderImportRows, type OrderImportLookup } from './parseOrderImportRows'
import {
  useBulkImportOrders,
  useOrderImportContext,
  useOrderImportMapping,
  useSaveOrderImportMapping,
} from './queries'
import type { OrderImportColumnMapping, OrderImportParseResult } from './types'

export interface OrderImportModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
}

type Step =
  | { name: 'upload' }
  | { name: 'mapping'; columns: string[]; rows: Record<string, unknown>[] }
  | { name: 'report'; result: OrderImportParseResult }

function normalizeName(value: string): string {
  return value.trim().toLowerCase()
}

function exportErrorsToExcel(errors: OrderImportParseResult['errors']) {
  const sheetRows = errors.map((error) => ({ Linha: error.row, Motivo: error.reason }))
  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Erros')
  XLSX.writeFile(workbook, 'pedidos-erros.xlsx')
}

export function OrderImportModal({ isOpen, onClose, tenantId }: OrderImportModalProps) {
  const [step, setStep] = useState<Step>({ name: 'upload' })

  const mappingQuery = useOrderImportMapping()
  const contextQuery = useOrderImportContext(isOpen)
  const saveMapping = useSaveOrderImportMapping(tenantId)
  const bulkImport = useBulkImportOrders(tenantId)

  function handleClose() {
    setStep({ name: 'upload' })
    onClose()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) return
    const sheet = workbook.Sheets[firstSheetName]
    if (!sheet) return
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    const headerRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })
    const columns = (headerRows[0] ?? []).map((column) => String(column))

    setStep({ name: 'mapping', columns, rows })
  }

  function handleMappingConfirm(mapping: OrderImportColumnMapping) {
    if (step.name !== 'mapping') return

    saveMapping.mutate(mapping)

    const context = contextQuery.data
    if (!context) return

    const comparisonsByRef = new Map(
      context.comparisons.map((comparison) => [normalizeName(comparison.externalRef), comparison]),
    )
    const suppliersByName = new Map(context.suppliers.map((supplier) => [normalizeName(supplier.name), supplier.id]))
    const materialsByName = new Map(context.materials.map((material) => [normalizeName(material.name), material.id]))
    const materialsByCode = new Map(
      context.materials
        .filter((material) => material.code)
        .map((material) => [normalizeName(material.code!), material.id]),
    )
    const requestItemsByRequestAndMaterial = new Map(
      context.requestItems.map((item) => [`${item.requestId}:${item.materialId}`, item.id]),
    )

    const lookup: OrderImportLookup = {
      findComparisonByExternalRef: (ref) => {
        const comparison = comparisonsByRef.get(normalizeName(ref))
        return comparison
          ? {
              comparisonId: comparison.comparisonId,
              requestId: comparison.requestId,
              unitId: comparison.unitId,
              hasOrder: comparison.hasOrder,
            }
          : null
      },
      findSupplierId: (name) => suppliersByName.get(normalizeName(name)) ?? null,
      findMaterialId: ({ name, code }) =>
        (code ? materialsByCode.get(normalizeName(code)) : undefined) ??
        materialsByName.get(normalizeName(name)) ??
        null,
      findRequestItemId: ({ requestId, materialId }) =>
        materialId ? (requestItemsByRequestAndMaterial.get(`${requestId}:${materialId}`) ?? null) : null,
    }

    const result = parseOrderImportRows(step.rows, mapping, lookup)

    if (result.successes.length > 0) {
      bulkImport.mutate(result.successes)
    }

    setStep({ name: 'report', result })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar pedidos">
      {step.name === 'upload' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">
            Selecione a planilha (.xlsx) do pedido de compra exportada do ERP. Cada linha precisa trazer o
            número da SOL para casar com a comparação já liberada.
          </p>
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
        </div>
      )}

      {step.name === 'mapping' && (
        <OrderImportMappingForm
          columns={step.columns}
          initialMapping={mappingQuery.data ?? undefined}
          onConfirm={handleMappingConfirm}
          onCancel={() => setStep({ name: 'upload' })}
        />
      )}

      {step.name === 'report' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">
            {step.result.successes.length} pedidos importados.
            {step.result.errors.length > 0 && ` ${step.result.errors.length} linhas com erro.`}
          </p>
          {step.result.errors.length > 0 && (
            <>
              <ul className="max-h-40 overflow-y-auto text-sm text-ink-muted">
                {step.result.errors.map((error) => (
                  <li key={error.row}>
                    Linha {error.row}: {error.reason}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" onClick={() => exportErrorsToExcel(step.result.errors)}>
                Baixar linhas com erro
              </Button>
            </>
          )}
          <Button onClick={handleClose}>Concluir</Button>
        </div>
      )}
    </Modal>
  )
}
