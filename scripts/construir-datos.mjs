// construir-datos.mjs · arma data/situacion.json con el stack de USD 0 (versión del repo público hardlypythonnmr/naos).
//   node scripts/construir-datos.mjs            # baja todo de la red y escribe data/situacion.json (+ copia en data/crudo/, ignorada por git)
//   node scripts/construir-datos.mjs --sin-red  # rearma desde data/crudo/ (lo último bajado)
//   node scripts/construir-datos.mjs --wire-rss # además arma el wire y las historias desde RSS públicos (apagado en la Action)
// Corre en .github/workflows/datos.yml: solo Node 18+ (fetch nativo), sin dependencias, sin claves.
// data/crudo/ NUNCA se sube (está en .gitignore): ahí quedan respuestas crudas de las fuentes y CoinGecko prohíbe guardarlas;
// a CoinGecko ni siquiera se le guarda copia. situacion.json lleva solo lo que la página muestra.
//
// Secciones del radar privado (wire, historias del día, cierres citados, temas y titulares del radar): una Action pública no
// puede leerlas. Si existe data/radar.json (lo empujará el radar privado con un token de N, ver README) se usan sus valores;
// si no, se CONSERVAN los últimos que ya hay en data/situacion.json, con su fecha en "radar.fecha". Nunca se borran.
// Claves opcionales por entorno: COINGECKO_DEMO_KEY (plan Demo de CoinGecko, recomendado para uso público) y EIA_KEY
// (si falta usa DEMO_KEY de EIA, que tiene cuota baja).
//
// Fuentes y reglas:
//   Tesoro de EE. UU.: curva par diaria (CSV), 2, 10 y 30 años y el 2s10s. Dominio público. "Source: U.S. Treasury".
//   BCE: tasas de referencia (90 días). EUR/USD, USD/JPY (cruce) e "Índice del dólar (cálculo NAOS)" con la fórmula del
//        DXY. No es el DXY de ICE. "Source: ECB".
//   gold-api.com: oro y plata al momento (sus términos permiten uso comercial). Cobre fuera de la página (posible licencia CME).
//   CoinGecko: BTC, ETH, SOL, 30 días. "Data provided by CoinGecko" con enlace.
//   EIA: WTI, Brent y Henry Hub, tendencia fechada; nunca en la cinta (llega con 1 a 9 días de rezago).
//   alternative.me: Crypto Fear & Greed Index, 30 días, con atribución y enlace.
//   NAOS Mood, "Credit and dollar" (OFR y BCE, dominio público): scripts/animo.py (copia de motor/radar/animo.py);
//        si falla, el estado queda "method in review" y sin número.
//   Noticias: Fed y SEC (dominio público), BBC (crédito "BBC News" y enlace), CoinDesk y MarketWatch (titular y enlace,
//        como el radar), Hacker News (API pública). Titulares textuales; "moved" solo si el titular nombra el activo y el
//        movimiento.
//   Calendario: feed semanal de Forex Factory (el mismo del radar), solo para la cuenta regresiva del próximo evento rojo
//        de EE. UU.; en pantalla el evento se atribuye a su publicador oficial (BLS, Fed, BEA).
//   Mercados de predicción: tarjetas con enlace a Polymarket (sin cifras ni embed por ahora); Kalshi, enlace.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const V = path.resolve(AQUI, ".."); // raíz del repo
const CRUDO = path.join(V, "data/crudo");
const SALIDA = path.join(V, "data/situacion.json");
const SIN_RED = process.argv.includes("--sin-red");
const WIRE_RSS = process.argv.includes("--wire-rss");
const ANTERIOR = (() => { try { return JSON.parse(fs.readFileSync(SALIDA, "utf8")); } catch { return null; } })();
fs.mkdirSync(path.join(CRUDO, "hn"), { recursive: true });

const r = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;
const dia = (ms) => new Date(ms).toISOString().slice(0, 10);
const errores = [];
const UA = "Mozilla/5.0 (compatible; NAOS-situacion/1.0; +https://github.com/hardlypythonnmr)";

