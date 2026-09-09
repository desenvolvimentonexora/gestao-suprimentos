export interface CategoryRow {
  id: string
  name: string
  slug: string
}

export interface MaterialRow {
  id: string
  name: string
  categoryId: string
  supplierCount: number
}
