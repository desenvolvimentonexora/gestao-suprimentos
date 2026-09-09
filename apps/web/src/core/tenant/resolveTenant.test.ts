import { describe, expect, it } from 'vitest'
import { resolveTenant, TenantNotFoundError } from './resolveTenant'
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
