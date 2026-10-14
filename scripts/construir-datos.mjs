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
//   Calendario: feed semanal de Forex Factory (el mismo del radar): la cuenta regresiva del próximo evento rojo de EE. UU. y
//        las filas rojas de la semana con pronóstico y previo; cada evento se atribuye a su publicador oficial (BLS, Fed, BEA).
//   Viejo y de muestra (D-216): la página los esconde; "escondido" en situacion.json dice qué, por qué y el plan.
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
    return { evento: e.title, hora: new Date(e.date).toISOString().slice(0, 16) + "Z", publicador: p ? p[1] : null, url: p ? p[2] : null,
      pronostico: e.forecast || null, previo: e.previous || null };
  }).sort((a, b) => a.hora.localeCompare(b.hora));
  const proximo = rojos.find((e) => Date.parse(e.hora) > AHORA) || null;
  return { fecha: GENERADO, proximo, semana: rojos, fuente: "Forex Factory weekly calendar", fuente_url: "https://www.forexfactory.com/calendar",
    nota: "Times, forecasts and previous values from the Forex Factory weekly calendar; each release is attributed to its official publisher." };
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

/* ---------- regla del titular (D-208) con el mapa curado de mercados de predicción ----------
   data/mapa-predicciones.json es copia de motor/radar/predicciones-mapa.json (privado). Aquí se porta solo el cruce y la
   validez de predicciones.py (puntuar, mapear, validos, elegir, tickers_de, leer): titular -> historia del mapa -> su mercado
   y sus tickers. Una cifra por historia, con hora; nada de series, tablas ni índices hechos con sus precios.
   Kalshi, CME FedWatch y Metaculus nunca se llaman: solo entradas "citar" con URL de un medio (aquí no hay ninguna). */
const MAPA_PM = JSON.parse(fs.readFileSync(path.join(V, "data/mapa-predicciones.json"), "utf8"));
const REGLAS_PM = MAPA_PM.reglas_globales;
const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const puntuar = (texto, h) => { const t = " " + texto.toLowerCase().replace(/[^a-z0-9$%. -]/g, " ") + " ";
  return (h.palabras || []).filter((p) => new RegExp("(?<![a-z])" + escRe(p.toLowerCase()) + "(?![a-z])").test(t)).length; };
// en un empate gana la historia que el titular nombra antes (como primera() en Python)
const primera = (texto, h) => { const t = " " + texto.toLowerCase().replace(/[^a-z0-9$%. -]/g, " ") + " ";
  const pos = (h.palabras || []).map((p) => t.search(new RegExp("(?<![a-z])" + escRe(p.toLowerCase()) + "(?![a-z])"))).filter((i) => i >= 0);
  return pos.length ? Math.min(...pos) : 1e9; };
const MERCADO_PALABRAS = ["stock", "stocks", "yield", "yields", "rates", "sector", "spending", "tariff", "market", "markets", "bond", "bonds", "dollar", "etf", "shares"];
function mapear(texto) {
  const out = [];
  for (const h of MAPA_PM.historias) {
    const n = puntuar(texto, h); if (!n) continue;
    const omitir = h.politica && !MERCADO_PALABRAS.some((w) => new RegExp("\\b" + w + "\\b").test(texto.toLowerCase())) ? "politics without a market angle (G3 rule)" : null;
    out.push({ h, puntaje: n, omitir, pos: primera(texto, h) });
  }
  return out.sort((a, b) => b.puntaje - a.puntaje || a.pos - b.pos); // empate: gana la que el titular nombra antes
}
// la historia del mapa que le toca a un titular, o null
const historiaDe = (texto) => mapear(texto).find((x) => !x.omitir)?.h || null;
const enlacePM = (h) => (h?.fuente === "polymarket" && h.evento ? { nombre: h.titulo, url: `https://polymarket.com/event/${h.evento}` } : null);

const numPM = (x, d = 0) => (Number.isFinite(Number(x)) && x !== null && x !== "" ? Number(x) : d);
const precioSi = (m) => { try { const v = Number(JSON.parse(m.outcomePrices || "[]")[0]); return Number.isFinite(v) ? v : null; } catch { return null; } };
const validosPM = (e, r) => (e.markets || []).map((m) => [m, precioSi(m)]).filter(([m, p]) => !m.closed && p != null && numPM(m.spread, 1) <= r.spread_max && numPM(m.volume) > 0);
function elegirPM(e, h, r) {
  const ms = validosPM(e, r); if (!ms.length) return null;
  const modo = h.eleccion || "lider";
  if (modo === "binario") return ms[0];
  if (modo === "proximo") return [...ms].sort((a, b) => numPM(a[0].groupItemThreshold, 999) - numPM(b[0].groupItemThreshold, 999))[0];
  if (modo === "mitad") return ms.reduce((a, b) => (Math.abs(b[1] - 0.5) < Math.abs(a[1] - 0.5) ? b : a));
  return ms.reduce((a, b) => (b[1] > a[1] ? b : a));
}
const tickersDe = (h, grupo) => { let ts = [...(h.tickers || [])];
  for (const [nombre, extra] of Object.entries(h.tickers_por_resultado || {})) if (grupo && grupo.toLowerCase().includes(nombre.toLowerCase())) ts = [...extra, ...ts.filter((t) => !extra.some((x) => x.simbolo === t.simbolo))];
  return ts; };
