import { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button, Modal } from '../../components'
import { buildMaterialLookup } from './buildMaterialLookup'
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
  | { name: 'report'; result: ImportParseResult; auto: boolean }

function normalizeName(value: string): string {
  return value.trim().toLowerCase()
}

// O mapeamento salvo "serve" pro arquivo novo quando toda coluna que ele
// referencia (as não deixadas em branco) ainda existe no cabeçalho — aí dá
// pra pular a tela de mapeamento em vez de pedir confirmação de novo.
// `openStatusValue` fica de fora: não é nome de coluna, é o valor ("AB") que
// marca uma SOL como aberta dentro da coluna de situação.
function mappingMatchesColumns(mapping: ImportColumnMapping, columns: string[]): boolean {
  const columnSet = new Set(columns)
  return Object.entries(mapping)
    .filter(([field]) => field !== 'openStatusValue')
    .every(([, column]) => !column || columnSet.has(column))
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
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) return
    const sheet = workbook.Sheets[firstSheetName]
    if (!sheet) return
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    const headerRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })
    const columns = (headerRows[0] ?? []).map((column) => String(column))

    const savedMapping = mappingQuery.data
    if (savedMapping && mappingMatchesColumns(savedMapping, columns)) {
      runImport(savedMapping, rows, true)
      return
    }

    setStep({ name: 'mapping', columns, rows })
  }

  function runImport(mapping: ImportColumnMapping, rows: Record<string, unknown>[], auto: boolean) {
    const units = unitsQuery.data ?? []
    const materials = materialsQuery.data ?? []
    const unitsByName = new Map(units.map((unit) => [normalizeName(unit.name), unit.id]))
    // materialName é o nome do material "genérico" (a categoria, ex.:
    // "Abraçadeira Tipo U") — mais de uma variante (o insumo de verdade, com
    // código próprio) pode compartilhar esse nome. buildMaterialLookup só
    // casa por nome quando ele não é ambíguo, pra nunca escolher em silêncio
    // a variante errada quando duas compartilham o mesmo material.
    const materialLookup = buildMaterialLookup(materials)

    const result = parseImportRows(rows, mapping, {
      findUnitId: (name) => unitsByName.get(normalizeName(name)) ?? null,
      findMaterialId: ({ name, code }) =>
        (code ? materialLookup.findByCode(code) : null) ?? materialLookup.findByName(name),
    })

    if (result.successes.length > 0) {
      bulkCreate.mutate(result.successes)
    }

    setStep({ name: 'report', result, auto })
  }

  function handleMappingConfirm(mapping: ImportColumnMapping) {
    if (step.name !== 'mapping') return
    saveMapping.mutate(mapping)
    runImport(mapping, step.rows, false)
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
          {step.auto && (
            <p className="text-xs text-ink-muted">
              Mapeamento de colunas aplicado automaticamente (igual ao da última importação).
            </p>
          )}
          <p className="text-sm text-ink">
            {step.result.successes.length} requisições criadas (
            {step.result.successes.reduce((total, request) => total + request.items.length, 0)} itens).
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
