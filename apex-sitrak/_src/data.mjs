// Fuente única de datos del catálogo.
// El build genera con esto las fichas estáticas y assets/js/data.js para el navegador.

export const PC = "Por confirmar";

export const LINEAS = [
  {
    id: "ligeros",
    nombre: "Camiones ligeros",
    desc: "Operación urbana con agilidad, eficiencia de combustible y capacidad de carga optimizada.",
    img: "assets/img/tracto-wide.jpg"
  },
  {
    id: "medianos",
    nombre: "Camiones medianos",
    desc: "Versatilidad y robustez para entornos urbanos y rurales, con capacidad intermedia.",
    img: "assets/img/tracto-wide.jpg"
  },
  {
    id: "vocacionales",
    nombre: "Camiones vocacionales",
    desc: "Construcción, minería y servicios municipales. Durabilidad extrema en alta demanda.",
    img: "assets/img/tracto-frente.jpg"
  },
  {
    id: "gran-dimension",
    nombre: "Grandes dimensiones",
    desc: "Cargas sobredimensionadas con seguridad, estabilidad y rendimiento.",
    img: "assets/img/tracto-frente.jpg"
  },
  {
    id: "tractocamiones",
    nombre: "Tractocamiones",
    desc: "Máxima eficiencia y confiabilidad en transporte de larga distancia y carga pesada.",
    img: "assets/img/tracto-hero.jpg",
    destacada: true
  }
];

// Renglones que forman la ficha y el comparador. `best` marca el campo numérico
// con el que se resalta el valor más alto de la fila.
export const CAMPOS = [
  { k: "app",    label: "Aplicación" },
  { k: "trac",   label: "Tracción" },
  { k: "motor",  label: "Motor" },
  { k: "hpTxt",  label: "Potencia", best: "hp" },
  { k: "torque", label: "Torque" },
  { k: "cil",    label: "Cilindrada" },
  { k: "trans",  label: "Transmisión" },
  { k: "ejeD",   label: "Eje delantero" },
  { k: "ejeT",   label: "Eje trasero" },
  { k: "susp",   label: "Suspensión" },
  { k: "tank",   label: "Tanque de combustible" },
  { k: "tire",   label: "Llantas y rines" },
  { k: "cap",    label: "Capacidad" }
];

