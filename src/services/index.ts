// Punto único de entrada para la UI: toda la aplicación consume datos y
// mutaciones a través de estos módulos, nunca directamente del store interno.
//
// Patrón de uso: cada página debe llamar `const db = useDb()` para
// suscribirse a los cambios (provoca un re-render cuando cualquier
// mutación ocurre). Con esa suscripción activa, tanto `db.xxx` como los
// getters de los módulos de dominio (que leen el estado más reciente al
// invocarse) devuelven datos frescos durante ese render. Las funciones de
// `analytics` reciben `db` explícitamente por claridad al combinar varias
// entidades.
import { useRawStore } from './store'

export function useDb() {
  return useRawStore((s) => s.db)
}

export * as companies from './companies'
export * as landings from './landings'
export * as forms from './forms'
export * as pageBuilder from './pageBuilder'
export * as notifications from './notifications'
export * as automations from './automations'
export * as submissions from './submissions'
export * as templates from './templates'
export * as users from './users'
export * as auth from './auth'
export * as analytics from './analytics'
export * as audit from './audit'
