/* franja.js · #secuencia, el primer bloque de la portada (PROD-08.8): el Short y el Reel de hoy, con el enlace de cada plataforma.
 * Lee data/semana.json (qué piezas con video hay y a qué hora) y data/enlaces.json (el yt y el ig de lo ya publicado; lo escribe una sola mano).
 * Sin enlace no hay botón: la ficha dice "Next". Si hoy no hay nada publicado se muestra la última pieza publicada; si tampoco hay, la próxima con fecha.
 * Nunca un hueco: solo si semana.json no carga se muestra el aviso con un enlace a la semana. ?src=ig agrega el saludo; ?hoy=AAAA-MM-DD es para probar. */
(function () {
  "use strict";
  const el = document.getElementById("secuencia"); if (!el) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], DIA = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fe = (f) => { const t = new Date(f + "T12:00:00Z"); return `${DIA[t.getUTCDay()]} ${t.getUTCDate()} ${MES[t.getUTCMonth()]}`; };
  const q = new URLSearchParams(location.search);
  // "hoy" es el día de la grilla (hora de Nueva York, la zona de los briefs de mercado), no el día UTC: pasadas las 19:00 en Colombia el UTC ya es mañana
  const diaGrilla = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const hoy = /^\d{4}-\d{2}-\d{2}$/.test(q.get("hoy") || "") ? q.get("hoy") : diaGrilla();
  const deIg = q.get("src") === "ig";
  const clave = (x) => x.dia + "|" + (x.slot || x.asset_id);
  const esVideo = (x) => x.dia && (x.video === true || x.format === "short");
  const URL_OK = /^https:\/\/(www\.youtube\.com|youtu\.be|www\.instagram\.com)\//;
  const ENL = '<a href="agenda.html">Upcoming</a>';
  const RE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/; // la misma forma que valida validar.mjs
  const esViejo = (iso, horas) => Date.now() - Date.parse(iso) > horas * 36e5;
  const aviso = (txt) => { el.innerHTML = `<section class="fr" aria-labelledby="fr-t"><div class="fr-in"><h2 class="fr-t" id="fr-t">Today's Short</h2>` +
    `<p class="fr-sub" role="status">${txt} See <a href="#semana">This week</a> or ${ENL}.</p></div></section>`; };

  // esqueleto del alto de una ficha mientras llegan los datos (sin salto de layout)
  el.innerHTML = '<div class="fr fr-carga" aria-hidden="true"><div class="fr-in"><div class="fr-esq"></div></div></div>'; el.hidden = false;

  Promise.all([
    fetch("data/semana.json").then((r) => r.json()),
    fetch("data/enlaces.json").then((r) => r.json()).catch(() => ({ piezas: {} })),
  ]).then(([sem, enl]) => {
    // con la grilla de más de 72 h no se pintan fichas "Next" ni "Published" como si fueran actuales
    if (RE_ISO.test(sem.generado || "") && esViejo(sem.generado, 72)) { aviso("The schedule is out of date."); return; }
    const piezas = (enl && enl.piezas) || {}, items = (sem.items || []).filter(esVideo);
    const enlace = (x) => { const e = piezas[clave(x)]; return e && URL_OK.test(e.yt || "") ? e : null; };
    const hora = (x) => x.hora_utc || x.dia + "T23:59Z";
    const deHoy = items.filter((x) => x.dia === hoy).sort((a, b) => hora(a).localeCompare(hora(b)));
    const publicadas = items.filter(enlace).sort((a, b) => (enlace(b).publicado_utc || b.dia).localeCompare(enlace(a).publicado_utc || a.dia));
    const proxima = items.filter((x) => x.dia >= hoy && !enlace(x)).sort((a, b) => hora(a).localeCompare(hora(b)))[0];
    // qué fichas: lo de hoy; si hoy nada tiene enlace, la última publicada; si no hay ninguna, la próxima con fecha
    let fichas = deHoy.map((x) => ({ x, e: enlace(x), hoy: true }));
    const ultima = publicadas.find((x) => x.dia !== hoy);
    if (!fichas.some((f) => f.e)) {
      if (ultima) fichas = [{ x: ultima, e: enlace(ultima), ultima: true }].concat(fichas);
      else if (!fichas.length && proxima) fichas = [{ x: proxima, e: null }];
    }
    if (!fichas.length) throw new Error("sin piezas");

    const vivo = (f) => (f.e && f.e.publicado_utc ? ` data-live="${esc(f.e.publicado_utc)}"` : "");
    const marca = (f) => (f.hoy ? '<span class="fr-tag">Today</span>' : f.ultima ? '<span class="fr-tag">Latest</span>' : "");
    const cuando = (f) => (f.e ? "Published" : "Next · " + (f.x.dia === hoy ? "" : fe(f.x.dia) + " · ") + esc(f.x.hora_local || "time to be confirmed"));
    const enl2 = (f) => {
      const t = esc(f.x.title);
      if (!f.e) return `<span class="fr-prox sello">Not out yet. No link until it is published.</span>`;
      return `<a class="ag-chip ficha fr-a" href="${esc(f.e.yt)}" target="_blank" rel="noopener" aria-label="${t}, Short, opens in a new tab">Short</a>` +
        (f.e.ig && URL_OK.test(f.e.ig) ? `<a class="ag-chip ficha fr-a" href="${esc(f.e.ig)}" target="_blank" rel="noopener" aria-label="${t}, Reel, opens in a new tab">Reel</a>` : "");
    };
    const lista = fichas.map((f, i) => `<li class="fr-f${f.hoy ? " fr-hoy" : ""}"${vivo(f)}>` +
      `<span class="fr-h num">${marca(f)}${cuando(f)}</span>` +
      `<span class="fr-n"><span class="sr">${i + 1} of ${fichas.length}, </span>${esc(f.x.title)}</span>` +
      `<span class="fr-e">${enl2(f)}</span></li>`).join("");

    const todosIg = fichas.every((f) => f.e && f.e.ig);
    let sub = deIg ? "Seen on Instagram? Here is today in the order we post it." : todosIg ? "Same sequence on YouTube Shorts and Instagram Reels." : "Videos on YouTube Shorts and Instagram Reels.";
    if (proxima && proxima.dia === hoy && !fichas.some((f) => f.hoy && f.e)) sub = "Today's video comes out at " + esc(proxima.hora_local || "a time to be confirmed") + ". No link until then.";
    else if (!fichas.some((f) => f.hoy && f.e) && proxima) sub = "Nothing new today. Next: " + fe(proxima.dia) + (proxima.hora_local ? ", " + esc(proxima.hora_local) : "") + ".";
    const gen = RE_ISO.test(sem.generado || "") ? sem.generado : "", viejo = gen && esViejo(gen, 24);
    const sello = gen ? `<p class="sello fr-s${viejo ? " fr-viejo" : ""}">${esc(`Schedule: NAOS grid, updated ${Number(gen.slice(8, 10))} ${MES[+gen.slice(5, 7) - 1]} ${gen.slice(0, 4)} · ${gen.slice(11, 16)} UTC. Links: what is already published.`)}</p>` : "";

    el.innerHTML = `<section class="fr" aria-labelledby="fr-t"><div class="fr-in">` +
      `<h2 class="fr-t" id="fr-t">Today's Short</h2><p class="fr-sub">${sub}</p>` +
      `<ol class="fr-l" aria-label="Today's sequence">${lista}</ol>${sello}</div></section>`;
    document.dispatchEvent(new CustomEvent("naos:secuencia"));
  }).catch(() => aviso("Could not load the sequence."));
})();
