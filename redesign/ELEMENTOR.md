# Apex Sitrak — sitio multipágina en WordPress + Elementor
Prototipo navegable: `redesign/index.html` · Manifiesto de imágenes: `redesign/IMAGENES.md`

El prototipo simula la navegación con rutas de tipo `#/modelos`. **Cada ruta equivale a una
página real de WordPress**; el enrutado por hash existe solo para poder recorrer el sitio
en un archivo. La tabla de abajo es el mapa 1:1.

| Ruta del prototipo | Página de WordPress | Tipo en WP |
|---|---|---|
| `#/` | `/` | Página (plantilla de Elementor) |
| `#/modelos` | `/modelos/` | Archivo de producto / página con Loop Grid |
| `#/modelo/c7h540` | `/producto/c7h-540-6x4/` | Plantilla de producto único (Single) |
| `#/comparar` | `/comparar/` | Página + plugin de comparación |
| `#/postventa` | `/postventa-y-servicio/` | Página |
| `#/agencias` | `/agencias/` + una página por agencia | Página + CPT `agencia` |
| `#/nosotros` | `/nuestra-historia/` | Página |
| `#/contacto` | `/agendar-cita/` | Página con Formulario |

---

## 1. Ajustes globales (Elementor → Ajustes del sitio)

### Colores globales
| Nombre en Elementor | HEX | Uso |
|---|---|---|
| Primario | `#E01F26` | Rojo Sitrak: CTAs, acentos, marcadores |
| Secundario | `#F0A93B` | Ámbar: etiquetas de dato y «mejor valor» |
| Texto | `#E7EAED` | Texto sobre fondo oscuro |
| Acento | `#94A1AD` | Texto secundario |
| Personalizado 1 | `#0E1114` | Fondo base |
| Personalizado 2 | `#161A1F` | Superficie de tarjetas |
| Personalizado 3 | `#2A323B` | Líneas y bordes |
| Personalizado 4 | `#EDEFF1` | Sección clara |

### Fuentes globales
| Rol | Fuente | Ajustes |
|---|---|---|
| Primaria (títulos) | **Archivo Black** | Mayúsculas, interlineado 0.98 |
| Secundaria (texto) | **IBM Plex Sans** | 16 px, interlineado 1.6 |
| Acento (datos y etiquetas) | **IBM Plex Mono** | 11–12 px, mayúsculas, `letter-spacing: .14em` |

### Layout
Ancho de contenido **1240 px** · espacio entre widgets **20 px** · breakpoints 1024 / 767 px.

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

## 2. Plantillas del Theme Builder

- **Header** — contenedor flex horizontal, sticky, fondo `#0E1114` al 90 % con
  `backdrop-filter: blur(10px)`, borde inferior 1 px. Widgets: Imagen (logo) · Nav Menu ·
  Texto (teléfono) · Botón «Cotizar». Marca la página activa con
  `.current-menu-item a{border-bottom:2px solid var(--red)}`.
- **Footer** — contenedor de 4 columnas (1.4fr / 1fr / 1fr / 1fr).
- **Single Product** — plantilla única que sirve para los 9 modelos (ver §4).
- **Archive Product** — el catálogo (ver §3).

---

## 3. Página de modelos (`/modelos/`)

1. Cabecera de página: contenedor con la rejilla de fondo:
```css
selector:before{content:"";position:absolute;inset:0;
  background-image:linear-gradient(#212831 1px,transparent 1px),
                   linear-gradient(90deg,#212831 1px,transparent 1px);
  background-size:74px 74px;opacity:.45;
  -webkit-mask-image:radial-gradient(110% 90% at 80% 10%,#000 10%,transparent 72%);
          mask-image:radial-gradient(110% 90% at 80% 10%,#000 10%,transparent 72%);}
```
2. **Loop Grid** (Elementor Pro) con la fuente de datos en productos, 3 columnas.
3. Filtros por categoría: widget **Taxonomy Filter** de Elementor Pro conectado al Loop Grid
   (Tractocamiones / Construcción y volteo / Ligeros urbanos). Sin Pro: tres botones que
   apuntan a las URLs de categoría de WooCommerce.
