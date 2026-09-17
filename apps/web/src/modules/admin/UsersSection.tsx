import { Button, Card } from '../../components'
import type { AdminUserRow, RoleOption } from './types'

export interface UsersSectionProps {
  users: AdminUserRow[]
  roles: RoleOption[]
  onOpenInvite: () => void
  onChangeRole: (userId: string, roleId: string) => void
  onToggleActive: (userId: string, isActive: boolean) => void
  isSaving: boolean
}

export function UsersSection({
  users,
  roles,
  onOpenInvite,
  onChangeRole,
  onToggleActive,
  isSaving,
}: UsersSectionProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Usuários</h2>
        <Button onClick={onOpenInvite}>+ Convidar usuário</Button>
      </div>

      <div className="flex flex-col divide-y divide-line">
        {users.map((user) => (
          <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{user.fullName}</p>
              <p className="text-xs text-ink-muted">{user.email}</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <span className="sr-only">{`Papel de ${user.fullName}`}</span>
                <select
                  aria-label={`Papel de ${user.fullName}`}
                  value={user.roleIds[0] ?? ''}
                  disabled={isSaving}
                  onChange={(e) => onChangeRole(user.id, e.target.value)}
                  className="rounded border border-line bg-surface px-2 py-1 text-sm text-ink"
                >
                  <option value="">Sem papel</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              <span className="flex items-center gap-1 text-xs text-ink-muted">
                <span
                  className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-ink-muted'}`}
                  aria-hidden="true"
                />
                {user.isActive ? 'Ativo' : 'Inativo'}
              </span>

              <Button
                variant={user.isActive ? 'danger' : 'secondary'}
                disabled={isSaving}
                aria-label={user.isActive ? `Desativar ${user.fullName}` : `Ativar ${user.fullName}`}
                onClick={() => onToggleActive(user.id, !user.isActive)}
              >
                {user.isActive ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
