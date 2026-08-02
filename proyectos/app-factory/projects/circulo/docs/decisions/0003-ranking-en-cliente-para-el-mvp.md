# ADR 0003 — El orden de las recomendaciones se calcula en el cliente durante el MVP

**Estado:** aceptado, con condición de salida · 2026-08-02

**Contexto.** El algoritmo está en TypeScript (`@circulo/matching`) y se comparte entre app y
pruebas. Ejecutarlo en el servidor exigiría reimplementarlo en SQL o desplegar una Edge Function
con una copia del paquete, y mantener dos implementaciones sincronizadas es la forma más rápida de
que diverjan.

**Decisión.** Los filtros duros (seguridad y privacidad) se ejecutan en SQL dentro de
`discovery_candidates`. La puntuación, las explicaciones y la equidad de exposición se ejecutan en
el cliente sobre los candidatos que el servidor ya autorizó. El servidor registra impresiones y
explicaciones, de modo que la distribución de exposición se puede auditar aunque el orden se
calcule en el dispositivo.

**Consecuencias.** Un cliente modificado puede reordenar lo que ve, pero no puede ver a nadie que
el servidor no le habría mostrado, ni evitar que se registre la impresión. **Condición de salida:**
mover `recommend()` a una Edge Function cuando (a) haya señales de manipulación del orden, (b) las
tandas superen los 200 candidatos, o (c) el ranking empiece a usar señales agregadas de otros
usuarios.
