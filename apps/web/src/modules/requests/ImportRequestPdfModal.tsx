import { useState } from 'react'
import { Modal, Spinner } from '../../components'
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
      const materialsByCode = new Map(
        materials.filter((material) => material.code).map((material) => [normalizeName(material.code!), material.id]),
      )
      const materialsByName = new Map(
        materials.map((material) => [normalizeName(material.materialName), material.id]),
      )

      const values: RequestFormValues = {
        unitId: extracted.unitNameGuess ? (unitsByName.get(normalizeName(extracted.unitNameGuess)) ?? '') : '',
        neededBy: extracted.neededBy ?? '',
        externalRef: extracted.requestNumber ?? '',
        items: extracted.items.map((item) => ({
          materialId:
            (item.code ? materialsByCode.get(normalizeName(item.code)) : undefined) ??
            materialsByName.get(normalizeName(item.description)) ??
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
