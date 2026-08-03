# Círculo

App móvil para hacer amistades por compatibilidad mutua. No es una app de citas: no hay lenguaje
romántico, no hay corazones, no se ordena a las personas por apariencia y solo se puede escribir
cuando las dos partes mostraron interés.

El nombre del producto es **Círculo** (confirmado). El nombre de la variable de entorno
`EXPO_PUBLIC_APP_NAME` sigue siendo configurable por si hace falta para builds de white-label,
pero no es un placeholder pendiente de decisión.

## Qué hay aquí

```
apps/mobile      App React Native (Expo Router, TypeScript estricto)
apps/admin       Panel de moderación (Next.js)
packages/types   Tipos del dominio compartidos
packages/validation  Esquemas Zod compartidos por app, panel y pruebas
packages/matching    Algoritmo de recomendaciones + herramienta de comparación
packages/config      Tokens de diseño, límites, catálogos, lectura de entorno
supabase/        Migraciones SQL, RLS, funciones, semillas y pruebas de seguridad
docs/            Especificación, flujos, arquitectura, seguridad, algoritmo, analítica, ADRs
```

## Requisitos

- Node 20 o superior y `pnpm` 10
- Supabase CLI (`brew install supabase/tap/supabase`) y Docker para el entorno local
- Xcode o Android Studio, o la app Expo Go, para correr la app móvil

## Puesta en marcha

```bash
git clone <este-repositorio>
cd circulo
pnpm install
cp .env.example .env

supabase start                  # imprime las claves locales
# copia anon key y service role key al .env

supabase db reset                # aplica supabase/migrations y supabase/seed/seed.sql
                                  # (las cuentas demo quedan creadas con su contraseña real)

pnpm test                       # pruebas de algoritmo y validación
pnpm mobile                     # Expo: pulsa i (iOS) o a (Android)
pnpm admin                      # panel en http://localhost:3001
```

`supabase start` imprime `anon key` y `service_role key`. La primera va en las variables
`EXPO_PUBLIC_*` y `NEXT_PUBLIC_*`; la segunda **solo** se usa desde scripts de servidor y nunca se
incluye en un build de cliente.

## Cuentas de demostración

Contraseña para todas: `demo-circulo-2026`

| Cuenta | Para qué sirve |
|--------|----------------|
| `ana@demo.circulo.app` | Perfil completo, con un match y una conversación en curso |
| `beto@demo.circulo.app` | El match de Ana |
| `caro@demo.circulo.app` | Sin matches: buena para probar descubrimiento, bloqueo y reporte |
| `nuevo@demo.circulo.app` | Onboarding incompleto: la app lo retoma donde se quedó |
| `mod@demo.circulo.app` | Moderador: ve la cola de reportes |
| `admin@demo.circulo.app` | Administrador: además ve auditoría y banderas |

Los datos de demostración son solo para desarrollo local. Nunca se cargan en producción.

## Verificación

```bash
pnpm test                                  # 47 pruebas unitarias (algoritmo + validación)
PGHOST=... PGUSER=postgres ./supabase/tests/run.sh   # 36 aserciones de RLS y reglas de negocio
pnpm --filter @circulo/matching compare    # inspecciona por qué dos perfiles encajan o no
pnpm typecheck                             # TypeScript en app móvil, panel y los 4 paquetes
```

`supabase/tests/run.sh` aplica las migraciones sobre una base desechable y comprueba, entre otras
cosas, que un usuario no puede leer perfiles ni mensajes ajenos, que dos "me interesa" mutuos
crean exactamente un match, que sin match no hay mensajes, que un bloqueo corta la interacción en
ambos sentidos y que una cuenta suspendida no puede reactivarse a sí misma.

## Estado

Verificado en este entorno, incluyendo contra una instancia real de Supabase levantada con Docker
(Postgres 17, Auth, PostgREST, Storage, Realtime): las 8 migraciones y el seed se aplican limpio,
`pnpm typecheck` está limpio en los 6 paquetes, `next build` genera las 9 rutas del panel,
`expo export --platform ios/android` empaqueta el bundle real de la app, y el camino dorado
completo se probó con peticiones HTTP reales contra la API — login de una cuenta demo, descubrir
candidatos, interés mutuo que crea exactamente un match, mensaje que un tercero no puede leer ni
escribir, y un reporte visible solo para moderadores.

**No verificado:** la UI en pantalla — este entorno no tiene Xcode, Android Studio ni Expo Go, así
que nadie vio las pantallas renderizadas. El backend que las alimenta sí está probado de extremo a
extremo. Antes de una demo visual: `supabase start`, `supabase db reset`, `pnpm mobile` y
`pnpm admin`.

Alcance, exclusiones, riesgos abiertos y siguientes pasos: `docs/backlog.md` y `docs/mvp-scope.md`.

## Documentación

| Documento | Contenido |
|-----------|-----------|
| `docs/product-spec.md` | Tesis, principios, mecánicas, métrica norte |
| `docs/mvp-scope.md` | Qué entra en V1, qué no, y las suposiciones |
| `docs/user-flows.md` | Recorrido funcional y emocional, inventario de pantallas |
| `docs/architecture.md` | Diagrama, límites, capas, manejo de errores |
| `docs/security-model.md` | RLS, privacidad de ubicación, verificación |
| `docs/threat-model.md` | Amenazas, mitigaciones y lo que queda abierto |
| `docs/matching-system.md` | Filtros, pesos, explicaciones, equidad de exposición |
| `docs/analytics.md` | Taxonomía de eventos y métricas |
| `docs/database.md` | Esquema, invariantes y API RPC |
| `docs/design-system.md` | Tokens, componentes, accesibilidad |
| `docs/backlog.md` | Estado por fase, riesgos, siguientes funciones |
| `docs/decisions/` | ADRs |
