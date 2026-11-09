/* figura40.js · NAOS marca v6 · Cella 4.0 (D-380, 9-nov-2026)
 * Cella 4.0 como capa sobre marca/v5-figura/figura.js y cella-brazos.js (que se leen SIN editar). Se carga DESPUES de esos dos y reemplaza
 * window.NAOS_FIGURA y window.NAOS_BRAZOS por objetos con la MISMA interfaz (cella, cellaGeo, cellaMarca, cellaAvatar, colorDato, pal, svg,
 * avatar, grupo, reaccion, respira, EASE, PAL; brazo, gesto, ojo, cella, paleta, LIM, PIV, LARGO), de modo que escena8 y escena9 no notan la
 * diferencia salvo en lo que 4.0 cambia: los OJOS (formas blancas, sin aro, sin pupila; la expresion es la forma y nunca el color) y la
 * CORONA plana de alostasis en salsa #A8362A (geometria de cola/imagenes-2026-11-06/_motor/lamina.js, sin giro, sin chispas, sin glitch).
 * Cuerpo, brazos, respiracion y tinta del dato son los de v5, a proposito: Cella sigue tierna, pastel y sin manos.
 * Los ojos son los de la maqueta empresa/evolucion/2026-11-09-limite/naos40-visual/v2/src/cella40.js (blancos, sin aro).
 *
 * Ojos y estados:
 *   NAOS_FIGURA.v40.EYES      las 11 formas: dot, wide, happy, closed, chevron, flat, tiltin, tiltout, lidded, smile, wink
 *   NAOS_FIGURA.v40.ESTADOS   { "neutra": {ojos:"dot"}, "ojos-cerrados": {ojos:"closed"}, "alostasis": {ojos:"dot", corona:"#A8362A"} }
 *   NAOS_FIGURA.v40.ojos(clave, opt)     dos ojos en la caja de 240; opt {y, dx, dy, color, chico}
 *   NAOS_FIGURA.v40.corona(color, b)     la corona plana para la caja de 240 (b = respiracion 0..1, la corona sube con la cabeza)
 *   NAOS_FIGURA.cella(null, {..., ojos: "dot"|"happy"|...|"none", estado40: "alostasis"})  la figura entera con ojos 4.0 ("none": sin ojos, la escena los dibuja)
 * Sin raya larga en textos. Ningun hex fuera de los tokens de la maqueta (INK, CREMA, SALSA). */
