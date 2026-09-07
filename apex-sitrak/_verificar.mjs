// Recorre los caminos de conversión del sitio en un navegador real y comprueba
// que cada uno llega a /gracias con su parámetro `origen` correcto. Es la única
// prueba del proyecto y cubre lo que de verdad importa: que el embudo no tenga
// fugas. Levanta su propio servidor estático, así que no hace falta nada más.
//
//   node _build.mjs
//   npm i playwright        (solo la biblioteca; el navegador ya está instalado)
//   node _verificar.mjs
//
// Sale con código 1 si alguna comprobación falla.

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const ROOT = new URL(".", import.meta.url).pathname;

// El navegador viene preinstalado en el entorno; ajustar si se corre en otro.
const CHROMIUM = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const MIME = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css",
  ".jpg":"image/jpeg", ".svg":"image/svg+xml", ".png":"image/png" };

const srv = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  try {
    const buf = await readFile(join(ROOT, p));
    res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
    res.end(buf);
  } catch { res.writeHead(404); res.end("404"); }
});
await new Promise(r => srv.listen(8080, r));

const nav = await chromium.launch({ executablePath: CHROMIUM });
const errores = [];
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
// El proxy de este entorno bloquea Google Fonts: la página nunca termina de
// cargar y cualquier espera se cuelga. Se corta la petición de raíz.
// Las peticiones abortadas aquí aparecen como ERR_FAILED en la consola; por eso
// se filtran arriba: son ruido de la prueba, no del sitio.
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const pg = await ctx.newPage();
pg.on("pageerror", e => errores.push("JS: " + e.message));
pg.on("console", m => { if (m.type() === "error" && !/ERR_FAILED|ERR_CONNECTION/.test(m.text())) errores.push("consola: " + m.text()); });

const U = "http://localhost:8080";
const ok = [];
const falla = [];
const chk = (n, c, extra="") => (c ? ok : falla).push(n + (extra ? " — " + extra : ""));

try {

// Avanza un paso del cotizador esperando a que el botón exista y a que el
// panel se vuelva a pintar (o a que la página navegue a /gracias).
async function avanzar(p) {
  await p.waitForSelector('[data-accion="siguiente"]', { timeout: 8000, waitUntil: "domcontentloaded" });
  await p.click('[data-accion="siguiente"]');
  await p.waitForTimeout(500);
}

// Google Fonts está bloqueado en este entorno, así que el evento "load" nunca
// llega y waitForURL se queda colgado. Sondeamos la URL directamente.
async function esperarUrl(p, re, ms = 8000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (re.test(p.url())) {
      // La URL cambia en el commit; el evento lo empuja app.js al final del body.
      await p.waitForFunction(() => document.readyState !== "loading", null, { timeout: 8000 });
      await p.waitForTimeout(300);
      return;
    }
    await p.waitForTimeout(100);
  }
  throw new Error("nunca llegó a " + re + " (quedó en " + p.url() + ")");
}

async function dl(p) {
  return await p.evaluate(() => (window.dataLayer || []).filter(e => e.event === "generate_lead").pop() || null);
}

// ── 1. Calculadora → cotizador con los números → /gracias ──────────────
await pg.goto(U + "/costo-por-km.html");
await pg.waitForTimeout(300);
const hrefCalc = await pg.getAttribute("#calc-resultado a.btn", "href");
chk("calculadora lleva cpk/km/rend", /origen=calculadora/.test(hrefCalc) && /cpk=/.test(hrefCalc) && /rend=/.test(hrefCalc), hrefCalc);
await pg.goto(U + "/" + hrefCalc);
await pg.waitForTimeout(200);
const resumenCalc = await pg.textContent("#cotizador-resumen");
chk("cotizador muestra el costo por km del visitante", /costo por km hoy/i.test(resumenCalc), resumenCalc.slice(0,120));

// ── 2. Ficha de modelo → cotizador precargado → /gracias ───────────────
await pg.goto(U + "/modelos/sitrak-tracto-diesel-540hp-6x4.html");
await pg.waitForTimeout(200);
const waModelo = await pg.getAttribute('a[href*="wa.me"]', "href");
chk("WhatsApp de ficha lleva el modelo", /wa\.me\/\d+\?text=.*Sitrak/.test(decodeURIComponent(waModelo)), decodeURIComponent(waModelo||"").slice(0,90));
await pg.goto(U + "/cotizar.html?u=sitrak-tracto-diesel-540hp-6x4&origen=ficha");
await pg.waitForTimeout(200);
let meta = await pg.textContent(".progress-meta");
chk("con unidad conocida salta a Enganche y plazo", /Enganche y plazo/.test(meta), meta.trim());
// avanzar a contacto y enviar
await avanzar(pg);

await avanzar(pg);
await esperarUrl(pg, /gracias\.html/);
let ev = await dl(pg);
chk("ficha → /gracias con evento", ev && ev.origen === "ficha" && ev.unidad === "sitrak-tracto-diesel-540hp-6x4", JSON.stringify(ev));

