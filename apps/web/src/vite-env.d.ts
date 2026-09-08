/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Subdomínio usado em `localhost`, onde não há subdomínio real na URL. */
  readonly VITE_DEV_TENANT_SUBDOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
