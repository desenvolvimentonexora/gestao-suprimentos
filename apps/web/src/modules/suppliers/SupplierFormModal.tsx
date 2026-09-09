import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Trash2 } from 'lucide-react'
import { z } from 'zod'
import { Button, Input, Modal } from '../../components'
import type { MaterialRow } from './types'

const supplierFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome.'),
  type: z.string(),
  city: z.string(),
  status: z.enum(['active', 'inactive']),
  notes: z.string(),
  cnpjs: z.array(z.object({ value: z.string() })),
  contactName: z.string(),
  contactPhone: z.string(),
  contactEmail: z.string(),
  materialIds: z.array(z.string()),
})

export interface SupplierFormValues {
  name: string
  type: string
  city: string
  status: 'active' | 'inactive'
  notes: string
  cnpjs: string[]
  contactName: string
  contactPhone: string
  contactEmail: string
  materialIds: string[]
}

type FormShape = z.infer<typeof supplierFormSchema>

export interface SupplierFormModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialValues?: SupplierFormValues
  allMaterials: MaterialRow[]
  onSubmit: (values: SupplierFormValues) => void
  isSubmitting: boolean
}

function toFormShape(values?: SupplierFormValues): FormShape {
  return {
    name: values?.name ?? '',
    type: values?.type ?? '',
    city: values?.city ?? '',
    status: values?.status ?? 'active',
    notes: values?.notes ?? '',
    cnpjs: (values?.cnpjs.length ? values.cnpjs : ['']).map((value) => ({ value })),
    contactName: values?.contactName ?? '',
    contactPhone: values?.contactPhone ?? '',
    contactEmail: values?.contactEmail ?? '',
    materialIds: values?.materialIds ?? [],
  }
}

export function SupplierFormModal({
  isOpen,
  onClose,
  mode,
  initialValues,
  allMaterials,
  onSubmit,
  isSubmitting,
}: SupplierFormModalProps) {
  const [materialSearch, setMaterialSearch] = useState('')

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormShape>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: toFormShape(initialValues),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'cnpjs' })

  function submit(values: FormShape) {
    onSubmit({
      ...values,
      cnpjs: values.cnpjs.map((cnpj) => cnpj.value).filter(Boolean),
    })
  }

  const visibleMaterials = allMaterials.filter((material) =>
    material.name.toLowerCase().includes(materialSearch.trim().toLowerCase()),
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Novo fornecedor' : 'Editar fornecedor'}
    >
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
        <Input label="Nome" error={errors.name?.message} {...register('name')} />
        <Input label="Tipo" {...register('type')} />
        <Input label="Cidade" {...register('city')} />

        <div className="flex flex-col gap-1">
          <label htmlFor="supplier-status" className="text-sm font-medium text-ink">
            Status
          </label>
          <select
            id="supplier-status"
            {...register('status')}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">CNPJ</span>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                aria-label={`CNPJ ${index + 1}`}
                {...register(`cnpjs.${index}.value` as const)}
                className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  aria-label={`Remover CNPJ ${index + 1}`}
                  onClick={() => remove(index)}
                  className="text-ink-muted hover:text-accent"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => append({ value: '' })}>
            + Adicionar CNPJ
          </Button>
        </div>

        <label htmlFor="supplier-notes" className="text-sm font-medium text-ink">
          Observações internas
        </label>
        <textarea
          id="supplier-notes"
          {...register('notes')}
          className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
        />

        <div className="border-t border-line pt-3">
          <p className="text-sm font-medium text-ink">Contato principal</p>
          <Input label="Nome do contato" {...register('contactName')} />
          <Input label="Telefone" {...register('contactPhone')} />
          <Input label="E-mail" type="email" {...register('contactEmail')} />
        </div>

        <div className="border-t border-line pt-3">
          <p className="text-sm font-medium text-ink">Materiais fornecidos</p>
          <input
            type="search"
            placeholder="Buscar material"
            value={materialSearch}
            onChange={(e) => setMaterialSearch(e.target.value)}
            className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
          <Controller
            control={control}
            name="materialIds"
            render={({ field }) => (
              <div className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto">
                {visibleMaterials.map((material) => (
                  <label key={material.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={field.value.includes(material.id)}
                      onChange={(e) => {
                        field.onChange(
                          e.target.checked
                            ? [...field.value, material.id]
                            : field.value.filter((id) => id !== material.id),
                        )
                      }}
                    />
                    {material.name}
                  </label>
                ))}
              </div>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {mode === 'create' ? 'Cadastrar fornecedor' : 'Salvar alterações'}
        </Button>
      </form>
    </Modal>
  )
}
