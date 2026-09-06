// ---------- Auth & permisos ----------
export type Role = 'Super Admin' | 'Admin' | 'Editor' | 'Viewer'

export interface AppUser {
  id: string
  name: string
  email: string
  role: Role
  status: 'Activo' | 'Invitado' | 'Inactivo'
  companyId?: string
  createdAt: string
}

export interface Session {
  userId: string
}

// ---------- Empresas ----------
export interface Company {
  id: string
  name: string
  legal: string
  rut: string
  logo: string // emoji o url
  email: string
  phone: string
  wa: string
  address: string
  status: 'Activo' | 'Inactivo'
  createdAt: string
}

// ---------- Temas ----------
export interface Theme {
  id: string
  name: string
  primary: string
  bg: string
  text: string
  font: 'sans' | 'display'
  radius: 'sharp' | 'soft' | 'round'
  spacing: 'compact' | 'cozy' | 'airy'
}

// ---------- Page builder ----------
export type BlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'logo'
  | 'video'
  | 'button'
  | 'icon'
  | 'banner'
  | 'divider'
  | 'spacer'
  | 'section'
  | 'columns'
  | 'form'

export interface PageBlock {
  id: string
  type: BlockType
  visible: boolean
  props: Record<string, any>
  children?: PageBlock[]
}

// ---------- Formularios ----------
export type FieldType = 'text' | 'email' | 'tel' | 'rut' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'hidden'

export interface FieldValidation {
  pattern?: string
  min?: number
  max?: number
  message?: string
}

export interface FieldDef {
  id: string
  label: string
  key: string
  type: FieldType
  description: string
  required: boolean
  placeholder: string
  defaultValue: string
  options: string // separadas por |
  order: number
  width: 'half' | 'full'
  visible: boolean
  validation: FieldValidation
}

export interface FormDef {
  id: string
  landingId: string
  fields: FieldDef[]
  submitLabel: string
}

// ---------- Notificaciones ----------
export interface EmailConfig {
  enabled: boolean
  to: string
  cc: string
  bcc: string
  from: string
  replyTo: string
  subject: string
  body: string
}

export type WhatsAppProvider = 'meta_cloud' | 'twilio' | '360dialog'

export interface WhatsAppConfig {
  enabled: boolean
  number: string
  provider: WhatsAppProvider
  apiKey: string
  message: string
}

export interface NotificationLog {
  id: string
  landingId: string
  submissionId: string
  channel: 'email' | 'whatsapp'
  recipient: string
  at: string
  status: 'Enviado' | 'Error' | 'Pendiente'
  error?: string
}

// ---------- Automatizaciones ----------
export type ActionType = 'save_record' | 'send_email' | 'send_whatsapp' | 'show_confirmation'

export interface AutomationConfig {
  landingId: string
  trigger: 'FORM_SUBMITTED'
  actions: {
    saveRecord: boolean
    sendEmail: boolean
    sendWhatsapp: boolean
    showConfirmation: boolean
    confirmationMessage: string
  }
  future: string[] // integraciones planeadas: webhook, api, sheets, crm, slack, teams, sms
}

// ---------- Asistente de voz ----------
export type LandingMode = 'form' | 'voice'

export interface VoiceAssistantConfig {
  enabled: boolean
  languageCode: string // ej. 'es-US', 'es-CL', 'en-US'
  voiceName: string // voice_id de ElevenLabs, ver src/lib/voice/elevenLabsVoices.ts
  greeting: string
  askHostQuestion: string
  askNameQuestion: string
  farewell: string
  fallbackToForm: boolean // si no hay micrófono/permiso/soporte, cae al formulario clásico
}

// ---------- Landings ----------
export type LandingStatus = 'Borrador' | 'Publicada' | 'Despublicada'

export interface LandingVersion {
  version: number
  at: string
  status: LandingStatus
  snapshot: {
    hero: Landing['hero']
    theme: Landing['theme']
    blocks: PageBlock[]
    fields: FieldDef[]
  }
}

export interface Landing {
  id: string
  companyId: string
  name: string
  slug: string
  status: LandingStatus
  templateId?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  mode: LandingMode
  voiceAssistant: VoiceAssistantConfig
  theme: { primary: string; bg: string; themeId: string }
  hero: { eyebrow: string; title: string; text: string; button: string }
  blocks: PageBlock[]
  fields: FieldDef[]
  submitLabel: string
  email: EmailConfig
  whatsapp: WhatsAppConfig
  automation: AutomationConfig
  metrics: { views: number; starts: number }
  versions: LandingVersion[]
  currentVersion: number
}

// ---------- Templates ----------
export interface Template {
  id: string
  name: string
  cat: string
  color: string
  desc: string
  fields: string[]
  builtin: boolean
}

// ---------- Registros ----------
export interface Submission {
  id: string
  landingId: string
  companyId: string
  at: string
  status: 'Nuevo' | 'Contactado' | 'Descartado'
  values: Record<string, string>
}

// ---------- Auditoría ----------
export interface AuditEntry {
  id: string
  at: string
  user: string
  action: string
  entity: string
  companyId?: string
  landingId?: string
}

// ---------- DB (persistencia local que simula el backend) ----------
export interface Db {
  users: AppUser[]
  session: Session | null
  companies: Company[]
  themes: Theme[]
  templates: Template[]
  landings: Landing[]
  submissions: Submission[]
  notificationLogs: NotificationLog[]
  audit: AuditEntry[]
}
