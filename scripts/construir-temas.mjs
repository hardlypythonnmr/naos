// construir-temas.mjs · el esqueleto de las páginas de tema (lote E de la junta de llenado, D-252).
// Node 18+, sin dependencias. Dos pasos:
//   1. Proyección (solo donde está la grilla privada): lee paginas.json + grilla.json (+ afirmaciones.csv) y escribe
//      data/temas.json con lo que la página pública necesita y nada más (sin notas internas, sin revisa_N, sin rutas).
//        node scripts/construir-temas.mjs --grilla=<grilla.json> --paginas=<paginas.json> [--afirmaciones=<afirmaciones.csv>]
//   2. Páginas (siempre; es lo que corre la Action): desde data/temas.json, data/enlaces.json y data/agenda.json escribe
//      temas/<slug>/index.html (una por tema), los hubs (temas/, temas/humanity/, temas/the-present/, temas/pilar/<id>/),
//      un enlace corto estático por Short (s/<codigo>/index.html, redirige a su tarjeta con ?src=<codigo>) y sitemap.xml.
//        node scripts/construir-temas.mjs
// Salida determinista: mismo dato, mismos bytes (sin hora de corrida). Las tarjetas pasan a "Out" solo con enlace en
// data/enlaces.json (clave "AAAA-MM-DD|<codigo>"). Lo corre construir-semana.mjs al final, como construir-ics.mjs.
// Reglas (D-252): títulos con estado "Coming", salvo noticias y elecciones (solo fecha y tema); el español va dentro de
// su página EN con lang="es" (no hay /es/); luna solo en Humanity, lo medido a la vista y el signo tras un toque
// ("Western tropical zodiac"); "Voice: synthetic" en cada pieza con voz; "Descriptive, not financial advice" en Markets;
// líneas de ayuda en el mismo lugar de cada página; sin Lenis ni GSAP; bloques vacíos ausentes, nunca de relleno.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const V = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://hardlypythonnmr.github.io/naos/";
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const leerJSON = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- textos fijos de la página (D-252); los mismos en la portada (index.html) ----------
export const AYUDA_HTML = 'If this is weighing on you, talk to someone now. Colombia: <a href="tel:106">106</a>, national mental health line, 24/7, or <a href="tel:123">123</a> in immediate danger. US: <a href="tel:988">988</a>. Anywhere else: <a href="https://findahelpline.com" rel="noopener">findahelpline.com</a>.';
const LINEA_N = { Humanity: "Eat well, sleep well, get moving, have a relationship with the divine, and build community.", "The Present": "Closer to yourself." };
const NO_CONSEJO = "Descriptive, not financial advice.";

// ---------- vocabulario público ----------
const PILARES = [ // orden de los estantes; frase de N como lomos en Humanity
  { id: "eat", grilla: "comer", titulo: "Eat", seccion: "Humanity", lomo: "Eat well," },
  { id: "sleep", grilla: "dormir", titulo: "Sleep", seccion: "Humanity", lomo: "sleep well," },
  { id: "move", grilla: "moverse", titulo: "Move", seccion: "Humanity", lomo: "get moving," },
  { id: "the-divine", grilla: "lo divino", titulo: "The divine", seccion: "Humanity", lomo: "have a relationship with the divine," },
  { id: "community", grilla: "comunidad", titulo: "Community", seccion: "Humanity", lomo: "and build community." },
  { id: "the-moon", grilla: "luna", titulo: "The moon", seccion: "Humanity", lomo: null },
  { id: "markets", grilla: "mercado", titulo: "Markets", seccion: "The Present", lomo: null },
  { id: "news", grilla: "noticias", titulo: "News", seccion: "The Present", lomo: null },
  { id: "ai", grilla: "IA", titulo: "AI", seccion: "The Present", lomo: null },
];
const SECCIONES = [{ id: "humanity", titulo: "Humanity" }, { id: "the-present", titulo: "The Present" }];
const FORMATO = { "short+reel": "Short and Reel", medio: "Medium video on YouTube", carrusel: "Instagram carousel", historia: "Instagram story", es: "Short and Reel in Spanish" };
const CON_VOZ = new Set(["short+reel", "medio", "es"]);
const FASE = { "gibosa menguante": "waning gibbous", "gibosa creciente": "waxing gibbous", creciente: "waxing crescent", menguante: "waning crescent",
  "cuarto menguante": "last quarter", "cuarto creciente": "first quarter", llena: "full moon", "llena, víspera": "eve of the full moon",
  "llena, un día después": "day after the full moon", nueva: "new moon", "nueva, víspera": "eve of the new moon", "nueva, un día después": "day after the new moon" };
