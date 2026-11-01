# Despliegue

El frontend y el servidor de voz se despliegan por separado.

- **Servidor de voz:** `render.yaml` define un servicio web Node en Render (plan free, `npm install` + `node server/index.js`). Configura `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` y `ANTHROPIC_API_KEY` en el panel (están marcadas `sync: false`). Render aporta `PORT`.
- **Frontend:** build estático con `npm run build` (carpeta `dist/`), por ejemplo en Cloudflare Pages. Como ahí no se puede proxiar hacia dominios externos, define `VITE_VOICE_SERVER_URL` con la URL del servicio de voz al compilar; el navegador lo llamará directo vía CORS.

## Checklist antes de desplegar

1. `npm run build` pasa sin errores de tipos.
2. `CHANGELOG.md` tiene la entrada del cambio (y, si es release, la versión con fecha).
3. No hay secretos en el diff (`.env` está ignorado; verifica `git diff --staged`).
4. Variables del servicio de voz configuradas en Render: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ANTHROPIC_API_KEY`.

## Verificación posterior

- `GET <URL-del-servicio>/api/voice/status` debe responder `{ "configured": true, "extract": true }`.
- Abrir una landing en modo voz y completar una conversación de prueba.

## Despliegue automático y rollback

- Confirma en el panel de Render si **Auto-Deploy** está activo para la rama `main`: si lo está, cada push a `main` despliega.
- Rollback: en Render, *Events → Rollback* al deploy anterior, o `git revert <commit>` y push a `main`.
- En el plan free, Render duerme el servicio tras inactividad; la primera petición de voz puede tardar.
