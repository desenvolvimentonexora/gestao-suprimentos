import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components'
import { useSettings } from '../../core/config'
import { CategoryColumn } from './CategoryColumn'
import { CnpjLookupBlock } from './CnpjLookupBlock'
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
  useCreateMaterialVariant,
  useDeleteMaterial,
  useDeleteSupplier,
  useFavoriteSupplierIds,
  useMaterials,
  useMaterialVariants,
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
  const [materialSearch, setMaterialSearch] = useState('')
  const [showNewMaterialForm, setShowNewMaterialForm] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [activePopup, setActivePopup] = useState<ActivePopup | null>(null)
  const [quoteRequestOpen, setQuoteRequestOpen] = useState(false)
  const [formState, setFormState] = useState<SupplierFormState | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const settingsQuery = useSettings(tenantId)
  const supplierLabel = settingsQuery.data?.vocabulary.supplier
  const materialLabel = settingsQuery.data?.vocabulary.material?.toLowerCase()

  const categoriesQuery = useCategories()
  const materialsQuery = useMaterials()
  const materialVariantsQuery = useMaterialVariants()
  const createMaterial = useCreateMaterial(tenantId)
  const createMaterialVariant = useCreateMaterialVariant(tenantId)
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
    <div className="min-h-screen bg-bg">
      <div className="bg-gradient-to-b from-primary-dark to-primary px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <Link to="/suprimentos" className="text-sm text-on-primary hover:underline">
            ← Suprimentos
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-on-primary">Agenda de Fornecedores</h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl pl-4 pr-6 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-4">
        <Button onClick={() => setShowNewMaterialForm(true)}>+ Novo</Button>
        <input
          type="search"
          placeholder={`Buscar ${materialLabel ?? 'material'}`}
          value={materialSearch}
          onChange={(e) => setMaterialSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded border border-line bg-bg px-3 py-2 text-sm text-ink"
        />
        <input
          type="search"
          placeholder="Buscar fornecedor"
          value={supplierSearch}
          onChange={(e) => {
            setSupplierSearch(e.target.value)
            setPage(0)
          }}
          className="min-w-[200px] flex-1 rounded border border-line bg-bg px-3 py-2 text-sm text-ink"
        />
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:h-[calc(100vh-14rem)] lg:grid-cols-[200px_320px_1fr]">
        <div className="lg:h-full lg:overflow-y-auto">
          <CategoryColumn
            categories={categoriesQuery.data ?? []}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />
          <CnpjLookupBlock />
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
            materialSearch={materialSearch}
            showNewForm={showNewMaterialForm}
            onCloseNewForm={() => setShowNewMaterialForm(false)}
            onOpenReport={() => setReportOpen(true)}
          />
        </div>

        <div className="lg:h-full lg:overflow-y-auto">
          <SupplierColumn
            materialName={selectedMaterial?.name ?? null}
            materialIcon={selectedMaterial?.icon ?? null}
            supplierLabel={supplierLabel}
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
            onAddSupplier={() => setFormState({ mode: 'create' })}
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
      </div>

      <SupplierPopups
        tenantId={tenantId}
        activePopup={activePopup}
        onClose={() => setActivePopup(null)}
        selectedMaterialId={selectedMaterialId}
        selectedMaterialName={selectedMaterial?.name ?? null}
        allMaterials={materialsQuery.data ?? []}
        allMaterialVariants={materialVariantsQuery.data ?? []}
        onCreateMaterialVariant={(materialId, code, description) =>
          createMaterialVariant.mutateAsync({ materialId, code, description })
        }
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
        allMaterialVariants={materialVariantsQuery.data ?? []}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        rows={reportQuery.data ?? []}
      />
    </div>
  )
}
