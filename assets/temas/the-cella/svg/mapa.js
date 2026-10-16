// Resalta la pieza de la que vienes (?src=1019h). El SVG ya trae data-src en cada nodo.
export function montar(svg) {
  const s = new URLSearchParams(location.search).get('src');
  const n = s && [...svg.querySelectorAll('[data-src]')].find(e => e.dataset.src === s);
  if (!n) return;
  n.classList.add('is-from'); svg.dataset.from = n.dataset.i;
}
