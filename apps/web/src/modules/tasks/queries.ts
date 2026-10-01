import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTaskCard,
  deleteTaskCard,
  fetchTaskCards,
  updateTaskCard,
  updateTaskCardStatus,
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