const MESES_PM = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MESES_LARGOS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const gamma = (ruta) => bajar(`pm-${ruta.replace(/\W+/g, "-").slice(0, 80)}.json`, `https://gamma-api.polymarket.com/${ruta}`, { tipo: "json", guardar: false, intentos: 2, ms: 20000 });
const lecturasPM = new Map(); // una lectura por mercado y corrida
async function leerPM(h0) {
  if (lecturasPM.has(h0.id)) return lecturasPM.get(h0.id);
  const leer = async (h) => {
    const r = { ...REGLAS_PM }; for (const k of ["volumen_min_usd", "spread_max"]) if (k in h) r[k] = h[k];
    const base = { id: h.id, titulo: h.titulo, fuente: "Polymarket" };
    if (h.fuente !== "polymarket") return { ...base, omitir: "cited-only source" };
    let slug = h.evento, dia = new Date(AHORA), e;
    try {
      if (!slug && h.buscar) {
        dia = new Date(AHORA + (h.buscar.dias_adelante || 0) * 864e5);
        const patron = new RegExp(h.buscar.patron.replace("{mes}", MESES_LARGOS[dia.getUTCMonth()]).replace("{dia}", dia.getUTCDate()).replace("{anio}", dia.getUTCFullYear()));
        const d = await gamma(`public-search?q=${encodeURIComponent(h.buscar.q)}&limit_per_type=20&events_status=active`);
        slug = (d.events || []).find((x) => patron.test(x.slug || ""))?.slug;
        if (!slug) return { ...base, omitir: "no matching event found for the date" };
      }
      e = await gamma(`events/slug/${slug}`);
    } catch (ex) { return { ...base, evento: slug, omitir: "read failed: " + ex.message }; } // red caída: se omite, nunca se inventa
    base.evento = slug; base.url = `https://polymarket.com/event/${slug}`;
    if (e.closed) return { ...base, omitir: "market resolved" };
    if (numPM(e.volume) < r.volumen_min_usd) return h.respaldo ? leer({ ...h, ...h.respaldo, respaldo: null }) : { ...base, omitir: `thin market (volume ${Math.round(numPM(e.volume))} USD)` };
    const texto = ((e.title || "") + " " + (e.markets || []).map((m) => m.question || "").join(" ")).toLowerCase();
    const tema = r.omitir_temas.find((t) => new RegExp("\\b" + t + "\\b").test(texto)); if (tema) return { ...base, omitir: "topic not covered: " + tema };
    const sel = elegirPM(e, h, r);
    if (!sel) return h.respaldo ? leer({ ...h, ...h.respaldo, respaldo: null }) : { ...base, omitir: "no open market with a real order book" };
    const [m, p] = sel;
    if (p < r.precio_min || p > r.precio_max) return { ...base, omitir: `price ${Math.round(p * 100)}% is near certain` };
    const grupo = (m.groupItemTitle || "").trim();
    const resultado = h.resultado_en.replace("{grupo}", (h.grupos || {})[grupo] || grupo).replace("{fecha_evento}", `${MESES_PM[dia.getUTCMonth()]} ${dia.getUTCDate()}`);
    const leido = GENERADO, hora = `${Number(leido.slice(8, 10))} ${MESES_PM[Number(leido.slice(5, 7)) - 1]} ${leido.slice(11, 16)}`;
    // solo la plantilla "linea" (una cifra); la parte "On the tape" la arma la página con los activos propios
    const linea = r.linea.split(" · On the tape")[0].replace("{p}", Math.round(p * 100)).replace("{resultado}", resultado).replace("{fuente}", "Polymarket").replace("{hora}", hora);
    if (/\b(bet|bets|betting|wager|gamble|odds boost|buy yes|buy no)\b/i.test(linea)) return { ...base, omitir: "forbidden wording" };
    return { ...base, mercado: m.slug, grupo, p: Math.round(p * 100), leido_utc: leido, linea, resultado, tickers: tickersDe(h, grupo).map((t) => t.simbolo), omitir: null };
  };
  const x = await leer(h0);
  // edad_max_horas: una lectura más vieja que eso no se publica (aquí se lee en cada corrida)
  if (!x.omitir && (AHORA - Date.parse(x.leido_utc)) / 36e5 > REGLAS_PM.edad_max_horas) x.omitir = "reading too old";
  lecturasPM.set(h0.id, x); return x;
}
function aplicarRegla(lista, conMercado) {
  return (lista || []).map((h) => {
    const sl = historiaDe(h.titulo);
    const lados = { quien: `${h.fuente}: headline verbatim`, historia_mapa: sl?.id || null, prediccion: enlacePM(sl) };
    if (conMercado) lados.mercado = h.grafico?.tipo === "propio" ? h.grafico.activo : h.grafico?.etiqueta || null;
    return { ...h, lados };
  });
}
historias = aplicarRegla(historias, true);
wireFinal = aplicarRegla(wireFinal, false).map(({ lados, ...t }) => ({ ...t, ...(lados.prediccion ? { odds: lados.prediccion } : {}) }));

/* ---------- viejo y de muestra (D-216): la página los esconde y aquí quedan en una lista con su plan ----------
   Viejo = más antiguo que el ritmo de su fuente más un margen: fuentes diarias, 3 días hábiles; EIA (semanal), 10 días.
   Los días hábiles cuentan solo lunes a viernes (los feriados no se descuentan). */
