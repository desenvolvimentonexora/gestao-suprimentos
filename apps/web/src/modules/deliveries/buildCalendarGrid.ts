export interface CalendarDay {
  isoDate: string
  dayOfMonth: number
  inCurrentMonth: boolean
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Grid mensal domingo-a-sábado, com semanas completas: dias do mês
// anterior/seguinte entram pra fechar a primeira e a última semana.
export function buildCalendarGrid(year: number, month: number): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay())
  const gridEnd = new Date(year, month, lastOfMonth.getDate() + (6 - lastOfMonth.getDay()))

  const weeks: CalendarDay[][] = []
  let week: CalendarDay[] = []
  const cursor = new Date(gridStart)

  while (cursor.getTime() <= gridEnd.getTime()) {
    week.push({
      isoDate: formatIsoDate(cursor),
      dayOfMonth: cursor.getDate(),
      inCurrentMonth: cursor.getMonth() === month,
    })
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return weeks
}
