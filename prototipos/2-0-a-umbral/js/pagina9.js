/* pagina9.js · P9 "Cómo NAOS te empuja" (generada de data/empujones.json), el mapa de pantallas, el panel del prototipo y la hoja del modo de campo. */
(function (raiz) {
  "use strict";
  var N = raiz.NAOS_APP, h = N.h, t = N.t, LANG = N.LANG, st = N.estado, go = N.go, P = N.pantallas, E = raiz.NAOS_EMPUJONES;

  // ---------- P9 ----------
  P.p9 = function () {
    var filtro = "todos", lista = h("div", { class: "tarjetas" }), cuenta = h("p", { class: "chica", aria: { live: "polite" } });
    var botones = h("div", { class: "filtros", role: "group", aria: { label: t("p9_filtro") } });
    function fila(e) {
      var dias = N.diasEntre(e.cambio, st.hoy), nuevo = dias >= 0 && dias < 30;
      var dd = function (k, v) { return v ? [h("dt", {}, t(k)), h("dd", {}, v)] : []; };
      var donde = e.donde.map(function (d) { return t("p9_dondeVal")[d]; }).join(" · ");
      return h("article", { class: "fila-e", id: "fila-" + e.id },
        h("span", { class: "num" }, "#" + e.id),
        h("h3", {}, e.mecanismo[LANG]),
        h("span", { class: "estado " + e.estado }, h("i", { "aria-hidden": "true" }), t("p9_estados")[e.estado]),
        e.nota ? h("p", { class: "chica", style: "margin:0" }, e.nota[LANG]) : null,
        h("dl", {}, dd("p9_ve", e.ve[LANG]), dd("p9_hace", e.tipo[LANG]), dd("p9_por", e.publico[LANG]), dd("p9_evid", e.evid.join(", ")), dd("p9_donde", donde), dd("p9_apagar", e.apagar[LANG]),
          h("dt", {}, t("p9_cambio")), h("dd", {}, e.cambio, nuevo ? h("span", { class: "cambio-etq" }, t("p9_cambioEtq")) : null)));
    }
    function pintar() {
      lista.textContent = ""; var n = 0;
      E.forEach(function (e) { if (filtro === "todos" || e.estado === filtro) { n++; lista.appendChild(fila(e)); } });
      cuenta.textContent = t("p9_filas", { n: n });
      Array.prototype.forEach.call(botones.children, function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-f") === filtro ? "true" : "false"); });
    }
    [["todos", t("p9_todos")]].concat(Object.keys(t("p9_estadosCorto")).map(function (k) { return [k, t("p9_estadosCorto")[k]]; })).forEach(function (f) {
      var b = h("button", { class: "chip", type: "button", "data-f": f[0], aria: { pressed: f[0] === "todos" ? "true" : "false" } }, f[1], N.check());
      b.addEventListener("click", function () { filtro = f[0]; pintar(); });
      botones.appendChild(b);
    });
    var fallos = h("ul", { class: "sin" }, t("p9_fallos").map(function (x) { return h("li", {}, x); }));
    var tabla = h("table", { class: "puertas" }, h("thead", {}, h("tr", {}, h("th", { scope: "col" }, ""), h("th", { scope: "col" }, t("p9_viva")), h("th", { scope: "col" }, t("p9_debil")))),
      h("tbody", {}, t("p9_puertas").map(function (r) { return h("tr", {}, h("th", { scope: "row" }, r[0]), h("td", {}, r[1]), h("td", {}, r[2])); })));
    var no = h("ul", { class: "sin" }, t("p9_no").map(function (x) { return h("li", {}, x); }));
    var contenido = h("ul", { class: "sin" }, E.filter(function (e) { return e.contenido; }).map(function (e) {
      return h("li", {}, h("button", { class: "enlace izq", type: "button", style: "display:inline-flex;min-height:48px", on: { click: function () {
        filtro = "todos"; pintar(); var el = document.getElementById("fila-" + e.id); if (el) { el.scrollIntoView({ block: "center" }); el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); } } } }, "#" + e.id + " " + e.mecanismo[LANG]));
    }));
    pintar();
    var nodo = h("section", { class: "pantalla ancho" },
      h("div", { class: "puerta" }, h("i", { "aria-hidden": "true" }), "NAOS"),
      h("h1", {}, t("p9_titulo")), h("p", { style: "max-width:640px" }, t("p9_intro")),
      h("p", { style: "max-width:640px" }, t("p9_h7")), h("p", { style: "max-width:640px" }, t("p9_edad")),
      h("p", { class: "chica" }, t("p9_fecha")),
      h("h2", { class: "pie-tit" }, t("p9_filtro")), botones, cuenta, lista,
      h("h2", { class: "pie-tit" }, t("p9_fallosTit")), fallos, h("p", { class: "chica" }, t("p9_fallosPie")),
      h("h2", { class: "pie-tit" }, t("p9_vivaTit")), h("div", { style: "overflow-x:auto" }, tabla), h("p", { class: "chica", style: "margin-top:8px" }, t("p9_vivaPie")),
      h("h2", { class: "pie-tit" }, t("p9_noTit")), no,
      h("h2", { class: "pie-tit" }, t("p9_sleepTit")), h("p", { style: "max-width:640px" }, t("p9_sleep")),
      h("h2", { class: "pie-tit" }, t("p9_contTit")), contenido, h("p", { class: "chica" }, t("p9_contPie")),
      h("div", { class: "acciones", style: "max-width:430px" }, h("a", { class: "btn sec", href: "#hoy" }, t("salir"))));
    return { nodo: nodo, titulo: t("p9_titulo") };
  };

  // ---------- mapa ----------
  function listaMapa() {
    return h("ul", { class: "mapa-lista" }, t("mapa_items").map(function (it) {
      return h("li", {}, h("a", { href: "#" + it[0] }, h("b", {}, it[1]), h("span", {}, it[2]), h("span", { class: "etq" }, t("mapa_estado")[it[3]])));
    }));
  }
  function atajos() {
    var es = LANG === "es";
    var d = [[t("mapa_atajo5"), "?q=7#s=" + encodeURIComponent("lámpara")],
      [t("mapa_atajo8a"), "?texto=" + encodeURIComponent(es ? "quiero morir" : "want to die") + "#p1a"],
      [t("mapa_atajo8b"), "?texto=" + encodeURIComponent(es ? "saltarme las comidas" : "skip meals") + "#p1a"]];
    return h("ul", { class: "mapa-lista" }, d.map(function (x) { return h("li", {}, h("a", { href: x[1] }, h("span", {}, x[0]))); }));
  }
  P.mapa = function () {
    return { nodo: h("section", { class: "pantalla" }, h("div", { class: "puerta" }, h("i", { "aria-hidden": "true" }), "NAOS"), h("h1", {}, t("mapa")), listaMapa(), h("h2", { class: "pie-tit" }, t("mapa_atajos")), atajos()), titulo: t("mapa") };
  };

  // ---------- panel del prototipo (la cinta lo abre) ----------
  function otraPagina() {
    var sp = new URLSearchParams(location.search), otro = LANG === "es" ? "en" : "es";
    sp.set("lang", otro);
    return (LANG === "es" ? "../index.html" : "es/index.html") + "?" + sp.toString() + location.hash;
  }
  N.abrirPanel = function () {
    var panel = document.getElementById("panel"), btn = document.getElementById("cinta-btn");
    panel.textContent = "";
    var fecha = h("input", { type: "date", id: "sim-hoy", value: st.hoy, aria: { describedby: "sim-ayuda" } });
    fecha.addEventListener("change", function () {
      if (N.esIso(fecha.value)) { st.hoy = fecha.value; var sp = new URLSearchParams(location.search); sp.set("hoy", fecha.value); history.replaceState(null, "", location.pathname + "?" + sp.toString() + location.hash); N.render(); }
    });
    var tema = function (v) { document.documentElement.setAttribute("data-tema", v); };
    var quiet = document.documentElement.classList.contains("quieto");
    var cont = h("div", { class: "in" },
      h("h2", {}, t("panel")),
      h("h3", {}, t("mapa")), listaMapa(), atajos(),
      h("h3", {}, t("idioma")), h("div", { class: "fila" }, h("a", { class: "btn sec", href: otraPagina(), style: "width:auto" }, LANG === "es" ? "English" : "Español")),
      h("h3", {}, t("tema")), h("div", { class: "fila" },
        h("button", { class: "btn sec", type: "button", style: "width:auto", on: { click: function () { tema("light"); } } }, t("claro")),
        h("button", { class: "btn sec", type: "button", style: "width:auto", on: { click: function () { tema("dark"); } } }, t("oscuro"))),
      h("h3", {}, t("simHoy")), h("label", { class: "sr", for: "sim-hoy" }, t("simHoy")), fecha, h("p", { class: "chica", id: "sim-ayuda" }, t("simHoyAyuda")),
      h("button", { class: "btn sec", type: "button", on: { click: function () { var sp = new URLSearchParams(location.search); sp.delete("hoy"); history.replaceState(null, "", location.pathname + (sp.toString() ? "?" + sp.toString() : "") + location.hash); st.hoy = N.hoyAparato(); N.render(); } } }, t("simLimpiar")),
      h("h3", {}, t("quieto")),
      h("button", { class: "btn sec", type: "button", aria: { pressed: quiet ? "true" : "false" }, on: { click: function (e) { var on = document.documentElement.classList.toggle("quieto"); e.currentTarget.setAttribute("aria-pressed", on ? "true" : "false"); } } }, t("quieto")),
      h("p", { class: "chica" }, t("quietoAyuda")),
      h("h3", {}, t("tuCuarto")),
      h("button", { class: "btn sec", type: "button", on: { click: function () { N.ejemploCuarto(); N.cerrarPanel(); go("p6"); N.render(); } } }, t("cargarEjemplo")),
      h("button", { class: "btn sec", type: "button", on: { click: function () { N.almacen.borrar(); N.reiniciar(); N.cerrarPanel(); go("p1a"); } } }, t("borrarTodo")),
      h("h3", {}, t("campoOn")),
      h("button", { class: "btn sec", type: "button", aria: { pressed: N.campo.activo ? "true" : "false" }, on: { click: function (e) { N.alternarCampo(); e.currentTarget.setAttribute("aria-pressed", N.campo.activo ? "true" : "false"); } } }, N.campo.activo ? t("campoOff") : t("campoOn")),
      h("button", { class: "btn", type: "button", on: { click: function () { N.cerrarPanel(); } } }, t("panelCerrar")));
    panel.appendChild(cont); panel.hidden = false; btn.setAttribute("aria-expanded", "true");
    panel.querySelector("h2").setAttribute("tabindex", "-1"); panel.querySelector("h2").focus();
  };
  N.cerrarPanel = function (silencioso) {
    var panel = document.getElementById("panel"), btn = document.getElementById("cinta-btn");
    panel.hidden = true; btn.setAttribute("aria-expanded", "false"); if (!silencioso) btn.focus();
  };
  N.alternarCampo = function () {
    N.campo.activo = !N.campo.activo;
    var b = document.getElementById("campo-badge");
    if (N.campo.activo && !b) document.body.appendChild(h("div", { class: "campo-badge", id: "campo-badge" }, t("c_etq")));
    if (!N.campo.activo && b) b.remove();
  };

  // ---------- hoja del modo de campo (U199): tiempos en memoria, 4 preguntas + 2 de la luz que queda, texto para el issue. No envía nada. ----------
  N.hojaCampo = function () {
    var resp = {}, notas = {};
    function pregunta(clave, texto) {
      var nombre = "c-" + clave, radios = h("div", { class: "radios" }), nota = h("textarea", { "aria-label": t("c_nota") + ": " + texto, rows: "2", placeholder: t("c_nota") });
      [["si", t("c_si")], ["medias", t("c_aMedias")], ["no", t("c_no")]].forEach(function (o) {
        radios.appendChild(h("label", {}, h("input", { type: "radio", name: nombre, value: o[0], on: { change: function () { resp[clave] = o[1]; } } }), o[1]));
      });
      nota.addEventListener("input", function () { notas[clave] = nota.value; });
      return h("fieldset", {}, h("legend", {}, texto), radios, nota);
    }
    var total = {};
    N.campo.tiempos.forEach(function (x) { total[x.id] = (total[x.id] || 0) + x.ms; });
    var filas = Object.keys(total).map(function (k) { return h("li", {}, k + ": " + (total[k] / 1000).toFixed(1) + " s"); });
    var salida = h("textarea", { rows: "10", readonly: true, "aria-label": t("c_textoTit") }), msg = h("p", { class: "chica", aria: { live: "polite" } });
    var resP5 = N.campo.respuestas.length ? h("ul", { class: "sin" }, N.campo.respuestas.map(function (r) { return h("li", {}, "P5 · q=" + r.q + " · " + r.respuesta + (r.razon ? " · " + r.razon : "") + (r.palabra ? " · " + r.palabra : "")); })) : h("p", { class: "chica" }, t("c_ninguna"));
    function armar() {
      var L = ["NAOS 2.0 · Umbral · " + t("c_titulo") + " (prototipo)", "hoy=" + st.hoy + " · lang=" + LANG + " · " + innerWidth + "x" + innerHeight, "", t("c_tiempos") + ":"];
      Object.keys(total).forEach(function (k) { L.push("- " + k + ": " + (total[k] / 1000).toFixed(1) + " s"); });
      L.push("");
      t("c_preguntas").concat(t("c_luz")).forEach(function (q, i) { var k = "q" + i; L.push((i + 1) + ". " + q + " -> " + (resp[k] || "-") + (notas[k] ? " (" + notas[k] + ")" : "")); });
      L.push("", t("c_respuestas") + ":");
      if (N.campo.respuestas.length) N.campo.respuestas.forEach(function (r) { L.push("- q=" + r.q + " " + r.respuesta + (r.razon ? " / " + r.razon : "")); }); else L.push("- " + t("c_ninguna"));
      salida.value = L.join("\n");
    }
    var cuerpo = h("section", { class: "hoja-campo", "aria-label": t("c_titulo") }, h("h2", { class: "pie-tit", style: "margin:0" }, t("c_titulo")), h("p", { class: "chica" }, t("c_intro")),
      h("h3", { style: "margin:0;font-size:16px" }, t("c_tiempos")), filas.length ? h("ul", { class: "sin" }, filas) : h("p", { class: "chica" }, t("c_ninguna")),
      t("c_preguntas").map(function (q, i) { return pregunta("q" + i, q); }),
      t("c_luz").map(function (q, i) { return pregunta("q" + (4 + i), q); }),
      h("h3", { style: "margin:0;font-size:16px" }, t("c_respuestas")), resP5,
      h("button", { class: "btn", type: "button", on: { click: armar } }, t("c_generar")),
      h("label", { class: "chica", for: "c-salida" }, t("c_textoTit")), salida,
      h("button", { class: "btn sec", type: "button", on: { click: function () { N.S.copiar(salida.value).then(function (ok) { msg.textContent = ok ? t("copiado") : ""; }); } } }, t("c_copiar")), msg);
    salida.id = "c-salida";
    return cuerpo;
  };
})(window);
