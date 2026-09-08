import { extractSubdomain } from './extractSubdomain'
import { resolveTenant } from './resolveTenant'
import { fetchTenantRow } from './api'
import type { TenantConfig } from './types'

let cachedTenant: Promise<TenantConfig> | null = null

export function getTenant(): Promise<TenantConfig> {
  const subdomain =
    extractSubdomain(window.location.hostname) ?? import.meta.env.VITE_DEV_TENANT_SUBDOMAIN ?? null
  cachedTenant ??= resolveTenant(subdomain, fetchTenantRow)
  return cachedTenant
}

export { extractSubdomain } from './extractSubdomain'
export { resolveTenant, TenantNotFoundError } from './resolveTenant'
export type { TenantConfig, TenantRow } from './types'
