import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { Card, ComingSoonButton, Input } from '../../components'

// Placeholder visual da automação futura: buscar, a partir de um CNPJ já
// conhecido, outras empresas do mesmo ramo (CNAE) pra sugerir como
// fornecedor. Por enquanto só a interface — a busca em si (API externa +
// popup de resultados) ainda não está implementada.
export function CnpjLookupBlock() {
  const [cnpj, setCnpj] = useState('')

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

      <ComingSoonButton label="Buscar" variant="primary" className="w-full" />
    </Card>
  )
}
