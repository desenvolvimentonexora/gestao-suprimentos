import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AnalysisIndicatorCards } from './AnalysisIndicatorCards'

const indicators = { total: 12, urgentes: 3, atencao: 4, tranquilas: 5, agAprovacao: 1 }

describe('AnalysisIndicatorCards', () => {
  it('mostra os cinco indicadores com seus números', () => {
    render(<AnalysisIndicatorCards indicators={indicators} selectedTier={null} onSelectTier={vi.fn()} />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Urgentes')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Atenção')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Tranquilas')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Ag. Aprovação')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('funciona como filtro clicável, chamando onSelectTier com a faixa escolhida', async () => {
    const user = userEvent.setup()
    const onSelectTier = vi.fn()
    render(<AnalysisIndicatorCards indicators={indicators} selectedTier={null} onSelectTier={onSelectTier} />)

    await user.click(screen.getByRole('button', { name: /urgentes/i }))
    expect(onSelectTier).toHaveBeenCalledWith('urgente')
  })

  it('clicar de novo no card já selecionado limpa o filtro', async () => {
    const user = userEvent.setup()
    const onSelectTier = vi.fn()
    render(
      <AnalysisIndicatorCards indicators={indicators} selectedTier="urgente" onSelectTier={onSelectTier} />,
    )

    const button = screen.getByRole('button', { name: /urgentes/i })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await user.click(button)
    expect(onSelectTier).toHaveBeenCalledWith(null)
  })
})
