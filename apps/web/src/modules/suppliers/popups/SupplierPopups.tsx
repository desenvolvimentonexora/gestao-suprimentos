import type { SupplierPopupKind } from '../SupplierCard'
import type { MaterialRow, MaterialVariantRow } from '../types'
import { CertificatesPopup } from './CertificatesPopup'
import { LeadTimePopup } from './LeadTimePopup'
import { MaterialsPopup } from './MaterialsPopup'
import { ReviewsPopup } from './ReviewsPopup'
import {
  useAddSupplierMaterialLink,
  useCertificates,
  useCreateReview,
  useDeleteCertificate,
  useLeadTimeDays,
  useRemoveSupplierMaterialLink,
  useReviews,
  useSupplierMaterialLinks,
  useUpdateLeadTimeDays,
  useUploadCertificate,
} from './queries'

export interface ActivePopup {
  kind: SupplierPopupKind
  supplierId: string
}

export interface SupplierPopupsProps {
  tenantId: string
  activePopup: ActivePopup | null
  onClose: () => void
  selectedMaterialId: string | null
  selectedMaterialName: string | null
  allMaterials: MaterialRow[]
  allMaterialVariants: MaterialVariantRow[]
  onCreateMaterialVariant: (
    materialId: string,
    code: string,
    description: string,
  ) => Promise<MaterialVariantRow>
}

export function SupplierPopups({
  tenantId,
  activePopup,
  onClose,
  selectedMaterialId,
  selectedMaterialName,
  allMaterials,
  allMaterialVariants,
  onCreateMaterialVariant,
}: SupplierPopupsProps) {
  const supplierId = activePopup?.supplierId ?? ''

  // Prazo de entrega é por variante (código específico); quando a tela tem
  // um material genérico selecionado, usamos a primeira variante dele —
  // suficiente enquanto a maioria dos materiais tem uma única variante.
  const leadTimeVariantId =
    allMaterialVariants.find((variant) => variant.materialId === selectedMaterialId)?.id ?? ''

  const leadTimeQuery = useLeadTimeDays(
    supplierId,
    leadTimeVariantId,
    activePopup?.kind === 'prazo' && Boolean(leadTimeVariantId),
  )
  const updateLeadTime = useUpdateLeadTimeDays()

  const reviewsQuery = useReviews(supplierId, activePopup?.kind === 'avaliacoes')
  const createReview = useCreateReview(tenantId)

  const linksQuery = useSupplierMaterialLinks(supplierId, activePopup?.kind === 'materiais')
  const addLink = useAddSupplierMaterialLink(tenantId)
  const removeLink = useRemoveSupplierMaterialLink()

  const certificatesQuery = useCertificates(supplierId, activePopup?.kind === 'certificados')
  const uploadCertificate = useUploadCertificate(tenantId)
  const deleteCertificate = useDeleteCertificate(supplierId)

  return (
    <>
      <LeadTimePopup
        key={`${supplierId}:${leadTimeVariantId}`}
        isOpen={activePopup?.kind === 'prazo'}
        onClose={onClose}
        materialName={selectedMaterialName ?? ''}
        initialDays={leadTimeQuery.data ?? null}
        onSave={(days) => {
          if (!leadTimeVariantId) return
          updateLeadTime.mutate(
            { supplierId, materialVariantId: leadTimeVariantId, days },
            { onSuccess: onClose },
          )
        }}
        isSaving={updateLeadTime.isPending}
      />

      <ReviewsPopup
        isOpen={activePopup?.kind === 'avaliacoes'}
        onClose={onClose}
        reviews={reviewsQuery.data ?? []}
        onSubmitReview={(rating, comment) => createReview.mutate({ supplierId, rating, comment })}
        isSubmitting={createReview.isPending}
      />

      <MaterialsPopup
        isOpen={activePopup?.kind === 'materiais'}
        onClose={onClose}
        links={linksQuery.data ?? []}
        allMaterials={allMaterials}
        allMaterialVariants={allMaterialVariants}
        onAddLink={(materialVariantId) => addLink.mutate({ supplierId, materialVariantId })}
        onRemoveLink={(materialVariantId) => removeLink.mutate({ supplierId, materialVariantId })}
        onCreateVariant={onCreateMaterialVariant}
      />

      <CertificatesPopup
        isOpen={activePopup?.kind === 'certificados'}
        onClose={onClose}
        certificates={certificatesQuery.data ?? []}
        onUpload={(file) => uploadCertificate.mutate({ supplierId, file })}
        onDelete={(certificateId) => {
          const certificate = certificatesQuery.data?.find((row) => row.id === certificateId)
          if (certificate) {
            deleteCertificate.mutate({ certificateId, filePath: certificate.filePath })
          }
        }}
        isUploading={uploadCertificate.isPending}
      />
    </>
  )
}
