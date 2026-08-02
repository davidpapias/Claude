# Threat modeling

Formato: amenaza → cómo se materializaría → mitigación implementada → qué queda abierto.

| Amenaza | Vector | Mitigación | Pendiente |
|---------|--------|------------|-----------|
| Acoso | Mensajes insistentes tras un no | Bloqueo inmediato y simétrico, deshacer match, reporte con categoría dedicada, límite de 20 mensajes/min | Detección automática de patrones de acoso |
| Stalking | Deducir dónde vive alguien | Coordenadas redondeadas en origen y a un decimal al salir; sin mapa ni ubicación en tiempo real | Ninguno para V1 |
| Suplantación | Fotos y datos de otra persona | Moderación de fotos previa a la visibilidad, categoría de reporte, ocultamiento automático por umbral | Verificación con selfie (post-MVP, flag existente) |
| Spam | Cuentas automatizadas enviando enlaces | Límites de tasa, `account_flags` con penalización fuerte de exposición, perfil incompleto no se muestra | Verificación de correo obligatoria y captcha |
| Sextorsión | Pedir fotos y extorsionar | Reporte por contenido sexual no solicitado con ocultamiento automático, consejos de seguridad | Aviso proactivo ante fotos de un contacto muy reciente |
| Solicitud de dinero | Estafa romántica o de emergencia | Categoría de reporte propia, consejo explícito de no compartir datos bancarios | Detección de patrones de texto |
| Filtración de ubicación | Coordenadas en respuestas o analítica | `CHECK` de precisión, RPC que no devuelve `lat`/`lon`, analítica que rechaza esas propiedades | Ninguno para V1 |
| Acceso indebido a datos | Consultas directas a la API | RLS deny-by-default verificado por pruebas | Auditoría automatizada en CI contra una base efímera |
| Moderador malicioso | Suspensiones o consultas abusivas | Rol separado, cada acción en `audit_logs`, auditoría legible solo por administradores | Alertas por volumen anómalo de acciones |
| Abuso de fotos | Descargar y difundir fotos | Bucket privado, URL firmada de 10 min, sin lectura directa entre usuarios | Marca de agua y detección de capturas (no viable en V1) |
| Creación masiva de cuentas | Registro automatizado | Perfil incompleto invisible, límites por usuario | Límite por IP y verificación de correo |
| Scraping de perfiles | Recorrer la tabla de perfiles | No existe lectura de `profiles` ajenos; el descubrimiento entrega como máximo 200 candidatos filtrados | Cuota diaria de candidatos por cuenta |
| Menores en la plataforma | Registro mintiendo la edad | `CHECK` de 18 años, categoría de reporte con ocultamiento inmediato | Verificación de edad de terceros |