export const MODELOS = [
  {
    slug: "sitrak-tracto-diesel-540hp-6x4",
    nombre: "Sitrak Tracto Diesel 540HP 6×4",
    linea: "tractocamiones",
    uso: "Larga distancia",
    destacado: true,
    img: "assets/img/tracto-hero.jpg",
    desc: "La configuración más vendida de la gama: carretera federal y arrastre full, con el par disponible desde las 1,000 rpm.",
    app: "Carretera federal",
    trac: "6×4",
    motor: "MT13.54-50 · tecnología MAN",
    hp: 540, hpTxt: "540 HP @ 1,900 rpm",
    torque: "1,844 lb-ft @ 1,000–1,400 rpm",
    cil: "13 L · 6 cilindros",
    trans: "ZF 16S2531TO · 16 vel. con retardador",
    ejeD: "MVP09 · 20,000 lb · freno de tambor",
    ejeT: "MCP16 · 70,500 lb",
    susp: "Neumática con amortiguador hidráulico",
    tank: "900 L",
    tire: "315/80R22.5 · rin de aluminio 22.5",
    cap: "Arrastre full"
  },
  {
    slug: "sitrak-tracto-540hp-6x4-amt",
    nombre: "Sitrak Tracto 540HP 6×4 AMT",
    linea: "tractocamiones",
    uso: "Larga distancia",
    img: "assets/img/tracto-wide.jpg",
    desc: "Misma potencia con transmisión automatizada: menos fatiga del operador y consumo más parejo entre turnos.",
    app: "Carretera federal",
    trac: "6×4",
    motor: "MT13.54-50 · tecnología MAN",
    hp: 540, hpTxt: "540 HP",
    torque: "1,844 lb-ft",
    cil: "13 L · 6 cilindros",
    trans: "AMT Sinotruk · 12 vel. con retardador",
    ejeD: PC, ejeT: PC,
    susp: "Neumática",
    tank: "900 L",
    tire: "315/80R22.5",
    cap: "Arrastre full"
  },
  {
    slug: "sitrak-g7-540hp-6x4",
    nombre: "Sitrak G7 540HP 6×4",
    linea: "tractocamiones",
    uso: "Premium",
    img: "assets/img/tracto-wide.jpg",
    desc: "Cabina de mayor confort para operadores de ruta larga, con paquete de asistencia al conductor.",
    app: "Larga distancia",
    trac: "6×4",
    motor: "MT13 · tecnología MAN",
    hp: 540, hpTxt: "540 HP",
    torque: PC,
    cil: "13 L · 6 cilindros",
    trans: "AMT 12 vel. / ZF 16 vel.",
    ejeD: PC, ejeT: PC,
    susp: "Neumática",
    tank: PC, tire: PC,
    cap: "Arrastre full"
  },
  {
    slug: "sitrak-mini-tracto-330hp-6x4",
    nombre: "Sitrak Mini Tracto 330HP 6×4",
    linea: "tractocamiones",
    uso: "Regional",
    img: "assets/img/tracto-wide.jpg",
    desc: "Tracto compacto para rutas cortas y maniobra de patio, con menor inversión inicial por unidad.",
    app: "Regional y patio",
    trac: "6×4",
    motor: "Sinotruk",
    hp: 330, hpTxt: "330 HP",
    torque: PC, cil: PC, trans: PC,
    ejeD: PC, ejeT: PC, susp: PC, tank: PC, tire: PC,
    cap: "Arrastre ligero"
  },
  {
    slug: "sitrak-62k-330hp-6x4",
    nombre: "Sitrak 62K 330HP 6×4",
    linea: "medianos",
    uso: "Carga 20 t",
    img: "assets/img/tracto-frente.jpg",
    desc: "Camión de carga de 20 toneladas para distribución regional y carrocería a la medida.",
    app: "Distribución regional",
    trac: "6×4",
    motor: "Sinotruk",
    hp: 330, hpTxt: "330 HP",
    torque: PC, cil: PC, trans: PC,
    ejeD: PC, ejeT: PC, susp: PC, tank: PC, tire: PC,
    cap: "20 t de carga"
  },
  {
    slug: "sitrak-chasis-360hp-6x4",
    nombre: "Sitrak Chasis 360HP 6×4",
    linea: "medianos",
    uso: "Carga 25 t",
    img: "assets/img/tracto-frente.jpg",
    desc: "Chasis para caja seca, refrigerada, plataforma o equipo especializado montado por carrocero aliado.",
    app: "Carrocería a la medida",
    trac: "6×4",
    motor: "MC11.36-50 · Euro V SCR",
    hp: 360, hpTxt: "360 HP",
    torque: PC,
    cil: "11 L · 6 cilindros",
    trans: "ZF · 16 velocidades",
    ejeD: PC, ejeT: PC, susp: PC, tank: PC,
    tire: "Rin 22.5",
    cap: "Hasta 25 t de carga"
  },
  {
    slug: "sitrak-volteo-6x4",
    nombre: "Sitrak Volteo 6×4",
    linea: "vocacionales",
    uso: "Obra",
    img: "assets/img/tracto-frente.jpg",
    desc: "Caja de volteo de 16 m³, por encima de los 14 m³ que ofrece el estándar del mercado.",
    app: "Material pétreo y terracería",
    trac: "6×4",
    motor: "Sinotruk · tecnología alemana",
    hp: 360, hpTxt: PC,
    torque: PC, cil: PC,
    trans: "ZF · 16 velocidades",
    ejeD: PC, ejeT: PC,
    susp: "Muelle reforzado",
    tank: PC, tire: PC,
    cap: "Caja de 16 m³"
  },
  {
    slug: "sitrak-8x4-minero",
    nombre: "Sitrak 8×4 Minero",
    linea: "vocacionales",
    uso: "Minería",
    img: "assets/img/tracto-frente.jpg",
    desc: "Unidad equipada para minería, construcción y operación fuera de camino.",
    app: "Minería y off-road",
    trac: "8×4",
    motor: "Sinotruk · tecnología alemana",
    hp: 400, hpTxt: PC,
    torque: PC, cil: PC, trans: PC,
    ejeD: PC, ejeT: PC,
    susp: "Muelle reforzado",
    tank: PC, tire: PC, cap: PC
  },
  {
    slug: "sitrak-6x6-arrastre-pesado",
    nombre: "Sitrak 6×6 Arrastre Pesado",
    linea: "gran-dimension",
    uso: "Sobredimensionado",
    img: "assets/img/tracto-frente.jpg",
    desc: "Tracción en los tres ejes y componentes reforzados para arrastre extremo.",
    app: "Carga extradimensionada",
    trac: "6×6",
    motor: "Sinotruk · tecnología alemana",
    hp: 540, hpTxt: PC,
    torque: PC, cil: PC, trans: PC,
    ejeD: "Reforzado", ejeT: "Reforzado",
    susp: "Reforzada",
    tank: PC, tire: PC,
    cap: "Arrastre de hasta 150 t"
  },
  {
    slug: "sitrak-6t",
    nombre: "Sitrak 6T",
    linea: "ligeros",
    uso: "Última milla",
    img: "assets/img/tracto-wide.jpg",
    desc: "Diseñado para operación urbana: maniobrabilidad en espacios reducidos y bajo mantenimiento.",
    app: "Distribución urbana",
    trac: "4×2",
    motor: "G3W",
    hp: 154, hpTxt: "154 HP (115 kW) @ 2,600 rpm",
    torque: PC, cil: PC, trans: PC,
    ejeD: PC, ejeT: PC, susp: PC, tank: PC, tire: PC,
    cap: "6 t de capacidad"
  },
  {
    slug: "sitrak-8t",
    nombre: "Sitrak 8T",
    linea: "ligeros",
    uso: "Reparto regional",
    img: "assets/img/tracto-wide.jpg",
    desc: "Un escalón más de capacidad conservando el formato urbano y la eficiencia de combustible.",
    app: "Distribución regional",
    trac: "4×2",
    motor: "G3W",
    hp: 168, hpTxt: "168 HP",
    torque: PC, cil: PC, trans: PC,
    ejeD: PC, ejeT: PC, susp: PC, tank: PC, tire: PC,
    cap: "8 t de capacidad"
  }
];

