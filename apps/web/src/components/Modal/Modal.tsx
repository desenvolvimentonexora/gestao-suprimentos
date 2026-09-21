import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X, type LucideIcon } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  /** Ícone opcional ao lado do título — usado para diferenciar filas de trabalho (ex.: Fila de Alterações, Fila de Pedidos). */
  icon?: LucideIcon
  /** Classe de cor do título/ícone, sobrepõe o padrão text-ink. Cor de identificação da fila, não a cor da marca. */
  titleClassName?: string
  /**
   * Quando informado, a faixa do título vira uma barra colorida de ponta a
   * ponta (ex.: cor de status de negócio) em vez do cabeçalho padrão — só
   * afeta o layout quando presente, pra não alterar nenhum modal existente.
   */
  headerClassName?: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, icon: Icon, titleClassName, headerClassName, children }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    panelRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl bg-surface p-6 shadow-lg focus:outline-none"
      >
        <div
          className={
            headerClassName
              ? `-mx-6 -mt-6 mb-2 flex items-center justify-between rounded-t-xl px-6 py-4 ${headerClassName}`
              : 'flex items-center justify-between'
          }
        >
          <h2 id={titleId} className={`flex items-center gap-2 text-lg font-semibold ${titleClassName ?? 'text-ink'}`}>
            {Icon && <Icon size={20} aria-hidden="true" />}
            {title}
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className={headerClassName ? 'hover:opacity-70' : 'text-ink-muted hover:text-ink'}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
