import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { applyTheme } from '../../core/theme'
import { Button, Card, Input } from '../../components'
import type { BrandValues, ThemeValues } from './types'

export interface IdentitySectionProps {
  brand: BrandValues
  theme: ThemeValues
  onSave: (values: { brand: BrandValues; theme: ThemeValues }) => void
  onUploadLogo: (file: File) => Promise<string>
  isSaving: boolean
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-ink">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded border border-line bg-surface"
        />
        <input
          type="text"
          aria-label={`${label} (hex)`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
        />
      </div>
    </div>
  )
}

export function IdentitySection({ brand, theme, onSave, onUploadLogo, isSaving }: IdentitySectionProps) {
  const [brandValues, setBrandValues] = useState<BrandValues>(brand)
  const [themeValues, setThemeValues] = useState<ThemeValues>(theme)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  useEffect(() => {
    applyTheme({
      primary: themeValues.primary,
      primaryDark: themeValues.primaryDark,
      accent: themeValues.accent,
    })
  }, [themeValues])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSave({ brand: brandValues, theme: themeValues })
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploadingLogo(true)
    try {
      const logoUrl = await onUploadLogo(file)
      setBrandValues((current) => ({ ...current, logoUrl }))
    } finally {
      setIsUploadingLogo(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">Identidade e tema</h2>

        <Input
          label="Nome da marca"
          value={brandValues.name}
          onChange={(e) => setBrandValues((current) => ({ ...current, name: e.target.value }))}
        />
        <Input
          label="Tagline"
          value={brandValues.tagline}
          onChange={(e) => setBrandValues((current) => ({ ...current, tagline: e.target.value }))}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="admin-logo-upload" className="text-sm font-medium text-ink">
            Logo
          </label>
          <div className="flex items-center gap-3">
            {brandValues.logoUrl && (
              <img src={brandValues.logoUrl} alt="Logo atual" className="h-10 rounded border border-line" />
            )}
            <input id="admin-logo-upload" type="file" accept="image/*" onChange={handleLogoChange} />
          </div>
          {isUploadingLogo && <p className="text-xs text-ink-muted">Enviando…</p>}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ColorField
            label="Cor primária"
            value={themeValues.primary}
            onChange={(value) => setThemeValues((current) => ({ ...current, primary: value }))}
          />
          <ColorField
            label="Cor primária escura"
            value={themeValues.primaryDark}
            onChange={(value) => setThemeValues((current) => ({ ...current, primaryDark: value }))}
          />
          <ColorField
            label="Destaque/acento"
            value={themeValues.accent}
            onChange={(value) => setThemeValues((current) => ({ ...current, accent: value }))}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            Salvar identidade
          </Button>
        </div>
      </form>
    </Card>
  )
}
