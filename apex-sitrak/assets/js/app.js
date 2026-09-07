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

  function porSeminuevo(id) {
    for (var i = 0; i < D.SEMINUEVOS.length; i++) {
      if (D.SEMINUEVOS[i].id === id) return D.SEMINUEVOS[i];
    }
    return null;
  }

  function porRefaccion(np) {
    for (var i = 0; i < D.REFACCIONES.length; i++) {
      if (D.REFACCIONES[i].np === np) return D.REFACCIONES[i];
    }
    return null;
  }

  function porAgencia(slug) {
    for (var i = 0; i < D.AGENCIAS.length; i++) {
      if (D.AGENCIAS[i].slug === slug) return D.AGENCIAS[i];
    }
    return null;
  }

  // Estados de la república que la red atiende, en orden alfabético.
  function estadosCubiertos() {
    return Object.keys(D.COBERTURA).sort(function (a, b) { return a.localeCompare(b, "es"); });
  }

  /* ---------- contexto que viaja en la URL ----------
     Todo el embudo depende de que el lead llegue sabiendo de dónde vino: qué
     unidad miraba, qué refacción buscaba, qué costo por km calculó y qué
     agencia le toca. Estos dos helpers son el único lugar donde se lee y se
     arma esa información. */

  function parametros() {
    var q = {};
    // El visor de una sola página guarda la consulta en el hash; el sitio
    // multipágina la trae en location.search. Se leen las dos.
    var fuentes = [location.search, location.hash.indexOf("?") > -1 ? location.hash.slice(location.hash.indexOf("?")) : ""];
    fuentes.forEach(function (f) {
      if (!f) return;
      new URLSearchParams(f).forEach(function (v, k) { if (v) q[k] = v; });
    });
    return q;
  }

  function aConsulta(obj) {
    var partes = [];
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== "" && obj[k] != null) {
        partes.push(encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]));
      }
    }
    return partes.join("&");
  }

  // Enlace de WhatsApp con el mensaje ya redactado: el asesor recibe el
  // contexto en lugar de empezar preguntando de qué unidad se trata.
  function waLink(texto) {
    var n = (D.CONTACTO && D.CONTACTO.whatsapp) || "";
    return "https://wa.me/" + n + "?text=" + encodeURIComponent(texto);
  }

  function nombreLinea(id) {
    for (var i = 0; i < D.LINEAS.length; i++) {
      if (D.LINEAS[i].id === id) return D.LINEAS[i].nombre;
    }
    return id;
  }

  // Prefijo relativo: las fichas viven en /modelos/, el resto en la raíz.
  var BASE = /\/modelos\/[^/]+\.html?$/.test(location.pathname) ? "../" : "";

  // Ruta de una imagen del catálogo. En el sitio normal es la ruta relativa; en
  // el visor de un solo archivo el paquete deja las imágenes ya incrustadas en
  // __APEX_IMG__, para que ese HTML se pueda compartir suelto.
  function imagen(ruta) {
    var inc = window.__APEX_IMG__;
    if (inc) {
      var nombre = String(ruta).split("/").pop();
      if (inc[nombre]) return inc[nombre];
    }
    return BASE + ruta;
  }

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
        '<img src="' + imagen(m.img) + '" alt="' + esc(m.nombre) + '" loading="lazy" width="600" height="450">' +
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
          '<a class="btn btn--amber btn--sm" href="' + BASE + "cotizar.html?u=" + m.slug + "&origen=catalogo" + '">Cotizar</a>' +
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
        '<span class="line-card__media"><img src="' + imagen(l.img) + '" alt="' + esc(l.nombre) + '" loading="lazy" width="400" height="320"></span>' +
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
        '<span class="cmp__media"><img src="' + imagen(m.img) + '" alt="' + esc(m.nombre) + '" loading="lazy" width="400" height="250"></span>' +
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

  /* ---------- cotizador: un motor, varios guiones ----------
     No hay cuatro formularios distintos. Hay una máquina de pasos y un guion
     por intención: quien viene por una refacción no debe contestar «¿qué tipo
     de unidad buscas?». El guion se elige con ?tipo= y el contexto viaja en la
     URL para que el asesor reciba el lead con los datos ya puestos. */

  var GUIONES = {
    unidad:    { pasos: ["linea", "unidad", "pago", "contacto"],   etiqueta: "Cotizar unidad nueva" },
    seminuevo: { pasos: ["seminuevo", "pago", "contacto"],          etiqueta: "Cotizar seminuevo" },
    refaccion: { pasos: ["refaccion", "contacto"],                  etiqueta: "Consultar refacción" },
    taller:    { pasos: ["taller", "contacto"],                     etiqueta: "Agendar servicio de taller" }
  };

  var TITULOS = {
    linea: "Tipo de operación", unidad: "Unidad y cantidad", pago: "Enganche y plazo",
    seminuevo: "Unidad seminueva", refaccion: "Refacción", taller: "Servicio de taller",
    contacto: "Datos de contacto"
  };

  function estadoNuevo(tipo) {
    return {
      tipo: GUIONES[tipo] ? tipo : "unidad", paso: 0,
      linea: "", unidad: "", cantidad: "1 unidad",
      pago: "Crédito / financiamiento", enganche: "20 %", plazo: "48 meses",
      agencia: "", sn: "", np: "", servicio: "Mantenimiento preventivo", vin: "", fecha: "",
      origen: "", cpk: "", km: "", rend: ""
    };
  }

  function cotizador() {
    var caja = document.getElementById("cotizador");
    var aside = document.getElementById("cotizador-resumen");
    if (!caja || !aside) return;

    var p = parametros();
    var estado = leer(CLAVE_COT, null);

    // Un enlace con contexto siempre gana sobre lo que quedó en sesión: si el
    // visitante pulsó «Me interesa» en otra unidad, esa es su intención ahora.
    var contexto = p.u || p.sn || p.np || p.ag || p.tipo || p.origen;
    if (!estado || contexto) {
      var previo = estado;
      estado = estadoNuevo(p.tipo);
      if (previo && !p.tipo) {
        // Conserva lo que ya había contestado del mismo guion.
        ["cantidad", "pago", "enganche", "plazo", "agencia"].forEach(function (k) {
          if (previo[k]) estado[k] = previo[k];
        });
      }
      if (p.u && porSlug(p.u)) { estado.unidad = p.u; estado.linea = porSlug(p.u).linea; }
      if (p.sn && porSeminuevo(p.sn)) { estado.tipo = "seminuevo"; estado.sn = p.sn; }
      if (p.np && porRefaccion(p.np)) { estado.tipo = "refaccion"; estado.np = p.np; }
      if (p.ag && porAgencia(p.ag)) estado.agencia = p.ag;
      ["origen", "cpk", "km", "rend"].forEach(function (k) { if (p[k]) estado[k] = p[k]; });

      // Si ya sabemos qué unidad quiere, se salta la elección de línea y modelo.
      var guion = GUIONES[estado.tipo].pasos;
      if (estado.tipo === "unidad" && estado.unidad) estado.paso = guion.indexOf("pago");
      if (estado.tipo === "seminuevo" && estado.sn) estado.paso = guion.indexOf("pago");
      if (estado.tipo === "refaccion" && estado.np) estado.paso = guion.indexOf("contacto");
    }
    if (!GUIONES[estado.tipo]) estado.tipo = "unidad";

    function pasos() { return GUIONES[estado.tipo].pasos; }
    function pasoActual() { return pasos()[Math.min(estado.paso, pasos().length - 1)]; }
    function persistir() { guardar(CLAVE_COT, estado); }

    /* --- cada paso pinta su propio contenido --- */

    var PINTA = {
      linea: function () {
        return h2("¿Qué tipo de unidad buscas?") +
          '<div class="option-grid">' + D.LINEAS.map(function (l) {
            return '<button class="option" type="button" data-campo="linea" data-v="' + l.id + '"><b>' +
              esc(l.nombre) + "</b><span>" + esc(l.desc) + "</span></button>";
          }).join("") + "</div>";
      },

      unidad: function () {
        var lista = D.MODELOS.filter(function (m) { return !estado.linea || m.linea === estado.linea; });
        return h2("¿Cuál unidad y cuántas?") +
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
      },

      seminuevo: function () {
        return h2("¿Cuál unidad del inventario?") +
          '<div class="field field--full"><label for="q-sn">Seminuevo</label><select id="q-sn" data-campo="sn">' +
            '<option value="">Elegir&hellip;</option>' +
            D.SEMINUEVOS.map(function (u) {
              return '<option value="' + u.id + '"' + (estado.sn === u.id ? " selected" : "") + ">" +
                esc(u.nombre) + " &middot; " + u.anio + " &middot; " + esc(nombreAgencia(u.agencia)) + "</option>";
            }).join("") + "</select></div>" +
          '<div class="note note--amber mt-24">Cada seminuevo del inventario tiene historial de servicio. Al enviar la solicitud te llega el expediente completo de esa unidad.</div>';
      },

      refaccion: function () {
        return h2("¿Qué refacción necesitas?") +
          '<div class="form-grid">' +
            '<div class="field field--full"><label for="q-np">Número de parte o descripción</label><select id="q-np" data-campo="np">' +
              '<option value="">Elegir&hellip;</option>' +
              D.REFACCIONES.map(function (r) {
                return '<option value="' + esc(r.np) + '"' + (estado.np === r.np ? " selected" : "") + ">" +
                  esc(r.np) + " &middot; " + esc(r.nombre) + "</option>";
              }).join("") +
              '<option value="otra"' + (estado.np === "otra" ? " selected" : "") + ">No está en la lista</option>" +
            "</select></div>" +
            '<div class="field field--full"><label for="q-unidad">Unidad donde se instala</label><select id="q-unidad" data-campo="unidad">' +
              '<option value="">Elegir&hellip;</option>' +
              D.MODELOS.map(function (m) {
                return '<option value="' + m.slug + '"' + (estado.unidad === m.slug ? " selected" : "") + ">" + esc(m.nombre) + "</option>";
              }).join("") + "</select></div>" +
          "</div>" +
          '<div class="note note--amber mt-24">Con el número de parte y la unidad confirmamos <strong>existencia y tiempo de entrega</strong> antes de llamarte, en lugar de tomarte el dato y devolverte la llamada después.</div>';
      },

      taller: function () {
        return h2("¿Qué servicio y cuándo?") +
          '<div class="form-grid">' +
            '<div class="field"><label for="q-servicio">Tipo de servicio</label><select id="q-servicio" data-campo="servicio">' +
              ["Mantenimiento preventivo", "Correctivo / diagnóstico", "Hojalatería y pintura", "Garantía"].map(function (o) {
                return "<option" + (estado.servicio === o ? " selected" : "") + ">" + o + "</option>";
              }).join("") + "</select></div>" +
            '<div class="field"><label for="q-fecha">Fecha deseada</label><input id="q-fecha" type="date" data-campo="fecha" value="' + esc(estado.fecha) + '"></div>' +
            '<div class="field field--full"><label for="q-vin">VIN o número económico</label><input id="q-vin" type="text" data-campo="vin" placeholder="Opcional" value="' + esc(estado.vin) + '"></div>' +
          "</div>" +
          '<div class="note note--amber mt-24">Confirmamos disponibilidad de refacciones antes de que llegues, para que la unidad no espere en el patio.</div>';
      },

      pago: function () {
        return h2("Enganche y plazo") +
          '<div class="field" style="margin-bottom:22px"><label for="q-pago">Forma de pago</label><select id="q-pago" data-campo="pago">' +
            ["Crédito / financiamiento", "Contado", "Arrendamiento", "Por definir"].map(function (o) {
              return "<option" + (estado.pago === o ? " selected" : "") + ">" + o + "</option>";
            }).join("") + "</select></div>" +
          '<div class="field" style="margin-bottom:22px">' + rotulo("Enganche estimado") +
            '<div class="choice-grid">' + ["10 %", "20 %", "30 %", "40 % o más"].map(function (o) {
              return '<button class="choice" type="button" data-campo="enganche" data-v="' + o + '" aria-pressed="' + (estado.enganche === o) + '">' + o + "</button>";
            }).join("") + "</div></div>" +
          '<div class="field">' + rotulo("Plazo deseado") +
            '<div class="choice-grid">' + ["24 meses", "36 meses", "48 meses", "60 meses"].map(function (o) {
              return '<button class="choice" type="button" data-campo="plazo" data-v="' + o + '" aria-pressed="' + (estado.plazo === o) + '">' + o + "</button>";
            }).join("") + "</div></div>" +
          '<div class="note note--amber mt-24">Con estos dos datos la cotización te llega con la <strong>mensualidad estimada ya calculada</strong>, en vez de una segunda llamada para pedírtelos.</div>';
      },

      contacto: function () {
        return h2("¿A dónde te contactamos?") +
          '<div class="form-grid">' +
            '<div class="field"><label for="q-nombre">Nombre</label><input id="q-nombre" type="text" data-campo="nombre" placeholder="Nombre y apellido"></div>' +
            '<div class="field"><label for="q-empresa">Empresa</label><input id="q-empresa" type="text" data-campo="empresa" placeholder="Razón social"></div>' +
            '<div class="field"><label for="q-tel">Teléfono</label><input id="q-tel" type="tel" data-campo="telefono" placeholder="10 dígitos"></div>' +
            '<div class="field"><label for="q-correo">Correo</label><input id="q-correo" type="email" data-campo="correo" placeholder="nombre@empresa.mx"></div>' +
            '<div class="field field--full"><label for="q-estado">¿En qué estado operas?</label><select id="q-estado" data-campo="estadoMx">' +
              '<option value="">Elegir&hellip;</option>' +
              estadosCubiertos().map(function (e) {
                return '<option value="' + esc(e) + '"' + (D.COBERTURA[e] === estado.agencia ? " selected" : "") + ">" + esc(e) + "</option>";
              }).join("") + "</select></div>" +
            '<div class="field field--full"><label for="q-agencia">Agencia que te atiende</label><select id="q-agencia" data-campo="agencia">' +
              // Sin opción vacía el desplegable mostraría una agencia que el
              // visitante nunca eligió, y el lead saldría etiquetado con otra.
              '<option value=""' + (estado.agencia ? "" : " selected") + ">Elegir&hellip;</option>" +
              D.AGENCIAS.map(function (a) {
                return '<option value="' + a.slug + '"' + (estado.agencia === a.slug ? " selected" : "") + ">" +
                  esc(a.ciudad) + " &middot; " + esc(a.estado) + "</option>";
              }).join("") + "</select></div>" +
          "</div>" +
          '<p class="muted mt-16" style="font-size:12.5px">Al enviar aceptas el aviso de privacidad.</p>';
      }
    };

    function h2(t) {
      return '<h2 style="font-size:clamp(21px,2.4vw,27px);color:var(--navy);margin-bottom:20px">' + esc(t) + "</h2>";
    }
    function rotulo(t) {
      return '<span style="font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-bottom:9px;display:block">' + esc(t) + "</span>";
    }

    function pintar() {
      var lista = pasos();
      var i = Math.min(estado.paso, lista.length - 1);
      estado.paso = i;
      var id = lista[i];
      var pct = ((i + 1) / lista.length) * 100;

      var html = "";

      // Cuando el visitante llega con una agencia ya definida, se lo decimos
      // desde el primer paso en vez de preguntárselo al final.
      var ag = estado.agencia ? porAgencia(estado.agencia) : null;
      if (ag) {
        html += '<div class="note note--amber" style="margin-bottom:18px">Te atiende <strong>Apex Sitrak ' +
          esc(ag.ciudad) + "</strong> &middot; " + esc(ag.estado) + ". Puedes cambiarla en el último paso.</div>";
      }

      html += '<div class="progress"><i style="width:' + pct + '%"></i></div>' +
        '<div class="progress-meta"><strong>Paso ' + (i + 1) + " de " + lista.length +
          " &middot; " + esc(TITULOS[id]) + "</strong><span>" + Math.round(pct) + " % completo</span></div>";

      html += PINTA[id]();

      var puedeAvanzar = id !== "linea";
      html += '<div class="quote__nav">' +
        (i > 0 ? '<button class="btn btn--outline" type="button" data-accion="atras">Atrás</button>' : "") +
        (puedeAvanzar ? '<button class="btn btn--amber" type="button" data-accion="siguiente">' +
          (i === lista.length - 1 ? "Enviar solicitud" : "Continuar") + "</button>" : "") +
        "</div>";

      caja.innerHTML = html;
      pintarResumen();
    }

    function pintarResumen() {
      var u = estado.unidad && estado.unidad !== "indeciso" ? porSlug(estado.unidad) : null;
      var sn = estado.sn ? porSeminuevo(estado.sn) : null;
      var rf = estado.np && estado.np !== "otra" ? porRefaccion(estado.np) : null;
      var ag = estado.agencia ? porAgencia(estado.agencia) : null;
      var filas = "";

      filas += fila("Solicitud", GUIONES[estado.tipo].etiqueta);
      if (estado.tipo === "unidad") {
        filas += fila("Línea", estado.linea ? nombreLinea(estado.linea) : "—") +
          fila("Unidad", u ? u.nombre : estado.unidad === "indeciso" ? "Por definir" : "—") +
          fila("Cantidad", estado.cantidad || "—");
      }
      if (sn) filas += fila("Seminuevo", sn.nombre + " · " + sn.anio) + fila("Precio de lista", pesos(sn.precio));
      if (estado.np) filas += fila("Refacción", rf ? rf.np + " · " + rf.nombre : "Fuera de catálogo") +
        (u ? fila("Se instala en", u.nombre) : "");
      if (estado.tipo === "taller") filas += fila("Servicio", estado.servicio) +
        fila("Fecha deseada", estado.fecha || "Por definir");
      if (estado.tipo === "unidad" || estado.tipo === "seminuevo") {
        filas += fila("Pago", estado.pago || "—") + fila("Enganche", estado.enganche || "—") +
          fila("Plazo", estado.plazo || "—");
      }
      // Números que el visitante calculó en la calculadora: llegan con el lead.
      if (estado.cpk) filas += fila("Su costo por km hoy", "$" + estado.cpk);
      if (estado.km) filas += fila("Km al mes por unidad", num(parseFloat(estado.km) || 0));
      if (estado.rend) filas += fila("Rendimiento actual", estado.rend + " km/L");
      filas += fila("Agencia", ag ? ag.ciudad + " · " + ag.estado : "Por asignar");

      var img = u ? u.img : sn ? sn.img : "";
      aside.innerHTML =
        '<h3 style="font-size:17px;color:var(--navy);border-bottom:2px solid var(--navy);padding-bottom:12px;margin-bottom:6px">Tu solicitud</h3>' +
        "<dl>" + filas + "</dl>" +
        (img ? '<img src="' + imagen(img) + '" alt="" loading="lazy" style="width:100%;aspect-ratio:16/10;object-fit:cover;margin-top:16px">' : "") +
        '<p class="muted mt-16" style="font-size:12.5px">Respuesta en menos de 24 h hábiles.</p>';
    }

    /* --- envío: destino único de conversión --- */

    function enviar() {
      var q = { origen: estado.origen || estado.tipo, tipo: estado.tipo };
      if (estado.unidad && estado.unidad !== "indeciso") q.unidad = estado.unidad;
      if (estado.linea) q.linea = estado.linea;
      if (estado.sn) q.sn = estado.sn;
      if (estado.np) q.np = estado.np;
      if (estado.servicio && estado.tipo === "taller") q.servicio = estado.servicio;
      q.agencia = estado.agencia || "por-asignar";

      // La sesión se limpia: la siguiente visita al cotizador empieza en blanco.
      try { window.sessionStorage.removeItem(CLAVE_COT); } catch (e) {}
      location.href = BASE + "gracias.html?" + aConsulta(q);
    }

    caja.addEventListener("click", function (e) {
      var opt = e.target.closest("[data-campo][data-v]");
      if (opt) {
        var campo = opt.getAttribute("data-campo");
        estado[campo] = opt.getAttribute("data-v");
        if (campo === "linea") estado.paso++;
        persistir();
        pintar();
        return;
      }
      var acc = e.target.closest("[data-accion]");
      if (!acc) return;
      var a = acc.getAttribute("data-accion");
      if (a === "atras") estado.paso = Math.max(0, estado.paso - 1);
      if (a === "siguiente") {
        if (estado.paso === pasos().length - 1) { enviar(); return; }
        estado.paso++;
      }
      if (a === "reiniciar") estado = estadoNuevo(estado.tipo);
      persistir();
      pintar();
    });

    caja.addEventListener("change", function (e) {
      var c = e.target.closest("[data-campo]");
      if (!c || c.hasAttribute("data-v")) return;
      var campo = c.getAttribute("data-campo");

      // Elegir el estado de la república asigna la agencia que lo atiende.
      if (campo === "estadoMx") {
        var destino = D.COBERTURA[c.value];
        if (destino) { estado.agencia = destino; persistir(); pintar(); }
        return;
      }
      estado[campo] = c.value;
      if (campo === "unidad" && porSlug(c.value)) estado.linea = porSlug(c.value).linea;
      persistir();
      pintarResumen();
    });

    pintar();
  }

  /* ---------- página de gracias: el evento de conversión ---------- */

  function gracias() {
    var caja = document.getElementById("gracias-resumen");
    if (!caja) return;

    var p = parametros();
    if (!p.origen && !p.tipo && !p.agencia) return;   // llegada directa

    var u = p.unidad ? porSlug(p.unidad) : null;
    var sn = p.sn ? porSeminuevo(p.sn) : null;
    var rf = p.np ? porRefaccion(p.np) : null;
    var ag = p.agencia ? porAgencia(p.agencia) : null;

    var filas = "";
    if (u) filas += fila("Unidad", u.nombre);
    if (sn) filas += fila("Seminuevo", sn.nombre + " · " + sn.anio);
    if (rf) filas += fila("Refacción", rf.np + " · " + rf.nombre);
    if (p.servicio) filas += fila("Servicio", p.servicio);
    filas += fila("Agencia", ag ? "Apex Sitrak " + ag.ciudad + " · " + ag.estado : "Se te asigna en cuanto confirmes tu zona");

    caja.hidden = false;
    caja.innerHTML =
      '<p class="eyebrow eyebrow--amber">Lo que enviaste</p><dl>' + filas + "</dl>" +
      (ag ? '<p class="muted" style="font-size:12.5px;margin-top:12px">Tel. ' + esc(ag.tel) +
        ' &middot; <a href="' + BASE + "agencias/" + ag.slug + '.html">Ver la agencia</a></p>' : "");

    if (ag) {
      var m = document.getElementById("gracias-mensaje");
      if (m) m.textContent = "Tu solicitud quedó asignada a Apex Sitrak " + ag.ciudad +
        ". Un asesor de esa agencia te contacta en menos de 24 horas hábiles.";
    }

    // Destino único de conversión de todo el sitio. Con estos campos se puede
    // saber qué parte del sitio trae los leads y a qué agencia se fueron.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "generate_lead",
      origen: p.origen || p.tipo || "directo",
      tipo_solicitud: p.tipo || "",
      unidad: p.unidad || p.sn || p.np || "",
      linea: p.linea || "",
      agencia: p.agencia || "por-asignar"
    });
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
          '<a class="btn btn--amber btn--sm" href="' + BASE + "cotizar.html?ag=" + a.slug + "&origen=agencias" + '">Contactar</a></div></div>';
      }).join("");
    }

    sel.addEventListener("change", pintar);
    pintar();
  }

  /* ---------- selector de agencia en el formulario de taller ---------- */

  function tallerAgencias() {
    var sel = document.getElementById("taller-agencia");
    if (!sel) return;
    // El valor es el slug, no el nombre: así la página de gracias puede
    // resolver la agencia y etiquetar el lead igual que el cotizador.
    sel.innerHTML = D.AGENCIAS.map(function (a) {
      return '<option value="' + a.slug + '">' + esc(a.ciudad) + " &middot; " + esc(a.estado) + "</option>";
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
        '<a class="btn btn--amber btn--block mt-16" href="' + BASE + "cotizar.html?" + aConsulta({
          origen: "calculadora", cpk: total.toFixed(2), km: v.kmMes, rend: v.rendimiento
        }) + '">Comparar contra una unidad Sitrak en mi ruta</a>' +
        '<p class="muted" style="font-size:12px;margin-top:10px">El asesor recibe estos mismos números y regresa con rendimiento medido en tu ruta, plan de mantenimiento y valor de reventa.</p>';

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
          '<span class="unit__media"><img src="' + imagen(u.img) + '" alt="' + esc(u.nombre) + '" loading="lazy" width="600" height="450"></span>' +
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
              '<a class="btn btn--amber btn--sm" href="' + BASE + "cotizar.html?" + aConsulta({
                tipo: "seminuevo", sn: u.id, ag: u.agencia, origen: "seminuevos"
              }) + '">Me interesa</a>' +
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
            '<td><a class="btn btn--amber btn--sm" href="' + BASE + "cotizar.html?" + aConsulta({
              tipo: "refaccion", np: r.np, u: fm || "", origen: "refacciones"
            }) + '">Consultar existencia</a></td>' +
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
        '<a class="btn btn--amber btn--block mt-16" href="' + BASE + "cotizar.html?origen=valuacion" + '">Aplicarlo como enganche</a>' +
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

  /* ---------- descarga de ficha técnica ----------
     La única salida para quien todavía no quiere hablar con un vendedor. Pide
     el correo y nada más: es un micro-compromiso, no una cotización encubierta.
     En WordPress este botón abre un Popup de Elementor con un formulario de un
     solo campo y la ficha como archivo adjunto de la confirmación. */

  function fichaTecnica() {
    var boton = document.querySelector("[data-ficha]");
    if (!boton || boton.dataset.cableado === "1") return;
    boton.dataset.cableado = "1";

    var slug = boton.getAttribute("data-ficha");
    var m = porSlug(slug);
    if (!m) return;

    boton.addEventListener("click", function () {
      if (boton.nextElementSibling && boton.nextElementSibling.classList.contains("ficha-form")) return;

      var caja = document.createElement("div");
      caja.className = "card ficha-form";
      caja.style.marginTop = "10px";
      caja.innerHTML =
        '<p class="eyebrow eyebrow--amber">Ficha en PDF</p>' +
        '<p style="font-size:14px;margin-bottom:12px">Te la enviamos al correo. Sin llamada de seguimiento a menos que tú la pidas.</p>' +
        '<div class="field"><label for="ficha-correo">Correo</label>' +
          '<input id="ficha-correo" type="email" placeholder="nombre@empresa.mx"></div>' +
        '<button class="btn btn--amber btn--block mt-8" type="button" data-enviar-ficha>Enviármela</button>';
      boton.insertAdjacentElement("afterend", caja);
      caja.querySelector("input").focus();

      caja.addEventListener("click", function (e) {
        if (!e.target.closest("[data-enviar-ficha]")) return;
        var correo = caja.querySelector("input").value.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
          caja.querySelector("input").focus();
          return;
        }
        location.href = BASE + "gracias.html?" + aConsulta({
          origen: "ficha-tecnica", tipo: "ficha", unidad: slug, linea: m.linea
        });
      });
    });
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
    gracias();
    fichaTecnica();
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
