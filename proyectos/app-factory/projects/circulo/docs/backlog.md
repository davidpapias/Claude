# Backlog, riesgos y siguientes pasos

## Agentes y responsabilidades (cómo se dividió el trabajo)

| Rol | Entregable en este repositorio |
|-----|--------------------------------|
| Orquestador | Orden de fases, integración, dos revisiones globales |
| Producto | `product-spec.md`, `mvp-scope.md`, criterios de aceptación |
| UX/UI | `user-flows.md`, `design-system.md`, `components/ui.tsx` |
| Arquitectura | `architecture.md`, `decisions/`, límites del monorepo |
| Backend/datos | `supabase/migrations`, `supabase/seed`, RPC |
| Móvil | `apps/mobile` |
| Algoritmo | `packages/matching` + 35 pruebas + herramienta `compare` |
| Trust & Safety | `security-model.md`, `threat-model.md`, bloqueos, reportes, límites de tasa |
| QA | `supabase/tests` (36 aserciones), pruebas de validación y algoritmo |
| DevOps | `.github/workflows/ci.yml`, `.env.example`, scripts |

## Estado por fase

| Fase | Estado | Verificación |
|------|--------|--------------|
| 1 Definición | Completa | Documentos en `docs/` |
| 2 Base técnica | Completa | `pnpm install`, `pnpm test` |
| 3 Datos y seguridad | Completa y verificada contra Supabase real | 36 aserciones SQL + camino dorado probado vía API REST/Auth reales (ver ronda 3) |
| 4 App móvil | Completa; bundle real exportado para iOS y Android | `expo export --platform ios/android` empaqueta 1064/1061 módulos sin errores |
| 5 Panel | Completa; build de producción verificado | `next build` genera las 9 rutas sin errores |
| 6 Calidad | Parcial | Unitarias, integración de BD, typecheck, build/bundle real y camino dorado contra Supabase real sí; e2e y accesibilidad manual de la UI pendientes |
| 7 Revisión 1 | Hecha | Ver correcciones abajo |
| 8 Revisión 2 | Hecha (typecheck + build + bundle) | Ver correcciones abajo |
| 9 Revisión 3 | Hecha (Supabase local real) | Ver correcciones abajo |

### Correcciones de la revisión 1

- El guard de columnas de `profiles` bloqueaba también las escrituras del sistema (recomputar
  completitud, eliminar cuenta, moderar). Se añadió una bandera transaccional que solo las
  funciones `SECURITY DEFINER` pueden activar.
- `moderate_set_account_status` insertaba texto en una columna de enum.
- La tarjeta de descubrimiento no mostraba foto ni nombre porque `discovery_candidates` no los
  entrega por diseño; ahora la tarjeta pide el perfil público del candidato actual.
- La clave de idempotencia se construía con una cadena que no era un UUID válido.

### Correcciones de la revisión 2

- `pnpm --filter @circulo/mobile typecheck` fallaba: varios paquetes de Expo/React Navigation
  (`expo-router`, `react-native-safe-area-context`, `react-native-screens`, `@react-navigation/*`,
  `expo-*`) no declaran `@types/react` como dependencia. Con dos versiones de React en el
  monorepo (18 en móvil, 19 en el panel), pnpm resolvía ese tipo a través de una carpeta
  "fantasma" compartida y elegía la versión 19, rompiendo el tipado de componentes JSX de móvil.
  Se corrigió con `pnpm.packageExtensions` en el `package.json` raíz, que declara el peer que
  faltaba para que cada paquete resuelva la versión correcta.
- `apps/admin/app/reports/[id]/page.tsx` no compilaba: el helper `run()` esperaba un
  `Promise<{ error }>`, pero `supabase.rpc(...)` devuelve un `PostgrestFilterBuilder` (thenable,
  no un `Promise` completo). Se amplió el tipo del parámetro a `PromiseLike<{ error }>`.
- `packages/ui` era un paquete vacío (carpetas creadas al inicio del monorepo, nunca usadas: el
  sistema de diseño se implementó directamente en `apps/mobile/src/components/ui.tsx` y
  `apps/admin/app/globals.css`, según `architecture.md`). Se eliminó en vez de completarlo.