const diaUTC = (f) => Date.parse(String(f).slice(0, 10) + "T00:00:00Z");
const habiles = (f) => { let n = 0; for (let t = diaUTC(f) + 864e5; t <= diaUTC(GENERADO); t += 864e5) { const w = new Date(t).getUTCDay(); if (w > 0 && w < 6) n++; } return n; };
const esViejo = (f, ritmo = "diario") => !f || !Number.isFinite(diaUTC(f)) || (ritmo === "semanal" ? (diaUTC(GENERADO) - diaUTC(f)) / 864e5 > 10 : habiles(f) > 3);
const REGLA = { diario: "older than 3 business days (daily source)", semanal: "older than 10 days (weekly source)" };
const escondido = [];
const esconder = (id, que, motivo, desde, plan) => escondido.push({ id, que, motivo, desde: desde || null, plan });
for (const a of activos) {
  const ritmo = a.fuente === "U.S. Energy Information Administration" ? "semanal" : "diario";
  a.viejo = esViejo(a.fecha, ritmo);
  if (a.viejo) esconder(`activo:${a.id}`, a.nombre, `stale: ${REGLA[ritmo]}`, a.fecha, `Comes back on its own at the next run that gets a fresh value from ${a.fuente}.`);
}
// titulares del radar sin hora: la fecha sale de la URL (/2026/10/13/) o, si no, de la fecha del radar
const fechaDeUrl = (u) => { const m = String(u || "").match(/\/(20\d\d)[/-](\d\d)[/-](\d\d)\//); return m ? `${m[1]}-${m[2]}-${m[3]}` : null; };
for (const t of wireFinal || []) t.viejo = esViejo(t.hora || radarFecha);
for (const h of historias || []) h.viejo = esViejo(h.hora || radarFecha);
const titularesF = (titularesRadar || []).map((t) => ({ ...t, hora: t.hora || fechaDeUrl(t.url) || radarFecha })).map((t) => ({ ...t, viejo: esViejo(t.hora) }));
const nViejos = (xs) => (xs || []).filter((t) => t.viejo).length;
if (nViejos(wireFinal)) esconder("wire", `${nViejos(wireFinal)} wire headlines`, `stale: ${REGLA.diario}`, (wireFinal.filter((t) => t.viejo).map((t) => t.hora).sort()[0] || "").slice(0, 10),
  "Fresh headlines arrive when the private radar pushes data/radar.json (token pending, see README) or the --wire-rss step runs.");
if (nViejos(historias)) esconder("historias", `${nViejos(historias)} stories of the day`, `stale: ${REGLA.diario}`, radarFecha, "Same as the wire: they return with the next data/radar.json push.");
const calF = cal || ANTERIOR?.calendario || null;
if (calF) { calF.viejo = esViejo(calF.fecha); if (calF.viejo) esconder("calendario", "Red US events of the week", `stale: ${REGLA.diario}`, calF.fecha, "Comes back at the next run that reaches the Forex Factory weekly feed."); }
const miedoF = animo ? { ...animo, naos: animo.naos.valor == null && ANTERIOR?.miedo?.naos?.valor != null ? ANTERIOR.miedo.naos : animo.naos } : ANTERIOR?.miedo;
if (miedoF?.cripto) { miedoF.cripto.viejo = esViejo(miedoF.cripto.fecha); if (miedoF.cripto.viejo) esconder("miedo:cripto", "Crypto Fear & Greed", `stale: ${REGLA.diario}`, miedoF.cripto.fecha, "Comes back at the next run that reaches alternative.me."); }
if (miedoF?.naos?.valor != null) { miedoF.naos.viejo = esViejo(miedoF.naos.desde); if (miedoF.naos.viejo) esconder("miedo:naos", "NAOS Fear & Greed, credit and dollar", `stale: ${REGLA.diario}`, miedoF.naos.desde, "Comes back when the OFR Financial Stress Index publishes a newer day (scripts/animo.py)."); }
// de muestra: nada con sample:true se muestra desde el lunes 19-oct
if (citados?.muestra) esconder("cierres_citados", "Index closes, as reported (S&P 500, Nasdaq Composite, Dow, VIX)", "sample", null, "Shown when the New York close routine writes real cited closes into data/radar.json (cierres_csv); needs the radar push token (README).");
if ((historias || []).some((h) => h.contexto_sample)) esconder("historias:contexto", "Two lines of context on each story of the day", "sample", null, "Written by the London and New York radar briefs and pushed in data/radar.json.");
esconder("muestra:hormuz_transitos", "Tanker transits through Hormuz per day", "sample", null, "Needs a public or licensed tanker-transit source; none chosen yet.");
esconder("muestra:chips_titulares", "Chip headlines per day", "sample", null, "A daily count from the radar scan, once data/radar.json carries it (temas).");
esconder("muestra:linea_tiempo", "Event strip (times of the day's events)", "sample", null, "Built from the radar wire with real times, once data/radar.json is pushed.");
esconder("muestra:escenarios", "Scenario board under the map (if this, watch that)", "sample", null, "Written by the radar from the day's wire and real data; until then the map shows geography only.");
esconder("mapa:notas", "Notes on the map markers (Hormuz, Bab el-Mandeb, Suez, Israel, Black Sea, Ukraine)", "sample", null, "One line per marker from the day's wire, written by the radar.");
if ((ANTERIOR?.muestra?.repos || []).some((x) => x.sample)) esconder("muestra:repos", "Repos of the week", "sample", null, "The weekly repos routine (GitHub API, private) pushes real names and star counts in data/radar.json.");

/* ---------- texto en llano (PAG-01.2, PAG-02.5, PAG-02.6): plantillas sobre datos reales, nunca hechos inventados ---------- */
const MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DIA3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fechaTxt = (f) => { const t = new Date(diaUTC(f)); return `${t.getUTCDate()} ${MES[t.getUTCMonth()]}`; };
const pctTxt = (x) => { const v = Math.abs(x); return (v < 0.1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : v.toFixed(0)) + "%"; };
const fmtN = (x, dec = 0) => Number(x).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const NOMBRE_TXT = { BTC: "bitcoin", ETH: "ether", SOL: "solana", XAU: "gold", XAG: "silver", US2Y: "the US 2-year yield", US10Y: "the US 10-year yield", US30Y: "the US 30-year yield",
  S2S10: "the 2s10s curve", USD: "the NAOS dollar index", EURUSD: "EUR/USD", USDJPY: "USD/JPY", WTI: "WTI oil", BRENT: "Brent oil", NG: "US natural gas" };
const may = (s) => s[0].toUpperCase() + s.slice(1);
const vivo = (id) => activos.find((a) => a.id === id && !a.viejo);
// una frase por activo: qué hizo y cuánto, con fuente y hora
function frase(a) {
  const n = NOMBRE_TXT[a.id] || a.nombre, intradia = a.fecha.length > 10;
  const sello = intradia ? `(${a.fuente}, ${a.fecha.slice(11, 16)} UTC)` : `(${a.fuente})`;
  if (a.cambio_bp != null) return `${may(n)} ${a.cambio_bp > 0 ? `rose ${a.cambio_bp} bp` : a.cambio_bp < 0 ? `fell ${-a.cambio_bp} bp` : "was unchanged"} to ${a.ultimo.toFixed(2)}% on ${fechaTxt(a.fecha)} ${sello}.`;
  if (a.cambio == null) return `${may(n)} trades at $${fmtN(a.ultimo)}${a.unidad === "USD" && /XAU|XAG/.test(a.id) ? " an ounce" : ""}, spot ${sello}.`;
  if (intradia) return `${may(n)} is ${a.cambio > 0 ? "up" : a.cambio < 0 ? "down" : "flat"}${a.cambio ? " " + pctTxt(a.cambio) : ""} today ${sello}.`;
  return `${may(n)} ${a.cambio > 0 ? "rose" : a.cambio < 0 ? "fell" : "was flat"}${a.cambio ? " " + pctTxt(a.cambio) : ""} on ${fechaTxt(a.fecha)} ${sello}.`;
}
const sinPunto = (s) => s.replace(/\.$/, "");
// "On the tape": los tickers de la historia del mapa que existen en activos, con su cambio y fuente; sin historia, nada
const CORTO = { BTC: "bitcoin", ETH: "ether", XAU: "gold", XAG: "silver", US2Y: "US 2-year yield", US10Y: "US 10-year yield", US30Y: "US 30-year yield", USD: "NAOS dollar index", WTI: "WTI oil", BRENT: "Brent oil", NG: "natural gas" };
function enCinta(sl, sinId) {
  if (!sl) return null;
  const as = tickersDe(sl, null).map((t) => t.radar && vivo(t.radar)).filter((a) => a && a.id !== sinId).filter((a, i, xs) => xs.indexOf(a) === i);
  if (!as.length) return null;
  const mov = (a) => a.cambio_bp != null ? `${a.cambio_bp > 0 ? "+" : a.cambio_bp < 0 ? "−" : ""}${Math.abs(a.cambio_bp)} bp` : a.cambio != null ? `${a.cambio > 0 ? "+" : a.cambio < 0 ? "−" : ""}${pctTxt(a.cambio)}` : `$${fmtN(a.ultimo)}`;
  const sellos = [...new Set(as.map((a) => `${a.fuente} ${a.fecha.length > 10 ? a.fecha.slice(11, 16) + " UTC" : fechaTxt(a.fecha)}`))];
  return `On the tape: ${as.map((a) => `${CORTO[a.id] || a.nombre} ${mov(a)}`).join(", ")} (${sellos.join("; ")}).`;
}
// fuentes de noticias vivas para buscar "qué se movió": wire, historias y titulares del radar, sin Hacker News
const noticias = [...(historias || []), ...(wireFinal || []), ...titularesF].filter((t) => !t.viejo && t.fuente !== "Hacker News")
  .filter((t, i, xs) => xs.findIndex((x) => x.url === t.url) === i);
const RE_TEMA = {
  chips: /\b(chips?|semiconductors?|Nvidia|TSMC|ASML|AMD|Broadcom)\b/i,
  petroleo: /\b(oil|crude|Brent|OPEC|Aramco|Hormuz|refiner(?:y|ies)|tanker|fuel depot)\b/i,
  indices: /\b(S&P 500|Nasdaq|Dow|Wall Street|U\.?S\.? stocks|VIX|oil|crude|Brent|natural gas|gold)\b/i,
  calor: /\b(Nasdaq|tech stocks|chip stocks|Nvidia|Apple|Microsoft|Alphabet|Amazon|Meta|Tesla|megacaps?)\b/i,
  ia: /\b(chips?|semiconductors?|Nvidia|TSMC|ASML|AMD|Broadcom|AI stocks|data cent(?:er|re)s?)\b/i,
};
const buscar = (re, { conMovimiento = false, sin = [] } = {}) => {
  const xs = noticias.filter((t) => re.test(t.titulo) && !sin.includes(t.url));
  return xs.find((t) => movido(t.titulo)) || (conMovimiento ? null : xs[0] || null);
};
const ref = (t) => t && { titulo: t.titulo, fuente: t.fuente, url: t.url, hora: t.hora, ...(movido(t.titulo) ? { movio: movido(t.titulo) } : {}) };

// portada: 3 a 5 historias en texto (quién o qué pasó, qué se movió y cuánto, mercado de predicción, una cosa conectada)
const portada = [];
const sumar = (t, area, mercadoActivo, mercadoTV) => {
  if (!t || portada.some((p) => p.url === t.url)) return;
  const a = mercadoActivo ? vivo(mercadoActivo) : null;
  let mercado = a ? frase(a) : null, etiqueta = "Moved";
  if (!mercado && mercadoTV) { const rel = buscar(RE_TEMA[mercadoTV.tema], { conMovimiento: true, sin: [t.url] });
    mercado = rel ? `Related move, per ${rel.fuente}: "${rel.titulo}".` : `Live chart on this page: ${mercadoTV.etiqueta}.`; if (!rel) etiqueta = "Market"; }
  const sl = historiaDe(t.titulo);
  portada.push({ id: "p" + (portada.length + 1), tipo: "historia", area, titulo: t.titulo, fuente: t.fuente, url: t.url, hora: t.hora, ...(movido(t.titulo) ? { movio: movido(t.titulo) } : {}),
    mercado, mercado_etiqueta: etiqueta, historia_mapa: sl?.id || null, conectado: enCinta(sl, mercadoActivo) });
};
const hs = (historias || []).filter((h) => !h.viejo).sort((x, y) => (movido(y.titulo) ? 1 : 0) - (movido(x.titulo) ? 1 : 0));
const tvTema = (g) => g?.tipo === "tradingview" ? { tema: /SMH/.test(g.simbolo) ? "chips" : "petroleo", etiqueta: g.etiqueta } : null;
for (const h of hs) sumar(h, h.area, h.grafico?.tipo === "propio" ? h.grafico.activo : null, tvTema(h.grafico));
// energía: el titular más nuevo del área, con Brent en vivo vía TradingView
sumar((wireFinal || []).find((t) => !t.viejo && t.area === "Energy"), "Energy", null, { tema: "petroleo", etiqueta: "Brent and WTI crude CFDs via TradingView, in Market" });
// agenda: el próximo evento rojo de EE. UU. si cae en las próximas 36 horas
if (calF && !calF.viejo && calF.proximo && Date.parse(calF.proximo.hora) - AHORA < 36 * 36e5) {
  const p = calF.proximo, mismos = calF.semana.filter((e) => e.hora === p.hora);
  const et = new Date(p.hora).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false });
  const base = (e) => e.evento.replace(/ [my]\/[my]$/, "").replace(/^Core /, "").replace(/Fed Chairman (\w+) Speaks/, "Fed Chair $1 speaks");
  const unicos = [...new Set(mismos.map(base))], nombres = unicos.length > 1 ? unicos.slice(0, -1).join(", ") + " and " + unicos.at(-1) : unicos[0];
  // pronóstico y previo: primero la cifra general (sin "Core"), una por publicación
  const conPron = [...mismos].sort((x, y) => /^Core /.test(x.evento) - /^Core /.test(y.evento)).filter((e) => e.pronostico || e.previo)
    .filter((e, i, xs) => xs.findIndex((x) => base(x) === base(e)) === i).map((e) => `${e.evento}: forecast ${e.pronostico || "n/a"}, previous ${e.previo || "n/a"}`);
  const dia = new Date(p.hora), hoy = dia.toISOString().slice(0, 10) === GENERADO.slice(0, 10);
  const titulo = `US ${nombres}, ${hoy ? "today" : DIA3[dia.getUTCDay()] + " " + fechaTxt(p.hora)} at ${et} ET`, sl = historiaDe(titulo);
  portada.push({ id: "p" + (portada.length + 1), tipo: "agenda", area: "Coming up", titulo,
    fuente: [...new Set(mismos.map((e) => e.publicador).filter(Boolean))].join(", ") || "public release calendar", url: p.url, hora: p.hora,
    mercado: conPron.length ? `${conPron.slice(0, 2).join("; ")} (Forex Factory calendar).` : null, mercado_etiqueta: "Expected",
    historia_mapa: sl?.id || null, conectado: enCinta(sl, null) });
}
portada.splice(5);
// odds: solo si el mercado de la historia del mapa pasa las reglas globales, y cada mercado en una sola historia (la de más arriba)
const mercadosUsados = new Set();
for (const p of portada) {
  const sl = MAPA_PM.historias.find((h) => h.id === p.historia_mapa);
  p.odds = null;
  if (!sl || sl.fuente !== "polymarket") continue;
  const x = await leerPM(sl);
  p.odds_estado = x.omitir || "shown";
  if (x.omitir || mercadosUsados.has(x.mercado)) { if (!x.omitir) p.odds_estado = "market already on a higher story"; continue; }
  mercadosUsados.add(x.mercado);
  p.odds = { texto: x.linea, resultado: x.resultado, url: x.url, p: x.p, leido_utc: x.leido_utc, historia: sl.id };
}
// wire: el enlace al mercado (sin cifra) solo si su mercado pasa las reglas (resuelto, delgado o caído: sin enlace)
for (const t of wireFinal || []) { const sl = t.odds && historiaDe(t.titulo); if (!sl) continue; const x = await leerPM(sl); if (x.omitir) delete t.odds; else t.odds = { nombre: sl.titulo, url: x.url }; }
// las cartas de las historias del día llevan las mismas dos líneas que su titular en la portada
for (const h of historias || []) { const p = portada.find((x) => x.url === h.url); h.lados = { ...h.lados, odds: p?.odds || null, conectado: p?.conectado || null }; }

