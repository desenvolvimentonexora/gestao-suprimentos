// Isolamento da API pública de CNPJ (BrasilAPI) — usada só pra descobrir o
// CNAE principal de um CNPJ já cadastrado. Trocar de provedor no futuro deve
// ser uma mudança só neste arquivo. Sem cache nesta V1 (decisão de produto);
// se isso virar uso frequente, a extensão natural é persistir o resultado em
// supplier_documents (cnae_principal_codigo, cnae_principal_descricao,
// cnae_fetched_at) — não implementado agora de propósito.

export interface ResolvedCnae {
  cnae: string
  cnaeDescricao: string
  uf: string
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export async function resolveCnae(cnpj: string): Promise<ResolvedCnae | null> {
  const digits = onlyDigits(cnpj)
  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Falha ao consultar CNPJ na Receita Federal (status ${response.status}).`)
  }

  const data = await response.json()
  if (!data.cnae_fiscal) {
    throw new Error('A Receita Federal não retornou o CNAE principal para este CNPJ.')
  }

  return {
    cnae: String(data.cnae_fiscal),
    cnaeDescricao: data.cnae_fiscal_descricao ?? '',
    uf: data.uf ?? '',
  }
}
