# ADR 0004 — La ubicación precisa no se recopila

**Estado:** aceptado · 2026-08-02

**Contexto.** El producto necesita distancia para recomendar, y el riesgo de stalking es real en
una app donde personas desconocidas se conocen.

**Decisión.** No se lee GPS en el MVP: la persona escribe su zona y se guarda el centro aproximado
de esa zona, redondeado a dos decimales (~1.1 km), con un `CHECK` que rechaza más precisión. Hacia
otros usuarios se expone un decimal (~11 km) y una distancia estimada.

**Consecuencias.** Las distancias son aproximadas y en zonas densas pueden verse gruesas. A
cambio, una filtración de base de datos no revela dónde vive nadie. Si más adelante se usa GPS
para autocompletar la zona, el redondeo debe ocurrir en el dispositivo antes de enviar.
