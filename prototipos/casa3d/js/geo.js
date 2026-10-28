/* geo.js · utilidades de geometria: un Merger que junta cajas, cilindros y esferas en UNA malla con colores por vertice
 * (una sola llamada de dibujo para casi toda la casa), muros con huecos (ExtrudeGeometry) y texturas procedurales. */
import * as THREE from "three";

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const _col = new Map();
export function col(hex) {
  let c = _col.get(hex);
  if (!c) { c = new THREE.Color(hex); _col.set(hex, c); }
  return c;
}

const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3(), _m = new THREE.Matrix4();
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _Y = new THREE.Vector3(0, 1, 0);
const _ni = new Map();
function noIdx(g) {
  if (!g.index) return g;
  let r = _ni.get(g.uuid);
  if (!r) { r = g.toNonIndexed(); _ni.set(g.uuid, r); }
  return r;
}

const GC = {};   // cache de geometrias unitarias
const unitBox = () => GC.box || (GC.box = new THREE.BoxGeometry(1, 1, 1));
/* caja con esquinas redondeadas en unidades reales (tam w,h,d): 3 segmentos por eje con los vertices intermedios a un radio de la orilla,
 * y cada vertice se empuja a la esfera del radio. Se cachea por tamano. Las cajas muy delgadas quedan como cajas simples. */
const _rb = new THREE.Vector3(), _rc = new THREE.Vector3();
export const BISEL = { on: true, n: 0 };
function rBox(w, h, d) {
  const mn = Math.min(w, h, d);
  if (!BISEL.on || mn < 0.1) return null;
  const r = Math.min(0.07, 0.2 * mn);
  const k = "rb" + w.toFixed(2) + "_" + h.toFixed(2) + "_" + d.toFixed(2);
  if (GC[k]) return GC[k];
  const g = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3), pa = g.attributes.position, na = g.attributes.normal;
  const hx = w / 2, hy = h / 2, hz = d / 2;
  const mapa = (v, hh) => (Math.abs(v) < 0.4 ? Math.sign(v) * (hh - r) : Math.sign(v) * hh);   // 0.5 -> borde, 0.1667 -> a un radio del borde
  for (let i = 0; i < pa.count; i++) {
    const X = mapa(pa.getX(i), hx), Y = mapa(pa.getY(i), hy), Z = mapa(pa.getZ(i), hz);
    _rc.set(Math.max(-hx + r, Math.min(hx - r, X)), Math.max(-hy + r, Math.min(hy - r, Y)), Math.max(-hz + r, Math.min(hz - r, Z)));
    _rb.set(X, Y, Z).sub(_rc);
    if (_rb.lengthSq() > 1e-9) { _rb.normalize(); pa.setXYZ(i, _rc.x + _rb.x * r, _rc.y + _rb.y * r, _rc.z + _rb.z * r); na.setXYZ(i, _rb.x, _rb.y, _rb.z); }
    else pa.setXYZ(i, X, Y, Z);
  }
  BISEL.n++;
  return (GC[k] = g);
}
function unitCyl(ratio, seg) {
  if (seg < 8) seg = 8;
  const k = "c" + ratio.toFixed(3) + "_" + seg;
  return GC[k] || (GC[k] = new THREE.CylinderGeometry(ratio, 1, 1, seg, 1));
}
function unitSph(seg) {
  if (seg < 8) seg = 8;
  const k = "s" + seg;
  return GC[k] || (GC[k] = new THREE.SphereGeometry(1, seg, Math.max(3, Math.round(seg * 0.7))));
}
function unitLathe() {
  if (GC.lathe) return GC.lathe;
  // balaustre torneado: base, cuello, panza, anillo, copa
  const pts = [[0.05, 0], [0.065, 0.025], [0.04, 0.06], [0.04, 0.1], [0.07, 0.2], [0.075, 0.28], [0.045, 0.37], [0.035, 0.45], [0.05, 0.5], [0.05, 0.54],
    [0.035, 0.58], [0.03, 0.66], [0.06, 0.76], [0.065, 0.84], [0.04, 0.92], [0.05, 0.97], [0.03, 1]].map(([r, y]) => new THREE.Vector2(r * 2.2, y));
  return (GC.lathe = new THREE.LatheGeometry(pts, 8));
}

