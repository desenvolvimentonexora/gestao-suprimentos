import type { TaskStatus } from './types'

export const STATUS_ORDER: TaskStatus[] = ['a_fazer', 'fazendo', 'feito']

export const STATUS_LABELS: Record<TaskStatus, string> = {
  a_fazer: 'Realizar',
  fazendo: 'Realizando',
  feito: 'Realizado',
}

export function getPreviousStatus(status: TaskStatus): TaskStatus | null {
  const index = STATUS_ORDER.indexOf(status)
  return index > 0 ? STATUS_ORDER[index - 1]! : null
}

export function getNextStatus(status: TaskStatus): TaskStatus | null {
  const index = STATUS_ORDER.indexOf(status)
  return index < STATUS_ORDER.length - 1 ? STATUS_ORDER[index + 1]! : null
}
