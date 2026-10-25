// qa.mjs · pruebas de humo del prototipo Taller (Playwright). Uso desde /home/user/naos:
//   python3 -m http.server 8772 &   y luego   NODE_PATH=$(npm root -g) node prototipos/2-0-b-taller/qa.mjs [puerto]
// Revisa, en EN y ES a 390 px: errores de consola, peticiones externas, scroll horizontal, tamaño de controles, camino feliz,
// ramas de "Después", .ics de Sleep, "Me dolió o me mareé", ?quieto, ?fase=1 y que la app funcione sin almacenamiento.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const puerto = process.argv[2] || "8772", raiz = `http://localhost:${puerto}/prototipos/2-0-b-taller/`;
const fallos = [], ok = (c, m) => { if (!c) fallos.push(m); };
const b = await chromium.launch();

async function nuevo(lang, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: opts.w || 390, height: opts.h || 844 }, locale: lang === "es" ? "es-CO" : "en-US", acceptDownloads: true, reducedMotion: opts.rm ? "reduce" : "no-preference" });
  if (opts.sinAlmacen) await ctx.addInitScript(() => { const f = () => { throw new Error("blocked"); }; Object.defineProperty(window, "localStorage", { get: f }); });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => { fallos.push(`${lang}: petición externa ${r.request().url()}`); r.abort(); });
  const p = await ctx.newPage(); const errs = [];
  p.on("console", m => { if (m.type() === "error" || m.type() === "warning") errs.push(m.text()); });
  p.on("pageerror", e => errs.push("PAGEERR " + e.message));
  return { ctx, p, errs, url: raiz + (lang === "es" ? "es/index.html" : "index.html") };
}
const tocables = (p) => p.evaluate(() => [...document.querySelectorAll("#app button, #app a[href], #app input:not([type=hidden]), #app select, #app textarea, #app summary")].filter(e => {
  const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && !e.closest("[hidden]") && !e.classList.contains("sr") && !e.closest("details:not([open]) > :not(summary)");
}).map(e => ({ t: (e.textContent || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 30), h: Math.round(e.getBoundingClientRect().height), w: Math.round(e.getBoundingClientRect().width), tag: e.tagName })));
const clic = async (p, nombre) => { await p.getByRole("button", { name: nombre }).first().click(); await p.waitForTimeout(220); };
const hash = (p) => p.evaluate(() => location.hash);
const ev = (p) => p.evaluate(() => window.TALLER.eventos.map(e => e.n + JSON.stringify(e.d)));
const T = { en: { hazla: /Do it/, tres: "Three", no: "Not today", mareo: "It hurt or I got dizzy", salio: "Got it", medias: "Halfway", cerrar: "Done for today", otra: "Once more", empezar: "Start", si: "Yes", listo: "Done", sig: "Next", hazlaTuya: "Make it yours", llev: "Take it with you", saltar: "Skip" },
  es: { hazla: /Hazla/, tres: "Tres", no: "Hoy no", mareo: "Me dolió o me mareé", salio: "Salió", medias: "A medias", cerrar: "Cerrar por hoy", otra: "Otra vez", empezar: "Empezar", si: "Sí", listo: "Listo", sig: "Siguiente", hazlaTuya: "Hazla tuya", llev: "Llévatela", saltar: "Saltar" } };

