# Panel de moderación

Next.js (App Router) + Supabase.

```bash
pnpm admin            # http://localhost:3001
```

Requiere `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env`, también para
`pnpm build`: Next.js inyecta esas variables en el bundle en tiempo de compilación, así que un
build de producción sin ellas falla con `MissingEnvError` al intentar prerenderizar las páginas.

El panel usa **la sesión del moderador**, nunca la clave de servicio: toda la autorización la
impone la base de datos con `is_staff()`. Un moderador ve reportes, usuarios y métricas; un
administrador además ve la auditoría y las banderas de funcionalidades.

Cuentas de demostración: `mod@demo.circulo.app` y `admin@demo.circulo.app`
(contraseña `demo-circulo-2026`).

## Pruebas E2E

```bash
supabase start        # necesita una instancia real, local o remota
pnpm test:e2e          # construye el panel de producción, lo arranca y corre Playwright
```

`playwright.config.ts` levanta `next build && next start`, no el servidor de desarrollo: una
corrida en verde confirma que el build que se desplegaría funciona, no solo el modo dev. Las
pruebas (`e2e/access-control.spec.ts`) cubren la capa de acceso frente a la base de datos: sin
sesión no se ve contenido de ninguna ruta protegida, credenciales incorrectas muestran un error
visible, un moderador entra al resumen pero no a la auditoría, y un administrador sí. El límite de
seguridad real (RLS + `is_staff()`) está probado en `supabase/tests/rls.test.sql`; esto prueba la
capa de encima.
