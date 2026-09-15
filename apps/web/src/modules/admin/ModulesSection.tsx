import { Card } from '../../components'
import { getModuleToggleList } from './getModuleToggleList'

export interface ModulesSectionProps {
  activeModuleIds: string[]
  onToggle: (moduleId: string, active: boolean) => void
  isSaving: boolean
}

export function ModulesSection({ activeModuleIds, onToggle, isSaving }: ModulesSectionProps) {
  const modules = getModuleToggleList(activeModuleIds)

  return (
    <Card className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold text-ink">Módulos ativos</h2>
      <p className="text-sm text-ink-muted">
        Escolha quais ferramentas de Suprimentos aparecem para os usuários deste cliente.
      </p>
      <div className="mt-3 flex flex-col divide-y divide-line">
        {modules.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 py-2">
            <div>
              <p className="text-sm text-ink">{item.label}</p>
              {!item.implemented && <p className="text-xs text-ink-muted">Ainda não implementado</p>}
            </div>
            <input
              type="checkbox"
              aria-label={item.label}
              checked={item.active}
              disabled={!item.implemented || isSaving}
              onChange={(e) => onToggle(item.id, e.target.checked)}
              className="h-4 w-4 accent-primary disabled:opacity-40"
            />
          </div>
        ))}
      </div>
    </Card>
  )
}
