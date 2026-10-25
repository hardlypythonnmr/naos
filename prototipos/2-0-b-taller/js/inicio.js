/* inicio.js · arranque del prototipo: panel del equipo (?dev=1) y primer render por ancla. */
(function () {
  "use strict";
  var N = window.TALLER;
  function go() {
    if (N.DEV && N.construirDev) N.construirDev();
    N.render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
