# Seguridad

## Estado actual (no apto para datos reales)

- **Login de demo:** solo se valida el correo; cualquier contraseña sirve.
- **Datos en `localStorage`:** sin cifrar y sin backend; cualquiera con acceso al navegador los ve.
- **Servidor de voz** (`server/index.js`): CORS abierto, sin autenticación ni rate limit. Quien conozca su URL puede gastar créditos de ElevenLabs y Anthropic.
- **Correo y WhatsApp:** solo configuración y log, sin envío real.

## Antes de producción real

1. Autenticación real y sesiones en el servidor.
2. Backend y base de datos para los registros (hoy son por navegador).
3. Restringir CORS al dominio del frontend en el servidor de voz.
4. Rate limit y límite de tamaño por IP en `/tts`, `/stt` y `/extract`.
5. Rotar las claves si alguna se filtró; nunca exponerlas en el frontend.

## Secretos

`.env` está en `.gitignore`. Las claves viven en el panel de Render (`sync: false` en `render.yaml`). Si una clave se commitea, revócala de inmediato; borrar el commit no basta.

## Reportar una vulnerabilidad

Escribe en privado al responsable del repositorio (benitogutierrez en GitHub) con los pasos para reproducirla. No abras un issue público. Responderemos lo antes posible.
