import { useState } from 'react'
import { getIconComponent, ICON_OPTIONS } from './iconMap'

export interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState('')

  const visibleOptions = ICON_OPTIONS.filter((name) =>
    name.includes(search.trim().toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        placeholder="Buscar ícone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
      />
      <div className="grid grid-cols-8 gap-1">
        {visibleOptions.map((name) => {
          const Icon = getIconComponent(name)
          const selected = name === value
          return (
            <button
              key={name}
              type="button"
              aria-label={name}
              aria-pressed={selected}
              onClick={() => onChange(name)}
              className={`flex items-center justify-center rounded p-2 hover:bg-bg ${
                selected ? 'bg-bg text-primary' : 'text-ink-muted'
              }`}
            >
              <Icon size={18} aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
