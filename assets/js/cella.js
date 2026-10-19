/* cella.js · Cella viva en la página (marca v5, reemplaza a Tikr). Necesita assets/js/figura.js antes (NAOS_FIGURA).
 * Un estado, Humanity: respira con los ojos cerrados, inhala 4 s, exhala 4 s (--t-breath-phase). El estado "present" (abría los ojos y
 * se teñía con el titular) salió con D-263; figura.js lo conserva porque es copia de n-system.
 * NAOS_CELLA(el, o) -> { pintar }   o: { hacia: 1 | -1, noche: bool, pausa: bool }
 * Movimiento reducido (o ?quieto): nada se mueve; se dibuja ya en su forma final.
 * Solo pinta mientras está en pantalla y la pestaña se ve (IntersectionObserver), a unos 30 cuadros por segundo.
 * Pausa (WCAG 2.2.2, D-252): cada Cella que se mueve lleva al lado un botón "Pause Cella" (aria-pressed); todos comparten un solo
 * estado, así que pausar una las detiene todas, quietas en su forma final. Con movimiento reducido no hay botón: nada se mueve. */
(function () {
  "use strict";
  const F = window.NAOS_FIGURA; if (!F) return;
  const rm = () => (window.NAOS && window.NAOS.rmReal) || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fase = () => { try { const v = getComputedStyle(document.documentElement).getPropertyValue("--t-breath-phase").trim(); return v ? parseFloat(v) / 1000 || 4 : 4; } catch (e) { return 4; } };
  const respira = (t, T) => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / T);
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

    function pintar() {
      const t = ahora(), p = F.pal(!!o.noche);
      if (quieta()) { F.cella(el, { estado: "humanity", dato: null, hacia, p, id, b: 0.3, r: 0, k: 0, abiertos: false }); return; }
      // la respiración: honda y lenta, un ciclo cada dos fases
      F.cella(el, { estado: "humanity", t, p, id, b: respira(t, 2 * T), hacia });
    }
    function bucle(ms) {
      raf = 0;
      if (!visible || document.hidden || quieta()) return;
      if (ms - ultimo > 32) { ultimo = ms; pintar(); }
      raf = requestAnimationFrame(bucle);
    }
    const seguir = () => { if (!raf && visible && !document.hidden && !quieta()) raf = requestAnimationFrame(bucle); };
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) { pintar(); seguir(); } }).observe(el);
    document.addEventListener("visibilitychange", seguir);
    pintar(); seguir();
    P.vivas.push({ pintar, seguir });
    if (o.pausa !== false) boton(el);

    return { pintar };
  };
})();