// ── 3. Seminuevos ──────────────────────────────────────────────────────
await pg.goto(U + "/seminuevos.html");
await pg.waitForTimeout(300);
const hrefSN = await pg.getAttribute("#sn-lista a.btn--amber", "href");
chk("seminuevo lleva id y agencia", /tipo=seminuevo/.test(hrefSN) && /sn=sn-/.test(hrefSN) && /ag=/.test(hrefSN), hrefSN);
await pg.goto(U + "/" + hrefSN);
await pg.waitForTimeout(200);
meta = await pg.textContent(".progress-meta");
chk("guion de seminuevo tiene 3 pasos", /de 3/.test(meta), meta.trim());
const aviso = await pg.textContent("#cotizador");
chk("agencia heredada visible desde el paso 1", /Te atiende/.test(aviso));
await avanzar(pg);

await avanzar(pg);
await esperarUrl(pg, /gracias\.html/);
ev = await dl(pg);
chk("seminuevos → /gracias con evento", ev && ev.origen === "seminuevos" && ev.agencia !== "por-asignar", JSON.stringify(ev));

// ── 4. Refacciones ─────────────────────────────────────────────────────
await pg.goto(U + "/refacciones.html");
await pg.waitForTimeout(300);
const hrefRF = await pg.getAttribute("#rf-tabla a.btn--amber", "href");
chk("refacción lleva número de parte", /tipo=refaccion/.test(hrefRF) && /np=/.test(hrefRF), hrefRF);
await pg.goto(U + "/" + hrefRF);
await pg.waitForTimeout(200);
meta = await pg.textContent(".progress-meta");
chk("refacción entra directo a contacto", /Datos de contacto/.test(meta), meta.trim());
await avanzar(pg);
await esperarUrl(pg, /gracias\.html/);
ev = await dl(pg);
chk("refacciones → /gracias con evento", ev && ev.origen === "refacciones" && ev.unidad, JSON.stringify(ev));

// ── 5. Comparador ──────────────────────────────────────────────────────
await pg.goto(U + "/modelos.html");
await pg.waitForTimeout(300);
const hrefCat = await pg.getAttribute(".unit a.btn--amber", "href");
chk("catálogo etiqueta su origen", /origen=catalogo/.test(hrefCat), hrefCat);

// ── 6. Agencia: herencia y bloques distintivos ─────────────────────────
await pg.goto(U + "/agencias/monterrey.html");
await pg.waitForTimeout(250);
const cuerpo = await pg.textContent("#contenido");
chk("agencia muestra asesor", /Quién te atiende/.test(cuerpo));
chk("agencia muestra estados que atiende", /Nuevo León y Zacatecas/.test(cuerpo));
chk("agencia muestra su inventario", /Seminuevos en esta agencia/.test(cuerpo));
await pg.click('a:has-text("Cotizar en esta agencia")');
await esperarUrl(pg, /cotizar\.html/);
await pg.waitForTimeout(250);
const av2 = await pg.textContent("#cotizador");
chk("agencia preseleccionada desde el paso 1", /Te atiende .*Monterrey/.test(av2.replace(/\s+/g," ")));

// ── 7. Enrutamiento por estado ─────────────────────────────────────────
await pg.goto(U + "/cotizar.html?u=sitrak-tracto-diesel-540hp-6x4");
await pg.waitForTimeout(200);
await avanzar(pg);

await pg.selectOption("#q-estado", "Sinaloa");
await pg.waitForTimeout(200);
const av3 = await pg.textContent("#cotizador");
chk("Sinaloa se enruta a Hermosillo", /Te atiende .*Hermosillo/.test(av3.replace(/\s+/g," ")));

// ── 8. Ficha técnica como micro-compromiso ─────────────────────────────
await pg.goto(U + "/modelos/sitrak-tracto-diesel-540hp-6x4.html");
await pg.waitForTimeout(200);
await pg.click("[data-ficha]");
await pg.fill("#ficha-correo", "prueba@empresa.mx");
await pg.click("[data-enviar-ficha]");
await esperarUrl(pg, /gracias\.html/);
ev = await dl(pg);
chk("descarga de ficha → /gracias", ev && ev.origen === "ficha-tecnica", JSON.stringify(ev));

// ── 9. Móvil ───────────────────────────────────────────────────────────
const mv = await ctx.newPage();
mv.on("pageerror", e => errores.push("JS móvil: " + e.message));
mv.on("console", m => { if (m.type() === "error" && !/ERR_FAILED|ERR_CONNECTION/.test(m.text())) errores.push("consola móvil: " + m.text()); });
await mv.setViewportSize({ width: 390, height: 844 });
for (const r of ["/index.html", "/cotizar.html", "/costo-por-km.html", "/agencias/monterrey.html"]) {
  await mv.goto(U + r); await mv.waitForTimeout(200);
}
const waMovil = await mv.getAttribute(".mobile-bar a[href*='wa.me']", "href");
chk("barra móvil con WhatsApp real", !!waMovil, waMovil);

} catch (e) { falla.push("EXCEPCIÓN: " + e.message + " | url=" + pg.url() + " | cotizador=" + (await pg.innerHTML("#cotizador").catch(()=> "(sin #cotizador)")).slice(0,300)); }

console.log("\n✅ " + ok.length + " comprobaciones pasaron:");
ok.forEach(x => console.log("   · " + x));
if (falla.length) { console.log("\n❌ FALLAS:"); falla.forEach(x => console.log("   · " + x)); }
console.log(errores.length ? "\n⚠️  errores de consola:\n" + errores.join("\n") : "\nSin errores de consola.");
await nav.close(); srv.close();
process.exit(falla.length || errores.length ? 1 : 0);
