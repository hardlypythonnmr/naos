/* base.js · núcleo del prototipo Taller: idioma, parámetros, almacén (todo en try/catch), fechas, eventos, Cella, siluetas, hoja y enrutador por ancla.
   Sin librerías, sin red. Necesita datos.js, textos.js y (de la página) assets/js/figura.js (NAOS_FIGURA, sin editar). */
(function () {
  "use strict";
  var D = window.TALLER_DATOS, TT = window.TALLER_T, F = window.NAOS_FIGURA;
  var N = (window.TALLER = {});
  var LANG = document.documentElement.lang === "es" ? "es" : "en";
  var ROOT = LANG === "es" ? "../../../" : "../../";            // raíz del sitio V3 desde esta página
  var params = new URLSearchParams(location.search);
  var FASE = params.get("fase") === "1", DEV = params.get("dev") === "1";
  var OPACA = (params.get("opaca") || "").split(",").filter(Boolean);
  var RM = function () { return params.has("quieto") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); };
  if (params.has("quieto")) document.documentElement.classList.add("quieto");

  // ?lang= cambia de archivo (EN en la raíz del prototipo, ES en es/) y conserva lo demás
  (function () {
    var q = params.get("lang");
    if ((q === "es" || q === "en") && q !== LANG) {
      var p = new URLSearchParams(location.search); p.delete("lang"); var s = p.toString();
      location.replace((q === "es" ? "es/index.html" : "../index.html") + (s ? "?" + s : "") + location.hash);
    }
  })();

  N.LANG = LANG; N.ROOT = ROOT; N.params = params; N.FASE = FASE; N.DEV = DEV; N.OPACA = OPACA; N.D = D; N.F = F; N.RM = RM;
  N.opaca = function (k) { return OPACA.indexOf(k) >= 0; };

  /* ---------- textos ---------- */
  N.t = function (k, v) {
    var o = TT[k], s = o ? (o[LANG] != null ? o[LANG] : o.en) : k;
    if (v) for (var x in v) s = s.split("{" + x + "}").join(v[x]);
    return s;
  };
  N.L = function (o) { return o ? (o[LANG] != null ? o[LANG] : o.en) : ""; };
  N.lc = function (s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; };
  N.uc = function (s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };

  /* ---------- DOM ---------- */
  function h(tag, attrs) {
    var e = document.createElement(tag), i, k, v;
    if (attrs) for (k in attrs) {
      v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") e.addEventListener(k.slice(2), v);
      else if (k === "html") e.innerHTML = v;
      else if (v === true) e.setAttribute(k, "");
      else e.setAttribute(k, v);
    }
    for (i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { add(e, x); });
    else e.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  N.h = h;
  N.pon = function (el) { el.textContent = ""; for (var i = 1; i < arguments.length; i++) add(el, arguments[i]); return el; };   // vacía y llena; salta null y aplana arreglos

  /* ---------- almacén (clave naos-proto-v1; sin almacenamiento la app funciona sin recordar) ---------- */
  var KEY = "naos-proto-v1", DEVKEY = "naos-proto-dev", mem = null;
  N.almacenOk = true;
  function vacio() {
    return { v: 1, idioma: LANG, reglas: {}, historial: [], recuerdos: [], sonido: { ofrecido: false, activo: false },
      ayudas: { cella: true, sonido: true, anillo: true, tarjeta: true }, sin_ayudas: false, no_contar: false,
      obstrucciones: { hechas: 0, ultima: null, planB: null }, ritmo: "parejo", actual: null, ultima_visita: null, ultimo_abre: null };
  }
  function mezcla(a, b) { for (var k in b) { if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a[k] && typeof a[k] === "object") mezcla(a[k], b[k]); else a[k] = b[k]; } return a; }
  function st() {
    if (mem) return mem;
    try { var s = localStorage.getItem(KEY); mem = s ? mezcla(vacio(), JSON.parse(s)) : vacio(); }
    catch (e) { N.almacenOk = false; mem = vacio(); }
    return mem;
  }
  N.st = st;
  N.guardar = function () { try { localStorage.setItem(KEY, JSON.stringify(st())); } catch (e) { N.almacenOk = false; } };
  N.borrarTodo = function () { mem = vacio(); try { localStorage.removeItem(KEY); } catch (e) { N.almacenOk = false; } };
  function devLeer() { try { return JSON.parse(localStorage.getItem(DEVKEY) || "{}"); } catch (e) { return {}; } }
  function devEscribir(o) { try { localStorage.setItem(DEVKEY, JSON.stringify(o)); } catch (e) {} }
  N.devLeer = devLeer; N.devEscribir = devEscribir;
  N.S = function (id) { var s = st(); return s.reglas[id] || (s.reglas[id] = {}); };

  /* ---------- reglas ---------- */
  var mapaR = {}; D.reglas.forEach(function (r) { mapaR[r.id] = r; });
  N.R = function (id) { return mapaR[id]; };
  N.reglas = D.reglas;
  var mapaO = {}; D.obstrucciones.forEach(function (o) { mapaO[o.id] = o; });
  N.O = function (id) { return mapaO[id]; };

  /* ---------- fechas (día de Colombia, UTC-5; fecha simulada) ---------- */
  var DIAS = { en: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], es: ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] };
  var MESES = { en: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], es: ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"] };
  function aDate(s) { var p = s.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function aStr(d) { return d.toISOString().slice(0, 10); }
  N.sumar = function (s, n) { var d = aDate(s); d.setUTCDate(d.getUTCDate() + n); return aStr(d); };
  N.entre = function (a, b) { return Math.round((aDate(b) - aDate(a)) / 864e5); };
  N.hoy = function () {
    var q = params.get("hoy"); if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
    var dv = devLeer(); if (dv.fecha) return dv.fecha;
    var real = aStr(new Date(Date.now() - 5 * 3600e3));
    return (real >= "2026-11-02" && real <= "2026-11-15") ? real : "2026-11-05";
  };
  N.hoyEsReal = function () { var real = aStr(new Date(Date.now() - 5 * 3600e3)); return N.hoy() === real; };
  N.rotulo = function (s) {
    var d = aDate(s), dow = DIAS[LANG][d.getUTCDay()], m = MESES[LANG][d.getUTCMonth()], n = d.getUTCDate();
    return LANG === "es" ? dow + " · " + n + " " + m : dow + " · " + m + " " + n;
  };
  N.reglaDeHoy = function (s) {
    var rot = D.rotacion;
    if (rot.dias[s]) return rot.dias[s];
    var best = null; Object.keys(rot.semana).sort().forEach(function (k) { if (k <= s) best = rot.semana[k]; });
    return best || "breathe";
  };
  N.diaN = function (s) { return Math.round(aDate(s) / 864e5); };

  /* ---------- eventos (lista cerrada; en el prototipo no salen del teléfono) ---------- */
  N.eventos = [];
  N.ev = function (nombre, datos) {
    var e = { n: nombre, d: datos || {}, t: new Date().toTimeString().slice(0, 8), nota: "" }, s = st();
    if (nombre === "abre") {
      if (s.no_contar) e.nota = "no contado (No contar mi visita)";
      else if (s.ultimo_abre === N.hoy()) e.nota = "ya enviado hoy";
      else { s.ultimo_abre = N.hoy(); N.guardar(); }
    } else if (s.no_contar) e.nota = "no contado (No contar mi visita)";
    N.eventos.push(e);
    if (N.onEvento) N.onEvento(e);
  };
  N.regreso = function () {
    var s = st(), u = s.ultima_visita; if (!u) return "0";
    var n = N.entre(u, N.hoy()); return n <= 0 ? "0" : n <= 2 ? "1-2" : n <= 7 ? "3-7" : "8+";
  };

  /* ---------- la hora: "8:30", "a las 7", "at 6pm", "por la mañana" (cuando.mjs, 6.3 de la propuesta) ---------- */
  var HORA = [/\b\d{1,2}:\d{2}\b/, /\b(at|around|by)\s+\d{1,2}\b/i, /\ba\s+las?\s+\d{1,2}\b/i, /\b\d{1,2}\s?(a\.?m\.?|p\.?m\.?)(?![a-z])/i,
    /\b(in the|every|each)\s+(morning|afternoon|evening)\b/i, /\bat\s+(night|noon|midnight)\b/i, /\bo'?clock\b/i, /\b(noon|midnight)\b/i,
    /\b(por|en|de|a)\s+la\s+(mañana|tarde|noche)\b/i, /\b(mediod[ií]a|medianoche|en\s+punto)\b/i, /\bantes\s+de\s+las?\s+\d/i, /\bdespu[eé]s\s+de\s+las?\s+\d/i];
  N.esHora = function (txt) { return HORA.some(function (re) { return re.test(txt || ""); }); };

  /* ---------- sonido ---------- */
  var ac = null;
  N.audioIniciar = function () {
    try {
      if (navigator.audioSession) navigator.audioSession.type = "playback";
      var C = window.AudioContext || window.webkitAudioContext;
      if (C) { ac = ac || new C(); if (ac.state === "suspended") ac.resume(); }
    } catch (e) { ac = null; }
  };
  N.tono = function (hz) {
    if (!ac) return;
    try {
      var o = ac.createOscillator(), g = ac.createGain(), n = ac.currentTime;
      o.type = "sine"; o.frequency.value = hz;
      g.gain.setValueAtTime(0.0001, n); g.gain.linearRampToValueAtTime(0.16, n + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.14);
      o.connect(g); g.connect(ac.destination); o.start(n); o.stop(n + 0.16);
    } catch (e) {}
  };
  N.sonidoActivo = function () { var s = st(); return !!(s.sonido.activo && s.ayudas.sonido && !s.sin_ayudas); };

  /* ---------- tema de color por regla (campo y tinta de la puerta) ---------- */
  N.tema = function (r) {
    var rs = document.documentElement.style;
    var campo = r ? r.campo : "#FFFFFF", tinta = r ? r.tinta : "#0E1116";
    rs.setProperty("--campo", campo); rs.setProperty("--tinta", tinta);
    N.colores = { campo: campo, tinta: tinta };
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", campo);
  };
  N.colores = { campo: "#FFFFFF", tinta: "#0E1116" };

  /* ---------- región viva ---------- */
  N.vivo = function (txt) {
    var e = document.getElementById("vivo"); if (!e) return;
    e.textContent = ""; setTimeout(function () { e.textContent = txt; }, 30);
  };

  /* ---------- siluetas de objeto (tinta plana, sin degradado) ---------- */
  var OBJ = {
    olla: { w: 300, h: 150, d: '<rect x="20" y="64" width="92" height="64" rx="8"/><rect x="12" y="50" width="108" height="12" rx="6"/><circle cx="66" cy="42" r="7"/><rect x="2" y="74" width="16" height="9" rx="4"/><rect x="114" y="74" width="16" height="9" rx="4"/>' +
      '<rect x="196" y="22" width="9" height="70" rx="3"/><rect x="196" y="86" width="64" height="11" rx="3"/><rect x="198" y="96" width="8" height="40" rx="2"/><rect x="252" y="96" width="8" height="40" rx="2"/>' },
    telefono: { w: 120, h: 160, d: '<path fill-rule="evenodd" d="M30 8h60a14 14 0 0 1 14 14v116a14 14 0 0 1-14 14H30a14 14 0 0 1-14-14V22A14 14 0 0 1 30 8zm4 12a6 6 0 0 0-6 6v104a6 6 0 0 0 6 6h52a6 6 0 0 0 6-6V26a6 6 0 0 0-6-6z"/><rect x="48" y="132" width="24" height="5" rx="2.5"/>' },
    lampara: { w: 140, h: 160, d: '<path d="M44 20h52l16 52H28z"/><rect x="66" y="72" width="8" height="64" rx="3"/><rect x="40" y="134" width="60" height="10" rx="5"/>' },
    ventana: { w: 150, h: 150, d: '<path fill-rule="evenodd" d="M20 14h110v110H20zm10 10v39h40V24zm50 0v39h40V24zM30 73v41h40V73zm50 0v41h40V73z"/><rect x="10" y="126" width="130" height="10" rx="3"/>' },
    plato: { w: 160, h: 130, d: '<path fill-rule="evenodd" d="M80 10a56 56 0 1 0 .01 0zm0 12a44 44 0 1 1-.01 0z"/><circle cx="80" cy="66" r="26"/>' }
  };
  N.objeto = function (nombre) {
    var o = OBJ[nombre] || OBJ.ventana;
    return h("span", { class: "objeto", "aria-hidden": "true", html: '<svg viewBox="0 0 ' + o.w + " " + o.h + '" width="' + o.w + '" height="' + o.h + '" fill="currentColor" focusable="false">' + o.d + "</svg>" });
  };

  /* ---------- Cella (figura.js sin editar; un solo estado: respira, D-263) ---------- */
  var cellas = [], pausada = false, raf = 0, ultimo = 0, botonesPausa = [];
  function pintarCella(c, u) {
    var o = { estado: "humanity", p: { tx: N.colores.tinta, bg: N.colores.campo }, s: c.px / 132, fase: 4, id: c.id };
    if (u == null) o.b = 0.35; else o.u = u;
    var svg = F.cella(o).replace(/width="[^"]*" height="[^"]*" viewBox="0 0 240 240"/, 'width="' + c.px + '" height="' + Math.round(c.px * 168 / 132) + '" viewBox="54 58 132 168" focusable="false"');
    c.el.innerHTML = svg;
  }
  N.cella = function (px, extra) {
    var c = { px: px || 96, el: h("span", { class: "cella " + (extra || ""), "aria-hidden": "true" }), id: "c" + cellas.length + "_" + Math.floor(Math.random() * 1e5) };
    cellas.push(c); pintarCella(c, RM() || pausada ? null : performance.now() / 1000);
    arrancaCellas();
    return c.el;
  };
  function arrancaCellas() {
    if (raf || RM()) return;
    raf = requestAnimationFrame(function paso(ts) {
      raf = 0;
      cellas = cellas.filter(function (c) { return document.body.contains(c.el); });
      if (!cellas.length || RM() || pausada || document.hidden) { if (cellas.length && !RM() && !pausada) raf = requestAnimationFrame(paso); return; }
      if (ts - ultimo > 40) { ultimo = ts; var u = performance.now() / 1000; cellas.forEach(function (c) { pintarCella(c, u); }); }
      raf = requestAnimationFrame(paso);
    });
  }
  N.pausarCella = function (v) {
    pausada = v == null ? !pausada : v;
    botonesPausa.forEach(function (b) { if (document.body.contains(b)) b.setAttribute("aria-pressed", String(pausada)); });
    cellas.forEach(function (c) { pintarCella(c, pausada ? null : performance.now() / 1000); });
    if (!pausada) arrancaCellas();
  };
  N.botonPausa = function () {
    if (RM()) return null;                       // con movimiento reducido nada se mueve: no hace falta botón
    var b = h("button", { type: "button", class: "enlace", "aria-pressed": String(pausada), onclick: function () { N.pausarCella(); } }, N.t("pausa_cella"));
    botonesPausa.push(b); return b;
  };
  N.cellaMover = function (el, dy) { el.style.transform = dy ? "translateY(" + dy.toFixed(1) + "px)" : ""; };

  /* ---------- hoja inferior (diálogo) ---------- */
  N.hoja = function (titulo, contenido, opts) {
    opts = opts || {};
    var previo = document.activeElement, id = "hoja" + Math.floor(Math.random() * 1e6);
    var velo = h("div", { class: "velo" });
    var cierre = h("button", { type: "button", class: "enlace cierra", "aria-label": N.t("cerrar") }, N.t("cerrar"));
    var caja = h("div", { class: "hoja", role: "dialog", "aria-modal": "true", "aria-labelledby": id, tabindex: "-1" },
      h("div", { class: "hoja-cab" }, h("h2", { id: id }, titulo), cierre), h("div", { class: "hoja-cuerpo" }, contenido));
    var raiz = h("div", { class: "hoja-raiz" }, velo, caja);
    function salir() {
      document.removeEventListener("keydown", tecla, true); raiz.remove();
      document.body.classList.remove("con-hoja");
      if (previo && document.body.contains(previo)) previo.focus();
      if (opts.alCerrar) opts.alCerrar();
    }
    function tecla(e) {
      if (e.key === "Escape") { e.preventDefault(); salir(); return; }
      if (e.key !== "Tab") return;
      var f = [].slice.call(caja.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      else if (!caja.contains(document.activeElement)) { e.preventDefault(); a.focus(); }
    }
    velo.addEventListener("click", salir); cierre.addEventListener("click", salir);
    document.addEventListener("keydown", tecla, true);
    document.body.appendChild(raiz); document.body.classList.add("con-hoja");
    caja.focus();
    return { cerrar: salir, caja: caja };
  };

  /* ---------- marco de pantalla: barra, puntos y pie ---------- */
  N.barra = function (opts) {
    opts = opts || {};
    var izq = opts.sinHoy ? h("span") : h("a", { class: "enlace", href: "#hoy" }, N.t("hoy_regla"));
    var der = h("span", { class: "barra-der" }, N.botonPausa(), h("a", { class: "enlace", href: "#ajustes" }, N.t("ajustes")));
    return h("nav", { class: "barra", "aria-label": LANG === "es" ? "Navegación" : "Navigation" }, izq, der);
  };
  N.puntos = function (n, total) {
    var ps = []; for (var i = 1; i <= total; i++) ps.push(h("span", { class: "punto" + (i === n ? " act" : "") }));
    return h("div", { class: "puntos", role: "img", "aria-label": N.t("paso_de", { n: n }) }, ps);
  };
  N.pie = function () {
    function href(l) {
      var p = new URLSearchParams(location.search); p.delete("lang"); var qs = p.toString() ? "?" + p.toString() : "";
      var base = l === "en" ? (LANG === "en" ? "index.html" : "../index.html") : (LANG === "en" ? "es/index.html" : "index.html");
      return base + qs + location.hash;
    }
    var aEn = h("a", { class: "enlace", href: href("en"), lang: "en", "aria-current": LANG === "en" ? "true" : null }, "EN");
    var aEs = h("a", { class: "enlace", href: href("es"), lang: "es", "aria-current": LANG === "es" ? "true" : null }, "ES");
    [aEn, aEs].forEach(function (a) { a.addEventListener("click", function () { a.setAttribute("href", href(a.getAttribute("lang"))); }); });
    var langs = h("span", { class: "idiomas" }, aEn, h("span", { "aria-hidden": "true" }, " / "), aEs);
    return h("footer", { class: "pie" }, langs, h("a", { class: "enlace", href: "#como" }, N.t("como_link")), h("a", { class: "enlace", href: "#mapa" }, N.t("mapa_link")));
  };
  N.pantalla = function (clase, hijos, opts) {
    opts = opts || {};
    var el = h("section", { class: "pantalla " + (clase || "") }, N.barra(opts), hijos, opts.sinPie ? null : N.pie());
    return el;
  };

  /* ---------- enrutador por ancla ---------- */
  var rutas = {}, ctx = { regla: null, tamano: null, despues: null, descanso: false }, limpiezas = [];
  N.ctx = ctx;
  N.ruta = function (id, fn) { rutas[id] = fn; };
  N.alSalir = function (fn) { limpiezas.push(fn); };
  N.parse = function () { var s = location.hash.replace(/^#/, ""), p = s.split("/"); return { id: p[0], arg: p.slice(1).join("/") }; };
  N.ir = function (hash) { if (location.hash === "#" + hash) N.render(); else location.hash = hash; };
  N.reglaActiva = function () {
    var pu = params.get("puerta"), id = ctx.regla || (pu && mapaR[pu] ? pu : null) || st().actual || N.reglaDeHoy(N.hoy()); ctx.regla = id; return id;
  };
  var ultimoId = null;
  N.render = function () {
    var r = N.parse(), app = document.getElementById("app");
    limpiezas.splice(0).forEach(function (f) { try { f(); } catch (e) {} });
    if (!r.id) { var e = N.entrada(); history.replaceState(null, "", location.pathname + location.search + "#" + e); r = N.parse(); }
    var fn = rutas[r.id] || rutas.hoy;
    var nodo = fn(r.arg);
    if (!nodo) return;
    nodo.classList.add("entra");
    app.replaceChildren(nodo);
    document.body.dataset.pantalla = r.id;
    window.scrollTo(0, 0);
    var foco = nodo.querySelector("h1") || nodo;
    if (!foco.hasAttribute("tabindex")) foco.setAttribute("tabindex", "-1");
    try { foco.focus({ preventScroll: true }); } catch (e2) {}
    document.title = "NAOS · " + (nodo.dataset.titulo || "Taller") + " (prototype)";
    ultimoId = r.id;
    if (N.dev) N.dev.refrescar();
  };
  window.addEventListener("hashchange", function () { N.render(); });
})();
