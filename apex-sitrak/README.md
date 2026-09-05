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
├── cotizar.html            Cotizador de cuatro pasos
├── postventa.html          Servicio y agenda de taller
├── agencias.html           Red de agencias filtrable por estado
├── nosotros.html           Nuestra historia
├── gracias.html            Destino de conversión de los formularios
├── modelos/                11 fichas técnicas generadas
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
└── _build.mjs              Generador
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
