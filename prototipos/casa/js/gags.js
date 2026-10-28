/* NAOS · gags de la casa: piezas sueltas y reutilizables (casa v4, no publicado).
 * En esta casa todos son Cellas y las cosas se adaptan a su morfología: sillas bajas y cuadradas, cama corta y ancha, estufa baja,
 * escalones anchos y bajos, tazas grandes. Cada gag es UNA función que devuelve un fragmento SVG con la Cella (el mismo dibujo de
 * assets/js/cella-brazos.js: cuerpo de bloque, ojos, abertura, brazos por el costado) y la cosa que usa. Sin red, sin librerías;
 * necesita solo assets/js/figura.js (NAOS_FIGURA.cellaGeo) para la geometría del cuerpo.
 *
 * Uso en la casa:    svg += NAOS_GAGS.nevera({ x: 170, y: 272, s: 1 })
 * Uso en un Short:   NAOS_GAGS.instala();  fondo plano del Short + NAOS_GAGS.escalera({ x: 540, y: 1500, s: 3, t: 2.4 })
 *   o.x, o.y   suelo, centro del gag (el origen local es el suelo)      o.s  escala del gag completo (1 = tamaño de la casa)
 *   o.t        si existe, el gag queda PAUSADO en el segundo t (cuadro a cuadro, determinista; sin t corre solo)
 *   o.cuerpo   color del cuerpo de la Cella principal del gag (clave de NAOS_GAGS.COLOR o hex de la paleta de la casa)
 * Con prefers-reduced-motion todo queda quieto en su pose de reposo (la pose del cuadro 0 de cada bucle).
 * Un Short con fondo plano manda: estos gags son una visita ocasional, no el fondo.
 *
 * Gags (uno por escena, agrupados por cuarto en NAOS_GAGS.cuartos):
 *   cocina     nevera      una Cella mete la cabeza en la nevera de cofre y sale
 *              olla        una Cella revuelve la olla de la estufa baja
 *   alcoba     cama        una duerme en la cama corta y ancha; otra chica rebota despacio en los pies de la cama
 *   mesa       mesa        una sentada ENCIMA de la mesa; otra en su silla cuadrada; una chica con su taza grande
 *   escaleras  escalera    una dormida en la escalera; otra chica sube y baja los escalones
 *   ventana    mecedora    una se mece en el balcón;  taza   una toma de una taza enorme en otro balcón
 *   patio      cielo       una mira el cielo con una nube que pasa;  agua   una prueba el agua del estanque;  paseo   una chica da vueltas lentas
 *   puerta     porton      una llega y se limpia en el tapete;  asoma   una chica se asoma detrás de la hoja del portón */
