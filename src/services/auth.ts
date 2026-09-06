import { getDb, updateDb } from './store'
import * as audit from './audit'

export function currentUser() {
  const db = getDb()
  return db.users.find((u) => u.id === db.session?.userId) ?? null
}

export function isAuthenticated() {
  return !!getDb().session
}

export function login(email: string): { ok: true } | { ok: false; error: string } {
  const user = getDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user) return { ok: false, error: 'No encontramos una cuenta con ese correo. Prueba con benito@recivia.cl' }
  updateDb((db) => ({ ...db, session: { userId: user.id } }))
  audit.log('Inició sesión', user.name)
  return { ok: true }
}

export function logout() {
  const user = currentUser()
  updateDb((db) => ({ ...db, session: null }))
  if (user) audit.log('Cerró sesión', user.name)
}
