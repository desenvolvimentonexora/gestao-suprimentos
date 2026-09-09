import { supabase } from '../../lib/supabase'
import type { CategoryRow, MaterialRow } from './types'

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