(function (raiz) {
  "use strict";
  var V5 = raiz.NAOS_FIGURA, B5 = raiz.NAOS_BRAZOS;
  if (!V5 || !B5) throw new Error("figura40: cargar marca/v5-figura/figura.js y cella-brazos.js antes de figura40.js");

  var INK = "#0E1116", CREMA = "#F4F6F8", SALSA = "#A8362A";
  function f(n) { return (+n).toFixed(2); }

  /* ---------------- ojos: solo forma, relleno blanco, sin aro, sin pupila ---------------- */
  function STR(w, c) { return 'fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"'; }
  var EYES = {
    dot:     { uso: "reposo",            f: function (x, y, s, c, k) { return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(6.6 * k) + '" fill="' + c + '"/>'; } },
    wide:    { uso: "nota algo",         f: function (x, y, s, c, k) { return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(6 * k) + '" ry="' + f(10.4 * k) + '" fill="' + c + '"/>'; } },
    happy:   { uso: "tierna, da",        f: function (x, y, s, c, k) { return '<path d="M' + f(x - 8 * k) + " " + f(y + 4 * k) + " Q" + f(x) + " " + f(y - 9 * k) + " " + f(x + 8 * k) + " " + f(y + 4 * k) + '" ' + STR(f(5.4 * k), c) + "/>"; } },
    closed:  { uso: "respira, suelta",   f: function (x, y, s, c, k) { return '<path d="M' + f(x - 8 * k) + " " + f(y - 2 * k) + " Q" + f(x) + " " + f(y + 8 * k) + " " + f(x + 8 * k) + " " + f(y - 2 * k) + '" ' + STR(f(5.4 * k), c) + "/>"; } },
    chevron: { uso: "aguanta",           f: function (x, y, s, c, k) { return '<path d="M' + f(x - s * 6 * k) + " " + f(y - 7 * k) + " L" + f(x + s * 5 * k) + " " + f(y) + " L" + f(x - s * 6 * k) + " " + f(y + 7 * k) + '" ' + STR(f(5.4 * k), c) + "/>"; } },
    flat:    { uso: "sostiene",          f: function (x, y, s, c, k) { return '<rect x="' + f(x - 9.5 * k) + '" y="' + f(y - 2.6 * k) + '" width="' + f(19 * k) + '" height="' + f(5.2 * k) + '" rx="' + f(2.6 * k) + '" fill="' + c + '"/>'; } },
    tiltin:  { uso: "decide",            f: function (x, y, s, c, k) { return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(5.6 * k) + '" ry="' + f(8.6 * k) + '" fill="' + c + '" transform="rotate(' + f(s * 24) + " " + f(x) + " " + f(y) + ')"/>'; } },
    tiltout: { uso: "duda suave",        f: function (x, y, s, c, k) { return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(5.6 * k) + '" ry="' + f(8.6 * k) + '" fill="' + c + '" transform="rotate(' + f(-s * 24) + " " + f(x) + " " + f(y) + ')"/>'; } },
    lidded:  { uso: "calma, cansancio",  f: function (x, y, s, c, k) { var w = 8.4 * k; return '<path d="M' + f(x - w) + " " + f(y - 3 * k) + " H" + f(x + w) + " A" + f(w) + " " + f(w) + " 0 0 1 " + f(x - w) + " " + f(y - 3 * k) + ' Z" fill="' + c + '"/>'; } },
    smile:   { uso: "divertida",         f: function (x, y, s, c, k) { var w = 8.4 * k; return '<path d="M' + f(x - w) + " " + f(y + 4 * k) + " H" + f(x + w) + " A" + f(w) + " " + f(w) + " 0 0 0 " + f(x - w) + " " + f(y + 4 * k) + ' Z" fill="' + c + '"/>'; } },
    wink:    { uso: "broma",             f: function (x, y, s, c, k) { return s < 0 ? EYES.dot.f(x, y, s, c, k) : EYES.happy.f(x, y, s, c, k); } }
  };
  // dos ojos al frente (x 106 y 134, y 108 en reposo). opt: y, dx, dy (mirada, en unidades de la caja), color, chico (16 a 40 px: ojos 1,3 veces mayores)
  function ojos(clave, opt) {
    opt = opt || {}; var e = EYES[clave] || EYES.dot, c = opt.color || CREMA, k = opt.chico ? 1.3 : 1, y = (opt.y != null ? opt.y : 108) + (opt.dy || 0), dx = opt.dx || 0;
    return e.f(106 + dx, y, -1, c, k) + e.f(134 + dx, y, 1, c, k);
  }

  /* ---------------- corona plana de alostasis ---------------- */
  var CORONA = "M76 66 L76 22 L98 44 L120 12 L142 44 L164 22 L164 66 Z";
  function corona(color, b) { return '<path transform="translate(0 ' + f(-8 * (b || 0)) + ')" d="' + CORONA + '" fill="' + (color || SALSA) + '"/>'; }

  /* ---------------- estados por forma (nunca por color) ---------------- */
  var ESTADOS = {
    "neutra":        { ojos: "dot" },
    "ojos-cerrados": { ojos: "closed" },
    "alostasis":     { ojos: "dot", corona: SALSA }
  };

  /* ---------------- la figura (misma firma que figura.js) ---------------- */
  function cella(destino, o) {
    if (o === undefined && destino && !destino.nodeType && !destino.canvas) { o = destino; destino = null; }
    if (destino && destino.canvas && destino.fillRect) return V5.cella(destino, o);   // lienzo 2D: sale el de v5 (4.0 no se usa en canvas)
    var o2 = {}, k; for (k in o) o2[k] = o[k]; o = o2;
    var st = ESTADOS[o.estado40] || {}, clave = o.ojos || st.ojos || (o.abiertos ? "dot" : "closed"), cor = o.corona !== undefined ? o.corona : st.corona;
    var p = { tx: o.p && o.p.tx || INK, bg: o.p && o.p.bg || CREMA }; for (k in o.p) if (!(k in p)) p[k] = o.p[k];
    o.p = p;
    var g = V5.cellaGeo(o), s = o.s || 1, W = 240 * s, ojosColor = o.ojosColor || p.bg;
    var ex = g.ojos[0][0] - 92, y = g.ojos[0][1];
    var inner = '<g transform="' + (o.hacia === -1 ? "translate(240 0) scale(-1 1) " : "") + "rotate(" + f(g.lean) + " " + g.giro[0] + " " + g.giro[1] + ')">' +
      '<path d="' + g.cuerpo + '" fill="' + p.tx + '"/>' + (clave === "none" ? "" : ojos(clave, { y: y, dx: ex, color: ojosColor, chico: o.chico })) + (cor ? corona(cor, g.b) : "") + "</g>";
    var head = o.x != null ? '<svg class="a" style="left:' + o.x + "px;top:" + o.y + 'px;overflow:visible" width="' + f(W) + '" height="' + f(W) + '" viewBox="0 0 240 240">'
                           : '<svg xmlns="http://www.w3.org/2000/svg" width="' + f(W) + '" height="' + f(W) + '" viewBox="0 0 240 240">';
    var out = head + (o.fondo ? '<rect width="240" height="240" fill="' + p.bg + '"/>' : "") + inner + "</svg>";
    if (destino && destino.nodeType === 1) destino.innerHTML = out;
    return out;
  }
  // marca quieta: cuerpo con los ojos cerrados de 4.0 recortados como hueco (sin aro)
  function cellaMarca(tx) {
    var g = V5.cellaGeo({ estado: "humanity", b: 0, r: 0, k: 0, abiertos: false, p: { tx: tx, bg: "none" } });
    var hueco = ojos("closed", { y: 108, color: "#000" });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="54 62 132 162" width="132" height="162"><title>NAOS · Cella 4.0</title>' +
      '<mask id="cella-ojos40"><rect x="0" y="0" width="240" height="240" fill="#fff"/>' + hueco + '</mask><path d="' + g.cuerpo + '" fill="' + tx + '" mask="url(#cella-ojos40)"/></svg>';
  }
  function cellaAvatar(px, a) {
    a = a || {}; var chico = px <= 40, campo = a.campo || V5.PAL.paper, tx = a.tx || V5.PAL.ink;
    var esc = a.favicon ? (chico ? 1.5 : 1.3) : (chico ? 1.12 : 1.0), cy = 143;
    var fondo = (a.cuadrado || a.favicon) ? '<rect width="240" height="240" fill="' + campo + '"/>' : '<circle cx="120" cy="120" r="120" fill="' + campo + '"/>';
    var fig = cella(null, { estado: "humanity", b: 0.3, p: { tx: tx, bg: campo }, chico: chico, ojos: "closed", ojosColor: campo, s: 1 }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" viewBox="0 0 240 240">' + fondo +
      '<g transform="translate(120 ' + (a.favicon ? 122 : 124) + ") scale(" + esc + ") translate(-120 -" + cy + ')">' + fig + "</g></svg>";
  }
  // cuerpo de la caja de 240 como funcion de k de la figura de v5 (las FIG y avatar de v5 siguen en V5)
  var API = {}; for (var kk in V5) API[kk] = V5[kk];
  API.cella = cella; API.cellaMarca = cellaMarca; API.cellaAvatar = cellaAvatar;
  API.v40 = { version: "4.0", EYES: EYES, ESTADOS: ESTADOS, ojos: ojos, corona: corona, CORONA: CORONA, SALSA: SALSA, CREMA: CREMA, INK: INK };
  API.v5 = V5;

  /* ---------------- brazos: la misma forma y topes que cella-brazos.js; solo cambian los ojos de cella() ---------------- */
  var BR = {}; for (var bk in B5) BR[bk] = B5[bk];
  BR.cella = function (o) {
    var s = o.s || 1, b = o.b || 0, p = o.p, Wp = f(240 * s), iz = o.izq || 0, de = o.der || 0;
    if (iz > B5.LIM.dosArriba && de > B5.LIM.dosArriba) throw new Error("cella-brazos: los dos arriba de " + B5.LIM.dosArriba + " (orans/victoria)");
    var caja = function (inner) { return '<svg width="' + Wp + '" height="' + Wp + '" viewBox="0 0 240 240" style="overflow:visible">' + inner + "</svg>"; };
    var detras = B5.brazo("izq", iz, p.tx) + B5.brazo("der", de, p.tx);
    var clave = o.contento ? "happy" : (o.abre || 0) > 0.34 ? ((o.abre || 0) < 0.67 ? "lidded" : "dot") : "closed";
    var cuerpo = cella(null, { estado: "humanity", b: b, p: p, id: o.id, s: s, ojos: clave });
    return '<g transform="translate(' + f(o.cx - 120 * s) + " " + f(o.base - 212 * s) + ')">' + (detras ? caja(detras) : "") + cuerpo + "</g>";
  };

  raiz.NAOS_FIGURA = API;
  raiz.NAOS_BRAZOS = BR;
})(typeof window !== "undefined" ? window : this);
