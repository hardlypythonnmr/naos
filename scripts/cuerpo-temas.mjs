// cuerpo-temas.mjs · el cuerpo de las páginas de tema selladas (lote 0+1 del llenado; acta 2(b), bloques 0 a 8).
// Node 18+, sin dependencias. Dos partes:
//   1. importar (solo donde está el lote privado): lee texto-en.md, texto-es.md, meta.json y visuales/ de cada página sellada y
//      escribe lo público: data/temas/<slug>.en.md y .es.md (sin comentarios: nada de ids de afirmaciones ni notas internas),
//      data/temas/<slug>.json (meta, enlaces cortos, lugar de cada visual) y assets/temas/<slug>/ (SVG, datos JSON, módulos,
//      CSS y los fragmentos de figura). La llama construir-temas.mjs con --cuerpo=<carpeta del lote> --sellados=a,b,c.
//   2. cuerpo (siempre; lo usa construir-temas.mjs): de esos archivos arma los bloques 0 a 8 y el pie de la página, en EN o ES.
// Salida determinista: el HTML solo depende de los archivos; lo que cambia con la hora (próxima pieza, antes y después de un
// evento, la tarjeta abierta) lo resuelve temas.js en el navegador sobre marcado fijo.
// Gramática del texto (la de los textos del lote, sin inventar otra): "## n · Título {#id}" abre un bloque; "### " y "#### "
// subsecciones; "**…** {#c-…}" abre una tarjeta; "*Rótulo (folded)*" / "*Rótulo (plegado)*" abre un pliegue hasta
// "*(end of fold)*", el siguiente pliegue o el fin de su sección; "(Folded. …)" / "(Plegado. …)" pliega la sección entera;
// "[n]" cita la fuente n del bloque 8; "→ Título" enlaza a otra página, a un título de esta o a una tarjeta; "[Send this]" y
// "[Copy the prompt]" son botones; "{…}" es un hueco que llena el navegador o que no se muestra; "::: antes|despues|ambos"
// marca las dos versiones de una página de evento (las pone importar desde <!-- BEFORE/AFTER/BOTH -->).
import fs from "node:fs";
import path from "node:path";

// arte 16-oct: el h1 va a escala de puerta; una palabra compuesta ("full-moon") no se parte en el guion (solo texto, fuera de etiquetas)
const sinCorteGuion = (h) => h.replace(/(<[^>]*>)|([\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+)/gu, (m, tag, w) => tag || `<span class="t-nw">${w}</span>`);

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const leerJSON = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };

// ---------- 1. importar ----------
// Lugar de cada visual (de visuales_lugar / figures_place de cada meta.json y del LEEME de visuales, en prosa allá; aquí, dato).
//   familia "fig": fragmentos ya hechos (visuales/fig/<id>.<lang>.html); familia "vista": se sacan de la sección de la vista
//   previa (preview-<lang>.html, <section id=…>), que es como el equipo de arte armó la figura con su pliegue y su tabla.
//   en / es: id (o "h:Título") del contenedor; lugar: el hueco "[Figure: …]" o "[Visual: …]" o "Chart: …" si lo hay, si no, en
//   lugar del bloque de construcción del mapa ("Map title:" … "Text version"), si no, después de la línea que casa con
//   "despues", si no, al final. "reemplaza": la figura trae su propio texto; se quita del texto desde el hueco (o el inicio)
//   hasta la línea que casa con "hasta", inclusive.
export const CONFIG = {
  "the-cella": { familia: "fig", css: ["viz.css"],
    visuales: [{ id: "mapa", en: "map", es: "mapa" }, { id: "sol", en: "when-the-light", es: "cuando-entra-la-luz" }, { id: "viva", en: "our-experiment", es: "nuestro-experimento" }],
    modulos: [{ src: "viva/sala-viva.js", sel: "[data-viva]", quieto: true }, { src: "svg/mapa.js", sel: "svg.cm" }],
    // "a solas": plegada siempre, y su título a la vista desde el 29-dic (antes, solo al llegar por su ancla o por s/1231h)
    pliegues: { "on-your-own": { desde: "2026-12-29" }, "a-solas": { desde: "2026-12-29" } },
    flechas: { "The light crosses the floor": "#our-experiment", "La luz cruza el piso": "#nuestro-experimento" } },
  "from-chat-to-code": { familia: "fig", css: ["viz.css"],
    visuales: [{ id: "viva", en: "try-it", es: "try-it" }, { id: "mapa", en: "map", es: "map" }, { id: "flujo", en: "where-this-comes-from", es: "where-this-comes-from" }],
    modulos: [{ src: "viva/traspaso-viva.js", sel: "[data-hc]", quieto: true }, { src: "svg/mapa.js", sel: "svg.mp" }] },
  "fomc-before-and-after-the-silence": { familia: "fig", css: ["viz.css"], cambio: "2026-10-28T18:00:00Z",
    visuales: [{ id: "mapa", en: "map", es: "map" }, { id: "viva", en: "what-comes-out", es: "what-comes-out" }, { id: "grafica", en: "shorter", es: "shorter" }],
    modulos: [{ src: "viva/que-sale.js", sel: "[data-viva]", quieto: true }, { src: "svg/mapa.js", sel: "svg.mp" }] },
  "the-full-moon-table": { familia: "vista", css: ["visuales.css", "anim/mesa-luna.css"], scripts: ["mapa-origen.js"],
    vista: { mapa: "map", grafica: "chart", viva: "tonight" },
    visuales: [{ id: "mapa", en: "map", es: "mapa" },
      { id: "grafica", en: "where-they-disagree", es: "no-coinciden", despues: { en: "^\\*\\*The date\\.\\*\\*", es: "^\\*\\*La fecha\\.\\*\\*" } },
      { id: "viva", en: "tonight", es: "esta-noche", reemplaza: { en: "^That's it\\.$", es: "^Eso es todo\\.$" } }],
    modulos: [{ src: "anim/mesa-luna.js", sel: "[data-ml]" }] },
  "who-is-telling-you-this": { familia: "vista", css: ["visuales.css", "anim/tres-movimientos.css"], scripts: ["mapa-origen.js"],
    vista: { mapa: "map", grafica: "chart", viva: "try-it" },
    visuales: [{ id: "viva", en: "try-it", es: "try-it", reemplaza: { en: "^\\*Jarre:\\* there was no original", es: "^\\*Jarre:\\* no había original" } },
      { id: "mapa", en: "map", es: "map" },
      { id: "grafica", en: "h:Where they disagree", es: "h:Dónde no coinciden", despues: { en: "^\\*\\*Google and Pew\\.\\*\\*", es: "^\\*\\*Google y Pew\\.\\*\\*" } }],
    modulos: [{ src: "anim/tres-movimientos.js", sel: "[data-tm]" }] },
  // la cosa viva del conteo está hecha y fuera de la página hasta que N decida (meta.json, visuales.cosa_viva: P2 y P5)
  "how-a-vote-is-counted": { familia: "vista", css: ["visuales.css"], scripts: ["mapa-origen.js"],
    vista: { mapa: "map", grafica: "official-dates" },
    visuales: [{ id: "mapa", en: "map", es: "mapa" }, { id: "grafica", en: "days", es: "dias" }], modulos: [] },
  // lote 1b: el mapa es el índice de las piezas (bloque 5); la distancia y la cosa viva van en "The moon itself" (bloque 4 plegado).
  // "Next moon" sale de la columna (USNO, la misma de la página); el renglón de la vela solo con ?src=1207h o 1207.
  moon: { familia: "fig", css: ["viz.css"],
    visuales: [{ id: "mapa", en: "map", es: "mapa" }, { id: "distancia", en: "h:The moon itself", es: "h:La luna" }, { id: "viva", en: "h:The moon itself", es: "h:La luna" }],
    modulos: [{ src: "viva/luna-viva.js", sel: "[data-viva]", quieto: true }, { src: "svg/mapa.js", sel: "svg.mp" }],
    soloSrc: { "#candle": ["1207h", "1207"], "#la-vela": ["1207h", "1207"] },
    // la luz de cada tarjeta es la de Horizons a la hora de la pieza (fuente [4] del texto), no la de USNO
    lunaDatos: { en: "Moon data: NASA JPL Horizons, at the hour of each piece. [4]", es: "Datos de la luna: NASA JPL Horizons, a la hora de cada pieza. [4]" },
    lunas: [
      { t: "2026-10-26T04:12:00Z", en: "full moon on Sunday 25 October, 23:12 in Medellín, 00:12 ET on Monday 26", es: "luna llena el domingo 25 de octubre, a las 23:12 en Medellín (00:12 del lunes 26 en Nueva York)" },
      { t: "2026-11-09T07:02:00Z", en: "new moon on Monday 9 November, 02:02 in Medellín and New York", es: "luna nueva el lunes 9 de noviembre, a las 02:02 en Medellín y Nueva York" },
      { t: "2026-11-24T14:53:00Z", en: "full moon on Tuesday 24 November, 09:53 in Medellín and New York", es: "luna llena el martes 24 de noviembre, a las 09:53 en Medellín y Nueva York" },
      { t: "2026-12-09T00:52:00Z", en: "new moon on Tuesday 8 December, 19:52 in Medellín and New York", es: "luna nueva el martes 8 de diciembre, a las 19:52 en Medellín y Nueva York" },
      { t: "2026-12-24T01:28:00Z", en: "full moon on Wednesday 23 December, 20:28 in Medellín and New York", es: "luna llena el miércoles 23 de diciembre, a las 20:28 en Medellín y Nueva York" }] },
  // lote 1b: la cosa viva es el bloque 2 entero (la figura trae su texto palabra por palabra); el mapa trae su propio pliegue
  "saints-and-souls": { familia: "vista", css: ["visuales.css", "anim/noche.css"], scripts: ["mapa-origen.js"],
    vista: { mapa: "map", grafica: "chart", viva: "evening" },
    visuales: [{ id: "viva", en: "one-evening", es: "una-noche", reemplaza: { en: "^That's it\\.", es: "^Eso es todo\\." } },
      { id: "mapa", en: "map", es: "mapa" },
      { id: "grafica", en: "where-they-disagree", es: "no-coinciden" }],
    modulos: [{ src: "anim/noche.js", sel: "[data-sv]", quieto: true }] },
};

