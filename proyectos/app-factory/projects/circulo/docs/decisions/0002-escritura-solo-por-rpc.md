# ADR 0002 — Las escrituras sensibles pasan solo por funciones RPC

**Estado:** aceptado · 2026-08-02

**Contexto.** Un cliente con la clave anónima puede intentar cualquier operación. Crear un match,
enviar un mensaje o bloquear a alguien tiene invariantes que una política de fila sola no expresa
bien (transaccionalidad, idempotencia, límites de tasa, efectos colaterales).

**Decisión.** No se otorga `insert` sobre `matches`, `messages`, `profile_decisions`, `blocks` ni
`reports`. Todo pasa por funciones `SECURITY DEFINER` que verifican permisos, consumen el límite
de tasa y hacen el trabajo en una sola transacción.

**Consecuencias.** La superficie de escritura es pequeña y auditable. El precio es que añadir una
función de escritura implica una migración; a cambio, el cliente no puede inventar estados
imposibles.
