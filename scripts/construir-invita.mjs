// construir-invita.mjs · las invitaciones vivas (I34, D-317): una página estática por invitación y por idioma.
//   node scripts/construir-invita.mjs
// Lee data/invita.json y escribe invita/<slug>/index.html (EN) y es/invita/<slug>/index.html (ES) para cada invitación con
// publicar: true. Las de publicar: false (luna, puerta) son la plantilla lista: cambiar a true y volver a correr.
// El nombre de quien invita va en el fragmento (#nombre=Ana): lo lee assets/invita/invita.js en el teléfono, lo pone con
// textContent y nunca viaja en la petición ni al contador (data-exclude-hash en contador.js). Determinista, sin dependencias.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AYUDA_HTML, AYUDA_HTML_ES } from "./construir-temas.mjs";

const V = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://hardlypythonnmr.github.io/naos/";
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const UI = {
  en: { pref: "", otro: "es", otroNombre: "Español", lema: "Closer to yourself.", saltar: "Skip to the invitation",
    pausa: "Pause", play: "Play", turno: "Your turn to invite", nombre: "Your name",
    ayuda: "It travels only inside the link, after the #. NAOS never receives it and keeps nothing.",
    falta: "Write a name first.", crear: "Make my link", listo: "Your link is ready.", enlace: "Your link",
    wa: "Share on WhatsApp", copiar: "Copy link", copiado: "Copied.", privacidad: "Privacy", casa: "NAOS home",
    nada: "Nothing you type here is saved or sent anywhere until you share the link yourself.", ayudaHTML: AYUDA_HTML, locale: "en_US" },
  es: { pref: "es/", otro: "en", otroNombre: "English", lema: "Más cerca de ti.", saltar: "Ir a la invitación",
    pausa: "Pausar", play: "Reproducir", turno: "Te toca invitar", nombre: "Tu nombre",
    ayuda: "Va solo dentro del enlace, después del #. NAOS no lo recibe ni guarda nada.",
    falta: "Primero escribe un nombre.", crear: "Crear mi enlace", listo: "Tu enlace está listo.", enlace: "Tu enlace",
    wa: "Compartir por WhatsApp", copiar: "Copiar enlace", copiado: "Copiado.", privacidad: "Privacidad", casa: "NAOS en español",
    nada: "Lo que escribes aquí no se guarda ni se manda a ningún lado hasta que tú compartes el enlace.", ayudaHTML: AYUDA_HTML_ES, locale: "es_419" },
};

function pagina(I, lang) {
  const T = I[lang], U = UI[lang], O = UI[U.otro];
  const ruta = `${U.pref}invita/${I.slug}/`, rutaOtra = `${O.pref}invita/${I.slug}/`;
  const raiz = "../".repeat(ruta.split("/").filter(Boolean).length);
  const [y0, y1] = I.recorte, h = Math.round((y1 - y0) * 1920), oy = ((y0 * 1920) / (1920 - h)) * 100;
  const [antes, despues] = T.frase.split("{nombre}");
  const casa = lang === "es" ? `${raiz}es/` : raiz;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(T.titulo)} · NAOS</title>
