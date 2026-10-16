/* franja.js · #secuencia, el primer bloque de The Present en la portada: la franja urgente (lote E, D-252).
 * Hoy y lo que sigue, desde la grilla (data/temas.json, su proyección pública): cada pieza de hoy con su hora en Nueva York (ET)
 * y en Medellín, su estado ("Out" con enlace en data/enlaces.json, si no "Coming") y el enlace a su tarjeta en su página de tema;
 * después la próxima pieza. Reemplaza al plan del mes de D-227 (data/semana.json ya no manda aquí).
 * Noticias y elecciones: solo fecha y tema hasta el sello I4 (D-252). Sin enlace no hay botón de video.
 * "Hoy" es el día de la grilla en Nueva York; ?hoy=AAAA-MM-DD es para probar. ?src=ig agrega el saludo. */
(function () {
  "use strict";
  const el = document.getElementById("secuencia"); if (!el) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], DIA = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fe = (f) => { const t = new Date(f + "T12:00:00Z"); return `${DIA[t.getUTCDay()]} ${t.getUTCDate()} ${MES[t.getUTCMonth()]}`; };
  const q = new URLSearchParams(location.search);
  const diaNY = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const hoy = /^\d{4}-\d{2}-\d{2}$/.test(q.get("hoy") || "") ? q.get("hoy") : diaNY(new Date());
  const YT_OK = /^https:\/\/(www\.youtube\.com|youtu\.be)\//, IG_OK = /^https:\/\/www\.instagram\.com\//;
  const aviso = (txt) => { el.innerHTML = `<section class="fr" aria-labelledby="fr-t"><div class="fr-in"><h2 class="fr-t" id="fr-t">Today and next</h2>` +
    `<p class="fr-sub" role="status">${txt} See <a href="temas/">Topics</a> or <a href="agenda.html">Upcoming</a>.</p></div></section>`; };

  // esqueleto con la misma estructura que la franja final, para que nada salte
  const esq = '<li class="fr-f fr-esq"><span class="fr-h num">&nbsp;</span><span class="fr-n">&nbsp;<br>&nbsp;</span><span class="fr-e"><span class="ag-chip ficha fr-a">&nbsp;</span></span></li>';
  el.innerHTML = '<div class="fr fr-carga" aria-hidden="true"><div class="fr-in"><h2 class="fr-t">&nbsp;</h2><p class="fr-sub">&nbsp;</p><ol class="fr-l">' + esq + esq + esq + '</ol><p class="sello fr-s">&nbsp;</p></div></div>'; el.hidden = false;

  Promise.all([
    fetch("data/temas.json").then((r) => r.json()),
    fetch("data/enlaces.json").then((r) => r.json()).catch(() => ({ piezas: {} })),
  ]).then(([D, enl]) => {
    const piezas = (D.piezas || []).slice().sort((a, b) => a.utc.localeCompare(b.utc));
    const pag = Object.fromEntries((D.paginas || []).map((p) => [p.slug, p]));
    const enlace = (x) => { const e = ((enl && enl.piezas) || {})[x.fecha + "|" + x.codigo]; return e && YT_OK.test(e.yt || "") ? e : null; };
    const deHoy = piezas.filter((x) => x.fecha === hoy);
    const proxima = piezas.find((x) => x.fecha > hoy);
    if (!deHoy.length && !proxima) { aviso("Nothing is scheduled yet."); return; }
    const fichas = deHoy.map((x) => ({ x, hoy: true })).concat(proxima ? [{ x: proxima }] : []);
    const nombre = (x) => (x.noticia ? (pag[x.pagina] && pag[x.pagina].pilar === "news" ? "News: " + pag[x.pagina].titulo : "News") : x.titulo || x.formato);
    const lista = fichas.map((f, i) => {
      const x = f.x, e = enlace(x), href = `temas/${encodeURIComponent(x.pagina)}/#${encodeURIComponent(x.id)}`, t = esc(nombre(x));
      const marca = `<span class="fr-tag">${f.hoy ? "Today" : "Next"}</span>`;
      const cuando = `${f.hoy ? "" : esc(fe(x.fecha)) + " · "}${esc(x.hora_et)} ET · ${esc(x.hora_medellin)} Medellín · ${e ? "Out" : "Coming"}`;
      const botones = (e ? `<a class="ag-chip ficha fr-a" href="${esc(e.yt)}" target="_blank" rel="noopener" aria-label="${t}, YouTube, opens in a new tab">YouTube</a>` +
        (IG_OK.test(e.ig || "") ? `<a class="ag-chip ficha fr-a" href="${esc(e.ig)}" target="_blank" rel="noopener" aria-label="${t}, Instagram, opens in a new tab">Instagram</a>` : "") : "") +
        `<a class="ag-chip ficha fr-a" href="${href}" aria-label="${t}, on its topic page">Its page</a>`;
      return `<li class="fr-f${f.hoy ? " fr-hoy" : ""}">` +
        `<span class="fr-h num">${marca}${cuando}</span>` +
        `<span class="fr-n"${x.lang === "es" ? ' lang="es"' : ""}><span class="sr">${i + 1} of ${fichas.length}, </span>${t}</span>` +
        `<span class="fr-m sello">${esc(x.formato)}${x.voz ? " · Voice: synthetic" : ""}${x.mercado ? " · Descriptive, not financial advice" : ""}</span>` +
        `<span class="fr-e">${botones}</span></li>`;
    }).join("");
    let sub = q.get("src") === "ig" ? "Seen on Instagram? Here is today in the order we post it." : "Times in New York (ET) and Medellín. Each piece links to its topic page.";
    if (!deHoy.length) sub = `Nothing out today. Next: ${esc(fe(proxima.fecha))}, ${esc(proxima.hora_et)} ET.`;
    el.innerHTML = `<section class="fr" aria-labelledby="fr-t"><div class="fr-in">` +
      `<h2 class="fr-t" id="fr-t">Today and next</h2><p class="fr-sub">${sub}</p>` +
      `<ol class="fr-l" aria-label="Today and next">${lista}</ol>` +
      `<p class="sello fr-s">From the NAOS grid. A piece shows "Out" with its links once it is published. <a href="temas/">All topics</a> · <a href="agenda.html">Upcoming</a></p></div></section>`;
    document.dispatchEvent(new CustomEvent("naos:secuencia"));
  }).catch(() => aviso("Could not load today's pieces."));
})();
