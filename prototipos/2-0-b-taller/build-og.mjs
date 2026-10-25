// build-og.mjs · genera img/og-<regla>-<idioma>.png (1200 x 630), la vista previa SIMULADA de "Mandársela a alguien".
// Usa el mismo dibujo de la tarjeta que la página (N.dibujarTarjeta). Uso desde /home/user/naos, con el servidor en 8772:
//   NODE_PATH=$(npm root -g) node prototipos/2-0-b-taller/build-og.mjs [puerto]
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");
const puerto = process.argv[2] || "8772", raiz = `http://localhost:${puerto}/prototipos/2-0-b-taller/`;
const b = await chromium.launch();
for (const lang of ["en", "es"]) {
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto(raiz + (lang === "es" ? "es/index.html" : "index.html")); await p.waitForTimeout(400);
  const ids = await p.evaluate(() => window.TALLER.reglas.map(r => r.id));
  for (const id of ids) {
    const b64 = await p.evaluate(async (id) => {
      const N = window.TALLER;
      await Promise.all(['300 80px "Newsreader"', '600 40px "IBM Plex Sans Condensed"', '400 28px "IBM Plex Sans"'].map(f => document.fonts.load(f)));
      const cv = document.createElement("canvas"); cv.width = 1200; cv.height = 630; N.dibujarTarjeta(cv.getContext("2d"), 1200, 630, N.R(id));
      return cv.toDataURL("image/png").split(",")[1];
    }, id);
    writeFileSync(new URL(`./img/og-${id}-${lang}.png`, import.meta.url), Buffer.from(b64, "base64"));
  }
}
await b.close(); console.log("img/og-*.png listos");
