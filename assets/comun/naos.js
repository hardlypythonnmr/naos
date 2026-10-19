/* naos.js · motor compartido de la página (sin build). Necesita gsap y ScrollTrigger cargados antes (defer, en orden).
 * Piezas: curva G, cinta (arranque visible y flujo parejo, pausa), lectura por scroll, respiración 4-4, planos que barren,
 * scroll suave, estado de una pieza y guardado local. prefers-reduced-motion: todo queda dibujado y quieto, la cinta queda fija.
 * Lo de The Present (datos de mercados, odómetro, línea, barras, revelado, mapa) salió con D-263; está en la historia de git.
 * Cinta de aletas: idea de React Bits SplitFlapText (MIT + Commons Clause, (c) 2026 David Haz), escrita de cero aquí. */
(function () {
  "use strict";
  const N = (window.NAOS = {});
  const q = new URLSearchParams(location.search);
  N.captura = q.has("captura");
  const mqRM = matchMedia("(prefers-reduced-motion: reduce)");
  // ?final: todo en su estado final (para la captura de página completa); la cinta sigue corriendo. ?quieto: como reduced-motion
  N.final = q.has("final");
  N.rmReal = mqRM.matches || q.has("quieto");
  N.rm = N.rmReal || N.final;
  N.fino = matchMedia("(pointer: fine)").matches;

  /* ---------- curva G: cubic-bezier(.2,0,0,1) por Newton ---------- */
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= (X(t) - x) / d; } return Y(Math.min(1, Math.max(0, t))); };
  }
  N.curva = bezier(.2, 0, 0, 1);
  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: N.curva, duration: .6 });
    if (N.rm) gsap.globalTimeline.timeScale(1);
  }

  /* ---------- formato ---------- */
  const MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  N.fecha = (s) => { const d = new Date(s.length === 10 ? s + "T12:00:00Z" : s); return d.getUTCDate() + " " + MES[d.getUTCMonth()]; };
  N.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- cinta ---------- */
  const celda = (x) => `<span class="cinta-celda"><span class="s">${N.esc(x.s)}</span>` +
    (x.v ? `<span class="v">${N.esc(x.v)}</span>` : "") + (x.t ? `<span class="t">${N.esc(x.t)}</span>` : "") + `</span>`;
  const ICO_PAUSA = '<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="1" width="3.5" height="12" fill="currentColor"/><rect x="8.5" y="1" width="3.5" height="12" fill="currentColor"/></svg>';
  const ICO_PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1 L12 7 L3 13 Z" fill="currentColor"/></svg>';
  N.cinta = (el, items, opt = {}) => {
    const VEL = opt.vel || 90; // px/s
    el.classList.add("cinta");
    el.setAttribute("role", "region"); el.setAttribute("aria-label", opt.aria || "NAOS Tape, latest fresh readings");
    // opt.rotulo: la sección que la cinta titula (queda fija a la izquierda mientras la cinta corre)
    el.innerHTML = (opt.rotulo ? `<span class="cinta-rotulo">${N.esc(opt.rotulo)}</span>` : "") + `<div class="cinta-ventana"><div class="cinta-pista">${items.map(celda).join("")}</div></div>` +
      `<button class="cinta-pausa" type="button" aria-pressed="false" aria-label="Pause the tape">${ICO_PAUSA}</button>`;
    const ven = el.querySelector(".cinta-ventana"), pista = el.querySelector(".cinta-pista"), btn = el.querySelector(".cinta-pausa");
    const unidad = pista.innerHTML;
    if (N.rmReal) { el.classList.add("quieta"); btn.hidden = true; return; }
    let ancho = 0, x = 0, v = 0, objetivo = 0, pausada = false, visible = true, arranco = false;
    const medir = () => {
      pista.innerHTML = unidad; ancho = pista.scrollWidth;
      let n = 1; while (pista.scrollWidth < ven.clientWidth + ancho * 1.05 && n < 12) { pista.insertAdjacentHTML("beforeend", unidad); n++; }
      if (n === 1) pista.insertAdjacentHTML("beforeend", unidad);
    };
    medir();
    // arranque visible: las fichas a la vista dan una vuelta desde vacías, una por una; luego la cinta acelera y fluye pareja
    const celdas = [...pista.children].filter((c) => c.offsetLeft < ven.clientWidth);
    const tl = gsap.timeline({ delay: opt.retraso ?? .35 });
    tl.from(celdas, { rotateX: -90, opacity: 0, duration: .133 * 2, stagger: .067 * 1.5, ease: "none" });
    tl.add(() => { arranco = true; objetivo = VEL; }, "+=.6");
    let tAcel = 1.4;
    gsap.ticker.add((t, dt) => {
      if (!arranco || !visible) return;
      const meta = pausada ? 0 : objetivo;
      const paso = (VEL / tAcel) * (dt / 1000);
      v = v < meta ? Math.min(meta, v + paso) : Math.max(meta, v - paso * 3);
      x -= v * dt / 1000;
      if (-x >= ancho) x += ancho;
      pista.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    });
    btn.addEventListener("click", () => {
      pausada = !pausada; tAcel = .6;
      btn.setAttribute("aria-pressed", String(pausada));
      btn.setAttribute("aria-label", pausada ? "Play the tape" : "Pause the tape");
      btn.innerHTML = pausada ? ICO_PLAY : ICO_PAUSA;
    });
    if ("IntersectionObserver" in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(el);
    let rw = ven.clientWidth;
    addEventListener("resize", () => { if (Math.abs(ven.clientWidth - rw) > 40) { rw = ven.clientWidth; medir(); x = 0; } });
  };

  /* ---------- lectura por scroll ---------- */
  N.leer = (el, opt = {}) => {
    const palabras = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = palabras.map((w) => `<span class="w" aria-hidden="true">${N.esc(w)}</span>`).join(" ");
    if (N.rm) return;
    gsap.fromTo(el.querySelectorAll(".w"), { opacity: opt.desde ?? .14 }, { opacity: 1, ease: "none", stagger: .05,
      scrollTrigger: { trigger: el, start: opt.start || "top 82%", end: opt.end || "bottom 48%", scrub: true } });
  };

  /* ---------- respiración 4-4 ---------- */
  N.respira = (el, opt = {}) => {
    const F = opt.fase || 4, R = opt.r || 100, rmin = opt.min || .42;
    el.classList.add("respira");
    el.innerHTML = `<svg viewBox="-${R + 4} -${R + 4} ${2 * R + 8} ${2 * R + 8}" aria-hidden="true">` +
      (opt.guia !== false ? `<circle r="${R}" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-width="1"/>` : "") +
      `<circle class="bola" r="${R}" fill="${opt.relleno || "currentColor"}"/></svg>`;
    const lbl = opt.etiqueta; const bola = el.querySelector(".bola");
    if (N.rm) { gsap.set(bola, { scale: .72, transformOrigin: "50% 50%" }); if (lbl) lbl.textContent = `Inhale ${F}, exhale ${F}`; return; }
    gsap.set(bola, { scale: rmin, transformOrigin: "50% 50%" });
    const txt = (fase, s) => { if (lbl) lbl.textContent = `${fase} ${s}`; };
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.to(bola, { scale: 1, duration: F, ease: N.curva, onStart: () => txt("Inhale", 1) });
    tl.to(bola, { scale: rmin, duration: F, ease: N.curva, onStart: () => txt("Exhale", 1) });
    for (let s = 2; s <= F; s++) { tl.call(() => txt("Inhale", s), null, s - 1); tl.call(() => txt("Exhale", s), null, F + s - 1); }
    if (opt.alCiclo) tl.eventCallback("onRepeat", opt.alCiclo);
    ScrollTrigger.create({ trigger: el, start: "top 90%", end: "bottom 10%", onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
    if (lbl) txt("Inhale", 1);
    return tl;
  };

  /* ---------- planos que barren (un color y luego otro escenario) ---------- */
  N.planos = (root = document) => {
    root.querySelectorAll("[data-plano]").forEach((sec) => {
      const f = sec.querySelector(":scope > .plano-fondo"), c = sec.querySelector(":scope > .plano-contenido");
      if (N.rm || !f) return;
      const desde = sec.dataset.plano === "derecha" ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
      gsap.fromTo(f, { clipPath: desde }, { clipPath: "inset(0 0% 0 0%)", ease: "none", scrollTrigger: { trigger: sec, start: "top 96%", end: "top 38%", scrub: true } });
      if (c) gsap.fromTo(c, { opacity: 0 }, { opacity: 1, ease: "none", scrollTrigger: { trigger: sec, start: "top 62%", end: "top 36%", scrub: true } });
    });
  };

  /* ---------- scroll suave solo en escritorio ---------- */
  N.suave = (raiz = "../vendor/lenis/lenis.min.js") => {
    if (N.rm || !N.fino || N.captura || innerWidth < 900) return;
    const s = document.createElement("script"); s.src = raiz; s.onload = () => {
      const lenis = new Lenis({ anchors: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
      N.lenis = lenis;
    }; document.head.appendChild(s);
  };

  /* ---------- estado de una pieza (ola 0, D-234): data/semana.json + data/enlaces.json ----------
   * N.estado(asset_id) -> Promise<{ estado, texto, url, ig, dia }>. Una sola lectura por página (se guarda la promesa).
   *   estado "published": hay un ítem status "published" con yt en enlaces.json   -> texto "Published", url = yt, ig = reel o null
   *   estado "scheduled": un ítem con dia de hoy en adelante                        -> texto "Comes out 19 Oct", url null
   *   estado "tbd": nada fechado, o la fecha ya pasó sin publicarse                 -> texto "Date to be confirmed", url null
   * Sin yt no hay enlace: un "published" sin enlace cae a la fecha. Si un archivo no carga, "Date to be confirmed", nunca un error en pantalla.
   * La clave en enlaces.json.piezas es "AAAA-MM-DD|slot", o "AAAA-MM-DD|asset_id" si el ítem no tiene slot. N.estadoDe es la parte pura. */
  N.estadoDe = (items, enlaces, id, hoy = new Date().toISOString().slice(0, 10)) => {
    const xs = (items || []).filter((x) => x.asset_id === id), piezas = (enlaces && enlaces.piezas) || {};
    for (const x of xs) {
      const e = x.status === "published" && x.dia ? piezas[x.dia + "|" + (x.slot || x.asset_id)] : null;
      if (e && e.yt) return { estado: "published", texto: "Published", url: e.yt, ig: e.ig || null, dia: x.dia };
    }
    const prox = xs.filter((x) => x.dia && x.dia >= hoy && x.status !== "published").sort((a, b) => a.dia.localeCompare(b.dia))[0];
    if (prox) return { estado: "scheduled", texto: "Comes out " + N.fecha(prox.dia), url: null, ig: null, dia: prox.dia };
    return { estado: "tbd", texto: "Date to be confirmed", url: null, ig: null, dia: null };
  };
  let _estado = null;
  N.estado = async (id, ruta = {}) => {
    _estado = _estado || Promise.all([
      fetch(ruta.semana || "data/semana.json").then((r) => r.json()).catch(() => null),
      fetch(ruta.enlaces || "data/enlaces.json").then((r) => r.json()).catch(() => null),
    ]);
    const [semana, enlaces] = await _estado;
    return N.estadoDe(semana && semana.items, enlaces, id);
  };

  /* ---------- guardado local (ola 0, D-234): localStorage con try/catch, claves con prefijo "naos:" ----------
   * N.guarda(clave)          -> lo guardado (JSON) o null si no hay nada o el navegador no deja (modo privado, bloqueado)
   * N.guarda(clave, valor)   -> guarda (JSON) y devuelve true; false si falla
   * N.guarda(clave, null)    -> borra
   * Si falla, la página se comporta como en la primera visita; nunca hay error en pantalla. Cada clave nueva va a privacidad.html (#navegador-lista). */
  N.guarda = (clave, valor) => {
    try {
      const k = "naos:" + clave;
      if (valor === undefined) { const t = localStorage.getItem(k); return t == null ? null : JSON.parse(t); }
      if (valor === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(valor));
      return true;
    } catch (e) { return valor === undefined ? null : false; }
  };

  // listo: espera las fuentes (tope 0,4 s) para que nada salte al cambiar de tipo, y muestra lo que esperaba datos ([data-espera])
  N.listo = async () => {
    try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 400))]); } catch (e) {}
    document.documentElement.classList.add("listo"); window.__listo = true; if (window.ScrollTrigger) ScrollTrigger.refresh();
  };
  N.error = (e) => { console.error(e); document.documentElement.classList.add("listo"); window.__listo = true; };
})();
