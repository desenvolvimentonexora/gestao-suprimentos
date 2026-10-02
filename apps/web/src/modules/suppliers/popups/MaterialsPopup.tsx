import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button, Input, Modal } from '../../../components'
import type { MaterialRow, MaterialVariantRow } from '../types'
import type { SupplierMaterialLinkRow } from './types'

export interface LeadTimes {
  purchaseDays: number | null
  pickingDays: number | null
  deliveryDays: number | null
}

export interface MaterialsPopupProps {
  isOpen: boolean
  onClose: () => void
  links: SupplierMaterialLinkRow[]
  allMaterials: MaterialRow[]
  allMaterialVariants: MaterialVariantRow[]
  onAddLink: (materialVariantId: string) => void
  onRemoveLink: (materialVariantId: string) => void
  onCreateVariant: (
    materialId: string,
    code: string,
    description: string,
    unitOfMeasure: string,
  ) => Promise<MaterialVariantRow>
  onUpdateLeadTimes: (materialVariantId: string, leadTimes: LeadTimes) => void
}

function variantLabel(variant: { materialName: string; code: string | null; description: string | null }) {
  const parts = [variant.materialName, variant.code, variant.description].filter(Boolean)
  return parts.join(' — ')
}

function parseDays(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function sumDays(leadTimes: LeadTimes): number | null {
  const { purchaseDays, pickingDays, deliveryDays } = leadTimes
  if (purchaseDays == null && pickingDays == null && deliveryDays == null) return null
  return (purchaseDays ?? 0) + (pickingDays ?? 0) + (deliveryDays ?? 0)
}

export function MaterialsPopup({
  isOpen,
  onClose,
  links,
  allMaterials,
  allMaterialVariants,
  onAddLink,
  onRemoveLink,
  onCreateVariant,
  onUpdateLeadTimes,
}: MaterialsPopupProps) {
  const [search, setSearch] = useState('')
  const [showNewVariantForm, setShowNewVariantForm] = useState(false)
  const [newMaterialId, setNewMaterialId] = useState(allMaterials[0]?.id ?? '')
  const [newCode, setNewCode] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newUnit, setNewUnit] = useState('')

  const linkedIds = new Set(links.map((link) => link.materialVariantId))
  const normalizedSearch = search.trim().toLowerCase()
  const suggestions =
    normalizedSearch.length > 0
      ? allMaterialVariants.filter(
          (variant) =>
            !linkedIds.has(variant.id) &&
            (variant.code?.toLowerCase().includes(normalizedSearch) ||
              variant.description?.toLowerCase().includes(normalizedSearch)),
        )
      : []

  function openNewVariantForm() {
    setNewCode(search.trim())
    setShowNewVariantForm(true)
  }

  function closeNewVariantForm() {
    setShowNewVariantForm(false)
    setNewCode('')
    setNewDescription('')
    setNewUnit('')
  }

  async function handleCreateVariant() {
    if (!newMaterialId || !newCode.trim()) return
    const variant = await onCreateVariant(
      newMaterialId,
      newCode.trim(),
      newDescription.trim(),
      newUnit.trim(),
    )
    onAddLink(variant.id)
    setSearch('')
    closeNewVariantForm()
  }

  function handleLeadTimeBlur(link: SupplierMaterialLinkRow, field: keyof LeadTimes, value: string) {
    onUpdateLeadTimes(link.materialVariantId, {
      purchaseDays: link.purchaseDays,
      pickingDays: link.pickingDays,
      deliveryDays: link.deliveryDays,
      [field]: parseDays(value),
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Materiais" maxWidthClassName="max-w-2xl">
      <div className="flex flex-col gap-3">
        {links.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-muted">
                  <th className="pb-1 pr-2 font-medium">Código</th>
                  <th className="pb-1 pr-2 font-medium">Descrição</th>
                  <th className="pb-1 pr-2 font-medium">Unidade</th>
                  <th className="pb-1 pr-2 text-right font-medium">Compra</th>
                  <th className="pb-1 pr-2 text-right font-medium">Picking</th>
                  <th className="pb-1 pr-2 text-right font-medium">Entrega</th>
                  <th className="pb-1 pr-2 text-right font-medium">Total</th>
                  <th className="pb-1" />
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const total = sumDays({
                    purchaseDays: link.purchaseDays,
                    pickingDays: link.pickingDays,
                    deliveryDays: link.deliveryDays,
                  })
                  return (
                    <tr key={link.materialVariantId} className="border-b border-line">
                      <td className="py-1.5 pr-2 text-ink">{link.code ?? '—'}</td>
                      <td className="py-1.5 pr-2 text-ink">{link.description ?? link.materialName}</td>
                      <td className="py-1.5 pr-2 text-ink-muted">{link.unitOfMeasure ?? '—'}</td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          min={0}
                          defaultValue={link.purchaseDays ?? ''}
                          aria-label={`Compra ${variantLabel(link)}`}
                          onBlur={(e) => handleLeadTimeBlur(link, 'purchaseDays', e.target.value)}
                          className="w-14 rounded border border-line bg-surface px-1.5 py-1 text-right text-sm text-ink"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          min={0}
                          defaultValue={link.pickingDays ?? ''}
                          aria-label={`Picking ${variantLabel(link)}`}
                          onBlur={(e) => handleLeadTimeBlur(link, 'pickingDays', e.target.value)}
                          className="w-14 rounded border border-line bg-surface px-1.5 py-1 text-right text-sm text-ink"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          min={0}
                          defaultValue={link.deliveryDays ?? ''}
                          aria-label={`Entrega ${variantLabel(link)}`}
                          onBlur={(e) => handleLeadTimeBlur(link, 'deliveryDays', e.target.value)}
                          className="w-14 rounded border border-line bg-surface px-1.5 py-1 text-right text-sm text-ink"
                        />
                      </td>
                      <td className="py-1.5 pr-2 text-right font-medium text-ink">{total ?? '—'}</td>
                      <td className="py-1.5">
                        <button
                          type="button"
                          aria-label={`Remover ${variantLabel(link)}`}
                          onClick={() => onRemoveLink(link.materialVariantId)}
                          className="text-ink-muted hover:text-accent"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-line pt-3">
          <div className="flex gap-2">
            <input
              type="search"
              placeholder="Buscar por código ou descrição"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
            {!showNewVariantForm && (
              <>
                <Button type="button" variant="secondary" onClick={openNewVariantForm}>
                  + Nova variação
                </Button>
                <Button type="button" variant="secondary">
                  Link
                </Button>
              </>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              {suggestions.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  aria-label={`Adicionar ${variantLabel(variant)}`}
                  onClick={() => {
                    onAddLink(variant.id)
                    setSearch('')
                  }}
                  className="rounded px-2 py-1 text-left text-sm text-ink hover:bg-bg"
                >
                  {variantLabel(variant)}
                </button>
              ))}
            </div>
          )}

          {showNewVariantForm && (
            <div className="mt-3 flex flex-col gap-2 rounded border border-line p-3">
              <p className="text-xs text-ink-muted">Cadastrar nova variação:</p>
              <div className="flex flex-col gap-1">
                <label htmlFor="new-variant-material" className="text-sm font-medium text-ink">
                  Material
                </label>
                <select
                  id="new-variant-material"
                  value={newMaterialId}
                  onChange={(e) => setNewMaterialId(e.target.value)}
                  className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
                >
                  {allMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Código" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
              <Input
                label="Descrição"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <Input label="Unidade" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
              <div className="flex gap-2">
                <Button type="button" onClick={handleCreateVariant} disabled={!newMaterialId || !newCode.trim()}>
                  + Adicionar variante
                </Button>
                <Button type="button" variant="ghost" onClick={closeNewVariantForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
