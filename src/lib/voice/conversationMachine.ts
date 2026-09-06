export type ConversationState =
  | 'idle'
  | 'greeting'
  | 'ask_host'
  | 'listening_host'
  | 'confirm_host'
  | 'ask_name'
  | 'listening_name'
  | 'confirm_name'
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
  | { type: 'MISHEARD_HOST' }
  | { type: 'CONFIRMED_HOST' }
  | { type: 'REJECTED_HOST' }
  | { type: 'SPOKEN_ASK_NAME' }
  | { type: 'HEARD_NAME'; value: string; confident: boolean }
  | { type: 'MISHEARD_NAME' }
  | { type: 'CONFIRMED_NAME' }
  | { type: 'REJECTED_NAME' }
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
      return { state: 'confirm_host', data: { ...data, host: event.value, retries: 0 } }
    case 'CONFIRMED_HOST':
      return state === 'confirm_host' ? { state: 'ask_name', data } : snap
    case 'REJECTED_HOST':
      return state === 'confirm_host' ? { state: 'ask_host', data: { ...data, host: '' } } : snap

    case 'SPOKEN_ASK_NAME':
      return state === 'ask_name' ? { state: 'listening_name', data } : snap
    case 'HEARD_NAME':
      if (state !== 'listening_name') return snap
      if (!event.value || !event.confident) {
        if (data.retries >= MAX_RETRIES) return { state: 'processing', data: { ...data, name: event.value || 'Visitante', retries: 0 } }
        return { state: 'ask_name', data: { ...data, retries: data.retries + 1 } }
      }
      return { state: 'confirm_name', data: { ...data, name: event.value, retries: 0 } }
    case 'CONFIRMED_NAME':
      return state === 'confirm_name' ? { state: 'processing', data } : snap
    case 'REJECTED_NAME':
      return state === 'confirm_name' ? { state: 'ask_name', data: { ...data, name: '' } } : snap

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
