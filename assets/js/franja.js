/* franja.js · #secuencia, el primer bloque de The Present en la portada: la franja urgente (lote E, D-252).
 * Hoy y lo que sigue, desde la grilla (data/temas.json, su proyección pública): cada pieza de hoy con su hora en Nueva York (ET)
 * y en Medellín, su estado ("Out" con enlace en data/enlaces.json, si no "Coming") y el enlace a su tarjeta en su página de tema;
 * después la próxima pieza. Reemplaza al plan del mes de D-227 (data/semana.json ya no manda aquí).
 * Noticias y elecciones: solo fecha y tema hasta el sello I4 (D-252). Sin enlace no hay botón de video.
 * "Hoy" es el día de la grilla en Nueva York; ?hoy=AAAA-MM-DD es para probar. ?src=ig agrega el saludo.
 * Dos ediciones (D-253): en la portada EN las piezas en español enlazan a su tarjeta en es/temas/; con data-lang="es" (es/)
 * la franja habla en español, enlaza a es/temas/ y marca con lang="en" los títulos en inglés. El lang va solo en el título. */
(function () {
  "use strict";
  const el = document.getElementById("secuencia"); if (!el) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ES = el.dataset.lang === "es", raiz = el.dataset.raiz || "", LANG = ES ? "es" : "en";
  const MES = ES ? ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DIA = ES ? ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fe = (f) => { const t = new Date(f + "T12:00:00Z"); return `${DIA[t.getUTCDay()]} ${t.getUTCDate()} ${MES[t.getUTCMonth()]}`; };
  const X = ES ? {
    titulo: "Hoy y lo próximo", ver: "Mira los <a href=\"temas/\">temas</a> o la <a href=\"" + raiz + "agenda.html\" hreflang=\"en\">agenda</a> (en inglés).", nada: "Todavía no hay nada programado.", error: "No se pudieron cargar las piezas de hoy.",
    hoy: "Hoy", sigue: "Después", de: (i, n) => `${i} de ${n}, `, abre: "se abre en una pestaña nueva", voz: "Voz: sintética", mercado: "Descriptivo, sin asesoría financiera", salio: "Publicada", proximo: "Próximamente",
    enOtro: "En inglés", voces: (xs) => "Voces: " + xs.map((l) => ({ en: "inglés", es: "español" }[l])).join(", después "), noticia: "Noticias",
    sub: "Horas de Nueva York (ET) y Medellín. Cada pieza enlaza a su página de tema.", ig: "¿Lo viste en Instagram? Aquí está hoy, en el orden en que publicamos.",
    nadaHoy: (f, h) => `Hoy no sale nada. Próxima: ${f}, ${h} ET.`, pie: `Desde la grilla de NAOS. Una pieza dice «Publicada», con sus enlaces, cuando sale. <a href="temas/">Todos los temas</a> · <a href="${raiz}agenda.html" hreflang="en">Agenda (en inglés)</a>`,
    formato: { "short+reel": "Short y Reel", medio: "Video mediano en YouTube", carrusel: "Carrusel de Instagram", historia: "Historia de Instagram", es: "Short y Reel en español" },
  } : {
    titulo: "Today and next", ver: "See <a href=\"temas/\">Topics</a> or <a href=\"agenda.html\">Upcoming</a>.", nada: "Nothing is scheduled yet.", error: "Could not load today's pieces.",
    hoy: "Today", sigue: "Next", de: (i, n) => `${i} of ${n}, `, abre: "opens in a new tab", voz: "Voice: synthetic", mercado: "Descriptive, not financial advice", salio: "Out", proximo: "Coming",
    enOtro: "In Spanish", voces: (xs) => "Voices: " + xs.map((l) => ({ en: "English", es: "Spanish" }[l])).join(", then "), noticia: "News",
    sub: "Times in New York (ET) and Medellín. Each piece links to its topic page.", ig: "Seen on Instagram? Here is today in the order we post it.",
    nadaHoy: (f, h) => `Nothing out today. Next: ${f}, ${h} ET.`, pie: 'From the NAOS grid. A piece shows "Out" with its links once it is published. <a href="temas/">All topics</a> · <a href="agenda.html">Upcoming</a>',
    formato: null,
  };
  const q = new URLSearchParams(location.search);
  const diaNY = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const hoy = /^\d{4}-\d{2}-\d{2}$/.test(q.get("hoy") || "") ? q.get("hoy") : diaNY(new Date());
  const YT_OK = /^https:\/\/(www\.youtube\.com|youtu\.be)\//, IG_OK = /^https:\/\/www\.instagram\.com\//;
  const aviso = (txt) => { el.innerHTML = `<section class="fr" aria-labelledby="fr-t"><div class="fr-in"><h2 class="fr-t" id="fr-t">${X.titulo}</h2>` +
    `<p class="fr-sub" role="status">${txt} ${X.ver}</p></div></section>`; };

  // esqueleto con la misma estructura que la franja final, para que nada salte
  const esq = '<li class="fr-f fr-esq"><span class="fr-h num">&nbsp;</span><span class="fr-n">&nbsp;</span><span class="fr-m sello">&nbsp;</span></li>';
  el.innerHTML = '<div class="fr fr-carga" aria-hidden="true"><div class="fr-in"><h2 class="fr-t">&nbsp;</h2><p class="fr-sub">&nbsp;</p><ol class="fr-l">' + esq + esq + esq + '</ol><p class="sello fr-s">&nbsp;</p></div></div>'; el.hidden = false;

  Promise.all([
    fetch(raiz + "data/temas.json").then((r) => r.json()),
    fetch(raiz + "data/enlaces.json").then((r) => r.json()).catch(() => ({ piezas: {} })),
  ]).then(([D, enl]) => {
    const piezas = (D.piezas || []).slice().sort((a, b) => a.utc.localeCompare(b.utc));
    const pag = Object.fromEntries((D.paginas || []).map((p) => [p.slug, p]));
    const enlace = (x) => { const e = ((enl && enl.piezas) || {})[x.fecha + "|" + x.codigo]; return e && YT_OK.test(e.yt || "") ? e : null; };
    const deHoy = piezas.filter((x) => x.fecha === hoy);
    const proxima = piezas.find((x) => x.fecha > hoy);
    if (!deHoy.length && !proxima) { aviso(X.nada); return; }
    const fichas = deHoy.map((x) => ({ x, hoy: true })).concat(proxima ? [{ x: proxima }] : []);
    const titPag = (p) => (ES ? p.titulo_es || p.titulo : p.titulo);
    const formato = (x) => (X.formato && X.formato[x.canal]) || x.formato;
    const nombre = (x) => (x.noticia ? (pag[x.pagina] && pag[x.pagina].pilar === "news" ? X.noticia + ": " + titPag(pag[x.pagina]) : X.noticia) : x.titulo || formato(x));
    // la tarjeta de una pieza en español vive en la edición ES; en la portada EN se enlaza allá
    const bil = (x) => (x.idiomas || []).length > 1;
    const ruta = (x) => (!ES && x.lang === "es" && !bil(x) ? "es/" : "") + `temas/${encodeURIComponent(x.pagina)}/#${encodeURIComponent(x.id)}`;
    const lista = fichas.map((f, i) => {
      const x = f.x, e = enlace(x), href = ruta(x), t = esc(nombre(x));
      const langT = x.titulo && !x.noticia && x.lang !== LANG ? ` lang="${x.lang}"` : "";
      // fila de horario (pase de arte 16-oct): el día se nombra una vez ("Today" en la primera de hoy, "Next" con su fecha),
      // la hora en ET y Medellín en su columna, el título es el enlace a su tarjeta; YouTube e Instagram solo si ya salió
      const primera = !f.hoy || i === 0;
      const marca = `<span class="fr-tag${primera ? "" : " sr"}">${f.hoy ? X.hoy : X.sigue}</span>${f.hoy ? "" : `<span class="fr-w">${esc(fe(x.fecha))}</span>`}`;
      const cuando = `<span class="fr-w">${esc(x.hora_et)} ET</span><span class="fr-w">${esc(x.hora_medellin)} Medellín</span>`;
      const botones = e ? `<span class="fr-e"><a class="ag-chip ficha fr-a" href="${esc(e.yt)}" target="_blank" rel="noopener" aria-label="${t}, YouTube, ${X.abre}">YouTube</a>` +
        (IG_OK.test(e.ig || "") ? `<a class="ag-chip ficha fr-a" href="${esc(e.ig)}" target="_blank" rel="noopener" aria-label="${t}, Instagram, ${X.abre}">Instagram</a>` : "") + `</span>` : "";
      const meta = [formato(x), bil(x) ? X.voces(x.idiomas) : x.lang !== LANG && x.canal !== "es" ? (ES ? X.enOtro : "") : "", x.voz ? X.voz : "", x.mercado ? X.mercado : "", e ? X.salio : X.proximo].filter(Boolean).join(". ");
      return `<li class="fr-f${f.hoy ? " fr-hoy" : ""}${primera ? "" : " fr-sigue"}">` +
        `<span class="fr-h num">${marca}${cuando}</span>` +
        `<span class="fr-c"><a class="fr-n" href="${href}"><span class="sr">${X.de(i + 1, fichas.length)}</span><span${langT}>${t}</span></a>` +
        `<span class="fr-m sello">${esc(meta)}</span></span>${botones}</li>`;
    }).join("");
    let sub = q.get("src") === "ig" ? X.ig : X.sub;
    if (!deHoy.length) sub = X.nadaHoy(esc(fe(proxima.fecha)), esc(proxima.hora_et));
    el.innerHTML = `<section class="fr" aria-labelledby="fr-t"><div class="fr-in">` +
      `<h2 class="fr-t" id="fr-t">${X.titulo}</h2><p class="fr-sub">${sub}</p>` +
      `<ol class="fr-l" aria-label="${X.titulo}">${lista}</ol>` +
      `<p class="sello fr-s">${X.pie}</p></div></section>`;
    document.dispatchEvent(new CustomEvent("naos:secuencia"));
  }).catch(() => aviso(X.error));
})();
