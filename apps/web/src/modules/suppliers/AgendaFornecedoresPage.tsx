import { useState } from 'react'
import { CategoryColumn } from './CategoryColumn'
import { MaterialColumn } from './MaterialColumn'
import { SupplierColumn } from './SupplierColumn'
import type { SupplierPopupKind } from './SupplierCard'
import { SupplierPopups, type ActivePopup } from './popups/SupplierPopups'
import { QuoteRequestModal } from './popups/QuoteRequestModal'
import {
  useCategories,
  useCreateMaterial,
  useDeleteMaterial,
  useDeleteSupplier,
  useFavoriteSupplierIds,
  useMaterials,
  useSupplierEmailsByMaterial,
  useSuppliersByMaterial,
  useToggleFavoriteSupplier,
  useUnits,
} from './queries'

const PAGE_SIZE = 20

export interface AgendaFornecedoresPageProps {
  tenantId: string
  userId: string
}

export function AgendaFornecedoresPage({ tenantId, userId }: AgendaFornecedoresPageProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const [activePopup, setActivePopup] = useState<ActivePopup | null>(null)
  const [quoteRequestOpen, setQuoteRequestOpen] = useState(false)

  const categoriesQuery = useCategories()
  const materialsQuery = useMaterials()
  const createMaterial = useCreateMaterial(tenantId)
  const deleteMaterial = useDeleteMaterial()
  const deleteSupplier = useDeleteSupplier()
  const toggleFavorite = useToggleFavoriteSupplier(tenantId, userId)

  const selectedMaterial = materialsQuery.data?.find((m) => m.id === selectedMaterialId) ?? null

  const suppliersQuery = useSuppliersByMaterial(selectedMaterialId, {
    search: supplierSearch,
    type: typeFilter,
    page,
    pageSize: PAGE_SIZE,
  })

  const supplierRows = suppliersQuery.data?.rows ?? []
  const favoriteIds = useFavoriteSupplierIds(supplierRows.map((s) => s.id))

  const unitsQuery = useUnits()
  const supplierEmailsQuery = useSupplierEmailsByMaterial(selectedMaterialId, quoteRequestOpen)

  function selectMaterial(materialId: string) {
    setSelectedMaterialId(materialId)
    setPage(0)
  }

  function showStubNotice(feature: string) {
    setNotice(`${feature} — em construção, chega em uma próxima etapa.`)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Agenda de Fornecedores</h1>

      {notice && (
        <div className="mt-3 rounded border border-line bg-bg px-4 py-2 text-sm text-ink-muted">
          {notice}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:h-[calc(100vh-10rem)] lg:grid-cols-[200px_320px_1fr]">
        <div className="lg:h-full lg:overflow-y-auto">
          <CategoryColumn
            categories={categoriesQuery.data ?? []}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
        </div>

        <div className="lg:h-full lg:overflow-y-auto">
          <MaterialColumn
            materials={materialsQuery.data ?? []}
            categories={categoriesQuery.data ?? []}
            selectedCategoryId={selectedCategoryId}
            selectedMaterialId={selectedMaterialId}
            onSelectMaterial={selectMaterial}
            onCreateMaterial={(name, categoryId) => createMaterial.mutate({ name, categoryId })}
            onDeleteMaterial={(materialId) => deleteMaterial.mutate(materialId)}
            supplierSearch={supplierSearch}
            onSupplierSearchChange={(value) => {
              setSupplierSearch(value)
              setPage(0)
            }}
            onOpenReport={() => showStubNotice('Relatório de Fornecedores')}
          />
        </div>

        <div className="lg:h-full lg:overflow-y-auto">
          <SupplierColumn
            materialName={selectedMaterial?.name ?? null}
            suppliers={supplierRows}
            totalCount={suppliersQuery.data?.total ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            search={supplierSearch}
            onSearchChange={(value) => {
              setSupplierSearch(value)
              setPage(0)
            }}
            typeFilter={typeFilter}
            onTypeFilterChange={(value) => {
              setTypeFilter(value)
              setPage(0)
            }}
            availableTypes={[]}
            onRequestQuote={() => setQuoteRequestOpen(true)}
            onAddSupplier={() => showStubNotice('Cadastro de fornecedor')}
            favoriteIds={favoriteIds.data ?? new Set()}
            onToggleFavorite={(supplierId) =>
              toggleFavorite.mutate({ supplierId, favorite: !favoriteIds.data?.has(supplierId) })
            }
            onOpenPopup={(kind: SupplierPopupKind, supplierId) =>
              setActivePopup({ kind, supplierId })
            }
            onEditSupplier={() => showStubNotice('Edição de fornecedor')}
            onDeleteSupplier={(supplierId) => deleteSupplier.mutate(supplierId)}
          />
        </div>
      </div>

      <SupplierPopups
        tenantId={tenantId}
        activePopup={activePopup}
        onClose={() => setActivePopup(null)}
        selectedMaterialId={selectedMaterialId}
        selectedMaterialName={selectedMaterial?.name ?? null}
        allMaterials={materialsQuery.data ?? []}
      />

      <QuoteRequestModal
        isOpen={quoteRequestOpen}
        onClose={() => setQuoteRequestOpen(false)}
        materialName={selectedMaterial?.name ?? ''}
        suppliersWithEmail={supplierEmailsQuery.data ?? []}
        units={unitsQuery.data ?? []}
      />
    </div>
  )
}
