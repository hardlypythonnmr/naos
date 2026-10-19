// mapa-origen.js · enciende en el mapa el puesto del que vienes (?src=1025h). Sin dependencias, 0,4 KB.
// Marca con la clase vm-origen cada <g data-src="..."> del mapa (ancho y estrecho); el CSS del SVG hace el resto.
// El texto "You came from" y la barra de la tarjeta los pone temas.js; esto solo ilumina el puesto.
(function () {
  try {
    var s = new URLSearchParams(location.search).get('src');
    if (!s) return;
    document.querySelectorAll('.vm-seat[data-src]').forEach(function (e) {
      if (e.getAttribute('data-src') === s) e.classList.add('vm-origen');
    });
  } catch (e) {}
})();
