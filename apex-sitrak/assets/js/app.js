/* ============================================================
   Apex Sitrak — comportamiento del sitio
   Sin dependencias. Cada módulo se activa sólo si su contenedor
   existe en la página, así el mismo archivo sirve para todas.
   ============================================================ */
(function () {
  "use strict";

  var D = window.APEX;
  if (!D) return;

  var CLAVE_CMP = "apex:comparador";
  var CLAVE_COT = "apex:cotizacion";

  /* ---------- utilidades ---------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function val(v) {
    return v === D.PC ? '<span class="tbd">Por confirmar</span>' : esc(v);
  }

  function porSlug(slug) {
    for (var i = 0; i < D.MODELOS.length; i++) {
      if (D.MODELOS[i].slug === slug) return D.MODELOS[i];
    }
    return null;
  }

  function fila(k, v) {
    return '<div class="srow"><dt>' + esc(k) + "</dt><dd>" + esc(v) + "</dd></div>";
  }

  function nombreLinea(id) {
    for (var i = 0; i < D.LINEAS.length; i++) {
      if (D.LINEAS[i].id === id) return D.LINEAS[i].nombre;
    }
    return id;
  }

  // Prefijo relativo: las fichas viven en /modelos/, el resto en la raíz.
  var BASE = /\/modelos\/[^/]+\.html?$/.test(location.pathname) ? "../" : "";

  function leer(clave, alt) {
    try {
      var v = window.sessionStorage.getItem(clave);
      return v ? JSON.parse(v) : alt;
    } catch (e) { return alt; }
  }

  function guardar(clave, valor) {
    try { window.sessionStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {}
  }

  /* ---------- menú móvil ---------- */

  function menu() {
    var boton = document.querySelector(".nav-toggle");
    var nav = document.getElementById("nav-principal");
    if (!boton || !nav) return;

    function ajustar() {
      var movil = window.matchMedia("(max-width:1080px)").matches;
      if (!movil) {
        nav.hidden = false;
        boton.setAttribute("aria-expanded", "false");
      } else if (boton.getAttribute("aria-expanded") !== "true") {
        nav.hidden = true;
      }
    }

    boton.addEventListener("click", function () {
      var abierto = boton.getAttribute("aria-expanded") === "true";
      boton.setAttribute("aria-expanded", String(!abierto));
      boton.setAttribute("aria-label", abierto ? "Abrir menú" : "Cerrar menú");
      nav.hidden = abierto;
    });

    window.addEventListener("resize", ajustar);
    ajustar();
  }

  /* ---------- tarjeta de unidad ---------- */

  function tarjeta(m) {
    var marcada = comparador.indexOf(m.slug) > -1 ? " checked" : "";
    return '<article class="unit">' +
      '<a class="unit__media" href="' + BASE + 'modelos/' + m.slug + '.html">' +
        '<img src="' + BASE + m.img + '" alt="' + esc(m.nombre) + '" loading="lazy" width="600" height="450">' +
      "</a>" +
      '<div class="unit__body">' +
        '<span class="unit__cat">' + esc(nombreLinea(m.linea)) + " &middot; " + esc(m.uso) + "</span>" +
        '<h3 class="unit__title"><a href="' + BASE + "modelos/" + m.slug + '.html">' + esc(m.nombre) + "</a></h3>" +
        '<p class="unit__desc">' + esc(m.desc) + "</p>" +
        '<dl class="unit__rows">' +
          '<div class="srow"><dt>Motor</dt><dd>' + (m.motor === D.PC ? "&mdash;" : esc(m.motor)) + "</dd></div>" +
          '<div class="srow"><dt>Potencia</dt><dd>' + (m.hpTxt === D.PC ? "&mdash;" : esc(m.hpTxt)) + "</dd></div>" +
          '<div class="srow"><dt>Capacidad</dt><dd>' + (m.cap === D.PC ? "&mdash;" : esc(m.cap)) + "</dd></div>" +
        "</dl>" +
        '<div class="unit__acts">' +
          '<a class="btn btn--amber btn--sm" href="' + BASE + "cotizar.html?u=" + m.slug + '">Cotizar</a>' +
          '<a class="btn btn--outline btn--sm" href="' + BASE + "modelos/" + m.slug + '.html">Ficha</a>' +
          '<label class="unit__cmp"><input type="checkbox" data-cmp="' + m.slug + '"' + marcada + "> Agregar al comparador</label>" +
        "</div>" +
      "</div></article>";
  }

  /* ---------- comparador (estado compartido) ---------- */

  var comparador = leer(CLAVE_CMP, []).filter(porSlug).slice(0, 3);

  function alternar(slug, activo) {
    var i = comparador.indexOf(slug);
    if (activo && i < 0) {
      if (comparador.length >= 3) comparador.shift();
      comparador.push(slug);
    }
    if (!activo && i > -1) comparador.splice(i, 1);
    guardar(CLAVE_CMP, comparador);
    sincronizarCasillas();
    pintarCatalogo();
    pintarComparador();
  }

  function sincronizarCasillas() {
    var cajas = document.querySelectorAll("[data-cmp]");
    for (var i = 0; i < cajas.length; i++) {
      cajas[i].checked = comparador.indexOf(cajas[i].getAttribute("data-cmp")) > -1;
    }
  }

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t && t.matches && t.matches("[data-cmp]")) {
      alternar(t.getAttribute("data-cmp"), t.checked);
    }
  });

  /* ---------- líneas (portada) ---------- */

  function lineas() {
    var cont = document.getElementById("lineas");
    if (!cont) return;
    cont.innerHTML = D.LINEAS.map(function (l) {
      var n = D.MODELOS.filter(function (m) { return m.linea === l.id; }).length;
      return '<a class="line-card' + (l.destacada ? " line-card--featured" : "") + '" href="modelos.html#' + l.id + '">' +
        '<span class="line-card__media"><img src="' + l.img + '" alt="' + esc(l.nombre) + '" loading="lazy" width="400" height="320"></span>' +
        '<span class="line-card__body">' +
          '<span class="unit__cat">' + n + " unidad" + (n === 1 ? "" : "es") + "</span>" +
          '<h3 class="unit__title">' + esc(l.nombre) + "</h3>" +
          '<span class="unit__desc">' + esc(l.desc) + "</span>" +
          '<span class="line-card__more">Ver la línea &rarr;</span>' +
        "</span></a>";
    }).join("");
  }

  /* ---------- catálogo con filtros ---------- */

  var filtro = "todos";

  function pintarCatalogo() {
    var cont = document.getElementById("catalogo");
    if (!cont) return;
    var lista = D.MODELOS.filter(function (m) { return filtro === "todos" || m.linea === filtro; });
    cont.innerHTML = lista.map(tarjeta).join("");
    var vacio = document.getElementById("catalogo-vacio");
    if (vacio) vacio.hidden = lista.length > 0;
  }

  function catalogo() {
    var barra = document.getElementById("filtros");
    if (!barra) return;

    if (location.hash) {
      var h = location.hash.slice(1);
      if (D.LINEAS.some(function (l) { return l.id === h; })) filtro = h;
    }

    function pintarFiltros() {
      barra.innerHTML =
        '<button class="filter" type="button" data-linea="todos" aria-pressed="' + (filtro === "todos") + '">Todas (' + D.MODELOS.length + ")</button>" +
        D.LINEAS.map(function (l) {
          var n = D.MODELOS.filter(function (m) { return m.linea === l.id; }).length;
          return '<button class="filter" type="button" data-linea="' + l.id + '" aria-pressed="' + (filtro === l.id) + '">' + esc(l.nombre) + " (" + n + ")</button>";
        }).join("");
    }

    barra.addEventListener("click", function (e) {
      var b = e.target.closest("[data-linea]");
      if (!b) return;
      filtro = b.getAttribute("data-linea");
      if (history.replaceState) {
        history.replaceState(null, "", filtro === "todos" ? location.pathname : "#" + filtro);
      }
      pintarFiltros();
      pintarCatalogo();
    });

    pintarFiltros();
    pintarCatalogo();
  }

  /* ---------- comparador (página) ---------- */

  function pintarComparador() {
    var picker = document.getElementById("cmp-picker");
    var tabla = document.getElementById("cmp-tabla");
    if (!picker || !tabla) return;

    var html = "";
    for (var i = 0; i < 3; i++) {
      var actual = comparador[i] || "";
      html += '<select data-slot="' + i + '" aria-label="Unidad ' + (i + 1) + '">' +
        '<option value="">Unidad ' + (i + 1) + " &mdash; elegir&hellip;</option>" +
        D.MODELOS.map(function (m) {
          return '<option value="' + m.slug + '"' + (m.slug === actual ? " selected" : "") + ">" + esc(m.nombre) + "</option>";
        }).join("") + "</select>";
    }
    picker.innerHTML = html;

    var elegidas = comparador.map(porSlug).filter(Boolean);
    if (!elegidas.length) {
      tabla.innerHTML = '<tbody><tr><td style="padding:44px 22px;color:var(--muted)">Elige al menos una unidad arriba, o marca «Agregar al comparador» en el catálogo.</td></tr></tbody>';
      return;
    }

    var cab = "<thead><tr><th></th>" + elegidas.map(function (m) {
      return "<th>" +
        '<span class="cmp__media"><img src="' + BASE + m.img + '" alt="' + esc(m.nombre) + '" loading="lazy" width="400" height="250"></span>' +
        '<span class="cmp__name">' + esc(m.nombre) + "</span>" +
        '<span class="cmp__cat">' + esc(nombreLinea(m.linea)) + "</span></th>";
    }).join("") + "</tr></thead>";

    var cuerpo = D.CAMPOS.map(function (c) {
      var top = -Infinity;
      if (c.best) {
        elegidas.forEach(function (m) {
          if (typeof m[c.best] === "number" && m[c.best] > top) top = m[c.best];
        });
      }
      var celdas = elegidas.map(function (m) {
        var mejor = c.best && elegidas.length > 1 && m[c.best] === top && m[c.k] !== D.PC;
        return "<td" + (mejor ? ' class="is-best"' : "") + ">" + val(m[c.k]) + "</td>";
      }).join("");
      return "<tr><th scope=\"row\">" + esc(c.label) + "</th>" + celdas + "</tr>";
    }).join("");

    var pie = "<tr><th scope=\"row\"></th>" + elegidas.map(function (m) {
      return '<td><a class="btn btn--amber btn--sm btn--block" href="' + BASE + "cotizar.html?u=" + m.slug + '">Cotizar</a></td>';
    }).join("") + "</tr>";

    tabla.innerHTML = cab + "<tbody>" + cuerpo + pie + "</tbody>";
  }

  function comparadorPagina() {
    var picker = document.getElementById("cmp-picker");
    if (!picker) return;

    picker.addEventListener("change", function (e) {
      var s = e.target.closest("[data-slot]");
      if (!s) return;
      var idx = Number(s.getAttribute("data-slot"));
      var siguiente = comparador.slice();
      if (s.value) siguiente[idx] = s.value;
      else siguiente.splice(idx, 1);
      comparador = siguiente.filter(function (x, i, a) { return x && a.indexOf(x) === i; }).slice(0, 3);
      guardar(CLAVE_CMP, comparador);
      sincronizarCasillas();
      pintarComparador();
    });

    var reset = document.getElementById("cmp-reset");
    if (reset) {
      reset.addEventListener("click", function () {
        comparador = [];
        guardar(CLAVE_CMP, comparador);
        sincronizarCasillas();
        pintarComparador();
        pintarCatalogo();
      });
    }

    pintarComparador();
  }

  /* ---------- selector de unidad ---------- */

  function selector() {
    var cont = document.getElementById("finder");
    if (!cont) return;

    var paso = 0;
    var respuestas = {};

    function recomendar(a) {
      if (a.carga === "urbano" || a.peso === "8") return "ligeros";
      if (a.carga === "especial") return "gran-dimension";
      if (a.carga === "granel" || a.zona === "obra") return "vocacionales";
      if (a.peso === "full" || a.zona === "carretera") return "tractocamiones";
      return "medianos";
    }

    function pintar() {
      var html = '<ol class="row" style="gap:10px;margin-bottom:22px;list-style:none;padding:0">';
      D.PREGUNTAS.forEach(function (p, i) {
        var estado = paso > i ? "hecho" : paso === i ? "activo" : "";
        html += '<li style="display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.11em;text-transform:uppercase;font-weight:600;color:' +
          (estado ? "var(--navy)" : "var(--muted)") + '">' +
          '<span style="width:22px;height:22px;display:grid;place-items:center;font-size:11px;border:1px solid ' +
          (estado ? "transparent" : "var(--line)") + ";background:" +
          (estado === "activo" ? "var(--amber)" : estado === "hecho" ? "var(--navy)" : "transparent") + ";color:" +
          (estado === "activo" ? "var(--navy-900)" : estado === "hecho" ? "#fff" : "var(--muted)") + '">' + (i + 1) + "</span>" +
          esc(p.q.replace(/[¿?]/g, "")) + "</li>";
      });
      html += '<li style="display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.11em;text-transform:uppercase;font-weight:600;color:' +
        (paso === 3 ? "var(--navy)" : "var(--muted)") + '"><span style="width:22px;height:22px;display:grid;place-items:center;font-size:11px;border:1px solid ' +
        (paso === 3 ? "transparent" : "var(--line)") + ";background:" + (paso === 3 ? "var(--amber)" : "transparent") +
        ";color:" + (paso === 3 ? "var(--navy-900)" : "var(--muted)") + '">&#10003;</span>Resultado</li></ol>';

      if (paso < 3) {
        var p = D.PREGUNTAS[paso];
        html += '<h3 style="font-size:clamp(19px,2.2vw,25px);color:var(--navy);margin-bottom:16px">' + esc(p.q) + "</h3>";
        html += '<div class="option-grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">' +
          p.opts.map(function (o) {
            return '<button class="option" type="button" data-k="' + esc(p.k) + '" data-v="' + esc(o.v) + '"><b>' + esc(o.b) + "</b><span>" + esc(o.s) + "</span></button>";
          }).join("") + "</div>";
        if (paso > 0) html += '<div class="row mt-24"><button class="btn btn--outline btn--sm" type="button" data-accion="atras">Atrás</button></div>';
      } else {
        var lid = recomendar(respuestas);
        var linea = D.LINEAS.filter(function (l) { return l.id === lid; })[0];
        var sugeridas = D.MODELOS.filter(function (m) { return m.linea === lid; }).slice(0, 2);
        html += '<div style="display:grid;grid-template-columns:minmax(0,300px) 1fr;gap:24px;align-items:start" class="finder-res">' +
          '<div style="border:1px solid var(--ash-2);background:var(--ash);padding:22px">' +
            '<p class="eyebrow eyebrow--amber">Tu línea</p>' +
            '<h3 style="color:var(--navy);margin:10px 0 10px">' + esc(linea.nombre) + "</h3>" +
            '<p style="font-size:14.5px;color:var(--ink-2)">' + esc(linea.desc) + "</p>" +
            '<div class="row mt-24"><a class="btn btn--amber btn--sm" href="' + BASE + "modelos.html#" + lid + '">Ver la línea</a>' +
            '<button class="btn btn--outline btn--sm" type="button" data-accion="reiniciar">Cambiar respuestas</button></div>' +
          "</div>" +
          '<div class="units" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">' + sugeridas.map(tarjeta).join("") + "</div>" +
        "</div>";
      }
      cont.innerHTML = html;
    }

    cont.addEventListener("click", function (e) {
      var opt = e.target.closest("[data-k]");
      if (opt) {
        respuestas[opt.getAttribute("data-k")] = opt.getAttribute("data-v");
        paso++;
        pintar();
        return;
      }
      var acc = e.target.closest("[data-accion]");
      if (!acc) return;
      if (acc.getAttribute("data-accion") === "atras") paso = Math.max(0, paso - 1);
      if (acc.getAttribute("data-accion") === "reiniciar") { paso = 0; respuestas = {}; }
      pintar();
    });

    pintar();
  }

  /* ---------- cotizador de cuatro pasos ---------- */

  function cotizador() {
    var caja = document.getElementById("cotizador");
    var aside = document.getElementById("cotizador-resumen");
    if (!caja || !aside) return;

    var TITULOS = ["Tipo de operación", "Unidad y cantidad", "Enganche y plazo", "Datos de contacto"];
    var estado = leer(CLAVE_COT, null) || {
      paso: 0, linea: "", unidad: "", cantidad: "1 unidad",
      pago: "Crédito / financiamiento", enganche: "20 %", plazo: "48 meses", listo: false
    };

    var pre = new URLSearchParams(location.search).get("u");
    if (pre && porSlug(pre)) {
      estado.unidad = pre;
      estado.linea = porSlug(pre).linea;
      estado.paso = 2;
      estado.listo = false;
    }

    function persistir() { guardar(CLAVE_COT, estado); }

    function pintar() {
      var html = "";

      if (estado.listo) {
        html = '<div class="center" style="padding:24px 0">' +
          '<div style="width:56px;height:56px;background:var(--amber);color:var(--navy-900);display:grid;place-items:center;margin:0 auto 18px">' +
            '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M20 6 L9 17 L4 12"></path></svg>' +
          "</div>" +
          '<h2 style="color:var(--navy);margin-bottom:12px">Solicitud lista</h2>' +
          '<p class="lead" style="margin-inline:auto">Un asesor de tu agencia te contacta en menos de 24 horas hábiles con disponibilidad, plan de financiamiento y fecha de entrega.</p>' +
          '<div class="row mt-24" style="justify-content:center">' +
            '<a class="btn btn--amber" href="#">Adelantar por WhatsApp</a>' +
            '<button class="btn btn--outline" type="button" data-accion="reiniciar">Cotizar otra unidad</button>' +
          "</div>" +
          '<p class="muted mt-24" style="font-size:12.5px">Demostración: el formulario todavía no envía datos.</p></div>';
        caja.innerHTML = html;
        pintarResumen();
        return;
      }

      var pct = ((estado.paso + 1) / 4) * 100;
      html += '<div class="progress"><i style="width:' + pct + '%"></i></div>' +
        '<div class="progress-meta"><strong>Paso ' + (estado.paso + 1) + " de 4 &middot; " + TITULOS[estado.paso] + "</strong><span>" + Math.round(pct) + " % completo</span></div>";

      if (estado.paso === 0) {
        html += '<h2 style="font-size:clamp(21px,2.4vw,27px);color:var(--navy);margin-bottom:20px">¿Qué tipo de unidad buscas?</h2>' +
          '<div class="option-grid">' + D.LINEAS.map(function (l) {
            return '<button class="option" type="button" data-campo="linea" data-v="' + l.id + '"><b>' + esc(l.nombre) + "</b><span>" + esc(l.desc) + "</span></button>";
          }).join("") + "</div>";
      } else if (estado.paso === 1) {
        var lista = D.MODELOS.filter(function (m) { return !estado.linea || m.linea === estado.linea; });
        html += '<h2 style="font-size:clamp(21px,2.4vw,27px);color:var(--navy);margin-bottom:20px">¿Cuál unidad y cuántas?</h2>' +
          '<div class="form-grid">' +
            '<div class="field field--full"><label for="q-unidad">Unidad</label><select id="q-unidad" data-campo="unidad">' +
              '<option value="">Elegir&hellip;</option>' +
              lista.map(function (m) {
                return '<option value="' + m.slug + '"' + (estado.unidad === m.slug ? " selected" : "") + ">" + esc(m.nombre) + "</option>";
              }).join("") +
              '<option value="indeciso"' + (estado.unidad === "indeciso" ? " selected" : "") + ">Aún no lo defino</option>" +
            "</select></div>" +
            '<div class="field field--full"><label for="q-cantidad">Unidades a adquirir</label><select id="q-cantidad" data-campo="cantidad">' +
              ["1 unidad", "2 a 5 unidades", "6 a 20 unidades", "Más de 20"].map(function (o) {
                return "<option" + (estado.cantidad === o ? " selected" : "") + ">" + o + "</option>";
              }).join("") + "</select></div>" +
          "</div>";
      } else if (estado.paso === 2) {
        html += '<h2 style="font-size:clamp(21px,2.4vw,27px);color:var(--navy);margin-bottom:20px">Enganche y plazo</h2>' +
          '<div class="field" style="margin-bottom:22px"><label for="q-pago">Forma de pago</label><select id="q-pago" data-campo="pago">' +
            ["Crédito / financiamiento", "Contado", "Arrendamiento", "Por definir"].map(function (o) {
              return "<option" + (estado.pago === o ? " selected" : "") + ">" + o + "</option>";
            }).join("") + "</select></div>" +
          '<div class="field" style="margin-bottom:22px"><span class="field-label" style="font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-bottom:9px;display:block">Enganche estimado</span>' +
            '<div class="choice-grid">' + ["10 %", "20 %", "30 %", "40 % o más"].map(function (o) {
              return '<button class="choice" type="button" data-campo="enganche" data-v="' + o + '" aria-pressed="' + (estado.enganche === o) + '">' + o + "</button>";
            }).join("") + "</div></div>" +
          '<div class="field"><span style="font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-bottom:9px;display:block">Plazo deseado</span>' +
            '<div class="choice-grid">' + ["24 meses", "36 meses", "48 meses", "60 meses"].map(function (o) {
              return '<button class="choice" type="button" data-campo="plazo" data-v="' + o + '" aria-pressed="' + (estado.plazo === o) + '">' + o + "</button>";
            }).join("") + "</div></div>" +
          '<div class="note note--amber mt-24">Con estos dos datos la cotización te llega con la <strong>mensualidad estimada ya calculada</strong>, en vez de una segunda llamada para pedírtelos.</div>';
      } else {
        html += '<h2 style="font-size:clamp(21px,2.4vw,27px);color:var(--navy);margin-bottom:20px">¿A dónde te contactamos?</h2>' +
          '<div class="form-grid">' +
            '<div class="field"><label for="q-nombre">Nombre</label><input id="q-nombre" type="text" placeholder="Nombre y apellido"></div>' +
            '<div class="field"><label for="q-empresa">Empresa</label><input id="q-empresa" type="text" placeholder="Razón social"></div>' +
            '<div class="field"><label for="q-tel">Teléfono</label><input id="q-tel" type="tel" placeholder="10 dígitos"></div>' +
            '<div class="field"><label for="q-correo">Correo</label><input id="q-correo" type="email" placeholder="nombre@empresa.mx"></div>' +
            '<div class="field field--full"><label for="q-agencia">Agencia más cercana</label><select id="q-agencia">' +
              D.AGENCIAS.map(function (a) { return "<option>" + esc(a.ciudad) + " &middot; " + esc(a.estado) + "</option>"; }).join("") +
            "</select></div>" +
          "</div>" +
          '<p class="muted mt-16" style="font-size:12.5px">Al enviar aceptas el aviso de privacidad.</p>';
      }

      html += '<div class="quote__nav">' +
        (estado.paso > 0 ? '<button class="btn btn--outline" type="button" data-accion="atras">Atrás</button>' : "") +
        (estado.paso > 0 ? '<button class="btn btn--amber" type="button" data-accion="siguiente">' + (estado.paso === 3 ? "Enviar solicitud" : "Continuar") + "</button>" : "") +
        "</div>";

      caja.innerHTML = html;
      pintarResumen();
    }

    function pintarResumen() {
      var u = estado.unidad && estado.unidad !== "indeciso" ? porSlug(estado.unidad) : null;
      aside.innerHTML =
        '<h3 style="font-size:17px;color:var(--navy);border-bottom:2px solid var(--navy);padding-bottom:12px;margin-bottom:6px">Tu cotización</h3>' +
        "<dl>" +
          fila("Línea", estado.linea ? nombreLinea(estado.linea) : "—") +
          fila("Unidad", u ? u.nombre : estado.unidad === "indeciso" ? "Por definir" : "—") +
          fila("Cantidad", estado.cantidad || "—") +
          fila("Pago", estado.pago || "—") +
          fila("Enganche", estado.enganche || "—") +
          fila("Plazo", estado.plazo || "—") +
        "</dl>" +
        (u ? '<img src="' + BASE + u.img + '" alt="' + esc(u.nombre) + '" loading="lazy" style="width:100%;aspect-ratio:16/10;object-fit:cover;margin-top:16px">' : "") +
        '<p class="muted mt-16" style="font-size:12.5px">Respuesta en menos de 24 h hábiles.</p>';
    }

    caja.addEventListener("click", function (e) {
      var opt = e.target.closest("[data-campo][data-v]");
      if (opt) {
        var campo = opt.getAttribute("data-campo");
        estado[campo] = opt.getAttribute("data-v");
        if (campo === "linea") estado.paso = 1;
        persistir();
        pintar();
        return;
      }
      var acc = e.target.closest("[data-accion]");
      if (!acc) return;
      var a = acc.getAttribute("data-accion");
      if (a === "atras") estado.paso = Math.max(0, estado.paso - 1);
      if (a === "siguiente") {
        if (estado.paso === 3) estado.listo = true;
        else estado.paso++;
      }
      if (a === "reiniciar") {
        estado = { paso: 0, linea: "", unidad: "", cantidad: "1 unidad",
          pago: "Crédito / financiamiento", enganche: "20 %", plazo: "48 meses", listo: false };
      }
      persistir();
      pintar();
    });

    caja.addEventListener("change", function (e) {
      var s = e.target.closest("select[data-campo]");
      if (!s) return;
      estado[s.getAttribute("data-campo")] = s.value;
      persistir();
      pintarResumen();
    });

    pintar();
  }

  /* ---------- agencias ---------- */

  function agencias() {
    var sel = document.getElementById("filtro-estado");
    var lista = document.getElementById("lista-agencias");
    if (!sel || !lista) return;

    var estados = [];
    D.AGENCIAS.forEach(function (a) { if (estados.indexOf(a.estado) < 0) estados.push(a.estado); });
    estados.sort();

    sel.innerHTML = '<option value="todos">Todos los estados (' + D.AGENCIAS.length + ")</option>" +
      estados.map(function (e) { return '<option value="' + esc(e) + '">' + esc(e) + "</option>"; }).join("");

    function pintar() {
      var f = sel.value;
      var items = D.AGENCIAS.filter(function (a) { return f === "todos" || a.estado === f; });
      lista.innerHTML = items.map(function (a) {
        var url = BASE + "agencias/" + a.slug + ".html";
        return '<div class="agency"><div>' +
            '<b><a href="' + url + '">' + esc(a.ciudad) + "</a></b><br>" +
            "<span>" + esc(a.estado) + " &middot; Tel. " + esc(a.tel) +
            (a.partes ? " &middot; Centro de partes" : "") + "</span></div>" +
          '<div class="row"><a class="btn btn--outline btn--sm" href="' + url + '">Ver agencia</a>' +
          '<a class="btn btn--amber btn--sm" href="' + BASE + 'cotizar.html">Contactar</a></div></div>';
      }).join("");
    }

    sel.addEventListener("change", pintar);
    pintar();
  }

  /* ---------- selector de agencia en el formulario de taller ---------- */

  function tallerAgencias() {
    var sel = document.getElementById("taller-agencia");
    if (!sel) return;
    sel.innerHTML = D.AGENCIAS.map(function (a) {
      return "<option>" + esc(a.ciudad) + " &middot; " + esc(a.estado) + "</option>";
    }).join("");
  }


  /* ---------- formato ---------- */

  var fmtMXN = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
  var fmtNum = new Intl.NumberFormat("es-MX");

  function pesos(n) { return fmtMXN.format(Math.round(n)); }
  function num(n) { return fmtNum.format(n); }
  function porKm(n) { return "$" + n.toFixed(2); }

  function nombreAgencia(slug) {
    for (var i = 0; i < D.AGENCIAS.length; i++) {
      if (D.AGENCIAS[i].slug === slug) return D.AGENCIAS[i].ciudad;
    }
    return slug;
  }

  /* ---------- calculadora de costo por kilómetro ---------- */

  function calculadoraKm() {
    var form = document.getElementById("calc-form");
    var salida = document.getElementById("calc-resultado");
    var sens = document.getElementById("calc-sensibilidad");
    if (!form || !salida) return;

    var CAMPOS = ["unidades", "kmMes", "precioDiesel", "rendimiento", "mantenimiento", "otros"];

    // Sembrar los valores de arranque sin pisar lo que el visitante ya escribió.
    CAMPOS.forEach(function (k) {
      var input = form.elements[k];
      if (input && input.value === "") input.value = D.TCO_BASE[k];
    });

    function leer() {
      var v = {};
      CAMPOS.forEach(function (k) {
        var n = parseFloat(form.elements[k].value);
        v[k] = isFinite(n) && n >= 0 ? n : 0;
      });
      return v;
    }

    function pintar() {
      var v = leer();

      if (!v.kmMes || !v.rendimiento) {
        salida.innerHTML = '<h3 style="font-size:17px;color:var(--navy);border-bottom:2px solid var(--navy);padding-bottom:12px;margin-bottom:14px">Tu costo por kilómetro</h3>' +
          '<p class="lead" style="font-size:14.5px">Captura al menos los kilómetros al mes y el rendimiento para ver el resultado.</p>';
        if (sens) sens.innerHTML = "";
        return;
      }

      var combustible = v.precioDiesel / v.rendimiento;
      var mantenimiento = v.mantenimiento / v.kmMes;
      var otros = v.otros / v.kmMes;
      var total = combustible + mantenimiento + otros;
      var unidades = Math.max(1, v.unidades);
      var anualFlota = total * v.kmMes * 12 * unidades;

      salida.innerHTML =
        '<h3 style="font-size:17px;color:var(--navy);border-bottom:2px solid var(--navy);padding-bottom:12px;margin-bottom:16px">Tu costo por kilómetro</h3>' +
        '<div class="num" style="font-family:var(--display);font-size:clamp(38px,5vw,52px);font-weight:800;color:var(--navy);line-height:1">' + porKm(total) + '</div>' +
        '<p class="muted" style="font-size:12px;letter-spacing:.13em;text-transform:uppercase;font-weight:600;margin-bottom:18px">por kilómetro recorrido</p>' +
        '<dl>' +
          fila("Combustible", porKm(combustible)) +
          fila("Mantenimiento y llantas", porKm(mantenimiento)) +
          fila("Otros costos fijos", porKm(otros)) +
        '</dl>' +
        '<div style="border-top:2px solid var(--navy);margin-top:14px;padding-top:14px">' +
          '<div class="muted" style="font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:600">Costo anual de la flota</div>' +
          '<div class="num" style="font-family:var(--display);font-size:26px;font-weight:800;color:var(--navy);margin-top:4px">' + pesos(anualFlota) + '</div>' +
          '<p class="muted" style="font-size:12.5px;margin-top:6px">' + num(unidades) + ' unidad' + (unidades === 1 ? "" : "es") +
            ' &middot; ' + num(v.kmMes * 12 * unidades) + ' km al año</p>' +
        '</div>' +
        '<a class="btn btn--amber btn--block mt-16" href="cotizar.html">Recibir el análisis por correo</a>';

      if (!sens) return;

      var mejoras = [0.2, 0.5, 1.0];
      var filas = mejoras.map(function (d) {
        var nuevo = v.rendimiento + d;
        var ahorroKm = combustible - v.precioDiesel / nuevo;
        var ahorroAnual = ahorroKm * v.kmMes * 12 * unidades;
        return "<tr>" +
          '<th scope="row">+' + d.toFixed(1) + " km/L</th>" +
          "<td>" + nuevo.toFixed(1) + " km/L</td>" +
          "<td>" + porKm(ahorroKm) + "</td>" +
          '<td class="is-best">' + pesos(ahorroAnual) + "</td>" +
        "</tr>";
      }).join("");

      sens.innerHTML =
        '<h2 style="font-size:clamp(20px,2.2vw,26px);color:var(--navy);margin-bottom:10px">Cuánto vale cada mejora de rendimiento</h2>' +
        '<p class="lead" style="margin-bottom:20px">Con tus mismos kilómetros y tu mismo precio de diésel, esto es lo que deja al año cada punto de rendimiento en tus ' + num(unidades) + ' unidad' + (unidades === 1 ? "" : "es") + '.</p>' +
        '<div class="table-scroll"><table class="cmp">' +
          "<thead><tr><th>Mejora</th><th>Rendimiento resultante</th><th>Ahorro por km</th><th>Ahorro anual de la flota</th></tr></thead>" +
          "<tbody>" + filas + "</tbody>" +
        "</table></div>" +
        '<p class="muted" style="font-size:12.5px;margin-top:12px">Aritmética simple sobre tus cifras: no supone ningún rendimiento de una unidad Sitrak. El rendimiento real de la unidad en tu ruta lo mide un asesor contigo.</p>';
    }

    form.addEventListener("input", pintar);
    form.addEventListener("change", pintar);
    pintar();
  }

  /* ---------- seminuevos ---------- */

  function seminuevos() {
    var cont = document.getElementById("sn-lista");
    var filtros = document.getElementById("sn-filtros");
    if (!cont || !filtros) return;

    var selAgencia = document.getElementById("sn-agencia");
    var selAnio = document.getElementById("sn-anio");

    if (!selAgencia.options.length) {
      var usadas = [];
      D.SEMINUEVOS.forEach(function (u) { if (usadas.indexOf(u.agencia) < 0) usadas.push(u.agencia); });
      selAgencia.innerHTML = '<option value="">Todas las agencias</option>' +
        usadas.map(function (a) { return '<option value="' + a + '">' + esc(nombreAgencia(a)) + "</option>"; }).join("");
    }
    if (!selAnio.options.length) {
      var anios = D.SEMINUEVOS.map(function (u) { return u.anio; }).sort();
      var min = anios[0], max = anios[anios.length - 1], opts = "";
      for (var y = min; y <= max; y++) opts += '<option value="' + y + '">' + y + " o más nuevo</option>";
      selAnio.innerHTML = '<option value="">Cualquier año</option>' + opts;
    }

    function pintar() {
      var fa = selAgencia.value;
      var fy = parseInt(selAnio.value, 10);
      var fk = parseInt(document.getElementById("sn-km").value, 10);
      var fp = parseInt(document.getElementById("sn-precio").value, 10);

      var lista = D.SEMINUEVOS.filter(function (u) {
        if (fa && u.agencia !== fa) return false;
        if (fy && u.anio < fy) return false;
        if (fk && u.km > fk) return false;
        if (fp && u.precio > fp) return false;
        return true;
      });

      document.getElementById("sn-conteo").textContent =
        lista.length + (lista.length === 1 ? " unidad disponible" : " unidades disponibles");

      cont.innerHTML = lista.length ? lista.map(function (u) {
        return '<article class="unit">' +
          '<span class="unit__media"><img src="' + BASE + u.img + '" alt="' + esc(u.nombre) + '" loading="lazy" width="600" height="450"></span>' +
          '<div class="unit__body">' +
            '<span class="unit__cat">' + u.anio + " &middot; " + esc(nombreAgencia(u.agencia)) + "</span>" +
            '<h3 class="unit__title">' + esc(u.nombre) + "</h3>" +
            '<p class="unit__desc">' + esc(u.nota) + "</p>" +
            '<dl class="unit__rows">' +
              '<div class="srow"><dt>Kilometraje</dt><dd>' + num(u.km) + " km</dd></div>" +
              '<div class="srow"><dt>Estado</dt><dd>' + esc(u.condicion) + "</dd></div>" +
              '<div class="srow"><dt>Precio</dt><dd>' + pesos(u.precio) + "</dd></div>" +
            "</dl>" +
            '<div class="unit__acts">' +
              '<a class="btn btn--amber btn--sm" href="' + BASE + 'cotizar.html">Me interesa</a>' +
              '<a class="btn btn--outline btn--sm" href="' + BASE + 'costo-por-km.html">Costo por km</a>' +
            "</div>" +
          "</div></article>";
      }).join("") : '<p class="lead">Ninguna unidad coincide con esos filtros. Prueba ampliando el presupuesto o el kilometraje.</p>';
    }

    filtros.addEventListener("change", pintar);
    pintar();
  }

  /* ---------- refacciones ---------- */

  function refacciones() {
    var tabla = document.getElementById("rf-tabla");
    var filtros = document.getElementById("rf-filtros");
    if (!tabla || !filtros) return;

    var selSistema = document.getElementById("rf-sistema");
    var selModelo = document.getElementById("rf-modelo");
    var buscar = document.getElementById("rf-buscar");

    if (!selSistema.options.length) {
      selSistema.innerHTML = '<option value="">Todos los sistemas</option>' +
        D.SISTEMAS.map(function (x) { return '<option value="' + x.id + '">' + esc(x.nombre) + "</option>"; }).join("");
    }
    if (!selModelo.options.length) {
      selModelo.innerHTML = '<option value="">Cualquier modelo</option>' +
        D.MODELOS.map(function (m) { return '<option value="' + m.slug + '">' + esc(m.nombre) + "</option>"; }).join("");
    }

    function nombreSistema(id) {
      for (var i = 0; i < D.SISTEMAS.length; i++) if (D.SISTEMAS[i].id === id) return D.SISTEMAS[i].nombre;
      return id;
    }

    function pintar() {
      var q = (buscar.value || "").trim().toLowerCase();
      var fs = selSistema.value;
      var fm = selModelo.value;

      var lista = D.REFACCIONES.filter(function (r) {
        if (fs && r.sistema !== fs) return false;
        if (fm && r.compat.indexOf(fm) < 0) return false;
        if (q && (r.nombre + " " + r.np).toLowerCase().indexOf(q) < 0) return false;
        return true;
      });

      document.getElementById("rf-conteo").textContent =
        lista.length + (lista.length === 1 ? " refacción encontrada" : " refacciones encontradas");

      if (!lista.length) {
        tabla.innerHTML = '<tbody><tr><td style="padding:36px 20px;color:var(--muted)">Sin resultados. Prueba con el número de parte o cambia los filtros.</td></tr></tbody>';
        return;
      }

      tabla.innerHTML =
        "<thead><tr><th>Número de parte</th><th>Descripción</th><th>Sistema</th><th>Compatible con</th><th>Precio</th><th></th></tr></thead><tbody>" +
        lista.map(function (r) {
          var compat = r.compat.map(function (slug) {
            var m = porSlug(slug);
            return m ? '<a href="' + BASE + "modelos/" + slug + '.html">' + esc(m.nombre) + "</a>" : "";
          }).filter(Boolean).join("<br>");
          return "<tr>" +
            "<td><strong>" + esc(r.np) + "</strong></td>" +
            "<td>" + esc(r.nombre) + "</td>" +
            "<td>" + esc(nombreSistema(r.sistema)) + "</td>" +
            '<td style="font-size:13px">' + compat + "</td>" +
            "<td>" + pesos(r.precio) + "</td>" +
            '<td><a class="btn btn--amber btn--sm" href="' + BASE + 'cotizar.html">Consultar existencia</a></td>' +
          "</tr>";
        }).join("") + "</tbody>";
    }

    filtros.addEventListener("input", pintar);
    filtros.addEventListener("change", pintar);
    pintar();
  }

  /* ---------- valuación de la unidad actual ---------- */

  function valuacion() {
    var form = document.getElementById("val-form");
    var salida = document.getElementById("val-resultado");
    if (!form || !salida) return;

    // Tabla de arranque para la demostración. Se sustituye por la tabla de
    // valuación real de Apex antes de publicar.
    var BASE_TIPO = {
      "Tractocamión": 1900000,
      "Volteo": 1750000,
      "Chasis / carga": 1350000,
      "Ligero": 750000
    };
    var AJUSTE_ESTADO = { excelente: 1.08, bueno: 1, regular: 0.9, malo: 0.78 };
    var ANIO_ACTUAL = 2026;

    var anio = document.getElementById("v-anio");
    var km = document.getElementById("v-km");
    if (anio && anio.value === "") anio.value = 2021;
    if (km && km.value === "") km.value = 450000;

    function estadoActivo() {
      var b = form.querySelector('[data-estado][aria-pressed="true"]');
      return b ? b.getAttribute("data-estado") : "bueno";
    }

    function pintar() {
      var tipo = document.getElementById("v-tipo").value;
      var a = parseInt(anio.value, 10);
      var k = parseInt(km.value, 10);

      if (!isFinite(a) || !isFinite(k)) {
        salida.innerHTML = '<h3 style="font-size:17px;color:var(--navy)">Estimación</h3><p class="lead" style="font-size:14.5px">Captura el año y el kilometraje.</p>';
        return;
      }

      var edad = Math.max(0, ANIO_ACTUAL - a);
      var valor = (BASE_TIPO[tipo] || 1000000) * Math.pow(0.88, edad);

      // Castigo por kilometraje por encima de 80,000 km al año.
      var esperado = Math.max(1, edad) * 80000;
      var exceso = Math.max(0, k - esperado);
      valor *= Math.max(0.55, 1 - (exceso / 100000) * 0.03);
      valor *= AJUSTE_ESTADO[estadoActivo()];

      var bajo = valor * 0.92, alto = valor * 1.08;

      salida.innerHTML =
        '<h3 style="font-size:17px;color:var(--navy);border-bottom:2px solid var(--navy);padding-bottom:12px;margin-bottom:16px">Rango estimado</h3>' +
        '<div class="num" style="font-family:var(--display);font-size:clamp(26px,3.4vw,34px);font-weight:800;color:var(--navy);line-height:1.1">' +
          pesos(bajo) + '<span style="color:var(--muted);font-size:18px"> a </span>' + pesos(alto) + "</div>" +
        '<dl class="mt-16">' +
          fila("Tipo", tipo) +
          fila("Antigüedad", edad + (edad === 1 ? " año" : " años")) +
          fila("Kilometraje", num(k) + " km") +
          fila("Estado", estadoActivo().charAt(0).toUpperCase() + estadoActivo().slice(1)) +
        "</dl>" +
        '<a class="btn btn--amber btn--block mt-16" href="' + BASE + 'cotizar.html">Aplicarlo como enganche</a>' +
        '<p class="muted" style="font-size:12px;margin-top:14px">Tabla de valuación de demostración. Se sustituye por la tabla real de Apex antes de publicar.</p>';
    }

    form.addEventListener("input", pintar);
    form.addEventListener("change", pintar);
    form.addEventListener("click", function (e) {
      var b = e.target.closest("[data-estado]");
      if (!b) return;
      var todos = form.querySelectorAll("[data-estado]");
      for (var i = 0; i < todos.length; i++) todos[i].setAttribute("aria-pressed", String(todos[i] === b));
      pintar();
    });
    pintar();
  }

  /* ---------- arranque ----------
     initPagina() vuelve a cablear los módulos sobre el DOM actual. El sitio la
     llama una vez al cargar; una integración que reemplace el contenido sin
     recargar (Elementor, o el visor de una sola página) la llama de nuevo. */

  function initPagina() {
    menu();
    lineas();
    catalogo();
    comparadorPagina();
    selector();
    cotizador();
    agencias();
    tallerAgencias();
    calculadoraKm();
    seminuevos();
    refacciones();
    valuacion();
    sincronizarCasillas();
  }

  window.ApexApp = { init: initPagina };
  initPagina();
})();
