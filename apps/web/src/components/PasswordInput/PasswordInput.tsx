import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, id, className = '', ...props }, ref) {
    const [visible, setVisible] = useState(false)
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={`w-full rounded border border-line bg-surface px-3 py-2 pr-10 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-muted hover:text-ink"
          >
            {visible ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        </div>
        {error && (
          <p id={errorId} className="text-sm text-accent">
            {error}
          </p>
        )}
      </div>
    )
  },
)
