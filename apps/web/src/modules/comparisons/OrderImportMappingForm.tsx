import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../components'
import type { OrderImportColumnMapping } from './types'

const mappingSchema = z.object({
  externalRef: z.string().min(1, 'Selecione a coluna correspondente.'),
  orderNumber: z.string().min(1, 'Selecione a coluna correspondente.'),
  supplier: z.string().min(1, 'Selecione a coluna correspondente.'),
  material: z.string().min(1, 'Selecione a coluna correspondente.'),
  materialCode: z.string(),
  quantity: z.string().min(1, 'Selecione a coluna correspondente.'),
  unitPrice: z.string().min(1, 'Selecione a coluna correspondente.'),
  expectedDeliveryDate: z.string(),
})

export interface OrderImportMappingFormProps {
  columns: string[]
  initialMapping?: OrderImportColumnMapping
  onConfirm: (mapping: OrderImportColumnMapping) => void
  onCancel: () => void
}

const FIELDS: { name: keyof OrderImportColumnMapping; label: string; required: boolean }[] = [
  { name: 'externalRef', label: 'N° da SOL', required: true },
  { name: 'orderNumber', label: 'N° do pedido', required: true },
  { name: 'supplier', label: 'Fornecedor', required: true },
  { name: 'material', label: 'Material', required: true },
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
        Indique qual coluna da planilha do pedido corresponde a cada campo do sistema.
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
