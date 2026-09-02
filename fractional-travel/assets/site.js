/* ============================================================
   La Fracción Nayarit — comportamiento compartido del sitio
   Cada módulo comprueba sus elementos antes de correr, así el
   mismo archivo sirve a todas las páginas del hub.
   ============================================================ */
(function(){
  "use strict";

  var UNIT_WEEKS = 6.5, PEAK_PER_FRACTION = 2;
  var money = function(n){ return "$" + Math.round(n).toLocaleString("en-US"); };
  var trim  = function(n){ return n.toFixed(1).replace(".0",""); };

  /* ---------- menú móvil ---------- */
  var toggle = document.querySelector(".navtoggle");
  var drawer = document.querySelector(".navdrawer");
  if (toggle && drawer){
    toggle.addEventListener("click", function(){
      var open = drawer.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Cerrar" : "Menú";
    });
    drawer.addEventListener("click", function(e){
      if (e.target.tagName === "A"){ drawer.classList.remove("open"); toggle.textContent = "Menú"; }
    });
  }

  /* ---------- 1. El libro de fracciones (portada) ---------- */
  var sharesEl = document.getElementById("shares");
  var weeksEl  = document.getElementById("weeks");
  if (sharesEl && weeksEl){
    var UNIT_PRICE = +(sharesEl.getAttribute("data-unit") || 140000);
    var i;
    for (i = 1; i <= 8; i++){
      var sq = document.createElement("div");
      sq.className = "share"; sq.setAttribute("data-n", i);
      sharesEl.appendChild(sq);
    }
    for (i = 0; i < 52; i++){
      var wc = document.createElement("div");
      wc.className = "wk"; weeksEl.appendChild(wc);
    }
    var shareNodes = sharesEl.children, weekNodes = weeksEl.children;

    // repartidas por el año, no en bloque: así reparte un calendario rotativo real
    var SLOTS = [1,7,12,16,21,26,30,34,38,43,47,50,3,9,18,23,28,32,36,41,45,51,5,14,20,25];
    var PEAKS = [51,13,0,29,8,44,17,35];

    var renderDeed = function(f){
      var mine = Math.round(UNIT_WEEKS * f), peak = PEAK_PER_FRACTION * f, k;
      for (k = 0; k < 8; k++) shareNodes[k].classList.toggle("mine", k < f);
      for (k = 0; k < 52; k++) weekNodes[k].className = "wk";
      for (k = 0; k < mine - peak && k < SLOTS.length; k++) weekNodes[SLOTS[k]].className = "wk on";
      for (k = 0; k < peak && k < PEAKS.length; k++) weekNodes[PEAKS[k]].className = "wk peak";

      var lbl = document.getElementById("mineLabel");
      if (lbl) lbl.textContent = f + (f === 1 ? " fracción suya" : " fracciones suyas");
      var ref = document.getElementById("deedRef");
      if (ref) ref.innerHTML = "NAY&mdash;0<span class='num'>" + f + "</span>/08";
      var inv = document.getElementById("figInv");
      if (inv) inv.textContent = money(UNIT_PRICE * f);
      var fw = document.getElementById("figWeeks");
      if (fw) fw.innerHTML = trim(UNIT_WEEKS * f) + "<small>" + peak + " en alta temporada</small>";
    };

    var picks = Array.prototype.slice.call(document.querySelectorAll(".frac-pick button"));
    picks.forEach(function(btn){
      btn.addEventListener("click", function(){
        picks.forEach(function(b){ b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        renderDeed(parseInt(btn.getAttribute("data-f"), 10));
      });
    });
    renderDeed(1);
  }

  /* ---------- 2. Calculadora del modelo económico ---------- */
  var cValue = document.getElementById("cValue");
  if (cValue){
    var OCCUPANCY = 0.62, MGMT_FEE = 0.22, OPEX_RATE = 0.07;
    var ids = ["cValue","cFrac","cUse","cRate","cApp"], el = {};
    ids.forEach(function(id){ el[id] = document.getElementById(id); });
    var put = function(id, text){ var n = document.getElementById(id); if (n) n.textContent = text; };

    var calc = function(){
      var value = +el.cValue.value, frac = +el.cFrac.value,
          use = +el.cUse.value, rate = +el.cRate.value, app = +el.cApp.value / 100;

      var invest    = value / 8 * frac;
      var allocated = UNIT_WEEKS * frac;
      var used      = Math.min(use, allocated);
      var freed     = Math.max(allocated - used, 0);
      var income    = freed * 7 * rate * OCCUPANCY * (1 - MGMT_FEE);
      var opex      = invest * OPEX_RATE;
      var apprec    = invest * app;
      var enjoy     = used * 7 * rate;
      var total     = income - opex + apprec + enjoy;

      put("vValue", money(value));
      put("vFrac", frac + " / 8");
      put("vUse", use);
      put("vRate", money(rate));
      put("vApp", (app * 100).toFixed(1) + "%");

      put("rInv", money(invest));
      put("rWeeks", trim(allocated));
      put("rFree", trim(freed));
      put("rIncome", "+" + money(income));
      put("rFees", "−" + money(opex));
      put("rApp", "+" + money(apprec));
      put("rEnjoy", money(enjoy));
      put("rTotal", (total >= 0 ? "+" : "−") + money(Math.abs(total)));

      el.cUse.max = Math.round(allocated);
      if (+el.cUse.value > +el.cUse.max) el.cUse.value = el.cUse.max;
    };
    ids.forEach(function(id){ if (el[id]) el[id].addEventListener("input", calc); });
    calc();
  }

  /* ---------- 3. Formularios de calificación ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("form[data-lead]"), function(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var required = form.querySelectorAll("[required]");
      for (var i = 0; i < required.length; i++){
        if (!required[i].value.trim()){ required[i].focus(); return; }
      }
      // TODO: conectar al CRM / endpoint de la operación antes de publicar en producción
      var ok = form.querySelector(".form-ok");
      if (ok) ok.classList.add("show");
      var btn = form.querySelector("button[type=submit]");
      if (btn){ btn.textContent = "Solicitud enviada"; btn.disabled = true; }
    });
  });

  /* ---------- 4. Enrutado del previsualizador de una sola página ---------- */
  var routes = document.querySelectorAll(".route");
  if (routes.length){
    var show = function(){
      var want = (location.hash || "#/inicio").replace("#", "");
      var found = false, i;
      for (i = 0; i < routes.length; i++){
        var on = routes[i].getAttribute("data-route") === want;
        routes[i].classList.toggle("active", on);
        if (on) found = true;
      }
      if (!found) routes[0].classList.add("active");
      Array.prototype.forEach.call(document.querySelectorAll("a[data-nav]"), function(a){
        if (a.getAttribute("href") === "#" + want) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", show);
    show();
  }
})();
