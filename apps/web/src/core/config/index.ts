import { useQuery } from '@tanstack/react-query'
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

export function settingsQueryKey(tenantId: string | undefined) {
  return ['settings', tenantId] as const
}

// Mesma queryKey usada pelo AppRoot ao carregar settings na raiz do app —
// qualquer tela que chame este hook lê do mesmo cache do TanStack Query,
// sem refazer a consulta, e recebe o valor novo assim que a Administração
// invalida essa key após salvar.
export function useSettings(tenantId: string | undefined) {
  return useQuery({
    queryKey: settingsQueryKey(tenantId),
    queryFn: () => loadSettings(tenantId!),
    enabled: Boolean(tenantId),
  })
}

export { InvalidSettingsError, parseSettings } from './parseSettings'
export type { Brand, Settings, Theme, Vocabulary } from './settingsSchema'
