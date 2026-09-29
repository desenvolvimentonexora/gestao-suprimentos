import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components'
import type { ImportColumnMapping } from './types'

// Alguns exports de ERP não têm uma coluna de "material genérico" — só
// código do insumo e descrição específica. Por isso material e código não
// são cada um obrigatório sozinho, mas pelo menos um dos dois precisa estar
// mapeado (é o que identifica o insumo no parseImportRows/buildMaterialLookup).
const mappingSchema = z
  .object({
    unit: z.string().min(1, 'Selecione a coluna correspondente.'),
    material: z.string(),
    materialCode: z.string(),
    quantity: z.string().min(1, 'Selecione a coluna correspondente.'),
    unitOfMeasure: z.string(),
    neededBy: z.string(),
    externalRef: z.string(),
    status: z.string(),
    openStatusValue: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.material && !data.materialCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['material'],
        message: 'Mapeie pelo menos o material ou o código do insumo.',
      })
    }
    if (data.status && !data.openStatusValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['openStatusValue'],
        message: 'Informe qual valor da coluna indica uma SOL aberta.',
      })
    }
  })

export interface ImportMappingFormProps {
  columns: string[]
  initialMapping?: ImportColumnMapping
  onConfirm: (mapping: ImportColumnMapping) => void
  onCancel: () => void
}

const FIELDS: { name: keyof ImportColumnMapping; label: string; required: boolean }[] = [
  { name: 'unit', label: 'Unidade', required: true },
  { name: 'material', label: 'Material', required: false },
  { name: 'materialCode', label: 'Código do insumo', required: false },
  { name: 'quantity', label: 'Quantidade', required: true },
  { name: 'unitOfMeasure', label: 'Unidade de medida', required: false },
  { name: 'neededBy', label: 'Prazo', required: false },
  { name: 'externalRef', label: 'N° externo', required: false },
  { name: 'status', label: 'Situação da SOL', required: false },
]

export function ImportMappingForm({ columns, initialMapping, onConfirm, onCancel }: ImportMappingFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ImportColumnMapping>({
    resolver: zodResolver(mappingSchema),
    defaultValues: initialMapping ?? {
      unit: '',
      material: '',
      materialCode: '',
      quantity: '',
      unitOfMeasure: '',
      neededBy: '',
      externalRef: '',
      status: '',
      openStatusValue: '',
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library -- watch() do react-hook-form não é memoizável; aqui só controla a exibição condicional do campo de valor "aberto", sem risco de UI obsoleta.
  const statusColumn = watch('status')

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

          {field.name === 'status' && statusColumn && (
            <div className="mt-1 flex flex-col gap-1">
              <label htmlFor="mapping-openStatusValue" className="text-sm font-medium text-ink">
                Valor que indica SOL aberta
              </label>
              <input
                id="mapping-openStatusValue"
                type="text"
                placeholder='Ex.: "AB"'
                {...register('openStatusValue')}
                className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <p className="text-xs text-ink-muted">
                Linhas com outro valor nessa coluna são ignoradas na importação.
              </p>
              {errors.openStatusValue && (
                <p className="text-xs text-accent">{errors.openStatusValue.message}</p>
              )}
            </div>
          )}
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
