import * as XLSX from 'xlsx'
import { Button, Modal } from '../../components'
import type { SupplierReportRow } from './types'

export interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  rows: SupplierReportRow[]
}

function exportToExcel(rows: SupplierReportRow[]) {
  const sheetRows = rows.map((row) => ({
    Nome: row.name,
    Materiais: row.materials.join(', '),
    Cidade: row.city ?? '',
    Contato: row.contactName ?? '',
  }))
  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fornecedores')
  XLSX.writeFile(workbook, 'fornecedores.xlsx')
}

export function ReportModal({ isOpen, onClose, rows }: ReportModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Relatório de Fornecedores">
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-1 pr-2">Nome</th>
              <th className="py-1 pr-2">Materiais</th>
              <th className="py-1 pr-2">Cidade</th>
              <th className="py-1 pr-2">Contato</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line">
                <td className="py-1 pr-2 text-ink">{row.name}</td>
                <td className="py-1 pr-2 text-ink-muted">{row.materials.join(', ')}</td>
                <td className="py-1 pr-2 text-ink-muted">{row.city}</td>
                <td className="py-1 pr-2 text-ink-muted">{row.contactName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={() => exportToExcel(rows)}>Exportar Excel</Button>
    </Modal>
  )
}
