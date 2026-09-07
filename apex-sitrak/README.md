# Apex Sitrak — sitio web

Sitio estático de 19 páginas construido con la paleta y la estructura de la
presentación institucional. HTML, CSS y JavaScript planos: **sin framework, sin
dependencias y sin paso de compilación en el servidor**.

## Ver el sitio

Cualquier servidor estático sirve. Con Node instalado:

```bash
npx http-server apex-sitrak -p 8080
# abrir http://localhost:8080
```

Abrir los archivos con doble clic también funciona, salvo la navegación entre
páginas de `modelos/`.

## Estructura

```
apex-sitrak/
├── index.html              Inicio
├── modelos.html            Catálogo con filtros por línea
├── comparar.html           Comparador de hasta tres unidades
├── cotizar.html            Cotizador: un motor, cuatro guiones
├── postventa.html          Servicio y agenda de taller
├── agencias.html           Red de agencias filtrable por estado
├── nosotros.html           Nuestra historia
├── gracias.html            Destino de conversión de los formularios
├── modelos/                11 fichas técnicas generadas
├── agencias/               12 fichas de sucursal generadas
├── assets/
│   ├── css/apex.css        Toda la hoja de estilo
│   ├── js/data.js          Catálogo para el navegador (generado)
│   ├── js/app.js           Menú, filtros, comparador, cotizador, selector
│   └── img/                Fotografía y favicon
├── _src/                   Fuentes: fragmentos de página y plantillas
│   ├── data.mjs            ← única fuente del catálogo
│   ├── layout.html         Encabezado y pie compartidos
│   ├── modelo.html         Plantilla de ficha técnica
│   └── *.html              Contenido de cada página
├── _build.mjs              Generador
└── _verificar.mjs          Prueba del embudo en navegador real
```

Las carpetas con guion bajo no forman parte del sitio publicado.

## Editar contenido

**Una unidad, una especificación o una agencia:** editar `_src/data.mjs` y
reconstruir. Ese archivo alimenta a la vez las fichas, los filtros del catálogo,
el comparador y los selectores del cotizador.

**El encabezado, el pie o el menú:** editar `_src/layout.html`.

**El contenido de una página:** editar el fragmento correspondiente en `_src/`.
La primera línea es el título y la descripción para buscadores.

Después de cualquier cambio:

```bash
node apex-sitrak/_build.mjs
```

## Comprobar que el embudo no tiene fugas

`_verificar.mjs` recorre los caminos de conversión en un navegador real y falla
si alguno deja de llegar a `gracias.html` con su `origen` correcto. Es la única
prueba del proyecto, y cubre justo lo que importa.

```bash
npm i playwright     # solo la biblioteca
node apex-sitrak/_verificar.mjs
```

## El embudo

Todo el sitio desemboca en **una sola página de conversión**, `gracias.html`, y
en un solo formulario. No hay cuatro formularios: hay una máquina de pasos
(`cotizador()` en `assets/js/app.js`) y un guion por intención, definido en el
mapa `GUIONES`:

| Enlace | Guion | Pasos |
|---|---|---|
| `cotizar.html` | `unidad` | línea → unidad → enganche → contacto |
| `cotizar.html?tipo=seminuevo&sn=sn-003` | `seminuevo` | unidad → enganche → contacto |
| `cotizar.html?tipo=refaccion&np=[FIL-4001]` | `refaccion` | refacción → contacto |
| `cotizar.html?tipo=taller&ag=monterrey` | `taller` | servicio → contacto |

Quien busca una refacción no contesta «¿qué tipo de unidad buscas?».

### El contexto viaja en la URL

Cada llamado a la acción del sitio etiqueta de dónde viene, para que el asesor
reciba el lead con los datos ya puestos y para poder medir qué parte del sitio
trae los leads:

| Parámetro | Significado |
|---|---|
| `u` | unidad nueva (slug del modelo) |
| `sn` | unidad seminueva (id de inventario) |
| `np` | número de parte |
| `ag` | agencia |
| `tipo` | guion del cotizador |
| `origen` | página de la que salió el visitante |
| `cpk`, `km`, `rend` | lo que el visitante calculó en la calculadora |

Se leen con `parametros()` y se arman con `aConsulta()`, ambos en `app.js`. Son
el único lugar del código donde se toca la consulta de la URL.

### La calculadora no esconde el número

El costo por kilómetro se muestra **completo y gratis**: se calcula con las
cifras del propio visitante y esconderlo se nota. Lo que se pide a cambio del
contacto es el paso siguiente, que de todos modos necesita a una persona: el
comparativo contra una unidad Sitrak en su ruta. El cálculo **no supone ningún
rendimiento de una unidad Sitrak** — es aritmética sobre los datos capturados —
y así debe quedarse: es lo que hace que el número aguante una junta.

### El evento de conversión

`gracias.html` dispara `dataLayer.push({ event: "generate_lead", origen,
tipo_solicitud, unidad, linea, agencia })`. Es el único punto de medición del
sitio; conectarlo a Google Tag Manager es lo que permite saber qué trae los
leads y a qué agencia se fueron.

