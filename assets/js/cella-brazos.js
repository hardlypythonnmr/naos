/* cella-brazos.js v2 · los DOS BRAZOS GRANDES de Cella para "This is NAOS now" v2 (N, 20-oct: "perhaps she only moves the two big arms
 * it has ... do it how you think will be more relatable"; D-279). Director de signo, 20-oct. figura.js NO se edita: este archivo dibuja
 * detrás y encima de NAOS_FIGURA.cella(), con la misma caja de 240, la misma x, y y s. v1 (paletas de 64, se leían como manitos) queda en
 * v1/cella-brazos.js.
 *
 * Forma (guion.md §6, ajustada por signo): cada brazo es el costado del cuerpo que se despega desde el hombro. Largo 100, ancho 22 en la
 * raíz y 18 en la punta, punta redonda, del color del cuerpo, plano, dos tonos, sin mano, dedos ni codo. Pivote en el centro de la raíz,
 * 11 adentro del borde: (77, 96) y (163, 96). En reposo (0 grados, colgando) el brazo entero queda detrás del cuerpo (x 66 a 88, punta en
 * y 205 contra el suelo en 212): la marca sigue siendo la marca. Abierto, sale del costado desde el hombro, largo como el cuerpo.
 * Ángulo en grados desde colgando, hacia afuera. Límites (naos-signo-choques, arte/choques.mjs): nunca 90 o más (ni T ni cruz con el
 * cuerpo vertical), nunca los dos arriba de 60 a la vez (ni orans ni victoria), sin saludo en bucle, un ángulo negativo no dibuja nada
 * (ni pose de oración: los brazos van detrás del cuerpo y solo giran hacia afuera). Tope duro 66 aquí.
 * Movimiento (más lento que v1, va con el ritmo nuevo): abre en 350 ms con 3 grados de sobrepaso, queda (o viaja despacio de a a a2:
 * barrer), se recoge en 300 ms (o en "recoge" s: traer algo hacia sí). La respiración sigue (8 de 240) y no mueve los hombros.
 *
 * Ojos (D-270): cerrados por defecto; abiertos en el sitio, sin correrse; contentos (arcos hacia arriba) en la risa; 120 ms por cambio.
 * Nunca abiertos durante una exhalación: lo comprueba la escena.
 *
 *   NAOS_BRAZOS.cella({ cx, base, s, p, b, izq, der, abre, contento, id })
 *   NAOS_BRAZOS.gesto(t, g)       g = { t0, t1, a, a2?, recoge? }
 *   NAOS_BRAZOS.ojo(t, t0, t1)
 *   NAOS_BRAZOS.brazo(lado, ang, color)   el path en la caja de 240 (para choques.mjs)
 *   NAOS_BRAZOS.LIM */
(function (raiz) {
  "use strict";
  var LIM = { max: 66, dosArriba: 60, abre: 0.35, recoge: 0.30, sobre: 3, ojo: 0.12 };
  var PIV = { izq: [77, 96], der: [163, 96] }, LARGO = 100, R0 = 11, R1 = 9;
  function cl(x) { return Math.max(0, Math.min(1, x)); }
  function sn(x) { x = cl(x); return 0.5 - 0.5 * Math.cos(Math.PI * x); }
  function f(n) { return (+n).toFixed(2); }
  var EASE = (raiz.NAOS_FIGURA && raiz.NAOS_FIGURA.EASE) || sn;

  var FORMA = "M" + (-R0) + " 0 L" + (-R1) + " " + LARGO + " A" + R1 + " " + R1 + " 0 0 0 " + R1 + " " + LARGO + " L" + R0 + " 0 A" + R0 + " " + R0 + " 0 0 0 " + (-R0) + " 0 Z";
  function brazo(lado, ang, color) {
    if (!(ang > 0.05)) return "";
    if (ang >= 90) throw new Error("cella-brazos: " + lado + " a " + ang + " grados (90 o más es T o cruz)");
    ang = Math.min(LIM.max, ang);
    var q = PIV[lado], giro = lado === "izq" ? ang : -ang;
    return '<path transform="translate(' + q[0] + " " + q[1] + ") rotate(" + f(giro) + ')" d="' + FORMA + '" fill="' + (color || "#000") + '"/>';
  }
  function gesto(t, g) {
    var rec = g.recoge || LIM.recoge;
    if (!g || t < g.t0 || t > g.t1 + rec) return 0;
    var u = (t - g.t0) / LIM.abre, a = g.a, v;
    if (u < 0.7) v = (a + LIM.sobre) * EASE(u / 0.7);
    else if (u < 1) v = a + LIM.sobre - LIM.sobre * sn((u - 0.7) / 0.3);
    else v = g.a2 != null ? a + (g.a2 - a) * sn((t - g.t0 - LIM.abre) / Math.max(.01, g.t1 - g.t0 - LIM.abre)) : a;
    if (t >= g.t1) v *= 1 - sn((t - g.t1) / rec);
    return v;
  }
  function ojo(t, t0, t1) { return cl((t - t0) / LIM.ojo) * (t1 == null ? 1 : 1 - cl((t - t1) / LIM.ojo)); }

  function ojos(g, p, abre, contento) {
    if (!contento && !(abre > 0.34)) return "";
    var s = "", R = g.rad;
    g.ojos.forEach(function (q) {
      s += '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + f(R * 2.1) + '" fill="' + p.tx + '"/>';
      if (contento) s += '<path d="M' + f(q[0] - R * 1.3) + " " + f(q[1] + R * .55) + " Q" + f(q[0]) + " " + f(q[1] - R * 1.5) + " " + f(q[0] + R * 1.3) + " " + f(q[1] + R * .55) +
        '" fill="none" stroke="' + p.bg + '" stroke-width="' + f(R * .9) + '" stroke-linecap="round"/>';
      else if (abre < 0.67) s += '<ellipse cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" rx="' + f(R * 1.15) + '" ry="' + f(R * .5) + '" fill="' + p.bg + '"/>';
      else s += '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + f(R) + '" fill="' + p.bg + '"/>';
    });
    return s;
  }

  function cella(o) {
    var F = raiz.NAOS_FIGURA, s = o.s || 1, b = o.b || 0, p = o.p, Wp = f(240 * s);
    var iz = o.izq || 0, de = o.der || 0;
    if (iz > LIM.dosArriba && de > LIM.dosArriba) throw new Error("cella-brazos: los dos arriba de " + LIM.dosArriba + " (orans/victoria)");
    var g = F.cellaGeo({ estado: "humanity", b: b, r: 0, k: 0, abiertos: false, p: p });
    var caja = function (inner) { return '<svg width="' + Wp + '" height="' + Wp + '" viewBox="0 0 240 240" style="overflow:visible">' + inner + "</svg>"; };
    var detras = brazo("izq", iz, p.tx) + brazo("der", de, p.tx), encima = ojos(g, p, o.abre || 0, !!o.contento);
    return '<g transform="translate(' + f(o.cx - 120 * s) + " " + f(o.base - 212 * s) + ')">' +
      (detras ? caja(detras) : "") +
      F.cella(null, { estado: "humanity", b: b, p: p, id: o.id, s: s, abiertos: false }) +
      (encima ? caja(encima) : "") + "</g>";
  }

  raiz.NAOS_BRAZOS = { cella: cella, gesto: gesto, ojo: ojo, brazo: brazo, paleta: brazo, LIM: LIM, PIV: PIV, LARGO: LARGO };
})(typeof window !== "undefined" ? window : this);
