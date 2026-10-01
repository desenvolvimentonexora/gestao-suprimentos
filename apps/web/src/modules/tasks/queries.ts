import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTaskCard,
  deleteTaskCard,
  deleteTaskCardAttachment,
  fetchTaskCardAttachments,
  fetchTaskCards,
  updateTaskCard,
  updateTaskCardStatus,
  uploadTaskCardAttachment,
} from './api'
import type { TaskCardFormValues, TaskStatus } from './types'

const TASK_CARDS_KEY = ['task-cards']

export function useTaskCards() {
  return useQuery({ queryKey: TASK_CARDS_KEY, queryFn: fetchTaskCards })
}

export function useCreateTaskCard(tenantId: string, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: TaskCardFormValues) => createTaskCard(tenantId, userId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_CARDS_KEY })
    },
  })
}

export function useUpdateTaskCardStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, status }: { cardId: string; status: TaskStatus }) =>
      updateTaskCardStatus(cardId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_CARDS_KEY })
    },
  })
}

export function useUpdateTaskCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, values }: { cardId: string; values: TaskCardFormValues }) =>
      updateTaskCard(cardId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_CARDS_KEY })
    },
  })
}

export function useDeleteTaskCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => deleteTaskCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_CARDS_KEY })
    },
  })
}

function attachmentsKey(taskCardId: string) {
  return ['task-card-attachments', taskCardId]
}

export function useTaskCardAttachments(taskCardId: string | null) {
  return useQuery({
    queryKey: attachmentsKey(taskCardId ?? ''),
    queryFn: () => fetchTaskCardAttachments(taskCardId!),
    enabled: Boolean(taskCardId),
  })
}

export function useUploadTaskCardAttachment(tenantId: string, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskCardId, file }: { taskCardId: string; file: File }) =>
      uploadTaskCardAttachment(tenantId, taskCardId, userId, file),
    onSuccess: (_data, { taskCardId }) => {
      queryClient.invalidateQueries({ queryKey: attachmentsKey(taskCardId) })
    },
  })
}

export function useDeleteTaskCardAttachment(taskCardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ attachmentId, filePath }: { attachmentId: string; filePath: string }) =>
      deleteTaskCardAttachment(attachmentId, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentsKey(taskCardId) })
    },
  })
}
