// Voces de ElevenLabs configuradas para el asistente (verificadas con el plan Starter).
export interface VoiceOption {
  id: string
  label: string
  gender: 'Mujer' | 'Hombre'
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'jUxkp8eMgszgJX3XU2pV', label: 'Voz femenina 1', gender: 'Mujer' },
  { id: 'kwNLkNjbQHMw9YUFZsHI', label: 'Voz femenina 2', gender: 'Mujer' },
  { id: 'f18RlRJGEw0TaGYwmk8B', label: 'Voz femenina 3', gender: 'Mujer' },
  { id: 'nVOH3KsergSg3CFWwAQm', label: 'Voz masculina 1', gender: 'Hombre' },
  { id: 'wZ4FocodjEua6ePhjAkq', label: 'Voz masculina 2', gender: 'Hombre' },
  { id: 'tGjegxe7yxhGMzd3SOmH', label: 'Voz masculina 3', gender: 'Hombre' },
]
