// Backend mínimo que expone la clave de ElevenLabs solo en el servidor.
// El frontend nunca debe conocer ELEVENLABS_API_KEY: siempre habla con este proxy.
// Contrato de la API (/api/voice/tts, /api/voice/stt, /api/voice/status) sin cambios,
// así que el motor de voz del frontend no necesita saber qué proveedor hay detrás.
import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' })) // el audio en base64 puede pesar varios MB

const PORT = process.env.PORT ? Number(process.env.PORT) : process.env.VOICE_SERVER_PORT ? Number(process.env.VOICE_SERVER_PORT) : 8787
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
// Voz por defecto (multilingüe, sirve para español). Cambia esto por el voice_id
// que elijas en tu Voice Library de ElevenLabs: https://elevenlabs.io/app/voice-library
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'nVOH3KsergSg3CFWwAQm' // voz masculina 1 (ver src/lib/voice/elevenLabsVoices.ts)

app.get('/api/voice/status', (_req, res) => {
  res.json({ configured: Boolean(ELEVENLABS_API_KEY), extract: Boolean(ANTHROPIC_API_KEY) })
})

// Entiende lo que la persona dijo de verdad, en vez de adivinar con reglas de
// texto: la gente responde con frases completas, en cualquier orden ("soy
// Benito y vengo a visitar a Pedro Pascal"), y a veces menciona ambos datos
// de una vez aunque solo se le haya preguntado por uno.
app.post('/api/voice/extract', async (req, res) => {
  if (!ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ANTHROPIC_API_KEY no configurada en el servidor' })
  const { utterance, known } = req.body ?? {}
  if (!utterance) return res.status(400).json({ error: 'Falta "utterance"' })

  const prompt = `Estás ayudando a una recepción por voz en español (Chile). La persona dijo textualmente:
"""${utterance}"""

Datos que ya se conocían antes de esta frase: nombre del visitante = ${known?.name ? `"${known.name}"` : 'desconocido'}, a quién visita (anfitrión) = ${known?.host ? `"${known.host}"` : 'desconocido'}.

Extrae SOLO lo que la persona dijo explícitamente en esta frase (puede mencionar uno, ambos, o ninguno de los dos datos, en cualquier orden, junto con saludos o comentarios de relleno que debes ignorar). No inventes ni repitas un dato ya conocido si no lo vuelve a decir. Usa mayúscula inicial en los nombres propios.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta forma exacta:
{"name": string o null, "host": string o null}`

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await aiRes.json()
    if (!aiRes.ok) return res.status(aiRes.status).json({ error: data?.error?.message || 'Error de Claude' })
    const textOut = data?.content?.[0]?.text ?? '{}'
    const match = textOut.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : {}
    res.json({ name: parsed.name ?? null, host: parsed.host ?? null })
  } catch (err) {
    res.status(502).json({ error: 'No se pudo contactar a Claude', detail: String(err) })
  }
})

app.post('/api/voice/tts', async (req, res) => {
  if (!ELEVENLABS_API_KEY) return res.status(503).json({ error: 'ELEVENLABS_API_KEY no configurada en el servidor' })
  const { text, ssml, voiceName } = req.body ?? {}
  const input = text || ssml
  if (!input) return res.status(400).json({ error: 'Falta "text" o "ssml"' })
  const voiceId = voiceName || DEFAULT_VOICE_ID

  try {
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY, Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: input,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })
    if (!elRes.ok) {
      const errBody = await elRes.json().catch(() => ({}))
      return res.status(elRes.status).json({ error: errBody?.detail?.message || errBody?.error || 'Error de ElevenLabs TTS' })
    }
    const audioBuffer = Buffer.from(await elRes.arrayBuffer())
    res.json({ audioContent: audioBuffer.toString('base64') })
  } catch (err) {
    res.status(502).json({ error: 'No se pudo contactar a ElevenLabs TTS', detail: String(err) })
  }
})

app.post('/api/voice/stt', async (req, res) => {
  if (!ELEVENLABS_API_KEY) return res.status(503).json({ error: 'ELEVENLABS_API_KEY no configurada en el servidor' })
  const { audioContent } = req.body ?? {}
  if (!audioContent) return res.status(400).json({ error: 'Falta "audioContent" (base64)' })

  try {
    const audioBuffer = Buffer.from(audioContent, 'base64')
    const form = new FormData()
    form.append('model_id', 'scribe_v1')
    form.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm')

    const elRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      body: form,
    })
    const data = await elRes.json().catch(() => ({}))
    if (!elRes.ok) return res.status(elRes.status).json({ error: data?.detail?.message || data?.error || 'Error de ElevenLabs STT' })
    const transcript = data.text ?? ''
    res.json({ transcript, confidence: transcript ? 1 : 0 })
  } catch (err) {
    res.status(502).json({ error: 'No se pudo contactar a ElevenLabs STT', detail: String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`[voice-server] escuchando en http://localhost:${PORT} (ElevenLabs API key ${ELEVENLABS_API_KEY ? 'configurada' : 'AUSENTE'})`)
})
