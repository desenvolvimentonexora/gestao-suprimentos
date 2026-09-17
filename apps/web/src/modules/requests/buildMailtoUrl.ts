export interface MailtoOptions {
  to?: string
  subject: string
  body: string
}

export function buildMailtoUrl({ to = '', subject, body }: MailtoOptions): string {
  const params = new URLSearchParams({ subject, body })
  return `mailto:${to}?${params.toString()}`
}

export function openMailto(options: MailtoOptions): void {
  // Não usar window.location.href aqui: atribuir um mailto: nela conta como
  // tentativa de navegação de verdade para o Chrome, que só cancela depois
  // de já ter perturbado a página (o React perde qualquer atualização de
  // estado feita perto disso). Um <a> temporário evita esse problema.
  const link = document.createElement('a')
  link.href = buildMailtoUrl(options)
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