/* ---------- salas de monitoreo (PAG-03.2, PAG-03.3, D-221) ----------
   Una sala por historia: las de la portada y, por cada historia del mapa curado que la portada no usa, el titular más nuevo
   del wire que la nombra. Cada sala junta lo que ya está ligado: el lugar (por las palabras del titular o, si no, por la
   historia del mapa), los activos propios del mapa, la única cifra de predicción (las mismas reglas y un mercado por
   historia), los titulares relacionados con su hora y fuente, lo que dice la gente (solo si hay datos) y las fuentes.
   Nada se inventa: sin dato, la sala no lleva esa pieza. */
const LUGARES = [
  { id: "hormuz", nombre: "Strait of Hormuz", lon: 56.4, lat: 26.55, re: /\b(hormuz|gulf of oman|tankers?)\b/i },
  { id: "mar-rojo", nombre: "Red Sea and Yemen", lon: 43.4, lat: 14.6, re: /\b(houthis?|yemen|red sea|bab el-mandeb|aramco)\b/i },
  { id: "iran", nombre: "Iran", lon: 51.4, lat: 35.7, re: /\b(iran|iranian|tehran)\b/i },
  { id: "israel", nombre: "Israel and Gaza", lon: 34.8, lat: 31.6, re: /\b(israel|israeli|gaza|lebanon|hezbollah)\b/i },
  { id: "mar-negro", nombre: "Black Sea", lon: 37.8, lat: 44.7, re: /\b(black sea|odesa|novorossiysk)\b/i },
  { id: "ucrania", nombre: "Ukraine", lon: 31.2, lat: 49.2, re: /\b(ukraine|ukrainian|kyiv|zelensky|russia|russian|kremlin|moscow)\b/i },
  { id: "suez", nombre: "Suez Canal", lon: 32.55, lat: 30.3, re: /\b(suez|egypt)\b/i },
  { id: "paises-bajos", nombre: "Netherlands", lon: 5.4, lat: 51.4, re: /\b(asml|netherlands|dutch)\b/i },
  { id: "taiwan", nombre: "Taiwan", lon: 121, lat: 24.8, re: /\b(tsmc|taiwan)\b/i },
  { id: "china", nombre: "China", lon: 116.4, lat: 39.9, re: /\b(china|chinese|beijing)\b/i },
  { id: "japon", nombre: "Japan", lon: 139.7, lat: 35.7, re: /\b(japan|japanese|tokyo|bank of japan)\b/i },
  { id: "frankfurt", nombre: "Frankfurt (ECB)", lon: 8.7, lat: 50.1, re: /\b(ecb|eurozone|euro area|lagarde)\b/i },
  { id: "reino-unido", nombre: "United Kingdom", lon: -0.1, lat: 51.5, re: /\b(uk|britain|british|london|bank of england|starmer)\b/i },
  { id: "nueva-york", nombre: "New York", lon: -74, lat: 40.7, re: /\b(wall street|nyse|nasdaq|s&p 500|blackrock|dow jones)\b/i },
  { id: "washington", nombre: "Washington", lon: -77, lat: 38.9, re: /\b(fed|federal reserve|fomc|powell|cpi|ppi|inflation|bls|white house|congress|senate|midterms?|treasury|sec|social security)\b/i, re2: /(^|[^\w.])(US|U\.S\.)(?![\w])/ },
];
const LUGAR_DE_HISTORIA = { "fed-octubre": "washington", "ipc-septiembre": "washington", ormuz: "hormuz", "iran-cese-fuego": "iran", "midterms-camara": "washington", "fed-kalshi-citado": "washington" };
// si el titular nombra dos lugares o más ("between Ukraine and US") la lectura no es clara: sin alfiler, salvo que uno sea
// el lugar de su historia del mapa. Mejor sin lugar que un lugar adivinado.
const lugarDe = (texto, sl) => {
  const hs = LUGARES.map((l) => { const m = texto.match(l.re) || (l.re2 && texto.match(l.re2)); return m ? { l, palabra: (m[2] || m[1] || m[0]).trim() } : null; }).filter(Boolean);
  const deHistoria = sl && LUGARES.find((x) => x.id === LUGAR_DE_HISTORIA[sl.id]);
  if (hs.length === 1) return hs[0];
  if (hs.length > 1) return hs.find((x) => x.l === deHistoria) || null;
  return deHistoria ? { l: deHistoria, palabra: null } : null;
};
// regla G3: la política solo como impacto en mercado; sin palabra de mercado (las de mapear) queda fuera de las salas
const sinMercado = (t, sl) => (t.area === "Politics" || sl?.politica) && !MERCADO_PALABRAS.some((w) => new RegExp("\\b" + w + "\\b").test(t.titulo.toLowerCase()));
const palabrasDe = (texto, h) => { const t = " " + texto.toLowerCase().replace(/[^a-z0-9$%. -]/g, " ") + " ";
  return (h?.palabras || []).filter((p) => new RegExp("(?<![a-z])" + escRe(p.toLowerCase()) + "(?![a-z])").test(t)); };
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((w) => w.length > 2).slice(0, 4).join("-") || "historia";
const TV_AREA = { AI: { simbolo: "NASDAQ:SMH", etiqueta: "VanEck Semiconductor ETF (SMH), delayed, via TradingView" }, Energy: { simbolo: "TVC:UKOIL", etiqueta: "Brent crude CFD via TradingView" } };
const candidatas = portada.filter((p) => p.tipo === "historia").map((p) => ({ t: p, p, sl: MAPA_PM.historias.find((h) => h.id === p.historia_mapa) || null })).filter((c) => !sinMercado(c.t, c.sl));
const slUsadas = new Set(candidatas.map((c) => c.sl?.id).filter(Boolean));
for (const t of (wireFinal || []).filter((x) => !x.viejo)) { // el wire más nuevo primero
  const sl = historiaDe(t.titulo);
  if (!sl || sl.fuente !== "polymarket" || sinMercado(t, sl) || slUsadas.has(sl.id) || candidatas.some((c) => c.t.url === t.url)) continue; // "citar": solo con cifra de un medio
  slUsadas.add(sl.id); candidatas.push({ t, p: null, sl });
}
const salas = [], idsSala = new Set();
for (const { t, p, sl } of candidatas.slice(0, 8)) {
  const h = (historias || []).find((x) => x.url === t.url);
  let id = sl?.id || slug(t.titulo); while (idsSala.has(id)) id += "-2"; idsSala.add(id);
  const lg = lugarDe(t.titulo, sl);
  // activos propios ligados: el gráfico de la historia y los tickers del mapa con lectura propia; los demás, solo por nombre
  const tks = sl ? tickersDe(sl, null) : [];
  const propios = [h?.grafico?.tipo === "propio" ? h.grafico.activo : null, ...tks.map((x) => x.radar)].filter((x) => x && activos.some((a) => a.id === x && !a.viejo));
  const otros = tks.filter((x) => !x.radar || !activos.some((a) => a.id === x.radar && !a.viejo)).map((x) => ({ simbolo: x.simbolo, nombre: x.nombre }));
  // la única cifra de predicción: la de la portada, o la del mapa si su mercado no salió ya en otra historia
  let odds = p?.odds || null;
  if (!p && sl?.fuente === "polymarket") { const x = await leerPM(sl); if (!x.omitir && !mercadosUsados.has(x.mercado)) { mercadosUsados.add(x.mercado); odds = { texto: x.linea, resultado: x.resultado, url: x.url, p: x.p, leido_utc: x.leido_utc, historia: sl.id }; } }
  // línea de tiempo: titulares vivos ligados a la misma historia del mapa o al mismo lugar, con su fuente y hora
  const rel = [...(wireFinal || []), ...titularesF, ...(historias || [])].filter((x) => !x.viejo && x.url !== t.url && !RE_OKX.test(x.titulo || ""))
    .filter((x, i, xs) => xs.findIndex((y) => y.url === x.url) === i)
    // por lugar solo los lugares precisos: "US" o "Wall Street" ligan demasiado
    .filter((x) => (sl && historiaDe(x.titulo)?.id === sl.id) || (lg && !["washington", "nueva-york"].includes(lg.l.id) && lugarDe(x.titulo, null)?.l.id === lg.l.id))
    .sort((a, b) => String(b.hora).localeCompare(String(a.hora))).slice(0, 5)
    .map((x) => ({ titulo: x.titulo, fuente: x.fuente, url: x.url, hora: x.hora }));
  const hn = hnLab.find((x) => x.url === t.url || x.titulo === t.titulo);
  salas.push({ id, tipo: p ? "portada" : "wire", area: t.area || p?.area, titulo: t.titulo, fuente: t.fuente, url: t.url, hora: t.hora,
    lugar: lg ? { id: lg.l.id, nombre: lg.l.nombre, lon: lg.l.lon, lat: lg.l.lat } : null,
    activos: [...new Set(propios)], otros, odds,
    // sin lectura propia fresca (p. ej. petróleo de la EIA, fechado), el gráfico en vivo de TradingView de su área
    tv: h?.grafico?.tipo === "tradingview" ? { simbolo: h.grafico.simbolo, etiqueta: h.grafico.etiqueta }
      : !propios.some((x) => activos.find((a) => a.id === x)?.fresco) ? TV_AREA[propios.some((x) => ["WTI", "BRENT"].includes(x)) ? "Energy" : t.area] || null : null,
    relacionados: rel,
    dicen: hn ? { fuente: "Hacker News", puntos: hn.puntos, comentarios: hn.comentarios, url: hn.hn } : null,
    ligado: { historia: sl?.titulo || null, palabras: palabrasDe(t.titulo, sl), lugar_palabra: lg?.palabra || null },
    mercado: p?.mercado || null });
}
// para el gráfico "cómo leemos" (PAG-01.4): cuentas reales de la corrida
/* la lectura de hoy (PAG-01.4 r2, D-221): 2 a 4 líneas en llano armadas solo con lo de esta corrida; sin dato, menos líneas.
   Qué historia lidera, qué se movió, qué dicen las odds (una cifra por historia) y cómo se ligó, con el ejemplo de hoy. */
