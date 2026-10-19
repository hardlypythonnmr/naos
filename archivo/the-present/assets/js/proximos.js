/* proximos.js · widget "Upcoming" del bento de la portada: los próximos cinco eventos de data/agenda.json con cuenta
 * regresiva, punto de categoría (color de su sección) y su .ics. Lleva a agenda.html. Sin vino: la portada ya lo usa. */
(function () {
  "use strict";
  const A = window.NAOS_AGENDA, el = document.getElementById("b-prox"); if (!A || !el) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], DIA = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fe = (f) => { const t = new Date(f + "T12:00:00Z"); return `${DIA[t.getUTCDay()]} ${t.getUTCDate()} ${MES[t.getUTCMonth()]}`; };
  const ICONO = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="13.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 8h15M6.5 2v4M13.5 2v4" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 10.2v5M7.5 12.7h5" stroke="currentColor" stroke-width="1.6"/></svg>';
  fetch("data/agenda.json").then((r) => r.json()).then((ag) => {
    const xs = A.proximos(A.conIds(ag.eventos || [])).slice(0, 5); if (!xs.length) return;
    const pintar = () => xs.map((e) => { const c = A.cat(e.categoria);
      return `<li class="bp sec-${c.seccion}"><span class="bp-n num">${A.cuenta(e).txt}</span>` +
        `<a class="bp-add" href="${A.rutaEvento(e)}" download="${esc(e.id)}.ics" aria-label="Add to calendar: ${esc(e.titulo)} (.ics)" title="Add to calendar">${ICONO}</a>` +
        `<a class="bp-t" href="agenda.html#${esc(e.id)}">${esc(e.titulo)}</a>` +
        `<span class="bp-m"><span class="ag-dot" aria-hidden="true"></span>${esc(c.nombre)} · ${fe(e.hora ? e.hora.slice(0, 10) : e.fecha)}${e.hora ? " " + e.hora.slice(11, 16) + " UTC" : ""}</span></li>`; }).join("");
    el.innerHTML = `<div class="b-prox-c"><h2 class="b-k cond" id="b-prox-t">Upcoming</h2><span class="sello">Central banks, data, summits, holidays and more, with the source for each date</span><a href="agenda.html">See the year ahead</a></div><ol aria-labelledby="b-prox-t">${pintar()}</ol>`;
    el.hidden = false; const B = document.getElementById("bento-p"); if (B) B.hidden = false;
    setInterval(() => { const ol = el.querySelector("ol"); if (ol) ol.innerHTML = pintar(); }, 60000);
  }).catch(() => {});
})();
