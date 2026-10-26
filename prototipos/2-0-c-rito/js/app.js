/* app.js · prototipo Rito (C), NAOS 2.0. "Volver es el acto, y se hace con otros". Una sola página, sin red y sin librerías; el DOM se arma con nodos y textContent.
   Estado local: una clave, naos-rito-v1, siempre dentro de try/catch (si falla, la app funciona sin memoria). Lo que escribe la persona en el campo de la línea
   nunca se guarda ni sale: se borra al cerrar. Los eventos del contador se muestran en el panel ?dev=1 y no salen. */
(function () {
  "use strict";
  var R = window.RITO, TX = window.TXT, EMP = window.EMP;
  var DOC = document, HTML = DOC.documentElement;
  var LANG = HTML.getAttribute("lang") === "es" ? "es" : "en", T = TX[LANG];
  var Q = new URLSearchParams(location.search);

  /* ---- la lengua se cambia con ?lang= (la otra página lleva el mismo recorrido) ---- */
  var ql = Q.get("lang");
  if ((ql === "es" || ql === "en") && ql !== LANG) {
    Q.delete("lang");
    location.replace(HTML.getAttribute("data-otra") + (Q.toString() ? "?" + Q.toString() : "") + location.hash);
    return;
  }

  function t(k, v) {
    var s = T[k];
    if (s == null) { if (window.console) console.warn("falta texto: " + k); return k; }
    if (typeof s === "string" && v) s = s.replace(/\{(\w+)\}/g, function (m, n) { return v[n] != null ? v[n] : m; });
    return s;
  }

  /* ---- DOM por nodos ---- */
  function h(tag, a) {
    var e = DOC.createElement(tag), i;
    if (a) for (var k in a) {
      var v = a[k];
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(e, x); }); return; }
    e.appendChild(typeof c === "string" ? DOC.createTextNode(c) : c);
  }
  function svg(str) {
    var d = new DOMParser().parseFromString(str, "image/svg+xml");
    return DOC.importNode(d.documentElement, true);
  }

  /* ---- estado local ---- */
  var KEY = "naos-rito-v1", memoriaOk = true;
  function porDefecto() {
    return { v: 1, ult: null, hechas: {}, dias: [], cita: null, orden: null, objeto: true, sonido: false, motivo: null, enviar: true, sinhuella: false,
      cuandos: [], vis: false, ayuda: false, citaOfrecida: false, vista: true, verTodos: false, obst: null, min: false, sirvio: null };
  }
  function leer() {
    try { var s = window.localStorage.getItem(KEY); if (s) { var o = JSON.parse(s); if (o && o.v === 1) return o; } } catch (e) { memoriaOk = false; }
    return null;
  }
  var ST = Object.assign(porDefecto(), leer() || {});
  function guardar() { try { window.localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { memoriaOk = false; } }
  function borrarTodo() { try { window.localStorage.removeItem(KEY); } catch (e) { memoriaOk = false; } ST = porDefecto(); }

  /* ---- parámetros simulados ---- */
  var PUERTA = R.puertas[Q.get("puerta")] ? Q.get("puerta") : ((ST.ult && R.puertas[ST.ult.puerta]) ? ST.ult.puerta : "community");
  var QUIETO = Q.has("quieto") || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (Q.has("quieto")) HTML.classList.add("quieto");
  var DEV = Q.get("dev") === "1";

  function ahora() {
    var d = new Date(), hr = Q.get("hora");
    if (hr && /^\d{4}$/.test(hr)) { var hh = +hr.slice(0, 2), mm = +hr.slice(2); if (hh < 24 && mm < 60) d.setHours(hh, mm, 0, 0); }
    return d;
  }
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  function hoyISO(d) { return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function isoLocal(d) { return hoyISO(d) + "T" + p2(d.getHours()) + ":" + p2(d.getMinutes()); }
  function fh(d, conSufijo) {
    var hr = d.getHours(), m = d.getMinutes(), s = hr >= 12 ? t("pm") : t("am"), h12 = hr % 12 || 12;
    return h12 + ":" + p2(m) + (conSufijo === false ? "" : " " + s);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function diaHora(d) { return cap(t("dias")[d.getDay()]) + ", " + fh(d, false) + "."; }
  function fmtLargo(iso) { var d = new Date(iso); return { d: t("dias")[d.getDay()], h: fh(d) }; }
  function fmtProp(iso) { var d = new Date(iso); return t("diasCortos")[d.getDay()] + " " + fh(d); }
  function esNoche() { var hr = ahora().getHours(); return hr >= 20 || hr < 6; }
  function hueco() {
    var g = Q.get("hueco");
    if (g !== null && /^\d{1,3}$/.test(g)) return +g;
    if (!ST.ult) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(ST.ult.t).getTime()) / 864e5));
  }
  function hechoHoy() { return ST.dias.indexOf(hoyISO(ahora())) >= 0; }
  function citaCercana() {
    if (Q.get("cerca") === "1") return true;
    if (!ST.cita) return false;
    var d = ahora();
    if (d.getDay() !== ST.cita.dow) return false;
    return Math.abs((d.getHours() * 60 + d.getMinutes()) - (ST.cita.hh * 60 + ST.cita.mm)) <= 30;
  }
  function primeraVisita() { return Q.get("primera") === "1" || (!ST.vis && Q.get("hueco") === null); }

  /* ---- la luna del día: aproximación del prototipo (en la web real son las fechas de USNO) ---- */
  function luna(d) {
    var SIN = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14), edad = (((d.getTime() - ref) / 864e5) % SIN + SIN) % SIN, f = edad / SIN;
    var k = (1 - Math.cos(2 * Math.PI * f)) / 2, idx = Math.floor(((f * 8) + 0.5) % 8);
    var r = 9, cx = 10, cy = 10, rx = r * Math.abs(1 - 2 * k), sw = k < 0.5 ? 0 : 1;
    var lit = "M" + cx + " " + (cy - r) + " A" + r + " " + r + " 0 0 1 " + cx + " " + (cy + r) + " A" + rx.toFixed(2) + " " + r + " 0 0 " + sw + " " + cx + " " + (cy - r) + " Z";
    var g = f < 0.5 ? "" : ' transform="translate(20 0) scale(-1 1)"';
    var s = svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="' + lit + '" fill="currentColor"' + g + '/></svg>');
    return { svg: s, texto: t("fases")[idx] + " · " + d.getDate() + " " + t("meses")[d.getMonth()] };
  }
  function bloqueLuna() { var l = luna(ahora()); return h("p", { class: "fecha" }, l.svg, h("span", { text: l.texto })); }

  /* ---- dibujos: Cella (cuerpo de assets/marca/cella.svg y brazo de D-275), taza, puerta ---- */
  var cid = 0, ARM = "M-11 0 L-9 100 A9 9 0 0 0 9 100 L11 0 A11 11 0 0 0 -11 0 Z";
  function cella(o) {
    o = o || {}; cid++;
    var id = "cm" + cid, ang = Math.min(66, o.brazo || 0), lado = o.lado || "der", piv = lado === "izq" ? [77, 96] : [163, 96], giro = lado === "izq" ? ang : -ang;
    var cerr = '<g class="' + (o.ojos === "anim" ? "ojos-c" : "") + '"' + (o.ojos === "abiertos" ? ' style="display:none"' : "") + '><path d="M84.20 107.00 Q92.00 115.20 99.80 107.00" fill="none" stroke="#000" stroke-width="5.40" stroke-linecap="round"/><path d="M112.20 107.00 Q120.00 115.20 127.80 107.00" fill="none" stroke="#000" stroke-width="5.40" stroke-linecap="round"/></g>';
    var abi = (o.ojos === "abiertos" || o.ojos === "anim") ? '<g class="' + (o.ojos === "anim" ? "ojos-a" : "") + '"><circle cx="92" cy="108" r="6.4" fill="#000"/><circle cx="120" cy="108" r="6.4" fill="#000"/></g>' : "";
    var brazo = ang > 0.05 ? '<path transform="translate(' + piv[0] + " " + piv[1] + ") rotate(" + giro.toFixed(2) + ')" d="' + ARM + '" fill="currentColor"/>' : "";
    var st = o.color ? ' style="color:' + o.color + '"' : "";
    return svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="54 62 132 162" width="' + (o.w || 96) + '" role="img" aria-label="Cella" overflow="visible"' + st + '><mask id="' + id + '"><rect x="0" y="0" width="240" height="240" fill="#fff"/>' + cerr + abi + '</mask>' + brazo +
      '<path d="M66 212 V90.00 Q66 74.00 82.00 74.00 H158.00 Q174 74.00 174 90.00 V212 H146 V152 H120 V212 Z" fill="currentColor" mask="url(#' + id + ')"/></svg>');
  }
  function taza() {
    return svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 32" width="40" height="32" aria-hidden="true" focusable="false"><path d="M6 8h22v10a10 10 0 0 1-10 10h-2A10 10 0 0 1 6 18z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M28 11h3a5 5 0 0 1 0 10h-4" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>');
  }
  function iconoPuerta() {
    return svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><path d="M6 21V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v13M3 21h18M14 13h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>');
  }

  /* ---- sonido: seis motivos de tres notas con WebAudio, apagado por defecto, solo tras un toque ---- */
  var MOT = [[392, 494, 587], [330, 415, 494], [262, 330, 392], [440, 523, 659], [349, 440, 523], [294, 370, 440]], actx = null;
  function motivoActual() { return ST.motivo || R.puertas[S.puerta].n; }
  function suena(n) {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      actx = actx || new AC(); var t0 = actx.currentTime;
      MOT[n - 1].forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain(), a = t0 + i * 0.22;
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(0.16, a + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, a + 0.45);
        o.connect(g); g.connect(actx.destination); o.start(a); o.stop(a + 0.5);
      });
    } catch (e) { /* sin audio: el pulso visual alcanza */ }
  }
  function pulsar(host) {
    var p = h("span", { class: "pulso", "aria-hidden": "true" }); host.appendChild(p);
    setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 300);
  }

  /* ---- eventos del contador: solo se muestran en ?dev=1 y no salen ---- */
  var EV = [];
  try { EV = JSON.parse(window.sessionStorage.getItem("rito-ev") || "[]"); } catch (e) { EV = []; }
  function ev(n, v) {
    if (!ST.enviar) return;
    var d = new Date();
    EV.push({ n: n, v: v || "", t: p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds()) });
    EV = EV.slice(-40);
    try { window.sessionStorage.setItem("rito-ev", JSON.stringify(EV)); } catch (e) { /* nada */ }
  }

  /* ---- estado de la visita (no se guarda) ---- */
  var S = { puerta: PUERTA, tool: null, modo: "propio", min: false, act: 0, linea: "", abierta: null, modoLinea: false, texto: "", horas: [], pongo: "", sinHoja: false, nopude: false,
    obst: null, cierre: null, borrada: false, undo: false, rec: null, enlace: null, acuse: null, resp: null, hechaVisita: false, foco: null, p6: 0, cuando: false, cuandoNuevo: "", timers: [], volver: "p3", copiadoOk: null };
  S.tool = R.puertas[S.puerta].herramienta;
  function limpiarTimers() { S.timers.forEach(function (x) { clearTimeout(x); clearInterval(x); }); S.timers = []; }
  function tm(fn, ms) { var x = setTimeout(fn, ms); S.timers.push(x); return x; }
  function puertaDeTool(tool) { for (var k in R.puertas) if (R.puertas[k].herramienta === tool) return k; return "community"; }
  function nombreTool(tool) { return R.puertas[puertaDeTool(tool)].nombre[LANG]; }
  var DOORS = { community: "Community", breathe: "Breathe", eat: "Eat", sleep: "Sleep", move: "Move", divine: "The Divine" };

  /* ---- fondo: la mesa del color de la puerta o el papel ---- */
  function fondo(modo, pu) {
    var s = HTML.style;
    if (modo === "mesa") { var p = R.puertas[pu]; s.setProperty("--campo", p.campo); s.setProperty("--tx", p.tinta); }
    else { s.setProperty("--campo", "#FFFFFF"); s.setProperty("--tx", "#0E1116"); }
  }
  var vivoEl = null;
  function vivo(msg) { if (!vivoEl) return; vivoEl.textContent = ""; setTimeout(function () { vivoEl.textContent = msg; }, 30); }

  /* ---- enrutador por ancla ---- */
  var PANT = {}, app = null;
  function ruta() { var x = location.hash.replace("#", ""); return /^(p[1-8]|lugar|registro)$/.test(x) ? x : null; }
  function go(id, o) {
    if (o && o.rep) { history.replaceState(null, "", location.pathname + location.search + "#" + id); render(); return; }
    if (location.hash === "#" + id) render(); else location.hash = id;
  }
  function inicial() {
    if (Q.get("de") === "par") return "p4";
    if (primeraVisita() || citaCercana()) return "p1";
    return hueco() >= 2 ? "p6" : "p2";
  }
  function render(foco) {
    var id = ruta() || "p2"; limpiarTimers();
    if (id !== S.ultimaRuta) {
      S.foco = null; S.prevRuta = S.ultimaRuta;
      if (id !== "p2" && id !== "p5") S.modo = "propio";
      if (id === "p2") { if (S.modo !== "recibe") S.tool = R.puertas[S.puerta].herramienta; S.act = 0; S.linea = ""; }
      if (id === "p6") S.p6 = 0;
      if (id === "p5") { S.acuse = null; S.respInv = null; }
    }
    S.ultimaRuta = id;
    var f = PANT[id], nodo = f();
    if (!nodo) return;
    app.replaceChildren(nodo);
    var el = foco || S.foco ? app.querySelector('[data-f="' + (foco || S.foco) + '"]') : null;
    S.foco = null;
    if (!el) { el = app.querySelector("h1"); if (el) el.setAttribute("tabindex", "-1"); window.scrollTo(0, 0); }
    if (el) el.focus({ preventScroll: !!foco });
    if (!foco) vivo(t("anunciaPantalla", { x: (app.querySelector("h1") || {}).textContent || id }));
  }
  function rr(foco) { S.foco = foco || null; render(foco); }

  /* ---- marco común: puntos, "Mi lugar", pie con "Cómo te empuja NAOS", panel del equipo ---- */
  function puntos(n) {
    var li = [], i;
    for (i = 1; i <= 4; i++) li.push(h("li", { class: i === n ? "on" : "" }));
    return h("ul", { class: "puntos", role: "img", "aria-label": n ? t("paso", { n: n, x: t("pasos")[n - 1] }) : "" }, li);
  }
  function marco(o, cuerpo) {
    fondo(o.fondo, o.puerta || S.puerta);
    var q = new URLSearchParams(location.search); q.delete("lang");
    var otra = HTML.getAttribute("data-otra") + (q.toString() ? "?" + q.toString() : "") + location.hash;
    var arriba = h("div", { class: "arriba" }, o.paso ? puntos(o.paso) : h("span"),
      h("button", { class: "ib", type: "button", "aria-label": t("miLugar"), onclick: function () { S.volver = ruta() || "p2"; go("lugar"); } }, iconoPuerta()));
    var pie = h("div", { class: "pie" }, h("a", { href: "#registro", "data-f": "pie-reg" }, t("registro")), h("span", { class: "sp" }),
      h("a", { href: otra, lang: LANG === "es" ? "en" : "es", hreflang: LANG === "es" ? "en" : "es" }, t("otraLengua")));
    return h("div", { class: "pant", "data-pant": o.id }, arriba, h("div", { class: "cuerpo" }, cuerpo), pie, DEV ? devPanel() : null);
  }

  /* ---- copiar y compartir ---- */
  function hojaDisponible() { var m = Q.get("compartir"); if (m === "nodisp") return false; if (m === "elegir" || m === "cancelar") return true; return !!navigator.share; }
  function compartir(payload) {
    var m = Q.get("compartir");
    if (m === "elegir") return Promise.resolve("ok");
    if (m === "cancelar") return Promise.resolve("cancel");
    if (!hojaDisponible()) return Promise.resolve("nohoja");
    return navigator.share(payload).then(function () { return "ok"; }, function (e) { return e && e.name === "AbortError" ? "cancel" : "nohoja"; });
  }
  function copiar(texto) {
    return new Promise(function (res) {
      try {
        if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(texto).then(function () { res(true); }, function () { res(copiarViejo(texto)); }); return; }
      } catch (e) { /* cae al respaldo */ }
      res(copiarViejo(texto));
    });
  }
  function copiarViejo(texto) {
    try {
      var ta = h("textarea", { "aria-hidden": "true", style: "position:fixed;left:-9999px;top:0" }); ta.value = texto; DOC.body.appendChild(ta); ta.select();
      var ok = DOC.execCommand("copy"); DOC.body.removeChild(ta); return ok;
    } catch (e) { return false; }
  }
  function enlace(tool, horas) {
    var base = location.href.split(/[?#]/)[0], q = "?de=par&t=" + encodeURIComponent(tool);
    (horas || []).forEach(function (x, i) { q += "&h" + (i + 1) + "=" + encodeURIComponent(x); });
    return base + q;
  }

  /* ---- cierres ---- */
  function cierre(tipo, salida) {
    if (salida && (salida === "mandar" || salida === "juntos" || salida === "solo")) ST.orden = salida;
    if (salida) ev("devolver", salida);
    guardar(); S.cierre = tipo; S.borrada = false; S.undo = false; S.deshecho = false; S.autoBorra = tipo === "otro"; S.volver = "p3"; go("p7");
  }
  function enviar(payload, salida) {
    compartir(payload).then(function (r) {
      if (r === "ok") cierre("otro", salida);
      else if (r === "nohoja") { S.sinHoja = true; S.abierta = salida === "pideAlguien" ? "juntos" : salida; rr("r-" + S.abierta); }
      /* "cancel": la mesa no se borra, nada cambia */
    });
  }

  /* ================================================================= P1 ENTRADA */
  PANT.p1 = function () {
    var cer = citaCercana();
    function entrar() {
      ST.vis = true; guardar(); ev("abre");
      var zona = app.querySelector(".p1");
      if (ST.sonido) { suena(motivoActual()); if (zona) pulsar(zona); tm(function () { go("p2"); }, 330); } else go("p2");
    }
    var zona = h("div", { class: "p1", onclick: function (e) { if (!e.target.closest("button,a")) entrar(); } },
      h("div", { class: "dintel", "aria-hidden": "true" }),
      h("div", { "aria-hidden": "true" }, cella({ brazo: 50, lado: "der", ojos: "anim", w: 110 })),
      h("h1", { class: "linea1 fund" }, cer ? t("miRato") : t("puertaAbierta")),
      h("p", { class: "linea2 fund" }, diaHora(ahora())),
      h("div", { class: "fund" }, bloqueLuna()),
      ST.objeto ? h("p", { class: "objeto fund" }, taza(), h("span", { text: t("objetoSemana", { o: R.objetos[LANG][0] }) })) : null,
      h("div", { class: "fund" }, h("button", { class: "btn pri", type: "button", "data-f": "entrar", onclick: entrar }, t("entrar"))));
    return marco({ id: "p1", paso: 1, fondo: "mesa" }, zona);
  };

  /* ================================================================= P2 ACTO */
  function panelCuando(guardado) {
    var sel = ST.cuandos[ST.cuandos.length - 1];
    var chips = R.cuandos[LANG].map(function (c, i) {
      return h("button", { class: "btn peq", type: "button", "aria-pressed": sel === c ? "true" : "false", "data-f": "cu" + i, onclick: function () { elegirCuando(c); rr("cu" + i); } }, c);
    });
    var propio = S.cuando ? h("div", { class: "campo-t" }, h("label", { for: "cuandonuevo" }, t("tuCuandoEtq")),
      h("input", { type: "text", id: "cuandonuevo", maxlength: "60", value: S.cuandoNuevo, "data-f": "cuandonuevo", oninput: function (e) { S.cuandoNuevo = e.target.value; } }),
      h("button", { class: "btn peq pri", type: "button", onclick: function () { var v = S.cuandoNuevo.trim(); if (v) { elegirCuando(v); S.cuando = false; S.cuandoNuevo = ""; rr("escribir"); } } }, t("guardar")))
      : h("button", { class: "btn peq", type: "button", "data-f": "escribir", onclick: function () { S.cuando = true; rr("cuandonuevo"); } }, t("escribeElTuyo"));
    return h("section", { "aria-labelledby": "tcu", class: "campo-t", style: "gap:12px" }, h("h2", { class: "tit", id: "tcu", tabindex: "-1", "data-f": "tcu" }, t("tuCuando")), h("p", { class: "nota", text: t("cuandoAyuda") }),
      h("div", { class: "chips" }, chips), propio, guardado ? h("p", { class: "nota", role: "status", text: t("cuandoGuardado") }) : null);
  }
  function elegirCuando(c) {
    ST.cuandos = ST.cuandos.filter(function (x) { return x !== c; }); ST.cuandos.push(c); ST.cuandos = ST.cuandos.slice(-5); S.cuandoGuardado = true; guardar();
  }
  PANT.p2 = function () {
    var tool = S.tool, pu = puertaDeTool(tool), esCom = tool === "una-linea", min = S.min || ST.min, max = min ? 2 : 7;
    var P = R.puertas[pu];
    var cab = [h("p", { class: "rot", text: DOORS[pu] }), h("h1", { class: "frase", text: P.nombre[LANG] })];
    if (S.act === 3 && S.modo !== "recibe") {
      var cuerpo = cab.concat([h("p", { class: "sello" }, h("i", { "aria-hidden": "true" }), t("hecha")), panelCuando(S.cuandoGuardado),
        h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", "data-f": "seguir", onclick: function () { S.volver = "p2"; go("p3"); } }, t("seguir")))]);
      return marco({ id: "p2", paso: 2, fondo: "mesa", puerta: pu }, cuerpo);
    }
    var frase = R.frases[tool];
    cab.push(frase ? h("p", { class: "txt", text: frase[LANG] }) : h("p", { class: "txt nota mono", text: t("marcador") }));
    if (min) cab.push(h("p", { class: "nota" }, h("b", { text: t("tamMin") + ". " }), t("minAyuda")));
    /* anillo de 10 s con Cella */
    var C = 2 * Math.PI * 60;
    var prog = svg('<svg xmlns="http://www.w3.org/2000/svg" class="arc" viewBox="0 0 132 132" aria-hidden="true" focusable="false"><circle cx="66" cy="66" r="60" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="6"/><circle class="prog" cx="66" cy="66" r="60" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="butt" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/></svg>');
    var anillo = h("div", { class: "anillo", role: "img", "aria-label": t("anillo") }, prog, h("div", { class: "cella-w" }, cella({ ojos: "cerrados", w: 66 })));
    var terminar = h("button", { class: "btn pri", type: "button", id: "btn-term", "data-f": "terminar", disabled: true, onclick: terminarActo }, t("termine"));
    var empezar = h("button", { class: "btn pri", type: "button", id: "btn-emp", "data-f": "empezar", onclick: empezarActo }, t("empezar"));
    var campo = null, dots = null, cuenta = null, inp = null;
    if (esCom) {
      var di = []; for (var i = 0; i < max; i++) di.push(h("i"));
      dots = h("div", { class: "siete", "aria-hidden": "true" }, di);
      cuenta = h("p", { class: "sr", role: "status", "aria-live": "polite", id: "cuenta" });
      inp = h("input", { type: "text", id: "linea", class: "linea-campo", autocomplete: "off", autocapitalize: "sentences", spellcheck: "false", "data-f": "linea", placeholder: min ? t("phMin") : t("ph"), "aria-describedby": "nada-sale cuenta", value: S.linea,
        oninput: function (e) { actualizar(e.target); } });
      campo = h("div", { class: "campo-t" }, h("label", { for: "linea" }, min ? t("campoEtqMin") : t("campoEtq")), inp, dots, cuenta, h("p", { class: "nota", id: "nada-sale", text: t("nadaSale") }));
    }
    function nPal(v) { return (v.match(/\S+/g) || []).length; }
    function actualizar(el) {
      var v = el.value, w = v.match(/\S+/g) || [];
      if (w.length > max) { var re = /\S+/g, m, n = 0, fin = v.length; while ((m = re.exec(v))) { n++; if (n === max) { fin = m.index + m[0].length; break; } } v = v.slice(0, fin); el.value = v; w = v.match(/\S+/g) || []; }
      S.linea = v;
      var is = dots ? dots.children : []; for (var j = 0; j < is.length; j++) is[j].className = j < w.length ? "on" : "";
      if (cuenta) cuenta.textContent = t("palabras", { n: w.length, m: max });
      habilitar();
    }
    function habilitar() { terminar.disabled = !(S.act >= 1 && (esCom ? nPal(S.linea) >= 1 : S.act === 2)); }
    function empezarActo() {
      if (S.act >= 1) return;
      S.act = 1; empezar.hidden = true; terminar.hidden = false; habilitar();
      var circ = anillo.querySelector(".prog"); vivo(t("anillo1"));
      if (QUIETO) {
        var s = 0; var iv = setInterval(function () { s++; circ.setAttribute("stroke-dashoffset", (C * (1 - s / 10)).toFixed(1)); if (s >= 10) { clearInterval(iv); fin10(); } }, 1000); S.timers.push(iv);
      } else {
        circ.style.transition = "stroke-dashoffset 10s linear"; void circ.getBoundingClientRect(); circ.setAttribute("stroke-dashoffset", "0"); tm(fin10, 10000);
      }
      if (inp) inp.focus(); else terminar.focus();
    }
    function fin10() { S.act = 2; vivo(t("anillo2")); habilitar(); }
    function terminarActo() {
      if (terminar.disabled) return;
      S.act = 3; S.linea = ""; if (inp) inp.value = "";
      ST.hechas[tool] = (ST.hechas[tool] || 0) + 1;
      var hoy = hoyISO(ahora()); if (ST.dias.indexOf(hoy) < 0) ST.dias.push(hoy); ST.dias = ST.dias.slice(-28);
      ST.ult = { tool: tool, puerta: pu, t: new Date().toISOString() }; ST.vis = true; ST.min = false; S.min = false; guardar(); ev("hecha", tool); S.hechaVisita = true;
      if (S.modo === "recibe") go("p5"); else { S.cuandoGuardado = false; rr("seguir"); }
    }
    terminar.hidden = S.act < 1; empezar.hidden = S.act >= 1;
    var cuerpo2 = cab.concat([h("div", { class: "act" }, anillo, h("div", { class: "campo-t" }, empezar, terminar)), campo]);
    return marco({ id: "p2", paso: 2, fondo: "mesa", puerta: pu }, cuerpo2);
  };

  /* ================================================================= P3 DEVOLVER */
  function filasPuerta() {
    var p = S.puerta, noche = esNoche();
    if (p === "sleep") return noche ? ["manana"] : ["solo", "luz"];
    if (p === "breathe") return ["solo", "mandar"];
    var base = (p === "eat" || p === "divine") ? ["juntos", "mandar", "solo"] : ["mandar", "juntos", "solo"], o = ST.orden, i = o ? base.indexOf(o) : -1;
    if (i > 0) { base.splice(i, 1); base.unshift(o); }
    return base;
  }
  function lineasDe(fila) {
    if (fila === "luz") return R.lineas_luz[LANG];
    return S.puerta === "breathe" ? R.lineas_breathe[LANG] : R.lineas_mandar[LANG];
  }
  function candidatasHoras() {
    var d = ahora(), out = [], hr = d.getHours() + d.getMinutes() / 60, x;
    if (hr <= 16.5) { x = new Date(d); x.setHours(17, 30, 0, 0); out.push({ iso: isoLocal(x), label: t("hoy") + " " + fh(x) }); }
    else if (hr <= 18.5) { x = new Date(d); x.setHours(20, 0, 0, 0); out.push({ iso: isoLocal(x), label: t("hoy") + " " + fh(x) }); }
    x = new Date(d); x.setDate(x.getDate() + 1); x.setHours(17, 30, 0, 0); out.push({ iso: isoLocal(x), label: t("manana") + " " + fh(x) });
    x = new Date(d); var add = (6 - x.getDay() + 7) % 7; if (add === 0 && hr > 16.5) add = 7; if (add <= 1) add += 7; x.setDate(x.getDate() + add); x.setHours(17, 30, 0, 0);
    out.push({ iso: isoLocal(x), label: t("finde") + " · " + t("diasCortos")[x.getDay()] + " " + fh(x) });
    return out;
  }
  function panelCopiar(lineas, tool, fila, horas) {
    var estado = h("p", { class: "nota", role: "status", "aria-live": "polite", "data-f": "estadocopia" });
    var url = enlace(tool, horas || []);
    function hecho(ok, texto) {
      if (ok) { estado.textContent = t("copiado"); tm(function () { cierre("otro", fila === "pideAlguien" ? "juntos" : fila); }, 700); }
      else { estado.textContent = t("copiarFalla"); var f = h("input", { type: "text", readonly: "", value: texto, "aria-label": t("enlaceEtq") }); estado.parentNode.insertBefore(f, estado.nextSibling); f.focus(); f.select();
        estado.parentNode.appendChild(h("button", { class: "btn peq", type: "button", onclick: function () { cierre("otro", fila === "pideAlguien" ? "juntos" : fila); } }, t("yaCopie"))); }
    }
    var filas = [h("button", { class: "btn pri", type: "button", "data-f": "copiar-enlace", onclick: function () { copiar(url).then(function (ok) { hecho(ok, url); }); } }, t("copiarEnlace"))];
    (lineas || []).forEach(function (l, i) {
      filas.push(h("div", { class: "campo-t" }, h("p", { class: "txt", text: l }), h("button", { class: "btn peq", type: "button", "data-f": "copiar" + i, onclick: function () { var tx = l + " " + url; copiar(tx).then(function (ok) { hecho(ok, tx); }); } }, t("copiar"))));
    });
    return h("div", { class: "abierta" }, h("p", { class: "nota", text: t("sinHoja") }), filas, estado, ayudaReceptor(tool, horas));
  }
  function ayudaReceptor(tool, horas) {
    return h("a", { class: "enlace nota", href: enlace(tool, horas || []), "aria-label": t("abrirComoReceptor") }, t("abrirComoReceptor"));
  }
  function panelMandar(fila) {
    var tool = R.puertas[S.puerta].herramienta, lns = lineasDe(fila), url = enlace(tool);
    if (S.sinHoja || !hojaDisponible()) return panelCopiar(lns, tool, fila);
    var botones = h("div", { class: "fila" },
      h("button", { class: "btn pri", type: "button", "data-f": "solo-enlace", onclick: function () { enviar({ title: nombreTool(tool), text: nombreTool(tool), url: url }, fila); } }, t("soloEnlace")),
      h("button", { class: "btn", type: "button", "aria-pressed": S.modoLinea ? "true" : "false", "data-f": "con-linea", onclick: function () { S.modoLinea = !S.modoLinea; rr("con-linea"); } }, t("conLinea")));
    var linea = null;
    if (S.modoLinea) {
      var opciones = lns.map(function (l, i) {
        return h("button", { class: "btn peq", type: "button", "aria-pressed": S.texto === l ? "true" : "false", style: "justify-content:flex-start;text-align:left", "data-f": "ln" + i, onclick: function () { S.texto = l; rr("ln" + i); } }, l);
      });
      linea = h("div", { class: "campo-t", style: "gap:10px" }, h("p", { class: "nota", text: t("elige") }), opciones,
        h("label", { for: "msg" }, t("tuMensaje")), h("textarea", { id: "msg", "data-f": "msg", oninput: function (e) { S.texto = e.target.value; } }, S.texto),
        !ST.ayuda ? h("p", { class: "nota", text: t("primeraVez") }) : null,
        h("button", { class: "btn pri", type: "button", "data-f": "compartir", onclick: function () { ST.ayuda = true; guardar(); enviar({ title: nombreTool(tool), text: S.texto, url: url }, fila); } }, t("compartir")));
    }
    return h("div", { class: "abierta" }, botones, linea, ayudaReceptor(tool));
  }
  function panelJuntos() {
    var tool = R.puertas[S.puerta].herramienta, cand = candidatasHoras();
    S.horasSel = S.horasSel || [];
    function msg() {
      var partes = [t("msgJuntos")];
      if (S.horasSel.length) partes.push(t("msgTe") + " " + S.horasSel.map(fmtProp).join(", ") + ".");
      partes.push(t("msgSeg")); if (S.pongo.trim()) partes.push(t("msgPongo", { x: S.pongo.trim() }));
      return partes.join(" ");
    }
    if (S.sinHoja || !hojaDisponible()) return panelCopiar([msg()], tool, "juntos", S.horasSel);
    var chips = cand.map(function (c, i) {
      var on = S.horasSel.indexOf(c.iso) >= 0;
      return h("button", { class: "btn peq", type: "button", "aria-pressed": on ? "true" : "false", "data-f": "hr" + i, onclick: function () {
        var k = S.horasSel.indexOf(c.iso); if (k >= 0) S.horasSel.splice(k, 1); else if (S.horasSel.length < 3) S.horasSel.push(c.iso); rr("hr" + i); } }, c.label);
    });
    return h("div", { class: "abierta" }, h("p", { class: "etq", text: t("horasEtq") }), h("div", { class: "chips" }, chips),
      h("div", { class: "campo-t" }, h("label", { for: "pongo" }, t("yoPongo")), h("input", { type: "text", id: "pongo", maxlength: "50", value: S.pongo, placeholder: t("yoPongoPh"), "data-f": "pongo", oninput: function (e) { S.pongo = e.target.value; } })),
      h("button", { class: "btn pri", type: "button", "data-f": "invitar", onclick: function () { enviar({ title: nombreTool(tool), text: msg(), url: enlace(tool, S.horasSel) }, "juntos"); } }, t("invitar")),
      ayudaReceptor(tool, S.horasSel));
  }
  function panelInterpuso(conPedir) {
    var o = S.obst, chips = R.interpuso.map(function (x) {
      return h("button", { class: "btn peq", type: "button", "aria-pressed": o && o.id === x.id ? "true" : "false", "data-f": "ob-" + x.id, onclick: function () { S.obst = { id: x.id, ok: null }; rr("ob-" + x.id); } }, x[LANG]);
    });
    var regla = null;
    if (o) {
      var x = R.interpuso.filter(function (y) { return y.id === o.id; })[0], hecho = o.ok === true;
      regla = h("div", { class: "campo-t", style: "gap:10px" }, h("p", { class: "txt", "data-f": "regla" }, x.regla[LANG]),
        hecho ? h("p", { class: "nota", role: "status", text: o.id === "tiempo" ? t("reglaAnotada") : t("anotado") })
          : h("div", { class: "fila" },
            h("button", { class: "btn pri peq", type: "button", "data-f": "acepto", onclick: function () {
              S.obst.ok = true; ST.obst = { id: o.id, t: new Date().toISOString() };
              if (o.id === "tiempo") ST.min = true; guardar();
              if (o.id === "olvido" && R.puertas[S.puerta].cita) { S.volver = ruta(); go("p8"); return; }
              rr("acepto"); } }, (o.id === "peso" || o.id === "quise") ? t("entendido") : t("aceptoRegla")),
            (o.id === "peso" || o.id === "quise") ? null : h("button", { class: "btn peq", type: "button", onclick: function () { S.obst = null; rr("ob-" + o.id); } }, t("noRegla"))));
    }
    var pedir = null;
    if (conPedir && !(o && o.id === "peso") && !(S.puerta === "sleep" && esNoche())) {
      var tool = R.puertas[S.puerta].herramienta;
      pedir = h("div", { class: "campo-t", style: "gap:10px" }, h("h3", { class: "etq", text: t("pideAlguien") }), h("p", { class: "txt", text: R.invitacion_no_pude[LANG] }),
        h("button", { class: "btn peq", type: "button", "data-f": "pedir", onclick: function () { enviar({ title: nombreTool(tool), text: R.invitacion_no_pude[LANG], url: enlace(tool) }, "pideAlguien"); } }, t("pideCompartir")));
      if (S.sinHoja && S.abierta === "juntos" && S.nopude) pedir = panelCopiar([R.invitacion_no_pude[LANG]], tool, "pideAlguien");
    }
    return h("div", { class: "campo-t", style: "gap:16px" }, h("h2", { class: "tit", text: t("queSeInterpuso") }), h("div", { class: "chips" }, chips), regla, pedir);
  }
  PANT.p3 = function () {
    var pu = S.puerta, P = R.puertas[pu], noche = pu === "sleep" && esNoche(), filas = filasPuerta(), tool = P.herramienta;
    var sello = S.hechaVisita ? h("p", { class: "sello" }, h("i", { "aria-hidden": "true" }), t("mesaMarca")) : null;
    var cabeza = [h("p", { class: "rot", text: DOORS[pu] }), h("h1", { class: "tit", text: P.nombre[LANG] }), sello];
    if (S.nopude) {
      return marco({ id: "p3", paso: 3, fondo: "mesa" }, cabeza.concat([panelInterpuso(true), h("button", { class: "enlace", type: "button", "data-f": "volver-filas", onclick: function () { S.nopude = false; S.obst = null; S.sinHoja = false; rr("r-" + filas[0]); } }, t("volverFilas"))]));
    }
    var items = filas.map(function (f) {
      var lab = f === "manana" ? t("hastaManana") : t(f), abre = f === "mandar" || f === "juntos" || f === "luz", ab = S.abierta === f;
      var b = h("button", { class: "salida", type: "button", "data-f": "r-" + f, "aria-expanded": abre ? (ab ? "true" : "false") : null, onclick: function () {
        if (f === "solo") { cierre("solo", "solo"); }
        else if (f === "manana") { cierre("manana", null); }
        else { S.abierta = ab ? null : f; S.modoLinea = false; S.sinHoja = false; rr("r-" + f); } } }, lab);
      return h("div", null, b, ab ? (f === "juntos" ? panelJuntos() : panelMandar(f)) : null);
    });
    var cuerpo = cabeza.concat([h("div", { class: "salidas" }, items)]);
    var sir = h("div", { class: "campo-t", role: "group", "aria-labelledby": "sirvio-t" }, h("p", { id: "sirvio-t", class: "txt", style: "margin:0", text: t("sirvio") }),
      h("div", { class: "fila" }, [["si", "si"], ["unPoco", "poco"], ["noSe", "nose"]].map(function (x) {
        return h("button", { class: "btn peq", type: "button", "aria-pressed": ST.sirvio && ST.sirvio.v === x[1] && ST.sirvio.dia === hoyISO(ahora()) ? "true" : "false", "data-f": "s-" + x[1], onclick: function () {
          ST.sirvio = { v: x[1], dia: hoyISO(ahora()) }; guardar(); ev("sirvio"); vivo(t("anotado")); rr("s-" + x[1]); } }, t(x[0]));
      })));
    cuerpo.push(sir);
    var enl = [];
    if (!noche) enl.push(h("button", { class: "enlace", type: "button", "data-f": "no-pude", onclick: function () { S.nopude = true; S.abierta = null; rr("volver-filas"); } }, t("noPude")));
    var primeraCita = P.cita && !noche && (!ST.citaOfrecida || S.citaEstaVisita);
    if (primeraCita && !S.citaEstaVisita) { S.citaEstaVisita = true; ST.citaOfrecida = true; guardar(); }
    if (primeraCita) enl.push(h("button", { class: "enlace", type: "button", "data-f": "cita", onclick: function () { S.volver = "p3"; go("p8"); } }, t("citaSemanal")));
    if (enl.length) cuerpo.push(h("div", { style: "display:flex;flex-direction:column;align-items:flex-start" }, enl));
    return marco({ id: "p3", paso: 3, fondo: "mesa" }, cuerpo);
  };

  /* ================================================================= P4 RECIBIR */
  function leerEnlace() {
    var tv = Q.get("t"), ok = true, tool, horas = [];
    if (tv !== null) ok = /^[a-z-]{1,40}$/.test(tv) && R.herramientas.indexOf(tv) >= 0;
    tool = tv === null ? R.puertas[PUERTA].herramienta : (ok ? tv : null);
    ["h1", "h2", "h3"].forEach(function (k) {
      var v = Q.get(k);
      if (v && v.length === 16 && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) {
        var d = new Date(v), dt = d.getTime() - Date.now();
        if (!isNaN(d.getTime()) && dt > -12 * 36e5 && dt < 60 * 864e5 && horas.indexOf(v) < 0) horas.push(v);
      }
    });
    return { ok: ok, tool: tool, horas: horas };
  }
  PANT.p4 = function () {
    if (!S.enlace) { S.enlace = leerEnlace(); S.rec = S.enlace.ok ? "permiso" : "invalido"; }
    var L = S.enlace, tool = L.tool;
    var cab = [h("div", { class: "pareja", "aria-hidden": "true" }, cella({ ojos: "abiertos", w: 84 }), h("div", { class: "noche" }, cella({ ojos: "abiertos", w: 56, color: "#F4F6F8" })))];
    var cuerpo, fon = "papel", pu = tool ? puertaDeTool(tool) : S.puerta;
    if (S.rec === "invalido") {
      cuerpo = cab.concat([h("h1", { class: "frase", text: t("enlaceInvalido") }), h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", "data-f": "ir", onclick: function () { S.enlace = null; S.modo = "propio"; S.tool = R.puertas[PUERTA].herramienta; go("p2"); } }, t("irPuerta")))]);
    } else if (S.rec === "permiso") {
      cuerpo = cab.concat([h("h1", { class: "frase", text: t("conPermiso") }), h("div", { class: "tres" },
        h("button", { class: "btn pri", type: "button", "data-f": "siga", onclick: function () { ev("recibe", "siga"); S.rec = "herr"; rr(); } }, t("siga")),
        h("button", { class: "btn", type: "button", onclick: function () { ev("recibe", "despues"); S.rec = "listo"; rr(); } }, t("despues")),
        h("button", { class: "btn", type: "button", onclick: function () { ev("recibe", "no"); S.rec = "listo"; rr(); } }, t("noGracias")))]);
    } else if (S.rec === "listo") {
      cuerpo = cab.concat([h("h1", { class: "frase", text: t("listo") }), h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", "data-f": "cerrar", onclick: function () { S.cierre = "fin"; go("p7"); } }, t("cerrar")))]);
    } else if (S.rec === "vista") {
      fon = "mesa";
      cuerpo = [h("p", { class: "rot", text: DOORS[pu] }), h("h1", { class: "frase", text: nombreTool(tool) }), h("p", { class: "txt", text: (R.frases[tool] || { es: t("marcador"), en: t("marcador") })[LANG] }),
        h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", "data-f": "ahora", onclick: function () { hacerAhora(); } }, t("hacerAhora")),
          h("button", { class: "btn", type: "button", onclick: function () { S.cierre = "fin"; go("p7"); } }, t("cerrar")))];
    } else if (S.rec === "resp") {
      cuerpo = cab.concat([h("h1", { class: "tit", text: t("tuRespuesta") }), panelRespuesta()]);
    } else { /* herr */
      fon = "mesa";
      var hr = L.horas.map(function (x, i) {
        return h("button", { class: "btn peq", type: "button", "data-f": "h" + i, onclick: function () { S.resp = { texto: t("respHoras", fmtLargo(x)) }; S.rec = "resp"; rr(); } }, fmtProp(x));
      });
      cuerpo = [h("p", { class: "rot", text: DOORS[pu] }), h("h1", { class: "frase", text: t("teMandaron") }), h("p", { class: "tit", text: t("seg10", { x: nombreTool(tool) }) }),
        h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", "data-f": "ahora", onclick: function () { hacerAhora(); } }, t("hacerAhora")),
          h("button", { class: "btn", type: "button", onclick: function () { S.rec = "vista"; rr(); } }, t("verDespues")))];
      if (L.horas.length) {
        cuerpo.push(h("div", { class: "campo-t", style: "gap:10px" }, h("p", { class: "etq", text: t("teProponen") }), h("div", { class: "chips" }, hr,
          h("button", { class: "btn peq", type: "button", onclick: function () { S.resp = { texto: t("respOtro") }; S.rec = "resp"; rr(); } }, t("otroDia")))));
      }
    }
    function hacerAhora() { S.modo = "recibe"; S.tool = tool; S.puerta = pu; S.act = 0; S.linea = ""; S.min = false; go("p2"); }
    function panelRespuesta() {
      var txt = S.resp.texto, estado = h("p", { class: "nota", role: "status", "aria-live": "polite" });
      return h("div", { class: "campo-t", style: "gap:12px" }, h("label", { class: "etq", for: "rsp" }, t("tuRespuesta")),
        h("textarea", { id: "rsp", oninput: function (e) { txt = e.target.value; } }, txt),
        h("div", { class: "fila" },
          h("button", { class: "btn pri peq", type: "button", "data-f": "rcomp", onclick: function () { compartir({ text: txt }).then(function (r) { if (r === "ok") { S.rec = "listo"; rr(); } else if (r === "nohoja") estado.textContent = t("sinHoja"); }); } }, t("compartir")),
          h("button", { class: "btn peq", type: "button", onclick: function () { copiar(txt).then(function (ok) { estado.textContent = ok ? t("copiado") : t("copiarFalla"); }); } }, t("copiar")),
          h("a", { class: "btn peq", href: "https://wa.me/?text=" + encodeURIComponent(txt), target: "_blank", rel: "noopener noreferrer" }, t("abrirWa")),
          h("button", { class: "btn peq", type: "button", onclick: function () { S.rec = "herr"; rr(); } }, t("volver"))), estado);
    }
    return marco({ id: "p4", paso: 0, fondo: fon, puerta: pu }, cuerpo);
  };

  /* ================================================================= P5 CONTESTAR */
  PANT.p5 = function () {
    var L = S.enlace || { horas: [] }, inv = L.horas.length > 0, tool = S.tool;
    function opciones(lista, clave, f) {
      return h("div", { class: "campo-t", style: "gap:8px" }, lista.map(function (x, i) {
        return h("button", { class: "btn peq", type: "button", style: "justify-content:flex-start;text-align:left", "aria-pressed": S[clave] === x ? "true" : "false", "data-f": f + i, onclick: function () { S[clave] = S[clave] === x ? null : x; rr(f + i); } }, x);
      }));
    }
    var texto = [S.acuse, S.respInv].filter(Boolean).join(" ");
    var estado = h("p", { class: "nota", role: "status", "aria-live": "polite" });
    var cuerpo = [h("h1", { class: "frase", text: t("hechaLeContestas") }), h("p", { class: "etq", text: t("acuseEtq") }), opciones(R.acuses[LANG], "acuse", "ac")];
    if (inv) { cuerpo.push(h("p", { class: "etq", text: t("invEtq") })); cuerpo.push(opciones(R.respuestas_invitacion[LANG], "respInv", "iv")); }
    cuerpo.push(h("p", { class: "txt", text: texto || t("elegirUno"), "aria-live": "polite", style: texto ? "" : "opacity:.7" }));
    cuerpo.push(h("div", { class: "fila" },
      h("button", { class: "btn pri", type: "button", disabled: !texto, "data-f": "comp", onclick: function () { compartir({ text: texto }).then(function (r) { if (r === "ok") cierre("otro", null); else if (r === "nohoja") estado.textContent = t("sinHoja"); }); } }, t("compartir")),
      h("button", { class: "btn", type: "button", disabled: !texto, onclick: function () { copiar(texto).then(function (ok) { estado.textContent = ok ? t("copiado") : t("copiarFalla"); }); } }, t("copiar")),
      h("button", { class: "btn", type: "button", onclick: function () { S.cierre = "fin"; go("p7"); } }, t("cerrar"))));
    cuerpo.push(estado, h("p", { class: "nota", text: t("sale") }));
    cuerpo.push(h("button", { class: "enlace nota", type: "button", "data-f": "otra", onclick: function () { enviar({ title: nombreTool(tool), text: nombreTool(tool), url: enlace(tool) }, "mandar"); } }, t("mandarOtra")));
    return marco({ id: "p5", paso: 0, fondo: "papel" }, cuerpo);
  };

  /* ================================================================= P6 VOLVER */
  PANT.p6 = function () {
    var g = hueco(), tool = (ST.ult && ST.ult.tool) || R.puertas[S.puerta].herramienta, pu = puertaDeTool(tool), nombre = nombreTool(tool);
    S.puerta = Q.get("puerta") ? S.puerta : pu;
    function minimo() { S.modo = "propio"; S.tool = tool; S.puerta = pu; S.min = true; S.act = 0; S.linea = ""; go("p2"); }
    var cerrarHoy = h("button", { class: "btn", type: "button", onclick: function () { S.cierre = "fin"; go("p7"); } }, t("cerrarHoy"));
    var cab = [h("p", { class: "rot", text: DOORS[pu] })], cuerpo;
    if (g <= 1) {
      if (!hechoHoy()) { go("p2", { rep: true }); return null; }
      cuerpo = cab.concat([h("h1", { class: "frase", text: t("hechaHoy") }), h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", "data-f": "otra", onclick: function () { S.modo = "propio"; S.tool = tool; S.puerta = pu; S.act = 0; go("p2"); } }, t("hacerOtraVez")), cerrarHoy)]);
    } else if (g <= 6) {
      var arco = svg('<svg xmlns="http://www.w3.org/2000/svg" class="arco" viewBox="0 0 200 50" width="160" aria-hidden="true" focusable="false"><path pathLength="1" d="M10 44 Q100 -22 190 44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>');
      cuerpo = cab.concat([arco, h("h1", { class: "frase", text: t("aquiEsta") }), h("p", { class: "tit", text: nombre }),
        h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", "data-f": "min", onclick: minimo }, t("hacerMin")), cerrarHoy)]);
    } else if (g <= 20) {
      if (S.p6 === 0) {
        cuerpo = cab.concat([h("h1", { class: "frase", text: t("cualEraCuando") }), h("div", { class: "campo-t" }, h("label", { class: "sr", for: "cual" }, t("cualEraCuando")), h("input", { type: "text", id: "cual", maxlength: "60", placeholder: t("cualPh"), "data-f": "cual" })),
          h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", "data-f": "verlo", onclick: function () { S.p6 = 1; S.verCuando = true; rr("min"); } }, t("verlo")), h("button", { class: "btn", type: "button", onclick: function () { S.p6 = 1; S.verCuando = false; rr("min"); } }, t("saltar")))]);
      } else {
        var ult = ST.cuandos[ST.cuandos.length - 1];
        cuerpo = cab.concat([h("h1", { class: "frase", text: t("aquiEsta") }), S.verCuando ? h("p", { class: "txt", role: "status", text: ult || t("sinCuando") }) : null, h("p", { class: "tit", text: nombre }),
          h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", "data-f": "min", onclick: minimo }, t("hacerMin")), cerrarHoy),
          h("button", { class: "salida", type: "button", style: "min-height:48px;font-size:16px", "aria-expanded": S.obstAbierta ? "true" : "false", "data-f": "queinterpuso", onclick: function () { S.obstAbierta = !S.obstAbierta; rr("queinterpuso"); } }, t("queSeInterpuso")),
          S.obstAbierta ? h("div", { class: "abierta" }, panelInterpuso(false)) : null]);
      }
    } else {
      if (S.p6 === 0) {
        cuerpo = cab.concat([h("h1", { class: "frase", text: t("cambioAlgo") }), h("div", { class: "fila" },
          h("button", { class: "btn pri", type: "button", "data-f": "igual", onclick: function () { S.p6 = 1; S.cambio = false; rr("min"); } }, t("sigueIgual")),
          h("button", { class: "btn", type: "button", onclick: function () { S.p6 = 1; S.cambio = true; rr("tcu"); } }, t("cambio")))]);
      } else {
        cuerpo = cab.concat([h("h1", { class: "frase", text: S.cambio ? t("eligeCuando") : t("aquiEsta") }), S.cambio ? panelCuando(false) : null, h("p", { class: "tit", text: nombre }),
          h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", "data-f": "min", onclick: minimo }, t("hacerMin")), cerrarHoy)]);
      }
    }
    return marco({ id: "p6", paso: 1, fondo: "mesa", puerta: pu }, cuerpo);
  };

  /* ================================================================= P7 CIERRE */
  PANT.p7 = function () {
    var tipo = S.cierre || "fin", pu = S.puerta, mesa = tipo !== "fin" && !S.borrada, tool = R.puertas[pu].herramienta, fon = mesa ? "mesa" : "papel";
    function borrar() {
      if (S.borrada) return;
      S.borrada = true; S.undo = tipo !== "fin"; fondo("papel"); rr("fin-t");
      if (S.undo) { vivo(t("mesaBorrada")); S.timers.push(setTimeout(function () { S.undo = false; var b = app.querySelector("[data-f=deshacer]"); if (b) { var tenia = DOC.activeElement === b; b.parentNode.removeChild(b); if (tenia) { var h1 = app.querySelector("h1"); if (h1) h1.focus(); } } }, 6000)); }
    }
    function deshacer() { S.borrada = false; S.undo = false; S.deshecho = true; limpiarTimers(); rr("borrar"); vivo(t("mesaVuelve")); }
    var cuerpo = [];
    if (mesa) {
      cuerpo.push(h("p", { class: "rot", text: DOORS[pu] }), h("h1", { class: "frase", "data-f": "fin-t", text: R.puertas[pu].nombre[LANG] }), h("p", { class: "sello" }, h("i", { "aria-hidden": "true" }), t("mesaMarca")));
      if (tipo !== "otro" || S.deshecho) {
        cuerpo.push(h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", "data-f": "borrar", onclick: borrar }, t("borrarMesa"))), h("p", { class: "nota", text: t("desliza") }));
        if (tipo === "solo" && ST.vista) cuerpo.push(h("div", { class: "campo-t", style: "gap:4px" }, h("p", { class: "txt", text: t("aLaVista") }),
          h("button", { class: "enlace nota", type: "button", onclick: function () { ST.vista = false; guardar(); rr("borrar"); } }, t("ocultar"))));
      }
    } else {
      var frase = tipo === "otro" ? t("enTusManos") : (tipo === "manana" ? t("hastaManana") : t("hastaProxima"));
      if (tipo === "otro") cuerpo.push(h("div", { class: "pareja", "aria-hidden": "true" }, cella({ ojos: "cerrados", w: 84 }), h("div", { class: "noche" }, cella({ ojos: "cerrados", w: 56, color: "#F4F6F8" }))));
      cuerpo.push(h("h1", { class: "frase", "data-f": "fin-t", text: frase }));
      if (tipo !== "fin") cuerpo.push(h("p", { class: "vacio", "aria-hidden": "true", text: t("campoVacio") }));
      cuerpo.push(bloqueFecha());
      if (S.undo) cuerpo.push(h("div", { class: "fila" }, h("button", { class: "btn", type: "button", "data-f": "deshacer", onclick: deshacer }, t("deshacer"))));
      if (tipo === "solo" && ST.vista) cuerpo.push(h("div", { class: "campo-t", style: "gap:4px" }, h("p", { class: "txt", text: t("aLaVista") }),
        h("button", { class: "enlace nota", type: "button", onclick: function () { ST.vista = false; guardar(); rr("fin-t"); } }, t("ocultar"))));
      if (tipo === "fin") cuerpo.push(h("div", { class: "fila" }, h("button", { class: "btn", type: "button", "data-f": "otra", onclick: function () { S.act = 0; S.modo = "propio"; S.tool = R.puertas[S.puerta].herramienta; go("p2"); } }, t("volver"))));
    }
    var nodo = marco({ id: "p7", paso: 4, fondo: fon }, cuerpo);
    if (mesa) {
      var gesto = nodo.querySelector(".cuerpo"); gesto.classList.add("mesa-gesto");
      if (tipo !== "otro" || S.deshecho) {
        var x0 = 0, to = null;
        gesto.addEventListener("pointerdown", function (e) { if (e.target.closest("button,a")) return; x0 = e.clientX; to = setTimeout(borrar, 1200); });
        gesto.addEventListener("pointermove", function (e) { if (to && Math.abs(e.clientX - x0) > 90) { clearTimeout(to); to = null; borrar(); } });
        ["pointerup", "pointercancel", "pointerleave"].forEach(function (n) { gesto.addEventListener(n, function () { if (to) { clearTimeout(to); to = null; } }); });
      }
    }
    if (mesa && tipo === "otro" && S.autoBorra) { S.autoBorra = false; S.timers.push(setTimeout(borrar, QUIETO ? 0 : 90)); }
    return nodo;
  };
  function bloqueFecha() {
    var d = ahora(), l = luna(d);
    return h("p", { class: "fecha" }, l.svg, h("span", { text: l.texto }));
  }

  /* ================================================================= P8 CITA */
  function plegar(linea) {
    var enc = new TextEncoder(), out = [], cur = "", curB = 0;
    for (var ch of linea) {
      var b = enc.encode(ch).length;
      if (curB + b > 73) { out.push(cur); cur = " " + ch; curB = 1 + b; } else { cur += ch; curB += b; }
    }
    out.push(cur); return out.join("\r\n");
  }
  function escIcs(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  function flotante(d) { return d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + "T" + p2(d.getHours()) + p2(d.getMinutes()) + "00"; }
  function utc(d) { return d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + "T" + p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + p2(d.getUTCSeconds()) + "Z"; }
  function proxima(dow, hh, mm) {
    var d = new Date(); d.setHours(hh, mm, 0, 0); var add = (dow - d.getDay() + 7) % 7; d.setDate(d.getDate() + add);
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 7); return d;
  }
  function construirIcs(o) {
    var C = R.cita, l1 = C.linea1[LANG], rnd = Math.random().toString(36).slice(2, 10), now = utc(new Date()), first = proxima(o.dow, o.hh, o.mm), L = [];
    L.push("BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NAOS//Rito prototipo//" + LANG.toUpperCase(), "CALSCALE:GREGORIAN", "METHOD:PUBLISH");
    function vev(n, d, desc, rrule) {
      var fin = new Date(d.getTime()); fin.setMinutes(fin.getMinutes() + 30);
      L.push("BEGIN:VEVENT", "UID:rito-" + rnd + "-" + n + "@naos", "DTSTAMP:" + now, "DTSTART:" + flotante(d), "DTEND:" + flotante(fin), "SUMMARY:" + escIcs(o.nombre), "DESCRIPTION:" + escIcs(desc));
      if (rrule) L.push("RRULE:FREQ=WEEKLY");
      L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + escIcs(l1), "TRIGGER:PT0M", "END:VALARM", "END:VEVENT");
    }
    if (o.fin) vev(0, first, l1, true);
    else for (var i = 0; i < 12; i++) {
      var d = new Date(first.getTime()); d.setDate(d.getDate() + 7 * i);
      var l2 = i === 11 ? C.ultima[LANG] + "\n" + C.renovar[LANG] : C.linea2[LANG].replace("{objeto}", R.objetos[LANG][i % 12]);
      vev(i + 1, d, l1 + "\n" + l2, false);
    }
    L.push("END:VCALENDAR");
    return L.map(plegar).join("\r\n") + "\r\n";
  }
  function bajarIcs(texto) {
    var blob = new Blob([texto], { type: "text/calendar;charset=utf-8" }), a = h("a", { href: URL.createObjectURL(blob), download: "mi-rato.ics", style: "display:none" });
    DOC.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 1000);
  }
  PANT.p8 = function () {
    ST.citaOfrecida = true; guardar();
    var P = R.puertas[S.puerta], atras = S.volver && S.volver !== "p8" ? S.volver : "p3";
    if (!P.cita) return marco({ id: "p8", paso: 0, fondo: "papel" }, [h("h1", { class: "frase", text: t("sinCitaSleep") }), h("div", { class: "fila" }, h("button", { class: "btn pri", type: "button", onclick: function () { go(atras); } }, t("cerrar")))]);
    S.cf = S.cf || { dow: ST.cita ? ST.cita.dow : R.cita.dow, hora: ST.cita ? p2(ST.cita.hh) + ":" + p2(ST.cita.mm) : p2(R.cita.hh) + ":" + p2(R.cita.mm), nombre: R.cita.evento[LANG], fin: ST.cita ? !!ST.cita.fin : false };
    var F = S.cf, estado = h("p", { class: "txt", role: "status", "aria-live": "polite" });
    var dias = t("dias").map(function (n, i) { return h("option", { value: String(i), selected: i === F.dow ? "" : null }, cap(n)); });
    var motivos = [1, 2, 3, 4, 5, 6].map(function (n) {
      return h("button", { class: "btn peq", type: "button", "aria-pressed": motivoActual() === n ? "true" : "false", "data-f": "m" + n, onclick: function () { ST.motivo = n; guardar(); suena(n); rr("m" + n); } }, String(n));
    });
    var cuerpo = [h("h1", { class: "frase", text: t("unRatoFijo") }),
      h("div", { class: "campo-t" }, h("label", { for: "dia" }, t("dia")), h("select", { id: "dia", onchange: function (e) { F.dow = +e.target.value; } }, dias)),
      h("div", { class: "campo-t" }, h("label", { for: "hora" }, t("hora")), h("input", { type: "time", id: "hora", value: F.hora, onchange: function (e) { F.hora = e.target.value; } }), h("p", { class: "nota", text: t("horaAyuda") })),
      h("div", { class: "campo-t" }, h("label", { for: "evt" }, t("evento")), h("input", { type: "text", id: "evt", maxlength: "40", value: F.nombre, oninput: function (e) { F.nombre = e.target.value; } })),
      h("div", { class: "campo-t", role: "group", "aria-labelledby": "snd" }, h("span", { class: "etq", id: "snd", text: t("sonido") }), h("div", { class: "chips" }, motivos), h("p", { class: "nota", text: t("sonidoAyuda") }), h("p", { class: "nota", text: t("sonidoAndroid") })),
      h("div", { class: "campo-t", role: "radiogroup", "aria-labelledby": "dur" }, h("span", { class: "etq", id: "dur", text: t("dura") }),
        h("div", { class: "fila" }, h("button", { class: "btn peq", type: "button", role: "radio", "aria-checked": F.fin ? "false" : "true", "data-f": "d12", onclick: function () { F.fin = false; rr("d12"); } }, t("doce")),
          h("button", { class: "btn peq", type: "button", role: "radio", "aria-checked": F.fin ? "true" : "false", "data-f": "dfin", onclick: function () { F.fin = true; rr("dfin"); } }, t("sinFin"))),
        F.fin ? h("p", { class: "nota", text: t("sinFinNota") }) : null),
      h("div", { class: "fila" },
        h("button", { class: "btn pri", type: "button", "data-f": "poner", onclick: function () {
          var hm = (F.hora || "17:30").split(":"), hh = +hm[0] || 17, mm = +hm[1] || 0;
          bajarIcs(construirIcs({ dow: F.dow, hh: hh, mm: mm, nombre: F.nombre.trim() || R.cita.evento[LANG], fin: F.fin }));
          ST.cita = { dow: F.dow, hh: hh, mm: mm, fin: F.fin }; guardar(); ev("cita");
          estado.textContent = t("citaLista") + " " + t("citaBorrar");
          if (!app.querySelector("[data-f=seguir]")) estado.parentNode.appendChild(h("button", { class: "btn pri", type: "button", "data-f": "seguir", onclick: function () { S.cf = null; go(atras); } }, t("seguir"))); } }, t("ponerCalendario")),
        h("button", { class: "btn", type: "button", onclick: function () { S.cf = null; go(atras); } }, t("noGracias2"))),
      estado];
    return marco({ id: "p8", paso: 0, fondo: "papel" }, cuerpo);
  };

  /* ================================================================= MI LUGAR */
  function interruptor(etq, clave, nota, inv) {
    var on = inv ? !ST[clave] : !!ST[clave];
    return h("div", { class: "sw" }, h("span", null, etq, nota ? h("small", { class: "nota", text: " " + nota }) : null),
      h("button", { class: "btn peq", type: "button", role: "switch", "aria-checked": on ? "true" : "false", "aria-label": etq + ": " + (on ? t("on") : t("off")), "data-f": "sw-" + clave, onclick: function () { ST[clave] = !ST[clave]; guardar(); rr("sw-" + clave); } }, on ? t("on") : t("off")));
  }
  PANT.lugar = function () {
    var estado = h("p", { class: "nota", role: "status", "aria-live": "polite" });
    var cuandos = ST.cuandos.length ? h("ul", { class: "reg" }, ST.cuandos.map(function (c, i) {
      return h("li", { style: "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0" }, h("span", { text: c }), h("button", { class: "btn peq", type: "button", "data-f": "q" + i, "aria-label": t("quitar") + ": " + c, onclick: function () { ST.cuandos.splice(i, 1); guardar(); rr("q" + i); } }, t("quitar")));
    })) : h("p", { class: "nota", text: t("ningunCuando") });
    var cita = ST.cita ? t("citaTexto", { d: cap(t("dias")[ST.cita.dow]), h: fh(new Date(2000, 0, 1, ST.cita.hh, ST.cita.mm)), e: R.cita.evento[LANG] }) + (ST.cita.fin ? " · " + t("sinFin") : " · " + t("doce")) : t("sinCita");
    var motivos = [1, 2, 3, 4, 5, 6].map(function (n) { return h("button", { class: "btn peq", type: "button", "aria-pressed": motivoActual() === n ? "true" : "false", "aria-label": t("motivo", { n: n }), "data-f": "mo" + n, onclick: function () { ST.motivo = n; guardar(); suena(n); rr("mo" + n); } }, String(n)); });
    var cuerpo = [h("h1", { class: "frase", text: t("lugarT") }), h("p", { class: "txt", text: t("lugarAyuda") }),
      h("section", { "aria-labelledby": "l1", class: "campo-t" }, h("h2", { class: "etq", id: "l1", text: t("misCuandos") }), cuandos),
      h("section", { "aria-labelledby": "l2", class: "campo-t" }, h("h2", { class: "etq", id: "l2", text: t("miCita") }), h("p", { class: "txt", text: cita }),
        h("div", { class: "fila" }, h("button", { class: "btn peq", type: "button", "data-f": "citac", onclick: function () { S.volver = "lugar"; S.cf = null; go("p8"); } }, t("cambiar")),
          ST.cita ? h("button", { class: "btn peq", type: "button", onclick: function () { ST.cita = null; guardar(); rr("citac"); } }, t("quitarCita")) : null)),
      interruptor(t("objetoSw"), "objeto"), interruptor(t("sonidoSw"), "sonido"),
      h("div", { class: "campo-t", role: "group", "aria-label": t("motivoSel") }, h("span", { class: "etq", text: t("motivoSel") }), h("div", { class: "chips" }, motivos)),
      interruptor(t("verTodosSw"), "verTodos", t("verTodosNota")), interruptor(t("noEnviarSw"), "enviar", "", true),
      interruptor(t("sinHuellaSw"), "sinhuella", t("sinHuellaNota")), interruptor(t("vistaSw"), "vista"),
      h("div", { class: "fila" }, h("button", { class: "btn peq", type: "button", onclick: function () { copiar(ST.cuandos.join("\n")).then(function (ok) { estado.textContent = ok ? t("copiado") : t("copiarFalla"); }); } }, t("copiarCuandos")),
        h("button", { class: "btn peq", type: "button", "data-f": "borrartodo", onclick: function () { borrarTodo(); EV = []; try { window.sessionStorage.removeItem("rito-ev"); } catch (e) { /* nada */ } S.cf = null; S.hechaVisita = false; estado.textContent = t("borrado"); rr("borrartodo"); } }, t("borrarTodo"))),
      estado,
      h("div", { style: "display:flex;flex-direction:column;align-items:flex-start" }, h("a", { class: "enlace", href: "#registro" }, t("registro")),
        h("a", { class: "enlace", href: "?" + (function () { var q = new URLSearchParams(location.search); q.set("dev", "1"); return q.toString(); })() + "#lugar" }, t("panelProto"))),
      h("button", { class: "btn", type: "button", "data-f": "atras", onclick: function () { go(S.prevRuta && S.prevRuta !== "lugar" ? S.prevRuta : "p2"); } }, t("volver"))];
    return marco({ id: "lugar", paso: 0, fondo: "papel" }, cuerpo);
  };

  /* ================================================================= CÓMO TE EMPUJA NAOS */
  PANT.registro = function () {
    var filas = EMP.map(function (r) {
      return h("li", null, h("div", { style: "display:flex;gap:10px;align-items:baseline;flex-wrap:wrap" }, h("span", { class: "idx", text: r.id }),
        h("span", { class: "etiq" + (r.estado === "activo" ? " a" : ""), text: t("est_" + r.estado) })),
        h("p", { class: "txt", lang: LANG, text: r[LANG] }),
        h("p", { class: "meta" }, h("span", null, h("b", { text: t("evidencia") + ": " }), t("ev_" + r.ev)), h("span", null, h("b", { text: t("mesa") + ": " }), t("me_" + r.mesa))));
    });
    var cuerpo = [h("h1", { class: "frase", text: t("regT") }), h("p", { class: "txt", text: t("regCab") }), h("p", { class: "nota", text: t("regProto") }), h("ul", { class: "reg" }, filas),
      h("button", { class: "btn", type: "button", "data-f": "atras", onclick: function () { go(S.prevRuta && S.prevRuta !== "registro" ? S.prevRuta : "p2"); } }, t("volver"))];
    return marco({ id: "registro", paso: 0, fondo: "papel" }, cuerpo);
  };

  /* ================================================================= PANEL DEL EQUIPO (?dev=1) */
  function setQ(k, v) { var q = new URLSearchParams(location.search); if (v == null) q.delete(k); else q.set(k, v); location.search = "?" + q.toString(); }
  function devPanel() {
    function opcion(k, vals, labels) {
      var cur = Q.get(k);
      return h("div", { class: "fila" }, vals.map(function (v, i) { return h("button", { class: "btn peq", type: "button", "aria-pressed": (cur === v || (v === null && cur === null)) ? "true" : "false", onclick: function () { setQ(k, v); } }, labels[i]); }));
    }
    var pantallas = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "lugar", "registro"].map(function (id) {
      var q = new URLSearchParams(location.search); if (id === "p4") q.set("de", "par");
      return h("a", { class: "btn peq", href: "?" + q.toString() + "#" + id, onclick: function () { if (id === "p7") { S.cierre = "solo"; S.borrada = false; S.deshecho = false; } } }, id);
    });
    var puertaSel = h("select", { "aria-label": t("devPuerta"), onchange: function (e) { setQ("puerta", e.target.value); } }, Object.keys(R.puertas).map(function (k) { return h("option", { value: k, selected: k === S.puerta ? "" : null }, DOORS[k]); }));
    var eventos = EV.length ? h("pre", { text: EV.map(function (x) { return x.t + " " + x.n + (x.v ? " " + x.v : ""); }).join("\n") }) : h("p", { class: "nota", text: t("devSin") });
    var estado = h("pre", { hidden: "", text: JSON.stringify(ST, null, 1) });
    var q2 = new URLSearchParams(location.search); q2.delete("dev");
    return h("div", { class: "dev" }, h("details", { open: "" }, h("summary", { text: t("devT") }),
      h("div", { class: "gr" }, h("span", { class: "etq", text: t("devPuerta") }), puertaSel,
        h("span", { class: "etq", text: t("devHora") }), opcion("hora", [null, "0800", "1730", "2330"], [t("devReal"), "08:00", "17:30", "23:30"]),
        h("span", { class: "etq", text: t("devHueco") }), opcion("hueco", [null, "0", "3", "9", "25"], [t("devReal"), "0", "3", "9", "25"]),
        h("span", { class: "etq", text: t("devPrimera") + " / " + t("devCerca") }),
        h("div", { class: "fila" }, h("button", { class: "btn peq", type: "button", "aria-pressed": Q.get("primera") === "1" ? "true" : "false", onclick: function () { setQ("primera", Q.get("primera") === "1" ? null : "1"); } }, t("devPrimera")),
          h("button", { class: "btn peq", type: "button", "aria-pressed": Q.get("cerca") === "1" ? "true" : "false", onclick: function () { setQ("cerca", Q.get("cerca") === "1" ? null : "1"); } }, t("devCerca"))),
        h("span", { class: "etq", text: t("devCompartir") }), opcion("compartir", [null, "elegir", "cancelar", "nodisp"], [t("devReal"), t("devElegir"), t("devCancelar"), t("devNoDisp")]),
        h("div", { class: "fila" }, h("button", { class: "btn peq", type: "button", "aria-pressed": Q.has("quieto") ? "true" : "false", onclick: function () { setQ("quieto", Q.has("quieto") ? null : "1"); } }, t("devQuieto")),
          h("button", { class: "btn peq", type: "button", onclick: function () { estado.hidden = !estado.hidden; } }, t("devEstado"))), estado,
        h("span", { class: "etq", text: t("devPantallas") }), h("div", { class: "chips" }, pantallas),
        h("span", { class: "etq", text: t("devEventos") }), eventos,
        h("a", { class: "enlace", href: "?" + q2.toString() + location.hash }, "dev=0"))));
  }

  /* ================================================================= ARRANQUE */
  function medirCinta() { var c = DOC.querySelector(".cinta"); if (c) HTML.style.setProperty("--cinta", c.offsetHeight + "px"); }
  function arrancar() {
    app = DOC.getElementById("app"); vivoEl = DOC.getElementById("vivo");
    var salto = DOC.getElementById("salto");
    if (salto) salto.addEventListener("click", function () { var h1 = app.querySelector("h1"); if (h1) h1.focus(); else app.focus(); });
    medirCinta(); window.addEventListener("resize", medirCinta);
    window.addEventListener("hashchange", function () { if (ruta()) { S.foco = null; render(); } });
    if (!ruta()) history.replaceState(null, "", location.pathname + location.search + "#" + inicial());
    if (ruta() === "p4" && Q.get("de") !== "par") { /* ruta p4 sin enlace: se arma uno de muestra */ }
    if (ruta() !== "p1") ev("abre");
    render();
  }
  if (DOC.readyState === "loading") DOC.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})();
