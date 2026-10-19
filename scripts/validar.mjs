// validar.mjs · revisa lo que se publica antes de subirlo (Node 18+, sin dependencias). Uso: node scripts/validar.mjs
// 1. todo data/*.json parsea
// 2. data/enlaces.json: prefijos de YouTube e Instagram, "ig" solo con "yt", la clave existe en semana.json, forma de las fechas
// 3. los destinos locales de los .html existen (href y src de archivos; las anclas #id de la misma página, si el id está en el HTML estático)
// 4. sin OKX en HTML, CSS, JS propio ni datos (sus términos prohíben publicar sus datos)
// 5. sin rayas largas (em dash) en los datos escritos por nosotros; situacion.json y radar.json traen titulares textuales de sus fuentes y quedan fuera
// 6. páginas de tema (lote E, D-252, D-253): data/temas.json solo con campos públicos; dos ediciones (temas/ y es/temas/), cada pieza
//    una sola tarjeta por edición (las ES solo en la ES), salvo la pieza ES que aterriza en la página "es" (decisión 2 de N, lote 2)
//    y que su tema sigue listando con un enlace a su tarjeta; hreflang hacia su par; cada código de data/cortos.json (solo de suma) tiene su
//    redirección y los vivos aterrizan en su tarjeta; reglas fijas de cada tarjeta y del pie; idioma de las partes en las fuentes;
//    fuentes electorales solo oficiales; mercados de predicción como atribución; nada privado; sitemap completo.
//    Con --grilla=<grilla.json> (donde está la grilla privada) además: cada slot de la grilla hasta el 31-dic tiene exactamente una tarjeta.
// 7. cuerpo de las páginas selladas (data/temas/<slug>.<lang>.md, .json; assets/temas/<slug>/): parsea, sin comentarios ni texto
//    privado, sin rayas largas, sin "exercises"; los fragmentos de figura (assets/temas/*/fig/) se revisan dentro de la página que
//    los lleva, no sueltos.
// Sale con código 1 si algo falla: entonces queda el archivo anterior.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { AYUDA_HTML, AYUDA_HTML_ES } from "./construir-temas.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errores = [];
const falla = (donde, msg) => errores.push(`${donde}: ${msg}`);
const leer = (f) => readFileSync(join(RAIZ, f), "utf8");

// ---------- 1. JSON ----------
const datos = {};
for (const f of readdirSync(join(RAIZ, "data")).filter((n) => n.endsWith(".json"))) {
  try { datos[f] = JSON.parse(leer("data/" + f)); } catch (e) { falla("data/" + f, "no parsea: " + e.message); }
}

// ---------- 2. enlaces.json ----------
const RE_YT = /^https:\/\/(www\.youtube\.com\/(shorts\/|watch\?v=)|youtu\.be\/)[\w-]{6,}/;
const RE_IG = /^https:\/\/www\.instagram\.com\/(reel|p)\/[\w-]{5,}/;
const RE_CLAVE = /^\d{4}-\d{2}-\d{2}\|[\w-]+$/;
const RE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?Z$/;
const enl = datos["enlaces.json"];
if (enl) {
  if (!enl.piezas || typeof enl.piezas !== "object" || Array.isArray(enl.piezas)) falla("enlaces.json", '"piezas" debe ser un objeto');
  if (!RE_ISO.test(enl.generado || "")) falla("enlaces.json", '"generado" debe ser ISO UTC (AAAA-MM-DDTHH:MMZ)');
  const items = (datos["semana.json"]?.items) || [];
  const claves = new Set(items.map((x) => x.dia + "|" + (x.slot || x.asset_id)));
  for (const x of datos["temas.json"]?.piezas || []) claves.add(x.fecha + "|" + x.codigo); // piezas de la grilla: AAAA-MM-DD|codigo
  for (const [k, e] of Object.entries(enl.piezas || {})) {
    const d = `enlaces.json[${k}]`;
    if (!RE_CLAVE.test(k)) falla(d, 'la clave debe ser "AAAA-MM-DD|slot" o "AAAA-MM-DD|asset_id"');
    else if (!claves.has(k)) falla(d, "la clave no existe en semana.json (dia|slot o dia|asset_id) ni en temas.json (fecha|codigo)");
    if (!e || typeof e !== "object") { falla(d, "debe ser un objeto"); continue; }
    if (e.yt != null && !RE_YT.test(e.yt)) falla(d, `yt no empieza por youtube.com/shorts/, youtube.com/watch?v= ni youtu.be/: ${e.yt}`);
    if (e.ig != null && !RE_IG.test(e.ig)) falla(d, `ig no empieza por instagram.com/reel/: ${e.ig}`);
    if (e.ig && !e.yt) falla(d, "hay ig sin yt (el Short va primero; sin yt no hay enlace)");
    if (!e.yt && !e.ig) falla(d, "sin yt ni ig: la entrada sobra");
    if (e.publicado_utc != null && !RE_ISO.test(e.publicado_utc)) falla(d, "publicado_utc debe ser ISO UTC");
    if (e.teaser_de != null && !(RE_CLAVE.test(e.teaser_de) && enl.piezas[e.teaser_de])) falla(d, "teaser_de debe ser la clave de otra pieza de este archivo");
    for (const c of Object.keys(e)) if (!["yt", "ig", "publicado_utc", "teaser_de"].includes(c)) falla(d, `campo desconocido: ${c}`);
  }
}

