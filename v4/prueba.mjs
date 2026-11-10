// Prueba de NAOS 4.0. Uso: node v4/prueba.mjs   (desde la raíz del repo o desde cualquier carpeta)
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(REPO, p);
  if (!f.startsWith(REPO)) { res.writeHead(403); return res.end(); }
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch { res.writeHead(404); return res.end('no'); }
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end('no'); } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const fallos = [];
let ok = 0;
const check = (c, msg) => { if (c) ok++; else { fallos.push(msg); console.log('FALLA:', msg); } };

const niveles = JSON.parse(fs.readFileSync(path.join(AQUI, 'data/niveles.json'), 'utf8'));
const IDS = ['tenderness', 'emptiness', 'saturation', 'body', 'courtyard'];

// ---- datos ----
check(niveles.niveles.length === 5 && niveles.niveles.map(n => n.id).join() === IDS.join(), '5 escalones en orden');
const hogares = {};
niveles.niveles.forEach(n => n.puertas.forEach(p => p.herramientas.forEach(h => { (hogares[h.id] ||= []).push(n.id); })));
check(Object.keys(hogares).length === 40, `40 herramientas (hay ${Object.keys(hogares).length})`);
check(Object.values(hogares).every(a => a.length === 1), 'cada herramienta con un solo hogar');
niveles.niveles.forEach(n => n.enlaces.forEach(e => check(hogares[e.id] && hogares[e.id][0] === e.hogar, `enlace ${e.id} apunta a su hogar ${e.hogar}`)));
const disp = JSON.parse(fs.readFileSync(path.join(AQUI, 'data/temas-disponibles.json'), 'utf8')).temas;
niveles.niveles.forEach(n => n.temas.forEach(t => check(!!disp[t.slug] === fs.existsSync(path.join(REPO, 'temas', t.slug, 'index.html')), `temas-disponibles coincide para ${t.slug}`)));

const browser = await chromium.launch();
const errores = [];
function vigila(page, tag) {
  page.on('console', m => { if (m.type() === 'error') errores.push(`${tag} console: ${m.text()}`); });
  page.on('pageerror', e => errores.push(`${tag} pageerror: ${e.message}`));
  page.on('requestfailed', r => errores.push(`${tag} requestfailed: ${r.url()}`));
  page.on('response', r => { if (r.status() >= 400) errores.push(`${tag} ${r.status()} ${r.url()}`); });
}
fs.mkdirSync(path.join(AQUI, 'capturas'), { recursive: true });

const vistas = [{ k: 'm', w: 390, h: 844, dsf: 2 }, { k: 'd', w: 1280, h: 900, dsf: 1 }];
const idiomas = [['en', '/v4/'], ['es', '/v4/es/']];

for (const v of vistas) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dsf });
  for (const [lang, ruta] of idiomas) {
    const page = await ctx.newPage();
    vigila(page, `${lang}/${v.w}`);
    const rutas = ['#/', ...IDS.map(i => '#/' + i)];
    for (const h of rutas) {
      await page.goto(BASE + ruta + h);
      await page.waitForSelector('#h1');
      await page.waitForTimeout(250);
      const tag = `${lang} ${v.w} ${h}`;
      const m = await page.evaluate(() => {
        const sw = document.documentElement.scrollWidth, iw = window.innerWidth;
        let min = 99, quien = '';
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = w.nextNode())) {
          if (!n.nodeValue.trim()) continue;
          const el = n.parentElement; if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < min) { min = fs; quien = n.nodeValue.trim().slice(0, 30); }
        }
        // elementos que se salen del viewport
        const fuera = [...document.querySelectorAll('#app *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > iw + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed'; }).slice(0, 3).map(e => e.className || e.tagName);
        return { sw, iw, min, quien, fuera, lang: document.documentElement.lang, svgs: document.querySelectorAll('[data-cella] svg').length };
      });
      check(m.sw <= m.iw, `desborde horizontal en ${tag}: ${m.sw} > ${m.iw} ${m.fuera}`);
      check(m.min >= 12, `texto menor de 12 px en ${tag}: ${m.min}px "${m.quien}"`);
      check(m.svgs >= 1, `Cella dibujada en ${tag}`);
      const nombre = `${lang}-${v.k}${v.w}-${h === '#/' ? 'portada' : h.slice(2)}.png`;
      const importante = lang === 'en' || h === '#/';
      if (importante) await page.screenshot({ path: path.join(AQUI, 'capturas', nombre), fullPage: true });
    }
    // capa de respirar
    await page.goto(BASE + ruta + '#/body');
    await page.waitForSelector('#h1');
    await page.click('#btn-aro');
    await page.waitForTimeout(1500);
    const abierto = await page.evaluate(() => document.getElementById('aro').getAttribute('data-open') === '1');
    check(abierto, `capa de respirar abre (${lang} ${v.w})`);
    const m2 = await page.evaluate(() => {
      let min = 99; const w = document.createTreeWalker(document.getElementById('aro'), NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { if (!n.nodeValue.trim()) continue; const fs = parseFloat(getComputedStyle(n.parentElement).fontSize); if (fs < min) min = fs; }
      return { min, sw: document.getElementById('aro').scrollWidth, cw: document.getElementById('aro').clientWidth };
    });
    check(m2.min >= 12 && m2.sw <= m2.cw, `capa de respirar sin texto chico ni desborde (${lang} ${v.w})`);
    if (lang === 'en') await page.screenshot({ path: path.join(AQUI, 'capturas', `en-${v.k}${v.w}-respirar.png`) });
    await page.waitForTimeout(4200);
    const fase = await page.textContent('#aro-pal');
    check(/HOLD|SOSTÉN/.test(fase), `fase HOLD hacia el segundo 5 (${lang} ${v.w}): "${fase}"`);
    await page.keyboard.press('Escape');
    check(await page.evaluate(() => document.getElementById('aro').getAttribute('data-open') !== '1'), `Escape cierra (${lang} ${v.w})`);
    await page.close();
  }
  await ctx.close();
}

