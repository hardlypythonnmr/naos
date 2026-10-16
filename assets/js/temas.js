/* temas.js · páginas de tema y hubs (lote E, D-252). Sin dependencias, sin Lenis, sin animación. Solo marca, si hay JS:
 *   ?src=<codigo>: la tarjeta del Short del que viene el lector lleva "You came from this Short" (en la edición ES, "Viniste de este Short").
 *   hoy: las tarjetas con fecha de hoy en Nueva York (ET, la zona de la grilla) llevan "Today".
 *   hubs: el tema que corre hoy lleva "Now", los ya cerrados se aclaran, y la línea de tiempo lleva la marca de hoy.
 * La guía de la portada (D-236) nunca abre aquí: este archivo no la carga. */
(function () {
  "use strict";
  // la edición ES (D-253) dice lo mismo en español
  const T = document.documentElement.lang === "es" ? { hoy: "Hoy", ahora: "Ahora", vienes: "Viniste de este Short" } : { hoy: "Today", ahora: "Now", vienes: "You came from this Short" };
  const marca = (el, txt) => { const p = document.createElement("p"); p.className = "t-marca-js"; p.textContent = txt; const w = el.querySelector(".t-when") || el; w.insertBefore(p, w.firstChild); };
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  document.querySelectorAll(".t-carta").forEach((c) => { if (c.dataset.fecha === hoy) { c.classList.add("t-hoy"); marca(c, T.hoy); } });
  // hubs
  const m = document.querySelector("main[data-t0]");
  if (m && hoy >= m.dataset.t0 && hoy < m.dataset.t1) {
    const d = (f) => Date.parse(f + "T00:00:00Z");
    m.style.setProperty("--hoy", (((d(hoy) - d(m.dataset.t0)) / (d(m.dataset.t1) - d(m.dataset.t0))) * 100).toFixed(2) + "%");
    m.classList.add("t-con-hoy");
  }
  document.querySelectorAll(".t-tema[data-desde]").forEach((a) => {
    if (a.dataset.hasta < hoy) a.classList.add("t-pasado");
    else if (a.dataset.desde <= hoy) { const s = document.createElement("span"); s.className = "t-ahora"; s.textContent = T.ahora; a.querySelector(".t-tema-m")?.prepend(s); }
  });
  const src = new URLSearchParams(location.search).get("src");
  if (!src || !/^[\w-]{3,40}$/.test(src)) return;
  const c = document.querySelector(`.t-carta[data-codigo="${src}"]`);
  if (!c) return;
  c.classList.add("t-vienes"); marca(c, T.vienes);
  if (!location.hash) c.scrollIntoView({ block: "start" });
})();
