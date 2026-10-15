// qa.mjs · guion de QA de la página (Playwright + Chromium). Uso:
//   NODE_PATH=$(npm root -g) node scripts/qa.mjs <url> [--out DIR] [--nombre x] [--solo 390,1440] [--tab 600] [--vivo]
// Por cada ancho (320, 390, 1440 y zoom 200 %) escribe <nombre>-<ancho>.png (primera vista) y <nombre>-<ancho>-full.png
// (página completa), y en report.json y por consola: errores de consola, peticiones locales caídas, scroll horizontal,
// orden de Tab (controles visibles que Tab no alcanza) y, con movimiento reducido, animaciones que siguen corriendo.
// Sale con código 1 si hay errores de consola, scroll horizontal o controles sin foco.
// Las capturas usan ?quieto&captura (sin --vivo) para que dos corridas se puedan comparar; la pasada de Tab y la de
// movimiento reducido corren a 390. El zoom 200 % es una ventana de 1280 px vista a 200 %: 640 px CSS con escala 2.
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--") && /^https?:/.test(a));
const op = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
if (!url) { console.error("uso: node scripts/qa.mjs <url> [--out DIR] [--nombre x] [--solo 390,1440] [--tab 600] [--vivo]"); process.exit(2); }
const OUT = op("out", "qa-salida"), NOMBRE = op("nombre", "pagina"), MAXTAB = Number(op("tab", 600));
const TODOS = [
  { id: "320", w: 320, h: 640, dsf: 2 },
  { id: "390", w: 390, h: 844, dsf: 2 },
  { id: "1440", w: 1440, h: 900, dsf: 1 },
  { id: "zoom200", w: 640, h: 450, dsf: 2 },
];
const solo = op("solo", "");
const VISTAS = solo ? TODOS.filter((v) => solo.split(",").includes(v.id)) : TODOS;
mkdirSync(OUT, { recursive: true });

// ?quieto (como reduced-motion) y ?captura (reloj fijo de la página) hacen la captura repetible; --vivo la toma como la ve el lector
const conQuieto = (u) => u + (u.includes("?") ? "&" : "?") + (args.includes("--vivo") ? "quieto" : "quieto&captura");
const reporte = { url, vistas: {}, tab: null, movimiento: null };
let fallo = false;

async function abrir(browser, v, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dsf, ...extra });
  const page = await ctx.newPage();
  const errores = [], caidas = [], terceros = [];
  const origen = new URL(url).origin;
  // un error de consola cuyo origen es otro sitio (TradingView, fuentes externas) se anota aparte: no es nuestro
  page.on("console", (m) => { if (m.type() === "error") { const u = m.location().url || ""; (u && !u.startsWith(origen) ? terceros : errores).push(m.text()); } });
  page.on("pageerror", (e) => errores.push("pageerror: " + e.message));
  page.on("response", (r) => { const u = r.url(); if (r.status() >= 400 && u.startsWith(new URL(url).origin)) caidas.push(r.status() + " " + u); });
  return { ctx, page, errores, caidas, terceros };
}
async function esperar(page) {
  await page.goto(conQuieto(url), { waitUntil: "load" });
  try { await page.waitForFunction("window.__listo === true", null, { timeout: 8000 }); } catch (e) {}
  await page.waitForTimeout(1800);
}

const browser = await chromium.launch();
for (const v of VISTAS) {
  const { ctx, page, errores, caidas, terceros } = await abrir(browser, v);
  await esperar(page);
  // recorre la página para que lo perezoso cargue, vuelve arriba y mide
  await page.evaluate(async () => { for (let y = 0, n = 0; y < document.documentElement.scrollHeight && n < 80; y += innerHeight, n++) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 120)); } scrollTo({ top: 0, behavior: "instant" }); }); // instant: la página tiene scroll-behavior: smooth
  await page.waitForTimeout(500);
  const med = await page.evaluate(() => {
    const d = document.documentElement;
    // scroll horizontal real: lo que el lector puede mover con el dedo (body tiene overflow-x: clip, así que no basta scrollWidth)
    scrollTo({ left: 60, top: 0, behavior: "instant" }); const movible = scrollX > 0; scrollTo({ left: 0, top: 0, behavior: "instant" });
    // el elemento más ancho que la ventana (primer culpable) para decir dónde está el desborde
    let culpable = null;
    for (const e of document.body.querySelectorAll("*")) { const r = e.getBoundingClientRect(); if (r.width > 0 && r.right > innerWidth + 1 && !e.closest("[hidden]")) { culpable = (e.id ? "#" + e.id : e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/)[0] : "")); break; } }
    return { movible, alto: d.scrollHeight, culpable };
  });
  const horizontal = med.movible;
  await page.screenshot({ path: `${OUT}/${NOMBRE}-${v.id}.png` });
  await page.screenshot({ path: `${OUT}/${NOMBRE}-${v.id}-full.png`, fullPage: true });
  reporte.vistas[v.id] = { ancho: v.w, alto_pagina: med.alto, scroll_horizontal: horizontal, culpable: horizontal ? med.culpable : null, errores_consola: errores, peticiones_caidas: caidas, errores_de_terceros: terceros.length };
  if (horizontal || errores.length) fallo = true;
  await ctx.close();
}

