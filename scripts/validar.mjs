// validar.mjs · revisa lo que se publica antes de subirlo (Node 18+, sin dependencias). Uso: node scripts/validar.mjs
// 1. todo data/*.json parsea
// 2. data/enlaces.json: prefijos de YouTube e Instagram, "ig" solo con "yt", la clave existe en semana.json, forma de las fechas
// 3. los destinos locales de los .html existen (href y src de archivos; las anclas #id de la misma página, si el id está en el HTML estático)
// 4. sin OKX en HTML, CSS, JS propio ni datos (sus términos prohíben publicar sus datos)
// 5. sin rayas largas (em dash) en los datos escritos por nosotros; situacion.json y radar.json traen titulares textuales de sus fuentes y quedan fuera
// Sale con código 1 si algo falla: entonces queda el archivo anterior.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

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
  for (const [k, e] of Object.entries(enl.piezas || {})) {
    const d = `enlaces.json[${k}]`;
    if (!RE_CLAVE.test(k)) falla(d, 'la clave debe ser "AAAA-MM-DD|slot" o "AAAA-MM-DD|asset_id"');
    else if (!claves.has(k)) falla(d, "la clave no existe en semana.json (dia|slot o dia|asset_id)");
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
    if (!existsSync(destino) && !(ruta.endsWith("/") && existsSync(join(destino, "index.html")))) falla(rel(p), `el destino no existe: ${u}`);
  }
}

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

if (errores.length) { console.error(errores.map((e) => "  x " + e).join("\n")); console.error(`\nvalidar: ${errores.length} problema(s)`); process.exit(1); }
console.log(`validar: ok (${Object.keys(datos).length} JSON, ${todos.filter((f) => f.endsWith(".html")).length} HTML, enlaces: ${Object.keys(enl?.piezas || {}).length})`);
