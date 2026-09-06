import type { Landing, LandingStatus } from '../types'
import { makeField, slugify, stamp, uuid } from '../lib/utils'
import { getDb, updateDb, makeLanding, THEMES } from './store'
import * as templatesService from './templates'
import * as audit from './audit'

export function list() {
  return getDb().landings
}

export function get(id?: string | null) {
  const db = getDb()
  return db.landings.find((l) => l.id === id) ?? db.landings[0]
}

export function byCompany(companyId: string) {
  return getDb().landings.filter((l) => l.companyId === companyId)
}

export function isSlugTaken(slug: string, excludeId?: string) {
  return getDb().landings.some((l) => l.slug === slug && l.id !== excludeId)
}

export function suggestSlug(base: string, excludeId?: string) {
  let slug = slugify(base)
  let i = 2
  while (isSlugTaken(slug, excludeId)) {
    slug = `${slugify(base)}-${i++}`
  }
  return slug
}

export function create(opts: { companyId: string; name: string; slug: string; templateId: string }) {
  const t = templatesService.get(opts.templateId)
  const l = makeLanding({
    companyId: opts.companyId,
    name: opts.name,
    slug: opts.slug,
    templateId: opts.templateId,
  })
  if (t) {
    l.hero.eyebrow = t.cat
    l.hero.text = t.desc
    l.theme.primary = t.color
    l.fields = t.fields.map((label, i) => makeField(label, i))
  }
  l.automation.landingId = l.id
  updateDb((db) => ({ ...db, landings: [l, ...db.landings] }))
  audit.log('Creó', l.name, { companyId: l.companyId, landingId: l.id })
  return l
}

export function duplicate(id: string) {
  const src = get(id)
  if (!src) return
  const copy: Landing = {
    ...src,
    id: uuid(),
    name: `${src.name} (copia)`,
    slug: suggestSlug(`${src.slug}-copia`),
    status: 'Borrador',
    createdAt: stamp(),
    updatedAt: stamp(),
    publishedAt: undefined,
    metrics: { views: 0, starts: 0 },
    versions: [],
    currentVersion: 0,
  }
  copy.automation = { ...src.automation, landingId: copy.id }
  updateDb((db) => ({ ...db, landings: [copy, ...db.landings] }))
  audit.log('Duplicó', src.name, { companyId: copy.companyId, landingId: copy.id })
  return copy
}

export function remove(id: string) {
  const l = get(id)
  updateDb((db) => ({ ...db, landings: db.landings.filter((x) => x.id !== id) }))
  audit.log('Eliminó', l?.name ?? id)
}

export function rename(id: string, name: string) {
  updateDb((db) => ({ ...db, landings: db.landings.map((l) => (l.id === id ? { ...l, name, updatedAt: stamp() } : l)) }))
}

export function updateSlug(id: string, slug: string) {
  updateDb((db) => ({ ...db, landings: db.landings.map((l) => (l.id === id ? { ...l, slug, updatedAt: stamp() } : l)) }))
}

export function setStatus(id: string, status: LandingStatus) {
  const l = get(id)
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((x) =>
      x.id === id ? { ...x, status, updatedAt: stamp(), publishedAt: status === 'Publicada' ? stamp() : x.publishedAt } : x,
    ),
  }))
  audit.log(status === 'Publicada' ? 'Publicó' : status === 'Despublicada' ? 'Despublicó' : 'Guardó borrador', l?.name ?? id, {
    landingId: id,
    companyId: l?.companyId,
  })
}

export function publish(id: string) {
  const l = get(id)
  if (!l) return
  const version = l.currentVersion + 1
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((x) =>
      x.id === id
        ? {
            ...x,
            status: 'Publicada',
            updatedAt: stamp(),
            publishedAt: stamp(),
            currentVersion: version,
            versions: [
              ...x.versions,
              { version, at: stamp(), status: 'Publicada', snapshot: { hero: x.hero, theme: x.theme, blocks: x.blocks, fields: x.fields } },
            ],
          }
        : x,
    ),
  }))
  audit.log('Publicó', l.name, { landingId: id, companyId: l.companyId })
}

export function restoreVersion(id: string, version: number) {
  const l = get(id)
  const v = l?.versions.find((x) => x.version === version)
  if (!l || !v) return
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((x) =>
      x.id === id ? { ...x, hero: v.snapshot.hero, theme: v.snapshot.theme, blocks: v.snapshot.blocks, fields: v.snapshot.fields, updatedAt: stamp() } : x,
    ),
  }))
  audit.log(`Restauró versión v${version} de`, l.name, { landingId: id, companyId: l.companyId })
}

export function updateHero(id: string, hero: Partial<Landing['hero']>) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => (l.id === id ? { ...l, hero: { ...l.hero, ...hero }, updatedAt: stamp() } : l)),
  }))
}

export function updateTheme(id: string, theme: Partial<Landing['theme']>) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => (l.id === id ? { ...l, theme: { ...l.theme, ...theme }, updatedAt: stamp() } : l)),
  }))
}

export function applyThemePreset(id: string, themeId: string) {
  const theme = THEMES.find((t) => t.id === themeId)
  if (!theme) return
  updateTheme(id, { primary: theme.primary, bg: theme.bg, themeId: theme.id })
}

export function registerView(id: string) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => (l.id === id ? { ...l, metrics: { ...l.metrics, views: l.metrics.views + 1 } } : l)),
  }))
}

export function registerStart(id: string) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => (l.id === id ? { ...l, metrics: { ...l.metrics, starts: l.metrics.starts + 1 } } : l)),
  }))
}

export const themes = THEMES
