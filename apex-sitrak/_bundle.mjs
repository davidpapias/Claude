// Empaqueta el sitio ya construido en un solo archivo HTML autocontenido,
// para publicarlo como enlace de revisión. La navegación entre páginas pasa a
// ser por hash; el sitio real que va a WordPress sigue siendo multipágina.
//
//   node _build.mjs && node _bundle.mjs
//
// Salida: _dist/apex-sitrak-preview.html

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));

const PAGINAS = [
  ["", "index.html"],
  ["modelos", "modelos.html"],
  ["comparar", "comparar.html"],
  ["cotizar", "cotizar.html"],
  ["postventa", "postventa.html"],
  ["agencias", "agencias.html"],
  ["nosotros", "nosotros.html"],
  ["gracias", "gracias.html"]
];

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };

const entre = (html, abre, cierra) => {
  const i = html.indexOf(abre);
  const j = html.lastIndexOf(cierra);
  return i < 0 || j < 0 ? "" : html.slice(i + abre.length, j);
};

async function main() {
  // ── imágenes como data URI ────────────────────────────────────────────
  const imgDir = join(ROOT, "assets", "img");
  const imagenes = {};
  for (const nombre of await readdir(imgDir)) {
    const ext = extname(nombre).toLowerCase();
    if (!MIME[ext]) continue;
    const buf = await readFile(join(imgDir, nombre));
    imagenes[nombre] = `data:${MIME[ext]};base64,${buf.toString("base64")}`;
  }

  // Sustituye assets/img/x.jpg y ../assets/img/x.jpg por su data URI.
  const inlineImg = (s) =>
    s.replace(/(\.\.\/)?assets\/img\/([A-Za-z0-9._-]+)/g, (m, _p, f) => imagenes[f] || m);

  // ── contenido de cada página ─────────────────────────────────────────
  const vistas = {};
  for (const [ruta, archivo] of PAGINAS) {
    const html = await readFile(join(ROOT, archivo), "utf8");
    vistas[ruta] = inlineImg(entre(html, "<main id=\"contenido\">", "</main>"));
  }

  const fichas = await readdir(join(ROOT, "modelos"));
  for (const archivo of fichas) {
    if (!archivo.endsWith(".html")) continue;
    const html = await readFile(join(ROOT, "modelos", archivo), "utf8");
    vistas["modelos/" + archivo.replace(/\.html$/, "")] =
      inlineImg(entre(html, "<main id=\"contenido\">", "</main>"));
  }

  // ── chrome compartido, tomado de la portada ──────────────────────────
  const portada = await readFile(join(ROOT, "index.html"), "utf8");
  const cabecera = inlineImg(entre(portada, "<body>", "<main id=\"contenido\">"));
  const pie = inlineImg(entre(portada, "</main>", "<script src=\"assets/js/data.js\">"));

  const css = await readFile(join(ROOT, "assets", "css", "apex.css"), "utf8");
  const datos = await readFile(join(ROOT, "assets", "js", "data.js"), "utf8");
  const app = await readFile(join(ROOT, "assets", "js", "app.js"), "utf8");

  const router = `
/* Enrutado por hash: convierte los enlaces .html del sitio multipágina en
   rutas #/... dentro de este único archivo. Solo afecta al visor. */
(function () {
  "use strict";
  var VISTAS = window.__APEX_VISTAS__;
  var main = document.getElementById("contenido");

  function aRuta(href) {
    if (!href) return null;
    var limpio = href.split("#")[0].split("?")[0].replace(/^\\.\\.\\//, "").replace(/^\\.\\//, "");
    if (!/\\.html$/.test(limpio)) return null;
    if (limpio === "index.html") return "";
    var ruta = limpio.replace(/\\.html$/, "");
    return Object.prototype.hasOwnProperty.call(VISTAS, ruta) ? ruta : null;
  }

  function pintar() {
    var bruto = (location.hash || "#/").replace(/^#\\/?/, "");
    var consulta = "";
    var q = bruto.indexOf("?");
    if (q > -1) { consulta = bruto.slice(q); bruto = bruto.slice(0, q); }
    var ancla = "";
    var a = bruto.indexOf("!");
    if (a > -1) { ancla = bruto.slice(a + 1); bruto = bruto.slice(0, a); }

    if (!Object.prototype.hasOwnProperty.call(VISTAS, bruto)) bruto = "";
    main.innerHTML = VISTAS[bruto];

    // app.js lee ?u= de location.search; se lo pasamos por la ruta.
    if (consulta) {
      try { history.replaceState(null, "", location.pathname + consulta + location.hash); } catch (e) {}
    }

    marcarMenu(bruto);
    if (window.ApexApp) window.ApexApp.init();

    if (ancla) {
      var destino = document.getElementById(ancla);
      if (destino) { destino.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  }

  function marcarMenu(ruta) {
    var base = ruta.indexOf("modelos/") === 0 ? "modelos" : ruta;
    var enlaces = document.querySelectorAll(".nav a");
    for (var i = 0; i < enlaces.length; i++) {
      var r = aRuta(enlaces[i].getAttribute("href"));
      if (r !== null && r === base) enlaces[i].setAttribute("aria-current", "page");
      else enlaces[i].removeAttribute("aria-current");
    }
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank") return;
    var href = a.getAttribute("href");
    var ruta = aRuta(href);
    if (ruta === null) return;
    e.preventDefault();
    var consulta = href.indexOf("?") > -1 ? "?" + href.split("?")[1].split("#")[0] : "";
    var ancla = href.indexOf("#") > -1 ? "!" + href.split("#").pop() : "";
    var destino = "#/" + ruta + ancla + consulta;
    if (location.hash === destino) pintar();
    else location.hash = destino;
  });

  window.addEventListener("hashchange", pintar);
  pintar();
})();
`;

  const aviso = `
<div style="background:#E0A03A;color:#16283F;font:600 13px/1.5 'IBM Plex Sans',sans-serif;
     letter-spacing:.06em;text-align:center;padding:10px 16px">
  VISTA DE REVISIÓN &middot; El sitio real es multipágina y se entrega en código para WordPress
</div>`;

  const salida = `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sitio Apex Sitrak</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
<style>
${css}
</style>
</head>
<body>
${aviso}
${cabecera}
<main id="contenido"></main>
${pie}
<script>window.__APEX_VISTAS__ = ${JSON.stringify(vistas)};</script>
<script>${datos}</script>
<script>${app}</script>
<script>${router}</script>
</body>
</html>
`;

  await mkdir(join(ROOT, "_dist"), { recursive: true });
  const destino = join(ROOT, "_dist", "apex-sitrak-preview.html");
  await writeFile(destino, salida);
  console.log(
    "empaquetado —",
    Object.keys(vistas).length,
    "vistas,",
    Object.keys(imagenes).length,
    "imágenes,",
    (Buffer.byteLength(salida) / 1024 / 1024).toFixed(2),
    "MB"
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
