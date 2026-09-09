export interface TenantRow {
  id: string
  name: string
  subdomain: string
  supabaseUrl: string
  supabaseAnonKey: string
  licensedModules: string[]
}

export interface TenantConfig {
  tenantId: string
  name: string
  supabaseUrl: string
  supabaseAnonKey: string
  modules: string[]
}
