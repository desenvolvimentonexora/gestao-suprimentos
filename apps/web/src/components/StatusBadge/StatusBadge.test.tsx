import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('mostra "DISPONÍVEL" para status disponivel', () => {
    render(<StatusBadge status="disponivel" />)
    expect(screen.getByText('DISPONÍVEL')).toBeInTheDocument()
  })

  it('mostra "BETA" para status beta', () => {
    render(<StatusBadge status="beta" />)
    expect(screen.getByText('BETA')).toBeInTheDocument()
  })

  it('mostra "EM BREVE" para status em-breve', () => {
    render(<StatusBadge status="em-breve" />)
    expect(screen.getByText('EM BREVE')).toBeInTheDocument()
  })
})
