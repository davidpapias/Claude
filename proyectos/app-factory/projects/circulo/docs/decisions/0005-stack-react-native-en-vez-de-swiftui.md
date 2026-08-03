# ADR 0005 — React Native en lugar de la plantilla SwiftUI de la fábrica

**Estado:** aceptado · 2026-08-02

**Contexto.** La plantilla por defecto de la fábrica (`templates/ios-swiftui-app`) es Swift +
SwiftUI, iOS nativo. La especificación de este producto pide explícitamente React Native con Expo,
Supabase y un panel en Next.js, y pide cubrir iOS y Android desde el principio.

**Decisión.** Se sigue el stack pedido por el producto. La plantilla de la fábrica no se usa para
este proyecto.

**Consecuencias.** Se pierden algunas convenciones nativas de Apple que la plantilla imponía, y se
gana una sola base de código para las dos plataformas y tipos compartidos entre app, panel y base
de datos. Si la fábrica va a producir más productos multiplataforma, conviene añadir una plantilla
`expo-supabase-app` extraída de este proyecto; hasta entonces, esta decisión aplica solo aquí.

**Correspondencia con los documentos obligatorios de la fábrica.** Este proyecto usa la estructura
de documentos pedida por la especificación del producto. La equivalencia es:
`00/03 → product-spec.md` y `mvp-scope.md`, `04 → user-flows.md`, `05 → design-system.md`,
`07 → architecture.md`, `08 → database.md`, `09 → analytics.md`, `12 → backlog.md` (estado y
riesgos) y `supabase/tests`, `DECISIONS → docs/decisions/`. Los documentos de la fábrica sin
equivalente aquí (`10-Monetization`, `11-ASO`, `13-Launch`) quedan pendientes porque V1 no incluye
monetización ni lanzamiento en tienda.
