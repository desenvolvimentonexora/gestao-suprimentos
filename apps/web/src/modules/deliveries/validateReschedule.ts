export interface RescheduleFormValues {
  newDate: string
  reason: string
}

export function validateReschedule(values: RescheduleFormValues, currentDate: string): string | null {
  if (!values.newDate) return 'Informe a nova data de entrega.'
  if (values.newDate === currentDate) return 'A nova data precisa ser diferente da atual.'
  return null
}
