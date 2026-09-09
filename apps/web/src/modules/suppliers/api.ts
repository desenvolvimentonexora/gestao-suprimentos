import { supabase } from '../../lib/supabase'
import type { CategoryRow, MaterialRow, SupplierRow } from './types'

export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('supply_categories')
    .select('id, name, slug')
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data
}

export async function fetchMaterials(): Promise<MaterialRow[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('id, name, category_id, supplier_materials(count)')
    .is('deleted_at', null)
    .order('name')

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    supplierCount: row.supplier_materials[0]?.count ?? 0,
  }))
}

export interface SupplierFilter {
  search: string
  type: string | null
  page: number
  pageSize: number
}

export interface SupplierPage {
  rows: SupplierRow[]
  total: number
}

export async function fetchSuppliersByMaterial(
  materialId: string,
  { search, type, page, pageSize }: SupplierFilter,
): Promise<SupplierPage> {
  const from = page * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('suppliers')
    .select(
      'id, name, city, type, status, created_by, supplier_contacts(name, phone, email), supplier_materials!inner(material_id)',
      { count: 'exact' },
    )
    .eq('supplier_materials.material_id', materialId)
    .is('deleted_at', null)
    .order('name')
    .range(from, to)

  if (search.trim()) query = query.ilike('name', `%${search.trim()}%`)
  if (type) query = query.eq('type', type)

  const { data, error, count } = await query
  if (error) throw error

  const createdByIds = [...new Set(data.map((row) => row.created_by).filter(Boolean))] as string[]
  const namesByUserId = new Map<string, string>()
  if (createdByIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', createdByIds)
    if (usersError) throw usersError
    for (const user of users) namesByUserId.set(user.id, user.full_name)
  }

  const rows: SupplierRow[] = data.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    type: row.type,
    status: row.status as SupplierRow['status'],
    mainContact: row.supplier_contacts[0]
      ? {
          name: row.supplier_contacts[0].name,
          phone: row.supplier_contacts[0].phone,
          email: row.supplier_contacts[0].email,
        }
      : null,
    createdByName: row.created_by ? (namesByUserId.get(row.created_by) ?? null) : null,
  }))

  return { rows, total: count ?? 0 }
}

export async function fetchFavoriteSupplierIds(supplierIds: string[]): Promise<Set<string>> {
  if (supplierIds.length === 0) return new Set()

  const { data, error } = await supabase
    .from('supplier_favorites')
    .select('supplier_id')
    .in('supplier_id', supplierIds)

  if (error) throw error
  return new Set(data.map((row) => row.supplier_id))
}

export async function setFavoriteSupplier(
  tenantId: string,
  userId: string,
  supplierId: string,
  favorite: boolean,
): Promise<void> {
  if (favorite) {
    const { error } = await supabase
      .from('supplier_favorites')
      .upsert({ tenant_id: tenantId, user_id: userId, supplier_id: supplierId })
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('supplier_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('supplier_id', supplierId)
  if (error) throw error
}

export async function deleteMaterial(materialId: string): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', materialId)
  if (error) throw error
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', supplierId)
  if (error) throw error
}

export async function createMaterial(
  tenantId: string,
  name: string,
  categoryId: string,
): Promise<MaterialRow> {
  const { data, error } = await supabase
    .from('materials')
    .insert({ tenant_id: tenantId, name, category_id: categoryId })
    .select('id, name, category_id')
    .single()

  if (error) throw error

  return { id: data.id, name: data.name, categoryId: data.category_id, supplierCount: 0 }
}
