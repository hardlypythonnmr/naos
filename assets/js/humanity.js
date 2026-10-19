/* humanity.js · la portada desde el 19-oct: NAOS es Humanity (ya no hay dos puertas ni The Present; lo de antes está en
 * archivo/the-present/). Toma de v1plus.js solo lo de Humanity: Cella que respira en la placa, la cinta de conductas, Assets,
 * el anillo de respiración, el mantra y "This week". Necesita gsap, ScrollTrigger, assets/comun/naos.js, cella.js y sala.js. */
(async function () {
  const N = window.NAOS;
  const $ = (s, r = document) => r.querySelector(s);
  try {
    // Cella en la placa de Humanity: solo respira, con los ojos cerrados
    if (window.NAOS_CELLA && $("#cella-hum")) window.NAOS_CELLA($("#cella-hum"), { estado: "humanity", hacia: -1 });

    // Behavior: rasgos de los videos (data/rasgos.json), en flujo lento (G3: 60 px/s)
    try { const r = await (await fetch("data/rasgos.json")).json();
      if (r.rasgos?.length) { $("#cinta-conducta").hidden = false; N.cinta($("#cinta-conducta"), r.rasgos.map((x) => ({ s: x.rasgo, t: x.linea })), { rotulo: "Behavior", vel: 60, retraso: .1, aria: "Behavior tape: traits from the NAOS videos" }); }
    } catch (e) { /* sin rasgos, sin cinta */ }

    // Assets: biblioteca desde data/assets.json; lo planeado dice "Planned", nada se da por publicado
    try {
      const bib = await (await fetch("data/assets.json")).json();
      const chip = (e) => `<span class="chip chip-${e === "published" ? "published" : "planned"}">${e === "published" ? "Published" : "Planned"}</span>`;
      $("#bib").innerHTML = bib.categorias.map((c) => `<div class="bib-cat"><h3>${N.esc(c.titulo)}</h3><p class="bib-d">${N.esc(c.descripcion)}</p>` +
        `<ul class="bib-l">${c.piezas.map((x) => `<li class="bib-p"><span class="bib-chips">${chip(x.estado)}</span><h4>${x.pagina ? `<a href="pieza.html?id=${encodeURIComponent(x.id)}">${N.esc(x.titulo)}</a>` : N.esc(x.titulo)}</h4><p>${N.esc(x.descripcion)}</p></li>`).join("")}</ul></div>`).join("");
    } catch (e) { $("#assets").hidden = true; }

    // interludios
    N.tlRespira = N.respira($("#resp"), { etiqueta: $("#resp-t"), r: 60, min: .38 }); document.dispatchEvent(new Event("naos:respira"));
    N.leer($("#mantra"));

    N.semana($("#semana")).catch((e) => { console.error(e); $("#semana").hidden = true; });
    N.revelar(document);
    N.planos();
    N.entradas();
    N.suave("assets/vendor/lenis/lenis.min.js");
    window.__guion = { hasta: 99999 };
    await N.listo();
  } catch (e) { N.error(e); }
})();
