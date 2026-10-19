/* guia.js · #guia: la hoja de la guía (3 fichas-enlace a Market, AI y News) y la ficha "Guide" (PAG-09.3, lunes 19-oct).
 * La hoja abre sola solo en la portada (D-252, corrige el "en todas partes" de D-236): llegada limpia, sin ancla ni consulta (?src=, ?sala=, ?utm_*),
 * y al entrar a The Present, donde vive. Nunca en páginas de tema. Un velo de tinta opaca lo demás
 * mientras está arriba ("deberia aparecer opacando lo demas para que pueda ser utilizada") y el foco va al título; tocar el velo la cierra.
 * "Not now", la X y Esc la bajan y dejan la ficha. Mientras está arriba, scroll-padding-bottom iguala su alto (WCAG 2.4.11: nada enfocado queda tapado).
 * Guarda en el navegador solo naos:guia = { cerrada, ultima } con N.guarda (try/catch adentro). Los destinos salen de data/guia.json; si no carga, estos mismos. */
(function () {
  "use strict";
  const raiz = document.getElementById("guia"); if (!raiz) return;
  const N = window.NAOS || {}, guarda = N.guarda || (() => null);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const DEF = { pregunta: "What brings you here?", caminos: [
    { id: "market", ficha: "See what moves today", ayuda: "Today's brief and its sources", destino: "#mercados", seccion: "Market" },
    { id: "ai", ficha: "Learn one thing", ayuda: "A short lesson, no jargon", destino: "#ia", seccion: "AI" },
    { id: "news", ficha: "Explore a topic", ayuda: "Pick a theme and follow it", destino: "#noticias", seccion: "News" }] };
  const valido = (g) => g && g.pregunta && Array.isArray(g.caminos) && g.caminos.length === 3 &&
    g.caminos.every((c) => c.ficha && c.ayuda && c.seccion && /^#[\w-]+$/.test(c.destino) && document.querySelector(c.destino));
  const html = document.documentElement, secuencia = document.getElementById("secuencia");
  let hoja, ficha, titulo, velo, arriba = false, descartada = false, fin = false;

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
    arriba = si; hoja.classList.toggle("gu-abierta", si); velo.hidden = !si; ficha.setAttribute("aria-expanded", String(si));
    if (si) tope();
    ficha.classList.toggle("gu-oculta", si); padding();
    if (foco) (si ? titulo : ficha).focus({ preventScroll: true });
  };
  const cerrar = (foco, guardar) => { descartada = true; if (guardar) guarda("guia", Object.assign(guarda("guia") || {}, { cerrada: true })); poner(false, foco); };
  // la ficha sube sobre la cinta (NAOS Tape) en vez de taparla
  const acomoda = () => {
    let b = 16; const h = innerHeight;
    document.querySelectorAll(".cinta").forEach((c) => { const r = c.getBoundingClientRect(); if (r.top < h && r.bottom > h - 76) b = Math.max(b, h - r.top + 12); });
    ficha.style.bottom = b + "px";
    if (arriba) tope();
    padding();
  };
  // D-252: la hoja abre sola solo si se llegó a la portada limpia (sin ancla, sin ?src= de un Short, sin ?sala=); nunca en las
  // páginas de tema (no cargan este archivo). Con las dos puertas (puertas.js) la guía vive en The Present: abre al entrar ahí,
  // nunca encima de las puertas. La ficha "Guide" queda en The Present para abrirla a mano en cualquier llegada.
  // cualquier cadena de consulta (?src=, ?sala=, ?utm_*, ...) cuenta como llegada con destino; solo las de prueba (quieto, captura, hoy) no
  const llegadaLimpia = !location.hash && [...new URLSearchParams(location.search).keys()].every((k) => ["quieto", "captura", "hoy"].includes(k)) && /(^|\/)(index\.html)?$/.test(location.pathname);
  const enPresent = () => !document.getElementById("doors") || html.getAttribute("data-u") === "present";
  const sube = () => { if (descartada || arriba || fin || !llegadaLimpia || !enPresent()) return; fin = true; poner(true, true); };

  Promise.race([fetch("data/guia.json").then((r) => r.json()).catch(() => null), new Promise((r) => setTimeout(r, 400, null))]).then((g) => {
    const G = valido(g) ? g : DEF;
    raiz.innerHTML = `<div class="gu-velo" hidden></div><button type="button" class="ag-chip ficha gu-ficha" aria-expanded="false" aria-controls="gu-hoja">Guide</button>` +
      `<div class="gu-hoja" id="gu-hoja" role="region" aria-label="Guide">` +
      `<div class="gu-cab"><h2 class="gu-t" tabindex="-1">${esc(G.pregunta)}</h2>` +
      `<button type="button" class="ag-chip ficha gu-x" aria-label="Close guide">&times;</button></div>` +
      `<ul class="gu-l">${G.caminos.map((c) => `<li><a class="gu-c" href="${esc(c.destino)}" data-id="${esc(c.id)}"><span class="gu-ct"><b>${esc(c.ficha)}</b><span>${esc(c.ayuda)}</span></span><span class="gu-s">${esc(c.seccion)}</span></a></li>`).join("")}</ul>` +
      `<div class="gu-pie"><button type="button" class="ag-chip grande gu-no">Not now</button><span class="sello">Descriptive, not financial advice.</span></div></div>`;
    velo = raiz.querySelector(".gu-velo"); velo.addEventListener("click", () => cerrar(true, true));
    ficha = raiz.querySelector(".gu-ficha"); hoja = raiz.querySelector(".gu-hoja"); titulo = raiz.querySelector(".gu-t");
    if (N.rm) hoja.classList.add("gu-quieto");
    raiz.hidden = false;
    ficha.addEventListener("click", () => { descartada = true; poner(!arriba, true); });
    raiz.querySelector(".gu-x").addEventListener("click", () => cerrar(true, true));
    raiz.querySelector(".gu-no").addEventListener("click", () => cerrar(true, true));
    // Lenis (anchors) anima hacia una posición calculada antes de que las secciones fijadas con GSAP muevan el destino: se salta sin animar y se repite hasta que el destino quede arriba
    const ir = (sel) => {
      const t = document.querySelector(sel); if (!t) return; let n = 0;
      html.style.scrollBehavior = "auto";
      const paso = () => { if (N.lenis && N.lenis.scrollTo) N.lenis.scrollTo(t, { immediate: true, force: true }); else t.scrollIntoView({ block: "start" }); if (++n < 10 && Math.abs(t.getBoundingClientRect().top) > 2) setTimeout(paso, 120); else { html.style.scrollBehavior = ""; history.pushState(null, "", sel); } };
      paso();
    };
    hoja.addEventListener("click", (e) => { const a = e.target.closest(".gu-c"); if (!a) return; e.preventDefault(); guarda("guia", { cerrada: true, ultima: a.dataset.id }); descartada = true; poner(false, false); ir(a.getAttribute("href")); });
    // Chrome no desplaza al enfocar algo que ya está en pantalla aunque quede bajo la hoja o la ficha: se sube lo justo
    document.addEventListener("focusin", (e) => {
      const t = e.target, tapa = arriba ? hoja : ficha; if (!t || t === document.body || tapa.contains(t) || ficha.contains(t)) return;
      const r = t.getBoundingClientRect(), c = tapa.getBoundingClientRect();
      if (r.width === 0 || r.right <= c.left || r.left >= c.right || r.bottom <= c.top || r.top >= c.bottom) return;
      scrollBy({ top: Math.min(r.bottom - c.top + 16, Math.max(r.top - 8, 0)), behavior: "instant" });
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && arriba) cerrar(hoja.contains(document.activeElement), true); });
    let raf = 0; const tick = () => { raf = 0; acomoda(); sube(); };
    const pide = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener("scroll", pide, { passive: true }); addEventListener("resize", pide);
    document.addEventListener("naos:secuencia", pide);
    document.addEventListener("naos:universo", pide);
    acomoda();
    sube();
  });
})();
