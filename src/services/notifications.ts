import type { EmailConfig, NotificationLog, WhatsAppConfig } from '../types'
import { resolveVariables, stamp, uuid } from '../lib/utils'
import { getDb, updateDb } from './store'
import * as companiesService from './companies'
import * as landingsService from './landings'

export function updateEmailConfig(landingId: string, patch: Partial<EmailConfig>) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => (l.id === landingId ? { ...l, email: { ...l.email, ...patch }, updatedAt: stamp() } : l)),
  }))
}

export function updateWhatsAppConfig(landingId: string, patch: Partial<WhatsAppConfig>) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => (l.id === landingId ? { ...l, whatsapp: { ...l.whatsapp, ...patch }, updatedAt: stamp() } : l)),
  }))
}

export function logsOf(landingId: string) {
  return getDb().notificationLogs.filter((n) => n.landingId === landingId)
}

function ctxFor(landingId: string, values: Record<string, string>) {
  const landing = landingsService.get(landingId)
  const company = landing ? companiesService.get(landing.companyId) : undefined
  return {
    empresa: company ? { nombre: company.name, logo: company.logo, email: company.email, telefono: company.phone } : {},
    landing: landing ? { nombre: landing.name, url: `recivia.cl/${landing.slug}`, title: landing.hero.title, text: landing.hero.text } : {},
    form: values,
  }
}

export function renderPreview(landingId: string, kind: 'email' | 'whatsapp', sample: Record<string, string>) {
  const landing = landingsService.get(landingId)
  if (!landing) return ''
  const ctx = ctxFor(landingId, sample)
  return kind === 'email' ? resolveVariables(landing.email.body, ctx) : resolveVariables(landing.whatsapp.message, ctx)
}

// Simula el envío real: en un backend real esto llamaría a un EmailProvider / WhatsAppService.provider
export function dispatch(landingId: string, submissionId: string, values: Record<string, string>) {
  const landing = landingsService.get(landingId)
  if (!landing) return
  const logs: NotificationLog[] = []
  if (landing.automation.actions.sendEmail && landing.email.enabled) {
    logs.push({ id: uuid(), landingId, submissionId, channel: 'email', recipient: landing.email.to, at: stamp(), status: 'Enviado' })
  }
  if (landing.automation.actions.sendWhatsapp && landing.whatsapp.enabled) {
    logs.push({
      id: uuid(),
      landingId,
      submissionId,
      channel: 'whatsapp',
      recipient: landing.whatsapp.number || 'Sin número configurado',
      at: stamp(),
      status: landing.whatsapp.number ? 'Enviado' : 'Error',
      error: landing.whatsapp.number ? undefined : 'Número de WhatsApp no configurado',
    })
  }
  updateDb((db) => ({ ...db, notificationLogs: [...logs, ...db.notificationLogs] }))
  return logs
}

export { ctxFor }