const SIGNO = { Aries: "Aries", Tauro: "Taurus", "Géminis": "Gemini", "Cáncer": "Cancer", Leo: "Leo", Virgo: "Virgo", Libra: "Libra", Escorpio: "Scorpio",
  Sagitario: "Sagittarius", Capricornio: "Capricorn", Acuario: "Aquarius", Piscis: "Pisces" };
const MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], DIA = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fe = (f) => { const t = new Date(f + "T12:00:00Z"); return `${DIA[t.getUTCDay()]} ${t.getUTCDate()} ${MES[t.getUTCMonth()]}`; };
const feCorta = (f) => { const t = new Date(f + "T12:00:00Z"); return `${t.getUTCDate()} ${MES[t.getUTCMonth()]}`; };

// texto de la grilla que puede salir en inglés tal cual (los títulos internos de historias vienen en español)
const ES = /[áéíóúñ¿¡]|\b(de|del|la|las|el|los|con|para|una|un|esta|noche|semana|imagen|quieta|encuesta|tarjeta|registro|calendario|pregunta|abierta|mapa|cercana|citando|como|empieza|cuadro|lámina|guion|se)\b/i;
const enIngles = (t) => !!t && !ES.test(t);
// el signo va detrás de un toque (D-252): un título o línea que lo nombra no sale a la vista
const ZODIACO = /\b(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/;
const publico = (t) => enIngles(t) && !ZODIACO.test(t);

// ---------- 1. proyección ----------
function proyectar({ grilla, paginas, afirmaciones, agenda }) {
  const slots = grilla.slots.filter((s) => s.fecha_et <= "2026-12-31");
  const porId = new Map(slots.map((s) => [s.id, s]));
  const pil = (g) => PILARES.find((p) => p.grilla === g);
  // el español vive dentro de la página EN de la pieza que versiona (D-252: "Inside EN pages"); no hay página /es/
  const esPagina = (p) => p.slug === "es" || /español/i.test(p.pilar);
  const enPaginas = paginas.filter((p) => !esPagina(p));
  const paginaDe = new Map();
  for (const p of enPaginas) for (const id of [...p.slots, ...p.historias]) {
    if (!porId.has(id)) throw new Error(`${p.slug}: el slot ${id} no está en la grilla`);
    if (paginaDe.has(id)) throw new Error(`${id} está en dos páginas: ${paginaDe.get(id)} y ${p.slug}`);
    paginaDe.set(id, p.slug);
  }
  for (const p of paginas.filter(esPagina)) for (const id of [...p.slots, ...p.historias]) {
    const s = porId.get(id); if (!s) throw new Error(`es: ${id} no está en la grilla`);
    const m = /Versión de: (.+) \([^\s)]+ (\d+)\)/.exec(s.fuente || ""); if (!m) throw new Error(`${id}: sin "Versión de:" en fuente`);
    const [, tit, dd] = m;
    const en = slots.find((x) => x.canal === "short+reel" && x.seccion === s.seccion && Number(x.fecha_et.slice(8)) === Number(dd) && x.fecha_et <= s.fecha_et && (x.titulo === tit || x.titulo.startsWith(tit)));
    if (!en || !paginaDe.has(en.id)) throw new Error(`${id}: no encuentro la pieza EN "${tit}" del día ${dd}`);
    paginaDe.set(id, paginaDe.get(en.id));
  }
  const falta = slots.filter((s) => !paginaDe.has(s.id)).map((s) => s.id);
  if (falta.length) throw new Error("slots de la grilla sin página: " + falta.join(", "));

  // códigos: enlace corto por Short (mmdd + h|p, o mmdd + es) y clave de enlaces.json para el resto
  const codigoDe = (s) => {
    const md = s.fecha_et.slice(5, 7) + s.fecha_et.slice(8, 10), sec = s.seccion === "Humanity" ? "h" : "p";
    return { "short+reel": md + sec, es: md + "es", medio: md + sec + "-medium", carrusel: md + sec + "-carousel", historia: md + sec + "-story-" + s.hora_et.replace(":", "") }[s.canal];
  };
  const tarjetaDe = (s) => "c-" + s.id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");

  // fuentes heredadas: filas verificadas de afirmaciones.csv citadas por id, textos nombrados en la grilla y eventos de la agenda
  const filas = new Map((afirmaciones || []).map((r) => [r.id, r]));
  const ANFITRION = { "doi.org": "DOI", "pmc.ncbi.nlm.nih.gov": "PubMed Central", "pubmed.ncbi.nlm.nih.gov": "PubMed", "europepmc.org": "Europe PMC",
    "en.wikipedia.org": "Wikipedia", "aa.usno.navy.mil": "U.S. Naval Observatory", "ssd.jpl.nasa.gov": "NASA JPL Horizons", "www.bls.gov": "U.S. Bureau of Labor Statistics",
    "www.federalreserve.gov": "Federal Reserve", "www.hebcal.com": "Hebcal", "www.sefaria.org": "Sefaria", "arxiv.org": "arXiv", "www.gutenberg.org": "Project Gutenberg",
    "suttacentral.net": "SuttaCentral", "reutersinstitute.politics.ox.ac.uk": "Reuters Institute", "www.chabad.org": "Chabad.org", "sunnah.com": "Sunnah.com",
    "www.who.int": "World Health Organization", "www.nhs.uk": "NHS", "www.britannica.com": "Britannica", "archive.org": "Internet Archive", "www.amsmeteors.org": "American Meteor Society",
    "nssdc.gsfc.nasa.gov": "NASA NSSDCA", "www.ecb.europa.eu": "European Central Bank", "www.bankofengland.co.uk": "Bank of England", "www.boj.or.jp": "Bank of Japan",
    "www.banrep.gov.co": "Banco de la República", "www.unep.org": "UN Environment Programme", "www.law.cornell.edu": "Cornell Law School LII", "www.mpg.de": "Max Planck Society" };
  // herramientas, APIs y datos de nuestra propia medición: no son fuentes del contenido
  const FUERA = /(^|\.)(developers\.google\.com|support\.google\.com|pypi\.org|rhodesmill\.org|raw\.githubusercontent\.com|elicit\.com|dumps\.wikimedia\.org|api\.[\w.]+)$/;
  const rotulo = (u) => {
    const x = new URL(u), host = x.hostname, nombre = ANFITRION[host] || host.replace(/^www\./, "");
    const resto = decodeURIComponent(x.pathname + x.search).replace(/\/$/, "").replace(/^\//, "");
    return host === "doi.org" ? `DOI ${resto}` : resto && resto.length <= 70 ? `${nombre}: ${resto}` : nombre;
  };
  const deFila = (id) => {
    const r = filas.get(id);
    if (!r || id.startsWith("demanda-") || r.verificado !== "si" || !["vigente", "sobrevive"].includes(r.estado) || !/^https:\/\//.test(r.fuente_url)) return null;
    let host; try { host = new URL(r.fuente_url).hostname; } catch { return null; }
    if (FUERA.test(host)) return null;
    if (host === "ssd.jpl.nasa.gov") return { titulo: "NASA JPL Horizons", url: "https://ssd.jpl.nasa.gov/horizons/" };
    return { titulo: rotulo(r.fuente_url), url: r.fuente_url };
  };
  // ids citados: "conductas-01", "tradiciones-17, -19, -20", "the-present-calendario-03 a -06", "evidencia-35, -27"
  const idsDe = (t) => {
    const out = [];
    for (const m of t.matchAll(/\b(astrologia|cielo|conductas|demanda|evidencia|tradiciones|the-present-calendario)-(\d{2})((?:\s*(?:,|a|y)\s*-\d{2})*)/g)) {
      const pre = m[1], nums = [m[2], ...[...m[3].matchAll(/-(\d{2})/g)].map((x) => x[1])];
      if (/\ba\s*-\d{2}/.test(m[3]) && nums.length === 2) { for (let n = +nums[0]; n <= +nums[1]; n++) out.push(`${pre}-${String(n).padStart(2, "0")}`); }
      else out.push(...nums.map((n) => `${pre}-${n}`));
    }
    return out;
  };
  const TEXTOS = [ // obras nombradas en la grilla, rotuladas en inglés; URL solo donde la grilla o la casa ya la tienen
    [/Hesíodo, Trabajos y días 772-773/, { titulo: "Hesiod, Works and Days 772-773, translated by H. G. Evelyn-White (1914), public domain" }],
    [/Séneca, Epistulae morales 19\.10/, { titulo: "Seneca, Moral Letters 19.10, quoting Epicurus (fr. 542 Usener); Latin text from The Latin Library, our translation", url: "https://www.thelatinlibrary.com/" }],
    [/Séneca Ep\. 19\.10/, { titulo: "Seneca, Moral Letters 19.10, quoting Epicurus (fr. 542 Usener); Latin text from The Latin Library, our translation", url: "https://www.thelatinlibrary.com/" }],
    [/Sanhedrín 42a/, { titulo: "Babylonian Talmud, Sanhedrin 42a, our translation" }],
    [/Oppezzo y Schwartz 2014/, { titulo: "Oppezzo and Schwartz, 2014" }],
    [/AN 5\.29/, { titulo: "Anguttara Nikaya 5.29" }],
    [/Epley y Schroeder 2014/, { titulo: "Epley and Schroeder, 2014" }],
    [/Hebreos 13:2/, { titulo: "Hebrews 13:2" }],
    [/Dunn, Aknin y Norton 2008/, { titulo: "Dunn, Aknin and Norton, 2008" }],
    [/AN 8\.33/, { titulo: "Anguttara Nikaya 8.33" }],
    [/Mateo 6:3/, { titulo: "Matthew 6:3" }],
    [/Maimónides/, { titulo: "Maimonides, on giving" }],
    [/Killingsworth y Gilbert 2010/, { titulo: "Killingsworth and Gilbert, 2010" }],
    [/Regla de san Benito 43\.1/, { titulo: "Rule of Saint Benedict 43.1" }],
    [/Bernardi et al\. 2006/, { titulo: "Bernardi et al., 2006" }],
    [/Gita 17\.16/, { titulo: "Bhagavad Gita 17.16" }],
    [/MN 26/, { titulo: "Majjhima Nikaya 26" }],
    [/Durkheim 1912/, { titulo: "Durkheim, The Elementary Forms of Religious Life (1912)" }],
    [/arXiv 2510\.01171/, { titulo: "Zhang et al., 2025, arXiv:2510.01171", url: "https://arxiv.org/abs/2510.01171" }],
    [/CHATS-lab\/verbalized-sampling/, { titulo: "CHATS-lab/verbalized-sampling (Apache-2.0)", url: "https://github.com/CHATS-lab/verbalized-sampling" }],
    [/Hebcal\.com/, { titulo: "Hebcal (CC BY 4.0)", url: "https://www.hebcal.com/" }],
    [/USNO|calendario-lunar\.json|Informe de la luna/, { titulo: "U.S. Naval Observatory, moon phases", url: "https://aa.usno.navy.mil/data/MoonPhases" }],
    [/Horizons/, { titulo: "NASA JPL Horizons", url: "https://ssd.jpl.nasa.gov/horizons/" }],
    [/\(BLS\)|; BLS\)|BLS, BEA/, { titulo: "U.S. Bureau of Labor Statistics", url: "https://www.bls.gov/" }],
    [/BLS, BEA/, { titulo: "U.S. Bureau of Economic Analysis", url: "https://www.bea.gov/" }],
    [/BEA, Fed/, { titulo: "Federal Reserve", url: "https://www.federalreserve.gov/" }],
  ];
  const CAT = { mercado: ["central_bank", "us_data"], noticias: ["summit"], IA: ["tech_ai"] }; // elecciones fuera hasta el sello I4 (D-252)
  const eventos = (agenda?.eventos || []).filter((e) => e.url && /^https:\/\//.test(e.url) && !/wikipedia\.org/.test(e.url));
  const masDias = (f, n) => new Date(Date.parse(f + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
  const fuentesDe = (s) => {
    const t = s.fuente || "", out = [];
    for (const id of idsDe(t)) { const f = deFila(id); if (f) out.push(f); }
    for (const [re, f] of TEXTOS) if (re.test(t)) out.push(f);
    if (/agenda\.json/.test(t) && CAT[s.pilar_o_tema]) for (const e of eventos)
      // solo lo agendado de la categoría de la pieza en sus días siguientes (mercado: 3 días; cumbres: ese día o el siguiente)
      if (CAT[s.pilar_o_tema].includes(e.categoria) && e.fecha >= s.fecha_et && e.fecha <= masDias(s.fecha_et, s.pilar_o_tema === "noticias" ? 1 : 3)) out.push({ titulo: e.fuente, url: e.url });
    return out;
  };

  const piezas = [];
  for (const s of [...slots].sort((a, b) => a.utc.localeCompare(b.utc) || a.id.localeCompare(b.id))) {
    const slug = paginaDe.get(s.id), pag = enPaginas.find((p) => p.slug === slug), P = pil(pag.pilar), Ps = pil(s.pilar_o_tema);
    const noticia = s.pilar_o_tema === "noticias" || pag.pilar === "noticias";
    const lang = s.canal === "es" || s.idioma === "ES" ? "es" : "en";
    const titulo = noticia ? null : lang === "es" ? s.titulo : publico(s.titulo) ? s.titulo : null;
    const linea = !noticia && s.canal === "short+reel" && publico(s.gancho_2s) && s.gancho_2s !== s.titulo ? s.gancho_2s : null;
    const luna = s.seccion === "Humanity" && s.luna ? { fase: FASE[s.luna.fase], iluminacion: s.luna.iluminacion_pct, signo: SIGNO[s.luna.signo] } : null;
    if (luna && (!luna.fase || !luna.signo)) throw new Error(`${s.id}: luna sin traducción (${s.luna.fase}, ${s.luna.signo})`);
    const corto = ["short+reel", "es"].includes(s.canal);
    piezas.push({
      id: tarjetaDe(s), ref: s.id, pagina: slug, fecha: s.fecha_et, hora_et: s.hora_et, hora_medellin: s.medellin.slice(11, 16), utc: s.utc,
      canal: s.canal, formato: FORMATO[s.canal], seccion: s.seccion, pilar: (Ps || P).id, lang, titulo, linea,
      voz: CON_VOZ.has(s.canal), noticia, mercado: s.pilar_o_tema === "mercado", luna, codigo: codigoDe(s), corto,
      _fuentes: fuentesDe(s),
    });
  }
  const codigos = new Set(); for (const x of piezas) { if (codigos.has(x.codigo)) throw new Error("código repetido: " + x.codigo); codigos.add(x.codigo); }

  const salidaPag = enPaginas.map((p) => {
    const xs = piezas.filter((x) => x.pagina === p.slug), vistos = new Set(), fuentes = [];
    for (const x of xs) for (const f of x._fuentes) { const k = f.url || f.titulo; if (!vistos.has(k)) { vistos.add(k); fuentes.push(f); } }
    const P = pil(p.pilar);
    if (!P) throw new Error(`${p.slug}: pilar sin nombre público (${p.pilar})`);
    return { slug: p.slug, titulo: p.titulo_en, seccion: p.seccion, pilar: P.id, desde: xs[0].fecha, hasta: xs.at(-1).fecha, piezas: xs.map((x) => x.id), fuentes };
  });
  for (const x of piezas) delete x._fuentes;
  return {
    nota: "Proyección pública de la grilla para las páginas de tema. La escribe scripts/construir-temas.mjs; no editar a mano. Solo lo que la página muestra.",
    grilla: grilla.meta?.generado || null,
    secciones: SECCIONES,
    pilares: PILARES.map(({ id, titulo, seccion, lomo }) => ({ id, titulo, seccion, lomo })),
    paginas: salidaPag,
    piezas,
  };
}

// CSV con comillas (afirmaciones.csv)
function csv(t) {
  const filas = []; let f = [], c = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { f.push(c); c = ""; } else if (ch === "\n" || ch === "\r") { if (ch === "\r" && t[i + 1] === "\n") i++; f.push(c); filas.push(f); f = []; c = ""; } else c += ch;
  }
  if (c || f.length) { f.push(c); filas.push(f); }
  const [cab, ...resto] = filas.filter((r) => r.length > 1);
  return resto.map((r) => Object.fromEntries(cab.map((k, i) => [k, r[i] ?? ""])));
}

// ---------- 2. páginas ----------
const write = (rel, contenido) => { const p = path.join(V, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, contenido); };

function cabeza({ titulo, descripcion, ruta, raiz, jsonld, noindex }) {
  const url = BASE + ruta;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ""}<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="NAOS">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${BASE}assets/marca/avatar-800.png">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${raiz}assets/marca/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${raiz}assets/marca/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${raiz}assets/marca/avatar-800.png">
<link rel="preload" href="${raiz}assets/fuentes/IBMPlexSans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${raiz}assets/comun/tokens.css">
<link rel="stylesheet" href="${raiz}assets/comun/base.css">
<link rel="stylesheet" href="${raiz}assets/css/temas.css">
<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>
<script defer src="${raiz}assets/js/temas.js"></script>
</head>`;
}
function barra(raiz, actual) {
  const a = (href, t, k) => `<a href="${href}"${actual === k ? ' aria-current="page"' : ""}>${t}</a>`;
  return `<header class="t-barra">
  <p class="t-marca"><a class="t-naos" href="${raiz}">NAOS</a><span class="cond t-lema">Closer to yourself.</span></p>
  <nav class="t-nav" aria-label="Sections">${a(raiz + "temas/humanity/", "Humanity", "humanity")}${a(raiz + "temas/the-present/", "The Present", "the-present")}${a(raiz + "temas/", "Topics", "temas")}${a(raiz + "agenda.html", "Upcoming", "agenda")}</nav>
</header>`;
}
function pie(raiz, seccion, extra = "") {
  return `<footer class="t-pie">
  <p class="ayuda-l" id="ayuda">${AYUDA_HTML}</p>
  <p class="t-linea-n">${esc(LINEA_N[seccion] || LINEA_N["The Present"])}</p>
  <p class="sello">${extra}The voices in NAOS pieces are synthetic. Cella's replies to comments are written with AI; a person reads the hard ones. Times are New York (ET) and Medellín.</p>
  <p class="sello"><a href="${raiz}">Home</a> · <a href="${raiz}temas/">Topics</a> · <a href="${raiz}agenda.html">Upcoming</a> · <a href="${raiz}privacidad.html">Privacy</a> · <a href="${raiz}terminos.html">Terms</a></p>
</footer>`;
}
const pilarDe = (D, id) => D.pilares.find((p) => p.id === id);
const secId = (s) => (s === "Humanity" ? "humanity" : "the-present");
const rango = (a, b) => (a === b ? fe(a) : `${feCorta(a)} to ${feCorta(b)}`) + " " + b.slice(0, 4);

function carta(x, pag, enlace, raiz) {
  const out = enlace && /^https:\/\/(www\.youtube\.com|youtu\.be)\//.test(enlace.yt || "");
  const estado = out
    ? `<p class="t-estado t-out"><span class="t-tag">Out</span> <a class="t-ver" href="${esc(enlace.yt)}" rel="noopener">YouTube</a>${/^https:\/\/www\.instagram\.com\//.test(enlace.ig || "") ? ` <a class="t-ver" href="${esc(enlace.ig)}" rel="noopener">Instagram</a>` : ""}</p>`
    : `<p class="t-estado"><span class="t-tag">Coming</span></p>`;
  const titulo = x.noticia
    ? `<h3 class="t-tit">${pag.pilar === "news" ? "News: " + esc(pag.titulo) : "News"}</h3><p class="sello t-nota">Date and topic only. The title comes after the source check.</p>`
    : x.titulo ? `<h3 class="t-tit"${x.lang === "es" ? ' lang="es"' : ""}>${esc(x.titulo)}</h3>` : `<h3 class="t-tit">${esc(x.formato)}</h3>`;
  const fmt = (x.titulo || x.noticia ? x.formato : "") + (x.lang === "es" ? " · In Spanish" : "") + (x.voz ? " · Voice: synthetic" : "");
  const luna = x.luna ? `<p class="t-luna">Moon: ${esc(x.luna.fase)}, ${String(x.luna.iluminacion).replace(/\.0$/, "")}% lit</p>` +
    `<details class="t-signo"><summary>Western tropical zodiac</summary><p>Moon in ${esc(x.luna.signo)}</p></details>` : "";
  const corto = x.corto ? `<p class="sello t-corto">Short link: <a href="${raiz}s/${esc(x.codigo)}/">naos/s/${esc(x.codigo)}</a></p>` : "";
  return `<li><article class="t-carta${x.lang === "es" ? " t-es" : ""}" id="${esc(x.id)}" data-codigo="${esc(x.codigo)}" data-fecha="${x.fecha}" aria-labelledby="${esc(x.id)}-t">
  <p class="t-cuando"><time datetime="${esc(x.utc.replace("Z", ":00Z"))}">${fe(x.fecha)}</time> · ${esc(x.hora_et)} ET · ${esc(x.hora_medellin)} Medellín</p>
  ${estado}
  ${titulo.replace("<h3 class=\"t-tit\"", `<h3 class="t-tit" id="${esc(x.id)}-t"`)}
  ${x.linea ? `<p class="t-linea">${esc(x.linea)}</p>` : ""}
  ${fmt ? `<p class="t-fmt">${esc(fmt.replace(/^ · /, ""))}</p>` : ""}
  ${luna}${x.mercado ? `<p class="sello t-aviso">${NO_CONSEJO}</p>` : ""}${corto}
</article></li>`.replace(/\n\s*\n/g, "\n");
}

function paginaTema(D, p, enlaces) {
  const raiz = "../../", P = pilarDe(D, p.pilar), xs = p.piezas.map((id) => D.piezas.find((x) => x.id === id));
  const mercado = p.pilar === "markets" || xs.some((x) => x.mercado);
  const desc = `${p.titulo}: ${xs.length} NAOS pieces in ${p.seccion}, ${P.titulo}, ${rango(p.desde, p.hasta)}. Dates, times in ET and Medellín, and sources.`;
  const ruta = `temas/${p.slug}/`;
  const jsonld = { "@context": "https://schema.org", "@type": "CollectionPage", name: p.titulo, description: desc, url: BASE + ruta, inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: "NAOS", url: BASE }, about: P.titulo,
    mainEntity: { "@type": "ItemList", numberOfItems: xs.length, itemListElement: xs.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: BASE + ruta + "#" + x.id,
      name: x.noticia ? `News, ${fe(x.fecha)}` : x.titulo || `${x.formato}, ${fe(x.fecha)}` })) } };
  const fuentes = p.fuentes.length ? `
  <section class="t-bloque t-fuentes" id="fuentes" aria-labelledby="fuentes-t">
    <h2 id="fuentes-t">Sources</h2>
    <ul>${p.fuentes.map((f) => `<li>${f.url ? `<a href="${esc(f.url)}" rel="noopener">${esc(f.titulo)}</a>` : esc(f.titulo)}</li>`).join("")}</ul>
    <p class="sello">Sources carried over from our research notes. Each page gets its own source check before its full text is written.</p>
  </section>` : "";
  return `${cabeza({ titulo: `${p.titulo} · NAOS`, descripcion: desc, ruta, raiz, jsonld })}
<body class="t-${secId(p.seccion)}">
<a class="sr" href="#piezas">Skip to the pieces</a>
${barra(raiz, "")}
<main id="main">
  <header class="t-umbral" id="umbral">
    <nav class="t-migas" aria-label="Breadcrumb"><a href="${raiz}temas/">Topics</a> / <a href="${raiz}temas/${secId(p.seccion)}/">${esc(p.seccion)}</a> / <a href="${raiz}temas/pilar/${P.id}/">${esc(P.titulo)}</a></nav>
    <h1>${esc(p.titulo)}</h1>
    <p class="t-rango">${xs.length} pieces · ${rango(p.desde, p.hasta)}</p>${mercado ? `\n    <p class="sello t-aviso">${NO_CONSEJO}</p>` : ""}
  </header>
  <section class="t-bloque" id="piezas" aria-labelledby="piezas-t">
    <h2 id="piezas-t">The pieces</h2>
    <ol class="t-cartas">
${xs.map((x) => carta(x, p, enlaces[x.fecha + "|" + x.codigo], raiz)).join("\n")}
    </ol>
  </section>${fuentes}
</main>
${pie(raiz, p.seccion, mercado ? NO_CONSEJO + " " : "")}
</body>
</html>
`;
}

