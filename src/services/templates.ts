import type { Template } from '../types'
import { uuid } from '../lib/utils'
import { getDb, updateDb } from './store'
import * as audit from './audit'

export function list() {
  return getDb().templates
}

export function get(id: string) {
  return getDb().templates.find((t) => t.id === id)
}

export function saveFromLanding(landingId: string, name: string) {
  const l = getDb().landings.find((x) => x.id === landingId)
  if (!l) return
  const t: Template = {
    id: uuid(),
    name,
    cat: 'Personalizado',
    color: l.theme.primary,
    desc: `Basado en ${l.name}.`,
    fields: l.fields.map((f) => f.label),
    builtin: false,
  }
  updateDb((db) => ({ ...db, templates: [...db.templates, t] }))
  audit.log('Guardó template', t.name)
  return t
}

export function remove(id: string) {
  const t = get(id)
  if (t?.builtin) return
  updateDb((db) => ({ ...db, templates: db.templates.filter((x) => x.id !== id) }))
  audit.log('Eliminó template', t?.name ?? id)
}
