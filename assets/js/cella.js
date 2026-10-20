/* cella.js · Cella viva en la página (marca v5, reemplaza a Tikr). Necesita assets/js/figura.js antes (NAOS_FIGURA); figura.js no se edita.
 * Respira igual que siempre: inhala 4 s, exhala 4 s (--t-breath-phase), 8 s por ciclo. Los ojos van por su cuenta (D-270, punto 3):
 * tres expresiones de forma, sin inclinación, sin tinta y sin color de dato (el estado "reacciona" de The Present sigue archivado, D-263).
 *   1. Mira: ojos redondos abiertos, 1,5 s después de que Cella entra en pantalla; parpadeo de 140 ms cada 5 a 9 s.
 *      Por qué: N, "son la ventana del alma, ella es la ventana de si misma".
 *   2. Ojos de luna: con el puntero o el foco en la casilla de la luna, y 3 s al cargar en noche de luna llena o nueva, el hueco de cada ojo toma
 *      la forma de la luna de hoy en 400 ms: un círculo del color del cuerpo, superpuesto, recorta el hueco (sigue en dos tonos).
 *      Por qué: la luna es el calendario (D-268) y Cella la refleja.
 *   3. Cierra: con Breathe en pantalla o con foco, con la pausa y con movimiento reducido, los ojos son los dos arcos de cella.svg, la marca quieta.
 *      Por qué: respirar es hacia adentro.
 * Ningún cambio de ojos cae a menos de 0,4 s de un cambio de fase de la respiración (múltiplos de una fase desde que Cella nace): cada cambio
 * se programa en una ventana libre. Con movimiento reducido (o ?quieto) no hay parpadeo ni cambios solos: los ojos de luna, si el lector los pide,
 * entran como un corte. Con ?registro, window.__ojos lleva el tiempo (s, en el reloj de la respiración) de cada cambio.
 * NAOS_CELLA(el, o) -> { pintar, luna(on, {por}), cierra(clave, on), fase() }
 *   o: { hacia: 1 | -1, noche: bool, pausa: bool, ojos: bool (con expresiones; si no, siempre cerrados), luna: () => ({ k, cre }) }
 * Solo pinta mientras está en pantalla y la pestaña se ve (IntersectionObserver), a unos 30 cuadros por segundo.
 * Pausa (WCAG 2.2.2, D-252): cada Cella que se mueve lleva al lado un botón "Pause Cella" (aria-pressed); todos comparten un solo
 * estado, así que pausar una las detiene todas, con los ojos cerrados. Con movimiento reducido no hay botón: nada se mueve. */
