import { forwardRef, useId, type InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  labelClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', labelClassName = '', ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className={`text-sm font-medium text-ink ${labelClassName}`}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  )
})
