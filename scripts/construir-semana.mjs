// construir-semana.mjs · la grilla pública del mes (PAG-08.1, PROD-01.3, D-224, D-227) en data/semana.json.
// Node 18+, sin dependencias. Uso: node scripts/construir-semana.mjs [--desde=AAAA-MM-DD] [--semanas=4] [--sin-red]
//   Semanas: del lunes --desde (por defecto, el del plan del mes, 19-oct-2026) y las siguientes; la página muestra una a la
//   vez con "semana anterior / siguiente" y abre en la semana en curso.
//   Filas = secciones (Market, News, AI, Behavior); celdas = piezas { dia, slot, format, title, asset_id?, status, nota? }.
//   Briefs: tres fijos por día hábil (apertura de Londres 08:20 UK, apertura de Nueva York 09:41 ET, cierre 16:22 ET), cada
//   uno con lo agendado que anticipa: los eventos de impacto alto ("red folder") del calendario semanal de Forex Factory
//   cuando ese calendario cubre la semana (lo publica el fin de semana; solo título y hora) y data/agenda.json (eventos
//   fuera del calendario, cada uno con su URL). D-227: los tres viven en la página; en video solo el cierre (Short EN) y
//   una apertura solo el día con evento rojo (video: true).
//   Piezas fechadas: el plan del mes de la junta (empresa/junta/2026-10-14-plan-mes/acta-r1.md §3) y las fechas que da para
//   después del mes. Sin fecha en el acta, dia null ("date TBD") con su motivo en nota: nada se inventa.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const V = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const SIN_RED = process.argv.includes("--sin-red");
const leer = (f, d = null) => { try { return JSON.parse(fs.readFileSync(path.join(V, f), "utf8")); } catch { return d; } };
const dia = (t) => new Date(t).toISOString().slice(0, 10);

// semanas objetivo: las del plan del mes (19-oct a 15-nov) salvo --desde
const SEMANAS = Number(arg("semanas") || 4);
const lunes = arg("desde") || "2026-10-19";
const DIAS = Array.from({ length: SEMANAS * 7 }, (_, i) => dia(Date.parse(lunes + "T00:00:00Z") + i * 864e5));
const semanas = Array.from({ length: SEMANAS }, (_, i) => ({ desde: DIAS[i * 7], hasta: DIAS[i * 7 + 6] }));
const HABILES = DIAS.filter((f) => { const d = new Date(f + "T12:00:00Z").getUTCDay(); return d > 0 && d < 6; });

// hora local a UTC (con el cambio de horario de cada ciudad, vía Intl)
function aUTC(fecha, hhmm, zona) {
  const [h, m] = hhmm.split(":").map(Number);
  let t = Date.parse(`${fecha}T${hhmm}:00Z`);
  for (let i = 0; i < 2; i++) { // corrige por el desfase de la zona en ese instante
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: zona, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(t)).map((x) => [x.type, x.value]));
    const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    t += Date.UTC(+fecha.slice(0, 4), +fecha.slice(5, 7) - 1, +fecha.slice(8, 10), h, m) - local;
  }
  return new Date(t).toISOString().slice(0, 16) + "Z";
}
const SLOTS = [
  { id: "london", titulo: "London open brief", hora: "08:20", zona: "Europe/London", local: "08:20 UK" },
  { id: "ny", titulo: "New York open brief", hora: "09:41", zona: "America/New_York", local: "09:41 ET" },
  { id: "close", titulo: "US close brief", hora: "16:22", zona: "America/New_York", local: "16:22 ET" },
];

// calendario de Forex Factory (impacto alto): solo cubre su semana; lo que caiga dentro del mes entra
let ff = [], ffNota = null;
if (!SIN_RED) {
  try {
    const r = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", { headers: { "user-agent": "curl/8.5.0" } });
    const d = await r.json();
    ff = d.filter((e) => e.impact === "High").map((e) => ({ titulo: `${e.country} ${e.title}`, hora: new Date(e.date).toISOString().slice(0, 16) + "Z", fuente: "Forex Factory weekly calendar", rojo: true }))
      .filter((e) => e.hora.slice(0, 10) >= DIAS[0] && e.hora.slice(0, 10) <= DIAS.at(-1));
  } catch (e) { console.error("Forex Factory:", e.message); ffNota = "Forex Factory's weekly calendar could not be read in this run; the briefs list its red-folder events once it is."; } // el detalle del error va al log, nunca a la página
}
if (!ff.length && !ffNota) ffNota = "Forex Factory publishes each week's calendar over the weekend; the briefs list its red-folder events once it covers that week.";
// agenda: con hora (UTC) o solo con fecha (hora null: va al primer brief de ese día, o al último de la semana si cae en fin de semana).
// Rojo (para el video de apertura, D-227): Forex Factory de impacto alto, o en la agenda un dato de EE. UU. o un banco central marcado para tendencias
const agenda = (leer("data/agenda.json", { eventos: [] }).eventos || []).map((e) => ({ ...e, f: e.hora ? e.hora.slice(0, 10) : e.fecha }))
  .filter((e) => e.f && e.url && e.f >= DIAS[0] && e.f <= DIAS.at(-1))
  .map((e) => ({ titulo: e.titulo, hora: e.hora || null, fecha: e.f, fuente: e.fuente, url: e.url, rojo: !!(e.tendencias && e.hora && ["us_data", "central_bank"].includes(e.categoria)) }));
