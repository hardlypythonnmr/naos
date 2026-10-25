/* inicio.js · arranque: idioma, tema, ?quieto, la cinta del prototipo, el teclado abierto y el enrutador. */
(function (raiz) {
  "use strict";
  var N = raiz.NAOS_APP, p = N.params, LANG = N.LANG, root = document.documentElement;

  // ?lang=es|en cambia de página; sin ?lang, un navegador en español que llega a la página en inglés pasa a la de español
  var pedido = p.get("lang"), deseada = pedido === "es" || pedido === "en" ? pedido : (!pedido && LANG === "en" && /^es\b/i.test(navigator.language || "") ? "es" : null);
  if (deseada && deseada !== LANG) {
    var sp = new URLSearchParams(location.search); sp.set("lang", deseada);
    location.replace((LANG === "en" ? "es/index.html" : "../index.html") + "?" + sp.toString() + location.hash);
    return;
  }
  if (p.has("quieto")) root.classList.add("quieto");
  if (/^(oscuro|dark)$/.test(p.get("tema") || "")) root.setAttribute("data-tema", "dark");

  var btn = document.getElementById("cinta-btn");
  btn.setAttribute("aria-label", N.t("panelAbrir") + ". " + btn.textContent);
  btn.addEventListener("click", function () { var panel = document.getElementById("panel"); if (panel.hidden) N.abrirPanel(); else N.cerrarPanel(); });
  document.addEventListener("keydown", function (e) { var panel = document.getElementById("panel"); if (e.key === "Escape" && !panel.hidden) N.cerrarPanel(); });

  // teclado abierto: se ocultan el pie y "Ver cómo" (visualViewport)
  function teclado() {
    var a = document.activeElement, campo = a && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.type !== "checkbox" && a.type !== "radio";
    document.body.classList.toggle("teclado", !!(campo && window.visualViewport && visualViewport.height < innerHeight * 0.75));
  }
  if (window.visualViewport) { visualViewport.addEventListener("resize", teclado); document.addEventListener("focusout", function () { setTimeout(teclado, 60); }); }

  if (N.campo.activo) { N.campo.activo = false; N.alternarCampo(); }
  window.addEventListener("hashchange", N.render);
  N.render();
})(window);
