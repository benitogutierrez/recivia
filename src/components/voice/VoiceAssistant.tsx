import { useEffect, useReducer, useRef, useState } from 'react'
import { Keyboard, RotateCcw } from 'lucide-react'
import type { Landing, Company } from '../../types'
import { resolveVariables } from '../../lib/utils'
import { voiceEngine } from '../../lib/voice/googleVoiceEngine'
import { transition, initialSnapshot, parseYesNo, type ConversationSnapshot, type ConversationEvent } from '../../lib/voice/conversationMachine'
import AssistantAvatar from './AssistantAvatar'
import TranscriptCaption from './TranscriptCaption'
import FormRenderer from '../FormRenderer'

interface Props {
  landing: Landing
  company: Company
  onComplete: (values: Record<string, string>) => void
}

function reducer(snap: ConversationSnapshot, event: ConversationEvent): ConversationSnapshot {
  return transition(snap, event)
}

export default function VoiceAssistant({ landing, company, onComplete }: Props) {
  const [snap, dispatch] = useReducer(reducer, undefined, initialSnapshot)
  const [caption, setCaption] = useState<{ speaker: 'assistant' | 'user' | null; text: string }>({ speaker: null, text: '' })
  const [visualMode, setVisualMode] = useState<'idle' | 'speaking' | 'listening' | 'processing'>('idle')
  const [level, setLevel] = useState(0)
  const [useTextFallback, setUseTextFallback] = useState(false)
  const [fallbackSubmitted, setFallbackSubmitted] = useState(false)
  const runId = useRef(0)
  const cfg = landing.voiceAssistant

  const ctx = { empresa: { nombre: company.name }, form: { visitante: snap.data.name, anfitrion: snap.data.host } }

  useEffect(() => {
    return () => voiceEngine.cancelListen()
  }, [])

  async function say(text: string) {
    setCaption({ speaker: 'assistant', text })
    setVisualMode('speaking')
    const myRun = runId.current
    const handle = await voiceEngine.speak(text, { languageCode: cfg.languageCode, voiceName: cfg.voiceName })
    handle.onLevel(setLevel)
    await handle.done
    if (runId.current !== myRun) return
    setLevel(0)
  }

  async function hear(): Promise<{ transcript: string; confident: boolean }> {
    setVisualMode('listening')
    setCaption({ speaker: 'user', text: 'Escuchando…' })
    try {
      const { transcript, confidence } = await voiceEngine.listen({
        languageCode: cfg.languageCode,
        timeoutMs: 9000,
        onLevel: setLevel,
        onInterim: (text) => setCaption({ speaker: 'user', text: text || 'Escuchando…' }),
      })
      setLevel(0)
      setCaption({ speaker: 'user', text: transcript || '(no se escuchó nada, ¿puedes repetir?)' })
      return { transcript: transcript.trim(), confident: transcript.trim().length > 0 && confidence >= 0.55 }
    } catch (err) {
      setLevel(0)
      // eslint-disable-next-line no-console
      console.error('[voice] error al escuchar:', err)
      const message = (err as Error).message
      if (message === 'unsupported') {
        dispatch({ type: 'UNSUPPORTED' })
      } else {
        setCaption({ speaker: 'assistant', text: message === 'permission' ? 'No pude acceder al micrófono.' : 'Hubo un problema escuchando.' })
        dispatch({ type: 'PERMISSION_DENIED' })
      }
      return { transcript: '', confident: false }
    }
  }

  // Orquesta cada estado: habla y/o escucha, luego dispara el siguiente evento.
  useEffect(() => {
    let cancelled = false
    runId.current++

    async function run() {
      switch (snap.state) {
        case 'greeting': {
          setVisualMode('speaking')
          await say(resolveVariables(cfg.greeting, ctx))
          if (!cancelled) dispatch({ type: 'SPOKEN_GREETING' })
          return
        }
        case 'ask_host': {
          await say(resolveVariables(cfg.askHostQuestion, ctx))
          if (!cancelled) dispatch({ type: 'SPOKEN_ASK_HOST' })
          return
        }
        case 'listening_host': {
          const { transcript, confident } = await hear()
          if (!cancelled) dispatch({ type: 'HEARD_HOST', value: transcript, confident })
          return
        }
        case 'confirm_host': {
          await say(`Entendido, vienes a visitar a ${snap.data.host}. ¿Es correcto?`)
          const { transcript } = await hear()
          const yn = parseYesNo(transcript)
          if (cancelled) return
          dispatch({ type: yn === false ? 'REJECTED_HOST' : 'CONFIRMED_HOST' })
          return
        }
        case 'ask_name': {
          await say(resolveVariables(cfg.askNameQuestion, ctx))
          if (!cancelled) dispatch({ type: 'SPOKEN_ASK_NAME' })
          return
        }
        case 'listening_name': {
          const { transcript, confident } = await hear()
          if (!cancelled) dispatch({ type: 'HEARD_NAME', value: transcript, confident })
          return
        }
        case 'confirm_name': {
          await say(`Perfecto, ${snap.data.name}. ¿Es correcto?`)
          const { transcript } = await hear()
          const yn = parseYesNo(transcript)
          if (cancelled) return
          dispatch({ type: yn === false ? 'REJECTED_NAME' : 'CONFIRMED_NAME' })
          return
        }
        case 'processing': {
          setVisualMode('processing')
          onComplete({ visitante: snap.data.name, anfitrion: snap.data.host })
          if (!cancelled) dispatch({ type: 'SAVED' })
          return
        }
        case 'farewell': {
          await say(resolveVariables(cfg.farewell, ctx))
          if (!cancelled) dispatch({ type: 'SPOKEN_FAREWELL' })
          return
        }
        case 'done': {
          setVisualMode('idle')
          return
        }
        case 'unsupported':
        case 'need_permission': {
          setVisualMode('idle')
          if (cfg.fallbackToForm) setUseTextFallback(true)
          return
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.state])

  if (useTextFallback) {
    if (fallbackSubmitted) {
      return (
        <div className="py-8 text-center">
          <h2 className="text-[19px] font-bold text-ink">¡Gracias!</h2>
          <p className="mt-2 text-[13px] text-ink-faint">Ya avisamos a tu anfitrión, por favor toma asiento.</p>
        </div>
      )
    }
    return (
      <div>
        <p className="mb-4 text-[12.5px] text-ink-faint">No pudimos usar el asistente de voz en este dispositivo. Completa tus datos:</p>
        <FormRenderer
          fields={[
            { id: 'f1', label: '¿A quién visitas?', key: 'anfitrion', type: 'text', description: '', required: true, placeholder: '', defaultValue: '', options: '', order: 0, width: 'full', visible: true, validation: {} },
            { id: 'f2', label: 'Tu nombre', key: 'visitante', type: 'text', description: '', required: true, placeholder: '', defaultValue: '', options: '', order: 1, width: 'full', visible: true, validation: {} },
          ]}
          submitLabel="Registrar mi visita"
          primary={landing.theme.primary}
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            onComplete({ anfitrion: String(fd.get('anfitrion') || ''), visitante: String(fd.get('visitante') || '') })
            setFallbackSubmitted(true)
          }}
        />
      </div>
    )
  }

  async function startConversation() {
    // Pedimos el micrófono AQUÍ, como resultado directo del clic. Si lo dejamos
    // para más tarde (después del saludo hablado), algunos navegadores ya no
    // consideran la acción "reciente" y bloquean el permiso en silencio — eso
    // hacía que pareciera que el asistente "no escuchaba" cuando en realidad
    // nunca llegó a pedir el micrófono.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      dispatch({ type: 'START' })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[voice] permiso de micrófono denegado:', err)
      dispatch({ type: 'PERMISSION_DENIED' })
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={snap.state === 'idle' ? startConversation : undefined}
        className={snap.state === 'idle' ? 'cursor-pointer transition hover:scale-[1.03]' : 'cursor-default'}
        aria-label="Toca para hablar con el asistente"
      >
        <AssistantAvatar mode={visualMode} level={level} primary={landing.theme.primary} />
      </button>

      <div className="mt-6 w-full max-w-sm">
        <TranscriptCaption speaker={caption.speaker} text={caption.text} />
      </div>

      {snap.state === 'idle' && (
        <p className="mt-1 text-[13px] font-semibold text-ink-faint">Toca el círculo para hablar con el asistente</p>
      )}

      {snap.state === 'done' && (
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="mt-2 flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-[13px] font-bold text-ink transition hover:bg-surface-muted"
        >
          <RotateCcw size={14} /> Registrar otra visita
        </button>
      )}

      {snap.state !== 'idle' && snap.state !== 'done' && cfg.fallbackToForm && (
        <button
          onClick={() => {
            voiceEngine.cancelListen()
            setUseTextFallback(true)
          }}
          className="mt-4 flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-faint underline-offset-2 hover:underline"
        >
          <Keyboard size={12} /> Prefiero escribir mis datos
        </button>
      )}
    </div>
  )
}
