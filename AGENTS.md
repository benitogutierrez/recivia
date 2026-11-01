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
