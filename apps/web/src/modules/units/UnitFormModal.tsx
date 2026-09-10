import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button, Input, Modal } from '../../components'
import type { UnitFormValues } from './types'

const emptyToUndefined = (value: string) => (value.trim() ? value : undefined)

const unitFormSchema = z.object({
  name: z.string().min(1, 'Informe o nome.'),
  cnpj: z.string(),
  zipCode: z.string(),
  street: z.string(),
  number: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z
    .string()
    .transform(emptyToUndefined)
    .refine((value) => !value || value.length === 2, 'UF deve ter 2 letras.')
    .transform((value) => value ?? ''),
  type: z.enum(['obra', 'escritorio', 'deposito']),
  status: z.enum(['active', 'completed', 'inactive']),
  startDate: z.string(),
  endDate: z.string(),
  engineerName: z.string(),
  engineerPhone: z.string(),
  engineerEmail: z
    .string()
    .transform(emptyToUndefined)
    .refine((value) => !value || z.string().email().safeParse(value).success, 'E-mail inválido.')
    .transform((value) => value ?? ''),
  adminName: z.string(),
  adminPhone: z.string(),
  adminEmail: z
    .string()
    .transform(emptyToUndefined)
    .refine((value) => !value || z.string().email().safeParse(value).success, 'E-mail inválido.')
    .transform((value) => value ?? ''),
})

type FormShape = z.infer<typeof unitFormSchema>

export interface UnitFormModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialValues?: UnitFormValues
  onSubmit: (values: UnitFormValues) => void
  isSubmitting: boolean
}

function toFormShape(values?: UnitFormValues): FormShape {
  return {
    name: values?.name ?? '',
    cnpj: values?.cnpj ?? '',
    zipCode: values?.zipCode ?? '',
    street: values?.street ?? '',
    number: values?.number ?? '',
    neighborhood: values?.neighborhood ?? '',
    city: values?.city ?? '',
    state: values?.state ?? '',
    type: values?.type ?? 'obra',
    status: values?.status ?? 'active',
    startDate: values?.startDate ?? '',
    endDate: values?.endDate ?? '',
    engineerName: values?.engineerName ?? '',
    engineerPhone: values?.engineerPhone ?? '',
    engineerEmail: values?.engineerEmail ?? '',
    adminName: values?.adminName ?? '',
    adminPhone: values?.adminPhone ?? '',
    adminEmail: values?.adminEmail ?? '',
  }
}

export function UnitFormModal({
  isOpen,
  onClose,
  mode,
  initialValues,
  onSubmit,
  isSubmitting,
}: UnitFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormShape>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: toFormShape(initialValues),
  })

  // eslint-disable-next-line react-hooks/incompatible-library -- watch() do react-hook-form não é memoizável; aqui só controla a exibição condicional de campos, sem risco de UI obsoleta.
  const type = watch('type')

  function submit(values: FormShape) {
    onSubmit(values)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'Nova unidade' : 'Editar unidade'}>
      <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nome" error={errors.name?.message} {...register('name')} />
          <div className="flex flex-col gap-1">
            <label htmlFor="unit-type" className="text-sm font-medium text-ink">
              Tipo
            </label>
            <select
              id="unit-type"
              {...register('type')}
              className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="obra">Obra</option>
              <option value="escritorio">Escritório</option>
              <option value="deposito">Depósito</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="unit-status" className="text-sm font-medium text-ink">
            Status
          </label>
          <select
            id="unit-status"
            {...register('status')}
            className="rounded border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="active">Ativa</option>
            <option value="completed">Concluída</option>
            <option value="inactive">Inativa</option>
          </select>
        </div>

        <Input label="CNPJ" {...register('cnpj')} />

        <div className="border-t border-line pt-3">
          <p className="text-sm font-medium text-ink">Endereço</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="CEP" {...register('zipCode')} />
            <Input label="UF" error={errors.state?.message} {...register('state')} />
            <Input label="Logradouro" {...register('street')} />
            <Input label="Número" {...register('number')} />
            <Input label="Bairro" {...register('neighborhood')} />
            <Input label="Cidade" {...register('city')} />
          </div>
        </div>

        {type === 'obra' && (
          <div className="border-t border-line pt-3">
            <p className="text-sm font-medium text-ink">Datas</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Início previsto" type="date" {...register('startDate')} />
              <Input label="Término previsto" type="date" {...register('endDate')} />
            </div>
          </div>
        )}

        <div className="border-t border-line pt-3">
          <p className="text-sm font-medium text-ink">Responsável técnico</p>
          <Input label="Nome do engenheiro" {...register('engineerName')} />
          <Input label="Telefone do engenheiro" {...register('engineerPhone')} />
          <Input
            label="E-mail do engenheiro"
            type="email"
            error={errors.engineerEmail?.message}
            {...register('engineerEmail')}
          />
        </div>

        <div className="border-t border-line pt-3">
          <p className="text-sm font-medium text-ink">Responsável administrativo</p>
          <Input label="Nome do administrativo" {...register('adminName')} />
          <Input label="Telefone do administrativo" {...register('adminPhone')} />
          <Input
            label="E-mail do administrativo"
            type="email"
            error={errors.adminEmail?.message}
            {...register('adminEmail')}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {mode === 'create' ? 'Cadastrar unidade' : 'Salvar alterações'}
        </Button>
      </form>
    </Modal>
  )
}
