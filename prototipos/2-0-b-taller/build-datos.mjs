// build-datos.mjs · junta data/*.json en js/datos.js (window.TALLER_DATOS) para que el prototipo abra también con doble clic (file://).
// Uso: node build-datos.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const aqui = dirname(fileURLToPath(import.meta.url));
const j = (n) => JSON.parse(readFileSync(join(aqui, "data", n), "utf8"));
const out = { reglas: j("reglas.json").reglas, obstrucciones: j("obstrucciones.json").obstrucciones, rotacion: j("rotacion.json") };
writeFileSync(join(aqui, "js", "datos.js"),
  "/* datos.js · GENERADO por build-datos.mjs desde data/reglas.json, obstrucciones.json y rotacion.json. No editar aquí. */\nwindow.TALLER_DATOS = " + JSON.stringify(out) + ";\n");
console.log("js/datos.js listo");
