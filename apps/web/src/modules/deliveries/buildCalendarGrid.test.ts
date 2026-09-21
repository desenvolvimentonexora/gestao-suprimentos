import { describe, expect, it } from 'vitest'
import { buildCalendarGrid, formatIsoDate } from './buildCalendarGrid'

describe('formatIsoDate', () => {
  it('formata como yyyy-mm-dd com zero à esquerda', () => {
    expect(formatIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('buildCalendarGrid', () => {
  it('gera semanas completas de domingo a sábado', () => {
    const weeks = buildCalendarGrid(2026, 8) // setembro/2026
    for (const week of weeks) {
      expect(week).toHaveLength(7)
    }
  })

  it('inclui dias do mês anterior/seguinte marcados como fora do mês atual', () => {
    const weeks = buildCalendarGrid(2026, 8) // setembro/2026 começa numa terça
    const firstWeek = weeks[0]!
    expect(firstWeek[0]!.inCurrentMonth).toBe(false)
    expect(firstWeek.some((day) => day.inCurrentMonth && day.dayOfMonth === 1)).toBe(true)
  })

  it('o primeiro dia de cada semana é sempre domingo (índice 0)', () => {
    const weeks = buildCalendarGrid(2026, 8)
    const sunday = new Date(weeks[0]![0]!.isoDate)
    expect(sunday.getUTCDay()).toBe(0)
  })

  it('cobre todos os dias do mês, sem duplicar nem pular nenhum', () => {
    const weeks = buildCalendarGrid(2026, 1) // fevereiro/2026 (28 dias)
    const daysInMonth = weeks.flat().filter((day) => day.inCurrentMonth)
    expect(daysInMonth).toHaveLength(28)
    expect(daysInMonth[0]!.isoDate).toBe('2026-02-01')
    expect(daysInMonth.at(-1)!.isoDate).toBe('2026-02-28')
  })
})
