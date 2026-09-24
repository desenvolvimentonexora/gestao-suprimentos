import { Building2 } from 'lucide-react'
import { Button, Modal, Spinner } from '../../components'
import type { CompanyCandidate, ContactInfo } from './types'

export interface SimilarSuppliersModalProps {
  isOpen: boolean
  onClose: () => void
  cnpjs: string[]
  isLoadingCnpjs: boolean
  selectedCnpj: string | null
  onSelectCnpj: (cnpj: string) => void
  onSearch: () => void
  isSearching: boolean
  searchError: string | null
  results: CompanyCandidate[] | null
  /** Resultado da busca pontual de telefone, por CNPJ — ausente = ainda não buscado. */
  contactByCnpj: Record<string, ContactInfo | null>
  checkingCnpj: string | null
  onLookupContact: (candidate: CompanyCandidate) => void
  onConfirmRegister: (candidate: CompanyCandidate) => void
}

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function SimilarSuppliersModal({
  isOpen,
  onClose,
  cnpjs,
  isLoadingCnpjs,
  selectedCnpj,
  onSelectCnpj,
  onSearch,
  isSearching,
  searchError,
  results,
  contactByCnpj,
  checkingCnpj,
  onLookupContact,
  onConfirmRegister,
}: SimilarSuppliersModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fornecedores semelhantes" icon={Building2}>
      <div className="flex flex-col gap-4">
        {isLoadingCnpjs && (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Spinner /> Carregando CNPJs do fornecedor...
          </p>
        )}

        {!isLoadingCnpjs && cnpjs.length === 0 && (
          <p className="text-sm text-ink-muted">
            Este fornecedor não tem CNPJ cadastrado. Edite o cadastro e adicione um CNPJ pra usar a busca por
            semelhantes.
          </p>
        )}

        {!isLoadingCnpjs && cnpjs.length > 1 && !results && (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm text-ink-muted">
              Este fornecedor tem mais de um CNPJ. Qual usar como referência?
            </legend>
            {cnpjs.map((cnpj) => (
              <label key={cnpj} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="reference-cnpj"
                  checked={selectedCnpj === cnpj}
                  onChange={() => onSelectCnpj(cnpj)}
                />
                {formatCnpj(cnpj)}
              </label>
            ))}
          </fieldset>
        )}

        {!results && cnpjs.length > 0 && (
          <Button disabled={!selectedCnpj || isSearching} onClick={onSearch}>
            {isSearching ? (
              <span className="flex items-center gap-2">
                <Spinner /> Buscando...
              </span>
            ) : (
              'Buscar fornecedores semelhantes'
            )}
          </Button>
        )}

        {searchError && <p className="text-sm text-accent">{searchError}</p>}

        {results && results.length === 0 && (
          <p className="text-sm text-ink-muted">Nenhuma empresa ativa encontrada para este ramo de atividade.</p>
        )}

        {results && results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((candidate) => {
              const contact = contactByCnpj[candidate.cnpj]
              const isChecking = checkingCnpj === candidate.cnpj
              return (
                <div
                  key={candidate.cnpj}
                  className="flex flex-col gap-1 rounded-md border border-line bg-surface p-3 text-sm"
                >
                  <p className="font-semibold text-ink">{candidate.razaoSocial}</p>
                  {candidate.nomeFantasia && <p className="text-ink-muted">{candidate.nomeFantasia}</p>}
                  <p className="text-ink-muted">{formatCnpj(candidate.cnpj)}</p>
                  <p className="text-ink-muted">
                    {[candidate.cidade, candidate.uf].filter(Boolean).join('/') || '—'}
                    {candidate.cnaeDescricao ? ` · ${candidate.cnaeDescricao}` : ''}
                    {candidate.porte ? ` · ${candidate.porte}` : ''}
                  </p>

                  {contact !== undefined ? (
                    <>
                      <p className="text-xs text-ink-muted">
                        {contact?.phone
                          ? `Telefone encontrado: ${contact.phone}`
                          : 'Sem telefone público encontrado — pode preencher manualmente no cadastro.'}
                      </p>
                      <Button className="mt-2 w-fit" onClick={() => onConfirmRegister(candidate)}>
                        Continuar cadastro
                      </Button>
                    </>
                  ) : (
                    <Button className="mt-2 w-fit" disabled={isChecking} onClick={() => onLookupContact(candidate)}>
                      {isChecking ? (
                        <span className="flex items-center gap-2">
                          <Spinner /> Cadastrar
                        </span>
                      ) : (
                        'Cadastrar'
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
