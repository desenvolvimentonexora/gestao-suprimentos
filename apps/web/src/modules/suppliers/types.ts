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

export interface SupplierContactRow {
  name: string
  phone: string | null
  email: string | null
}

export interface SupplierRow {
  id: string
  name: string
  city: string | null
  type: string | null
  status: 'active' | 'inactive'
  mainContact: SupplierContactRow | null
  createdByName: string | null
}
