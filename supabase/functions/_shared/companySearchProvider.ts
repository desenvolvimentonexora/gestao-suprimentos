// Isolamento do provedor de descoberta de empresas (Apify, actor
// jungle_synthesizer/brazil-cnpj-receita-federal-crawler) — nenhum outro
// lugar do código deve chamar a API da Apify diretamente; trocar de
// ator/provedor no futuro (inclusive só pra lookupContact, se o modo
// single-CNPJ deste actor não trouxer telefone/e-mail) deve ser uma mudança
// só neste arquivo.

const ACTOR = 'jungle_synthesizer~brazil-cnpj-receita-federal-crawler'
const RUN_SYNC_URL = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items`

// Situação cadastral, conforme documentado pelo próprio actor (confirmado
// em 2026-09, corrigindo uma suposição anterior baseada no schema da
// BrasilAPI): campo "situacao_cadastral" (sem "descricao_" no nome), valores
// "ATIVA" | "SUSPENSA" | "INAPTA" | "BAIXADA" | "NULA". O actor NÃO filtra
// isso — precisamos descartar tudo que não for ATIVA antes de sugerir ao
// comprador.
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

// Confirmado que este actor não retorna e-mail — só telefone (e fax, que não
// usamos). Só um provedor nesta V1: e-mail continua disponível pro comprador
// preencher manualmente no formulário, só não vem pré-preenchido.
export interface ContactInfo {
  phone: string | null
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
  situacao_cadastral?: string | null
  telefone1?: string | null
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
    .filter((item) => item.situacao_cadastral === ACTIVE_STATUS)
    .map(toCandidate)
    .filter((candidate): candidate is CompanyCandidate => candidate !== null)
}

// Devolve null só quando o actor não encontra o CNPJ; quando encontra mas
// não tem telefone público, devolve { phone: null } — o chamador decide como
// comunicar isso, em vez de tratar "sem telefone" como falha de busca.
export async function lookupContact(cnpj: string): Promise<ContactInfo | null> {
  const items = await runActor({ cnpj })
  const item = items[0]
  if (!item) return null

  return { phone: item.telefone1?.trim() || null }
}
