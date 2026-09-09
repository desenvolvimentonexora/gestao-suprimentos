import { useState } from 'react'
import { Input, Modal } from '../../../components'

export interface QuoteRequestSupplier {
  id: string
  name: string
  email: string
}

export interface QuoteRequestUnit {
  id: string
  name: string
}

export interface QuoteRequestModalProps {
  isOpen: boolean
  onClose: () => void
  materialName: string
  suppliersWithEmail: QuoteRequestSupplier[]
  units: QuoteRequestUnit[]
}

export function QuoteRequestModal({
  isOpen,
  onClose,
  materialName,
  suppliersWithEmail,
  units,
}: QuoteRequestModalProps) {
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const [solNumber, setSolNumber] = useState('')

  const unitName = units.find((unit) => unit.id === unitId)?.name ?? ''

  const subject = `Solicitação de cotação — ${materialName}`
  const bodyLines = [
    `Obra: ${unitName}`,
    `Material: ${materialName}`,
    solNumber ? `N° da SOL: ${solNumber}` : null,
  ].filter(Boolean)
  const bcc = suppliersWithEmail.map((supplier) => supplier.email).join(',')
  const mailtoHref = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pedir Orçamento">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Fornecedores</p>
          <p className="text-xs text-ink-muted">Vão via cópia oculta (BCC).</p>
          <ul className="mt-1 text-sm text-ink-muted">
            {suppliersWithEmail.map((supplier) => (
              <li key={supplier.id}>{supplier.name}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="quote-unit" className="text-sm font-medium text-ink">
            Obra
          </label>
          <select
            id="quote-unit"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        <Input label="Material" value={materialName} readOnly />

        <Input
          label="N° da SOL"
          value={solNumber}
          onChange={(e) => setSolNumber(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-line px-4 py-2 text-sm text-ink hover:bg-bg"
          >
            Cancelar
          </button>
          <a
            href={mailtoHref}
            className="rounded bg-primary px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Abrir no Outlook
          </a>
        </div>
      </div>
    </Modal>
  )
}