4. **Loop Item** (plantilla de bucle): Imagen destacada 16:10 → Texto dinámico con la
   categoría → Título dinámico → Extracto → tres filas de especificación con campos
   dinámicos → Botón «Ficha técnica» + Botón «Cotizar» + botón «Comparar» del plugin.

Filas de especificación:
```css
.apx-row{display:flex;justify-content:space-between;padding:9px 0;
  border-top:1px dashed var(--line);font-size:13.5px}
.apx-row dt{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--muted)}
.apx-row dd{margin:0;font-weight:600;font-variant-numeric:tabular-nums;text-align:right}
```

---

## 4. Ficha de modelo (`/producto/{slug}/`)

Una sola plantilla **Single Product** en el Theme Builder cubre los nueve modelos.
Dos columnas (1.05fr / 0.95fr):

- Izquierda: categoría (dato dinámico) → Título del producto → Descripción corta →
  tres contadores (Potencia / Tracción / Capacidad) → **lista completa de atributos**
  (widget *Product Additional Information*, o Loop de atributos con estilo propio) →
  botones «Cotizar esta unidad» y «Comparar con otra».
- Derecha: Imagen destacada + galería + nota de ficha oficial.

> **Regla que hace funcionar todo:** las especificaciones **no se escriben en la descripción**.
> Se cargan como **atributos globales de producto** (WooCommerce → Productos → Atributos).
> Es lo que permite que la misma información alimente la ficha, el filtro del catálogo y el
> comparador sin volver a capturarla.

### Atributos globales a crear
`Aplicación` · `Tracción` · `Motor` · `Potencia` · `Torque` · `Cilindrada` · `Transmisión`
· `Eje delantero` · `Eje trasero` · `Suspensión` · `Tanque de combustible` · `Llantas y rines`
· `Capacidad`

---

## 5. La página de comparación (`/comparar/`)

Esto era la duda principal: **sí es posible y no requiere desarrollo a medida.**
Cuatro caminos, de mejor a peor para este caso:

### Opción A — WooCommerce + plugin de comparación · **recomendada**
El sitio actual **ya corre WooCommerce** (existe `/product-category/tractocamiones/`), así que
esta es la vía natural.

1. Carga las specs como atributos globales (§4).
2. Instala **WPC Smart Compare for WooCommerce** (gratuito) o **YITH WooCommerce Compare**.
3. En los ajustes del plugin, elige qué atributos aparecen como renglones de la tabla y en
   qué orden — el mismo orden del prototipo.
4. Inserta el botón «Comparar» en la plantilla de bucle y en la de producto único mediante el
   widget del plugin o su shortcode dentro de un widget **Shortcode** de Elementor.
5. Crea la página `/comparar/` con el shortcode de la tabla de comparación.
6. Dale el estilo del prototipo con CSS en la página:
```css
.woocommerce-page table.compare-list th{font-family:"IBM Plex Mono",monospace;font-size:11px;
  letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:500}
.woocommerce-page table.compare-list td{border-bottom:1px solid var(--line-soft);padding:14px 18px}
```

**Ventajas:** el catálogo es la única fuente de verdad; agregar un modelo lo suma al comparador
automáticamente. **Límite:** el marcado de «mejor valor» por renglón no es nativo — se agrega
con un script corto o se omite.

### Opción B — CPT propio + JetEngine y JetCompareWishlist (Crocoblock)
Si prefieres que los modelos **no** sean productos de tienda (no hay carrito ni precio público),
crea un CPT `modelo` con campos meta por especificación. JetCompareWishlist arma el comparador
y JetEngine el listado, todo con widgets nativos dentro de Elementor. Más control de diseño;
requiere suscripción Crocoblock.

