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
| 3 Datos y seguridad | Completa y verificada | 36 aserciones SQL pasan |
| 4 App móvil | Completa y con `typecheck` verificado | `pnpm --filter @circulo/mobile typecheck` limpio; falta correr en simulador |
| 5 Panel | Completa y con `typecheck` verificado | `pnpm --filter @circulo/admin typecheck` limpio; falta `pnpm --filter @circulo/admin dev` en navegador |
| 6 Calidad | Parcial | Unitarias, integración de BD y typecheck de todo el monorepo sí; e2e y accesibilidad manual pendientes |
| 7 Revisión 1 | Hecha | Ver correcciones abajo |
| 8 Revisión 2 | Hecha (typecheck) | Ver correcciones abajo; falta ejecutar la app en simulador/navegador |

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
- Verificado tras las correcciones: `pnpm typecheck` limpio en los 6 paquetes del monorepo,
  `pnpm test` (47 pruebas) y `supabase/tests/run.sh` (36 aserciones) siguen en verde.

## Riesgos abiertos

| # | Riesgo | Impacto | Mitigación propuesta |
|---|--------|---------|----------------------|
| 1 | App móvil y panel sin ejecutar en simulador/navegador | El typecheck no detecta errores de runtime ni de UI | Arrancar Expo (`pnpm mobile`) y el panel (`pnpm admin`) y probar el camino dorado |
| 2 | Sin envío real de notificaciones push | Menor reenganche | Expo Notifications en V1.1; las preferencias ya existen |
| 3 | Moderación de fotos manual | Cuello de botella con volumen | Cola priorizada y revisión automática asistida |
| 4 | Ranking en cliente | Un cliente modificado reordena lo que ve | Condición de salida en ADR 0003 |
| 5 | Densidad baja fuera de CDMX | Estados vacíos frecuentes | Ampliar distancia sugerida y lanzar por ciudad |
| 6 | Sin verificación de correo obligatoria | Cuentas desechables | Activar confirmación en Supabase Auth antes del lanzamiento |
| 7 | E2E y accesibilidad sin ejecutar | Regresiones no detectadas | Playwright para el panel y pruebas manuales con VoiceOver |
| 8 | Peer warning `react-dom` en `apps/mobile` | Cosmético: móvil no usa react-dom, viene de una dependencia fantasma de `expo-router` en el contexto web | Ninguna acción necesaria; no afecta el build nativo |

## Siguientes funciones (no en V1)

Verificación con selfie · modo viaje · filtros premium · recordatorios de conversación entregados ·
exportación a archivo · reacciones en el chat conectadas a la UI · fotos en el chat · más de una
foto de perfil · idiomas editables después del onboarding · panel con tasas por mil.
