# Guía de construcción en WordPress + Elementor
Rediseño de apexsitrak.com — prototipo: `redesign/index.html`

Todo el prototipo está diseñado para reproducirse **sin plugins de código a medida**:
contenedores flexbox de Elementor, widgets nativos y unos pocos bloques de CSS
personalizado (pestaña *Avanzado → CSS personalizado*, disponible en Elementor Pro).

---

## 1. Ajustes globales (Elementor → Ajustes del sitio)

### Colores globales
| Nombre en Elementor | HEX | Uso |
|---|---|---|
| Primario | `#E01F26` | Rojo Sitrak: CTAs, acentos, marcadores |
| Secundario | `#F0A93B` | Ámbar: etiquetas de dato y unidades |
| Texto | `#E7EAED` | Texto sobre fondo oscuro |
| Acento | `#94A1AD` | Texto secundario / muted |
| Personalizado 1 | `#0E1114` | Fondo base (tinta) |
| Personalizado 2 | `#161A1F` | Superficie de tarjetas |
| Personalizado 3 | `#2A323B` | Líneas y bordes |
| Personalizado 4 | `#EDEFF1` | Concreto: sección clara invertida |

### Fuentes globales
| Rol | Fuente | Ajustes |
|---|---|---|
| Primaria (títulos) | **Archivo Black** | Mayúsculas, interlineado 0.98, espaciado −0.01em |
| Secundaria (texto) | **IBM Plex Sans** | 16 px, interlineado 1.6 |
| Texto | IBM Plex Sans | 400/500/600 |
| Acento (datos, etiquetas) | **IBM Plex Mono** | 11–12 px, mayúsculas, espaciado 0.14em |

### Layout
- Ancho de contenido: **1240 px**
- Espacio entre widgets: **20 px**
- Puntos de ruptura: tablet 1024 px, móvil 767 px

### CSS global (Ajustes del sitio → CSS personalizado)
```css
:root{
  --ink:#0E1114; --surface:#161A1F; --surface-2:#1E242B;
  --line:#2A323B; --line-soft:#212831; --text:#E7EAED;
  --muted:#94A1AD; --red:#E01F26; --amber:#F0A93B; --concrete:#EDEFF1;
}
.apx-eyebrow{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:10px}
.apx-eyebrow:before{content:"";width:22px;height:1px;background:var(--red)}
.apx-num{font-variant-numeric:tabular-nums}
```

---

## 2. Estructura de plantilla

- **Encabezado** (Theme Builder → Header): contenedor flex horizontal, sticky, fondo
  `#0E1114` al 88 % + `backdrop-filter: blur(10px)`, borde inferior 1 px `#212831`.
  Widgets: Imagen (logo) · Nav Menu · Texto (teléfono) · Botón "Cotizar unidad".
- **Pie** (Theme Builder → Footer): contenedor con 4 columnas (1.4fr / 1fr / 1fr / 1fr).
- **Home**: una plantilla de página con las secciones de abajo, en orden.

---

## 3. Secciones, una por una

### 3.1 Hero
- Contenedor exterior: `overflow: hidden`, borde inferior 1 px.
- Fondo de rejilla: en *Estilo → Fondo → CSS personalizado del contenedor*:
```css
selector:before{content:"";position:absolute;inset:0;
  background-image:linear-gradient(#212831 1px,transparent 1px),
                   linear-gradient(90deg,#212831 1px,transparent 1px);
  background-size:74px 74px;opacity:.5;
  -webkit-mask-image:radial-gradient(120% 80% at 70% 20%,#000 20%,transparent 78%);
          mask-image:radial-gradient(120% 80% at 70% 20%,#000 20%,transparent 78%);}
```
- Contenedor interior: 2 columnas (1.05fr / 0.95fr), alineación inferior, hueco 56 px.
  - Izquierda: Texto ("Distribuidor autorizado Sitrak · Sinotruk", clase `apx-eyebrow`)
    → Encabezado H1 → Editor de texto → dos Botones en contenedor horizontal.
    El "más bajo" en rojo se logra con `<em>` dentro del H1 y `h1 em{color:var(--red);font-style:normal}`.
  - Derecha: widget **Imagen** con la foto del tractocamión (relación 4:3.2, `object-fit: cover`).
    En el prototipo es un marcador; sustituir por foto 1920×1536 px.

### 3.2 Barra de especificaciones
Contenedor de 4 columnas, fondo `#161A1F`, bordes derechos 1 px `#212831`.
Cada celda: widget **Contador** (número, sufijo en ámbar) + Texto de etiqueta en mono.
En móvil pasa a 2 columnas.

### 3.3 Ticker de respaldo
Contenedor con un widget **HTML**:
```html
<div class="apx-ticker"><div class="apx-track">
  <span>Sinotruk CNHTC · fundada en 1956</span> … (duplicar la lista completa)
</div></div>
<style>
.apx-ticker{overflow:hidden}
.apx-track{display:flex;gap:44px;width:max-content;animation:apxslide 34s linear infinite}
.apx-track span{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.16em;
  text-transform:uppercase;color:#94A1AD;white-space:nowrap}
@keyframes apxslide{to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.apx-track{animation:none}}
</style>
```

### 3.4 Modelos
- Widget **Pestañas** (Tabs) de Elementor con 3 pestañas: Tractocamiones / Carga y volteo /
  Ligeros urbanos. Estilo: pestaña activa fondo rojo, inactiva borde `#2A323B`.
- Dentro de cada pestaña, un contenedor de 3 columnas con una plantilla guardada
  **"Ficha de modelo"** repetida:
  Imagen (16:10) → Texto mono rojo (categoría) → H3 (nombre) → Editor de texto →
  **Lista de iconos** en modo dos columnas para las especificaciones → Botón fantasma.
