// Un minuto, una luz · mini animación de proceso (3 pasos), sin librerías. montar(el, {quieto}).
// Sin JS o con quieto: el SVG ya está en su estado final (data-paso="3"). Nada arranca solo.
const DUR = [0, 9000, 6500, 2400]; // ms: paso 1 (2 s a oscuras + anillo de 6 s), paso 2 (luz encendida), paso 3 (se apaga)
export function montar(el, { quieto = false } = {}) {
  const svg = el.querySelector('svg.lv'), est = el.querySelector('.lv-estado'), bar = el.querySelector('.lv-ctl');
  if (!svg || !est || !bar) return;
  const T = JSON.parse(el.querySelector('.lv-txt').textContent);
  let p = 3, jugando = false, acabo = false, tm = 0, fin = 0, resta = 0;
  const anims = () => (svg.getAnimations ? svg.getAnimations({ subtree: true }) : []);
  const boton = (t, f) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.addEventListener('click', f); bar.append(b); return b; };
  const poner = (n, seco) => {
    if (seco) svg.classList.add('lv-sin');
    svg.dataset.paso = p = n; acabo = false; est.textContent = T.estado[n];
    if (seco) { svg.getBoundingClientRect(); svg.classList.remove('lv-sin'); }
  };
  const rotular = () => {
    if (bPlay) bPlay.textContent = jugando ? T.pause : acabo ? T.again : T.play;
    bNext.textContent = p === 3 ? T.restart : T.next;
  };
  const prog = ms => { fin = Date.now() + ms; tm = setTimeout(pasar, ms); };
  const pasar = () => {
    clearTimeout(tm);
    if (p === 3) { jugando = false; acabo = true; rotular(); return; }
    poner(p + 1); prog(DUR[p + 1]); rotular();
  };
  const pausar = () => { jugando = false; clearTimeout(tm); resta = Math.max(0, fin - Date.now()); anims().forEach(a => a.pause()); rotular(); };
  const seguir = () => anims().forEach(a => { if (a.playState === 'paused') a.play(); });
  const jugar = () => {
    jugando = true; seguir();
    if (acabo || p === 3) { poner(0, true); resta = 0; }
    if (p === 0) { poner(1); prog(DUR[1]); } else prog(resta || DUR[p]);
    rotular();
  };
  const sig = () => {
    if (jugando) pausar();
    seguir(); resta = 0; poner(p === 3 ? 0 : p + 1, p === 3); rotular();
  };
  const bPlay = quieto ? null : boton(T.play, () => (jugando ? pausar() : jugar()));
  const bNext = boton(T.next, sig);
  if (quieto) svg.dataset.quieto = ''; else poner(0, true);
  rotular();
}
