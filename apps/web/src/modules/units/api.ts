import { supabase } from '../../lib/supabase'
import type { UnitFormValues, UnitRow } from './types'

const UNIT_COLUMNS =
  'id, name, cnpj, zip_code, street, number, neighborhood, city, state, type, status, start_date, end_date, engineer_name, engineer_phone, engineer_email, admin_name, admin_phone, admin_email'

function toUnitRow(row: Record<string, unknown>): UnitRow {
  return {
    id: row.id as string,
    name: row.name as string,
    cnpj: (row.cnpj as string | null) ?? null,
    zipCode: (row.zip_code as string | null) ?? null,
    street: (row.street as string | null) ?? null,
    number: (row.number as string | null) ?? null,
    neighborhood: (row.neighborhood as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    type: row.type as UnitRow['type'],
    status: row.status as UnitRow['status'],
    startDate: (row.start_date as string | null) ?? null,
    endDate: (row.end_date as string | null) ?? null,
    engineerName: (row.engineer_name as string | null) ?? null,
    engineerPhone: (row.engineer_phone as string | null) ?? null,
    engineerEmail: (row.engineer_email as string | null) ?? null,
    adminName: (row.admin_name as string | null) ?? null,
    adminPhone: (row.admin_phone as string | null) ?? null,
    adminEmail: (row.admin_email as string | null) ?? null,
  }
}

function toUnitPayload(values: UnitFormValues) {
  return {
    name: values.name,
    cnpj: values.cnpj || null,
    zip_code: values.zipCode || null,
    street: values.street || null,
    number: values.number || null,
    neighborhood: values.neighborhood || null,
    city: values.city || null,
    state: values.state || null,
    type: values.type,
    status: values.status,
    start_date: values.startDate || null,
    end_date: values.endDate || null,
    engineer_name: values.engineerName || null,
    engineer_phone: values.engineerPhone || null,
    engineer_email: values.engineerEmail || null,
    admin_name: values.adminName || null,
    admin_phone: values.adminPhone || null,
    admin_email: values.adminEmail || null,
  }
}

export async function fetchUnitsList(): Promise<UnitRow[]> {
  const { data, error } = await supabase
    .from('units')
    .select(UNIT_COLUMNS)
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data.map(toUnitRow)
}

export async function createUnit(tenantId: string, values: UnitFormValues): Promise<void> {
  const { error } = await supabase
    .from('units')
    .insert({ tenant_id: tenantId, ...toUnitPayload(values) })
  if (error) throw error
}

export async function updateUnit(unitId: string, values: UnitFormValues): Promise<void> {
  const { error } = await supabase.from('units').update(toUnitPayload(values)).eq('id', unitId)
  if (error) throw error
}

export async function deleteUnit(unitId: string): Promise<void> {
  const { error } = await supabase
    .from('units')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', unitId)
  if (error) throw error
}
