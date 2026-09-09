import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renderiza o texto informado', () => {
    render(<Badge>Beta</Badge>)
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })
})
