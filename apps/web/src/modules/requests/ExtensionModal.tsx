import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Input, Modal } from '../../components'
import type { PendingItemSummary } from './buildExtensionMessage'

const extensionSchema = z.object({
  newNeededBy: z.string().min(1, 'Informe a nova data de entrega proposta.'),
  reason: z.string().min(1, 'Informe o motivo da prorrogação.'),
})

type FormShape = z.infer<typeof extensionSchema>

export interface ExtensionModalProps {
  isOpen: boolean
  onClose: () => void
  currentNeededBy: string | null
  pendingItems?: PendingItemSummary[]
  onSubmit: (values: { newNeededBy: string; reason: string }) => void
  isSubmitting: boolean
  submitError: string | null
}

export function ExtensionModal({
  isOpen,
  onClose,
  currentNeededBy,
  pendingItems = [],
  onSubmit,
  isSubmitting,
  submitError,
}: ExtensionModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormShape>({
    resolver: zodResolver(extensionSchema),
    defaultValues: { newNeededBy: '', reason: '' },
  })

  function submit(values: FormShape) {
    onSubmit(values)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pedir prorrogação">
      <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
        {currentNeededBy && (
          <p className="text-sm text-ink-muted">
            Entrega atual: {new Intl.DateTimeFormat('pt-BR').format(new Date(`${currentNeededBy}T00:00:00`))}
          </p>
        )}

        {pendingItems.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink">Itens sinalizados</span>
            <ul className="flex flex-col gap-1 rounded border border-line bg-bg p-3 text-sm text-ink">
              {pendingItems.map((item) => (
                <li key={item.materialName}>
                  <span className="font-medium">{item.materialName}</span>
                  {item.motivo && <span className="text-ink-muted"> — {item.motivo}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Input
          type="date"
          label="Nova data proposta"
          error={errors.newNeededBy?.message}
          {...register('newNeededBy')}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="extension-reason" className="text-sm font-medium text-ink">
            Motivo
          </label>
          <textarea
            id="extension-reason"
            rows={4}
            {...register('reason')}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          {errors.reason && <p className="text-xs text-accent">{errors.reason.message}</p>}
        </div>

        {submitError && <p className="text-sm text-accent">{submitError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          Enviar pedido de prorrogação
        </Button>
      </form>
    </Modal>
  )
}
