import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReportModal } from './ReportModal'
import type { SupplierReportRow } from './types'

const rows: SupplierReportRow[] = [
  {
    id: 's1',
    name: 'Fornecedor Alfa',
    city: 'São Paulo',
    contactName: 'Ana Souza',
    materials: ['Cimento', 'Areia'],
  },
]

describe('ReportModal', () => {
  it('lista os fornecedores em uma tabela', () => {
    render(<ReportModal isOpen onClose={vi.fn()} rows={rows} />)
    expect(screen.getByText('Fornecedor Alfa')).toBeInTheDocument()
    expect(screen.getByText('São Paulo')).toBeInTheDocument()
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('Cimento, Areia')).toBeInTheDocument()
  })

  it('não lança erro ao clicar em exportar', async () => {
    render(<ReportModal isOpen onClose={vi.fn()} rows={rows} />)
    await userEvent.click(screen.getByRole('button', { name: /Exportar Excel/ }))
    expect(screen.getByRole('button', { name: /Exportar Excel/ })).toBeInTheDocument()
  })
})
