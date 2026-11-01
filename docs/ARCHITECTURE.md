# Arquitectura

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

Ver también [Modelo de datos](../README.md#modelo-de-datos) y [Asistente de voz](../README.md#asistente-de-voz).
