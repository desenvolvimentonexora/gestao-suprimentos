import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ModuleCard, ModuleGrid } from '../../components'
import { useSettings } from '../../core/config'
import { getGreeting } from '../home/getGreeting'
import { suprimentosRegistry } from '../registry'
import { filterActiveModules } from './filterActiveModules'

export interface SuprimentosPageProps {
  fullName: string
  onSignOut: () => void
  tenantId?: string
  now?: Date
}

export function SuprimentosPage({ fullName, onSignOut, tenantId, now = new Date() }: SuprimentosPageProps) {
  const settingsQuery = useSettings(tenantId)
  const requestLabel = settingsQuery.data?.vocabulary.request ?? 'SOL'
  const visibleModules = settingsQuery.data
    ? filterActiveModules(suprimentosRegistry, settingsQuery.data.modules)
    : suprimentosRegistry
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-dark to-primary px-6 py-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-primary/70"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder={`Buscar ${requestLabel}`}
            aria-label={`Buscar ${requestLabel}`}
            className="w-full rounded-full border border-white/20 bg-white/10 py-2 pl-9 pr-4 text-sm text-on-primary placeholder:text-on-primary/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          />
        </div>

        <h1 className="order-first text-xl font-semibold text-on-primary sm:order-none">
          {getGreeting(fullName, now)}
        </h1>

        <Link
          to="/"
          className="shrink-0 rounded-full border border-white/30 bg-black/20 px-4 py-2 text-sm text-on-primary transition duration-DEFAULT hover:bg-black/30"
        >
          ← Setores
        </Link>
      </div>

      <div className="mx-auto mt-10 max-w-6xl">
        <ModuleGrid>
          {visibleModules.map((item) => (
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
