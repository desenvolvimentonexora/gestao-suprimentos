import { X } from 'lucide-react'

export type ToastVariant = 'info' | 'success' | 'error'

export interface ToastProps {
  variant: ToastVariant
  message: string
  onDismiss?: () => void
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  info: 'border-line',
  success: 'border-line',
  error: 'border-accent',
}

export function Toast({ variant, message, onDismiss }: ToastProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-center justify-between gap-3 rounded border bg-surface px-4 py-3 text-sm text-ink shadow-sm ${VARIANT_CLASSES[variant]}`}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar aviso"
          className="text-ink-muted hover:text-ink"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
