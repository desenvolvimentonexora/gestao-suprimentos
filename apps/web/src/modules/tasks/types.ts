export type TaskStatus = 'a_fazer' | 'fazendo' | 'feito'

export type TaskCardEventType = 'moved_em_andamento' | 'moved_concluido' | 'validated'

export interface TaskCard {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  createdAt: string
  createdByName: string | null
  lastMovedEventType: TaskCardEventType | null
  lastMovedAt: string | null
  lastMovedByName: string | null
}

export interface TaskCardFormValues {
  title: string
  description: string
}

export interface TaskCardAttachment {
  id: string
  fileName: string
  filePath: string
  url: string
}

