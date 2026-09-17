import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Modal } from '../../components'
import { buildClarificationMessage, type PendingItemSummary } from './buildClarificationMessage'

const clarificationSchema = z.object({
  message: z.string().min(1, 'Escreva a mensagem antes de enviar.'),
})

type FormShape = z.infer<typeof clarificationSchema>

export interface ClarificationModalProps {
  isOpen: boolean
  onClose: () => void
  pendingItems: PendingItemSummary[]
  onSubmit: (message: string) => void
  isSubmitting: boolean
  submitError: string | null
}

export function ClarificationModal({
  isOpen,
  onClose,
  pendingItems,
  onSubmit,
  isSubmitting,
  submitError,
}: ClarificationModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormShape>({
    resolver: zodResolver(clarificationSchema),
    defaultValues: { message: buildClarificationMessage(pendingItems) },
  })

  function submit(values: FormShape) {
    onSubmit(values.message)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitar esclarecimento">
      <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
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

        <div className="flex flex-col gap-1">
          <label htmlFor="clarification-message" className="text-sm font-medium text-ink">
            Mensagem para o engenheiro
          </label>
          <textarea
            id="clarification-message"
            rows={8}
            {...register('message')}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          {errors.message && <p className="text-xs text-accent">{errors.message.message}</p>}
        </div>

        {submitError && <p className="text-sm text-accent">{submitError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          Enviar solicitação de esclarecimento
        </Button>
      </form>
    </Modal>
  )
}
