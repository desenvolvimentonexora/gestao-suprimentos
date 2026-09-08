import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ModulePlaceholderPage } from './ModulePlaceholderPage'

describe('ModulePlaceholderPage', () => {
  it('informa que o módulo ainda está em construção', () => {
    render(<ModulePlaceholderPage label="Requisições" />)
    expect(screen.getByRole('heading', { name: 'Requisições' })).toBeInTheDocument()
    expect(screen.getByText(/em construção/i)).toBeInTheDocument()
  })
})
