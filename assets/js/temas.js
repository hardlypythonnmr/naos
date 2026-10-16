/* temas.js · páginas de tema (lote E, D-252). Sin dependencias, sin Lenis, sin animación. Dos marcas, solo si hay JS:
 *   ?src=<codigo>: la tarjeta del Short del que viene el lector lleva "You came from this Short" (el enlace corto aterriza en ella).
 *   hoy: las tarjetas con fecha de hoy en Nueva York (ET, la zona de la grilla) llevan "Today".
 * La guía de la portada (D-236) nunca abre aquí: este archivo no la carga. */
(function () {
  "use strict";
  const marca = (el, txt) => { const p = document.createElement("p"); p.className = "t-marca-js"; p.textContent = txt; el.insertBefore(p, el.firstChild); };
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  document.querySelectorAll(".t-carta").forEach((c) => { if (c.dataset.fecha === hoy) { c.classList.add("t-hoy"); marca(c, "Today"); } });
  const src = new URLSearchParams(location.search).get("src");
  if (!src || !/^[\w-]{3,40}$/.test(src)) return;
  const c = document.querySelector(`.t-carta[data-codigo="${src}"]`);
  if (!c) return;
  c.classList.add("t-vienes"); marca(c, "You came from this Short");
  if (!location.hash) c.scrollIntoView({ block: "start" });
})();
