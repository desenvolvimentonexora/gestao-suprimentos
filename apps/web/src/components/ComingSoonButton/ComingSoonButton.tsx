import { useState } from 'react'
import { Button, type ButtonVariant } from '../Button/Button'

export interface ComingSoonButtonProps {
  label: string
  variant?: ButtonVariant
  className?: string
}

export function ComingSoonButton({ label, variant = 'ghost', className }: ComingSoonButtonProps) {
  const [showNotice, setShowNotice] = useState(false)
  return (
    <div>
      <Button variant={variant} className={className} onClick={() => setShowNotice(true)}>
        {label}
      </Button>
      {showNotice && <p className="text-xs text-ink-muted">Em breve</p>}
    </div>
  )
}
