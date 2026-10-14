// construir-semana.mjs · la grilla pública de la semana (PAG-08.1, PROD-01.3, D-224) en data/semana.json.
// Node 18+, sin dependencias. Uso: node scripts/construir-semana.mjs [--desde=AAAA-MM-DD] [--sin-red]
//   Semana: del lunes --desde (por defecto, el próximo lunes; hoy si es lunes) al domingo.
//   Filas = secciones (Market, News, AI, Behavior); celdas = piezas { dia, slot, format, title, asset_id?, status }.
//   Briefs: tres fijos por día hábil (apertura de Londres 08:20 UK, apertura de Nueva York 09:41 ET, cierre 16:22 ET), cada
//   uno con lo agendado que anticipa: los eventos de impacto alto ("red folder") del calendario semanal de Forex Factory
//   cuando ese calendario ya cubre la semana (lo publica el fin de semana; solo título y hora) y data/agenda.json (eventos
//   fuera del calendario, cada uno con su URL). Sin fecha conocida, la pieza va con dia null ("date TBD"): nada se inventa.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const V = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const SIN_RED = process.argv.includes("--sin-red");
const leer = (f, d = null) => { try { return JSON.parse(fs.readFileSync(path.join(V, f), "utf8")); } catch { return d; } };
const dia = (t) => new Date(t).toISOString().slice(0, 10);

// semana objetivo
const hoy = new Date(); hoy.setUTCHours(0, 0, 0, 0);
const lunes = arg("desde") || dia(hoy.getTime() + (hoy.getUTCDay() === 1 ? 0 : (8 - hoy.getUTCDay()) % 7) * 864e5);
const DIAS = Array.from({ length: 7 }, (_, i) => dia(Date.parse(lunes + "T00:00:00Z") + i * 864e5));

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

// calendario de Forex Factory (impacto alto), solo si cubre la semana objetivo
let ff = [], ffNota = null;
if (!SIN_RED) {
  try {
    const r = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", { headers: { "user-agent": "curl/8.5.0" } });
    const d = await r.json();
    ff = d.filter((e) => e.impact === "High").map((e) => ({ titulo: `${e.country} ${e.title}`, hora: new Date(e.date).toISOString().slice(0, 16) + "Z", fuente: "Forex Factory weekly calendar" }))
      .filter((e) => e.hora.slice(0, 10) >= DIAS[0] && e.hora.slice(0, 10) <= DIAS[6]);
  } catch (e) { ffNota = "Forex Factory calendar not reached: " + e.message; }
}
if (!ff.length && !ffNota) ffNota = "Forex Factory publishes the week's calendar over the weekend; the briefs list its red-folder events once it covers this week.";
// agenda: con hora (UTC) o solo con fecha (hora null: va al primer brief de ese día, o al último de la semana si cae en fin de semana)
const agenda = (leer("data/agenda.json", { eventos: [] }).eventos || []).map((e) => ({ ...e, f: e.hora ? e.hora.slice(0, 10) : e.fecha }))
  .filter((e) => e.f && e.url && e.f >= DIAS[0] && e.f <= DIAS[6])
  .map((e) => ({ titulo: e.titulo, hora: e.hora || null, fecha: e.f, fuente: e.fuente, url: e.url }));
const eventos = [...ff, ...agenda].sort((a, b) => (a.hora || a.fecha + "T00:00Z").localeCompare(b.hora || b.fecha + "T00:00Z"));

const items = [];
// briefs: cada uno anticipa lo agendado hasta el brief siguiente
const briefs = [];
for (const f of DIAS.slice(0, 5)) for (const s of SLOTS) briefs.push({ dia: f, slot: s.id, hora_utc: aUTC(f, s.hora, s.zona), hora_local: s.local, titulo: s.titulo });
briefs.forEach((b, i) => {
  const hasta = briefs[i + 1]?.hora_utc || DIAS[6] + "T23:59Z";
  items.push({ seccion: "market", dia: b.dia, slot: b.slot, hora_utc: b.hora_utc, hora_local: b.hora_local, format: "brief", title: b.titulo, status: "planned",
    eventos: eventos.filter((e) => e.hora ? e.hora >= b.hora_utc && e.hora < hasta : (DIAS.indexOf(e.fecha) < 5 ? b.dia === e.fecha && b.slot === "london" : i === briefs.length - 1))
      .map(({ titulo, hora, fecha, fuente, url }) => ({ titulo, hora: hora ?? null, ...(hora ? {} : { fecha }), fuente, ...(url ? { url } : {}) })) });
});

// la serie de IA (series/ia-del-chat-al-codigo): la parte 1, el lunes; sus Shorts sin fecha todavía
const SERIE = [[1, "Why the chat forgets"], [2, "What you need"], [3, "The first prompt"], [4, "A memory file"], [5, "Your first real task"], [6, "Guardrails and undo"]];
items.push({ seccion: "ai", dia: DIAS[0], slot: null, format: "medium", title: "From chat to code, part 1", asset_id: "ai-chat-al-codigo-1", status: "planned" });
for (const [n, t] of SERIE) items.push({ seccion: "ai", dia: null, slot: null, format: "short", title: `From chat to code · ${n}. ${t}`, asset_id: "ai-chat-al-codigo-1", status: "planned" });

// el resto de la biblioteca (data/assets.json), sin fecha conocida
const SECCION = { ai: "ai", trading: "market", behavior: "behavior" };
const FORMATO = { "behavior-articulos": "special", "behavior-afirmaciones-dormir": "special" };
for (const c of leer("data/assets.json", { categorias: [] }).categorias) for (const x of c.piezas) {
  if (x.id === "ai-chat-al-codigo-1") continue;
  items.push({ seccion: SECCION[c.id] || "ai", dia: null, slot: null, format: FORMATO[x.id] || "medium", title: x.titulo, asset_id: x.id, status: x.estado === "published" ? "out" : "planned" });
}

const salida = {
  nota: "Grilla pública de la semana (D-224). La arma scripts/construir-semana.mjs; esquema en el README. Sin fecha conocida: dia null.",
  generado: new Date().toISOString().slice(0, 16) + "Z",
  semana: { desde: DIAS[0], hasta: DIAS[6] },
  secciones: [{ id: "market", titulo: "Market" }, { id: "news", titulo: "News" }, { id: "ai", titulo: "AI" }, { id: "behavior", titulo: "Behavior" }],
  formatos: [{ id: "brief", titulo: "Brief" }, { id: "short", titulo: "Short" }, { id: "medium", titulo: "Medium" }, { id: "special", titulo: "Special" }],
  slots: SLOTS.map(({ id, titulo, local }) => ({ id, titulo, local })),
  eventos_nota: ffNota,
  items,
};
fs.writeFileSync(path.join(V, "data/semana.json"), JSON.stringify(salida, null, 1));
console.log("semana.json", salida.semana, "·", items.length, "items ·", eventos.length, "eventos ·", ffNota || "calendario ok");
