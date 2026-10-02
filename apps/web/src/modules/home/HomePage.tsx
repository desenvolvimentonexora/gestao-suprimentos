import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ModuleCard, ModuleGrid, UserMenu } from '../../components'
import { TaskBoardContainer } from '../tasks/TaskBoardContainer'
import { sectorRegistry } from '../registry'
import { getGreeting } from './getGreeting'
import { getPendingWorkMessage, type PendingWorkSummary } from './getPendingWorkMessage'

export interface HomePageProps {
  fullName: string
  onSignOut: () => void
  tenantId?: string
  userId?: string
  isAdmin?: boolean
  now?: Date
  pendingWork?: PendingWorkSummary
}

export function HomePage({
  fullName,
  onSignOut,
  tenantId = '',
  userId = '',
  isAdmin = false,
  now = new Date(),
  pendingWork,
}: HomePageProps) {
  const pendingWorkSegments = pendingWork ? getPendingWorkMessage(pendingWork) : null
  const [taskBoardOpen, setTaskBoardOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-dark to-primary px-6 py-12">
      <div className="flex items-center justify-between">
        <img
          src="/assets/logo-nexora.png"
          alt="Nexora"
          className="h-10 w-auto object-contain brightness-0 invert"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Abrir suporte"
            onClick={() => setTaskBoardOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/30 bg-black/20 px-4 py-1.5 text-sm text-on-primary transition duration-DEFAULT hover:bg-black/30"
          >
            <Paperclip size={16} aria-hidden="true" />
            Suporte
          </button>
          <UserMenu
            userName={fullName}
            onSignOut={onSignOut}
            triggerClassName="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/20 text-on-primary hover:bg-black/30"
          >
            {(closeMenu) =>
              isAdmin && (
                <Link
                  to="/admin"
                  role="menuitem"
                  onClick={closeMenu}
                  className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-bg"
                >
                  Administração
                </Link>
              )
            }
          </UserMenu>
        </div>
      </div>

      <h1 className="text-center text-3xl font-semibold text-on-primary">
        {getGreeting(fullName, now)}
      </h1>

      {pendingWorkSegments && (
        <p className="mt-2 text-center text-sm text-on-primary/80">
          {pendingWorkSegments.map((segment, index) => (
            <span key={segment.href}>
              {index > 0 && ' · '}
              <Link to={segment.href} className="underline hover:no-underline">
                {segment.text}
              </Link>
            </span>
          ))}
        </p>
      )}

      <div className="mx-auto mt-10 max-w-[960px]">
        <ModuleGrid>
          {sectorRegistry.map((item) => (
            <ModuleCard key={item.id} {...item} />
          ))}
        </ModuleGrid>
      </div>

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-full border border-white/30 bg-black/20 px-4 py-2 text-sm text-on-primary transition duration-DEFAULT hover:bg-black/30"
        >
          ↩ Sair da conta
        </button>
      </div>

      <TaskBoardContainer
        isOpen={taskBoardOpen}
        onClose={() => setTaskBoardOpen(false)}
        tenantId={tenantId}
        userId={userId}
      />
    </div>
  )
}
