// Motor de voz: para ESCUCHAR (STT) usamos el reconocimiento de voz nativo del
// navegador como método principal — tiene su propia detección de fin de habla,
// probada por años en Chrome/Edge, y es instantáneo porque no hace ida y vuelta
// a un servidor. El proxy de voz (server/index.js, ElevenLabs) queda como
// respaldo solo para navegadores sin soporte nativo (ej. Firefox).
// Para HABLAR (TTS) sí preferimos ElevenLabs por la calidad de voz, con
// fallback a la síntesis nativa del navegador si el proxy falla.
//
// El backend de voz se despliega por separado del frontend (Cloudflare Pages no
// puede proxiar `_redirects` hacia dominios externos), así que en producción se
// llama directo a esa URL vía CORS. En local, VITE_VOICE_SERVER_URL queda vacío
// y se usa el proxy de Vite (ver vite.config.ts) hacia localhost.
const VOICE_SERVER_URL = import.meta.env.VITE_VOICE_SERVER_URL ?? ''

export interface SpeakHandle {
  stop: () => void
  /** Nivel de amplitud 0-1, actualizado mientras se reproduce (para animar el avatar). */
  onLevel: (cb: (level: number) => void) => void
  done: Promise<void>
}

export interface VoiceEngine {
  speak(text: string, opts?: { languageCode?: string; voiceName?: string }): Promise<SpeakHandle>
  listen(opts?: {
    languageCode?: string
    timeoutMs?: number
    onLevel?: (level: number) => void
    /** Subtítulo en vivo mientras la persona habla (best-effort, no todos los navegadores lo soportan). */
    onInterim?: (text: string) => void
  }): Promise<{ transcript: string; confidence: number }>
  cancelListen(): void
  supportsSpeechRecognition(): boolean
}

function base64ToBlob(base64: string, mime: string) {
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

let activeStream: MediaStream | null = null
let activeRecognition: any = null
let cancelRequested = false

// Un solo AudioContext reutilizado para toda la conversación. Crear uno nuevo
// por cada frase que dice el asistente es lo que causaba que el audio se
// cortara o sonara con retraso: los navegadores crean el AudioContext
// "suspendido" salvo que esté directamente ligado a un gesto reciente del
// usuario, y una vez pasado el primer intercambio, cada nuevo contexto nacía
// suspendido. `primeVoiceEngine()` lo crea y lo reanuda una sola vez, en el
// mismo clic que pide el permiso del micrófono.
let sharedAudioCtx: AudioContext | null = null
function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') sharedAudioCtx = new AudioContext()
  return sharedAudioCtx
}
export async function primeVoiceEngine() {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    } catch {}
  }
}

