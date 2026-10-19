/* semana.js · "This week" de la portada (antes al final de sala.js; la sala de monitoreo de The Present salió con D-263). Necesita assets/comun/naos.js. */
/* ================= esta semana (lote E, D-252): la semana de la grilla, día por día, desde data/temas.json =================
 * Reemplaza al plan del mes de D-227. Cada pieza enlaza a su tarjeta en su página de tema; hora en Nueva York (ET).
 * Noticias y elecciones: solo fecha y tema (D-252). Abre en la semana de hoy (ET); antes de la grilla, la primera. */
(function () {
  const N = window.NAOS, esc = (s) => N.esc(s ?? "");
  const DIA = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const diaTxt = (f) => { const t = new Date(f + "T12:00:00Z"); return `${DIA[t.getUTCDay()]} ${t.getUTCDate()} ${MES[t.getUTCMonth()]}`; };
  const masDias = (f, n) => new Date(Date.parse(f + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
  const lunes = (f) => masDias(f, -((new Date(f + "T12:00:00Z").getUTCDay() + 6) % 7));
  N.semana = async (el) => {
    let D;
    try { D = await (await fetch("data/temas.json")).json(); } catch (e) { el.hidden = true; return; }
    const piezas = (D.piezas || []).slice().sort((a, b) => a.utc.localeCompare(b.utc));
    if (!piezas.length) { el.hidden = true; return; }
    const pag = Object.fromEntries((D.paginas || []).map((p) => [p.slug, p]));
    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const semanas = [...new Set(piezas.map((x) => lunes(x.fecha)))];
    let w = semanas.indexOf(lunes(hoy)); if (w < 0) w = hoy < semanas[0] ? 0 : semanas.length - 1;
    const nombre = (x) => (x.noticia ? (pag[x.pagina] && pag[x.pagina].pilar === "news" ? "News: " + pag[x.pagina].titulo : "News") : x.titulo || x.formato);
    const rango = (l) => `${diaTxt(l)} to ${diaTxt(masDias(l, 6))}`;
    const pintar = () => {
      const l = semanas[w], dias = Array.from({ length: 7 }, (_, i) => masDias(l, i));
      el.querySelector(".gs-dias").innerHTML = dias.map((f) => {
        const xs = piezas.filter((x) => x.fecha === f); if (!xs.length) return "";
        return `<div class="gs-d${f === hoy ? " gs-hoy" : ""}"><h3 class="gs-dt cond">${f === hoy ? "Today, " : ""}${diaTxt(f)}</h3><ul class="gs-l">` + xs.map((x) =>
          `<li class="gs-i sec-behavior"><a class="sf" href="${x.lang === "es" && !(x.idiomas || []).length ? "es/" : ""}temas/${encodeURIComponent(x.pagina)}/#${encodeURIComponent(x.id)}"><span class="gs-h num">${esc(x.hora_et)} ET</span><span class="sf-t"${x.lang === "es" ? ' lang="es"' : ""}>${esc(nombre(x))}</span></a><span class="gs-s cond">${esc(x.seccion)}</span></li>`).join("") + `</ul></div>`;
      }).join("");
      el.querySelector(".sem-sello").textContent = rango(l);
      el.querySelector(".sem-w").textContent = `Week ${w + 1} of ${semanas.length} · ${rango(l)}`;
      el.querySelector("[data-w='-1']").disabled = w === 0; el.querySelector("[data-w='1']").disabled = w === semanas.length - 1;
    };
    const nav = `<div class="sem-nav" role="group" aria-label="Choose the week"><button type="button" class="sem-b" data-w="-1"><span aria-hidden="true">&larr;</span> Previous week</button>` +
      `<p class="sem-w cond" aria-live="polite"></p><button type="button" class="sem-b" data-w="1">Next week <span aria-hidden="true">&rarr;</span></button></div>`;
    el.querySelector(".sem-in").innerHTML = nav + `<div class="gs-dias"></div>` +
      `<p class="sello">From the NAOS grid. Times in New York (ET). Everything here is planned until it is out. Voice: synthetic on every Short, Reel and video. Markets pieces are descriptive, not financial advice. Spanish pieces link to <a href="es/temas/" hreflang="es" lang="es">NAOS en español</a>. <a href="temas/">All topics</a> · <a href="agenda.html">The year ahead in Upcoming</a>.</p>`;
    el.querySelector(".sem-nav").addEventListener("click", (e) => { const b = e.target.closest("[data-w]"); if (!b || b.disabled) return; w += +b.dataset.w; pintar();
      if (b.disabled) el.querySelector(`[data-w='${-b.dataset.w}']`).focus(); });
    pintar();
  };
})();
