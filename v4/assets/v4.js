/* NAOS 4.0 · una sola página con rutas por hash. Idioma por <html lang>. Sin dependencias. */
(function () {
  "use strict";
  var LANG = document.documentElement.lang === "es" ? "es" : "en";
  var B = document.body.getAttribute("data-v4") || "";      // ruta a v4/ desde esta página
  var RAIZ = document.body.getAttribute("data-raiz") || "../"; // ruta a la raíz del repo
  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ORDEN = ["tenderness", "emptiness", "saturation", "body", "courtyard"];
  var VIEJAS = { bedroom: "emptiness", windows: "emptiness", kitchen: "saturation", stairs: "body", table: "tenderness", door: "tenderness", courtyard: "courtyard" };
  var COL = { tenderness: "#FF5C9E", emptiness: "#4664FF", saturation: "#FF5B1F", body: "#FFC21A", courtyard: "#2FB36A" };
  var ON = { tenderness: "#0E1116", emptiness: "#FFFFFF", saturation: "#0E1116", body: "#0E1116", courtyard: "#0E1116" };
  var OJOS = { tenderness: "happy", emptiness: "closed", saturation: "tiltin", body: "chevron", courtyard: "dot" };
  var DIAS_EN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  var T = {
    en: {
      names: { tenderness: "Tenderness", emptiness: "Emptiness", saturation: "Saturation", body: "Body", courtyard: "Courtyard" },
      subs: { tenderness: "asked nothing back", emptiness: "less than you need", saturation: "more than you hold", body: "cold, breath, weight", courtyard: "common ground" },
      kicker: null, bajada: null, aro: null, dias: null, notaEnl: null,
      tools: "Tools", topics: "Topics", tryThis: "Try this", watch: "Watch", breathe: "Breathe", today: "Today's door", up: "Up", down: "Down",
      latest: "Latest Shorts", openStep: "Open the step", toolsN: function (n) { return n + (n === 1 ? " tool" : " tools"); },
      soon: "soon", limit: "Limit", source: "Source", home: "Home step", house: "The house", day: "Day",
      in: "IN", hold: "HOLD", out: "OUT", close: "Close", noteEn: "", skip: "Skip to content", youtube: "YouTube", instagram: "Instagram",
      safety: null, lang: "en", sec: "s", other: "Español", otherHref: "es/", legal: "Privacy", terms: "Terms",
      help: 'If this is weighing on you, talk to someone now. Colombia: <a href="tel:106">106</a>, national mental health line, 24/7, or <a href="tel:123">123</a> in immediate danger (<a href="https://findahelpline.com/countries/co" rel="noopener">source</a>). US: <a href="tel:988">988</a>. Anywhere else: <a href="https://findahelpline.com" rel="noopener">findahelpline.com</a>.',
      synth: "The voices in NAOS pieces are synthetic.", prev: "Previous version", follow: "Follow NAOS",
      title: "NAOS 4.0 · Choose friction.", houseLabel: "The five steps of the house", err: "The data did not load. Reload the page."
    },
    es: {
      names: { tenderness: "Ternura", emptiness: "Vacío", saturation: "Saturación", body: "Cuerpo", courtyard: "Patio" },
      subs: { tenderness: "sin pedir nada a cambio", emptiness: "menos de lo que necesitas", saturation: "más de lo que sostienes", body: "frío, aliento, peso", courtyard: "suelo común" },
      kicker: "NAOS 4.0 · LA CASA", bajada: "Más cerca de ti. Cada escalón abre su biblioteca.", aro: "el aliento cruza cada escalón",
      dias: "LUN MAR MIÉ JUE VIE SÁB DOM = cuándo llega cada puerta, nunca una tarea",
      notaEnl: "Las pastillas con contorno son herramientas cuyo hogar es otro escalón. Se muestran aquí porque la mesa también es suya.",
      tools: "Herramientas", topics: "Temas", tryThis: "Pruébalo", watch: "Ver", breathe: "Respira", today: "La puerta de hoy", up: "Arriba", down: "Abajo",
      latest: "Últimos Shorts", openStep: "Abrir el escalón", toolsN: function (n) { return n + (n === 1 ? " herramienta" : " herramientas"); },
      soon: "pronto", limit: "Límite", source: "Fuente", home: "Escalón hogar", house: "La casa", day: "Día",
      in: "INHALA", hold: "SOSTÉN", out: "EXHALA", close: "Cerrar", noteEn: "Los nombres de herramientas, temas y protocolos están en inglés por ahora.", skip: "Saltar al contenido", youtube: "YouTube", instagram: "Instagram",
      safety: "Siéntate primero. Nunca en el agua ni manejando. ¿Mareo? Para y respira como siempre. Una práctica pequeña, no consejo médico.",
      lang: "es", sec: "s", other: "English", otherHref: "../", legal: "Privacidad", terms: "Términos",
      help: 'Si esto te pesa, habla con alguien ahora. Colombia: <a href="tel:106">106</a>, línea nacional de salud mental, 24/7, o <a href="tel:123">123</a> si hay peligro inmediato (<a href="https://findahelpline.com/countries/co" rel="noopener">fuente</a>). EE. UU.: <a href="tel:988">988</a>. En cualquier otro lugar: <a href="https://findahelpline.com" rel="noopener">findahelpline.com</a>.',
      synth: "Las voces de las piezas de NAOS son sintéticas.", prev: "Versión anterior", follow: "Sigue a NAOS",
      title: "NAOS 4.0 · Choose friction.", houseLabel: "Los cinco escalones de la casa", err: "No cargaron los datos. Recarga la página."
    }
  };
  var L = T[LANG];
  var DIAS_ES = { MON: "LUN", TUE: "MAR", WED: "MIÉ", THU: "JUE", FRI: "VIE", SAT: "SÁB", SUN: "DOM" };

  var D = null, P = null, TD = {}, ENL = [];
  var root = document.getElementById("app");
  var ticker = null, lastRoute = null;

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nivel(id) { for (var i = 0; i < D.niveles.length; i++) if (D.niveles[i].id === id) return D.niveles[i]; return null; }
  function nTools(n) { var c = 0; n.puertas.forEach(function (p) { c += p.herramientas.length; }); return c; }
  function homeOf(toolId) {
    for (var i = 0; i < D.niveles.length; i++) for (var j = 0; j < D.niveles[i].puertas.length; j++) {
      var hs = D.niveles[i].puertas[j].herramientas;
      for (var k = 0; k < hs.length; k++) if (hs[k].id === toolId) return { nivel: D.niveles[i], herramienta: hs[k], puerta: D.niveles[i].puertas[j] };
    }
    return null;
  }
  function copy(k) { return L[k] != null ? L[k] : D.copy[k]; }

  /* ---------- Cella ---------- */
  function cella(b, ojos, s) {
    if (!window.NAOS_FIGURA) return "";
    return window.NAOS_FIGURA.cella(null, { estado: "humanity", b: b, p: { tx: "#0E1116", bg: "#F4F6F8" }, ojos: ojos || "dot", s: s || 1 });
  }
  function bResp(t) { return 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 8); }
  function fixSvg(el) { var s = el.querySelector("svg"); if (s) { s.removeAttribute("width"); s.removeAttribute("height"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false"); } }
  function paintCellas(t) {
    var els = document.querySelectorAll("[data-cella]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i], base = el.getAttribute("data-ojos") || "dot";
      var ojos = base;
      if (!REDUCE && base === "dot" && (t % 5.2) < 0.16) ojos = "closed";
      var b = REDUCE ? 0.5 : bResp(t);
      var key = ojos + ":" + b.toFixed(2);
      if (el._k === key) continue;
      el._k = key; el.innerHTML = cella(b, ojos, 1); fixSvg(el);
    }
  }
  function startTicker() {
    if (ticker) return;
    var t0 = performance.now(), last = 0;
    function f(now) {
      var t = (now - t0) / 1000;
      if (now - last > 40) { last = now; paintCellas(t); }
      if (!REDUCE) ticker = requestAnimationFrame(f);
    }
    paintCellas(0);
    if (!REDUCE) ticker = requestAnimationFrame(f); else ticker = -1;
  }
  function discoHtml(ojos, extra) { return '<div class="disco" ' + (extra || "") + '><span data-cella data-ojos="' + ojos + '" style="display:contents"></span></div>'; }

  /* ---------- día de Colombia ---------- */
  function diaHoy() {
    try {
      var w = new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", weekday: "short" }).format(new Date());
      return w.slice(0, 3).toUpperCase();
    } catch (e) { return DIAS_EN[(new Date().getDay() + 6) % 7]; }
  }
  function puertaHoy() {
    var d = diaHoy();
    for (var i = 0; i < D.niveles.length; i++) for (var j = 0; j < D.niveles[i].puertas.length; j++)
      if (D.niveles[i].puertas[j].dia === d) return { nivel: D.niveles[i], puerta: D.niveles[i].puertas[j], dia: d };
    return null;
  }

  /* ---------- Watch / últimos Shorts ---------- */
  function watchFor(toolId) {
    // Solo hay correspondencia fiable si la clave de enlaces.json termina en el id de la herramienta ("fecha|id").
    for (var i = 0; i < ENL.length; i++) if (ENL[i].slot === toolId) return ENL[i];
    return null;
  }
  function fmtFecha(k) {
    var p = k.split("-"), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12));
    try { return new Intl.DateTimeFormat(LANG === "es" ? "es-CO" : "en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(d).replace(".", ""); } catch (e) { return k; }
  }
  function cortosHtml() {
    if (!ENL.length) return "";
    var items = ENL.slice(0, 3).map(function (e) {
      return '<li class="corto"><span>' + esc(fmtFecha(e.fecha)) + '</span><a href="' + esc(e.yt) + '" rel="noopener" aria-label="' + esc(L.youtube + " " + fmtFecha(e.fecha)) + '">' + L.youtube + "</a>" +
        (e.ig ? '<a href="' + esc(e.ig) + '" rel="noopener" aria-label="' + esc(L.instagram + " " + fmtFecha(e.fecha)) + '">' + L.instagram + "</a>" : "") + "</li>";
    }).join("");
    return '<div class="cortos"><h3 class="k">' + L.latest + '</h3><ul class="lista" style="margin-top:12px">' + items + "</ul></div>";
  }

  /* ---------- piezas comunes ---------- */
  function top(extraK) {
    return '<div class="top"><a class="marca" href="#/" aria-label="NAOS, ' + esc(L.house) + '">NAOS</a>' + (extraK ? '<p class="k">' + extraK + "</p>" : "") + "</div>";
  }
  function pie() {
    var h = RAIZ;
    return '<footer class="pie"><div class="wrap">' +
      '<p class="seg">Choose friction.</p>' +
      '<p class="ayuda">' + L.help + "</p>" +
      '<p class="sint">' + L.synth + "</p>" +
      '<p class="links"><a href="' + h + 'privacidad.html">' + L.legal + '</a><a href="' + h + 'terminos.html">' + L.terms + '</a>' +
      '<a href="https://www.youtube.com/@Naos-v3" rel="noopener">YouTube</a><a href="https://www.instagram.com/naos.v3/" rel="noopener">Instagram</a>' +
      '<a id="lang-link" href="' + L.otherHref + '" hreflang="' + (LANG === "es" ? "en" : "es") + '" lang="' + (LANG === "es" ? "en" : "es") + '">' + L.other + "</a>" +
      '<a href="' + h + '">' + L.prev + "</a></p>" +
      "</div></footer>";
  }
  function enIngles() { return L.noteEn ? '<p class="en-ingles">' + esc(L.noteEn) + "</p>" : ""; }

  /* ---------- portada ---------- */
  function renderHome() {
    var hoy = puertaHoy(), cls = hoy ? "s-" + hoy.nivel.id : "";
    var bars = D.niveles.map(function (n) {
      var w = 0; // anchura en [0,1] relativa a ancho
      var a = (n.ancho - 0.68) / 0.32;
      return '<li style="--a:' + a.toFixed(3) + '"><a class="bar s-' + n.id + '" href="#/' + n.id + '"><span class="n">' + esc(L.names[n.id]) + '</span><span class="s">' + esc(L.subs[n.id]) + " · <b>" + L.toolsN(nTools(n)) + "</b></span></a></li>";
    }).join("");
    var hoyH = "";
    if (hoy) {
      var dn = LANG === "es" ? DIAS_ES[hoy.dia] : hoy.dia;
      hoyH = '<section class="hoy s-' + hoy.nivel.id + '" aria-labelledby="hoy-t"><p class="k">' + L.today + " · " + dn + '</p><h2 id="hoy-t">' + esc(hoy.puerta.nombre) + '</h2><p class="rot">' + esc(hoy.puerta.rotulo) + " · " + esc(L.names[hoy.nivel.id]) + '</p><a class="ir" href="#/' + hoy.nivel.id + '">' + L.openStep + "</a></section>";
    }
    root.className = "home " + cls;
    root.innerHTML = top() +
      '<main id="main" tabindex="-1"><div class="wrap">' +
      '<div class="hero"><p class="k kicker">' + esc(copy("kicker")) + "</p>" +
      '<div class="hero-fila"><div class="izq"><h1 id="h1" tabindex="-1">Choose <span class="pill">friction.</span></h1>' +
      '<p class="bajada">' + esc(copy("bajada")) + "</p></div>" +
      "<div>" + discoHtml("dot") + '<p class="aro-nota">' + esc(copy("aro")) + "</p></div></div></div>" +
      '<nav aria-label="' + esc(L.houseLabel) + '"><ol class="casa" style="margin-top:34px">' + bars + "</ol></nav>" +
      hoyH + '<p class="nota-dias">' + esc(copy("dias")) + "</p>" +
      "</div></main>" + pie();
    document.title = L.title;
  }

  /* ---------- escalón ---------- */
  function renderStep(id, toolId) {
    var n = nivel(id), i = ORDEN.indexOf(id), proto = P[id];
    var sel = toolId ? homeOf(toolId) : null;
    if (sel && sel.nivel.id !== id) sel = null;
    var selOut = null;
    if (toolId && !sel) {
      n.enlaces.forEach(function (e) { if (e.id === toolId) selOut = e; });
    }
    var nm = L.names[id];
    var protoH = '<section class="prueba" aria-labelledby="p-t"><h2 class="k" id="p-t">' + L.tryThis + '</h2><p class="t">' + esc(proto.titulo) + '</p><p class="conducta">' + esc(proto.conducta) + '</p><p class="dato">' + esc(proto.dato) + '</p><p class="fuente">' + L.source + ': <a href="' + esc(proto.url) + '" rel="noopener">' + esc(proto.fuente) + '</a></p><p class="limite"><span class="k">' + L.limit + "</span>" + esc(proto.limite) + "</p>" + enIngles() + "</section>";

    var selH = "";
    function panel(name, homeNivel) {
      var w = watchFor(toolId), hn = homeNivel;
      return '<div class="sel" id="sel" aria-live="polite"><p class="k">' + (homeNivel.id === id ? L.tools : L.home) + '</p><h3 id="sel-t" tabindex="-1"><span class="pill">' + esc(name) + "</span></h3>" +
        (homeNivel.id !== id ? '<p>' + esc(L.names[homeNivel.id]) + "</p>" : "") +
        (w ? '<a href="' + esc(w.yt) + '" rel="noopener">' + L.watch + "</a>" : "") +
        (homeNivel.id !== id ? '<a href="#/tool/' + esc(toolId) + '">' + L.openStep + " · " + esc(L.names[homeNivel.id]) + "</a>" : "") + "</div>";
    }
    if (sel) selH = panel(sel.herramienta.nombre, n);
    else if (selOut) selH = panel(selOut.herramienta, nivel(selOut.hogar));

    var puertas = n.puertas.map(function (p) {
      var dn = LANG === "es" ? DIAS_ES[p.dia] : p.dia;
      var chips = p.herramientas.map(function (h) {
        return '<li><a class="chip" href="#/tool/' + esc(h.id) + '"' + (toolId === h.id ? ' aria-current="true"' : "") + ">" + esc(h.nombre) + "</a></li>";
      }).join("");
      return '<div class="puerta"><h3>' + esc(p.nombre) + '</h3><p class="dia">' + L.day + " " + dn + " · " + esc(p.rotulo) + '</p><ul class="chips">' + chips + "</ul></div>";
    }).join("");
    var enl = "";
    if (n.enlaces.length) {
      enl = '<div class="puerta"><ul class="chips">' + n.enlaces.map(function (e) {
        return '<li><a class="chip fuera" href="#/tool/' + esc(e.id) + '"' + (toolId === e.id ? ' aria-current="true"' : "") + ">" + esc(e.herramienta) + "</a></li>";
      }).join("") + '</ul><p class="nota-enl">' + esc(copy("nota_enlaces")) + "</p></div>";
    }
    var herr = '<section class="herr" aria-labelledby="h-t"><h2 class="k" id="h-t">' + L.tools + "</h2>" + selH + puertas + enl + cortosHtml() + (LANG === "es" ? enIngles() : "") + "</section>";

    var temaPre = RAIZ + "temas/";
    var temas = n.temas.length ? '<section class="tem" aria-labelledby="t-t"><h2 class="k" id="t-t">' + L.topics + '</h2><ul class="temas">' + n.temas.map(function (t) {
      if (TD[t.slug]) return '<li><a class="tema" href="' + temaPre + esc(t.slug) + '/">' + esc(t.titulo) + "<span aria-hidden=\"true\">→</span></a></li>";
      return '<li><span class="tema">' + esc(t.titulo) + '<span class="soon">' + L.soon + "</span></span></li>";
    }).join("") + "</ul></section>" : "";

    function navB(j, lbl) {
      if (j < 0 || j >= ORDEN.length) return "";
      var o = ORDEN[j];
      return '<a class="nav-b s-' + o + '" style="--nc:var(--c);--non:var(--on)" href="#/' + o + '"><span class="k">' + lbl + '</span><span class="n">' + esc(L.names[o]) + "</span></a>";
    }
    var navs = '<nav class="navs" aria-label="' + esc(L.houseLabel) + '">' + (navB(i - 1, L.up) || '<a class="nav-b cas" href="#/"><span class="k">' + L.up + '</span><span class="n">' + L.house + "</span></a>") + (navB(i + 1, L.down) || '<a class="nav-b cas" href="#/"><span class="k">' + L.down + '</span><span class="n">' + L.house + "</span></a>") + "</nav>";

    root.className = "s-" + id;
    root.innerHTML = '<div class="band">' + top(esc(copy("kicker"))) + '<header class="wrap cab"><div><p class="k">NAOS 4.0 · ' + (i + 1) + "/5</p><h1 id=\"h1\" tabindex=\"-1\">" + esc(nm) + '</h1><p class="sub" style="margin-top:16px"><span class="pill">' + esc(L.subs[id]) + "</span></p></div>" + discoHtml(OJOS[id]) + "</header></div>" +
      '<main id="main" class="cuerpo" tabindex="-1"><div class="wrap">' + protoH + herr + temas + navs + "</div></main>" + pie();
    document.title = nm + " · NAOS 4.0";
    return { panel: !!(sel || selOut) };
  }

  /* ---------- router ---------- */
  function parse() {
    var h = location.hash.replace(/^#\/?/, "").replace(/\/+$/, "");
    var parts = h.split("/");
    return { a: parts[0] || "", b: parts.slice(1).join("/") };
  }
  function route() {
    if (!D) return;
    var r = parse();
    if (VIEJAS[r.a]) { history.replaceState(null, "", "#/" + VIEJAS[r.a]); r = parse(); }
    var info = { panel: false }, key;
    if (r.a === "tool" && r.b) {
      var hm = homeOf(r.b), out = null;
      D.niveles.forEach(function (n) { n.enlaces.forEach(function (e) { if (e.id === r.b) out = e; }); });
      if (hm) { info = renderStep(hm.nivel.id, r.b); key = "tool"; }
      else { history.replaceState(null, "", "#/"); renderHome(); key = "home"; }
    } else if (ORDEN.indexOf(r.a) >= 0) { info = renderStep(r.a, null); key = r.a; }
    else { if (r.a) history.replaceState(null, "", "#/"); renderHome(); key = "home"; }
    var ll = document.getElementById("lang-link");
    if (ll) ll.setAttribute("href", L.otherHref + location.hash);
    startTicker(); paintCellas(0);
    var el = info.panel ? document.getElementById("sel-t") : document.getElementById("h1");
    if (info.panel) { var s = document.getElementById("sel"); if (s) s.scrollIntoView({ block: "start" }); }
    else window.scrollTo(0, 0);
    if (lastRoute !== null && el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
    lastRoute = key;
    document.body.setAttribute("data-route", location.hash || "#/");
  }

  /* ---------- capa de respirar ---------- */
  var aro = { open: false, timer: null, raf: null, t0: 0, ret: null };
  function aroEl() { return document.getElementById("aro"); }
  function stepCls() { var r = parse(), id = r.a; if (r.a === "tool") { var h = homeOf(r.b); id = h ? h.nivel.id : ""; } return ORDEN.indexOf(id) >= 0 ? id : "body"; }
  function buildAro() {
    var el = aroEl();
    el.innerHTML = '<div class="aro-top"><p class="k">' + L.breathe + ' · 4 · 4 · 6</p><button type="button" class="aro-cerrar" id="aro-x">' + L.close + '</button></div>' +
      '<div class="aro-centro"><div class="aro-escena"><svg class="anillo" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".55"/><circle id="aro-pt" cx="50" cy="2" r="3.6" fill="#0E1116" style="display:none"/></svg><div class="aro-disco" id="aro-disco"><span id="aro-c" style="display:contents"></span></div></div>' +
      '<p class="aro-pal" id="aro-pal" aria-live="polite"></p><p class="aro-n" id="aro-n" aria-hidden="true"></p></div>' +
      '<p class="aro-seg">' + esc(L.safety || P.body.limite) + "</p>";
    document.getElementById("aro-x").addEventListener("click", closeAro);
  }
  function openAro() {
    var el = aroEl();
    if (aro.open) return;
    aro.open = true; aro.ret = document.activeElement;
    var id = stepCls();
    el.className = "aro s-" + id; el.style.setProperty("color", ON[id]);
    buildAro(); el.setAttribute("data-open", "1");
    document.body.style.overflow = "hidden";
    document.getElementById("aro-x").focus();
    var seq = (P.body.respira || [4, 4, 6]), tot = seq[0] + seq[1] + seq[2];
    var phase = -1, sec = -1;
    aro.t0 = performance.now();
    var names = [L.in, L.hold, L.out];
    var pal = document.getElementById("aro-pal"), num = document.getElementById("aro-n"), disc = document.getElementById("aro-disco"), pt = document.getElementById("aro-pt"), cc = document.getElementById("aro-c");
    function paint(c, ojos) { cc.innerHTML = cella(c, ojos, 1); fixSvg(cc); }
    function frame(now) {
      if (!aro.open) return;
      var t = ((now - aro.t0) / 1000) % tot, ph = t < seq[0] ? 0 : t < seq[0] + seq[1] ? 1 : 2;
      var st = ph === 0 ? t : ph === 1 ? t - seq[0] : t - seq[0] - seq[1], len = seq[ph];
      var s = Math.min(len, Math.floor(st) + 1);
      if (ph !== phase) {
        phase = ph; pal.innerHTML = '<span class="pill">' + names[ph] + "</span>";
        pt.style.display = ph === 1 && !REDUCE ? "" : "none";
        if (REDUCE) paint(0.5, ph === 2 ? "closed" : ph === 1 ? "flat" : "dot");
      }
      if (s !== sec || ph !== phase) { }
      num.textContent = s;
      if (!REDUCE) {
        var e = ph === 0 ? st / len : ph === 1 ? 1 : 1 - st / len;
        disc.style.setProperty("--e", (0.62 + 0.38 * ease(e)).toFixed(3));
        if (ph === 1) { var ang = (st / len) * 2 * Math.PI; pt.setAttribute("cx", (50 + 48 * Math.sin(ang)).toFixed(2)); pt.setAttribute("cy", (50 - 48 * Math.cos(ang)).toFixed(2)); }
        paint(ph === 2 ? 0 : ease(e), ph === 2 ? "closed" : ph === 1 ? "flat" : "dot");
      } else disc.style.setProperty("--e", "1");
      aro.raf = requestAnimationFrame(frame);
    }
    function ease(x) { return 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x))); }
    if (REDUCE) {
      // sin animación: solo cambia el texto, una vez por segundo
      aro.timer = setInterval(function () { frame(performance.now()); }, 250);
      frame(performance.now());
      aro.raf = null;
    } else aro.raf = requestAnimationFrame(frame);
  }
  function closeAro() {
    if (!aro.open) return;
    aro.open = false;
    if (aro.raf) cancelAnimationFrame(aro.raf); if (aro.timer) clearInterval(aro.timer);
    aro.raf = aro.timer = null;
    var el = aroEl(); el.removeAttribute("data-open"); el.innerHTML = "";
    document.body.style.overflow = "";
    if (aro.ret && aro.ret.focus) aro.ret.focus();
  }
  function trap(e) {
    if (!aro.open) return;
    if (e.key === "Escape") { e.preventDefault(); closeAro(); }
    else if (e.key === "Tab") { e.preventDefault(); document.getElementById("aro-x").focus(); }
  }

  /* ---------- arranque ---------- */
  function j(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
  var btn = document.getElementById("btn-aro");
  btn.querySelector("span").textContent = L.breathe;
  btn.addEventListener("click", openAro);
  document.addEventListener("keydown", trap);
  document.querySelector(".skip").textContent = L.skip;
  document.querySelector(".skip").addEventListener("click", function (e) { e.preventDefault(); var m = document.getElementById("main"); if (m) m.focus(); });

  Promise.all([
    j(B + "data/niveles.json"), j(B + "data/protocolos.json"),
    j(B + "data/temas-disponibles.json").catch(function () { return { temas: {} }; }),
    j(RAIZ + "data/enlaces.json").catch(function () { return { piezas: {} }; })
  ]).then(function (r) {
    D = r[0]; P = r[1]; TD = r[2].temas || {};
    var pz = r[3].piezas || {};
    ENL = Object.keys(pz).map(function (k) {
      var q = k.split("|");
      return { fecha: q[0], slot: q[1], yt: pz[k].yt, ig: pz[k].ig, pub: pz[k].publicado_utc || q[0] };
    }).filter(function (e) { return e.yt; }).sort(function (a, b) { return a.pub < b.pub ? 1 : -1; });
    window.addEventListener("hashchange", route);
    route();
  }).catch(function () { root.innerHTML = '<p class="wrap" style="padding-top:40px">' + L.err + "</p>"; });
})();
