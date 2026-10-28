/* herramienta.js · el botón "Breathe with Cella" del bloque de herramienta (portada 20-oct con lo de la V3, 28-oct-2026).
 * Una guía de 10 s en tres tiempos (V3: "In. Deeper. Out."): entra, otra más hondo, sale larga. Es solo texto en una región aria-live;
 * la Cella de la sección sigue respirando 4 y 4 y su cuenta calla mientras la guía corre. Movimiento reducido: los mismos tres textos, sin desplazamiento. */
(function () {
  "use strict";
  const es = document.documentElement.lang === "es";
  const T = es
    ? { pasos: ["Entra lento, por la nariz.", "Más hondo: otra más, fuerte.", "Sale larga, por la boca."], fin: "¿Se aflojó algo?", otra: "Otra vez", cuida: "Si te mareas, respira normal." }
    : { pasos: ["In, slow, through the nose.", "Deeper: one more in, strong.", "Out, long, through the mouth."], fin: "Did something loosen?", otra: "Once more", cuida: "If you feel light-headed, breathe normally." };
  const go = document.querySelector(".herr-go"), paso = document.querySelector(".herr-paso"), cola = document.querySelector(".herr-cola");
  if (!go || !paso) return;
  const sec = go.closest("section") || document.body;
  const quieto = () => matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]quieto\b/.test(location.search);
  const dur = go.querySelector("span");
  let tm = [];
  go.addEventListener("click", () => {
    tm.forEach(clearTimeout); tm = [];
    go.disabled = true; sec.classList.add("guiando"); if (cola) cola.textContent = "";
    const r = document.querySelector("#resp, .resp-c"); if (r) r.scrollIntoView({ behavior: quieto() ? "auto" : "smooth", block: "nearest" });
    paso.textContent = T.pasos[0];
    tm.push(setTimeout(() => { paso.textContent = T.pasos[1]; }, 2500));
    tm.push(setTimeout(() => { paso.textContent = T.pasos[2]; }, 5000));
    tm.push(setTimeout(() => {
      paso.textContent = T.fin; if (cola) cola.textContent = T.cuida;
      go.firstChild.textContent = T.otra + " "; if (dur) dur.hidden = true;
      go.disabled = false; sec.classList.remove("guiando");
    }, 10000));
  });
})();
