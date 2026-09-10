import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Input, Modal } from '../../components'
import type { NegotiatingRequestItemRow, QuotationFormValues, SupplierOption } from './types'

const itemSchema = z.object({
  requestItemId: z.string(),
  unitPrice: z.string().refine((value) => {
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) && parsed > 0
  }, 'Informe um preço válido.'),
  leadTimeDays: z.string(),
})

const quotationFormSchema = z.object({
  supplierId: z.string().min(1, 'Selecione o fornecedor.'),
  items: z.array(itemSchema),
})

type FormShape = z.infer<typeof quotationFormSchema>

export interface QuotationFormModalProps {
  isOpen: boolean
  onClose: () => void
  suppliers: SupplierOption[]
  requestItems: NegotiatingRequestItemRow[]
  onSubmit: (values: QuotationFormValues) => void
  isSubmitting: boolean
}

export function QuotationFormModal({
  isOpen,
  onClose,
  suppliers,
  requestItems,
  onSubmit,
  isSubmitting,
}: QuotationFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormShape>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      supplierId: '',
      items: requestItems.map((item) => ({ requestItemId: item.id, unitPrice: '', leadTimeDays: '' })),
    },
  })

  function submit(values: FormShape) {
    onSubmit(values)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar cotação">
      <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="quotation-supplier" className="text-sm font-medium text-ink">
            Fornecedor
          </label>
          <select
            id="quotation-supplier"
            {...register('supplierId')}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">Selecione…</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          {errors.supplierId && <p className="text-xs text-accent">{errors.supplierId.message}</p>}
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-3">
          {requestItems.map((item, index) => (
            <div key={item.id} className="flex items-end gap-2">
              <div className="flex-1">
                <p className="text-sm text-ink">{item.materialName}</p>
                <p className="text-xs text-ink-muted">
                  {item.quantity} {item.unitOfMeasure ?? ''}
                </p>
              </div>
              <Input
                label="Preço unitário"
                error={errors.items?.[index]?.unitPrice?.message}
                {...register(`items.${index}.unitPrice` as const)}
              />
              <Input label="Prazo (dias)" {...register(`items.${index}.leadTimeDays` as const)} />
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          Registrar cotação
        </Button>
      </form>
    </Modal>
  )
}
