# ADR 0006 — El seed crea filas completas de `auth.users`, no solo perfiles

**Estado:** aceptado · 2026-08-02

**Contexto.** Las cuentas de demostración necesitan poder iniciar sesión de verdad contra
Supabase Auth (GoTrue). La primera versión del seed insertaba en `auth.users` solo `id` y
`email`, y un script aparte (`create-demo-users.sh`) llamaba a la Admin API para fijar la
contraseña después de `supabase db reset`. Al probar el flujo completo contra una instancia
real de Supabase (Postgres 17 + Auth + PostgREST vía Docker), el login de las cuentas
demo fallaba con `invalid_credentials`: el usuario ya existía por el `insert` del seed, así
que la llamada a la Admin API fallaba silenciosamente, y el script no comprobaba el código
de estado HTTP.

**Decisión.** El seed inserta filas completas en `auth.users` (`aud`, `role`,
`encrypted_password` calculado con `crypt(..., gen_salt('bf'))` de `pgcrypto`,
`email_confirmed_at`, metadatos) y su fila correspondiente en `auth.identities`, todo en la
misma transacción que crea los perfiles. Se eliminó `create-demo-users.sh`.

**Consecuencias.** `supabase db reset` deja las cuentas de demostración listas para iniciar
sesión sin un paso adicional, y no depende de que la Admin API esté disponible ni de que su
resultado se compruebe correctamente. La contraseña de las cuentas demo (`demo-circulo-2026`)
vive en texto plano en `generate.mjs`, lo cual es aceptable porque son datos de desarrollo
local que nunca se cargan en producción (ver la advertencia en la cabecera de `seed.sql`).