const eventos = [...ff, ...agenda].sort((a, b) => (a.hora || a.fecha + "T00:00Z").localeCompare(b.hora || b.fecha + "T00:00Z"));

const items = [];
// briefs: cada uno anticipa lo agendado hasta el brief siguiente (o hasta el fin de su semana)
const briefs = [];
for (const f of HABILES) for (const s of SLOTS) briefs.push({ dia: f, slot: s.id, hora_utc: aUTC(f, s.hora, s.zona), hora_local: s.local, titulo: s.titulo });
const conApertura = new Set(); // a lo sumo una apertura en video por día
const finSemana = (f) => semanas.find((w) => f >= w.desde && f <= w.hasta).hasta;
briefs.forEach((b, i) => {
  const sig = briefs[i + 1], ultimo = !sig || finSemana(sig.dia) !== finSemana(b.dia), hasta = ultimo ? finSemana(b.dia) + "T23:59Z" : sig.hora_utc;
  const evs = eventos.filter((e) => e.hora ? e.hora >= b.hora_utc && e.hora < hasta
    : (HABILES.includes(e.fecha) ? b.dia === e.fecha && b.slot === "london" : ultimo && finSemana(e.fecha) === finSemana(b.dia)));
  const abre = b.slot !== "close" && !conApertura.has(b.dia) && evs.some((e) => e.rojo); if (abre) conApertura.add(b.dia);
  const video = b.slot === "close" || abre;
  items.push({ seccion: "market", dia: b.dia, slot: b.slot, hora_utc: b.hora_utc, hora_local: b.hora_local, format: "brief", title: b.titulo, status: "planned",
    video, ...(video ? { video_nota: b.slot === "close" ? "Short (EN)" : "Video: red event ahead" } : {}),
    eventos: evs.map(({ titulo, hora, fecha, fuente, url }) => ({ titulo, hora: hora ?? null, ...(hora ? {} : { fecha }), fuente, ...(url ? { url } : {}) })) });
});

// el plan del mes de la junta (acta-r1 §3, D-227) y las fechas que da después del mes. [dia, sección, formato, título, asset_id, nota]
const SERIE = [[1, "Why the chat forgets"], [2, "What you need"], [3, "The first prompt"], [4, "A memory file"], [5, "Your first real task"], [6, "Guardrails and undo"]];
const CORTOS = ["2026-10-21", "2026-10-23", "2026-10-29", "2026-10-31", "2026-11-04", "2026-11-07"];
const PLAN = [
  ["2026-10-19", "ai", "medium", "From chat to code, part 1", "ai-chat-al-codigo-1", "With a LinkedIn post in Spanish"],
  ...SERIE.map(([n, t], i) => [CORTOS[i], "ai", "short", `From chat to code · ${n}. ${t}`, "ai-chat-al-codigo-1", null]),
  ["2026-10-24", "behavior", "page", "Behavior articles no. 1", "behavior-articulos", null],
  ["2026-10-26", "news", "page", "FOMC: what to watch", null, "Date, time and what is expected; no forecast"],
  ["2026-10-27", "market", "medium", "What a price is", "trading-que-es-el-precio", null],
  ["2026-10-28", "news", "special", "FOMC anchor", null, "Prearmed: press conference 14:30 ET, out around 16:30 ET with the figure"],
  ["2026-11-01", "behavior", "special", "Affirmations for sleep: 20-minute guided review", "behavior-afirmaciones-dormir", "A guided review, no hidden loop. An illustration, not a sleep treatment"],
  ["2026-11-02", "ai", "medium", "Your first Claude environment", "ai-primer-entorno-claude", null],
  ["2026-11-03", "news", "page", "US elections: market impact only", null, "Politics as market impact; no synthetic images of politicians"],
  ["2026-11-05", "news", "page", "Payrolls preview", null, "Preview of the October jobs report"],
  ["2026-11-06", "news", "special", "Payrolls anchor", null, "Only if the FOMC anchor passed green; otherwise a page"],
  ["2026-11-07", "behavior", "page", "Behavior sessions, long form: the session map", "behavior-largos-ejercicio", "The video comes on Sun 29 Nov"],
  ["2026-11-09", "news", "page", "CPI preview", null, "Preview of the October CPI"],
  ["2026-11-10", "market", "medium", "Reading charts", "trading-graficos", null],
  ["2026-11-10", "news", "special", "CPI anchor", null, "Same rule as payrolls: only if the anchors pass green"],
  ["2026-11-14", "behavior", "page", "Behavior articles no. 2", "behavior-articulos", null],
  ["2026-11-15", "behavior", "special", "Affirmations for sleep: guided review in Spanish", "behavior-afirmaciones-dormir", "In Spanish"],
  // después del mes
  ["2026-11-16", "ai", "medium", "Your first commit", "ai-primer-commit", null],
  ["2026-11-24", "market", "medium", "Candles", "trading-velas", null],
  ["2026-11-29", "behavior", "medium", "Behavior sessions, long form", "behavior-largos-ejercicio", null],
  ["2026-11-30", "ai", "medium", "Your first GitHub page", "ai-primera-pagina-github", null],
  ["2026-12-09", "news", "special", "FOMC anchor (December)", null, "Second anchor of the plan"],
  ["2026-12-14", "ai", "medium", "Your first token", "ai-primer-token", null],
  ["2027-01-11", "ai", "medium", "What an API is", "ai-que-es-una-api", null],
  ["2027-01-25", "ai", "medium", "Your first APIs", "ai-primeras-apis", null],
  ["2027-02-08", "ai", "medium", "From one email to a campaign", "ai-de-un-correo-a-una-campana", "Closes the AI ladder"],
];
for (const [d, seccion, format, title, asset_id, nota] of PLAN)
  items.push({ seccion, dia: d, slot: null, format, title, ...(asset_id ? { asset_id } : {}), status: "planned", ...(nota ? { nota } : {}) });

