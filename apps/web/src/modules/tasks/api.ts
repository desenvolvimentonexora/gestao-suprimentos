import { supabase } from '../../lib/supabase'
import type { TaskCard, TaskCardFormValues, TaskStatus } from './types'

const TASK_CARD_COLUMNS = 'id, title, description, status, created_at'

function toTaskCard(row: Record<string, unknown>): TaskCard {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status as TaskStatus,
    createdAt: row.created_at as string,
  }
}

export async function fetchTaskCards(): Promise<TaskCard[]> {
  const { data, error } = await supabase
    .from('task_cards')
    .select(TASK_CARD_COLUMNS)
    .is('deleted_at', null)
    .order('created_at')

  if (error) throw error
  return data.map(toTaskCard)
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
