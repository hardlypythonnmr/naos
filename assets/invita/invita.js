// invita.js · la invitación viva (I34, D-317). El nombre de quien invita llega en el fragmento (#nombre=Ana), que el navegador
// nunca manda en la petición. Se limpia (sin controles ni marcas de dirección, espacios juntos, 30 caracteres) y entra con
// textContent: lo que alguien escriba, aunque sea <script>, se ve como texto. No se guarda en ningún lado y no toca
// document.title (el contador lee el título). Sin nombre queda el texto por defecto ("Someone" / "Alguien").
(function () {
  var M = document.getElementById("main");
  if (!M) return;
  var $ = function (id) { return document.getElementById(id); };
  var MAX = 30;

  function limpiar(s) {
    s = String(s == null ? "" : s);
    try { s = s.normalize("NFC"); } catch (e) {}
    s = s.replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁩﻿]/g, "").replace(/\s+/g, " ").trim();
    return Array.from(s).slice(0, MAX).join("").trim();
  }
  function delFragmento() {
    try { return limpiar(new URLSearchParams(location.hash.replace(/^#/, "")).get("nombre")); } catch (e) { return ""; }
  }
  function fragmento(n) { return n ? "#nombre=" + encodeURIComponent(n) : ""; }

  var otro = $("otro-idioma"), otroBase = otro ? otro.getAttribute("href") : "";
  function poner(n) {
    $("nombre").textContent = n || M.getAttribute("data-alguien");
    $("responder").hidden = !n;
    if (otro) otro.setAttribute("href", otroBase + fragmento(n));
  }
  poner(delFragmento());
  addEventListener("hashchange", function () { poner(delFragmento()); });

  // video: en bucle y sin sonido; con movimiento reducido se queda en el póster hasta que la persona lo pida
  var v = document.querySelector(".i-escena video"), b = $("pausa");
  if (v && b) {
    var quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var marcar = function () { var p = v.paused; b.textContent = M.getAttribute(p ? "data-play" : "data-pausa"); b.setAttribute("aria-pressed", String(p)); };
    v.addEventListener("play", marcar); v.addEventListener("pause", marcar);
    b.addEventListener("click", function () { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
    b.hidden = false;
    if (!quieto) { var p = v.play(); if (p && p.catch) p.catch(marcar); }
    marcar();
  }

  // te toca invitar: arma el enlace con ?src=invita (lo cuenta el contador) y el nombre en el fragmento (no lo cuenta nadie)
  var f = $("forma"), n = $("n"), err = $("n-error"), listo = $("listo"), enlace = $("enlace"), wa = $("wa"), estado = $("estado");
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var nombre = limpiar(n.value);
    if (!nombre) { err.hidden = false; n.setAttribute("aria-invalid", "true"); n.focus(); return; }
    err.hidden = true; n.removeAttribute("aria-invalid"); n.value = nombre;
    var url = location.origin + location.pathname + "?src=invita" + fragmento(nombre);
    enlace.value = url;
    wa.href = "https://wa.me/?text=" + encodeURIComponent(M.getAttribute("data-compartir") + " " + url);
    // la vista previa de la pieza con tu nombre; replaceState solo cambia el fragmento, así el contador no ve otra visita
    try { history.replaceState(null, "", location.pathname + location.search + fragmento(nombre)); } catch (x) {}
    poner(nombre);
    $("responder").hidden = true; // quien invita está viendo su vista previa: responder es para quien recibe
    listo.hidden = false;
    estado.textContent = "";
    setTimeout(function () { estado.textContent = M.getAttribute("data-listo"); }, 50); // vaciar y volver a escribir: el lector de pantalla lo anuncia cada vez
  });

  $("copiar").addEventListener("click", function () {
    var ok = function () { estado.textContent = M.getAttribute("data-copiado"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(enlace.value).then(ok, function () { enlace.select(); try { if (document.execCommand("copy")) ok(); } catch (e) {} });
    else { enlace.select(); try { if (document.execCommand("copy")) ok(); } catch (e) {} }
  });
})();
