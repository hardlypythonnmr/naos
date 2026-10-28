/* NAOS · la casa (prototipo v3, no publicado): un solo piso alrededor del patio, balcones colombianos, zoom por cuarto.
 * Sin red, sin librerías. El SVG se anima cambiando su viewBox (cuadro a cuadro, sin saltos si hay movimiento). */
(function () {
  "use strict";
  if (window.NAOS_GAGS) window.NAOS_GAGS.instala();
  var D = window.CASA, P = D.P, INK = "#0E1116", PAPEL = "#F4F6F8";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var quieto = mq.matches;
  if (mq.addEventListener) mq.addEventListener("change", function () { quieto = mq.matches; });

  /* ---------- piezas de dibujo ---------- */
  /* En esta casa todos son Cellas (js/gags.js dibuja a cada una y su gag) y las cosas se adaptan a su morfología: bajas, anchas, cuadradas. */
  var G = window.NAOS_GAGS;
  function R(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '" ' + (extra || "") + "/>"; }
  function C(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" ' + (extra || "") + "/>"; }
  function E(x, y, rx, ry, fill, extra) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" ' + (extra || "") + "/>"; }
  function Pa(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '" ' + (extra || "") + "/>"; }
  function rr(x, y, w, h, r) {
    return "M" + (x + r) + " " + y + "H" + (x + w - r) + "A" + r + " " + r + " 0 0 1 " + (x + w) + " " + (y + r) + "V" + (y + h - r) + "A" + r + " " + r + " 0 0 1 " + (x + w - r) + " " + (y + h) +
      "H" + (x + r) + "A" + r + " " + r + " 0 0 1 " + x + " " + (y + h - r) + "V" + (y + r) + "A" + r + " " + r + " 0 0 1 " + (x + r) + " " + y + "Z";
  }
  function arco(x, y, w, h) { return "M" + x + " " + (y + h) + "V" + (y + w / 2) + "A" + (w / 2) + " " + (w / 2) + " 0 0 1 " + (x + w) + " " + (y + w / 2) + "V" + (y + h) + "Z"; }

  var VERDE = "#7FA583", VERDE2 = "#A3C1A0", VERDE3 = "#5F8A66", BARRO = "#C77D5E", PIEDRA = "#EADFD2", MURO = "#F8F1E6", MADERA = "#C98A5B", MADERA2 = "#A8693F";
  var TEJAS = { n: "#BC6D52", s: "#A55B44" };
  var CORAL = P.escaleras.campo, AMBAR = P.cocina.campo, ROSA = P.mesa.campo, LAV = P.alcoba.campo, AZUL = P.cocina.agua, SOL = "#F6D365";
  function arbol(x, y, r) {
    return E(x + 8, y + r * .9, r * 1.05, r * .38, "rgba(14,17,22,.20)") + R(x - 5, y + r * .2, 10, r * .8, MADERA2, 'rx="4"') +
      C(x, y, r, VERDE3) + C(x - r * .35, y - r * .15, r * .66, VERDE) + C(x + r * .32, y + r * .2, r * .52, VERDE) + C(x - r * .12, y - r * .4, r * .32, VERDE2) +
      C(x + r * .5, y - r * .3, 4.5, CORAL) + C(x - r * .6, y + r * .25, 4.5, AMBAR) + C(x + r * .1, y + r * .55, 4.5, ROSA) + C(x - r * .1, y - r * .05, 4, ROSA);
  }
  function matera(x, y, r) {
    return E(x + 3, y + r + 5, r + 5, 5, "rgba(14,17,22,.18)") + Pa("M" + (x - r) + " " + (y + 2) + "L" + (x - r + 4) + " " + (y + r + 6) + "H" + (x + r - 4) + "L" + (x + r) + " " + (y + 2) + "Z", BARRO) +
      C(x, y - 2, r, VERDE) + C(x - r * .3, y - r * .4, r * .5, VERDE2) + C(x + r * .4, y - r * .2, 4, CORAL) + C(x - r * .5, y + 1, 4, AMBAR);
  }

  /* baluster torneado: vástago con dos bulbos y un anillo. Un solo path por baranda. */
  function balaustres(x0, x1, y, h, col, paso) {
    var d = "", x, c = function (cx, cy, r) { return "M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 0 " + 2 * r + " 0a" + r + " " + r + " 0 1 0 " + (-2 * r) + " 0z"; };
    for (x = x0 + paso / 2; x < x1; x += paso) {
      d += "M" + (x - 1.9) + " " + y + "h3.8v" + h + "h-3.8z" + c(x, y + h * .3, 4.8) + c(x, y + h * .72, 4.4) + "M" + (x - 3.2) + " " + (y + h * .5 - 1.2) + "h6.4v2.8h-6.4z";
    }
    return '<path d="' + d + '" fill="' + col + '"/>';
  }
  /* baranda de balcón: pasamanos, balaustres, travesaño, postes en los extremos */
  function baranda(x, y, w, col, alto) {
    var h = alto || 30;
    return R(x - 5, y - 4, 9, h + 12, col, 'rx="4"') + R(x + w - 4, y - 4, 9, h + 12, col, 'rx="4"') +
      balaustres(x, x + w, y + 6, h - 6, col, 15) +
      R(x - 6, y, w + 12, 8, col, 'rx="4"') + R(x - 6, y + 1.5, w + 12, 2.5, "rgba(255,255,255,.35)", 'rx="1.2"') + R(x - 3, y + h, w + 6, 6, col, 'rx="3"');
  }
  /* mata colgante: cajón de flores con hojas y flores, y guías que cuelgan */
  function matas(x, y, w, col) {
    var s = R(x, y, w, 12, col, 'rx="3"') + R(x + 2, y + 2, w - 4, 3, "rgba(255,255,255,.3)", 'rx="1.5"'), i, fx, cols = [CORAL, AMBAR, ROSA, "#FFFFFF"];
    for (fx = x + 8, i = 0; fx < x + w - 4; fx += 13, i++) {
      s += C(fx, y - 2, 8, i % 2 ? VERDE : VERDE3) + C(fx - 2, y - 9, 4.4, cols[i % 4]) + C(fx + 4, y - 5, 3.6, cols[(i + 2) % 4]);
      s += '<g class="cuelga" style="animation-delay:' + (-(i * 0.7)).toFixed(1) + 's">' + C(fx, y + 17, 5.2, VERDE) + C(fx + 1, y + 27, 4.6, VERDE3) + C(fx - 1, y + 36, 4, VERDE) + (i % 2 ? C(fx + 2, y + 44, 3.4, cols[i % 4]) : C(fx - 2, y + 31, 3.2, cols[(i + 1) % 4])) + "</g>";
    }
    return s;
  }

  var CLIPS = [];
  /* un cuarto: caja abierta hacia el patio, color del cuarto, viga arriba, piso de madera, baranda al frente */
  function cuarto(key, x, y, w, h, pal, dentro, barCol, flores) {
    var p = P[pal], id = "cl-" + key, fl = y + h - 28;
    CLIPS.push('<clipPath id="' + id + '"><path d="' + rr(x, y, w, h, 22) + '"/></clipPath>');
    var s = '<g class="room" data-room="' + key + '">' + R(x, y + 5, w, h, "rgba(60,20,10,.32)", 'rx="22"') + '<g clip-path="url(#' + id + ')">' + R(x, y, w, h, p.campo, 'class="fl"') +
      R(x, y, w, 14, "rgba(14,17,22,.14)") + R(x, y + 14, w, 3, "rgba(255,255,255,.35)") +
      R(x, fl, w, 28, MADERA, "") + R(x, fl, w, 4, "rgba(14,17,22,.14)") + R(x, fl + 14, w, 1.5, "rgba(14,17,22,.12)") +
      dentro + baranda(x + 14, y + h - 36, w - 28, barCol, 24) + (flores || "") + "</g>" +
      R(x + 3, y + 3, w - 6, h - 6, "none", 'rx="20" stroke="rgba(14,17,22,.12)" stroke-width="6"') +
      R(x - 5, y - 5, w + 10, h + 10, "none", 'class="ring" rx="26" stroke="#FFFFFF" stroke-width="5"') + "</g>";
    return s;
  }

  /* ventana con cielo: marco, vidrio azul claro, nube, postigos abiertos */
  function ventana(x, y, w, h, marco, post, curvo) {
    var d = curvo ? arco(x, y, w, h) : rr(x, y, w, h, 4), id = "sk" + x + "-" + y;
    CLIPS.push('<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>');
    return Pa(curvo ? arco(x - 5, y - 5, w + 10, h + 10) : rr(x - 5, y - 5, w + 10, h + 10, 6), marco) +
      '<g clip-path="url(#' + id + ')">' + R(x, y, w, h, "#BFDDEC") + R(x, y + h * .5, w, h * .5, "#D5E9F3") + E(x + w * .3, y + h * .38, w * .2, h * .08, "#FFFFFF", 'opacity=".95"') + E(x + w * .45, y + h * .33, w * .13, h * .07, "#FFFFFF", 'opacity=".95"') +
      E(x + w * .72, y + h * .62, w * .16, h * .06, "#FFFFFF", 'opacity=".8"') + R(x + w / 2 - 2, y, 4, h, marco) + R(x, y + h * .5 - 2, w, 4, marco) + "</g>" +
      (post ? R(x - 5 - w * .32, y - 2, w * .32, h + 4, post, 'rx="3"') + R(x - 5 - w * .32 + 4, y + 6, w * .32 - 8, h * .4, "rgba(255,255,255,.28)", 'rx="2"') + R(x - 5 - w * .32 + 4, y + h * .55, w * .32 - 8, h * .38, "rgba(255,255,255,.28)", 'rx="2"') +
        R(x + w + 5, y - 2, w * .32, h + 4, post, 'rx="3"') + R(x + w + 9, y + 6, w * .32 - 8, h * .4, "rgba(255,255,255,.28)", 'rx="2"') + R(x + w + 9, y + h * .55, w * .32 - 8, h * .38, "rgba(255,255,255,.28)", 'rx="2"') : "");
  }

  function vapor(x, y, n) {
    var s = "", i;
    for (i = 0; i < n; i++) s += '<path class="vapor" style="animation-delay:' + (-i * 1.1).toFixed(1) + 's" d="M' + (x + i * 9 - 9) + " " + y + " q7 -9 0 -18 t0 -18 t0 -18" + '" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>';
    return s;
  }

  /* ---------- los cuartos ---------- */
  var SALA = {
    cocina: function () {
      var s = "";
      /* ventana al fondo, colgador alto, mesita baja con frutas grandes, mesón bajo */
      s += ventana(476, 128, 86, 78, "#FFFFFF", CORAL, false);
      s += R(458, 206, 122, 8, "#FFFFFF", 'rx="4"') + matas(460, 196, 118, AZUL);
      s += R(214, 120, 150, 5, INK, 'rx="2.5"') + R(228, 125, 3, 22, INK) + C(229, 152, 8, INK) + R(254, 125, 3, 36, INK) + R(248, 160, 15, 7, INK, 'rx="3.5"') + R(282, 125, 3, 28, INK) + R(276, 152, 15, 18, INK, 'rx="6"');
      /* mesón bajo con puertas, a la altura de una Cella */
      s += R(412, 232, 82, 40, "#E3A94E", 'rx="6"') + R(408, 226, 90, 9, "#FFFFFF", 'rx="4"') + R(418, 240, 30, 26, "#EBB963", 'rx="4"') + R(456, 240, 30, 26, "#EBB963", 'rx="4"') + C(444, 254, 2.6, INK) + C(458, 254, 2.6, INK) + taza(472, 226, 1.1);
      /* mesita baja con frutas */
      s += R(508, 244, 66, 28, MADERA2, 'rx="6"') + R(504, 238, 74, 9, MADERA, 'rx="4"') + C(524, 230, 9, AMBAR) + C(541, 228, 10, CORAL) + C(558, 231, 8.5, VERDE) + C(534, 220, 7, SOL);
      /* nevera de cofre con una Cella dentro hasta la cabeza, estufa baja con otra que revuelve */
      s += G.nevera({ x: 158, y: 272 }) + G.olla({ x: 330, y: 272 });
      return s;
    },
    alcoba: function () {
      var s = "";
      s += R(722, 126, 86, 56, "#FFFFFF", 'rx="5"') + R(728, 132, 74, 44, "#D5E3EC", 'rx="3"') + Pa("M728 176 L752 150 L768 164 L782 146 L802 176Z", VERDE) + C(786, 148, 7, SOL);
      s += R(1004, 124, 74, 100, "#FFFFFF", 'rx="6"') + R(1010, 130, 62, 88, "#141A4A", 'rx="3"') + C(1048, 160, 12, PAPEL) + C(1054, 156, 11, "#141A4A") + C(1024, 192, 2.2, PAPEL) + C(1030, 146, 1.8, PAPEL) + C(1058, 196, 2.4, PAPEL) +
        Pa("M1004 122 h22 q-8 50 -2 106 h-20z", "#8E99DE") + Pa("M1078 122 h-22 q8 50 2 106 h20z", "#8E99DE");
      s += E(772, 274, 150, 6, "rgba(233,135,106,.85)");
      /* mesa de noche baja con lámpara */
      s += R(940, 236, 56, 36, MADERA2, 'rx="6"') + R(934, 230, 68, 10, MADERA, 'rx="5"') + R(946, 246, 44, 12, "rgba(255,255,255,.2)", 'rx="4"') + C(968, 252, 2.6, INK) + R(965, 204, 6, 26, INK, 'rx="3"') + R(955, 224, 26, 6, INK, 'rx="3"') +
        '<g class="lampcono">' + C(968, 196, 56, "url(#gl)", "") + "</g>" + Pa("M950 208 L986 208 L978 176 L958 176Z", SOL) + R(958, 176, 20, 5, "rgba(255,255,255,.5)", 'rx="2"') + R(944, 220, 14, 10, CORAL, 'rx="2"');
      /* cama corta y ancha: una duerme y una chica rebota a los pies */
      s += G.cama({ x: 770, y: 272 });
      return s;
    },
    escaleras: function () {
      var s = "";
      s += Pa(arco(896, 350, 64, 84), "#FFFFFF") + Pa(arco(901, 355, 54, 79), "#BFDDEC") + E(920, 386, 14, 6, "#FFFFFF") + E(940, 380, 10, 5, "#FFFFFF") + R(927, 355, 3, 79, "#FFFFFF");
      /* escalones anchos y bajos, una dormida encima y una chica que sube y baja */
      s += G.escalera({ x: 886, y: 614 });
      return s;
    },
    mesa: function () {
      var s = "";
      s += ventana(256, 352, 54, 78, "#FFFFFF", AZUL, false);
      s += R(112, 408, 70, 7, MADERA2, 'rx="3"') + matera(130, 396, 9) + matera(160, 398, 8) + R(190, 404, 3, 4, INK);
      s += R(219, 322, 2.5, 52, INK) + '<g class="lampcono">' + E(220, 406, 70, 34, "url(#gl)", "") + "</g>" + Pa("M200 376 H240 L252 398 H188Z", SOL) + R(188, 396, 64, 4, "rgba(14,17,22,.2)", 'rx="2"');
      /* mesa baja, sillas cuadradas, tazas grandes; una Cella sentada encima de la mesa */
      s += G.mesa({ x: 222, y: 604, s: .92 });
      return s;
    },
    patio: function () { return ""; }
  };
  function taza(x, y, k) {   /* taza grande, para manos de Cella */
    return '<g transform="translate(' + x + " " + y + ") scale(" + (k || 1) + ')">' + E(0, 2, 17, 5, "rgba(14,17,22,.16)") + Pa("M-15 -22 L-11 -3 Q0 1 11 -3 L15 -22Z", "#FFFFFF") +
      '<path d="M14 -18 q14 0 9 11 q-3 3 -10 1" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>' + E(0, -22, 15, 5, "#FFFFFF") + E(0, -21.5, 12, 3.6, "#7A4A2E") + "</g>";
  }

  /* ---------- patio ---------- */
  var CELLA = { cx: 602, base: 516, s: .66 };
  function patio() {
    var s = '<g class="room" data-room="patio">' + R(352, 318, 496, 328, PIEDRA, 'class="fl" rx="20"'), i, v;
    s += '<g stroke="rgba(120,80,50,.09)" stroke-width="2">';
    for (i = 1; i < 12; i++) { v = 352 + i * 41; s += '<path d="M' + v + ' 322 V642"/>'; }
    for (i = 1; i < 8; i++) { v = 318 + i * 41; s += '<path d="M356 ' + v + 'H844"/>'; }
    s += "</g>";
    s += R(352, 318, 496, 328, "none", 'rx="20" stroke="rgba(14,17,22,.10)" stroke-width="6"');
    /* el centro azul */
    s += E(600, 482, 232, 124, "rgba(255,255,255,.55)", 'class="halo"') + E(604, 490, 192, 104, "rgba(14,17,22,.20)") + E(600, 482, 190, 102, "#F4F6F8") + E(600, 482, 176, 92, AZUL) + E(600, 482, 124, 64, "#7FB7D6") + E(600, 482, 70, 36, "#B9DDEE") +
      E(600, 482, 26, 13, PAPEL, 'class="corazon"') + '<g class="reveal" fill="none" stroke="' + PAPEL + '" stroke-width="3" stroke-dasharray="6 10"><ellipse cx="600" cy="482" rx="206" ry="112"/></g>';
    /* las Cellas del patio: la principal, en tinta, al centro (cella-g); a su alrededor, cada una en lo suyo */
    s += G.cielo({ x: 490, y: 520 }) + G.agua({ x: 724, y: 500 }) + G.paseo({ x: 604, y: 592 });
    s += '<g id="cella-g"></g>';
    /* árboles en las cuatro esquinas */
    s += arbol(398, 372, 33) + arbol(802, 372, 33) + arbol(398, 584, 33) + arbol(802, 584, 33);
    s += R(348, 314, 504, 336, "none", 'class="ring" rx="24" stroke="#FFFFFF" stroke-width="5"');
    return s + "</g>";
  }

  /* ---------- techo, fachada, balcones ---------- */
  function defs() {
    var teja = function (id, giro) {
      return '<pattern id="' + id + '" width="18" height="24" patternUnits="userSpaceOnUse"' + (giro ? ' patternTransform="rotate(90)"' : "") + ">" +
        '<rect width="8" height="24" fill="rgba(70,22,10,.13)"/><rect x="8" width="2" height="24" fill="rgba(255,225,205,.12)"/>' +
        '<path d="M0 22 Q4 18 8 22 M9 22 Q13 18 17 22" fill="none" stroke="rgba(255,225,205,.18)" stroke-width="2"/></pattern>';
    };
    return "<defs>" + '<filter id="bl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="12"/></filter>' + teja("tj", false) + teja("tjh", true) + '<radialGradient id="gl"><stop offset="0" stop-color="#FFF4C2" stop-opacity=".95"/><stop offset="1" stop-color="#FFF4C2" stop-opacity="0"/></radialGradient>' + CLIPS.join("") + "</defs>";
  }

  function techo() {
    var s = R(40, 40, 1120, 640, TEJAS.n, 'rx="38"') + R(40, 40, 1120, 640, "url(#tj)", 'rx="38"');
    s += R(46, 46, 1108, 628, "none", 'rx="34" stroke="rgba(255,226,206,.34)" stroke-width="6"');
    s += R(84, 84, 1032, 574, "#E9DDD0", 'rx="16"') + R(84, 84, 1032, 574, "none", 'rx="16" stroke="rgba(14,17,22,.14)" stroke-width="8"');
    return s;
  }

  function balcon(x, y, col, col2, flor, gag) {
    /* ventana 100 x 104 con postigos abiertos y cielo, losa volada con ménsulas, baranda torneada y matas colgantes */
    var w = 100, h = 104, s = "";
    s += R(x - 14, y - 14, w + 28, h + 14, "rgba(255,255,255,.7)", 'rx="10"');
    s += ventana(x, y, w, h, col2, col, false);
    s += R(x - 22, y + h + 2, w + 44, 14, col2, 'rx="5"') + R(x - 22, y + h + 2, w + 44, 4, "rgba(255,255,255,.4)", 'rx="2"');
    [x - 6, x + w / 2 - 8, x + w - 10].forEach(function (cx) { s += Pa("M" + cx + " " + (y + h + 16) + "h16l-16 20z", col, ""); });
    s += gag || "";
    s += baranda(x - 18, y + h - 26, w + 36, col, 26);
    s += matas(x - 14, y + h - 8, w + 28, flor);
    return s;
  }

  function fachada() {
    var s = "", i;
    /* muro, cornisa, zócalo */
    s += R(40, 650, 1120, 240, MURO, 'rx="22"') + R(40, 650, 1120, 8, "rgba(14,17,22,.08)") + R(40, 676, 1120, 12, CORAL) + R(40, 688, 1120, 4, "rgba(255,255,255,.7)");
    for (i = 0; i < 40; i++) s += R(50 + i * 28, 692, 14, 8, "rgba(14,17,22,.08)", 'rx="2"');
    var zc = [CORAL, AZUL, AMBAR, ROSA, LAV];
    for (i = 0; i < 20; i++) s += R(46 + i * 56, 862, 52, 26, zc[i % 5], 'rx="6"') + R(56 + i * 56, 867, 32, 16, "rgba(255,255,255,.5)", 'rx="4"') + C(72 + i * 56, 875, 4.5, zc[(i + 2) % 5]);
    /* alero de teja */
    s += R(34, 628, 1132, 42, TEJAS.s, 'rx="14"') + R(34, 628, 1132, 42, "url(#tj)", 'rx="14"') + R(34, 664, 1132, 6, "rgba(14,17,22,.22)");
    for (i = 0; i < 41; i++) s += C(48 + i * 28, 668, 14, TEJAS.s) + C(48 + i * 28, 668, 14, "url(#tj)");
    /* balcones: cuatro, de colores distintos */
    s += balcon(120, 706, CORAL, "#D9694B", AMBAR, G.taza({ x: 170, y: 806, cuerpo: "luz" })) + balcon(310, 706, AZUL, "#2F6F9A", ROSA, G.mecedora({ x: 360, y: 806, cuerpo: "tinta" })) + balcon(790, 706, AMBAR, "#D69A3F", CORAL) + balcon(980, 706, ROSA, "#D97F8C", "#FFFFFF");
    return s;
  }
  function ventanasGrupo() {
    /* ventanas: las cuatro de la fachada son el cuarto "Windows" (el zoom va a las dos de la izquierda) */
    var xs = [120, 310, 790, 980], s = "";
    xs.forEach(function (x) { s += '<g class="room ventanas" data-room="ventana">' + R(x - 30, 690, 160, 170, "transparent") + "</g>"; });
    return s;
  }

  function porton() {
    var s = '<g class="room" data-room="puerta">';
    s += R(480, 690, 240, 200, "transparent");
    /* faroles */
    s += R(498, 740, 5, 22, INK, 'rx="2"') + R(492, 758, 17, 24, INK, 'rx="5"') + R(496, 762, 9, 16, SOL, 'rx="3"') + '<g class="lampcono">' + C(500, 770, 30, "url(#gl)", "") + "</g>" +
      R(697, 740, 5, 22, INK, 'rx="2"') + R(691, 758, 17, 24, INK, 'rx="5"') + R(695, 762, 9, 16, SOL, 'rx="3"') + '<g class="lampcono">' + C(700, 770, 30, "url(#gl)", "") + "</g>";
    /* portón en arco del ancho de una Cella (la Cella grande mide 76; el vano, 100) */
    s += Pa(arco(540, 700, 120, 190), "#FFFFFF") + Pa(arco(550, 710, 100, 180), "#8A6358") + Pa(arco(550, 710, 100, 180), "rgba(14,17,22,.25)");
    s += Pa("M556 888 L644 888 L634 850 L566 850Z", PIEDRA);
    /* una chica se asoma detrás de la hoja derecha (se dibuja antes que la hoja) */
    s += G.asoma({ x: 668, y: 880 });
    /* hojas abiertas del portón */
    s += Pa("M550 716 L510 728 V876 L550 888Z", ROSA) + R(518, 740, 22, 56, "rgba(255,255,255,.3)", 'rx="3"') + R(518, 806, 22, 56, "rgba(255,255,255,.3)", 'rx="3"') + C(526, 772, 2.5, INK) + C(526, 834, 2.5, INK) +
      Pa("M650 716 L690 728 V876 L650 888Z", ROSA) + R(660, 740, 22, 56, "rgba(255,255,255,.3)", 'rx="3"') + R(660, 806, 22, 56, "rgba(255,255,255,.3)", 'rx="3"') + C(674, 772, 2.5, INK) + C(674, 834, 2.5, INK);
    /* tapete a rayas, ancho y corto */
    var tc = [CORAL, AMBAR, AZUL, ROSA, LAV, CORAL], i;
    s += Pa("M552 890 L648 890 L638 864 L562 864Z", "#FFFFFF");
    for (i = 0; i < 6; i++) s += Pa("M" + (554 + i * 15.6) + " 888 L" + (569 + i * 15.6) + " 888 L" + (564 + i * 12.1) + " 866 L" + (563 + i * 12.1) + " 866Z", tc[i]);
    s += R(550, 890, 100, 4, "rgba(14,17,22,.18)", 'rx="2"');
    /* llega y se limpia en el tapete */
    s += G.porton({ x: 600, y: 882 });
    s += R(530, 696, 140, 14, "#FFFFFF", 'rx="6"') + C(600, 702, 4, CORAL) + C(580, 702, 3, AMBAR) + C(620, 702, 3, AZUL);
    s += R(474, 686, 252, 214, "none", 'class="ring" rx="20" stroke="#FFFFFF" stroke-width="5"') + "</g>";
    return s;
  }

  function arbustos() {
    var b = [[22, 780, 18], [20, 850, 22], [1178, 790, 18], [1180, 856, 22], [300, 924, 12], [900, 924, 12]], i, s = "";
    for (i = 0; i < b.length; i++) s += C(b[i][0] + 3, b[i][1] + 5, b[i][2], "rgba(14,17,22,.10)") + C(b[i][0], b[i][1], b[i][2], i % 2 ? VERDE2 : VERDE) + C(b[i][0] - 4, b[i][1] - 4, b[i][2] * .5, i % 2 ? "#C2D8BE" : VERDE2);
    return s;
  }

  function etiquetas() {
    var pos = { cocina: [345, 114], alcoba: [855, 114], escaleras: [980, 334], mesa: [220, 334], puerta: [600, 724], patio: [600, 332], ventana: [280, 720] }, s = '<g class="tags" aria-hidden="true">';
    D.orden.forEach(function (k) {
      var d = D.cuartos[k], t = d.nombre + " · " + d.palabra, w = Math.round(t.length * 12.6 + 40), p = pos[k];
      s += '<g class="tag" data-for="' + k + '" transform="translate(' + p[0] + " " + p[1] + ')">' + R(-w / 2, -21, w, 42, "rgba(14,17,22,.92)", 'rx="21"') +
        '<text class="c" x="0" y="8" fill="#F4F6F8">' + t + "</text></g>";
    });
    return s + "</g>";
  }

  function planoSVG() {
    CLIPS = [];
    var s = "";
    s += R(14, 14, 1172, 912, "#EEF1F4", 'rx="48"') + arbustos();
    s += '<rect x="56" y="64" width="1100" height="860" rx="40" fill="rgba(14,17,22,.20)" filter="url(#bl)"/>';
    s += techo();
    s += patio();
    s += cuarto("cocina", 100, 100, 490, 200, "cocina", SALA.cocina(), CORAL, "");
    s += cuarto("alcoba", 610, 100, 490, 200, "alcoba", SALA.alcoba(), AMBAR, "");
    s += cuarto("mesa", 100, 320, 240, 320, "mesa", SALA.mesa(), AZUL, "");
    s += cuarto("escaleras", 860, 320, 240, 320, "escaleras", SALA.escaleras(), SOL, "");
    s += '<g transform="translate(0 20)">' + fachada() + ventanasGrupo() + porton() + "</g>";
    s += etiquetas();
    return defs() + s;
  }

  /* ---------- Cella en el patio (reusa cella-brazos.js) ---------- */
  var cellaTimer = null, t0 = 0;
  function dibujaCella(t) {
    var g = $("#cella-g"); if (!g || !window.NAOS_BRAZOS) return;
    var p = { tx: INK, bg: "#B9DDEE" };
    var b = quieto ? 0.4 : 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 8);
    var c = t % 12, izq = quieto ? 0 : NAOS_BRAZOS.gesto(c, { t0: 2, t1: 5.5, a: 44, a2: 26 }), der = quieto ? 0 : NAOS_BRAZOS.gesto(c, { t0: 6.5, t1: 9, a: 22 });
    g.innerHTML = NAOS_BRAZOS.cella({ cx: CELLA.cx, base: CELLA.base, s: CELLA.s, p: p, b: b, izq: izq, der: der, abre: quieto ? 1 : (izq > 1 || der > 1 ? 1 : 0), id: "ce" });
  }
  function arrancaCella() {
    if (cellaTimer) { clearInterval(cellaTimer); cellaTimer = null; }
    if (!$("#cella-g")) return;
    t0 = performance.now();
    dibujaCella(2.5);
    if (!quieto) cellaTimer = setInterval(function () { if (!document.hidden) dibujaCella((performance.now() - t0) / 1000); }, 90);
  }

  /* ---------- estado, zoom ---------- */
  var VB0 = [0, 0, 1200, 940];
  var BOX = {
    cocina: [100, 100, 490, 200], alcoba: [610, 100, 490, 200], escaleras: [860, 320, 240, 320], mesa: [100, 320, 240, 320],
    patio: [350, 316, 500, 330], ventana: [100, 722, 350, 150], puerta: [474, 706, 252, 214]
  };
  var ORDEN = D.orden;
  var casa = $("#casa"), stage = $("#stage"), svg = $("#plano"), panel = $("#panel"), lista = $("#lista"), navz = $("#navz"), listaNav = $("#lista-nav"), bajada = $("#bajada");
  var vb = VB0.slice(), anim = 0, actual = null;

  function setVB(a) { vb = a; svg.setAttribute("viewBox", a.map(function (n) { return n.toFixed(1); }).join(" ")); }
  function ajusta(box, pad) {
    var r = stage.getBoundingClientRect(), asp = r.width / r.height, w = box[2] * pad, h = box[3] * pad, vw, vh;
    if (w / h > asp) { vw = w; vh = w / asp; } else { vh = h; vw = h * asp; }
    var cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2, x = cx - vw / 2, y = cy - vh / 2;
    if (vw < 1200) x = Math.max(0, Math.min(1200 - vw, x));
    if (vh < 900) y = Math.max(30, Math.min(926 - vh, y));
    return [x, y, vw, vh];
  }
  function destino(k) {
    if (!k) return VB0.slice();
    return ajusta(BOX[k], k === "patio" ? 1.04 : k === "ventana" ? 1.0 : 1.1);
  }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function viaja(a, b) {
    if (anim) cancelAnimationFrame(anim);
    if (quieto) { setVB(b); return; }
    var ini = performance.now(), dur = 820;
    (function paso(now) {
      var t = Math.min(1, (now - ini) / dur), e = ease(t);
      setVB(a.map(function (v, i) { return v + (b[i] - v) * e; }));
      anim = t < 1 ? requestAnimationFrame(paso) : 0;
    })(ini);
  }

  var ES_TACTIL = !window.matchMedia("(hover: hover)").matches;

  function marca(k) {
    $$(".room", svg).forEach(function (g) { g.classList.toggle("on", g.getAttribute("data-room") === k); });
    $$(".tag", svg).forEach(function (g) { g.classList.toggle("on", g.getAttribute("data-for") === k); });
    svg.classList.toggle("hay", !!k);
    $$("a", lista).forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-room") === k); });
  }

  function pintar() {
    svg.innerHTML = planoSVG();
    $$(".room", svg).forEach(function (g) {
      var k = g.getAttribute("data-room");
      g.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" && !actual) marca(k); });
      g.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && !actual) marca(null); });
      g.addEventListener("click", function () { if (!actual || actual !== k) location.hash = "#/" + k; });
    });
    var h = "";
    ORDEN.forEach(function (k) {
      var d = D.cuartos[k], p = P[d.pal];
      h += '<li><a href="#/' + k + '" data-room="' + k + '" style="--chip:' + p.campo + ";--chipt:" + p.tinta + '"><span class="chip" aria-hidden="true"></span>' +
        '<span class="t"><span class="n">' + d.nombre + '</span><span class="w">' + d.palabra + " · " + d.biblioteca.length + " behaviors</span></span></a></li>";
    });
    lista.innerHTML = h;
    $$("a", lista).forEach(function (a) {
      var k = a.getAttribute("data-room");
      a.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" && !actual) marca(k); });
      a.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse" && !actual) marca(null); });
      a.addEventListener("focus", function () { if (!actual) marca(k); });
      a.addEventListener("blur", function () { if (!actual) marca(null); });
    });
    arrancaCella();
  }

  /* ---------- panel del cuarto ---------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function pieza(it) {
    var img = "media/" + it.id;
    if (it.tipo === "video") {
      return '<article class="item"><div class="media"><video controls preload="none" playsinline poster="' + img + '.jpg" src="' + img + '.mp4" aria-label="Short: ' + esc(it.titulo) + '"></video></div>' +
        "<h4>" + esc(it.titulo) + '</h4><p class="tarj">' + esc(it.tarjeta) + '</p><a class="enl" href="' + img + '.mp4" target="_blank" rel="noopener">Open the Short</a></article>';
    }
    return '<article class="item"><div class="media"><img src="' + img + '.jpg" alt="Card: ' + esc(it.tarjeta) + '" loading="lazy"></div><h4>' + esc(it.titulo) + '</h4><p class="tarj">Card: ' + esc(it.tarjeta) + '</p><a class="enl" href="' + img + '.jpg" target="_blank" rel="noopener">Open the card</a></article>';
  }
  function contenido(k) {
    var d = D.cuartos[k], p = P[d.pal], i = ORDEN.indexOf(k);
    var otros = ORDEN.filter(function (x) { return x !== k; }).map(function (x) { return '<li><a href="#/' + x + '">' + D.cuartos[x].nombre + " · " + D.cuartos[x].palabra + "</a></li>"; }).join("");
    return '<div class="p-in" style="--campo:' + p.campo + ";--tinta:" + p.tinta + '">' +
      '<header class="p-cab"><p class="kicker">' + d.palabra + " · " + (i + 1) + " of " + ORDEN.length + '</p><h2 id="h-cuarto" tabindex="-1">' + d.nombre + "</h2>" +
      '<p class="nfrase"><mark class="n">[N: frase que define el cuarto, en primera persona]</mark></p></header>' +
      '<section class="intro" aria-label="Intro"><h3>What it is</h3><p>' + esc(d.que) + "</p><h3>Why it is like this</h3><p>" + esc(d.porque) + "</p>" +
      (d.conducta ? "<h3>How we behave here</h3><p>" + esc(d.conducta) + "</p>" : "<h3>How we behave here</h3><p>Quiet. Each tradition is named with its source.</p>") +
      '<p class="nfrase"><mark class="n">[N: la frase que define a NAOS]</mark></p>' +
      '<p class="borr">Borrador del equipo. Máximo 60 palabras. N reescribe.</p></section>' +
      '<section class="piezas" aria-labelledby="h-bib"><h3 id="h-bib">Shorts and cards</h3><p class="sub2">Short, then card: when ___, I ___.</p><div class="rejilla">' + d.biblioteca.map(pieza).join("") + "</div>" +
      (d.faltan ? '<p class="faltan">' + d.faltan + "</p>" : "") + "</section>" +
      '<section class="yt" aria-labelledby="h-yt"><h3 id="h-yt">Go deeper</h3><p>Mediums and longs on YouTube: the science and the traditions behind these behaviors.</p>' +
      '<a class="btn grande" href="' + D.yt + '" target="_blank" rel="noopener">Watch on YouTube</a></section>' +
      '<nav class="otros" aria-label="Other rooms"><h3>Other rooms</h3><ul>' + otros + "</ul></nav></div>";
  }

  var dirSlide = 0;
  function muestra(k, animar) {
    var antes = actual;
    actual = k;
    casa.classList.toggle("zoom", !!k);
    navz.hidden = !k; panel.hidden = !k; listaNav.hidden = !!k;
    marca(k);
    if (k) {
      panel.innerHTML = contenido(k);
      panel.classList.remove("slide-d", "slide-i");
      if (!quieto && antes && antes !== k) { void panel.offsetWidth; panel.classList.add(dirSlide < 0 ? "slide-i" : "slide-d"); }
      var i = ORDEN.indexOf(k), n = ORDEN.length;
      $("#prev").setAttribute("aria-label", "Previous room: " + D.cuartos[ORDEN[(i + n - 1) % n]].nombre);
      $("#sig").setAttribute("aria-label", "Next room: " + D.cuartos[ORDEN[(i + 1) % n]].nombre);
      document.title = D.cuartos[k].nombre + " · NAOS (prototype)";
      var h = $("#h-cuarto"); if (h) h.focus({ preventScroll: true });
      if (!antes) window.scrollTo(0, 0);
    } else {
      panel.innerHTML = "";
      document.title = "NAOS · the house (prototype)";
    }
    var meta = destino(k);
    if (animar === false) { if (anim) cancelAnimationFrame(anim); setVB(meta); } else viaja(vb, meta);
  }

  function rutaActual() {
    var m = /^#\/([a-z]+)$/.exec(location.hash);
    return m && D.cuartos[m[1]] ? m[1] : null;
  }
  function vaA(k) { location.hash = k ? "#/" + k : "#/"; }
  function vecino(d) {
    if (!actual) return;
    var n = ORDEN.length, i = ORDEN.indexOf(actual);
    dirSlide = d;
    vaA(ORDEN[(i + d + n) % n]);
  }

  /* ---------- controles ---------- */
  $("#prev").addEventListener("click", function () { vecino(-1); });
  $("#sig").addEventListener("click", function () { vecino(1); });
  $("#volver").addEventListener("click", function () { vaA(null); });
  window.addEventListener("hashchange", function () {
    var k = rutaActual();
    if (location.hash && !k && location.hash !== "#/" && location.hash !== "#") { return; }
    muestra(k, true);
  });
  document.addEventListener("keydown", function (e) {
    var t = e.target && e.target.tagName;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "Escape" && actual) { vaA(null); return; }
    if (!actual) return;
    if (t === "VIDEO" || t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
    if (e.key === "ArrowRight") { e.preventDefault(); vecino(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); vecino(-1); }
  });
  /* deslizar entre cuartos en el teléfono */
  var tx = null, ty = null;
  casa.addEventListener("touchstart", function (e) { if (!actual || e.touches.length !== 1 || (e.target.closest && e.target.closest("video"))) { tx = null; return; } tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  casa.addEventListener("touchend", function (e) {
    if (tx === null || !e.changedTouches.length) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.6) vecino(dx < 0 ? 1 : -1);
  }, { passive: true });
  var rz = 0;
  window.addEventListener("resize", function () { cancelAnimationFrame(rz); rz = requestAnimationFrame(function () { if (!anim) setVB(destino(actual)); }); });

  pintar();
  muestra(rutaActual(), false);
})();
