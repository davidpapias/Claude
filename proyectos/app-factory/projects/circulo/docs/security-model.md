# Modelo de seguridad

## Principios

1. **Deny by default.** `0006_rls.sql` revoca privilegios a `anon` y `authenticated` y los vuelve a
   otorgar tabla por tabla, siempre acotados por una política.
2. **El cliente no es un control de seguridad.** Zod valida para dar buenos mensajes; la base de
   datos valida para proteger.
3. **La ubicación exacta no existe.** La app envía coordenadas ya redondeadas, un `CHECK` rechaza
   más de dos decimales y `discovery_candidates` entrega un decimal (~11 km).
4. **Las fotos viven en un bucket privado.** Se sirven con URL firmada de 10 minutos.

## Qué protege cada mecanismo

| Riesgo | Mecanismo |
|--------|-----------|
| Leer perfiles ajenos / scraping | No hay política de lectura sobre `profiles` de terceros; solo RPC acotados |
| Leer conversaciones ajenas | `messages` exige pertenencia a la conversación (`is_conversation_member`) |
| Escribir sin match | `send_message` verifica match activo y ausencia de bloqueo |
| Match duplicado | Constraint `unique (user_low, user_high)` con ids ordenados |
| Doble decisión / reintentos | `unique (actor_id, target_id)` + clave de idempotencia |
| Escalada de privilegios | `staff_members` separada + `is_staff()` + trigger que ignora cambios a `account_status`, `profile_complete`, `deleted_at` |
| Moderador malicioso | Toda acción de moderación escribe en `audit_logs`, que es solo lectura para administradores y no tiene política de update ni delete |
| Spam y automatización | `consume_rate_limit` (30 decisiones/min, 20 mensajes/min, 20 reportes/día) y penalización de exposición para cuentas marcadas |
| Enumeración de usuarios | La recuperación de contraseña responde igual exista o no la cuenta |
| Contenido privado en analítica | `CHECK` que rechaza propiedades `body`, `message`, `photo`, `lat`, `lon`, `email` |
| Subida de archivos peligrosos | Bucket con `allowed_mime_types` y límite de 8 MB; validación equivalente en Zod |

## Verificación

`supabase/tests/rls.test.sql` ejecuta 36 aserciones contra una base real, entre ellas: un usuario
no puede leer el perfil ni los mensajes de otro, un no miembro no puede escribir en una
conversación, un bloqueo es simétrico e inmediato, un usuario suspendido no puede reactivarse,
un usuario normal no puede moderar ni leer la auditoría, y una cuenta eliminada desaparece del
descubrimiento.

```bash
PGHOST=... PGUSER=postgres ./supabase/tests/run.sh
```

## Datos sensibles

Se recopila: correo (Auth), nombre visible, fecha de nacimiento, zona aproximada, foto, textos del
perfil, preferencias sociales, decisiones, mensajes. No se recopila: diagnósticos, orientación,
religión, etnia, datos bancarios ni ubicación precisa. Ningún atributo protegido entra al ranking:
`assertNoProtectedAttributes` lo impide en tiempo de ejecución.

## Retención

- Cuenta eliminada: perfil anonimizado, fotos y tokens borrados, matches cerrados. Los mensajes se
  conservan para el otro participante y para reportes abiertos.
- Impresiones y decisiones: sirven para no repetir perfiles; el pase caduca a los 30 días.
- `audit_logs`: se conserva; no contiene contenido privado.