async function elevenLabsSpeak(text: string, opts?: { languageCode?: string; voiceName?: string }): Promise<SpeakHandle> {
  const res = await fetch(`${VOICE_SERVER_URL}/api/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, languageCode: opts?.languageCode ?? 'es-US', voiceName: opts?.voiceName }),
  })
  if (!res.ok) throw new Error('tts_failed')
  const data = await res.json()
  const blob = base64ToBlob(data.audioContent, 'audio/mp3')
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)

  const ctx = getAudioContext()
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {})
  const source = ctx.createMediaElementSource(audio)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)
  analyser.connect(ctx.destination)
  const data8 = new Uint8Array(analyser.frequencyBinCount)

  let levelCb: ((l: number) => void) | null = null
  let raf = 0
  const tick = () => {
    analyser.getByteFrequencyData(data8)
    const avg = data8.reduce((a, b) => a + b, 0) / data8.length / 255
    levelCb?.(avg)
    raf = requestAnimationFrame(tick)
  }

  const done = new Promise<void>((resolve) => {
    audio.onended = () => {
      cancelAnimationFrame(raf)
      URL.revokeObjectURL(url)
      source.disconnect()
      analyser.disconnect()
      resolve()
    }
    audio.onerror = () => {
      cancelAnimationFrame(raf)
      source.disconnect()
      analyser.disconnect()
      resolve()
    }
  })

  await audio.play().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[voice] no se pudo reproducir el audio:', err)
  })
  raf = requestAnimationFrame(tick)

  return {
    stop: () => {
      audio.pause()
      cancelAnimationFrame(raf)
    },
    onLevel: (cb) => {
      levelCb = cb
    },
    done,
  }
}

async function webSpeechSpeak(text: string, opts?: { languageCode?: string }): Promise<SpeakHandle> {
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = opts?.languageCode ?? 'es-US'
  let levelCb: ((l: number) => void) | null = null
  let raf = 0
  const pulse = () => {
    // Web Speech no expone amplitud real: simulamos un pulso mientras habla.
    levelCb?.(0.35 + Math.random() * 0.4)
    raf = requestAnimationFrame(pulse)
  }
  const done = new Promise<void>((resolve) => {
    utter.onend = () => {
      cancelAnimationFrame(raf)
      resolve()
    }
    utter.onerror = () => {
      cancelAnimationFrame(raf)
      resolve()
    }
  })
  speechSynthesis.speak(utter)
  raf = requestAnimationFrame(pulse)
  return {
    stop: () => {
      speechSynthesis.cancel()
      cancelAnimationFrame(raf)
    },
    onLevel: (cb) => {
      levelCb = cb
    },
    done,
  }
}

function getSpeechRecognitionCtor(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
}

/** Método principal para escuchar: reconocimiento nativo del navegador.
 * Es rápido (nada de red) y su detección de "dejó de hablar" está afinada por
 * el propio navegador, así que no necesitamos adivinar un umbral de volumen. */
function webSpeechListen(opts?: {
  languageCode?: string
  timeoutMs?: number
  onLevel?: (l: number) => void
  onInterim?: (text: string) => void
}): Promise<{ transcript: string; confidence: number }> {
  return new Promise((resolve, reject) => {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor()
    if (!SpeechRecognitionCtor) return reject(new Error('unsupported'))
    cancelRequested = false
    const rec = new SpeechRecognitionCtor()
    activeRecognition = rec
    rec.lang = opts?.languageCode ?? 'es-US'
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.continuous = false

    let settled = false
    let sawSpeech = false
    const hardTimeout = setTimeout(() => {
      if (!settled) rec.stop()
    }, opts?.timeoutMs ?? 9000)

    // Simula un nivel de amplitud (para el avatar) ya que Web Speech no lo expone.
    let raf = 0
    const pulse = () => {
      opts?.onLevel?.(sawSpeech ? 0.35 + Math.random() * 0.4 : 0.08 + Math.random() * 0.08)
      raf = requestAnimationFrame(pulse)
    }
    raf = requestAnimationFrame(pulse)

    const cleanup = () => {
      clearTimeout(hardTimeout)
      cancelAnimationFrame(raf)
      opts?.onLevel?.(0)
      activeRecognition = null
    }

    rec.onspeechstart = () => {
      sawSpeech = true
    }
    rec.onresult = (e: any) => {
      let finalText = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += chunk
        else interim += chunk
      }
      opts?.onInterim?.((finalText + interim).trim())
      if (finalText && !settled) {
        settled = true
        cleanup()
        const conf = e.results[0]?.[0]?.confidence
        resolve({ transcript: finalText.trim(), confidence: typeof conf === 'number' && conf > 0 ? conf : 0.9 })
      }
    }
    rec.onerror = (e: any) => {
      if (settled) return
      settled = true
      cleanup()
      if (cancelRequested) reject(new Error('cancelled'))
      else if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') reject(new Error('permission'))
      else if (e?.error === 'no-speech') resolve({ transcript: '', confidence: 0 })
      else reject(new Error('recognition_error'))
    }
    rec.onend = () => {
      if (settled) return
      settled = true
      cleanup()
      if (cancelRequested) reject(new Error('cancelled'))
      else resolve({ transcript: '', confidence: 0 })
    }
    try {
      rec.start()
    } catch {
      cleanup()
      reject(new Error('recognition_error'))
    }
  })
}

/** Respaldo cuando el navegador no tiene reconocimiento de voz nativo (ej. Firefox):
 * graba con MediaRecorder y transcribe vía el proxy de ElevenLabs. Sin detección de
 * silencio propia (eso resultó frágil: un ruido breve al inicio cortaba la
 * grabación antes de que la persona alcanzara a hablar) — graba un tiempo fijo
 * y razonable en su lugar. */
async function recordAudioFixed(ms: number, onLevel?: (l: number) => void): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  activeStream = stream
  cancelRequested = false

  const ctx = new AudioContext()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)
  const data8 = new Uint8Array(analyser.frequencyBinCount)
  let raf = 0
  const tick = () => {
    analyser.getByteFrequencyData(data8)
    const avg = data8.reduce((a, b) => a + b, 0) / data8.length / 255
    onLevel?.(avg)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => chunks.push(e.data)

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      cancelAnimationFrame(raf)
      ctx.close()
      stream.getTracks().forEach((t) => t.stop())
      activeStream = null
      if (cancelRequested) reject(new Error('cancelled'))
      else resolve(new Blob(chunks, { type: 'audio/webm' }))
    }
    recorder.start()
    setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop()
    }, ms)
  })
}

async function elevenLabsListen(opts?: { languageCode?: string; timeoutMs?: number; onLevel?: (l: number) => void }) {
  const lang = opts?.languageCode ?? 'es-US'
  const blob = await recordAudioFixed(opts?.timeoutMs ?? 6000, opts?.onLevel)
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  const res = await fetch(`${VOICE_SERVER_URL}/api/voice/stt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioContent: base64, languageCode: lang }),
  })
  if (!res.ok) throw new Error('stt_failed')
  const data = await res.json()
  return { transcript: data.transcript as string, confidence: data.confidence as number }
}

let elevenLabsAvailable: boolean | null = null
async function checkElevenLabsAvailable() {
  if (elevenLabsAvailable !== null) return elevenLabsAvailable
  try {
    const res = await fetch(`${VOICE_SERVER_URL}/api/voice/status`)
    const data = await res.json()
    elevenLabsAvailable = Boolean(data.configured)
  } catch {
    elevenLabsAvailable = false
  }
  return elevenLabsAvailable
}

export const voiceEngine: VoiceEngine = {
  async speak(text, opts) {
    if (await checkElevenLabsAvailable()) {
      try {
        return await elevenLabsSpeak(text, opts)
      } catch {
        elevenLabsAvailable = false // evita reintentar en cada frase de esta sesión
      }
    }
    return webSpeechSpeak(text, opts)
  },

  async listen(opts) {
    if (getSpeechRecognitionCtor()) {
      try {
        return await webSpeechListen(opts)
      } catch (err) {
        const msg = (err as Error).message
        if (msg === 'cancelled' || msg === 'permission') throw err
        // reconocimiento nativo falló por otra razón: probamos el respaldo si existe
      }
    }
    if (await checkElevenLabsAvailable()) {
      return elevenLabsListen(opts)
    }
    throw new Error('unsupported')
  },

  cancelListen() {
    cancelRequested = true
    activeStream?.getTracks().forEach((t) => t.stop())
    try {
      activeRecognition?.stop()
    } catch {}
  },

  supportsSpeechRecognition() {
    return Boolean(getSpeechRecognitionCtor()) || Boolean(navigator.mediaDevices?.getUserMedia)
  },
}
