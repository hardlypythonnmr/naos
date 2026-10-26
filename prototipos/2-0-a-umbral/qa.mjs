// qa.mjs · pruebas de humo del prototipo (Playwright). Uso: NODE_PATH=$(npm root -g) node qa.mjs [puerto]
// Sirve desde /home/user/naos con: python3 -m http.server 8771
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const puerto = process.argv[2] || "8771", base = `http://localhost:${puerto}/prototipos/2-0-a-umbral/`;
const fallos = [], ok = (c, m) => { if (!c) fallos.push(m); };
const TOC = "button, a[href], input:not([type=hidden]), select, textarea, summary";
async function tocables(p) {
  return p.evaluate((sel) => [...document.querySelectorAll("#app " + sel)].filter(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && !e.closest("details:not([open]) > :not(summary)") && !e.closest(".sr") && !e.closest("[hidden]") && !(e.classList.contains("sr")) && !e.classList.contains("btn-volver") ; }).length, TOC);
}
const b = await chromium.launch();
for (const lang of ["es", "en"]) {
  const url = base + (lang === "es" ? "es/index.html" : "index.html"), L = lang === "es";
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: L ? "es-CO" : "en-US", acceptDownloads: true });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => { fallos.push(`${lang}: petición externa ${r.request().url()}`); r.abort(); });
  const p = await ctx.newPage(); const errs = [];
  p.on("console", m => { if (m.type() === "error" || m.type() === "warning") errs.push(m.text()); }); p.on("pageerror", e => errs.push(e.message));
  const q = (s) => p.locator(s);
  // tocables a 390
  const maximos = { p1a: 9, p1b: 7, p2: 8, p3: 7, p3b: 3 };
  for (const [id, mx] of Object.entries(maximos)) {
    await p.goto(url + "#" + id); await p.waitForTimeout(300);
    const n = await tocables(p); ok(n <= (id === "p3b" ? 3 : mx), `${lang} ${id}: ${n} tocables > ${mx}`);
    const peq = await p.evaluate(() => [...document.querySelectorAll("#app button, #app a.btn, #app .chip, #app .op span, #app summary, #app select")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 47.5 && !e.closest("[hidden]") && !e.closest(".sr"); }).map(e => e.textContent.trim().slice(0, 30)));
    ok(peq.length === 0, `${lang} ${id}: blancos < 48 px: ${peq.join("|")}`);
    const sc = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); ok(!sc, `${lang} ${id}: scroll horizontal`);
  }
  // S1 camino feliz
  await p.goto(url); await p.waitForTimeout(200);
  await q(".chip").first().click(); await q("button.btn").first().click();
  await q("label.op").nth(1).click(); await q("button.btn").first().click();
  ok(await p.evaluate(() => location.hash) === "#p2", `${lang} S1: no llegó a P2`);
  await q("button.btn").first().click();   // Siguiente
  ok(await p.evaluate(() => location.hash) === "#p3", `${lang} S1: no llegó a P3`);
  ok(await q("#casilla").isChecked() === false, `${lang} S1: casilla encendida`);
  await q("#app button.btn").filter({ hasText: L ? "Listo" : "Done" }).click(); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => location.hash) === "#p3b", `${lang} S1: no llegó a P3b`);
  const a = await q("#p3b-escena .acciones .btn").evaluateAll(es => es.map(e => Math.round(e.getBoundingClientRect().height) + "x" + Math.round(e.getBoundingClientRect().width)));
  ok(a.length === 2 && a[0] === a[1], `${lang} S1: botones de P3b distintos ${a}`);
  ok(await p.evaluate(() => document.body.dataset.escena) === "noche", `${lang} S1: P3b no atenuó`);
  ok((await p.locator("#vivo").textContent()).length > 3, `${lang} S1: aria-live vacío`);
  await q("#p3b-escena .acciones .btn.sec").click(); await p.waitForTimeout(200);   // Apagar y borrar
  ok(await p.evaluate(() => localStorage.getItem("naos-v6-senales")) === null, `${lang} S1: no borró`);
  // S2, S3, S4
  const escribir = async (t) => { await p.goto(url + "#p1a"); await q("#cuando").fill(t); await q("button.btn").first().click(); await p.waitForTimeout(150); return p.evaluate(() => location.hash); };
  ok(await escribir(L ? "quiero morir" : "I want to die") === "#p8a", `${lang} S2`);
  ok(await escribir(L ? "saltarme las comidas" : "skip meals") === "#p8b", `${lang} S3`);
  ok(!/\d{3}/.test(await q(".seguridad").innerText().then(t => t.replace(/findahelpline\.com/, ""))), `${lang} S3: texto B con teléfono`);
  for (const f of L ? ["no comer frente al televisor", "ayuno de pantallas"] : ["digital fasting", "no eating in front of the TV"]) ok(await escribir(f) === "#p1b", `${lang} S4 ${f}`);
  // S5, S6 sin lugar y ponerla igual
  await p.goto(url + "#p1b"); await q("button.btn-op").click(); await q("label.op").nth(2).click(); await q("button.btn").first().click();
  ok(await q(".acciones .btn").count() === 2, `${lang} S5: compuerta sin dos botones`);
  await q(".acciones .btn.sec").click(); await p.waitForTimeout(150);
  ok((await q(".debil").count()) === 1, `${lang} S6: falta "señal débil"`);
  // S7 movimiento reducido
  await p.emulateMedia({ reducedMotion: "reduce" }); await p.goto(url + "#p1c"); await q(".interruptor").click();
  ok(await p.evaluate(() => getComputedStyle(document.querySelector(".cuarto .noche")).transitionDuration) === "0s", `${lang} S7: P1c con transición`);
  await p.emulateMedia({ reducedMotion: "no-preference" });
  // S9 P5
  await p.goto(url + "?q=7#s=l%C3%A1mpara"); ok((await q("h1").innerText()).includes("lámpara"), `${lang} S9`);
  // ICS
  await p.goto(url + "#p3"); await q("#casilla").check(); await q("#franja").selectOption("mediodia");
  await q("summary").first().click();
  const [dl] = await Promise.all([p.waitForEvent("download"), q("#app button").filter({ hasText: L ? "Agregar al calendario" : "Add to calendar" }).click()]);
  const txt = (await import("node:fs")).readFileSync(await dl.path(), "utf8");
  ok(!/VALARM|ORGANIZER|ATTENDEE/.test(txt) && (txt.match(/BEGIN:VEVENT/g) || []).length === 2 && !/DTSTART[^\n]*Z/.test(txt), `${lang} ICS inválido`);
  // S10 salir
  for (const id of ["p1a", "p1b", "p2", "p3"]) { await p.goto(url + "#" + id); await p.locator("#app a[href='#hoy']").last().click(); ok(await p.evaluate(() => location.hash) === "#hoy", `${lang} S10 ${id}`); }
  // 320 y 200 % en P9
  await p.setViewportSize({ width: 320, height: 640 });
  for (const id of ["p1a", "p2", "p3", "p9", "mapa"]) { await p.goto(url + "#" + id); await p.waitForTimeout(200); ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `${lang} 320 ${id}: scroll horizontal`); }
  // tab llega a todo en P1a
  ok(errs.length === 0, `${lang} consola: ${errs.slice(0, 3).join(" | ")}`);
  await ctx.close();
}
await b.close();
console.log(fallos.length ? "FALLOS:\n" + fallos.join("\n") : "todo en verde");
process.exit(fallos.length ? 1 : 0);