const oddsFrase = (o) => (/^that /.test(o.resultado || "") ? "odds " : "odds of ") + (o.resultado || "the outcome");
const conEl = (n) => (/^(Netherlands|United Kingdom|Strait|Black Sea|Red Sea|Suez)/.test(n) ? "the " : "") + n;
const quien = (s) => s.ligado?.historia?.replace(/, (.*)$/, " ($1)") || (s.lugar ? `${s.area === "AI" ? "AI news" : s.area + " news"} from ${conEl(s.lugar.nombre)}` : `${s.area} news`);
const hoyL = [];
if (salas.length) {
  const [l0, ...resto] = salas;
  hoyL.push({ k: "lidera", t: `The lead story: ${l0.fuente} reports “${l0.titulo}”.` + (resto.length ? ` Also on the page: ${resto.slice(0, 4).map(quien).join(", ").replace(/, ([^,]*)$/, " and $1")}.` : "") });
}
const movidos = [...new Set(salas.flatMap((s) => s.activos))].map((id) => activos.find((a) => a.id === id)).filter((a) => a && a.fresco && !a.viejo && (a.cambio != null || a.cambio_bp != null))
  .sort((a, b) => Math.abs(b.cambio_bp != null ? b.cambio_bp / 10 : b.cambio) - Math.abs(a.cambio_bp != null ? a.cambio_bp / 10 : a.cambio)).slice(0, 2);
