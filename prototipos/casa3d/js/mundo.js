/* mundo.js · la casa colombiana de un piso con patio central, en low-poly toon.
 * Planta: cuadrado de 30 x 30 (x, z). Anillo de cuartos de 6 de fondo (d de 9 a 15 desde el centro), corredor de 3 (d de 6 a 9),
 * patio de 12 x 12 con el centro azul. Todo lo estatico va en UNA malla (colores por vertice); el tejado de cada cuarto, el muro
 * del patio, Cella y las personas son aparte para poder animarse. Sin modelos externos. */
import * as THREE from "three";
import { Merger, muroGeo, rectPts, rng, col, texTeja, texMadera, texPiedraPatio, texAdoquin, texAzul, texCielo, texNube,
  texBrillo, texSuaveBlanco, texZocalo, gradMap, BISEL } from "./geo.js";
import { crearCella, texSombra } from "./dibujo2d.js";

export const FL = 0.3;
const SOMBRA_DIR = [0.6, -0.8], SOMBRA_ANG = Math.atan2(0.8, 0.6);   // el sol esta hacia (-x, +z): la sombra cae hacia (+x, -z)                    // altura del piso interior sobre el suelo
const HO = 4.6, HI = 2.9;                 // alturas del tejado: alero alto afuera, bajo sobre el corredor
const roofH = (d) => HI + (d - 6) * (HO - HI) / 9;

const COL = {
  cal: "#F8F1E6", cal2: "#F0E6D6", piedra: "#EADFD2", teja: "#CC8F76", tejaOsc: "#B8725C", madera: "#B67B4E", maderaOsc: "#8A5A3A",
  maderaCl: "#D9A06E", tinta: "#0E1116", hierro: "#4A4048", crema: "#F4F6F8", verde: "#5F8A66", verde2: "#4F7A58", verde3: "#7FA583",
  terra: "#C77D5E", metal: "#D5D9DE"
};
const VIVOS = ["#E9876A", "#3E86B5", "#F0BC6E", "#EE9AA6", "#7FB7D6", "#A9B2EC", "#7FA583"];   // coral, azul, ambar, rosa, celeste, lavanda, verde: los colores de los balcones en la 2D
const FLORES = ["#EE9AA6", "#F6D365", "#E9876A", "#F4F6F8", "#E9876A", "#EE9AA6"];

/* paletas por cuarto (paletas.json de la casa) */
export const PAL = {
  cocina: { campo: "#F0BC6E", tinta: "#0E1116", cuerpo: "#0E1116", ojos: "#FFFFFF" },
  alcoba: { campo: "#A9B2EC", tinta: "#0E1116", cuerpo: "#0E1116", ojos: "#FFFFFF" },
  escaleras: { campo: "#E9876A", tinta: "#0E1116", cuerpo: "#0E1116", ojos: "#FFFFFF" },
  mesa: { campo: "#EE9AA6", tinta: "#0E1116", cuerpo: "#0E1116", ojos: "#FFFFFF" },
  puerta: { campo: "#EE9AA6", tinta: "#0E1116", cuerpo: "#0E1116", ojos: "#FFFFFF" },
  ventana: { campo: "#141A4A", tinta: "#F4F6F8", cuerpo: "#F0BC6E", ojos: "#FFFFFF" },
  patio: { campo: "#141A4A", tinta: "#F4F6F8", cuerpo: "#F0BC6E", ojos: "#FFFFFF" }
};

/* lados: th = giro del marco del cuarto (su +z mira al patio); sg = signo del eje local x respecto de t; mapa (t,d) a (x,z) */
const LADO = {
  S: { th: Math.PI, sg: -1, mapa: (t, d) => [t, d], out: { o: [0, 0, 15.45], th: 0, su: 1 } },
  N: { th: 0, sg: 1, mapa: (t, d) => [t, -d], out: { o: [0, 0, -15.45], th: Math.PI, su: -1 } },
  E: { th: -Math.PI / 2, sg: 1, mapa: (t, d) => [d, t], out: { o: [15.45, 0, 0], th: Math.PI / 2, su: -1 } },
  W: { th: Math.PI / 2, sg: -1, mapa: (t, d) => [-d, t], out: { o: [-15.45, 0, 0], th: -Math.PI / 2, su: 1 } }
};

/* cuartos: t0..t1 = tramo del cuarto sobre su lado; p0..p1 = tramo del muro del patio (a d = 9) */
const CUARTOS = [
  { id: "mesa", slug: "table", pal: "mesa", lado: "S", t0: -15, t1: -5, p0: -9, p1: -5, acento: "#EE9AA6" },
  { id: "puerta", slug: "door", pal: "puerta", lado: "S", t0: -5, t1: 5, p0: -5, p1: 5, acento: "#3E86B5" },
  { id: "sala", slug: null, pal: null, lado: "S", t0: 5, t1: 15, p0: 5, p1: 9, acento: "#F0BC6E" },
  { id: "ventana", slug: "windows", pal: "ventana", lado: "E", t0: -15, t1: 15, p0: -9, p1: 9, acento: "#7FB7D6", muro: [-9, 9], lon: 18 },
  { id: "escaleras", slug: "stairs", pal: "escaleras", lado: "N", t0: -15, t1: -5, p0: -9, p1: -5, acento: "#7FA583" },
  { id: "cocina", slug: "kitchen", pal: "cocina", lado: "N", t0: -5, t1: 5, p0: -5, p1: 5, acento: "#E9876A" },
  { id: "taller", slug: null, pal: null, lado: "N", t0: 5, t1: 15, p0: 5, p1: 9, acento: "#A9B2EC" },
  { id: "alcoba", slug: "bedroom", pal: "alcoba", lado: "W", t0: -15, t1: 15, p0: -9, p1: 9, acento: "#A9B2EC", muro: [-9, 9], lon: 18 }
];

