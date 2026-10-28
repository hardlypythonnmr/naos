/* app.js · la lista de cuartos (que es tambien el respaldo accesible), el panel de cada cuarto y las rutas (#/kitchen).
 * No depende de three: si WebGL no existe o falla la carga, la casa se recorre igual con la lista y el panel. */
const D = window.CASA;

/* orden de recorrido alrededor del patio: entrada, ventanas, cocina, escaleras, alcoba, mesa, y el patio al final */
const ORDEN = [
  { slug: "door", key: "puerta" },
  { slug: "windows", key: "ventana" },
  { slug: "kitchen", key: "cocina" },
  { slug: "stairs", key: "escaleras" },
  { slug: "bedroom", key: "alcoba" },
  { slug: "table", key: "mesa" },
  { slug: "courtyard", key: "patio" }
];
const porSlug = Object.fromEntries(ORDEN.map((o) => [o.slug, o]));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = (s, r = document) => r.querySelector(s);

const estado = { slug: null, escena: null, tres: false };
const raiz = document.documentElement;

/* ---------- lista de cuartos (enlaces reales) ---------- */
function pintaLista() {
  const ul = $("#lista");
  ul.innerHTML = ORDEN.map((o) => {
    const c = D.cuartos[o.key], pal = D.P[c.pal];
    return '<li><a href="#/' + o.slug + '" data-slug="' + o.slug + '" style="--campo:' + pal.campo + ";--tinta:" + pal.tinta + '">' +
      '<span class="n">' + esc(c.nombre) + '</span><span class="w">' + esc(c.palabra) + "</span></a></li>";
  }).join("");
}

/* ---------- panel de un cuarto ---------- */
function bor() { return ' <span class="bor" title="Team draft. N rewrites it.">[N] draft</span>'; }
function item(it, yt) {
  const img = "media/" + it.id;
  if (it.tipo === "video") {
    return '<figure class="item short"><div class="media"><video controls preload="none" playsinline poster="' + img + '.jpg" src="' + img + '.mp4" aria-label="Short: ' + esc(it.titulo) + '"></video></div>' +
      "<figcaption><strong>" + esc(it.titulo) + '</strong><span class="tarj">' + esc(it.tarjeta) + '</span><a class="enl" href="' + yt + '" target="_blank" rel="noopener">More on YouTube<span class="sr"> (opens in a new tab)</span></a></figcaption></figure>';
  }
  return '<figure class="item card"><div class="media"><img src="' + img + '.jpg" alt="Card: ' + esc(it.tarjeta) + '" loading="lazy" width="270" height="480"></div>' +
    "<figcaption><strong>" + esc(it.titulo) + '</strong><span class="tarj">Card</span><a class="enl" href="' + yt + '" target="_blank" rel="noopener">See it on YouTube<span class="sr"> (opens in a new tab)</span></a></figcaption></figure>';
}
function pintaPanel(slug) {
  const o = porSlug[slug], c = D.cuartos[o.key], pal = D.P[c.pal];
  const i = ORDEN.indexOf(o), prev = ORDEN[(i + ORDEN.length - 1) % ORDEN.length], next = ORDEN[(i + 1) % ORDEN.length];
  const pn = (x) => D.cuartos[x.key].nombre;
  const p = $("#panel");
  p.style.setProperty("--campo", pal.campo); p.style.setProperty("--tinta", pal.tinta); p.style.setProperty("--agua", pal.agua);
  p.innerHTML =
    '<div class="p-barra"><button type="button" class="cerrar" id="p-cerrar"><span aria-hidden="true">&larr;</span> Back to the house</button>' +
    '<button type="button" class="min" id="p-min" aria-expanded="true" aria-controls="p-cuerpo">Hide text</button></div>' +
    '<div class="p-cuerpo" id="p-cuerpo">' +
    '<p class="kick">' + esc(c.nombre) + " &middot; " + esc(c.palabra) + "</p>" +
    '<h2 id="p-tit" tabindex="-1">' + esc(c.linea) + "</h2>" +
    '<section class="bloque" aria-labelledby="h-que"><h3 id="h-que">What it is' + bor() + "</h3><p>" + esc(c.que) + "</p></section>" +
    '<section class="bloque" aria-labelledby="h-por"><h3 id="h-por">Why it is like this' + bor() + "</h3><p>" + esc(c.relacion) + "</p></section>" +
    '<section class="bloque" aria-labelledby="h-como"><h3 id="h-como">How behaviors show up here' + bor() + "</h3>" +
    (c.conducta ? '<p class="conducta">' + esc(c.conducta) + "</p>" : "") + "<p>" + esc(c.invitacion) + "</p></section>" +
    '<section class="bloque" aria-labelledby="h-sh"><h3 id="h-sh">Shorts and cards</h3><div class="tira">' + c.biblioteca.map((x) => item(x, D.yt)).join("") + "</div>" +
    (c.faltan ? '<p class="nota">' + esc(c.faltan) + "</p>" : "") + "</section>" +
    '<section class="bloque yt" aria-labelledby="h-yt"><h3 id="h-yt">Go deeper</h3><p>Mediums and longs on YouTube: the science and the traditions behind these behaviors.</p>' +
    '<a class="btn" href="' + D.yt + '" target="_blank" rel="noopener">Watch on YouTube<span class="sr"> (opens in a new tab)</span></a></section>' +
    '<nav class="p-nav" aria-label="Walk around the courtyard">' +
    '<a href="#/' + prev.slug + '" rel="prev"><span aria-hidden="true">&larr;</span> ' + esc(pn(prev)) + "</a>" +
    '<a href="#/" class="centro">The whole house</a>' +
    '<a href="#/' + next.slug + '" rel="next">' + esc(pn(next)) + ' <span aria-hidden="true">&rarr;</span></a></nav>' +
    "</div>";
  $("#p-cerrar").addEventListener("click", () => { location.hash = "#/"; });
  const min = $("#p-min");
  min.addEventListener("click", () => {
    const m = p.classList.toggle("mini");
    min.setAttribute("aria-expanded", String(!m)); min.textContent = m ? "Show text" : "Hide text";
  });
}

