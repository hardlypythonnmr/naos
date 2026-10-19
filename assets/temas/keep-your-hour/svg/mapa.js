// Resalta la pieza de la que vienes (?src=1105h) y gira la manecilla hacia ella. El SVG ya trae data-src y data-ang en cada nodo.
export function montar(svg) {
  const s = new URLSearchParams(location.search).get('src');
  const n = s && [...svg.querySelectorAll('[data-src]')].find(e => e.dataset.src === s);
  if (!n) return;
  n.classList.add('is-from'); svg.dataset.from = n.dataset.i; svg.style.setProperty('--a', n.dataset.ang + 'deg');
}
