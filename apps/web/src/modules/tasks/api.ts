import { supabase } from '../../lib/supabase'
import type { TaskCard, TaskCardAttachment, TaskCardFormValues, TaskStatus } from './types'

const TASK_CARD_COLUMNS = 'id, title, description, status, created_at, created_by'
const ATTACHMENTS_BUCKET = 'task-card-attachments'
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10

function toTaskCard(row: Record<string, unknown>, createdByName: string | null): TaskCard {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status as TaskStatus,
    createdAt: row.created_at as string,
    createdByName,
  }
}

export async function fetchTaskCards(): Promise<TaskCard[]> {
  const { data, error } = await supabase
    .from('task_cards')
    .select(TASK_CARD_COLUMNS)
    .is('deleted_at', null)
    .order('created_at')

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

  return data.map((row) => toTaskCard(row, row.created_by ? (namesByUserId.get(row.created_by) ?? null) : null))
}

export async function createTaskCard(
  tenantId: string,
  userId: string,
  values: TaskCardFormValues,
): Promise<void> {
  const { error } = await supabase.from('task_cards').insert({
    tenant_id: tenantId,
    created_by: userId,
    title: values.title,
    description: values.description || null,
  })
  if (error) throw error
}

export async function updateTaskCardStatus(cardId: string, status: TaskStatus): Promise<void> {
  const { error } = await supabase
    .from('task_cards')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', cardId)
  if (error) throw error
}

export async function updateTaskCard(cardId: string, values: TaskCardFormValues): Promise<void> {
  const { error } = await supabase
    .from('task_cards')
    .update({
      title: values.title,
      description: values.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId)
  if (error) throw error
}

export async function deleteTaskCard(cardId: string): Promise<void> {
  const { error } = await supabase
    .from('task_cards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', cardId)
  if (error) throw error
}

export async function fetchTaskCardAttachments(taskCardId: string): Promise<TaskCardAttachment[]> {
  const { data, error } = await supabase
    .from('task_card_attachments')
    .select('id, file_name, file_path')
    .eq('task_card_id', taskCardId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (data.length === 0) return []

  const { data: signed, error: signedError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
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

export async function uploadTaskCardAttachment(
  tenantId: string,
  taskCardId: string,
  userId: string,
  file: File,
): Promise<void> {
  const filePath = `${tenantId}/${taskCardId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(filePath, file)
  if (uploadError) throw uploadError

  const { error } = await supabase.from('task_card_attachments').insert({
    tenant_id: tenantId,
    task_card_id: taskCardId,
    created_by: userId,
    file_path: filePath,
    file_name: file.name,
  })
  if (error) throw error
}

export async function deleteTaskCardAttachment(attachmentId: string, filePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from(ATTACHMENTS_BUCKET).remove([filePath])
  if (storageError) throw storageError

  const { error } = await supabase
    .from('task_card_attachments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', attachmentId)
  if (error) throw error
}
