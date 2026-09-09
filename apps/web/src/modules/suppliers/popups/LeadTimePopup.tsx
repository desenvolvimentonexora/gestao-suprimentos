import { useState } from 'react'
import { Button, Input, Modal } from '../../../components'

export interface LeadTimePopupProps {
  isOpen: boolean
  onClose: () => void
  materialName: string
  initialDays: number | null
  onSave: (days: number | null) => void
  isSaving: boolean
}

export function LeadTimePopup({
  isOpen,
  onClose,
  materialName,
  initialDays,
  onSave,
  isSaving,
}: LeadTimePopupProps) {
  const [days, setDays] = useState(initialDays?.toString() ?? '')

  function handleSubmit() {
    onSave(days.trim() === '' ? null : Number(days))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Prazo — ${materialName}`}>
      <Input
        label="Prazo em dias"
        type="number"
        min={0}
        value={days}
        onChange={(e) => setDays(e.target.value)}
      />
      <p className="text-xs text-ink-muted">Este dado será importado do ERP futuramente.</p>
      <Button onClick={handleSubmit} disabled={isSaving}>
        Salvar
      </Button>
    </Modal>
  )
}
