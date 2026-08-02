# Sistema de diseño

Tokens en `packages/config/src/index.ts`, implementados en
`apps/mobile/src/components/ui.tsx` y en `apps/admin/app/globals.css`.

## Tono

Cálido, tranquilo, adulto. Nada de estética de app de citas: sin rojos y rosas románticos, sin
corazones, sin gamificación agresiva, sin sensación de catálogo de personas.

## Color

| Token | Claro | Oscuro | Uso |
|-------|-------|--------|-----|
| background | `#FBF8F4` | `#16130F` | Fondo |
| surface | `#FFFFFF` | `#211C17` | Tarjetas |
| primary | `#1F6F63` | `#6FD3C0` | Acción principal (verde azulado: conversación) |
| accent | `#E08A3C` | `#F0A55E` | Detalles cálidos |
| danger | `#B3261E` | `#F2B8B5` | Acciones destructivas |

El color nunca es la única señal: los estados llevan también texto.

## Espaciado, radios, tipografía

Espaciado 4/8/16/24/32/48. Radios 8/14/22/pill. Escala tipográfica display/title/subtitle/body/
caption, toda con Dynamic Type del sistema.

## Componentes

`Screen`, `Title`, `Heading`, `Body`, `Caption`, `Card`, `Button` (primary, secondary, quiet,
danger, con estado de carga), `Chip` (seleccionable como checkbox), `Field` (etiqueta, pista,
error), `Loading`, `EmptyState`, `ErrorState`, `Divider`, `Row`.

## Accesibilidad

- Área táctil mínima de 44×44 pt en botones, chips y campos.
- Todos los controles llevan `accessibilityRole`, etiqueta y estado.
- Los errores se anuncian con `accessibilityLiveRegion`.
- Contraste AA en ambos temas.
- El tema oscuro no es una inversión: es una paleta propia.

## Regla

Introducir un color, un espaciado, un radio o una variante nueva exige actualizar este documento y
`packages/config`. Las pantallas no definen estilos propios fuera de composición.
