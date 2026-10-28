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

  /* ---------- piezas de dibujo (v2: casa de patio, suave, sin trazos negros) ---------- */
  function R(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '" ' + (extra || "") + "/>"; }
  function C(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" ' + (extra || "") + "/>"; }
  function rr(x, y, w, h, r) {
    return "M" + (x + r) + " " + y + "H" + (x + w - r) + "A" + r + " " + r + " 0 0 1 " + (x + w) + " " + (y + r) + "V" + (y + h - r) + "A" + r + " " + r + " 0 0 1 " + (x + w - r) + " " + (y + h) +
      "H" + (x + r) + "A" + r + " " + r + " 0 0 1 " + x + " " + (y + h - r) + "V" + (y + r) + "A" + r + " " + r + " 0 0 1 " + (x + r) + " " + y + "Z";
  }
  var VERDE = "#7FA583", VERDE2 = "#A3C1A0", BARRO = "#C77D5E", PIEDRA = "#EADFD2", MURO = "#F4EEE6";
  var TEJAS = { n: "#BC6D52", s: "#A55B44", o: "#B2644B", e: "#A85E47" };

  /* figura plana simple: cabeza y cuerpo, sin rasgos ni trazo. Misma gramática de Cella: plana, dos tonos. */
  function persona(cx, base, s, cuerpo, clase, brazos) {
    var arm = function (lado) {
      var x = lado === "L" ? -34 : 22;
      return '<g class="arm arm' + lado + '">' + R(x, -64, 12, 48, cuerpo, 'rx="6"') + "</g>";
    };
    return '<ellipse cx="' + cx + '" cy="' + base + '" rx="' + (26 * s) + '" ry="' + (7 * s) + '" fill="rgba(14,17,22,.16)"/>' +
      '<g transform="translate(' + cx + " " + base + ") scale(" + s + ')"><g class="' + (clase || "") + '">' +
      (brazos === false ? "" : arm("L") + arm("R")) +
      '<path d="M-24 0 L-24 -40 Q-24 -68 0 -68 Q24 -68 24 -40 L24 0 Z" fill="' + cuerpo + '"/>' + C(0, -90, 17, cuerpo) + "</g></g>";
  }
  function matera(x, y, r) {
    return C(x + 2, y + 4, r + 3, "rgba(14,17,22,.22)") + C(x, y, r + 3, BARRO) + C(x, y, r, VERDE) + C(x - r * .3, y - r * .3, r * .55, VERDE2) + C(x + r * .35, y + r * .25, r * .3, "#5F8A66");
  }
  function arbol(x, y, r) {
    return C(x + 6, y + 10, r, "rgba(0,0,0,.28)") + C(x, y, r, "#5F8A66") + C(x - r * .35, y - r * .2, r * .62, VERDE) + C(x + r * .3, y + r * .3, r * .5, VERDE) + C(x - r * .2, y - r * .35, r * .3, VERDE2);
  }

  /* un cuarto es un corte en el tejado: el color del cuarto, un borde suave y su objeto */
  function cuarto(key, x, y, w, h, pal, dentro) {
    var p = P[pal];
    return '<g class="room" data-room="' + key + '">' +
      R(x, y + 3, w, h, "rgba(60,20,10,.30)", 'rx="24"') + R(x, y, w, h, p.campo, 'class="fl" rx="24"') +
      R(x + 3, y + 3, w - 6, h - 6, "none", 'rx="21" stroke="rgba(14,17,22,.10)" stroke-width="6"') +
      dentro + R(x - 4, y - 4, w + 8, h + 8, "none", 'class="ring" rx="28" stroke="#FFFFFF" stroke-width="4"') + "</g>";
  }

  var SALA = {
    cocina: function () {
      var p = P.cocina;
      return R(100, 66, 196, 28, p.placa, 'rx="10"') + C(132, 80, 7, INK) + C(176, 80, 13, INK) + C(176, 80, 8, p.placa) + C(222, 80, 7, INK) + R(256, 70, 26, 20, p.agua, 'rx="8"') +
        '<g class="reveal" fill="none" stroke="' + p.luz + '" stroke-width="4" stroke-linecap="round"><circle cx="176" cy="80" r="22"/><circle cx="176" cy="80" r="31" stroke-dasharray="5 8"/></g>' +
        R(112, 128, 120, 28, p.placa, 'rx="12"') + C(246, 142, 10, p.luz) + C(148, 142, 7, p.campo) + C(184, 142, 7, p.campo) +
        '<g id="cella-g"></g>';
    },
    escaleras: function (arr) {
      var p = P.escaleras, s = "", i;
      for (i = 0; i < 8; i++) s += R(566 + i * 17, 66, 14, 88, i % 2 ? "#DC7556" : p.placa, 'rx="5"');
      s += '<path d="M' + (arr ? "584 110 h116 m-12 -12 l12 12 l-12 12" : "700 110 h-116 m12 -12 l-12 12 l12 12") + '" fill="none" stroke="rgba(14,17,22,.45)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".0"/>';
      s += C(466, 106, 30, p.placa) + C(466, 106, 18, "#DC7556") + '<g class="reveal">' + C(460, 102, 6, p.luz) + C(472, 110, 6, p.luz) + C(464, 114, 5, p.luz) + "</g>";
      s += '<g class="walk">' + persona(450, 150, .5, p.luz, "paso") + "</g>";
      return s;
    },
    alcoba: function () {
      var p = P.alcoba;
      return R(100, 68, 150, 86, p.placa, 'rx="14"') + R(112, 78, 48, 30, "#FFFFFF", 'rx="12"') + R(166, 104, 84, 50, "#8E99DE", 'rx="12"') +
        R(266, 76, 32, 32, p.placa, 'rx="10"') + '<g class="lampcono">' + C(282, 92, 56, p.luz, 'opacity=".42"') + "</g>" + C(282, 92, 8, p.luz) +
        persona(346, 154, .5, INK, "sway");
    },
    mesa: function () {
      var p = P.mesa;
      return persona(210, 676, .5, p.agua, "sway", true) +
        R(112, 670, 196, 44, p.placa, 'rx="18"') + C(152, 692, 9, p.campo) + C(210, 692, 9, p.campo) + C(268, 692, 9, p.campo) +
        '<g class="reveal">' + C(181, 681, 5, p.luz) + C(239, 681, 5, p.luz) + "</g>" + C(330, 688, 12, p.luz, 'opacity=".9"');
    },
    puerta: function () {
      var p = P.puerta;
      return R(366, 690, 68, 38, p.placa, 'rx="8" opacity=".75"') + matera(372, 626, 11) + matera(428, 626, 11) +
        '<g class="reveal"><path d="M366 742 L434 742 L452 640 L348 640 Z" fill="' + p.luz + '" opacity=".35"/></g>';
    }
  };

  function estrellas(x0, y0, x1, y1, n) {
    var s = "", i, a = 7;
    for (i = 0; i < n; i++) { a = (a * 9301 + 49297) % 233280; var X = x0 + a / 233280 * (x1 - x0); a = (a * 9301 + 49297) % 233280; var Y = y0 + a / 233280 * (y1 - y0); s += C(X.toFixed(0), Y.toFixed(0), i % 4 ? 2 : 3.2, PAPEL, 'opacity="' + (i % 3 ? ".5" : ".9") + '"'); }
    return s;
  }

  function defs() {
    var teja = function (id, giro) {
      return '<pattern id="' + id + '" width="18" height="24" patternUnits="userSpaceOnUse"' + (giro ? ' patternTransform="rotate(90)"' : "") + ">" +
        '<rect width="8" height="24" fill="rgba(70,22,10,.13)"/><rect x="8" width="2" height="24" fill="rgba(255,225,205,.12)"/>' +
        '<path d="M0 22 Q4 18 8 22 M9 22 Q13 18 17 22" fill="none" stroke="rgba(255,225,205,.18)" stroke-width="2"/></pattern>';
    };
    return "<defs>" + '<filter id="bl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="11"/></filter>' + teja("tj", false) + teja("tjh", true) +
      '<clipPath id="anillo"><path clip-rule="evenodd" d="' + rr(50, 40, 700, 700, 40) + rr(190, 180, 420, 420, 16) + '"/></clipPath>' +
      '<clipPath id="apertura"><path d="' + rr(190, 180, 420, 420, 16) + '"/></clipPath></defs>';
  }

  function arcoVentana(x, y, w, h) { return "M" + x + " " + (y + h) + "V" + (y + w / 2) + "A" + (w / 2) + " " + (w / 2) + " 0 0 1 " + (x + w) + " " + (y + w / 2) + "V" + (y + h) + "Z"; }
  function ventanaFachada(x, y, w, h, col) {
    return R(x - 8, y + 6, 7, h - 6, col, 'rx="3"') + R(x + w + 1, y + 6, 7, h - 6, col, 'rx="3"') + '<path d="' + arcoVentana(x - 2, y - 2, w + 4, h + 4) + '" fill="#FFFFFF"/>' + '<path d="' + arcoVentana(x, y, w, h) + '" fill="#2B2F66"/>' +
      R(x + 4, y + h * .45, w - 8, 3, "rgba(255,255,255,.35)", 'rx="1.5"');
  }

  function fachada(ab) {
    var s = R(50, 690, 700, 154, MURO, 'rx="18"') + R(50, 826, 700, 18, "#E4D9CB", 'rx="9"') + R(50, 790, 700, 4, "rgba(14,17,22,.07)");
    var xs = [100, 190, 280, 486, 576, 666], cols = [P.alcoba.campo, P.alcoba.campo, P.alcoba.campo, P.alcoba.campo, P.alcoba.campo, P.alcoba.campo], i;
    var cb = [P.cocina.campo, P.mesa.campo, P.cocina.campo, P.mesa.campo, P.cocina.campo, P.mesa.campo];
    for (i = 0; i < xs.length; i++) {
      s += ventanaFachada(xs[i], 752, 34, 30, cols[i]) + ventanaFachada(xs[i], 800, 34, 30, cb[i]);
      s += R(xs[i] - 4, 783, 42, 5, "#D9CBBB", 'rx="2.5"');
    }
    s += ventanaFachada(383, 752, 34, 30, P.alcoba.campo) + R(364, 783, 72, 6, "#D9CBBB", 'rx="3"') + R(366, 777, 68, 3, "rgba(255,255,255,.9)", 'rx="1.5"');
    var pu = '<path d="' + arcoVentana(368, 790, 64, 54) + '" fill="#FFFFFF"/><path d="' + arcoVentana(373, 795, 54, 49) + '" fill="' + P.puerta.campo + '"/>' +
      R(398.5, 810, 3, 34, "rgba(14,17,22,.12)") + C(392, 826, 2.6, P.puerta.placa) + C(408, 826, 2.6, P.puerta.placa) + R(380, 802, 14, 16, "rgba(255,255,255,.28)", 'rx="5"') + R(406, 802, 14, 16, "rgba(255,255,255,.28)", 'rx="5"') +
      R(356, 844, 88, 30, PIEDRA, 'rx="10"') + R(362, 850, 76, 3, "rgba(14,17,22,.06)", 'rx="1.5"') + R(362, 862, 76, 3, "rgba(14,17,22,.06)", 'rx="1.5"');
    s += ab ? '<g class="room" data-room="puerta">' + R(356, 786, 88, 88, "transparent") + pu + "</g>" : pu;
    return s;
  }

  function tejado() {
    var s = '<g clip-path="url(#anillo)">', a = 'M50 40 L750 40 L610 180 L190 180Z', b = 'M50 740 L750 740 L610 600 L190 600Z', c = 'M50 40 L190 180 L190 600 L50 740Z', d = 'M750 40 L610 180 L610 600 L750 740Z';
    s += '<path d="' + a + '" fill="' + TEJAS.n + '"/><path d="' + b + '" fill="' + TEJAS.s + '"/><path d="' + c + '" fill="' + TEJAS.o + '"/><path d="' + d + '" fill="' + TEJAS.e + '"/>';
    s += '<path d="' + a + " " + b + '" fill="url(#tj)"/><path d="' + c + " " + d + '" fill="url(#tjh)"/>';
    s += '<path d="M50 40 L190 180 M750 40 L610 180 M50 740 L190 600 M750 740 L610 600" stroke="rgba(255,226,206,.42)" stroke-width="4" stroke-linecap="round"/>';
    s += '<path d="' + rr(120, 110, 560, 560, 10) + '" fill="none" stroke="rgba(255,226,206,.38)" stroke-width="6" stroke-linejoin="round"/>';
    s += '<path d="' + rr(56, 46, 688, 688, 36) + '" fill="none" stroke="rgba(255,226,206,.30)" stroke-width="8"/>';
    s += "</g>";
    s += '<g clip-path="url(#apertura)"><path d="' + rr(190, 180, 420, 420, 16) + '" fill="none" stroke="rgba(14,17,22,.11)" stroke-width="22"/></g>';
    s += R(54, 748, 692, 10, "rgba(14,17,22,.10)", 'rx="5"');
    /* tragaluces: claraboyas sobre las alas laterales */
    s += R(96, 368, 48, 64, "#D5E3EC", 'rx="14"') + R(100, 372, 40, 56, "none", 'rx="11" stroke="rgba(255,255,255,.7)" stroke-width="3"') +
      R(656, 368, 48, 64, "#D5E3EC", 'rx="14"') + R(660, 372, 40, 56, "none", 'rx="11" stroke="rgba(255,255,255,.7)" stroke-width="3"');
    return s;
  }

  function corredor(ab) {
    var s = '<path d="' + rr(190, 180, 420, 420, 16) + '" fill="' + PIEDRA + '"/>', i, v;
    s += '<g stroke="rgba(120,80,50,.07)" stroke-width="2">';
    for (i = 1; i < 15; i++) { v = 190 + i * 28; s += '<path d="M' + v + " 180 V600 M190 " + (v - 10) + ' H610"/>'; }
    s += "</g>";
    return s;
  }
  function columnas(ab) {
    var s = '<g class="deco">', i, v;
    if (ab) {
      for (i = 0; i < 7; i++) {
        v = 232 + i * 56;
        s += C(v + 2, 218, 7.5, "rgba(14,17,22,.22)") + C(v, 214, 7, "#FFFFFF");
        if (i !== 3) s += C(v + 2, 590, 7.5, "rgba(14,17,22,.22)") + C(v, 586, 7, "#FFFFFF");
        if (i > 0 && i < 6) s += C(218, v + 4, 7.5, "rgba(14,17,22,.22)") + C(214, v, 7, "#FFFFFF") + C(590, v + 4, 7.5, "rgba(14,17,22,.22)") + C(586, v, 7, "#FFFFFF");
      }
    } else {
      s += '<path d="' + rr(222, 212, 356, 356, 10) + '" fill="none" stroke="rgba(14,17,22,.12)" stroke-width="9"/><path d="' + rr(222, 210, 356, 356, 10) + '" fill="none" stroke="#C9A98C" stroke-width="5" stroke-linejoin="round"/>';
      for (i = 0; i <= 12; i++) { v = 222 + i * 29.7; s += C(v, 210, 3, "#B58E6F") + C(v, 566, 3, "#B58E6F") + C(222, v, 3, "#B58E6F") + C(578, v, 3, "#B58E6F"); }
    }
    return s + "</g>";
  }

  function patioSVG(patio) {
    var s = '<g class="room" data-room="patio">' + R(232, 222, 336, 336, NOCHE, 'class="fl" rx="16"');
    s += estrellas(244, 234, 556, 546, 22);
    s += '<g fill="' + PAPEL + '" opacity=".07">' + R(389, 240, 22, 320, PAPEL, 'rx="11"') + R(240, 389, 320, 22, PAPEL, 'rx="11"') + "</g>";
    if (patio === "a") {
      s += '<g class="halo">' + C(400, 390, 110, PAPEL, 'opacity=".06"') + C(400, 390, 74, PAPEL, 'opacity=".10"') + "</g>" +
        C(404, 396, 52, "rgba(0,0,0,.28)") + C(400, 390, 48, "#E6EBF1") + C(400, 390, 38, P.ventana.agua) + C(400, 390, 24, "#9CC9E2") + C(400, 390, 9, PAPEL, 'class="corazon"') +
        '<g class="reveal" fill="none" stroke="' + PAPEL + '" stroke-width="3" stroke-dasharray="5 9"><circle cx="400" cy="390" r="64"/></g>';
      s += matera(268, 258, 15) + matera(532, 258, 15) + matera(268, 522, 15) + matera(532, 522, 15);
    } else {
      s += arbol(284, 286, 40) + matera(530, 262, 14) + matera(268, 522, 15) + matera(532, 522, 15);
      s += persona(318, 440, .6, P.mesa.agua, "sway") + persona(482, 440, .6, P.mesa.luz, "sway2");
      s += C(404, 400, 62, "rgba(0,0,0,.28)") + C(400, 396, 60, P.mesa.campo) + C(400, 396, 36, "#F4B9C1") + C(380, 380, 8, P.mesa.placa) + C(420, 410, 8, P.mesa.placa);
      s += '<g class="reveal">' + C(400, 396, 74, "none", 'stroke="' + P.mesa.luz + '" stroke-width="4" stroke-dasharray="6 9"') + "</g>";
    }
    s += R(228, 218, 344, 344, "none", 'class="ring" rx="20" stroke="#FFFFFF" stroke-width="4"');
    return s + "</g>";
  }

  function ventanas(patio) {
    var s = '<g class="room ventanas" data-room="ventana">' + R(236, 184, 328, 34, "transparent"), i, x, xs = [262, 320, 444, 502];
    for (i = 0; i < 4; i++) {
      x = xs[i];
      s += '<path class="pane" d="' + arcoVentana(x, 190, 38, 26) + '" fill="' + NOCHE + '"/>' + R(x + 6, 204, 26, 3, "rgba(244,246,248,.55)", 'rx="1.5"');
    }
    return s + "</g>";
  }

  function etiquetas(llaves) {
    var pos = { cocina: [234, 60], escaleras: [566, 60], alcoba: [234, 60], mesa: [208, 620], puerta: [400, 718], patio: [400, 288], ventana: [400, 198] }, s = '<g class="tags" aria-hidden="true">';
    llaves.forEach(function (k) {
      var d = datos(k), t = d.nombre + " · " + d.palabra, w = Math.round(t.length * 11.6 + 34), p = pos[k];
      s += '<g class="tag" data-for="' + k + '" transform="translate(' + p[0] + " " + p[1] + ')">' + R(-w / 2, -19, w, 38, "rgba(14,17,22,.92)", 'rx="19"') +
        '<text class="c" x="0" y="7" fill="#F4F6F8">' + t + "</text></g>";
    });
    return s + "</g>";
  }

  function arbustos() {
    var s = "", b = [[30, 700, 26], [24, 760, 20], [34, 826, 24], [770, 706, 24], [778, 772, 20], [768, 828, 26], [150, 866, 18], [248, 872, 14], [552, 872, 14], [650, 866, 20]], i;
    for (i = 0; i < b.length; i++) s += C(b[i][0] + 3, b[i][1] + 5, b[i][2], "rgba(14,17,22,.10)") + C(b[i][0], b[i][1], b[i][2], i % 2 ? VERDE2 : VERDE) + C(b[i][0] - 5, b[i][1] - 5, b[i][2] * .5, i % 2 ? "#C2D8BE" : VERDE2);
    return s;
  }

  function planoSVG() {
    var ab = estado.piso === "ab", pa = estado.patio, s = "", llaves;
    s += defs() + R(14, 14, 772, 872, "#EEF1F4", 'rx="44"') + arbustos();
    s += '<rect x="62" y="60" width="704" height="800" rx="46" fill="rgba(14,17,22,.20)" filter="url(#bl)"/>';
    s += fachada(ab) + corredor(ab) + patioSVG(pa) + columnas(ab) + tejado() + ventanas(ab ? pa : "a");
    if (ab) {
      s += cuarto("cocina", 84, 54, 300, 112, "cocina", SALA.cocina());
      s += cuarto("escaleras", 416, 54, 300, 112, "escaleras", SALA.escaleras(true));
      if (pa === "a") s += cuarto("mesa", 84, 614, 250, 112, "mesa", SALA.mesa());
      /* zaguán: el paso del portón al patio */
      s += '<g class="room" data-room="puerta">' + R(344, 592, 8, 150, "rgba(60,20,10,.30)") + R(448, 592, 8, 150, "rgba(60,20,10,.30)") + R(352, 592, 96, 150, P.puerta.campo, 'class="fl" rx="14"') + R(354, 594, 92, 146, "none", 'rx="13" stroke="rgba(14,17,22,.08)" stroke-width="5"') + SALA.puerta() + R(348, 588, 104, 156, "none", 'class="ring" rx="18" stroke="#FFFFFF" stroke-width="4"') + "</g>";
      llaves = ["cocina", "escaleras"].concat(pa === "a" ? ["mesa"] : [], ["puerta", "patio", "ventana"]);
    } else {
      s += cuarto("alcoba", 84, 54, 300, 112, "alcoba", SALA.alcoba());
      s += cuarto("escaleras", 416, 54, 300, 112, "escaleras", SALA.escaleras(false));
      s += R(352, 600, 96, 140, TEJAS.s, "") + R(352, 600, 96, 140, "url(#tj)", "") + R(364, 706, 72, 32, "#D9C2AE", 'rx="12"') + R(370, 712, 60, 5, "rgba(255,255,255,.7)", 'rx="2.5"');
      llaves = ["alcoba", "escaleras", "patio", "ventana"];
    }
    return s + etiquetas(llaves);
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
    $$(".tag", plano).forEach(function (g) { g.classList.toggle("on", g.getAttribute("data-for") === k); });
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
    g.innerHTML = NAOS_BRAZOS.cella({ cx: 326, base: 160, s: .5, p: p, b: b, izq: izq, der: der, abre: quieto ? 1 : (izq > 1 || der > 1 ? 1 : 0), id: "ce" });
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
