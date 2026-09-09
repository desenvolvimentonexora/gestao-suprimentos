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

/**
 * Como no protótipo o hostname público (localhost, domínio da Vercel)
 * quase nunca é o subdomínio real de um cliente, tenta o subdomínio
 * extraído da URL e, só se ele não bater com nenhum tenant, cai para
 * VITE_DEV_TENANT_SUBDOMAIN — sem isso, `<algo>.vercel.app` é lido como
 * se "algo" fosse um subdomínio de cliente e a busca falha.
 */
export async function resolveTenantWithFallback(
  subdomain: string | null,
  fallbackSubdomain: string | null | undefined,
  fetchTenantRow: (subdomain: string | null) => Promise<TenantRow | null>,
): Promise<TenantConfig> {
  try {
    return await resolveTenant(subdomain, fetchTenantRow)
  } catch (error) {
    if (error instanceof TenantNotFoundError && fallbackSubdomain && fallbackSubdomain !== subdomain) {
      return resolveTenant(fallbackSubdomain, fetchTenantRow)
    }
    throw error
  }
}
