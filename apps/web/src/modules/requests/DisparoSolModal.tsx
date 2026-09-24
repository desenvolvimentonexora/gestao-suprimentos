import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { Button, Input, Modal } from '../../components'
import type { DispatchDetailsValues } from './api'
import { formatRequestNumber } from './formatRequestNumber'
import { groupMaterialsByCategory } from './groupMaterialsByCategory'
import type { MaterialWithSupplierCount, RequestRow } from './types'

export interface DisparoSolModalProps {
  isOpen: boolean
  onClose: () => void
  request: RequestRow
  materials: MaterialWithSupplierCount[]
  onSubmit: (values: DispatchDetailsValues) => void
  isSubmitting: boolean
}

export function DisparoSolModal({
  isOpen,
  onClose,
  request,
  materials,
  onSubmit,
  isSubmitting,
}: DisparoSolModalProps) {
  const [subjectCategory, setSubjectCategory] = useState(request.subjectCategory ?? '')
  const [notes, setNotes] = useState(request.notes ?? '')
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedMaterialIds, setSelectedMaterialIds] = useState(
    () => new Set(request.items.map((item) => item.materialId)),
  )

  const label = formatRequestNumber(request.externalRef, request.sequenceNumber)

  const normalizedSearch = materialSearch.trim().toLowerCase()
  const filteredMaterials = normalizedSearch
    ? materials.filter((material) => material.name.toLowerCase().includes(normalizedSearch))
    : materials
  const groups = groupMaterialsByCategory(filteredMaterials)

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

  const subject = `Disparar ${label}`
  const bodyLines = [
    `Obra: ${request.unitName}`,
    subjectCategory ? `Categoria: ${subjectCategory}` : null,
    selectedMaterialNames.length > 0 ? `Insumos: ${selectedMaterialNames.join(', ')}` : null,
    notes ? `Observação: ${notes}` : null,
  ].filter(Boolean)
  const mailtoHref = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`

  function handleDispatchClick() {
    onSubmit({ unitId: request.unitId, subjectCategory, notes })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Disparar ${label}`}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">
          {request.unitName} · {request.items.length} {request.items.length === 1 ? 'item' : 'itens'}
        </p>

        <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <MapPin size={16} className="shrink-0 text-green-600" aria-hidden="true" />
          <span>
            Obra detectada: <span className="font-semibold">{request.unitName}</span>
          </span>
        </div>

        <Input
          label="Categoria do material (assunto)"
          value={subjectCategory}
          onChange={(e) => setSubjectCategory(e.target.value)}
        />

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <span className="text-sm font-medium text-ink">
            Insumos relacionados a esta SOL <span className="text-accent">*</span>
          </span>
          <p className="text-xs text-ink-muted">
            Selecione os insumos da Agenda que correspondem aos itens desta SOL. Os fornecedores aparecerão
            abaixo automaticamente.
          </p>
          <input
            type="search"
            placeholder="Buscar insumo"
            value={materialSearch}
            onChange={(e) => setMaterialSearch(e.target.value)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          <div className="flex max-h-52 flex-col gap-3 overflow-y-auto">
            {groups.map((group) => (
              <div key={group.categoryId} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 rounded bg-bg px-2 py-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink">
                    {group.categoryName}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {group.supplierCount} {group.supplierCount === 1 ? 'fornecedor cadastrado' : 'fornecedores cadastrados'}
                  </span>
                </div>
                {group.materials.map((material) => (
                  <label
                    key={material.id}
                    className="flex items-center justify-between gap-2 pl-2 text-sm text-ink"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMaterialIds.has(material.id)}
                        onChange={() => toggleMaterial(material.id)}
                      />
                      {material.code ? `${material.code} · ${material.name}` : material.name}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {material.supplierCount} {material.supplierCount === 1 ? 'fornecedor' : 'fornecedores'}
                    </span>
                  </label>
                ))}
              </div>
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
