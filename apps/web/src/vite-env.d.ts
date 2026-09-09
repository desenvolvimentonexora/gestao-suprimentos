/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /**
   * Subdomínio usado quando a URL não tem um subdomínio de cliente real —
   * `localhost` em dev, ou o domínio padrão da hospedagem (`*.vercel.app`)
   * antes de um domínio próprio do cliente estar configurado.
   */
  readonly VITE_DEV_TENANT_SUBDOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
