import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('renderiza o conteúdo filho', () => {
    render(<Card>Conteúdo do cartão</Card>)
    expect(screen.getByText('Conteúdo do cartão')).toBeInTheDocument()
  })
})
