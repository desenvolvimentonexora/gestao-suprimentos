import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Input } from '../../components'

export interface CnpjLookupBlockProps {
  onSearch: (cnpj: string) => void
}

// Ponto de entrada manual da busca de "fornecedores semelhantes": o comprador
// já sabe um CNPJ de cabeça (não precisa ser de um fornecedor cadastrado) e
// busca outras empresas do mesmo ramo (CNAE) a partir dele. Mesmo fluxo do
// botão "Buscar semelhantes" no card do fornecedor — só muda a origem do
// CNPJ de referência (digitado aqui, em vez de já cadastrado).
export function CnpjLookupBlock({ onSearch }: CnpjLookupBlockProps) {
  const [cnpj, setCnpj] = useState('')

  const digits = cnpj.replace(/\D/g, '')
  const isValid = digits.length === 14

  return (
    <Card className="mt-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Building2 size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Empresas do mesmo ramo</p>
          <p className="text-xs text-ink-muted">Sugestões a partir do CNAE de um CNPJ conhecido</p>
        </div>
      </div>

      <Input
        label="CNPJ conhecido"
        placeholder="00.000.000/0000-00"
        value={cnpj}
        onChange={(e) => setCnpj(e.target.value)}
      />

      <Button variant="primary" className="w-full" disabled={!isValid} onClick={() => onSearch(digits)}>
        Buscar
      </Button>
    </Card>
  )
}
