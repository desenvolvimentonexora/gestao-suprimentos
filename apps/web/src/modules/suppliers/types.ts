export interface CategoryRow {
  id: string
  name: string
  slug: string
  icon: string
}

export interface MaterialRow {
  id: string
  name: string
  categoryId: string
  supplierCount: number
  icon: string
}

export interface MaterialVariantRow {
  id: string
  materialId: string
  materialName: string
  code: string | null
  description: string | null
}

export interface SupplierContactRow {
  name: string
  phone: string | null
  email: string | null
}

export interface SupplierReportRow {
  id: string
  name: string
  city: string | null
  contactName: string | null
  materials: string[]
}

export interface SupplierRow {
  id: string
  name: string
  city: string | null
  type: string | null
  status: 'active' | 'inactive'
  mainContact: SupplierContactRow | null
  createdByName: string | null
}

export interface ResolvedCnae {
  cnae: string
  cnaeDescricao: string
  uf: string
}

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

// O actor de descoberta (Apify) não retorna e-mail, só telefone — e-mail
// continua disponível pro comprador preencher manualmente no formulário, só
// não vem pré-preenchido.
export interface ContactInfo {
  phone: string | null
}
