import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Input, Modal } from '../../components'
import type { InviteUserValues, RoleOption } from './types'

const inviteSchema = z.object({
  fullName: z.string().min(1, 'Campo obrigatório.'),
  email: z.string().min(1, 'Campo obrigatório.').email('E-mail inválido.'),
  roleId: z.string().min(1, 'Campo obrigatório.'),
})

export interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  roles: RoleOption[]
  onInvite: (values: InviteUserValues) => void
  isSubmitting: boolean
}

export function InviteUserModal({ isOpen, onClose, roles, onInvite, isSubmitting }: InviteUserModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteUserValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { fullName: '', email: '', roleId: '' },
  })

  function handleClose() {
    reset()
    onClose()
  }

  function submit(values: InviteUserValues) {
    onInvite(values)
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Convidar usuário">
      <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
        <Input label="Nome" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />

        <div className="flex flex-col gap-1">
          <label htmlFor="invite-role" className="text-sm font-medium text-ink">
            Papel
          </label>
          <select
            id="invite-role"
            {...register('roleId')}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">Selecione…</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {errors.roleId && <p className="text-xs text-accent">{errors.roleId.message}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Enviar convite
          </Button>
        </div>
      </form>
    </Modal>
  )
}
