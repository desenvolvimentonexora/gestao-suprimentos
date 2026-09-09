export interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  authorName: string | null
  createdAt: string
}

export interface CertificateRow {
  id: string
  fileName: string
  filePath: string
  url: string
}

export interface SupplierMaterialLinkRow {
  materialId: string
  materialName: string
}
