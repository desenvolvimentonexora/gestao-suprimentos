export type RequestStatus =
  | 'draft'
  | 'open'
  | 'negotiating'
  | 'quoted'
  | 'cancelled'
  | 'pending_review'
  | 'clarification_requested'
  | 'extension_requested'
  | 'released_to_dispatch'

export interface RequestItemRow {
  id: string
  /** Na verdade o id da variante (material_variants.id) — a requisição fica amarrada ao código exato. */
  materialId: string
  materialName: string
  materialCode: string | null
  materialDescription: string | null
  quantity: number
  unitOfMeasure: string | null
  statusCode: string | null
  authorizedAt: string | null
  pendente: boolean
  motivoPendencia: string | null
}

export interface RequestRow {
  id: string
  unitId: string
  unitName: string
  status: RequestStatus
  neededBy: string | null
  externalRef: string | null
  sequenceNumber: number | null
  createdAt: string
  subjectCategory: string | null
  notes: string | null
  negotiatorId: string | null
  negotiatorName: string | null
  negotiatingStartedAt: string | null
  quotationsCount: number
  dispatchBlockedReason: string | null
  items: RequestItemRow[]
}

/** id é o da variante (material_variants.id); name é o nome do material genérico. */
export interface MaterialWithSupplierCount {
  id: string
  name: string
  supplierCount: number
  code: string | null
  categoryId: string
  categoryName: string
  /** Ids dos fornecedores desta variante — usado só pra somar sem duplicar ao agrupar por categoria. */
  supplierIds: string[]
}

export interface RequestItemFormValues {
  /** id da variante (material_variants.id). */
  materialId: string
  quantity: number
  unitOfMeasure: string
}

export interface RequestFormValues {
  unitId: string
  neededBy: string
  externalRef: string
  items: RequestItemFormValues[]
}

/** Opção de variante (material_variants) para o seletor de item da requisição. */
export interface MaterialOption {
  id: string
  materialName: string
  code: string | null
  description: string | null
}

export interface UnitOption {
  id: string
  name: string
}

export interface ImportColumnMapping {
  unit: string
  material: string
  materialCode: string
  quantity: string
  unitOfMeasure: string
  neededBy: string
  externalRef: string
}

export interface ImportRowError {
  row: number
  reason: string
}

export interface ImportParseResult {
  successes: RequestFormValues[]
  errors: ImportRowError[]
}

