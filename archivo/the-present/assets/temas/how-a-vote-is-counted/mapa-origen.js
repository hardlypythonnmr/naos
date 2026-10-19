// mapa-origen.js · enciende en el mapa el puesto del que vienes (?src=1031p). Sin dependencias, 0,5 KB.
// Marca con la clase vm-origen cada <g class="vm-seat" data-src="..."> del mapa (ancho y estrecho); el CSS del SVG hace el resto.
// data-src puede traer varios codigos separados por espacio (el nodo 3 sirve a 1031p y a 1103p).
// El texto "You came from" y la barra de la tarjeta los pone temas.js; esto solo ilumina el puesto.
(function () {
  try {
    var s = new URLSearchParams(location.search).get('src');
    if (!s) return;
    document.querySelectorAll('.vm-seat[data-src]').forEach(function (e) {
      if ((' ' + e.getAttribute('data-src') + ' ').indexOf(' ' + s + ' ') > -1) e.classList.add('vm-origen');
    });
  } catch (e) {}
})();
