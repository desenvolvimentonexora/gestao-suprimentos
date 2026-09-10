import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { Trash2 } from 'lucide-react'
import { z } from 'zod'
import { Button, Input, Modal } from '../../components'
import type { MaterialOption, RequestFormValues, UnitOption } from './types'

const itemSchema = z.object({
  materialId: z.string().min(1, 'Selecione o material.'),
  quantity: z.coerce.number().positive('Informe uma quantidade válida.'),
  unitOfMeasure: z.string(),
})

const requestFormSchema = z.object({
  unitId: z.string().min(1, 'Selecione a unidade.'),
  neededBy: z.string(),
  externalRef: z.string(),
  items: z.array(itemSchema).min(1, 'Adicione ao menos um item.'),
})

type FormShape = z.infer<typeof requestFormSchema>

export interface RequestFormModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialValues?: RequestFormValues
  units: UnitOption[]
  materials: MaterialOption[]
  onSubmit: (values: RequestFormValues) => void
  isSubmitting: boolean
}

function toFormShape(values?: RequestFormValues): FormShape {
  return {
    unitId: values?.unitId ?? '',
    neededBy: values?.neededBy ?? '',
    externalRef: values?.externalRef ?? '',
    items: values?.items.length
      ? values.items
      : [{ materialId: '', quantity: 0, unitOfMeasure: '' }],
  }
}

export function RequestFormModal({
  isOpen,
  onClose,
  mode,
  initialValues,
  units,
  materials,
  onSubmit,
  isSubmitting,
}: RequestFormModalProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormShape>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: toFormShape(initialValues),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  function submit(values: FormShape) {
    onSubmit(values)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nova requisição' : 'Editar requisição'}
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="request-unit" className="text-sm font-medium text-ink">
            Unidade
          </label>
          <select
            id="request-unit"
            {...register('unitId')}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">Selecione…</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
          {errors.unitId && <p className="text-xs text-accent">{errors.unitId.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Prazo" type="date" {...register('neededBy')} />
          <Input label="N° externo" {...register('externalRef')} />
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <span className="text-sm font-medium text-ink">Itens</span>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <label htmlFor={`item-material-${index}`} className="text-xs text-ink-muted">
                  Material
                </label>
                <select
                  id={`item-material-${index}`}
                  {...register(`items.${index}.materialId` as const)}
                  className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
                >
                  <option value="">Selecione…</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex w-24 flex-col gap-1">
                <label htmlFor={`item-quantity-${index}`} className="text-xs text-ink-muted">
                  Quantidade
                </label>
                <input
                  id={`item-quantity-${index}`}
                  type="number"
                  step="any"
                  {...register(`items.${index}.quantity` as const)}
                  className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
                />
              </div>
              <div className="flex w-24 flex-col gap-1">
                <label htmlFor={`item-unit-${index}`} className="text-xs text-ink-muted">
                  Unidade de medida
                </label>
                <input
                  id={`item-unit-${index}`}
                  {...register(`items.${index}.unitOfMeasure` as const)}
                  className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
                />
              </div>
              {fields.length > 1 && (
                <button
                  type="button"
                  aria-label={`Remover item ${index + 1}`}
                  onClick={() => remove(index)}
                  className="mb-2 text-ink-muted hover:text-accent"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          {errors.items?.message && <p className="text-xs text-accent">{errors.items.message}</p>}
          <Button
            type="button"
            variant="secondary"
            onClick={() => append({ materialId: '', quantity: 0, unitOfMeasure: '' })}
          >
            + Adicionar item
          </Button>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {mode === 'create' ? 'Criar requisição' : 'Salvar alterações'}
        </Button>
      </form>
    </Modal>
  )
}
