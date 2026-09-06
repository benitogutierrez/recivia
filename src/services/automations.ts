import type { AutomationConfig } from '../types'
import { stamp } from '../lib/utils'
import { getDb, updateDb } from './store'
import * as audit from './audit'

export function get(landingId: string) {
  return getDb().landings.find((l) => l.id === landingId)?.automation
}

export function update(landingId: string, patch: Partial<AutomationConfig['actions']>) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) =>
      l.id === landingId ? { ...l, automation: { ...l.automation, actions: { ...l.automation.actions, ...patch } }, updatedAt: stamp() } : l,
    ),
  }))
  audit.log('Actualizó automatización de', getDb().landings.find((l) => l.id === landingId)?.name ?? landingId, { landingId })
}
