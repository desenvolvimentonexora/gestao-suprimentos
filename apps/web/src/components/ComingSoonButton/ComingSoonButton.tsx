import { useState } from 'react'
import { Button, type ButtonVariant } from '../Button/Button'

export interface ComingSoonButtonProps {
  label: string
  variant?: ButtonVariant
}

export function ComingSoonButton({ label, variant = 'ghost' }: ComingSoonButtonProps) {
  const [showNotice, setShowNotice] = useState(false)
  return (
    <div>
      <Button variant={variant} onClick={() => setShowNotice(true)}>
        {label}
      </Button>
      {showNotice && <p className="text-xs text-ink-muted">Em breve</p>}
    </div>
  )
}
