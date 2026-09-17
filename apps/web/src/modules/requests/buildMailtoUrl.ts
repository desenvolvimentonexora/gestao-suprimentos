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
  window.location.href = buildMailtoUrl(options)
}
