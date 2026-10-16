// mapa-origen.js · marca la pieza de la que vienes (?src=1027h). Sin dependencias, menos de 1 KB.
// 1. En el mapa: clase sm-origen (aro grueso) en cada <g data-src="..."> (ancho y estrecho).
// 2. En la lista del mapa: aria-current en el enlace que coincide (rev-medidor aviso 4).
// 3. En el bloque 2: clase is-origen y la nota "From the piece you came from" en el paso de esa pieza (rev-pedagogia O6).
// El texto "You came from" y la barra de la tarjeta los pone temas.js. Va antes del modulo de noche.js.
(function () {
  try {
    var s = new URLSearchParams(location.search).get('src');
    if (!s) return;
    document.querySelectorAll('.sm-nodo[data-src]').forEach(function (e) {
      if (e.getAttribute('data-src') === s) e.classList.add('sm-origen');
    });
    document.querySelectorAll('.sm-lista li[data-src]').forEach(function (e) {
      if (e.getAttribute('data-src') === s) { var a = e.querySelector('a'); if (a) a.setAttribute('aria-current', 'true'); }
    });
    document.querySelectorAll('.sv-paso[data-src]').forEach(function (e) {
      if ((' ' + e.getAttribute('data-src') + ' ').indexOf(' ' + s + ' ') > -1) {
        e.classList.add('is-origen');
        var n = e.querySelector('.sv-origen'); if (n) n.hidden = false;
      }
    });
  } catch (e) {}
})();