function fichaTema(D, p, raiz) {
  const n = p.piezas.length;
  return `<li><a class="t-tema" href="${raiz}temas/${p.slug}/"><span class="t-tema-t">${esc(p.titulo)}</span><span class="sello">${n} pieces · ${rango(p.desde, p.hasta)}</span></a></li>`;
}
function estantes(D, seccion, raiz, nivel = "h2") {
  return D.pilares.filter((P) => P.seccion === seccion).map((P) => {
    const ps = D.paginas.filter((p) => p.pilar === P.id); if (!ps.length) return "";
    return `<section class="t-estante" aria-labelledby="e-${P.id}"><${nivel} class="t-lomo" id="e-${P.id}"><a href="${raiz}temas/pilar/${P.id}/">${esc(P.lomo || P.titulo)}</a>${P.lomo ? ` <span class="sello">${esc(P.titulo)}</span>` : ""}</${nivel}><ul class="t-temas">${ps.map((p) => fichaTema(D, p, raiz)).join("")}</ul></section>`;
  }).join("\n");
}
function hub({ D, ruta, raiz, titulo, h1, desc, cuerpo, seccion, actual }) {
  const jsonld = { "@context": "https://schema.org", "@type": "CollectionPage", name: titulo, description: desc, url: BASE + ruta, inLanguage: "en", isPartOf: { "@type": "WebSite", name: "NAOS", url: BASE } };
  return `${cabeza({ titulo, descripcion: desc, ruta, raiz, jsonld })}
<body class="t-hub">
<a class="sr" href="#main">Skip to the topics</a>
${barra(raiz, actual)}
<main id="main">
  <header class="t-umbral"><h1>${esc(h1)}</h1></header>
${cuerpo}
</main>
${pie(raiz, seccion, seccion === "The Present" ? NO_CONSEJO + " " : "")}
</body>
</html>
`;
}

