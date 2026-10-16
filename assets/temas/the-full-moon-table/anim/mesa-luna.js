// mesa-luna.js · "La noche en tres pasos" (the-full-moon-table). Vanilla JS sobre el SVG que ya trae la página.
// Contrato: export function montar(el, {quieto}). Sin GSAP, sin librerías. Sin JS o con quieto:true se ve el estado final
// (los tres pasos completos). Nada arranca solo: solo tras pulsar Reproducir. Una pasada de unos 18 s, nunca en bucle, con Pausa.
// prefers-reduced-motion: no hay animación; los botones de paso muestran cada estado de golpe.
const SEG = [0, 4.5, 11.5, 18.5];            // inicio de cada paso y final (s)
const TOTAL = SEG[3];
const GROUND = 138, R = 15, SOL_X = 70, LUNA_X = 215;
const T0 = 17 * 60, T1 = 18 * 60 + 10, PX0 = 24, PX1 = 276, SOL_Y0 = 60, LUNA_PX_MIN = 1;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const fuera = u => 1 - Math.pow(1 - clamp(u), 3);                 // entrada por opacidad, sin rebote
const hhmm = m => { m = Math.round(m); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

export function montar(el, { quieto = false } = {}) {
  if (quieto || !el) return { destruir() {} };
  const $ = (s, r = el) => r.querySelector(s);
  const escenas = [...el.querySelectorAll('.ml-escena')];
  const pasos = [...el.querySelectorAll('.ml-paso')];
  const platoB = $('.ml-b'), sol = $('.ml-sol'), luna2 = $('.ml-paso[data-paso="2"] .ml-luna'), reloj = $('.ml-reloj'), cursor = $('.ml-cursor');
  const luna3 = $('.ml-paso[data-paso="3"] .ml-luna'), resp = $('.ml-resp'), texto3 = $('.ml-paso[data-paso="3"] text');
  const ticks = [...el.querySelectorAll('.ml-tickc')];
  const radios = [...el.querySelectorAll('input[type=radio]')];
  const ctl = $('.ml-ctl'), estado = $('.ml-estado');
  const D = el.dataset;
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = TOTAL, jugando = false, raf = 0, ultimo = 0, pasoPrevio = 0, ver = 1;   // ver: el paso cuyo dibujo se ve en una columna

  const ciudad = () => { const r = radios.find(x => x.checked); const g = ticks.find(k => r && k.dataset.ciudad === r.value) || ticks[0]; return { luna: +g.dataset.luna, sol: +g.dataset.sol, g }; };

  function render() {
    const c = ciudad();
    // paso 1: el segundo plato entra por opacidad y sube 24 unidades a su lugar
    const e1 = t >= TOTAL ? 1 : fuera((t - 0.8) / 0.6);
    platoB.style.opacity = e1; platoB.setAttribute('transform', `translate(0 ${((1 - e1) * 24).toFixed(2)})`);
    // paso 2: reloj de 17:00 a 18:10 repartido en 6 s, a velocidad constante
    const u = t >= TOTAL ? 1 : clamp((t - 5) / 6), m = T0 + u * (T1 - T0);
    escenas[1].style.opacity = t >= TOTAL ? 1 : fuera((t - SEG[1]) / 0.6);
    const sy = SOL_Y0 + (m - T0) / (c.sol - T0) * (GROUND + R - SOL_Y0);
    const ly = GROUND + R - Math.max(0, m - c.luna) * LUNA_PX_MIN;
    sol.setAttribute('cy', sy.toFixed(1)); luna2.setAttribute('cy', ly.toFixed(1));
    reloj.textContent = hhmm(m);
    cursor.setAttribute('cx', (PX0 + (m - T0) / (T1 - T0) * (PX1 - PX0)).toFixed(1));
    ticks.forEach(k => k === c.g ? k.setAttribute('data-on', '') : k.removeAttribute('data-on'));
    // paso 3: un aliento, 3 s adentro y 3 s afuera, una sola vez
    escenas[2].style.opacity = t >= TOTAL ? 1 : fuera((t - SEG[2]) / 0.6);
    const a = t - 12.2; let rr = 30, txt = D.final;
    if (t < TOTAL && a >= 0 && a < 6) { const ph = a < 3 ? fuera(a / 3) : 1 - fuera((a - 3) / 3); rr = 30 + 14 * ph; txt = a < 3 ? D.in : D.out; }
    resp.setAttribute('r', rr.toFixed(1)); texto3.textContent = txt;
    // paso activo
    const p = jugando ? (t < SEG[1] ? 1 : t < SEG[2] ? 2 : 3) : 0;
    if (p) ver = p;
    pasos.forEach((x, i) => { x.classList.toggle('is-act', p === i + 1); x.classList.toggle('is-ver', ver === i + 1); });
    botonesPaso.forEach((b, i) => b.setAttribute('aria-current', ver === i + 1 ? 'step' : 'false'));
    if (p !== pasoPrevio) { pasoPrevio = p; estado.textContent = p ? D.ahora.replace('{n}', p) : ''; }
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
    jugando = true; ultimo = performance.now();
    boton.textContent = D.pause;
    render(); raf = requestAnimationFrame(bucle);
  }
  function irAlPaso(n) { if (jugando) parar(false); ver = n; t = n === 3 ? TOTAL : SEG[n]; render(); estado.textContent = D.ahora.replace('{n}', n); }

  // controles (se crean aquí: sin JS no hacen falta)
  // Un solo rótulo que cambia (Play, Pause, Play again), sin aria-pressed: no se anuncia doble (rev-medidor N1).
  const boton = document.createElement('button'); boton.type = 'button'; boton.className = 'ml-btn'; boton.textContent = D.play;
  const botonesPaso = [];
  if (!reducido) { boton.addEventListener('click', reproducir); ctl.appendChild(boton); }
  for (let n = 1; n <= 3; n++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ml-btn'; b.textContent = `${D.step} ${n}`;
    b.addEventListener('click', () => irAlPaso(n)); ctl.appendChild(b); botonesPaso.push(b);
  }
  ctl.hidden = false; el.classList.add('is-js');
  radios.forEach(r => r.addEventListener('change', render));
  render();                                   // arranca en el estado final: igual que el quieto
  return { destruir() { cancelAnimationFrame(raf); ctl.textContent = ''; ctl.hidden = true; el.classList.remove('is-js'); } };
}
