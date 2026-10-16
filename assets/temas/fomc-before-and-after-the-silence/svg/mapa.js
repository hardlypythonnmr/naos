// Resalta la pieza de la que vienes (?src=1028p). El SVG ya trae data-src en cada nodo con Short.
export function montar(svg) {
  const s = new URLSearchParams(location.search).get('src');
  const n = s && [...svg.querySelectorAll('[data-src]')].find(e => e.dataset.src === s);
  if (n) n.classList.add('is-from');
}
