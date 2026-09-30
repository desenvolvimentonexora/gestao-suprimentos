import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components'
import type { OrderImportColumnMapping } from './types'

// Material é só uma categoria interna do sistema (agrupa insumos) — alguns
// exports de ERP não têm essa coluna, só código do insumo e descrição. Por
// isso material e código não são cada um obrigatório sozinho, mas pelo menos
// um dos dois precisa estar mapeado (é o que identifica o insumo).
const mappingSchema = z
  .object({
    externalRef: z.string(),
    orderNumber: z.string().min(1, 'Selecione a coluna correspondente.'),
    unit: z.string(),
    supplier: z.string().min(1, 'Selecione a coluna correspondente.'),
    material: z.string(),
    materialCode: z.string(),
    quantity: z.string().min(1, 'Selecione a coluna correspondente.'),
    unitPrice: z.string().min(1, 'Selecione a coluna correspondente.'),
    expectedDeliveryDate: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.material && !data.materialCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['material'],
        message: 'Mapeie pelo menos o material ou o código do insumo.',
      })
    }
  })

export interface OrderImportMappingFormProps {
  columns: string[]
  initialMapping?: OrderImportColumnMapping
  onConfirm: (mapping: OrderImportColumnMapping) => void
  onCancel: () => void
}

const FIELDS: { name: keyof OrderImportColumnMapping; label: string; required: boolean }[] = [
  { name: 'externalRef', label: 'N° da SOL', required: false },
  { name: 'orderNumber', label: 'N° do pedido', required: true },
  { name: 'unit', label: 'Unidade', required: false },
  { name: 'supplier', label: 'Fornecedor', required: true },
  { name: 'material', label: 'Material', required: false },
  { name: 'materialCode', label: 'Código do insumo', required: false },
  { name: 'quantity', label: 'Quantidade', required: true },
  { name: 'unitPrice', label: 'Preço unitário', required: true },
  { name: 'expectedDeliveryDate', label: 'Data prevista de entrega', required: false },
]

export function OrderImportMappingForm({
  columns,
  initialMapping,
  onConfirm,
  onCancel,
}: OrderImportMappingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderImportColumnMapping>({
    resolver: zodResolver(mappingSchema),
    defaultValues: initialMapping ?? {
      externalRef: '',
      orderNumber: '',
      unit: '',
      supplier: '',
      material: '',
      materialCode: '',
      quantity: '',
      unitPrice: '',
      expectedDeliveryDate: '',
    },
  })

  function submit(values: OrderImportColumnMapping) {
    onConfirm(values)
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">
        Indique qual coluna da planilha do pedido corresponde a cada campo do sistema. Quando a SOL bate com
        uma comparação já liberada, o pedido usa a unidade dela — a coluna &ldquo;Unidade&rdquo; só é usada
        quando a SOL não é encontrada (pedido avulso).
      </p>
      {FIELDS.map((field) => (
        <div key={field.name} className="flex flex-col gap-1">
          <label htmlFor={`order-mapping-${field.name}`} className="text-sm font-medium text-ink">
            {field.label}
          </label>
          <select
            id={`order-mapping-${field.name}`}
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
