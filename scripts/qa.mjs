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
if (!url) { console.error("uso: node scripts/qa.mjs <url> [--out DIR] [--nombre x] [--solo 390,1440] [--tab 600] [--vivo] | <url-base> --temas"); process.exit(2); }
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

// ---------- --temas: las páginas de tema, los enlaces cortos y la portada nueva (lote E, D-252) ----------
// NODE_PATH=$(npm root -g) node scripts/qa.mjs http://localhost:8123/ --temas [--out DIR]
// 1. todo enlace interno de los hubs y las páginas de tema responde 200 (y su ancla existe); 2. cada enlace corto termina en su
// tarjeta con ?src= y la marca "You came from this Short"; 3. la guía nunca abre en páginas de tema ni con ?src= o ancla, y sí al
// entrar a The Present desde la portada limpia; 4. la pausa de Cella detiene a todas; 5. la franja trae hoy y lo próximo desde la grilla.
if (args.includes("--temas")) {
  const base = url.endsWith("/") ? url : url + "/";
  const T = JSON.parse(await (await fetch(base + "data/temas.json")).text());
  const r = { enlaces: 0, enlaces_rotos: [], anclas_rotas: [], cortos: 0, cortos_mal: [], guia: {}, cella: null, franja: null, franja_es: null, idioma_partes: [], errores: [] };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => r.errores.push("pageerror " + page.url() + ": " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && (m.location().url || "").startsWith(new URL(base).origin)) r.errores.push("console " + page.url() + ": " + m.text()); });
  // 1. enlaces internos de hubs y páginas de tema
  const una = ["temas/", "temas/humanity/", "temas/the-present/", ...T.pilares.filter((P) => T.paginas.some((p) => p.pilar === P.id)).map((P) => `temas/pilar/${P.id}/`), ...T.paginas.map((p) => `temas/${p.slug}/`)];
  const paginas = [...una, "es/", ...una.map((u) => "es/" + u)]; // dos ediciones (D-253)
  // idioma de las partes (WCAG 3.1.2): texto con marcas del español (ñ, ¿, ¡, tildes o tres palabras vacías) fuera de un [lang=es]
  // en una página en inglés; los nombres propios cortos (Medellín, Bogotá) no cuentan
  const partes = () => { const ES = /[ñ¿¡]|[áéíóú]\w*\s+\w+|\b(de|del|la|las|los|el|para|con|una|y)\b(?:.*\b(de|del|la|las|los|el|para|con|una|y)\b){2}/i, PROPIO = /^(Medellín|Bogotá|Brasília|Medellín\s*)$/;
    const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) { const t = n.textContent.trim(), e = n.parentElement; if (!t || !e || e.closest("script,style,[hidden]")) continue;
      const l = (e.closest("[lang]") || document.documentElement).getAttribute("lang"); if (l === "en" && ES.test(t) && !PROPIO.test(t)) out.push(t.slice(0, 80)); }
    return out; };
  const estado = new Map(), ids = new Map();
  const idsDe = async (u) => { if (!ids.has(u)) { const h = await (await page.request.get(u)).text(); ids.set(u, new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))); } return ids.get(u); };
  for (const pg of paginas) {
    await page.goto(base + pg, { waitUntil: "load" });
    const hrefs = await page.evaluate(() => [...document.querySelectorAll("a[href], link[rel=stylesheet], script[src], link[rel=icon]")].map((a) => a.href || a.src));
    for (const h of hrefs) {
      if (!h.startsWith(new URL(base).origin)) continue;
      const [sinAncla, ancla] = h.split("#");
      if (!estado.has(sinAncla)) { const res = await page.request.get(sinAncla); estado.set(sinAncla, res.status()); r.enlaces++; }
      if (estado.get(sinAncla) !== 200) r.enlaces_rotos.push(`${pg} -> ${h} (${estado.get(sinAncla)})`);
      else if (ancla && /\/$|\.html$/.test(sinAncla.split("?")[0]) && !(await idsDe(sinAncla)).has(decodeURIComponent(ancla))) r.anclas_rotas.push(`${pg} -> ${h}`);
    }
    if (await page.locator("#guia, .gu-hoja").count()) r.guia["tema:" + pg] = "la guía aparece";
    if (!pg.startsWith("es/")) for (const t of await page.evaluate(partes)) r.idioma_partes.push(`${pg}: "${t}"`);
  }
  // 2. enlaces cortos
  for (const x of T.piezas.filter((x) => x.corto)) {
    await page.goto(base + `s/${x.codigo}/`, { waitUntil: "load" });
    await page.waitForURL((u) => u.pathname.includes("/temas/"), { timeout: 4000 }).catch(() => {});
    const u = new URL(page.url()), es = x.lang === "es" && !(x.idiomas || []).length;
    const ok = u.pathname.endsWith(`${es ? "/es" : ""}/temas/${x.pagina}/`) && (es || !u.pathname.includes("/es/")) && u.searchParams.get("src") === x.codigo && u.hash === "#" + x.id &&
      await page.locator(`#${x.id}.t-vienes`).count() === 1 && await page.locator(`#${x.id} .t-marca-js`).first().textContent().catch(() => "") === (es ? "Viniste de este Short" : "You came from this Short");
    if (ok) r.cortos++; else r.cortos_mal.push(`${x.codigo} -> ${page.url()}`);
  }
  // 3. la guía: abre solo al entrar a The Present desde la portada limpia
  const abierta = async () => page.evaluate(() => !!document.querySelector(".gu-hoja.gu-abierta"));
  for (const [k, q, entrar] of [["portada limpia, al entrar a The Present", "", true], ["portada con ?src=", "?src=1019h", true], ["portada con ?utm_source=", "?utm_source=ig", true], ["portada con ancla", "#mercados", false]]) {
    await page.goto(base + q, { waitUntil: "load" });
    await page.waitForTimeout(900);
    if (entrar && await page.locator(".puerta-pres .puerta-a").count()) { await page.locator(".puerta-pres .puerta-a").click(); await page.waitForTimeout(2200); }
    await page.mouse.wheel(0, 300); await page.waitForTimeout(600);
    r.guia[k] = await abierta();
  }
  // 4. la pausa de Cella (portada limpia, en las puertas): todas quedan quietas y aria-pressed cambia en todos los botones
  await page.goto(base, { waitUntil: "load" }); await page.waitForTimeout(1200);
  const foto = () => page.evaluate(() => [...document.querySelectorAll(".cella-v")].map((e) => e.innerHTML.length + ":" + e.innerHTML.slice(200, 400)).join("|"));
  const nb = await page.locator(".cella-pausa").count();
  const a1 = await foto(); await page.waitForTimeout(700); const a2 = await foto();
  if (nb) await page.locator(".puerta-hum .cella-pausa").click();
  await page.waitForTimeout(300); const b1 = await foto(); await page.waitForTimeout(900); const b2 = await foto();
  const pres = await page.evaluate(() => [...document.querySelectorAll(".cella-pausa")].map((b) => b.getAttribute("aria-pressed")));
  r.cella = { botones: nb, se_mueve_antes: a1 !== a2, quieta_despues: b1 === b2, aria_pressed: pres };
  // 5. la franja: hoy (o lo próximo) desde la grilla, con enlace a la tarjeta
  await page.goto(base + "?hoy=2026-10-20#the-present", { waitUntil: "load" }); await page.waitForTimeout(1500);
  r.franja = await page.evaluate(() => ({ fichas: document.querySelectorAll("#secuencia .fr-f").length, titulo: document.querySelector("#fr-t")?.textContent, enlaces: [...document.querySelectorAll("#secuencia a[href*='temas/']")].map((a) => a.getAttribute("href")) }));
  // la franja en español (es/): el día del primer Short en español, con su tarjeta en es/temas/
  const diaES = (T.piezas.find((x) => x.lang === "es") || {}).fecha;
  if (diaES) { await page.goto(base + `es/?hoy=${diaES}`, { waitUntil: "load" }); await page.waitForTimeout(1500);
    r.franja_es = await page.evaluate(() => ({ fichas: document.querySelectorAll("#secuencia .fr-f").length, titulo: document.querySelector("#fr-t")?.textContent, guia: !!document.querySelector(".gu-hoja"),
      enlaces: [...document.querySelectorAll("#secuencia a.fr-n")].map((a) => a.getAttribute("href")), en: [...document.querySelectorAll("#secuencia .fr-n [lang=en]")].length })); }
  // y en la portada EN, ese mismo día: la pieza en español enlaza a su tarjeta de la edición ES
  if (diaES) { await page.goto(base + `?hoy=${diaES}#the-present`, { waitUntil: "load" }); await page.waitForTimeout(1500);
    r.franja.es_a_es = await page.evaluate(() => [...document.querySelectorAll("#secuencia a.fr-n")].filter((a) => a.querySelector("[lang=es]")).every((a) => a.getAttribute("href").startsWith("es/temas/"))); }
  await ctx.close(); await browser.close();
  writeFileSync(`${OUT}/report-temas.json`, JSON.stringify(r, null, 1));
  const malo = r.enlaces_rotos.length || r.anclas_rotas.length || r.cortos_mal.length || r.errores.length || Object.entries(r.guia).some(([k, v]) => (k.startsWith("tema:") ? true : k.startsWith("portada limpia") ? v !== true : v !== false)) ||
    !r.cella.botones || !r.cella.quieta_despues || r.cella.aria_pressed.some((x) => x !== "true") || !r.franja.fichas || !r.franja.enlaces.length ||
    r.idioma_partes.length || (r.franja_es && (!r.franja_es.fichas || r.franja_es.titulo !== "Hoy y lo próximo" || r.franja_es.guia || r.franja.es_a_es === false));
  console.log(`enlaces internos: ${r.enlaces} revisados, rotos ${r.enlaces_rotos.length}, anclas rotas ${r.anclas_rotas.length}`);
  console.log(`enlaces cortos: ${r.cortos} de ${T.piezas.filter((x) => x.corto).length} aterrizan en su tarjeta${r.cortos_mal.length ? "; mal: " + r.cortos_mal.slice(0, 5).join(", ") : ""}`);
  console.log(`guía: ${JSON.stringify(r.guia)}`);
  console.log(`Cella: ${JSON.stringify(r.cella)}`);
  console.log(`franja (?hoy=2026-10-20): ${r.franja.fichas} fichas, ${r.franja.enlaces.length} enlaces a tarjetas; pieza ES de la portada EN a su tarjeta ES: ${r.franja.es_a_es}`);
  if (r.franja_es) console.log(`franja ES: ${r.franja_es.fichas} fichas, "${r.franja_es.titulo}", ${r.franja_es.en} títulos con lang="en", guía: ${r.franja_es.guia}`);
  console.log(`idioma de las partes (texto español fuera de lang="es" en páginas EN): ${r.idioma_partes.length}${r.idioma_partes.length ? "; " + r.idioma_partes.slice(0, 5).join(" | ") : ""}`);
  for (const e of [...r.enlaces_rotos, ...r.anclas_rotas, ...r.errores].slice(0, 20)) console.log("  " + e);
  console.log(malo ? "QA temas: FALLA" : "QA temas: ok");
  process.exit(malo ? 1 : 0);
}

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
