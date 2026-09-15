export interface RoleOption {
  id: string
  name: string
}

export interface AdminUserRow {
  id: string
  fullName: string
  email: string
  roleNames: string[]
  roleIds: string[]
  isActive: boolean
}

export interface ThemeValues {
  primary: string
  primaryDark: string
  accent: string
}

export interface BrandValues {
  name: string
  tagline: string
  logoUrl: string
}

export type VocabularyValues = Record<string, string>

export interface ModuleToggleRow {
  id: string
  label: string
  active: boolean
  implemented: boolean
}

export interface InviteUserValues {
  fullName: string
  email: string
  roleId: string
}
