export type ConversationState =
  | 'idle'
  | 'greeting'
  | 'ask_host'
  | 'listening_host'
  | 'ask_name'
  | 'listening_name'
  | 'processing'
  | 'farewell'
  | 'done'
  | 'need_permission'
  | 'unsupported'

export interface ConversationData {
  host: string
  name: string
  retries: number
}

export type ConversationEvent =
  | { type: 'START' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED' }
  | { type: 'UNSUPPORTED' }
  | { type: 'SPOKEN_GREETING' }
  | { type: 'SPOKEN_ASK_HOST' }
  | { type: 'HEARD_HOST'; value: string; confident: boolean }
  | { type: 'SPOKEN_ASK_NAME' }
  | { type: 'HEARD_NAME'; value: string; confident: boolean }
  | { type: 'SAVED' }
  | { type: 'SPOKEN_FAREWELL' }
  | { type: 'RESET' }

export interface ConversationSnapshot {
  state: ConversationState
  data: ConversationData
}

const MAX_RETRIES = 2

export function initialSnapshot(): ConversationSnapshot {
  return { state: 'idle', data: { host: '', name: '', retries: 0 } }
}

export function transition(snap: ConversationSnapshot, event: ConversationEvent): ConversationSnapshot {
  const { state, data } = snap

  switch (event.type) {
    case 'START':
      return { state: 'greeting', data: { host: '', name: '', retries: 0 } }
    case 'UNSUPPORTED':
      return { state: 'unsupported', data }
    case 'PERMISSION_DENIED':
      return { state: 'need_permission', data }
    case 'PERMISSION_GRANTED':
      return state === 'need_permission' ? { state: 'greeting', data } : snap

    case 'SPOKEN_GREETING':
      return state === 'greeting' ? { state: 'ask_host', data } : snap
    case 'SPOKEN_ASK_HOST':
      return state === 'ask_host' ? { state: 'listening_host', data } : snap

    case 'HEARD_HOST':
      if (state !== 'listening_host') return snap
      if (!event.value || !event.confident) {
        if (data.retries >= MAX_RETRIES) return { state: 'ask_name', data: { ...data, host: event.value || 'recepción', retries: 0 } }
        return { state: 'ask_host', data: { ...data, retries: data.retries + 1 } }
      }
      // Sin paso de confirmación: se avanza directo, como en una conversación real
      // en vez de verificar cada respuesta ("¿es correcto?"), que se sentía lento y robótico.
      return { state: 'ask_name', data: { ...data, host: event.value, retries: 0 } }

    case 'SPOKEN_ASK_NAME':
      return state === 'ask_name' ? { state: 'listening_name', data } : snap
    case 'HEARD_NAME':
      if (state !== 'listening_name') return snap
      if (!event.value || !event.confident) {
        if (data.retries >= MAX_RETRIES) return { state: 'processing', data: { ...data, name: event.value || 'Visitante', retries: 0 } }
        return { state: 'ask_name', data: { ...data, retries: data.retries + 1 } }
      }
      return { state: 'processing', data: { ...data, name: event.value, retries: 0 } }

    case 'SAVED':
      return state === 'processing' ? { state: 'farewell', data } : snap
    case 'SPOKEN_FAREWELL':
      return state === 'farewell' ? { state: 'done', data } : snap

    case 'RESET':
      return initialSnapshot()

    default:
      return snap
  }
}

/** Heurística simple para detectar sí/no en español al confirmar por voz. */
export function parseYesNo(text: string): boolean | null {
  const t = text.toLowerCase().trim()
  if (/^(s[ií]|correcto|exacto|as[ií] es|claro|dale)/.test(t)) return true
  if (/^(no|incorrecto|para nada|negativo)/.test(t)) return false
  return null
}

// La gente no responde con solo un nombre — dice frases completas como
// "Hola, vengo a visitar a Pedro Pascal" o "Me llamo Juan Pérez". Esto quita
// saludos y frases de cortesía comunes al inicio para quedarnos con el nombre.
const GREETING_PREFIX = /^(hola|buenas|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|qu[eé]\s+tal|oye|disculpa|perd[oó]n|por\s+favor)[,.\s]+/i

const HOST_PREFIXES = [
  /^(vengo|ven[ií]a|vine|voy)\s+(a|para)\s+visitar\s+a\s+/i,
  /^vine\s+a\s+ver\s+a\s+/i,
  /^(quiero|quisiera|necesito)\s+ver\s+a\s+/i,
  /^(busco|estoy\s+buscando)\s+a\s+/i,
  /^(necesito|quiero)\s+hablar\s+con\s+/i,
  /^tengo\s+(una\s+)?(reuni[oó]n|cita)\s+con\s+/i,
  /^visito\s+a\s+/i,
  /^(para|a)\s+ver\s+a\s+/i,
  /^con\s+/i,
]

const NAME_PREFIXES = [/^(mi\s+nombre\s+es|me\s+llamo|yo\s+soy|soy)\s+/i]

function titleCase(s: string): string {
  return s
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function stripPrefixes(raw: string, prefixes: RegExp[]): string {
  let text = raw.trim().replace(/[.!¡¿?]+$/g, '')
  let changed = true
  while (changed) {
    changed = false
    const withoutGreeting = text.replace(GREETING_PREFIX, '').trim()
    if (withoutGreeting !== text) {
      text = withoutGreeting
      changed = true
    }
    for (const p of prefixes) {
      const next = text.replace(p, '').trim()
      if (next !== text) {
        text = next
        changed = true
      }
    }
  }
  return text
}

/** Extrae a quién viene a visitar desde una respuesta hablada completa. */
export function extractHostName(text: string): string {
  const cleaned = stripPrefixes(text, HOST_PREFIXES)
  return titleCase(cleaned || text)
}

/** Extrae el nombre propio desde una respuesta hablada completa. */
export function extractPersonName(text: string): string {
  const cleaned = stripPrefixes(text, NAME_PREFIXES)
  return titleCase(cleaned || text)
}
