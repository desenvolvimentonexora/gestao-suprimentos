import { useState } from 'react'
import { Button, Input, Modal } from '../../components'
import type { DispatchDetailsValues } from './api'
import type { MaterialWithSupplierCount, RequestRow, UnitOption } from './types'

export interface DisparoSolModalProps {
  isOpen: boolean
  onClose: () => void
  request: RequestRow
  units: UnitOption[]
  materials: MaterialWithSupplierCount[]
  onSubmit: (values: DispatchDetailsValues) => void
  isSubmitting: boolean
}

export function DisparoSolModal({
  isOpen,
  onClose,
  request,
  units,
  materials,
  onSubmit,
  isSubmitting,
}: DisparoSolModalProps) {
  const [unitId, setUnitId] = useState(request.unitId)
  const [subjectCategory, setSubjectCategory] = useState(request.subjectCategory ?? '')
  const [notes, setNotes] = useState(request.notes ?? '')
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedMaterialIds, setSelectedMaterialIds] = useState(
    () => new Set(request.items.map((item) => item.materialId)),
  )

  const unitName = units.find((unit) => unit.id === unitId)?.name ?? ''
  const label = request.externalRef ?? request.id

  const visibleMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(materialSearch.trim().toLowerCase()),
  )

  function toggleMaterial(materialId: string) {
    setSelectedMaterialIds((current) => {
      const next = new Set(current)
      if (next.has(materialId)) next.delete(materialId)
      else next.add(materialId)
      return next
    })
  }

  const selectedMaterialNames = materials
    .filter((material) => selectedMaterialIds.has(material.id))
    .map((material) => material.name)

  const subject = `Disparar SOL ${label}`
  const bodyLines = [
    `Obra: ${unitName}`,
    subjectCategory ? `Categoria: ${subjectCategory}` : null,
    selectedMaterialNames.length > 0 ? `Insumos: ${selectedMaterialNames.join(', ')}` : null,
    notes ? `Observação: ${notes}` : null,
  ].filter(Boolean)
  const mailtoHref = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`

  function handleDispatchClick() {
    onSubmit({ unitId, subjectCategory, notes })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Disparar SOL ${label}`}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">
          {request.unitName} · {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
        </p>

        <div className="rounded border border-line bg-badge-available/10 p-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="dispatch-unit" className="text-sm font-medium text-ink">
              Obra
            </label>
            <select
              id="dispatch-unit"
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
        </div>

        <Input
          label="Categoria do material (assunto)"
          value={subjectCategory}
          onChange={(e) => setSubjectCategory(e.target.value)}
        />

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <span className="text-sm font-medium text-ink">Insumos relacionados a esta SOL</span>
          <input
            type="search"
            placeholder="Buscar insumo"
            value={materialSearch}
            onChange={(e) => setMaterialSearch(e.target.value)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
            {visibleMaterials.map((material) => (
              <label key={material.id} className="flex items-center justify-between gap-2 text-sm text-ink">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMaterialIds.has(material.id)}
                    onChange={() => toggleMaterial(material.id)}
                  />
                  {material.name}
                </span>
                <span className="text-xs text-ink-muted">
                  {material.supplierCount} {material.supplierCount === 1 ? 'fornecedor' : 'fornecedores'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-line pt-3">
          <label htmlFor="dispatch-notes" className="text-sm font-medium text-ink">
            Observação
          </label>
          <textarea
            id="dispatch-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          <p className="text-xs text-ink-muted">Ficam registradas até a SOL ser aprovada.</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <a
            href={mailtoHref}
            onClick={handleDispatchClick}
            aria-disabled={isSubmitting}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Abrir Gmail e marcar como enviada
          </a>
        </div>
      </div>
    </Modal>
  )
}
