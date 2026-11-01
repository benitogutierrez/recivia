# Instrucciones para agentes

> Las instrucciones específicas de Claude Code viven en [CLAUDE.md](CLAUDE.md), que a su vez importa este archivo.

## Git and Commits

- Cada vez que completes con éxito una tarea lógica o resuelvas un requerimiento, debes hacer un commit automático con los cambios.
- No esperes a que el usuario te lo pida de forma explícita.
- Genera un mensaje de commit descriptivo y conciso siguiendo el estándar de Conventional Commits (por ejemplo: `feat: agrega validación de login` o `fix: corrige caída al iniciar sesión`), pero escrito en español. No consideres ajustes de archivos de caché en el mensaje del commit.
- Ejecuta los comandos `git add .` y `git commit -m "mensaje"` de manera autónoma.
- Al finalizar haz un `git push` a la rama remota en GitHub.
