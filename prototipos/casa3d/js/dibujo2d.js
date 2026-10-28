/* dibujo2d.js · Cella (todos los habitantes son Cellas), dibujadas en un canvas 2D y usadas como textura (billboards en la escena 3D).
 * Cella sale del dibujo vigente: NAOS_FIGURA.cellaGeo() (cuerpo, ojos, respiracion) y NAOS_BRAZOS.brazo() (los dos brazos grandes),
 * sin editar ninguno de los dos (assets/js/figura.js, assets/js/cella-brazos.js). */
import * as THREE from "three";

const OJO = "#FFFFFF";          // los ojos de Cella son siempre blancos
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

  /* arma el brazo como { m:[x,y,grados], p:Path2D } o null; se dibuja en varias pasadas (canto, cuerpo) */
  function brazoInfo(lado, ang) {
    const sv = B.brazo(lado, ang, "#000");
    if (!sv) return null;
    const m = /translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)" d="([^"]+)"/.exec(sv);
    if (!m) return null;
    return { x: +m[1], y: +m[2], r: +m[3] * Math.PI / 180, p: new Path2D(m[4]) };
  }
  function pintaBrazo(b, color) {
    if (!b) return;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = color; ctx.fill(b.p); ctx.restore();
  }
  /* color del canto: el cuerpo oscurecido; si ya es casi negro, un gris azulado para que el grosor se lea */
  function cantoDe(hex) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, bb = n & 255;
    if (r + gg + bb < 150) return "#3A4150";
    const f = 0.62;
    return "rgb(" + (r * f | 0) + "," + (gg * f | 0) + "," + (bb * f | 0) + ")";
  }
  const CANTO = cantoDe(pal.cuerpo), OSCURO = (() => { const n = parseInt(pal.cuerpo.slice(1), 16); return ((n >> 16) + ((n >> 8) & 255) + (n & 255)) < 150; })();

  function dibuja(t, extra = {}) {
    // limita a ~24 fps: la textura no necesita mas
    const q = Math.floor(t * 24);
    if (q === ultimo && !extra.fuerza) return false;
    ultimo = q;
    const tt = t + fase;
    const quieto = reducido();
    // respiracion: el ciclo de 8 s de la figura (inhala 4, exhala 4)
    const b = quieto ? 0.3 : F.respira(tt, 8);
    const g = F.cellaGeo({ estado: "humanity", b, r: 0, k: 0, abiertos: true, p: { tx: pal.cuerpo, bg: OJO } });
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
    const bi = brazoInfo("izq", izq), bd = brazoInfo("der", der), cuerpo = new Path2D(g.cuerpo);
    // canto de recorte: el contorno desplazado abajo a la derecha, en tres pasos (2 a 3 px de grosor a la resolucion de la textura)
    const k = ESCALA_CAJA / px;
    for (let i = 3; i >= 1; i--) {
      ctx.save(); ctx.translate(i * 0.95 * k, i * 1.15 * k);
      pintaBrazo(bi, CANTO); pintaBrazo(bd, CANTO);
      ctx.fillStyle = CANTO; ctx.fill(cuerpo);
      ctx.restore();
    }
    pintaBrazo(bi, pal.cuerpo); pintaBrazo(bd, pal.cuerpo);
    ctx.fillStyle = pal.cuerpo;
    ctx.fill(cuerpo);
    // sombreado suave dentro del cuerpo: luz arriba a la izquierda, penumbra abajo a la derecha
    ctx.save();
    ctx.clip(cuerpo);
    const gr = ctx.createLinearGradient(30, 10, 200, 230);
    gr.addColorStop(0, OSCURO ? "rgba(255,255,255,.13)" : "rgba(255,255,255,.20)");
    gr.addColorStop(0.45, "rgba(255,255,255,0)");
    gr.addColorStop(1, "rgba(20,10,30,.20)");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, ESCALA_CAJA, ESCALA_CAJA);
    const br = ctx.createRadialGradient(80, 50, 2, 80, 50, 46);
    br.addColorStop(0, OSCURO ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.28)"); br.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = br; ctx.fillRect(0, 0, ESCALA_CAJA, ESCALA_CAJA);
    ctx.restore();
    // ojos siempre blancos
    g.ojos.forEach(([x, y]) => {
      if (pest) {
        ctx.beginPath();
        ctx.strokeStyle = OJO; ctx.lineWidth = g.rad * 0.9; ctx.lineCap = "round";
        ctx.moveTo(x - g.rad * 1.3, y - 1); ctx.quadraticCurveTo(x, y + g.rad * 1.2, x + g.rad * 1.3, y - 1);
        ctx.stroke();
      } else {
        ctx.beginPath(); ctx.fillStyle = OJO; ctx.arc(x, y, g.rad, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.restore();
    tex.needsUpdate = true;
    return true;
  }
  dibuja(0, { fuerza: true });
  return { canvas: c, tex, dibuja, ancho: ESCALA_CAJA };
}

/* sombra blanda bajo los pies: elipse calida con nucleo un poco mas firme y borde difuso (se mueve y escala con la Cella) */
let _sombra;
export function texSombra() {
  if (_sombra) return _sombra;
  const c = lienzo(128, 128), x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, "rgba(40,22,30,.62)"); g.addColorStop(0.5, "rgba(40,22,30,.34)"); g.addColorStop(1, "rgba(40,22,30,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  _sombra = textura(c);
  return _sombra;
}
