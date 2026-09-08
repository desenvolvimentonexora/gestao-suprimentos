import { Link } from 'react-router-dom'
import { formatLongDate } from '../../lib/formatters'
import { getModuleListItems } from '../getModuleListItems'
import type { ModuleDefinition, ModuleListItem } from '../types'
import { getGreeting } from './getGreeting'

export interface HomePageProps {
  fullName: string
  modules: ModuleDefinition[]
  licensedModules: string[]
  grantedPermissions: string[]
  now?: Date
}

function groupByWorkspace(items: ModuleListItem[]): Map<string, ModuleListItem[]> {
  const groups = new Map<string, ModuleListItem[]>()
  for (const item of items) {
    const group = groups.get(item.workspace) ?? []
    group.push(item)
    groups.set(item.workspace, group)
  }
  return groups
}

function ModuleRow({ item }: { item: ModuleListItem }) {
  const Icon = item.icon
  const content = (
    <div className="flex items-start gap-3 rounded px-2 py-2 transition duration-DEFAULT hover:bg-bg">
      <Icon size={18} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">{item.label}</span>
          {item.status === 'beta' && <span className="text-xs text-ink-muted">Beta</span>}
          {!item.licensed && <span className="text-xs text-ink-muted">não contratado</span>}
        </div>
        <p className="text-sm text-ink-muted">{item.description}</p>
      </div>
    </div>
  )

  if (!item.licensed) {
    return <div className="cursor-not-allowed opacity-50">{content}</div>
  }

  return (
    <Link to={item.route} className="block">
      {content}
    </Link>
  )
}

export function HomePage({
  fullName,
  modules,
  licensedModules,
  grantedPermissions,
  now = new Date(),
}: HomePageProps) {
  const items = getModuleListItems(modules, licensedModules, grantedPermissions)
  const groups = groupByWorkspace(items)

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-[32px] font-semibold text-ink">{getGreeting(fullName, now)}</h1>
      <p className="mt-1 text-ink-muted">{formatLongDate(now)}</p>

      <div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
        {Array.from(groups.entries()).map(([workspace, workspaceItems]) => (
          <section key={workspace}>
            <h2 className="text-base font-semibold text-ink">{workspace}</h2>
            <div className="mt-2 flex flex-col gap-1">
              {workspaceItems.map((item) => (
                <ModuleRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
