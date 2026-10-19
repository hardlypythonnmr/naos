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
import { NOMBRES_PROPIOS } from "./cuerpo-temas.mjs";
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
// tarjeta con ?src= y la marca "You came from this Short"; 3. archivo (19-oct): la portada no tiene The Present ni la guía, y cada URL
// archivada (tema, hub y enlace corto) termina, sin 404, en su destino de data/archivo.json; 4. la pausa de Cella detiene a todas;
// 5. la portada EN no lleva la franja (D-263); la de es/ trae hoy y lo próximo desde la grilla.
if (args.includes("--temas")) {
  const base = url.endsWith("/") ? url : url + "/";
  const T = JSON.parse(await (await fetch(base + "data/temas.json")).text());
  const A = JSON.parse(await (await fetch(base + "data/archivo.json")).text());
  const C = JSON.parse(await (await fetch(base + "data/cortos.json")).text()).codigos;
  const r = { enlaces: 0, enlaces_rotos: [], anclas_rotas: [], cortos: 0, cortos_mal: [], guia: {}, archivo: { ok: 0, mal: [] }, cella: null, franja: null, franja_es: null, idioma_partes: [], errores: [] };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => r.errores.push("pageerror " + page.url() + ": " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && (m.location().url || "").startsWith(new URL(base).origin)) r.errores.push("console " + page.url() + ": " + m.text()); });
  // 1. enlaces internos de hubs y páginas de tema
  const una = ["temas/", "temas/humanity/", ...T.pilares.filter((P) => T.paginas.some((p) => p.pilar === P.id)).map((P) => `temas/pilar/${P.id}/`), ...T.paginas.map((p) => `temas/${p.slug}/`)];
  const paginas = [...una, "es/", ...una.map((u) => "es/" + u)]; // dos ediciones (D-253)
  // idioma de las partes (WCAG 3.1.2): texto con marcas del español (ñ, ¿, ¡, tildes o tres palabras vacías) fuera de un [lang=es]
  // en una página en inglés; los nombres propios cortos (Medellín, Bogotá) no cuentan
  // los nombres propios (NOMBRES_PROPIOS de cuerpo-temas.mjs: Medellín, Banco de la República…) se quitan antes de mirar, y una
  // URL escrita como enlace (a[translate=no]) no tiene idioma
  const partes = (propios) => { const ES = /[ñ¿¡]|[áéíóú]\w*\s+\w+|\b(de|del|la|las|los|el|para|con|una|y)\b(?:.*\b(de|del|la|las|los|el|para|con|una|y)\b){2}/i, PROPIO = /^(Medellín|Bogotá|Brasília|Medellín\s*)$/;
    const out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) { const t0 = n.textContent.trim(), e = n.parentElement; if (!t0 || !e || e.closest("script,style,[hidden],[translate=no]")) continue;
      const t = propios.reduce((a, x) => a.split(x).join(" "), t0);
      const l = (e.closest("[lang]") || document.documentElement).getAttribute("lang"); if (l === "en" && ES.test(t) && !PROPIO.test(t)) out.push(t0.slice(0, 80)); }
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
    if (!pg.startsWith("es/")) for (const t of await page.evaluate(partes, NOMBRES_PROPIOS)) r.idioma_partes.push(`${pg}: "${t}"`);
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
  // 3. archivo: la portada sin The Present ni la guía; las URL archivadas llegan a su destino (la portada o la página de Humanity más cercana)
  await page.goto(base, { waitUntil: "load" }); await page.waitForTimeout(900);
  r.guia["portada: The Present o la guía a la vista"] = await page.evaluate(() => !!document.querySelector("#the-present, #doors, .puerta-pres, #guia, .gu-hoja, #mercados, #noticias, #ia, a[href*='the-present']"));
  const llega = async (desde, destino) => {
    const res = await page.goto(base + desde, { waitUntil: "load" });
    const fin = new URL(base + destino).pathname;
    await page.waitForURL((u) => u.pathname === fin, { timeout: 4000 }).catch(() => {});
    const u = new URL(page.url()), ok = res && res.status() === 200 && u.pathname === new URL(base + destino).pathname;
    if (ok) r.archivo.ok++; else r.archivo.mal.push(`${desde} -> ${page.url()} (esperado ${destino})`);
  };
  for (const [s, d] of Object.entries(A.paginas)) for (const pre of ["", "es/"]) await llega(`${pre}temas/${s}/`, pre + d);
  for (const [h, d] of Object.entries(A.hubs)) for (const pre of ["", "es/"]) await llega(`${pre}${h}`, pre + d);
  for (const [c, e] of Object.entries(C)) if (A.paginas[e.pagina] != null) await llega(`s/${c}/`, (e.lang === "es" ? "es/" : "") + A.paginas[e.pagina]);
  // 4. la pausa de Cella (portada limpia, en las puertas): todas quedan quietas y aria-pressed cambia en todos los botones
  await page.goto(base, { waitUntil: "load" }); await page.waitForTimeout(1200);
  const foto = () => page.evaluate(() => [...document.querySelectorAll(".cella-v")].map((e) => e.innerHTML.length + ":" + e.innerHTML.slice(200, 400)).join("|"));
  const nb = await page.locator(".cella-pausa").count();
  const a1 = await foto(); await page.waitForTimeout(700); const a2 = await foto();
  if (nb) await page.locator(".cella-pausa").first().click();
  await page.waitForTimeout(300); const b1 = await foto(); await page.waitForTimeout(900); const b2 = await foto();
  const pres = await page.evaluate(() => [...document.querySelectorAll(".cella-pausa")].map((b) => b.getAttribute("aria-pressed")));
  r.cella = { botones: nb, se_mueve_antes: a1 !== a2, quieta_despues: b1 === b2, aria_pressed: pres };
  // 5. la franja: la portada EN ya no la lleva (D-263); la de es/ trae hoy (o lo próximo) desde la grilla, con enlace a la tarjeta
  await page.goto(base + "?hoy=2026-10-20", { waitUntil: "load" }); await page.waitForTimeout(1500);
  r.franja = await page.evaluate(() => ({ en_portada_en: !!document.querySelector("#secuencia, .fr") }));
  // la franja en español (es/): el día del primer Short en español, con su tarjeta en es/temas/
  const diaES = (T.piezas.find((x) => x.lang === "es") || {}).fecha;
  if (diaES) { await page.goto(base + `es/?hoy=${diaES}`, { waitUntil: "load" }); await page.waitForTimeout(1500);
    r.franja_es = await page.evaluate(() => ({ fichas: document.querySelectorAll("#secuencia .fr-f").length, titulo: document.querySelector("#fr-t")?.textContent, guia: !!document.querySelector(".gu-hoja"),
      enlaces: [...document.querySelectorAll("#secuencia a.fr-n")].map((a) => a.getAttribute("href")), en: [...document.querySelectorAll("#secuencia .fr-n [lang=en]")].length })); }
  await ctx.close(); await browser.close();
  writeFileSync(`${OUT}/report-temas.json`, JSON.stringify(r, null, 1));
  const malo = r.enlaces_rotos.length || r.anclas_rotas.length || r.cortos_mal.length || r.errores.length || Object.entries(r.guia).some(([k, v]) => (k.startsWith("tema:") ? true : v !== false)) || r.archivo.mal.length || !r.archivo.ok ||
    !r.cella.botones || !r.cella.quieta_despues || r.cella.aria_pressed.some((x) => x !== "true") || r.franja.en_portada_en ||
    r.idioma_partes.length || (r.franja_es && (!r.franja_es.fichas || r.franja_es.titulo !== "Hoy y lo próximo" || r.franja_es.guia));
  console.log(`enlaces internos: ${r.enlaces} revisados, rotos ${r.enlaces_rotos.length}, anclas rotas ${r.anclas_rotas.length}`);
  console.log(`enlaces cortos: ${r.cortos} de ${T.piezas.filter((x) => x.corto).length} aterrizan en su tarjeta${r.cortos_mal.length ? "; mal: " + r.cortos_mal.slice(0, 5).join(", ") : ""}`);
  console.log(`guía: ${JSON.stringify(r.guia)}`);
  console.log(`archivo: ${r.archivo.ok} URL archivadas llegan a su destino${r.archivo.mal.length ? "; mal: " + r.archivo.mal.slice(0, 5).join(", ") : ""}`);
  console.log(`Cella: ${JSON.stringify(r.cella)}`);
  console.log(`franja en la portada EN: ${r.franja.en_portada_en ? "sí (no debería)" : "no"}`);
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
    const visible = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !e.closest("[hidden],[inert]") && !plegado(e); };
    // dentro de un <details> cerrado solo se ve su <summary> (Chromium le da caja al contenido plegado, pero Tab no entra)
    const plegado = (e) => { for (let d = e.closest("details:not([open])"); d; d = d.parentElement && d.parentElement.closest("details:not([open])")) { const su = d.querySelector(":scope > summary"); if (!(su && su.contains(e))) return true; } return false; };
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
