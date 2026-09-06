import { uuid, stamp } from '../lib/utils'
import { getDb, updateDb } from './store'

export function log(action: string, entity: string, extra?: { companyId?: string; landingId?: string }) {
  const user = getDb().users.find((u) => u.id === getDb().session?.userId)
  updateDb((db) => ({
    ...db,
    audit: [
      { id: uuid(), at: stamp(), user: user?.name ?? 'Sistema', action, entity, ...extra },
      ...db.audit,
    ],
  }))
}

export function list() {
  return getDb().audit
}
