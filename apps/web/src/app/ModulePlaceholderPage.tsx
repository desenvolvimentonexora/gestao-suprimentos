export interface ModulePlaceholderPageProps {
  label: string
}

export function ModulePlaceholderPage({ label }: ModulePlaceholderPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-ink">{label}</h1>
      <p className="mt-2 text-ink-muted">
        Este módulo está em construção e chega em uma próxima fase.
      </p>
    </div>
  )
}
