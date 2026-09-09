import { describe, expect, it, vi } from 'vitest'
import { resolveTenant, resolveTenantWithFallback, TenantNotFoundError } from './resolveTenant'
import type { TenantRow } from './types'

const tenantRow: TenantRow = {
  id: 'tenant-1',
  name: 'Construtora ABC',
  subdomain: 'construtora-abc',
  supabaseUrl: 'https://hvtcmpzfqcvbyiehkgbk.supabase.co',
  supabaseAnonKey: 'anon-key',
  licensedModules: ['requests', 'suppliers'],
}

describe('resolveTenant', () => {
  it('monta a configuração do tenant a partir da linha encontrada', async () => {
    const config = await resolveTenant('construtora-abc', async () => tenantRow)

    expect(config).toEqual({
      tenantId: 'tenant-1',
      name: 'Construtora ABC',
      supabaseUrl: 'https://hvtcmpzfqcvbyiehkgbk.supabase.co',
      supabaseAnonKey: 'anon-key',
      modules: ['requests', 'suppliers'],
    })
  })

  it('lança TenantNotFoundError quando nenhuma linha é encontrada', async () => {
    await expect(resolveTenant('desconhecido', async () => null)).rejects.toThrow(
      TenantNotFoundError,
    )
  })
})

describe('resolveTenantWithFallback', () => {
  it('usa o subdomínio principal quando ele resolve normalmente', async () => {
    const fetchTenantRow = vi.fn(async (subdomain: string | null) =>
      subdomain === 'construtora-abc' ? tenantRow : null,
    )

    const config = await resolveTenantWithFallback('construtora-abc', 'construtora-beta', fetchTenantRow)

    expect(config.tenantId).toBe('tenant-1')
    expect(fetchTenantRow).toHaveBeenCalledTimes(1)
  })

  it('cai para o subdomínio de fallback quando o principal não bate com nenhum tenant', async () => {
    const fetchTenantRow = vi.fn(async (subdomain: string | null) =>
      subdomain === 'construtora-beta' ? tenantRow : null,
    )

    const config = await resolveTenantWithFallback(
      'gestao-suprimentos-web',
      'construtora-beta',
      fetchTenantRow,
    )

    expect(config.tenantId).toBe('tenant-1')
    expect(fetchTenantRow).toHaveBeenNthCalledWith(1, 'gestao-suprimentos-web')
    expect(fetchTenantRow).toHaveBeenNthCalledWith(2, 'construtora-beta')
  })

  it('cai para o fallback quando não há subdomínio nenhum (ex.: localhost)', async () => {
    const fetchTenantRow = vi.fn(async (subdomain: string | null) =>
      subdomain === 'construtora-beta' ? tenantRow : null,
    )

    const config = await resolveTenantWithFallback(null, 'construtora-beta', fetchTenantRow)

    expect(config.tenantId).toBe('tenant-1')
  })

  it('lança TenantNotFoundError quando nem o principal nem o fallback resolvem', async () => {
    const fetchTenantRow = vi.fn(async () => null)

    await expect(
      resolveTenantWithFallback('gestao-suprimentos-web', 'construtora-beta', fetchTenantRow),
    ).rejects.toThrow(TenantNotFoundError)
  })

  it('não tenta o fallback quando ele não está configurado', async () => {
    const fetchTenantRow = vi.fn(async () => null)

    await expect(
      resolveTenantWithFallback('gestao-suprimentos-web', undefined, fetchTenantRow),
    ).rejects.toThrow(TenantNotFoundError)
    expect(fetchTenantRow).toHaveBeenCalledTimes(1)
  })

  it('não repete a busca quando o fallback é igual ao subdomínio já tentado', async () => {
    const fetchTenantRow = vi.fn(async () => null)

    await expect(
      resolveTenantWithFallback('construtora-beta', 'construtora-beta', fetchTenantRow),
    ).rejects.toThrow(TenantNotFoundError)
    expect(fetchTenantRow).toHaveBeenCalledTimes(1)
  })
})
