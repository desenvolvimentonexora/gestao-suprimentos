import { ModuleCard, ModuleGrid } from '../../components'
import { sectorRegistry } from '../registry'
import { getGreeting } from './getGreeting'

export interface HomePageProps {
  fullName: string
  onSignOut: () => void
  now?: Date
}

export function HomePage({ fullName, onSignOut, now = new Date() }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-dark to-primary px-6 py-12">
      <h1 className="text-center text-3xl font-semibold text-on-primary">
        {getGreeting(fullName, now)}
      </h1>

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
