import type { Company } from '../types'
import { stamp, uuid } from '../lib/utils'
import { getDb, updateDb } from './store'
import * as audit from './audit'

export function list() {
  return getDb().companies
}

export function get(id: string) {
  return getDb().companies.find((c) => c.id === id)
}

export function create(data: Omit<Company, 'id' | 'status' | 'createdAt'>) {
  const c: Company = { id: uuid(), status: 'Activo', createdAt: stamp(), ...data }
  updateDb((db) => ({ ...db, companies: [...db.companies, c] }))
  audit.log('Creó', c.name)
  return c
}

export function update(id: string, data: Partial<Company>) {
  updateDb((db) => ({ ...db, companies: db.companies.map((c) => (c.id === id ? { ...c, ...data } : c)) }))
  audit.log('Actualizó', get(id)?.name ?? id)
}

export function setStatus(id: string, status: Company['status']) {
  updateDb((db) => ({ ...db, companies: db.companies.map((c) => (c.id === id ? { ...c, status } : c)) }))
  audit.log(status === 'Activo' ? 'Activó' : 'Desactivó', get(id)?.name ?? id)
}

export function remove(id: string) {
  const name = get(id)?.name ?? id
  updateDb((db) => ({
    ...db,
    companies: db.companies.filter((c) => c.id !== id),
    landings: db.landings.filter((l) => l.companyId !== id),
  }))
  audit.log('Eliminó', name)
}

export function landingsOf(companyId: string) {
  return getDb().landings.filter((l) => l.companyId === companyId)
}

export function submissionsOf(companyId: string) {
  return getDb().submissions.filter((s) => s.companyId === companyId)
}
