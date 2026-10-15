/* assets/js/figura.js · copia sin cambios de n-system earn/naos/marca/v5-figura/figura.js (commit 5fca4e4c, 2026-10-15),
 * la figura Cella que reemplaza a Tikr (LEEME.md de esa carpeta, §B y §D). No editar aquí: se edita allá y se vuelve a copiar.
 * La página usa NAOS_FIGURA.cella() a través de assets/js/cella.js (respiración, reacción, movimiento reducido). */
/* figura.js · NAOS marca v5 · la figura que reemplaza a Tikr (prototipos del director de signo, 2026-10-15)
 * Siete candidatos construidos como tikr() de G3 (empresa/estilo/v8/G3/obra.js): cada uno es una función de o.u (segundos)
 * que devuelve SVG. Dos tonos y nada más: la masa en p.tx (tinta sobre blanco, papel sobre noche) y los huecos en p.bg.
 * Sin degradado, sin sombra, sin trazo fino (biblia v8-r2 §3.4, isotipo v4 §3.2). La curva es la de --ease-enter.
 *
 * Dos estados de la misma figura (N: "One, two states"):
 *   humanity  respira: un ciclo de o.periodo s (2 s en los bucles de prueba; 4 s = --t-breath-phase en producción), ojos cerrados
 *   present   alerta: respiración corta y doble, ojos abiertos, y la reacción: se vuelve o se inclina hacia lo que pasa en la
 *             página (o.r de 0 a 1; si no se da, el bucle de 2 s va 0 > 1 > 0 con la curva de entrada de 600 ms)
 * La figura mira siempre hacia +x (donde está el titular). o.hacia = -1 la espeja entera.
 * o.chico = true da el dibujo aparte para 16 a 40 px (trazos más gruesos, sin detalles que no lleguen a 2 px).
 *
 * o: { u, estado: "humanity"|"present", p: {tx, bg}, hacia: 1|-1, chico: bool, periodo: s, b?: 0..1, r?: 0..1 }
 * Uso: NAOS_FIGURA.svg("k3", o, 256) -> <svg> de 256 px; NAOS_FIGURA.avatar("k3", {campo, tx}, 32) -> avatar redondo quieto.
 * Ningún hex fuera de PAL (copiados de G3/tokens.css; en la página se leen de las variables). Sin rayas largas en textos. */
