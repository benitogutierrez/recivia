# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).

## [Sin publicar]

### Agregado
- `README.md` con la documentación del proyecto.
- `AGENTS.md` y `CLAUDE.md` con las reglas de commits para agentes.
- `CHANGELOG.md`.

## [1.0.0]

### Agregado
- Comprensión real con LLM (Claude Haiku) para extraer nombre y anfitrión en el asistente de voz.
- Precarga del audio del guion de voz y logo de la empresa sobre el título.

### Cambiado
- Conversación por voz más rápida y natural; rediseño de la UI al estilo del modo de voz de ChatGPT.

### Corregido
- Recorte del primer audio.
- Fallo de timing en el permiso del micrófono.
- Confiabilidad del reconocimiento de voz.
