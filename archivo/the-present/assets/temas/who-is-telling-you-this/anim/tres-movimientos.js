// tres-movimientos.js · "Los tres movimientos" (who-is-telling-you-this). Vanilla JS sobre el SVG que ya trae la página.
// Contrato: export function montar(el, {quieto}). Sin GSAP, sin librerías. Sin JS o con quieto:true se ve el estado final
// (los tres pasos completos, con la misma información). Nada arranca solo: solo tras pulsar Reproducir. Una pasada de 17,5 s,
// nunca en bucle, con Pausa. prefers-reduced-motion: no hay Reproducir ni movimiento; los botones de paso muestran cada estado de golpe.
// Bajo 1000 px los dibujos están plegados (CSS): Reproducir o un botón de paso ponen .is-visto en la figura y los abren (cierre 16-oct, P1).
// El tiempo de cada elemento vive en el marcado: data-a="tipo inicio duración [mínimo]" (segundos).
//   op   = opacidad de `mínimo` a 1 con la curva de la casa cubic-bezier(.2,0,0,1)
//   draw = una línea se dibuja a velocidad constante (stroke-dashoffset)
//   clip = un recorte crece a velocidad constante hasta data-w
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
// --ease-enter de tokens.css: cubic-bezier(.2, 0, 0, 1), resuelta por Newton con bisección de respaldo
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s, dX = s => (3 * ax * s + 2 * bx) * s + cx;
  return x => {
    if (x <= 0 || x >= 1) return clamp(x);
    let s = x;
    for (let i = 0; i < 6; i++) { const e = X(s) - x; if (Math.abs(e) < 1e-5) return Y(s); const d = dX(s); if (Math.abs(d) < 1e-6) break; s -= e / d; }
    let lo = 0, hi = 1; s = x;
    for (let i = 0; i < 20; i++) { const e = X(s) - x; if (Math.abs(e) < 1e-5) break; if (e > 0) hi = s; else lo = s; s = (lo + hi) / 2; }
    return Y(s);
  };
}
const ease = bezier(.2, 0, 0, 1);

export function montar(el, { quieto = false } = {}) {
  if (quieto || !el) return { destruir() {} };
  const D = el.dataset, TOTAL = +D.total || 17.5, SEG = [0, 4.5, 11.5, TOTAL];
  const items = [...el.querySelectorAll('[data-a]')].map(n => {
    const [k, s, d, m] = n.dataset.a.split(' ');
    const it = { n, k, s: +s, d: +d, m: m === undefined ? 0 : +m, w: +(n.dataset.w || 0), len: 0 };
    if (k === 'draw') { it.len = n.getTotalLength(); n.style.strokeDasharray = it.len; }
    return it;
  });
  const pasos = [...el.querySelectorAll('.tm-paso')];
  const ctl = el.querySelector('.tm-ctl'), estado = el.querySelector('.tm-sr');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = TOTAL, jugando = false, raf = 0, ultimo = 0, previo = 0;

  function render() {
    for (const it of items) {
      const u = clamp((t - it.s) / it.d);
      if (it.k === 'op') it.n.style.opacity = (it.m + (1 - it.m) * ease(u)).toFixed(3);
      else if (it.k === 'draw') it.n.style.strokeDashoffset = (it.len * (1 - u)).toFixed(2);
      else if (it.k === 'clip') it.n.setAttribute('width', (it.w * u).toFixed(1));
    }
    const p = jugando ? (t < SEG[1] ? 1 : t < SEG[2] ? 2 : 3) : 0;
    pasos.forEach((x, i) => x.classList.toggle('is-act', p === i + 1));
    if (p !== previo) { previo = p; estado.textContent = p ? D.ahora.replace('{n}', p) : ''; }
  }
  function bucle(ahora) {
    const dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    t = Math.min(TOTAL, t + dt);
    if (t >= TOTAL) { parar(true); return; }
    render(); raf = requestAnimationFrame(bucle);
  }
  function parar(fin) {
    jugando = false; cancelAnimationFrame(raf); raf = 0;
    if (fin) t = TOTAL;
    boton.textContent = fin ? D.again : D.play;
    render();
  }
  function reproducir() {
    if (jugando) return parar(false);
    if (t >= TOTAL) t = 0;
    jugando = true; ultimo = performance.now(); el.classList.add('is-visto');
    boton.textContent = D.pause;
    render(); raf = requestAnimationFrame(bucle);
  }
  function irAlPaso(n) { if (jugando) parar(false); el.classList.add('is-visto'); t = SEG[n]; render(); estado.textContent = D.ahora.replace('{n}', n); }

  // controles: se crean aquí, porque sin JS no hacen falta
  const boton = document.createElement('button'); boton.type = 'button'; boton.className = 'tm-btn'; boton.textContent = D.play;
  if (!reducido) { boton.addEventListener('click', reproducir); ctl.appendChild(boton); }
  for (let n = 1; n <= 3; n++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tm-btn tm-btn-n'; b.textContent = String(n); b.setAttribute('aria-label', `${D.step} ${n}`); // vuelta 2: solo el número a la vista; el nombre accesible contiene la etiqueta visible (WCAG 2.5.3)
    b.addEventListener('click', () => irAlPaso(n)); ctl.appendChild(b);
  }
  ctl.hidden = false;
  render();                                   // arranca en el estado final: igual que el quieto
  return { destruir() { cancelAnimationFrame(raf); ctl.textContent = ''; ctl.hidden = true; items.forEach(i => { i.n.removeAttribute('style'); }); } };
}
