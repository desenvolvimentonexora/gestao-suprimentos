import { fetchSettingsRow } from './api'
import { parseSettings } from './parseSettings'
import type { Settings } from './settingsSchema'

export async function loadSettings(tenantId: string): Promise<Settings> {
  const row = await fetchSettingsRow(tenantId)
  if (!row) {
    throw new Error(`Nenhuma configuração encontrada para o tenant "${tenantId}".`)
  }
  return parseSettings(row)
}

export { InvalidSettingsError, parseSettings } from './parseSettings'
export type { Settings, Theme, Vocabulary } from './settingsSchema'
