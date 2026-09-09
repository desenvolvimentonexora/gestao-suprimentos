import { useState } from 'react'
import { CategoryColumn } from './CategoryColumn'
import { MaterialColumn } from './MaterialColumn'
import { SupplierColumn } from './SupplierColumn'
import type { SupplierPopupKind } from './SupplierCard'
import { SupplierPopups, type ActivePopup } from './popups/SupplierPopups'
import { QuoteRequestModal } from './popups/QuoteRequestModal'
import { SupplierFormContainer, type SupplierFormState } from './SupplierFormContainer'
import { ReportModal } from './ReportModal'
import {
  useCategories,
  useCreateMaterial,
  useDeleteMaterial,
  useDeleteSupplier,
  useFavoriteSupplierIds,
  useMaterials,
  useSupplierEmailsByMaterial,
  useSupplierReport,
  useSuppliersByMaterial,
  useToggleFavoriteSupplier,
  useUnits,
  useUpdateMaterial,
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
  const [activePopup, setActivePopup] = useState<ActivePopup | null>(null)
  const [quoteRequestOpen, setQuoteRequestOpen] = useState(false)
  const [formState, setFormState] = useState<SupplierFormState | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const categoriesQuery = useCategories()
  const materialsQuery = useMaterials()
  const createMaterial = useCreateMaterial(tenantId)
  const updateMaterial = useUpdateMaterial()
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

  const reportQuery = useSupplierReport(reportOpen)
  const unitsQuery = useUnits()
  const supplierEmailsQuery = useSupplierEmailsByMaterial(selectedMaterialId, quoteRequestOpen)

  function selectMaterial(materialId: string) {
    setSelectedMaterialId(materialId)
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Agenda de Fornecedores</h1>

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
            onCreateMaterial={(name, categoryId, icon) =>
              createMaterial.mutate({ name, categoryId, icon })
            }
            onUpdateMaterial={(materialId, name, categoryId, icon) =>
              updateMaterial.mutate({ materialId, values: { name, categoryId, icon } })
            }
            onDeleteMaterial={(materialId) => deleteMaterial.mutate(materialId)}
            supplierSearch={supplierSearch}
            onSupplierSearchChange={(value) => {
              setSupplierSearch(value)
              setPage(0)
            }}
            onOpenReport={() => setReportOpen(true)}
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
            onAddSupplier={() =>
              setFormState({ mode: 'create', defaultMaterialId: selectedMaterialId ?? undefined })
            }
            favoriteIds={favoriteIds.data ?? new Set()}
            onToggleFavorite={(supplierId) =>
              toggleFavorite.mutate({ supplierId, favorite: !favoriteIds.data?.has(supplierId) })
            }
            onOpenPopup={(kind: SupplierPopupKind, supplierId) =>
              setActivePopup({ kind, supplierId })
            }
            onEditSupplier={(supplierId) => setFormState({ mode: 'edit', supplierId })}
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

      <SupplierFormContainer
        tenantId={tenantId}
        state={formState}
        onClose={() => setFormState(null)}
        allMaterials={materialsQuery.data ?? []}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        rows={reportQuery.data ?? []}
      />
    </div>
  )
}
