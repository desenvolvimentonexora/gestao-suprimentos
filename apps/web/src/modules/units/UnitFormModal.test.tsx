import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UnitFormModal } from './UnitFormModal'

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    mode: 'create' as const,
    onSubmit: vi.fn(),
    isSubmitting: false,
  }
}

describe('UnitFormModal', () => {
  it('mostra o título de cadastro no modo criação', () => {
    render(<UnitFormModal {...baseProps()} />)
    expect(screen.getByText('Nova unidade')).toBeInTheDocument()
  })

  it('mostra o título de edição no modo edição', () => {
    render(<UnitFormModal {...baseProps()} mode="edit" />)
    expect(screen.getByText('Editar unidade')).toBeInTheDocument()
  })

  it('exige o nome ao enviar', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<UnitFormModal {...baseProps()} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: /cadastrar unidade/i }))

    expect(await screen.findByText('Informe o nome.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('não mostra campos de data quando o tipo não é obra', () => {
    render(<UnitFormModal {...baseProps()} initialValues={{
      name: 'Escritório Central',
      cnpj: '',
      zipCode: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      type: 'escritorio',
      status: 'active',
      startDate: '',
      endDate: '',
      engineerName: '',
      engineerPhone: '',
      engineerEmail: '',
      adminName: '',
      adminPhone: '',
      adminEmail: '',
    }} />)
    expect(screen.queryByLabelText(/início previsto/i)).not.toBeInTheDocument()
  })

  it('mostra campos de data quando o tipo é obra (padrão)', () => {
    render(<UnitFormModal {...baseProps()} initialValues={{
      name: 'UP Graça',
      cnpj: '',
      zipCode: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      type: 'obra',
      status: 'active',
      startDate: '',
      endDate: '',
      engineerName: '',
      engineerPhone: '',
      engineerEmail: '',
      adminName: '',
      adminPhone: '',
      adminEmail: '',
    }} />)
    expect(screen.getByLabelText(/início previsto/i)).toBeInTheDocument()
  })

  it('envia os valores preenchidos', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<UnitFormModal {...baseProps()} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Nome'), 'Depósito Novo')
    await user.click(screen.getByRole('button', { name: /cadastrar unidade/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Depósito Novo', type: 'obra', status: 'active' }),
    )
  })

  it('valida formato de e-mail do engenheiro quando preenchido', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<UnitFormModal {...baseProps()} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Nome'), 'Depósito Novo')
    await user.type(screen.getByLabelText(/e-mail do engenheiro/i), 'invalido')
    await user.click(screen.getByRole('button', { name: /cadastrar unidade/i }))

    expect(await screen.findByText('E-mail inválido.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('valida UF com 2 letras', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<UnitFormModal {...baseProps()} onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Nome'), 'Depósito Novo')
    await user.type(screen.getByLabelText('UF'), 'Bahia')
    await user.click(screen.getByRole('button', { name: /cadastrar unidade/i }))

    expect(await screen.findByText('UF deve ter 2 letras.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
