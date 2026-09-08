export interface TenantRow {
  id: string
  subdomain: string
  supabaseUrl: string
  supabaseAnonKey: string
  licensedModules: string[]
}

export interface TenantConfig {
  tenantId: string
  supabaseUrl: string
  supabaseAnonKey: string
  modules: string[]
}
