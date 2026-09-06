// Motor de voz: usa el proxy de voz (server/index.js, hoy con ElevenLabs) para TTS/STT.
// Si el proxy no está configurado o la llamada falla, cae automáticamente
// a las Web Speech APIs nativas del navegador para que la landing nunca se bloquee.
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, mime: string) {
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

let activeStream: MediaStream | null = null
let cancelRequested = false

async function googleSpeak(text: string, opts?: { languageCode?: string; voiceName?: string }): Promise<SpeakHandle> {
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

  const ctx = new AudioContext()
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
      ctx.close()
      resolve()
    }
    audio.onerror = () => {
      cancelAnimationFrame(raf)
      resolve()
    }
  })

  audio.play()
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

// Detección de silencio: en vez de grabar siempre el máximo de tiempo, cortamos
// apenas la persona deja de hablar (con un pequeño margen), para que cada turno
// se sienta instantáneo en vez de dejar "aire muerto" de varios segundos.
const SPEECH_THRESHOLD = 0.055
const SILENCE_HOLD_MS = 1000
const MIN_RECORD_MS = 450

async function recordAudio(maxMs: number, onLevel?: (l: number) => void): Promise<Blob> {
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
  const startedAt = Date.now()
  let hasSpoken = false
  let lastLoudAt = startedAt

  const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => chunks.push(e.data)

  const tick = () => {
    analyser.getByteFrequencyData(data8)
    const avg = data8.reduce((a, b) => a + b, 0) / data8.length / 255
    onLevel?.(avg)
    const now = Date.now()
    if (avg >= SPEECH_THRESHOLD) {
      hasSpoken = true
      lastLoudAt = now
    }
    const elapsed = now - startedAt
    const silentFor = now - lastLoudAt
    if (elapsed >= MIN_RECORD_MS && ((hasSpoken && silentFor >= SILENCE_HOLD_MS) || elapsed >= maxMs)) {
      if (recorder.state !== 'inactive') recorder.stop()
      return
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

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
  })
}

/** Subtítulos en vivo mientras se graba, usando Web Speech (best-effort, solo visual).
 * La transcripción que realmente se envía a guardar sigue viniendo de ElevenLabs vía
 * recordAudio()+STT, más precisa entre navegadores. Si el navegador no soporta
 * reconocimiento de voz nativo, simplemente no hay subtítulo en vivo (no falla nada). */
function startInterimCaptions(languageCode: string, onInterim: (text: string) => void) {
  const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognitionCtor) return () => {}
  const rec = new SpeechRecognitionCtor()
  rec.lang = languageCode
  rec.continuous = true
  rec.interimResults = true
  let finalText = ''
  rec.onresult = (e: any) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const chunk = e.results[i][0].transcript
      if (e.results[i].isFinal) finalText += chunk
      else interim += chunk
    }
    onInterim((finalText + interim).trim())
  }
  rec.onerror = () => {}
  try {
    rec.start()
  } catch {
    return () => {}
  }
  return () => {
    try {
      rec.stop()
    } catch {}
  }
}

async function googleListen(opts?: { languageCode?: string; timeoutMs?: number; onLevel?: (l: number) => void; onInterim?: (text: string) => void }) {
  const lang = opts?.languageCode ?? 'es-US'
  const stopCaptions = opts?.onInterim ? startInterimCaptions(lang, opts.onInterim) : () => {}
  try {
    const blob = await recordAudio(opts?.timeoutMs ?? 9000, opts?.onLevel)
    const base64 = await blobToBase64(blob)
    const res = await fetch(`${VOICE_SERVER_URL}/api/voice/stt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioContent: base64, languageCode: lang, encoding: 'WEBM_OPUS', sampleRateHertz: 48000 }),
    })
    if (!res.ok) throw new Error('stt_failed')
    const data = await res.json()
    return { transcript: data.transcript as string, confidence: data.confidence as number }
  } finally {
    stopCaptions()
  }
}

function webSpeechListen(opts?: { languageCode?: string; timeoutMs?: number }): Promise<{ transcript: string; confidence: number }> {
  return new Promise((resolve, reject) => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return reject(new Error('unsupported'))
    const rec = new SpeechRecognitionCtor()
    rec.lang = opts?.languageCode ?? 'es-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    const timeout = setTimeout(() => rec.stop(), opts?.timeoutMs ?? 6000)
    rec.onresult = (e: any) => {
      clearTimeout(timeout)
      const alt = e.results[0][0]
      resolve({ transcript: alt.transcript, confidence: alt.confidence ?? 0.8 })
    }
    rec.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('recognition_error'))
    }
    rec.onend = () => clearTimeout(timeout)
    rec.start()
  })
}

let googleAvailable: boolean | null = null
async function checkGoogleAvailable() {
  if (googleAvailable !== null) return googleAvailable
  try {
    const res = await fetch(`${VOICE_SERVER_URL}/api/voice/status`)
    const data = await res.json()
    googleAvailable = Boolean(data.configured)
  } catch {
    googleAvailable = false
  }
  return googleAvailable
}

export const voiceEngine: VoiceEngine = {
  async speak(text, opts) {
    if (await checkGoogleAvailable()) {
      try {
        return await googleSpeak(text, opts)
      } catch {
        googleAvailable = false // evita reintentar Google en cada frase de esta sesión
      }
    }
    return webSpeechSpeak(text, opts)
  },

  async listen(opts) {
    if (await checkGoogleAvailable()) {
      try {
        return await googleListen(opts)
      } catch (err) {
        if ((err as Error).message === 'cancelled') throw err
        googleAvailable = false
      }
    }
    return webSpeechListen(opts)
  },

  cancelListen() {
    cancelRequested = true
    activeStream?.getTracks().forEach((t) => t.stop())
  },

  supportsSpeechRecognition() {
    return Boolean(navigator.mediaDevices?.getUserMedia) || Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  },
}
