# Contribuir

## Entorno local

Requisitos: Node 18+ y npm. Pasos en [README.md](README.md#inicio-rápido).

```bash
npm install
cp .env.example .env   # solo para la voz
npm run dev:all
```

## Flujo

1. Crea una rama desde `main` (`feat/...`, `fix/...`).
2. Haz cambios pequeños y enfocados. Respeta las convenciones de [AGENTS.md](AGENTS.md).
3. Commits en [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) **en español**: `feat: agrega validación de login`, `fix: corrige caída al iniciar sesión`.
4. Actualiza `[Sin publicar]` en [CHANGELOG.md](CHANGELOG.md).
5. Abre un PR hacia `main`.

## Checklist del PR

- [ ] `npm run build` pasa.
- [ ] `CHANGELOG.md` actualizado.
- [ ] Sin secretos ni `.env` en el diff.
- [ ] Si cambia el modelo persistido, hay migración (clave `recivia-db-v3`).
- [ ] Si cambia el servidor de voz, se actualiza la tabla de la API en el README.

No hay tests ni linter todavía; verifica a mano el flujo que tocaste.
