# Apex Sitrak — sitio multipágina en WordPress + Elementor
Prototipo navegable: `redesign/index.html` · Imágenes: `redesign/IMAGENES.md`

El prototipo usa rutas de tipo `#/modelos` solo para poder recorrer el sitio en un archivo.
**Cada ruta equivale a una página real de WordPress.**

| Ruta del prototipo | Página de WordPress | Tipo en WP |
|---|---|---|
| `#/` | `/` | Página (plantilla Elementor) |
| `#/modelos` | `/modelos/` | Página con Loop Grid + filtros |
| `#/modelos?c=tractocamiones` | `/product-category/tractocamiones/` | Archivo de producto |
| `#/modelo/tracto-540-6x4` | `/product/sitrak-tracto-diesel-540hp-6x4/` | Single Product |
| `#/comparar` | `/comparar/` | Página + plugin de comparación |
| `#/cotizar` | `/agendar-cita/` | Página con formulario multipaso |
| `#/postventa` | `/postventa-y-servicio/` | Página |
| `#/agencias` | `/agencias/` + una por sucursal | Página + CPT `agencia` |
| `#/nosotros` | `/nuestra-historia/` | Página |

Las URLs de producto y de categoría son **las que ya existen en el sitio**, así que no hay
redirecciones que hacer en esa parte.

---

## 1. Identidad: fiel a la marca

El rediseño se mantiene dentro del lenguaje visual del sitio actual —fondo claro, rojo Sitrak,
negro— y sube el nivel en jerarquía, retícula y ritmo tipográfico. No introduce un mundo visual
ajeno a la marca.

### Colores globales (Elementor → Ajustes del sitio)
| Nombre | HEX | Uso |
|---|---|---|
| Primario | `#E01F26` | Rojo Sitrak: CTAs, acentos, valores destacados |
| Secundario | `#111418` | Negro de titulares y barras |
| Texto | `#2B323A` | Cuerpo |
| Acento | `#5F6A75` | Texto secundario |
| Personalizado 1 | `#FFFFFF` | Fondo base |
| Personalizado 2 | `#F3F5F7` | Secciones alternas |
| Personalizado 3 | `#DFE3E8` | Líneas y bordes |
| Personalizado 4 | `#1FA855` | Verde WhatsApp (solo ese botón) |

### Fuentes globales
| Rol | Fuente | Ajustes |
|---|---|---|
| Primaria (títulos) | **Archivo Black** | Mayúsculas, interlineado 1.0 |
| Secundaria (texto) | **IBM Plex Sans** | 16 px, interlineado 1.6 |
| Acento (etiquetas y datos) | **IBM Plex Mono** | 10–12 px, mayúsculas, `letter-spacing:.12em` |

Ancho de contenido **1220 px** · espacio entre widgets **18 px** · breakpoints 1024 / 767 px.

---

## 2. Estructura del encabezado

Dos barras, como en el prototipo:

1. **Barra superior negra** (contenedor full-width, fondo `#111418`): «Distribuidor autorizado
   Sitrak · Sinotruk» · «Más de 24 agencias» · teléfono. Es prueba de autoridad permanente y
   pone el teléfono a un clic desde cualquier página.
2. **Encabezado principal blanco sticky**: logo · menú · botón rojo **COTIZAR**.
   El botón rojo no scrollea fuera de vista nunca: es el ancla del embudo.

```css
.current-menu-item a{border-bottom:3px solid var(--red);font-weight:600}
```

---

## 3. Catálogo: las 5 líneas reales del sitio

El prototipo usa la taxonomía que el sitio ya tiene publicada en `/modelos/`:

| Línea | Descripción del sitio | Unidades cargadas |
|---|---|---|
| Camiones ligeros | Operación urbana, agilidad, eficiencia de combustible | SITRAK 6T · SITRAK 8T |
| Camiones medianos | Versatilidad y robustez, urbano y rural, capacidad intermedia | SITRAK 62K 330HP 6×4 · SITRAK CHASIS 360HP 6×4 |
| Camiones vocacionales | Construcción, minería, servicios municipales | SITRAK VOLTEO 6×4 · SITRAK 8×4 MINERO |
| Grandes dimensiones | Cargas sobredimensionadas | SITRAK 6×6 ARRASTRE PESADO |
| Tractocamiones | Larga distancia y carga pesada | TRACTO DIESEL 540HP 6×4 · TRACTO 540HP 6×4 AMT · G7 540HP 6×4 · MINI TRACTO 330HP 6×4 |

**Montaje:** Loop Grid de Elementor Pro sobre productos de WooCommerce, 3 columnas, con widget
**Taxonomy Filter** para las cinco líneas. La plantilla de bucle lleva: imagen 4:3 → línea y uso →
título → extracto → tres filas de especificación (campos dinámicos) → **COTIZAR** + **Ficha** +
casilla «Agregar al comparador».

> **Regla que sostiene todo el sistema:** las especificaciones se cargan como **atributos globales
> de producto**, nunca dentro de la descripción. Una sola captura alimenta la ficha, el filtro del
> catálogo y el comparador.
>
> Atributos a crear: `Aplicación` · `Tracción` · `Motor` · `Potencia` · `Torque` · `Cilindrada` ·
> `Transmisión` · `Eje delantero` · `Eje trasero` · `Suspensión` · `Tanque` · `Llantas y rines` ·
> `Capacidad`.