for (const lang of ["en", "es"]) {
  const L = T[lang];
  // 1) pantallas a 390 y 320: errores, scroll, controles
  for (const w of [390, 320]) {
    const { ctx, p, errs, url } = await nuevo(lang, { w });
    for (const a of ["#hoy", "?puerta=move&src=pieza#r/move", "?puerta=breathe#r/breathe", "?puerta=sleep#r/sleep", "?puerta=divine#r/divine", "#despues", "#tuya", "#obs", "#ajustes", "#como", "#mapa", "#etiqueta", "?fase=1#repaso", "?fase=1#apoyos"]) {
      await p.goto(url + a); await p.waitForTimeout(250);
      const sc = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); ok(!sc, `${lang} ${w} ${a}: scroll horizontal`);
      const peq = (await tocables(p)).filter(x => x.h < 44 && !(x.tag === "A" && x.h < 44 && false)); 
      ok(peq.length === 0 || w === 320, `${lang} ${w} ${a}: controles < 44 px: ${peq.map(x => x.t + ":" + x.h).join("|")}`);
    }
    ok(errs.length === 0, `${lang} ${w}: consola ${errs.slice(0, 3).join(" | ")}`);
    await ctx.close();
  }
  // 2) P1: seis cosas sin scroll en 390 x 844
  {
    const { ctx, p, url } = await nuevo(lang);
    await p.goto(url + "?puerta=move&src=pieza#r/move"); await p.waitForTimeout(300);
    const fondo = await p.evaluate(() => { const e = document.querySelector(".seguro-bloque button"); return e.getBoundingClientRect().bottom; });
    ok(fondo <= 844, `${lang} P1: el enlace de seguridad queda en ${fondo} (> 844)`);
    const txt = await p.evaluate(() => document.querySelector("#app").innerText);
    ok(!/exercise|\u2014/i.test(txt), `${lang} P1: texto prohibido`);
    ok(await p.evaluate(() => !!document.querySelector('[data-siempre="1"]')), `${lang} P1: sin línea Siempre visible`);
    await ctx.close();
  }
  // 3) camino feliz y ramas
  {
    const { ctx, p, errs, url } = await nuevo(lang);
    await p.goto(url + "?puerta=move&src=pieza#r/move"); await p.waitForTimeout(300);
    await clic(p, L.tres); await clic(p, L.hazla); ok((await hash(p)) === "#juega", `${lang}: P1 no lleva a P2`);
    await clic(p, L.si); await clic(p, L.empezar);
    await p.waitForFunction(() => location.hash === "#despues", null, { timeout: 4000 + 3 * 4000 + 4000 });
    // dos "Hoy no" con Tres seguidos -> baja a Una
    await clic(p, L.no); await clic(p, "Felt lazy|Me dio pereza".split("|")[lang === "en" ? 0 : 1]); await clic(p, lang === "en" ? "Leave" : "x").catch(() => {});
    await p.goto(url + "#r/move"); await p.waitForTimeout(250);
    await clic(p, L.hazla); await p.waitForTimeout(100);
    await p.evaluate(() => { window.TALLER.ctx.tamano = "3"; location.hash = "despues"; }); await p.waitForTimeout(250);
    await clic(p, L.no); await clic(p, lang === "en" ? "People around" : "Había gente");
    await p.goto(url + "#r/move"); await p.waitForTimeout(250);
    const marcada = await p.evaluate(() => document.querySelector('.tamanos [aria-pressed="true"]').dataset.id);
    ok(marcada === "1", `${lang}: tras dos "Hoy no" con Tres debía marcar Una y marcó ${marcada}`);
    ok((await p.evaluate(() => document.getElementById("hoy-te-toca") && !document.getElementById("hoy-te-toca").hidden)), `${lang}: falta la línea "Hoy te toca"`);
    await clic(p, lang === "en" ? "Five" : "Cinco");
    ok((await p.evaluate(() => window.TALLER.S("move").tamano)) === "5", `${lang}: subir debe ser un toque de la persona`);
    // mareo: solo tope_hasta, sin evento, sin motivo
    await p.goto(url + "#r/move"); await p.waitForTimeout(200); await p.evaluate(() => { location.hash = "despues"; }); await p.waitForTimeout(250);
    const antes = (await ev(p)).length, h0 = await p.evaluate(() => window.TALLER.st().historial.length);
    await clic(p, L.no); await clic(p, L.mareo);
    const despues = (await ev(p)).filter(x => x.startsWith("despues")).length, h1 = await p.evaluate(() => window.TALLER.st().historial.length);
    const tope = await p.evaluate(() => window.TALLER.S("move").tope_hasta), guardado = await p.evaluate(() => localStorage.getItem("naos-proto-v1"));
    ok(!!tope, `${lang}: no guardó tope_hasta`); ok(h1 === h0, `${lang}: "Me dolió" quedó en el historial`);
    ok(!/dizz|mare|hurt|dol/i.test(guardado.replace(/"ultimo":"[^"]*"/g, "")), `${lang}: se guardó el motivo del mareo`);
    ok(!(await ev(p)).some(x => /mareo|dizzy|hurt/i.test(x)), `${lang}: evento con el motivo`);
    void antes; void despues;
    // tope activo: Tres y Cinco deshabilitados
    await p.goto(url + "#r/move"); await p.waitForTimeout(250);
    ok(await p.evaluate(() => document.querySelector('.tamanos [data-id="3"]').disabled && document.querySelector('.tamanos [data-id="5"]').disabled), `${lang}: el tope de 7 días no deshabilita Tres y Cinco`);
    ok(errs.length === 0, `${lang} flujo: consola ${errs.slice(0, 3).join(" | ")}`);
    await ctx.close();
  }
  // 4) P4: chip, tipo, hora, read-back, Llévatela, .ics
  {
    const { ctx, p, errs, url } = await nuevo(lang);
    await p.goto(url + "?puerta=move#tuya"); await p.waitForTimeout(300);
    await p.locator("#cuando-libre").fill(lang === "en" ? "I wake up at 7am" : "me despierto a las 7");
    await clic(p, L.llev);
    ok(await p.evaluate(() => !document.querySelector(".tuya .grande-voz[role=status]").hidden), `${lang}: no avisó de la hora`);
    ok(/clock|hora/i.test(await p.locator(".tuya .grande-voz").first().innerText()), `${lang}: texto de la hora`);
    await p.locator("#cuando-libre").fill(lang === "en" ? "the kettle clicks" : "suena la tetera");
    await clic(p, lang === "en" ? "A sound" : "Un sonido");
    await clic(p, lang === "en" ? "Farther" : "Más lejos");
    await clic(p, L.llev);
    const rb = await p.locator(".grande-voz").first().innerText(); ok(/kettle|tetera/i.test(rb) && /cue|señal/i.test(rb), `${lang}: read-back ${rb}`);
    await clic(p, L.llev);   // abre la hoja
    await p.getByRole("button", { name: lang === "en" ? "Add to my calendar" : "Agendar en mi calendario" }).click(); await p.waitForTimeout(200);
    const [dl] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: lang === "en" ? "Download the event" : "Bajar el evento" }).click()]);
    const ics = await p.evaluate(() => window.TALLER.ultimoIcs);
    ok(/DTSTART:\d{8}T\d{6}\r\n/.test(ics) && /RRULE:FREQ=WEEKLY/.test(ics) && !/VALARM/.test(ics), `${lang}: .ics de Move`);
    ok(dl.suggestedFilename().endsWith(".ics"), `${lang}: nombre .ics`);
    await p.getByRole("button", { name: lang === "en" ? "Save the card" : "Guardar la tarjeta" }).click(); await p.waitForTimeout(500);
    const [dl2] = await Promise.all([p.waitForEvent("download"), p.getByRole("button", { name: lang === "en" ? "Download the image" : "Bajar la imagen" }).click()]);
    ok(dl2.suggestedFilename().endsWith(".png"), `${lang}: tarjeta png`);
    // Sleep: ninguna hora entre 19:00 y 06:59, sin VALARM
    await p.goto(url + "?puerta=sleep#tuya"); await p.waitForTimeout(250);
    await p.evaluate(() => window.TALLER.llevatela("sleep")); await p.waitForTimeout(200);
    await p.getByRole("button", { name: lang === "en" ? "Add to my calendar" : "Agendar en mi calendario" }).click(); await p.waitForTimeout(150);
    const horas = await p.evaluate(() => [...document.querySelectorAll("#ics-hora option")].map(o => o.value).filter(Boolean));
    ok(horas.length > 0 && horas.every(x => x >= "07:00" && x < "19:00"), `${lang}: horas de Sleep ${horas.join(",")}`);
    ok(await p.evaluate(() => !document.getElementById("ics-aviso")), `${lang}: Sleep ofrece aviso`);
    ok(!(await p.evaluate(() => window.TALLER.armarIcs("sleep", "07:00", true).texto)).includes("VALARM"), `${lang}: Sleep con VALARM`);
    ok(errs.length === 0, `${lang} P4: consola ${errs.slice(0, 3).join(" | ")}`);
    await ctx.close();
  }
  // 5) P7, P5, P6, ajustes
  {
    const { ctx, p, errs, url } = await nuevo(lang);
    await p.goto(url + "?puerta=move&vista=obstruccion"); await p.waitForTimeout(300);
    ok((await hash(p)) === "#obs", `${lang}: ?vista=obstruccion`);
    await p.locator(".chips.col .chip").first().click(); await p.waitForTimeout(200);
    ok(/always stays|siempre queda/i.test(await p.locator("#app").innerText()), `${lang}: P7 sin "lo que siempre queda"`);
    ok((await ev(p)).some(x => x.startsWith("obstruccion")), `${lang}: evento obstruccion`);
    await p.goto(url + "?fase=1&dev=1#hoy"); await p.waitForTimeout(250);
    await p.evaluate(() => { const g = window.TALLER.st(), s = window.TALLER.S("move"); s.cuando = "When the kettle clicks"; s.guardada = window.TALLER.sumar(window.TALLER.hoy(), -3); g.actual = "move"; window.TALLER.guardar(); });
    await p.goto(url + "?fase=1&dev=1"); await p.waitForTimeout(300);
    ok((await hash(p)) === "#repaso", `${lang}: con ?fase=1 y regla vieja debía abrir P5, abrió ${await hash(p)}`);
    await p.locator("#recuerda").fill("when the kettle clicks I sit"); await p.keyboard.press("Enter"); await p.waitForTimeout(150);
    await clic(p, lang === "en" ? "Show me" : "Muéstrame");
    ok((await ev(p)).some(x => x.startsWith("recuerda")), `${lang}: evento recuerda`);
    ok(!(await p.evaluate(() => localStorage.getItem("naos-proto-v1"))).includes("kettle clicks I sit"), `${lang}: se guardó el texto de P5`);
    await p.goto(url + "?fase=1#apoyos"); await p.waitForTimeout(250);
    for (let i = 0; i < 4; i++) await p.locator(".fila-apoyo .chip").nth(i).click();
    ok(/last one|última/i.test(await p.locator("#app").innerText()), `${lang}: P6 sin la última`);
    await p.goto(url + "#ajustes"); await p.waitForTimeout(250);
    await p.getByRole("switch").nth(1).click(); ok(await p.evaluate(() => window.TALLER.st().sin_ayudas), `${lang}: Sin ayudas`);
    const [d3] = await Promise.all([p.waitForEvent("download"), clic(p, lang === "en" ? "Export" : "Exportar")]); ok(d3.suggestedFilename().endsWith(".json"), `${lang}: exportar`);
    await clic(p, lang === "en" ? "Delete everything" : "Borrar todo"); await p.locator(".aj .par .btn").first().click(); await p.waitForTimeout(200);
    ok((await p.evaluate(() => window.TALLER.st().actual)) === null, `${lang}: Borrar todo`);
    ok(errs.length === 0, `${lang} P5-P7: consola ${errs.slice(0, 3).join(" | ")}`);
    await ctx.close();
  }
  // 6) ?quieto y movimiento reducido: corte directo, barra en lugar de anillo
  for (const modo of ["quieto", "rm"]) {
    const { ctx, p, errs, url } = await nuevo(lang, { rm: modo === "rm" });
    await p.goto(url + (modo === "quieto" ? "?quieto&" : "?") + "puerta=breathe#juega"); await p.waitForTimeout(250);
    await clic(p, L.empezar); await p.waitForTimeout(500);
    ok(await p.evaluate(() => getComputedStyle(document.querySelector(".anillo")).height !== "0px" && document.querySelector(".anillo").classList.contains("es-barra")), `${lang} ${modo}: el anillo no es barra`);
    ok(await p.evaluate(() => getComputedStyle(document.querySelector(".pantalla")).animationName === "none"), `${lang} ${modo}: sigue animando`);
    ok(await p.evaluate(() => !!document.querySelector('[role=progressbar][aria-valuemax="4"]')), `${lang} ${modo}: sin progressbar 0 a 4`);
    ok(await p.evaluate(() => document.getElementById("vivo").textContent.length > 0), `${lang} ${modo}: región viva vacía`);
    ok(errs.length === 0, `${lang} ${modo}: consola ${errs.slice(0, 3).join(" | ")}`);
    await ctx.close();
  }
  // 7) sin almacenamiento
  {
    const { ctx, p, errs, url } = await nuevo(lang, { sinAlmacen: true });
    await p.goto(url + "?puerta=move"); await p.waitForTimeout(300);
    await clic(p, L.hazla); await clic(p, L.empezar === "Start" ? "No" : "No").catch(() => {});
    ok((await hash(p)) === "#juega", `${lang}: sin almacenamiento no avanza`);
    ok(errs.filter(e => !/blocked/.test(e)).length === 0, `${lang} sin almacén: consola ${errs.slice(0, 3).join(" | ")}`);
    await ctx.close();
  }
  // 8) Tab llega a todo control visible en P1
  {
    const { ctx, p, url } = await nuevo(lang);
    await p.goto(url + "?puerta=move#r/move"); await p.waitForTimeout(300);
    const vis = (await tocables(p)).length; const vistos = new Set();
    for (let i = 0; i < vis + 8; i++) { await p.keyboard.press("Tab"); vistos.add(await p.evaluate(() => { const e = document.activeElement; return e && e.closest("#app") ? (e.textContent || e.getAttribute("aria-label") || "") + "|" + [...document.querySelectorAll("#app *")].indexOf(e) : ""; })); }
    vistos.delete(""); ok(vistos.size >= vis, `${lang}: Tab llegó a ${vistos.size} de ${vis} controles en P1`);
    await ctx.close();
  }
}
await b.close();
console.log(fallos.length ? "FALLOS (" + fallos.length + "):\n" + fallos.join("\n") : "qa.mjs: todo en orden");
process.exit(fallos.length ? 1 : 0);
