import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components'
import { useSettings } from '../../core/config'
import { IdentitySection } from './IdentitySection'
import { InviteUserModal } from './InviteUserModal'
import { ModulesSection } from './ModulesSection'
import {
  useAdminUsers,
  useInviteUser,
  useRoles,
  useSetUserActive,
  useUpdateSettings,
  useUpdateUserRole,
  useUploadLogo,
} from './queries'
import { UsersSection } from './UsersSection'
import { VocabularySection } from './VocabularySection'

export interface AdminPageProps {
  tenantId: string
}

type Tab = 'identidade' | 'vocabulario' | 'usuarios' | 'modulos'

const TABS: { id: Tab; label: string }[] = [
  { id: 'identidade', label: 'Identidade e tema' },
  { id: 'vocabulario', label: 'Vocabulário' },
  { id: 'usuarios', label: 'Usuários' },
  { id: 'modulos', label: 'Módulos ativos' },
]

export function AdminPage({ tenantId }: AdminPageProps) {
  const [tab, setTab] = useState<Tab>('identidade')
  const [inviteOpen, setInviteOpen] = useState(false)

  const settingsQuery = useSettings(tenantId)
  const rolesQuery = useRoles()
  const usersQuery = useAdminUsers()

  const updateSettings = useUpdateSettings(tenantId)
  const uploadLogo = useUploadLogo(tenantId)
  const inviteUser = useInviteUser()
  const updateUserRole = useUpdateUserRole()
  const setUserActive = useSetUserActive()

  const settings = settingsQuery.data
  const roles = rolesQuery.data ?? []

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-gradient-to-b from-primary-dark to-primary px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <Link to="/" className="text-sm text-on-primary hover:underline">
            ← Início
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-on-primary">Administração</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {TABS.map((item) => (
              <Button
                key={item.id}
                variant={tab === item.id ? 'primary' : 'on-primary'}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {!settings ? (
          <p className="text-sm text-ink-muted">Carregando…</p>
        ) : (
          <>
            {tab === 'identidade' && (
              <IdentitySection
                brand={{
                  name: settings.brand.name ?? '',
                  tagline: settings.brand.tagline ?? '',
                  logoUrl: settings.brand.logoUrl ?? '',
                }}
                theme={{
                  primary: settings.theme.primary ?? '#3A7769',
                  primaryDark: settings.theme.primaryDark ?? '#0E0E0E',
                  accent: settings.theme.accent ?? '#B45309',
                }}
                onSave={({ brand, theme }) => updateSettings.mutate({ brand, theme })}
                onUploadLogo={(file) => uploadLogo.mutateAsync(file)}
                isSaving={updateSettings.isPending}
              />
            )}

            {tab === 'vocabulario' && (
              <VocabularySection
                vocabulary={settings.vocabulary}
                onSave={(vocabulary) => updateSettings.mutate({ vocabulary })}
                isSaving={updateSettings.isPending}
              />
            )}

            {tab === 'usuarios' && (
              <>
                <UsersSection
                  users={usersQuery.data ?? []}
                  roles={roles}
                  onOpenInvite={() => setInviteOpen(true)}
                  onChangeRole={(userId, roleId) => updateUserRole.mutate({ userId, roleId })}
                  onToggleActive={(userId, isActive) => setUserActive.mutate({ userId, isActive })}
                  isSaving={updateUserRole.isPending || setUserActive.isPending}
                />
                <InviteUserModal
                  isOpen={inviteOpen}
                  onClose={() => setInviteOpen(false)}
                  roles={roles}
                  onInvite={(values) =>
                    inviteUser.mutate(values, { onSuccess: () => setInviteOpen(false) })
                  }
                  isSubmitting={inviteUser.isPending}
                />
              </>
            )}

            {tab === 'modulos' && (
              <ModulesSection
                activeModuleIds={settings.modules}
                onToggle={(moduleId, active) => {
                  const next = active
                    ? [...settings.modules, moduleId]
                    : settings.modules.filter((id) => id !== moduleId)
                  updateSettings.mutate({ modules: next })
                }}
                isSaving={updateSettings.isPending}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
