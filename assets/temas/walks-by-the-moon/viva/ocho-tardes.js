// Ocho tardes, un camino · mini animación de proceso, sin librerías. montar(el, {quieto}).
// Sin JS o con quieto: el SVG queda como está, sin marcas. Nada arranca solo. Corre una vez, sin bucle.
const T_IDA = 1000, T_PAUSA = 800, T_VUELTA = 800, T_RAYA = 500, T_TOTAL = T_IDA + T_PAUSA + T_VUELTA;
const ease = u => (u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u));
const clamp = u => (u < 0 ? 0 : u > 1 ? 1 : u);
export function montar(el, { quieto = false } = {}) {
  const svg = el.querySelector('svg.cv'), est = el.querySelector('.cv-estado'), bar = el.querySelector('.cv-ctl'), hit = el.querySelector('.cv-hit');
  if (!svg || !est || !bar || !hit) return;
  const T = JSON.parse(el.querySelector('.cv-txt').textContent);
  const reducido = quieto || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reducido) svg.dataset.quieto = '';
  const N = 8, lang = el.getAttribute('lang') || 'en';
  const camino = svg.querySelector('path.cv-road'), L = camino.getTotalLength();
  const walker = svg.querySelector('.cv-walker'), look = svg.querySelector('.cv-look'), ring = svg.querySelector('.cv-ring');
  const ev = [...svg.querySelectorAll('.cv-e')], marcas = ev.map(g => g.querySelector('.cv-mark'));
  const on = Array(N).fill(false);
  let cur = -1, t = 0, jugando = false, ultimo = 0, raf = 0;
  const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);
  const cuenta = () => on.filter(Boolean).length;
  const decir = s => { est.textContent = s; };
  const botones = [];
  hit.setAttribute('role', 'group'); hit.setAttribute('aria-label', T.grupo);   // el grupo existe solo con JS (sin JS no hay botones)
  // botones nativos sobre cada luna: tocar marca o desmarca esa tarde
  ev.forEach((g, k) => {
    const b = document.createElement('button'); b.type = 'button'; b.style.left = (k * 12.5) + '%';
    b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', fmt(T.marca_de, { d: T.dias_largos[k] }));
    b.addEventListener('click', () => { poner(k, !on[k]); decir(fmt(on[k] ? T.marcada : T.desmarcada, { d: T.dias_largos[k], n: cuenta() }) + (cuenta() === N ? ' ' + T.fin : '')); rotular(); });
    hit.append(b); botones.push(b);
  });
  const poner = (k, v) => {
    on[k] = v; botones[k].setAttribute('aria-pressed', v ? 'true' : 'false');
    marcas[k].style.strokeDashoffset = ''; marcas[k].style.opacity = '';
    if (v) ev[k].setAttribute('data-on', ''); else ev[k].removeAttribute('data-on');
  };
  const casa = () => { walker.setAttribute('transform', 'translate(24 238)'); look.style.opacity = 0; ring.style.opacity = 0; };
  const dibujar = () => {
    if (cur < 0) return casa();
    const s = t < T_IDA ? ease(t / T_IDA) : t < T_IDA + T_PAUSA ? 1 : 1 - ease((t - T_IDA - T_PAUSA) / T_VUELTA);
    const p = camino.getPointAtLength(s * L);
    walker.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
    const mira = t >= T_IDA && t < T_IDA + T_PAUSA ? clamp(Math.min((t - T_IDA) / 200, (T_IDA + T_PAUSA - t) / 200)) : 0;
    look.style.opacity = mira;
    ring.setAttribute('cx', (45 * cur + 22.5).toFixed(1));
    ring.style.opacity = t < T_IDA ? 0 : Math.min(clamp((t - T_IDA) / 200), clamp((T_TOTAL - t) / 200));
    if (!on[cur]) { const u = clamp((t - T_IDA - T_PAUSA) / T_RAYA); marcas[cur].style.opacity = u > 0 ? 1 : 0; marcas[cur].style.strokeDashoffset = (1 - u).toFixed(3); }
  };
  const primera = () => on.indexOf(false);
  const siguiente = d => { for (let k = d; k < N; k++) if (!on[k]) return k; return -1; };
  const rotular = () => {
    if (bPlay) bPlay.textContent = jugando ? T.pause : cuenta() === N ? T.again : T.play;
    bNext.textContent = cuenta() === N ? T.restart : T.next;
  };
  const parar = () => { jugando = false; cancelAnimationFrame(raf); };
  const empezar = k => { cur = k; t = 0; decir(fmt(T.en_marcha, { d: T.dias_largos[k], k: k + 1 })); };
  const terminar = () => {            // la tarde en curso llega a su raya
    const k = cur; poner(k, true); cur = -1; t = 0; dibujar();
    decir(fmt(T.marcada, { d: T.dias_largos[k], n: cuenta() }));
  };
  const cuadro = ts => {
    if (!jugando) return;
    t += Math.min(ts - ultimo, 100); ultimo = ts;
    if (t >= T_TOTAL) {
      terminar(); const s = siguiente(0);
      if (s < 0) { parar(); decir(T.fin); rotular(); return; }
      empezar(s);
    }
    dibujar(); raf = requestAnimationFrame(cuadro);
  };
  const jugar = () => {
    if (cuenta() === N) { on.forEach((_, k) => poner(k, false)); cur = -1; }
    if (cur < 0) { const s = primera(); if (s < 0) return; empezar(s); }
    jugando = true; ultimo = performance.now(); rotular(); raf = requestAnimationFrame(cuadro);
  };
  const pausar = () => { parar(); decir(fmt(T.pausa, { n: cuenta() })); rotular(); };
  const sig = () => {
    if (cuenta() === N) { parar(); on.forEach((_, k) => poner(k, false)); cur = -1; t = 0; casa(); decir(reducido ? T.estado_ini_quieto : T.estado_ini); rotular(); return; }
    parar();
    const k = cur >= 0 ? cur : primera(); cur = -1; t = 0; casa();
    poner(k, true);
    decir(cuenta() === N ? fmt(T.marcada, { d: T.dias_largos[k], n: N }) + ' ' + T.fin : fmt(T.marcada, { d: T.dias_largos[k], n: cuenta() }));
    rotular();
  };
  const boton = (txt, f) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.addEventListener('click', f); bar.append(b); return b; };
  const bPlay = reducido ? null : boton(T.play, () => (jugando ? pausar() : jugar()));
  const bNext = boton(T.next, sig);
  decir(reducido ? T.estado_ini_quieto : T.estado_ini);
  rotular();
}