export const AGENCIAS = [
  { slug: "monterrey",    ciudad: "Monterrey",    estado: "Nuevo León",     tel: "[81 0000 0000]",  direccion: "[Av. Ejemplo 1000, Parque Industrial]", cp: "[64000]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: true, ruta: "Corredor Monterrey–Laredo", lat: 25.6866, lng: -100.3161 },
  { slug: "guadalajara",  ciudad: "Guadalajara",  estado: "Jalisco",        tel: "[33 0000 0000]",  direccion: "[Av. Ejemplo 1000, Zona Industrial]",   cp: "[44940]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: true, ruta: "Occidente y Bajío", lat: 20.6597, lng: -103.3496 },
  { slug: "xalapa",       ciudad: "Xalapa",       estado: "Veracruz",       tel: "[228 000 0000]",  direccion: "[Carretera Ejemplo km 5]",              cp: "[91000]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: true, ruta: "Golfo y planta de producción", lat: 19.5438, lng: -96.9102 },
  { slug: "queretaro",    ciudad: "Querétaro",    estado: "Querétaro",      tel: "[442 000 0000]",  direccion: "[Carretera Ejemplo km 12]",             cp: "[76120]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: true, ruta: "Bajío y centro del país", lat: 20.5888, lng: -100.3899 },
  { slug: "cuautitlan",   ciudad: "Cuautitlán",   estado: "Edo. de México", tel: "[55 0000 0000]",  direccion: "[Av. Ejemplo 1000]",                    cp: "[54800]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: true, ruta: "Zona Metropolitana del Valle de México", lat: 19.6697, lng: -99.1817 },
  { slug: "puebla",       ciudad: "Puebla",       estado: "Puebla",         tel: "[222 000 0000]",  direccion: "[Blvd. Ejemplo 1000]",                  cp: "[72220]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: false, ruta: "Corredor México–Veracruz", lat: 19.0414, lng: -98.2063 },
  { slug: "leon",         ciudad: "León",         estado: "Guanajuato",     tel: "[477 000 0000]",  direccion: "[Blvd. Ejemplo 1000]",                  cp: "[37160]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: true, ruta: "Bajío industrial", lat: 21.1219, lng: -101.6833 },
  { slug: "saltillo",     ciudad: "Saltillo",     estado: "Coahuila",       tel: "[844 000 0000]",  direccion: "[Carretera Ejemplo km 8]",              cp: "[25000]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: false, ruta: "Corredor automotriz del noreste", lat: 25.4232, lng: -101.0053 },
  { slug: "chihuahua",    ciudad: "Chihuahua",    estado: "Chihuahua",      tel: "[614 000 0000]",  direccion: "[Av. Ejemplo 1000]",                    cp: "[31100]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: false, ruta: "Frontera y corredor norte", lat: 28.6330, lng: -106.0691 },
  { slug: "hermosillo",   ciudad: "Hermosillo",   estado: "Sonora",         tel: "[662 000 0000]",  direccion: "[Blvd. Ejemplo 1000]",                  cp: "[83000]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: false, ruta: "Noroeste y Pacífico", lat: 29.0729, lng: -110.9559 },
  { slug: "nuevo-laredo", ciudad: "Nuevo Laredo", estado: "Tamaulipas",     tel: "[867 000 0000]",  direccion: "[Carretera Ejemplo km 3]",              cp: "[88000]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: true, ruta: "Cruce fronterizo de mayor volumen del país", lat: 27.4763, lng: -99.5164 },
  { slug: "merida",       ciudad: "Mérida",       estado: "Yucatán",        tel: "[999 000 0000]",  direccion: "[Periférico Ejemplo km 20]",            cp: "[97300]", horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00", taller: true, partes: false, ruta: "Península de Yucatán", lat: 20.9674, lng: -89.5926 }
];

// Selector de unidad: tres preguntas → una línea recomendada.
export const PREGUNTAS = [
  {
    k: "carga", q: "¿Qué mueves?",
    opts: [
      { v: "urbano",   b: "Reparto urbano",          s: "Paquetería, abarrote, última milla" },
      { v: "general",  b: "Carga general",           s: "Caja seca, refrigerada o plataforma" },
      { v: "granel",   b: "Material a granel",       s: "Pétreo, terracería, obra" },
      { v: "especial", b: "Carga sobredimensionada", s: "Maquinaria, estructuras" }
    ]
  },
  {
    k: "zona", q: "¿Dónde operas?",
    opts: [
      { v: "ciudad",    b: "Ciudad",            s: "Rutas cortas, muchas paradas" },
      { v: "carretera", b: "Carretera federal", s: "Largas distancias" },
      { v: "obra",      b: "Obra o mina",       s: "Fuera de camino" },
      { v: "mixto",     b: "Mixto",             s: "Ciudad y carretera" }
    ]
  },
  {
    k: "peso", q: "¿Cuánto peso mueves por viaje?",
    opts: [
      { v: "8",    b: "Hasta 8 toneladas",     s: "Unidad ligera" },
      { v: "25",   b: "8 a 25 toneladas",      s: "Unidad mediana" },
      { v: "35",   b: "Más de 25 toneladas",   s: "Vocacional o pesado" },
      { v: "full", b: "Arrastre full",         s: "Tractocamión" }
    ]
  }
];


// ── Seminuevos ────────────────────────────────────────────────────────────
// Inventario de unidades usadas. Cada registro se publica como ficha propia.
export const SEMINUEVOS = [
  { id: "sn-001", nombre: "Sitrak Tracto Diesel 540HP 6×4", anio: 2023, km: 285000, precio: 1450000, agencia: "monterrey",    condicion: "Excelente", img: "assets/img/tracto-wide.jpg",  nota: "Un solo operador, mantenimiento en agencia, con historial de servicio completo." },
  { id: "sn-002", nombre: "Sitrak Tracto 540HP 6×4 AMT",    anio: 2023, km: 412000, precio: 1320000, agencia: "guadalajara",  condicion: "Muy bueno",  img: "assets/img/tracto-wide.jpg",  nota: "Transmisión automatizada, llantas al 70 %." },
  { id: "sn-003", nombre: "Sitrak Tracto Diesel 540HP 6×4", anio: 2022, km: 540000, precio: 1180000, agencia: "queretaro",    condicion: "Muy bueno",  img: "assets/img/tracto-hero.jpg",  nota: "Ruta federal, retardador ZF en buen estado." },
  { id: "sn-004", nombre: "Sitrak Volteo 6×4",              anio: 2022, km: 198000, precio: 1240000, agencia: "leon",         condicion: "Bueno",      img: "assets/img/tracto-frente.jpg", nota: "Caja de 16 m³, uso en obra, chasis sin golpes." },
  { id: "sn-005", nombre: "Sitrak Chasis 360HP 6×4",        anio: 2023, km: 156000, precio: 980000,  agencia: "cuautitlan",   condicion: "Excelente",  img: "assets/img/tracto-frente.jpg", nota: "Con caja seca de 8.5 m incluida." },
  { id: "sn-006", nombre: "Sitrak 62K 330HP 6×4",           anio: 2021, km: 620000, precio: 720000,  agencia: "puebla",       condicion: "Bueno",      img: "assets/img/tracto-frente.jpg", nota: "Reparto regional, motor con servicio mayor reciente." },
  { id: "sn-007", nombre: "Sitrak 6T",                      anio: 2023, km: 88000,  precio: 520000,  agencia: "merida",       condicion: "Excelente",  img: "assets/img/tracto-wide.jpg",  nota: "Última milla, caja seca original de fábrica." },
  { id: "sn-008", nombre: "Sitrak 8×4 Minero",              anio: 2022, km: 240000, precio: 1390000, agencia: "chihuahua",    condicion: "Muy bueno",  img: "assets/img/tracto-frente.jpg", nota: "Uso minero, suspensión reforzada revisada." }
];

// ── Refacciones ───────────────────────────────────────────────────────────
export const SISTEMAS = [
  { id: "motor",       nombre: "Motor" },
  { id: "frenos",      nombre: "Frenos" },
  { id: "transmision", nombre: "Transmisión" },
  { id: "suspension",  nombre: "Suspensión" },
  { id: "filtracion",  nombre: "Filtración" },
  { id: "electrico",   nombre: "Eléctrico" }
];

export const REFACCIONES = [
  { np: "[MT13-0101]", nombre: "Kit de empaques de culata MT13",       sistema: "motor",       precio: 8450,  compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-tracto-540hp-6x4-amt", "sitrak-g7-540hp-6x4"] },
  { np: "[MT13-0204]", nombre: "Bomba de agua MT13",                   sistema: "motor",       precio: 6200,  compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-g7-540hp-6x4"] },
  { np: "[MC11-0310]", nombre: "Turbocargador MC11",                   sistema: "motor",       precio: 24800, compat: ["sitrak-chasis-360hp-6x4"] },
  { np: "[FRN-1020]",  nombre: "Juego de balatas eje delantero",       sistema: "frenos",      precio: 3980,  compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-tracto-540hp-6x4-amt", "sitrak-62k-330hp-6x4"] },
  { np: "[FRN-1044]",  nombre: "Disco de freno eje trasero MCP16",     sistema: "frenos",      precio: 7350,  compat: ["sitrak-tracto-diesel-540hp-6x4"] },
  { np: "[FRN-1180]",  nombre: "Secador de aire con cartucho",         sistema: "frenos",      precio: 5120,  compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-volteo-6x4", "sitrak-8x4-minero"] },
  { np: "[ZF16-2201]", nombre: "Kit de embrague ZF 16 velocidades",    sistema: "transmision", precio: 18600, compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-chasis-360hp-6x4"] },
  { np: "[AMT-2310]",  nombre: "Actuador de cambios AMT 12 vel.",      sistema: "transmision", precio: 21400, compat: ["sitrak-tracto-540hp-6x4-amt"] },
  { np: "[SUS-3105]",  nombre: "Bolsa de aire suspensión de cabina",   sistema: "suspension",  precio: 4300,  compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-tracto-540hp-6x4-amt", "sitrak-g7-540hp-6x4"] },
  { np: "[SUS-3208]",  nombre: "Muelle reforzado eje trasero",         sistema: "suspension",  precio: 9700,  compat: ["sitrak-volteo-6x4", "sitrak-8x4-minero"] },
  { np: "[FIL-4001]",  nombre: "Filtro de aceite MT13",                sistema: "filtracion",  precio: 620,   compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-tracto-540hp-6x4-amt", "sitrak-g7-540hp-6x4"] },
  { np: "[FIL-4012]",  nombre: "Filtro de combustible con separador",  sistema: "filtracion",  precio: 890,   compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-chasis-360hp-6x4", "sitrak-62k-330hp-6x4"] },
  { np: "[FIL-4030]",  nombre: "Filtro de aire primario",              sistema: "filtracion",  precio: 1150,  compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-volteo-6x4", "sitrak-8x4-minero"] },
  { np: "[ELE-5102]",  nombre: "Alternador 28V 100A",                  sistema: "electrico",   precio: 11200, compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-62k-330hp-6x4"] },
  { np: "[ELE-5220]",  nombre: "Marcha reforzada 24V",                 sistema: "electrico",   precio: 13900, compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-volteo-6x4"] },
  { np: "[ELE-5301]",  nombre: "Faro principal LED lado izquierdo",    sistema: "electrico",   precio: 6800,  compat: ["sitrak-tracto-diesel-540hp-6x4", "sitrak-g7-540hp-6x4"] }
];

// ── Calculadora de costo por kilómetro ────────────────────────────────────
// Valores de arranque del formulario. Son puntos de partida editables: el
// cálculo se hace SIEMPRE con lo que el visitante captura de su propia flota.
export const TCO_BASE = {
  unidades: 5,
  kmMes: 12000,
  precioDiesel: 26.5,
  rendimiento: 2.2,
  mantenimiento: 9000,
  otros: 6000
};
