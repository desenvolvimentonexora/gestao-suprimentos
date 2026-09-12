import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button, Modal } from '../../components'
import { ImportMappingForm } from './ImportMappingForm'
import { parseImportRows } from './parseImportRows'
import { useBulkCreateRequests, useImportMapping, useMaterialOptions, useSaveImportMapping, useUnitOptions } from './queries'
import type { ImportColumnMapping, ImportParseResult } from './types'

export interface ImportRequestsModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
}

type Step =
  | { name: 'upload' }
  | { name: 'mapping'; columns: string[]; rows: Record<string, unknown>[] }
  | { name: 'report'; result: ImportParseResult }

function normalizeName(value: string): string {
  return value.trim().toLowerCase()
}

function exportErrorsToExcel(errors: ImportParseResult['errors']) {
  const sheetRows = errors.map((error) => ({ Linha: error.row, Motivo: error.reason }))
  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Erros')
  XLSX.writeFile(workbook, 'requisicoes-erros.xlsx')
}

export function ImportRequestsModal({ isOpen, onClose, tenantId }: ImportRequestsModalProps) {
  const [step, setStep] = useState<Step>({ name: 'upload' })

  const mappingQuery = useImportMapping()
  const unitsQuery = useUnitOptions()
  const materialsQuery = useMaterialOptions()
  const saveMapping = useSaveImportMapping(tenantId)
  const bulkCreate = useBulkCreateRequests(tenantId)

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

  function handleMappingConfirm(mapping: ImportColumnMapping) {
    if (step.name !== 'mapping') return

    saveMapping.mutate(mapping)

    const units = unitsQuery.data ?? []
    const materials = materialsQuery.data ?? []
    const unitsByName = new Map(units.map((unit) => [normalizeName(unit.name), unit.id]))
    const materialsByName = new Map(materials.map((material) => [normalizeName(material.name), material.id]))
    const materialsByCode = new Map(
      materials.filter((material) => material.code).map((material) => [normalizeName(material.code!), material.id]),
    )

    const result = parseImportRows(step.rows, mapping, {
      findUnitId: (name) => unitsByName.get(normalizeName(name)) ?? null,
      findMaterialId: ({ name, code }) =>
        (code ? materialsByCode.get(normalizeName(code)) : undefined) ??
        materialsByName.get(normalizeName(name)) ??
        null,
    })

    if (result.successes.length > 0) {
      bulkCreate.mutate(result.successes)
    }

    setStep({ name: 'report', result })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar requisições">
      {step.name === 'upload' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">
            Selecione a planilha (.xlsx) com as requisições do dia.
          </p>
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
        </div>
      )}

      {step.name === 'mapping' && (
        <ImportMappingForm
          columns={step.columns}
          initialMapping={mappingQuery.data ?? undefined}
          onConfirm={handleMappingConfirm}
          onCancel={() => setStep({ name: 'upload' })}
        />
      )}

      {step.name === 'report' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">
            {step.result.successes.length} requisições criadas.
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