// ---------- recorrer archivos ----------
const SALTAR = new Set([".git", "node_modules", "vendor", "archivo", "fuentes", "crudo"]);
function* archivos(dir) {
  for (const n of readdirSync(dir)) {
    if (SALTAR.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* archivos(p); else yield p;
  }
}
const todos = [...archivos(RAIZ)];
const rel = (p) => relative(RAIZ, p);

// ---------- 3. destinos locales ----------
const FRAGMENTO = /^assets\/temas\/[^/]+\/fig\//; // partes de una página: sus anclas y enlaces se revisan en la página que las lleva
for (const p of todos.filter((f) => f.endsWith(".html") && !rel(f).startsWith("archivo/") && !FRAGMENTO.test(rel(f)))) {
  const h = readFileSync(p, "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
  const ids = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const m of h.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const u = m[1];
    if (!u || /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(u)) continue;
    if (u.startsWith("#")) { if (u.length > 1 && !ids.has(u.slice(1))) falla(rel(p), `ancla sin destino: ${u}`); continue; }
    const ruta = u.split(/[?#]/)[0];
    if (!ruta) continue;
    const destino = ruta.startsWith("/") ? join(RAIZ, ruta) : resolve(dirname(p), ruta);
    const archivo = existsSync(destino) && statSync(destino).isDirectory() ? join(destino, "index.html") : destino; // una carpeta sin index.html da 404 en Pages
    if (!existsSync(archivo)) { falla(rel(p), `el destino no existe: ${u}`); continue; }
    // ancla en otra página nuestra: el id tiene que estar en su HTML estático
    const ancla = u.includes("#") ? decodeURIComponent(u.split("#")[1]) : "";
    if (ancla && archivo.endsWith(".html") && !idsDe(archivo).has(ancla)) falla(rel(p), `ancla sin destino en ${rel(archivo)}: #${ancla}`);
  }
}
function idsDe(f) { if (!idsDe.c) idsDe.c = new Map(); if (!idsDe.c.has(f)) idsDe.c.set(f, new Set([...readFileSync(f, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))); return idsDe.c.get(f); }

// ---------- 4. OKX ----------
const RE_OKX = /\bOKX\b/i;
const EXT_PROPIOS = new Set([".html", ".css", ".json", ".js", ".mjs", ".csv", ".ics"]);
for (const p of todos) {
  const r = rel(p);
  if (!EXT_PROPIOS.has(extname(p)) || r.startsWith("assets/vendor/") || r === "scripts/validar.mjs" || r === "scripts/construir-datos.mjs") continue;
  if (RE_OKX.test(readFileSync(p, "utf8"))) falla(r, "menciona OKX");
}

// ---------- 5. rayas largas en datos nuestros ----------
const TEXTUAL = new Set(["situacion.json", "radar.json"]); // titulares verbatim de sus fuentes
for (const f of Object.keys(datos)) {
  if (TEXTUAL.has(f)) continue;
  const t = leer("data/" + f);
  const i = t.indexOf("—");
  if (i >= 0) falla("data/" + f, `raya larga: ...${t.slice(Math.max(0, i - 30), i + 30).replace(/\n/g, " ")}...`);
}

// ---------- 6. páginas de tema (lote E, D-252; dos ediciones, D-253) ----------
const T = datos["temas.json"];
let resumenTemas = "";
if (T) {
  const d = "temas.json";
  const CAMPOS = { raiz: ["nota", "grilla", "secciones", "pilares", "paginas", "piezas"], pagina: ["slug", "titulo", "titulo_es", "seccion", "pilar", "desde", "hasta", "piezas", "fuentes"],
    pieza: ["id", "ref", "pagina", "fecha", "hora_et", "hora_medellin", "utc", "canal", "formato", "seccion", "pilar", "lang", "idiomas", "tema", "titulo", "linea", "voz", "noticia", "mercado", "luna", "codigo", "corto"],
    fuente: ["titulo", "url", "lang"], luna: ["fase", "iluminacion", "signo"], pilar: ["id", "titulo", "seccion", "lomo"], seccion: ["id", "titulo"] };
  const solo = (o, k, donde) => { for (const c of Object.keys(o || {})) if (!CAMPOS[k].includes(c)) falla(d, `${donde}: campo no público: ${c}`); };
  solo(T, "raiz", "raíz");
  (T.secciones || []).forEach((x, i) => solo(x, "seccion", `secciones[${i}]`));
  (T.pilares || []).forEach((x, i) => solo(x, "pilar", `pilares[${i}]`));
  const piezas = new Map();
  const RE_ES = /[áéíóúñ¿¡]|\b(de|del|la|las|el|los|con|para|una|esta|noche|semana|imagen|encuesta|tarjeta|registro|calendario|lámina|guion)\b/i;
  for (const x of T.piezas || []) {
    solo(x, "pieza", x.id); if (x.luna) solo(x.luna, "luna", x.id + ".luna");
    if (piezas.has(x.id)) falla(d, `pieza repetida: ${x.id}`); piezas.set(x.id, x);
    if (x.luna && x.seccion !== "Humanity") falla(d, `${x.id}: la luna va solo en Humanity`);
    if (x.noticia && x.titulo) falla(d, `${x.id}: noticias y elecciones van solo con fecha y tema`);
    if (x.lang === "en" && [x.titulo, x.linea].some((t) => t && RE_ES.test(t))) falla(d, `${x.id}: texto en español en una pieza EN`);
    if ([x.titulo, x.linea].some((t) => t && /\b(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/.test(t))) falla(d, `${x.id}: el signo va detrás de un toque, no a la vista`);
    if (!/^[\w-]+$/.test(x.codigo || "")) falla(d, `${x.id}: código inválido`);
    if (x.idiomas && !(Array.isArray(x.idiomas) && x.idiomas.length > 1 && x.idiomas.every((l) => ["en", "es"].includes(l)) && x.idiomas[0] === x.lang)) falla(d, `${x.id}: idiomas debe ser la lista de voces en orden, empezando por lang`);
  }
  const enPagina = new Map(), slugs = new Set();
  const ELECCION = /\b(elections?|electoral|ballots?|votes?|voting|voters?|runoffs?|midterms?|referendum|presidential)\b/i;
  const OFICIAL = /(^|\.)(fec\.gov|eac\.gov|tse\.jus\.br|boe\.es|juntaelectoralcentral\.es|law\.cornell\.edu|ine\.mx|service-public\.gouv\.fr)$/;
  for (const p of T.paginas || []) {
    solo(p, "pagina", p.slug);
    (p.fuentes || []).forEach((f, i) => {
      solo(f, "fuente", `${p.slug}.fuentes[${i}]`); if (f.url && !/^https:\/\//.test(f.url)) falla(d, `${p.slug}: fuente sin https: ${f.url}`);
      let host = ""; try { host = new URL(f.url).hostname; } catch (e) { /* obra sin URL */ }
      if (ELECCION.test(`${f.titulo} ${f.url || ""}`.replace(/-/g, " ")) && !OFICIAL.test(host)) falla(d, `${p.slug}: fuente electoral que no es la autoridad oficial (hasta I4): ${f.url || f.titulo}`);
      if (/[?=&]|\bapi\//.test(f.titulo)) falla(d, `${p.slug}: etiqueta de fuente con extremo de API: ${f.titulo}`);
      if (f.lang && f.lang !== "es") falla(d, `${p.slug}: fuente con lang desconocido ${f.lang}`);
      if (!f.lang && /\b(Calendario|Agenda Económica|anuncios de política)\b/.test(f.titulo)) falla(d, `${p.slug}: etiqueta en español sin lang="es": ${f.titulo}`);
    });
    if (!p.titulo_es) falla(d, `${p.slug}: falta el título en español (D-253)`);
    if (slugs.has(p.slug)) falla(d, `página repetida: ${p.slug}`); slugs.add(p.slug);
    // la página "es" (decisión 2 de N, lote 2): las piezas en español, sin pilar (no va en un estante); las demás llevan su pilar
    if (p.slug === "es" ? p.pilar !== null : !(T.pilares || []).some((P) => P.id === p.pilar)) falla(d, `${p.slug}: pilar inválido ${p.pilar}`);
    for (const id of p.piezas) {
      const x = piezas.get(id);
      if (!x) { falla(d, `${p.slug}: pieza inexistente ${id}`); continue; }
      if (x.pagina === p.slug) { if (enPagina.has(id)) falla(d, `${id} está en ${enPagina.get(id)} y en ${p.slug}`); enPagina.set(id, p.slug); }
      else if (x.tema !== p.slug) falla(d, `${id}: dice ser de ${x.pagina} pero está en ${p.slug}`);
    }
  }
  for (const [id, x] of piezas) {
    if (!enPagina.has(id)) falla(d, `${id}: sin página`);
    if (x.tema && (x.pagina !== "es" || x.lang !== "es" || !(T.paginas || []).some((p) => p.slug === x.tema && p.piezas.includes(id)))) falla(d, `${id}: una pieza con tema es una pieza ES que aterriza en "es" y que su tema lista`);
  }

  // HTML de cada página, por edición: exactamente sus tarjetas, una vez cada una, con las reglas fijas
  const ED = {
    en: { pref: "", ayuda: AYUDA_HTML, lineas: ["Closer to yourself.", "Eat well, sleep well, get moving, have a relationship with the divine, and build community."],
      voz: "Voice: synthetic", noConsejo: "Descriptive, not financial advice.", estado: /<span class="t-tag">(Coming|Out)<\/span>/, noticia: "Date and topic only", zodiaco: "Western tropical zodiac",
      sello: "The voices in NAOS pieces are synthetic.", tiene: (x, p) => x.lang !== "es" || (x.idiomas || []).length > 1 || (!!p && p.slug === "es") },
    es: { pref: "es/", ayuda: AYUDA_HTML_ES, lineas: ["Más cerca de ti.", "Come bien, duerme bien, muévete, ten una relación con lo divino y construye comunidad."],
      voz: "Voz: sintética", noConsejo: "Descriptivo, sin asesoría financiera.", estado: /<span class="t-tag">(Próximamente|Publicada)<\/span>/, noticia: "Solo fecha y tema", zodiaco: "Zodíaco tropical occidental",
      sello: "Las voces de las piezas de NAOS son sintéticas.", tiene: () => true },
  };
  const PRIVADO = /\/home\/|n-system|revisa_N|por_que|\bcola\/|\bmotor\/|\b(conductas|tradiciones|evidencia|demanda|astrologia|cielo|calendario|cella|fmt|quien|voto|fomc|chat|santos|sas|walks|kyh|lamp)-(br-|us-|es-)?\d{2}\b|agenda\.json|\bD-\d{3}\b|\btrig_|L[áa]mina|Se lee en|Se escribe con|\blote \d|\bN:\d|linea-es\.md|\.py\b/;
  const html = (r) => { const f = join(RAIZ, r); return existsSync(f) ? readFileSync(f, "utf8") : null; };
  // página sellada con cuerpo (decisión 4 de N: con el sello I4, las tarjetas de noticias llevan su título)
  const conCuerpo = (slug, lang) => existsSync(join(RAIZ, `data/temas/${slug}.${lang}.md`));
  let tarjetas = 0, esperadas = 0;
  for (const [lang, E] of Object.entries(ED)) {
    const vistos = new Map();
    const pieOk = (h, r, ruta) => {
      const pie = (h.match(/<footer[\s\S]*?<\/footer>/) || [""])[0];
      if (!pie.includes(E.ayuda)) falla(r, "el pie no trae las líneas de ayuda verificadas (D-252)");
      else if (!/^<footer[^>]*>\s*<p class="ayuda-l" id="ayuda">/.test(pie)) falla(r, "las líneas de ayuda no van primero en el pie (mismo lugar en cada página, WCAG 3.2.6)");
      if (!E.lineas.some((l) => pie.includes(l))) falla(r, "el pie no trae la línea de N");
      if (!pie.includes(E.sello)) falla(r, "el pie no declara las voces sintéticas");
      if (/lenis|gsap|ScrollTrigger|guia\.js/i.test(h)) falla(r, "carga Lenis, GSAP o la guía (prohibido en páginas de tema)");
      const sinJsonld = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
      if (PRIVADO.test(sinJsonld) || PRIVADO.test(h)) falla(r, `texto privado o interno: ${(h.match(PRIVADO) || [])[0]}`);
      if (h.includes("—")) falla(r, "raya larga");
      if (/\bno es [^,.]{1,40}, es\b/i.test(h)) falla(r, '"no es X, es Y"');
      for (const m of ["<title>", 'name="description"', 'rel="canonical"', 'property="og:title"', '"@type":"CollectionPage"', `<html lang="${lang}">`]) if (!h.includes(m)) falla(r, `falta ${m}`);
      if (ruta != null) for (const [hl, pre] of [["en", ""], ["es", "es/"]]) if (!h.includes(`<link rel="alternate" hreflang="${hl}" href="https://hardlypythonnmr.github.io/naos/${pre}${ruta}">`)) falla(r, `falta hreflang ${hl} hacia su par`);
    };
    for (const p of T.paginas || []) {
      const r = `${E.pref}temas/${p.slug}/index.html`, h = html(r);
      if (!h) { falla(r, "no existe"); continue; }
      pieOk(h, r, `temas/${p.slug}/`);
      const deEd = p.piezas.filter((id) => piezas.has(id) && E.tiene(piezas.get(id), p)); esperadas += deEd.length;
      const cuerpo = conCuerpo(p.slug, lang);
      const cartas = [...h.matchAll(/<article class="t-carta[^"]*" id="([^"]+)"[\s\S]*?<\/article>/g)];
      const ids = cartas.map((m) => m[1]);
      if (ids.length !== deEd.length || deEd.some((id) => !ids.includes(id))) falla(r, `tarjetas ${ids.length}, piezas de la edición ${deEd.length}: no coinciden`);
      for (const [bloque, id] of cartas) {
        tarjetas++;
        const x = piezas.get(id); if (!x) { falla(r, `tarjeta sin pieza: ${id}`); continue; }
        // la pieza ES con tema vive en dos páginas: aterriza en "es" y su tema la lista con un enlace a esa tarjeta
        const k = x.tema && p.slug === x.tema ? id + "|lista" : id;
        if (vistos.has(k)) falla(r, `tarjeta repetida ${id} (también en ${vistos.get(k)})`); vistos.set(k, r);
        if (x.tema && p.slug === x.tema && !bloque.includes(`href="../es/#${id}"`)) falla(r, `${id}: la tarjeta del tema no enlaza a su tarjeta en la página "es"`);
        if (!E.tiene(x, p)) falla(r, `${id}: la pieza no va en la edición ${lang}`);
        if (x.voz && !bloque.includes(E.voz)) falla(r, `${id}: falta "${E.voz}"`);
        if (x.mercado && !bloque.includes(E.noConsejo)) falla(r, `${id}: falta "${E.noConsejo}"`);
        if (!E.estado.test(bloque)) falla(r, `${id}: sin estado`);
        if (!bloque.includes(`${x.hora_et} ET`) || !bloque.includes(`${x.hora_medellin} Medellín`)) falla(r, `${id}: falta la hora ET o Medellín`);
        // con cuerpo, el título es el del texto sellado (en la edición ES, en español, con el inglés marcado con su lang)
        if (!cuerpo && x.titulo && !x.noticia && x.lang !== lang && !new RegExp(`<h3 class="t-tit"[^>]*lang="${x.lang}"|<h3 class="t-tit"[^>]*>[^<]*<span lang="${x.lang}">`).test(bloque)) falla(r, `${id}: título en ${x.lang} sin lang="${x.lang}"`);
        // con cuerpo, una tarjeta puede ir sin luna (walks: la pieza ES del 19-dic, candidata); si la lleva, el signo va tras el toque
        if (x.luna?.signo && (!cuerpo || /class="t-luna"/.test(bloque)) && !bloque.includes(`<summary>${E.zodiaco}</summary>`)) falla(r, `${id}: el signo va tras el toque "${E.zodiaco}"`);
        if (x.luna && !x.luna.signo && /<details class="t-signo"/.test(bloque)) falla(r, `${id}: signo en una página de tradición con calendario propio`);
        if (x.noticia && !cuerpo && !bloque.includes(E.noticia)) falla(r, `${id}: noticia con título`);
      }
      if ((p.pilar === "markets") && !new RegExp(`<header class="t-umbral"[\\s\\S]*${E.noConsejo.replace(/\./g, "\\.")}[\\s\\S]*<\\/header>`).test(h)) falla(r, "página de Markets sin el aviso arriba");
      // idioma de las partes (3.1.2): fuentes en otro idioma con su lang
      if (!cuerpo) for (const f of p.fuentes || []) { const fl = f.lang || "en"; if (fl !== lang && !h.includes(`lang="${fl}">${f.titulo.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")}<`)) falla(r, `fuente en ${fl} sin lang: ${f.titulo}`); }
    }
    const nPag = (T.paginas || []).length;
    for (const r of [`${E.pref}temas/index.html`, `${E.pref}temas/humanity/index.html`, `${E.pref}temas/the-present/index.html`, ...(T.pilares || []).filter((P) => (T.paginas || []).some((p) => p.pilar === P.id)).map((P) => `${E.pref}temas/pilar/${P.id}/index.html`), ...(lang === "es" ? ["es/index.html"] : [])]) {
      const h = html(r); if (!h) falla(r, "no existe"); else { pieOk(h, r, r.replace(/^es\//, "").replace(/index\.html$/, "")); if (/class="t-carta/.test(h)) falla(r, "un hub no lleva tarjetas de pieza (cada pieza, una sola tarjeta)"); }
    }
    if (!nPag) falla(d, "sin páginas");
  }
  const enEN = [...piezas.values()].filter((x) => ED.en.tiene(x)).length;
  if (tarjetas !== esperadas) falla("temas/", `tarjetas ${tarjetas} para ${esperadas} esperadas (${enEN} piezas EN, ${piezas.size} en la edición ES)`);
  for (const r of ["index.html", "agenda.html", "pieza.html"]) { const h = html(r); if (h && !(h.match(/<footer[\s\S]*?<\/footer>/) || [""])[0].includes(AYUDA_HTML)) falla(r, "el pie no trae las líneas de ayuda verificadas"); }
  for (const r of ["privacidad.html", "terminos.html"]) { const h = html(r); if (h && !(h.match(/<footer[\s\S]*?<\/footer>/) || [""])[0].includes(AYUDA_HTML_ES)) falla(r, "el pie no trae las líneas de ayuda verificadas"); }
  for (const r of ["pieza.html", "agenda.html"]) { const h = html(r) || ""; if (!/The voices in NAOS pieces are synthetic/.test((h.match(/<footer[\s\S]*?<\/footer>/) || [""])[0])) falla(r, "el pie no declara las voces sintéticas (D-243)"); }
  { const h = html("pieza.html") || ""; if (!/Voice: synthetic/.test(h)) falla("pieza.html", 'falta "Voice: synthetic" junto al video'); }
  { const h = html("index.html") || ""; if (/Colombia 106 ·/.test(h)) falla("index.html", 'queda la línea vieja "Colombia 106" sola');
    if (!h.includes("have a relationship with the divine")) falla("index.html", 'la frase de los pilares no es la línea fija de N ("the divine", D-252)');
    if (!/rel="canonical"/.test(h) || !/hreflang="es"/.test(h)) falla("index.html", "falta canonical o hreflang hacia es/"); }
  // mercados de predicción (D-252): atribución sola ("Polymarket shows X is n% likely"), sin "On the tape"; los electorales se reportan igual (N)
  { const s = html("data/situacion.json") || "";
    if (/On the tape|Markets price it/.test(s)) falla("data/situacion.json", 'queda "On the tape" o "Markets price it" (D-252: "Polymarket shows X is n% likely")'); }

  // enlaces cortos: el registro (data/cortos.json, solo de suma) manda; cada código tiene su redirección, los vivos a su tarjeta
  const REG = datos["cortos.json"]?.codigos || null;
  if (!REG) falla("cortos.json", "falta el registro de enlaces cortos");
  let cortos = 0, retirados = 0;
  for (const x of piezas.values()) if (x.corto) {
    const e = REG?.[x.codigo];
    if (!e) { falla("cortos.json", `${x.codigo}: Short sin registro`); continue; }
    if (e.pagina !== x.pagina || e.id !== x.id) falla("cortos.json", `${x.codigo}: el registro no apunta a la tarjeta actual`);
  }
  for (const [c, e] of Object.entries(REG || {})) {
    const r = `s/${c}/index.html`, h = html(r), x = [...piezas.values()].find((y) => y.corto && y.codigo === c);
    if (!h) { falla(r, "falta el enlace corto (un código emitido no se borra)"); continue; }
    const m = /http-equiv="refresh" content="0; url=([^"]+)"/.exec(h);
    if (!m) { falla(r, "sin redirección"); continue; }
    const u = m[1].replace(/&amp;/g, "&"), [rutaQ, ancla] = u.split("#"), ruta = rutaQ.split("?")[0];
    const f = join(resolve(dirname(join(RAIZ, r)), ruta), "index.html");
    if (!existsSync(f)) { falla(r, `destino inexistente: ${u}`); continue; }
    if (!h.includes(`location.replace(${JSON.stringify(u)})`)) falla(r, "la redirección por script no coincide con la meta");
    if (x) {
      const pref = e.lang === "es" ? "/es/temas/" : "/temas/";
      if (!idsDe(f).has(ancla)) falla(r, `el destino no tiene la tarjeta #${ancla}`);
      else if (ancla !== x.id || !rutaQ.endsWith(`${pref}${x.pagina}/?src=${x.codigo}`) || (e.lang !== "es" && rutaQ.includes("/es/"))) falla(r, `no apunta a su tarjeta: ${u}`);
      cortos++;
    } else retirados++;
  }
  if (existsSync(join(RAIZ, "s"))) for (const c of readdirSync(join(RAIZ, "s"))) if (!REG?.[c]) falla(`s/${c}`, "enlace corto huérfano (fuera del registro)");

  // sitemap
  const sm = html("sitemap.xml") || "";
  for (const p of T.paginas || []) for (const pre of ["", "es/"]) if (!sm.includes(`/naos/${pre}temas/${p.slug}/</loc>`)) falla("sitemap.xml", `falta ${pre}temas/${p.slug}/`);
  if (!sm.includes("/naos/es/</loc>")) falla("sitemap.xml", "falta es/");
  for (const m of sm.matchAll(/<loc>https:\/\/hardlypythonnmr\.github\.io\/naos\/([^<]*)<\/loc>/g)) { const f = join(RAIZ, m[1] || "index.html"); if (!existsSync(m[1].endsWith("/") || !m[1] ? join(f, m[1] ? "index.html" : "") : f)) falla("sitemap.xml", `URL sin archivo: ${m[1]}`); }

  // contra la grilla privada, si se pasa: cada slot hasta el 31-dic, exactamente una tarjeta
  const g = process.argv.find((a) => a.startsWith("--grilla="))?.slice(9);
  if (g) {
    const G = JSON.parse(readFileSync(g, "utf8")), refs = new Map();
    for (const x of piezas.values()) refs.set(x.ref, (refs.get(x.ref) || 0) + 1);
    const slots = G.slots.filter((s) => s.fecha_et <= "2026-12-31");
    for (const s of slots) if (refs.get(s.id) !== 1) falla("temas.json", `slot ${s.id}: ${refs.get(s.id) || 0} tarjetas`);
    for (const r of refs.keys()) if (!slots.some((s) => s.id === r)) falla("temas.json", `tarjeta sin slot en la grilla: ${r}`);
    resumenTemas = `, grilla: ${slots.length} slots, cada uno con una pieza`;
  }
  resumenTemas = ` · temas: ${(T.paginas || []).length} páginas por edición, ${tarjetas} tarjetas (${enEN} EN y ${piezas.size} ES), ${cortos} enlaces cortos vivos${retirados ? ` y ${retirados} retirados` : ""}` + resumenTemas;
}

// ---------- 7. cuerpo de las páginas selladas ----------
let resumenCuerpo = "";
if (existsSync(join(RAIZ, "data/temas"))) {
  const PRIV = /\/home\/|n-system|revisa_N|\bcola\/|\bmotor\/|\b(conductas|tradiciones|evidencia|demanda|astrologia|cielo|calendario|cella|fmt|quien|voto|fomc|chat|luna|moon|santos|sas|walks|kyh|lamp)-\d{2}\b|\bes-m\d{2}\b|\bD-\d{3}\b|\blote \d|\.py\b|<!--/;
  const fs7 = readdirSync(join(RAIZ, "data/temas")).sort();
  for (const n of fs7) {
    const r = "data/temas/" + n, t = leer(r);
    if (n.endsWith(".json")) { try { JSON.parse(t); } catch (e) { falla(r, "no parsea: " + e.message); } }
    if (t.includes("—")) falla(r, "raya larga");
    const m = PRIV.exec(t); if (m) falla(r, `texto privado o interno: ${m[0]}`);
    // la casa dice "behaviors" para lo que proponemos; "exercise" como actividad física en un estudio citado ("Exercise for depression") sí va
    if (n.endsWith(".en.md") && /\bexercises\b|\b(an|this|our|one|each|a short|a small|a simple|the next)\s+exercise\b/i.test(t)) falla(r, '"exercises": la casa dice "behaviors"');
    if (n.endsWith(".md")) { const slug = n.replace(/\.(en|es)\.md$/, ""); if (!existsSync(join(RAIZ, "data/temas", slug + ".json"))) falla(r, "cuerpo sin su .json"); if (!existsSync(join(RAIZ, "assets/temas", slug))) falla(r, "cuerpo sin assets/temas/" + slug); }
  }
  for (const p of todos.filter((f) => /^assets\/temas\//.test(rel(f)))) { const t = readFileSync(p, "utf8"); if (t.includes("—")) falla(rel(p), "raya larga"); if (/\/home\/|n-system/.test(t)) falla(rel(p), "ruta privada"); const m = /<!--|\b(cella|fmt|quien|voto|fomc|chat|moon|santos|sas|walks|kyh|lamp)-(br-|us-|es-)?\d{2}\b|\bes-m\d{2}\b/.exec(t); if (m) falla(rel(p), `interno en un asset público: ${m[0]}`); }
  resumenCuerpo = ` · cuerpo: ${fs7.filter((n) => n.endsWith(".md")).length / 2} páginas selladas`;
}

if (errores.length) { console.error(errores.map((e) => "  x " + e).join("\n")); console.error(`\nvalidar: ${errores.length} problema(s)`); process.exit(1); }
console.log(`validar: ok (${Object.keys(datos).length} JSON, ${todos.filter((f) => f.endsWith(".html")).length} HTML, enlaces: ${Object.keys(enl?.piezas || {}).length}${resumenTemas}${resumenCuerpo})`);