// ---- rutas, redirecciones, 2 toques, herramienta resaltada ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  for (const [lang, ruta] of idiomas) {
    const page = await ctx.newPage(); vigila(page, `rutas ${lang}`);
    const viejas = { bedroom: 'emptiness', windows: 'emptiness', kitchen: 'saturation', stairs: 'body', table: 'tenderness', door: 'tenderness', courtyard: 'courtyard' };
    for (const [a, b] of Object.entries(viejas)) {
      await page.goto(BASE + ruta + '#/' + a); await page.waitForSelector('#h1');
      check(await page.evaluate(() => location.hash) === '#/' + b, `${lang}: #/${a} redirige a #/${b}`);
      check(await page.evaluate(c => document.getElementById('app').classList.contains('s-' + c), b), `${lang}: #/${a} pinta el escalón ${b}`);
    }
    // cada herramienta abre su hogar con la herramienta resaltada
    await page.goto(BASE + ruta + '#/');
    await page.waitForSelector('#h1');
    for (const [id, [hogar]] of Object.entries(hogares)) {
      await page.evaluate(i => { location.hash = '#/tool/' + i; }, id);
      await page.waitForFunction(i => document.querySelector('.chip[aria-current="true"]') && document.querySelector('.chip[aria-current="true"]').getAttribute('href') === '#/tool/' + i, id);
      const r = await page.evaluate(() => ({ cls: document.getElementById('app').className, cur: document.querySelectorAll('.chip[aria-current="true"]').length }));
      check(r.cls === 's-' + hogar && r.cur >= 1, `${lang}: #/tool/${id} abre ${hogar} con la herramienta resaltada`);
    }
    // herramienta enlazada (contorno) abre el hogar
    await page.evaluate(() => { location.hash = '#/tool/first-eat-with-someone'; });
    await page.waitForTimeout(150);
    check(await page.evaluate(() => document.getElementById('app').className) === 's-saturation', `${lang}: herramienta enlazada abre Saturation`);
    // 2 toques: portada -> escalón -> herramienta
    await page.goto(BASE + ruta + '#/'); await page.waitForSelector('#h1');
    await page.click('.bar.s-emptiness');
    await page.waitForSelector('.chip');
    await page.click('.chip >> nth=1');
    await page.waitForSelector('.sel');
    check(/#\/tool\//.test(await page.evaluate(() => location.hash)), `${lang}: de la portada a una herramienta en 2 toques`);
    // ruta desconocida vuelve a la portada
    await page.goto(BASE + ruta + '#/nada'); await page.waitForSelector('#h1');
    check(await page.evaluate(() => location.hash) === '#/', `${lang}: ruta desconocida vuelve a la portada`);
    // pie, aviso, tema sin carpeta
    const pie = await page.evaluate(() => ({ t: document.querySelector('.pie').textContent, hrefs: [...document.querySelectorAll('.pie a')].map(a => a.getAttribute('href')) }));
    check(/findahelpline/.test(pie.hrefs.join()) && pie.hrefs.some(h => /privacidad\.html$/.test(h)) && pie.hrefs.some(h => /terminos\.html$/.test(h)), `${lang}: pie con ayuda y legales`);
    check(pie.hrefs.includes(lang === 'en' ? '../' : '../../'), `${lang}: pie con enlace a la versión anterior`);
    await page.goto(BASE + ruta + '#/body'); await page.waitForSelector('.tem');
    const soon = await page.evaluate(() => [...document.querySelectorAll('span.tema')].map(e => e.textContent));
    check(soon.length === 1 && /Breathe/.test(soon[0]), `${lang}: tema sin carpeta (breathe) se muestra sin enlace`);
    const hrefT = await page.evaluate(() => document.querySelector('a.tema').getAttribute('href'));
    check(hrefT.startsWith(lang === 'en' ? '../temas/' : '../../temas/'), `${lang}: enlace de tema relativo correcto`);
    // noindex y lang
    check(await page.evaluate(() => document.querySelector('meta[name=robots]').content === 'noindex' && document.documentElement.lang), `${lang}: noindex y lang`);
    await page.close();
  }
  await ctx.close();
}

// ---- reduced motion ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage(); vigila(page, 'reduce');
  await page.goto(BASE + '/v4/#/body'); await page.waitForSelector('#h1');
  await page.click('#btn-aro'); await page.waitForTimeout(600);
  const a = await page.textContent('#aro-pal');
  await page.waitForTimeout(4600);
  const b = await page.textContent('#aro-pal');
  check(/IN/.test(a) && /HOLD/.test(b), `reduced-motion: el texto de la fase cambia (${a} -> ${b})`);
  check(await page.evaluate(() => getComputedStyle(document.getElementById('aro-disco')).transform === 'matrix(1, 0, 0, 1, 0, 0)'), 'reduced-motion: el disco no se anima');
  await ctx.close();
}

check(errores.length === 0, `0 errores de consola/red (hay ${errores.length}): ${errores.slice(0, 5).join(' | ')}`);
await browser.close(); server.close();
console.log(`${ok} comprobaciones bien, ${fallos.length} fallas`);
if (fallos.length) { console.log('FALLO'); process.exit(1); }
console.log('OK');
