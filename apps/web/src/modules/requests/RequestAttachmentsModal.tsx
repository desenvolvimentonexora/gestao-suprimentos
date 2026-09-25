import { FileText, Folder } from 'lucide-react'
import { Button, Modal, Spinner } from '../../components'
import type { RequestAttachmentRow } from './types'

export interface RequestAttachmentsModalProps {
  isOpen: boolean
  onClose: () => void
  requestLabel: string
  attachments: RequestAttachmentRow[]
  isLoading: boolean
  onView: (attachment: { id: string; kind: 'sol' | 'quotation' }) => void
}

export function RequestAttachmentsModal({
  isOpen,
  onClose,
  requestLabel,
  attachments,
  isLoading,
  onView,
}: RequestAttachmentsModalProps) {
  const solAttachments = attachments.filter((a) => a.kind === 'sol')
  const quotationAttachments = attachments.filter((a) => a.kind === 'quotation')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Arquivos — ${requestLabel}`} icon={Folder}>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Spinner /> Carregando arquivos...
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                PDF da Solicitação
              </span>
              {solAttachments.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  PDF da Solicitação ainda não gerado — disponível depois do Disparo.
                </p>
              ) : (
                solAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface p-3 text-sm"
                  >
                    <span className="flex items-center gap-2 text-ink">
                      <FileText size={16} className="text-ink-muted" aria-hidden="true" />
                      {attachment.fileName}
                    </span>
                    <Button variant="secondary" onClick={() => onView({ id: attachment.id, kind: 'sol' })}>
                      Ver
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-line pt-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Cotações recebidas
              </span>
              {quotationAttachments.length === 0 ? (
                <p className="text-sm text-ink-muted">Nenhuma cotação recebida ainda.</p>
              ) : (
                quotationAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface p-3 text-sm"
                  >
                    <span className="flex items-center gap-2 text-ink">
                      <FileText size={16} className="text-ink-muted" aria-hidden="true" />
                      {attachment.supplierName ?? attachment.fileName}
                    </span>
                    <Button variant="secondary" onClick={() => onView({ id: attachment.id, kind: 'quotation' })}>
                      Ver
                    </Button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
