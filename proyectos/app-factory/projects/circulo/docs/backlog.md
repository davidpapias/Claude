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
| 4 App móvil | Código completo, sin build verificado | Requiere Xcode/Android o Expo Go |
| 5 Panel | Código completo, sin build verificado | Requiere `pnpm --filter @circulo/admin dev` |
| 6 Calidad | Parcial | Unitarias e integración de BD sí; e2e y accesibilidad manual pendientes |
| 7 Revisión 1 | Hecha | Ver correcciones abajo |
| 8 Revisión 2 | Pendiente | Requiere ejecutar la app |

### Correcciones de la revisión 1

- El guard de columnas de `profiles` bloqueaba también las escrituras del sistema (recomputar
  completitud, eliminar cuenta, moderar). Se añadió una bandera transaccional que solo las
  funciones `SECURITY DEFINER` pueden activar.
- `moderate_set_account_status` insertaba texto en una columna de enum.
- La tarjeta de descubrimiento no mostraba foto ni nombre porque `discovery_candidates` no los
  entrega por diseño; ahora la tarjeta pide el perfil público del candidato actual.
- La clave de idempotencia se construía con una cadena que no era un UUID válido.

## Riesgos abiertos

| # | Riesgo | Impacto | Mitigación propuesta |
|---|--------|---------|----------------------|
| 1 | App móvil y panel sin compilar en este entorno | Puede haber errores de tipos o de runtime en la primera ejecución | `pnpm install` + `pnpm typecheck` + arrancar Expo antes de cualquier demo |
| 2 | Sin envío real de notificaciones push | Menor reenganche | Expo Notifications en V1.1; las preferencias ya existen |
| 3 | Moderación de fotos manual | Cuello de botella con volumen | Cola priorizada y revisión automática asistida |
| 4 | Ranking en cliente | Un cliente modificado reordena lo que ve | Condición de salida en ADR 0003 |
| 5 | Densidad baja fuera de CDMX | Estados vacíos frecuentes | Ampliar distancia sugerida y lanzar por ciudad |
| 6 | Sin verificación de correo obligatoria | Cuentas desechables | Activar confirmación en Supabase Auth antes del lanzamiento |
| 7 | E2E y accesibilidad sin ejecutar | Regresiones no detectadas | Playwright para el panel y pruebas manuales con VoiceOver |

## Siguientes funciones (no en V1)

Verificación con selfie · modo viaje · filtros premium · recordatorios de conversación entregados ·
exportación a archivo · reacciones en el chat conectadas a la UI · fotos en el chat · más de una
foto de perfil · idiomas editables después del onboarding · panel con tasas por mil.
