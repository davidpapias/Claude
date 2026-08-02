# Analítica

## Reglas

- Nunca se almacena contenido privado. La tabla `analytics_events` rechaza propiedades `body`,
  `message`, `message_body`, `photo`, `photo_path`, `lat`, `lon`, `email`.
- Los eventos se escriben pero no se leen desde el cliente (solo `insert`).
- El tiempo dentro de la app **no** es métrica de éxito.

## Taxonomía

| Evento | Cuándo | Propiedades | Etapa del embudo |
|--------|--------|-------------|------------------|
| `sign_up_started` | Se envía el formulario de registro | — | Registro |
| `sign_up_completed` | La cuenta se crea | — | Registro |
| `onboarding_step_completed` | Se guarda un paso | `step` | Onboarding |
| `onboarding_completed` | Se termina el resumen | — | Onboarding |
| `discovery_profile_viewed` | Se genera una tanda | `count` | Descubrimiento |
| `discovery_like` | Interés expresado | — | Descubrimiento |
| `discovery_pass` | Pase | — | Descubrimiento |
| `match_created` | Interés mutuo | — | Conexión |
| `conversation_opened` | Se abre un chat | — | Conversación |
| `first_message_sent` | Primer mensaje de una conversación | — | Activación |
| `first_reply_received` | Primera respuesta de la otra persona | — | Activación |
| `report_created` | Se envía un reporte | `category` | Seguridad |
| `block_created` | Se bloquea a alguien | — | Seguridad |
| `match_feedback_submitted` | Retroalimentación privada | `feedback` | Continuidad |
| `account_deleted` | Cuenta eliminada | — | Salida |

## Métricas

| Métrica | Definición | Consulta base |
|---------|------------|---------------|
| Onboarding completado | perfiles completos / perfiles | `select count(*) filter (where profile_complete)::float / count(*) from profiles` |
| Tiempo hasta el primer match | `matches.created_at − profiles.created_at` | percentiles sobre esa diferencia |
| Matches con mensaje | conversaciones con `last_message_at` / matches | join `conversations` |
| Conversaciones con respuesta | conversaciones con mensajes de ambos remitentes | `count(distinct sender_id) = 2` |
| Retención semanal | usuarios con actividad en la semana N | `last_active_at` |
| Reportes por mil conversaciones | `reports / conversations * 1000` | — |
| Bloqueos por mil matches | `blocks / matches * 1000` | — |
| Distribución de exposición | percentiles de impresiones por perfil en 7 días | `profile_impressions` |
| Encuentros confirmados | usuarios con `match_feedback = 'we_met'` | `match_feedback` |

**Métrica norte:** conexiones mutuas que producen conversación con respuesta y continuidad
voluntaria (`we_talked`, `we_met` o `want_to_keep_in_touch`), sin leer el contenido.

## Privacidad declarada

Se recopilan eventos de uso ligados al usuario para medir el embudo y la seguridad. No se
recopilan contenidos de conversación, fotos ni ubicación. El usuario puede eliminar su cuenta, lo
que anonimiza el perfil y desvincula los eventos (`user_id` queda nulo por `on delete set null`).
