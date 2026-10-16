// conteo.js · "El conteo en cuatro pasos" (how-a-vote-is-counted). Vanilla JS sobre el marcado que ya trae la página.
// Contrato: export function montar(el, {quieto}). Sin GSAP, sin librerías. Sin JS o con quieto:true se ve el estado final:
// los tres países con sus cuatro pasos completos. Con JS se muestra un país a la vez (botones de país) en el mismo estado final.
// Nada arranca solo: solo tras pulsar Reproducir. Una pasada de 12 s, nunca en bucle, con Pausa. La ficha viaja a velocidad constante.
// prefers-reduced-motion: no hay Reproducir ni movimiento; los botones de paso muestran cada estado de golpe.
export function montar(el, { quieto = false } = {}) {
  if (quieto || !el) return { destruir() {} };
  const D = el.dataset, REPOSO = +D.reposo || 2.2, VIAJE = +D.viaje || 0.8, PASO = +D.paso || 3, TOTAL = 4 * PASO;
  const paneles = [...el.querySelectorAll('.cv-pais')];
  const tabs = el.querySelector('.cv-tabs'), ctl = el.querySelector('.cv-ctl'), estado = el.querySelector('.cv-sr');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let p = paneles[0], t = TOTAL, jugando = false, raf = 0, ultimo = 0, previo = '';

  function datos(panel) {
    const svg = panel.querySelector('.cv-svg');
    return { svg, xs: svg.dataset.x.split(' ').map(Number), st: [...svg.querySelectorAll('.cv-st')], av: svg.querySelector('.cv-avance'),
             ficha: svg.querySelector('.cv-ficha'), lis: [...panel.querySelectorAll('.cv-paso')] };
  }
  const V = new Map(paneles.map(x => [x, datos(x)]));

  function render() {
    const v = V.get(p);
    let act = 0, x = v.xs[3];
    if (t < TOTAL) {
      const k = Math.min(3, Math.floor(t / PASO)), r = t - k * PASO;
      act = k + 1; x = v.xs[k];
      if (k < 3 && r > REPOSO) x += (v.xs[k + 1] - v.xs[k]) * Math.min(1, (r - REPOSO) / VIAJE);   // velocidad constante
    }
    v.av.setAttribute('d', `M${v.xs[0]} 58 H${x}`);
    v.ficha.setAttribute('transform', `translate(${(x - 8).toFixed(1)} 6)`);
    v.st.forEach((s, i) => {
      s.classList.toggle('is-act', act === i + 1);
      s.classList.toggle('is-hecho', act === 0 || i + 1 < act);
      s.classList.toggle('is-fut', act !== 0 && i + 1 > act);
    });
    v.lis.forEach((l, i) => l.classList.toggle('is-act', act === i + 1));
    const clave = p.dataset.pais + act;
    if (clave !== previo) {
      previo = clave;
      if (act) estado.textContent = D.ahora.replace('{n}', act).replace('{t}', v.lis[act - 1].dataset.corto);
    }
  }
  function bucle(ahora) {
    const dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    t = Math.min(TOTAL, t + dt);
    if (t >= TOTAL) { parar(true); return; }
    render(); raf = requestAnimationFrame(bucle);
  }
  function parar(fin) {
    jugando = false; cancelAnimationFrame(raf); raf = 0;
    if (fin) { t = TOTAL; boton.textContent = D.again; } else boton.textContent = D.play;
    render();
  }
  function reproducir() {
    if (jugando) return parar(false);
    if (t >= TOTAL) t = 0;
    jugando = true; ultimo = performance.now();
    boton.textContent = D.pause;
    render(); raf = requestAnimationFrame(bucle);
  }
  function irAlPaso(n) { if (jugando) parar(false); t = (n - 1) * PASO; previo = ''; render(); }
  function elegir(panel) {
    if (jugando) parar(false);
    p = panel; t = TOTAL; previo = '';
    paneles.forEach(x => { x.hidden = x !== p; });
    tabBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(paneles[i] === p)));
    boton.textContent = D.play; render(); estado.textContent = p.dataset.nombre;
  }

  // controles: se crean aquí, porque sin JS no hacen falta
  const boton = document.createElement('button'); boton.type = 'button'; boton.className = 'cv-btn'; boton.textContent = D.play;
  tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', D.paisEtq);
  const tabBtns = paneles.map(x => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'cv-btn'; b.textContent = x.dataset.nombre;
    b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', () => elegir(x)); tabs.appendChild(b); return b;
  });
  if (!reducido) { boton.addEventListener('click', reproducir); ctl.appendChild(boton); }
  for (let n = 1; n <= 4; n++) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'cv-btn'; b.textContent = `${D.step} ${n}`;
    b.addEventListener('click', () => irAlPaso(n)); ctl.appendChild(b);
  }
  tabs.hidden = false; ctl.hidden = false;
  elegir(paneles[0]); estado.textContent = '';
  return { destruir() { cancelAnimationFrame(raf); tabs.textContent = ''; ctl.textContent = ''; tabs.hidden = ctl.hidden = true; paneles.forEach(x => { x.hidden = false; }); } };
}
