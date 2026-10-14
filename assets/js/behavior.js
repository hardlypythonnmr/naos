/* Behavior · botón Pause del anillo de respiración (WCAG 2.2.2, nivel A). Sin dependencias.
 * Usa el tl que expone v1plus.js en N.tlRespira. Con movimiento reducido el anillo no corre: el botón no se muestra. */
(function () {
  const N = window.NAOS, slot = document.getElementById("pausa");
  if (!N || !slot) return;
  function montar() {
    const tl = N.tlRespira;
    if (N.rm || !tl || slot.firstChild) return;
    let manual = false;
    // el ScrollTrigger de N.respira llama tl.play() al entrar en pantalla: lo pausado a mano no se reanuda solo
    const play = tl.play.bind(tl);
    tl.play = function () { return manual ? tl : play.apply(tl, arguments); };
    const b = document.createElement("button");
    b.type = "button"; b.className = "ag-chip grande"; b.setAttribute("aria-pressed", "false"); b.textContent = "Pause";
    b.addEventListener("click", () => {
      manual = !manual;
      b.setAttribute("aria-pressed", String(manual));
      if (manual) tl.pause(); else play();
    });
    slot.appendChild(b); slot.hidden = false;
  }
  if (N.tlRespira) montar(); else document.addEventListener("naos:respira", montar, { once: true });
})();
