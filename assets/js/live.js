/* live.js · sello LIVE (PAG-09.7, D-234). Único que pinta el sello rojo.
 * Convención: un elemento con data-live="AAAA-MM-DDTHH:MMZ" (hora UTC de la fuente) lleva el sello mientras tenga menos de 2 h.
 * La edad se calcula en el navegador con la hora de la fuente, nunca con la hora en que se armó la página.
 * Además marca por su cuenta los titulares de la portada y del wire con la hora de situacion.json (el archivo que ya carga la
 * página), para que v1plus.js no cambie. Sin red nueva, sin almacén, sin animación. ?live-ahora=AAAA-MM-DDTHH:MMZ fija el reloj (pruebas). */
(function () {
  "use strict";
  const VENTANA = 2 * 36e5, TOLERA = 5 * 6e4; // 2 h; un dato "del futuro" por más de 5 min no cuenta
  const P = new URLSearchParams(location.search).get("live-ahora");
  const fijo = P && !isNaN(Date.parse(P)) ? Date.parse(P) : null;
  const t0 = Date.now();
  const ahora = () => (fijo != null ? fijo + (Date.now() - t0) : Date.now());
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reciente = (iso) => { const t = Date.parse(iso || ""); if (isNaN(t)) return false; const e = ahora() - t; return e >= -TOLERA && e < VENTANA; };

  // 1) marca los titulares con hora completa (AAAA-MM-DDTHH:MMZ); las horas sin minutos no pueden probar que sean de hace 2 h
  let datos = null;
  const marca = () => {
    if (!datos) return;
    const items = [...(datos.portada || []), ...(datos.wire || []), ...(datos.titulares || [])];
    for (const t of items) {
      if (!t.url || !t.hora || t.hora.length < 16 || t.viejo) continue;
      for (const a of document.querySelectorAll("#b-lead a, #tits a, #wire-l a")) {
        if (a.getAttribute("href") !== t.url || a.closest(".w-mov")) continue;
        const cont = a.closest("li, #b-lead");
        if (cont && !cont.dataset.live) cont.dataset.live = t.hora;
      }
    }
  };

  // 2) pinta o quita el sello según la edad de cada [data-live]
  const SELLO = '<span class="live-punto" aria-hidden="true"></span>LIVE';
  let ultimo = -1;
  const pasa = () => {
    marca();
    let n = 0;
    for (const el of document.querySelectorAll("[data-live]")) {
      const viva = reciente(el.dataset.live), s = el.querySelector(":scope > .tit-m > .live-sello, :scope > .w-m > .live-sello, :scope > .live-sello");
      if (viva) n++;
      if (viva && !s) {
        const nuevo = document.createElement("span");
        nuevo.className = "live-sello"; nuevo.innerHTML = SELLO;
        nuevo.setAttribute("role", "img"); nuevo.setAttribute("aria-label", "Live, updated " + el.dataset.live.slice(11, 16) + " UTC");
        const host = el.querySelector(":scope > .tit-m, :scope > .w-m") || el;
        host.prepend(nuevo);
      } else if (!viva && s) s.remove();
    }
    const reg = document.getElementById("live");
    if (reg && n !== ultimo) { // anuncia solo cuando cambia el conteo
      if (n) { reg.setAttribute("role", "status"); reg.className = "sr"; reg.textContent = n + (n === 1 ? " live item" : " live items") + " from the last 2 hours."; reg.hidden = false; }
      else { reg.hidden = true; reg.textContent = ""; }
      ultimo = n;
    }
  };

  let r = 0;
  const pronto = () => { cancelAnimationFrame(r); r = requestAnimationFrame(pasa); };
  const arranca = () => {
    pasa();
    // la portada se pinta después de que llegan los datos: se vuelve a mirar cuando cambian sus listas
    const mo = new MutationObserver(pronto);
    for (const id of ["tits", "b-lead", "wire-l"]) { const e = document.getElementById(id); if (e) mo.observe(e, { childList: true }); }
    setInterval(pasa, 30000); // un sello que cumple 2 h se va solo, sin recargar
    document.addEventListener("visibilitychange", () => { if (!document.hidden) pasa(); });
  };
  const fin = () => { document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", arranca) : arranca(); };
  fetch("data/situacion.json").then((x) => x.json()).then((d) => { datos = d; }).catch(() => {}).then(fin);
})();
