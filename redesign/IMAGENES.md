# Manifiesto de imágenes

## Estado: no se pudieron descargar

`apexsitrak.com` está **bloqueado por el proxy de egress** de este entorno. Todo intento
—página, `wp-json/wp/v2/media`, `wp-content/uploads/`— devuelve `403` en el túnel CONNECT:

```
curl: (56) CONNECT tunnel failed, response 403
Host not in allowlist: www.apexsitrak.com
```

No es un problema del sitio ni de credenciales: el entorno solo permite salir hacia una lista
de dominios autorizados.

### Cómo desbloquearlo
1. **Agregar el dominio a la lista de egress del entorno** — en Claude Code en la web, ajustes
   del entorno → configuración de red → agregar `apexsitrak.com` y `www.apexsitrak.com`.
   Con eso puedo bajar las imágenes originales y colocarlas en su hueco.
2. **O adjuntar las imágenes** aquí en el chat (un ZIP del `wp-content/uploads` sirve), o
   dejarlas en el repositorio bajo `redesign/img/`.

Mientras tanto, cada hueco del prototipo está marcado con el nombre de archivo que le
corresponde y sus medidas, para que colocarlas sea mecánico.

---

## Huecos de imagen del prototipo

| # | Página | Ubicación | Archivo | Medida | Encuadre sugerido |
|---|---|---|---|---|---|
| 1 | Inicio | Hero | `hero-c7h-540.jpg` | 1920 × 1536 | 3/4 frontal, unidad completa, fondo neutro u obra |
| 2 | Inicio / Modelos | Tarjeta | `c7h-540-6x4.jpg` | 1600 × 1000 | Lateral 3/4, unidad limpia |
| 3 | Inicio / Modelos | Tarjeta | `c7h-480-6x4.jpg` | 1600 × 1000 | Mismo encuadre que la anterior |
| 4 | Inicio / Modelos | Tarjeta | `t7h-tracto.jpg` | 1600 × 1000 | Mismo encuadre |
| 5 | Modelos | Tarjeta | `c7h-chasis-360.jpg` | 1600 × 1000 | Chasis desnudo, lateral |
| 6 | Modelos | Tarjeta | `volteo-6x4.jpg` | 1600 × 1000 | Caja levantada o en obra |
| 7 | Modelos | Tarjeta | `volteo-8x4.jpg` | 1600 × 1000 | En mina o terracería |
| 8 | Modelos | Tarjeta | `c7h-6x6.jpg` | 1600 × 1000 | Con carga extradimensionada |
| 9 | Modelos | Tarjeta | `ligero-6t.jpg` | 1600 × 1000 | Entorno urbano |
| 10 | Modelos | Tarjeta | `ligero-8t.jpg` | 1600 × 1000 | Entorno urbano |
| 11–19 | Ficha de modelo | Principal | `{slug}.jpg` | 1600 × 1280 | Reutiliza la de la tarjeta en 5:4 |
| 11–19b | Ficha de modelo | Secundaria | `{slug}-cabina.jpg` | 1600 × 1000 | Interior de cabina o detalle de motor |
| 20 | Agencias | Mapa | `mapa-republica.svg` | vectorial | República con un punto por agencia |

**Formato:** WebP con respaldo JPG, calidad 80. Ancho máximo servido 1920 px.
**Alt text:** describe la unidad y su uso («Tractocamión Sitrak C7H 540 6×4 en carretera»),
no solo el modelo — cuenta para SEO de imágenes y para accesibilidad.
