import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SimilarSuppliersModal } from './SimilarSuppliersModal'
import type { CompanyCandidate, ContactInfo } from './types'

function makeCandidate(overrides: Partial<CompanyCandidate> = {}): CompanyCandidate {
  return {
    razaoSocial: 'Empresa Exemplo Ltda',
    nomeFantasia: 'Exemplo',
    cnpj: '11222333000181',
    cidade: 'São Paulo',
    uf: 'SP',
    cnae: '4711302',
    cnaeDescricao: 'Comércio varejista',
    porte: 'DEMAIS',
    ...overrides,
  }
}

function baseProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    cnpjs: ['11222333000181'],
    isLoadingCnpjs: false,
    selectedCnpj: '11222333000181' as string | null,
    onSelectCnpj: vi.fn(),
    onSearch: vi.fn(),
    isSearching: false,
    searchError: null as string | null,
    results: null as CompanyCandidate[] | null,
    contactByCnpj: {} as Record<string, ContactInfo | null>,
    checkingCnpj: null as string | null,
    onLookupContact: vi.fn(),
    onConfirmRegister: vi.fn(),
  }
}

describe('SimilarSuppliersModal', () => {
  it('mostra estado de carregamento dos CNPJs', () => {
    render(<SimilarSuppliersModal {...baseProps()} isLoadingCnpjs cnpjs={[]} selectedCnpj={null} />)
    expect(screen.getByText(/carregando cnpjs/i)).toBeInTheDocument()
  })

  it('mostra mensagem quando o fornecedor não tem CNPJ cadastrado', () => {
    render(<SimilarSuppliersModal {...baseProps()} cnpjs={[]} selectedCnpj={null} />)
    expect(screen.getByText(/não tem cnpj cadastrado/i)).toBeInTheDocument()
  })

  it('não mostra o seletor de CNPJ quando só existe um', () => {
    render(<SimilarSuppliersModal {...baseProps()} />)
    expect(screen.queryByText(/mais de um cnpj/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buscar fornecedores semelhantes/i })).toBeInTheDocument()
  })

  it('mostra o seletor de CNPJ quando há mais de um, e chama onSelectCnpj ao escolher', async () => {
    const user = userEvent.setup()
    const onSelectCnpj = vi.fn()
    render(
      <SimilarSuppliersModal
        {...baseProps()}
        cnpjs={['11222333000181', '99888777000166']}
        selectedCnpj={null}
        onSelectCnpj={onSelectCnpj}
      />,
    )
    expect(screen.getByText(/mais de um cnpj/i)).toBeInTheDocument()
    await user.click(screen.getByLabelText('99.888.777/0001-66'))
    expect(onSelectCnpj).toHaveBeenCalledWith('99888777000166')
  })

  it('desabilita o botão de busca até um CNPJ ser selecionado', () => {
    render(<SimilarSuppliersModal {...baseProps()} selectedCnpj={null} />)
    expect(screen.getByRole('button', { name: /buscar fornecedores semelhantes/i })).toBeDisabled()
  })

  it('chama onSearch ao clicar em buscar', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SimilarSuppliersModal {...baseProps()} onSearch={onSearch} />)
    await user.click(screen.getByRole('button', { name: /buscar fornecedores semelhantes/i }))
    expect(onSearch).toHaveBeenCalled()
  })

  it('mostra estado de busca em andamento', () => {
    render(<SimilarSuppliersModal {...baseProps()} isSearching />)
    expect(screen.getByText(/buscando/i)).toBeInTheDocument()
  })

  it('mostra a mensagem de erro da busca', () => {
    render(<SimilarSuppliersModal {...baseProps()} searchError="CNPJ não encontrado na Receita Federal." />)
    expect(screen.getByText('CNPJ não encontrado na Receita Federal.')).toBeInTheDocument()
  })

  it('mostra mensagem de nenhum resultado', () => {
    render(<SimilarSuppliersModal {...baseProps()} results={[]} />)
    expect(screen.getByText(/nenhuma empresa ativa encontrada/i)).toBeInTheDocument()
  })

  it('mostra os resultados com razão social, fantasia, cnpj, cidade/uf, cnae e porte', () => {
    render(<SimilarSuppliersModal {...baseProps()} results={[makeCandidate()]} />)
    expect(screen.getByText('Empresa Exemplo Ltda')).toBeInTheDocument()
    expect(screen.getByText('Exemplo')).toBeInTheDocument()
    expect(screen.getByText('11.222.333/0001-81')).toBeInTheDocument()
    expect(screen.getByText(/São Paulo\/SP/)).toBeInTheDocument()
    expect(screen.getByText(/Comércio varejista/)).toBeInTheDocument()
    expect(screen.getByText(/DEMAIS/)).toBeInTheDocument()
  })

  it('chama onLookupContact com o candidato ao clicar em Cadastrar (1º passo)', async () => {
    const user = userEvent.setup()
    const onLookupContact = vi.fn()
    const candidate = makeCandidate()
    render(<SimilarSuppliersModal {...baseProps()} results={[candidate]} onLookupContact={onLookupContact} />)
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(onLookupContact).toHaveBeenCalledWith(candidate)
  })

  it('mostra o botão de cadastrar em carregamento só pro item sendo verificado', () => {
    const candidateA = makeCandidate({ cnpj: '11222333000181' })
    const candidateB = makeCandidate({ cnpj: '99888777000166', razaoSocial: 'Outra Empresa Ltda' })
    render(
      <SimilarSuppliersModal {...baseProps()} results={[candidateA, candidateB]} checkingCnpj="11222333000181" />,
    )
    const buttons = screen.getAllByRole('button', { name: /cadastrar/i })
    expect(buttons[0]).toBeDisabled()
    expect(buttons[1]).not.toBeDisabled()
  })

  it('mostra o telefone encontrado e o botão de continuar, após a verificação de contato', async () => {
    const user = userEvent.setup()
    const onConfirmRegister = vi.fn()
    const candidate = makeCandidate()
    render(
      <SimilarSuppliersModal
        {...baseProps()}
        results={[candidate]}
        contactByCnpj={{ [candidate.cnpj]: { phone: '1140028922' } }}
        onConfirmRegister={onConfirmRegister}
      />,
    )
    expect(screen.getByText(/telefone encontrado: 1140028922/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cadastrar' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /continuar cadastro/i }))
    expect(onConfirmRegister).toHaveBeenCalledWith(candidate)
  })

  it('mostra "sem telefone público" de forma clara quando a verificação não encontra telefone, sem travar o cadastro', async () => {
    const user = userEvent.setup()
    const onConfirmRegister = vi.fn()
    const candidate = makeCandidate()
    render(
      <SimilarSuppliersModal
        {...baseProps()}
        results={[candidate]}
        contactByCnpj={{ [candidate.cnpj]: { phone: null } }}
        onConfirmRegister={onConfirmRegister}
      />,
    )
    expect(screen.getByText(/sem telefone público encontrado/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /continuar cadastro/i }))
    expect(onConfirmRegister).toHaveBeenCalledWith(candidate)
  })
})
