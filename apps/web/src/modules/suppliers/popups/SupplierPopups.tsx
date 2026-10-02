import type { SupplierPopupKind } from '../SupplierCard'
import type { MaterialRow, MaterialVariantRow } from '../types'
import { CertificatesPopup } from './CertificatesPopup'
import { MaterialsPopup } from './MaterialsPopup'
import { ReviewsPopup } from './ReviewsPopup'
import {
  useAddSupplierMaterialLink,
  useCertificates,
  useCreateReview,
  useDeleteCertificate,
  useRemoveSupplierMaterialLink,
  useReviews,
  useSupplierMaterialLinks,
  useUpdateSupplierMaterialLeadTimes,
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
  allMaterials: MaterialRow[]
  allMaterialVariants: MaterialVariantRow[]
  onCreateMaterialVariant: (
    materialId: string,
    code: string,
    description: string,
    unitOfMeasure: string,
  ) => Promise<MaterialVariantRow>
}

export function SupplierPopups({
  tenantId,
  activePopup,
  onClose,
  allMaterials,
  allMaterialVariants,
  onCreateMaterialVariant,
}: SupplierPopupsProps) {
  const supplierId = activePopup?.supplierId ?? ''

  const reviewsQuery = useReviews(supplierId, activePopup?.kind === 'avaliacoes')
  const createReview = useCreateReview(tenantId)

  const linksQuery = useSupplierMaterialLinks(supplierId, activePopup?.kind === 'materiais')
  const addLink = useAddSupplierMaterialLink(tenantId)
  const removeLink = useRemoveSupplierMaterialLink()
  const updateLeadTimes = useUpdateSupplierMaterialLeadTimes()

  const certificatesQuery = useCertificates(supplierId, activePopup?.kind === 'certificados')
  const uploadCertificate = useUploadCertificate(tenantId)
  const deleteCertificate = useDeleteCertificate(supplierId)

  return (
    <>
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
        onUpdateLeadTimes={(materialVariantId, leadTimes) =>
          updateLeadTimes.mutate({ supplierId, materialVariantId, leadTimes })
        }
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
