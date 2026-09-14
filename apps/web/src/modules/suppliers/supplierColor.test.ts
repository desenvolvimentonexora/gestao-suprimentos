import { describe, expect, it } from 'vitest'
import { getSupplierColor } from './supplierColor'

describe('getSupplierColor', () => {
  it('retorna a mesma cor para o mesmo id de fornecedor', () => {
    const first = getSupplierColor('supplier-alfa')
    const second = getSupplierColor('supplier-alfa')
    expect(first).toEqual(second)
  })

  it('retorna cores diferentes para fornecedores diferentes', () => {
    const alfa = getSupplierColor('supplier-alfa')
    const beta = getSupplierColor('supplier-beta')
    expect(alfa.avatar).not.toBe(beta.avatar)
  })

  it('expõe uma classe de fundo sólido para o avatar', () => {
    const color = getSupplierColor('supplier-alfa')
    expect(color.avatar).toContain('bg-')
  })
})
