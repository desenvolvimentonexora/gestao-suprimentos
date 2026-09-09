export type ModuleStatus = 'disponivel' | 'beta' | 'em-breve'

export interface StatusBadgeProps {
  status: ModuleStatus
}

const STATUS_CONFIG: Record<ModuleStatus, { label: string; className: string }> = {
  disponivel: { label: 'DISPONÍVEL', className: 'bg-badge-available text-on-primary' },
  beta: { label: 'BETA', className: 'bg-badge-beta text-on-primary' },
  'em-breve': { label: 'EM BREVE', className: 'bg-badge-soon text-ink' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${className}`}
    >
      {label}
    </span>
  )
}