/* ---------- ruta ---------- */
function rutaActual() {
  const m = /^#\/([a-z-]+)/.exec(location.hash);
  return m && porSlug[m[1]] ? m[1] : null;
}
function mostrar(slug, desdeTeclado) {
  estado.slug = slug;
  const p = $("#panel");
  document.querySelectorAll("#lista a").forEach((a) => {
    if (a.dataset.slug === slug) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if (slug) {
    pintaPanel(slug);
    p.hidden = false; raiz.classList.add("dentro");
    document.title = D.cuartos[porSlug[slug].key].nombre + " · NAOS, the house in 3D (prototype)";
    const t = $("#p-tit");
    // el foco va al titulo del cuarto: el lector de pantalla lo anuncia
    requestAnimationFrame(() => { try { t.focus({ preventScroll: true }); } catch (e) {} if (!raiz.classList.contains("con3d")) p.scrollIntoView({ block: "start" }); });
  } else {
    p.hidden = true; p.innerHTML = ""; p.classList.remove("mini"); raiz.classList.remove("dentro");
    document.title = "NAOS · the house in 3D (prototype)";
  }
  if (estado.escena) estado.escena.irA(slug);
}
function siguiente(d) {
  const i = estado.slug ? ORDEN.findIndex((o) => o.slug === estado.slug) : (d > 0 ? -1 : 0);
  const n = ORDEN[(i + d + ORDEN.length) % ORDEN.length];
  location.hash = "#/" + n.slug;
}

pintaLista();
window.addEventListener("hashchange", () => mostrar(rutaActual()));
document.addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  const t = e.target;
  if (t && (t.tagName === "VIDEO" || t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  if (e.key === "Escape" && estado.slug) { location.hash = "#/"; e.preventDefault(); }
  else if (estado.slug && e.key === "ArrowRight") { siguiente(1); e.preventDefault(); }
  else if (estado.slug && e.key === "ArrowLeft") { siguiente(-1); e.preventDefault(); }
});
$("#b-recorrer").addEventListener("click", () => siguiente(1));

/* ---------- la escena 3D (si hay WebGL) ---------- */
function sin3d(motivo) {
  raiz.classList.remove("con3d"); raiz.classList.add("sin3d");
  const a = $("#aviso3d"); if (a) { a.hidden = false; a.textContent = motivo; }
}
const forzar2d = /[?&]2d\b/.test(location.search);
function hayWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}
if (forzar2d || !hayWebGL()) {
  sin3d("The 3D view needs WebGL, which is not available here. The rooms below work the same.");
  mostrar(rutaActual());
} else {
  raiz.classList.add("con3d");
  import("./escena.js").then((m) => m.iniciar({
    datos: D, orden: ORDEN, ir: (slug) => { location.hash = slug ? "#/" + slug : "#/"; }, sig: siguiente,
    listo: (esc) => { estado.escena = esc; mostrar(rutaActual()); }
  })).catch((err) => {
    console.warn("casa3d: no se pudo iniciar la escena", err);
    sin3d("The 3D view did not load. The rooms below work the same.");
    mostrar(rutaActual());
  });
}
