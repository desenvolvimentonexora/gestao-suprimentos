// Isolamento do provedor de descoberta de empresas (Apify, actor
// jungle_synthesizer/brazil-cnpj-receita-federal-crawler) — nenhum outro
// lugar do código deve chamar a API da Apify diretamente; trocar de
// ator/provedor no futuro (inclusive só pra lookupContact, se o modo
// single-CNPJ deste actor não trouxer telefone/e-mail) deve ser uma mudança
// só neste arquivo.

const ACTOR = 'jungle_synthesizer~brazil-cnpj-receita-federal-crawler'
const RUN_SYNC_URL = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items`

// Situação cadastral vem da mesma base (minhareceita.org/RFB) usada pela
// BrasilAPI, que expõe o campo como "descricao_situacao_cadastral" (ex.:
// "ATIVA", "BAIXADA", "SUSPENSA"). O actor NÃO filtra isso — precisamos
// descartar tudo que não for ATIVA antes de sugerir ao comprador.
const ACTIVE_STATUS = 'ATIVA'

export interface CompanyCandidate {
  razaoSocial: string
  nomeFantasia: string | null
  cnpj: string
  cidade: string | null
  uf: string | null
  cnae: string | null
  cnaeDescricao: string | null
  porte: string | null
}

export interface ContactInfo {
  phone: string | null
  email: string | null
}

interface ApifyCompanyItem {
  cnpj?: string
  razao_social?: string
  nome_fantasia?: string | null
  municipio?: string | null
  uf?: string | null
  cnae_fiscal?: string | number | null
  cnae_fiscal_descricao?: string | null
  porte?: string | null
  descricao_situacao_cadastral?: string | null
  ddd_telefone_1?: string | null
  email?: string | null
}

function getApifyToken(): string {
  const token = Deno.env.get('APIFY_TOKEN')
  if (!token) throw new Error('APIFY_TOKEN não configurado.')
  return token
}

async function runActor(input: Record<string, unknown>): Promise<ApifyCompanyItem[]> {
  const response = await fetch(`${RUN_SYNC_URL}?token=${getApifyToken()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(`Falha ao consultar a Apify (status ${response.status}). Verifique créditos/disponibilidade.`)
  }

  return (await response.json()) as ApifyCompanyItem[]
}

function toCandidate(item: ApifyCompanyItem): CompanyCandidate | null {
  if (!item.cnpj || !item.razao_social) return null
  return {
    razaoSocial: item.razao_social,
    nomeFantasia: item.nome_fantasia ?? null,
    cnpj: item.cnpj,
    cidade: item.municipio ?? null,
    uf: item.uf ?? null,
    cnae: item.cnae_fiscal != null ? String(item.cnae_fiscal) : null,
    cnaeDescricao: item.cnae_fiscal_descricao ?? null,
    porte: item.porte ?? null,
  }
}

export async function discoverByCnae(cnae: string, uf: string, maxItems = 100): Promise<CompanyCandidate[]> {
  const items = await runActor({ uf, cnae, maxItems })

  return items
    .filter((item) => item.descricao_situacao_cadastral === ACTIVE_STATUS)
    .map(toCandidate)
    .filter((candidate): candidate is CompanyCandidate => candidate !== null)
}

export async function lookupContact(cnpj: string): Promise<ContactInfo | null> {
  const items = await runActor({ cnpj })
  const item = items[0]
  if (!item) return null

  const phone = item.ddd_telefone_1?.trim() || null
  const email = item.email?.trim() || null
  if (!phone && !email) return null

  return { phone, email }
}