// lo ya publicado antes del mes (D-234): su clave en data/enlaces.json es dia|asset_id, así "Today's Short" lo muestra con su enlace
// [dia, sección, título, asset_id, hora UTC, hora local]
const PUBLICADOS = [
  ["2026-10-15", "behavior", "Closer to yourself. This is NAOS", "promo", "2026-10-15T19:30Z", "15:30 ET"],
];
for (const [d, seccion, title, asset_id, hora_utc, hora_local] of PUBLICADOS)
  items.push({ seccion, dia: d, slot: null, hora_utc, hora_local, format: "short", title, asset_id, status: "published", nota: "Launch promo, on YouTube Shorts and Instagram Reels" });

// el resto de la biblioteca (data/assets.json): sin fecha en el acta, va sin fecha y con su motivo
const SECCION = { ai: "ai", trading: "market", behavior: "behavior" };
const ESPERA = { "trading-estrategias": "In review: waits for the lawyer's opinion", "trading-indicador-1": "In review: waits for the lawyer's opinion" };
const fechados = new Set(PLAN.map((x) => x[4]).filter(Boolean));
for (const c of leer("data/assets.json", { categorias: [] }).categorias) for (const x of c.piezas) {
  if (fechados.has(x.id)) continue;
  items.push({ seccion: SECCION[c.id] || "ai", dia: null, slot: null, format: "medium", title: x.titulo, asset_id: x.id, status: x.estado === "published" ? "out" : "planned", ...(ESPERA[x.id] ? { nota: ESPERA[x.id] } : {}) });
}
items.sort((a, b) => (a.dia || "9999").localeCompare(b.dia || "9999") || (a.hora_utc || "").localeCompare(b.hora_utc || ""));

const salida = {
  nota: "Grilla pública del mes (D-224, D-227). La arma scripts/construir-semana.mjs desde el plan del mes de la junta; esquema en el README. Sin fecha en el acta: dia null y nota.",
  generado: new Date().toISOString().slice(0, 16) + "Z",
  semana: semanas[0],
  semanas,
  secciones: [{ id: "market", titulo: "Market" }, { id: "news", titulo: "News" }, { id: "ai", titulo: "AI" }, { id: "behavior", titulo: "Behavior" }],
  formatos: [{ id: "brief", titulo: "Brief" }, { id: "short", titulo: "Short" }, { id: "medium", titulo: "Medium" }, { id: "special", titulo: "Special" }, { id: "page", titulo: "Page" }],
  slots: SLOTS.map(({ id, titulo, local }) => ({ id, titulo, local })),
  eventos_nota: ffNota,
  items,
};
fs.writeFileSync(path.join(V, "data/semana.json"), JSON.stringify(salida, null, 1));
console.log("semana.json", semanas[0].desde, "a", semanas.at(-1).hasta, "·", items.length, "items ·", eventos.length, "eventos ·", ffNota || "calendario ok");

// el calendario descargable (Upcoming): un .ics por evento, por categoría y uno con todo, desde la misma agenda
try { (await import("./construir-ics.mjs")).construirIcs(); } catch (e) { console.error("construir-ics:", e.message); }