(function (raiz) {
  "use strict";
  var COLOR = { tinta: "#0E1116", agua: "#3E86B5", coral: "#E9876A", lav: "#A9B2EC", rosa: "#EE9AA6", amb: "#F0BC6E", luz: "#F6D365" };
  var INK = COLOR.tinta, PAPEL = "#F4F6F8", MADERA = "#C98A5B", MADERA2 = "#A8693F", BLANCO = "#FFFFFF";
  var FORMA = "M-11 0 L-9 100 A9 9 0 0 0 9 100 L11 0 A11 11 0 0 0 -11 0Z";   // el brazo de cella-brazos.js: largo 100, 22 en la raíz, 18 en la punta

  function f(n) { return (+n).toFixed(1); }
  function R(x, y, w, h, fill, ex) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '" ' + (ex || "") + "/>"; }
  function C(x, y, r, fill, ex) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" ' + (ex || "") + "/>"; }
  function E(x, y, rx, ry, fill, ex) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" ' + (ex || "") + "/>"; }
  function Pa(d, fill, ex) { return '<path d="' + d + '" fill="' + fill + '" ' + (ex || "") + "/>"; }
  function col(c, def) { return COLOR[c] || c || def; }
  function lum(h) {
    var n = parseInt(h.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }

  var GEO = null;
  function geo() {
    if (GEO) return GEO;
    var F = raiz.NAOS_FIGURA, g = F && F.cellaGeo ? F.cellaGeo({ estado: "humanity", b: 0.4, r: 0, k: 0, abiertos: false, p: { tx: INK, bg: PAPEL } }) : null;
    GEO = g || { cuerpo: "M66 212 V87 Q66 71 82 71 H158 Q174 71 174 87 V212 H146 V152 H120 V212 Z", ojos: [[92, 105], [120, 105]], rad: 6 };
    return GEO;
  }

  /* la Cella: origen local = centro del suelo bajo el cuerpo. o: s, cuerpo, ojos ("abiertos" | "cerrados" | "contentos"), mira [dx, dy],
   * cls (clase del grupo que se anima), bi / bd (clase de cada brazo), ai / ad (ángulo de reposo del brazo, grados hacia afuera, máx. 66) */
  function cella(o) {
    var g = geo(), s = o.s || .62, c = col(o.cuerpo, INK), ec = o.ojosColor || (lum(c) > .42 ? INK : PAPEL), R0 = g.rad, est = o.ojos || "abiertos", m = o.mira || [0, 0];
    var ojos = g.ojos.map(function (q) {
      var x = q[0] + m[0], y = q[1] + m[1];
      if (est === "abiertos") return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(R0) + '" fill="' + ec + '"/>';
      if (est === "contentos") return '<path d="M' + f(x - R0 * 1.3) + " " + f(y + R0 * .55) + " Q" + f(x) + " " + f(y - R0 * 1.5) + " " + f(x + R0 * 1.3) + " " + f(y + R0 * .55) + '" fill="none" stroke="' + ec + '" stroke-width="' + f(R0 * .9) + '" stroke-linecap="round"/>';
      return '<path d="M' + f(x - R0 * 1.3) + " " + f(y - 1) + " Q" + f(x) + " " + f(y + R0 * 1.2) + " " + f(x + R0 * 1.3) + " " + f(y - 1) + '" fill="none" stroke="' + ec + '" stroke-width="' + f(R0 * .9) + '" stroke-linecap="round"/>';
    }).join("");
    var brazo = function (x, cl, a, lado) { return '<g transform="translate(' + x + ' -116)"><g class="' + (cl || "") + '" style="transform-origin:0 0;transform:rotate(' + (lado * (a || 0)) + 'deg)"><path d="' + FORMA + '" fill="' + c + '"/></g></g>'; };
    return '<g transform="translate(' + f(o.x || 0) + " " + f(o.y || 0) + ") scale(" + s + ')"><g class="' + (o.cls || "") + '" style="transform-origin:0 0">' +
      brazo(-43, o.bi, o.ai, 1) + brazo(43, o.bd, o.ad, -1) +
      '<g transform="translate(-120 -212)"><path d="' + g.cuerpo + '" fill="' + c + '"/><g class="' + (est === "abiertos" ? "ga-parp" : "") + '">' + ojos + "</g></g></g></g>";
  }

  function gag(o, nombre, inner) {
    var st = (o.t != null ? "--t:" + (-o.t) + "s;" : "");
    return '<g class="gag gag-' + nombre + (o.t != null ? " ga-pausa" : "") + '" transform="translate(' + f(o.x || 0) + " " + f(o.y || 0) + ") scale(" + (o.s || 1) + ')"' + (st ? ' style="' + st + '"' : "") + ">" + inner + "</g>";
  }
  function vapor(x, y, n, w) {
    var s = "", i;
    for (i = 0; i < n; i++) s += '<path class="ga-vapor" style="--d:' + f(-i * 1.1) + 's" d="M' + (x + i * 8 - 8) + " " + y + ' q6 -8 0 -16 t0 -16 t0 -16" fill="none" stroke="#FFFFFF" stroke-width="' + (w || 4) + '" stroke-linecap="round"/>';
    return s;
  }
  function zeta(x, y, d, c) {
    return '<g transform="translate(' + x + " " + y + ')"><g class="ga-zeta" style="--d:' + d + 's"><path d="M0 0 H9 L0 11 H9" fill="none" stroke="' + (c || INK) + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g></g>';
  }
  function taza(x, y, k, c) {   /* taza grande para una Cella: boca de 2 k, alto de 1,5 k */
    k = k || 1; c = c || BLANCO;
    return '<g transform="translate(' + x + " " + y + ") scale(" + k + ')">' + E(0, 2, 17, 5, "rgba(14,17,22,.16)") + Pa("M-15 -22 L-11 -3 Q0 1 11 -3 L15 -22Z", c) +
      '<path d="M14 -18 q14 0 9 11 q-3 3 -10 1" fill="none" stroke="' + c + '" stroke-width="4.5" stroke-linecap="round"/>' + E(0, -22, 15, 5, c) + E(0, -21.5, 12, 3.6, "#7A4A2E") + "</g>";
  }

  /* ---------- cocina ---------- */
  /* nevera de cofre: baja, ancha, con la tapa levantada; la Cella está detrás y baja la cabeza adentro */
  function nevera(o) {
    var s = "";
    s += Pa("M-50 -58 L-42 -118 H42 L50 -58Z", "#DCE7EF") + R(-34, -110, 68, 40, "#F4F8FB", 'rx="6"') + R(-26, -102, 14, 22, "rgba(14,17,22,.08)", 'rx="3"');
    s += '<g class="ga-luz">' + E(0, -60, 46, 14, "#FFF4C2", 'opacity=".95"') + E(0, -60, 30, 8, "#FFFFFF", 'opacity=".8"') + "</g>";
    s += '<g class="ga-nevera">' + cella({ x: 0, y: -2, s: .62, cuerpo: o.cuerpo || "agua", ojos: "abiertos", mira: [0, 3] }) + "</g>";
    s += '<g class="ga-niebla" style="--d:-1s">' + E(-30, -64, 12, 4, "#FFFFFF", 'opacity=".8"') + "</g>" + '<g class="ga-niebla" style="--d:-3s">' + E(28, -64, 14, 4, "#FFFFFF", 'opacity=".8"') + "</g>";
    s += R(-52, -58, 104, 58, BLANCO, 'rx="10"') + R(-52, -22, 104, 3, "rgba(14,17,22,.12)") + R(-52, -60, 104, 8, "#E4EDF3", 'rx="4"') + R(-22, -44, 44, 7, "#C9CED6", 'rx="3.5"') +
      '<path d="M40 -38 v14 M33 -31 h14 M35 -36 l10 10 M45 -36 l-10 10" stroke="' + COLOR.agua + '" stroke-width="2.2" stroke-linecap="round"/>' + C(-38, -30, 5, COLOR.amb) + R(-46, -6, 92, 4, "rgba(14,17,22,.1)", 'rx="2"');
    return gag(o, "nevera", s);
  }
  /* estufa baja con una olla a la altura de una Cella; ella revuelve con la cuchara grande */
  function olla(o) {
    var s = "";
    s += cella({ x: 66, y: -2, s: .56, cuerpo: o.cuerpo || "coral", ojos: "contentos", bi: "ga-brazo-olla", ai: 58 });
    s += R(-52, -40, 104, 40, "#EDF0F4", 'rx="8"') + R(-52, -44, 104, 8, INK, 'rx="4"') + R(-40, -30, 52, 24, INK, 'rx="6"') + R(-35, -26, 42, 16, "rgba(244,246,248,.25)", 'rx="4"') +
      C(24, -22, 4, INK) + C(38, -22, 4, INK) + R(20, -12, 24, 4, "rgba(14,17,22,.15)", 'rx="2"');
    s += R(-30, -80, 48, 38, INK, 'rx="9"') + R(-34, -84, 56, 9, "#C9CED6", 'rx="4"') + R(-40, -66, 12, 7, INK, 'rx="3"') + R(18, -66, 12, 7, INK, 'rx="3"');
    s += '<g transform="translate(-6 -80)"><g class="ga-cuchara" style="transform-origin:0 0"><path d="M0 0 L-20 -30" stroke="' + MADERA + '" stroke-width="5" stroke-linecap="round"/>' + E(-21, -33, 6, 4, MADERA, 'transform="rotate(-35 -21 -33)"') + "</g></g>";
    s += vapor(-6, -88, 3);
    return gag(o, "olla", s);
  }

  /* ---------- alcoba ---------- */
  /* cama corta y ancha: una duerme (pegada a la cabecera) y otra chica rebota despacio en los pies */
  function cama(o) {
    var s = "", c = o.cuerpo || "coral";
    s += R(-128, -70, 16, 70, MADERA2, 'rx="7"') + R(-128, -76, 16, 12, MADERA, 'rx="6"') + R(-118, -32, 236, 32, MADERA2, 'rx="6"') + R(-118, -34, 236, 6, "rgba(255,255,255,.18)", 'rx="3"') + R(104, -22, 14, 22, MADERA2) + R(-118, -4, 14, 4, "rgba(14,17,22,.2)");
    s += R(-114, -48, 228, 20, BLANCO, 'rx="9"') + R(-108, -64, 58, 22, BLANCO, 'rx="11"') + R(-102, -60, 46, 6, "rgba(14,17,22,.07)", 'rx="3"');
    /* la que duerme, de costado, la cabeza hacia la almohada */
    s += '<g class="ga-respira">' + '<g transform="translate(-72 -60) rotate(-90) translate(0 38)">' + cella({ x: 0, y: 0, s: .55, cuerpo: c, ojos: "cerrados", ai: 0, ad: 0 }) + "</g></g>";
    s += '<g class="ga-respira" style="--d:-1.5s">' + Pa("M-62 -46 Q-60 -62 -34 -62 Q-6 -66 24 -60 Q60 -56 108 -48 V-28 H-62Z", "#8E99DE") + R(-30, -60, 8, 30, "rgba(255,255,255,.28)") + R(2, -60, 8, 30, "rgba(255,255,255,.28)") + R(34, -56, 8, 30, "rgba(255,255,255,.28)") + R(66, -52, 8, 26, "rgba(255,255,255,.28)") + "</g>";
    s += zeta(-92, -92, 0) + zeta(-80, -104, -1.6, INK) + zeta(-68, -116, -3.2);
    /* la chica que no debería: rebota sobre la cobija a los pies de la cama */
    s += '<g class="ga-rebota">' + cella({ x: 78, y: -46, s: .4, cuerpo: "luz", ojos: "contentos", ai: 18, ad: 18 }) + "</g>";
    return gag(o, "cama", s);
  }

  /* ---------- mesa ---------- */
  /* mesa baja y redonda; una Cella sentada ENCIMA de ella, otra en su silla cuadrada, una chica con su taza grande */
  function mesa(o) {
    var s = "";
    s += E(0, 2, 66, 8, "rgba(14,17,22,.2)") + R(-9, -34, 18, 34, "#B9792F") + E(0, -2, 28, 6, "#B9792F");
    s += E(0, -33, 68, 20, "#D69A3F") + E(0, -42, 68, 20, COLOR.amb) + E(0, -43, 56, 15, "rgba(255,255,255,.24)");
    s += '<g class="ga-sentada">' + cella({ x: 2, y: -44, s: .5, cuerpo: o.cuerpo || "lav", ojos: "contentos", bi: "ga-brazo-i", ai: 0 }) + "</g>";
    s += taza(-30, -30, .72) + taza(30, -28, .72) + E(0, -32, 17, 6, BLANCO) + E(0, -33.5, 10, 3.6, "#F6E0A0");
    /* silla cuadrada y baja, a la izquierda, con su Cella */
    s += '<g class="ga-asiente">' + cella({ x: -92, y: -22, s: .54, cuerpo: INK, ojos: "abiertos", mira: [6, -4], bd: "ga-brazo-d", ad: 0 }) + "</g>";
    s += R(-114, -24, 44, 26, COLOR.agua, 'rx="6"') + R(-114, -26, 44, 7, "#6FA7CC", 'rx="3.5"');
    /* y a la derecha, una chica con una taza enorme */
    s += cella({ x: 94, y: -16, s: .4, cuerpo: "luz", ojos: "contentos" });
    s += R(76, -18, 36, 20, COLOR.agua, 'rx="5"') + R(76, -20, 36, 6, "#6FA7CC", 'rx="3"') + '<g class="ga-sorbe">' + taza(96, -20, .85) + "</g>";
    s += vapor(-30, -40, 2, 3) + vapor(30, -38, 2, 3);
    return gag(o, "mesa", s);
  }

  /* ---------- escaleras ---------- */
  /* escalones anchos y bajos (34 de huella, 22 de alto); una dormida de costado sobre ellos y una chica que sube y baja */
  function escalera(o) {
    var s = "", i, x, yt, masa = "M0 0";
    for (i = 0; i < 6; i++) { x = i * 34; yt = -(i + 1) * 22; masa += " V" + yt + " H" + (x + 34); }
    masa += " V0Z";
    s += Pa(masa, "#DC7556");
    for (i = 0; i < 6; i++) { x = i * 34; yt = -(i + 1) * 22; s += R(x - 2, yt - 3, 38, 8, BLANCO, 'rx="4"') + R(x, yt + 7, 34, 2.5, "rgba(14,17,22,.12)") + R(x, yt + 15, 34, 1.5, "rgba(255,255,255,.18)"); }
    /* barandal bajo */
    for (i = 0; i < 6; i++) { x = i * 34 + 17; yt = -(i + 1) * 22; s += R(x - 2, yt - 40, 4, 40, COLOR.agua, 'rx="2"') + C(x, yt - 24, 4, COLOR.agua); }
    s += '<path d="M2 -66 L206 -156" stroke="' + COLOR.agua + '" stroke-width="7" stroke-linecap="round"/>';
    /* la dormida: de costado, siguiendo la pendiente (33 grados), con la cabeza hacia arriba */
    s += '<g class="ga-respira">' + '<g transform="translate(116 -114) rotate(57) translate(0 28)">' + cella({ x: 0, y: 0, s: .4, cuerpo: o.cuerpo || "amb", ojos: "cerrados" }) + "</g></g>";
    s += zeta(140, -144, 0) + zeta(152, -158, -1.8, INK);
    /* la chica que sube y baja, tres escalones, con un saltito en cada uno */
    s += '<g class="ga-escala" style="transform:translate(51px,-44px)"><g class="ga-saltito">' + cella({ x: 0, y: 0, s: .34, cuerpo: "tinta", ojos: "abiertos", mira: [4, -3] }) + "</g></g>";
    return gag(o, "escalera", s);
  }

  /* ---------- ventana / balcón ---------- */
  /* mecedora baja con su Cella, que se mece despacio mirando afuera, una cobija en el regazo */
  function mecedora(o) {
    var s = "";
    s += '<g class="ga-mece" style="transform-origin:0 4px">' + R(-26, -50, 52, 40, MADERA2, 'rx="6"') + R(-22, -46, 44, 34, MADERA, 'rx="4"') +
      cella({ x: 0, y: -16, s: .46, cuerpo: o.cuerpo || INK, ojos: "abiertos", mira: [6, -2] }) +
      R(-34, -22, 68, 10, MADERA2, 'rx="5"') + R(-24, -24, 48, 8, COLOR.coral, 'rx="4"') + R(-32, -34, 8, 20, MADERA2, 'rx="4"') + R(24, -34, 8, 20, MADERA2, 'rx="4"') +
      '<path d="M-40 4 Q0 18 40 4" fill="none" stroke="' + MADERA2 + '" stroke-width="6" stroke-linecap="round"/></g>';
    return gag(o, "mecedora", s);
  }
  /* una Cella con una taza enorme: sorbe, la baja, vapor */
  function tazaGag(o) {
    var s = cella({ x: 0, y: 0, s: .46, cuerpo: o.cuerpo || "luz", ojos: "contentos" }) + '<g class="ga-sorbe">' + taza(16, -22, 1.0) + "</g>";
    s += vapor(16, -50, 2, 3.2);
    return gag(o, "taza", s);
  }

  /* ---------- patio ---------- */
  /* mira el cielo: el cuerpo se inclina hacia atrás, los ojos arriba; una nube lenta y una estrella que brilla. Sin burla: es asombro. */
  function cielo(o) {
    var s = "";
    s += '<g class="ga-nube">' + E(0, -170, 30, 8, BLANCO, 'opacity=".95"') + E(14, -177, 17, 7, BLANCO, 'opacity=".95"') + E(-14, -176, 13, 6, BLANCO, 'opacity=".95"') + "</g>";
    s += '<g class="ga-brilla"><path d="M44 -150 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#F6D365"/></g>';
    s += '<g transform="rotate(-9)"><g class="ga-mira">' + cella({ x: 0, y: 0, s: .62, cuerpo: o.cuerpo || "coral", ojos: "abiertos", mira: [2, -7], bi: "ga-brazo-cielo", ai: 0 }) + "</g></g>";
    return gag(o, "cielo", s);
  }
  /* prueba el agua: un brazo baja hasta el estanque y le saca anillos */
  function agua(o) {
    var s = "", ang = 52, rad = ang * Math.PI / 180, s0 = .55, tx = (-43 - 100 * Math.sin(rad)) * s0, ty = (-116 + 100 * Math.cos(rad)) * s0;
    s += '<g class="ga-ola" style="--d:0s;transform-origin:' + f(tx) + "px " + f(ty) + 'px">' + E(tx, ty, 16, 6, "none", 'stroke="#FFFFFF" stroke-width="2.4"') + "</g>";
    s += '<g class="ga-ola" style="--d:-1.6s;transform-origin:' + f(tx) + "px " + f(ty) + 'px">' + E(tx, ty, 16, 6, "none", 'stroke="#FFFFFF" stroke-width="2.4"') + "</g>";
    s += cella({ x: 0, y: 0, s: s0, cuerpo: o.cuerpo || "lav", ojos: "contentos", mira: [-4, 3], bi: "ga-brazo-agua", ai: ang });
    return gag(o, "agua", s);
  }
  /* una chica que da vueltas despacio, a su paso, con un balanceo */
  function paseo(o) {
    return gag(o, "paseo", '<g class="ga-pasea"><g class="ga-pasito">' + cella({ x: 0, y: 0, s: .4, cuerpo: o.cuerpo || "luz", ojos: "abiertos", mira: [5, 0] }) + "</g></g>");
  }

  /* ---------- puerta ---------- */
  /* llega y se limpia en el tapete: un meneo corto a un lado y al otro; el portón es del ancho de una Cella */
  function porton(o) {
    return gag(o, "porton", '<g class="ga-limpia">' + cella({ x: 0, y: 0, s: .7, cuerpo: o.cuerpo || "agua", ojos: "abiertos" }) + "</g>");
  }
  /* una chica se asoma detrás de la hoja del portón (dibujar ANTES de la hoja) */
  function asoma(o) {
    return gag(o, "asoma", '<g class="ga-asoma">' + cella({ x: 0, y: 0, s: .34, cuerpo: o.cuerpo || "tinta", ojos: "abiertos", mira: [-6, 0] }) + "</g>");
  }

  var CSS =
    ".gag .ga-parp{transform-box:fill-box;transform-origin:50% 50%;animation:ga-parpadeo 7s ease-in-out infinite}" +
    ".gag [class*='ga-']{animation-delay:calc(var(--d,0s) + var(--t,0s))}" +
    ".ga-pausa [class*='ga-']{animation-play-state:paused}" +
    ".ga-respira{transform-origin:0 0;animation:ga-respira 6s ease-in-out infinite}" +
    ".ga-nevera{animation:ga-nevera 9s ease-in-out infinite}" +
    ".ga-luz{animation:ga-luz 4.5s ease-in-out infinite}" +
    ".ga-niebla{animation:ga-niebla 4s ease-out infinite}" +
    ".ga-vapor{opacity:.7;animation:ga-vapor 3.4s ease-in-out infinite}" +
    ".ga-brazo-olla{animation:ga-brazo-olla 3.2s ease-in-out infinite}" +
    ".ga-cuchara{animation:ga-cuchara 3.2s ease-in-out infinite}" +
    ".ga-rebota{transform-origin:0 0;animation:ga-rebota 3.4s ease-in-out infinite}" +
    ".ga-zeta{opacity:0;animation:ga-zeta 4.8s ease-out infinite}" +
    ".ga-sentada{transform-origin:0 0;animation:ga-sentada 6s ease-in-out infinite}" +
    ".ga-asiente{transform-origin:0 0;animation:ga-asiente 7s ease-in-out infinite}" +
    ".ga-sorbe{transform-origin:0 0;animation:ga-sorbe 7s ease-in-out infinite}" +
    ".ga-brazo-i{animation:ga-brazo-i 9s ease-in-out infinite}" +
    ".ga-brazo-d{animation:ga-brazo-d 8s ease-in-out infinite}" +
    ".ga-escala{animation:ga-escala 18s ease-in-out infinite alternate}" +
    ".ga-saltito{animation:ga-saltito 6s ease-in-out infinite}" +
    ".ga-mece{animation:ga-mece 5.5s ease-in-out infinite}" +
    ".ga-nube{animation:ga-nube 26s ease-in-out infinite alternate}" +
    ".ga-brilla{transform-box:fill-box;transform-origin:50% 50%;animation:ga-brilla 6s ease-in-out infinite}" +
    ".ga-mira{transform-origin:0 0;animation:ga-mira 14s ease-in-out infinite}" +
    ".ga-brazo-cielo{animation:ga-brazo-cielo 14s ease-in-out infinite}" +
    ".ga-brazo-agua{animation:ga-brazo-agua 4.5s ease-in-out infinite}" +
    ".ga-ola{animation:ga-ola 3.2s ease-out infinite}" +
    ".ga-pasea{animation:ga-pasea 16s ease-in-out infinite alternate}" +
    ".ga-pasito{transform-origin:0 0;animation:ga-pasito 1.8s ease-in-out infinite}" +
    ".ga-limpia{transform-origin:0 0;animation:ga-limpia 2.6s ease-in-out infinite}" +
    ".ga-asoma{animation:ga-asoma 9s ease-in-out infinite}" +
    "@keyframes ga-parpadeo{0%,93%,100%{transform:scaleY(1)}96.5%{transform:scaleY(.08)}}" +
    "@keyframes ga-respira{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,1.03)}}" +
    "@keyframes ga-nevera{0%,10%{transform:translateY(0)}32%,60%{transform:translateY(19px)}84%,100%{transform:translateY(0)}}" +
    "@keyframes ga-luz{0%,100%{opacity:.7}50%{opacity:1}}" +
    "@keyframes ga-niebla{0%{opacity:0;transform:translateY(0)}35%{opacity:.8}100%{opacity:0;transform:translateY(-24px)}}" +
    "@keyframes ga-vapor{0%{opacity:0;transform:translateY(8px)}35%{opacity:.85}100%{opacity:0;transform:translateY(-14px)}}" +
    "@keyframes ga-brazo-olla{0%,100%{transform:rotate(54deg)}50%{transform:rotate(62deg)}}" +
    "@keyframes ga-cuchara{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(16deg)}}" +
    "@keyframes ga-rebota{0%,100%{transform:translateY(0) scale(1.05,.93)}18%{transform:translateY(-2px) scale(1,1)}50%{transform:translateY(-26px) scale(.97,1.04)}82%{transform:translateY(-2px) scale(1,1)}}" +
    "@keyframes ga-zeta{0%{opacity:0;transform:translate(0,0) scale(.6)}22%{opacity:.9}100%{opacity:0;transform:translate(14px,-30px) scale(1.15)}}" +
    "@keyframes ga-sentada{0%,100%{transform:rotate(-2.4deg)}50%{transform:rotate(2.4deg)}}" +
    "@keyframes ga-asiente{0%,100%{transform:rotate(0)}50%{transform:rotate(1.8deg)}}" +
    "@keyframes ga-sorbe{0%,52%,100%{transform:rotate(0)}66%,82%{transform:rotate(-10deg)}}" +
    "@keyframes ga-brazo-i{0%,35%,100%{transform:rotate(0)}55%,75%{transform:rotate(22deg)}}" +
    "@keyframes ga-brazo-d{0%,40%,100%{transform:rotate(0)}60%,80%{transform:rotate(-16deg)}}" +
    "@keyframes ga-escala{0%,8%{transform:translate(17px,-22px)}28%,36%{transform:translate(51px,-44px)}56%,64%{transform:translate(85px,-66px)}86%,100%{transform:translate(119px,-66px)}}" +
    "@keyframes ga-saltito{0%,100%{transform:translateY(0)}8%{transform:translateY(-7px)}16%{transform:translateY(0)}}" +
    "@keyframes ga-mece{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}" +
    "@keyframes ga-nube{0%{transform:translateX(-52px)}100%{transform:translateX(52px)}}" +
    "@keyframes ga-brilla{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1)}}" +
    "@keyframes ga-mira{0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(2deg)}}" +
    "@keyframes ga-brazo-cielo{0%,25%,100%{transform:rotate(0)}50%,78%{transform:rotate(40deg)}}" +
    "@keyframes ga-brazo-agua{0%,100%{transform:rotate(46deg)}50%{transform:rotate(56deg)}}" +
    "@keyframes ga-ola{0%{opacity:.9;transform:scale(.3)}100%{opacity:0;transform:scale(1.5)}}" +
    "@keyframes ga-pasea{0%{transform:translateX(-46px)}100%{transform:translateX(46px)}}" +
    "@keyframes ga-pasito{0%,100%{transform:rotate(-3deg) translateY(0)}50%{transform:rotate(3deg) translateY(-3px)}}" +
    "@keyframes ga-limpia{0%,100%{transform:translateX(-3px) rotate(-2deg)}50%{transform:translateX(3px) rotate(2deg)}}" +
    "@keyframes ga-asoma{0%,16%{transform:translateX(0)}32%,58%{transform:translateX(30px)}74%,100%{transform:translateX(0)}}" +
    "@media (prefers-reduced-motion:reduce){.gag *{animation:none !important}.ga-niebla,.ga-zeta,.ga-ola{opacity:0}.ga-vapor{opacity:.7}}";

  function instala(doc) {
    doc = doc || (typeof document !== "undefined" ? document : null);
    if (!doc || doc.getElementById("gags-css")) return;
    var st = doc.createElement("style"); st.id = "gags-css"; st.textContent = CSS; doc.head.appendChild(st);
  }

  raiz.NAOS_GAGS = {
    cella: cella, css: CSS, instala: instala, COLOR: COLOR,
    nevera: nevera, olla: olla, cama: cama, mesa: mesa, escalera: escalera, mecedora: mecedora, taza: tazaGag,
    cielo: cielo, agua: agua, paseo: paseo, porton: porton, asoma: asoma,
    cuartos: { cocina: ["nevera", "olla"], alcoba: ["cama"], mesa: ["mesa"], escaleras: ["escalera"], ventana: ["mecedora", "taza"], patio: ["cielo", "agua", "paseo"], puerta: ["porton", "asoma"] }
  };
})(typeof window !== "undefined" ? window : this);