export class Merger {
  constructor() { this.P = []; this.N = []; this.C = []; this.F = new THREE.Matrix4(); this.grad = true; }
  frame(x = 0, y = 0, z = 0, ry = 0) {
    _q.setFromAxisAngle(_Y, ry);
    this.F.compose(_p.set(x, y, z), _q, _s.set(1, 1, 1));
    return this;
  }
  push(geo, local, color, grad = this.grad) {
    const g = noIdx(geo);
    _m.multiplyMatrices(this.F, local);
    _nm.getNormalMatrix(_m);
    const pa = g.attributes.position, na = g.attributes.normal, c = col(color);
    for (let i = 0; i < pa.count; i++) {
      _v.fromBufferAttribute(pa, i).applyMatrix4(_m);
      _n.fromBufferAttribute(na, i).applyMatrix3(_nm).normalize();
      this.P.push(_v.x, _v.y, _v.z); this.N.push(_n.x, _n.y, _n.z);
      let f = 1;
      if (grad) { const t = Math.max(0, Math.min(1, _v.y / 4.4)); f = 0.78 + 0.22 * t; }
      this.C.push(c.r * f, c.g * f, c.b * f);
    }
  }
  /* caja: tam [w,h,d], pos [x,y,z] = centro de la base */
  box(tam, pos, color, rot = null) {
    _e.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
    _q.setFromEuler(_e);
    const rg = rBox(tam[0], tam[1], tam[2]);
    _m.compose(_p.set(pos[0], pos[1] + tam[1] / 2, pos[2]), _q, rg ? _s.set(1, 1, 1) : _s.set(tam[0], tam[1], tam[2]));
    this.push(rg || unitBox(), _m.clone(), color);
  }
  /* cilindro o cono truncado: rBase, rTop, alto */
  cyl(rb, rt, h, pos, color, seg = 10, rot = null) {
    _e.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
    _q.setFromEuler(_e);
    _m.compose(_p.set(pos[0], pos[1] + h / 2, pos[2]), _q, _s.set(rb, h, rb));
    this.push(unitCyl(rb > 0 ? rt / rb : 0, seg), _m.clone(), color);
  }
  /* esfera (o elipsoide) con centro en pos */
  sph(r, pos, color, seg = 6, sy = 1, sx = 1, sz = 1) {
    _q.identity();
    _m.compose(_p.set(pos[0], pos[1], pos[2]), _q, _s.set(r * sx, r * sy, r * sz));
    this.push(unitSph(seg), _m.clone(), color);
  }
  /* balaustre torneado de alto h, base en pos */
  bal(h, pos, color, esc = 1) {
    _q.identity();
    _m.compose(_p.set(pos[0], pos[1], pos[2]), _q, _s.set(esc, h, esc));
    this.push(unitLathe(), _m.clone(), color);
  }
  /* geometria arbitraria ya posicionada en el marco local */
  geo(g, color, pos = [0, 0, 0], rot = null) {
    _e.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
    _q.setFromEuler(_e);
    _m.compose(_p.set(pos[0], pos[1], pos[2]), _q, _s.set(1, 1, 1));
    this.push(g, _m.clone(), color);
  }
  build(mat, sombra = true) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.C, 3));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = sombra; m.receiveShadow = sombra;
    return m;
  }
}

/* muro rectangular o poligonal con huecos. pts: [[x,y],...] en el plano del muro; huecos: {x,y,w,h,arco}. Grosor centrado en z=0. */
export function muroGeo(pts, huecos, grosor) {
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  (huecos || []).forEach((h) => {
    const p = new THREE.Path();
    const x0 = h.x - h.w / 2, x1 = h.x + h.w / 2;
    if (h.arco) {
      p.moveTo(x0, h.y); p.lineTo(x1, h.y); p.lineTo(x1, h.y + h.h - h.w / 2);
      p.absarc(h.x, h.y + h.h - h.w / 2, h.w / 2, 0, Math.PI, false); p.lineTo(x0, h.y);
    } else { p.moveTo(x0, h.y); p.lineTo(x1, h.y); p.lineTo(x1, h.y + h.h); p.lineTo(x0, h.y + h.h); p.lineTo(x0, h.y); }
    sh.holes.push(p);
  });
  const bv = Math.min(0.06, grosor * 0.25);
  const g = new THREE.ExtrudeGeometry(sh, { depth: grosor - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelOffset: -bv, bevelSegments: 2, curveSegments: 8 });
  g.translate(0, 0, -(grosor - 2 * bv) / 2);
  return g;
}
export function rectPts(len, h) { return [[-len / 2, 0], [len / 2, 0], [len / 2, h], [-len / 2, h]]; }

