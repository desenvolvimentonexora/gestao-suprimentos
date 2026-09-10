import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components'
import type { ImportColumnMapping } from './types'

const mappingSchema = z.object({
  unit: z.string().min(1, 'Selecione a coluna correspondente.'),
  material: z.string().min(1, 'Selecione a coluna correspondente.'),
  quantity: z.string().min(1, 'Selecione a coluna correspondente.'),
  neededBy: z.string(),
  externalRef: z.string(),
})

export interface ImportMappingFormProps {
  columns: string[]
  initialMapping?: ImportColumnMapping
  onConfirm: (mapping: ImportColumnMapping) => void
  onCancel: () => void
}

const FIELDS: { name: keyof ImportColumnMapping; label: string; required: boolean }[] = [
  { name: 'unit', label: 'Unidade', required: true },
  { name: 'material', label: 'Material', required: true },
  { name: 'quantity', label: 'Quantidade', required: true },
  { name: 'neededBy', label: 'Prazo', required: false },
  { name: 'externalRef', label: 'N° externo', required: false },
]

export function ImportMappingForm({ columns, initialMapping, onConfirm, onCancel }: ImportMappingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ImportColumnMapping>({
    resolver: zodResolver(mappingSchema),
    defaultValues: initialMapping ?? {
      unit: '',
      material: '',
      quantity: '',
      neededBy: '',
      externalRef: '',
    },
  })

  function submit(values: ImportColumnMapping) {
    onConfirm(values)
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">
        Indique qual coluna da planilha corresponde a cada campo do sistema.
      </p>
      {FIELDS.map((field) => (
        <div key={field.name} className="flex flex-col gap-1">
          <label htmlFor={`mapping-${field.name}`} className="text-sm font-medium text-ink">
            {field.label}
          </label>
          <select
            id={`mapping-${field.name}`}
            {...register(field.name)}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">{field.required ? 'Selecione…' : 'Não mapear'}</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
          {errors[field.name] && <p className="text-xs text-accent">{errors[field.name]?.message}</p>}
        </div>
      ))}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Confirmar mapeamento</Button>
      </div>
    </form>
  )
}
