import { useState } from 'react'
import { Modal, Spinner } from '../../components'
import { buildMaterialLookup } from './buildMaterialLookup'
import { useExtractRequestPdf, useMaterialOptions, useUnitOptions } from './queries'
import type { RequestFormValues } from './types'

export interface ImportRequestPdfModalProps {
  isOpen: boolean
  onClose: () => void
  onImported: (values: RequestFormValues, file: File) => void
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase()
}

export function ImportRequestPdfModal({ isOpen, onClose, onImported }: ImportRequestPdfModalProps) {
  const [error, setError] = useState<string | null>(null)
  const unitsQuery = useUnitOptions()
  const materialsQuery = useMaterialOptions()
  const extractRequestPdf = useExtractRequestPdf()

  function handleClose() {
    setError(null)
    onClose()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError(null)
    try {
      const extracted = await extractRequestPdf.mutateAsync(file)

      const units = unitsQuery.data ?? []
      const materials = materialsQuery.data ?? []
      const unitsByName = new Map(units.map((unit) => [normalizeName(unit.name), unit.id]))
      // item.description vem da IA como o texto completo do insumo (ex.:
      // "ABRAÇADEIRA TIPO "U" 5" X 150 MM") — comparável à descrição da
      // variante, não ao nome genérico do material (que é só a categoria,
      // ex.: "Abraçadeira Tipo U", compartilhada por várias variantes).
      const materialLookup = buildMaterialLookup(materials)

      const values: RequestFormValues = {
        unitId: extracted.unitNameGuess ? (unitsByName.get(normalizeName(extracted.unitNameGuess)) ?? '') : '',
        neededBy: extracted.neededBy ?? '',
        externalRef: extracted.requestNumber ?? '',
        items: extracted.items.map((item) => ({
          materialId:
            (item.code ? materialLookup.findByCode(item.code) : null) ??
            materialLookup.findByDescription(item.description) ??
            '',
          quantity: item.quantity ?? 0,
          unitOfMeasure: item.unitOfMeasure ?? '',
        })),
      }

      onImported(values, file)
    } catch (extractError) {
      setError(
        extractError instanceof Error
          ? extractError.message
          : 'Não foi possível ler o PDF. Tente novamente ou cadastre manualmente.',
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar PDF da Solicitação">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">
          Selecione o PDF da Solicitação exportado do ERP. Os dados extraídos abrem no formulário de cadastro
          pra você revisar e completar antes de salvar — nenhuma requisição é criada automaticamente.
        </p>

        {extractRequestPdf.isPending ? (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Spinner /> Lendo o PDF...
          </p>
        ) : (
          <input type="file" accept=".pdf" onChange={handleFileChange} />
        )}

        {error && <p className="text-sm text-accent">{error}</p>}
      </div>
    </Modal>
  )
}