export function construirMundo({ renderer, escena, movil }) {
  BISEL.min = movil ? 0.35 : 0.1;   // telefono: bisel solo en lo grande
  const rand = rng(2026);
  const toon = gradMap();
  const matVert = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon });
  const M = new THREE.Group(); escena.add(M);
  const mundo = { cuartos: {}, lista: [], billboards: [], vapor: [], espuma: [], brillos: [], ondas: [], nubes: [], hit: [], estrellas: null, techosOn: false };
  const sm = new Merger();            // lo estatico de la casa
  const Vm = (x, y, z) => new THREE.Vector3(x, y, z);

  /* ===================== luz y cielo ===================== */
  escena.background = texCielo();
  escena.fog = new THREE.Fog(0xf3e3c8, 110, 320);
  const hemi = new THREE.HemisphereLight(0xfff1dc, 0xeed3b4, 1.38); escena.add(hemi);
  const sol = new THREE.DirectionalLight(0xffe2b8, 1.55);
  sol.position.set(-24, 36, 32); sol.target.position.set(0, 0, 0);
  // relleno frio y suave, sin sombra, para que las sombras no se vayan a gris
  const relleno = new THREE.DirectionalLight(0xbcd0ff, 0.28); relleno.position.set(26, 18, -30); escena.add(relleno);
  sol.castShadow = true;
  const sz = movil ? 1024 : 2048;
  sol.shadow.mapSize.set(sz, sz);
  Object.assign(sol.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 10, far: 120 });
  sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.05; sol.shadow.radius = 5;
  escena.add(sol, sol.target);

  /* ===================== suelo y alrededores ===================== */
  const suelo = new THREE.Mesh(new THREE.CircleGeometry(260, 48), new THREE.MeshToonMaterial({ color: 0xc3d6a2, gradientMap: toon }));
  suelo.rotation.x = -Math.PI / 2; suelo.position.y = -0.02; suelo.receiveShadow = true; M.add(suelo);
  const tAd = texAdoquin(); tAd.repeat.set(30, 8);
  const calle = new THREE.Mesh(new THREE.PlaneGeometry(300, 16), new THREE.MeshToonMaterial({ map: tAd, gradientMap: toon }));
  calle.rotation.x = -Math.PI / 2; calle.position.set(0, 0.0, 26); calle.receiveShadow = true; M.add(calle);
  const tAd2 = texAdoquin(); tAd2.repeat.set(2.4, 2.4);
  const lote = new THREE.Mesh(new THREE.PlaneGeometry(40, 8), new THREE.MeshToonMaterial({ map: tAd2, color: 0xe6d9c0, gradientMap: toon }));
  lote.rotation.x = -Math.PI / 2; lote.position.set(0, 0.012, 20.4); lote.receiveShadow = true; M.add(lote);
  const jardin = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshToonMaterial({ color: 0xe6d8b4, gradientMap: toon }));
  jardin.rotation.x = -Math.PI / 2; jardin.position.set(0, 0.006, -1); jardin.receiveShadow = true; M.add(jardin);

  // cerros lejanos y nubes
  const lejos = new THREE.Group(); M.add(lejos);
  const cerroMat = [0xa9c391, 0x9bb987, 0xb4ca9f].map((c) => new THREE.MeshToonMaterial({ color: c, gradientMap: toon }));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.2, r = 140 + rand() * 50;
    const g = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 4), cerroMat[i % 3]);
    const s = 30 + rand() * 30;
    g.scale.set(s * 1.4, s * (0.45 + rand() * 0.3), s * 1.1);
    g.position.set(Math.cos(a) * r, -s * 0.12, Math.sin(a) * r);
    lejos.add(g);
  }
  const tNube = texNube();
  for (let i = 0; i < 7; i++) {
    const n = new THREE.Sprite(new THREE.SpriteMaterial({ map: tNube, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
    n.scale.set(40 + rand() * 30, 18 + rand() * 10, 1);
    n.position.set(-150 + rand() * 300, 55 + rand() * 25, -120 - rand() * 60);
    M.add(n); mundo.nubes.push({ s: n, v: 0.5 + rand() * 0.8 });
  }

  /* ===================== base de la casa ===================== */
  // anillo de piso a 0.3: cuatro losas alrededor del patio hundido
  sm.frame(0, 0, 0, 0);
  sm.box([30.9, FL, 9.4], [0, 0, 10.55], COL.piedra);
  sm.box([30.9, FL, 9.4], [0, 0, -10.55], COL.piedra);
  sm.box([9.4, FL, 12.2], [10.55, 0, 0], COL.piedra);
  sm.box([9.4, FL, 12.2], [-10.55, 0, 0], COL.piedra);
  // borde de los escalones del patio y tablon del corredor
  sm.box([12.5, 0.06, 0.18], [0, FL, 6.05], "#B7A486"); sm.box([12.5, 0.06, 0.18], [0, FL, -6.05], "#B7A486");
  sm.box([0.18, 0.06, 12.0], [6.05, FL, 0], "#B7A486"); sm.box([0.18, 0.06, 12.0], [-6.05, FL, 0], "#B7A486");

  /* ===================== muros de fachada con huecos y balcones ===================== */
  // posiciones de ventanas por lado (en t, la coordenada a lo largo del lado)
  const VENT = {
    S: [-12, -8, 8, 12], N: [-12, -8, -2.5, 2.5, 8, 12], E: [-6, 0, 6], W: [-6, 0, 6]
  };
  const ZOC = { S: ["#3E86B5", "#EE9AA6", "#F0BC6E"], E: ["#7FB7D6"], N: ["#7FA583", "#E9876A", "#A9B2EC"], W: ["#A9B2EC"] };
  Object.entries(LADO).forEach(([k, L]) => {
    const O = L.out, su = L.su = O.su;
    const huecos = [];
    VENT[k].forEach((t) => huecos.push({ x: su * t, y: 1.05, w: 1.5, h: 2.35 }));
    if (k === "S") huecos.push({ x: 0, y: 0, w: 3.2, h: 3.9, arco: true });
    // muro exterior: lo hago en el marco de la fachada (z hacia afuera)
    const g = muroGeo(rectPts(30.9, HO), huecos, 0.45);
    sm.frame(O.o[0], 0, O.o[2], O.th);
    sm.geo(g, COL.cal, [0, 0, -0.225]);
    // pretil/cornisa
    sm.box([31.0, 0.14, 0.62], [0, HO - 0.04, -0.2], COL.cal2);
    // zocalo en colores vivos (Guatape): una franja por tramo
    const tr = ZOC[k], n = tr.length, anchoT = 30 / n;
    tr.forEach((c, i) => {
      sm.box([anchoT - 0.1, 0.95, 0.07], [-15 + anchoT * (i + 0.5), 0, 0.02], c);
      sm.box([anchoT - 0.1, 0.1, 0.12], [-15 + anchoT * (i + 0.5), 0.95, 0.02], "#F7F0E0");
    });
    // ventanas: marco, parteluz, postigos, balcon
    VENT[k].forEach((t, i) => {
      const u = su * t, c = VIVOS[(i * 3 + k.charCodeAt(0)) % VIVOS.length], c2 = VIVOS[(i * 3 + 2 + k.charCodeAt(0)) % VIVOS.length];
      balcon(sm, u, c, c2, rand);
    });
    if (k === "S") porton(sm);
  });

  function marcoVentana(m, u, c, ancho, alto, y0) {
    const e = 0.09;
    m.box([e, alto, 0.16], [u - ancho / 2, y0, 0.06], c); m.box([e, alto, 0.16], [u + ancho / 2, y0, 0.06], c);
    m.box([ancho + e, e, 0.16], [u, y0 + alto - e, 0.06], c); m.box([ancho + e, e, 0.16], [u, y0, 0.06], c);
    m.box([0.05, alto, 0.06], [u, y0, 0.0], c); m.box([ancho, 0.05, 0.06], [u, y0 + alto * 0.62, 0.0], c);
  }

  /* balcon tradicional de madera: losa sobre canes, barandilla con balaustres torneados, jardinera con flores colgantes */
  function balcon(m, u, c, c2, r) {
    const A = 1.5, Wb = 2.9, Dp = 1.05, y0 = 0.95;
    marcoVentana(m, u, c, A, 2.35, 1.05);
    // dintel/cornisa sobre la ventana
    m.box([A + 0.5, 0.14, 0.26], [u, 3.42, 0.1], c2); m.box([A + 0.2, 0.1, 0.18], [u, 3.56, 0.08], c);
    // postigos: dos hojas entreabiertas
    for (const sg of [-1, 1]) {
      m.box([0.72, 2.2, 0.05], [u + sg * (A / 2 + 0.28), 1.1, 0.34], c2, [0, sg * 0.5, 0]);
      m.box([0.5, 0.06, 0.06], [u + sg * (A / 2 + 0.28), 2.2, 0.38], c);
    }
    // losa y canes
    m.box([Wb, 0.1, Dp], [u, y0, Dp / 2], COL.maderaCl);
    m.box([Wb + 0.08, 0.06, 0.08], [u, y0 + 0.1, Dp], c);
    for (const sg of [-1, 0, 1]) m.box([0.12, 0.42, 0.62], [u + sg * 1.0, y0 - 0.42, 0.34], c2);
    // barandilla
    const yb = y0 + 0.1, hb = 0.95;
    m.box([Wb, 0.07, 0.09], [u, yb + hb, Dp - 0.04], c); m.box([Wb, 0.06, 0.07], [u, yb + 0.08, Dp - 0.04], c);
    for (let i = 0; i <= 8; i++) m.bal(hb - 0.05, [u - Wb / 2 + 0.08 + i * ((Wb - 0.16) / 8), yb + 0.08, Dp - 0.04], c2);
    for (const sg of [-1, 1]) {
      m.box([0.07, 0.07, Dp], [u + sg * (Wb / 2 - 0.04), yb + hb, Dp / 2], c);
      m.box([0.07, 0.06, Dp], [u + sg * (Wb / 2 - 0.04), yb + 0.08, Dp / 2], c);
      for (let i = 1; i <= 2; i++) m.bal(hb - 0.05, [u + sg * (Wb / 2 - 0.04), yb + 0.08, i * Dp / 3], c2);
      m.box([0.12, hb + 0.14, 0.12], [u + sg * (Wb / 2 - 0.04), yb, Dp - 0.04], c);
      m.sph(0.085, [u + sg * (Wb / 2 - 0.04), yb + hb + 0.2, Dp - 0.04], c2, 6);
    }
    // jardinera colgada al frente y flores que caen
    m.box([Wb - 0.3, 0.3, 0.3], [u, yb + 0.12, Dp + 0.14], c2);
    m.box([Wb - 0.2, 0.04, 0.34], [u, yb + 0.42, Dp + 0.14], c);
    const nf = 12;
    for (let i = 0; i < nf; i++) {
      const fx = u - (Wb - 0.6) / 2 + (i / (nf - 1)) * (Wb - 0.6) + (r() - 0.5) * 0.1;
      m.sph(0.17, [fx, yb + 0.58, Dp + 0.14 + (r() - 0.5) * 0.12], COL.verde3, 5, 0.8);
      m.sph(0.1, [fx + (r() - 0.5) * 0.1, yb + 0.72, Dp + 0.14 + (r() - 0.5) * 0.1], FLORES[(r() * FLORES.length) | 0], 5);
      if (i % 2 === 0) m.cyl(0.05, 0.0, 0.5 + r() * 0.35, [fx, yb - 0.55 - r() * 0.2, Dp + 0.3], i % 4 ? COL.verde : COL.verde3, 5);
    }
  }

  function porton(m) {
    // portón de zaguan: dos hojas de madera pintada con tachones y un postigo
    const O = LADO.S.out;
    m.frame(O.o[0], 0, O.o[2], O.th);
    const cH = "#EE9AA6", cO = "#D9808E";
    for (const sg of [-1, 1]) {
      m.box([1.52, 3.12, 0.1], [sg * 0.78, 0, -0.28], cH);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) m.sph(0.06, [sg * 0.78 + (i - 1.5) * 0.3, 0.45 + j * 0.9, -0.2], "#E3B766", 5);
      m.box([0.05, 3.1, 0.04], [sg * 0.78, 0, -0.21], cO);
    }
    m.box([0.6, 1.1, 0.04], [-0.78, 0.55, -0.2], "#7FB7D6"); m.box([0.7, 1.2, 0.03], [-0.78, 0.5, -0.19], "#EE9AA6");
    m.cyl(0.07, 0.07, 0.14, [0.1, 1.5, -0.18], "#E3B766", 8, [Math.PI / 2, 0, 0]);
    // arco enmarcado con color
    const arco = muroGeo([[-1.9, 0], [1.9, 0], [1.9, 3.9], [-1.9, 3.9]], [{ x: 0, y: 0, w: 3.2, h: 3.9, arco: true }], 0.12);
    m.geo(arco, "#8A6358", [0, 0, 0.0]);
    // faroles a los lados
    for (const sg of [-1, 1]) {
      m.box([0.05, 0.05, 0.4], [sg * 2.4, 3.3, 0.2], COL.hierro);
      m.box([0.24, 0.34, 0.24], [sg * 2.4, 2.85, 0.4], "#F6D365");
      m.cyl(0.18, 0.0, 0.16, [sg * 2.4, 3.19, 0.4], COL.hierro, 4);
    }
    // escalon de entrada y pasamanos de piedra
    m.box([4.6, 0.16, 0.9], [0, 0, 0.55], COL.piedra);
    m.frame(0, 0, 0, 0);
  }

  /* ===================== tabiques entre cuartos (trapecios segun el tejado) ===================== */
  mundo.tabs = [];
  const matCal = new THREE.MeshToonMaterial({ color: COL.cal2, gradientMap: toon });
  function tabique(x0, z0, x1, z1, d0, d1, clave) {
    const L = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(-(z1 - z0), x1 - x0);
    const h0 = roofH(d0) - 0.45, h1 = roofH(d1) - 0.45;
    const g = muroGeo([[-L / 2, 0], [L / 2, 0], [L / 2, h1], [-L / 2, h0]], null, 0.26);
    if (clave) {
      const me = new THREE.Mesh(g, matCal); me.position.set((x0 + x1) / 2, FL - 0.02, (z0 + z1) / 2); me.rotation.y = ang;
      me.castShadow = true; me.receiveShadow = true; M.add(me); mundo.tabs.push({ clave, g: me, esc: 1, obj: 1 });
      return;
    }
    sm.frame((x0 + x1) / 2, FL - 0.02, (z0 + z1) / 2, ang);
    sm.geo(g, COL.cal2, [0, 0, 0]);
  }
  tabique(-5, 9, -5, 15, 9, 15); tabique(5, 9, 5, 15, 9, 15);
  tabique(-5, -9, -5, -15, 9, 15); tabique(5, -9, 5, -15, 9, 15);
  tabique(-15, 9, -9, 9, 15, 9, "mesa"); tabique(-15, -9, -9, -9, 15, 9, "escaleras");
  tabique(15, 9, 9, 9, 15, 9, "sala"); tabique(15, -9, 9, -9, 15, 9, "taller");

  /* ===================== corredor: columnas, vigas, balaustrada con flores ===================== */
  const colCols = { S: "#7FB7D6", E: "#EE9AA6", N: "#F0BC6E", W: "#7FA583" };
  Object.entries(LADO).forEach(([k, L]) => {
    const cc = colCols[k], cc2 = VIVOS[(k.charCodeAt(0)) % VIVOS.length];
    const pos = (t, d) => L.mapa(t, d);
    const colT = [-9, -6, -3, 3, 6, 9];
    sm.frame(0, 0, 0, 0);
    colT.forEach((t) => {
      const [x, z] = pos(t, 6.2);
      sm.box([0.34, 0.2, 0.34], [x, FL, z], COL.cal);
      sm.cyl(0.13, 0.11, 2.2, [x, FL + 0.2, z], cc, 8);
      sm.box([0.3, 0.1, 0.3], [x, FL + 2.38, z], cc2); sm.box([0.4, 0.12, 0.4], [x, FL + 2.48, z], COL.cal);
    });
    // viga y zapatas
    const [xa, za] = pos(-9, 6.2), [xb, zb] = pos(9, 6.2);
    sm.box([Math.abs(xb - xa) + 0.4, 0.2, Math.abs(zb - za) + 0.4], [(xa + xb) / 2, FL + 2.62, (za + zb) / 2], COL.maderaOsc);
    // balaustrada en cuatro tramos (queda libre el centro: la entrada al patio)
    [[-9, -6], [-6, -3], [3, 6], [6, 9]].forEach(([a, b]) => {
      const n = 9;
      for (let i = 0; i <= n; i++) {
        const t = a + 0.17 + (b - a - 0.34) * (i / n);
        const [x, z] = pos(t, 6.2);
        sm.bal(0.82, [x, FL + 0.1, z], cc2, 1.05);
      }
      const [x0, z0] = pos(a, 6.2), [x1, z1] = pos(b, 6.2);
      const horiz = Math.abs(x1 - x0) > Math.abs(z1 - z0);
      const dim = horiz ? [Math.abs(x1 - x0), 0.08, 0.1] : [0.1, 0.08, Math.abs(z1 - z0)];
      sm.box(dim, [(x0 + x1) / 2, FL + 0.92, (z0 + z1) / 2], cc);
      sm.box(horiz ? [dim[0], 0.07, 0.09] : [0.09, 0.07, dim[2]], [(x0 + x1) / 2, FL + 0.1, (z0 + z1) / 2], cc);
    });
    // macetas colgantes entre columnas y en el centro
    [-4.5, 0, 4.5, -7.5, 7.5].forEach((t, i) => {
      const [x, z] = pos(t, 6.3);
      sm.cyl(0.012, 0.012, 0.55, [x, FL + 1.98, z], COL.tinta, 4);
      sm.cyl(0.19, 0.13, 0.2, [x, FL + 1.8, z], i % 2 ? "#E9876A" : "#EE9AA6", 8);
      for (let j = 0; j < 6; j++) {
        const a = j * 1.05;
        sm.sph(0.1, [x + Math.cos(a) * 0.13, FL + 2.0 + rand() * 0.06, z + Math.sin(a) * 0.13], FLORES[(i + j) % FLORES.length], 5);
      }
      sm.sph(0.2, [x, FL + 1.97, z], COL.verde3, 5, 0.6);
      sm.cyl(0.05, 0, 0.5, [x + 0.1, FL + 1.28, z], COL.verde, 5); sm.cyl(0.05, 0, 0.42, [x - 0.12, FL + 1.36, z + 0.05], COL.verde3, 5);
    });
  });

  /* ===================== patio: piso, centro azul, arboles en las cuatro esquinas ===================== */
  const tPatio = texPiedraPatio(); tPatio.repeat.set(3, 3);
  const patioPiso = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshToonMaterial({ map: tPatio, gradientMap: toon }));
  patioPiso.rotation.x = -Math.PI / 2; patioPiso.position.y = 0.01; patioPiso.receiveShadow = true; M.add(patioPiso);
  // pisos del corredor y del anillo (piedra) bajo el piso de madera de cada cuarto
  const tCor = texPiedraPatio(); tCor.repeat.set(9, 1);
  [["S", [0, 8]], ["N", [0, -8]], ["E", [8, 0]], ["W", [-8, 0]]].forEach(([k, p]) => {
    const horiz = k === "S" || k === "N";
    const m = new THREE.Mesh(new THREE.PlaneGeometry(horiz ? 18 : 3, horiz ? 3 : 12), new THREE.MeshToonMaterial({ map: tCor, gradientMap: toon }));
    // corredor: S/N cubren 18 x 3 (con esquinas); E/W entre medio, 3 x 12 menos esquinas
    m.rotation.x = -Math.PI / 2; m.position.set(horiz ? 0 : (p[0] > 0 ? 7.5 : -7.5), FL + 0.005, horiz ? (p[1] > 0 ? 7.5 : -7.5) : 0);
    m.receiveShadow = true; M.add(m);
  });
  // centro azul
  const tAz = texAzul();
  const azul = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshToonMaterial({ map: tAz, gradientMap: toon, emissive: 0x3E86B5, emissiveIntensity: 0.3 }));
  azul.rotation.x = -Math.PI / 2; azul.position.y = 0.105; azul.receiveShadow = true; M.add(azul);
  sm.frame(0, 0, 0, 0);
  sm.cyl(4.1, 3.9, 0.1, [0, 0, 0], "#F4F6F8", 40);
  for (let i = 0; i < 3; i++) {
    const o = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 40), new THREE.MeshBasicMaterial({ color: 0xf4f6f8, transparent: true, opacity: 0, depthWrite: false }));
    o.rotation.x = -Math.PI / 2; o.position.y = 0.115; M.add(o); mundo.ondas.push({ o, f: i / 3 });
  }

  /* arbol de esquina: bola verde de tres lobulos (#5F8A66 / #7FA583 / #A3C1A0) con florecitas coral, ambar y rosa, como en la 2D */
  function arbol(x, z, k) {
    sm.frame(x, 0, z, 0);
    sm.cyl(0.55, 0.45, 0.3, [0, 0, 0], "#EADFD2", 12);
    sm.cyl(0.24, 0.17, 1.5, [0, 0.2, 0], "#A8693F", 9);
    const V = ["#5F8A66", "#7FA583", "#A3C1A0"];
    [[0, 3.0, 0, 1.35, 0], [0.95, 2.55, 0.25, 0.95, 1], [-0.85, 2.6, -0.3, 1.0, 2], [0.1, 3.0, -0.8, 0.8, 1]].forEach(([dx, dy, dz, r, ci]) => sm.sph(r, [dx, dy, dz], V[(ci + k) % 3], 10, 0.9));
    for (let i = 0; i < 14; i++) { const a = rand() * 6.28, rr = 1.0 + rand() * 0.55; sm.sph(0.11, [Math.cos(a) * rr * 0.95, 2.4 + rand() * 1.2, Math.sin(a) * rr * 0.95 + 0.2], ["#E9876A", "#F6D365", "#EE9AA6"][i % 3], 8); }
  }
  arbol(-4.7, -4.7, 0); arbol(4.7, -4.7, 1); arbol(-4.7, 4.7, 2); arbol(4.7, 4.7, 0);
  // bancas de madera y macetas en el patio
  [[-1.8, 0, 5.0, 0], [1.8, 0, -5.0, Math.PI], [5.0, 0, 1.8, -Math.PI / 2], [-5.0, 0, -1.8, Math.PI / 2]].forEach(([x, , z, r]) => {
    sm.frame(x, 0, z, r);
    sm.box([1.7, 0.1, 0.5], [0, 0.45, 0], COL.maderaCl); sm.box([1.7, 0.4, 0.06], [0, 0.55, -0.22], COL.madera);
    sm.box([0.1, 0.45, 0.4], [-0.7, 0, 0], COL.maderaOsc); sm.box([0.1, 0.45, 0.4], [0.7, 0, 0], COL.maderaOsc);
  });
  [[-5.2, 5.2], [5.2, -5.2], [3.2, 5.4], [-3.4, -5.4]].forEach(([x, z], i) => {
    sm.frame(x, 0, z, 0);
    sm.cyl(0.32, 0.24, 0.5, [0, 0.01, 0], i % 2 ? COL.terra : "#3E86B5", 8);
    sm.sph(0.4, [0, 0.75, 0], COL.verde3, 6, 0.8);
    for (let j = 0; j < 5; j++) sm.sph(0.09, [(rand() - 0.5) * 0.5, 0.95 + rand() * 0.15, (rand() - 0.5) * 0.5], FLORES[(i + j) % FLORES.length], 4);
  });

  /* ===================== tejas: un tejado por cuarto ===================== */
  const texT = texTeja(); texT.repeat.set(1, 1);
  mundo.techoMats = [];
  function tejado(c) {
    const L = LADO[c.lado], dO = 15.9, dI = 6;
    const ta = (d) => (c.t0 <= -15 ? -d : c.t0), tb = (d) => (c.t1 >= 15 ? d : c.t1);
    const P = [[ta(dO), dO], [tb(dO), dO], [tb(dI), dI], [ta(dI), dI]].map(([t, d]) => { const [x, z] = L.mapa(t, d); return { x, z, y: roofH(d), t, d }; });
    const pos = [], uv = [], idx = [0, 1, 2, 0, 2, 3];
    P.forEach((p) => { pos.push(p.x, p.y, p.z); uv.push(p.t * 0.3, p.d * 0.5); });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const mat = new THREE.MeshToonMaterial({ map: texT, gradientMap: toon, side: THREE.DoubleSide, transparent: true, emissive: 0x000000 });
    const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true;
    // faldon: lado vertical bajo cada borde, color teja oscura
    const sp = [], si = [];
    for (let i = 0; i < 4; i++) {
      const a = P[i], b = P[(i + 1) % 4], n = sp.length / 3;
      sp.push(a.x, a.y, a.z, b.x, b.y, b.z, b.x, b.y - 0.26, b.z, a.x, a.y - 0.26, a.z);
      si.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); g2.setIndex(si); g2.computeVertexNormals();
    const mat2 = new THREE.MeshToonMaterial({ color: COL.tejaOsc, gradientMap: toon, side: THREE.DoubleSide, transparent: true });
    const faldon = new THREE.Mesh(g2, mat2); faldon.castShadow = true;
    const grp = new THREE.Group(); grp.add(mesh, faldon); M.add(grp);
    return { grp, mats: [mat, mat2], op: 1, objetivo: 1 };
  }

  const CUERPOS = [["#0E1116", "#FFFFFF"], ["#F0BC6E", "#FFFFFF"], ["#E9876A", "#FFFFFF"], ["#A9B2EC", "#FFFFFF"], ["#EE9AA6", "#FFFFFF"], ["#3E86B5", "#FFFFFF"], ["#F6D365", "#FFFFFF"], ["#7FB7D6", "#FFFFFF"]];
  function habitante(room, i, x, y, z, o = {}) {
    const [cu, oj] = CUERPOS[i % CUERPOS.length];
    const tam = (o.tam || 2.2) * (room.id === "patio" ? 1.1 : 1.3);
    const ce = crearCella({ cuerpo: cu, ojos: oj }, { px: movil ? 160 : 224, fase: i * 1.3, saludoEn: i * 2.1, saluda: o.saluda !== false, brazos: o.brazos, dormida: o.dormida });
    const p = room.loc(x, y, z);
    const b = colocarBill(ce, p, tam, tam, tam * 0.3833, room, true);
    b.anim = o.anim || null; b.rz0 = o.rz || 0; b.yc = tam * 0.3833; b.tam = tam;
    return b;
  }
  const S_ = Math.sin;
  const lazo = (T, t, f = 0) => (t / T + f) % 1;
  const anims = {
    paseo: (A, T, f) => (t, b) => ({ dx: S_(t * 6.283 / T + f) * A, dz: 0, dy: Math.abs(S_(t * 6.283 * 3 / T + f)) * 0.07 }),
    paseoZ: (A, T, f) => (t, b) => ({ dz: S_(t * 6.283 / T + f) * A, dy: Math.abs(S_(t * 6.283 * 3 / T + f)) * 0.07 }),
    salto: (H, T, f) => (t, b) => { const u = lazo(T, t, f); return { dy: u < 0.35 ? H * S_(u / 0.35 * Math.PI) : 0, sy: u > 0.35 && u < 0.45 ? 0.94 : 1 }; },
    mece: (G, T) => (t, b) => ({ rz: S_(t * 6.283 / T) * G, dy: 0 }),
    trepa: (H, T, f) => (t, b) => { const u = lazo(T, t, f); const k = u < 0.2 ? 0 : u < 0.4 ? (u - 0.2) / 0.2 : u < 0.8 ? 1 : 1 - (u - 0.8) / 0.2; const e = k * k * (3 - 2 * k); return { dy: H * e + (u > 0.2 && u < 0.4 ? S_(k * Math.PI) * 0.5 : 0), dz: -0.9 * e, sop: H * e }; },
    duerme: (T) => (t, b) => ({ rz: -1.45, dy: S_(t * 6.283 / T) * 0.03 - 0.5, sx: 1 + S_(t * 6.283 / T) * 0.02 }),
    nevera: (T, f) => (t, b) => { const u = lazo(T, t, f); const k = u < 0.25 ? u / 0.25 : u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3; const e = k * k * (3 - 2 * k); return { dz: -1.0 * e, rz: 0.12 * e, dy: 0 }; }
  };
  /* ===================== cuartos: marco, piso, muro del patio, interior ===================== */
  CUARTOS.forEach((c) => {
    const L = LADO[c.lado];
    const tc = (c.t0 + c.t1) / 2, W = c.lon || (c.t1 - c.t0);
    const [cx, cz] = L.mapa(tc, 12);
    const F = new THREE.Matrix4().compose(Vm(cx, FL, cz), new THREE.Quaternion().setFromAxisAngle(Vm(0, 1, 0), L.th), Vm(1, 1, 1));
    const room = { ...c, W, F, centro: Vm(cx, 0, cz), L, tc, techo: tejado(c), muro: null, billboards: [] };
    // direccion hacia el patio en mundo
    room.haciaPatio = Vm(0, 0, 1).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(Vm(0, 1, 0), L.th));
    room.loc = (x, y, z) => Vm(x, y, z).applyMatrix4(F);
    mundo.cuartos[c.id] = room; mundo.lista.push(room);
    construirPiso(room);
    construirMuroPatio(room);
    construirInterior(room);
    room.techo.grp.children.forEach((o) => { o.userData.sala = c.id; o.userData.techo = room.techo; mundo.hit.push(o); });
  });

  function construirPiso(room) {
    const { W, F } = room;
    const t = texMadera(); t.repeat.set(W / 2.2, 6 / 2.2);
    const cob = room.id === "puerta";
    const tx = cob ? texAdoquin() : t;
    if (cob) tx.repeat.set(W / 3, 2);
    const pal = room.pal ? PAL[room.pal] : null;
    const mat = new THREE.MeshToonMaterial({ map: tx, gradientMap: toon, color: cob ? 0xE8E0D0 : 0xFFFFFF });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.3, 5.7), mat);
    m.rotation.x = -Math.PI / 2; m.position.y = 0.012;
    const g = new THREE.Group(); g.matrixAutoUpdate = false; g.matrix.copy(F); g.add(m); M.add(g); m.receiveShadow = true;
    if (pal && room.id !== "puerta" && room.id !== "ventana") {
      // alfombra con el color del cuarto
      const r = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(W - 2, 5), 3.2), new THREE.MeshToonMaterial({ color: new THREE.Color(pal.campo).multiplyScalar(0.96), gradientMap: toon }));
      r.rotation.x = -Math.PI / 2; r.position.set(room.id === "alcoba" ? -1.5 : 0, 0.02, 0.2); r.receiveShadow = true; g.add(r);
    }
  }

  /* muro del patio (con puerta y ventanas), sus postigos y el panel de color interior; todo en un grupo que baja al entrar al cuarto */
  function construirMuroPatio(room) {
    const { id, lado, p0, p1, F } = room, L = LADO[lado];
    const lon = p1 - p0, pc = (p0 + p1) / 2;
    const [wx, wz] = L.mapa(pc, 9);
    const g = new THREE.Group();
    g.position.set(wx, FL, wz); g.rotation.y = L.th;
    const hH = roofH(9) - 0.2;
    const pal = room.pal ? PAL[room.pal] : { campo: "#E6DDC8" };
    const c = room.acento, c2 = VIVOS[(CUARTOS.indexOf(room) * 2 + 1) % VIVOS.length];
    // huecos en coordenadas locales del muro (x = L.sg*(t - pc))
    const hs = [];
    const H = (x, y, w, h, arco) => hs.push({ x, y, w, h, arco });
    switch (id) {
      case "puerta": H(0, 0, 3.4, 3.2, true); break;
      case "cocina": H(-2.2, 0, 1.8, 2.7, true); H(2.8, 0.9, 1.4, 1.5); break;
      case "ventana": H(-5, 0.7, 2.2, 2.4); H(0, 0.7, 2.2, 2.4); H(5, 0.7, 2.2, 2.4); break;
      case "alcoba": H(-6, 0, 1.8, 2.7, true); H(0, 0.9, 1.6, 1.6); H(6, 0.9, 1.6, 1.6); break;
      case "mesa": H(0, 0, 1.8, 2.7, true); break;
      case "escaleras": H(0, 0, 1.8, 2.7, true); break;
      default: H(0, 0, 1.8, 2.7, true);
    }
    // normalizar hs de cocina (simple): x ya local
    const slab = new THREE.Mesh(muroGeo(rectPts(lon, hH), hs, 0.36), new THREE.MeshToonMaterial({ color: COL.cal, gradientMap: toon }));
    slab.castShadow = true; slab.receiveShadow = true; g.add(slab);
    const pan = new THREE.Mesh(muroGeo(rectPts(lon, hH), hs, 0.04), new THREE.MeshToonMaterial({ color: pal.campo, gradientMap: toon, emissive: pal.campo, emissiveIntensity: 0.28 }));
    pan.position.z = -0.2; g.add(pan);
    // detalles (marcos, postigos, hojas de puerta)
    const dm = new Merger(); dm.grad = false;
    dm.frame(0, 0, 0, 0);
    hs.forEach((h, i) => {
      const cc = i % 2 ? c2 : c, e = 0.09;
      dm.box([e, h.h, 0.12], [h.x - h.w / 2, h.y, 0.2], cc); dm.box([e, h.h, 0.12], [h.x + h.w / 2, h.y, 0.2], cc);
      if (!h.arco) { dm.box([h.w + e, e, 0.12], [h.x, h.y + h.h, 0.2], cc); }
      else { dm.cyl(h.w / 2 + 0.05, h.w / 2 + 0.05, 0.1, [h.x, h.y + h.h - h.w / 2, 0.2], cc, 14, [Math.PI / 2, 0, 0]); }
      if (h.y > 0.1) {   // ventana: antepecho, parteluz y postigos abiertos
        dm.box([h.w + 0.3, 0.1, 0.3], [h.x, h.y - 0.1, 0.2], cc);
        dm.box([0.05, h.h, 0.06], [h.x, h.y, 0.2], cc); dm.box([h.w, 0.05, 0.06], [h.x, h.y + h.h * 0.55, 0.2], cc);
        for (const sg of [-1, 1]) dm.box([h.w / 2 - 0.05, h.h - 0.05, 0.05], [h.x + sg * (h.w / 2 + h.w / 4 - 0.05), h.y, 0.38], cc === c ? c2 : c, [0, sg * 1.0, 0]);
        // flores en la ventana
        dm.box([h.w + 0.1, 0.22, 0.28], [h.x, h.y - 0.2, 0.42], cc === c ? c2 : c);
        for (let k = 0; k < 7; k++) dm.sph(0.1, [h.x - h.w / 2 + 0.1 + k * (h.w / 7), h.y + 0.1, 0.42], k % 2 ? FLORES[k % FLORES.length] : COL.verde3, 5);
      } else {   // puerta con hoja entreabierta
        if (h.arco) {
          for (const sg of [-1, 1]) dm.box([0.08, 3.0, h.w / 2 - 0.1], [h.x + sg * (h.w / 2 - 0.05), 0, 0.2 + (h.w / 4)], "#3E86B5", [0, 0, 0]);
        } else dm.box([0.06, h.h - 0.05, h.w - 0.1], [h.x + h.w / 2 - 0.05, h.y, 0.2 + (h.w - 0.1) / 2], COL.maderaCl);
      }
    });
    // zocalo del corredor en color vivo
    dm.box([lon - 0.1, 0.8, 0.06], [0, 0, 0.19], c);
    g.add(dm.build(matVert, true));
    M.add(g);
    room.muro = { g, esc: 1, obj: 1 };
  }

  /* ===================== interiores ===================== */
  // utilidades de colocacion en el marco del cuarto
  function Fm(room) { const m = new Merger(); m.F.copy(room.F); m.grad = true; return m; }
  function cellaEn(room, pal, x, z, tam, opts) {
    tam *= 1.3;
    const ce = crearCella(pal, { px: movil ? 160 : 256, ...opts });
    const p = room.loc(x, 0, z);
    colocarBill(ce, p, tam, tam, tam * 0.3833, room, true, opts && opts.sombra);
    return ce;
  }
  function colocarBill(obj, p, w, h, yc, room, esCella, escSombra = 1.1) {
    const g = new THREE.Group(); g.position.copy(p);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: obj.tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide }));
    m.position.y = yc; g.add(m);
    // sombra de suelo: elipse alargada hacia el lado contrario del sol; la sigue en el bucle (posicion, escala con el salto, opacidad)
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(esCella ? w * 0.62 : w * 1.2, esCella ? w * 0.26 : w * 0.6), new THREE.MeshBasicMaterial({ map: texSombra(), transparent: true, depthWrite: false, opacity: 0.95 }));
    sh.rotation.x = -Math.PI / 2; sh.rotation.z = SOMBRA_ANG;
    sh.position.set(p.x + SOMBRA_DIR[0] * w * 0.07, p.y + 0.02, p.z + SOMBRA_DIR[1] * w * 0.07); M.add(sh);
    g.rotation.order = "YXZ"; M.add(g);
    const b = { g, m, sh, w, obj, base: p.clone(), fase: rand() * 6.28, esCella, sala: room.id, f: 1, fo: 1 };
    mundo.billboards.push(b); m.userData.sala = room.id; mundo.hit.push(m);
    room.billboards.push(b);
    return b;
  }
  /* todos los habitantes son Cellas: mismo dibujo, otro color de cuerpo (de la paleta) y otro tamano; hacen cosas todo el tiempo */
  function quieta() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }

  function vapor(room, x, y, z, n = 6, esc = 1) {
    const p = room.loc(x, y, z);
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mundo._soft || (mundo._soft = texSuaveBlanco()), transparent: true, opacity: 0, depthWrite: false }));
      s.scale.set(0.3, 0.3, 1); M.add(s);
      mundo.vapor.push({ s, p: p.clone(), t0: i / n, vel: 0.5 + rand() * 0.2, dx: (rand() - 0.5) * 0.4 * esc, esc });
    }
  }
  /* espuma que rebosa: burbujas que se hinchan en el borde y bajan por la pared de la olla, despacio, hasta deshacerse */
  function espuma(room, x, y, z, R) {
    const p = room.loc(x, y, z), mat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toon, transparent: true });
    const N = movil ? 10 : 14;
    for (let i = 0; i < N; i++) {
      const mm = new THREE.Mesh(new THREE.SphereGeometry(1, 9, 7), mat);
      mm.position.copy(p); M.add(mm);
      mundo.espuma.push({ m: mm, p: p.clone(), R, a: (i / N) * 6.283 + (i % 3) * 0.3, f: (i * 0.37) % 1, v: 0.16 + (i % 4) * 0.03 });
    }
  }
  function brillo(room, x, y, z, tam = 1.6, rgb = "255,214,120") {
    const p = room.loc(x, y, z);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrillo(rgb), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 }));
    s.position.copy(p); s.scale.set(tam, tam, 1); M.add(s);
    mundo.brillos.push({ s, base: tam, f: rand() * 6 });
  }
  function silla(m, x, z, r, c) {
    m.frame(0, 0, 0, 0); // placeholder, restaurado por el llamador
  }

  function construirInterior(room) {
    const m = Fm(room);
    const id = room.id;
    const W = room.W;
    if (id === "cocina") {
      const P = PAL.cocina;
      // estufa blanca con perillas azules (la de la 2D), sin campana
      m.box([2.5, 0.85, 1.2], [-2.6, 0, -2.3], "#F8F1E6"); m.box([2.6, 0.08, 1.3], [-2.6, 0.85, -2.3], "#E3E8EE");
      [-3.1, -2.6, -2.1].forEach((x) => { m.cyl(0.1, 0.1, 0.06, [x, 0.5, -1.68], "#3E86B5", 10, [Math.PI / 2, 0, 0]); });
      m.box([1.1, 0.4, 0.05], [-2.6, 0.25, -1.67], "#DCE3EA");
      [[-3.1, -2.1], [-2.1, -2.1]].forEach(([x, z]) => m.cyl(0.3, 0.3, 0.03, [x, 0.93, z], "#2A2F38", 14));
      // la olla es grande, hecha a la medida de la Cella: negra con tapa, hierve y rebosa
      m.cyl(0.56, 0.52, 0.8, [-3.1, 0.96, -2.1], "#5E7FA3", 18); m.cyl(0.6, 0.6, 0.1, [-3.1, 1.66, -2.1], "#F4F6F8", 18);   // olla de esmalte azul con borde blanco; la tapa va levantada
      m.cyl(0.5, 0.5, 0.06, [-3.1, 1.98, -2.1], "#E3E8EE", 18, [0.28, 0, 0.12]); m.sph(0.09, [-3.1, 2.12, -2.1], "#E9876A", 8);
      m.box([0.28, 0.1, 0.12], [-3.8, 1.35, -2.1], "#3A4150"); m.box([0.28, 0.1, 0.12], [-2.4, 1.35, -2.1], "#3A4150");
      m.cyl(0.3, 0.32, 0.34, [-2.1, 0.96, -2.1], COL.metal, 14); m.cyl(0.33, 0.33, 0.05, [-2.1, 1.3, -2.1], "#8F959C", 14);
      // utensilios colgados
      m.box([2.4, 0.05, 0.05], [-2.6, 2.0, -2.9], COL.maderaOsc);
      [-3.5, -3.0, -2.5, -2.0, -1.6].forEach((x, i) => { m.box([0.03, 0.35, 0.03], [x, 1.62, -2.88], COL.tinta); m.cyl(0.16 - i * 0.01, 0.16 - i * 0.01, 0.03, [x, 1.4, -2.88], i % 2 ? "#E3B766" : COL.metal, 10, [Math.PI / 2, 0, 0]); });
      // repisa con frascos
      for (const y of [1.45, 2.2]) m.box([2.8, 0.07, 0.5], [3.0, y, -2.7], COL.maderaCl);
      for (let i = 0; i < 9; i++) m.sph(0.15, [1.95 + i * 0.28, 1.66, -2.7 + (i % 2) * 0.06], ["#E9876A", "#F6D365", "#EE9AA6"][i % 3], 10);
      for (let i = 0; i < 7; i++) m.cyl(0.13, 0.11, 0.3, [2.1 + i * 0.33, 2.27, -2.7], i % 2 ? COL.crema : "#F6D365", 8);
      // isla de trabajo
      const tx = 1.0, tz = 0.3;
      m.box([2.8, 0.1, 1.3], [tx, 0.82, tz], COL.maderaCl);
      for (const [sx, sz] of [[-1.25, -0.55], [1.25, -0.55], [-1.25, 0.55], [1.25, 0.55]]) m.box([0.12, 0.82, 0.12], [tx + sx, 0, tz + sz], COL.maderaOsc);
      m.box([0.9, 0.05, 0.5], [tx - 0.6, 0.92, tz], "#E7B97E"); m.cyl(0.22, 0.17, 0.16, [tx + 0.5, 0.92, tz + 0.1], "#F4F6F8", 10);
      for (let i = 0; i < 3; i++) m.box([0.5, 0.1, 0.12], [tx + 0.8 + i * 0.12, 1.08 + i * 0.09, tz - 0.2], "#F6D365", [0, 0.2 * i, 0.1]);
      // nevera de bloque con la puerta abierta; una Cella mete la cabeza
      m.box([1.9, 3.0, 1.2], [3.6, 0, 0.6], "#F8F1E6"); m.box([1.4, 1.0, 0.04], [3.6, 1.2, 1.16], "#DCE3EA"); m.box([0.08, 2.0, 0.9], [4.5, 0.3, 1.0], "#C9CDD2", [0, -0.9, 0]);
      habitante(room, 7, 3.0, 0, 1.9, { tam: 2.2, anim: anims.nevera(11, 0), saluda: false });
      habitante(room, 2, -1.3, 0, 2.3, { tam: 1.3, anim: anims.salto(0.3, 7, 0.3) });
      // tinaja y leña
      m.sph(0.62, [4.2, 0.65, -2.2], COL.terra, 8, 1.1); m.cyl(0.4, 0.3, 0.2, [4.2, 1.25, -2.2], COL.terra, 10);
      for (let i = 0; i < 6; i++) m.cyl(0.12, 0.12, 1.1, [-4.4, 0.12 + (i % 3) * 0.22, -0.6 + (i % 2) * 0.1 - (i > 2 ? 0.15 : 0)], "#8B6B45", 7, [0, 0, Math.PI / 2]);
      // ristras de ajo/ají en la pared
      for (let i = 0; i < 4; i++) { m.cyl(0.015, 0.015, 0.9, [0.4 + i * 0.35, 2.6, -2.9], COL.tinta, 4); for (let j = 0; j < 5; j++) m.sph(0.09, [0.4 + i * 0.35, 2.6 + j * 0.0 + 0.55 - j * 0.17, -2.87], i % 2 ? "#E9876A" : "#F4F6F8", 5); }
      room.mm = m;
      // vapor y Cella
      vapor(room, -3.1, 2.15, -2.1, 6, 1.0); vapor(room, -2.1, 1.4, -2.1, 5, 1.0); espuma(room, -3.1, 1.74, -2.1, 0.58);
      room.cella = cellaEn(room, P, 0.7, 1.4, 2.4, { saludoEn: 2 });
      
    }
    if (id === "mesa") {
      const P = PAL.mesa;
      // mesa redonda ambar con pata central y mantel, como en la 2D
      m.cyl(1.7, 1.6, 0.14, [0, 0.9, 0], "#E3A94E", 24); m.cyl(1.72, 1.72, 0.03, [0, 1.04, 0], "#F8F1E6", 24); m.cyl(1.0, 1.0, 0.035, [0, 1.07, 0], "#E9876A", 24);
      m.cyl(0.3, 0.45, 0.9, [0, 0, 0], "#A8693F", 12); m.cyl(0.9, 0.9, 0.1, [0, 0, 0], "#A8693F", 18);
      const cs = ["#3E86B5", "#EE9AA6", "#F0BC6E", "#7FA583", "#E9876A", "#A9B2EC"];
      [[-1.2, -1.75, 0], [0, -1.8, 0], [1.2, -1.75, 0], [-1.2, 1.75, Math.PI], [0, 1.8, Math.PI], [1.2, 1.75, Math.PI]].forEach(([x, z, r], i) => {
        m.cyl(0.42, 0.4, 0.55, [x, 0, z], cs[i], 14); m.cyl(0.44, 0.44, 0.08, [x, 0.55, z], "#F8F1E6", 14);   // banquito redondo
      });
      // tazas, platos, cafetera, frutero, jarron
      [-1.4, -0.6, 0.2, 1.0, 1.6].forEach((x, i) => {
        m.cyl(0.075, 0.06, 0.1, [x, 0.93, i % 2 ? 0.4 : -0.4], COL.crema, 10); m.cyl(0.06, 0.06, 0.012, [x, 1.03, i % 2 ? 0.4 : -0.4], "#3B2415", 10);
        m.cyl(0.17, 0.15, 0.02, [x + 0.2, 0.93, i % 2 ? 0.2 : -0.2], "#F4F6F8", 12);
      });
      m.cyl(0.2, 0.12, 0.34, [0.1, 0.93, 0], "#E9876A", 10); m.cyl(0.05, 0.05, 0.08, [0.1, 1.27, 0], COL.tinta, 6);
      m.cyl(0.3, 0.2, 0.14, [-0.9, 0.93, 0], COL.terra, 10); [0, 1, 2, 3].forEach((i) => m.sph(0.1, [-0.9 + (i - 1.5) * 0.1, 1.1, (i % 2) * 0.08 - 0.04], ["#F6D365", "#E9876A", "#7FA583", "#E9876A"][i], 5));
      m.cyl(0.12, 0.08, 0.3, [1.4, 0.93, 0], "#3E86B5", 8); for (let i = 0; i < 5; i++) m.sph(0.09, [1.4 + (i - 2) * 0.08, 1.35 + (i % 2) * 0.05, 0], FLORES[i % FLORES.length], 4);
      // lampara colgante
      m.cyl(0.012, 0.012, 1.4, [0, 2.25, 0], COL.tinta, 4); m.cyl(0.55, 0.14, 0.4, [0, 1.85, 0], "#F6D365", 12);
      m.box([2.6, 0.12, 0.5], [0, 1.9, -2.7], COL.maderaCl); for (const sx of [-0.8, 0.8]) { m.cyl(0.22, 0.17, 0.3, [sx, 2.02, -2.7], sx < 0 ? "#E9876A" : "#3E86B5", 12); m.sph(0.3, [sx, 2.5, -2.7], COL.verde3, 10, 0.9); }
      
      room.mm = m;
      habitante(room, 4, -1.3, 0, -1.7, { tam: 2.0, anim: anims.paseo(0.15, 7, 0) });
      habitante(room, 6, 1.0, 0.3, 1.6, { tam: 1.7, anim: anims.trepa(0.98, 14, 0.1), saluda: false });   // una se sube a la mesa
      brillo(room, 0, 1.75, 0, 2.6);
    }
    if (id === "alcoba") {
      const P = PAL.alcoba;
      // cama con cabecera, almohadas y cobija
      const bx = -2.0, bz = -1.5;
      m.box([3.0, 0.4, 1.9], [bx, 0.05, bz], COL.maderaOsc); m.box([2.85, 0.3, 1.75], [bx, 0.45, bz], "#F7F0E0");   // cama corta y ancha
      m.box([2.9, 0.14, 1.1], [bx, 0.74, bz + 0.35], "#F6D365"); m.box([2.92, 0.05, 0.3], [bx, 0.88, bz + 0.2], "#E9876A");
      m.box([1.1, 0.18, 0.45], [bx - 0.8, 0.75, bz - 0.6], COL.crema); m.box([1.1, 0.18, 0.45], [bx + 0.8, 0.75, bz - 0.6], COL.crema);
      m.box([3.2, 1.2, 0.14], [bx, 0.05, bz - 1.0], COL.madera); m.sph(0.11, [bx - 1.5, 1.35, bz - 1.0], "#E3B766", 6); m.sph(0.11, [bx + 1.5, 1.35, bz - 1.0], "#E3B766", 6);
      // mesitas con lampara
      for (const sx of [-1.55, 1.55]) { m.box([0.65, 0.65, 0.55], [bx + sx - (sx < 0 ? 0.2 : -0.2) * 1, 0.05, bz - 1.0], COL.madera); }
      const lx = bx + 1.75, lz = bz - 1.0;
      m.cyl(0.1, 0.07, 0.3, [lx, 0.7, lz], "#E3B766", 8); m.cyl(0.26, 0.16, 0.3, [lx, 0.98, lz], "#F6D365", 10);
      brillo(room, lx, 1.1, lz, 1.5);
      // armario, baúl, tocador, silla
      m.box([2.3, 3.0, 0.95], [-7.0, 0, -2.4], "#7A4A28"); m.box([2.4, 0.18, 1.05], [-7.0, 3.0, -2.4], COL.maderaOsc);
      m.box([0.05, 2.6, 0.04], [-7.0, 0.2, -1.9], COL.maderaOsc); m.sph(0.05, [-7.12, 1.5, -1.88], "#E3B766", 5); m.sph(0.05, [-6.88, 1.5, -1.88], "#E3B766", 5);
      m.box([0.85, 2.4, 0.04], [-7.55, 0.3, -1.915], "#8A5A30"); m.box([0.85, 2.4, 0.04], [-6.45, 0.3, -1.915], "#8A5A30");
      m.box([1.5, 0.7, 0.85], [3.4, 0, -2.45], COL.maderaOsc); m.box([1.56, 0.1, 0.9], [3.4, 0.7, -2.45], COL.maderaCl); m.box([1.5, 0.05, 0.08], [3.4, 0.45, -2.0], "#E3B766");
      m.box([1.4, 0.8, 0.5], [6.0, 0, -2.55], COL.maderaCl); m.cyl(0.6, 0.6, 0.06, [6.0, 1.7, -2.88], "#BFD9E6", 16, [Math.PI / 2, 0, 0]); m.cyl(0.66, 0.66, 0.04, [6.0, 1.7, -2.9], "#E3B766", 16, [Math.PI / 2, 0, 0]);
      m.box([0.55, 0.06, 0.55], [4.5, 0.5, 0.2], "#A9B2EC"); m.box([0.55, 0.65, 0.06], [4.5, 0.55, 0.44], "#A9B2EC"); for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) m.box([0.05, 0.5, 0.05], [4.5 + a, 0, 0.2 + b], COL.maderaOsc);
      m.box([0.5, 0.05, 0.5], [4.5, 0.62, 0.15], "#F0BC6E", [0, 0.3, 0]);
      // planta y colgaduras
      m.cyl(0.3, 0.22, 0.5, [-8.2, 0, 1.4], COL.terra, 8); m.sph(0.55, [-8.2, 1.1, 1.4], COL.verde3, 6, 1.0); m.sph(0.4, [-8.0, 1.5, 1.3], COL.verde, 6);
      room.mm = m;
      habitante(room, 6, bx, 0.75, bz + 0.2, { tam: 1.9, anim: anims.salto(0.9, 5, 0), saluda: false });   // salta en la cama
      habitante(room, 3, 4.6, 0, 1.2, { tam: 2.1, anim: anims.paseo(1.2, 12, 0) });
    }
    if (id === "escaleras") {
      const P = PAL.escaleras;
      const n = 5, tread = 0.85, rise = 0.4, x0 = -4.2, zc = -2.0;
      for (let i = 0; i < n; i++) {
        m.box([tread, (i + 1) * rise - 0.04, 2.0], [x0 + tread * (i + 0.5), 0, zc], COL.maderaCl);
        m.box([tread + 0.02, 0.05, 2.06], [x0 + tread * (i + 0.5), (i + 1) * rise - 0.06, zc], COL.maderaCl);
        m.box([0.04, rise, 2.0], [x0 + tread * i + 0.02, i * rise, zc], "#E9876A");
      }
      const xt = x0 + tread * n;       // inicio del descanso
      const alt = n * rise;
      m.box([3.6, alt - 0.04, 2.2], [xt + 1.8, 0, -1.8], "#EFE5CF"); m.box([3.7, 0.1, 2.3], [xt + 1.8, alt - 0.06, -1.8], COL.maderaCl);
      // barandilla del descanso (frente) y de la escalera
      const fz = -0.7;
      for (let i = 0; i <= 8; i++) m.bal(0.85, [xt + 0.15 + i * 0.4, alt + 0.04, fz], "#7FA583");
      m.box([3.7, 0.08, 0.1], [xt + 1.8, alt + 0.9, fz], "#5F8A66"); m.box([3.7, 0.06, 0.08], [xt + 1.8, alt + 0.06, fz], "#5F8A66");
      m.box([0.14, 1.0, 0.14], [xt + 3.6, alt, fz], "#5F8A66"); m.sph(0.1, [xt + 3.6, alt + 1.1, fz], "#E3B766", 6);
      for (let i = 0; i < n; i++) m.bal(0.8, [x0 + tread * (i + 0.5), (i + 1) * rise, -1.35], "#7FA583", 0.9);
      m.box([tread * n + 0.1, 0.07, 0.09], [x0 + tread * n / 2, 0.0, -1.35], "#5F8A66", [0, 0, Math.atan2(alt, tread * n)]);
      // el pasamanos inclinado va ajustado a la altura media
      // mesita de las llaves con cuenco
      m.box([1.2, 0.8, 0.5], [-3.8, 0, 0.9], COL.maderaOsc); m.cyl(0.24, 0.16, 0.12, [-3.8, 0.8, 0.9], "#3E86B5", 12); m.box([0.1, 0.015, 0.05], [-3.78, 0.93, 0.9], "#E3B766", [0, 0.6, 0]);
      m.box([0.05, 0.6, 1.0], [-4.9, 1.0, 0.4], COL.maderaOsc); for (let i = 0; i < 4; i++) m.cyl(0.03, 0.03, 0.2, [-4.85, 1.45, 0.1 + i * 0.25], "#E3B766", 5, [0, 0, Math.PI / 2]);
      // maceta grande y farol
      m.cyl(0.38, 0.28, 0.6, [3.8, 0, 1.2], COL.terra, 9); m.sph(0.7, [3.8, 1.3, 1.2], COL.verde, 6); m.sph(0.45, [4.1, 1.8, 1.1], COL.verde3, 6);
      m.cyl(0.012, 0.012, 1.0, [-1.0, 2.9, 0.6], COL.tinta, 4); m.box([0.26, 0.36, 0.26], [-1.0, 2.2, 0.6], "#F6D365");
      room.mm = m;
      brillo(room, -1.0, 2.4, 0.6, 1.5);
      habitante(room, 5, xt + 1.6, alt, -1.5, { tam: 1.9, anim: anims.paseo(0.5, 10, 0) });
      habitante(room, 3, -2.1, rise * 3, -2.0, { tam: 1.8, dormida: true, saluda: false, anim: anims.duerme(5), brazos: () => [0, 0] });   // duerme en la escalera
    }
    if (id === "puerta") {
      m.box([2.8, 0.1, 0.55], [-3.7, 0.45, -2.5], COL.maderaCl); m.box([0.1, 0.45, 0.45], [-4.9, 0, -2.5], COL.maderaOsc); m.box([0.1, 0.45, 0.45], [-2.5, 0, -2.5], COL.maderaOsc);
      m.box([1.8, 0.9, 0.5], [3.6, 0, -2.6], COL.maderaOsc); m.box([1.9, 0.07, 0.56], [3.6, 0.9, -2.6], COL.maderaCl);
      for (let i = 0; i < 4; i++) { m.cyl(0.03, 0.03, 0.18, [3.0 + i * 0.4, 1.7, -2.88], "#E3B766", 5); m.box([0.05, 0.14, 0.02], [3.0 + i * 0.4, 1.46, -2.86], "#E3B766"); }
      m.cyl(0.4, 0.3, 0.8, [-4.4, 0, 0.8], COL.terra, 9); m.sph(0.8, [-4.4, 1.5, 0.8], COL.verde, 6); m.sph(0.45, [-4.0, 2.0, 0.9], COL.verde3, 6);
      m.cyl(0.4, 0.3, 0.8, [4.4, 0, 0.8], "#3E86B5", 9); m.sph(0.8, [4.4, 1.5, 0.8], COL.verde3, 6); for (let i = 0; i < 7; i++) m.sph(0.1, [4.4 + (rand() - 0.5) * 1.0, 1.7 + rand() * 0.6, 0.8 + (rand() - 0.5) * 0.8], FLORES[i % FLORES.length], 4);
      m.cyl(0.012, 0.012, 1.2, [0, 2.9, -0.3], COL.tinta, 4); m.box([0.34, 0.5, 0.34], [0, 2.2, -0.3], "#F6D365"); m.cyl(0.26, 0, 0.2, [0, 2.7, -0.3], COL.hierro, 4);
      // mecedora
      m.box([0.7, 0.06, 0.65], [-1.9, 0.45, -1.2], "#EE9AA6"); m.box([0.7, 0.8, 0.06], [-1.9, 0.5, -1.5], "#EE9AA6"); m.box([0.06, 0.06, 0.9], [-2.2, 0.0, -1.2], COL.maderaOsc); m.box([0.06, 0.06, 0.9], [-1.6, 0.0, -1.2], COL.maderaOsc);
      room.mm = m;
      brillo(room, 0, 2.4, -0.3, 1.8);
      habitante(room, 2, 1.8, 0, -1.2, { tam: 2.0, anim: anims.paseoZ(0.4, 9, 0) });
    }
    if (id === "ventana") {
      const P = PAL.ventana;
      for (const x of [-5, 0, 5]) { m.box([2.8, 0.45, 0.65], [x, 0, 2.55], COL.maderaOsc); m.box([2.7, 0.14, 0.6], [x, 0.45, 2.55], VIVOS[((x + 5) / 5 | 0) % VIVOS.length]); }
      // telescopio sobre tripode
      m.cyl(0.03, 0.03, 1.5, [2.8, 0, 0.2], "#E3B766", 5, [0.4, 0, 0.0]); m.cyl(0.03, 0.03, 1.5, [2.8, 0, 0.2], "#E3B766", 5, [-0.3, 0, 0.35]); m.cyl(0.03, 0.03, 1.5, [2.8, 0, 0.2], "#E3B766", 5, [-0.2, 0, -0.4]);
      m.cyl(0.11, 0.09, 1.5, [2.8, 1.35, 0.1], "#F4F6F8", 10, [-0.9, 0, 0]); m.cyl(0.14, 0.14, 0.12, [2.8, 2.1, -0.4], "#E3B766", 10, [-0.9, 0, 0]);
      // taburete y farol con luz
      m.cyl(0.3, 0.3, 0.5, [-2.5, 0, 0.6], "#E9876A", 9); m.cyl(0.14, 0.14, 0.34, [-2.5, 0.5, 0.6], "#F6D365", 8);
      // mapa del cielo: circulo en la pared
      m.cyl(0.9, 0.9, 0.04, [-2, 2.0, -2.86], "#0B0F2E", 20, [Math.PI / 2, 0, 0]); m.cyl(0.95, 0.95, 0.03, [-2, 2.0, -2.88], "#E3B766", 20, [Math.PI / 2, 0, 0]);
      m.box([3.4, 0.03, 1.8], [-1.0, 0.0, 0.3], "#2B2F66");
      room.mm = m;
      habitante(room, 1, 2.2, 0, 1.0, { tam: 2.2, anim: anims.mece(0.07, 6), saluda: false });   // mira por el telescopio
      habitante(room, 7, -4.5, 0, 0.6, { tam: 1.8, anim: anims.salto(0.3, 7, 0.5) });
      brillo(room, -2.5, 0.85, 0.6, 1.5);
      // estrellas
      const pts = [];
      const r2 = rng(99);
      for (let i = 0; i < 90; i++) pts.push(room.loc(-8.5 + r2() * 17, 1.0 + r2() * 3.3, -2.9));
      const ge = new THREE.BufferGeometry().setFromPoints(pts);
      const est = new THREE.Points(ge, new THREE.PointsMaterial({ color: 0xf4f6f8, size: 0.09, sizeAttenuation: true, fog: false }));
      M.add(est); mundo.estrellas = est;
    }
    if (id === "sala" || id === "taller") {
      const c = room.acento;
      m.cyl(1.4, 1.4, 0.02, [0, 0, 0.2], c, 20);
      m.box([0.7, 0.06, 0.65], [-2, 0.45, -1.0], c); m.box([0.7, 0.8, 0.06], [-2, 0.5, -1.3], c);
      m.box([0.7, 0.06, 0.65], [2, 0.45, -1.0], VIVOS[2]); m.box([0.7, 0.8, 0.06], [2, 0.5, -1.3], VIVOS[2]);
      m.cyl(0.35, 0.25, 0.65, [3.9, 0, 1.0], COL.terra, 8); m.sph(0.7, [3.9, 1.4, 1.0], COL.verde, 6);
      m.box([1.4, 0.4, 0.9], [0, 0, 0.2], COL.maderaOsc);
      room.mm = m;
    }
    // la malla estatica del cuarto
    if (room.mm) { const mesh = room.mm.build(matVert, true); M.add(mesh); }
    // pared de color del cuarto (panel interior de la pared exterior), una por cuarto
    const pal = room.pal ? PAL[room.pal] : { campo: "#E6DDC8" };
    const Wd = Math.min(W, 30);
    const g = new THREE.Group(); g.matrixAutoUpdate = false; g.matrix.copy(room.F);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(Wd - 0.3, 4.1), new THREE.MeshToonMaterial({ color: pal.campo, gradientMap: toon, emissive: pal.campo, emissiveIntensity: 0.28 }));
    wall.position.set(0, 2.05, -2.98); wall.receiveShadow = true; g.add(wall);
    const tz = texZocalo(); tz.repeat.set((Wd - 0.3) / 3.4, 1);
    const zo = new THREE.Mesh(new THREE.PlaneGeometry(Wd - 0.3, 0.9), new THREE.MeshToonMaterial({ map: tz, gradientMap: toon }));
    zo.position.set(0, 0.45, -2.97); g.add(zo);
    const fil = new THREE.Mesh(new THREE.PlaneGeometry(Wd - 0.3, 0.07), new THREE.MeshToonMaterial({ color: 0xF8F1E6, gradientMap: toon })); fil.position.set(0, 0.93, -2.965); g.add(fil);
    const viga = new THREE.Mesh(new THREE.PlaneGeometry(Wd - 0.3, 0.22), new THREE.MeshToonMaterial({ color: new THREE.Color(pal.campo).multiplyScalar(0.8), gradientMap: toon })); viga.position.set(0, 4.0, -2.97); g.add(viga);
    M.add(g);
    room.paredColor = wall;
  }

  /* ===================== Cella y la gente en el patio ===================== */
  {
    const room = { id: "patio", F: new THREE.Matrix4(), billboards: [], loc: (x, y, z) => Vm(x, y, z) };
    mundo.cuartos.patio = { id: "patio", slug: "courtyard", pal: "patio", centro: Vm(0, 0, 0), billboards: room.billboards, patio: true };
    const gente = [
      [-1.6, 0.6, 0, {}], [-0.5, 1.8, 1, { saluda: false }], [1.2, 1.1, 2, {}], [2.0, -0.3, 3, {}], [-2.1, -0.8, 4, { saluda: false }],
      [0.0, -1.5, 5, {}], [1.5, -1.8, 6, { saluda: false }], [-0.9, -0.2, 7, {}]
    ];
    gente.forEach(([x, z, i, ex]) => habitante(room, i, x, 0.11, z, { tam: 1.7 + (i % 4) * 0.25, ...ex, anim: [anims.paseo(0.5, 8 + i, i), anims.salto(0.35, 6 + i * 0.7, i * 0.2), anims.paseoZ(0.6, 9 + i, i), anims.mece(0.1, 4 + i * 0.3)][i % 4] }));
    const ce = crearCella(PAL.patio, { saludoEn: 5, fase: 1.7, px: movil ? 192 : 256 });
    colocarBill(ce, Vm(0.55, 0.11, 0.35), 3.0, 3.0, 3.0 * 0.3833, room, true);
    mundo.cuartos.patio.cella = ce;
    mundo.billboards.forEach((b) => { if (b.sala === "patio") b.m.userData.sala = "patio"; });
  }
  // fix de la sala de los billboards del patio (colocarBill uso room.id = "patio")

  {
    const room = { id: "mesa", billboards: [], loc: (x, y, z) => new THREE.Vector3(x, y, z) };
    habitante(room, 4, -8, 1.1, 16.0, { tam: 2.0, anim: anims.mece(0.16, 3.4), saluda: false });   // se mece en el balcon
    habitante(room, 6, 8, 1.1, 16.0, { tam: 1.7, anim: anims.salto(0.25, 8, 0.4) });
  }

  /* ===================== casas vecinas (contexto de calle: colores de Cartagena y Guatape) ===================== */
  function vecina(x, ancho, c1, c2, c3, alto = 4.4) {
    const prof = 12;
    sm.frame(x, 0, 15.45 - prof / 2, 0);
    sm.box([ancho, alto, prof], [0, 0, 0], c1);
    sm.box([ancho + 0.2, 0.18, prof + 0.2], [0, alto - 0.05, 0], "#F7F0E0");
    sm.box([ancho, 0.9, 0.12], [0, 0, prof / 2], c2);
    // techo a dos aguas
    const g = new THREE.BufferGeometry();
    const hw = ancho / 2 + 0.5, hl = prof / 2 + 0.5, yb = alto, yr = alto + 1.7;
    const v = [-hw, yb, -hl, hw, yb, -hl, hw, yb, hl, -hw, yb, hl, 0, yr, -hl, 0, yr, hl];
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.setIndex([0, 4, 5, 0, 5, 3, 1, 2, 5, 1, 5, 4, 0, 1, 4, 3, 5, 2]);
    g.computeVertexNormals();
    sm.geo(g, COL.teja, [0, 0, 0]);
    // ventanas y puerta por el frente (z+)
    for (let i = -1; i <= 1; i += 2) {
      sm.box([1.3, 2.0, 0.1], [i * ancho * 0.26, 1.1, prof / 2 + 0.03], c3);
      sm.box([1.0, 1.7, 0.12], [i * ancho * 0.26, 1.2, prof / 2 + 0.05], "#2B3A55");
      sm.box([1.9, 0.1, 0.8], [i * ancho * 0.26, 0.95, prof / 2 + 0.4], c3);
      for (let k = 0; k < 6; k++) sm.bal(0.8, [i * ancho * 0.26 - 0.8 + k * 0.32, 1.05, prof / 2 + 0.75], c2);
      sm.box([1.9, 0.07, 0.07], [i * ancho * 0.26, 1.85, prof / 2 + 0.75], c3);
      for (let k = 0; k < 5; k++) sm.sph(0.1, [i * ancho * 0.26 - 0.7 + k * 0.35, 2.02, prof / 2 + 0.75], FLORES[(k + (x | 0)) % FLORES.length], 4);
    }
    sm.box([1.5, 2.6, 0.1], [0, 0, prof / 2 + 0.03], c3);
  }
  vecina(-23.5, 14, "#F6DDB2", "#8FB6CF", "#EFB9C0"); vecina(23.5, 14, "#BFDCE8", "#EFB9C0", "#F4D49A", 4.8);
  vecina(-38, 14, "#F2C9CF", "#F4D49A", "#A9C8AE", 4.2); vecina(38, 14, "#C5D9C2", "#EDA793", "#F4F6F8", 4.6);

  /* cuarto que corresponde a un punto del suelo (x, z): el toque en el telefono cae aqui, sin depender de cajas ni de etiquetas.
   * sala y taller no tienen pagina: se reparten al cuarto vecino. */
  mundo.salaEn = (x, z) => {
    if (Math.abs(x) > 16.5 || Math.abs(z) > 16.5) return null;
    if (z > 9) return x < -5 ? "mesa" : "puerta";
    if (z < -9) return x < -5 ? "escaleras" : "cocina";
    if (x > 9) return "ventana";
    if (x < -9) return "alcoba";
    return "patio";
  };
  // al arrancar el techo esta quitado (se ve la casa por dentro, como la 2D vista desde arriba); el boton lo pone
  mundo.lista.forEach((r) => { r.techo.objetivo = 0; r.techo.op = 0; r.techo.grp.visible = false; });

  /* ===================== monta la malla estatica ===================== */
  const estatico = sm.build(matVert, true);
  M.add(estatico);

  /* ===================== frame a frame ===================== */
  const tmpV = new THREE.Vector3();
  mundo.hover = null;
  mundo.setHover = (id) => { mundo.hover = id; };
  mundo.focoActual = null;
  mundo.setFoco = (id) => {
    mundo.focoActual = id;
    mundo.billboards.forEach((b) => { b.fo = id && b.esCella && b.sala === id ? (id === "patio" ? 1.25 : 1.4) : 1; });
    mundo.tabs.forEach((t) => { t.obj = id && t.clave === id ? 0.1 : 1; });
    mundo.lista.forEach((r) => {
      r.muro.obj = id && r.id === id ? 0.16 : 1;
      const vecino = ((id === "mesa" || id === "escaleras") && r.id === "alcoba") || (id === "patio" && r.lado === "S");
      r.techo.objetivo = (mundo.techosOn && !(id && r.id === id) && !vecino) ? 1 : 0;
    });
  };
  mundo.setTechos = (on) => {
    mundo.techosOn = on;
    mundo.lista.forEach((r) => { r.techo.objetivo = (on && !(mundo.focoActual && r.id === mundo.focoActual)) ? 1 : 0; });
  };
  mundo.actualiza = (t, dt, cam, instantaneo) => {
    const k = instantaneo ? 1 : 1 - Math.exp(-dt * 6);
    mundo.lista.forEach((r) => {
      const T = r.techo;
      T.op += (T.objetivo - T.op) * k;
      if (Math.abs(T.op - T.objetivo) < 0.01) T.op = T.objetivo;
      T.grp.visible = T.op > 0.02;
      T.mats.forEach((mt) => { mt.opacity = T.op; mt.depthWrite = T.op > 0.98; });
      const mw = r.muro;
      mw.esc += (mw.obj - mw.esc) * k;
      mw.g.scale.y = Math.max(0.01, mw.esc);
      // resalte al pasar el puntero
      const h = mundo.hover === r.id ? 0.22 : 0;
      T.mats[0].emissive.setRGB(h * 1.0, h * 0.7, h * 0.35);
    });
    mundo.tabs.forEach((t) => { t.esc += (t.obj - t.esc) * k; t.g.scale.y = Math.max(0.01, t.esc); });
    // billboards: giran solo en Y (derechos, como en la 2D) con una inclinacion minima hacia la camara; si la camara mira muy de arriba
    // se estiran un poco en vertical para compensar el escorzo y no quedar como laminas acostadas. Crecen al entrar a su cuarto.
    mundo.billboards.forEach((b) => {
      b.f += (b.fo - b.f) * k;
      if (Math.abs(b.f - b.fo) < 0.003) b.f = b.fo;
      const dx = cam.position.x - b.g.position.x, dz = cam.position.z - b.g.position.z;
      const hd = Math.hypot(dx, dz), el = Math.atan2(cam.position.y - b.g.position.y, hd);
      b.g.rotation.y = Math.atan2(dx, dz);
      b.g.rotation.x = Math.min(0.2, el * 0.18);
      b.g.scale.set(b.f, b.f * (1 + Math.max(0, Math.min(0.55, el - 0.55)) * 0.4), b.f);
      b.obj.dibuja(t);
      const a = b.anim && !reducido() ? b.anim(t, b) : {};
      b.g.position.set(b.base.x + (a.dx || 0), b.base.y + (a.dy || 0), b.base.z + (a.dz || 0));
      b.m.rotation.z = (a.rz || 0) + (b.rz0 || 0); b.m.scale.set(a.sx || 1, a.sy || 1, 1);
      b.m.position.y = b.yc !== undefined ? b.yc + (a.rz && Math.abs(a.rz) > 1 ? 0.2 : 0) : b.m.position.y;
      // la sombra sigue a la Cella: en el piso (o en lo que la sostiene), mas chica y mas clara cuando sube
      const aire = Math.max(0, (a.dy || 0) - (a.sop || 0)), esc = Math.max(0.55, 1 - aire * 0.4) * b.f;
      b.sh.position.set(b.base.x + (a.dx || 0) + SOMBRA_DIR[0] * b.w * 0.07 * b.f, b.base.y + 0.02 + (a.sop || 0), b.base.z + (a.dz || 0) + SOMBRA_DIR[1] * b.w * 0.07 * b.f);
      b.sh.scale.set(esc * (a.sx || 1), esc, 1); b.sh.material.opacity = Math.max(0.4, 0.95 - aire * 0.5);
    });
    mundo.vapor.forEach((v) => {
      const u = ((t * 0.38 * v.vel + v.t0) % 1);
      v.s.position.set(v.p.x + v.dx * u + Math.sin(t * 2 + v.t0 * 9) * 0.05 * (v.esc || 1), v.p.y + u * 1.5 * (v.esc || 1), v.p.z);
      const s = (0.3 + u * 0.9) * (v.esc || 1); v.s.scale.set(s, s, 1);
      v.s.material.opacity = reducido() ? 0.3 : Math.sin(u * Math.PI) * 0.7;
    });
    mundo.espuma.forEach((e) => {
      // u: 0 = burbuja en el borde (la mas grande), 1 = ya bajo por la pared y chica; ciclo continuo
      const u = reducido() ? 0.35 + (e.f % 0.5) : (t * e.v + e.f) % 1;
      const r = e.R + 0.02 + u * 0.03, y = e.p.y + 0.1 - u * 0.62;
      e.m.position.set(e.p.x + Math.cos(e.a) * r, y, e.p.z + Math.sin(e.a) * r);
      e.m.scale.setScalar((0.15 + 0.07 * Math.sin(Math.min(1, u * 1.6) * Math.PI)) * (1 - u * 0.35));
      e.m.visible = u < 0.97;
    });
    mundo.brillos.forEach((b) => { const s = b.base * (1 + Math.sin(t * 2.2 + b.f) * 0.05); b.s.scale.set(s, s, 1); });
    mundo.ondas.forEach((w) => {
      const u = reducido() ? 0.5 : (t * 0.12 + w.f) % 1;
      w.o.scale.setScalar(0.4 + u * 2.7); w.o.material.opacity = Math.sin(u * Math.PI) * 0.35;
    });
    mundo.nubes.forEach((n) => { if (!reducido()) { n.s.position.x += n.v * dt; if (n.s.position.x > 180) n.s.position.x = -180; } });
  };
  function reducido() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }

  return mundo;
}
