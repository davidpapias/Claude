# Especificación de producto — Círculo

Nombre del producto: **Círculo** (confirmado, no es un placeholder).

## Tesis

Dos personas pueden compartir aficiones y aun así no funcionar como amigas. Lo que decide una
amistad es la compatibilidad de ritmo: energía social, disponibilidad, frecuencia de contacto,
estilo de conversación y expectativas. Círculo ordena las recomendaciones con esas señales, no
solo con intereses.

## Usuario objetivo

Adultos de 18 años o más que quieren ampliar su círculo social: personas recién mudadas, con
horarios poco convencionales, que salieron de una relación larga o de una etapa de aislamiento, y
personas cuyo círculo se redujo por trabajo o cambio de vida.

## Qué no es

- No es una app de citas: no hay lenguaje romántico, corazones ni ranking por apariencia.
- No es una red social: no hay feed, seguidores, ni contadores públicos de popularidad.
- No es una app de eventos: la unidad es la persona, no el evento.
- No es una comunidad: no hay que entrar a un grupo establecido para existir.

## Principios (invariantes del producto)

1. El consentimiento es mutuo: solo hay mensaje si hay match.
2. La ubicación exacta nunca sale del servidor.
3. Las recomendaciones se explican con hechos verificables en los dos perfiles.
4. No se usan atributos protegidos para ordenar personas.
5. La seguridad tiene prioridad sobre el crecimiento.
6. No se paga por visibilidad ni por funciones de seguridad.
7. Nada de patrones que fabriquen urgencia o culpa.
8. La información psicológica nunca se presenta como diagnóstico.

## Mecánicas del producto

- **Evento de activación:** primera conversación con respuesta de la otra persona.
- **Bucle de retención:** recomendaciones nuevas basadas en disponibilidad → interés mutuo →
  conversación con iniciadores → confirmación privada de continuidad → mejores recomendaciones.
- **Evento de monetización:** ninguno en V1. La arquitectura admite freemium sin tocar seguridad.
- **Métrica norte:** conexiones mutuas que producen conversación con respuesta y continuidad
  voluntaria (medida con `match_feedback`, sin leer contenido).
- **Embudo principal:** registro → onboarding completo → primera tanda de recomendaciones →
  primer interés → primer match → primer mensaje → primera respuesta.

## Riesgos de cancelación

- Pocas personas compatibles en zonas de baja densidad → se mitiga ampliando distancia y horarios,
  y con el piso de exposición para perfiles nuevos.
- Conversaciones que mueren tras el match → se mitiga con iniciadores concretos y recordatorios
  desactivables.
- Intenciones románticas encubiertas → categoría de reporte dedicada y lenguaje explícito.

## Límites éticos

No se hacen afirmaciones clínicas, terapéuticas ni diagnósticas. La app no promete curar la
soledad; facilita conocer personas compatibles. No se recopilan diagnósticos ni datos de salud.
