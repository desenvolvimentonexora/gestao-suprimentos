import { useId } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '../../../components'
import type { CertificateRow } from './types'

export interface CertificatesPopupProps {
  isOpen: boolean
  onClose: () => void
  certificates: CertificateRow[]
  onUpload: (file: File) => void
  onDelete: (certificateId: string) => void
  isUploading: boolean
}

export function CertificatesPopup({
  isOpen,
  onClose,
  certificates,
  onUpload,
  onDelete,
  isUploading,
}: CertificatesPopupProps) {
  const uploadInputId = useId()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Certificados">
      <div className="flex flex-col gap-2">
        {certificates.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhum certificado enviado ainda.</p>
        ) : (
          certificates.map((certificate) => (
            <div key={certificate.id} className="flex items-center justify-between">
              <a
                href={certificate.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {certificate.fileName}
              </a>
              <button
                type="button"
                aria-label={`Excluir ${certificate.fileName}`}
                onClick={() => onDelete(certificate.id)}
                className="text-ink-muted hover:text-accent"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-line pt-3">
        <label htmlFor={uploadInputId} className="text-sm font-medium text-ink">
          Enviar certificado (PDF)
        </label>
        <input
          id={uploadInputId}
          type="file"
          accept="application/pdf"
          disabled={isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
            e.target.value = ''
          }}
          className="mt-1 block text-sm text-ink"
        />
      </div>
    </Modal>
  )
}