if (movidos.length) hoyL.push({ k: "movio", t: "What moved: " + movidos.map((a) => sinPunto(frase(a))).join(". ") + "." });
const conOdds = salas.filter((s) => s.odds).slice(0, 2);
if (conOdds.length) { const hh = conOdds[0].odds.leido_utc.slice(11, 16);
  hoyL.push({ k: "odds", t: `What the markets say: ${conOdds.map((s) => `${oddsFrase(s.odds)} are ${s.odds.p}%`).join("; ").replace(/^./, (c) => c.toUpperCase())} (Polymarket, ${hh} UTC). Prices set by traders, not NAOS forecasts.` }); }
const ej = salas.find((s) => s.odds && s.ligado?.historia && s.activos.some((id) => activos.find((a) => a.id === id && a.fresco))) || salas.find((s) => s.odds && s.ligado?.historia) || null;
if (ej) { const a = ej.activos.map((id) => activos.find((x) => x.id === id && x.fresco)).find(Boolean);
  hoyL.push({ k: "liga", t: `How it ties: the ${ej.fuente} headline uses ${ej.ligado.palabras.map((w) => `“${w}”`).join(" and ")}, ${ej.ligado.palabras.length > 1 ? "words" : "a word"} NAOS files under “${ej.ligado.historia}”, so its room holds ${a ? (CORTO[a.id] || a.nombre) + "'s move, " : ""}that market's ${oddsFrase(ej.odds)}${ej.lugar ? " and a map of " + conEl(ej.lugar.nombre) : ""}.` }); }
