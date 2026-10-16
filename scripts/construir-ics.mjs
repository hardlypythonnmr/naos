// construir-ics.mjs · el calendario descargable de data/agenda.json (RFC 5545), para "Upcoming" (agenda.html) y el widget.
// Node 18+, sin dependencias. Uso: node scripts/construir-ics.mjs   (también lo corren construir-semana.mjs y construir-datos.mjs)
//   assets/ics/<id>.ics         un evento, para "Add to calendar"
//   assets/ics/<categoria>.ics  una categoría, para suscribirse (webcal://)
//   assets/ics/naos-agenda.ics  todo
// Con hora (UTC): DTSTART en UTC, aviso 30 min antes. Solo con fecha, o período de varios días (Ramadán, Cuaresma, cumbres):
// todo el día, VALUE=DATE con DTEND exclusivo (el día después del último), aviso el día anterior a las 09:00.
// DTSTAMP sale de "revisado" de la agenda: la misma agenda da los mismos archivos (sin cambios falsos en git).
// Fechas o horas "expected" lo dicen en SUMMARY. Descriptivo, sin consejo financiero.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const V = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const A = createRequire(import.meta.url)("../assets/js/agenda-comun.js");
const SITIO = "https://hardlypythonnmr.github.io/naos/";

const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// pliega a 75 octetos sin partir un carácter UTF-8; la continuación empieza con un espacio
function plegar(linea) {
  const out = []; let cur = "", n = 0, lim = 75;
  for (const ch of linea) {
    const b = Buffer.byteLength(ch);
    if (n + b > lim) { out.push(cur); cur = " "; n = 1; lim = 75; }
    cur += ch; n += b;
  }
  out.push(cur); return out.join("\r\n");
}
const fechaICS = (f) => f.replace(/-/g, "");
const masUnDia = (f) => new Date(Date.parse(f + "T00:00:00Z") + 864e5).toISOString().slice(0, 10);
const utcICS = (h) => h.replace(/[-:]/g, "").replace(/Z$/, "") + "00Z"; // 2026-10-20T01:00Z → 20261020T010000Z

function resumen(e) {
  const marcas = [];
  if (e.fecha_estado === "expected" && !/\bexpected\b/i.test(e.titulo)) marcas.push("expected date");
  if (e.hora && e.hora_estado === "expected") marcas.push("expected time");
  return e.titulo + (marcas.length ? ` (${marcas.join(", ")})` : "");
}
function descripcion(e) {
  const l = e.angulo ? [e.angulo] : [];
  if (e.hora) l.push(`Time: ${e.hora.slice(11, 16)} UTC${e.hora_local ? `, ${e.hora_local}` : ""}${e.hora_estado === "expected" ? " (expected, not confirmed by the source)" : ""}.`);
  else l.push("Time not set by the source; listed as an all-day event.");
  if (e.fecha_estado === "expected") l.push("Expected date: provisional until the official announcement (moon sighting or official calendar).");
  if (e.nota) l.push(`Note: ${e.nota}`);
  l.push(e.url ? `Source: ${e.fuente}. ${e.url}` : "Date and topic only. Official source pending.");
  if (e.url2) l.push(`Also: ${e.url2}`);
  l.push(`NAOS Upcoming: ${SITIO}agenda.html#${e.id}`);
  l.push("Descriptive, not financial advice.");
  return l.join("\n\n");
}
function vevent(e, dtstamp) {
  const c = A.cat(e.categoria), L = ["BEGIN:VEVENT", `UID:${e.id}@naos.hardlypythonnmr.github.io`, `DTSTAMP:${dtstamp}`];
  if (e.hora) L.push(`DTSTART:${utcICS(e.hora)}`);
  else L.push(`DTSTART;VALUE=DATE:${fechaICS(e.fecha)}`, `DTEND;VALUE=DATE:${fechaICS(masUnDia(e.fecha_fin || e.fecha))}`);
  L.push(`SUMMARY:${esc(resumen(e))}`, `DESCRIPTION:${esc(descripcion(e))}`, `URL:${e.url || SITIO + "agenda.html#" + e.id}`, `CATEGORIES:${esc(c.nombre)}`);
  if (e.pais) L.push(`LOCATION:${esc(e.pais)}`);
  L.push("TRANSP:TRANSPARENT", `STATUS:${e.fecha_estado === "expected" || e.hora_estado === "expected" ? "TENTATIVE" : "CONFIRMED"}`);
  L.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(resumen(e))}`,
    e.hora ? "TRIGGER:-PT30M" : "TRIGGER:-PT15H", "END:VALARM", "END:VEVENT"); // todo el día: 09:00 del día anterior
  return L;
}
function calendario(nombre, desc, eventos, dtstamp) {
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NAOS//Upcoming agenda//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(nombre)}`, `X-WR-CALDESC:${esc(desc)}`, "REFRESH-INTERVAL;VALUE=DURATION:P1D", "X-PUBLISHED-TTL:P1D"];
  for (const e of eventos) L.push(...vevent(e, dtstamp));
  L.push("END:VCALENDAR");
  return L.map(plegar).join("\r\n") + "\r\n";
}

export function construirIcs({ silencio = false } = {}) {
  const ag = JSON.parse(fs.readFileSync(path.join(V, "data/agenda.json"), "utf8"));
  const eventos = A.conIds(ag.eventos || []).map(A.publico);
  const dtstamp = fechaICS(ag.revisado || new Date().toISOString().slice(0, 10)) + "T000000Z";
  const dir = path.join(V, A.ICS);
  fs.mkdirSync(dir, { recursive: true });
  // limpia los .ics que ya no corresponden a ningún evento (un evento cancelado o renombrado)
  const quedan = new Set([...eventos.map((e) => e.id), ...A.CATEGORIAS.map((c) => c.archivo), A.todo].map((x) => x + ".ics"));
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".ics") && !quedan.has(f)) fs.unlinkSync(path.join(dir, f));
  const pie = "Scheduled events from NAOS Upcoming, each with the source that states its date. Descriptive, not financial advice.";
  for (const e of eventos) fs.writeFileSync(path.join(dir, e.id + ".ics"), calendario(`NAOS · ${e.titulo}`, pie, [e], dtstamp));
  let n = 0;
  for (const c of A.CATEGORIAS) {
    const xs = eventos.filter((e) => e.categoria === c.id); if (!xs.length) continue; n++;
    fs.writeFileSync(path.join(dir, c.archivo + ".ics"), calendario(`NAOS · ${c.nombre}`, pie, xs, dtstamp));
  }
  fs.writeFileSync(path.join(dir, A.todo + ".ics"), calendario("NAOS · Upcoming", pie, eventos, dtstamp));
  const sinCat = eventos.filter((e) => !A.CATEGORIAS.some((c) => c.id === e.categoria));
  if (sinCat.length) console.warn("construir-ics: categoría sin archivo propio:", [...new Set(sinCat.map((e) => e.categoria))].join(", "));
  if (!silencio) console.log(`construir-ics: ${eventos.length} eventos, ${n} categorías y el calendario completo en ${A.ICS}`);
  return { eventos: eventos.length, categorias: n };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) construirIcs();
