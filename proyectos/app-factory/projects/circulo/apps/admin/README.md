# Panel de moderación

Next.js (App Router) + Supabase.

```bash
pnpm admin            # http://localhost:3001
```

Requiere `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env`.

El panel usa **la sesión del moderador**, nunca la clave de servicio: toda la autorización la
impone la base de datos con `is_staff()`. Un moderador ve reportes, usuarios y métricas; un
administrador además ve la auditoría y las banderas de funcionalidades.

Cuentas de demostración: `mod@demo.circulo.app` y `admin@demo.circulo.app`
(contraseña `demo-circulo-2026`).
