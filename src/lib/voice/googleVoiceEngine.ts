// Motor de voz: usa el proxy de Google Cloud (server/index.js) para TTS/STT.
// Si el proxy no está configurado o la llamada falla, cae automáticamente
// a las Web Speech APIs nativas del navegador para que la landing nunca se bloquee.

export interface SpeakHandle {
  stop: () => void
  /** Nivel de amplitud 0-1, actualizado mientras se reproduce (para animar el avatar). */
  onLevel: (cb: (level: number) => void) => void
  done: Promise<void>
}

export interface VoiceEngine {
  speak(text: string, opts?: { languageCode?: string; voiceName?: string }): Promise<SpeakHandle>
  listen(opts?: { languageCode?: string; timeoutMs?: number; onLevel?: (level: number) => void }): Promise<{ transcript: string; confidence: number }>
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
  const res = await fetch('/api/voice/tts', {
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

async function recordAudio(timeoutMs: number, onLevel?: (l: number) => void): Promise<Blob> {
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
    }, timeoutMs)
  })
}

async function googleListen(opts?: { languageCode?: string; timeoutMs?: number; onLevel?: (l: number) => void }) {
  const blob = await recordAudio(opts?.timeoutMs ?? 6000, opts?.onLevel)
  const base64 = await blobToBase64(blob)
  const res = await fetch('/api/voice/stt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioContent: base64, languageCode: opts?.languageCode ?? 'es-US', encoding: 'WEBM_OPUS', sampleRateHertz: 48000 }),
  })
  if (!res.ok) throw new Error('stt_failed')
  const data = await res.json()
  return { transcript: data.transcript as string, confidence: data.confidence as number }
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
    const res = await fetch('/api/voice/status')
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
