// Construye el sitio estático: inserta el encabezado y el pie compartidos en cada
// fragmento de _src/, genera las 11 fichas de modelo y escribe assets/js/data.js.
//
//   node _build.mjs
//
// La salida son archivos HTML planos, sin dependencias ni runtime.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LINEAS, MODELOS, CAMPOS, AGENCIAS, PREGUNTAS, PC,
         SEMINUEVOS, REFACCIONES, SISTEMAS, TCO_BASE } from "./_src/data.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "_src");

const PAGINAS = [
  "index", "modelos", "comparar", "cotizar", "costo-por-km",
  "seminuevos", "refacciones", "valuacion",
  "postventa", "agencias", "nosotros", "gracias"
];

const NAV_KEYS = ["modelos", "seminuevos", "costo-por-km", "refacciones", "postventa", "agencias"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function aplicarLayout(layout, { title, desc, nav, body, base }) {
  let out = layout
    .replaceAll("{{TITLE}}", esc(title))
    .replaceAll("{{DESC}}", esc(desc))
    .replaceAll("{{BASE}}", base);
  for (const key of NAV_KEYS) {
    out = out.replaceAll(`{{NAV_${key}}}`, key === nav ? ' aria-current="page"' : "");
  }
  return out.replace("{{BODY}}", body);
}

function filaSpec(campo, modelo) {
  const v = modelo[campo.k];
  const val = v === PC ? '<span class="tbd">Por confirmar</span>' : esc(v);
  return `<div class="srow"><dt>${esc(campo.label)}</dt><dd>${val}</dd></div>`;
}

function tarjetaUnidad(m, base) {
  return `<article class="unit">
  <a class="unit__media" href="${base}modelos/${m.slug}.html">
    <img src="${base}${m.img}" alt="${esc(m.nombre)}" loading="lazy" width="600" height="450">
  </a>
  <div class="unit__body">
    <span class="unit__cat">${esc(nombreLinea(m.linea))} &middot; ${esc(m.uso)}</span>
    <h3 class="unit__title"><a href="${base}modelos/${m.slug}.html">${esc(m.nombre)}</a></h3>
    <p class="unit__desc">${esc(m.desc)}</p>
    <dl class="unit__rows">
      <div class="srow"><dt>Motor</dt><dd>${m.motor === PC ? "&mdash;" : esc(m.motor)}</dd></div>
      <div class="srow"><dt>Potencia</dt><dd>${m.hpTxt === PC ? "&mdash;" : esc(m.hpTxt)}</dd></div>
      <div class="srow"><dt>Capacidad</dt><dd>${m.cap === PC ? "&mdash;" : esc(m.cap)}</dd></div>
    </dl>
    <div class="unit__acts">
      <a class="btn btn--amber btn--sm" href="${base}cotizar.html?u=${m.slug}">Cotizar</a>
      <a class="btn btn--outline btn--sm" href="${base}modelos/${m.slug}.html">Ficha</a>
      <label class="unit__cmp"><input type="checkbox" data-cmp="${m.slug}"> Agregar al comparador</label>
    </div>
  </div>
</article>`;
}

const nombreLinea = (id) => (LINEAS.find((l) => l.id === id) || {}).nombre || id;

async function main() {
  const layout = await readFile(join(SRC, "layout.html"), "utf8");

  // ── páginas principales ──────────────────────────────────────────────
  for (const nombre of PAGINAS) {
    const raw = await readFile(join(SRC, `${nombre}.html`), "utf8");
    const meta = JSON.parse(raw.match(/<!--@(\{[\s\S]*?\})-->/)[1]);
    const body = raw.replace(/<!--@\{[\s\S]*?\}-->/, "").trim();
    const html = aplicarLayout(layout, { ...meta, body, base: "" });
    await writeFile(join(ROOT, `${nombre}.html`), html);
  }

  // ── fichas de modelo ─────────────────────────────────────────────────
  const plantilla = await readFile(join(SRC, "modelo.html"), "utf8");
  await mkdir(join(ROOT, "modelos"), { recursive: true });

  const mitad = Math.ceil(CAMPOS.length / 2);
  for (const m of MODELOS) {
    const relacionados = MODELOS
      .filter((o) => o.linea === m.linea && o.slug !== m.slug)
      .slice(0, 3);
    const body = plantilla
      .replaceAll("{{NOMBRE}}", esc(m.nombre))
      .replaceAll("{{LINEA_NOMBRE}}", esc(nombreLinea(m.linea)))
      .replaceAll("{{USO}}", esc(m.uso))
      .replaceAll("{{DESC}}", esc(m.desc))
      .replaceAll("{{IMG}}", m.img)
      .replaceAll("{{HP}}", String(m.hp))
      .replaceAll("{{TRAC}}", esc(m.trac))
      .replaceAll("{{CAP}}", m.cap === PC ? "&mdash;" : esc(m.cap))
      .replaceAll("{{SLUG}}", m.slug)
      .replace("{{SPECS_1}}", CAMPOS.slice(0, mitad).map((c) => filaSpec(c, m)).join("\n"))
      .replace("{{SPECS_2}}", CAMPOS.slice(mitad).map((c) => filaSpec(c, m)).join("\n"))
      .replace("{{RELACIONADOS}}", relacionados.length
        ? relacionados.map((o) => tarjetaUnidad(o, "../")).join("\n")
        : '<p class="lead">Esta unidad es la única de su línea. <a href="../modelos.html">Ver el catálogo completo</a>.</p>');

    const html = aplicarLayout(layout, {
      title: `${m.nombre} | Apex Sitrak`,
      desc: m.desc,
      nav: "modelos",
      body,
      base: "../"
    });
    await writeFile(join(ROOT, "modelos", `${m.slug}.html`), html);
  }


  // ── páginas de agencia ───────────────────────────────────────────────
  const plantillaAgencia = await readFile(join(SRC, "agencia.html"), "utf8");
  await mkdir(join(ROOT, "agencias"), { recursive: true });

  for (const a of AGENCIAS) {
    const jsonld = {
      "@context": "https://schema.org",
      "@type": "AutoDealer",
      name: `Apex Sitrak ${a.ciudad}`,
      description: `Distribuidor autorizado Sitrak en ${a.ciudad}, ${a.estado}. Venta de unidades nuevas y seminuevas, taller de servicio y refacciones originales.`,
      telephone: a.tel,
      address: {
        "@type": "PostalAddress",
        streetAddress: a.direccion,
        addressLocality: a.ciudad,
        addressRegion: a.estado,
        postalCode: a.cp,
        addressCountry: "MX"
      },
      geo: { "@type": "GeoCoordinates", latitude: a.lat, longitude: a.lng },
      openingHours: ["Mo-Fr 08:00-18:00", "Sa 08:00-13:00"],
      brand: { "@type": "Brand", name: "Sitrak" },
      parentOrganization: { "@type": "Organization", name: "Apex" }
    };

    const body = plantillaAgencia
      .replaceAll("{{CIUDAD}}", esc(a.ciudad))
      .replaceAll("{{ESTADO}}", esc(a.estado))
      .replaceAll("{{TEL}}", esc(a.tel))
      .replaceAll("{{DIRECCION}}", esc(a.direccion))
      .replaceAll("{{CP}}", esc(a.cp))
      .replaceAll("{{HORARIO_CORTO}}", "Lun a Vie 8:00–18:00")
      .replaceAll("{{HORARIO}}", esc(a.horario))
      .replaceAll("{{TALLER}}", a.taller ? "Sí" : "No")
      .replaceAll("{{PARTES}}", a.partes ? "Sí" : "El más cercano atiende esta plaza")
      .replaceAll("{{RUTA}}", esc(a.ruta))
      .replaceAll("{{SLUG}}", a.slug)
      + `\n<script type="application/ld+json">${JSON.stringify(jsonld)}</script>\n`;

    const html = aplicarLayout(layout, {
      title: `Agencia Apex Sitrak en ${a.ciudad}, ${a.estado}`,
      desc: `Distribuidor autorizado Sitrak en ${a.ciudad}. Unidades nuevas y seminuevas, taller de servicio y refacciones originales. ${a.ruta}.`,
      nav: "agencias",
      body,
      base: "../"
    });
    await writeFile(join(ROOT, "agencias", `${a.slug}.html`), html);
  }

  // ── datos para el navegador ──────────────────────────────────────────
  const datos = `/* Generado por _build.mjs — no editar a mano. Fuente: _src/data.mjs */
window.APEX = ${JSON.stringify({ PC, LINEAS, CAMPOS, MODELOS, AGENCIAS, PREGUNTAS,
  SEMINUEVOS, REFACCIONES, SISTEMAS, TCO_BASE }, null, 2)};
`;
  await mkdir(join(ROOT, "assets", "js"), { recursive: true });
  await writeFile(join(ROOT, "assets", "js", "data.js"), datos);

  // ── favicon ──────────────────────────────────────────────────────────
  const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34">
  <rect width="34" height="34" fill="#223B5D"/>
  <path d="M17 5 L29 29 L22.5 29 L17 17.5 L11.5 29 L5 29 Z" fill="#FFFFFF"/>
  <path d="M17 19.5 L20.5 26.5 L13.5 26.5 Z" fill="#E0A03A"/>
</svg>
`;
  await mkdir(join(ROOT, "assets", "img"), { recursive: true });
  await writeFile(join(ROOT, "assets", "img", "favicon.svg"), favicon);

  console.log(
    `listo — ${PAGINAS.length} páginas, ${MODELOS.length} fichas de modelo, ` +
    `${AGENCIAS.length} páginas de agencia, data.js y favicon`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