(function (raiz) {
  "use strict";

  // ---------- tokens (G3/tokens.css; isotipo v4 §3.1 para el cobalto del campo del avatar) ----------
  var PAL = {
    paper: "#FFFFFF", ink: "#0E1116", night: "#0E1116", nightText: "#F4F6F8", cobalt: "#2438C7", nightCobalt: "#8C9BFF",
    up: "#0B6B50", down: "#6F1530", nightUp: "#4FD9A8", nightDown: "#FF7A94"
  };
  // misma forma que pal() de obra.js: tx, bg, up, dn, acc (cobalto del sub-look Lab), noche
  function pal(noche) { return noche ? { tx: PAL.nightText, bg: PAL.night, up: PAL.nightUp, dn: PAL.nightDown, acc: PAL.nightCobalt, noche: true }
                                     : { tx: PAL.ink, bg: PAL.paper, up: PAL.up, dn: PAL.down, acc: PAL.cobalt, noche: false }; }

  // --ease-enter: cubic-bezier(.2, 0, 0, 1)
  function bezier(x1, y1, x2, y2) {
    function bx(t) { return 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t; }
    function by(t) { return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t; }
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var lo = 0, hi = 1, t = x;
      for (var i = 0; i < 30; i++) { var v = bx(t); if (Math.abs(v - x) < 1e-5) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      return by(t);
    };
  }
  var EASE = bezier(.2, 0, 0, 1), T_ENTER = 0.6;
  function cl(x) { return Math.max(0, Math.min(1, x)); }
  function f(n) { return (+n).toFixed(2); }
  function respira(u, T) { return 0.5 - 0.5 * Math.cos(2 * Math.PI * u / T); }   // 0 > 1 > 0, sin costura
  // reacción del bucle de prueba de 2 s: se vuelve en 600 ms desde 0,2 s, queda, vuelve en 600 ms desde 1,3 s
  function reaccion(u) { u = ((u % 2) + 2) % 2; return EASE(cl((u - 0.2) / T_ENTER)) - EASE(cl((u - 1.3) / T_ENTER)); }
  function vals(o) {
    var pres = o.estado === "present", u = o.u || 0;
    return {
      pres: pres,
      b: o.b != null ? o.b : pres ? 0.45 * respira(u, 1) : respira(u, o.periodo || 2),
      r: o.r != null ? o.r : pres ? reaccion(u) : 0,
      w: o.chico ? 1.7 : 1      // multiplicador de trazo del dibujo chico
    };
  }
  function rot(x, y, cx, cy, deg) {
    var a = deg * Math.PI / 180, dx = x - cx, dy = y - cy;
    return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
  }
  // ojos: cerrados (arco corto) en humanity, abiertos (hueco) en present; dx, dy = hacia dónde miran
  function ojos(pts, v, p, dx, dy, rad) {
    var s = "", R = rad * (v.w > 1 ? 1.35 : 1);
    pts.forEach(function (q) {
      var x = q[0] + dx, y = q[1] + dy;
      if (v.pres) s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(R) + '" fill="' + p.bg + '"/>';
      else s += '<path d="M' + f(x - R * 1.3) + " " + f(y - 1) + " Q" + f(x) + " " + f(y + R * 1.2) + " " + f(x + R * 1.3) + " " + f(y - 1) +
        '" fill="none" stroke="' + p.bg + '" stroke-width="' + f(R * 0.9) + '" stroke-linecap="round"/>';
    });
    return s;
  }
  function hoja(x, y, largo, ancho, ang, color) {   // almendra con base en (x, y), apuntando a ang (grados desde la vertical)
    return '<path transform="translate(' + f(x) + " " + f(y) + ") rotate(" + f(ang) + ')" d="M0 0 Q' + f(ancho) + " " + f(-largo * 0.45) + " 0 " + f(-largo) +
      " Q" + f(-ancho) + " " + f(-largo * 0.45) + ' 0 0 Z" fill="' + color + '"/>';
  }

  // =============== VIVO 1 · "Brote": semilla con un tallo y dos hojas a distinta altura; se dobla hacia la luz (fototropismo) ===============
  function brote(o) {
    var v = vals(o), p = o.p, s = "";
    var ry = 34 * (1 + 0.04 * v.b), cy = 212 - ry, sw = 10 * v.w;
    var a = 18 * v.r, base = [120, cy - ry + 6];
    var top = rot(120, cy - ry - 70 - 4 * v.b, base[0], base[1], a), mid = rot(118, cy - ry - 34, base[0], base[1], a * 0.4);
    s += '<path d="M' + f(base[0]) + " " + f(base[1]) + " Q" + f(mid[0]) + " " + f(mid[1]) + " " + f(top[0]) + " " + f(top[1]) +
      '" fill="none" stroke="' + p.tx + '" stroke-width="' + f(sw) + '" stroke-linecap="round"/>';
    // dos hojas a distinta altura: una en la punta, siguiendo el tallo; otra más abajo, al otro lado.
    // Nunca opuestas en el mismo punto: tallo más dos hojas a la misma altura dibuja una cruz (choque con la cruz ortodoxa a 4,3 %).
    var abre = 10 * v.b, baja = rot(119, cy - ry - 30, base[0], base[1], a * 0.5);
    s += hoja(top[0], top[1], o.chico ? 56 : 58, o.chico ? 21 : 18, 22 + abre * 0.4 + a * 1.1, p.tx);
    s += hoja(baja[0], baja[1], o.chico ? 40 : 42, o.chico ? 17 : 14, -64 - abre + a * 0.8, p.tx);
    s += '<ellipse cx="120" cy="' + f(cy) + '" rx="' + f(50 + (o.chico ? 4 : 0)) + '" ry="' + f(ry + (o.chico ? 2 : 0)) + '" fill="' + p.tx + '"/>';
    s += ojos([[104, cy + 2], [130, cy + 2]], v, p, 7 * v.r, -3 * v.r, 5);
    return s;
  }

  // =============== VIVO 2 · "Llama": una llama con cara; el aire de la noticia la empuja ===============
  function llama(o) {
    var v = vals(o), p = o.p, s = "", u = o.u || 0;
    var temb = v.pres ? 2.5 * Math.sin(2 * Math.PI * 2 * u) : 0;      // 2 Hz, solo forma, sin cambio de luz
    var tx = 120 + 34 * v.r + temb, ty = 40 - 10 * v.b + 6 * v.r;
    s += '<path d="M76 168 C76 128 ' + f(104 + 14 * v.r) + " 112 " + f(tx) + " " + f(ty) + " C" + f(136 + 22 * v.r) + " 108 164 128 164 168" +
      ' A44 44 0 0 1 76 168 Z" fill="' + p.tx + '"/>';
    var it = 150 + 10 * v.r;
    s += '<path d="M106 190 C106 178 ' + f(it - 30) + " 168 " + f(it - 18) + " 158 C" + f(it - 16) + ' 172 134 178 134 190 A14 14 0 0 1 106 190 Z" fill="' + p.bg + '"/>';
    s += ojos([[106, 146], [130, 146]], v, p, 6 * v.r, -2 * v.r, 5);
    return s;
  }

  // =============== VIVO 3 · "Medusa": la respiración es su manera de moverse; se deja llevar hacia lo que pasa ===============
  function medusa(o) {
    var v = vals(o), p = o.p, s = "", u = o.u || 0;
    var sx = 1 - 0.08 * v.b, sy = 1 + 0.07 * v.b, ang = 12 * v.r, dx = 10 * v.r;
    var cuerpo = '<path d="M64 124 C64 70 176 70 176 124 Q162 136 148 126 Q134 138 120 126 Q106 138 92 126 Q78 136 64 124 Z" fill="' + p.tx + '"/>';
    var xs = o.chico ? [96, 144] : [84, 108, 132, 156], ten = "";
    xs.forEach(function (x, i) {
      var fase = 2 * Math.PI * (u / (v.pres ? 1 : (o.periodo || 2))) + i * 0.9, L = 70 + (i % 2) * 10 + 8 * v.b, d = "M" + x + " 126";
      for (var k = 1; k <= 4; k++) {
        var yy = 126 + L * k / 4, xx = x + Math.sin(fase - k * 0.9) * (3 + k * 1.5) - 10 * v.r * (k / 4);
        d += " L" + f(xx) + " " + f(yy);
      }
      ten += '<path d="' + d + '" fill="none" stroke="' + p.tx + '" stroke-width="' + f((o.chico ? 13 : 8)) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    });
    s += '<g transform="translate(' + f(dx) + ' 0) rotate(' + f(ang) + ' 120 124)">';
    s += '<g transform="translate(120 74) scale(' + f(sx) + " " + f(sy) + ') translate(-120 -74)">' + ten + cuerpo +
      ojos([[100, 106], [134, 106]], v, p, 6 * v.r, -2 * v.r, 5) + "</g></g>";
    return s;
  }

  // =============== GUARDIÁN 1 · "Portero": sostiene la puerta; con la noticia la abre y se vuelve ===============
  function portero(o) {
    var v = vals(o), p = o.p, s = "";
    var w = 46 * (1 - 0.55 * v.r), k = 14 * v.r, hx = 180;            // bisagra a la derecha; al abrir la hoja se angosta
    s += '<path d="M' + f(hx - w) + " " + f(58 + k) + " L" + hx + " 58 L" + hx + " 212 L" + f(hx - w) + " " + f(212 - k) + ' Z" fill="' + p.tx + '"/>';
    var bh = 80 * (1 + 0.04 * v.b), top = 196 - bh, lean = 4 * v.r;
    s += '<g transform="rotate(' + f(lean) + ' 90 212)">';
    s += '<path d="M72 196 V212 M104 196 V212" stroke="' + p.tx + '" stroke-width="' + f(12 * v.w) + '"/>';
    s += '<rect x="56" y="' + f(top) + '" width="66" height="' + f(bh) + '" rx="24" fill="' + p.tx + '"/>';
    s += "</g>";
    s += '<path d="M112 ' + f(top + 44) + " L" + f(hx - w + 4) + " " + f(150 + k * 0.3) + '" stroke="' + p.tx + '" stroke-width="' + f(10 * v.w) + '" stroke-linecap="round"/>';
    s += ojos([[78, top + 26], [100, top + 26]], v, p, 6 * v.r, -1 * v.r, 5);
    return s;
  }

  // =============== GUARDIÁN 2 · "Farolero": cuida la luz con una pértiga; con la noticia la levanta hacia ella ===============
  function farolero(o) {
    var v = vals(o), p = o.p, s = "", u = o.u || 0;
    var bh = 70 * (1 + 0.04 * v.b), top = 196 - bh;
    s += '<path d="M76 196 V212 M104 196 V212" stroke="' + p.tx + '" stroke-width="' + f(12 * v.w) + '"/>';
    s += '<rect x="60" y="' + f(top) + '" width="60" height="' + f(bh) + '" rx="28" fill="' + p.tx + '"/>';
    var mano = [114, top + 40], ang = -(52 + 22 * v.r), L = 104;
    var tip = [mano[0] + L * Math.cos(ang * Math.PI / 180), mano[1] + L * Math.sin(ang * Math.PI / 180)];
    s += '<path d="M' + f(mano[0]) + " " + f(mano[1]) + " L" + f(tip[0]) + " " + f(tip[1]) + '" stroke="' + p.tx + '" stroke-width="' + f(8 * v.w) + '" stroke-linecap="round"/>';
    var vaiv = v.pres ? 0 : 5 * Math.sin(2 * Math.PI * u / (o.periodo || 2));
    s += '<g transform="rotate(' + f(vaiv) + " " + f(tip[0]) + " " + f(tip[1]) + ')">';
    s += '<path d="M' + f(tip[0]) + " " + f(tip[1]) + " V" + f(tip[1] + 10) + '" stroke="' + p.tx + '" stroke-width="' + f(6 * v.w) + '"/>';
    s += '<rect x="' + f(tip[0] - 15) + '" y="' + f(tip[1] + 10) + '" width="30" height="34" rx="4" fill="' + p.tx + '"/>';
    if (!o.chico) s += '<rect x="' + f(tip[0] - 7) + '" y="' + f(tip[1] + 18) + '" width="14" height="18" fill="' + p.bg + '"/>';
    s += "</g>";
    s += ojos([[82, top + 26], [104, top + 26]], v, p, 6 * v.r, -4 * v.r, 5);
    return s;
  }

  // =============== GUARDIÁN 3 · "Cella": el cuarto que vive; la puerta corrida a un lado le hace las piernas ===============
  // Sale del P8 de la investigación (bloque macizo con hueco de puerta, el que mejor aguanta a 16 px) con ojos y peso.
  function cella(o) {
    var v = vals(o), p = o.p, s = "";
    var top = 74 - 8 * v.b, lean = 5 * v.r, R = 16;
    var dx0 = o.chico ? 116 : 120, dx1 = o.chico ? 150 : 146, dy = o.chico ? 148 : 152;
    s += '<g transform="rotate(' + f(lean) + ' 174 212)">';
    s += '<path d="M66 212 V' + f(top + R) + " Q66 " + f(top) + " " + f(66 + R) + " " + f(top) + " H" + f(174 - R) + " Q174 " + f(top) + " 174 " + f(top + R) +
      " V212 H" + dx1 + " V" + dy + " H" + dx0 + ' V212 Z" fill="' + p.tx + '"/>';   // dintel recto: un arco en la puerta lee mihrab o capilla (isotipo v4 §4 B)
    s += ojos([[92, top + 34], [120, top + 34]], v, p, 9 * v.r, -2 * v.r, 6);
    s += "</g>";
    return s;
  }

  // =============== HÍBRIDO · "Caracol": un ser vivo que carga el cuarto; asoma los ojos a lo que pasa ===============
  function caracol(o) {
    var v = vals(o), p = o.p, s = "";
    var alza = 8 * v.r, ext = 16 * v.r, sw = (o.chico ? 14 : 9);
    // ojos en tallos (dos), desde lo alto de la cabeza
    [[196, 146, 190, 100], [208, 150, 216, 108]].forEach(function (q, i) {
      var tx = q[2] + 8 * v.r, ty = q[3] - ext + 3 * v.b * (i ? 1 : -1);
      if (o.chico) { tx = q[0] + (q[2] - q[0]) * 0.8 + 6 * v.r; ty = q[1] - 32 - ext * 0.5; }
      s += '<path d="M' + q[0] + " " + f(q[1]) + " L" + f(tx) + " " + f(ty - alza) + '" stroke="' + p.tx + '" stroke-width="' + sw + '" stroke-linecap="round"/>';
      s += '<circle cx="' + f(tx) + '" cy="' + f(ty - alza) + '" r="' + (o.chico ? 10 : 8) + '" fill="' + p.tx + '"/>';
    });
    // pie largo y cabeza que se alza al frente
    s += '<path d="M22 212 Q24 198 44 196 H158 C178 196 ' + f(182) + " " + f(170 - alza) + " " + f(192) + " " + f(150 - alza) +
      " C" + f(200) + " " + f(134 - alza) + " " + f(222) + " " + f(140 - alza) + ' 222 166 V212 Z" fill="' + p.tx + '"/>';
    // la concha es el cuarto: esquina de atrás muy redonda (concha), esquina de adelante casi recta (cuarto), puerta abajo
    var bh = 108 * (1 + 0.05 * v.b), top = 198 - bh, Ra = 50, Rb = 14;
    var d0 = o.chico ? 70 : 74, d1 = o.chico ? 102 : 98, dt = o.chico ? 156 : 160;
    s += '<path d="M40 198 V' + f(top + Ra) + " Q40 " + f(top) + " " + f(40 + Ra) + " " + f(top) + " H" + f(160 - Rb) + " Q160 " + f(top) + " 160 " + f(top + Rb) +
      " V198 H" + d1 + " V" + dt + " H" + d0 + ' V198 Z" fill="' + p.tx + '"/>';
    return s;
  }

  var FIG = {
    v1: { fn: brote, nombre: "Brote", tipo: "vivo" },
    v2: { fn: llama, nombre: "Llama", tipo: "vivo" },
    v3: { fn: medusa, nombre: "Medusa", tipo: "vivo" },
    k1: { fn: portero, nombre: "Portero", tipo: "guardián" },
    k2: { fn: farolero, nombre: "Farolero", tipo: "guardián" },
    k3: { fn: cella, nombre: "Cella", tipo: "guardián" },
    h1: { fn: caracol, nombre: "Caracol", tipo: "híbrido" }
  };

  function grupo(k, o) {
    var g = FIG[k].fn(o);
    return (o.hacia === -1) ? '<g transform="translate(240 0) scale(-1 1)">' + g + "</g>" : g;
  }
  // la figura sola en su caja de 240 (suelo en y 212)
  function svg(k, o, px, fondo) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" viewBox="0 0 240 240">' +
      (fondo ? '<rect width="240" height="240" fill="' + o.p.bg + '"/>' : "") + grupo(k, o) + "</svg>";
  }
  // avatar quieto en recorte redondo: campo (cobalto por defecto, isotipo v4 §3.1) y la figura en papel; dibujo chico bajo 41 px
  function avatar(k, a, px) {
    a = a || {};
    var campo = a.campo || PAL.cobalt, tx = a.tx || PAL.paper, chico = px <= 40;
    var o = { u: 0, estado: a.estado || "humanity", b: a.b != null ? a.b : 0.3, r: a.r != null ? a.r : 0, chico: chico, p: { tx: tx, bg: campo } };
    var esc = chico ? 0.86 : 0.78;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" viewBox="0 0 240 240">' +
      (a.cuadrado ? '<rect width="240" height="240" fill="' + campo + '"/>' : '<circle cx="120" cy="120" r="120" fill="' + campo + '"/>') +
      '<g transform="translate(120 126) scale(' + esc + ') translate(-120 -143)">' + grupo(k, o) + "</g></svg>";
  }


  // =====================================================================================================================
  // CELLA FINAL (elegida por N el 2026-10-15: "Cella (Recommended)"). Reemplaza a Tikr. Lanza el lunes 19.
  // cella(destino, o) dibuja la figura en una de tres salidas, con la misma geometría:
  //   destino null o ausente   -> devuelve el SVG como texto (igual que tikr(): <svg class="a" ...> si se da o.x)
  //   destino Element (DOM)    -> pone el SVG dentro y lo devuelve
  //   destino CanvasRenderingContext2D -> lo pinta en el lienzo (sincrónico, Path2D) y devuelve ""
  // o (todo opcional salvo p):
  //   p        paleta de G3: {tx, bg, up, dn, acc, noche}; sirve tal cual L.pal(noche) o L.palBlanca() de obra.js
  //   estado   "humanity" (respira, ojos cerrados) | "present" (igual hasta t0; en t0 abre los ojos, se vuelve y se tiñe)
  //   dato     "u" sube (esmeralda) | "d" baja (borgoña) | "n" noticia sin cifra (cobalto) | null (se queda en tinta)
  //   t (o u)  segundos dentro del cuadro; t0 llega la noticia; t1 (opcional) se va: el color se retira y vuelve a tinta
  //   x, y, s  posición y escala sobre la caja de 240 x 240 (suelo en y 212); hacia 1 | -1 (dónde está el titular)
  //   fase     segundos por fase de la respiración (por defecto --t-breath-phase, 4 s: inhala 4, exhala 4)
  //   chico    dibujo para 16 a 40 px; b, r, k fuerzan respiración (0..1), giro (0..1) y tinta (0..1) para cuadros quietos
  // Tiempos (propuestos como tokens nuevos): --t-lean 600 ms para volverse (ya existe), --t-ink 1100 ms la tinta,
  // --t-ink-back 1000 ms la retirada. La tinta tiene borde duro: dos tonos siempre, sin degradado (biblia v8-r2 §3.4).
  var T_INK = 1.1, T_INK_BACK = 1.0, T_INK_DELAY = 0.15, uidCella = 0;
  function tokS(n, def) {
    try { if (typeof document !== "undefined") { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
      if (v) return v.endsWith("ms") ? parseFloat(v) / 1000 : parseFloat(v); } } catch (e) {}
    return def;
  }
  function easeTinta(x) { x = cl(x); return 1 - Math.pow(1 - x, 1.5); }   // rápido al tocar el agua, lento al asentarse
  function suave(x) { x = cl(x); return x * x * (3 - 2 * x); }   // retirada: sin el tramo final empinado
  function colorDato(p, dato) {
    if (dato === "u") return p.up; if (dato === "d") return p.dn; if (dato === "n") return p.acc || (p.noche ? PAL.nightCobalt : PAL.cobalt);
    return null;
  }
  // la geometría: todo sale de aquí; las tres salidas solo la traducen
  function cellaGeo(o) {
    var t = o.t != null ? o.t : (o.u || 0), fase = o.fase || tokS("--t-breath-phase", 4), tl = tokS("--t-lean", 0.6);
    var pres = o.estado === "present", t0 = o.t0 != null ? o.t0 : 0.4, t1 = o.t1;
    var llego = pres && t >= t0;
    // respiración: en Humanity inhala una fase y exhala otra (8 s con --t-breath-phase de 4 s);
    // en The Present respira el doble de rápido y a 60 % de hondo (alerta, no agitada): un ciclo por fase, 4 s
    var b = o.b != null ? o.b : pres ? 0.6 * respira(t, fase) : respira(t, 2 * fase);
    // giro hacia el titular y vuelta
    // prefers-reduced-motion: G3 pone --t-lean en 0; entonces todo salta a su estado final, sin tránsito
    var quieto = !(tl > 0), paso = function (x, dur, fn) { return quieto ? (x >= 0 ? 1 : 0) : fn(x / dur); };
    var r = o.r != null ? o.r : !pres ? 0 : paso(t - t0, tl, function (x) { return EASE(cl(x)); }) * (t1 != null ? 1 - paso(t - t1, tl, function (x) { return EASE(cl(x)); }) : 1);
    // tinta: entra desde los ojos en --t-ink; se retira en --t-ink-back
    var k = o.k != null ? o.k : !pres || !o.dato ? 0 : paso(t - t0 - T_INK_DELAY, T_INK, easeTinta) * (t1 != null ? 1 - paso(t - t1, T_INK_BACK, suave) : 1);
    var abiertos = o.abiertos != null ? o.abiertos : llego && !(t1 != null && t >= t1 + T_INK_BACK);
    var chico = !!o.chico, top = 74 - 8 * b, R = 16, lean = 5 * r;
    var dx0 = chico ? 116 : 120, dx1 = chico ? 150 : 146, dy = chico ? 148 : 152;
    var cuerpo = "M66 212 V" + f(top + R) + " Q66 " + f(top) + " " + f(66 + R) + " " + f(top) + " H" + f(174 - R) + " Q174 " + f(top) + " 174 " + f(top + R) +
      " V212 H" + dx1 + " V" + dy + " H" + dx0 + " V212 Z";       // dintel recto: un arco en la puerta lee mihrab o capilla
    var ex = 9 * r, ey = -2 * r, rad = chico ? 8.1 : 6, ojos = [[92 + ex, top + 34 + ey], [120 + ex, top + 34 + ey]];
    var mancha = null;
    if (k > 0.001) {
      // el origen es la mirada: entre los dos ojos; la tinta baja un poco al extenderse, como en el agua
      var cx = 106 + ex, cy = top + 34 + ey + 26 * k, far = 0;
      [[66, top], [174, top], [66, 212], [174, 212]].forEach(function (q) { far = Math.max(far, Math.hypot(q[0] - cx, q[1] - cy)); });
      var Rm = far * 1.12 * k, A = 0.85 * (1 - k), tau = Math.max(0, t - t0), d = "", n = 72, pts = [];
      for (var i = 0; i < n; i++) {
        var th = 2 * Math.PI * i / n;
        var w = 0.17 * Math.sin(2 * th + 1.3 + 1.1 * tau) + 0.12 * Math.sin(3 * th + 0.4 - 0.7 * tau) + 0.07 * Math.sin(5 * th + 2.1 + 1.7 * tau) + 0.05 * Math.sin(7 * th + 0.9);
        var rr = Rm * (1 + A * w) * (1 + 0.25 * Math.max(0, Math.sin(th)) * (1 - k));   // más largo hacia abajo mientras cae
        pts.push([cx + rr * Math.cos(th), cy + rr * Math.sin(th)]);
      }
      for (var j = 0; j < n; j++) {   // curva suave: cuadráticas por los puntos medios
        var a = pts[j], c = pts[(j + 1) % n], m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
        if (!j) { var z = pts[n - 1]; d += "M" + f((z[0] + a[0]) / 2) + " " + f((z[1] + a[1]) / 2); }
        d += " Q" + f(a[0]) + " " + f(a[1]) + " " + f(m[0]) + " " + f(m[1]);
      }
      mancha = d + " Z";
    }
    return { lean: lean, giro: [174, 212], cuerpo: cuerpo, ojos: ojos, rad: rad, abiertos: abiertos, mancha: mancha, k: k, b: b, r: r };
  }
  function cellaSVGInterior(g, o) {
    var p = o.p, col = colorDato(p, o.dato), id = "cl" + (o.id || (++uidCella)), s = "";
    s += '<g transform="' + (o.hacia === -1 ? "translate(240 0) scale(-1 1) " : "") + "rotate(" + f(g.lean) + " " + g.giro[0] + " " + g.giro[1] + ')">';
    s += '<path d="' + g.cuerpo + '" fill="' + p.tx + '"/>';
    if (g.mancha && col) s += '<clipPath id="' + id + '"><path d="' + g.cuerpo + '"/></clipPath><path clip-path="url(#' + id + ')" d="' + g.mancha + '" fill="' + col + '"/>';
    g.ojos.forEach(function (q) {
      if (g.abiertos) s += '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + f(g.rad) + '" fill="' + p.bg + '"/>';
      else s += '<path d="M' + f(q[0] - g.rad * 1.3) + " " + f(q[1] - 1) + " Q" + f(q[0]) + " " + f(q[1] + g.rad * 1.2) + " " + f(q[0] + g.rad * 1.3) + " " + f(q[1] - 1) +
        '" fill="none" stroke="' + p.bg + '" stroke-width="' + f(g.rad * 0.9) + '" stroke-linecap="round"/>';
    });
    return s + "</g>";
  }
  function cellaCanvas(ctx, g, o) {
    var p = o.p, col = colorDato(p, o.dato), s = o.s || 1;
    ctx.save(); ctx.translate(o.x || 0, o.y || 0); ctx.scale(s, s);
    if (o.hacia === -1) { ctx.translate(240, 0); ctx.scale(-1, 1); }
    ctx.translate(g.giro[0], g.giro[1]); ctx.rotate(g.lean * Math.PI / 180); ctx.translate(-g.giro[0], -g.giro[1]);
    var cuerpo = new Path2D(g.cuerpo); ctx.fillStyle = p.tx; ctx.fill(cuerpo);
    if (g.mancha && col) { ctx.save(); ctx.clip(cuerpo); ctx.fillStyle = col; ctx.fill(new Path2D(g.mancha)); ctx.restore(); }
    g.ojos.forEach(function (q) {
      ctx.beginPath();
      if (g.abiertos) { ctx.fillStyle = p.bg; ctx.arc(q[0], q[1], g.rad, 0, 2 * Math.PI); ctx.fill(); }
      else { ctx.strokeStyle = p.bg; ctx.lineWidth = g.rad * 0.9; ctx.lineCap = "round"; ctx.moveTo(q[0] - g.rad * 1.3, q[1] - 1); ctx.quadraticCurveTo(q[0], q[1] + g.rad * 1.2, q[0] + g.rad * 1.3, q[1] - 1); ctx.stroke(); }
    });
    ctx.restore();
  }
  // un campo vacío de la paleta (obra.js llena sus colores recién en preparar()) toma el token de G3 de ese suelo
  function palCompleta(p) {
    p = p || {}; var noche = p.noche != null ? !!p.noche : false, d = pal(noche), q = {};
    for (var k in p) q[k] = p[k];
    ["tx", "bg", "up", "dn", "acc"].forEach(function (k) { if (!q[k]) q[k] = d[k]; });
    q.noche = noche; return q;
  }
  function cella(destino, o) {
    if (o === undefined && destino && !destino.nodeType && !destino.canvas) { o = destino; destino = null; }
    var o2 = {}; for (var k in o) o2[k] = o[k]; o2.p = palCompleta(o.p); o = o2;
    var g = cellaGeo(o);
    if (destino && destino.canvas && destino.fillRect) { cellaCanvas(destino, g, o); return ""; }
    var s = o.s || 1, W = 240 * s;
    var head = o.x != null ? '<svg class="a" style="left:' + o.x + "px;top:" + o.y + 'px;overflow:visible" width="' + f(W) + '" height="' + f(W) + '" viewBox="0 0 240 240">'
                           : '<svg xmlns="http://www.w3.org/2000/svg" width="' + f(W) + '" height="' + f(W) + '" viewBox="0 0 240 240">';
    var out = head + (o.fondo ? '<rect width="240" height="240" fill="' + o.p.bg + '"/>' : "") + cellaSVGInterior(g, o) + "</svg>";
    if (destino && destino.nodeType === 1) destino.innerHTML = out;
    return out;
  }
  // marca quieta (Humanity, ojos cerrados, sin respiración): para cella.svg y cella-noche.svg
  function cellaMarca(tx) {
    var g = cellaGeo({ estado: "humanity", b: 0, r: 0, k: 0, abiertos: false, p: { tx: tx, bg: "none" } });
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="54 62 132 162" width="132" height="162"><title>NAOS · Cella</title>';
    s += '<path d="' + g.cuerpo + '" fill="' + tx + '"/>';
    // ojos cerrados recortados como hueco (la marca no lleva fondo: los arcos se restan con una máscara)
    s = s.replace('<path d="' + g.cuerpo + '" fill="' + tx + '"/>',
      '<mask id="cella-ojos"><rect x="0" y="0" width="240" height="240" fill="#fff"/>' + g.ojos.map(function (q) {
        return '<path d="M' + f(q[0] - g.rad * 1.3) + " " + f(q[1] - 1) + " Q" + f(q[0]) + " " + f(q[1] + g.rad * 1.2) + " " + f(q[0] + g.rad * 1.3) + " " + f(q[1] - 1) +
          '" fill="none" stroke="#000" stroke-width="' + f(g.rad * 0.9) + '" stroke-linecap="round"/>'; }).join("") +
      '</mask><path d="' + g.cuerpo + '" fill="' + tx + '" mask="url(#cella-ojos)"/>');
    return s + "</svg>";
  }
  // avatar quieto de Cella: campo papel (N: "Paper field"), Cella en tinta, ojos cerrados. cuadrado = archivo para subir
  function cellaAvatar(px, a) {
    a = a || {}; var chico = px <= 40, campo = a.campo || PAL.paper, tx = a.tx || PAL.ink;
    var esc = a.favicon ? (chico ? 1.5 : 1.3) : (chico ? 1.12 : 1.0), cyFig = 143;
    var g = cellaGeo({ estado: "humanity", b: 0.3, r: 0, k: 0, abiertos: false, chico: chico, p: { tx: tx, bg: campo } });
    var fondo = (a.cuadrado || a.favicon) ? '<rect width="240" height="240" fill="' + campo + '"/>' : '<circle cx="120" cy="120" r="120" fill="' + campo + '"/>';
    var aro = a.aro ? '<circle cx="120" cy="120" r="' + f(120 - a.aro / 2) + '" fill="none" stroke="' + (a.aroColor || "#D7DBE0") + '" stroke-width="' + a.aro + '"/>' : "";
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" viewBox="0 0 240 240">' + fondo + aro +
      '<g transform="translate(120 ' + (a.favicon ? 122 : 124) + ") scale(" + esc + ") translate(-120 -" + cyFig + ')">' + cellaSVGInterior(g, { p: { tx: tx, bg: campo }, id: "av" + px }) + "</g></svg>";
  }

  var API = { cella: cella, cellaGeo: cellaGeo, cellaMarca: cellaMarca, cellaAvatar: cellaAvatar, colorDato: colorDato, FIG: FIG, PAL: PAL, pal: pal, svg: svg, avatar: avatar, grupo: grupo, reaccion: reaccion, respira: respira, EASE: EASE };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else raiz.NAOS_FIGURA = API;
})(this);