<meta name="description" content="${esc(T.og_desc)}">
<link rel="canonical" href="${BASE}${ruta}">
<link rel="alternate" hreflang="en" href="${BASE}invita/${I.slug}/">
<link rel="alternate" hreflang="es" href="${BASE}es/invita/${I.slug}/">
<link rel="alternate" hreflang="x-default" href="${BASE}invita/${I.slug}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="NAOS">
<meta property="og:locale" content="${U.locale}">
<meta property="og:title" content="${esc(T.og_titulo)}">
<meta property="og:description" content="${esc(T.og_desc)}">
<meta property="og:url" content="${BASE}${ruta}">
<meta property="og:image" content="${BASE}${I.og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(T.video_alt)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${raiz}assets/marca/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${raiz}assets/marca/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${raiz}assets/marca/avatar-800.png">
<link rel="preload" href="${raiz}assets/fuentes/Newsreader.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${raiz}assets/comun/tokens.css">
<link rel="stylesheet" href="${raiz}assets/comun/base.css">
<link rel="stylesheet" href="${raiz}assets/invita/invita.css">
<script defer src="${raiz}assets/invita/invita.js"></script>
<script defer src="${raiz}assets/comun/contador.js"></script>
</head>
<body>
<a class="sr" href="#pieza">${esc(U.saltar)}</a>
<header class="i-barra">
<a class="i-marca" href="${casa}">NAOS</a>
<a class="i-idioma" id="otro-idioma" href="${raiz}${rutaOtra}" hreflang="${U.otro}" lang="${U.otro}">${esc(U.otroNombre)}</a>
</header>
<main id="main" data-alguien="${esc(T.alguien)}" data-compartir="${esc(T.compartir)}" data-pausa="${esc(U.pausa)}" data-play="${esc(U.play)}" data-copiado="${esc(U.copiado)}" data-listo="${esc(U.listo)}">
<article class="i-pieza i-${esc(I.fondo)}" id="pieza" aria-labelledby="frase">
<h1 class="i-frase" id="frase">${esc(antes)}<span class="i-nombre" id="nombre">${esc(T.alguien)}</span>${esc(despues)}</h1>
<p class="i-sub">${esc(T.sub)}</p>
<div class="i-escena" style="--ar:1080/${h};--oy:${oy.toFixed(1)}%">
<video muted loop playsinline preload="metadata" poster="${raiz}${I.poster}" aria-label="${esc(T.video_alt)}"><source src="${raiz}${I.video}" type="video/mp4"></video>
<button class="i-pausa" type="button" id="pausa" aria-pressed="false" hidden>${esc(U.pausa)}</button>
</div>
<p class="i-firma"><span>NAOS</span> ${esc(U.lema)}</p>
</article>
<p class="i-responder" id="responder" hidden><a class="i-boton" href="https://wa.me/?text=${encodeURIComponent(T.responder)}" target="_blank" rel="noopener" data-umami-event="invita-responder">${esc(T.responder_boton)}</a></p>
<section class="i-invita" aria-labelledby="turno">
<h2 id="turno">${esc(U.turno)}</h2>
<form id="forma" novalidate>
<label for="n">${esc(U.nombre)}</label>
<p class="i-ayuda" id="n-ayuda">${esc(U.ayuda)}</p>
<input id="n" name="nombre" type="text" maxlength="30" autocomplete="given-name" autocapitalize="words" spellcheck="false" enterkeyhint="done" aria-describedby="n-ayuda n-error">
<p class="i-error" id="n-error" hidden>${esc(U.falta)}</p>
<button class="i-boton" type="submit" data-umami-event="invita-crear">${esc(U.crear)}</button>
</form>
<div class="i-listo" id="listo" hidden>
<p class="i-estado" id="estado" role="status"></p>
<label for="enlace">${esc(U.enlace)}</label>
<input id="enlace" type="url" readonly>
<div class="i-acciones">
<a class="i-boton" id="wa" href="https://wa.me/" target="_blank" rel="noopener" data-umami-event="invita-compartir">${esc(U.wa)}</a>
<button class="i-boton i-sec" type="button" id="copiar" data-umami-event="invita-copiar">${esc(U.copiar)}</button>
</div>
</div>
<p class="i-nada">${esc(U.nada)}</p>
</section>
</main>
<footer class="i-pie">
<p class="ayuda-l">${U.ayudaHTML}</p>
<p><a href="${casa}">${esc(U.casa)}</a> · <a href="${raiz}privacidad.html#contador" hreflang="es">${esc(U.privacidad)}</a></p>
</footer>
</body>
</html>
`;
}

const D = JSON.parse(fs.readFileSync(path.join(V, "data/invita.json"), "utf8"));
let n = 0;
for (const I of D.invitaciones) {
  for (const lang of ["en", "es"]) {
    const f = path.join(V, UI[lang].pref, "invita", I.slug, "index.html");
    if (!I.publicar) { if (fs.existsSync(f)) fs.rmSync(path.dirname(f), { recursive: true }); continue; }
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, pagina(I, lang));
    n++;
  }
}
console.log(`construir-invita: ${n} páginas (${D.invitaciones.filter((I) => I.publicar).map((I) => I.slug).join(", ")}); plantilla sin publicar: ${D.invitaciones.filter((I) => !I.publicar).map((I) => I.slug).join(", ") || "ninguna"}`);
