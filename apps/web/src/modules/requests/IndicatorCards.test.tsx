import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IndicatorCards } from './IndicatorCards'

describe('IndicatorCards', () => {
  it('mostra os quatro indicadores com seus números', () => {
    render(<IndicatorCards indicators={{ ativas: 12, pendentes: 5, enviadas: 7, concluidas: 3 }} />)
    expect(screen.getByText('Total Ativas')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Pendentes')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Enviadas')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Concluídas')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
