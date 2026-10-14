/* naos.js · motor compartido de las 3 versiones (sin build). Necesita gsap y ScrollTrigger cargados antes (defer, en orden).
 * Piezas: datos, curva G, cinta (arranque visible y flujo parejo a 90 px/s, pausa), odómetro, línea que se dibuja a velocidad
 * constante con punto que respira y mira por puntero o teclado, barras, revelado por hover/foco/toque, lectura por scroll,
 * respiración 4-4, planos que barren. prefers-reduced-motion: todo queda dibujado y quieto, la cinta queda fija.
 * Odómetro y cinta de aletas: ideas de React Bits Counter y SplitFlapText (MIT + Commons Clause, (c) 2026 David Haz),
 * escritas de cero aquí, solo para uso dentro de este sitio. Patrón de hover sin toque: Motion hover() (MIT). */
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
  const MENOS = "−";
  N.fmt = (n, dec = 0) => Number(n).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace("-", MENOS);
  N.signo = (x, dec = 2, suf = "%") => (x > 0 ? "+" : x < 0 ? MENOS : "") + Math.abs(x).toFixed(dec) + suf;
  N.tri = (x) => (x > 0 ? "▲" : x < 0 ? "▽" : "·");
  N.dir = (x) => (x > 0 ? "up" : x < 0 ? "down" : "flat");
  const MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  N.fecha = (s) => { const d = new Date(s.length === 10 ? s + "T12:00:00Z" : s); return d.getUTCDate() + " " + MES[d.getUTCMonth()]; };
  N.hora = (s) => s.slice(11, 16) + " UTC";
  N.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  N.decs = (a) => (a.unidad === "USD" ? 0 : 2);
  N.valor = (a) => (a.unidad === "USD" ? "$" : "") + N.fmt(a.ultimo, N.decs(a)) + (a.unidad === "%" ? "%" : "");
  N.cambioTxt = (a) => (a.cambio_bp != null ? (a.cambio_bp > 0 ? "+" : a.cambio_bp < 0 ? MENOS : "") + Math.abs(a.cambio_bp) + " bp" : N.signo(a.cambio));
  N.cambioHTML = (a) => `<span class="${N.dir(a.cambio)}">${N.tri(a.cambio)} ${N.cambioTxt(a)}</span>`;

  /* ---------- datos ---------- */
  N.cargar = async (ruta = "../data/situacion.json") => {
    const r = await fetch(ruta); const d = await r.json();
    d.porId = Object.fromEntries(d.activos.map((a) => [a.id, a]));
    d.frescos = d.activos.filter((a) => a.fresco);
    d.genTxt = N.fecha(d.generado) + " " + d.generado.slice(0, 4) + " · " + N.hora(d.generado);
    N.d = d; return d;
  };
  N.mapa = null;
  N.cargarMapa = async (ruta = "../data/mapa.json") => (N.mapa = N.mapa || (await (await fetch(ruta)).json()));

  /* ---------- cinta ---------- */
  N.itemsCinta = (d) => {
    const it = [];
    for (const a of d.frescos) it.push({ s: a.id, v: N.valor(a), c: a });
    const t = d.temas.conteos;
    it.splice(2, 0, { s: "AI", t: t.AI + " stories in today's scan" });
    const top = d.hn.slice().sort((a, b) => b.puntos - a.puntos)[0];
    it.push({ s: "HN", t: top.titulo + " · " + N.fmt(top.puntos) + " pts" });
    it.push({ s: "Hormuz", v: d.muestra.hormuz_transitos.serie.at(-1) + " transits", muestra: true });
    it.push({ s: "Geopolitics", t: t["Geopolítica"] + " stories" });
    it.push({ s: "Scan", t: N.fmt(d.temas.total) + " stories read" });
    return it;
  };
  const celda = (x) => `<span class="cinta-celda"><span class="s">${N.esc(x.s)}</span>` +
    (x.v ? `<span class="v">${N.esc(x.v)}</span>` : "") + (x.c ? N.cambioHTML(x.c) : "") +
    (x.t ? `<span class="t">${N.esc(x.t)}</span>` : "") + (x.muestra ? `<span class="muestra">sample</span>` : "") + `</span>`;
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

  /* ---------- odómetro ---------- */
  N.odo = (el, texto, opt = {}) => {
    const sube = opt.dir !== "down";
    el.classList.add("odo"); el.setAttribute("aria-label", opt.aria || texto); el.setAttribute("role", "text");
    el.innerHTML = [...texto].map((ch) => /\d/.test(ch)
      ? `<span class="odo-d" aria-hidden="true"><span class="odo-c" data-d="${ch}">${Array.from({ length: 20 }, (_, i) => `<span>${i % 10}</span>`).join("")}</span></span>`
      : `<span class="odo-x" aria-hidden="true">${N.esc(ch)}</span>`).join("");
    const cols = [...el.querySelectorAll(".odo-c")];
    const pos = (c, i) => gsap.set(c, { yPercent: -5 * i });
    const fin = (c) => (sube ? 10 + Number(c.dataset.d) : Number(c.dataset.d));
    if (N.rm) { cols.forEach((c) => pos(c, fin(c))); return; }
    cols.forEach((c) => pos(c, sube ? 0 : 19));
    const correr = () => cols.slice().reverse().forEach((c, k) =>
      gsap.to(c, { yPercent: -5 * fin(c), duration: .8 + k * .05, delay: k * .067 + (opt.retraso || 0) }));
    if (opt.ya) correr(); else ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: correr });
  };

  /* ---------- gráfico de línea ---------- */
  N.linea = (cont, serie, opt = {}) => {
    const h = opt.h || 120, dec = opt.dec ?? 2, pre = opt.pre || "", suf = opt.suf || "";
    const etiquetas = opt.etiquetas !== false;
    const dir = opt.dir || N.dir(serie.at(-1)[1] - serie[0][1]);
    cont.classList.add("graf");
    cont.tabIndex = 0;
    cont.setAttribute("role", "img");
    const v = serie.map((p) => p[1]);
    const lo = Math.min(...v), hi = Math.max(...v);
    cont.setAttribute("aria-label", `${opt.titulo || "Series"}: ${serie.length} points from ${N.fecha(serie[0][0])} to ${N.fecha(serie.at(-1)[0])}, low ${pre}${N.fmt(lo, dec)}${suf}, high ${pre}${N.fmt(hi, dec)}${suf}, last ${pre}${N.fmt(v.at(-1), dec)}${suf}. Use left and right arrows to read each point.`);
    let dibujado = N.rm, idx = -1, geo = null;
    const pintar = () => {
      const w = Math.max(120, cont.clientWidth);
      const padR = etiquetas ? 64 : 10, padL = 2, padT = 10, padB = etiquetas ? 20 : 6;
      const rango = hi - lo || 1;
      const X = (i) => padL + (i / (serie.length - 1)) * (w - padL - padR);
      const Y = (y) => padT + (1 - (y - lo) / rango) * (h - padT - padB);
      const pts = serie.map((p, i) => [X(i), Y(p[1])]);
      const d = "M" + pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join("L");
      const [ex, ey] = pts.at(-1);
      const cls = dir === "up" ? "punto-up" : dir === "down" ? "punto-down" : "punto-flat";
      const barras = opt.barras ? serie.map((p, i) => { const bw = Math.max(2, (w - padL - padR) / serie.length - 2); const y = Y(p[1]); return `<rect class="barra" x="${(X(i) - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${(h - padB - y).toFixed(1)}"/>`; }).join("") : "";
      const guardada = cont.querySelector(":scope > .revela-tarjeta");
      cont.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">` +
        `<line class="base" x1="0" x2="${w - padR + 4}" y1="${h - padB + .5}" y2="${h - padB + .5}"/>` +
        (etiquetas ? `<text class="eje" x="0" y="${h - 4}">${N.fecha(serie[0][0])}</text><text class="eje" x="${w - padR}" y="${h - 4}" text-anchor="end">${N.fecha(serie.at(-1)[0])}</text>` +
          `<text class="eje" x="${w - padR + 10}" y="${(Y(hi) + 4).toFixed(1)}">${pre}${N.fmt(hi, dec)}${suf}</text><text class="eje" x="${w - padR + 10}" y="${(Y(lo) + 4).toFixed(1)}">${pre}${N.fmt(lo, dec)}${suf}</text>` : "") +
        `<g class="barras-g">${barras}</g>` +
        (opt.barras ? "" : `<path class="serie" d="${d}"/>`) +
        `<circle class="${cls} fin" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${opt.r || 4}"/>` +
        `<g class="mira-g" style="display:none"><line class="mira" y1="${padT - 4}" y2="${h - padB}"/><circle class="mira-p" r="3"/></g></svg><div class="graf-tip"></div>`;
      if (guardada) cont.appendChild(guardada);
      geo = { pts, padB };
      const path = cont.querySelector(".serie"), dot = cont.querySelector(".fin"), rects = cont.querySelectorAll(".barra");
      if (!dibujado) {
        if (path) { const L = path.getTotalLength(); gsap.set(path, { strokeDasharray: L + 2, strokeDashoffset: L + 2 }); }
        if (rects.length) gsap.set(rects, { scaleY: 0, transformOrigin: "50% 100%" });
        gsap.set(dot, { scale: 0, transformOrigin: "50% 50%" });
      }
      return { path, dot, rects };
    };
    let partes = pintar();
    const dibujar = () => {
      if (dibujado) return; dibujado = true;
      const { path, dot, rects } = partes;
      const tl = gsap.timeline({ delay: opt.retraso || 0 });
      if (path) { const L = path.getTotalLength(); tl.to(path, { strokeDashoffset: 0, duration: Math.max(.5, L / (opt.vel || 700)), ease: "none" }); }
      if (rects.length) tl.to(rects, { scaleY: 1, duration: .5, stagger: .025 });
      tl.to(dot, { scale: 1, duration: .2 }).to(dot, { scale: 1.15, duration: .3, ease: "sine.inOut" }).to(dot, { scale: 1, duration: .3, ease: "sine.inOut" });
    };
    if (!N.rm) ScrollTrigger.create({ trigger: cont, start: opt.start || "top 86%", once: true, onEnter: dibujar });
    let rw = cont.clientWidth;
    new ResizeObserver(() => { if (Math.abs(cont.clientWidth - rw) > 2) { rw = cont.clientWidth; partes = pintar(); } }).observe(cont);
    // mira: puntero, toque y teclado
    const tip = () => cont.querySelector(".graf-tip");
    const mostrar = (i) => {
      if (!geo) return; idx = Math.max(0, Math.min(serie.length - 1, i));
      const [px, py] = geo.pts[idx]; const g = cont.querySelector(".mira-g"); g.style.display = "";
      g.querySelector(".mira").setAttribute("x1", px); g.querySelector(".mira").setAttribute("x2", px);
      g.querySelector(".mira-p").setAttribute("cx", px); g.querySelector(".mira-p").setAttribute("cy", py);
      const t = tip(); t.textContent = `${N.fecha(serie[idx][0])} · ${pre}${N.fmt(serie[idx][1], dec)}${suf}`;
      t.style.left = Math.min(Math.max(px, 50), cont.clientWidth - 50) + "px"; t.style.top = py + "px";
      cont.classList.add("activo");
    };
    const ocultar = () => { cont.classList.remove("activo"); const g = cont.querySelector(".mira-g"); if (g) g.style.display = "none"; };
    cont.addEventListener("pointermove", (e) => { if (!geo) return; const r = cont.getBoundingClientRect(); const x = e.clientX - r.left;
      let best = 0, bd = 1e9; geo.pts.forEach((p, i) => { const dd = Math.abs(p[0] - x); if (dd < bd) { bd = dd; best = i; } }); mostrar(best); });
    cont.addEventListener("pointerleave", ocultar);
    cont.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); mostrar((idx < 0 ? serie.length - 1 : idx) + (e.key === "ArrowLeft" ? -1 : 1)); }
      if (e.key === "Escape") ocultar();
    });
    cont.addEventListener("focus", () => mostrar(serie.length - 1));
    cont.addEventListener("blur", ocultar);
    return { dibujar };
  };

  /* ---------- barras horizontales ---------- */
  N.barras = (cont, filas, opt = {}) => {
    const max = opt.max || Math.max(...filas.map((f) => f.v), 1);
    cont.classList.add("barras");
    cont.innerHTML = filas.map((f) => `<div class="fila"><span>${N.esc(f.l)}</span><span class="riel"><span class="relleno" style="width:${(100 * f.v / max).toFixed(1)}%"></span></span><span class="val num">${N.esc(f.txt ?? f.v)}</span></div>`).join("");
    const rel = cont.querySelectorAll(".relleno");
    if (N.rm) return;
    gsap.set(rel, { scaleX: 0 });
    ScrollTrigger.create({ trigger: cont, start: "top 88%", once: true, onEnter: () => gsap.to(rel, { scaleX: 1, duration: .7, stagger: .08 }) });
  };

  /* ---------- revelado: hover (no toque), foco y toque ---------- */
  N.revelar = (root = document) => {
    let tocado = false;
    const todos = [...root.querySelectorAll("[data-revela]")];
    const cerrar = (el) => { el.classList.remove("abierto"); el.setAttribute("aria-expanded", "false"); };
    const abrir = (el) => {
      todos.forEach((o) => o !== el && cerrar(o));
      const r = el.getBoundingClientRect();
      el.classList.toggle("arriba", r.bottom > innerHeight - 200);
      el.classList.toggle("derecha", r.left > innerWidth - 340);
      el.classList.add("abierto"); el.setAttribute("aria-expanded", "true");
    };
    for (const el of todos) {
      if (!el.matches("a,button,[tabindex]")) el.tabIndex = 0;
      el.setAttribute("aria-expanded", "false");
      const tarjeta = el.querySelector(".revela-tarjeta");
      if (tarjeta) { tarjeta.id = tarjeta.id || "rv" + Math.random().toString(36).slice(2, 8); el.setAttribute("aria-describedby", tarjeta.id); }
      el.addEventListener("pointerdown", (e) => { tocado = e.pointerType === "touch"; });
      el.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") abrir(el); });
      el.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") cerrar(el); });
      el.addEventListener("focusin", () => { if (!tocado) abrir(el); });
      el.addEventListener("focusout", (e) => { if (!el.contains(e.relatedTarget)) cerrar(el); });
      el.addEventListener("click", (e) => { if (tocado && !e.target.closest(".revela-tarjeta a")) { el.classList.contains("abierto") ? cerrar(el) : abrir(el); } tocado = false; });
      el.addEventListener("keydown", (e) => { if (e.key === "Escape") { cerrar(el); } if ((e.key === "Enter" || e.key === " ") && e.target === el) { e.preventDefault(); el.classList.contains("abierto") ? cerrar(el) : abrir(el); } });
    }
    document.addEventListener("pointerdown", (e) => { if (!e.target.closest("[data-revela]")) todos.forEach(cerrar); });
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

  /* ---------- entradas genéricas ---------- */
  N.entradas = (sel = "[data-entra]") => {
    if (N.rm) return;
    ScrollTrigger.batch(sel, { start: "top 90%", once: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: .07, overwrite: true }) });
    gsap.set(sel, { opacity: 0 });
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

  /* ---------- mapa SVG ---------- */
  N.svgMapa = (m, opt = {}) => {
    const rutas = m.rutas.filter((r) => r.id !== "lane").map((r) => `<path class="m-ruta" data-id="${r.id}" d="${r.d}"><title>${N.esc(r.label)}</title></path>`).join("");
    const carril = m.rutas.find((r) => r.id === "lane");
    return `<svg class="m-svg" viewBox="0 0 ${m.w} ${m.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">` +
      `<path class="m-tierra" d="${m.land}"/><path class="m-borde" d="${m.borders}"/>` +
      `<g class="m-rutas">${rutas}</g><path class="m-carril" d="${carril.d}"/></svg>`;
  };

  // listo: espera las fuentes (tope 0,4 s) para que nada salte al cambiar de tipo, y muestra lo que esperaba datos ([data-espera])
  N.listo = async () => {
    try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 400))]); } catch (e) {}
    document.documentElement.classList.add("listo"); window.__listo = true; if (window.ScrollTrigger) ScrollTrigger.refresh();
  };
  N.error = (e) => { console.error(e); document.documentElement.classList.add("listo"); window.__listo = true; };
})();
