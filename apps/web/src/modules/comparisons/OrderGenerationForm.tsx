import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Input } from '../../components'
import { formatCurrency } from '../../lib/formatters'
import { getOrderTotal } from './getOrderTotal'
import type { CreateOrderValues, OrderDraftItem } from './types'

const orderFormSchema = z.object({
  orderNumber: z.string().min(1, 'Informe o número do pedido.'),
  expectedDeliveryDate: z.string(),
})

export interface OrderGenerationFormProps {
  items: OrderDraftItem[]
  suggestedOrderNumber: string
  onBack: () => void
  onSubmit: (values: CreateOrderValues) => void
  isSubmitting: boolean
}

export function OrderGenerationForm({
  items,
  suggestedOrderNumber,
  onBack,
  onSubmit,
  isSubmitting,
}: OrderGenerationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrderValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { orderNumber: suggestedOrderNumber, expectedDeliveryDate: '' },
  })

  const total = getOrderTotal(items)

  function submit(values: CreateOrderValues) {
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm text-ink-muted hover:text-ink">
        ← Voltar
      </button>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-ink-muted">
              <th className="py-2 pr-4 font-medium">Item</th>
              <th className="py-2 pr-4 font-medium">Fornecedor</th>
              <th className="py-2 pr-4 font-medium">Preço unit.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.requestItemId} className="border-b border-line">
                <td className="py-2 pr-4 text-ink">
                  {item.materialName}
                  <span className="text-ink-muted">
                    {' '}
                    — {item.quantity} {item.unitOfMeasure ?? ''}
                  </span>
                </td>
                <td className="py-2 pr-4 text-ink">{item.supplierName}</td>
                <td className="py-2 pr-4 text-ink">{formatCurrency(item.unitPrice, 'BRL')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded border border-line bg-badge-available/10 px-4 py-2 text-sm font-medium text-ink">
        Valor total: {formatCurrency(total, 'BRL')}
      </div>

      <Input label="Número do pedido" error={errors.orderNumber?.message} {...register('orderNumber')} />
      <Input label="Data prevista de entrega" type="date" {...register('expectedDeliveryDate')} />

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          Emitir pedido
        </Button>
      </div>
    </form>
  )
}
