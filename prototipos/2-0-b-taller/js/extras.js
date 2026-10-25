/* extras.js · P5 Regreso y P6 Quitar apoyos (solo ?fase=1), Ajustes, la página pública "Cómo te acompañamos", el mapa y el panel del equipo (?dev=1). */
(function () {
  "use strict";
  var N = window.TALLER, h = N.h, t = N.t, L = N.L, st = N.st, S = N.S, R = N.R, U = N.pantallasUtil, chip = U.chip, btn = U.btn;
  var C = window.TALLER_COMO;

  /* ---------- P5 · Regreso ---------- */
  var STOP = ("the a an and or of to in on at is are was it i my me you your we for with that this be as by from but not so if when then " +
    "el la los las un una unos unas y o de del a al en es son fue lo mi me tu te yo que con por para se su sus mas pero si cuando entonces como no").split(" ");
  function palabras(x) { return (x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean); }
  N.cuboRecuerdo = function (guardado, escrito) {
    var todas = palabras(escrito); if (todas.length < 4) return null;                 // con menos de cuatro palabras no se calcula
    var g = palabras(guardado).filter(function (w) { return STOP.indexOf(w) < 0; }), e = todas.filter(function (w) { return STOP.indexOf(w) < 0; });
    if (!g.length) return null;
    var prop = g.filter(function (w) { return e.indexOf(w) >= 0; }).length / g.length;
    return prop >= 0.6 ? "alta" : prop >= 0.3 ? "media" : "baja";                    // umbrales de referencia, a calibrar con las frases reales del cajón
  };
  function diasCubo(n) { return n >= 90 ? 90 : n >= 30 ? 30 : n >= 7 ? 7 : 2; }
  N.ruta("repaso", function () {
    var g = st();
    if (!N.FASE) {
      var n0 = N.pantalla("p5", [h("h1", { class: "frase" }, t("p5_fase")), h("a", { class: "btn grande", href: "?fase=1#repaso" }, "?fase=1")]); n0.dataset.titulo = "Return"; return n0;
    }
    var pr = N.porRepasar(), id = pr ? pr.id : (g.actual && S(g.actual).cuando ? g.actual : null);
    if (!id) {
      var n1 = N.pantalla("p5", [h("h1", { class: "frase" }, t("p5_nada_aun")), btn(t("juegala"), function () { N.ir("hoy"); }, "grande")]); n1.dataset.titulo = "Return"; return n1;
    }
    var r = R(id), s = S(id); N.tema(r); N.ctx.regla = id;
    var dias = pr ? pr.dias : 2, fr = U.partes(r);
    var ocultoCuando = !!s.cuando, guardado = ocultoCuando ? s.cuando : fr.gesto;
    var hueco = ocultoCuando ? L(r.hueco) : fr.cuando + ", ____.";
    var completa = (s.cuando || fr.cuando) + ", " + fr.gesto;
    N.ev("abre", { puerta: id, src: "app", regreso: N.regreso(), vista: "regla" });
    var campo = h("input", { type: "text", class: "campo", id: "recuerda", maxlength: "160", autocomplete: "off", enterkeyhint: "done", "aria-label": t("p5_campo") });
    var vista = h("div", { class: "repaso" }), escrito = "", intento = null;
    var nodo = N.pantalla("p5", [h("h1", { class: "sr" }, N.opaca("o1") ? t("p5_titulo_o1") : t("p5_titulo")), vista]);
    nodo.dataset.titulo = "Return";
    var tit = h("p", { class: "rotulo" }, N.opaca("o1") ? t("p5_titulo_o1") : t("p5_titulo"));
    var tarjeta = h("div", { class: "tarjeta" }, h("p", { class: "frase-chica" }, hueco));
    function ok() { escrito = campo.value.trim(); if (escrito) { intento = "texto"; vistaB(); } }
    campo.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); ok(); } });
    function vistaA() {
      N.pon(vista, tit, tarjeta,
        h("label", { class: "etiqueta", for: "recuerda" }, t("p5_campo")), campo,
        h("button", { type: "button", class: "btn sec", onclick: function () { ok(); if (!escrito) campo.focus(); } }, t("p5_ok")),
        h("button", { type: "button", class: "btn sec", onclick: function () { intento = "voz"; vistaB(t("p5_voz_nota")); } }, t("p5_voz")),
        h("button", { type: "button", class: "btn sec", onclick: function () { intento = "nada"; vistaB(); } }, t("p5_nada")),
        h("button", { type: "button", class: "enlace grande-t", onclick: function () { N.ir("r/" + id); } }, t("saltar")));
    }
    function vistaB(nota) {
      var pista = h("p", { class: "pista", role: "status" });
      N.pon(vista, tit, tarjeta, nota ? h("p", { class: "nota" }, nota) : null, pista,
        h("button", { type: "button", class: "enlace grande-t", onclick: function () { pista.textContent = palabras(guardado)[0] ? guardado.split(/\s+/)[0] + " …" : ""; } }, t("p5_pista")),
        btn(t("p5_muestrame"), vistaC, "grande"));
    }
    function vistaC() {
      var cubo = null;
      if (intento === "nada") cubo = "nomeacuerdo"; else if (intento === "texto") cubo = N.cuboRecuerdo(guardado, escrito);
      if (cubo) { g.recuerdos.push({ d: N.hoy(), regla: id, cubo: cubo, dias: diasCubo(dias) }); N.guardar(); N.ev("recuerda", { cubo: cubo, dias: diasCubo(dias) }); }   // el texto no se guarda
      var gris = g.recuerdos.filter(function (x) { return x.cubo === "alta"; }).length >= 3;
      N.pon(vista, h("p", { class: "rotulo" }, t("p5_tu_regla")), h("p", { class: "frase" }, completa),
        btn(t("juegala"), function () { N.ir("r/" + id); }, "grande"), btn(t("cerrar_hoy"), function () { N.ir("cierre"); }, "sec"),
        gris ? h("a", { class: "gris", href: "#apoyos" }, t("quitar_gris")) : null);
      N.vivo(completa);
    }
    vistaA();
    return nodo;
  });

  /* ---------- P6 · Quitar apoyos ---------- */
  N.ruta("apoyos", function () {
    var g = st(), id = g.actual && R(g.actual) ? g.actual : N.reglaDeHoy(N.hoy()), r = R(id), s = S(id); N.tema(r);
    var lista = [["cella", "ap_cella"], ["sonido", "ap_sonido"], ["anillo", "ap_anillo"], ["tarjeta", "ap_tarjeta"]];
    var cuerpo = h("div", { class: "apoyos" }), estado = h("p", { class: "voz grande-voz", role: "status" });
    var nodo = N.pantalla("p6", [h("h1", { class: "frase-chica" }, t("p6_titulo")), cuerpo]);
    nodo.dataset.titulo = "Supports";
    function pinta() {
      var filas = lista.map(function (x) {
        var puesto = g.ayudas[x[0]];
        return h("div", { class: "fila-apoyo" }, h("span", { class: "apoyo-n" }, t(x[1])),
          h("button", { type: "button", class: "chip", "aria-label": t(x[1]) + ": " + (puesto ? t("quitar") : t("volver_poner")), onclick: function () {
            g.ayudas[x[0]] = !puesto; N.guardar();
            estado.textContent = (!g.ayudas[x[0]] && x[0] === "cella") ? t("cella_sin_voz") : "";
            var todos = lista.every(function (y) { return !g.ayudas[y[0]]; });
            if (todos) estado.textContent = t("ultima");
            pinta(); N.vivo(estado.textContent);
          } }, puesto ? t("quitar") : t("volver_poner")));
      });
      var todos = lista.every(function (y) { return !g.ayudas[y[0]]; });
      var fr = U.partes(r);
      N.pon(cuerpo, filas, estado, todos ? h("div", { class: "impresion tarjeta-final" },
        h("p", { class: "etiqueta" }, L(r.nombre)), h("p", { class: "frase-chica" }, (s.cuando || fr.cuando) + ", " + fr.gesto),
        h("p", { class: "nota" }, t("tarjeta_cuando") + ": " + (s.cuando || fr.cuando)),
        h("p", { class: "nota" }, t("tarjeta_planb") + ": " + (g.obstrucciones.planB || "-"))) : null,
        todos ? btn(t("imprimir"), function () { window.print(); }, "sec") : null);
    }
    pinta(); return nodo;
  });

  /* ---------- Ajustes ---------- */
  function interruptor(txt, valor, fn, nota) {
    var b = h("button", { type: "button", class: "interruptor", role: "switch", "aria-checked": String(!!valor) }, h("span", { class: "it" }, txt), h("span", { class: "estado" }, valor ? t("on") : t("off")));
    b.addEventListener("click", function () { var v = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", String(v)); b.lastChild.textContent = v ? t("on") : t("off"); fn(v); });
    return h("div", { class: "aj-fila" }, b, nota ? h("p", { class: "nota" }, nota) : null);
  }
  N.ruta("ajustes", function () {
    N.tema(null); var g = st();
    var por = h("p", { class: "nota", hidden: true, role: "status" }), borrado = h("div", { class: "aj-fila" });
    var ritmo = h("div", { class: "chips tres", role: "group", "aria-label": t("aj_ritmo") }, [["parejo", "r_parejo"], ["lento", "r_lento"], ["libre", "r_libre"]].map(function (x) {
      var c = chip(t(x[1]), g.ritmo === x[0], function () { g.ritmo = x[0]; N.guardar(); [].forEach.call(c.parentNode.children, function (b) { b.setAttribute("aria-pressed", String(b === c)); }); }); return c; }));
    function confirmarBorrar() {
      N.pon(borrado, h("p", null, t("aj_borrar_seguro")), h("div", { class: "par" },
        btn(t("aj_borrar"), function () { N.borrarTodo(); N.pon(borrado, h("p", { role: "status" }, t("aj_borrado")), h("a", { class: "enlace grande-t", href: "#hoy" }, t("hoy_regla"))); }, "sec"),
        btn(t("cerrar"), function () { N.pon(borrado, botonBorrar()); }, "sec")));
    }
    function botonBorrar() { return btn(t("aj_borrar"), confirmarBorrar, "sec"); }
    borrado.appendChild(botonBorrar());
    var cambio = null, id0 = g.actual, s0 = id0 ? S(id0) : null;
    if (N.opaca("o2")) {
      cambio = h("div", { class: "aj-fila" }, h("button", { type: "button", class: "enlace grande-t", onclick: function () {
        var s = null, rid = null; Object.keys(g.reglas).forEach(function (k) { if (g.reglas[k].cambio && (!s || g.reglas[k].cambio.d >= s.cambio.d)) { s = g.reglas[k]; rid = k; } });
        por.hidden = false;
        por.textContent = s ? t("aj_por_que_texto", { a: s.cambio.respuesta === "medias" ? t("medias") : t("hoy_no"), de: U.tamLabel(R(rid), s.cambio.de), a2: U.tamLabel(R(rid), s.cambio.a) }) : t("aj_por_que_nada");
      } }, t("aj_ver_por_que")), por);
    }
    void s0;
    var nodo = N.pantalla("ajustes", [h("h1", { class: "frase-chica" }, t("aj_titulo")),
      h("div", { class: "aj" },
        h("div", { class: "aj-fila" }, h("p", { class: "etiqueta" }, t("aj_idioma")), h("p", null, h("a", { class: "enlace", href: (N.LANG === "en" ? "index.html" : "../index.html") + "#ajustes", lang: "en" }, "EN"), " / ", h("a", { class: "enlace", href: (N.LANG === "en" ? "es/index.html" : "index.html") + "#ajustes", lang: "es" }, "ES"))),
        h("div", { class: "aj-fila" }, h("p", { class: "etiqueta" }, t("aj_ritmo")), ritmo),
        interruptor(t("aj_sonido"), g.sonido.activo, function (v) { g.sonido.activo = v; g.sonido.ofrecido = true; N.guardar(); if (v) N.audioIniciar(); }),
        interruptor(t("aj_sin"), g.sin_ayudas, function (v) { g.sin_ayudas = v; N.guardar(); }, t("aj_sin_nota")),
        h("div", { class: "aj-fila" }, N.FASE ? h("a", { class: "btn sec", href: "#apoyos" }, t("p6_titulo")) : h("p", { class: "nota" }, t("aj_quitar_fase"))),
        interruptor(t("aj_no_contar"), g.no_contar, function (v) { g.no_contar = v; N.guardar(); }),
        h("div", { class: "aj-fila" }, btn(t("aj_exportar"), function () { N.bajar("naos-proto-v1.json", new Blob([JSON.stringify(st(), null, 2)], { type: "application/json" })); }, "sec")),
        borrado, cambio, N.almacenOk ? null : h("p", { class: "nota" }, t("sin_almacen_aj")),
        h("a", { class: "enlace grande-t", href: "#como" }, t("como_link")))]);
    nodo.dataset.titulo = "Settings"; return nodo;
  });

  /* ---------- Cómo te acompañamos (página pública, de un arreglo) ---------- */
  N.ruta("como", function () {
    N.tema(null);
    var c = C.campos;
    var filas = C.filas.map(function (f) {
      var tags = [];
      if (f.fase) tags.push(h("span", { class: "etq" }, "?fase=1"));
      if (f.opaca) tags.push(h("span", { class: "etq" }, N.LANG === "es" ? "variante opaca · ?opaca=" + f.opaca : "opaque variant · ?opaca=" + f.opaca));
      return h("details", { class: "fila-como", id: "como-" + f.id }, h("summary", null, h("span", { class: "sid" }, f.id), " ", L(f.n), " ", tags),
        h("dl", null,
          h("dt", null, L(c.hace)), h("dd", null, L(f.hace)),
          h("dt", null, L(c.porque)), h("dd", null, L(f.porque)),
          h("dt", null, L(c.no)), h("dd", null, L(f.no)),
          h("dt", null, L(c.evid)), h("dd", null, L(f.fuerza), " ", h("span", { class: "ids" }, f.ev)),
          h("dt", null, L(c.apaga)), h("dd", null, L(f.apaga))));
    });
    var nodo = N.pantalla("como", [h("h1", { class: "frase" }, t("como_link")), h("p", null, L(C.intro)), h("p", { class: "nota" }, L(C.marcas)),
      h("p", { class: "destacada" }, L(C.cella)), h("p", { class: "destacada" }, L(C.stories)), h("p", { class: "destacada" }, L(C.privacidad)),
      h("p", { class: "nota" }, L(C.apagar_todo)), h("div", { class: "filas-como" }, filas)]);
    nodo.dataset.titulo = "How we guide you"; return nodo;
  });

  /* ---------- mapa del prototipo ---------- */
  N.ruta("mapa", function () {
    N.tema(null);
    var q = function (p) { return p; };
    var items = [
      ["#hoy", "P8", N.LANG === "es" ? "La regla de hoy y el cajón de ayer" : "The rule of the day and yesterday's drawer", "S11, S29, B11, B106, B175, B180"],
      ["?puerta=move&src=pieza#r/move", "P1", N.LANG === "es" ? "Llegada (Move, desde una pieza)" : "Arrival (Move, from a piece)", "S1, S24, S29, B02, B148, B175"],
      ["?puerta=breathe#r/breathe", "P1", N.LANG === "es" ? "Llegada (Breathe)" : "Arrival (Breathe)", "S1, S24"],
      ["#juega", "P2", N.LANG === "es" ? "Juega: anillo, palabra, sonido" : "Play: ring, word, sound", "S6, S22, B08, B146"],
      ["#despues", "P3", N.LANG === "es" ? "Después y qué se interpuso" : "After and what got in the way", "S7, S28, B01, B172"],
      ["#tuya", "P4 / P4b", N.LANG === "es" ? "Tuya, devuelta de Cella y Llévatela" : "Yours, Cella's read-back and Take it with you", "S5, S10, S20, S26, B06, B17, B25, B83, B90, B132, B158"],
      ["#etiqueta", "P4b", N.LANG === "es" ? "Etiqueta para imprimir" : "Label to print", "B90, B132"],
      ["#obs", "P7", N.LANG === "es" ? "La obstrucción de hoy" : "Today's obstruction", "S25, B152"],
      ["#cierre", "P9", N.LANG === "es" ? "Cierre de 1,2 s" : "1.2 s closing frame", "B159"],
      ["?fase=1#repaso", "P5", N.LANG === "es" ? "Regreso (con ?fase=1)" : "Return (with ?fase=1)", "S3, S4, B04, B118, B150"],
      ["?fase=1#apoyos", "P6", N.LANG === "es" ? "Quitar apoyos (con ?fase=1)" : "Take off supports (with ?fase=1)", "S9, S21, B14, B112"],
      ["#ajustes", "Ajustes", N.LANG === "es" ? "Idioma, ritmo, sonido, sin ayudas, exportar, borrar" : "Language, pace, sound, no supports, export, delete", "B18"],
      ["#como", "Pública", N.LANG === "es" ? "Cómo te acompañamos" : "How we guide you", "B19, B20"]
    ];
    var lista = h("ul", { class: "mapa-lista" }, items.map(function (x) {
      return h("li", null, h("a", { href: x[0].charAt(0) === "#" ? x[0] : x[0] }, h("b", null, x[1]), " ", x[2], h("span", { class: "ids" }, x[3])));
    }));
    var params = h("p", { class: "nota" }, "?lang=en|es · ?dev=1 · ?fase=1 · ?quieto · ?puerta=<id> · ?src=story-AAAAMMDD · ?opaca=o1|o2|o3 · ?hoy=AAAA-MM-DD · ?vista=obstruccion");
    var nodo = N.pantalla("mapa", [h("h1", { class: "frase-chica" }, t("mapa_titulo")), h("p", { class: "nota" }, t("mapa_nota")), lista, params]);
    nodo.dataset.titulo = "Map"; void q; return nodo;
  });

  /* ---------- panel del equipo (?dev=1) ---------- */
  function construirDev() {
    var abierto = false, lista = h("ol", { class: "ev-lista" }), selFecha, info = h("p", { class: "nota" });
    var raiz = h("div", { class: "dev", role: "region", "aria-label": "Panel del equipo" });
    var cuerpo = h("div", { class: "dev-cuerpo", hidden: true });
    var tog = h("button", { type: "button", class: "dev-tog", "aria-expanded": "false", onclick: function () { abierto = !abierto; cuerpo.hidden = !abierto; tog.setAttribute("aria-expanded", String(abierto)); } }, "dev · panel del equipo");
    selFecha = h("input", { type: "date", min: "2026-11-02", max: "2026-11-30", value: N.hoy(), "aria-label": "Fecha simulada" });
    selFecha.addEventListener("change", function () { if (selFecha.value) { var d = N.devLeer(); d.fecha = selFecha.value; N.devEscribir(d); N.render(); } });
    function mover(n) { var f = N.sumar(N.hoy(), n); if (f < "2026-11-02") f = "2026-11-02"; var d = N.devLeer(); d.fecha = f; N.devEscribir(d); N.render(); }
    var nDias = h("input", { type: "number", min: "1", max: "120", value: "3", "aria-label": "Días", class: "n" });
    function pasaron(n) {
      var g = st(); function m(x) { return x ? N.sumar(x, -n) : x; }
      Object.keys(g.reglas).forEach(function (k) { var s = g.reglas[k]; s.guardada = m(s.guardada); s.tope_hasta = m(s.tope_hasta); if (s.cambio) s.cambio.d = m(s.cambio.d); });
      g.historial.forEach(function (x) { x.d = m(x.d); }); g.recuerdos.forEach(function (x) { x.d = m(x.d); }); g.ultima_visita = m(g.ultima_visita); g.ultimo_abre = m(g.ultimo_abre);
      N.guardar(); N.render();
    }
    function primera() { N.borrarTodo(); var d = N.devLeer(); N.devEscribir({ fecha: d.fecha }); location.hash = "hoy"; N.render(); }
    function regreso() {
      N.borrarTodo(); var g = st(), r = R("move"), s = S("move");
      s.cuando = N.LANG === "es" ? "Cuando pongo el agua al fuego" : "When I put the water on"; s.tipo = "oigo"; s.silla = "dos-pasos"; s.tamano = "1"; s.guardada = N.sumar(N.hoy(), -3);
      g.actual = "move"; g.ultima_visita = N.sumar(N.hoy(), -3); g.historial.push({ d: N.sumar(N.hoy(), -3), regla: "move", tamano: "1", despues: "salio" });
      N.guardar(); void r; location.hash = N.FASE ? "repaso" : "r/move"; N.render();
    }
    function enlaceOpaca(k) { var p = new URLSearchParams(location.search), cur = p.get("opaca") === k; if (cur) p.delete("opaca"); else p.set("opaca", k); return "?" + p.toString() + location.hash; }
    cuerpo.append(
      h("div", { class: "dev-fila" }, h("label", null, "Fecha simulada (", h("span", { class: "n" }, "2-nov a 30-nov"), ") "), selFecha,
        h("button", { type: "button", onclick: function () { mover(-1); } }, "-1 día"), h("button", { type: "button", onclick: function () { mover(1); } }, "+1 día")),
      h("div", { class: "dev-fila" }, h("label", null, "Pasaron "), nDias, h("span", null, " días "), h("button", { type: "button", onclick: function () { pasaron(Math.max(1, +nDias.value || 1)); } }, "Volver como si")),
      h("div", { class: "dev-fila" }, h("button", { type: "button", onclick: primera }, "Primera visita"), h("button", { type: "button", onclick: regreso }, "Regreso (Move guardada hace 3 días)"),
        h("button", { type: "button", onclick: function () { N.borrarTodo(); N.devEscribir({}); N.render(); } }, "Borrar todo")),
      h("div", { class: "dev-fila" }, h("span", null, "Idioma: "), h("a", { href: (N.LANG === "en" ? "index.html" : "../index.html") + location.search + location.hash }, "EN"), " / ", h("a", { href: (N.LANG === "en" ? "es/index.html" : "index.html") + location.search + location.hash }, "ES"),
        h("span", null, " · opaca: "), ["o1", "o2", "o3"].map(function (k) { return h("a", { href: enlaceOpaca(k), "aria-current": N.opaca(k) ? "true" : null }, k + (N.opaca(k) ? " (sí)" : " (no)")); })),
      info, h("p", { class: "nota" }, "Eventos (lista cerrada; en el prototipo no salen del teléfono). Nunca aparece \"Me dolió o me mareé\"."), lista);
    raiz.append(tog, cuerpo);
    function pintaEv(e) { lista.appendChild(h("li", null, h("code", null, e.t, " ", e.n, JSON.stringify(e.d).replace(/"/g, "")), e.nota ? h("em", null, " · " + e.nota) : null)); lista.parentNode && (lista.scrollTop = 1e6); }
    N.eventos.forEach(pintaEv); N.onEvento = pintaEv;
    N.dev = { refrescar: function () {
      selFecha.value = N.hoy();
      var g = st(), id = N.reglaDeHoy(N.hoy());
      info.textContent = "Hoy simulado " + N.hoy() + " · regla de hoy: " + id + " · almacén: " + (N.almacenOk ? "ok" : "sin almacenamiento") + " · activa: " + (g.actual || "-");
    } };
    document.body.appendChild(raiz); document.body.classList.add("con-dev"); N.dev.refrescar();
  }
  N.construirDev = construirDev;
})();
