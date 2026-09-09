import { getIconComponent } from './iconMap'
import type { CategoryRow } from './types'

export interface CategoryColumnProps {
  categories: CategoryRow[]
  selectedCategoryId: string | null
  onSelect: (categoryId: string | null) => void
}

function CategoryItem({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string
  icon: string
  selected: boolean
  onClick: () => void
}) {
  const Icon = getIconComponent(icon)
  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition duration-DEFAULT hover:bg-bg ${
        selected ? 'bg-bg font-medium text-ink' : 'text-ink-muted'
      }`}
    >
      {/* eslint-disable-next-line react-hooks/static-components -- ICON_MAP é um mapa estático; o mesmo nome sempre resolve ao mesmo componente. */}
      <Icon
        size={16}
        className={selected ? 'text-primary' : 'text-ink-muted'}
        aria-hidden="true"
      />
      {label}
    </button>
  )
}

export function CategoryColumn({ categories, selectedCategoryId, onSelect }: CategoryColumnProps) {
  return (
    <div className="flex flex-col gap-1">
      <CategoryItem
        label="Todos"
        icon="layout-grid"
        selected={selectedCategoryId === null}
        onClick={() => onSelect(null)}
      />
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          label={category.name}
          icon={category.icon}
          selected={selectedCategoryId === category.id}
          onClick={() => onSelect(category.id)}
        />
      ))}
    </div>
  )
}
