# Sistema de recomendaciones

Implementación: `packages/matching`. Pruebas: `packages/matching/src/__tests__` (35 casos).
Herramienta de inspección: `pnpm --filter @circulo/matching compare`.

## Tubería

```
candidatos (SQL: filtros duros) → puntuación 0–100 → explicaciones → ajuste de exposición → orden
```

### 1. Filtros duros (`filters.ts` + `discovery_candidates`)

Cuenta activa · perfil completo · no bloqueado en ninguna dirección · no decidido recientemente
(el pase caduca a los 30 días) · no conectado ya · distancia aceptable **para ambos** · idioma
compartido · preferencias de edad satisfechas **en ambos sentidos** · intenciones compatibles ·
disponibilidad con al menos un cruce · no oculto en descubrimiento.

Los filtros críticos para seguridad y privacidad se aplican en SQL; `filters.ts` los repite para
poder probarlos y para que el cliente no muestre a alguien que el servidor ya excluyó.

### 2. Puntuación (`scoring.ts`)

| Componente | Peso | Cómo se calcula |
|------------|------|-----------------|
| Intención | 20 | 0 sin intención compartida; 0.7 con una; +0.3 con dos o más |
| Estilo social | 18 | energía 45% · tamaño de grupo 35% · velocidad de confianza 20% |
| Disponibilidad | 15 | cruces de franjas, saturando en 4 |
| Intereses | 15 | intereses compartidos, saturando en 5 |
| Comunicación | 12 | frecuencia 60% · estilos compartidos 40% |
| Planes | 8 | tipo de plan 50% · espontaneidad 30% · alcohol 20% |
| Distancia | 7 | lineal hasta el límite más estricto de los dos |
| Idiomas | 5 | idiomas compartidos, saturando en 2 |

La puntuación es simétrica: `score(a, b) === score(b, a)`. Ordena candidatos; **no** afirma
compatibilidad psicológica. Un candidato por debajo de 25 puntos no se muestra.

### 3. Explicaciones (`explanations.ts`)

Entre una y tres frases, siempre verificables leyendo ambos perfiles. Si no hay ninguna frase
concreta, el candidato no se recomienda. Está prohibido mostrar porcentajes de compatibilidad
psicológica o afirmaciones sobre la personalidad; hay una prueba que lo verifica.

### 4. Equidad de exposición (`exposure.ts`)

- Exploración determinista: hasta 4 puntos de ruido estable por par (seed, viewer, candidato).
- Piso para perfiles nuevos: hasta 6 puntos si tiene menos de 14 días y menos de 25 impresiones.
- Techo por sobreexposición: hasta −8 puntos, logarítmico a partir de 60 impresiones en 7 días.
- Cuentas marcadas como spam: −25 puntos.

No se usa ninguna señal de popularidad: ni likes recibidos, ni matches, ni tasa de aceptación.

### 5. Atributos protegidos

`assertNoProtectedAttributes` lanza `ProtectedAttributeError` si un perfil que llega al ranking
contiene género, pronombres, etnia, religión, orientación, discapacidad, salud, afiliación
política, nacionalidad o estatus migratorio. Los pronombres existen en el perfil público para que
la persona se exprese; nunca entran al orden.

## Determinismo

Con la misma semilla y los mismos datos, la tanda es idéntica. Eso hace reproducibles los reportes
"¿por qué me mostraron a esta persona?" (`recommendation_batches` + `recommendation_explanations`).

## Evolución

`recommend()` es la interfaz estable. Sustituirla por un servicio de ranking implica reemplazar esa
función manteniendo entrada y salida; las pruebas de determinismo, equidad y explicabilidad se
mantienen como contrato. Señales ya registradas para esa etapa: likes, pases, matches,
conversaciones iniciadas y respondidas, encuentros confirmados en privado, bloqueos y reportes.