- `next build` del panel fallaba con `MissingEnvError` al prerenderizar: Next.js necesita las
  variables `NEXT_PUBLIC_*` presentes en tiempo de build porque las inyecta en el bundle. Es
  comportamiento esperado, no un bug; se documentó en `apps/admin/README.md` y se añadió el build
  a `ci.yml` con valores placeholder.
- `expo export` (intento de generar el bundle real de iOS/Android, sin simulador) reveló tres
  dependencias reales que faltaban y que un `npm`/`yarn` con hoisting habría ocultado:
  `@expo/metro-runtime`, `@babel/runtime`, y `whatwg-fetch` (esta última corregida vía
  `pnpm.packageExtensions` sobre `@expo/metro-runtime`, que no la declara en su propio
  `package.json`). Se añadieron como dependencias directas donde correspondía.
- `metro.config.js` tenía `resolver.disableHierarchicalLookup = true`, una opción pensada para
  monorepos con hoisting (npm/yarn) que en pnpm le impide a Metro subir por los symlinks reales
  de cada paquete para encontrar sus propias dependencias. Se puso en `false` y se activó
  `unstable_enableSymlinks`.
- `packages/matching` importaba con extensión `.js` (`'./geo.js'`) siguiendo la convención de
  TypeScript para ESM, que `tsc` remapea a `.ts` pero que Metro no entiende. Se quitaron las
  extensiones de los imports relativos; `tsc` y Vitest siguen resolviendo igual.
- Verificado tras las correcciones: `pnpm typecheck` limpio en los 6 paquetes, `pnpm test`
  (47 pruebas) y `supabase/tests/run.sh` (36 aserciones) en verde, `next build` genera las 9
  rutas del panel, y `expo export --platform ios` / `--platform android` empaquetan el bundle
  completo (1064 y 1061 módulos) sin errores de resolución.

### Correcciones de la revisión 3 (Supabase local real, no solo psql)

Se levantó el stack completo de Supabase con Docker (`supabase start`: Postgres 17, Auth, PostgREST,
Storage, Realtime, Studio) y se probó el camino dorado con llamadas HTTP reales a la API, con las
cuentas de demostración, exactamente como lo haría la app.

- Las 8 migraciones se aplicaron limpio contra el Postgres real de Supabase (no solo contra el
  Postgres genérico usado en `supabase/tests`), y el seed cargó sin errores.
- **Bug real encontrado:** las cuentas de demostración no podían iniciar sesión. El seed insertaba
  filas en `auth.users` solo con `id` y `email` (sin contraseña), y `create-demo-users.sh` intentaba
  fijarla después vía la Admin API — pero como el usuario ya existía, esa llamada fallaba
  silenciosamente (el script no revisaba el código de estado HTTP de `curl`, así que siempre
  imprimía "listo" aunque la petición hubiera fallado). Confirmado con un login real contra la API:
  devolvía `invalid_credentials`.
  **Corrección:** `generate.mjs` ahora inserta filas completas en `auth.users` (con
  `encrypted_password` calculado con `pgcrypto`, `email_confirmed_at`, `aud`/`role` correctos) y su
  fila correspondiente en `auth.identities`, todo en un solo paso dentro de `seed.sql`. Se eliminó
  `create-demo-users.sh`, que ya no hace falta.
- Verificado con peticiones HTTP reales tras la corrección: login con `ana@demo.circulo.app` emite
  un JWT válido; `discovery_candidates` devuelve candidatos reales; dos "me interesa" mutuos
  (Ana ↔ Caro) crean exactamente un match y una conversación; un mensaje enviado por Ana es
  invisible e imposible de escribir para un tercero (Beto) ajeno al match (`42501`); una cuenta
  normal no puede leer la cola de reportes (`[]`) pero un moderador sí; un reporte real genera una
  fila en `audit_logs`.

### Correcciones de la revisión 4 (cierre de riesgos del backlog)

