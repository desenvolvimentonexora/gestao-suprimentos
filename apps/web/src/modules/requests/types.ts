export type RequestStatus = 'draft' | 'open' | 'negotiating' | 'quoted' | 'cancelled'

export interface RequestItemRow {
  id: string
  materialId: string
  materialName: string
  materialCode: string | null
  materialDescription: string | null
  quantity: number
  unitOfMeasure: string | null
  statusCode: string | null
  authorizedAt: string | null
}

export interface RequestRow {
  id: string
  unitId: string
  unitName: string
  status: RequestStatus
  neededBy: string | null
  externalRef: string | null
  createdAt: string
  subjectCategory: string | null
  notes: string | null
  negotiatorId: string | null
  negotiatorName: string | null
  negotiatingStartedAt: string | null
  quotationsCount: number
  items: RequestItemRow[]
}

export interface MaterialWithSupplierCount {
  id: string
  name: string
  supplierCount: number
  code: string | null
}

export interface RequestItemFormValues {
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

export interface MaterialOption {
  id: string
  name: string
  code: string | null
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

