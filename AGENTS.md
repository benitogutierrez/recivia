# Instrucciones para agentes

> Las instrucciones específicas de Claude Code viven en [CLAUDE.md](CLAUDE.md), que a su vez importa este archivo.

## Git and Commits

- Cada vez que completes con éxito una tarea lógica o resuelvas un requerimiento, debes hacer un commit automático con los cambios.
- No esperes a que el usuario te lo pida de forma explícita.
- Genera un mensaje de commit descriptivo y conciso siguiendo el estándar de Conventional Commits (por ejemplo: `feat: agrega validación de login` o `fix: corrige caída al iniciar sesión`), pero escrito en español. No consideres ajustes de archivos de caché en el mensaje del commit.
- Ejecuta los comandos `git add .` y `git commit -m "mensaje"` de manera autónoma.
- Al finalizar haz un `git push` a la rama remota en GitHub.

## Changelog

- En cada tarea que haga commit, actualiza `CHANGELOG.md` en la sección `[Sin publicar]` antes de `git add .`, para que el cambio quede en el mismo commit.
- Clasifica la entrada en Agregado, Cambiado, Obsoleto, Eliminado, Corregido o Seguridad.
- Escribe la entrada en español, desde el punto de vista del usuario (qué cambió para él), no copiando el mensaje del commit.
- Marca explícitamente los cambios que rompen compatibilidad (variables de entorno, clave de `localStorage`, API del servidor de voz).
- No registres cambios de caché, formato ni documentación menor sin impacto.
- Al publicar una versión, mueve lo de `[Sin publicar]` a una sección nueva `[x.y.z] - AAAA-MM-DD`.

## Proyecto

Recivia: landings de recepción (formulario o voz) con panel multiempresa. React 18 + TypeScript strict + Tailwind + Vite; servidor de voz Node/Express en `server/index.js`. Detalle en [README.md](README.md) y [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Comandos

- `npm run dev:all`: web (5173) + servidor de voz (8787).
- `npm run dev` / `npm run server`: cada parte por separado.
- `npm run build`: `tsc -b` + build de Vite. **Es la única verificación automática**; no hay tests ni linter, no los inventes.

### Convenciones

- Los componentes de UI nunca importan `src/services/store.ts`; solo `src/services/*`.
- Tipos del dominio en `src/types.ts`. Reutiliza `src/components/ui/*` antes de crear componentes.
- Interfaz y textos en español (Chile).

### Cuidado

- No cambies la clave `recivia-db-v3` de localStorage sin migración: borra los datos de los usuarios.
- `server/index.js` gasta créditos de ElevenLabs y Anthropic y tiene CORS abierto; no agregues endpoints sin pensar en abuso (ver [SECURITY.md](SECURITY.md)).
- Nunca commitees `.env` ni claves; las variables están en `.env.example`.

### Antes de commitear

- Corre `npm run build` y no commitees si falla.
- Un push a `main` puede disparar deploy en Render ([docs/DEPLOY.md](docs/DEPLOY.md)): avisa al usuario antes de pushear a `main`.
