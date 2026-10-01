import { useId } from 'react'
import { Paperclip, Trash2 } from 'lucide-react'
import { Spinner } from '../../components'
import {
  useDeleteTaskCardAttachment,
  useTaskCardAttachments,
  useUploadTaskCardAttachment,
} from './queries'

export interface TaskCardAttachmentsSectionProps {
  taskCardId: string
  tenantId: string
  userId: string
}

export function TaskCardAttachmentsSection({
  taskCardId,
  tenantId,
  userId,
}: TaskCardAttachmentsSectionProps) {
  const uploadInputId = useId()
  const attachmentsQuery = useTaskCardAttachments(taskCardId)
  const uploadAttachment = useUploadTaskCardAttachment(tenantId, userId)
  const deleteAttachment = useDeleteTaskCardAttachment(taskCardId)

  const attachments = attachmentsQuery.data ?? []

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <Paperclip size={12} aria-hidden="true" />
        Anexos
      </span>

      {attachmentsQuery.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner /> Carregando anexos...
        </p>
      ) : (
        attachments.length > 0 && (
          <ul className="flex flex-col gap-1">
            {attachments.map((attachment) => (
              <li key={attachment.id} className="flex items-center justify-between gap-2 text-sm">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {attachment.fileName}
                </a>
                <button
                  type="button"
                  aria-label={`Excluir ${attachment.fileName}`}
                  onClick={() =>
                    deleteAttachment.mutate({ attachmentId: attachment.id, filePath: attachment.filePath })
                  }
                  className="shrink-0 text-ink-muted hover:text-red-600"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      <div>
        <label htmlFor={uploadInputId} className="text-xs text-ink-muted">
          Anexar imagem ou arquivo
        </label>
        <input
          id={uploadInputId}
          type="file"
          disabled={uploadAttachment.isPending}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadAttachment.mutate({ taskCardId, file })
            e.target.value = ''
          }}
          className="mt-1 block w-full text-xs text-ink"
        />
      </div>
    </div>
  )
}
