import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CnpjLookupBlock } from './CnpjLookupBlock'

describe('CnpjLookupBlock', () => {
  it('permite digitar um CNPJ', async () => {
    render(<CnpjLookupBlock onSearch={vi.fn()} />)

    const input = screen.getByLabelText('CNPJ conhecido')
    await userEvent.type(input, '12.345.678/0001-90')

    expect(input).toHaveValue('12.345.678/0001-90')
  })

  it('desabilita o botão de busca até o CNPJ ter 14 dígitos', async () => {
    render(<CnpjLookupBlock onSearch={vi.fn()} />)

    const input = screen.getByLabelText('CNPJ conhecido')
    const button = screen.getByRole('button', { name: 'Buscar' })
    expect(button).toBeDisabled()

    await userEvent.type(input, '12.345.678/0001-9')
    expect(button).toBeDisabled()

    await userEvent.type(input, '0')
    expect(button).not.toBeDisabled()
  })

  it('chama onSearch com o CNPJ só com dígitos ao clicar em Buscar', async () => {
    const onSearch = vi.fn()
    render(<CnpjLookupBlock onSearch={onSearch} />)

    await userEvent.type(screen.getByLabelText('CNPJ conhecido'), '12.345.678/0001-90')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(onSearch).toHaveBeenCalledWith('12345678000190')
  })
})
