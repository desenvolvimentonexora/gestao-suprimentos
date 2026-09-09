import { extractSubdomain } from './extractSubdomain'
import { resolveTenantWithFallback } from './resolveTenant'
import { fetchTenantRow } from './api'
import type { TenantConfig } from './types'

let cachedTenant: Promise<TenantConfig> | null = null

export function getTenant(): Promise<TenantConfig> {
  cachedTenant ??= resolveTenantWithFallback(
    extractSubdomain(window.location.hostname),
    import.meta.env.VITE_DEV_TENANT_SUBDOMAIN,
    fetchTenantRow,
  )
  return cachedTenant
}

export { extractSubdomain } from './extractSubdomain'
export { resolveTenant, resolveTenantWithFallback, TenantNotFoundError } from './resolveTenant'
export type { TenantConfig, TenantRow } from './types'