async function bajar(nombre, url, { tipo = "text", ua = UA, intentos = 3, ms = 30000, guardar = true } = {}) {
  const f = path.join(CRUDO, nombre);
  if (SIN_RED && !guardar) throw new Error("no se guarda copia de " + nombre + " (términos de la fuente)");
  if (SIN_RED) { if (!fs.existsSync(f)) throw new Error("sin copia de " + nombre); const t = fs.readFileSync(f, "utf8"); return tipo === "json" ? JSON.parse(t) : t; }
  for (let i = 0; i < intentos; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": ua, accept: "*/*" }, signal: AbortSignal.timeout(ms) });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const t = await res.text();
      if (guardar) fs.writeFileSync(f, t);
      return tipo === "json" ? JSON.parse(t) : t;
    } catch (e) {
      if (i === intentos - 1) { // si falla la red, usar la última copia si existe
        if (guardar && fs.existsSync(f)) { errores.push(`${nombre}: ${e.message}, se usó la copia anterior`); const t = fs.readFileSync(f, "utf8"); return tipo === "json" ? JSON.parse(t) : t; }
        throw e;
      }
      await new Promise((ok) => setTimeout(ok, 1500 * (i + 1)));
    }
  }
}
const intento = async (nombre, fn) => { try { return await fn(); } catch (e) { errores.push(`${nombre}: ${e.message}`); return null; } };

const GENERADO = SIN_RED && fs.existsSync(path.join(CRUDO, "generado.txt")) ? fs.readFileSync(path.join(CRUDO, "generado.txt"), "utf8").trim() : new Date().toISOString().slice(0, 16) + "Z";
if (!SIN_RED) fs.writeFileSync(path.join(CRUDO, "generado.txt"), GENERADO);
const AHORA = Date.parse(GENERADO);

// ventanas de frescura (días) por fuente: lo que pasa su ventana no entra en la cinta
const VENTANA = { coingecko: 1, goldapi: 1, tesoro: 4, bce: 4, eia: 9, alternative: 2 };
const edad = (f) => (AHORA - Date.parse(f.length === 10 ? f + "T21:00:00Z" : f)) / 864e5;
function cerrar(a, fuenteClave) {
  a.edad_dias = r(Math.max(0, edad(a.fecha)), 1);
  a.ventana_dias = VENTANA[fuenteClave];
  a.fresco = fuenteClave === "eia" ? false : a.edad_dias <= VENTANA[fuenteClave];
  return a;
}
function desdeSerie(o, serie, { dec = 2, bp = false } = {}) {
  const s = serie.slice(-30), ult = s.at(-1), prev = s.at(-2), ini = s[0];
  o.ultimo = r(ult[1], dec); o.fecha = ult[0]; o.serie = s.map(([f, v]) => [f, r(v, dec)]);
  if (bp) { o.cambio_bp = Math.round((ult[1] - prev[1]) * 100); o.cambio = o.cambio_bp; o.cambio30_bp = Math.round((ult[1] - ini[1]) * 100); }
  else { o.cambio = r((ult[1] / prev[1] - 1) * 100); o.cambio30 = r((ult[1] / ini[1] - 1) * 100); }
  o.cambio_base = "vs previous print " + prev[0];
  return o;
}

/* ---------- Tesoro ---------- */
async function tesoro() {
  const anio = new Date(AHORA).getUTCFullYear();
  const filas = [];
  for (const y of [anio - 1, anio]) {
    const t = await bajar(`tesoro-${y}.csv`, `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${y}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${y}&page&_format=csv`, { ua: "curl/8.5.0" });
    const ls = t.trim().split(/\r?\n/), cab = ls[0].split(",").map((c) => c.replace(/"/g, ""));
    const i2 = cab.indexOf("2 Yr"), i10 = cab.indexOf("10 Yr"), i30 = cab.indexOf("30 Yr");
    for (const l of ls.slice(1)) { const c = l.split(","); const [m, d, a] = c[0].split("/"); filas.push([`${a}-${m}-${d}`, Number(c[i2]), Number(c[i10]), Number(c[i30])]); }
  }
  filas.sort((a, b) => a[0].localeCompare(b[0]));
  const ok = filas.filter((f) => f.slice(1).every((x) => Number.isFinite(x)));
  const base = { fuente: "U.S. Treasury", licencia: "public domain (17 U.S.C. §105)", unidad: "%", fuente_url: "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve", nota: "Daily par yield curve, close of the trading day" };
  const mk = (id, nombre, k) => cerrar(desdeSerie({ id, nombre, ...base }, ok.map((f) => [f[0], f[k]]), { bp: true }), "tesoro");
  const spread = cerrar(desdeSerie({ id: "S2S10", nombre: "2s10s curve (10Y minus 2Y)", ...base, unidad: "pp" }, ok.map((f) => [f[0], f[2] - f[1]]), { bp: true }), "tesoro");
  spread.serie90 = ok.slice(-90).map((f) => [f[0], r(f[2] - f[1], 2)]);
  return [mk("US2Y", "US 2-year yield", 1), mk("US10Y", "US 10-year yield", 2), mk("US30Y", "US 30-year yield", 3), spread];
}

/* ---------- BCE e índice del dólar NAOS ---------- */
async function bce() {
  const x = await bajar("bce-90d.xml", "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml");
  const dias = [...x.matchAll(/<Cube time="([\d-]+)">([\s\S]*?)<\/Cube>/g)].map(([, f, cuerpo]) => {
    const t = Object.fromEntries([...cuerpo.matchAll(/currency="(\w+)" rate="([\d.]+)"/g)].map(([, c, v]) => [c, Number(v)]));
    return { f, t };
  }).filter((d) => ["USD", "JPY", "GBP", "CAD", "SEK", "CHF"].every((c) => d.t[c])).sort((a, b) => a.f.localeCompare(b.f));
  // todo cruzado por EUR: USDxxx = xxx/EUR ÷ USD/EUR; EURUSD = USD/EUR; GBPUSD = USD/EUR ÷ GBP/EUR
  const indice = (t) => 50.14348112 * t.USD ** -0.576 * (t.JPY / t.USD) ** 0.136 * (t.USD / t.GBP) ** -0.119 * (t.CAD / t.USD) ** 0.091 * (t.SEK / t.USD) ** 0.042 * (t.CHF / t.USD) ** 0.036;
  const base = { fuente: "ECB", licencia: "ECB reference rates, cite the ECB as source", fuente_url: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html", nota: "Reference rates, 14:15 CET" };
  const usd = cerrar(desdeSerie({ id: "USD", nombre: "NAOS dollar index", ...base, unidad: "index",
    nota: "NAOS dollar index, computed from ECB reference rates. Not ICE's DXY." }, dias.map((d) => [d.f, indice(d.t)])), "bce");
  usd.serie90 = dias.map((d) => [d.f, r(indice(d.t), 2)]);
  const eur = cerrar(desdeSerie({ id: "EURUSD", nombre: "EUR/USD", ...base, unidad: "rate" }, dias.map((d) => [d.f, d.t.USD]), { dec: 4 }), "bce");
  const jpy = cerrar(desdeSerie({ id: "USDJPY", nombre: "USD/JPY", ...base, unidad: "rate", nota: "Cross computed from ECB reference rates" }, dias.map((d) => [d.f, d.t.JPY / d.t.USD])), "bce");
  jpy.serie90 = dias.map((d) => [d.f, r(d.t.JPY / d.t.USD, 2)]);
  const v13 = dias.find((d) => d.f === "2026-10-13");
  if (v13) console.log("control: índice del dólar NAOS 13 oct 2026 =", indice(v13.t).toFixed(2), "(esperado 102,27)");
  return [usd, eur, jpy];
}

/* ---------- CoinGecko ---------- */
async function cripto(id, nombre, sigla) {
  const k = process.env.COINGECKO_DEMO_KEY;
  const u = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=30` + (k ? `&x_cg_demo_api_key=${k}` : "");
  // CoinGecko §6 y §6.2: no guardar sus respuestas ni armar historias propias; se baja en cada corrida, se usa en memoria y
  // situacion.json lleva solo lo que la página muestra (la serie de 30 días solo para BTC y ETH, que tienen gráfico)
  const d = (await bajar(`${id}.json`, u, { tipo: "json", guardar: false })).prices;
  // la API da puntos horarios en 30 días: un punto por día (el último de cada día) más el último al momento
  const porDia = new Map(); for (const [t, p] of d) porDia.set(dia(t), [t, p]);
  const ult = d.at(-1), hoy0 = d.find(([t]) => dia(t) === dia(ult[0])) || d.at(-25);
  const serie = [...porDia.entries()].map(([f, [, p]]) => [f, p]).slice(-30);
  const dec = sigla === "SOL" ? 2 : 0;
  await new Promise((ok) => setTimeout(ok, SIN_RED ? 0 : 2500)); // cortesía con el límite del plan público
  return cerrar({ id: sigla, nombre, fuente: "CoinGecko", licencia: "attribution: Data provided by CoinGecko", fuente_url: "https://www.coingecko.com", unidad: "USD",
    ultimo: r(ult[1], dec), fecha: new Date(ult[0]).toISOString().slice(0, 16) + "Z",
    cambio: r((ult[1] / hoy0[1] - 1) * 100), cambio_base: "since 00:00 UTC", cambio30: r((ult[1] / serie[0][1] - 1) * 100),
    serie: sigla === "SOL" ? null : serie.map(([f, p]) => [f, r(p, dec)]) }, "coingecko");
}

/* ---------- gold-api ---------- */
async function metal(sym, nombre) {
  const j = await bajar(`goldapi-${sym}.json`, `https://api.gold-api.com/price/${sym}`, { tipo: "json" });
  return cerrar({ id: sym, nombre, fuente: "gold-api.com", licencia: "commercial use permitted (gold-api.com/terms §9)", fuente_url: "https://gold-api.com", unidad: "USD",
    ultimo: r(j.price, 2), fecha: j.updatedAt.slice(0, 16) + "Z", cambio: null, cambio_base: "spot, no change given by the source", serie: null }, "goldapi");
}

/* ---------- EIA ---------- */
async function eia() {
  const k = process.env.EIA_KEY || "DEMO_KEY";
  const q = (ruta, s) => `https://api.eia.gov/v2/${ruta}/data/?api_key=${k}&frequency=daily&data[0]=value&facets[series][]=${s}&sort[0][column]=period&sort[0][direction]=desc&length=40`;
  const out = [];
  for (const [id, nombre, ruta, s, unidad] of [["WTI", "Oil, WTI spot", "petroleum/pri/spt", "RWTC", "USD/bbl"], ["BRENT", "Oil, Brent spot", "petroleum/pri/spt", "RBRTE", "USD/bbl"], ["NG", "Natural gas, Henry Hub spot", "natural-gas/pri/fut", "RNGWHHD", "USD/MMBtu"]]) {
    const j = await intento("EIA " + id, () => bajar(`eia-${s}.json`, q(ruta, s), { tipo: "json", ms: 40000 }));
    if (!j) continue;
    const serie = j.response.data.map((p) => [p.period, Number(p.value)]).filter(([, v]) => Number.isFinite(v)).reverse();
    out.push(cerrar(desdeSerie({ id, nombre, fuente: "U.S. Energy Information Administration", licencia: "public domain", fuente_url: "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm", unidad }, serie, { dec: 2 }), "eia"));
  }
  return out;
}

/* ---------- miedo y codicia ---------- */
async function miedo() {
  const j = await bajar("fng.json", "https://api.alternative.me/fng/?limit=31", { tipo: "json" });
  const s = j.data.map((p) => [dia(Number(p.timestamp) * 1000), Number(p.value), p.value_classification]).reverse();
  const cripto = { nombre: "Crypto Fear & Greed Index", fuente: "alternative.me", url: "https://alternative.me/crypto/fear-and-greed-index/",
    atribucion: "Crypto Fear & Greed Index by alternative.me", valor: s.at(-1)[1], clase: s.at(-1)[2], fecha: s.at(-1)[0],
    ayer: s.at(-2)?.[1], semana: s.at(-8)?.[1], mes: s[0]?.[1], serie: s.map(([f, v]) => [f, v]) };
  // NAOS Mood: se corre scripts/animo.py y se lee su salida (python3, solo librería estándar); con --sin-red se lee la última
  // copia en data/crudo/; si nada funciona, estado "review" sin número (y el armado conserva la lectura anterior si era válida).
  let naos = { nombre: "NAOS Mood", estado: "review", valor: null, nota: "Method in review. No number is shown until it is published." };
  let a = null, origen = null;
  const copia = path.join(CRUDO, "animo.json"), motor = path.join(AQUI, "animo.py");
  if (!SIN_RED && fs.existsSync(motor)) {
    try { const { execFileSync } = await import("child_process"); const t = execFileSync("python3", [motor, "--historia", "30"], { timeout: 300000, encoding: "utf8" });
      a = JSON.parse(t); fs.writeFileSync(copia, t); origen = "scripts/animo.py (run by the builder)"; } catch (e) { errores.push("animo.py: " + e.message.split("\n")[0]); }
  } else if (fs.existsSync(copia)) { a = JSON.parse(fs.readFileSync(copia, "utf8")); origen = "scripts/animo.py (copy)"; }
  if (a && a.valor != null) naos = { nombre: "NAOS Mood", estado: "live", version: a.version, valor: a.valor, clase: a.banda, desde: a.datos_desde, hasta: a.datos_hasta, generado: a.generado,
    vivos: a.vivos, total: a.total_inputs, componentes: Object.values(a.inputs || {}).map((x) => ({ nombre: x.nombre, sub: x.sub, fecha: x.fecha, vivo: x.vivo, fuente: x.fuente })),
    serie: (a.historia || []).filter((h) => h.valor != null).map((h) => [h.fecha, h.valor]), origen, aviso: a.aviso };
  else if (a) naos.nota = `NAOS Mood v${a.version}: fewer than 4 live inputs today, no number.`;
  return { cripto, naos };
}

/* ---------- noticias ---------- */
const desXML = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#8217;/g, "’").replace(/&#8216;/g, "‘").replace(/&#822[01];/g, '"').replace(/\s+/g, " ").trim();
async function rss(clave, nombre, url, area, n = 12) {
  const x = await intento("rss " + nombre, () => bajar(`rss-${clave}.xml`, url, { ua: "curl/8.5.0" }));
  if (!x) return [];
  return [...x.matchAll(/<item\b[\s\S]*?<\/item>/g)].slice(0, n).map(([it]) => {
    const g = (tag) => { const m = it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? desXML(m[1]) : ""; };
    const f = Date.parse(g("pubDate") || g("dc:date"));
    return { titulo: g("title"), url: g("link") || g("guid"), fuente: nombre, hora: Number.isFinite(f) ? new Date(f).toISOString().slice(0, 16) + "Z" : null, area_fuente: area };
  }).filter((t) => t.titulo && /^https?:/.test(t.url));
}
const RE_AI = /\b(AI|chips?|semiconductors?|ASML|TSMC|A\.I\.|artificial intelligence|OpenAI|Anthropic|Gemini|ChatGPT|Claude|LLMs?|Nvidia|chatbot|machine learning|data cent(?:er|re)s?|GPU)\b/i;
const RE_ENERGIA = /\b(Aramco|fuel depot|oil|crude|OPEC|Hormuz|refiner(?:y|ies)|natural gas|LNG|pipeline|energy|power grid|electricity|gasoline|petrol|solar|nuclear)\b/i;
const RE_CRIPTO = /\b(bitcoin|ether(?:eum)?|crypto|stablecoin|token(?:ized)?|BTC|ETH|blockchain|solana)\b/i;
const RE_ECON = /\b(Fed|Federal Reserve|inflation|CPI|PPI|jobs|payrolls?|unemployment|rates?|Treasur(?:y|ies)|yields?|bonds?|GDP|recession|tariffs?|economy|stocks?|shares|markets?|dollar|SEC|bank)\b/i;
const RE_POL = /\b(election|midterms?|Congress|Senate|White House|President|minister|parliament|government|ceasefire|war|sanctions?|Ukraine|Russia|Israel|Iran|China|Gaza|NATO|vote)\b/i;
function areaDe(t) {
  if (t.area_fuente === "Crypto" || RE_CRIPTO.test(t.titulo)) return "Crypto";
  if (RE_AI.test(t.titulo)) return "AI";
  if (RE_ENERGIA.test(t.titulo)) return "Energy";
  if (t.area_fuente === "Culture") return "Culture";
  if (t.fuente === "MarketWatch" && RE_ECON.test(t.titulo)) return "Economy";
  if (t.area_fuente === "Politics" || RE_POL.test(t.titulo)) return "Politics";
  if (t.area_fuente === "Economy" || RE_ECON.test(t.titulo)) return "Economy";
  return t.area_fuente || "Economy";
}
// "moved": solo si el titular mismo nombra el activo Y un movimiento. Se copia el nombre tal como lo dice la fuente.
const ACTIVOS_TXT = /\b(bitcoin|ether(?:eum)?|altcoins|crypto(?: stocks| prices)?|gold|silver|copper|oil|crude|Brent|natural gas|the dollar|dollar|yen|euro|Treasur(?:y yields|ies)|yields|bonds?|stocks|shares|chip stocks|Nasdaq|S&P 500|Dow|FTSE|Nikkei|Kospi|South Korean stocks|European stocks|markets?)\b/i;
const MOVIMIENTO = /\b(rise[sn]?|rising|rose|fall(?:s|en|ing)?|fell|slip(?:s|ped)?|slide[sd]?|sliding|jump(?:s|ed)?|surge[sd]?|soar(?:s|ed)?|plunge[sd]?|tumble[sd]?|drop(?:s|ped)?|climb(?:s|ed)?|rall(?:y|ies|ied)|gain(?:s|ed)?|sink(?:s)?|sank|hold(?:s)? (?:above|below|near)|lag(?:s|ged)?|worst|best|record high|record low|rebound(?:s|ed)?|extend(?:s|ed)? (?:gains|losses))\b/i;
function movido(t) { const a = t.match(ACTIVOS_TXT), m = t.match(MOVIMIENTO); return a && m ? a[0] : null; }

async function hackerNews() {
  const ids = await bajar("hn-top.json", "https://hacker-news.firebaseio.com/v0/topstories.json", { tipo: "json" });
  const items = [];
  for (const id of ids.slice(0, 60)) {
    const it = await intento("hn " + id, () => bajar(`hn/${id}.json`, `https://hacker-news.firebaseio.com/v0/item/${id}.json`, { tipo: "json", intentos: 2, ms: 15000 }));
    if (it && it.title) items.push({ titulo: it.title, url: it.url || `https://news.ycombinator.com/item?id=${id}`, hn: `https://news.ycombinator.com/item?id=${id}`, fuente: "Hacker News", puntos: it.score, comentarios: it.descendants || 0, hora: new Date(it.time * 1000).toISOString().slice(0, 16) + "Z" });
  }
  return items;
}

/* ---------- calendario: próximo evento rojo de EE. UU. ---------- */
const PUBLICADOR = [[/CPI|PPI|Employment|Payrolls|Unemployment|Jobless|JOLTS|Average Hourly/i, "U.S. Bureau of Labor Statistics", "https://www.bls.gov/schedule/news_release/"],
  [/FOMC|Federal Funds|Fed Chair|Powell|Beige Book/i, "Federal Reserve", "https://www.federalreserve.gov/newsevents/calendar.htm"],
  [/GDP|PCE|Personal (Income|Spending)|Core PCE/i, "U.S. Bureau of Economic Analysis", "https://www.bea.gov/news/schedule"],
  [/Retail Sales|Durable Goods|Housing|Building Permits/i, "U.S. Census Bureau", "https://www.census.gov/economic-indicators/"],
  [/ISM/i, "Institute for Supply Management", "https://www.ismworld.org/"]];
async function calendario() {
  const d = await bajar("ff-semana.json", "https://nfs.faireconomy.media/ff_calendar_thisweek.json", { tipo: "json", ua: "curl/8.5.0" });
  const rojos = d.filter((e) => e.impact === "High" && e.country === "USD").map((e) => {
    const p = PUBLICADOR.find(([re]) => re.test(e.title));
    return { evento: e.title, hora: new Date(e.date).toISOString().slice(0, 16) + "Z", publicador: p ? p[1] : null, url: p ? p[2] : null };
  }).sort((a, b) => a.hora.localeCompare(b.hora));
  const proximo = rojos.find((e) => Date.parse(e.hora) > AHORA) || null;
  return { proximo, semana: rojos, nota: "Times from public release calendars; countdown label only." };
}

/* ---------- cierres citados de índices (S&P 500, Nasdaq Composite, Dow, VIX) ----------
   La rutina de NY agrega a radar/cierres-citados.csv (fecha,indice,cierre,cambio_pct,fuente,url) un cierre por índice, cada
   uno tomado de una nota de prensa con su enlace (rama radar/diario). Se lee del disco o, si no está, de la rama. Sin CSV,
   filas de MUESTRA marcadas. La página dibuja su propia línea con esos puntos citados (últimos 20). */
async function cierresCitados(txt) {
  const origen = txt ? "data/radar.json (cierres_csv)" : null;
  const NOMBRES = { "S&P 500": "SPX", SPX: "SPX", "Nasdaq Composite": "IXIC", IXIC: "IXIC", Nasdaq: "IXIC", Dow: "DJI", "Dow Jones": "DJI", DJI: "DJI", VIX: "VIX" };
  const filas = [];
  if (txt) {
    const ls = txt.trim().split(/\r?\n/), cab = ls[0].split(",").map((c) => c.trim());
    const partir = (l) => { const o = []; let c = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { o.push(c); c = ""; } else c += ch; } o.push(c); return o; };
    for (const l of ls.slice(1)) { if (!l.trim()) continue; const v = Object.fromEntries(partir(l).map((x, i) => [cab[i], x.trim()]));
      const id = NOMBRES[v.indice]; const cierre = Number(v.cierre);
      if (id && Number.isFinite(cierre) && /^\d{4}-\d{2}-\d{2}$/.test(v.fecha)) filas.push({ id, fecha: v.fecha, cierre, cambio: v.cambio_pct === "" ? null : Number(v.cambio_pct), fuente: v.fuente, url: v.url, sample: false }); }
  }
  const muestra = !filas.length;
  if (muestra) { // MUESTRA: cifras inventadas para el diseño, nunca publicadas como dato
    const base = { SPX: [7790.1, 7812.4, 7820.3, 7807.0], IXIC: [24410.5, 24520.2, 24470.8, 24402.6], DJI: [51480.2, 51500.6, 51851.4, 51670.0], VIX: [15.9, 15.4, 14.8, 15.2] };
    const fechas = ["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-13"]; // el 12-oct no hay fila: así se ve un día faltante
    for (const [id, vs] of Object.entries(base)) vs.forEach((c, i) => filas.push({ id, fecha: fechas[i], cierre: c, cambio: i ? Math.round((c / vs[i - 1] - 1) * 1e4) / 100 : null, fuente: "SAMPLE", url: null, sample: true }));
  }
  const nombre = { SPX: "S&P 500", IXIC: "Nasdaq Composite", DJI: "Dow Jones", VIX: "VIX" };
  return { origen: origen || "sample", muestra, indices: ["SPX", "IXIC", "DJI", "VIX"].map((id) => {
    const s = filas.filter((f) => f.id === id).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const unicos = []; for (const f of s) { if (unicos.length && unicos.at(-1).fecha === f.fecha) unicos[unicos.length - 1] = f; else unicos.push(f); }
    return { id, nombre: nombre[id], puntos: unicos.slice(-20) };
  }) };
}

/* ---------- armar ---------- */
const [tes, fx, btc, eth, sol, xau, xag, energia, animo, cal, hn] = [
  await intento("Tesoro", tesoro), await intento("BCE", bce),
  await intento("CoinGecko BTC", () => cripto("bitcoin", "Bitcoin", "BTC")), await intento("CoinGecko ETH", () => cripto("ethereum", "Ethereum", "ETH")),
  await intento("CoinGecko SOL", () => cripto("solana", "Solana", "SOL")),
  await intento("gold-api XAU", () => metal("XAU", "Gold")), await intento("gold-api XAG", () => metal("XAG", "Silver")),
  await intento("EIA", eia), await intento("miedo", miedo), await intento("calendario", calendario), await intento("Hacker News", hackerNews),
];
const activosNuevos = [btc, eth, sol, xau, xag, ...(tes || []), ...(fx || []), ...(energia || [])].filter(Boolean);
// si una fuente pública falló en esta corrida, se conserva la lectura que ya se mostraba (con su fecha; la frescura se recalcula,
// así que una lectura vieja sale de la cinta y del tablero). No es un histórico: es el último valor publicado.
const fuenteClave = { CoinGecko: "coingecko", "gold-api.com": "goldapi", "U.S. Treasury": "tesoro", ECB: "bce", "U.S. Energy Information Administration": "eia" };
const activos = [];
for (const viejo of ANTERIOR?.activos || []) {
  const nuevo = activosNuevos.find((x) => x.id === viejo.id);
  if (nuevo) continue;
  errores.push(`${viejo.id}: sin dato nuevo, se conserva el de ${viejo.fecha}`);
  activosNuevos.push(cerrar({ ...viejo }, fuenteClave[viejo.fuente] || "eia"));
}
const ORDEN = ["BTC", "ETH", "SOL", "XAU", "XAG", "US2Y", "US10Y", "US30Y", "S2S10", "USD", "EURUSD", "USDJPY", "WTI", "BRENT", "NG"];
activos.push(...activosNuevos.sort((a, b) => ORDEN.indexOf(a.id) - ORDEN.indexOf(b.id)));

const RE_FUERA = /cancer|diagnos|surgery|memory loss|\bdie[sd]?\b|death|sentenced|murder|accused|on trial|charged|arrest(?:ed)?|allegations?|dinners?|penthouse|mansion|spy/i;
const RE_OKX = /\bOKX\b/i; // nada de OKX en la página (sus términos prohíben publicar sus datos)
const hnIA = (hn || []).filter((h) => !RE_FUERA.test(h.titulo) && !RE_OKX.test(h.titulo)).filter((h) => RE_AI.test(h.titulo) || /\b(model|agent|agents|inference|robotics|LLM|GPT|transformer)\b/i.test(h.titulo));

/* ---------- secciones del radar privado ---------- */
// 1) data/radar.json (empujado por el radar privado: { fecha, wire?, historias?, cierres_csv?, temas?, titulares? });
// 2) --wire-rss: wire e historias desde RSS públicos (como el radar); 3) si no, lo último que hay en situacion.json.
const radarIn = (() => { try { return JSON.parse(fs.readFileSync(path.join(V, "data/radar.json"), "utf8")); } catch { return null; } })();
const sinOKX = (xs) => (xs || []).filter((t) => !RE_OKX.test(t.titulo || ""));
let wireFinal = null, historias = null, radarFecha = null, radarEstado = "carried";
if (radarIn?.wire) { wireFinal = sinOKX(radarIn.wire); historias = sinOKX(radarIn.historias); radarFecha = radarIn.fecha; radarEstado = "radar"; }
else if (WIRE_RSS) { ({ wireFinal, historias } = await wireDesdeRSS()); radarFecha = GENERADO; radarEstado = "rss"; }
else { wireFinal = sinOKX(ANTERIOR?.wire); historias = sinOKX(ANTERIOR?.historias); radarFecha = ANTERIOR?.radar?.fecha || ANTERIOR?.generado || null; }
const citados = radarIn?.cierres_csv ? await intento("cierres citados", () => cierresCitados(radarIn.cierres_csv))
  : (ANTERIOR?.cierres_citados || await intento("cierres citados", () => cierresCitados(null)));

async function wireDesdeRSS() {
// wire: fuentes oficiales primero, después prensa con titular y enlace
const feeds = [
  ["fed", "Federal Reserve", "https://www.federalreserve.gov/feeds/press_all.xml", "Economy", 6],
  ["sec", "SEC", "https://www.sec.gov/news/pressreleases.rss", "Economy", 4],
  ["bbc-negocios", "BBC News", "https://feeds.bbci.co.uk/news/business/rss.xml", "Economy", 14],
  ["bbc-politica", "BBC News", "https://feeds.bbci.co.uk/news/politics/rss.xml", "Politics", 6],
  ["bbc-mundo", "BBC News", "https://feeds.bbci.co.uk/news/world/rss.xml", "Politics", 10],
  ["bbc-tec", "BBC News", "https://feeds.bbci.co.uk/news/technology/rss.xml", "AI", 8],
  ["bbc-cultura", "BBC News", "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", "Culture", 4],
  ["coindesk", "CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/", "Crypto", 10],
  ["marketwatch", "MarketWatch", "https://feeds.content.dowjones.io/public/rss/mw_topstories", "Economy", 10],
];
let crudoWire = [];
for (const [k, n, u, a, c] of feeds) crudoWire = crudoWire.concat(await rss(k, n, u, a, c));
const visto = new Set();
const wire = [];
for (const t of crudoWire.concat(hnIA.slice(0, 4))) {
  const clave = t.titulo.toLowerCase().replace(/\W+/g, " ").slice(0, 70);
  if (visto.has(clave)) continue; visto.add(clave);
  if (t.area_fuente === "AI" && !RE_AI.test(t.titulo) && t.fuente === "BBC News") t.area_fuente = "Economy"; // tecnología sin IA cuenta como economía
  // fuera del muro: columnas de finanzas personales en primera persona y notas sobre la salud o procesos penales de personas
  if (/^(My |I |['‘’]I )|retire|landlord|financial adviser/i.test(t.titulo) && t.fuente === "MarketWatch") continue;
  if (RE_FUERA.test(t.titulo) || RE_OKX.test(t.titulo)) continue;
  const area = t.fuente === "Hacker News" ? "AI" : areaDe(t);
  const m = movido(t.titulo);
  wire.push({ titulo: t.titulo, fuente: t.fuente, url: t.url, hora: t.hora, area, ...(m ? { movio: m } : {}), sample: false });
}
// orden: por hora (lo más nuevo arriba); cupo por área para que el muro quepa
wire.sort((a, b) => (b.hora || "").localeCompare(a.hora || ""));
const cupo = { Politics: 6, Economy: 6, AI: 6, Energy: 4, Crypto: 5, Culture: 2 }, cuenta = {};
const oficial = (t) => t.fuente === "Federal Reserve" || t.fuente === "SEC";
const oficiales = wire.filter(oficial).slice(0, 3); // las fuentes oficiales siempre entran (las 3 más nuevas)
const wireFinal = wire.filter((t) => oficiales.includes(t) || (!oficial(t) && (cuenta[t.area] = (cuenta[t.area] || 0) + 1) <= (cupo[t.area] || 3)));

// historias del día: una por área (IA, política como impacto en mercado, cripto). Titular real; contexto de MUESTRA
const elegir = (area, pref) => wireFinal.find((t) => t.area === area && pref.test(t.titulo)) || wireFinal.find((t) => t.area === area);
const historias = [
  { area: "AI", t: elegir("AI", /chip|stocks|Nvidia|boom|inflation|spending|data cent/i), grafico: { tipo: "tradingview", simbolo: "NASDAQ:SMH", etiqueta: "VanEck Semiconductor ETF (SMH), delayed, via TradingView" } },
  { area: "Politics", t: elegir("Politics", /tariff|sanction|ceasefire|oil|budget|tax|election|Iran|Russia|Ukraine|Israel|China|Hormuz/i) },
  { area: "Crypto", t: wireFinal.find((t) => t.area === "Crypto" && t.movio) || elegir("Crypto", /bitcoin|BTC/i), grafico: { tipo: "propio", activo: "BTC" } },
].filter((h) => h.t).map((h) => {
  // política como impacto en mercado: guerra, energía o Golfo → Brent (CFD vía TradingView); aranceles, presupuesto o elecciones → índice del dólar NAOS
  if (!h.grafico) h.grafico = /Russia|Ukraine|Iran|Israel|Hormuz|oil|pipeline|ceasefire|strike/i.test(h.t.titulo)
    ? { tipo: "tradingview", simbolo: "TVC:UKOIL", etiqueta: "Brent crude CFD via TradingView" } : { tipo: "propio", activo: "USD" };
  return h;
}).map((h) => ({ area: h.area, titulo: h.t.titulo, fuente: h.t.fuente, url: h.t.url, hora: h.t.hora, grafico: h.grafico,
  contexto: "Two lines of context will come from the London and New York radar briefs. Until they run, this card shows the format only.", contexto_sample: true }));
return { wireFinal, historias };
}

// Hacker News para el muro Lab: IA primero, por puntos
const hnLab = hnIA.sort((a, b) => b.puntos - a.puntos).slice(0, 8).map((h) => ({ ...h, area: "ai", sample: false }));

// temas y titulares del radar (compatibilidad con V1 a V3): de data/radar.json o los últimos conservados
const temas = radarIn?.temas || ANTERIOR?.temas || { fuente: "NAOS radar", total: 0, conteos: {} };
const titularesRadar = sinOKX(radarIn?.titulares || ANTERIOR?.titulares);

// MUESTRAS
const muestra = {
  hormuz_transitos: { nombre: "Tanker transits through Hormuz per day", unidad: "ships", sample: true,
    serie: [38, 41, 40, 37, 39, 42, 44, 43, 40, 36, 35, 38, 41, 43, 42, 40, 39, 37, 36, 38, 40, 41, 39, 37, 35, 34, 36, 38, 37, 39] },
  chips_titulares: { nombre: "Chip headlines per day", unidad: "stories", sample: true,
    serie: [4, 6, 5, 7, 9, 8, 6, 5, 7, 11, 12, 10, 9, 8, 7, 9, 13, 14, 12, 10, 9, 11, 15, 16, 14, 12, 13, 17, 18, 16] },
  linea_tiempo: [
    { hora: "06:40", area: "geo", texto: "Shipping advisory for the Strait of Hormuz updated", sample: true },
    { hora: "07:15", area: "energy", texto: "Pipeline flow notice: Black Sea export terminal", sample: true },
    { hora: "08:02", area: "geo", texto: "Ceasefire talks: new round scheduled", sample: true },
    { hora: "08:55", area: "semis", texto: "Export control list: comment period opens", sample: true },
    { hora: "09:30", area: "politics", texto: "Parliament vote on energy subsidies", sample: true },
    { hora: "10:05", area: "energy", texto: "Refinery restart reported in the Gulf", sample: true },
  ],
  escenarios: [
    { si: "Hormuz traffic drops below 30 ships a day", entonces: "Watch WTI, tanker rates and the dollar", vigilar: "WTI · USD", sample: true },
    { si: "Chip headlines keep rising for a second week", entonces: "Watch rate-sensitive tech and AI spending news", vigilar: "US10Y · AI", sample: true },
    { si: "Black Sea terminal flows resume in full", entonces: "Watch WTI pressure ease and shipping advisories", vigilar: "WTI · Shipping", sample: true },
  ],
  repos: ANTERIOR?.muestra?.repos || [], // MUESTRA de diseño (G3), se conserva tal cual
};

// mercados de predicción: tarjetas con enlace a Polymarket (sin cifras ni embed por ahora; ver v1plus.js); Kalshi solo enlace
const prediccion = {
  polymarket: [
    { tema: "Fed", nombre: "Fed decision in October", slug: "will-there-be-no-change-in-fed-interest-rates-after-the-october-2026-meeting-20260617190324031", evento: "fed-decision-in-october-20260617190323537" },
    { tema: "Geopolitics", nombre: "Strait of Hormuz traffic returns to normal by December 31?", slug: "strait-of-hormuz-traffic-returns-to-normal-by-december-31", evento: "strait-of-hormuz-traffic-returns-to-normal-by-december-31" },
    { tema: "AI", nombre: "Which company has the best AI model at the end of October?", slug: "will-google-have-the-best-ai-model-at-the-end-of-october-2026-20260811194841120", evento: "which-company-has-the-best-ai-model-end-of-october" },
    { tema: "Geopolitics", nombre: "US-Iran ceasefire continues through the midterms?", slug: "us-iran-ceasefire-continues-through-the-midterms", evento: "us-iran-ceasefire-continues-through-the-midterms" },
  ],
  kalshi: { url: "https://kalshi.com/markets", nota: "Kalshi Data Terms of Use allow personal, non-commercial use only and prohibit publicly displaying Kalshi Data without written authorization: link only." },
};

/* ---------- regla del titular (D-208): quién dijo o hizo qué, qué hizo el mercado, qué precian los mercados de predicción,
   una cosa conectada. En la página el mercado de predicción va como enlace, sin cifra (ver la nota de "mercados de predicción"). */
const PM_TEMAS = [
  [/\b(fed|fomc|powell|warsh|rate cut|rate hike|interest rate|inflation|cpi|ppi|treasury|yield)/i, "Fed"],
  [/\b(hormuz|strait|tanker|oil|crude|gulf|houthi|aramco|saudi|opec|refiner)/i, "Hormuz"],
  [/\b(iran|israel|ceasefire|tehran|lebanon|yemen|netanyahu)/i, "Iran"],
  [/\b(openai|anthropic|gemini|chatgpt|claude|grok|deepmind|ai model|frontier model)\b/i, "AI"],
];
const CONECTADO = { AI: ["US10Y", "USD"], Politics: ["XAU", "USD"], Energy: ["XAU", "USD"], Crypto: ["ETH", "BTC"], Economy: ["US2Y", "USD"], Culture: ["USD"] };
const pmDe = (titulo) => {
  const hits = PM_TEMAS.filter(([re]) => re.test(titulo)).map(([, k]) => k);
  const elegir = (k) => prediccion.polymarket.find((m) => (k === "Fed" && m.tema === "Fed") || (k === "AI" && m.tema === "AI") ||
    (k === "Hormuz" && /hormuz/i.test(m.evento)) || (k === "Iran" && /iran/i.test(m.evento)));
  for (const k of hits) { const m = elegir(k); if (m) return { nombre: m.nombre, url: `https://polymarket.com/event/${m.evento}` }; }
  return null;
};
const conectadoDe = (area, sinId) => {
  const id = (CONECTADO[area] || ["USD"]).find((x) => x !== sinId && activos.some((a) => a.id === x && a.fresco));
  const a = activos.find((x) => x.id === id);
  return a ? { id: a.id, nombre: a.nombre, ultimo: a.ultimo, cambio: a.cambio ?? null, cambio_bp: a.cambio_bp ?? null, fecha: a.fecha, fuente: a.fuente } : null;
};
function aplicarRegla(lista, conMercado) {
  return (lista || []).map((h) => {
    const sinId = h.grafico?.tipo === "propio" ? h.grafico.activo : null;
    const lados = { quien: `${h.fuente}: headline verbatim`, prediccion: pmDe(h.titulo), conectado: conectadoDe(h.area, sinId) };
    if (conMercado) lados.mercado = h.grafico?.tipo === "propio" ? h.grafico.activo : h.grafico?.etiqueta || null;
    lados.faltan = ["prediccion", "conectado"].filter((k) => !lados[k]).concat(conMercado && !lados.mercado ? ["mercado"] : []);
    return { ...h, lados };
  });
}
historias = aplicarRegla(historias, true);
wireFinal = aplicarRegla(wireFinal, false).map(({ lados, ...t }) => ({ ...t, ...(lados.prediccion ? { odds: lados.prediccion } : {}) }));

const salida = {
  generado: GENERADO,
  aviso: "Descriptive, not financial advice.",
  atribucion: {
    tesoro: { texto: "Source: U.S. Treasury", url: "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve" },
    bce: { texto: "Source: ECB", url: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html" },
    dolar: { texto: "NAOS dollar index, computed from ECB reference rates. Not ICE's DXY." },
    coingecko: { texto: "Data provided by CoinGecko", url: "https://www.coingecko.com" },
    goldapi: { texto: "Metals: gold-api.com", url: "https://gold-api.com" },
    eia: { texto: "Source: U.S. Energy Information Administration", url: "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm" },
    fng: { texto: "Crypto Fear & Greed Index by alternative.me", url: "https://alternative.me/crypto/fear-and-greed-index/" },
    hn: { texto: "Headlines from Hacker News", url: "https://news.ycombinator.com" },
    mapa: { texto: "Map: Natural Earth via world-atlas (public domain). Routes approximate", url: "https://www.naturalearthdata.com" },
  },
  activos,
  miedo: animo ? { ...animo, naos: animo.naos.valor == null && ANTERIOR?.miedo?.naos?.valor != null ? ANTERIOR.miedo.naos : animo.naos } : ANTERIOR?.miedo,
  calendario: cal || ANTERIOR?.calendario,
  cierres_citados: citados,
  radar: { fecha: radarFecha, estado: radarEstado, secciones: ["wire", "historias", "cierres_citados", "temas", "titulares"],
    nota: radarEstado === "carried" ? "Kept from the last radar update; the public refresh cannot read the private radar." : null },
  wire: wireFinal,
  historias,
  prediccion,
  temas,
  titulares: titularesRadar,
  hn: hnLab.length ? hnLab : ANTERIOR?.hn || [],
  muestra,
  errores,
  mapa: "data/mapa.json (loaded when the map comes near the viewport)",
  fuera: ["S&P 500, Nasdaq, Dow, VIX: no free source with display rights; shown only inside TradingView widgets as broker CFDs", "Copper: gold-api's HG is a COMEX contract, CME redistribution license unclear", "Kalshi: data terms forbid publishing its data; link only"],
};
fs.writeFileSync(SALIDA, JSON.stringify(salida));
console.log("situacion.json", (fs.statSync(SALIDA).size / 1024).toFixed(1), "KB · generado", GENERADO);
for (const a of activos) console.log(`  ${a.id.padEnd(6)} ${String(a.ultimo).padStart(10)} ${a.fecha} fresco=${a.fresco} (${a.edad_dias} d)`);
console.log("  miedo cripto", animo?.cripto.valor, animo?.cripto.clase, "· NAOS Mood", animo?.naos.estado, "· próximo rojo", cal?.proximo?.evento, cal?.proximo?.hora);
console.log("  radar", radarEstado, radarFecha, "· wire", wireFinal.length, "· moved", wireFinal.filter((t) => t.movio).length, "· HN IA", hnLab.length, "· historias", historias.length);
if (errores.length) console.log("ERRORES:\n  " + errores.join("\n  "));
