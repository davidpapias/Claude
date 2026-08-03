# App móvil

Expo Router + React Native + TypeScript estricto.

```bash
pnpm install          # desde la raíz del monorepo
pnpm mobile           # expo start
```

Requiere `.env` en la raíz con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Estructura

```
app/                  Rutas (Expo Router)
  index.tsx           Splash y decisión de ruta
  welcome, sign-in, sign-up, reset-password
  onboarding/[step]   Los 11 pasos, reanudables
  (tabs)/             Conocer · Conversaciones · Mi perfil
  profile/[id]        Perfil completo
  match/[id]          Pantalla de match con iniciadores
  chat/[id]           Chat en tiempo real
  match-details       Retroalimentación privada, seguridad, deshacer match, bloquear
  report/[userId]     Reporte con categorías
  settings/           Preferencias, privacidad, seguridad, bloqueos, ayuda, borrar cuenta
src/components/ui.tsx Sistema de diseño
src/lib/              supabase, api, sesión, onboarding, analítica, errores
```

## Reglas

- Las pantallas no consultan la base directamente: todo pasa por `src/lib/api.ts`.
- Sin lógica de negocio en las vistas: el algoritmo vive en `@circulo/matching`.
- Cada pantalla contempla carga, vacío, error y sin conexión.
