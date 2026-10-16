// validar.mjs · revisa lo que se publica antes de subirlo (Node 18+, sin dependencias). Uso: node scripts/validar.mjs
// 1. todo data/*.json parsea
// 2. data/enlaces.json: prefijos de YouTube e Instagram, "ig" solo con "yt", la clave existe en semana.json, forma de las fechas
// 3. los destinos locales de los .html existen (href y src de archivos; las anclas #id de la misma página, si el id está en el HTML estático)
// 4. sin OKX en HTML, CSS, JS propio ni datos (sus términos prohíben publicar sus datos)
// 5. sin rayas largas (em dash) en los datos escritos por nosotros; situacion.json y radar.json traen titulares textuales de sus fuentes y quedan fuera
// 6. páginas de tema (lote E, D-252): data/temas.json solo con campos públicos; cada pieza una sola tarjeta en una sola página; cada
//    enlace corto existe y aterriza en su tarjeta; reglas fijas de cada tarjeta y del pie; nada privado; sitemap completo.
//    Con --grilla=<grilla.json> (donde está la grilla privada) además: cada slot de la grilla hasta el 31-dic tiene exactamente una tarjeta.
// Sale con código 1 si algo falla: entonces queda el archivo anterior.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { AYUDA_HTML } from "./construir-temas.mjs";

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
for (const p of todos.filter((f) => f.endsWith(".html") && !rel(f).startsWith("archivo/"))) {
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

// ---------- 6. páginas de tema (lote E, D-252) ----------
const T = datos["temas.json"];
let resumenTemas = "";
if (T) {
  const d = "temas.json";
  const CAMPOS = { raiz: ["nota", "grilla", "secciones", "pilares", "paginas", "piezas"], pagina: ["slug", "titulo", "seccion", "pilar", "desde", "hasta", "piezas", "fuentes"],
    pieza: ["id", "ref", "pagina", "fecha", "hora_et", "hora_medellin", "utc", "canal", "formato", "seccion", "pilar", "lang", "titulo", "linea", "voz", "noticia", "mercado", "luna", "codigo", "corto"],
    fuente: ["titulo", "url"], luna: ["fase", "iluminacion", "signo"], pilar: ["id", "titulo", "seccion", "lomo"], seccion: ["id", "titulo"] };
  const solo = (o, k, donde) => { for (const c of Object.keys(o || {})) if (!CAMPOS[k].includes(c)) falla(d, `${donde}: campo no público: ${c}`); };
  solo(T, "raiz", "raíz");
  (T.secciones || []).forEach((x, i) => solo(x, "seccion", `secciones[${i}]`));
  (T.pilares || []).forEach((x, i) => solo(x, "pilar", `pilares[${i}]`));
  const piezas = new Map();
  for (const x of T.piezas || []) {
    solo(x, "pieza", x.id); if (x.luna) solo(x.luna, "luna", x.id + ".luna");
    if (piezas.has(x.id)) falla(d, `pieza repetida: ${x.id}`); piezas.set(x.id, x);
    if (x.luna && x.seccion !== "Humanity") falla(d, `${x.id}: la luna va solo en Humanity`);
    if (x.noticia && x.titulo) falla(d, `${x.id}: noticias y elecciones van solo con fecha y tema`);
    if (x.lang === "en" && [x.titulo, x.linea].some((t) => t && /[áéíóúñ¿¡]|\b(de|del|la|las|el|los|con|para|una|esta|noche|semana|imagen|encuesta|tarjeta|registro|calendario|lámina|guion)\b/i.test(t))) falla(d, `${x.id}: texto en español en una pieza EN`);
    if ([x.titulo, x.linea].some((t) => t && /\b(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/.test(t))) falla(d, `${x.id}: el signo va detrás de un toque, no a la vista`);
    if (!/^[\w-]+$/.test(x.codigo || "")) falla(d, `${x.id}: código inválido`);
  }
  const enPagina = new Map(), slugs = new Set();
  for (const p of T.paginas || []) {
    solo(p, "pagina", p.slug); (p.fuentes || []).forEach((f, i) => { solo(f, "fuente", `${p.slug}.fuentes[${i}]`); if (f.url && !/^https:\/\//.test(f.url)) falla(d, `${p.slug}: fuente sin https: ${f.url}`); });
    if (slugs.has(p.slug)) falla(d, `página repetida: ${p.slug}`); slugs.add(p.slug);
    if (p.slug === "es") falla(d, "no hay página /es/: el español va dentro de su página EN (D-252)");
    for (const id of p.piezas) {
      if (!piezas.has(id)) falla(d, `${p.slug}: pieza inexistente ${id}`);
      else if (piezas.get(id).pagina !== p.slug) falla(d, `${id}: dice ser de ${piezas.get(id).pagina} pero está en ${p.slug}`);
      if (enPagina.has(id)) falla(d, `${id} está en ${enPagina.get(id)} y en ${p.slug}`); enPagina.set(id, p.slug);
    }
  }
  for (const id of piezas.keys()) if (!enPagina.has(id)) falla(d, `${id}: sin página`);

  // HTML de cada página: exactamente sus tarjetas, una vez cada una, con las reglas fijas
  const AYUDA = AYUDA_HTML, LINEAS = ["Closer to yourself.", "Eat well, sleep well, get moving, have a relationship with the divine, and build community."];
  const PRIVADO = /\/home\/|n-system|revisa_N|por_que|\bcola\/|\bmotor\/|\b(conductas|tradiciones|evidencia|demanda|astrologia|cielo|calendario)-\d{2}\b|agenda\.json|\bD-\d{3}\b|\btrig_|L[áa]mina|Se lee en|Se escribe con|\blote \d|\bN:\d|linea-es\.md|\.py\b/;
  const vistos = new Map(); let tarjetas = 0;
  const html = (r) => { const f = join(RAIZ, r); return existsSync(f) ? readFileSync(f, "utf8") : null; };
  const pieOk = (h, r) => {
    const pie = (h.match(/<footer[\s\S]*?<\/footer>/) || [""])[0];
    if (!pie.includes(AYUDA)) falla(r, "el pie no trae las líneas de ayuda verificadas (D-252)");
    else if (!/^<footer[^>]*>\s*<p class="ayuda-l" id="ayuda">/.test(pie)) falla(r, "las líneas de ayuda no van primero en el pie (mismo lugar en cada página, WCAG 3.2.6)");
    if (!LINEAS.some((l) => pie.includes(l))) falla(r, "el pie no trae la línea de N");
    if (/lenis|gsap|ScrollTrigger|guia\.js/i.test(h)) falla(r, "carga Lenis, GSAP o la guía (prohibido en páginas de tema)");
    const sinJsonld = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
    if (PRIVADO.test(sinJsonld) || PRIVADO.test(h)) falla(r, `texto privado o interno: ${(h.match(PRIVADO) || [])[0]}`);
    if (h.includes("—")) falla(r, "raya larga");
    for (const m of ["<title>", 'name="description"', 'rel="canonical"', 'property="og:title"', '"@type":"CollectionPage"', '<html lang="en">']) if (!h.includes(m)) falla(r, `falta ${m}`);
  };
  for (const p of T.paginas || []) {
    const r = `temas/${p.slug}/index.html`, h = html(r);
    if (!h) { falla(r, "no existe"); continue; }
    pieOk(h, r);
    const cartas = [...h.matchAll(/<article class="t-carta[^"]*" id="([^"]+)"[\s\S]*?<\/article>/g)];
    const ids = cartas.map((m) => m[1]);
    if (ids.length !== p.piezas.length || p.piezas.some((id) => !ids.includes(id))) falla(r, `tarjetas ${ids.length}, piezas ${p.piezas.length}: no coinciden`);
    for (const [bloque, id] of cartas) {
      tarjetas++;
      if (vistos.has(id)) falla(r, `tarjeta repetida ${id} (también en ${vistos.get(id)})`); vistos.set(id, r);
      const x = piezas.get(id); if (!x) { falla(r, `tarjeta sin pieza: ${id}`); continue; }
      if (x.voz && !bloque.includes("Voice: synthetic")) falla(r, `${id}: falta "Voice: synthetic"`);
      if (x.mercado && !bloque.includes("Descriptive, not financial advice.")) falla(r, `${id}: falta "Descriptive, not financial advice."`);
      if (!/<span class="t-tag">(Coming|Out)<\/span>/.test(bloque)) falla(r, `${id}: sin estado Coming u Out`);
      if (!bloque.includes(`${x.hora_et} ET`) || !bloque.includes(`${x.hora_medellin} Medellín`)) falla(r, `${id}: falta la hora ET o Medellín`);
      if (x.lang === "es" && !/lang="es"/.test(bloque)) falla(r, `${id}: pieza en español sin lang="es"`);
      if (x.luna && !/<summary>Western tropical zodiac<\/summary>/.test(bloque)) falla(r, `${id}: el signo va tras el toque "Western tropical zodiac"`);
      if (x.noticia && !bloque.includes("Date and topic only")) falla(r, `${id}: noticia con título`);
    }
    if ((p.pilar === "markets") && !/<header class="t-umbral"[\s\S]*Descriptive, not financial advice\.[\s\S]*<\/header>/.test(h)) falla(r, "página de Markets sin el aviso arriba");
  }
  if (tarjetas !== piezas.size) falla("temas/", `tarjetas ${tarjetas} para ${piezas.size} piezas`);
  for (const r of ["temas/index.html", "temas/humanity/index.html", "temas/the-present/index.html", ...(T.pilares || []).filter((P) => (T.paginas || []).some((p) => p.pilar === P.id)).map((P) => `temas/pilar/${P.id}/index.html`)]) {
    const h = html(r); if (!h) falla(r, "no existe"); else { pieOk(h, r); if (/class="t-carta/.test(h)) falla(r, "un hub no lleva tarjetas de pieza (cada pieza, una sola tarjeta)"); }
  }
  for (const r of ["index.html", "agenda.html", "pieza.html"]) { const h = html(r); if (h && !(h.match(/<footer[\s\S]*?<\/footer>/) || [""])[0].includes(AYUDA)) falla(r, "el pie no trae las líneas de ayuda verificadas"); }
  { const h = html("index.html") || ""; if (/Colombia 106 ·/.test(h)) falla("index.html", 'queda la línea vieja "Colombia 106" sola'); }

  // enlaces cortos: uno por Short, cada uno aterriza en su tarjeta; ninguno huérfano
  let cortos = 0;
  const conCorto = new Set([...piezas.values()].filter((x) => x.corto).map((x) => x.codigo));
  for (const x of piezas.values()) if (x.corto) {
    const r = `s/${x.codigo}/index.html`, h = html(r);
    if (!h) { falla(r, "falta el enlace corto"); continue; }
    const m = /http-equiv="refresh" content="0; url=([^"]+)"/.exec(h);
    if (!m) { falla(r, "sin redirección"); continue; }
    const u = m[1].replace(/&amp;/g, "&"), [rutaQ, ancla] = u.split("#"), ruta = rutaQ.split("?")[0];
    const f = join(resolve(dirname(join(RAIZ, r)), ruta), "index.html");
    if (!existsSync(f)) falla(r, `destino inexistente: ${u}`);
    else if (!idsDe(f).has(ancla)) falla(r, `el destino no tiene la tarjeta #${ancla}`);
    else if (ancla !== x.id || !rutaQ.endsWith(`/temas/${x.pagina}/?src=${x.codigo}`)) falla(r, `no apunta a su tarjeta: ${u}`);
    if (!h.includes(`location.replace(${JSON.stringify(u)})`)) falla(r, "la redirección por script no coincide con la meta");
    cortos++;
  }
  if (existsSync(join(RAIZ, "s"))) for (const c of readdirSync(join(RAIZ, "s"))) if (!conCorto.has(c)) falla(`s/${c}`, "enlace corto huérfano (sin Short en la grilla)");

  // sitemap
  const sm = html("sitemap.xml") || "";
  for (const p of T.paginas || []) if (!sm.includes(`/temas/${p.slug}/</loc>`)) falla("sitemap.xml", `falta temas/${p.slug}/`);
  for (const m of sm.matchAll(/<loc>https:\/\/hardlypythonnmr\.github\.io\/naos\/([^<]*)<\/loc>/g)) { const f = join(RAIZ, m[1] || "index.html"); if (!existsSync(m[1].endsWith("/") || !m[1] ? join(f, m[1] ? "index.html" : "") : f)) falla("sitemap.xml", `URL sin archivo: ${m[1]}`); }

  // contra la grilla privada, si se pasa: cada slot hasta el 31-dic, exactamente una tarjeta
  const g = process.argv.find((a) => a.startsWith("--grilla="))?.slice(9);
  if (g) {
    const G = JSON.parse(readFileSync(g, "utf8")), refs = new Map();
    for (const x of piezas.values()) refs.set(x.ref, (refs.get(x.ref) || 0) + 1);
    const slots = G.slots.filter((s) => s.fecha_et <= "2026-12-31");
    for (const s of slots) if (refs.get(s.id) !== 1) falla("temas.json", `slot ${s.id}: ${refs.get(s.id) || 0} tarjetas`);
    for (const r of refs.keys()) if (!slots.some((s) => s.id === r)) falla("temas.json", `tarjeta sin slot en la grilla: ${r}`);
    resumenTemas = `, grilla: ${slots.length} slots, cada uno con una tarjeta`;
  }
  resumenTemas = ` · temas: ${(T.paginas || []).length} páginas, ${tarjetas} tarjetas, ${cortos} enlaces cortos` + resumenTemas;
}

if (errores.length) { console.error(errores.map((e) => "  x " + e).join("\n")); console.error(`\nvalidar: ${errores.length} problema(s)`); process.exit(1); }
console.log(`validar: ok (${Object.keys(datos).length} JSON, ${todos.filter((f) => f.endsWith(".html")).length} HTML, enlaces: ${Object.keys(enl?.piezas || {}).length}${resumenTemas})`);
