import { supabase } from '../../lib/supabase'
import type { SupplierFormValues } from './SupplierFormModal'
import type { CategoryRow, MaterialRow, SupplierReportRow, SupplierRow } from './types'

export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('supply_categories')
    .select('id, name, slug, icon')
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data
}

export async function fetchMaterials(): Promise<MaterialRow[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('id, name, category_id, icon, code, description, supplier_materials(count)')
    .is('deleted_at', null)
    .order('name')

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    icon: row.icon,
    code: row.code,
    description: row.description,
    supplierCount: row.supplier_materials[0]?.count ?? 0,
  }))
}

export async function updateMaterial(
  materialId: string,
  values: { name: string; categoryId: string; icon: string; code: string; description: string },
): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .update({
      name: values.name,
      category_id: values.categoryId,
      icon: values.icon,
      code: values.code || null,
      description: values.description || null,
    })
    .eq('id', materialId)
  if (error) throw error
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

export async function fetchSupplierReport(): Promise<SupplierReportRow[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, city, supplier_contacts(name), supplier_materials(materials(name))')
    .is('deleted_at', null)
    .order('name')

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    contactName: row.supplier_contacts[0]?.name ?? null,
    materials: row.supplier_materials
      .map((link) => link.materials?.name)
      .filter((name): name is string => Boolean(name)),
  }))
}

export async function fetchUnits(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('units')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data
}

export async function fetchSupplierEmailsByMaterial(
  materialId: string,
): Promise<{ id: string; name: string; email: string }[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, supplier_contacts(email), supplier_materials!inner(material_id)')
    .eq('supplier_materials.material_id', materialId)
    .is('deleted_at', null)
    .order('name')

  if (error) throw error

  return data
    .map((row) => ({ id: row.id, name: row.name, email: row.supplier_contacts[0]?.email ?? null }))
    .filter((row): row is { id: string; name: string; email: string } => Boolean(row.email))
}

export async function fetchSupplierDetail(supplierId: string): Promise<SupplierFormValues> {
  const { data, error } = await supabase
    .from('suppliers')
    .select(
      'name, type, city, status, notes, supplier_contacts(name, phone, email), supplier_documents(cnpj), supplier_materials(material_id)',
    )
    .eq('id', supplierId)
    .single()

  if (error) throw error

  return {
    name: data.name,
    type: data.type ?? '',
    city: data.city ?? '',
    status: data.status as SupplierFormValues['status'],
    notes: data.notes ?? '',
    cnpjs: data.supplier_documents.map((document) => document.cnpj),
    contactName: data.supplier_contacts[0]?.name ?? '',
    contactPhone: data.supplier_contacts[0]?.phone ?? '',
    contactEmail: data.supplier_contacts[0]?.email ?? '',
    materialIds: data.supplier_materials.map((link) => link.material_id),
  }
}

export async function createSupplier(
  tenantId: string,
  values: SupplierFormValues,
): Promise<string> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      tenant_id: tenantId,
      name: values.name,
      type: values.type || null,
      city: values.city || null,
      status: values.status,
      notes: values.notes || null,
    })
    .select('id')
    .single()
  if (error) throw error

  const supplierId = data.id
  await writeSupplierRelations(tenantId, supplierId, values)
  return supplierId
}

export async function updateSupplier(
  tenantId: string,
  supplierId: string,
  values: SupplierFormValues,
): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .update({
      name: values.name,
      type: values.type || null,
      city: values.city || null,
      status: values.status,
      notes: values.notes || null,
    })
    .eq('id', supplierId)
  if (error) throw error

  await supabase.from('supplier_contacts').delete().eq('supplier_id', supplierId)
  await supabase.from('supplier_documents').delete().eq('supplier_id', supplierId)
  await supabase.from('supplier_materials').delete().eq('supplier_id', supplierId)
  await writeSupplierRelations(tenantId, supplierId, values)
}

async function writeSupplierRelations(
  tenantId: string,
  supplierId: string,
  values: SupplierFormValues,
): Promise<void> {
  if (values.contactName || values.contactPhone || values.contactEmail) {
    const { error } = await supabase.from('supplier_contacts').insert({
      tenant_id: tenantId,
      supplier_id: supplierId,
      name: values.contactName || 'Contato principal',
      phone: values.contactPhone || null,
      email: values.contactEmail || null,
    })
    if (error) throw error
  }

  for (const cnpj of values.cnpjs) {
    const { error } = await supabase
      .from('supplier_documents')
      .insert({ tenant_id: tenantId, supplier_id: supplierId, cnpj })
    if (error) throw error
  }

  for (const materialId of values.materialIds) {
    const { error } = await supabase
      .from('supplier_materials')
      .insert({ tenant_id: tenantId, supplier_id: supplierId, material_id: materialId })
    if (error) throw error
  }
}

export async function createMaterial(
  tenantId: string,
  name: string,
  categoryId: string,
  icon: string,
  code: string,
  description: string,
): Promise<MaterialRow> {
  const { data, error } = await supabase
    .from('materials')
    .insert({
      tenant_id: tenantId,
      name,
      category_id: categoryId,
      icon,
      code: code || null,
      description: description || null,
    })
    .select('id, name, category_id, icon, code, description')
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    categoryId: data.category_id,
    icon: data.icon,
    code: data.code,
    description: data.description,
    supplierCount: 0,
  }
}
