// Tres pasos, una noche · mini animación de proceso, sin librerías. montar(el, {quieto}).
// Sin JS o con quieto: el SVG ya está en su estado final (data-paso="3"). Nada arranca solo.
const DUR = [0, 3600, 0, 2600]; // ms que dura el paso 1 y el 3 al reproducir; el 2 dura lo que tardan las tres respiraciones (CSS)
export function montar(el, { quieto = false } = {}) {
  const svg = el.querySelector('svg.cv'), est = el.querySelector('.cv-estado'), bar = el.querySelector('.cv-ctl');
  if (!svg || !est || !bar) return;
  const T = JSON.parse(el.querySelector('.cv-txt').textContent);
  let p = 3, jugando = false, acabo = false, tm = 0, fin = 0, resta = 0;
  const boton = (t, f) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.addEventListener('click', f); bar.append(b); return b; };
  const poner = (n, seco) => {
    if (seco) svg.classList.add('cv-sin');
    svg.dataset.paso = p = n; acabo = false; svg.removeAttribute('data-resp'); est.textContent = T.estado[n];
    if (seco) { svg.getBoundingClientRect(); svg.classList.remove('cv-sin'); }
  };
  const rotular = () => {
    if (bPlay) bPlay.textContent = jugando ? T.pause : acabo ? T.again : T.play;
    bNext.textContent = p === 3 ? T.restart : T.next;
  };
  const prog = ms => { fin = Date.now() + ms; tm = setTimeout(pasar, ms); };
  const pasar = () => {
    clearTimeout(tm); resta = 0;
    if (p === 3) { jugando = false; acabo = true; }
    else { poner(p + 1); if (p === 2) svg.dataset.resp = ''; else prog(DUR[p]); }
    rotular();
  };
  const pausar = () => { jugando = false; clearTimeout(tm); resta = Math.max(0, fin - Date.now()); svg.dataset.pausa = ''; rotular(); };
  const jugar = () => {
    svg.removeAttribute('data-pausa'); jugando = true;
    if (acabo) { poner(0, true); resta = 0; }
    if (p === 0) { poner(1); prog(DUR[1]); }
    else if (p === 1 || p === 3) prog(resta || DUR[p]);
    else if (!svg.hasAttribute('data-resp')) svg.dataset.resp = '';
    rotular();
  };
  const sig = () => { if (jugando) pausar(); svg.removeAttribute('data-pausa'); resta = 0; poner(p === 3 ? 0 : p + 1, p === 3); rotular(); };
  const bPlay = quieto ? null : boton(T.play, () => (jugando ? pausar() : jugar()));
  const bNext = boton(T.next, sig);
  svg.addEventListener('animationend', e => { if (e.animationName === 'cv-resp' && jugando) pasar(); });
  if (quieto) svg.dataset.quieto = ''; else poner(0, true);
  rotular();
}