/* ---------------- texturas procedurales ---------------- */
function lienzo(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
function tex(c, rep = true, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export function texTeja() {
  const c = lienzo(256, 256), x = c.getContext("2d"), r = rng(7);
  x.fillStyle = "#BC6D52"; x.fillRect(0, 0, 256, 256);
  const filas = 8, h = 256 / filas, nw = 8, w = 256 / nw;
  for (let f = 0; f < filas; f++) {
    for (let k = -1; k <= nw; k++) {
      const off = (f % 2) * (w / 2), xx = k * w + off;
      const t = 0.9 + r() * 0.2;
      x.fillStyle = `rgb(${Math.min(255, 188 * t | 0)},${Math.min(255, 109 * t | 0)},${Math.min(255, 82 * t | 0)})`;
      x.beginPath(); x.roundRect(xx + 2, f * h + 1, w - 4, h + 6, [0, 0, w / 2, w / 2]); x.fill();
      x.strokeStyle = "rgba(120,50,36,.35)"; x.lineWidth = 3; x.beginPath(); x.moveTo(xx + w / 2, f * h + 4); x.lineTo(xx + w / 2, f * h + h); x.stroke();
    }
    x.fillStyle = "rgba(100,40,30,.25)"; x.fillRect(0, f * h + h - 4, 256, 4);
  }
  return tex(c);
}
export function texMadera() {
  const c = lienzo(256, 256), x = c.getContext("2d"), r = rng(11);
  x.fillStyle = "#E8C79B"; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) {
    const t = 0.9 + r() * 0.16;
    x.fillStyle = `rgb(${231 * t | 0},${199 * t | 0},${154 * t | 0})`; x.fillRect(0, i * 32, 256, 31);
    x.fillStyle = "rgba(110,70,30,.35)"; x.fillRect(0, i * 32 + 31, 256, 1.5);
    x.strokeStyle = "rgba(120,80,40,.18)"; x.lineWidth = 1;
    for (let k = 0; k < 3; k++) { x.beginPath(); const yy = i * 32 + 6 + r() * 20; x.moveTo(0, yy); x.bezierCurveTo(80, yy + 3, 160, yy - 3, 256, yy + 1); x.stroke(); }
    const j = r() * 200; x.fillStyle = "rgba(110,70,30,.4)"; x.fillRect(j, i * 32, 1.5, 31);
  }
  return tex(c);
}
export function texPiedraPatio() {
  const c = lienzo(256, 256), x = c.getContext("2d"), r = rng(5);
  x.fillStyle = "#E3D6C4"; x.fillRect(0, 0, 256, 256);
  const n = 4, s = 256 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const t = 0.985 + r() * 0.03;
    x.fillStyle = `rgb(${244 * t | 0},${233 * t | 0},${219 * t | 0})`; x.beginPath(); x.roundRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3, 5); x.fill();
  }
  return tex(c);
}
export function texAdoquin() {
  const c = lienzo(256, 256), x = c.getContext("2d"), r = rng(3);
  x.fillStyle = "#8E8472"; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
    const t = 0.8 + r() * 0.35, ox = (j % 2) * 8;
    x.fillStyle = `rgb(${176 * t | 0},${166 * t | 0},${148 * t | 0})`;
    x.beginPath(); x.roundRect(i * 16 + ox + 1.5, j * 16 + 1.5, 13, 13, 4); x.fill();
  }
  return tex(c);
}
export function texAzul() {
  const c = lienzo(512, 512), x = c.getContext("2d");
  x.translate(256, 256);
  // anillos concentricos como en la casa vista desde arriba: borde blanco, azul, celeste, hielo
  const rings = [["#F4F6F8", 256], ["#3E86B5", 236], ["#7FB7D6", 176], ["#3E86B5", 150], ["#B9DDEE", 100]];
  rings.forEach(([cc, r]) => { x.fillStyle = cc; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill(); });
  for (let i = 0; i < 8; i++) {
    x.save(); x.rotate(i * Math.PI / 4);
    x.fillStyle = i % 2 ? "#F4F6F8" : "#7FB7D6";
    x.beginPath(); x.ellipse(0, -52, 15, 38, 0, 0, Math.PI * 2); x.fill();
    x.restore();
  }
  x.fillStyle = "#3E86B5"; x.beginPath(); x.arc(0, 0, 20, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#F6D365"; x.save(); x.rotate(Math.PI / 4); x.fillRect(-9, -9, 18, 18); x.restore();
  x.fillStyle = "rgba(244,246,248,.85)";
  for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; x.beginPath(); x.arc(Math.cos(a) * 205, Math.sin(a) * 205, 7, 0, 7); x.fill(); }
  return tex(c, false);
}
export function texCielo() {
  const c = lienzo(4, 512), x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#9CC8E8"); g.addColorStop(0.55, "#CFE6F0"); g.addColorStop(1, "#F8EAD0");
  x.fillStyle = g; x.fillRect(0, 0, 4, 512);
  return tex(c, false);
}
export function texSuaveBlanco() {
  const c = lienzo(128, 128), x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(0.5, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return tex(c, false);
}
export function texBrillo(rgb = "255,214,120") {
  const c = lienzo(128, 128), x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, `rgba(${rgb},.9)`); g.addColorStop(0.35, `rgba(${rgb},.35)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return tex(c, false);
}
export function texNube() {
  const c = lienzo(256, 128), x = c.getContext("2d");
  x.fillStyle = "#fff";
  [[60, 80, 40], [100, 62, 48], [150, 70, 44], [190, 84, 34], [120, 90, 50]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); });
  return tex(c, false);
}
export function gradMap() {
  const d = new Uint8Array([188, 224, 244, 255]);
  const t = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}
