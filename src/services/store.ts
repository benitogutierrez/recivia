// Persistencia local que simula el backend de Recivia.
// Ningún componente de UI debe importar este archivo directamente:
// solo los módulos dentro de `src/services/*` pueden hablar con él.
// Esto permite reemplazar esta implementación por llamadas HTTP reales
// sin tocar una sola página o componente.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppUser,
  AuditEntry,
  Company,
  Db,
  Landing,
  NotificationLog,
  Submission,
  Template,
  Theme,
} from '../types'
import { makeField, stamp, uuid } from '../lib/utils'

export const THEMES: Theme[] = [
  { id: 'th1', name: 'Corporativo', primary: '#3e5eff', bg: '#eef4ff', text: '#141b2d', font: 'display', radius: 'soft', spacing: 'cozy' },
  { id: 'th2', name: 'Minimal', primary: '#141b2d', bg: '#f6f7fb', text: '#141b2d', font: 'sans', radius: 'sharp', spacing: 'compact' },
  { id: 'th3', name: 'Comercial', primary: '#8248e0', bg: '#f6f2ff', text: '#141b2d', font: 'display', radius: 'round', spacing: 'airy' },
]

export const TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Recepción de convenio',
    cat: 'Captación',
    color: '#3e5eff',
    desc: 'Solicitud corporativa con datos de contacto y empresa.',
    fields: ['Nombre completo', 'RUT empresa', 'Correo electrónico', 'Teléfono', 'Tipo de convenio'],
    builtin: true,
  },
  {
    id: 't2',
    name: 'Formulario simple',
    cat: 'Registro',
    color: '#17a67c',
    desc: 'Página ligera enfocada en una conversión rápida.',
    fields: ['Nombre completo', 'Correo electrónico', 'Teléfono'],
    builtin: true,
  },
  {
    id: 't3',
    name: 'Campaña comercial',
    cat: 'Marketing',
    color: '#8248e0',
    desc: 'Landing de campaña con CTA y formulario de interés.',
    fields: ['Nombre completo', 'Correo electrónico', 'Empresa', 'Cargo'],
    builtin: true,
  },
]

function blocksFor(): Landing['blocks'] {
  return [
    { id: uuid(), type: 'heading', visible: true, props: { text: '{{landing.title}}', align: 'center' } },
    { id: uuid(), type: 'text', visible: true, props: { text: '{{landing.text}}', align: 'center' } },
    { id: uuid(), type: 'form', visible: true, props: {} },
  ]
}

function makeLanding(overrides: Partial<Landing> & { companyId: string; name: string; slug: string }): Landing {
  const now = stamp()
  const t = TEMPLATES[0]
  return {
    id: uuid(),
    status: 'Borrador',
    templateId: t.id,
    createdAt: now,
    updatedAt: now,
    mode: 'form',
    voiceAssistant: {
      enabled: false,
      languageCode: 'es-US',
      voiceName: 'nVOH3KsergSg3CFWwAQm', // ver src/lib/voice/elevenLabsVoices.ts
      greeting: 'Hola, bienvenido a {{empresa.nombre}}.',
      askHostQuestion: '¿A quién vienes a visitar?',
      askNameQuestion: 'Perfecto. ¿Cuál es tu nombre?',
      farewell: 'Gracias {{form.visitante}}. Ya avisamos a {{form.anfitrion}} de tu llegada, por favor toma asiento.',
      fallbackToForm: true,
    },
    theme: { primary: THEMES[0].primary, bg: THEMES[0].bg, themeId: THEMES[0].id },
    hero: {
      eyebrow: t.cat,
      title: 'Una experiencia lista para convertir',
      text: t.desc,
      button: 'Enviar solicitud',
    },
    blocks: blocksFor(),
    fields: t.fields.map((f, i) => makeField(f, i)),
    submitLabel: 'Enviar solicitud',
    email: {
      enabled: true,
      to: 'equipo@empresa.cl',
      cc: '',
      bcc: '',
      from: 'notificaciones@recivia.cl',
      replyTo: '',
      subject: 'Nuevo registro recibido en {{landing.nombre}}',
      body: 'Landing: {{landing.nombre}}\nNombre: {{form.nombre_completo}}\nEmail: {{form.correo_electronico}}\nFecha: {{fecha}}',
    },
    whatsapp: {
      enabled: false,
      number: '',
      provider: 'meta_cloud',
      apiKey: '',
      message: 'Nuevo registro en Recivia\nNombre: {{form.nombre_completo}}\nEmail: {{form.correo_electronico}}',
    },
    automation: {
      landingId: '',
      trigger: 'FORM_SUBMITTED',
      actions: {
        saveRecord: true,
        sendEmail: true,
        sendWhatsapp: false,
        showConfirmation: true,
        confirmationMessage: '¡Gracias por escribirnos! Te responderemos a la brevedad.',
      },
      future: ['Webhook', 'API', 'Google Sheets', 'CRM', 'Slack', 'Microsoft Teams', 'SMS'],
    },
    metrics: { views: 0, starts: 0 },
    versions: [],
    currentVersion: 0,
    ...overrides,
  }
}

