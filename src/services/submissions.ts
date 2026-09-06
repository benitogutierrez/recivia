import type { Submission } from '../types'
import { downloadBlob, stamp, toCSV, toExcelXml, uuid } from '../lib/utils'
import { getDb, updateDb } from './store'
import * as landingsService from './landings'
import * as notificationsService from './notifications'
import * as audit from './audit'

export function list() {
  return getDb().submissions
}

export function of(landingId: string) {
  return getDb().submissions.filter((s) => s.landingId === landingId)
}

export function get(id: string) {
  return getDb().submissions.find((s) => s.id === id)
}

export function setStatus(id: string, status: Submission['status']) {
  updateDb((db) => ({ ...db, submissions: db.submissions.map((s) => (s.id === id ? { ...s, status } : s)) }))
}

export function todayCount() {
  const today = new Date().toDateString()
  return getDb().submissions.filter((s) => new Date(s.at).toDateString() === today).length
}

export function last7DaysCount() {
  const cutoff = Date.now() - 7 * 86400000
  return getDb().submissions.filter((s) => new Date(s.at).getTime() >= cutoff).length
}

export function submitPublic(landingId: string, values: Record<string, string>) {
  const landing = landingsService.get(landingId)
  if (!landing) return
  const sub: Submission = { id: uuid(), landingId, companyId: landing.companyId, at: stamp(), status: 'Nuevo', values }
  updateDb((db) => ({ ...db, submissions: [sub, ...db.submissions] }))
  landingsService.registerStart(landingId)
  notificationsService.dispatch(landingId, sub.id, values)
  audit.log('Recibió registro en', landing.name, { landingId, companyId: landing.companyId })
  return sub
}

export function exportCSV(rows: Submission[]) {
  const flat = rows.map((s) => ({ ...s.values, __fecha: s.at, __estado: s.status }))
  downloadBlob('registros-recivia.csv', toCSV(flat), 'text/csv')
}

export function exportExcel(rows: Submission[]) {
  const flat = rows.map((s) => ({ ...s.values, __fecha: s.at, __estado: s.status }))
  downloadBlob('registros-recivia.xls', toExcelXml(flat), 'application/vnd.ms-excel')
}
