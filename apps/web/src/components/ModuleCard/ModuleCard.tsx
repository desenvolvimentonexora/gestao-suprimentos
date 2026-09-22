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

const CARD_HEIGHT = 'h-44'

function CardBody({ label, description, icon: Icon, status }: Omit<ModuleCardProps, 'route'>) {
  return (
    <>
      <div className="flex items-start justify-between">
        <Icon size={28} className="text-primary" aria-hidden="true" />
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 font-semibold text-ink">{label}</p>
      <p className="mt-1 line-clamp-3 text-sm text-ink-muted">{description}</p>
    </>
  )
}

export function ModuleCard({ label, description, icon, status, route }: ModuleCardProps) {
  const [showUnavailable, setShowUnavailable] = useState(false)

  const cardClassName = `w-full ${CARD_HEIGHT} flex flex-col rounded-lg border border-line bg-surface p-4 text-left transition duration-DEFAULT hover:-translate-y-0.5 hover:shadow-sm`

  if (status === 'em-breve') {
    return (
      <div
        className={`${CARD_HEIGHT} flex cursor-not-allowed flex-col rounded-lg border border-line bg-surface p-4 opacity-50`}
        aria-disabled="true"
      >
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
