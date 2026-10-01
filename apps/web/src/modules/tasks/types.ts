export type TaskStatus = 'a_fazer' | 'fazendo' | 'feito'

export interface TaskCard {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  createdAt: string
}

export interface TaskCardFormValues {
  title: string
  description: string
}
