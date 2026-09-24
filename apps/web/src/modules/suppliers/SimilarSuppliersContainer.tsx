import { useState } from 'react'
import { SimilarSuppliersModal } from './SimilarSuppliersModal'
import type { SupplierFormValues } from './SupplierFormModal'
import {
  useDiscoverSimilarSuppliers,
  useLookupSupplierContact,
  useResolveSupplierCnae,
  useSupplierCnpjs,
} from './queries'
import type { CompanyCandidate, ContactInfo } from './types'

export interface SimilarSuppliersContainerProps {
  /** Origem "a partir de um fornecedor já cadastrado" — busca os CNPJs dele. */
  supplierId: string | null
  /** Origem "CNPJ digitado à mão" (bloco solto da Agenda) — um único CNPJ já pronto, sem precisar buscar. */
  manualCnpj: string | null
  onClose: () => void
  onRegisterCandidate: (values: SupplierFormValues) => void
}

export function SimilarSuppliersContainer({
  supplierId,
  manualCnpj,
  onClose,
  onRegisterCandidate,
}: SimilarSuppliersContainerProps) {
  const isOpen = Boolean(supplierId) || Boolean(manualCnpj)
  const cnpjsQuery = useSupplierCnpjs(supplierId)
  const resolveCnae = useResolveSupplierCnae()
  const discover = useDiscoverSimilarSuppliers()
  const lookupContact = useLookupSupplierContact()

  const [selectedCnpj, setSelectedCnpj] = useState<string | null>(null)
  const [checkingCnpj, setCheckingCnpj] = useState<string | null>(null)
  const [contactByCnpj, setContactByCnpj] = useState<Record<string, ContactInfo | null>>({})

  const cnpjs = manualCnpj ? [manualCnpj] : (cnpjsQuery.data ?? [])
  // Só existe um CNPJ pra escolher (ou porque foi digitado à mão, ou porque o
  // fornecedor só tem um cadastrado): usa ele direto, sem exigir seleção
  // manual. Este componente é remontado (key={supplierId ?? manualCnpj} no
  // container da página) a cada abertura, então não há estado obsoleto de
  // uma consulta anterior.
  const effectiveSelectedCnpj = selectedCnpj ?? (cnpjs.length === 1 ? cnpjs[0]! : null)

  async function handleSearch() {
    if (!effectiveSelectedCnpj) return
    try {
      const resolved = await resolveCnae.mutateAsync(effectiveSelectedCnpj)
      await discover.mutateAsync({ cnae: resolved.cnae, uf: resolved.uf })
    } catch {
      // erro já fica disponível via resolveCnae.error / discover.error
    }
  }

  async function handleLookupContact(candidate: CompanyCandidate) {
    setCheckingCnpj(candidate.cnpj)
    let contact: ContactInfo | null = null
    try {
      contact = await lookupContact.mutateAsync(candidate.cnpj)
    } catch {
      contact = null // busca pontual indisponível — trata como "sem telefone", não bloqueia o cadastro
    }
    setContactByCnpj((current) => ({ ...current, [candidate.cnpj]: contact }))
    setCheckingCnpj(null)
  }

  function handleConfirmRegister(candidate: CompanyCandidate) {
    const contact = contactByCnpj[candidate.cnpj]
    onRegisterCandidate({
      name: candidate.razaoSocial,
      type: '',
      city: candidate.cidade ?? '',
      status: 'active',
      notes: '',
      cnpjs: [candidate.cnpj],
      contactName: '',
      contactPhone: contact?.phone ?? '',
      contactEmail: '',
      materialVariantIds: [],
    })
  }

  const searchErrorSource = resolveCnae.error ?? discover.error
  const searchError = searchErrorSource
    ? searchErrorSource instanceof Error
      ? searchErrorSource.message
      : 'Não foi possível concluir a busca.'
    : null

  return (
    <SimilarSuppliersModal
      isOpen={isOpen}
      onClose={onClose}
      cnpjs={cnpjs}
      isLoadingCnpjs={cnpjsQuery.isLoading}
      selectedCnpj={effectiveSelectedCnpj}
      onSelectCnpj={setSelectedCnpj}
      onSearch={handleSearch}
      isSearching={resolveCnae.isPending || discover.isPending}
      searchError={searchError}
      results={discover.data ?? null}
      contactByCnpj={contactByCnpj}
      checkingCnpj={checkingCnpj}
      onLookupContact={handleLookupContact}
      onConfirmRegister={handleConfirmRegister}
    />
  )
}
