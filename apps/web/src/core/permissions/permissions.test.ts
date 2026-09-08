import { describe, expect, it } from 'vitest'
import { hasAllPermissions, hasAnyPermission, hasPermission } from './permissions'

describe('hasPermission', () => {
  it('retorna true quando a permissão está na lista concedida', () => {
    expect(hasPermission(['requests.create', 'requests.read'], 'requests.create')).toBe(true)
  })

  it('retorna false quando a permissão não está na lista concedida', () => {
    expect(hasPermission(['requests.read'], 'requests.create')).toBe(false)
  })
})

describe('hasAnyPermission', () => {
  it('retorna true quando ao menos uma permissão exigida está concedida', () => {
    expect(hasAnyPermission(['requests.read'], ['requests.create', 'requests.read'])).toBe(true)
  })

  it('retorna false quando nenhuma permissão exigida está concedida', () => {
    expect(hasAnyPermission(['requests.read'], ['requests.create', 'requests.approve'])).toBe(
      false,
    )
  })
})

describe('hasAllPermissions', () => {
  it('retorna true quando todas as permissões exigidas estão concedidas', () => {
    expect(
      hasAllPermissions(
        ['requests.read', 'requests.create'],
        ['requests.create', 'requests.read'],
      ),
    ).toBe(true)
  })

  it('retorna false quando falta ao menos uma permissão exigida', () => {
    expect(hasAllPermissions(['requests.read'], ['requests.create', 'requests.read'])).toBe(false)
  })
})
