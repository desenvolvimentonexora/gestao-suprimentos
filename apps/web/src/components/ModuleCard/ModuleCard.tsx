import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge, type ModuleStatus } from '../StatusBadge/StatusBadge'

export interface ModuleCardProps {
  label: string
  description: string
  icon: LucideIcon
  status: ModuleStatus
  route?: string
}

function CardBody({ label, description, icon: Icon, status }: Omit<ModuleCardProps, 'route'>) {
  return (
    <>
      <div className="flex items-start justify-between">
        <Icon size={28} className="text-primary" aria-hidden="true" />
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 font-semibold text-ink">{label}</p>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
    </>
  )
}

export function ModuleCard({ label, description, icon, status, route }: ModuleCardProps) {
  const [showUnavailable, setShowUnavailable] = useState(false)

  const cardClassName =
    'w-full rounded-xl border border-line bg-surface p-4 text-left transition duration-DEFAULT hover:-translate-y-0.5 hover:shadow-sm'

  if (status === 'em-breve') {
    return (
      <div className="cursor-not-allowed rounded-xl border border-line bg-surface p-4 opacity-50" aria-disabled="true">
        <CardBody label={label} description={description} icon={icon} status={status} />
      </div>
    )
  }

  if (route) {
    return (
      <Link to={route} className={`block ${cardClassName}`}>
        <CardBody label={label} description={description} icon={icon} status={status} />
      </Link>
    )
  }

  return (
    <div>
      <button type="button" onClick={() => setShowUnavailable(true)} className={cardClassName}>
        <CardBody label={label} description={description} icon={icon} status={status} />
      </button>
      {showUnavailable && (
        <p className="mt-1 text-xs text-ink-muted" role="status">
          Módulo ainda não disponível
        </p>
      )}
    </div>
  )
}
