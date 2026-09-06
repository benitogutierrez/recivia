import type { Role } from '../types'

export type Permission = 'manage_companies' | 'manage_landings' | 'edit_landings' | 'manage_users' | 'view_records' | 'manage_automations'

const MATRIX: Record<Role, Permission[]> = {
  'Super Admin': ['manage_companies', 'manage_landings', 'edit_landings', 'manage_users', 'view_records', 'manage_automations'],
  Admin: ['manage_companies', 'manage_landings', 'edit_landings', 'view_records', 'manage_automations'],
  Editor: ['edit_landings', 'view_records'],
  Viewer: ['view_records'],
}

export function can(role: Role | undefined, permission: Permission) {
  if (!role) return false
  return MATRIX[role]?.includes(permission) ?? false
}

export const ROLE_LABELS: Record<Role, string> = {
  'Super Admin': 'Acceso completo a todos los módulos.',
  Admin: 'Gestiona empresas, landings y registros.',
  Editor: 'Edita landings y formularios.',
  Viewer: 'Solo puede consultar registros y estadísticas.',
}