// Tab: cada control visible y habilitado debe recibir foco; se anota el orden
{
  const { ctx, page } = await abrir(browser, TODOS[1]);
  await esperar(page);
  const lista = await page.evaluate(() => {
    const visible = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !e.closest("[hidden],[inert]"); };
    const nom = (e) => (e.id ? "#" + e.id : e.tagName.toLowerCase() + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/)[0] : "")) + (e.getAttribute("href") ? `[${e.getAttribute("href").slice(0, 40)}]` : "");
    window.__nom = nom;
    return [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]')].filter((e) => e.tabIndex >= 0 && !e.disabled && visible(e) && !e.closest("dialog:not([open])")).map(nom);
  });
  const visitados = [];
  await page.evaluate(() => { scrollTo({ top: 0, behavior: "instant" }); document.activeElement && document.activeElement.blur(); });
  for (let i = 0; i < Math.min(MAXTAB, 3 * lista.length + 20); i++) {
    await page.keyboard.press("Tab");
    const n = await page.evaluate(() => (document.activeElement && document.activeElement !== document.body ? window.__nom(document.activeElement) : null));
    if (n && visitados.includes(n) && visitados[0] === n) break;
    if (n) visitados.push(n);
  }
  const sinFoco = MAXTAB >= 3 * lista.length + 20 ? lista.filter((n) => !visitados.includes(n)) : [];
  reporte.tab = { controles_visibles: lista.length, tab_recorridos: visitados.length, orden: visitados, sin_foco: sinFoco, completo: MAXTAB >= 3 * lista.length + 20 };
  if (sinFoco.length) fallo = true;
  await ctx.close();
}

// movimiento reducido: sin ?quieto, con la preferencia del sistema; no debe quedar nada animándose salvo la cinta, que queda fija
{
  const { ctx, page, errores } = await abrir(browser, TODOS[1], { reducedMotion: "reduce" });
  await page.goto(url, { waitUntil: "load" });
  try { await page.waitForFunction("window.__listo === true", null, { timeout: 8000 }); } catch (e) {}
  await page.waitForTimeout(1500);
  const anim = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => (a.effect && a.effect.target ? (a.effect.target.id ? "#" + a.effect.target.id : a.effect.target.tagName.toLowerCase() + "." + String(a.effect.target.className).split(" ")[0]) : "?") + ":" + (a.animationName || a.transitionProperty || "")).slice(0, 20));
  reporte.movimiento = { animaciones_corriendo: anim.length, ejemplos: anim, errores_consola: errores };
  if (anim.length) console.warn("aviso: con movimiento reducido siguen " + anim.length + " animaciones (revisar si son nuevas)");
  await ctx.close();
}
await browser.close();

writeFileSync(`${OUT}/report-${NOMBRE}.json`, JSON.stringify(reporte, null, 1));
for (const [id, r] of Object.entries(reporte.vistas)) console.log(`${id.padEnd(8)} alto ${r.alto_pagina} · scroll horizontal: ${r.scroll_horizontal ? "SI (" + r.culpable + ")" : "no"} · errores de consola: ${r.errores_consola.length} (terceros ${r.errores_de_terceros}) · caidas: ${r.peticiones_caidas.length}`);
for (const [id, r] of Object.entries(reporte.vistas)) for (const e of [...r.errores_consola, ...r.peticiones_caidas]) console.log(`  [${id}] ${e.slice(0, 160)}`);
if (reporte.tab) console.log(`Tab: ${reporte.tab.controles_visibles} controles visibles, ${reporte.tab.tab_recorridos} recorridos, sin foco: ${reporte.tab.sin_foco.length ? reporte.tab.sin_foco.join(", ") : "ninguno"}${reporte.tab.completo ? "" : " (recorrido parcial, subir --tab)"}`);
if (reporte.movimiento) console.log(`Movimiento reducido: ${reporte.movimiento.animaciones_corriendo} animaciones corriendo`);
console.log(fallo ? "QA: FALLA" : "QA: ok");
process.exit(fallo ? 1 : 0);