### Opción C — Tabla estática
Widget **Tabla** o **HTML** con la comparación fija de las tres unidades más vendidas.
Cero plugins, cero base de datos. Se actualiza a mano cada vez que cambia una ficha.
Sirve como versión 1 si hay prisa por salir.

### Opción D — Widget HTML con JS (lo que hace este prototipo)
Un widget **HTML** con el arreglo de modelos en JavaScript y la tabla generada en el navegador.
Funciona sin plugins y se ve exactamente como el prototipo, pero duplica el catálogo: cada
cambio de ficha hay que hacerlo en dos lugares. Úsalo solo si no se instala nada más.

**Recomendación:** Opción A. Es la que aprovecha lo que ya está instalado y la que no obliga a
capturar la información dos veces.

---

## 6. Página de agencias (`/agencias/`)

- Mapa: SVG de la República con un punto por agencia, o widget **Google Maps** con marcadores.
- Listado en 3 columnas con borde superior por renglón.
- **Crear un CPT `agencia`** y una página por sucursal (`/agencias/monterrey/`) con dirección,
  teléfono, horario de taller y datos estructurados `AutoDealer`. Es el mayor gancho de tráfico
  local que el sitio no está aprovechando hoy.

---

## 7. Formulario (`/agendar-cita/`)

Widget **Formulario** de Elementor Pro: Nombre · Empresa · Teléfono · Correo ·
Unidad de interés (select alimentado con los 9 modelos) · Unidades a adquirir · Estado.
Acciones tras enviar: Correo + **Redirección a `/gracias/`** (indispensable para medir
conversiones) + Webhook al CRM si existe.

Campos:
```css
.elementor-field-group input,.elementor-field-group select{
  background:var(--surface);border:1px solid var(--line);color:var(--text);padding:12px 13px}
.elementor-field-group input:focus{border-color:var(--red);outline:none}
```

---

## 8. Catálogo cargado en el prototipo

Nueve configuraciones con la información verificable encontrada en fuentes públicas
(Sitrak México, fichas de distribuidores y publicaciones de Sinotruk):

| Modelo | Categoría | Motor | Potencia | Dato distintivo |
|---|---|---|---|---|
| C7H 540 6×4 | Tractocamión | MT13.54-50 · MAN | 540 HP @ 1,900 rpm | 1,844 lb-ft · ZF 16 vel. c/ retardador · tanque 900 L |
| C7H 480 6×4 | Tractocamión | Sinotruk · MAN | 480 HP | ZF 16 vel. con retardador |
| T7H | Tractocamión | MT13 · MAN | hasta 540 HP | Línea premium CNHTC & MAN |
| C7H Chasis 360 6×4 | Chasis | MC11.36-50 Euro V SCR | 360 HP | Hasta 25 t de carga |
| C7H Volteo 6×4 | Volteo | Sinotruk | — | Caja de 16 m³ (el mercado ofrece 14 m³) |
| C7H 8×4 | Volteo | Sinotruk | — | Minería, construcción y off-road |
| C7H 6×6 | Tractor pesado | Sinotruk | — | Arrastre de hasta 150 t, tracción en 3 ejes |
| SITRAK 6T | Ligero | G3W | 154 HP (115 kW) @ 2,600 rpm | 6 t, distribución urbana |
| SITRAK 8T | Ligero | G3W | 168 HP | 8 t, reparto regional |

Los renglones marcados **«Por confirmar»** en el prototipo son datos que no pudieron
verificarse públicamente. Deben completarse con la hoja de especificación oficial de Apex
antes de publicar: es exactamente la lista de lo que falta capturar.

---

## 9. Pendientes antes de publicar
- **Fotografía de las unidades** (ver `IMAGENES.md`: 20 huecos con medida y encuadre).
- Teléfonos reales, directorio de agencias y horarios de taller.
- Completar los atributos «Por confirmar» de los 9 modelos.
- Aviso de privacidad y consentimiento del formulario.
- Redirecciones 301 de las URLs actuales a la nueva estructura.
