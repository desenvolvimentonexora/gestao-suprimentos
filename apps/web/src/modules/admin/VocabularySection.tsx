import { useState } from 'react'
import { Button, Card, Input } from '../../components'
import type { VocabularyValues } from './types'

export interface VocabularySectionProps {
  vocabulary: VocabularyValues
  onSave: (vocabulary: VocabularyValues) => void
  isSaving: boolean
}

const FIELDS: { key: string; label: string; fallback: string }[] = [
  { key: 'unit', label: 'Unidade', fallback: 'Unidade' },
  { key: 'request', label: 'Requisição / SOL', fallback: 'SOL' },
  { key: 'supplier', label: 'Fornecedor', fallback: 'Fornecedor' },
  { key: 'material', label: 'Material', fallback: 'Material' },
]

export function VocabularySection({ vocabulary, onSave, isSaving }: VocabularySectionProps) {
  const [values, setValues] = useState<VocabularyValues>(() =>
    Object.fromEntries(FIELDS.map((field) => [field.key, vocabulary[field.key] ?? field.fallback])),
  )

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSave(values)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">Vocabulário</h2>
        <p className="text-sm text-ink-muted">
          Como este cliente chama cada coisa — os rótulos abaixo aparecem no lugar de &ldquo;Unidade&rdquo;,
          &ldquo;SOL&rdquo;, &ldquo;Fornecedor&rdquo; e &ldquo;Material&rdquo; nas telas do sistema.
        </p>
        {FIELDS.map((field) => (
          <Input
            key={field.key}
            label={field.label}
            value={values[field.key] ?? ''}
            onChange={(e) => setValues((current) => ({ ...current, [field.key]: e.target.value }))}
          />
        ))}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            Salvar vocabulário
          </Button>
        </div>
      </form>
    </Card>
  )
}
