/* agenda.js · la página Upcoming (agenda.html): próximo evento con cuenta regresiva, los siguientes, filtros por categoría,
 * barras de los períodos de varios días sobre el año, la línea de tiempo mes por mes y la suscripción por categoría.
 * Todo sale de data/agenda.json; cada evento enlaza su .ics (scripts/construir-ics.mjs). Sin librerías, sin animación propia:
 * con prefers-reduced-motion no cambia nada salvo las transiciones de CSS, que se apagan. */
(function () {
  "use strict";
  const A = window.NAOS_AGENDA, $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DIA = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const f12 = (f) => new Date(f + "T12:00:00Z");
  const corto = (f) => `${f12(f).getUTCDate()} ${MES[f12(f).getUTCMonth()].slice(0, 3)}`;
  const rango = (e) => (e.fecha_fin ? `${corto(e.fecha)} to ${corto(e.fecha_fin)}` : `${DIA[f12(e.fecha).getUTCDay()]} ${corto(e.fecha)}`);
  const ciudad = (z) => (z || "").replace(/^(\d\d:\d\d) .*\//, "$1 ").replace(/_/g, " ");
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const suya = (e) => { if (!e.hora) return ""; const t = new Date(A.inicio(e));
    const h = t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); return h === e.hora.slice(11, 16) ? "" : `${h} your time`; };
  const hora = (e) => (e.hora ? [`${e.hora.slice(11, 16)} UTC`, e.hora_local ? ciudad(e.hora_local) : "", suya(e)].filter(Boolean).join(" · ") : e.fecha_fin ? `${A.dias(e)} days` : "All day");
  const marcas = (e) => [e.fecha_estado === "expected" ? "Expected date" : "", e.hora && e.hora_estado === "expected" ? "Expected time" : ""].filter(Boolean)
    .map((t) => `<span class="ag-exp">${t}</span>`).join("");
  const webcal = (ruta) => { const u = new URL(ruta, location.href); return u.protocol === "https:" ? "webcal://" + u.host + u.pathname : u.href; };
  const ICONO = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="13.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 8h15M6.5 2v4M13.5 2v4" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 10.2v5M7.5 12.7h5" stroke="currentColor" stroke-width="1.6"/></svg>';
  const anadir = (e, txt = "Add to calendar") => `<a class="ag-add" href="${A.rutaEvento(e)}" download="${esc(e.id)}.ics" aria-label="Add to calendar: ${esc(e.titulo)} (.ics)">${ICONO}<span>${txt}</span></a>`;

  let eventos = [], filtro = "todo";
  const visibles = () => A.proximos(eventos).filter((e) => filtro === "todo" || e.categoria === filtro);

  function hero() {
    const e = A.proximos(eventos)[0], el = $("#ag-hero"); if (!e) { el.hidden = true; return; }
    const c = A.cat(e.categoria); el.hidden = false;
    el.innerHTML = `<p class="ag-k cond">Next · ${esc(c.nombre)}</p><h2 class="ag-hero-t"><a href="#${esc(e.id)}">${esc(e.titulo)}</a></h2>` +
      `<p class="ag-hero-n num" data-cuenta="${esc(e.id)}">${A.cuenta(e).txt}</p>` +
      `<p class="ag-hero-w">${rango(e)} · ${esc(hora(e))}</p><p class="ag-hero-a">${esc(e.angulo)}</p>${anadir(e)}`;
  }
  function siguen() {
    const xs = A.proximos(eventos).slice(1, 5); $("#ag-siguen").hidden = !xs.length;
    $("#ag-sig").innerHTML = xs.map((e) => { const c = A.cat(e.categoria);
      return `<li class="ag-s sec-${c.seccion}"><span class="ag-s-n num" data-cuenta="${esc(e.id)}">${A.cuenta(e).txt}</span>` +
        `<a class="ag-s-t" href="#${esc(e.id)}">${esc(e.titulo)}</a><span class="ag-s-m"><span class="ag-dot" aria-hidden="true"></span>${esc(c.nombre)} · ${rango(e)}</span>${anadir(e, "Add")}</li>`; }).join("");
  }
  function chips() {
    const vivos = A.proximos(eventos), n = (id) => vivos.filter((e) => id === "todo" || e.categoria === id).length;
    const cs = [{ id: "todo", nombre: "All", seccion: "" }, ...A.CATEGORIAS.filter((c) => n(c.id))];
    $("#ag-filtros").innerHTML = cs.map((c) => `<button type="button" class="ag-chip${c.seccion ? " sec-" + c.seccion : ""}" data-cat="${esc(c.id)}" aria-pressed="${filtro === c.id}">` +
      `${c.seccion ? '<span class="ag-dot" aria-hidden="true"></span>' : ""}${esc(c.nombre)} <span class="ag-chip-n num">${n(c.id)}</span></button>`).join("");
  }
  function suscribir() {
    const filas = [{ nombre: "Everything", ruta: A.rutaTodo(), seccion: "", n: eventos.length },
      ...A.CATEGORIAS.map((c) => ({ nombre: c.nombre, ruta: A.rutaCategoria(c.id), seccion: c.seccion, n: eventos.filter((e) => e.categoria === c.id).length })).filter((x) => x.n)];
    $("#ag-sus-l").innerHTML = filas.map((x) => `<li class="${x.seccion ? "sec-" + x.seccion : "ag-todo"}"><span class="ag-sus-c">${x.seccion ? '<span class="ag-dot" aria-hidden="true"></span>' : ""}${esc(x.nombre)} <span class="sello">${x.n}</span></span>` +
      `<a class="ag-sub" href="${esc(webcal(x.ruta))}">Subscribe<span class="sr"> to ${esc(x.nombre)}</span></a><a class="ag-ics" href="${x.ruta}" download>.ics<span class="sr"> file, ${esc(x.nombre)}</span></a></li>`).join("");
  }
  // períodos de varios días sobre el año de la agenda, con la línea de hoy
  function periodos() {
    const t0 = Date.parse(eventos[0]?.fecha || "2026-10-01"), ult = eventos.reduce((m, e) => (e.fecha_fin || e.fecha) > m ? e.fecha_fin || e.fecha : m, "");
    const a0 = Date.UTC(new Date(t0).getUTCFullYear(), new Date(t0).getUTCMonth(), 1), u = new Date(Date.parse(ult)), a1 = Date.UTC(u.getUTCFullYear(), u.getUTCMonth() + 1, 1);
    const pct = (t) => Math.max(0, Math.min(100, ((t - a0) / (a1 - a0)) * 100));
    const xs = visibles().filter((e) => A.dias(e) > 1);
    $("#ag-periodos").hidden = !xs.length; if (!xs.length) return;
    let eje = ""; for (let m = new Date(a0); m.getTime() < a1; m.setUTCMonth(m.getUTCMonth() + 1)) eje += `<span style="left:${pct(m.getTime()).toFixed(2)}%">${MES[m.getUTCMonth()].slice(0, 3)}${m.getUTCMonth() === 0 ? `<em> ${String(m.getUTCFullYear()).slice(2)}</em>` : ""}</span>`;
    const hoy = pct(Date.now());
    $("#ag-eje").innerHTML = eje + `<i class="ag-hoy" style="left:${hoy.toFixed(2)}%"></i>`;
    $("#ag-bars").innerHTML = xs.map((e) => { const c = A.cat(e.categoria), i = pct(Date.parse(e.fecha)), f = pct(Date.parse(e.fecha_fin) + 864e5);
      return `<li class="ag-b sec-${c.seccion}"><a class="ag-b-t" href="#${esc(e.id)}">${esc(e.titulo.replace(/ \(.*\)$/, ""))}</a><span class="ag-b-r" aria-hidden="true"><i class="ag-hoy" style="left:${hoy.toFixed(2)}%"></i>` +
        `<span class="ag-b-b" style="left:${i.toFixed(2)}%;width:${Math.max(.6, f - i).toFixed(2)}%"></span></span><span class="ag-b-f sello">${rango(e)} · ${A.dias(e)} days</span></li>`; }).join("");
    // en el teléfono, los primeros ocho y un botón para el resto
    const mas = $("#ag-mas"); mas.hidden = xs.length <= 8; $("#ag-bars").classList.toggle("corto", mas.getAttribute("aria-expanded") !== "true");
    mas.textContent = mas.getAttribute("aria-expanded") === "true" ? "Show fewer periods" : `Show all ${xs.length} periods`;
  }
  // la línea de tiempo: un bloque por mes, los eventos de un mismo día bajo una sola fecha
  function linea() {
    const xs = visibles(), meses = new Map();
    for (const e of xs) { const m = e.hora ? e.hora.slice(0, 7) : e.fecha.slice(0, 7); (meses.get(m) || meses.set(m, []).get(m)).push(e); }
    let h = "";
    for (const [m, es] of meses) {
      const id = "mes-" + m; let prev = "";
      h += `<section class="ag-mes" aria-labelledby="${id}"><h2 class="ag-mes-t" id="${id}">${MES[+m.slice(5) - 1]} <span>${m.slice(0, 4)}</span><span class="ag-mes-n sello">${es.length} event${es.length > 1 ? "s" : ""}</span></h2><ol class="ag-evs">`;
      for (const e of es) { const c = A.cat(e.categoria), f = e.hora ? e.hora.slice(0, 10) : e.fecha, nuevo = f !== prev; prev = f;
        const cu = A.cuenta(e);
        h += `<li class="ag-ev sec-${c.seccion}${nuevo ? " nuevo" : ""}" id="${esc(e.id)}">` +
          `<div class="ag-ev-f"${nuevo ? "" : ' aria-hidden="true"'}>${nuevo ? `<span class="ag-ev-d num">${f12(f).getUTCDate()}</span><span class="ag-ev-w cond">${DIA[f12(f).getUTCDay()]}</span>` : ""}</div>` +
          `<div class="ag-ev-c"><p class="ag-ev-m"><span class="ag-dot" aria-hidden="true"></span><span class="cond">${esc(c.nombre)}</span><span>${esc(e.pais || "")}</span>${marcas(e)}</p>` +
          `<h3 class="ag-ev-t">${esc(e.titulo)}</h3><p class="ag-ev-h">${esc(e.fecha_fin ? rango(e) + " · " + hora(e) : hora(e))}</p>` +
          (e.fecha_fin ? `<span class="ag-ev-p" aria-hidden="true"><span style="width:${Math.min(100, A.dias(e) / 45 * 100).toFixed(1)}%"></span></span>` : "") +
          `<p class="ag-ev-a">${esc(e.angulo)}</p><p class="ag-ev-s sello">Source: <a href="${esc(e.url)}" rel="noopener">${esc(e.fuente)}</a></p></div>` +
          `<div class="ag-ev-x"><span class="ag-ev-cd num${cu.ya ? " ya" : ""}" data-cuenta="${esc(e.id)}">${cu.txt}</span>${anadir(e)}</div></li>`; }
      h += `</ol></section>`;
    }
    $("#linea").innerHTML = h || `<p class="sello">Nothing scheduled in this category for now.</p>`;
  }
  function pintar() {
    chips(); periodos(); linea();
    const c = filtro === "todo" ? "all categories" : A.cat(filtro).nombre;
    $("#ag-aviso").textContent = `Showing ${visibles().length} upcoming events, ${c}.`;
  }
  function tic() {
    const porId = new Map(eventos.map((e) => [e.id, e]));
    document.querySelectorAll("[data-cuenta]").forEach((el) => { const e = porId.get(el.dataset.cuenta); if (e) el.textContent = A.cuenta(e).txt; });
  }

  async function iniciar() {
    let ag; try { ag = await (await fetch("data/agenda.json")).json(); } catch (e) { $("#ag-sello").textContent = "The agenda could not be loaded."; return; }
    eventos = A.conIds(ag.eventos || []).sort((a, b) => A.inicio(a) - A.inicio(b));
    const q = new URLSearchParams(location.search).get("cat");
    if (q && A.CATEGORIAS.some((c) => c.id === q)) filtro = q;
    const vivos = A.proximos(eventos), ult = eventos.reduce((m, e) => ((e.fecha_fin || e.fecha) > m ? e.fecha_fin || e.fecha : m), "");
    $("#ag-sello").innerHTML = `<b>${vivos.length} upcoming events</b> to ${corto(ult)} ${ult.slice(0, 4)} · reviewed ${corto(ag.revisado)} ${ag.revisado.slice(0, 4)} · your time zone: ${esc(tz)}`;
    hero(); siguen(); suscribir(); pintar();
    $("#ag-filtros").addEventListener("click", (ev) => { const b = ev.target.closest("[data-cat]"); if (!b) return;
      filtro = b.dataset.cat === filtro && filtro !== "todo" ? "todo" : b.dataset.cat; pintar();
      const u = new URL(location.href); if (filtro === "todo") u.searchParams.delete("cat"); else u.searchParams.set("cat", filtro); history.replaceState(null, "", u);
      $(`[data-cat="${CSS.escape(filtro)}"]`)?.focus(); });
    $("#ag-mas").addEventListener("click", (ev) => { const b = ev.currentTarget; b.setAttribute("aria-expanded", String(b.getAttribute("aria-expanded") !== "true")); periodos(); });
    // enlace directo a un evento (#id): llega después de pintar
    if (location.hash.length > 1) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) el.scrollIntoView({ block: "start" }); }
    setInterval(tic, 30000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
