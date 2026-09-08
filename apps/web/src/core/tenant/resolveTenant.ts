import type { TenantConfig, TenantRow } from './types'

export class TenantNotFoundError extends Error {
  constructor(subdomain: string | null) {
    super(
      subdomain
        ? `Nenhum cliente encontrado para o subdomínio "${subdomain}".`
        : 'Nenhum subdomínio de cliente identificado nesta URL.',
    )
    this.name = 'TenantNotFoundError'
  }
}

export async function resolveTenant(
  subdomain: string | null,
  fetchTenantRow: (subdomain: string | null) => Promise<TenantRow | null>,
): Promise<TenantConfig> {
  const row = await fetchTenantRow(subdomain)
  if (!row) throw new TenantNotFoundError(subdomain)

  return {
    tenantId: row.id,
    name: row.name,
    supabaseUrl: row.supabaseUrl,
    supabaseAnonKey: row.supabaseAnonKey,
    modules: row.licensedModules,
  }
}
