import type { Db } from '../types'
import { getDb } from './store'

export function overview(db: Db = getDb()) {
  const views = db.landings.reduce((a, l) => a + l.metrics.views, 0)
  const starts = db.landings.reduce((a, l) => a + l.metrics.starts, 0)
  const submissions = db.submissions.length
  const today = new Date().toDateString()
  const cutoff = Date.now() - 7 * 86400000
  return {
    totalCompanies: db.companies.length,
    totalLandings: db.landings.length,
    published: db.landings.filter((l) => l.status === 'Publicada').length,
    drafts: db.landings.filter((l) => l.status === 'Borrador').length,
    totalSubmissions: submissions,
    today: db.submissions.filter((s) => new Date(s.at).toDateString() === today).length,
    last7Days: db.submissions.filter((s) => new Date(s.at).getTime() >= cutoff).length,
    views,
    starts,
    conversion: views ? (submissions / views) * 100 : 0,
  }
}

export function byLanding(db: Db = getDb()) {
  return db.landings.map((l) => ({
    id: l.id,
    name: l.name,
    submissions: db.submissions.filter((s) => s.landingId === l.id).length,
    views: l.metrics.views,
    conversion: l.metrics.views ? (db.submissions.filter((s) => s.landingId === l.id).length / l.metrics.views) * 100 : 0,
  }))
}

export function byCompany(db: Db = getDb()) {
  return db.companies.map((c) => ({
    id: c.id,
    name: c.name,
    landings: db.landings.filter((l) => l.companyId === c.id).length,
    submissions: db.submissions.filter((s) => s.companyId === c.id).length,
  }))
}

export function notificationHealth(db: Db = getDb()) {
  const logs = db.notificationLogs
  const errors = logs.filter((l) => l.status === 'Error')
  return {
    total: logs.length,
    sent: logs.filter((l) => l.status === 'Enviado').length,
    errors: errors.length,
    recentErrors: errors.slice(0, 5),
  }
}

export function submissionsPerDay(db: Db = getDb(), days = 7) {
  const out: { label: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const label = d.toLocaleDateString('es-CL', { weekday: 'short' })
    const count = db.submissions.filter((s) => new Date(s.at).toDateString() === d.toDateString()).length
    out.push({ label, count })
  }
  return out
}
