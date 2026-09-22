import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ComparisonIdentificationHeader } from './ComparisonIdentificationHeader'

function baseProps() {
  return {
    logoUrl: '/assets/logo-nexora.png',
    brandName: 'Nexora',
    externalRef: '1243' as string | null,
    sequenceNumber: 42 as number | null,
    unitName: 'Depósito Simões Filho',
    createdByName: 'Maria Souza' as string | null,
    createdAt: '2026-09-18T12:00:00Z' as string | null,
  }
}

describe('ComparisonIdentificationHeader', () => {
  it('mostra o número da solicitação usando o número externo quando existe', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} />)
    expect(screen.getByText('SOLICITAÇÃO Nº 1243')).toBeInTheDocument()
  })

  it('cai pra "SOL {sequência}" sem número externo', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} externalRef={null} />)
    expect(screen.getByText('SOLICITAÇÃO Nº SOL 42')).toBeInTheDocument()
  })

  it('mostra o rótulo fixo do produto e o nome da unidade', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} />)
    expect(screen.getByText('Equalização de Orçamentos')).toBeInTheDocument()
    expect(screen.getByText('Depósito Simões Filho')).toBeInTheDocument()
  })

  it('mostra quem equalizou e a data formatada em pt-BR', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} />)
    expect(screen.getByText('EQUALIZADO POR Maria Souza')).toBeInTheDocument()
    expect(screen.getByText('18/09/2026')).toBeInTheDocument()
  })

  it('mostra travessão quando não há responsável', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} createdByName={null} />)
    expect(screen.getByText('EQUALIZADO POR —')).toBeInTheDocument()
  })

  it('mostra o logo da marca quando configurado', () => {
    render(<ComparisonIdentificationHeader {...baseProps()} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/logo-nexora.png')
  })
})
