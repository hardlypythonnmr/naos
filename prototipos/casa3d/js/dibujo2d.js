/* dibujo2d.js · Cella (todos los habitantes son Cellas), dibujadas en un canvas 2D y usadas como textura (billboards en la escena 3D).
 * Cella sale del dibujo vigente: NAOS_FIGURA.cellaGeo() (cuerpo, ojos, respiracion) y NAOS_BRAZOS.brazo() (los dos brazos grandes),
 * sin editar ninguno de los dos (assets/js/figura.js, assets/js/cella-brazos.js). */
import * as THREE from "three";

const ESCALA_CAJA = 240;          // la caja de Cella es de 240 x 240
const reducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function cl(x) { return Math.max(0, Math.min(1, x)); }
function sn(x) { x = cl(x); return 0.5 - 0.5 * Math.cos(Math.PI * x); }

function lienzo(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}
function textura(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

/* ---------------- Cella ---------------- */
/* Un objeto por Cella: { canvas, tex, dibuja(t) }. pal = { cuerpo, ojos } de paletas.json (cuerpo = tinta o ambar; ojos = campo del cuarto). */
export function crearCella(pal, opts = {}) {
  const px = opts.px || 256;
  const c = lienzo(px, px), ctx = c.getContext("2d");
  const tex = textura(c);
  const F = window.NAOS_FIGURA, B = window.NAOS_BRAZOS;
  const fase = opts.fase || 0;
  let ultimo = -1;

  function brazoCanvas(lado, ang, color) {
    const s = B.brazo(lado, ang, color);
    if (!s) return;
    const m = /translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)" d="([^"]+)"/.exec(s);
    if (!m) return;
    ctx.save();
    ctx.translate(+m[1], +m[2]);
    ctx.rotate(+m[3] * Math.PI / 180);
    ctx.fillStyle = color;
    ctx.fill(new Path2D(m[4]));
    ctx.restore();
  }

  function dibuja(t, extra = {}) {
    // limita a ~24 fps: la textura no necesita mas
    const q = Math.floor(t * 24);
    if (q === ultimo && !extra.fuerza) return false;
    ultimo = q;
    const tt = t + fase;
    const quieto = reducido();
    // respiracion: el ciclo de 8 s de la figura (inhala 4, exhala 4)
    const b = quieto ? 0.3 : F.respira(tt, 8);
    const g = F.cellaGeo({ estado: "humanity", b, r: 0, k: 0, abiertos: true, p: { tx: pal.cuerpo, bg: pal.ojos } });
    // saludo: cada ~11 s abre un brazo (tope 66 grados) y lo mueve despacio; nunca los dos arriba; no en bucle continuo
    const ciclo = 11, u = ((tt + (opts.saludoEn || 3)) % ciclo);
    let der = 0, izq = 0;
    if (!quieto && opts.saluda !== false && !opts.brazos) {
      const g0 = { t0: 0, t1: 2.6, a: 52 };
      const v = B.gesto(u, g0);
      const ola = v > 40 ? 7 * Math.sin((u - 0.35) * 7.5) * sn((u - 0.35) / 0.4) * (1 - sn((u - 2.2) / 0.4)) : 0;
      der = Math.min(B.LIM.max, v + ola);
    }
    if (opts.brazos && !quieto) { const a2 = opts.brazos(tt); izq = Math.min(B.LIM.max, a2[0] || 0); der = Math.min(B.LIM.max, a2[1] || 0); if (izq > B.LIM.dosArriba && der > B.LIM.dosArriba) der = B.LIM.dosArriba; }
    // parpadeo: dos veces por ciclo, 120 ms
    const pest = opts.dormida || ((tt % 5.3) > 5.18 && !quieto);
    ctx.clearRect(0, 0, px, px);
    ctx.save();
    ctx.scale(px / ESCALA_CAJA, px / ESCALA_CAJA);
    brazoCanvas("izq", izq, pal.cuerpo);
    brazoCanvas("der", der, pal.cuerpo);
    ctx.fillStyle = pal.cuerpo;
    ctx.fill(new Path2D(g.cuerpo));
    g.ojos.forEach(([x, y]) => {
      if (pest) {
        ctx.beginPath();
        ctx.strokeStyle = pal.ojos; ctx.lineWidth = g.rad * 0.9; ctx.lineCap = "round";
        ctx.moveTo(x - g.rad * 1.3, y - 1); ctx.quadraticCurveTo(x, y + g.rad * 1.2, x + g.rad * 1.3, y - 1);
        ctx.stroke();
      } else {
        ctx.beginPath(); ctx.fillStyle = pal.ojos; ctx.arc(x, y, g.rad, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.restore();
    tex.needsUpdate = true;
    return true;
  }
  dibuja(0, { fuerza: true });
  return { canvas: c, tex, dibuja, ancho: ESCALA_CAJA };
}

/* sombra blanda bajo los pies (textura de una sola vez) */
let _sombra;
export function texSombra() {
  if (_sombra) return _sombra;
  const c = lienzo(128, 128), x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(20,14,10,.55)"); g.addColorStop(1, "rgba(20,14,10,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  _sombra = textura(c);
  return _sombra;
}
