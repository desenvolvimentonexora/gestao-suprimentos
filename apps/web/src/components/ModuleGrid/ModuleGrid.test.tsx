import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ModuleGrid } from './ModuleGrid'

describe('ModuleGrid', () => {
  it('renderiza todos os itens filhos', () => {
    render(
      <ModuleGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </ModuleGrid>,
    )

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })
})
