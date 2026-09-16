import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'on-primary'
  | 'accent'
  | 'info'
  | 'danger'
  | 'violet'
  | 'warning'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:opacity-90',
  secondary: 'border border-line text-ink hover:bg-bg',
  ghost: 'text-ink hover:bg-bg',
  'on-primary': 'border border-white/30 bg-white/10 text-on-primary hover:bg-white/20',
  accent: 'bg-accent text-white hover:opacity-90',
  // Ação de destaque que não é de marca nem semântica (ex.: relatório,
  // copiar para outro setor) — azul, não o verde/preto da Nexora.
  info: 'bg-blue-800 text-white hover:opacity-90',
  // Ação destrutiva (excluir) — vermelho sempre, nunca a cor da marca.
  danger: 'bg-red-600 text-white hover:opacity-90',
  // Ação de conferência/cobrança (confirmar comprovante, cobrar financeiro)
  // — roxo, cor de identificação da fila, não a cor da marca.
  violet: 'bg-violet-600 text-white hover:opacity-90',
  // Ação de recusa dentro de um fluxo de decisão (não liberar) — laranja,
  // distinto de danger (que é para exclusão irreversível).
  warning: 'bg-orange-500 text-white hover:opacity-90',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded px-4 py-2 text-sm font-medium transition duration-DEFAULT focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
