# ADR 0001 — Supabase como backend del MVP

**Estado:** aceptado · 2026-08-02

**Contexto.** El producto necesita cuentas, datos relacionales con reglas de acceso finas, tiempo
real para el chat y almacenamiento privado de fotos. El equipo es pequeño y la prioridad es
seguridad, no infraestructura propia.

**Opciones.** (a) Backend propio en Node + Postgres. (b) Firebase. (c) Supabase.

**Decisión.** Supabase. PostgreSQL con Row Level Security permite expresar las reglas de acceso
como parte del esquema y probarlas con SQL; Firebase habría empujado las reglas a un lenguaje
propio y a un modelo de documentos que encaja mal con matches y conversaciones.

**Consecuencias.** La seguridad depende de escribir RLS correctamente, así que las pruebas de
aislamiento son obligatorias. Migrar a un backend propio más adelante es viable porque toda la
lógica sensible ya está en SQL.
