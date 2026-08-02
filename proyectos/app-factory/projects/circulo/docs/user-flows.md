# Flujos de usuario

## Recorrido funcional y emocional

| Etapa | Objetivo | Estado emocional | Riesgo | Respuesta del producto |
|-------|----------|------------------|--------|------------------------|
| Descubrimiento de la app | Entender que no es una app de citas | Escepticismo | Parecer Tinder | Copy explícito, sin corazones, paleta cálida no romántica |
| Registro | Entrar rápido | Impaciencia | Abandono | Correo + contraseña, confirmación de edad en la misma pantalla |
| Onboarding | Dar señales suficientes | Cansancio | Sensación de examen | 11 pasos cortos, guardado por paso, reanudable |
| Primera tanda | Ver a alguien plausible | Curiosidad | Vacío | Motivos concretos por tarjeta; estado vacío con acción |
| Interés | Arriesgarse | Miedo al rechazo | Parálisis | El interés solo se revela si es mutuo; el pase es invisible |
| Match | Empezar a hablar | Ansiedad de primer mensaje | Silencio | Iniciadores derivados de lo compartido |
| Conversación | Sostener el intercambio | Inseguridad | Conversación muerta | Sin confirmaciones de lectura; recordatorio opcional |
| Primer encuentro | Verse con seguridad | Nervios | Situación insegura | Consejos de seguridad no alarmistas en Detalles |
| Continuidad | Repetir | Satisfacción | Se apaga | Confirmación privada; mejores recomendaciones |
| Conflicto | Salir sin costo | Incomodidad | Acoso | Bloquear, reportar, deshacer match, siempre a un toque |

## Inventario de pantallas (app móvil)

Splash/enrutado, Bienvenida, Iniciar sesión, Crear cuenta (incluye confirmación de edad),
Recuperar contraseña, Onboarding ×11 (identidad, fotos, descripción, intenciones, intereses,
estilo social, comunicación, disponibilidad, distancia, límites, resumen), Descubrimiento, Perfil
completo, Match, Conversaciones, Chat, Detalles del match, Notificaciones, Mi perfil, Editar
perfil, Preferencias, Privacidad, Seguridad, Bloqueos, Reportar, Ayuda, Ajustes de cuenta,
Eliminar cuenta, Cuenta suspendida, Reporte enviado.

## Inventario de pantallas (panel)

Acceso (con gate por rol), Resumen operativo, Reportes, Detalle de reporte, Usuarios (incluye
suspensión y reactivación), Auditoría, Métricas, Banderas de funcionalidades.

## Flujos interrumpidos

- Onboarding abandonado → `onboarding_progress.step` marca dónde retomar.
- Compra cancelada → no aplica en V1 (sin pagos).
- Sin conexión → los estados de error lo dicen y ofrecen reintento; el mensaje no se pierde en la
  caja de texto.
- App cerrada a mitad de un envío → el mensaje no se duplica: el envío es una sola llamada RPC.
- Doble toque en "me interesa" → clave de idempotencia por tarjeta.
