export function getGreeting(fullName: string, now: Date = new Date()): string {
  const firstName = fullName.trim().split(/\s+/)[0]
  const hour = now.getHours()

  const period = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return `${period}, ${firstName}.`
}
