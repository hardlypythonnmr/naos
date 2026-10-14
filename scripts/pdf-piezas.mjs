// PDF de una página por pieza planned con contenido (PAG-06.3): imprime pieza.html?id=<id> con Chromium (Playwright)
// y lo guarda en assets/pdf/<id>.pdf. Uso: node scripts/pdf-piezas.mjs [id ...]   (sin ids: todas las que tienen "pdf")
// Requiere playwright (NODE_PATH=$(npm root -g) si está global) y sirve la carpeta del sitio en un puerto local.
import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright"); // CommonJS: respeta NODE_PATH
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const tipos = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".pdf": "application/pdf" };
const srv = http.createServer((q, r) => {
  const f = path.join(raiz, decodeURIComponent(new URL(q.url, "http://x").pathname));
  if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": tipos[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r);
}).listen(0);
const puerto = srv.address().port;
const datos = JSON.parse(fs.readFileSync(path.join(raiz, "data/assets.json"), "utf8"));
const pedidas = process.argv.slice(2);
const piezas = datos.categorias.flatMap((c) => c.piezas).filter((x) => x.pdf && (!pedidas.length || pedidas.includes(x.id)));
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const pag = await nav.newPage();
let mal = 0;
for (const x of piezas) {
  await pag.goto(`http://localhost:${puerto}/pieza.html?id=${encodeURIComponent(x.id)}`, { waitUntil: "networkidle" });
  await pag.waitForSelector("#lleno:not([hidden])");
  await pag.evaluate(() => document.fonts.ready);
  const out = path.join(raiz, x.pdf);
  await pag.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true, tagged: true });
  const b = fs.readFileSync(out), paginas = (b.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length, kb = Math.round(b.length / 1024);
  const ok = paginas === 1 && kb < 300; if (!ok) mal++;
  console.log(`${ok ? "ok " : "MAL"} ${x.id}: ${paginas} página(s), ${kb} KB`);
}
await nav.close(); srv.close();
process.exit(mal ? 1 : 0);
