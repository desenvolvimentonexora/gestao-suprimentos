export type UnitType = 'obra' | 'escritorio' | 'deposito'
export type UnitStatus = 'active' | 'completed' | 'inactive'

export interface UnitRow {
  id: string
  name: string
  cnpj: string | null
  zipCode: string | null
  street: string | null
  number: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  type: UnitType
  status: UnitStatus
  startDate: string | null
  endDate: string | null
  engineerName: string | null
  engineerPhone: string | null
  engineerEmail: string | null
  adminName: string | null
  adminPhone: string | null
  adminEmail: string | null
}

export interface UnitFormValues {
  name: string
  cnpj: string
  zipCode: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  type: UnitType
  status: UnitStatus
  startDate: string
  endDate: string
  engineerName: string
  engineerPhone: string
  engineerEmail: string
  adminName: string
  adminPhone: string
  adminEmail: string
}
