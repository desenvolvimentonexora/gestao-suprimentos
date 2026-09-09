import { Link } from 'react-router-dom'

export interface ModulePlaceholderPageProps {
  label: string
  backTo?: string
  backLabel?: string
}

export function ModulePlaceholderPage({
  label,
  backTo = '/',
  backLabel = 'Setores',
}: ModulePlaceholderPageProps) {
  return (
    <div className="p-6">
      <Link to={backTo} className="text-sm text-ink-muted hover:text-ink">
        ← {backLabel}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-ink">{label}</h1>
      <p className="mt-2 text-ink-muted">
        Este módulo está em construção e chega em uma próxima fase.
      </p>
    </div>
  )
}
