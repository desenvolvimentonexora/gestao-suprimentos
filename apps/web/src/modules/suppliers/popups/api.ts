import { supabase } from '../../../lib/supabase'
import type { CertificateRow, ReviewRow, SupplierMaterialLinkRow } from './types'

const CERTIFICATES_BUCKET = 'supplier-certificates'
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10

export async function fetchLeadTimeDays(
  supplierId: string,
  materialId: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from('supplier_materials')
    .select('lead_time_days')
    .eq('supplier_id', supplierId)
    .eq('material_id', materialId)
    .maybeSingle()

  if (error) throw error
  return data?.lead_time_days ?? null
}

export async function updateLeadTimeDays(
  supplierId: string,
  materialId: string,
  days: number | null,
): Promise<void> {
  const { error } = await supabase
    .from('supplier_materials')
    .update({ lead_time_days: days })
    .eq('supplier_id', supplierId)
    .eq('material_id', materialId)
  if (error) throw error
}

export async function fetchReviews(supplierId: string): Promise<ReviewRow[]> {
  const { data, error } = await supabase
    .from('supplier_reviews')
    .select('id, rating, comment, created_at, created_by')
    .eq('supplier_id', supplierId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  const authorIds = [...new Set(data.map((row) => row.created_by).filter(Boolean))] as string[]
  const namesByUserId = new Map<string, string>()
  if (authorIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', authorIds)
    if (usersError) throw usersError
    for (const user of users) namesByUserId.set(user.id, user.full_name)
  }

  return data.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    authorName: row.created_by ? (namesByUserId.get(row.created_by) ?? null) : null,
    createdAt: row.created_at,
  }))
}

export async function createReview(
  tenantId: string,
  supplierId: string,
  rating: number,
  comment: string,
): Promise<void> {
  const { error } = await supabase
    .from('supplier_reviews')
    .insert({ tenant_id: tenantId, supplier_id: supplierId, rating, comment: comment || null })
  if (error) throw error
}

export async function fetchSupplierMaterialLinks(
  supplierId: string,
): Promise<SupplierMaterialLinkRow[]> {
  const { data, error } = await supabase
    .from('supplier_materials')
    .select('material_id, materials(name)')
    .eq('supplier_id', supplierId)

  if (error) throw error

  return data.map((row) => ({
    materialId: row.material_id,
    materialName: row.materials?.name ?? '',
  }))
}

export async function addSupplierMaterialLink(
  tenantId: string,
  supplierId: string,
  materialId: string,
): Promise<void> {
  const { error } = await supabase
    .from('supplier_materials')
    .upsert({ tenant_id: tenantId, supplier_id: supplierId, material_id: materialId })
  if (error) throw error
}

export async function removeSupplierMaterialLink(
  supplierId: string,
  materialId: string,
): Promise<void> {
  const { error } = await supabase
    .from('supplier_materials')
    .delete()
    .eq('supplier_id', supplierId)
    .eq('material_id', materialId)
  if (error) throw error
}

export async function fetchCertificates(supplierId: string): Promise<CertificateRow[]> {
  const { data, error } = await supabase
    .from('supplier_certificates')
    .select('id, file_name, file_path')
    .eq('supplier_id', supplierId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (data.length === 0) return []

  const { data: signed, error: signedError } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .createSignedUrls(
      data.map((row) => row.file_path),
      SIGNED_URL_EXPIRES_IN_SECONDS,
    )
  if (signedError) throw signedError

  const urlByPath = new Map(signed.map((entry) => [entry.path, entry.signedUrl]))

  return data.map((row) => ({
    id: row.id,
    fileName: row.file_name,
    filePath: row.file_path,
    url: urlByPath.get(row.file_path) ?? '',
  }))
}

export async function uploadCertificate(
  tenantId: string,
  supplierId: string,
  file: File,
): Promise<void> {
  const filePath = `${tenantId}/${supplierId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .upload(filePath, file)
  if (uploadError) throw uploadError

  const { error } = await supabase.from('supplier_certificates').insert({
    tenant_id: tenantId,
    supplier_id: supplierId,
    file_path: filePath,
    file_name: file.name,
  })
  if (error) throw error
}

export async function deleteCertificate(certificateId: string, filePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .remove([filePath])
  if (storageError) throw storageError

  const { error } = await supabase
    .from('supplier_certificates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', certificateId)
  if (error) throw error
}
