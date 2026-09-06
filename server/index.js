// Backend mínimo que expone la clave de Google Cloud solo en el servidor.
// El frontend nunca debe conocer GOOGLE_API_KEY: siempre habla con este proxy.
import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json({ limit: '15mb' })) // el audio en base64 puede pesar varios MB

const PORT = process.env.VOICE_SERVER_PORT ? Number(process.env.VOICE_SERVER_PORT) : 8787
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

app.get('/api/voice/status', (_req, res) => {
  res.json({ configured: Boolean(GOOGLE_API_KEY) })
})

app.post('/api/voice/tts', async (req, res) => {
  if (!GOOGLE_API_KEY) return res.status(503).json({ error: 'GOOGLE_API_KEY no configurada en el servidor' })
  const { text, ssml, languageCode = 'es-US', voiceName = 'es-US-Neural2-B' } = req.body ?? {}
  if (!text && !ssml) return res.status(400).json({ error: 'Falta "text" o "ssml"' })

  try {
    const googleRes = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: ssml ? { ssml } : { text },
        voice: { languageCode, name: voiceName },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    })
    const data = await googleRes.json()
    if (!googleRes.ok) return res.status(googleRes.status).json({ error: data.error?.message || 'Error de Google TTS' })
    res.json({ audioContent: data.audioContent })
  } catch (err) {
    res.status(502).json({ error: 'No se pudo contactar a Google TTS', detail: String(err) })
  }
})

app.post('/api/voice/stt', async (req, res) => {
  if (!GOOGLE_API_KEY) return res.status(503).json({ error: 'GOOGLE_API_KEY no configurada en el servidor' })
  const { audioContent, languageCode = 'es-US', encoding = 'WEBM_OPUS', sampleRateHertz = 48000 } = req.body ?? {}
  if (!audioContent) return res.status(400).json({ error: 'Falta "audioContent" (base64)' })

  try {
    const googleRes = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          encoding,
          sampleRateHertz,
          languageCode,
          model: 'latest_short',
          enableAutomaticPunctuation: true,
        },
        audio: { content: audioContent },
      }),
    })
    const data = await googleRes.json()
    if (!googleRes.ok) return res.status(googleRes.status).json({ error: data.error?.message || 'Error de Google STT' })
    const best = data.results?.[0]?.alternatives?.[0]
    res.json({ transcript: best?.transcript ?? '', confidence: best?.confidence ?? 0 })
  } catch (err) {
    res.status(502).json({ error: 'No se pudo contactar a Google STT', detail: String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`[voice-server] escuchando en http://localhost:${PORT} (Google API key ${GOOGLE_API_KEY ? 'configurada' : 'AUSENTE'})`)
})
