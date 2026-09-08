const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/

export function extractSubdomain(hostname: string): string | null {
  if (IPV4_PATTERN.test(hostname)) return null

  const labels = hostname.split('.')
  if (labels.length < 3) return null

  const subdomain = labels[0]
  if (!subdomain || subdomain === 'www') return null

  return subdomain
}