function seed(): Db {
  const companies: Company[] = [
    {
      id: 'c1',
      name: 'Bata Chile',
      legal: 'Bata Chile S.A.',
      rut: '76.123.456-7',
      logo: '👞',
      email: 'contacto@bata.cl',
      phone: '+56 2 2345 6789',
      wa: '+56912345678',
      address: 'Av. Apoquindo 4501, Las Condes, Santiago',
      status: 'Activo',
      createdAt: stamp(),
    },
  ]

  const users: AppUser[] = [
    { id: 'u1', name: 'Benito Gutiérrez', email: 'benito@recivia.cl', role: 'Super Admin', status: 'Activo', createdAt: stamp() },
    { id: 'u2', name: 'María Soto', email: 'maria@bata.cl', role: 'Admin', companyId: 'c1', status: 'Activo', createdAt: stamp() },
  ]

  const landing = makeLanding({
    id: 'l1',
    companyId: 'c1',
    name: 'Recepción de convenios',
    slug: 'recepcion/convenios',
    status: 'Publicada',
    publishedAt: stamp(),
    theme: { primary: '#3e5eff', bg: '#eef4ff', themeId: 'th1' },
    hero: {
      eyebrow: 'Convenios comerciales',
      title: 'Conversemos sobre tu próximo convenio',
      text: 'Completa el formulario y nuestro equipo comercial se comunicará contigo a la brevedad.',
      button: 'Enviar solicitud',
    },
    fields: TEMPLATES[0].fields.map((f, i) => makeField(f, i)),
    metrics: { views: 1250, starts: 493 },
    currentVersion: 1,
  }) as Landing
  landing.id = 'l1'
  landing.automation.landingId = 'l1'
  landing.versions = [
    {
      version: 1,
      at: stamp(),
      status: 'Publicada',
      snapshot: { hero: landing.hero, theme: landing.theme, blocks: landing.blocks, fields: landing.fields },
    },
  ]

  const submissionsSeed: [string, string, string][] = [
    ['Camila Fernández', 'camila.fernandez@empresa.cl', 'Corporativo'],
    ['Diego Morales', 'diego@proveedor.cl', 'Empleados'],
    ['María Paz Soto', 'maria@grupoandino.cl', 'Clientes'],
  ]
  const submissions: Submission[] = submissionsSeed.map((x, i) => ({
    id: uuid(),
    landingId: 'l1',
    companyId: 'c1',
    at: new Date(Date.now() - i * 86400000).toISOString(),
    status: i === 2 ? 'Contactado' : 'Nuevo',
    values: { nombre_completo: x[0], correo_electronico: x[1], tipo_de_convenio: x[2] },
  }))

  const notificationLogs: NotificationLog[] = submissions.map((s) => ({
    id: uuid(),
    landingId: 'l1',
    submissionId: s.id,
    channel: 'email',
    recipient: 'equipo@bata.cl',
    at: s.at,
    status: 'Enviado',
  }))

  const audit: AuditEntry[] = [
    { id: uuid(), at: stamp(), user: 'Benito Gutiérrez', action: 'Publicó', entity: landing.name, companyId: 'c1', landingId: 'l1' },
  ]

  return {
    users,
    session: { userId: 'u1' },
    companies,
    themes: THEMES,
    templates: TEMPLATES,
    landings: [landing],
    submissions,
    notificationLogs,
    audit,
  }
}

interface RawStore {
  db: Db
  set: (fn: (db: Db) => Db) => void
}

export const useRawStore = create<RawStore>()(
  persist(
    (set) => ({
      db: seed(),
      set: (fn) => set((s) => ({ db: fn(s.db) })),
    }),
    { name: 'recivia-db-v3' },
  ),
)

export function getDb() {
  return useRawStore.getState().db
}

export function updateDb(fn: (db: Db) => Db) {
  useRawStore.getState().set(fn)
}

export { makeLanding }