(function () {
  "use strict";
  const F = window.NAOS_FIGURA; if (!F) return;
  const L = window.NAOS_LUNA;
  const rm = () => (window.NAOS && window.NAOS.rmReal) || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fase = () => { try { const v = getComputedStyle(document.documentElement).getPropertyValue("--t-breath-phase").trim(); return v ? parseFloat(v) / 1000 || 4 : 4; } catch (e) { return 4; } };
  const respira = (t, T) => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / T);
  const registrar = new URLSearchParams(location.search).has("registro");
  if (registrar) window.__ojos = [];
  const MARGEN = 0.4;   // s: distancia mínima entre un cambio de ojos y un cambio de fase
  const T_LUNA = 0.4, T_PARPADEO = 0.14, ABRE = 1.5;
  let uid = 0;
  // pausa compartida por todas las Cellas de la página
  const P = { on: false, botones: [], vivas: [] };
  const quieta = () => rm() || P.on;
  const alternar = () => {
    P.on = !P.on;
    P.botones.forEach((b) => b.setAttribute("aria-pressed", String(P.on)));
    P.vivas.forEach((v) => { v.pintar(); v.seguir(); });
  };
  const boton = (el) => {
    if (rm()) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "ag-chip cella-pausa"; b.textContent = "Pause Cella"; b.setAttribute("aria-pressed", String(P.on));
    b.addEventListener("click", (e) => { e.stopPropagation(); alternar(); });
    el.insertAdjacentElement("afterend", b);
    P.botones.push(b);
  };

  window.NAOS_CELLA = function (el, o) {
    o = o || {};
    const id = "cv" + (++uid), T = fase(), t00 = performance.now(), hacia = o.hacia || 1;
    const ahora = () => (performance.now() - t00) / 1000;
    let visible = true, raf = 0, ultimo = 0;
    el.classList.add("cella-v");

    // ---------- los ojos ----------
    // S.abierto: Mira; S.parp: dentro de un parpadeo; S.cerrar: Cierra (hay un motivo en "cierres"); S.l0, S.lto, S.lt0: los ojos de luna (de dónde,
    // a dónde, desde cuándo, en 400 ms). Cada cambio se programa en la cola, en una ventana libre de cambios de fase.
    const S = { abierto: false, parp: false, cerrar: false, l0: 0, lto: 0, lt0: -1e9 };
    const cierres = new Set();
    const cola = [];   // { t, fn, tipo }
    const regla = (t, dur) => {   // el primer instante >= t cuyo cambio (de dur s) queda a MARGEN o más de un cambio de fase
      let x = t;
      for (let i = 0; i < 4; i++) {
        const m = x % T, ini = MARGEN, fin = T - MARGEN - dur;
        if (m >= ini && m <= fin) return x;
        x = m < ini ? x - m + ini : x - m + T + ini;
      }
      return x;
    };
    const poner = (t, tipo, fn) => { cola.push({ t, fn, tipo }); cola.sort((a, b) => a.t - b.t); return t; };
    const programar = (tmin, dur, tipo, fn) => poner(regla(Math.max(tmin, ahora()), dur), tipo, fn);
    const anotar = (tipo) => { if (registrar) window.__ojos.push({ t: +ahora().toFixed(3), tipo, fase: +(ahora() % T).toFixed(3) }); };
    const quitar = (tipo) => { for (let i = cola.length - 1; i >= 0; i--) if (cola[i].tipo === tipo) cola.splice(i, 1); };
    const correr = () => { const t = ahora(); while (cola.length && cola[0].t <= t) { const e = cola.shift(); anotar(e.fn() || e.tipo); } };
    const lunaV = (t) => S.l0 + (S.lto - S.l0) * Math.min(1, Math.max(0, (t - S.lt0) / T_LUNA));

    // Mira: abre 1,5 s después de entrar en pantalla; parpadea cada 5 a 9 s, con el cierre de 140 ms en una ventana libre
    const parpadeo = (desde) => { const t = regla(Math.max(desde, ahora()) + 5 + Math.random() * 4, T_PARPADEO + 0.05);
      poner(t, "parpadeo", () => {
        if (!S.abierto || S.cerrar) { parpadeo(ahora()); return "parpadeo-omitido"; }
        S.parp = true;
        poner(t + T_PARPADEO, "parpadeo-fin", () => { S.parp = false; parpadeo(ahora()); });
        return "parpadeo";
      }); };
    let miraIniciada = false;
    const mira = () => {
      if (!o.ojos || miraIniciada || rm()) return; miraIniciada = true;
      programar(ahora() + ABRE, 0, "abre", () => { S.abierto = true; });
      parpadeo(ahora() + ABRE);
    };

    // Ojos de luna: la forma de la luna de hoy (o.luna() -> { k, cre }) en 400 ms; entra y sale
    function luna(on, op) {
      if (!o.ojos || !o.luna) return;
      op = op || {};
      quitar("luna"); quitar("luna-sale");
      if (quieta()) { S.l0 = S.lto = on ? 1 : 0; S.lt0 = -1e9; pintar(); return; }   // sin movimiento: un corte, y solo si el lector lo pide
      const cambia = (v) => () => { S.l0 = lunaV(ahora()); S.lto = v; S.lt0 = ahora(); return v ? "luna-entra" : "luna-sale"; };
      const t = programar(ahora(), T_LUNA, "luna", cambia(on ? 1 : 0));
      if (on && op.por) programar(t + op.por, T_LUNA, "luna-sale", cambia(0));
    }
    // Cierra: una clave por motivo (la casilla de Breathe, la sección Breathe); mientras haya una, los ojos son los dos arcos
    function cierra(clave, on) {
      if (on) cierres.add(clave); else cierres.delete(clave);
      if (quieta()) { S.cerrar = cierres.size > 0; return; }
      quitar("cierra");
      programar(ahora(), 0, "cierra", () => { const c = cierres.size > 0; if (c === S.cerrar) return "sin-cambio"; S.cerrar = c; return c ? "cierra" : "abre-de-nuevo"; });
    }

    // ---------- dibujo ----------
    function dibujar(opt, abiertos, lv) {
      const p = F.pal(!!o.noche);
      F.cella(el, Object.assign({ estado: "humanity", dato: null, hacia, p, id, abiertos }, opt));
      if (!abiertos || !(lv > 0) || !o.luna) return;
      const LU = o.luna(); if (!LU) return;
      // dos tonos: el hueco redondo de cada ojo, recortado por un círculo del color del cuerpo (la parte iluminada va a la derecha al crecer)
      const g = F.cellaGeo({ estado: "humanity", b: opt.b, r: 0, k: 0, abiertos: true, p, t: opt.t }), r = g.rad;
      const d = (2 + (L.separacion(LU.k) - 2) * lv) * r, sig = (LU.cre ? -1 : 1) * hacia;
      const grupo = el.querySelector("svg > g"); if (!grupo) return;
      grupo.insertAdjacentHTML("beforeend", g.ojos.map((q) => `<circle class="oj-luna" cx="${(q[0] + sig * d).toFixed(2)}" cy="${q[1].toFixed(2)}" r="${r.toFixed(2)}" fill="${p.tx}"/>`).join(""));
    }
    function pintar() {
      const t = ahora();
      if (quieta()) {   // la marca quieta de cella.svg: ojos cerrados, sin respiración; con los ojos de luna solo si el lector los pidió (corte)
        dibujar({ b: 0, r: 0, k: 0 }, !P.on && !S.cerrar && S.lto === 1, 1);
        return;
      }
      correr();
      const lv = S.cerrar ? 0 : lunaV(t);
      dibujar({ t, b: respira(t, 2 * T) }, !S.cerrar && ((S.abierto && !S.parp) || lv > 0), lv);
    }
    function bucle(ms) {
      raf = 0;
      if (!visible || document.hidden || quieta()) return;
      if (ms - ultimo > 32) { ultimo = ms; pintar(); }
      raf = requestAnimationFrame(bucle);
    }
    const seguir = () => { if (!raf && visible && !document.hidden && !quieta()) raf = requestAnimationFrame(bucle); };
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) { mira(); pintar(); seguir(); } }).observe(el);
    else mira();
    document.addEventListener("visibilitychange", seguir);
    pintar(); seguir();
    P.vivas.push({ pintar, seguir });
    if (o.pausa !== false) boton(el);

    // para el rótulo "Inhale 1 ... Exhale 4" de la sección Breathe: en qué fase y qué cuenta va la respiración de esta Cella
    const fasePos = () => { const s = ahora() % (2 * T); return { entra: s < T, cuenta: Math.floor((s % T) / (T / 4)) + 1 }; };
    return { pintar, luna, cierra, fase: fasePos, pausada: () => P.on };
  };
})();