export function construirTemas({ silencio = false } = {}) {
  const D = leerJSON(path.join(V, "data/temas.json"));
  if (!D) throw new Error("falta data/temas.json (correr con --grilla y --paginas donde está la grilla)");
  const enlaces = leerJSON(path.join(V, "data/enlaces.json"), { piezas: {} }).piezas || {};
  // lo generado antes y que ya no existe se borra (solo dentro de temas/ y s/, que son de este script)
  for (const dir of ["temas", "s"]) fs.rmSync(path.join(V, dir), { recursive: true, force: true });
  const urls = ["", "agenda.html", "temas/", "temas/humanity/", "temas/the-present/"];
  for (const p of D.paginas) { write(`temas/${p.slug}/index.html`, paginaTema(D, p, enlaces)); urls.push(`temas/${p.slug}/`); }
  // hubs
  const lib = (raiz) => `  <section class="t-bloque" aria-labelledby="h-hum"><h2 id="h-hum"><a href="${raiz}temas/humanity/">Humanity</a></h2>\n${estantes(D, "Humanity", raiz, "h3")}\n  </section>`;
  const ven = (raiz) => `  <section class="t-bloque" aria-labelledby="h-pres"><h2 id="h-pres"><a href="${raiz}temas/the-present/">The Present</a></h2>\n${estantes(D, "The Present", raiz, "h3")}\n  </section>`;
  write("temas/index.html", hub({ D, ruta: "temas/", raiz: "../", titulo: "Topics · NAOS", h1: "Topics", seccion: "The Present", actual: "temas",
    desc: `Every NAOS topic page: ${D.paginas.length} topics in Humanity and The Present, with the date and time of each piece and its sources.`, cuerpo: lib("../") + "\n" + ven("../") }));
  write("temas/humanity/index.html", hub({ D, ruta: "temas/humanity/", raiz: "../../", titulo: "Humanity · NAOS", h1: "Humanity", seccion: "Humanity", actual: "humanity",
    desc: "The NAOS library by pillar: eat, sleep, move, the divine, community, and the moon. Each topic with its pieces, dates and sources.",
    cuerpo: `  <p class="t-lomos" aria-hidden="true">${D.pilares.filter((P) => P.lomo).map((P) => `<span>${esc(P.lomo)}</span>`).join(" ")}</p>\n${estantes(D, "Humanity", "../../")}` }));
  write("temas/the-present/index.html", hub({ D, ruta: "temas/the-present/", raiz: "../../", titulo: "The Present · NAOS", h1: "The Present", seccion: "The Present", actual: "the-present",
    desc: "The NAOS window on the present: markets, news with both sides, and AI. Each topic with its pieces, dates and sources. Descriptive, not financial advice.",
    cuerpo: estantes(D, "The Present", "../../") }));
  for (const P of D.pilares) {
    const ps = D.paginas.filter((p) => p.pilar === P.id); if (!ps.length) continue;
    write(`temas/pilar/${P.id}/index.html`, hub({ D, ruta: `temas/pilar/${P.id}/`, raiz: "../../../", titulo: `${P.titulo} · NAOS`, h1: P.titulo, seccion: P.seccion, actual: "",
      desc: `NAOS topics in ${P.seccion}, ${P.titulo}: ${ps.length} topic page${ps.length > 1 ? "s" : ""} with dates, times and sources.`,
      cuerpo: `  <nav class="t-migas" aria-label="Breadcrumb"><a href="../../../temas/">Topics</a> / <a href="../../../temas/${secId(P.seccion)}/">${esc(P.seccion)}</a></nav>\n  <ul class="t-temas">${ps.map((p) => fichaTema(D, p, "../../../")).join("")}</ul>` }));
    urls.push(`temas/pilar/${P.id}/`);
  }
  // enlaces cortos: uno estable por Short, a su tarjeta en su página de tema
  let cortos = 0;
  for (const x of D.piezas.filter((x) => x.corto)) {
    const destino = `../../temas/${x.pagina}/?src=${encodeURIComponent(x.codigo)}#${x.id}`;
    write(`s/${x.codigo}/index.html`, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NAOS · ${esc(x.codigo)}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${BASE}temas/${esc(x.pagina)}/">
<meta http-equiv="refresh" content="0; url=${esc(destino)}">
<script>location.replace(${JSON.stringify(destino)});</script>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:48px 16px;background:#fff;color:#0E1116}a{color:inherit}</style>
</head>
<body><p><a href="${esc(destino)}">Go to this piece on its NAOS page</a></p></body>
</html>
`);
    cortos++;
  }
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${BASE}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  const r = { paginas: D.paginas.length, tarjetas: D.piezas.length, cortos, hubs: 3 + D.pilares.filter((P) => D.paginas.some((p) => p.pilar === P.id)).length };
  if (!silencio) console.log(`construir-temas: ${r.paginas} páginas de tema, ${r.tarjetas} tarjetas, ${r.cortos} enlaces cortos, ${r.hubs} hubs, sitemap con ${urls.length} URL`);
  return r;
}

// ---------- uso directo ----------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const g = arg("grilla"), p = arg("paginas"), a = arg("afirmaciones");
  if (g || p) {
    if (!g || !p) { console.error("uso: node scripts/construir-temas.mjs --grilla=<grilla.json> --paginas=<paginas.json> [--afirmaciones=<csv>]"); process.exit(2); }
    const D = proyectar({ grilla: leerJSON(g), paginas: leerJSON(p), afirmaciones: a ? csv(fs.readFileSync(a, "utf8")) : [], agenda: leerJSON(path.join(V, "data/agenda.json")) });
    fs.writeFileSync(path.join(V, "data/temas.json"), JSON.stringify(D, null, 1) + "\n");
    console.log(`temas.json: ${D.paginas.length} páginas, ${D.piezas.length} piezas (${D.piezas.filter((x) => x.lang === "es").length} en español dentro de su página EN), ${D.piezas.filter((x) => x.corto).length} Shorts con enlace corto`);
  }
  construirTemas();
}
