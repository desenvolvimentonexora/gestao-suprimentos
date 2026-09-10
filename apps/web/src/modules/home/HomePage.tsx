import { Link } from 'react-router-dom'
import { ModuleCard, ModuleGrid } from '../../components'
import { sectorRegistry } from '../registry'
import { getGreeting } from './getGreeting'
import { getPendingWorkMessage, type PendingWorkSummary } from './getPendingWorkMessage'

export interface HomePageProps {
  fullName: string
  onSignOut: () => void
  now?: Date
  pendingWork?: PendingWorkSummary
}

export function HomePage({ fullName, onSignOut, now = new Date(), pendingWork }: HomePageProps) {
  const pendingWorkSegments = pendingWork ? getPendingWorkMessage(pendingWork) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-dark to-primary px-6 py-12">
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

      <div className="mx-auto mt-10 max-w-6xl">
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
    </div>
  )
}