---

## 4. Mejoras de embudo — qué se agregó y cómo se construye

El sitio actual tiene un solo camino: entrar → ver producto → botón COTIZAR → formulario.
El rediseño abre entradas al embudo en cada nivel de intención.

### 4.1 Selector de unidad — «¿No sabes qué unidad necesitas?» *(nuevo)*
Tres preguntas (qué mueves · dónde operas · cuánto peso) que devuelven una línea recomendada
y dos unidades concretas con su botón COTIZAR.

**Por qué:** captura al visitante que todavía no sabe qué buscar y que hoy se va sin dejar rastro.
Es la parte alta del embudo, que no existe en el sitio actual.

**Cómo:** widget **HTML** con el bloque del prototipo (la lógica son ~40 líneas de JS), o un plugin
de tipo *product finder / quiz* si se prefiere administrarlo desde el panel. Los estilos ya salen
de las variables CSS globales.

### 4.2 Cotizador de 4 pasos *(nuevo — reemplaza el formulario largo)*
Paso 1 tipo de unidad → 2 unidad → 3 volumen y forma de pago → 4 datos de contacto.
Barra de progreso y resumen lateral en vivo.

**Por qué:** el formulario largo pide todo antes de dar algo. Este empieza por lo que el visitante
contesta sin fricción y deja los datos personales al final, cuando ya invirtió tiempo. Además, al
preguntar enganche y plazo, la cotización sale con **mensualidad estimada ya calculada** en lugar
de gastar una segunda llamada en pedirlos.

**Cómo:** widget **Formulario** de Elementor Pro con campos de tipo **Step** (multipaso nativo,
con barra de progreso). Acciones al enviar: Correo + **Redirección a `/gracias/`** —indispensable
para medir conversiones— + Webhook al CRM.

### 4.3 Comparador de unidades *(nuevo)*
Hasta tres unidades lado a lado, 13 renglones, valor más alto marcado en rojo. Se alimenta desde
las tarjetas del catálogo y desde la ficha, con barra flotante de selección.

**Cómo, en orden de preferencia:**
- **A · WooCommerce + plugin — recomendada.** El sitio ya corre WooCommerce. Con los atributos
  cargados, **WPC Smart Compare** (gratuito) o **YITH WooCommerce Compare** generan la tabla sin
  código; el botón se inserta en el Loop Grid y la página `/comparar/` lleva el shortcode.
- **B · CPT + JetEngine y JetCompareWishlist** (Crocoblock) si los modelos no deben ser productos
  de tienda. Más control de diseño; requiere suscripción.
- **C · Tabla estática** con el widget Tabla: cero plugins, se actualiza a mano.
- **D · Widget HTML con JS** (lo del prototipo): sin plugins, pero duplica el catálogo.

```css
.woocommerce-page table.compare-list th{font-family:"IBM Plex Mono",monospace;font-size:10.5px;
  letter-spacing:.11em;text-transform:uppercase;color:var(--muted);font-weight:500}
.woocommerce-page table.compare-list td{border-bottom:1px solid var(--line);padding:13px 16px}
```

### 4.4 Barra fija móvil: Llamar · WhatsApp · Cotizar *(nuevo)*
En pantallas menores a 760 px, tres acciones siempre visibles al pie. La mayoría del tráfico de
este sector es móvil y hoy no hay ninguna acción persistente.
**Cómo:** contenedor con posición fija y `display:none` en escritorio, o el widget **Off-Canvas**
de Elementor Pro.

### 4.5 Agenda de taller en línea *(nuevo, en Postventa)*
Agencia · tipo de servicio · VIN · fecha. Convierte la postventa —que hoy es solo texto— en un
segundo embudo de ingresos recurrentes.
**Cómo:** widget Formulario con notificación a la agencia seleccionada.

### 4.6 Agencias filtrables con contacto directo *(nuevo)*
Selector por estado y, en cada sucursal, «Cómo llegar» y «Contactar».
**Cómo:** CPT `agencia` + Loop Grid con filtro por taxonomía de estado. Crear además una página
por agencia (`/agencias/monterrey/`) con dirección, teléfono, horario y datos estructurados
`AutoDealer`: es el mayor gancho de tráfico local que el sitio no aprovecha.

### 4.7 CTA escalonado en la ficha
Bloque lateral fijo con **Cotizar** (rojo) · **WhatsApp** (verde) · **Comparar** (contorno) ·
casilla de comparador. Tres niveles de compromiso en lugar de un único botón.

---

## 5. Medición mínima para que el embudo sea gestionable
1. Página `/gracias/` como destino de cada envío, con evento de conversión.
2. Eventos separados por origen del lead: selector de unidad, ficha, comparador, WhatsApp, taller.
3. Campo oculto en el formulario con la unidad y la línea, para saber qué producto genera demanda.

---

## 6. Pendientes antes de publicar
- **Fotografía de las unidades** — ver `IMAGENES.md`.
- Teléfonos reales y directorio de agencias (el prototipo trae 12 de ejemplo).
- Completar los atributos marcados «Por confirmar» de las 11 unidades.
- Aviso de privacidad y consentimiento del formulario.
- Verificar que los slugs de producto coincidan con los del sitio actual antes de migrar.