## La red de agencias

Las 24+ sucursales son **todas propias de Apex** y las mantiene marketing
central. `AGENCIAS` en `_src/data.mjs` es la fuente única: alimenta el listado,
las fichas de sucursal, el JSON-LD `AutoDealer` de cada una y el enrutamiento de
leads. Agregar una sucursal es agregar un renglón, no una plantilla.

**Enrutamiento.** `COBERTURA` se deriva del campo `cobertura` de cada agencia
—para que no existan dos verdades— y cubre los 32 estados. Cuando el visitante
elige su estado en el cotizador, el sitio le dice qué agencia lo atiende y el
lead sale etiquetado con ella. Un estado sin sucursal propia está asignado
explícitamente en el dato, nunca por cercanía adivinada.

**Un solo WhatsApp.** El canal del sitio es único (`CONTACTO.whatsapp`) y
reparte; los teléfonos por sucursal siguen publicados para llamada directa. Es
la única forma de saber cuántos leads entraron y cuáles se contestaron.

**Contra la canibalización.** Veinticuatro páginas de ubicación calcadas compiten
entre sí y no posiciona ninguna. Cada ficha de agencia lleva tres bloques
obligatoriamente distintos, y ninguna debe publicarse sin ellos:

1. Cobertura con las rutas e industrias reales de esa plaza (`ruta`, `industrias`)
2. El inventario de seminuevos de esa sucursal
3. El asesor responsable, con nombre

**El dato envejece.** Con marketing manteniendo las 24 fichas, un horario viejo
no se nota. Por eso cada agencia tiene `actualizado` y la ficha lo muestra.
Conviene una revisión trimestral en el calendario.

## Paleta y tipografía

| Elemento | Valor |
|---|---|
| Navy de marca | `#223B5D` |
| Navy profundo | `#16283F` |
| Gris | `#B5B6B6` |
| Blanco | `#FFFFFF` |
| Ámbar (único acento) | `#E0A03A` |
| Titulares | Archivo 700/800, versalitas espaciadas |
| Texto | IBM Plex Sans 400/500/600 |

El ámbar no viene de la presentación: se tomó de las luces de posición del
tractocamión de la propia fotografía, y se usa solo en el llamado a la acción
primario y en indicadores de estado activo. Si se quiere fidelidad estricta a los
tres colores del manual, basta cambiar `--amber` en `assets/css/apex.css`.

## Qué falta antes de publicar

- **Fotografía.** Las tres imágenes actuales son recortes de la presentación, a
  baja resolución. Sustituir por material propio.
- **Las cuatro cifras del apartado NOSOTROS** de la presentación (3.ª / 47,000 /
  7.ª / 100): no eran legibles en la captura, así que la franja usa cifras
  verificadas de Sinotruk.
- **CEMEX y «5,000+ unidades operando»:** validar cifra y vigencia.
- **Teléfonos, directorio de agencias y logos de clientes:** hoy son marcadores
  entre corchetes.
- **El número de la línea de WhatsApp Business** (`CONTACTO.whatsapp` en
  `_src/data.mjs`) y los nombres de los asesores por agencia.
- **`placeId` de cada Google Business Profile.** Faltan los 24 perfiles, con
  nombre, dirección y teléfono idénticos a la ficha del sitio y cada uno
  enlazando a su página: es donde nacen los leads locales.
- **Especificaciones marcadas «Por confirmar»** en `_src/data.mjs`: esa lista es
  exactamente lo que falta capturar de la ficha oficial.
- **Aviso de privacidad** y destino real de los formularios.

## Traslado a WordPress con Elementor

Este sitio es la referencia visual y funcional. Hay tres formas de llevarlo:

1. **Reconstruir en Elementor** siguiendo `redesign/ELEMENTOR.md`: colores y
   fuentes globales, contenedores flex, Loop Grid sobre productos de WooCommerce
   y formulario multipaso nativo. Es la vía que deja todo editable desde el panel.
2. **Incrustar los módulos interactivos.** El comparador, el cotizador y el
   selector de unidad son JavaScript autocontenido: se pegan tal cual en un widget
   **HTML** de Elementor. Requieren `assets/js/data.js` y `assets/js/app.js`.
3. **Tema hijo.** `assets/css/apex.css` puede cargarse desde un tema hijo para que
   WordPress herede exactamente la misma paleta, tipografía y componentes.

La recomendación es la 1 para las páginas de contenido y la 2 para los tres
módulos interactivos, que en Elementor no existen como widget nativo.

Equivalencias directas:

| Pieza del sitio | En WordPress |
|---|---|
| Cotizador con guiones | Form de Elementor Pro con campo `Step`, uno por guion |
| Descarga de ficha técnica | Popup de Elementor con un solo campo |
| Fichas de agencia | CPT `agencia`, importado con WP All Import desde la hoja de marketing central |
| `generate_lead` | Google Tag Manager |

Como la información la mantiene marketing central, el flujo de captura no puede
ser 24 formularios: la fuente es una hoja de cálculo con una fila por agencia, y
actualizar los horarios de las 24 pasa a ser editar una columna.
