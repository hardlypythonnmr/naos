// Resalta la pieza de la que vienes (?src=1215h) y enciende el camino hasta ella. El SVG ya trae data-src y data-f (fracción del camino) en cada nodo.
export function montar(svg) {
  const s = new URLSearchParams(location.search).get('src');
  const n = s && [...svg.querySelectorAll('[data-src]')].find(e => e.dataset.src === s);
  const m = svg.querySelector('.cm-mk');
  if (!n || !m) return;
  n.classList.add('is-from'); svg.dataset.from = n.dataset.i;
  requestAnimationFrame(() => { m.style.strokeDashoffset = (1 - parseFloat(n.dataset.f)).toFixed(4); });
}
