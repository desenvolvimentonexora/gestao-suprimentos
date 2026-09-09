import type { HTMLAttributes } from 'react'

export function Badge({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded border border-line px-2 py-0.5 text-xs text-ink-muted ${className}`}
      {...props}
    />
  )
}
