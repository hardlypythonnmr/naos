/* NAOS · la casa vista desde arriba (prototipo, no publicado). Sin red, sin librerías. */
(function () {
  "use strict";
  var D = window.CASA, P = D.P, INK = "#0E1116", PAPEL = "#F4F6F8", NOCHE = "#141A4A";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tactil = !window.matchMedia("(hover: hover)").matches;
  var q = new URLSearchParams(location.search);
  var estado = { piso: q.get("piso") === "ar" ? "ar" : "ab", patio: q.get("patio") === "b" ? "b" : "a", sel: null };

  /* ---------- piezas de dibujo ---------- */
  function R(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '" ' + (extra || "") + "/>"; }
  function C(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" ' + (extra || "") + "/>"; }
  function T(x, y, cls, txt, fill) { return '<text x="' + x + '" y="' + y + '" class="' + cls + '" fill="' + fill + '">' + txt + "</text>"; }

  /* figura plana simple: cabeza y cuerpo, sin rasgos. Mismo estilo de Cella: plana, dos tonos. */
  function persona(cx, base, s, cuerpo, clase, brazos) {
    var arm = function (lado) {
      var x = lado === "L" ? -34 : 22;
      return '<g class="arm arm' + lado + '">' + R(x, -64, 12, 48, cuerpo, 'rx="6" stroke="' + INK + '" stroke-width="3"') + "</g>";
    };
    return '<g transform="translate(' + cx + " " + base + ") scale(" + s + ')"><g class="' + (clase || "") + '">' +
      (brazos === false ? "" : arm("L") + arm("R")) +
      '<path d="M-24 0 L-24 -40 Q-24 -68 0 -68 Q24 -68 24 -40 L24 0 Z" fill="' + cuerpo + '" stroke="' + INK + '" stroke-width="3"/>' +
      C(0, -90, 17, cuerpo, 'stroke="' + INK + '" stroke-width="3"') + "</g></g>";
  }

  function cuarto(key, x, y, w, h, pal, dentro, nombre, sub, lx, ly) {
    var p = P[pal];
    return '<g class="room" data-room="' + key + '">' + R(x, y, w, h, p.campo, 'class="fl" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"') +
      dentro + T(lx, ly, "lbl", nombre, p.tinta) + T(lx, ly + 22, "sub", sub, p.tinta) + "</g>";
  }
  function galeria(x, y, w, h, hor, rotulo) {
    var s = R(x, y, w, h, "#ECEFF3", 'stroke="' + INK + '" stroke-width="6"'), i;
    if (hor) for (i = 0; i < 4; i++) s += C(x + 60 + i * 80, y + 22, 8, INK);
    else for (i = 0; i < 4; i++) s += C(x + (x < 300 ? w - 22 : 22), y + 36 + i * 80, 8, INK);
    if (rotulo) s += T(x + w / 2, y + (hor ? h / 2 + 24 : h / 2), "sub c", "Corridor", INK);
    return '<g class="gal" aria-hidden="true">' + s + "</g>";
  }

  var SALA = {
    cocina: function () {
      var p = P.cocina;
      return R(52, 52, 336, 40, p.placa, 'stroke="' + INK + '" stroke-width="3"') +
        C(100, 72, 11, INK) + C(145, 72, 22, INK) + C(145, 72, 14, p.placa) + C(196, 72, 11, INK) +
        '<g class="reveal" fill="none" stroke="' + p.luz + '" stroke-width="5" stroke-linecap="round"><circle cx="145" cy="72" r="32"/><circle cx="145" cy="72" r="43" stroke-dasharray="6 9"/>' +
        '<path d="M120 112 q8 -12 0 -24 M145 118 q8 -12 0 -24 M170 112 q8 -12 0 -24"/></g>' +
        R(318, 120, 54, 70, p.placa, 'rx="6" stroke="' + INK + '" stroke-width="3"') + C(345, 155, 16, p.luz, 'stroke="' + INK + '" stroke-width="3"') +
        '<g id="cella-g"></g>';
    },
    escaleras: function (arr) {
      var p = P.escaleras, s = "", i;
      for (i = 0; i < 8; i++) s += R(520 + i * 26, 58, 22, 150, i % 2 ? p.campo : p.placa, 'stroke="' + INK + '" stroke-width="2"');
      s += '<path d="M' + (arr ? "700 100 l26 0 m-10 -14 l10 14 l-10 14" : "548 100 l-26 0 m10 -14 l-10 14 l10 14") + '" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>';
      s += C(450, 92, 24, p.placa, 'stroke="' + INK + '" stroke-width="3"') + C(450, 92, 14, p.campo, "") +
        '<g class="reveal" fill="' + p.luz + '" stroke="' + INK + '" stroke-width="2"><circle cx="444" cy="88" r="6"/><circle cx="458" cy="96" r="6"/><circle cx="450" cy="100" r="6"/></g>';
      s += '<g class="walk">' + persona(540, 224, .8, p.luz, "paso") + "</g>";
      return s;
    },
    alcoba: function () {
      var p = P.alcoba;
      return R(60, 140, 176, 80, p.placa, 'rx="6" stroke="' + INK + '" stroke-width="3"') + R(72, 150, 54, 34, "#FFFFFF", 'rx="8" stroke="' + INK + '" stroke-width="2"') +
        R(128, 168, 108, 52, "#8E99DE", 'stroke="' + INK + '" stroke-width="2"') +
        R(250, 150, 40, 40, p.placa, 'stroke="' + INK + '" stroke-width="3"') +
        '<g class="lampcono">' + C(270, 170, 64, p.luz, 'opacity=".45"') + "</g>" + C(270, 170, 12, p.luz, 'stroke="' + INK + '" stroke-width="3"') +
        persona(342, 226, .8, INK, "sway");
    },
    mesa: function () {
      var p = P.mesa;
      return persona(206, 700, .8, p.agua, "sway", true) +
        R(86, 664, 244, 68, p.placa, 'rx="8" stroke="' + INK + '" stroke-width="3"') +
        C(130, 698, 11, p.campo, 'stroke="' + INK + '" stroke-width="2"') + C(206, 698, 11, p.campo, 'stroke="' + INK + '" stroke-width="2"') + C(282, 698, 11, p.campo, 'stroke="' + INK + '" stroke-width="2"') +
        '<g class="reveal">' + C(168, 680, 7, p.luz, 'stroke="' + INK + '" stroke-width="2"') + C(244, 680, 7, p.luz, 'stroke="' + INK + '" stroke-width="2"') + "</g>" +
        R(340, 620, 40, 40, p.placa, 'rx="20" stroke="' + INK + '" stroke-width="3"');
    },
    puerta: function () {
      var p = P.puerta;
      return R(560, 756, 80, 10, p.placa, 'stroke="none"') + R(566, 704, 64, 40, p.placa, 'rx="4" stroke="' + INK + '" stroke-width="2"') +
        '<g class="reveal"><path d="M560 760 L640 760 L700 640 L560 640 Z" fill="' + p.luz + '" opacity=".5"/></g>' +
        '<path d="M640 760 L650 684" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/>' +
        R(716, 604, 32, 14, p.placa, 'stroke="' + INK + '" stroke-width="2"') + C(724, 626, 5, INK) + C(740, 626, 5, INK);
    }
  };

  function estrellas(x0, y0, x1, y1, n) {
    var s = "", i, a = 7;
    for (i = 0; i < n; i++) { a = (a * 9301 + 49297) % 233280; var X = x0 + a / 233280 * (x1 - x0); a = (a * 9301 + 49297) % 233280; var Y = y0 + a / 233280 * (y1 - y0); s += C(X.toFixed(0), Y.toFixed(0), i % 4 ? 2 : 3.2, PAPEL, 'opacity="' + (i % 3 ? ".5" : ".9") + '"'); }
    return s;
  }

  function patioSVG(patio) {
    var s = '<g class="room" data-room="patio">' + R(240, 240, 320, 320, NOCHE, 'class="fl" stroke="' + INK + '" stroke-width="6"');
    if (patio === "a") {
      s += estrellas(256, 256, 544, 544, 22) +
        '<g fill="none" stroke="' + PAPEL + '" stroke-width="2" stroke-dasharray="3 8" opacity=".35"><path d="M400 400 L400 244 M400 400 L400 556 M400 400 L244 400 M400 400 L556 400"/></g>' +
        '<g class="halo">' + C(400, 400, 96, PAPEL, 'opacity=".07"') + C(400, 400, 58, PAPEL, 'opacity=".12"') + "</g>" + C(400, 400, 13, PAPEL, 'class="corazon"');
      s += T(400, 534, "lbl c", "Courtyard", PAPEL) + T(400, 300, "sub c", "The divine", PAPEL);
    } else {
      s += estrellas(250, 250, 550, 550, 18) + R(276, 276, 248, 248, "#F6E9DD", 'rx="10" stroke="' + INK + '" stroke-width="3"');
      s += persona(332, 410, .62, P.mesa.agua, "sway") + persona(468, 410, .62, P.mesa.luz, "sway2");
      s += C(400, 418, 52, P.mesa.campo, 'stroke="' + INK + '" stroke-width="4"') + C(400, 418, 30, "#F4B9C1", 'stroke="' + INK + '" stroke-width="2"') +
        C(400, 358, 12, P.mesa.placa, 'stroke="' + INK + '" stroke-width="3"') + C(400, 478, 12, P.mesa.placa, 'stroke="' + INK + '" stroke-width="3"');
      s += '<g class="reveal">' + C(400, 418, 64, "none", 'stroke="' + P.mesa.luz + '" stroke-width="5" stroke-dasharray="6 9"') + "</g>";
      s += T(400, 512, "lbl c", "Table + sky", INK) + T(400, 300, "sub c", "Gather", INK);
    }
    return s + "</g>";
  }

  function ventanas(patio) {
    var s = '<g class="room ventanas" data-room="ventana"><rect x="244" y="212" width="312" height="30" fill="transparent"/>', i, x;
    for (i = 0; i < 4; i++) {
      x = 262 + i * 70;
      s += R(x, 224, 46, 16, NOCHE, 'stroke="' + INK + '" stroke-width="3" class="pane"') + R(x + 4, 228, 38, 3, PAPEL, 'opacity=".7"');
      if (!(patio === "b" && x < 400)) s += R(x, 560, 46, 16, NOCHE, 'stroke="' + INK + '" stroke-width="3" class="pane"') + R(x + 4, 564, 38, 3, PAPEL, 'opacity=".7"');
    }
    return s + "</g>";
  }

  function planoSVG() {
    var ab = estado.piso === "ab", pa = estado.patio, s = "";
    s += R(8, 8, 784, 784, "#F4F6F8", 'rx="22"');
    if (ab) {
      s += cuarto("cocina", 40, 40, 360, 200, "cocina", SALA.cocina(), "Kitchen", "Eat", 58, 140);
      s += cuarto("escaleras", 400, 40, 360, 200, "escaleras", SALA.escaleras(true), "Stairs", "Move", 416, 150);
      s += pa === "a" ? cuarto("mesa", 40, 560, 360, 200, "mesa", SALA.mesa(), "Table", "Gather", 58, 604) : galeria(40, 560, 360, 200, true, 1);
      s += cuarto("puerta", 400, 560, 360, 200, "puerta", SALA.puerta(), "Door", "Arrive", 416, 604);
      s += galeria(40, 240, 200, 320, false, 1) + galeria(560, 240, 200, 320, false, 1);
    } else {
      s += cuarto("alcoba", 40, 40, 360, 200, "alcoba", SALA.alcoba(), "Bedroom", "Sleep", 58, 100);
      s += cuarto("escaleras", 400, 40, 360, 200, "escaleras", SALA.escaleras(false), "Stairs", "Move", 416, 150);
      s += galeria(40, 560, 360, 200, true, 1) + galeria(400, 560, 360, 200, true, 1) + galeria(40, 240, 200, 320, false, 1) + galeria(560, 240, 200, 320, false, 1);
    }
    s += patioSVG(pa) + ventanas(ab ? pa : "a");
    return s;
  }

  /* ---------- datos de cuarto ---------- */
  function datos(key) {
    if (key === "patio") return estado.patio === "b" ? D.patioB : D.cuartos.patio;
    if (key === "mesa" && estado.patio === "b") return D.patioB;
    return D.cuartos[key];
  }
  function clave(key) { return key === "mesa" && estado.patio === "b" ? "patio" : key; }
  function ordenPiso() {
    var l = estado.piso === "ab" ? ["cocina", "escaleras"].concat(estado.patio === "a" ? ["mesa"] : [], ["puerta", "patio", "ventana"]) : ["alcoba", "escaleras", "patio", "ventana"];
    return l;
  }
  function palDe(key) { return P[datos(key).pal]; }

  /* ---------- plano, lista, vista previa ---------- */
  var plano = $("#plano"), vista = $("#vista"), lista = $("#lista");

  function pintar() {
    plano.innerHTML = planoSVG();
    $$(".room", plano).forEach(function (g) {
      var k = g.getAttribute("data-room");
      g.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") preview(k, false); });
      g.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && !estado.fijo) preview(null); });
      g.addEventListener("click", function (e) {
        if (tactil || e.pointerType === "touch" || e.pointerType === "pen") { estado.fijo = true; preview(k, true); }
        else { location.hash = "#/" + k; }
      });
    });
    $$("[data-piso]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-piso") === estado.piso)); });
    $$("[data-patio]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-patio") === estado.patio)); });
    plano.classList.toggle("arriba", estado.piso === "ar");
    pintarLista();
    arrancaCella();
    if (estado.sel) preview(estado.sel, estado.fijo); else preview(null);
  }

  function pintarLista() {
    var h = "";
    ordenPiso().forEach(function (k) {
      var d = datos(k), p = P[d.pal];
      h += '<li><a href="#/' + k + '" data-room="' + k + '" style="--chip:' + p.campo + ';--chipt:' + p.tinta + '"><span class="chip" aria-hidden="true"></span>' +
        '<span class="t"><span class="n">' + d.nombre + (k === "patio" ? "" : "") + '</span><span class="w">' + d.palabra + " · " + d.biblioteca.length + " behaviors</span></span></a></li>";
    });
    lista.innerHTML = h;
    $$("a", lista).forEach(function (a) {
      var k = a.getAttribute("data-room");
      a.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") preview(k, false); });
      a.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && !estado.fijo) preview(null); });
      a.addEventListener("focus", function () { preview(k, false); });
    });
  }

  function preview(k, fijo) {
    estado.sel = k;
    $$(".room", plano).forEach(function (g) { g.classList.toggle("on", g.getAttribute("data-room") === k); });
    plano.classList.toggle("hay", !!k);
    $$("a", lista).forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-room") === k); });
    if (!k) { estado.fijo = false; vista.classList.remove("abierta"); vista.innerHTML = '<p class="v-vacio">Pasa el cursor por un cuarto, o usa Tab. Un cuarto muestra una palabra y una línea.</p>'; return; }
    var d = datos(k), p = P[d.pal];
    vista.classList.add("abierta");
    vista.style.setProperty("--campo", p.campo); vista.style.setProperty("--tinta", p.tinta);
    vista.innerHTML = '<div class="v-in"><img src="media/' + d.poster + '.jpg" alt="" width="360" height="640" loading="eager">' +
      '<div class="v-txt"><p class="v-palabra">' + d.palabra + '</p><p class="v-linea">' + d.linea + "</p>" +
      '<div class="v-btns"><a class="btn" href="#/' + k + '">Entrar</a><button type="button" class="btn2" data-cerrar>Cerrar</button></div></div></div>';
    $("[data-cerrar]", vista).addEventListener("click", function () { estado.fijo = false; preview(null); });
  }

  /* ---------- Cella (reusa cella-brazos.js) ---------- */
  var cellaTimer = null, t0 = 0;
  function dibujaCella(t) {
    var g = $("#cella-g"); if (!g || !window.NAOS_BRAZOS) return;
    var p = { tx: P.cocina.tinta, bg: P.cocina.campo };
    var b = quieto ? 0.4 : 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 8);
    var c = t % 12, izq = quieto ? 30 : NAOS_BRAZOS.gesto(c, { t0: 2, t1: 5.5, a: 44, a2: 26 }), der = quieto ? 0 : NAOS_BRAZOS.gesto(c, { t0: 6.5, t1: 9, a: 22 });
    g.innerHTML = NAOS_BRAZOS.cella({ cx: 250, base: 228, s: .72, p: p, b: b, izq: izq, der: der, abre: quieto ? 1 : (izq > 1 || der > 1 ? 1 : 0), id: "ce" });
  }
  function arrancaCella() {
    if (cellaTimer) { clearInterval(cellaTimer); cellaTimer = null; }
    if (!$("#cella-g")) return;
    t0 = performance.now();
    dibujaCella(2.5);
    if (!quieto) cellaTimer = setInterval(function () { dibujaCella((performance.now() - t0) / 1000); }, 90);
  }

  /* ---------- páginas de cuarto ---------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function fila(it) {
    var img = "media/" + it.id;
    if (it.tipo === "video") {
      return '<article class="item"><div class="media"><video controls preload="none" playsinline poster="' + img + '.jpg" src="' + img + '.mp4" aria-label="Short: ' + esc(it.titulo) + '"></video></div>' +
        '<h3>' + esc(it.titulo) + '</h3><p class="tarj">' + esc(it.tarjeta) + "</p></article>";
    }
    return '<article class="item"><div class="media"><img src="' + img + '.jpg" alt="Card: ' + esc(it.tarjeta) + '" loading="lazy"></div><h3>' + esc(it.titulo) + '</h3><p class="tarj">Card</p></article>';
  }
  function pisoDe(d) { return d.pisos.length === 2 ? "Downstairs and upstairs" : d.pisos[0] === "ab" ? "Downstairs" : "Upstairs"; }

  function paginaCuarto(k) {
    var d = datos(k), p = P[d.pal], esP = clave(k) === "patio", volver = esP ? "" : '<a class="vol" href="#/patio">Back to the courtyard</a>';
    var conducta = d.conducta ? "<p>" + esc(d.conducta) + "</p>" : "";
    var otros = ordenPiso().filter(function (x) { return x !== k; }).map(function (x) { return '<li><a href="#/' + x + '">' + datos(x).nombre + " · " + datos(x).palabra + "</a></li>"; }).join("");
    var h = '<div class="hero" style="--campo:' + p.campo + ";--tinta:" + p.tinta + '"><div class="cont">' +
      '<p class="vol-fila"><a class="vol" href="#/">Back to the house</a>' + volver + "</p>" +
      '<p class="kicker">' + d.nombre + " · " + pisoDe(d) + " · " + d.palabra + "</p>" +
      '<h1 id="h-cuarto" tabindex="-1"><mark class="n">[N: frase que define el cuarto, en primera persona]</mark></h1></div></div>' +
      '<div class="cont cuerpo"><section class="intro" aria-label="Intro"><p>' + esc(d.que) + "</p><p>" + esc(d.relacion) + "</p>" + conducta + "<p>" + esc(d.invitacion) + "</p>" +
      (k === "ventana" ? "" : '<p class="ventana-enl">The window of this room: <a href="#/ventana">the divine</a></p>') +
      '<p class="nfrase"><mark class="n">[N: la frase que define a NAOS]</mark></p>' +
      '<p class="borr">Borrador del equipo. Máximo 60 palabras. N reescribe.</p>' +
      '<button type="button" class="btn grande" id="ir-bib">See the behaviors of this room</button></section>' +
      '<section id="biblioteca" aria-labelledby="h-bib"><h2 id="h-bib">Behaviors</h2><p class="sub2">Short, then card: when ___, I ___.</p><div class="rejilla">' + d.biblioteca.map(fila).join("") + "</div>" +
      (d.faltan ? '<p class="faltan">' + d.faltan + "</p>" : "") + "</section>" +
      '<section class="yt" aria-labelledby="h-yt"><h2 id="h-yt">Go deeper</h2><p>Mediums and longs on YouTube: the science and the traditions behind these behaviors.</p>' +
      '<a class="btn grande" href="' + D.yt + '" target="_blank" rel="noopener">Watch on YouTube</a></section>' +
      '<nav class="otros" aria-label="Other rooms"><h2>Other rooms</h2><ul>' + otros + "</ul></nav></div>";
    return h;
  }

  /* ---------- rutas ---------- */
  function ruta() {
    var m = /^#\/([a-z]+)$/.exec(location.hash), k = m && (D.cuartos[m[1]] ? m[1] : null);
    var casa = $("#vista-casa"), cu = $("#vista-cuarto");
    if (!k) { cu.hidden = true; casa.hidden = false; document.title = "NAOS · the house (prototype)"; return; }
    var cl = clave(k);
    if (cl !== k) { location.replace("#/" + cl); return; }
    casa.hidden = true; cu.hidden = false; cu.innerHTML = paginaCuarto(k);
    document.title = datos(k).nombre + " · NAOS (prototype)";
    $("#ir-bib").addEventListener("click", function () { var b = $("#biblioteca"); b.scrollIntoView({ behavior: quieto ? "auto" : "smooth" }); });
    window.scrollTo(0, 0);
    var h = $("#h-cuarto"); if (h) h.focus({ preventScroll: true });
  }

  /* ---------- controles ---------- */
  function ponUrl() {
    var u = new URL(location.href); u.searchParams.set("piso", estado.piso); u.searchParams.set("patio", estado.patio);
    try { history.replaceState(null, "", u.toString()); } catch (e) {}
  }
  $$("[data-piso]").forEach(function (b) { b.addEventListener("click", function () { estado.piso = b.getAttribute("data-piso"); estado.sel = null; pintar(); ponUrl(); }); });
  $$("[data-patio]").forEach(function (b) { b.addEventListener("click", function () { estado.patio = b.getAttribute("data-patio"); pintar(); ponUrl(); if (!$("#vista-cuarto").hidden) ruta(); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && estado.sel) { var s = estado.sel; estado.fijo = false; preview(null); var a = $('#lista a[data-room="' + s + '"]'); if (a && document.activeElement === a) a.blur(); } });
  window.addEventListener("hashchange", ruta);

  pintar(); ruta();
})();
