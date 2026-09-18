import { describe, expect, it } from 'vitest'
import { getSupplierColor } from './supplierColor'

describe('getSupplierColor', () => {
  it('retorna a mesma cor para o mesmo id de fornecedor', () => {
    const first = getSupplierColor('supplier-sika')
    const second = getSupplierColor('supplier-sika')
    expect(first).toEqual(second)
  })

  it('retorna cores diferentes para fornecedores diferentes', () => {
    const sika = getSupplierColor('supplier-sika')
    const votorantim = getSupplierColor('supplier-votorantim')
    expect(sika.header).not.toBe(votorantim.header)
  })

  it('expõe classes de cabeçalho e de tag', () => {
    const color = getSupplierColor('supplier-sika')
    expect(color.header).toContain('border-')
    expect(color.tag).toContain('bg-')
  })

  it('expõe uma variante de cabeçalho de tabela com preenchimento sólido e texto branco', () => {
    const color = getSupplierColor('supplier-sika')
    expect(color.tableHeader).toContain('bg-')
    expect(color.tableHeader).toContain('text-white')
  })
})
