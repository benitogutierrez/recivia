# Recivia

Plataforma para crear y publicar **landings de recepción** (formularios o recepción por voz), pensada para empresas en Chile. Incluye un panel de administración multiempresa, un constructor de páginas con bloques, un constructor de formularios, automatizaciones (guardar registro, correo, WhatsApp), analytics, auditoría y un **asistente de voz** que recibe al visitante conversando en español.

> Estado: el frontend funciona de forma autónoma con una "base de datos" simulada en `localStorage`. Solo el asistente de voz necesita un backend real (un proxy Node pequeño).

## Contenido

- [Stack](#stack)
- [Inicio rápido](#inicio-rápido)
- [Variables de entorno](#variables-de-entorno)
- [Scripts](#scripts)
- [Funcionalidades](#funcionalidades)
- [Rutas](#rutas)
- [Roles y permisos](#roles-y-permisos)
- [Asistente de voz](#asistente-de-voz)
- [API del servidor de voz](#api-del-servidor-de-voz)
- [Arquitectura y estructura](#arquitectura-y-estructura)
- [Modelo de datos](#modelo-de-datos)
- [Despliegue](#despliegue)
- [Limitaciones conocidas](#limitaciones-conocidas)

## Stack

| Capa | Tecnología |
|------|-----------|
| UI | React 18, TypeScript (strict), Tailwind CSS 3, lucide-react |
| Routing | react-router-dom 6 |
| Estado / persistencia | zustand + middleware `persist` (localStorage, clave `recivia-db-v3`) |
| Drag & drop | @dnd-kit (core, sortable, utilities) |
| Build | Vite 6 |
| Servidor de voz | Node (ESM) + Express 4 + cors + dotenv |
| Servicios externos | ElevenLabs (TTS y STT), Anthropic Claude Haiku 4.5 (extracción de nombre/anfitrión) |

## Inicio rápido

Requisitos: Node 18+ (el servidor usa `fetch`, `FormData` y `Blob` globales) y npm.

```bash
npm install
cp .env.example .env      # opcional: solo necesario para la voz
npm run dev:all           # web + servidor de voz
```

- Web: http://localhost:5173
- Servidor de voz: http://localhost:8787

Si solo necesitas el panel y los formularios, `npm run dev` basta.

**Login de demo** (cualquier contraseña sirve):

| Correo | Rol |
|--------|-----|
| `benito@recivia.cl` | Super Admin |
| `maria@bata.cl` | Admin |

## Variables de entorno

Se leen desde `.env` (ver `.env.example`). Todas son del servidor excepto `VITE_VOICE_SERVER_URL`.

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `ELEVENLABS_API_KEY` | Para voz | Clave de ElevenLabs. Sin ella `/tts` y `/stt` responden 503. |
| `ELEVENLABS_VOICE_ID` | No | Voz por defecto. Si falta, se usa una voz multilingüe incluida en el código. |
| `ANTHROPIC_API_KEY` | No | Habilita la extracción con Claude. Sin ella el asistente cae a una heurística de texto más simple. |
| `VOICE_SERVER_PORT` | No | Puerto local del servidor de voz (default `8787`). En hosting se usa `PORT`. |
| `VITE_VOICE_SERVER_URL` | Solo producción | URL absoluta del servidor de voz desplegado. En local queda vacía y se usa el proxy de Vite. |
| `VOICE_SERVER_URL` | No | Destino del proxy de Vite para `/api/voice` (default `http://localhost:8787`). |

Las claves nunca llegan al navegador: solo las lee `server/index.js`.

## Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Vite en modo desarrollo (puerto 5173, o `PORT`). Proxy `/api/voice` → servidor de voz. |
| `npm run server` | Servidor de voz (`node server/index.js`). |
| `npm run dev:all` | Ambos a la vez con `concurrently`. |
| `npm run build` | Chequeo de tipos (`tsc -b`) y build de producción con Vite. |
| `npm run preview` | Sirve el build localmente. |

No hay suite de tests ni linter configurados.

## Funcionalidades

- **Resumen (Dashboard):** métricas y actividad reciente.
- **Empresas:** alta, edición y gestión de empresas (multiempresa).
- **Landings:** crear desde plantilla, estados `Borrador` / `Publicada` / `Despublicada`, versiones, y modo `form` o `voice`.
- **Constructor de páginas (Builder):** edición visual con drag & drop de bloques: `heading`, `text`, `image`, `logo`, `video`, `button`, `icon`, `banner`, `divider`, `spacer`, `section`, `columns` y `form`. Soporta variables como `{{landing.title}}`.
- **Constructor de formularios:** campos `text`, `email`, `tel`, `rut`, `number`, `date`, `select`, `radio`, `checkbox`, `textarea`, `hidden`, con validaciones por campo (incluye RUT chileno).
- **Temas:** Corporativo, Minimal y Comercial (color primario, fondo, tipografía, radios y espaciado).
- **Templates:** Recepción de convenio, Formulario simple y Campaña comercial.
- **Registros (Submissions):** listado de envíos de los visitantes.
- **Automatizaciones:** acciones por landing: `save_record`, `send_email`, `send_whatsapp` (Meta Cloud, Twilio, 360dialog) y `show_confirmation`. Los envíos quedan en un log de notificaciones.
- **Usuarios y roles:** ver [Roles y permisos](#roles-y-permisos).
- **Analytics, Configuración y Auditoría:** estadísticas, ajustes y registro de acciones (login, ediciones, etc.).
- **Notificaciones:** campana con el log de envíos.
- **Landing pública:** cualquier landing publicada se sirve en `/p/:id` sin autenticación.

## Rutas

| Ruta | Página | Acceso |
|------|--------|--------|
| `/login` | Login | Público |
| `/p/:id` | Landing pública | Público |
| `/` | Resumen | Autenticado |
| `/empresas` | Empresas | Autenticado |
| `/landings` | Landings | Autenticado |
| `/templates` | Templates | Autenticado |
| `/registros` | Registros | Autenticado |
| `/automatizaciones` | Automatizaciones | Autenticado |
| `/usuarios` | Usuarios | Autenticado |
| `/analytics` | Analytics | Autenticado |
| `/configuracion` | Configuración | Autenticado |
| `/audit` | Auditoría | Autenticado |
| `/builder/:id` | Constructor de página | Autenticado |
| `/formulario/:id` | Constructor de formulario | Autenticado |

Cualquier otra ruta redirige a `/`. `RequireAuth` (en `src/App.tsx`) redirige a `/login` si no hay sesión.

## Roles y permisos

Definidos en `src/lib/permissions.ts`:

| Permiso | Super Admin | Admin | Editor | Viewer |
|---------|:-:|:-:|:-:|:-:|
| `manage_companies` | ✓ | ✓ | | |
| `manage_landings` | ✓ | ✓ | | |
| `edit_landings` | ✓ | ✓ | ✓ | |
| `manage_users` | ✓ | | | |
| `view_records` | ✓ | ✓ | ✓ | ✓ |
| `manage_automations` | ✓ | ✓ | | |

La navegación lateral (`Shell`) cambia según el rol.

## Asistente de voz

Una landing en modo `voice` recibe al visitante hablando, en lugar de mostrar un formulario. Flujo:

1. Saludo → pregunta a quién visita → pregunta su nombre → despedida y guardado del registro.
2. Cada turno de escucha emite un único evento `EXTRACTED`: la persona puede dar anfitrión, nombre, ambos o ninguno, en cualquier orden. La máquina decide el siguiente paso según lo que ya se sabe, no según la pregunta hecha.
3. Reintentos limitados (`MAX_RETRIES = 2`).
4. Si no hay micrófono, permiso o soporte, y `fallbackToForm` está activo, cae al formulario clásico.

**Máquina de estados** (`src/lib/voice/conversationMachine.ts`, función pura `transition`):
`idle → greeting → ask_host → listening_host → ask_name → listening_name → processing → farewell → done`, más `need_permission` y `unsupported`.

**Motor de voz** (`src/lib/voice/googleVoiceEngine.ts`; el nombre es histórico, hoy usa ElevenLabs):

- **Escuchar (STT):** reconocimiento nativo del navegador como método principal (Chrome/Edge): instantáneo y con detección de fin de habla propia. Subtítulos en vivo vía `onInterim`. Respaldo: grabar audio y enviarlo a `/api/voice/stt` (ElevenLabs Scribe) en navegadores sin soporte (p. ej. Firefox).
- **Hablar (TTS):** ElevenLabs (`eleven_multilingual_v2`) por calidad, con fallback a la síntesis nativa del navegador si el proxy falla. Se precargan los audios del guion para reducir la latencia.
- **Entender:** `/api/voice/extract` usa Claude Haiku 4.5 para sacar `name` y `host` de frases libres ("soy Benito y vengo a visitar a Pedro Pascal"). Sin `ANTHROPIC_API_KEY` se usa una heurística local.

**Configuración por landing** (`VoiceAssistantConfig`): `enabled`, `languageCode` (p. ej. `es-CL`), `voiceName` (voice_id), `greeting`, `askHostQuestion`, `askNameQuestion`, `farewell`, `fallbackToForm`. Las voces disponibles están en `src/lib/voice/elevenLabsVoices.ts`.

**UI** (`src/components/voice/`): `VoiceAssistant` (orquestador), `SoundWave` (onda animada), `AssistantAvatar`, `TranscriptCaption`. El estilo imita el modo de voz de ChatGPT.

## API del servidor de voz

`server/index.js`, Express, CORS abierto, JSON hasta 15 MB.

| Método | Ruta | Cuerpo | Respuesta |
|--------|------|--------|-----------|
| GET | `/api/voice/status` | – | `{ configured, extract }` (booleanos según las claves presentes) |
| POST | `/api/voice/tts` | `{ text \| ssml, voiceName? }` | `{ audioContent }` (MP3 en base64) |
| POST | `/api/voice/stt` | `{ audioContent }` (base64, webm) | `{ transcript, confidence }` |
| POST | `/api/voice/extract` | `{ utterance, known?: { name, host } }` | `{ name, host }` (cada uno `string \| null`) |

Errores: `400` entrada inválida, `503` clave no configurada, `502` fallo al contactar al proveedor; si el proveedor responde con error, se propaga su código.

## Arquitectura y estructura

```
server/index.js          Proxy de voz (ElevenLabs + Claude). Guarda las claves.
src/
  main.tsx, App.tsx      Arranque y rutas
  types.ts               Todos los tipos del dominio
  index.css              Tailwind
  pages/                 Una pantalla por ruta
  components/
    Shell.tsx            Layout con navegación según rol
    BlockRenderer.tsx    Dibuja los bloques de una landing
    FormRenderer.tsx     Dibuja y valida el formulario
    modals/              CompanyModal, NewLandingModal
    ui/                  Modal, ActionMenu, IconButton, Avatar, StatusPill, Toast, ...
    voice/               Interfaz del asistente de voz
  lib/
    permissions.ts       Matriz rol → permisos
    utils.ts, toast.ts   Utilidades (uuid, fechas, campos) y toasts
    voice/               Máquina de estados, motor de voz, catálogo de voces
  services/              Capa de datos (única que habla con el store)
    store.ts             Estado zustand + persistencia + datos semilla
    auth, companies, landings, forms, pageBuilder, submissions,
    automations, templates, users, notifications, analytics, audit
    index.ts             Reexporta los servicios
```

**Regla clave:** los componentes de UI nunca importan `store.ts`; solo hablan con `src/services/*`. Así la base simulada en localStorage se puede sustituir por llamadas HTTP reales sin tocar páginas ni componentes. Los hooks `useDb` reactivan la UI ante cambios del store.

## Modelo de datos

Definido en `src/types.ts`. Entidades principales:

- `AppUser` (`Role`, `companyId`, estado) y `Session`
- `Company`
- `Landing`: bloques (`PageBlock[]`), `Theme`, `FormDef`, `AutomationConfig`, `VoiceAssistantConfig`, `LandingMode`, `LandingStatus`, `LandingVersion[]`
- `FormDef` → `FieldDef[]` con `FieldValidation`
- `AutomationConfig` con `EmailConfig`, `WhatsAppConfig`
- `Submission`, `NotificationLog`, `AuditEntry`, `Template`
- `Db`: raíz que agrupa todo lo anterior

La persistencia usa la clave `recivia-db-v3` en localStorage. Para reiniciar los datos de demo, bórrala desde las DevTools del navegador (Application → Local Storage).

## Despliegue

El frontend y el servidor de voz se despliegan por separado.

- **Servidor de voz:** `render.yaml` define un servicio web Node en Render (plan free, `npm install` + `node server/index.js`). Configura `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` y `ANTHROPIC_API_KEY` en el panel (están marcadas `sync: false`). Render aporta `PORT`.
- **Frontend:** build estático con `npm run build` (carpeta `dist/`), por ejemplo en Cloudflare Pages. Como ahí no se puede proxiar hacia dominios externos, define `VITE_VOICE_SERVER_URL` con la URL del servicio de voz al compilar; el navegador lo llamará directo vía CORS.

## Limitaciones conocidas

- **Sin backend real para los datos:** todo vive en el localStorage de cada navegador. Los registros no se comparten entre dispositivos, y una landing pública solo funciona en el navegador donde se creó.
- **Login de demo:** solo se valida el correo; cualquier contraseña es válida. No usar en producción.
- **Correo y WhatsApp** están modelados como configuración y log; no hay envío real contra los proveedores.
- **CORS abierto** y sin autenticación ni rate limit en el servidor de voz: cualquiera que conozca su URL puede gastar tus créditos de ElevenLabs y Anthropic. Restringe el origen y añade protección antes de exponerlo.
- Sin tests ni linter.
- El reconocimiento de voz nativo funciona mejor en Chrome/Edge.
