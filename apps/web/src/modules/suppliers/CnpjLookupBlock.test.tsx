import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CnpjLookupBlock } from './CnpjLookupBlock'

describe('CnpjLookupBlock', () => {
  it('permite digitar um CNPJ', async () => {
    render(<CnpjLookupBlock />)

    const input = screen.getByLabelText('CNPJ conhecido')
    await userEvent.type(input, '12.345.678/0001-90')

    expect(input).toHaveValue('12.345.678/0001-90')
  })

  it('mostra "Em breve" ao clicar em Buscar, já que a automação ainda não existe', async () => {
    render(<CnpjLookupBlock />)

    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(await screen.findByText('Em breve')).toBeInTheDocument()
  })
})
