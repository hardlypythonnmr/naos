/* temas.js · páginas de tema y hubs (lote E, D-252). Sin dependencias, sin Lenis, sin animación. Solo marca, si hay JS:
 *   ?src=<codigo>: la tarjeta del Short del que viene el lector lleva "You came from this Short" (en la edición ES, "Viniste de este Short").
 *   hoy: las tarjetas con fecha de hoy en Nueva York (ET, la zona de la grilla) llevan "Today".
 *   hubs: el tema que corre hoy lleva "Now", los ya cerrados se aclaran, y la línea de tiempo lleva la marca de hoy.
 *   páginas con cuerpo: "You came from" en el umbral y el bloque donde aterriza el Short; la próxima pieza por fecha; la versión
 *   de después de un evento; abre el pliegue del destino de un ancla; "Send this" y "Copy the prompt".
 * La guía de la portada (D-236) nunca abre aquí: este archivo no la carga. */
(function () {
  "use strict";
  // la edición ES (D-253) dice lo mismo en español
  const T = document.documentElement.lang === "es" ? { hoy: "Hoy", ahora: "Ahora", vienes: "Viniste de este Short" } : { hoy: "Today", ahora: "Now", vienes: "You came from this Short" };
  const marca = (el, txt) => { const p = document.createElement("p"); p.className = "t-marca-js"; p.textContent = txt; const w = el.querySelector(".t-when") || el; w.insertBefore(p, w.firstChild); };
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  document.querySelectorAll(".t-carta").forEach((c) => { if (c.dataset.fecha === hoy) { c.classList.add("t-hoy"); marca(c, T.hoy); } });
  // hubs
  const m = document.querySelector("main[data-t0]");
  if (m && hoy >= m.dataset.t0 && hoy < m.dataset.t1) {
    const d = (f) => Date.parse(f + "T00:00:00Z");
    m.style.setProperty("--hoy", (((d(hoy) - d(m.dataset.t0)) / (d(m.dataset.t1) - d(m.dataset.t0))) * 100).toFixed(2) + "%");
    m.classList.add("t-con-hoy");
  }
  document.querySelectorAll(".t-tema[data-desde]").forEach((a) => {
    if (a.dataset.hasta < hoy) a.classList.add("t-pasado");
    else if (a.dataset.desde <= hoy) { const s = document.createElement("span"); s.className = "t-ahora"; s.textContent = T.ahora; a.querySelector(".t-tema-m")?.prepend(s); }
  });
  // ---- páginas con cuerpo (lote 0+1): todo sobre marcado fijo; sin JS la página se lee entera, con lo plegado plegado ----
  const ES = document.documentElement.lang === "es";
  const ahora = Date.now();
  // antes y después de un evento (fomc): la versión del después aparece cuando pasa la hora de main[data-cambio]
  const mainC = document.querySelector("main[data-cambio]");
  if (mainC && ahora >= Date.parse(mainC.dataset.cambio)) document.querySelectorAll("[data-tiempo]").forEach((d) => { d.hidden = d.dataset.tiempo === "antes"; });
  // la próxima pieza, por fecha (la tarjeta lleva su hora UTC en <time datetime>)
  const cartas = [...document.querySelectorAll(".t-carta")].map((c) => ({ c, t: Date.parse(c.querySelector("time")?.getAttribute("datetime") || "") })).filter((x) => x.t);
  const prox = cartas.find((x) => x.t > ahora);
  if (prox) {
    const h = prox.c.querySelectorAll(".t-hora"), tit = prox.c.querySelector(".t-tit")?.textContent.trim();
    document.querySelectorAll("[data-proxima]").forEach((s) => {
      s.textContent = "";
      const a = document.createElement("a"); a.href = "#" + prox.c.id;
      a.textContent = `${prox.c.querySelector(".t-dia").textContent}, ${h[0] ? h[0].textContent : ""} (${h[1] ? h[1].textContent : ""})${tit ? " · " + tit : ""}`;
      s.append(a);
    });
    // "solo la próxima tarjeta a la vista" (ruta de calma): sale del pliegue de las demás
    document.querySelectorAll("details.t-pliegue-proxima").forEach((d) => {
      const li = prox.c.closest("li"); if (!li || !d.contains(li)) return;
      const ol = document.createElement("ol"); ol.className = "t-cartas t-cartas-prox"; d.before(ol); ol.append(li);
    });
  }
  // abrir los pliegues que contienen el destino de un ancla (al llegar y al seguir un enlace de la misma página)
  const abrir = (id) => { let el = id && document.getElementById(id); if (!el) return null; for (let p = el; p; p = p.parentElement) if (p.tagName === "DETAILS") p.open = true; return el; };
  const alAncla = () => { const id = decodeURIComponent(location.hash.slice(1)); const el = abrir(id); if (el) el.scrollIntoView({ block: "start" }); };
  // una parte que se ve desde una fecha (the-cella, "a solas" desde el 29-dic), salvo que se llegue a ella
  const hoyET = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  document.querySelectorAll("[data-visible-desde]").forEach((e) => { if (hoyET < e.dataset.visibleDesde && location.hash.slice(1) !== e.id) e.hidden = true; });
  if (location.hash) alAncla();
  addEventListener("hashchange", alAncla);
  // botones: enviar la página (o su texto) y copiar el prompt de arriba; sin JS no aparecen
  const estado = (b, t) => { const s = b.parentElement.querySelector(".t-estado-btn"); if (s) { s.textContent = t; setTimeout(() => { s.textContent = ""; }, 4000); } };
  const copiar = (t) => (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject());
  document.querySelectorAll("button[data-enviar]").forEach((b) => {
    b.hidden = false;
    b.addEventListener("click", () => {
      const url = location.origin + location.pathname, texto = b.dataset.texto || "";
      if (navigator.share) navigator.share({ title: b.dataset.titulo || document.title, text: texto, url }).catch(() => {});
      else copiar(`${texto}\n${url}`).then(() => estado(b, ES ? "Enlace copiado." : "Link copied."), () => estado(b, url));
    });
  });
  document.querySelectorAll("button[data-copiar]").forEach((b) => {
    b.hidden = false;
    b.addEventListener("click", () => {
      let q = b.closest("p").previousElementSibling; while (q && !q.matches("blockquote")) q = q.previousElementSibling;
      if (!q) return;
      copiar(q.innerText.trim()).then(() => estado(b, ES ? "Copiado." : "Copied."), () => estado(b, ES ? "Selecciona el texto y cópialo." : "Select the text and copy it."));
    });
  });

  const src = new URLSearchParams(location.search).get("src");
  if (!src || !/^[\w-]{3,40}$/.test(src)) return;
  // "You came from: <título del Short>" en el umbral, y el bloque donde aterriza ese Short (acta, cambio 19)
  const v = document.querySelector("[data-vienes]");
  let destino = null;
  if (v) {
    let m = {}, at = {}; try { m = JSON.parse(v.dataset.vienes || "{}"); at = JSON.parse(v.dataset.aterriza || "{}"); } catch (e) { /* sin dato */ }
    if (m[src]) {
      v.textContent = ""; const k = document.createElement("span"); k.className = "t-vienes-k"; k.textContent = v.dataset.rotulo + " ";
      const a = document.createElement("a"); a.textContent = m[src]; a.href = "#" + (document.querySelector(`.t-carta[data-codigo="${src}"]`)?.id || "");
      v.append(k, a); v.hidden = false;
    }
    if (at[src]) destino = abrir(at[src]);
  }
  const c = document.querySelector(`.t-carta[data-codigo="${src}"]`);
  if (!c) return;
  c.classList.add("t-vienes"); marca(c, T.vienes);
  if (destino) destino.scrollIntoView({ block: "start" });
  else if (!location.hash) c.scrollIntoView({ block: "start" });
})();
