import type { CategoryRow } from './types'

export interface CategoryColumnProps {
  categories: CategoryRow[]
  selectedCategoryId: string | null
  onSelect: (categoryId: string | null) => void
}

function CategoryItem({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={onClick}
      className={`w-full rounded px-3 py-2 text-left text-sm transition duration-DEFAULT hover:bg-bg ${
        selected ? 'bg-bg font-medium text-ink' : 'text-ink-muted'
      }`}
    >
      {label}
    </button>
  )
}

export function CategoryColumn({ categories, selectedCategoryId, onSelect }: CategoryColumnProps) {
  return (
    <div className="flex flex-col gap-1">
      <CategoryItem label="Todos" selected={selectedCategoryId === null} onClick={() => onSelect(null)} />
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          label={category.name}
          selected={selectedCategoryId === category.id}
          onClick={() => onSelect(category.id)}
        />
      ))}
    </div>
  )
}
