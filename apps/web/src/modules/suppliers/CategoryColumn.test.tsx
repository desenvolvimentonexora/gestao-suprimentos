import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getCategoryColor } from './categoryColor'
import { CategoryColumn } from './CategoryColumn'
import type { CategoryRow } from './types'

const categories: CategoryRow[] = [
  { id: 'c1', name: 'Elétrica', slug: 'eletrica', icon: 'zap' },
  { id: 'c2', name: 'Hidráulica', slug: 'hidraulica', icon: 'droplet' },
]

describe('CategoryColumn', () => {
  it('lista "Todos" e as categorias', () => {
    render(<CategoryColumn categories={categories} selectedCategoryId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Todos')).toBeInTheDocument()
    expect(screen.getByText('Elétrica')).toBeInTheDocument()
    expect(screen.getByText('Hidráulica')).toBeInTheDocument()
  })

  it('chama onSelect com o id da categoria clicada', async () => {
    const onSelect = vi.fn()
    render(<CategoryColumn categories={categories} selectedCategoryId={null} onSelect={onSelect} />)

    await userEvent.click(screen.getByText('Elétrica'))

    expect(onSelect).toHaveBeenCalledWith('c1')
  })

  it('chama onSelect com null ao clicar em "Todos"', async () => {
    const onSelect = vi.fn()
    render(<CategoryColumn categories={categories} selectedCategoryId="c1" onSelect={onSelect} />)

    await userEvent.click(screen.getByText('Todos'))

    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('marca a categoria selecionada como atual', () => {
    render(<CategoryColumn categories={categories} selectedCategoryId="c1" onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Elétrica' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('mostra um ícone antes do nome de cada categoria, inclusive "Todos"', () => {
    render(<CategoryColumn categories={categories} selectedCategoryId={null} onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Todos' }).querySelector('svg')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Elétrica' }).querySelector('svg'),
    ).toBeInTheDocument()
  })

  it('cada categoria mantém sua própria cor pastel de fundo quando não está selecionada', () => {
    render(<CategoryColumn categories={categories} selectedCategoryId={null} onSelect={vi.fn()} />)
    const eletricaClass = screen.getByRole('button', { name: 'Elétrica' }).className
    const hidraulicaClass = screen.getByRole('button', { name: 'Hidráulica' }).className
    expect(eletricaClass).toContain(getCategoryColor('c1').itemBg)
    expect(hidraulicaClass).toContain(getCategoryColor('c2').itemBg)
    expect(eletricaClass).not.toBe(hidraulicaClass)
  })

  it('a categoria selecionada usa a cor da marca (fundo verde, texto branco), não a cor pastel', () => {
    render(<CategoryColumn categories={categories} selectedCategoryId="c1" onSelect={vi.fn()} />)
    const selectedClass = screen.getByRole('button', { name: 'Elétrica' }).className
    expect(selectedClass).toContain('bg-primary')
    expect(selectedClass).not.toContain(getCategoryColor('c1').itemBg)
  })

  it('"Todos" selecionado também usa a cor da marca', () => {
    render(<CategoryColumn categories={categories} selectedCategoryId={null} onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Todos' }).className).toContain('bg-primary')
  })
})