// meta.json viene en dos formas (lote 0 y lote 1); se normaliza a lo que la página publica
function metaPublica(m, slug) {
  const ed = (l) => {
    const x = m[l] || {}, og = x.og || {};
    const h1 = x.h1 || x.title;
    return { title: x.html_title || (/ · NAOS$/.test(x.title || "") ? x.title : `${x.title} · NAOS`), h1, description: x.description,
      og_title: x.og_title || og.title || h1, og_description: x.og_description || og.description || x.description };
  };
  const cortos = {};
  for (const [c, e] of Object.entries(m.enlaces_cortos || {})) {
    cortos[c] = { en: e.you_came_from, es: (m.you_came_from_es || {})[c] || e.you_came_from,
      aterriza: { en: (e.aterriza || "").replace(/^#/, "") || null, es: (e.aterriza_es || e.aterriza || "").replace(/^#/, "") || null } };
    if (e.pregunta) { cortos[c].en += " · " + e.pregunta; if (e.pregunta_es) cortos[c].es += " · " + e.pregunta_es; }
  }
  for (const e of [...(m.short_links || []), ...(Array.isArray(m.story_links) ? m.story_links : [])]) cortos[e.code] = { en: e.you_came_from_en, es: e.you_came_from_es, aterriza: { en: null, es: null } };
  const env = m.enviar || m.boton_enviar || {};
  const enviar = { en: (env.manda && env.manda.en) || (typeof env.en === "string" && !m.boton_enviar ? env.en : null), es: (env.manda && env.manda.es) || (typeof env.es === "string" && !m.boton_enviar ? env.es : null) };
  for (const l of ["en", "es"]) if (enviar[l]) enviar[l] = enviar[l].replace(/\s*\{(link|enlace)\}\s*$/, ""); // la URL la pone el botón
  for (const c of Object.values(cortos)) for (const l of ["en", "es"]) if (c.aterriza[l] && /^c-/.test(c.aterriza[l])) c.aterriza[l] = null; // la tarjeta ya es el destino
  const luna = {};
  for (const [id, v] of Object.entries(m.luna_por_pieza || {})) if (/^c-/.test(id)) luna[id] = { iluminacion: v.pct, fase: { en: v.fase_en, es: v.fase_es } };
  return { slug, meta: { en: ed("en"), es: ed("es") }, cortos, enviar, luna };
}

// la sección de la vista previa: lo que hay entre su <h2> y su </section>
function deVista(html, id) {
  const m = new RegExp(`<section class="vv-bloque" id="${id}">\\s*<h2[^>]*>[\\s\\S]*?</h2>([\\s\\S]*?)</section>`).exec(html);
  if (!m) throw new Error(`vista previa sin la sección #${id}`);
  return m[1].replace(/<!--[\s\S]*?-->/g, "").trim() + "\n";
}

export function importar({ V, lote, slugs, log = console.log }) {
  for (const slug of slugs) {
    const C = CONFIG[slug]; if (!C) throw new Error(`${slug}: sin CONFIG de visuales en cuerpo-temas.mjs`);
    const dir = path.join(lote, slug), vis = path.join(dir, "visuales"), dest = path.join(V, "assets/temas", slug);
    fs.mkdirSync(path.join(V, "data/temas"), { recursive: true });
    for (const l of ["en", "es"]) {
      let t = fs.readFileSync(path.join(dir, `texto-${l}.md`), "utf8").replace(/\r\n/g, "\n");
      // las dos versiones (BEFORE/AFTER) son comentarios en el texto: pasan a marcas antes de quitar los comentarios
      t = t.replace(/<!--\s*(BEFORE|ANTES)\b[\s\S]*?-->/g, "\n::: antes\n").replace(/<!--\s*(AFTER|DESPU[EÉ]S)\b[\s\S]*?-->/g, "\n::: despues\n").replace(/<!--\s*(BOTH|LOS DOS)\b[\s\S]*?-->/g, "\n::: ambos\n");
      t = t.replace(/<!--[\s\S]*?-->/g, "").split("\n").map((x) => x.replace(/\s+$/, "")).join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
      fs.writeFileSync(path.join(V, `data/temas/${slug}.${l}.md`), t);
    }
    const datos = { ...metaPublica(JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")), slug),
      visuales: C.visuales, modulos: C.modulos || [], pliegues: C.pliegues || {}, css: C.css || [], scripts: C.scripts || [], flechas: C.flechas || {}, ...(C.cambio ? { cambio: C.cambio } : {}), ...(C.soloSrc ? { soloSrc: C.soloSrc } : {}), ...(C.lunas ? { lunas: C.lunas } : {}), ...(C.lunaDatos ? { lunaDatos: C.lunaDatos } : {}) };
    fs.writeFileSync(path.join(V, `data/temas/${slug}.json`), JSON.stringify(datos, null, 1) + "\n");
    // assets: solo lo que la página usa (sin generadores .py, sin LEEME, sin la vista previa)
    fs.rmSync(dest, { recursive: true, force: true });
    const copiar = (de, a) => { fs.mkdirSync(path.dirname(a), { recursive: true }); fs.copyFileSync(de, a); };
    const PUBLICO = /\.(svg|js|css|json)$/;
    const recorrer = (d, rel = "") => { for (const n of fs.readdirSync(d).sort()) { const p = path.join(d, n), r = rel ? `${rel}/${n}` : n; if (fs.statSync(p).isDirectory()) { if (n !== "src") recorrer(p, r); } else if (PUBLICO.test(n) || (C.familia === "fig" && r.startsWith("fig/") && n.endsWith(".html"))) copiar(p, path.join(dest, r)); } };
    recorrer(vis);
    // los datos de cada figura se publican sin lo interno: ni ids de afirmaciones, ni notas de trabajo, ni rutas de archivos
    const ID = /^(cella|fmt|quien|voto|fomc|chat|moon|santos|sas)-[\w-]*\d{2}\b/;
    const limpio = (o) => {
      if (Array.isArray(o)) { const xs = o.map(limpio).filter((x) => x !== undefined); return xs.length || !o.length ? xs : undefined; }
      if (o && typeof o === "object") return Object.fromEntries(Object.entries(o).filter(([k]) => !/^(_?nota.*|afirmaci.*|af|ids|fila|filas)$/.test(k)).map(([k, v]) => [k, limpio(v)]).filter(([, v]) => v !== undefined));
      if (typeof o === "string" && (ID.test(o) || /\b(sas|moon)-\d{2}\b|\bLEEME\b|texto-(en|es)\.md|revision-fuentes|\bI[34]\b/.test(o))) return undefined;
      return o;
    };
    const dd = path.join(dest, "datos");
    if (fs.existsSync(dd)) for (const n of fs.readdirSync(dd)) if (n.endsWith(".json")) { const p = path.join(dd, n); fs.writeFileSync(p, JSON.stringify(limpio(JSON.parse(fs.readFileSync(p, "utf8"))), null, 1) + "\n"); }
    // los fragmentos de figura, sin comentarios (llevan ids de afirmaciones)
    const fd = path.join(dest, "fig");
    if (fs.existsSync(fd)) for (const n of fs.readdirSync(fd)) { const p = path.join(fd, n); fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/<!--[\s\S]*?-->/g, "")); }
    if (C.familia === "vista") {
      for (const l of ["en", "es"]) {
        const prev = fs.readFileSync(path.join(vis, `preview-${l}.html`), "utf8");
        for (const [id, sec] of Object.entries(C.vista)) { fs.mkdirSync(path.join(dest, "fig"), { recursive: true }); fs.writeFileSync(path.join(dest, "fig", `${id}.${l}.html`), deVista(prev, sec)); }
      }
      // visuales.css trae el armado de la vista previa: en la página quedan solo las reglas de las figuras
      const css = fs.readFileSync(path.join(vis, "visuales.css"), "utf8").split("\n").filter((x) => !/^(body|\.vv-main|\.vv-h1|\.vv-aviso|\.vv-bloque|\.vv-h2)\b/.test(x)).join("\n");
      fs.writeFileSync(path.join(dest, "visuales.css"), css.replace("SOLO para la vista previa de trabajo (preview-*.html). La página real usa temas.css y sus bloques.", "las figuras en la página de tema (sin el armado de la vista previa)."));
    }
    log(`cuerpo: ${slug} importado (texto EN y ES, meta, ${C.visuales.length} visuales)`);
  }
}

// ---------- 2. cuerpo ----------
// nombres propios en español o portugués que se quedan dentro de una frase en inglés sin cambiarle el idioma (WCAG 3.1.2 pide
// marcar las partes, no los nombres); los usa también qa.mjs para no contarlos como texto en otro idioma
export const NOMBRES_PROPIOS = ["Banco de la República", "Bloomberg Línea", "Congresso em Foco", "Jornal Opção", "O Povo", "Boletim na Mão", "Portal Resultados",
  "Junta Electoral Central", "Ministerio del Interior", "La Moncloa", "Escola Judiciária Eleitoral", "Minsalud, Línea 106", "Línea 106", "Línea de la Vida", "Centro de Asistencia al Suicida", "Medellín", "Bogotá", "Brasília", "Constitución Española"];
const SIN_PROPIOS = (t) => NOMBRES_PROPIOS.reduce((a, n) => a.split(n).join(" "), t);
// marcas de otro idioma en un texto en inglés (la misma idea que qa.mjs: ñ ¿ ¡, una tilde seguida de otra palabra, o tres palabras vacías)
const OTRO = /[ñ¿¡ãõç]|[áéíóúâêô]\w*\s+\w+|\b(de|del|la|las|los|el|para|con|una|y|em|não|dos|das)\b(?:.*\b(de|del|la|las|los|el|para|con|una|y|em|não|dos|das)\b){2}/i;
const PT = /[ãõç]|(?<!\p{L})(não|dos|das|em|é|às|nas|pelo|pela|votos|urna)(?!\p{L})/iu;
export const otroIdioma = (t) => { const x = SIN_PROPIOS(t.replace(/https?:\/\/\S+|\[\d+\]/g, " ")); return OTRO.test(x) ? (PT.test(x) ? "pt" : "es") : null; };
const ES_MARCA = /[áéíóúñ¿¡]|\b(de|del|la|las|el|los|con|para|una|un|que|en|es|se|por|esta|este|lo|su|sus|más|cómo|qué)\b/i;
const N_LINEAS = ["Closer to yourself.", "Eat well, sleep well, get moving, have a relationship with the divine, and build community.", "Más cerca de ti.", "Come bien, duerme bien, muévete, ten una relación con lo divino y construye comunidad."];
const PLIEGUE = /^\*(.+)\s+\((folded|plegad[ao])([^)]*)\)\*$/i; // *Rótulo (folded…)*
const PLIEGUE_SECCION = /^\((Folded|Plegad[oa]|The drawing is folded|El dibujo va plegado)\b/; // (Folded. Opens on tap.)
const FIN_PLIEGUE = /\s*\*\((end of fold|fin del plegado)\)\*\s*$/i;
const HUECO_VISUAL = /^\[(Figure|Figura|Visual)\b|^(Chart|Gráfica):/;
const CONSTRUCCION = /^(Map title|Título del mapa|Nodes|Nodos|Alt|Texto alternativo|Legend|Leyenda|Details|Detalles|What this shows|Qué muestra|Text version|Versión en texto)\b|^\[(What this shows|Qué muestra)/;
const BOTON_ENVIAR = /^\[(Send this|Send this page|Send the three questions|Enviar|Enviar esto|Enviar esta página|Enviar las tres preguntas|Mándasela)\]$/;
const BOTON_COPIAR = /^\[(Copy the prompt|Copiar el prompt)\]$/;
const VIENES = /^\[(You came from|Vienes de):/;
// "{…}" lo llena el navegador; sin llaves, la línea es el valor por defecto (saints-and-souls). "Next moon" sale de la columna (X.lunas)
const PROXIMA = /^(Next here|Next piece|Next moon|Next|Lo que sigue en esta página|Lo que sigue|Lo próximo|Lo siguiente aquí|La próxima pieza|La próxima luna):\s*(?:\{[^}]*\}\.?\s*(?:(Default|Por defecto):\s*(.*))?|([^{\s].*))$/;
const PROX_LUNA = /^(Next moon|La próxima luna)$/;
// "[fold] La noche {#id}" (moon) es un pliegue con rótulo; "Moon: … [tap] …" en la cabeza de una tarjeta lo pone el registro (la luna del dato)
const FOLD_CORTO = /^\[(fold|pliegue)\]\s+(.+?)\s*\{#([\w-]+)\}\s*$/gm;
const LUNA_TARJETA = /^(Moon|Luna):\s.*\[(tap|toque)\]/;
const SOLO_ENLACE = /^\[([^\]]+)\]\((#[\w-]+)\)$/;
const ETIQUETA = /^(Our |Nuestr|Tradition|Tradición|Official data|Datos oficiales|Study|Estudio|Text\b|Texto\b|Dates|Fechas|Moon data|Datos de la luna|Sources of this page|Fuentes de esta página)/;

function idFin(s) { const m = /\s*\{#([\w-]+)\}\s*$/.exec(s); return m ? [s.slice(0, m.index), m[1]] : [s, null]; }

// texto -> fichas (encabezados, párrafos, listas, tablas, citas, tarjetas, marcas de tiempo)
function fichas(lineas) {
  const out = []; let i = 0;
  const esCarta = (s) => /^\*\*.+\*\*\s*\{#c-[\w-]+\}\s*$/.test(s);
  const esLista = (s) => /^([-*]|\d+\.)\s+/.test(s);
  const corta = (s) => !s.trim() || /^#{1,4}\s/.test(s) || /^:::/.test(s) || esCarta(s) || /^\|/.test(s) || /^>/.test(s) || esLista(s);
  while (i < lineas.length) {
    const s = lineas[i]; let m;
    if (!s.trim()) { i++; continue; }
    if ((m = /^(#{1,4})\s+(.*)$/.exec(s))) { const [t, id] = idFin(m[2]); out.push({ t: "h", n: m[1].length, txt: t.trim(), id }); i++; continue; }
    if ((m = /^:::\s*(antes|despues|ambos)$/.exec(s))) { out.push({ t: "tiempo", v: m[1] }); i++; continue; }
    if (esCarta(s)) {
      const id = /\{#(c-[\w-]+)\}/.exec(s)[1], cuerpo = []; i++;
      while (i < lineas.length && !esCarta(lineas[i]) && !/^#{1,3}\s/.test(lineas[i])) cuerpo.push(lineas[i++]);
      const cab = []; let k = 0; while (k < cuerpo.length && cuerpo[k].trim()) cab.push(cuerpo[k++]);
      out.push({ t: "carta", id, cab, resto: fichas(cuerpo.slice(k)) }); continue;
    }
    if (/^\|/.test(s)) { const filas = []; while (i < lineas.length && /^\|/.test(lineas[i])) filas.push(lineas[i++]); out.push({ t: "tabla", filas }); continue; }
    if (/^>/.test(s)) { const xs = []; while (i < lineas.length && /^>/.test(lineas[i])) xs.push(lineas[i++].replace(/^>\s?/, "")); out.push({ t: "cita", lineas: xs }); continue; }
    if (esLista(s)) {
      const ord = /^\d+\./.test(s), items = [];
      while (i < lineas.length && (esLista(lineas[i]) || (lineas[i].trim() && !corta(lineas[i]) && items.length))) {
        if (esLista(lineas[i])) items.push(lineas[i].replace(/^([-*]|\d+\.)\s+/, "")); else items[items.length - 1] += "\n" + lineas[i];
        i++;
      }
      out.push({ t: ord ? "ol" : "ul", items }); continue;
    }
    // una línea de control (pliegue, hueco de un visual, botón, línea de construcción) es su propio párrafo
    const sola = (x) => PLIEGUE.test(idFin(x)[0].trim()) || HUECO_VISUAL.test(x) || CONSTRUCCION.test(x) || BOTON_ENVIAR.test(x.trim()) || BOTON_COPIAR.test(x.trim()) || VIENES.test(x) || PLIEGUE_SECCION.test(x) || (PROXIMA.test(x) && /\{/.test(x));
    const xs = [s]; i++;
    if (!sola(s)) while (i < lineas.length && !corta(lineas[i]) && !sola(lineas[i])) xs.push(lineas[i++]);
    const [ult, id] = idFin(xs[xs.length - 1]); xs[xs.length - 1] = ult;
    out.push({ t: "p", lineas: xs, id });
  }
  return out;
}

// árbol: bloque 0, bloques (## n · …) con su introducción y sus subsecciones (### y ####), el pie
function arbol(md) {
  md = md.replace(FOLD_CORTO, (m, k, t, id) => `\n*${t} (${k === "fold" ? "folded" : "plegado"})* {#${id}}\n`);
  const fs_ = fichas(md.split("\n")), bloques = []; let b = null, sub = null;
  for (const f of fs_) {
    if (f.t === "h" && f.n === 2) {
      const m = /^(\d+)\s*·\s*(.+)$/.exec(f.txt);
      b = { num: m ? +m[1] : null, titulo: m ? m[2] : f.txt, id: f.id, intro: [], subs: [], pie: !m }; bloques.push(b); sub = null; continue;
    }
    if (!b) continue;
    if (f.t === "h" && f.n >= 3) { sub = { n: f.n, titulo: f.txt, id: f.id, fichas: [] }; b.subs.push(sub); continue; }
    (sub ? sub.fichas : b.intro).push(f);
  }
  return bloques;
}

// enlaces de "→ Título", de "[t](url)" y de las citas; todo lo demás, escapado
function contexto({ L, D, p, X, raiz, md, cartasTxt }) {
  const titulos = new Map(); // título visible -> destino
  for (const q of D.paginas) for (const t of [q.titulo, q.titulo_es]) titulos.set(t.toLowerCase(), `${raiz}${L.pref}temas/${q.slug}/`);
  for (const t of ["errata", "fe de erratas"]) titulos.set(t, `${raiz}${L.pref}temas/errata/`);
  const propios = new Map();
  for (const m of md.matchAll(/^#{2,4}\s+(?:\d+\s*·\s*)?(.+?)(?:\s*\{#([\w-]+)\})?\s*$/gm)) if (m[2]) propios.set(m[1].trim().toLowerCase(), "#" + m[2]);
  for (const [id, c] of cartasTxt) if (c.titulo) propios.set(c.titulo.replace(/\s*·\s*en inglés:.*$/, "").toLowerCase(), "#" + id);
  for (const [k, v] of Object.entries(X.flechas || {})) propios.set(k.toLowerCase(), v);
  const sinResolver = [];
  const destinoDe = (t) => { const k = t.trim().replace(/[.,;:]$/, "").toLowerCase(); return propios.get(k) || titulos.get(k) || (/^(errata|fe de erratas)\b/.test(k) ? titulos.get("errata") : null); };
  const href = (u) => (/^\/naos\//.test(u) ? raiz + u.slice(6) : u);
  const ext = (u) => /^https?:/.test(u);
  function inl(s) {
    let out = "", last = 0;
    const RE = /\[([^\]]+)\]\(([^)\s]+)\)|\[(\d+)\]|(https?:\/\/[^\s<>"]+)|\*\*(.+?)\*\*|\*([^*\s](?:[^*]*?[^*\s])?)\*|→\s*([^\[\n]+?)\s*(?=\[|$)|<span lang="(en|es|zh)">|<\/span>/g;
    let m;
    while ((m = RE.exec(s))) {
      out += esc(s.slice(last, m.index)); last = RE.lastIndex;
      if (m[1]) { const u = href(m[2]); out += `<a href="${esc(u)}"${ext(u) ? ' rel="noopener"' : ""}>${inl(m[1])}</a>`; }
      else if (m[3]) out += `<a class="t-cita" href="#f-${m[3]}">[${m[3]}]</a>`;
      else if (m[4]) {
        let u = m[4]; let cola = "";
        while (/[.,;:]$/.test(u) || (u.endsWith(")") && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length)) { cola = u.slice(-1) + cola; u = u.slice(0, -1); }
        out += `<a class="t-url" href="${esc(u)}" rel="noopener" translate="no">${esc(u.replace(/^https?:\/\//, ""))}</a>${esc(cola)}`;
      }
      else if (m[5]) out += `<strong>${inl(m[5])}</strong>`;
      else if (m[6]) out += `<em>${inl(m[6])}</em>`;
      else if (m[7]) { const d = destinoDe(m[7]); if (!d) sinResolver.push(m[7]); out += `<a class="t-flecha" href="${esc(d || "#")}">→ ${esc(m[7].trim())}</a>`; }
      else if (m[8]) out += `<span lang="${m[8]}">`;
      else out += "</span>";
    }
    return out + esc(s.slice(last));
  }
  // en la edición EN, la frase o la cita entre comillas que está en español o en portugués lleva su lang (3.1.2)
  const partesEN = (s) => {
    if (L.lang !== "en" || !otroIdioma(s)) return inl(s);
    return s.split(/(?<=[.;?!])\s+(?=[A-Z0-9¿"(])/).map((fr) => {
      const l = otroIdioma(fr); if (!l) return inl(fr);
      const q = /"[^"]+"/g, citas = fr.match(q) || [];
      if (citas.length && !otroIdioma(fr.replace(q, " "))) return fr.split(/("[^"]+")/).map((x) => (/^"/.test(x) && otroIdioma(x) ? `"<span lang="${otroIdioma(x)}">${inl(x.slice(1, -1))}</span>"` : inl(x))).join("");
      return `<span lang="${l}">${inl(fr)}</span>`;
    }).join(" ");
  };
  // en la edición ES, la parte en inglés de una línea ("… · en inglés: The empty cella") o la línea entera, con su lang (3.1.2)
  const marca = (s) => {
    if (L.lang !== "es") return inl(s);
    const m = /^(.*?en inglés:\s*)(.+?)(\s*·.*)?$/i.exec(s);
    if (m) return `${inl(m[1])}<span lang="en">${inl(m[2])}</span>${m[3] ? inl(m[3]) : ""}`;
    const mp = /^(.+?)(\s*\((?:en inglés|in English)\)\.?)$/.exec(s); // "Before the decision (en inglés)"
    if (mp && !ES_MARCA.test(mp[1].replace(/\[\d+\]/g, ""))) return `<span lang="en">${inl(mp[1])}</span>${inl(mp[2])}`;
    return !ES_MARCA.test(s.replace(/\[\d+\]|https?:\/\/\S+/g, "")) && /[a-z]{3}/i.test(s) ? `<span lang="en">${inl(s)}</span>` : inl(s);
  };
  // el final de un párrafo del bloque 7 que es el título de otra página lleva su enlace ("…, at the table: Phones in the bread basket")
  const conTituloFinal = (s) => {
    for (const [t, d] of titulos) { const i = s.toLowerCase().lastIndexOf(t); if (i > 0 && i + t.length === s.replace(/\s+$/, "").length && !/→\s*$/.test(s.slice(0, i))) return `${inl(s.slice(0, i))}<a class="t-flecha" href="${esc(d)}">${esc(s.slice(i).trim())}</a>`; }
    return null;
  };
  return { inl, marca, partesEN, conTituloFinal, sinResolver };
}

// tarjeta del texto: título, líneas, etiqueta y lo plegado (transcripción y "More on this piece")
function cartaDeTexto(f) {
  const cab = f.cab.filter((x) => !LUNA_TARJETA.test(x)); let transcripcion = null;
  const it = cab.findIndex((x) => /^(Transcript|Transcripción)\b/.test(x));
  if (it >= 0) { const m = /^((?:Transcript|Transcripción)[^:]*):\s*(.*)$/.exec(cab[it]); transcripcion = { rotulo: m[1].replace(/\s*\((folded|plegad[ao])(,?\s*)/i, " (").replace(/\(\s*\)/, "").replace(/\s+\(\)$/, ""), texto: m[2] }; cab.splice(it, 1); }
  let ie = -1; for (let k = cab.length - 1; k > 0; k--) if (/(Voice: synthetic|Voz:? sintética|naos\/s\/|\[\d+\])/.test(cab[k]) || ETIQUETA.test(cab[k])) { ie = k; break; }
  const etiqueta = ie > 0 ? cab[ie] : null, medio = cab.slice(1, ie > 0 ? ie : cab.length);
  return { titulo: cab[0] || null, medio, etiqueta, transcripcion, resto: f.resto };
}

// "Ask for ___. [tap to see: nothing]": el hueco es un botón que muestra la palabra; sin JS la palabra ya se ve
const revela = (h) => h.replace(/___(\.?)\s*\[(?:tap to see|toca para ver):\s*([^\]]+)\]/g, (m, p, w) => `<span class="t-revela"><button type="button" class="t-revela-b" hidden>___</button><span class="t-revela-t">${w.trim()}</span></span>${p}`);

// ---------- render ----------
export function cuerpoTema({ L, D, p, X, md, raiz, xs, carta, enlaces }) {
  const bloques = arbol(md);
  const cartasTxt = new Map();
  const juntar = (fs_) => { for (const f of fs_) if (f.t === "carta") cartasTxt.set(f.id, cartaDeTexto(f)); };
  for (const b of bloques) { juntar(b.intro); for (const s of b.subs) juntar(s.fichas); }
  const C = contexto({ L, D, p, X, raiz, md, cartasTxt });
  const { inl, marca } = C;
  const marcaEtq = (s) => (L.lang === "es" && /en inglés:/i.test(s) ? marca(s) : inl(s));
  const figura = (id) => {
    const f = path.join(X._V, "assets/temas", p.slug, "fig", `${id}.${L.lang}.html`);
    if (!fs.existsSync(f)) throw new Error(`${p.slug}: falta la figura ${id}.${L.lang}.html (correr con --cuerpo)`);
    // los enlaces absolutos del sitio (/naos/…) pasan a relativos, como en el resto de la página
    return fs.readFileSync(f, "utf8").trim().replace(/(href|src)="\/naos\//g, `$1="${raiz}`);
  };
  const visualesDe = (b, sub) => (X.visuales || []).filter((v) => { const k = v[L.lang]; return sub ? (k === sub.id || k === "h:" + sub.titulo) : (k === b.id || k === "h:" + b.titulo); });
  const usados = new Set();
  let registroPuesto = false;

  // una serie de fichas -> HTML, con pliegues, versiones, visuales y el registro de tarjetas
  function serie(fs_, { vis = [], enCarta = false } = {}) {
    const out = []; let pliegue = null, tiempo = null;
    const cerrarPliegue = () => { if (pliegue) { out.push("</details>"); pliegue = null; } };
    const cerrarTiempo = () => { if (tiempo) { out.push("</div>"); tiempo = null; } };
    const pendientes = [...vis];
    const hayHueco = fs_.some((y) => y.t === "p" && HUECO_VISUAL.test(y.lineas[0]));
    const ponVisual = (v) => { out.push(`<div class="t-viz" data-viz-id="${v.id}">\n${figura(v.id)}\n</div>`); usados.add(v.id); pendientes.splice(pendientes.indexOf(v), 1); };
    let saltar = null, enConstruccion = false;
    for (const f of fs_) {
      const linea1 = f.t === "p" ? f.lineas[0] : "";
      if (saltar) { const re = new RegExp(saltar); if (f.t === "p" && f.lineas.some((x) => re.test(x))) saltar = null; continue; }
      if (f.t === "tiempo") { if (pliegue && tiempo) cerrarPliegue(); cerrarTiempo(); if (f.v !== "ambos") { tiempo = f.v; out.push(`<div class="t-tiempo" data-tiempo="${f.v}"${f.v === "despues" ? " hidden" : ""}>`); } continue; }
      if (f.t === "p" && f.lineas.length === 1 && PLIEGUE_SECCION.test(linea1)) continue; // lo resuelve la sección
      if (f.t === "carta") { if (!registroPuesto) { out.push(tarjetas()); registroPuesto = true; } continue; }
      // el visual en su hueco
      if (f.t === "p" && HUECO_VISUAL.test(linea1)) {
        const v = pendientes.find((x) => new RegExp(`fig/${x.id}\\.`).test(linea1)) || pendientes.find((x) => !x.despues && x.id !== "mapa") || pendientes[0];
        if (v) { ponVisual(v); if (v.reemplaza) saltar = v.reemplaza[L.lang]; }
        continue;
      }
      // el bloque de construcción del mapa se va; en su lugar, la figura (si no estaba ya en su hueco)
      if (f.t === "p" && CONSTRUCCION.test(linea1)) {
        if (!enConstruccion) { enConstruccion = true; const v = pendientes.find((x) => x.id === "mapa"); if (v) ponVisual(v); }
        continue;
      }
      if (enConstruccion && (f.t === "ul" || f.t === "ol")) continue;
      enConstruccion = false;
      // la figura es el contenido del contenedor: va al inicio y se quita el texto que ella ya trae
      const vr = !hayHueco && pendientes.find((x) => x.reemplaza);
      if (vr) { ponVisual(vr); const re = new RegExp(vr.reemplaza[L.lang]); if (!(f.t === "p" && f.lineas.some((x) => re.test(x)))) saltar = vr.reemplaza[L.lang]; continue; }
      // pliegue con su rótulo
      if (f.t === "p" && f.lineas.length === 1 && PLIEGUE.test(linea1)) {
        cerrarPliegue();
        const m = PLIEGUE.exec(linea1), mas = m[3] || "";
        const cls = /next one stays open|la próxima queda abierta/i.test(mas) ? " t-pliegue-proxima" : /each part|cada parte/i.test(mas) ? " t-pliegue-partes" : "";
        out.push(`<details class="t-pliegue${cls}"${f.id ? ` id="${f.id}"` : ""}><summary>${inl(m[1].trim())}</summary>`);
        pliegue = { cls };
        continue;
      }
      const h = ficha(f, { enCarta });
      if (h) out.push(h);
      if (f.t === "p" && FIN_PLIEGUE.test(f.lineas[f.lineas.length - 1])) cerrarPliegue();
      for (const v of [...pendientes]) if (v.despues && f.t === "p" && new RegExp(v.despues[L.lang]).test(linea1)) ponVisual(v);
    }
    for (const v of [...pendientes]) ponVisual(v);
    return { html: out, abierto: () => pliegue, cerrar: () => { const r = []; if (pliegue) r.push("</details>"); if (tiempo) r.push("</div>"); pliegue = null; tiempo = null; return r; } };
  }

  function ficha(f, { enCarta }) {
    if (f.t === "ul" || f.t === "ol") return `<${f.t}>${f.items.map((x) => `<li>${x.split("\n").map(C.partesEN).join("<br>")}</li>`).join("")}</${f.t}>`;
    if (f.t === "cita") return `<blockquote class="t-prompt"><p>${f.lineas.map(inl).join("<br>")}</p></blockquote>`;
    if (f.t === "tabla") {
      const celdas = (r) => r.replace(/^\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
      const [cab, , ...cuerpo] = f.filas, ks = celdas(cab);
      return `<div class="t-tabla"><table><thead><tr>${ks.map((c) => `<th scope="col">${inl(c)}</th>`).join("")}</tr></thead><tbody>${cuerpo.map((r) => `<tr>${celdas(r).map((c, i) => i ? `<td data-k="${esc(ks[i])}">${C.partesEN(c)}</td>` : `<th scope="row">${C.partesEN(c)}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    if (f.t === "h") return f.n === 1 ? `<h1>${sinCorteGuion(inl(f.txt))}</h1>` : `<h4${f.id ? ` id="${f.id}"` : ""}>${inl(f.txt)}</h4>`;
    if (f.t !== "p") return "";
    const ls = f.lineas.map((x) => x.replace(FIN_PLIEGUE, ""));
    const s = ls.join(" ").trim(), id = f.id ? ` id="${f.id}"` : "";
    if (ls.length === 1 && BOTON_ENVIAR.test(s)) {
      const txt = (X.enviar || {})[L.lang] || X.meta[L.lang].og_description;
      return `<p class="t-acciones"${id}><button type="button" class="t-btn" data-enviar data-texto="${esc(txt)}" data-titulo="${esc(X.meta[L.lang].h1)}" hidden>${esc(s.slice(1, -1))}</button> <span class="t-estado-btn" role="status"></span></p>`;
    }
    if (ls.length === 1 && BOTON_COPIAR.test(s)) return `<p class="t-acciones"${id}><button type="button" class="t-btn" data-copiar hidden>${esc(s.slice(1, -1))}</button> <span class="t-estado-btn" role="status"></span></p>`;
    if (VIENES.test(s)) {
      const mapa = Object.fromEntries(Object.entries(X.cortos || {}).map(([c, e]) => [c, e[L.lang] || e.en]));
      const at = Object.fromEntries(Object.entries(X.cortos || {}).filter(([, e]) => e.aterriza && e.aterriza[L.lang]).map(([c, e]) => [c, e.aterriza[L.lang]]));
      return `<p class="t-vienes-l" data-vienes="${esc(JSON.stringify(mapa))}" data-aterriza="${esc(JSON.stringify(at))}" data-rotulo="${L.lang === "es" ? "Vienes de:" : "You came from:"}" hidden></p>`;
    }
    const mp = PROXIMA.exec(s);
    if (mp) {
      const x0 = xs[0], dt = mp[3] || mp[4], def = dt ? inl(dt.trim()) : x0 ? `${esc(L.fe(x0.fecha))}, ${esc(x0.hora_et)} ET (${esc(x0.hora_medellin)} Medellín)` : "";
      if (PROX_LUNA.test(mp[1]) && X.lunas) return `<p class="t-proxima"${id}><span class="t-proxima-k">${esc(mp[1])}:</span> <span data-proxima-luna="${esc(JSON.stringify(X.lunas.map((u) => ({ t: u.t, x: u[L.lang] }))))}">${def}</span></p>`;
      return `<p class="t-proxima"${id}><span class="t-proxima-k">${esc(mp[1])}:</span> <span data-proxima>${def}</span></p>`;
    }
    const se = ls.length === 1 && SOLO_ENLACE.exec(s);
    if (se && X.soloSrc && X.soloSrc[se[2]]) return `<p class="t-solo-src" data-solo-src="${esc(X.soloSrc[se[2]].join(" "))}" hidden><a href="${esc(se[2])}">${inl(se[1])}</a></p>`;
    if (/^\{[^}]*\}(\s*\[\d+\])*\.?$/.test(s)) return ""; // hueco del día del evento: no se muestra hasta que el dato exista
    if (ls.length === 1 && N_LINEAS.includes(s)) return `<p class="t-linea-n-b"${id}>${esc(s)}</p>`;
    if (ls.length === 1 && /^\*[^*].*\*$/.test(s)) return `<p class="t-sub"${id}>${inl(s.slice(1, -1))}</p>`;
    if (ls.length === 1 && ETIQUETA.test(s) && s.length < 140 && !/\.$/.test(s.replace(/\s*\[\d+\]/g, ""))) return `<p class="t-etq"${id}>${inl(s)}</p>`;
    const mf = /^\[(\d+)\]\s+([\s\S]*)$/.exec(s);
    if (mf) return `<p class="t-fuente" id="f-${mf[1]}"><span class="t-fn">[${mf[1]}]</span> ${C.partesEN(mf[2])}</p>`;
    const ml = /^(The line to carry|Line to take|La frase que te llevas|Frase para llevar|La frase para llevarse|Llévate esta frase)([^:]*):\s*(.+)$/.exec(s);
    if (ml) return `<p class="t-llevar"${id}><span class="t-llevar-k">${inl(ml[1] + ml[2])}:</span> ${revela(inl(ml[3]))}</p>`;
    if (!enCarta && ls.length === 1) { const t = C.conTituloFinal(s); if (t) return `<p${id}>${t}</p>`; }
    // el canal de correcciones (lo añade el constructor): la frase enlaza al contacto de la página de términos
    if (/(Corrections welcome|Correcciones bienvenidas)\.?/.test(s) && !/\]\(/.test(s)) return `<p${id}>${ls.map(inl).join("<br>").replace(/(Corrections welcome|Correcciones bienvenidas)/, `<a href="${raiz}terminos.html"${L.lang === "es" ? "" : ' hreflang="es"'}>$1</a>`)}</p>`;
    return `<p${id}>${ls.map(C.partesEN).join("<br>")}</p>`;
  }

  // ---- bloque 5: el registro del constructor, con el texto de cada tarjeta ----
  function tarjetas() {
    const humanity = p.seccion === "Humanity";
    const li = xs.map((x, i) => {
      const t = cartasTxt.get(x.id), o = X.luna && X.luna[x.id];
      const luna = o && x.luna ? { ...x.luna, iluminacion: o.iluminacion, fase: o.fase[L.lang] || x.luna.fase } : x.luna;
      return carta(L, { ...x, luna }, p, enlaces[x.fecha + "|" + x.codigo], raiz, i > 0 && xs[i - 1].fecha === x.fecha, i > 0 && xs[i - 1].fecha === x.fecha && !!x.luna && JSON.stringify(xs[i - 1].luna) === JSON.stringify(x.luna), t ? cartaExtra(t) : null);
    });
    return `${humanity ? `<p class="t-col-luna" aria-hidden="true">${L.colLuna}</p>\n` : ""}<ol class="t-cartas">\n${li.join("\n")}\n</ol>${xs.some((x) => x.luna) ? `\n<p class="t-fuentes-n t-luna-datos">${X.lunaDatos ? inl(X.lunaDatos[L.lang]) : L.lunaDatos}</p>` : ""}`;
  }
  function cartaExtra(t) {
    const fuera = /^(Voice: synthetic|Voz:? sintética|Descriptive, not financial advice\.?|Descriptivo, sin asesoría financiera\.?)$/;
    const et = t.etiqueta ? t.etiqueta.split(/\s+·\s+/).map((x) => x.replace(/\s*\{[^}]*\}/g, "").trim()).filter((x) => x && !fuera.test(x) && !/^naos\/s\//.test(x)).join(" · ") : "";
    const medio = t.medio.map((m, i) => `<p class="${i === 0 && t.medio.length > 1 ? "t-linea" : "t-desc"}">${marca(m)}</p>`).join("");
    let resto = "";
    if (t.resto.length) { const r = serie(t.resto, { enCarta: true }); resto = [...r.html, ...r.cerrar()].join("\n"); }
    const tr = t.transcripcion ? `<details class="t-pliegue t-transc"><summary>${esc(t.transcripcion.rotulo)}</summary><p lang="en">${inl(t.transcripcion.texto)}</p></details>` : "";
    return { titulo: t.titulo ? marca(t.titulo) : null, cuerpo: medio + (et ? `<p class="t-etq">${marcaEtq(et)}</p>` : "") + tr + (resto ? `<div class="t-mas">${resto}</div>` : "") };
  }

  // ---- bloques ----
  const html = []; let umbral = "", pie = null;
  for (const b of bloques) {
    if (b.pie) { pie = b; continue; }
    const vis0 = visualesDe(b, null);
    if (b.num === 0) {
      const r = serie(b.intro, { vis: vis0 });
      const subs = b.subs.map((s) => { const q = serie(s.fichas); return `<section class="t-sub t-sub-umbral"${s.id ? ` id="${s.id}"` : ""}><h2>${inl(s.titulo)}</h2>\n${[...q.html, ...q.cerrar()].join("\n")}\n</section>`; });
      umbral = [...r.html, ...r.cerrar(), ...subs].join("\n");
      continue;
    }
    const id = b.id || `b${b.num}`;
    const pliegaSeccion = b.intro.find((f) => f.t === "p" && f.lineas.length === 1 && PLIEGUE_SECCION.test(f.lineas[0]));
    const etiquetaPliegue = pliegaSeccion && /:\s*"([^"]+)"/.exec(pliegaSeccion.lineas[0]);
    const traeSuPliegue = vis0.some((v) => /^<details/.test(figura(v.id)));
    const r = serie(b.intro, { vis: vis0 });
    const partes = !!(r.abierto() && /t-pliegue-partes/.test(r.abierto().cls));
    const subs = b.subs.map((s) => subseccion(s, b, partes));
    const h2 = `<h2 id="${id}-t">${inl(b.titulo)}</h2>`;
    let dentro = [...r.html, ...subs, ...r.cerrar()].join("\n");
    if (b.num === 8) dentro = `<details class="t-pliegue t-pliegue-h t-fuentes-pl"><summary>${h2}</summary>\n${dentro}\n</details>`;
    else if (pliegaSeccion && !traeSuPliegue) dentro = etiquetaPliegue ? `${h2}\n<details class="t-pliegue"><summary>${esc(etiquetaPliegue[1])}</summary>\n${dentro}\n</details>` : `<details class="t-pliegue t-pliegue-h"><summary>${h2}</summary>\n${dentro}\n</details>`;
    else dentro = `${h2}\n${dentro}`;
    html.push(`<section class="t-bloque t-cuerpo-b t-b${b.num}" id="${id}" aria-labelledby="${id}-t">\n${dentro}\n</section>`);
  }
  function subseccion(s, b, partes) {
    const cfg = s.id && (X.pliegues || {})[s.id];
    const pl = cfg || s.fichas.find((f) => f.t === "p" && f.lineas.length === 1 && PLIEGUE_SECCION.test(f.lineas[0]));
    const r = serie(s.fichas, { vis: visualesDe(b, s) });
    let c = [...r.html, ...r.cerrar()].join("\n");
    const h = `<h${s.n}>${inl(s.titulo)}</h${s.n}>`, attr = (s.id ? ` id="${s.id}"` : "") + (cfg && cfg.desde ? ` data-visible-desde="${cfg.desde}"` : "");
    if (pl || (partes && s.n === 3)) {
      // en "cada parte se abre por separado", la línea en cursiva bajo el título va con el rótulo
      let sub = ""; const m = /^<p class="t-sub">([\s\S]*?)<\/p>\n?/.exec(c);
      if (m && partes) { sub = `<span class="t-sub-s">${m[1]}</span>`; c = c.slice(m[0].length); }
      return `<section class="t-sub"${attr}><details class="t-pliegue t-pliegue-h"><summary>${h}${sub}</summary>\n${c}\n</details></section>`;
    }
    return `<section class="t-sub"${attr}>${h}\n${c}\n</section>`;
  }
  if (!registroPuesto) throw new Error(`${p.slug} (${L.lang}): el texto no trae tarjetas en el bloque 5`);
  for (const v of X.visuales || []) if (!usados.has(v.id)) throw new Error(`${p.slug} (${L.lang}): el visual ${v.id} no encontró su lugar (${v[L.lang]})`);
  if (C.sinResolver.length) throw new Error(`${p.slug} (${L.lang}): flechas sin destino: ${[...new Set(C.sinResolver)].join(" | ")}`);
  // pie: las líneas del texto después de la de ayuda (la de ayuda es la verificada del constructor, con la cita del texto)
  let piePs = { cita: "", lineas: [] };
  if (pie) {
    const ps = pie.intro.filter((f) => f.t === "p" || f.t === "ul");
    piePs = { cita: ps[0] ? [...ps[0].lineas.join(" ").matchAll(/\[(\d+)\]/g)].map((m) => ` <a class="t-cita" href="#f-${m[1]}">[${m[1]}]</a>`).join("") : "",
      lineas: ps.slice(1).map((f) => (f.t === "ul" ? { html: `<ul class="t-pie-lista">${f.items.map((x) => `<li>${inl(x)}</li>`).join("")}</ul>` } : f.lineas.join(" "))) };
  }
  const salida = { umbral, bloques: html.join("\n"), pie: piePs, nombres: Object.fromEntries([...cartasTxt].map(([id, c]) => [id, c.titulo])) };
  const texto = (umbral + salida.bloques).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ");
  const llave = /\{[^}\n]{0,80}\}/.exec(texto);
  if (llave) throw new Error(`${p.slug} (${L.lang}): queda un hueco sin llenar: ${llave[0]}`);
  return salida;
}
