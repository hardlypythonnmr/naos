/* agenda-comun.js · lo que comparten la página Upcoming (agenda.html), el widget de la portada y scripts/construir-ics.mjs:
 * el id de cada evento (nombre de su .ics), las categorías con su archivo, su nombre y su sección (el color de la sección
 * en "This week"), y la ruta de los .ics. Una sola fuente: si cambia el id aquí, cambian los archivos y los enlaces juntos.
 * En el navegador queda en window.NAOS_AGENDA; en Node se carga con require (CommonJS). */
(function (raiz) {
  "use strict";
  // categoría de data/agenda.json → archivo .ics, nombre en la página y sección de NAOS (color)
  const CATEGORIAS = [
    { id: "central_bank", archivo: "central-banks", nombre: "Central banks", seccion: "market" },
    { id: "us_data", archivo: "us-data", nombre: "US data", seccion: "market" },
    { id: "market_holiday", archivo: "market-holidays", nombre: "Market holidays", seccion: "market" },
    { id: "energy", archivo: "energy", nombre: "Energy", seccion: "market" },
    { id: "election", archivo: "elections", nombre: "Elections", seccion: "news" },
    { id: "summit", archivo: "summits", nombre: "Summits", seccion: "news" },
    { id: "state_visit", archivo: "state-visits", nombre: "State visits", seccion: "news" },
    { id: "tech_ai", archivo: "tech-ai", nombre: "Tech and AI", seccion: "ai" },
    { id: "religioso/cultural", archivo: "religious-cultural", nombre: "Religious and cultural", seccion: "behavior" },
  ];
  const cat = (id) => CATEGORIAS.find((c) => c.id === id) || { id, archivo: String(id).replace(/[^a-z0-9]+/gi, "-").toLowerCase(), nombre: id, seccion: "news" };
  const slug = (s) => String(s).normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48).replace(/-+$/, "");
  // id estable: fecha + título; si dos chocan, el segundo lleva -2 (mismo orden de data/agenda.json en todas partes)
  function conIds(eventos) {
    const vistos = new Map();
    return eventos.map((e) => {
      const base = `${e.fecha}-${slug(e.titulo)}`, n = (vistos.get(base) || 0) + 1; vistos.set(base, n);
      return { ...e, id: n > 1 ? `${base}-${n}` : base };
    });
  }
  const ICS = "assets/ics/";
  // tiempo: con hora, el instante UTC; solo fecha, el día entero en el reloj de quien mira (como lo pone su calendario)
  const diaLocal = (f) => new Date(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10)).getTime();
  const inicio = (e) => (e.hora ? Date.parse(e.hora.replace(/Z$/, ":00Z")) : diaLocal(e.fecha));
  const fin = (e) => (e.hora ? inicio(e) + 2 * 36e5 : diaLocal(e.fecha_fin || e.fecha) + 864e5); // con hora: sigue a la vista 2 h
  const dias = (e) => (e.fecha_fin ? Math.round((Date.parse(e.fecha_fin) - Date.parse(e.fecha)) / 864e5) + 1 : 1);
  // cuenta regresiva corta: "in 42m", "in 5h 12m", "in 6d 4h", "in 23 days"; en curso: "now" o "day 3 of 29"
  function cuenta(e, ahora = Date.now()) {
    const ms = inicio(e) - ahora;
    if (ms <= 0) { if (dias(e) > 1) return { txt: `day ${Math.floor((ahora - inicio(e)) / 864e5) + 1} of ${dias(e)}`, ya: true }; return { txt: e.hora ? "now" : "today", ya: true }; }
    const m = Math.floor(ms / 6e4), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (!e.hora && d < 1) return { txt: "tomorrow", ya: false };
    if (h < 1) return { txt: `in ${m}m`, ya: false };
    if (h < 24) return { txt: `in ${h}h ${String(m % 60).padStart(2, "0")}m`, ya: false };
    if (d < 14) return { txt: `in ${d}d ${h % 24}h`, ya: false, d };
    return { txt: `in ${d} days`, ya: false, d };
  }
  const proximos = (eventos, ahora = Date.now()) => eventos.filter((e) => fin(e) > ahora).sort((a, b) => inicio(a) - inicio(b));
  const A = { CATEGORIAS, cat, slug, conIds, ICS, todo: "naos-agenda", inicio, fin, dias, cuenta, proximos,
    rutaEvento: (e) => `${ICS}${e.id}.ics`, rutaCategoria: (id) => `${ICS}${cat(id).archivo}.ics`, rutaTodo: () => `${ICS}naos-agenda.ics` };
  if (typeof module === "object" && module.exports) module.exports = A; else raiz.NAOS_AGENDA = A;
})(typeof window !== "undefined" ? window : globalThis);
