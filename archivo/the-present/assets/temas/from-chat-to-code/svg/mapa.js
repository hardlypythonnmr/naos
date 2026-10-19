// Resalta la pieza de la que vienes (?src=1021p). El SVG ya trae data-src y data-ancla en cada nodo.
// Además marca el enlace de la versión en texto con aria-current y el mismo rótulo, para quien no ve el SVG.
export function montar(svg) {
  const s = new URLSearchParams(location.search).get('src');
  const n = s && [...svg.querySelectorAll('[data-src]')].find(e => e.dataset.src === s);
  if (!n) return;
  n.classList.add('is-from');
  const fig = svg.closest('figure'), a = fig && fig.querySelector(`a[href="#${n.dataset.ancla}"]`), r = n.querySelector('.mp-de');
  if (a) { a.setAttribute('aria-current', 'true'); if (r) a.closest('li').append(' · ' + r.textContent); }
}
