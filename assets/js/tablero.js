/* tablero.js · la portada desde D-270: un calendario lunar de noche que se lee quieto. 18 casillas, las mismas a 390 y a 1280:
 * el centro (Humanity, Cella, "Closer to yourself."), la luna de hoy, Breathe, las cinco bases (nombre y cifra juntos), Topics, Upcoming, Assets
 * y los 7 días de la semana, cada uno con su fase. Sin apertura animada: el tablero aparece ya compuesto; el único movimiento de la capa de arriba
 * es Cella. Sirve a las dos ediciones (html lang="en" y "es"). Necesita naos.js, figura.js, cella.js, luna.js y, en la EN, semana.js y agenda-comun.js.
 * Datos: data/temas.json (la semana, las bases, Topics), data/assets.json, data/agenda.json (la lista de Upcoming de abajo) y data/luna.json.
 * Parámetros de prueba: ?hoy=AAAA-MM-DD (el día de hoy), ?quieto (sin movimiento), ?registro (anota los cambios de ojos en window.__ojos). */
(async function () {
  "use strict";
  const N = window.NAOS; if (!N) return;
  const A = window.NAOS_AGENDA, LU = window.NAOS_LUNA;
  const $ = (s, r = document) => r.querySelector(s), esc = (s) => N.esc(s ?? "");
  // un reintento: al salir de la página a medio cargar el navegador aborta el fetch, y eso no es un error de la página
  const pide = (u) => fetch(u).then((r) => r.json());
  const get = (u) => pide(u).catch(() => new Promise((ok) => setTimeout(() => pide(u).then(ok, () => ok(null)), 300)));
  const ES = document.documentElement.lang === "es", lang = ES ? "es" : "en";
  const RAIZ = document.currentScript ? new URL("../../", document.currentScript.src).href : "";   // la raíz del sitio, desde donde se pida el dato
  const R = ES ? "../" : "";                                                                        // y el prefijo de lo que vive en la raíz (la edición ES está en es/)
  const q = new URLSearchParams(location.search);

  const T = {
    en: {
      centro: "Humanity", frase: "Closer to yourself.", resp: "Breathe", respT: "Four in, four out.", up: "Upcoming", upT: "The year ahead", top: "Topics", as: "Assets",
      pieza: { one: "piece", other: "pieces" }, semana: "this week", paginas: "topic pages", planeadas: "planned", hoy: "today", lit: "lit", edad: "moon age", dias: "days", dia1: "day",
      bases: { eat: "Eat well", sleep: "Sleep well", move: "Get moving", community: "Community", "the-divine": "The Divine" },
      DIA: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MES: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      proxLlena: "Full", proxNueva: "New", hora: "Colombia time", pct: (n) => n + "%", lunaT: "The moon today", pausaLinea: "Pause Cella",
      inh: "Inhale", exh: "Exhale", pausada: "Paused", ambos: "Inhale 4, exhale 4",
    },
    es: {
      centro: "Humanidad", frase: "Más cerca de ti.", resp: "Respira", respT: "Cuatro adentro, cuatro afuera.", up: "Agenda", upT: "El año por delante", top: "Temas", as: "Assets",
      pieza: { one: "pieza", other: "piezas" }, semana: "esta semana", paginas: "páginas de tema", planeadas: "planeadas", hoy: "hoy", lit: "iluminada", edad: "edad de la luna", dias: "días", dia1: "día",
      bases: { eat: "Come bien", sleep: "Duerme bien", move: "Muévete", community: "Comunidad", "the-divine": "Lo divino" },
      DIA: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"], MES: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
      proxLlena: "Llena", proxNueva: "Nueva", hora: "hora de Colombia", pct: (n) => n + " %", lunaT: "La luna de hoy", pausaLinea: "Pause Cella",
      inh: "Inhala", exh: "Exhala", pausada: "En pausa", ambos: "Inhala 4, exhala 4",
    },
  }[lang];
  const plural = new Intl.PluralRules(lang);
  const piezas = (n) => T.pieza[plural.select(n) === "one" ? "one" : "other"];   // "1 piece", "2 pieces" · "1 pieza", "2 piezas"

  const mas = (f, n) => new Date(Date.parse(f + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
  const lunes = (f) => mas(f, -((new Date(f + "T12:00:00Z").getUTCDay() + 6) % 7));
  const dnum = (f) => +f.slice(8, 10), dmes = (f) => T.MES[+f.slice(5, 7) - 1], ddia = (f) => T.DIA[new Date(f + "T12:00:00Z").getUTCDay()];

  try {
    const [TM, AG, AS, LD] = await Promise.all([get(RAIZ + "data/temas.json"), get(RAIZ + "data/agenda.json"), get(RAIZ + "data/assets.json"), LU ? LU.cargar() : null]);
    if (!TM) throw new Error("sin data/temas.json");

    /* ---------- datos ---------- */
    const pzs = (TM.piezas || []).slice().sort((a, b) => a.utc.localeCompare(b.utc));
    const pil = Object.fromEntries((TM.pilares || []).map((p) => [p.id, p]));
    const hoyET = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const hoy = /^\d{4}-\d{2}-\d{2}$/.test(q.get("hoy") || "") ? q.get("hoy") : hoyET;
    const semanas = [...new Set(pzs.map((x) => lunes(x.fecha)))];
    let w = semanas.indexOf(lunes(hoy)); if (w < 0) w = hoy < semanas[0] ? 0 : semanas.length - 1;
    const lun = semanas[w] || lunes(hoy), dias = Array.from({ length: 7 }, (_, i) => mas(lun, i));
    const sem = pzs.filter((x) => x.fecha >= dias[0] && x.fecha <= dias[6]);
    const BASES = [{ id: "eat", k: "eat" }, { id: "sleep", k: "sleep" }, { id: "move", k: "move" }, { id: "community", k: "comm" }, { id: "the-divine", k: "div" }]
      .map((b) => ({ ...b, t: T.bases[b.id], lomo: (pil[b.id] || {}).lomo || "", n: sem.filter((x) => x.pilar === b.id).length, pags: (TM.paginas || []).filter((p) => p.pilar === b.id) }));
    const topicsN = BASES.reduce((s, b) => s + b.pags.length, 0);
    const assetsN = AS ? AS.categorias.reduce((s, c) => s + c.piezas.length, 0) : 0;

    /* ---------- la luna ---------- */
    // hoy: el instante real, o las 09:00 de Colombia del día de ?hoy; cada día de la franja, a las 09:00 de Colombia
    const instante = q.get("hoy") && /^\d{4}-\d{2}-\d{2}$/.test(q.get("hoy")) ? LU && LU.manana(q.get("hoy")) : Date.now();
    const luna = LD && LU ? LU.estado(LD, instante) : null;
    const lunaDe = (f) => (LD && LU ? LU.estado(LD, LU.manana(f)) : null);

    /* ---------- casillas ---------- */
    const num = (x) => `<span class="tb-f num">${esc(x)}</span>`;
    const sr = (t) => `<span class="sr"> ${esc(t)}</span>`;
    const casilla = (cl, href, html, extra = "") => `<li><a class="tb-c ${cl}" href="${href}"${extra}>${html}</a></li>`;
    const EN_ = ES ? ' hreflang="en"' : "";   // en la edición ES, lo que vive en la portada EN (Breathe, la semana, Assets, la agenda)
    const v7 = (k) => ` style="--v7:var(--c-${k})"`;
    const lunaHTML = () => {
      if (!luna) return casilla("tb-luna", "temas/moon/", `<span class="tb-l">${T.lunaT}</span>`);
      const nom = LU.nombre(luna.fase, lang), p = luna.prox, pc = LU.cuando(p.ms, lang);
      const dots = Array.from({ length: 30 }, (_, i) => {
        const h = luna.hitos.some((x) => x.dia === i);
        return `<i${i === luna.dia ? ' class="hoy"' : h ? ' class="fs"' : ""}></i>`;
      }).join("");
      return casilla("tb-luna", "temas/moon/",
        `<span class="tb-m"><span class="tb-d">${LU.disco(luna.k, luna.cre, 64)}</span><span class="tb-f num">${T.pct(luna.pct)}${sr(T.lit)}</span></span>` +
        `<span class="tb-n"><span class="tb-l">${esc(nom)}</span><span class="tb-x">${p.fase === "llena" ? T.proxLlena : T.proxNueva} ${esc(pc.dia)}, ${esc(pc.hora)}${sr(`${T.hora}, ${T.edad} ${Math.floor(luna.edad)} ${Math.floor(luna.edad) === 1 ? T.dia1 : T.dias}`)}</span>` +
        `<span class="tb-p" aria-hidden="true">${dots}</span></span>`);
    };
    const lista = [];
    lista.push(lunaHTML());
    lista.push(casilla("tb-resp", R + "#conducta", `<span class="tb-l">${T.resp}</span><span class="tb-x">${T.respT}</span>`, EN_));
    BASES.forEach((b) => lista.push(casilla("tb-base", `temas/pilar/${b.id}/`, `<span class="tb-l">${esc(b.t)}</span>${num(b.n)}${sr(`${piezas(b.n)} ${T.semana}`)}`, v7(b.k))));
    lista.push(casilla("tb-1", ES ? "temas/" : "#topics", `<span class="tb-l">${T.top}</span>${num(topicsN)}${sr(T.paginas)}`));
    lista.push(casilla("tb-1", R + (ES ? "agenda.html" : "#upcoming"), `<span class="tb-l">${T.up}</span><span class="tb-x">${T.upT}</span>`, EN_));
    lista.push(casilla("tb-1", R + "#assets", `<span class="tb-l">${T.as}</span>${num(assetsN)}${sr(`${piezas(assetsN)} ${T.planeadas}`)}`, EN_));
    dias.forEach((f) => {
      const n = sem.filter((x) => x.fecha === f).length, l = f === hoy && luna ? luna : lunaDe(f), cur = f === hoy;
      lista.push(casilla("tb-dia", R + "#semana", `<span class="tb-k">${ddia(f)}</span>${num(dnum(f))}<span class="tb-s" aria-hidden="true">${l ? LU.disco(l.k, l.cre, 12) : ""}</span>` +
        `<span class="tb-x num">${n}<span class="tb-pz sr"> ${piezas(n)}</span></span>${sr(`${l ? LU.nombre(l.fase, lang) : ""}${cur ? ", " + T.hoy : ""}`)}`, (cur ? ' aria-current="date"' : "") + EN_));
    });
    const tab = $("#tab"), centro = $(".tb-centro", tab);
    tab.insertAdjacentHTML("beforeend", lista.join(""));

    /* ---------- Cella en el centro: Mira, ojos de luna, Cierra ---------- */
    let cella = null;
    if (window.NAOS_CELLA && $("#cella-hum")) {
      cella = window.NAOS_CELLA($("#cella-hum"), { estado: "humanity", hacia: -1, noche: true, ojos: true, luna: () => (luna ? { k: luna.k, cre: luna.cre } : null) });
      const tl = $(".tb-luna", tab), tr = $(".tb-resp", tab);
      if (tl && cella) {
        const on = () => cella.luna(true), off = () => cella.luna(false);
        tl.addEventListener("pointerenter", on); tl.addEventListener("pointerleave", off); tl.addEventListener("focus", on); tl.addEventListener("blur", off);
      }
      if (tr && cella) {
        const on = () => cella.cierra("casilla", true), off = () => cella.cierra("casilla", false);
        tr.addEventListener("pointerenter", on); tr.addEventListener("pointerleave", off); tr.addEventListener("focus", on); tr.addEventListener("blur", off);
      }
      const sec = $("#conducta");
      if (sec && cella && "IntersectionObserver" in window) new IntersectionObserver((es) => cella.cierra("seccion", es[0].isIntersecting)).observe(sec);
      // en noche de luna llena o nueva, los ojos de luna 3 s al cargar (después de que Cella abre los ojos)
      if (luna && (luna.fase === "llena" || luna.fase === "nueva") && !N.rmReal) setTimeout(() => cella.luna(true, { por: 3000 }), 3200);
    }

    // la línea menta de 1 px: cruza el tablero a la altura del centro (respirar cruza todo, D-268)
    const linea = $("#tab-linea");
    if (linea && centro) {
      const medir = () => { linea.style.top = (centro.offsetTop + centro.offsetHeight / 2) + "px"; };
      medir(); if ("ResizeObserver" in window) new ResizeObserver(medir).observe(tab); addEventListener("resize", medir);
    }

    /* ---------- lo de abajo (solo en la portada EN) ---------- */
    const bl = $("#bases-l");
    if (bl) {
      const nombre = (x) => x.titulo || x.formato;
      bl.innerHTML = BASES.map((b) => {
        const xs = sem.filter((x) => x.pilar === b.id), ver = xs.slice(0, 3);
        return `<article class="base-fila" style="--bf:var(--c-${b.k})" aria-labelledby="bf-${b.id}">` +
          `<div class="base-cab"><h3 class="base-n" id="bf-${b.id}"><a href="temas/pilar/${b.id}/">${esc(b.t)}</a></h3><p class="base-l">${esc(b.lomo)}</p><p class="base-c num">${b.n}<span> ${esc(piezas(b.n))} ${T.semana}</span></p></div>` +
          `<ul class="base-p">${ver.length ? ver.map((x) => `<li><a href="${x.lang === "es" && !(x.idiomas || []).length ? "es/" : ""}temas/${encodeURIComponent(x.pagina)}/#${encodeURIComponent(x.id)}">` +
            `<span class="bp-d num">${ddia(x.fecha)} ${dnum(x.fecha)} · ${esc(x.hora_et)} ET</span><span class="bp-t"${x.lang === "es" ? ' lang="es"' : ""}>${esc(nombre(x))}</span></a></li>`).join("")
            : `<li class="bp-v">Nothing planned this week.</li>`}</ul>` +
          `<p class="base-m">${xs.length > 3 ? `<a href="#semana">${xs.length - 3} more this week</a>` : ""}<a href="temas/pilar/${b.id}/">All ${esc(b.t)} topics</a></p></article>`;
      }).join("");
    }
    const cal = $("#cal");
    if (cal) {
      // Upcoming: las fechas religiosas y culturales viven solo aquí, con fecha y nombre (sin ángulo de mercado)
      const limpio = (t) => { let d = 0, cut = t.length; for (let i = 0; i < t.length; i++) { const c = t[i]; if (c === "(") d++; else if (c === ")") d--; else if (c === ";" && !d) { cut = i; break; } }
        return t.slice(0, cut).replace(/\s*\([^)]*\d[^)]*\)/g, "").trim(); };
      const eventos = AG && A ? A.proximos(A.conIds(AG.eventos).filter((e) => e.categoria === "religioso/cultural")) : [];
      const fechas = eventos.map((e) => ({ id: e.id, f: e.fecha, fin: e.fecha_fin, t: limpio(e.titulo), cuenta: A.cuenta(e).txt }));
      cal.innerHTML = fechas.slice(0, 8).map((e) => `<li><a href="agenda.html#${encodeURIComponent(e.id)}"><span class="cal-d num">${dnum(e.f)}</span><span class="cal-m">${dmes(e.f)}${e.fin ? ` to ${dnum(e.fin)} ${dmes(e.fin)}` : ""}</span><span class="cal-t">${esc(e.t)}</span><span class="cal-c">${esc(e.cuenta)}</span></a></li>`).join("");
      if (!fechas.length) $("#upcoming").hidden = true;
    }
    const tl2 = $("#top-l");
    if (tl2) {
      // Topics: índice por base (D-268: sin el grupo de la luna; la luna es el calendario)
      tl2.innerHTML = BASES.filter((b) => b.pags.length).map((b) => `<section class="top-g" style="--bf:var(--c-${b.k})" aria-labelledby="tg-${b.id}"><h3 id="tg-${b.id}"><a href="temas/pilar/${b.id}/">${esc(b.t)}</a><span class="num">${b.pags.length}</span></h3>` +
        `<ul>${b.pags.map((x) => `<li><a href="temas/${encodeURIComponent(x.slug)}/">${esc(x.titulo)}</a></li>`).join("")}</ul></section>`).join("");
    }
    const bib = $("#bib");
    if (bib && AS) {
      const chip = (e) => `<span class="chip chip-${e === "published" ? "published" : "planned"}">${e === "published" ? "Published" : "Planned"}</span>`;
      bib.innerHTML = AS.categorias.map((c) => `<div class="bib-cat"><h3>${esc(c.titulo)}</h3><p class="bib-d">${esc(c.descripcion)}</p>` +
        `<ul class="bib-l">${c.piezas.map((x) => `<li class="bib-p"><span class="bib-chips">${chip(x.estado)}</span><h4>${x.pagina ? `<a href="pieza.html?id=${encodeURIComponent(x.id)}">${esc(x.titulo)}</a>` : esc(x.titulo)}</h4><p>${esc(x.descripcion)}</p></li>`).join("")}</ul></div>`).join("");
    } else if (!AS && $("#assets")) $("#assets").hidden = true;

    /* ---------- Breathe: Cella grande, el mismo respirar; los ojos siempre cerrados ---------- */
    const rt = $("#resp-t"), rc = $("#resp");
    if (window.NAOS_CELLA && rc) {
      const grande = window.NAOS_CELLA(rc, { estado: "humanity", hacia: 1, ojos: false });
      if (N.rmReal) rt.textContent = T.ambos;
      else { const rotulo = () => { if (grande.pausada()) { rt.textContent = T.pausada; return; } const f = grande.fase(); rt.textContent = `${f.entra ? T.inh : T.exh} ${f.cuenta}`; }; rotulo(); setInterval(rotulo, 250); }
    }

    if ($("#semana")) N.semana($("#semana")).catch((e) => { console.error(e); $("#semana").hidden = true; });
    if (!ES) N.suave("assets/vendor/lenis/lenis.min.js");
    await N.listo();
  } catch (e) { N.error(e); }
})();
