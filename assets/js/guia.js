/* guia.js · #guia: la hoja de la guía (3 fichas-enlace a Market, Assets y News) y la ficha "Guide" (PAG-09.3, lunes 19-oct).
 * Una sola cosa arriba: #secuencia. La hoja sube a los 2 s o al primer scroll de 120 px, pero solo si deja libre #secuencia; no roba el foco,
 * "Not now", la X y Esc la bajan y dejan la ficha. Mientras está arriba, scroll-padding-bottom iguala su alto (WCAG 2.4.11: nada enfocado queda tapado).
 * Guarda en el navegador solo naos:guia = { cerrada, ultima } con N.guarda (try/catch adentro). Los destinos salen de data/guia.json; si no carga, estos mismos. */
(function () {
  "use strict";
  const raiz = document.getElementById("guia"); if (!raiz) return;
  const N = window.NAOS || {}, guarda = N.guarda || (() => null);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const DEF = { pregunta: "What brings you here?", caminos: [
    { id: "market", ficha: "See what moves today", ayuda: "Today's brief and its sources", destino: "#mercados", seccion: "Market" },
    { id: "assets", ficha: "Learn one thing", ayuda: "A short lesson, no jargon", destino: "#assets", seccion: "Assets" },
    { id: "news", ficha: "Explore a topic", ayuda: "Pick a theme and follow it", destino: "#noticias", seccion: "News" }] };
  const valido = (g) => g && g.pregunta && Array.isArray(g.caminos) && g.caminos.length === 3 &&
    g.caminos.every((c) => c.ficha && c.ayuda && c.seccion && /^#[\w-]+$/.test(c.destino) && document.querySelector(c.destino));
  const html = document.documentElement, secuencia = document.getElementById("secuencia");
  const MIN = 220;          // alto mínimo de la hoja para subir sola; con menos espacio queda la ficha
  let hoja, ficha, titulo, arriba = false, descartada = false, fin = false, pasaron2s = false;

  const sitio = () => { // px libres entre el pie de #secuencia y el borde de abajo
    const b = secuencia && !secuencia.hidden ? secuencia.getBoundingClientRect().bottom : 0;
    return innerHeight - Math.max(b, 0) - 12;
  };
  const padding = () => html.style.setProperty("--gu-pad", (arriba ? hoja.offsetHeight : ficha.offsetHeight + 16) + 16 + "px");
  const tope = () => { // alto máximo de la hoja: 45 % de la pantalla y nunca sobre #secuencia; con poco alto se compacta (sin la línea de ayuda)
    const m = Math.max(Math.min(innerHeight * 0.45, sitio()), 180);
    hoja.style.setProperty("--gu-max", m + "px"); hoja.classList.toggle("gu-compacta", m < 350);
  };
  const poner = (si, foco) => {
    arriba = si; hoja.classList.toggle("gu-abierta", si); ficha.setAttribute("aria-expanded", String(si));
    if (si) tope();
    ficha.classList.toggle("gu-oculta", si); padding();
    if (foco) (si ? titulo : ficha).focus({ preventScroll: true });
  };
  const cerrar = (foco, guardar) => { descartada = true; if (guardar) guarda("guia", Object.assign(guarda("guia") || {}, { cerrada: true })); poner(false, foco); };
  // la ficha sube sobre la cinta Tikr en vez de taparla
  const acomoda = () => {
    let b = 16; const h = innerHeight;
    document.querySelectorAll(".cinta").forEach((c) => { const r = c.getBoundingClientRect(); if (r.top < h && r.bottom > h - 76) b = Math.max(b, h - r.top + 12); });
    ficha.style.bottom = b + "px";
    if (arriba) tope();
    padding();
  };
  const sube = () => { if (!(pasaron2s || scrollY >= 120) || descartada || arriba || fin || guarda("guia")?.cerrada) return; if (sitio() >= MIN) { fin = true; poner(true, false); } };

  Promise.race([fetch("data/guia.json").then((r) => r.json()).catch(() => null), new Promise((r) => setTimeout(r, 400, null))]).then((g) => {
    const G = valido(g) ? g : DEF;
    raiz.innerHTML = `<button type="button" class="ag-chip ficha gu-ficha" aria-expanded="false" aria-controls="gu-hoja">Guide</button>` +
      `<div class="gu-hoja" id="gu-hoja" role="region" aria-label="Guide" aria-live="polite">` +
      `<div class="gu-cab"><h2 class="gu-t" tabindex="-1">${esc(G.pregunta)}</h2>` +
      `<button type="button" class="ag-chip ficha gu-x" aria-label="Close guide">&times;</button></div>` +
      `<ul class="gu-l">${G.caminos.map((c) => `<li><a class="gu-c" href="${esc(c.destino)}" data-id="${esc(c.id)}"><span class="gu-ct"><b>${esc(c.ficha)}</b><span>${esc(c.ayuda)}</span></span><span class="gu-s">${esc(c.seccion)}</span></a></li>`).join("")}</ul>` +
      `<div class="gu-pie"><button type="button" class="ag-chip grande gu-no">Not now</button><span class="sello">Descriptive, not financial advice.</span></div></div>`;
    ficha = raiz.querySelector(".gu-ficha"); hoja = raiz.querySelector(".gu-hoja"); titulo = raiz.querySelector(".gu-t");
    if (N.rm) hoja.classList.add("gu-quieto");
    raiz.hidden = false;
    ficha.addEventListener("click", () => { descartada = true; poner(!arriba, true); });
    raiz.querySelector(".gu-x").addEventListener("click", () => cerrar(true, true));
    raiz.querySelector(".gu-no").addEventListener("click", () => cerrar(true, true));
    hoja.addEventListener("click", (e) => { const a = e.target.closest(".gu-c"); if (!a) return; guarda("guia", { cerrada: true, ultima: a.dataset.id }); descartada = true; poner(false, false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && arriba) cerrar(hoja.contains(document.activeElement), true); });
    let raf = 0; const tick = () => { raf = 0; acomoda(); sube(); };
    const pide = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener("scroll", pide, { passive: true }); addEventListener("resize", pide);
    document.addEventListener("naos:secuencia", pide);
    acomoda();
    if (!guarda("guia")?.cerrada) { setTimeout(() => { pasaron2s = true; pide(); }, 2000); }
  });
})();