- Alternativa recomendada a medio plazo: convertir los modelos en un **CPT de productos**
  (ya existe `product-category/tractocamiones` en el sitio actual) y usar el widget
  **Loop Grid** con una plantilla de bucle. Así el catálogo se administra sin tocar el diseño.
- Filas de especificación (borde punteado superior):
```css
.apx-row{display:flex;justify-content:space-between;padding:9px 0;
  border-top:1px dashed var(--line);font-size:13.5px}
.apx-row dt{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted)}
.apx-row dd{margin:0;font-weight:600;font-variant-numeric:tabular-nums}
```

### 3.5 Ingeniería
Contenedor de 3 columnas × 2 filas, hueco 20 px. Cada tarjeta: contenedor con fondo
`#161A1F`, borde 1 px `#212831`, relleno 28 px. Etiqueta ámbar + H3 + Editor de texto.
Las marcas de esquina de las tres primeras tarjetas:
```css
selector:before,selector:after{content:"";position:absolute;width:12px;height:12px;border:1px solid var(--red)}
selector:before{top:-1px;left:-1px;border-right:0;border-bottom:0}
selector:after{bottom:-1px;right:-1px;border-left:0;border-top:0}
```

### 3.6 Costo por kilómetro (sección clara)
Fondo `#EDEFF1`, texto `#14181C` — es el único respiro claro de la página y por eso
funciona como punto de atención. Dos columnas:
- Izquierda: cuatro widgets **Barra de progreso** (sin porcentaje interno, etiqueta arriba).
- Derecha: H3 + texto + botón oscuro + nota legal.
> **Importante:** las cifras de las barras son un esquema de comunicación. Antes de publicar,
> sustituirlas por datos verificables de la operación de Apex o cambiarlas por atributos
> no numéricos. No publicar comparativos contra marcas competidoras sin sustento.

### 3.7 Postventa
Contenedor de 12 columnas con celdas de anchos 5/4/3 y 4/4/4 (en Elementor: contenedores
anidados con `flex-basis` en %). Seis bloques con los servicios reales del sitio actual:
refacciones originales, mantenimiento, servicio en sitio, asistencia en carretera,
hojalatería y pintura, capacitación a operadores.

### 3.8 Red de agencias
Dos columnas (0.85fr / 1.15fr).
- Izquierda: SVG de la República con los puntos de agencia (widget Imagen o HTML).
  Ideal: **Google Maps** con marcadores, o un mapa SVG con `title` por estado.
- Derecha: listado de estados en 3 columnas (widget **Lista de iconos** sin icono,
  con borde superior) + botón al directorio.
- Recomendación SEO: crear una página por agencia (`/agencias/monterrey/`) con dirección,
  teléfono, horario y schema `AutoDealer`. Es el mayor gancho de tráfico local del sitio.

### 3.9 Nuestra historia
Contenedor de 4 columnas con borde superior. Cada hito: H3 con el año en IBM Plex Mono
(no en Archivo Black — el año es dato, no titular) + párrafo. Marca roja de 34×3 px
sobre el borde superior mediante `:before`.

### 3.10 Cotizar / Agendar cita
Contenedor de 2 columnas dentro de un marco con borde.
- Izquierda: eyebrow + H2 + texto + teléfono.
- Derecha: widget **Formulario** de Elementor Pro con los campos:
  Nombre · Empresa · Teléfono · Correo · Tipo de unidad (select) · Unidades (select).
  Acciones tras enviar: Correo electrónico + Redirección a `/gracias/` (necesaria para
  medir conversiones) + Webhook al CRM si existe.
- Estilo de campos: fondo `#161A1F`, borde 1 px `#2A323B`, foco borde rojo.

### 3.11 Botón flotante de WhatsApp
Widget HTML fijo o el widget **WhatsApp** de Elementor Pro, posición fija abajo a la derecha.

---

## 4. Qué cambia respecto al sitio actual y por qué

1. **Una sola promesa arriba.** El hero pasa de presentar la marca a presentar el beneficio
   medible (costo por kilómetro) con cuatro datos duros inmediatamente debajo.
2. **Catálogo por tipo de operación, no por catálogo de fábrica.** El comprador de flotilla
   busca "larga distancia", "obra", "última milla"; no busca nombres de modelo.
3. **Especificaciones visibles sin clic.** Motor, potencia, torque y cilindrada aparecen en
   la ficha; hoy hay que entrar al producto para verlas.
4. **La postventa sube de nivel.** Es el diferenciador real frente a marcas asiáticas
   competidoras (24 agencias, centros de partes, servicio en carretera) y merece una sección
   propia, no una página escondida.
5. **Red de agencias como activo de SEO local.** Página por agencia con schema `AutoDealer`.
6. **Conversión continua.** CTA fijo en el encabezado, WhatsApp flotante y un solo formulario
   corto (6 campos) al final, en lugar de una página de cita aparte.
7. **Sistema visual propio.** Tipografía de señalética industrial (Archivo Black) con datos
   en monoespaciada, rejilla de plano técnico y el rojo Sitrak reservado únicamente para
   acción y acento; la paleta gris tiene sesgo azul de acero, no gris neutro.

## 5. Pendientes de contenido antes de publicar
- Fotografía profesional de las unidades (3/4 frontal sobre fondo neutro o en ruta).
- Teléfonos reales, directorio de agencias y horarios de taller.
- Cifras verificables para la sección de costo por kilómetro.
- Aviso de privacidad y consentimiento del formulario.
- Testimonios de flotillas con nombre de empresa y autorización por escrito.
