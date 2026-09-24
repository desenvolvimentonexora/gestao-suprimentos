import { useState } from 'react'
import { SimilarSuppliersModal } from './SimilarSuppliersModal'
import type { SupplierFormValues } from './SupplierFormModal'
import {
  useDiscoverSimilarSuppliers,
  useLookupSupplierContact,
  useResolveSupplierCnae,
  useSupplierCnpjs,
} from './queries'
import type { CompanyCandidate } from './types'

export interface SimilarSuppliersContainerProps {
  supplierId: string | null
  onClose: () => void
  onRegisterCandidate: (values: SupplierFormValues) => void
}

export function SimilarSuppliersContainer({
  supplierId,
  onClose,
  onRegisterCandidate,
}: SimilarSuppliersContainerProps) {
  const isOpen = Boolean(supplierId)
  const cnpjsQuery = useSupplierCnpjs(supplierId)
  const resolveCnae = useResolveSupplierCnae()
  const discover = useDiscoverSimilarSuppliers()
  const lookupContact = useLookupSupplierContact()

  const [selectedCnpj, setSelectedCnpj] = useState<string | null>(null)
  const [registeringCnpj, setRegisteringCnpj] = useState<string | null>(null)

  const cnpjs = cnpjsQuery.data ?? []
  // Só existe um CNPJ pra escolher: usa ele direto, sem exigir seleção manual.
  // Este componente é remontado (key={supplierId} no container da página) a
  // cada abertura, então não há estado obsoleto de uma consulta anterior.
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

  async function handleRegister(candidate: CompanyCandidate) {
    setRegisteringCnpj(candidate.cnpj)
    let contact: { phone: string | null; email: string | null } | null = null
    try {
      contact = await lookupContact.mutateAsync(candidate.cnpj)
    } catch {
      contact = null // contato pontual indisponível não deve travar o cadastro
    }
    setRegisteringCnpj(null)

    onRegisterCandidate({
      name: candidate.razaoSocial,
      type: '',
      city: candidate.cidade ?? '',
      status: 'active',
      notes: '',
      cnpjs: [candidate.cnpj],
      contactName: '',
      contactPhone: contact?.phone ?? '',
      contactEmail: contact?.email ?? '',
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
      onRegister={handleRegister}
      registeringCnpj={registeringCnpj}
    />
  )
}
