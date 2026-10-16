// Resalta la pieza de la que vienes (?src=1109h). El SVG ya trae data-src en cada nodo; la versión en texto, en cada <li>.
export function montar(svg) {
  const s = new URLSearchParams(location.search).get('src');
  const n = s && [...svg.querySelectorAll('[data-src]')].find(e => e.dataset.src === s);
  if (!n) return;
  n.classList.add('is-from');
  const li = svg.closest('figure')?.querySelector(`li[data-src="${s}"]`);
  if (li) li.setAttribute('aria-current', 'true');   // el resalte también llega a quien no ve el dibujo
}