const lectura = { hoy: hoyL, ejemplo: ej?.id || null, titulares: temas.total || 0, wire: (wireFinal || []).filter((t) => !t.viejo).length, frescas: activos.filter((a) => a.fresco && !a.viejo).length,
  mercados_leidos: lecturasPM.size, mercados_mostrados: salas.filter((s) => s.odds).length, salas: salas.length };

// una línea de texto por gráfico de TradingView: qué se movió y por qué, del titular que le corresponde; sin titular, nada
const graficos = {};
// primero los gráficos de las historias, después los paneles; cada titular se usa una sola vez
const urlHist = (sim) => (historias || []).filter((h) => h.grafico?.simbolo === sim).map((h) => h.url);
const usados = [];
for (const [k, re, mov] of [["NASDAQ:SMH", RE_TEMA.chips, false], ["TVC:UKOIL", RE_TEMA.petroleo, false], ["ia", RE_TEMA.ia, false],
  ["indices", RE_TEMA.indices, true], ["calor", RE_TEMA.calor, true]]) {
  const t = buscar(re, { conMovimiento: mov, sin: [...urlHist(k), ...usados] });
  if (t) { graficos[k] = ref(t); usados.push(t.url); }
}

// texto en llano bajo BTC y bajo la curva: qué dice la lectura, para quién y en qué plazo; descriptivo, nunca consejo
const explica = {};
const bv = vivo("BTC");
if (bv?.serie?.length > 5) {
  const s = bv.serie.slice(0, -1).map((p) => p[1]); // días cerrados; el último punto es el día en curso
  const mov = s.slice(1).map((v, i) => Math.abs(v / s[i] - 1) * 100).sort((x, y) => x - y), tip = mov[Math.floor(mov.length / 2)];
  const hoy = Math.abs(bv.cambio || 0);
  const tipo = hoy < tip * 0.5 ? "a quiet day so far" : hoy <= tip * 1.5 ? "an ordinary day so far" : "a bigger move than usual";
  explica.BTC = { fecha: bv.fecha, fuente: bv.fuente, texto: [
    `Bitcoin is ${bv.cambio >= 0 ? "up" : "down"} ${pctTxt(bv.cambio || 0)} since 00:00 UTC and ${bv.cambio30 >= 0 ? "up" : "down"} ${pctTxt(bv.cambio30)} over 30 days.`,
    `In the past month its typical daily move was about ${tip.toFixed(1)}%, so today is ${tipo}.`,
    `What this is: one day's price change on CoinGecko's market feed. What this is not: a forecast. A month of gains or losses says little about the next month, and bitcoin has often swung 10% or more within a few weeks.`,
    "Not financial advice."] };
}
const s2 = vivo("S2S10"), y2 = vivo("US2Y"), y10 = vivo("US10Y");
if (s2 && y2 && y10) {
  const v = s2.ultimo, ser = (s2.serie90 || s2.serie).map((p) => p[1]), lo = Math.min(...ser), hi = Math.max(...ser);
  const ultInv = [...(s2.serie90 || s2.serie)].reverse().find((p) => p[1] < 0);
  const forma = v < 0 ? "inverted: the 2-year yield is above the 10-year" : v < 0.25 ? "close to flat" : v <= 1.5 ? "positive, the usual shape" : "steep";
  explica.S2S10 = { fecha: s2.fecha, fuente: s2.fuente, texto: [
    `On ${fechaTxt(s2.fecha)} the 10-year Treasury yield was ${Math.abs(v).toFixed(2)} percentage points ${v >= 0 ? "above" : "below"} the 2-year, so the curve is ${forma}. ` +
      (ultInv ? `It was inverted as recently as ${fechaTxt(ultInv[0])}.` : `In the last 90 days it stayed between ${lo.toFixed(2)} and ${hi.toFixed(2)} points.`),
    `What it has meant before: an inverted curve came before most US recessions since the late 1960s, usually by about 6 to 24 months, and it has also given false alarms.` +
      (v >= 0 ? " In past cycles the curve often turned positive again shortly before a recession began, so a positive curve on its own is no all-clear." : " The timing has varied widely, so it says little about any one year."),
    `What it means for people: the 2-year (${y2.ultimo.toFixed(2)}%) follows what markets expect from the Fed over the next two years, and US mortgage and other long loan rates tend to follow the 10-year (${y10.ultimo.toFixed(2)}%). Together they set the tone for borrowing costs over the coming months.`,
    "Not financial advice."] };
}

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
  miedo: miedoF,
  calendario: calF,
  cierres_citados: citados,
  radar: { fecha: radarFecha, estado: radarEstado, secciones: ["wire", "historias", "cierres_citados", "temas", "titulares"],
    nota: radarEstado === "carried" ? "Kept from the last radar update; the public refresh cannot read the private radar." : null },
  wire: wireFinal,
  historias,
  prediccion,
  temas,
  titulares: titularesF,
  portada,
  salas,
  lectura,
  odds_sello: REGLAS_PM.sello,
  graficos,
  explica,
  escondido,
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
console.log("  portada", portada.length, "· gráficos con texto", Object.keys(graficos).join(", "), "· escondido", escondido.map((e) => e.id).join(", "));
console.log("  radar", radarEstado, radarFecha, "· wire", wireFinal.length, "· moved", wireFinal.filter((t) => t.movio).length, "· HN IA", hnLab.length, "· historias", historias.length);
if (errores.length) console.log("ERRORES:\n  " + errores.join("\n  "));
