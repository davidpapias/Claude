# Alcance del MVP

## Dentro

| # | Función | Criterio de aceptación |
|---|---------|------------------------|
| 1 | Registro con correo | Se crea la cuenta, se confirma edad y términos |
| 2 | Onboarding por pasos | Se puede interrumpir y retomar en el mismo paso |
| 3 | Foto de perfil | Se sube a un bucket privado y queda pendiente de moderación |
| 4 | Intenciones, intereses, estilo social, comunicación, disponibilidad, distancia, límites | Se guardan y alimentan el algoritmo |
| 5 | Descubrimiento | Tarjetas de una en una con 1–3 motivos concretos |
| 6 | Pasar / me interesa | Idempotente; el pase no se muestra a la otra persona |
| 7 | Match | Dos intereses mutuos generan exactamente un match |
| 8 | Chat | Solo con match; en tiempo real; sin confirmaciones de lectura |
| 9 | Iniciadores de conversación | Derivados de lo que ambos comparten |
| 10 | Retroalimentación posterior al match | Privada, nunca visible para la otra persona |
| 11 | Bloquear y reportar | Bloqueo inmediato y simétrico; reporte llega al panel |
| 12 | Deshacer match | Cierra la conversación para ambos |
| 13 | Preferencias, privacidad, seguridad, ayuda | Editables desde la app |
| 14 | Eliminar cuenta y exportar datos | Anonimiza el perfil; exporta la información propia |
| 15 | Panel de moderación | Cola de reportes, acciones, usuarios, auditoría, métricas, flags |

## Fuera de V1 (explícito)

Eventos organizados por la plataforma, clubs, marketplace, feed social, streaming, videollamadas,
seguidores, perfiles públicos indexados, mapa en tiempo real, matching romántico, app para
menores, IA que lea chats privados, modelos de machine learning, pagos obligatorios,
criptomonedas, sistema público de popularidad, verificación con selfie, modo viaje, filtros
premium, exportación a archivo, notificaciones push entregadas (la tabla y las preferencias
existen; el envío queda para V1.1).

## Suposiciones

| # | Suposición | Cómo se validará |
|---|------------|------------------|
| 1 | El nombre provisional es Círculo | Decisión de marca antes del lanzamiento |
| 2 | Mercado inicial: Ciudad de México, español | Datos de registro en las primeras semanas |
| 3 | La zona la escribe el usuario; no se lee GPS en V1 | Fricción medida en el paso de identidad |
| 4 | La moderación de fotos es manual al inicio | Volumen de cola en el panel |
| 5 | El ranking en cliente es suficiente para el MVP | Ver ADR 0003 y su condición de salida |
