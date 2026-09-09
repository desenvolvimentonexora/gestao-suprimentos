export function hasPermission(granted: string[], required: string): boolean {
  return granted.includes(required)
}

export function hasAnyPermission(granted: string[], required: string[]): boolean {
  return required.some((permission) => granted.includes(permission))
}

export function hasAllPermissions(granted: string[], required: string[]): boolean {
  return required.every((permission) => granted.includes(permission))
}
