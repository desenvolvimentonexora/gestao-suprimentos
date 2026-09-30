import type { ButtonHTMLAttributes } from 'react'

// Botão contornado (fundo claro, borda/texto coloridos) só pras ações do
// popup de pedido do Cobrador de Entregas — fiel à referência do cliente,
// sem mexer no componente Button global (que só tem variantes preenchidas,
// usadas no resto do sistema).
export type DeliveryActionTone = 'blue' | 'green' | 'amber' | 'neutral'

export interface DeliveryActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone: DeliveryActionTone
}

const TONE_CLASSES: Record<DeliveryActionTone, string> = {
  blue: 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100',
  green: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  amber: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100',
  neutral: 'border-line bg-surface text-ink hover:bg-bg',
}

export function DeliveryActionButton({ tone, className = '', ...props }: DeliveryActionButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-md border px-4 py-2 text-sm font-medium transition duration-DEFAULT focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    />
  )
}
