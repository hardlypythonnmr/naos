/* puertas.js · las dos puertas de la portada: Humanity (la biblioteca) y The Present (la ventana). N, sesión 5:
 * "a huge division like doors one to each side ... and then you click and you enter that door and it opens that universe".
 * Estado en <html data-u>: "puertas" | "present" | "humanity" (el <head> lo adivina antes de pintar; aquí se corrige).
 * - Tocar una puerta: su color cubre la pantalla desde su mitad (800 ms, --ease-enter), se entra al universo y el color se retira
 *   hacia arriba revelándolo (700 ms). El foco va al título del universo. Con movimiento reducido: corte directo, mismo foco.
 * - Todo enlace #id lleva a su universo (las anclas, el salto "Skip to the headlines", pieza.html#assets, el atrás del navegador).
 *   "Back to the doors" (#doors) vuelve y el foco regresa a la puerta por la que se entró. Nada atrapa el foco: no es un diálogo.
 * - Las puertas dejan ver algo de adentro: Cella respira en Humanity y se vuelve hacia el titular vivo de The Present al pasar sobre
 *   esa puerta (o al enfocarla); el titular sale de data/situacion.json (el mismo archivo que ya carga la página). */
(function () {
  "use strict";
  const html = document.documentElement, D = document.getElementById("doors");
  if (!D) return;
  const U = { present: document.getElementById("the-present"), humanity: document.getElementById("humanity") };
  const q = new URLSearchParams(location.search);
  const rm = () => matchMedia("(prefers-reduced-motion: reduce)").matches || q.has("quieto");
  const RAIZ = { "#the-present": "present", "#humanity": "humanity" };
  let ultimaPuerta = null, ocupado = false;

  // a qué estado lleva un hash: null si no es nuestro (se deja pasar)
  const universoDe = (hash) => {
    if (!hash || hash === "#" || hash === "#doors") return "puertas";
    if (RAIZ[hash]) return RAIZ[hash];
    if (/^#sala\//.test(hash)) return "present";
    let t = null; try { t = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) {}
    if (!t) return null;
    if (D.contains(t)) return "puertas";
    const u = t.closest(".universo");
    return u === U.humanity ? "humanity" : u === U.present ? "present" : null;
  };
  const N = () => window.NAOS || {};
  const refrescar = () => {
    try { const L = N().lenis; if (L && L.resize) L.resize(); } catch (e) {}
    requestAnimationFrame(() => { try { if (window.ScrollTrigger) ScrollTrigger.refresh(); } catch (e) {} });
  };
  const poner = (u) => {
    html.setAttribute("data-u", u);
    for (const k in U) U[k].inert = u !== k;
    D.inert = u !== "puertas";
    refrescar();
    document.dispatchEvent(new CustomEvent("naos:universo", { detail: u }));
  };
  const arriba = () => { try { const L = N().lenis; if (L) L.scrollTo(0, { immediate: true, force: true }); } catch (e) {} scrollTo({ top: 0, left: 0, behavior: "instant" }); };
  const ir = (t) => { try { const L = N().lenis; if (L) { L.scrollTo(t, { immediate: true, force: true }); return; } } catch (e) {} t.scrollIntoView({ block: "start", behavior: "instant" }); };
  const enfocar = (el) => {
    if (!el) return;
    if (!el.matches("a, button, input, select, textarea, [tabindex]")) { el.setAttribute("tabindex", "-1"); el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true }); }
    el.focus({ preventScroll: true });
  };
  const titulo = (u) => U[u] && U[u].querySelector(".placa-t");
  const marcar = (u, hash, reemplazar) => {
    const url = location.pathname + location.search + (hash === "#doors" && !location.hash ? "" : hash);
    if (location.hash === hash && history.state && history.state.u === u) return;
    history[reemplazar ? "replaceState" : "pushState"]({ u }, "", url);
  };

  // entrar a un universo; o: { puerta (el panel desde el que se abre), destino (elemento al que saltar), hash }
  function entrar(u, o) {
    o = o || {};
    if (ocupado) return;
    const fin = () => {
      poner(u); arriba();
      if (o.destino) { ir(o.destino); enfocar(o.destino.matches("section, article, div") ? (o.destino.querySelector("h2, h3") || o.destino) : o.destino); }
      else enfocar(titulo(u));
      if (o.hash) marcar(u, o.hash);
    };
    if (o.puerta) ultimaPuerta = o.puerta.querySelector(".puerta-a");
    if (!o.puerta || rm() || !Element.prototype.animate) { fin(); return; }
    ocupado = true;
    // la capa: el color de la puerta, con una copia quieta de la puerta encima, que se recorta desde su mitad hasta toda la pantalla
    const r = o.puerta.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    const desde = `inset(${Math.max(0, r.top)}px ${Math.max(0, W - r.right)}px ${Math.max(0, H - r.bottom)}px ${Math.max(0, r.left)}px)`;
    const capa = document.createElement("div");
    capa.className = "inunda inunda-" + u; capa.setAttribute("aria-hidden", "true"); capa.inert = true;
    const copia = o.puerta.cloneNode(true);
    copia.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
    Object.assign(copia.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
    capa.appendChild(copia); capa.style.clipPath = desde;
    document.body.appendChild(capa);
    D.classList.add("abriendo");
    const curva = "cubic-bezier(.2, 0, 0, 1)";
    copia.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.035)" }], { duration: 650, easing: curva, fill: "forwards" });
    capa.animate([{ clipPath: desde }, { clipPath: "inset(0px 0px 0px 0px)" }], { duration: 800, easing: curva, fill: "forwards" }).finished.then(() => {
      copia.remove(); fin();
      return capa.animate([{ clipPath: "inset(0px 0px 0px 0px)" }, { clipPath: "inset(0px 0px 100% 0px)" }], { duration: 700, delay: 120, easing: curva, fill: "forwards" }).finished;
    }).catch(() => fin()).then(() => { capa.remove(); D.classList.remove("abriendo"); ocupado = false; });
  }
  function volver(hash) {
    poner("puertas"); arriba();
    enfocar(ultimaPuerta || D.querySelector(".puerta-a"));
    if (hash) marcar("puertas", "#doors");
  }

  // todo enlace interno pasa por aquí antes que Lenis o el salto del navegador
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    const hash = a.getAttribute("href"), u = universoDe(hash);
    if (!u) return;
    const ahora = html.getAttribute("data-u");
    if (u === "puertas") { e.preventDefault(); e.stopPropagation(); volver(true); return; }
    if (u === ahora && !RAIZ[hash]) return;               // misma sala: el ancla sigue su camino de siempre
    e.preventDefault(); e.stopPropagation();
    if (u === ahora) { arriba(); enfocar(titulo(u)); marcar(u, hash); return; }
    const destino = RAIZ[hash] ? null : document.getElementById(decodeURIComponent(hash.slice(1)));
    entrar(u, { puerta: a.closest("#doors .puerta"), destino, hash });
  }, true);

  // atrás y adelante del navegador, y anclas escritas a mano
  const sincronizar = (e) => {
    const st = e && e.state && e.state.u;
    const u = st || universoDe(location.hash) || "puertas";
    if (u === html.getAttribute("data-u")) return;
    if (u === "puertas") { volver(false); return; }
    poner(u);
    const t = !RAIZ[location.hash] && location.hash && universoDe(location.hash) ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (t) ir(t); else arriba();
  };
  addEventListener("popstate", sincronizar);
  addEventListener("hashchange", () => sincronizar(null));

  // estado al cargar: el hash manda; ?sala= abre The Present
  const u0 = q.has("sala") ? "present" : (universoDe(location.hash) || "puertas");
  poner(u0);
  if (!history.state) history.replaceState({ u: u0 }, "", location.href);
  // un ancla directa (#mercados, pieza.html -> #assets): la sección crece cuando llegan los datos, así que se vuelve a saltar ya lista
  if (u0 !== "puertas" && location.hash && !RAIZ[location.hash] && !/^#sala\//.test(location.hash)) {
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const espera = (n) => { if (html.classList.contains("listo") || n > 80) setTimeout(() => { if (t) ir(t); }, 250); else setTimeout(() => espera(n + 1), 100); };
    if (t) espera(0);
  }

  /* ---------- lo que se filtra de cada universo ---------- */
  const cel = window.NAOS_CELLA ? window.NAOS_CELLA(document.getElementById("cella-puerta"), { estado: "humanity", hacia: 1 }) : null;
  // Cella en la placa de Humanity: solo respira, con los ojos cerrados
  if (window.NAOS_CELLA && document.getElementById("cella-hum")) window.NAOS_CELLA(document.getElementById("cella-hum"), { estado: "humanity", hacia: -1 });
  const pres = D.querySelector(".puerta-pres");
  let dato = "n";
  const mira = () => cel && cel.presente(dato, 1);
  const suelta = () => cel && !pres.matches(":hover") && !pres.contains(document.activeElement) && cel.humanidad();
  if (cel) {
    pres.addEventListener("pointerenter", mira); pres.addEventListener("pointerleave", suelta);
    pres.addEventListener("focusin", mira); pres.addEventListener("focusout", () => setTimeout(suelta, 0));
  }
  const MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  fetch("data/situacion.json").then((r) => r.json()).then((d) => {
    const lead = (d.portada || []).find((p) => !p.viejo && p.tipo === "historia" && p.titulo);
    if (!lead) return;
    const sala = (d.salas || []).find((s) => s.url === lead.url);
    const act = (d.activos || []).filter((a) => !a.viejo && a.fresco && a.cambio != null);
    const a = sala && (sala.activos || []).map((id) => act.find((x) => x.id === id)).find(Boolean);
    dato = a ? (a.cambio > 0 ? "u" : a.cambio < 0 ? "d" : "n") : "n";
    const h = lead.hora && lead.hora.length >= 16 ? new Date(lead.hora) : null;
    const cuando = h ? `${h.getUTCDate()} ${MES[h.getUTCMonth()]}, ${lead.hora.slice(11, 16)} UTC` : "";
    document.getElementById("puerta-tit").innerHTML = `<p class="puerta-m">${esc(lead.fuente)}${cuando ? ", " + cuando : ""}</p><p class="puerta-h" lang="en">${esc(lead.titulo)}</p>`;
    // una vez, sin que nadie toque nada: Cella se vuelve hacia el titular y regresa (el estado de The Present asomado en la puerta)
    if (cel && html.getAttribute("data-u") === "puertas" && !rm()) setTimeout(() => { mira(); setTimeout(suelta, 5200); }, 1800);
  }).catch(() => {});
})();
