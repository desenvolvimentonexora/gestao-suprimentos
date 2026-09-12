export interface CategoryRow {
  id: string
  name: string
  slug: string
  icon: string
}

export interface MaterialRow {
  id: string
  name: string
  categoryId: string
  supplierCount: number
  icon: string
  code: string | null
  description: string | null
}

export interface SupplierContactRow {
  name: string
  phone: string | null
  email: string | null
}

export interface SupplierReportRow {
  id: string
  name: string
  city: string | null
  contactName: string | null
  materials: string[]
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
