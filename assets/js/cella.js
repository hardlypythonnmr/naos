/* cella.js · Cella viva en la página (marca v5, reemplaza a Tikr). Necesita assets/js/figura.js antes (NAOS_FIGURA).
 * Dos estados (N: "One, two states"):
 *   humanity  respira con los ojos cerrados: inhala 4 s, exhala 4 s (--t-breath-phase)
 *   present   al llegar el titular abre los ojos, se vuelve 5 grados hacia él y todo el cuerpo se tiñe del color del dato,
 *             como tinta en el agua: esmeralda si sube, borgoña si baja, cobalto si es noticia sin cifra (figura.js, LEEME §B)
 * NAOS_CELLA(el, o) -> { presente(dato, hacia), humanidad(), estado }
 *   o: { estado: "humanity" | "present", dato: "u" | "d" | "n" | null, hacia: 1 | -1, noche: bool, t0: s (retraso de la reacción) }
 * Movimiento reducido (o ?quieto): nada se mueve; cada estado se dibuja ya en su forma final (ojos abiertos y tinta llena en present).
 * Solo pinta mientras está en pantalla y la pestaña se ve (IntersectionObserver), a unos 30 cuadros por segundo. */
(function () {
  "use strict";
  const F = window.NAOS_FIGURA; if (!F) return;
  const rm = () => (window.NAOS && window.NAOS.rmReal) || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fase = () => { try { const v = getComputedStyle(document.documentElement).getPropertyValue("--t-breath-phase").trim(); return v ? parseFloat(v) / 1000 || 4 : 4; } catch (e) { return 4; } };
  const respira = (t, T) => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / T);
  const mezcla = (a, b, x) => a + (b - a) * Math.max(0, Math.min(1, x));
  let uid = 0;

  window.NAOS_CELLA = function (el, o) {
    o = o || {};
    const id = "cv" + (++uid), T = fase(), t00 = performance.now();
    // st: estado vigente; t0 llega la noticia; t1 se va (la tinta se retira y vuelve a respirar con los ojos cerrados)
    const st = { estado: o.estado || "humanity", dato: o.dato || null, hacia: o.hacia || 1, t0: null, t1: null };
    const ahora = () => (performance.now() - t00) / 1000;
    if (st.estado === "present") st.t0 = ahora() + (o.t0 != null ? o.t0 : 0.8);
    let visible = true, raf = 0, ultimo = 0;
    el.classList.add("cella-v");

    function pintar() {
      const t = ahora(), p = F.pal(!!o.noche);
      if (rm()) {
        const pres = st.estado === "present" && st.t1 == null;
        F.cella(el, { estado: pres ? "present" : "humanity", dato: st.dato, hacia: st.hacia, p, id, b: 0.3, r: pres ? 1 : 0, k: pres && st.dato ? 1 : 0, abiertos: pres });
        return;
      }
      // la respiración: honda y lenta en Humanity; desde t0, más corta y rápida (60 %, un ciclo por fase), con un cruce de 0,6 s
      const bh = respira(t, 2 * T), bp = 0.6 * respira(t, T);
      let x = 0;
      if (st.t0 != null) x = mezcla(0, 1, (t - st.t0) / 0.6) * (st.t1 != null ? 1 - mezcla(0, 1, (t - st.t1) / 0.6) : 1);
      const b = mezcla(bh, bp, x);
      if (st.t0 == null) { F.cella(el, { estado: "humanity", t, p, id, b, hacia: st.hacia }); return; }
      F.cella(el, { estado: "present", t, t0: st.t0, t1: st.t1 == null ? undefined : st.t1, dato: st.dato, hacia: st.hacia, p, id, b, fase: T });
      // retirada terminada: vuelve a Humanity
      if (st.t1 != null && t > st.t1 + 1.2) { st.t0 = null; st.t1 = null; st.estado = "humanity"; }
    }
    function bucle(ms) {
      raf = 0;
      if (!visible || document.hidden || rm()) return;
      if (ms - ultimo > 32) { ultimo = ms; pintar(); }
      raf = requestAnimationFrame(bucle);
    }
    const seguir = () => { if (!raf && visible && !document.hidden && !rm()) raf = requestAnimationFrame(bucle); };
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) { pintar(); seguir(); } }).observe(el);
    document.addEventListener("visibilitychange", seguir);
    pintar(); seguir();

    return {
      get estado() { return st.estado; },
      // se vuelve hacia un titular: dato "u" | "d" | "n" | null (null: se vuelve sin teñirse)
      presente(dato, hacia, retraso) {
        const t = ahora();
        if (st.estado === "present" && st.t1 == null && st.dato === (dato || null)) return;
        st.estado = "present"; st.dato = dato || null; if (hacia) st.hacia = hacia;
        st.t0 = t + (retraso || 0); st.t1 = null; pintar(); seguir();
      },
      // se va el titular: la tinta se retira hacia los ojos y vuelve a respirar
      humanidad() {
        if (st.estado !== "present" || st.t1 != null) return;
        const t = ahora();
        if (st.t0 == null || t < st.t0) { st.estado = "humanity"; st.t0 = null; pintar(); return; }
        st.t1 = Math.max(t, st.t0 + 0.6); pintar(); seguir();
        if (rm()) { st.t0 = null; st.t1 = null; st.estado = "humanity"; pintar(); }
      },
      pintar,
    };
  };
})();
