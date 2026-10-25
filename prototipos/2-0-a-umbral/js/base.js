/* base.js · utilidades, estado en memoria, "Tu cuarto" (localStorage con try/catch), Cella y el enrutador por ancla.
 * Nada sale del aparato: no hay ninguna petición de red en todo el prototipo. */
(function (raiz) {
  "use strict";
  var D = raiz.NAOS_DATOS, TX = raiz.NAOS_TEXTOS, S = raiz.NAOS_SENAL;
  var params = new URLSearchParams(location.search);
  var LANG = document.documentElement.lang === "es" ? "es" : "en";
  var BASE = document.documentElement.getAttribute("data-base") || "";
  var F = D.FICHA;

  // ---- fechas ----
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hoyAparato() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function esIso(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || "") && !isNaN(Date.parse(s + "T12:00:00Z")); }
  function diasEntre(a, b) { return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5); }

  // ---- texto ----
  function t(k, v) {
    var s = TX[LANG][k];
    if (s == null) s = TX.es[k];
    if (typeof s === "string" && v) Object.keys(v).forEach(function (n) { s = s.split("{" + n + "}").join(v[n]); });
    return s;
  }

  // ---- DOM ----
  // h("div", {class:"x", on:{click:fn}, aria:{label:"y"}}, hijo, "texto", ...)
  function h(tag, a) {
    var el = document.createElement(tag), i, k;
    a = a || {};
    for (k in a) {
      var v = a[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "on") for (var ev in v) el.addEventListener(ev, v[ev]);
      else if (k === "aria") for (var an in v) el.setAttribute("aria-" + an, v[an]);
      else if (k === "texto") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "value") el.value = v;
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, v);
    }
    for (i = 2; i < arguments.length; i++) anexar(el, arguments[i]);
    return el;
  }
  function anexar(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { anexar(el, x); });
    else el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  var CHECK = '<svg class="ok" viewBox="0 0 18 18" aria-hidden="true" focusable="false"><path d="M3 9.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function check() { var s = document.createElement("span"); s.innerHTML = CHECK; return s.firstChild; }
  function vivo(msg) { var e = document.getElementById("vivo"); if (!e) return; e.textContent = ""; if (msg) setTimeout(function () { e.textContent = msg; }, 30); }

  // ---- movimiento ----
  function quieto() { return document.documentElement.classList.contains("quieto") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }

  // ---- estado en memoria (A.3). Solo "Tu cuarto" se guarda, y solo si el navegador deja. ----
  function nuevoEstado() {
    return {
      lang: LANG, src: params.get("src") || F.id, hoy: esIso(params.get("hoy")) ? params.get("hoy") : hoyAparato(),
      cuando: { texto: "", chip: null, tipo: null }, cuarto: null, fuerza: "con-lugar", portador: F.portador_por_tipo.lugar,
      palabra: F.palabra_etiqueta[LANG], casillas: { preguntas_7_28: false, incluir_frase: false, franja: null },
      plan_b: "", listo: false, seguridad: null,
      // auxiliares del prototipo
      donde: null, gate: "pendiente", avisoDebilMostrado: false, yaFui: false, propio: false
    };
  }
  var st = nuevoEstado();
  function reiniciar() {
    var hoy = st.hoy, src = st.src, nuevo = nuevoEstado();
    Object.keys(st).forEach(function (k) { delete st[k]; });
    Object.assign(st, nuevo); st.hoy = hoy; st.src = src;
  }

  // "Tu cuarto": señales y registro de un toque, en el aparato (A.4 P6, 3.6 cuarto.js)
  var KEY = "naos-v6-senales";
  var almacen = {
    leer: function () { try { var r = localStorage.getItem(KEY); var o = r ? JSON.parse(r) : null; return o && Array.isArray(o.senales) ? o : null; } catch (e) { return null; } },
    escribir: function (o) { try { localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch (e) { return false; } },
    borrar: function () { try { localStorage.removeItem(KEY); } catch (e) { /* sin almacenamiento: la página funciona igual */ } }
  };
  function idSenal(c, p) { var x = (c + "|" + p), n = 5381; for (var i = 0; i < x.length; i++) n = ((n << 5) + n + x.charCodeAt(i)) | 0; return (n >>> 0).toString(36); }
  function guardarCuarto() {
    var g = almacen.leer() || { v: 1, senales: [] };
    var id = idSenal(st.cuando.texto, st.palabra), s = g.senales.filter(function (x) { return x.id === id; })[0];
    var datos = { id: id, cuando: st.cuando.texto, cuarto: st.cuarto, palabra: st.palabra, fuerza: st.fuerza, tipo: st.cuando.tipo, plan_b: st.plan_b, creada: st.hoy, lang: LANG };
    if (s) { for (var k in datos) s[k] = datos[k]; } else { datos.veces = 0; datos.estado = "puesta"; g.senales.push(datos); }
    g.visto = st.hoy;
    return almacen.escribir(g);
  }
  function ejemploCuarto() {
    var es = LANG === "es", hoy = st.hoy;
    var d = S.sumarDias(hoy, -9);
    almacen.escribir({ v: 1, visto: d, senales: [{ id: "ejemplo", cuando: es ? "cierro la llave" : "the water stops", cuarto: "bano", palabra: es ? "lámpara" : "lamp",
      fuerza: "con-lugar", tipo: "lugar", plan_b: "", creada: d, veces: 3, estado: "puesta", lang: LANG, ejemplo: true }] });
  }

  // ---- Cella: el cuerpo de assets/marca/cella.svg y el brazo de D-275 (cella-brazos.js), sin dibujo nuevo ----
  var ARM = "M-11 0 L-9 100 A9 9 0 0 0 9 100 L11 0 A11 11 0 0 0 -11 0 Z", cid = 0;
  // o = { brazo: grados (0 a 66), lado: "izq"|"der", ojos: bool }
  function cella(o) {
    o = o || {}; cid++;
    var id = "cm" + cid, ang = Math.min(66, o.brazo || 0), lado = o.lado || "der";
    var piv = lado === "izq" ? [77, 96] : [163, 96], giro = lado === "izq" ? ang : -ang;
    var ojos = o.ojos
      ? '<circle cx="92" cy="108" r="6.4" fill="#000"/><circle cx="120" cy="108" r="6.4" fill="#000"/>'
      : '<path d="M84.20 107.00 Q92.00 115.20 99.80 107.00" fill="none" stroke="#000" stroke-width="5.40" stroke-linecap="round"/><path d="M112.20 107.00 Q120.00 115.20 127.80 107.00" fill="none" stroke="#000" stroke-width="5.40" stroke-linecap="round"/>';
    var arm = ang > 0.05 ? '<path transform="translate(' + piv[0] + " " + piv[1] + ") rotate(" + giro.toFixed(2) + ')" d="' + ARM + '" fill="currentColor"/>' : "";
    var wrap = document.createElement("span");
    wrap.innerHTML = '<svg viewBox="54 62 132 162" width="132" height="162" role="img" aria-label="Cella"><title>NAOS · Cella</title><mask id="' + id + '"><rect x="0" y="0" width="240" height="240" fill="#fff"/>' + ojos + "</mask>" + arm +
      '<path d="M66 212 V90.00 Q66 74.00 82.00 74.00 H158.00 Q174 74.00 174 90.00 V212 H146 V152 H120 V212 Z" fill="currentColor" mask="url(#' + id + ')"/></svg>';
    var svg = wrap.firstChild;
    if (ang > 0.05) svg.classList.add("con-brazo", lado);
    return svg;
  }

  // ---- el enrutador por ancla ----
  var N = { h: h, t: t, S: S, D: D, F: F, LANG: LANG, BASE: BASE, params: params, estado: st, pad: pad, esIso: esIso, diasEntre: diasEntre, hoyAparato: hoyAparato,
    almacen: almacen, guardarCuarto: guardarCuarto, ejemploCuarto: ejemploCuarto, cella: cella, check: check, vivo: vivo, quieto: quieto, reiniciar: reiniciar,
    pantallas: {}, limpiar: null, campo: { activo: params.get("campo") === "1", tiempos: [], respuestas: [] }, KEY: KEY };

  N.go = function (id, opts) {
    var d = "#" + id;
    if (location.hash === d) { N.render(); return; }
    if (opts && opts.reemplazar) history.replaceState(null, "", location.pathname + location.search + d);
    else location.hash = d;
    if (opts && opts.reemplazar) N.render();
  };
  N.ruta = function () {
    var hash = location.hash || "", id = hash.replace(/^#/, "").split(/[&?]/)[0], cola = hash.replace(/^#[^&?]*/, "");
    if (/^s=/.test(id)) { id = "p5"; cola = "&" + hash.slice(1); }
    if (!id && params.get("q")) id = "p5";
    return { id: id, cola: cola };
  };
  N.salir = function () { N.go("hoy"); };

  var tPantalla = 0, idPantalla = null;
  N.render = function () {
    var r = N.ruta(), id = r.id;
    // la primera visita con algo guardado empieza en "¿Sigue puesta?" (menos de 28 días); sin ancla ni cita
    if (!id) {
      var g = almacen.leer();
      var edad = g && g.senales.length ? diasEntre(g.senales[g.senales.length - 1].creada, st.hoy) : -1;
      id = edad >= 0 && edad < 28 ? "p6" : "p1a";
    }
    if (!N.pantallas[id]) id = "p1a";
    // campo: tiempo en la pantalla que se deja
    if (N.campo.activo && idPantalla) N.campo.tiempos.push({ id: idPantalla, ms: Math.round(performance.now() - tPantalla) });
    if (N.limpiar) { try { N.limpiar(); } catch (e) { /* nada */ } N.limpiar = null; }
    var app = document.getElementById("app");
    app.textContent = "";
    var res = N.pantallas[id](r.cola);
    app.appendChild(res.nodo);
    if (res.limpiar) N.limpiar = res.limpiar;
    document.title = (res.titulo ? res.titulo + " · " : "") + t("titulo");
    document.body.classList.remove("teclado");
    idPantalla = id; tPantalla = performance.now();
    document.documentElement.setAttribute("data-pantalla", id);
    var panel = document.getElementById("panel");
    if (panel && !panel.hidden) N.cerrarPanel && N.cerrarPanel(true);
    if (N.primera) {
      window.scrollTo(0, 0);
      var f = res.foco || app.querySelector("h1");
      if (f) { if (!f.hasAttribute("tabindex")) f.setAttribute("tabindex", "-1"); try { f.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
    }
    N.primera = true;
  };
  raiz.NAOS_APP = N;
})(window);
