import type { FieldDef, FieldType } from '../types'
import { makeField, stamp } from '../lib/utils'
import { getDb, updateDb } from './store'

export function fieldsOf(landingId: string) {
  return getDb().landings.find((l) => l.id === landingId)?.fields ?? []
}

export function addField(landingId: string, type: FieldType, label: string) {
  const f = makeField(label, 99)
  f.type = type
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => (l.id === landingId ? { ...l, fields: [...l.fields, f], updatedAt: stamp() } : l)),
  }))
  return f
}

export function updateField(landingId: string, fieldId: string, patch: Partial<FieldDef>) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) =>
      l.id !== landingId ? l : { ...l, updatedAt: stamp(), fields: l.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) },
    ),
  }))
}

export function removeField(landingId: string, fieldId: string) {
  const l = getDb().landings.find((x) => x.id === landingId)
  if (!l || l.fields.length < 2) return false
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((x) => (x.id === landingId ? { ...x, fields: x.fields.filter((f) => f.id !== fieldId), updatedAt: stamp() } : x)),
  }))
  return true
}

export function reorderFields(landingId: string, orderedIds: string[]) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => {
      if (l.id !== landingId) return l
      const byId = Object.fromEntries(l.fields.map((f) => [f.id, f]))
      const fields = orderedIds.map((id, i) => ({ ...byId[id], order: i }))
      return { ...l, fields, updatedAt: stamp() }
    }),
  }))
}
