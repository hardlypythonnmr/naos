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
//   Las piezas fechadas de la grilla ya no van aquí (lote E, D-252): las lleva data/temas.json. Sin fecha, dia null ("date TBD")
//   con su motivo en nota: nada se inventa.
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

// el plan del mes de D-227 (acta-r1 §3) salió con el lote E (D-252): las piezas fechadas viven en la grilla (data/temas.json,
// scripts/construir-temas.mjs) y la portada las lee de ahí. Aquí quedan los briefs, lo ya publicado y la biblioteca sin fecha.

// lo ya publicado antes del mes (D-234): su clave en data/enlaces.json es dia|asset_id, así "Today's Short" lo muestra con su enlace
// [dia, sección, título, asset_id, hora UTC, hora local]
const PUBLICADOS = [
  ["2026-10-15", "behavior", "Closer to yourself. This is NAOS", "promo", "2026-10-15T19:30Z", "15:30 ET"],
  ["2026-10-20", "behavior", "It can wait two breaths", "respirar", "2026-10-20T23:00Z", "19:00 ET"],
  ["2026-10-21", "behavior", "Hold the first bite", "comer", "2026-10-21T23:00Z", "19:00 ET"],
];
for (const [d, seccion, title, asset_id, hora_utc, hora_local] of PUBLICADOS)
  items.push({ seccion, dia: d, slot: null, hora_utc, hora_local, format: "short", title, asset_id, status: "published", nota: "Launch promo, on YouTube Shorts and Instagram Reels" });

// el resto de la biblioteca (data/assets.json): sin fecha en el acta, va sin fecha y con su motivo
const SECCION = { ai: "ai", trading: "market", behavior: "behavior" };
const ESPERA = { "trading-estrategias": "In review: waits for the lawyer's opinion", "trading-indicador-1": "In review: waits for the lawyer's opinion" };
const fechados = new Set();
for (const c of leer("data/assets.json", { categorias: [] }).categorias) for (const x of c.piezas) {
  if (fechados.has(x.id)) continue;
  items.push({ seccion: SECCION[c.id] || "ai", dia: null, slot: null, format: "medium", title: x.titulo, asset_id: x.id, status: x.estado === "published" ? "out" : "planned", ...(ESPERA[x.id] ? { nota: ESPERA[x.id] } : {}) });
}
items.sort((a, b) => (a.dia || "9999").localeCompare(b.dia || "9999") || (a.hora_utc || "").localeCompare(b.hora_utc || ""));

const salida = {
  nota: "Briefs, lo ya publicado y la biblioteca sin fecha (D-224). Las piezas fechadas viven en data/temas.json desde el lote E (D-252); esquema en el README. Sin fecha: dia null y nota.",
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
// las páginas de tema, los hubs, los enlaces cortos y el sitemap (lote E, D-252), desde data/temas.json y data/enlaces.json
try { (await import("./construir-temas.mjs")).construirTemas(); } catch (e) { console.error("construir-temas:", e.message); }
