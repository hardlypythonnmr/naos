// noche.js · "Una noche" (saints-and-souls). Vanilla JS sobre el SVG que ya trae la pagina.
// Contrato: export function montar(el, {quieto}). Sin JS o con quieto:true se ve el estado final (las cuatro paradas completas).
// Nada arranca solo: solo tras pulsar Reproducir. Una pasada de unos 16 s, nunca en bucle, con Pausa.
// prefers-reduced-motion: no hay Reproducir ni movimiento; los botones de paso muestran cada estado de golpe.
// En una columna (menos de 1100 px) se ve un solo dibujo a la vez: .is-ver en el paso elegido o el que corre.
// Una sola senal en los botones: el texto cambia (Pausa) y el paso elegido lleva aria-current (rev-medidor aviso 6).
// Solo anima el proceso de la noche (hilo, ondas de voz, un puesto que aparece, un pulso en una linea). Nada de la tradicion.
const T_HILO0 = 0.4, T_HILO1 = 15.4, TOTAL = 16.2;
const LLEGA = [0.125, 0.375, 0.625, 0.875].map(f => T_HILO0 + f * (T_HILO1 - T_HILO0));    // cuando el hilo llega a cada parada (el centro de cada tramo)
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const fuera = u => 1 - Math.pow(1 - clamp(u), 3);                                    // entrada por opacidad, sin rebote
const rampa = (t, t0, d) => fuera((t - t0) / d);

export function montar(el, { quieto = false } = {}) {
  if (quieto || !el) return { destruir() {} };
  const $ = (s, r = el) => r.querySelector(s), $$ = (s, r = el) => [...r.querySelectorAll(s)];
  const hilos = $$('.sv-hilo'), est = $$('.sv-est'), pasos = $$('.sv-paso');
  const arcs = [$('.sv-a1'), $('.sv-a2'), $('.sv-a3')], baseOp = [1, .75, .5];
  const pB = $('.sv-pB'), s3 = $('.sv-s3'), lin3 = $('.sv-s3 .sv-lin'), p1 = $('.sv-p1'), p2 = $('.sv-p2');
  const lin4 = $('.sv-s4 .sv-lin');
  const ctl = $('.sv-ctl'), estado = $('.sv-estado'), D = el.dataset;
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = TOTAL, jugando = false, raf = 0, ultimo = 0, previo = 0;

  // tiempos de cada parada (despues de que el hilo llega)
  const A1 = LLEGA[0], A2 = LLEGA[1], A3 = LLEGA[2], A4 = LLEGA[3];

  function render() {
    const fin = t >= TOTAL;
    // el hilo avanza a velocidad constante
    const u = fin ? 1 : clamp((t - T_HILO0) / (T_HILO1 - T_HILO0));
    hilos.forEach((h, i) => { const v = clamp(u * hilos.length - i); h.style.strokeDasharray = 100; h.style.strokeDashoffset = (100 * (1 - v)).toFixed(2); });
    // cada parada aparece justo antes de que el hilo llegue (0,5 s)
    est.forEach((g, i) => { g.style.opacity = fin ? 1 : rampa(t, LLEGA[i] - 0.6, 0.5); });
    // 1: tres ondas, una tras otra, una sola vez
    arcs.forEach((a, i) => { a.style.opacity = fin ? baseOp[i] : rampa(t, A1 + 0.1 + i * 0.6, 0.7) * baseOp[i]; });
    // 2: el puesto de mas entra por opacidad y sube 14 unidades
    const e2 = fin ? 1 : rampa(t, A2 + 0.2, 1.2);
    pB.style.opacity = e2; pB.setAttribute('transform', `translate(0 ${((1 - e2) * 14).toFixed(2)})`);
    // 3: la linea se dibuja y un pulso va y otro vuelve, a velocidad constante
    const d3 = fin ? 1 : clamp((t - A3 - 0.2) / 0.8);
    lin3.style.strokeDasharray = 100; lin3.style.strokeDashoffset = (100 * (1 - d3)).toFixed(2);
    const puls = (p, t0, a, b) => {
      const v = clamp((t - t0) / 1.4);
      if (fin || v <= 0 || v >= 1) { p.style.opacity = 0; return; }
      p.setAttribute('cx', (a + (b - a) * v).toFixed(1));
      p.style.opacity = clamp(Math.min(v, 1 - v) * 8);
    };
    puls(p1, A3 + 1.2, -41, 41); puls(p2, A3 + 2.7, 41, -41);
    // 4: la misma linea, en trazos, para la semana que viene
    const d4 = fin ? 1 : clamp((t - A4 - 0.2) / 1);
    lin4.style.opacity = d4;
    // paso activo (solo mientras suena)
    const p = jugando ? (t < A2 - 0.6 ? 1 : t < A3 - 0.6 ? 2 : t < A4 - 0.6 ? 3 : 4) : 0;
    pasos.forEach((x, i) => x.classList.toggle('is-act', p === i + 1));
    if (p) ver(p);
    if (p !== previo) { previo = p; estado.textContent = p ? titulo(p) : ''; }
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
    pasoBtn.forEach(b => b.removeAttribute('aria-current'));
    jugando = true; ultimo = performance.now();
    boton.textContent = D.pause;
    render(); raf = requestAnimationFrame(bucle);
  }
  // salta al estado "despues del paso n", sin movimiento
  const TRAS = [A1 + 2.2, A2 + 1.6, A3 + 4.2, TOTAL];
  function irAlPaso(n) {
    if (jugando) parar(false);
    t = TRAS[n - 1]; render(); ver(n);
    pasoBtn.forEach((b, i) => { if (i === n - 1) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    estado.textContent = titulo(n);
  }
  function titulo(n) { return pasos[n - 1].querySelector('.sv-h3').textContent; }
  function ver(n) { pasos.forEach((x, i) => x.classList.toggle('is-ver', i === n - 1)); }

  const boton = document.createElement('button'); boton.type = 'button'; boton.className = 'sv-btn'; boton.textContent = D.play;
  const pasoBtn = [];
  if (!reducido) { boton.addEventListener('click', reproducir); ctl.appendChild(boton); }
  for (let n = 1; n <= 4; n++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sv-btn';
    b.textContent = n < 4 ? D.step + ' ' + n : D.week;
    b.addEventListener('click', () => irAlPaso(n)); ctl.appendChild(b); pasoBtn.push(b);
  }
  ctl.hidden = false; el.classList.add('is-js');
  const origen = pasos.find(x => x.classList.contains('is-origen'));
  ver(origen ? pasos.indexOf(origen) + 1 : 1);   // el dibujo del paso de la pieza de la que vienes, o el primero
  render();                                   // arranca en el estado final: igual que el quieto
  return { destruir() { cancelAnimationFrame(raf); ctl.textContent = ''; ctl.hidden = true; el.classList.remove('is-js'); } };
}