- **Riesgo #6 (verificación de correo) cerrado.** `auth.email.enable_confirmations` pasó a
  `true`. Ajustado el flujo de registro: `signUp` ya no asume que hay sesión inmediata (con
  confirmación obligatoria no la hay); si no hay sesión, la app muestra "revisa tu correo" en
  vez de entrar a onboarding sin usuario autenticado. Se añadió el mensaje de error
  `email_not_confirmed` a `humanError()`. Verificado de extremo a extremo contra Supabase real:
  registro → correo real capturado en Mailpit → login antes de confirmar rechazado
  (`email_not_confirmed`) → clic en el enlace real del correo → login exitoso después.
  **Pendiente, documentado y no bloqueante:** el enlace de confirmación redirige a una URL web
  (`site_url` en `config.toml`) en vez de al esquema `circulo://` de la app. Por ahora el usuario
  confirma en el navegador y vuelve a la app para iniciar sesión a mano; para que el enlace loguee
  automáticamente haría falta una pantalla de deep link que capture el token de la URL, fuera de
  alcance de este cierre de riesgo.
- **Riesgo #7 (E2E) parcialmente cerrado.** Se agregó una suite de Playwright real para el panel
  (`apps/admin/e2e`) que corre contra el build de producción y verifica: la puerta de acceso pide
  credenciales cuando no hay sesión, un login con credenciales inválidas muestra el error, y las
  rutas protegidas no filtran contenido antes de autenticar. Ver `apps/admin/README.md` para
  correrla. La accesibilidad manual (VoiceOver, Dynamic Type) sigue pendiente porque requiere un
  dispositivo real.
- **Riesgo #2 (push) evaluado y dejado fuera a propósito.** Implementar el envío requiere
  credenciales de Expo Push y un dispositivo físico para confirmar que una notificación realmente
  llega; construirlo sin poder verificarlo violaría la regla de no afirmar que algo funciona sin
  probarlo. Se mantiene como está: la tabla `notifications` y las preferencias por categoría ya
  existen y ya se pueblan correctamente (verificado en la revisión 3), solo falta el repartidor.

## Riesgos abiertos

| # | Riesgo | Impacto | Mitigación propuesta |
|---|--------|---------|----------------------|
| 1 | App móvil y panel sin ejecutar en un simulador/navegador real | El backend fue probado de extremo a extremo por API, pero no se probó la UI en pantalla | Arrancar Expo (`pnpm mobile`) y el panel (`pnpm admin`) y probar el camino dorado visualmente |
| 2 | Sin envío real de notificaciones push | Menor reenganche | Expo Notifications en V1.1, con un dispositivo real para verificar la entrega; las preferencias ya existen |
| 3 | Moderación de fotos manual | Cuello de botella con volumen | Cola priorizada y revisión automática asistida |
| 4 | Ranking en cliente | Un cliente modificado reordena lo que ve | Condición de salida en ADR 0003 |
| 5 | Densidad baja fuera de CDMX | Estados vacíos frecuentes | Ampliar distancia sugerida y lanzar por ciudad |
| 6 | El enlace de confirmación de correo no hace login automático en la app | Fricción extra: confirmar y volver a iniciar sesión a mano | Pantalla de deep link (`circulo://auth/confirm`) que capture el token de la URL |
| 7 | Accesibilidad (VoiceOver, Dynamic Type) sin probar en dispositivo real | Regresiones de accesibilidad no detectadas | Pruebas manuales en dispositivo antes del lanzamiento |
| 8 | Peer warning `react-dom` en `apps/mobile` | Cosmético: móvil no usa react-dom, viene de una dependencia fantasma de `expo-router` en el contexto web | Ninguna acción necesaria; no afecta el bundle nativo, ya verificado |

## Siguientes funciones (no en V1)

Verificación con selfie · modo viaje · filtros premium · recordatorios de conversación entregados ·
exportación a archivo · reacciones en el chat conectadas a la UI · fotos en el chat · más de una
foto de perfil · idiomas editables después del onboarding · panel con tasas por mil.
