import type { AppUser, Role } from '../types'
import { stamp, uuid } from '../lib/utils'
import { getDb, updateDb } from './store'
import * as audit from './audit'

export function list() {
  return getDb().users
}

export function invite(data: { name: string; email: string; role: Role }) {
  const u: AppUser = { id: uuid(), status: 'Invitado', createdAt: stamp(), name: data.name || 'Nuevo usuario', email: data.email, role: data.role }
  updateDb((db) => ({ ...db, users: [...db.users, u] }))
  audit.log('Invitó usuario', u.name)
  return u
}

export function updateRole(id: string, role: Role) {
  updateDb((db) => ({ ...db, users: db.users.map((u) => (u.id === id ? { ...u, role } : u)) }))
  audit.log('Cambió rol de', getDb().users.find((u) => u.id === id)?.name ?? id)
}

export function remove(id: string) {
  const name = getDb().users.find((u) => u.id === id)?.name ?? id
  updateDb((db) => ({ ...db, users: db.users.filter((u) => u.id !== id) }))
  audit.log('Eliminó usuario', name)
}
