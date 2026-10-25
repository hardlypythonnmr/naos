/* pantallas.js · P1a, P1b, P1c, P2, P3, P3b, /hoy/, P5, P6, P7, P8a y P8b (brief A.4). Cada pantalla es una función que devuelve
 * { nodo, titulo, limpiar? }. Una pantalla, una cosa; un solo botón primario; "Salir" siempre a la vista. */
(function (raiz) {
  "use strict";
  var N = raiz.NAOS_APP, h = N.h, t = N.t, S = N.S, F = N.F, LANG = N.LANG, st = N.estado, go = N.go, SEG = raiz.NAOS_SEGURIDAD, P = N.pantallas;

  // ---------- piezas comunes ----------
  function cabecera() { return h("div", { class: "puerta" }, h("i", { "aria-hidden": "true" }), t("puerta")); }
  function enlaceSalir(clase) { return h("a", { class: clase || "btn sec", href: "#hoy" }, t("salir")); }
  function pleg(titulo, cuerpo) { return h("details", { class: "pleg" }, h("summary", {}, titulo), h("div", { class: "cuerpo" }, cuerpo)); }
  function enlaceP9() { return h("p", { class: "nota" }, h("a", { href: "#p9" }, t("comoEmpuja"))); }
  function hojaUrl() { return N.BASE + "hoja.html?lang=" + LANG + "&p=" + encodeURIComponent(st.palabra || F.palabra_etiqueta[LANG]); }
  function frase() { return t("p2_frase", { c: st.cuando.texto || t("p1a_chips")[0], h: F.senal_fija.haz[LANG] }); }
  function prefiereCaminos() { return window.matchMedia && (matchMedia("(prefers-contrast: more)").matches || matchMedia("(forced-colors: active)").matches); }

  // el último cuadro del Short como componente: cuarto oscuro, halo de puntos ámbar y la frase completa
  function senalCuadro() {
    var f = F.senal_fija, el = h("div", { class: "senal-cuadro", role: "img", aria: { label: t("cuadroAlt") } });
    el.innerHTML = S.puntos({ w: 358, h: 190, cx: 288, cy: 52, rNucleo: 20, rHalo: 94, paso: 9, color: "#FFB547", perfil: 1.3 });
    el.appendChild(h("div", { class: "txt", "aria-hidden": "true" }, h("span", { class: "cu" }, f.cuando[LANG]), h("span", { class: "haz" }, f.haz[LANG])));
    return el;
  }

  function recorte(s) {
    s = s.trim(); if (s.length <= 60) return s;
    var c = s.slice(0, 60), i = c.lastIndexOf(" ");
    if (i >= 40) c = c.slice(0, i);
    return c.replace(/[\s,;:.\-]+$/, "");
  }

  // valores por defecto para entrar directo a una ancla (capturas): solo si falta el recorrido
  function asegurar() {
    if (st.cuando.tipo) return;
    var q = N.params.get("tipo");
    st.cuando.tipo = ["lugar", "alarma", "hora", "aparato", "sin-lugar"].indexOf(q) >= 0 ? q : "lugar";
    if (!st.cuando.texto) st.cuando.texto = t("p1a_chips")[0];
    if (st.cuando.tipo === "lugar" && !st.cuarto) st.cuarto = "bano";
    aplicarTipo(st.cuando.tipo);
  }
  function aplicarTipo(tipo) {
    var fx = F.fuerza_por_tipo[tipo] || "debil";
    st.fuerza = fx; st.portador = F.portador_por_tipo[tipo] || null; st.gate = "pendiente"; st.donde = null;
  }

  // ---------- P1a · Tu cuándo ----------
  P.p1a = function () {
    var fecha = new Date(st.hoy + "T12:00:00"), inicio = fecha.getDate() === 1 ? t("p1a_inicioMes") : fecha.getDay() === 1 ? t("p1a_inicioSemana") : null;
    var chipsTxt = t("p1a_chips"), slugs = ["cierro-la-llave", "pongo-el-celular-a-cargar", "me-cepillo"];
    var input = h("input", { type: "text", id: "cuando", autocomplete: "off", autocapitalize: "none", placeholder: t("p1a_marcador"), value: st.cuando.texto || N.params.get("texto") || "", enterkeyhint: "next" });
    var aviso = h("div", { class: "aviso", aria: { live: "polite" } });
    var rec = h("div", { class: "recorte", hidden: true });
    var sig = h("button", { class: "btn", type: "button", disabled: true }, t("siguiente"));
    var chips = chipsTxt.map(function (txt, i) {
      var b = h("button", { class: "chip", type: "button", aria: { pressed: st.cuando.chip === slugs[i] ? "true" : "false" } }, h("span", {}, txt), N.check());
      b.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        input.value = txt; st.cuando.chip = slugs[i]; actualizar();
      });
      return b;
    });
    function actualizar() {
      var v = input.value.trim(), n = v.length;
      sig.disabled = n < 3 || n > 60;
      aviso.textContent = n >= 45 && n <= 60 ? t("p1a_max") : "";
      rec.hidden = n <= 60;
      if (n > 60) {
        rec.textContent = "";
        var r = recorte(v);
        rec.appendChild(h("p", { class: "nota" }, t("p1a_recorte", { x: r })));
        rec.appendChild(h("button", { class: "btn sec", type: "button", on: { click: function () { input.value = r; actualizar(); input.focus(); } } }, t("p1a_usar")));
      }
    }
    input.addEventListener("input", function () {
      if (st.cuando.chip) { st.cuando.chip = null; chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); }); }
      actualizar();
    });
    function siguiente() {
      var v = input.value.trim();
      if (v.length < 3 || v.length > 60) return;
      var r = SEG.revisar(v, LANG);   // una sola vez, al tocar Siguiente
      if (r) { st.seguridad = r; st.cuando = { texto: "", chip: null, tipo: null }; input.value = ""; go(r === "crisis" ? "p8a" : "p8b"); return; }
      st.cuando.texto = v; go("p1b");
    }
    sig.addEventListener("click", siguiente);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); siguiente(); } });

    var g = N.almacen.leer(), segunda = g && g.senales.length;
    var pies = h("div", { class: "pies" },
      h("details", { class: "pleg" }, h("summary", {}, t("p1a_porque")), h("div", { class: "cuerpo" }, h("p", {}, t("p1a_porqueTxt")), enlaceP9())),
      h("details", { class: "pleg" }, h("summary", {}, t("p1a_cuandoNo")), h("div", { class: "cuerpo" }, h("p", {}, t("p1a_cuandoNoTxt")))));
    if (segunda) {
      pies.appendChild(h("a", { class: "enlace izq", href: "#p6&propio" }, t("tuCuarto")));
      pies.appendChild(h("a", { class: "enlace izq", href: "#p3", on: { click: function () { cargarSenal(g.senales[g.senales.length - 1]); } } }, t("saltarTarjeta")));
    }
    var nodo = h("section", { class: "pantalla" },
      cabecera(),
      inicio ? h("p", { class: "inicio" }, inicio) : null,
      senalCuadro(),
      h("h1", {}, t("p1a_titulo")),
      h("div", { class: "chips", role: "group", aria: { label: t("p1a_chipsAria") } }, chips),
      h("label", { class: "campo", for: "cuando" }, h("span", { class: "et" }, t("p1a_cuando") + " ___ :"), input),
      aviso, rec,
      h("a", { class: "enlace izq oculta-teclado", href: "#p1c" }, t("p1a_verComo")),
      h("div", { class: "acciones" }, sig, enlaceSalir()),
      pies);
    actualizar();
    return { nodo: nodo, titulo: t("p1a_cuando") };
  };
  function cargarSenal(s) {
    st.cuando = { texto: s.cuando, chip: null, tipo: s.tipo || "lugar" }; st.cuarto = s.cuarto; st.palabra = s.palabra; st.fuerza = s.fuerza || "con-lugar";
    st.portador = F.portador_por_tipo[st.cuando.tipo] || null; st.plan_b = s.plan_b || ""; st.gate = "pendiente";
  }

  // ---------- P1b · Dónde estás ----------
  var MAPA = { cuarto: ["lugar", "cuarto"], bano: ["lugar", "bano"], pasillo: ["lugar", "pasillo"], aparato: ["aparato", null], alarma: ["alarma", null], hora: ["hora", null], nose: ["sin-lugar", null] };
  P.p1b = function () {
    st.cuando.tipo = null; st.cuarto = null; st.gate = "pendiente"; st.donde = null;
    var eleccion = null, grupo = h("fieldset", { class: "opciones" });
    var sig = h("button", { class: "btn", type: "button", disabled: true, on: { click: siguiente } }, t("siguiente"));
    function radio(k, txt) {
      return h("label", { class: "op" }, h("input", { type: "radio", name: "cuarto", value: k, on: { change: function () { eleccion = k; sig.disabled = false; } } }), h("span", {}, txt, N.check()));
    }
    function pintar(otro) {
      eleccion = null; sig.disabled = true; grupo.textContent = "";
      grupo.appendChild(h("legend", { class: "sr" }, F.pregunta_donde[LANG]));
      if (!otro) {
        var ks = ["cuarto", "bano", "pasillo", "aparato"];
        t("p1b_opc").forEach(function (txt, i) { grupo.appendChild(radio(ks[i], txt)); });
        grupo.appendChild(h("button", { class: "btn-op", type: "button", on: { click: function () { pintar(true); var r = grupo.querySelector("input"); if (r) r.focus(); } } }, t("p1b_otro"), h("span", { "aria-hidden": "true" }, "→")));
      } else {
        var ko = ["alarma", "hora", "nose"];
        t("p1b_otras").forEach(function (txt, i) { grupo.appendChild(radio(ko[i], txt)); });
        grupo.appendChild(h("button", { class: "enlace izq", type: "button", aria: { label: t("p1b_atras") }, on: { click: function () { pintar(false); grupo.querySelector("input").focus(); } } }, "← " + t("volver")));
      }
    }
    function siguiente() {
      if (!eleccion) return;
      var m = MAPA[eleccion];
      st.cuando.tipo = m[0]; st.cuarto = m[1]; aplicarTipo(m[0]);
      go("p2");
    }
    pintar(false);
    var nodo = h("section", { class: "pantalla" }, cabecera(),
      h("div", { class: "cella" }, N.cella({ brazo: 50, lado: "der", ojos: true }), h("h1", { class: "voz" }, F.pregunta_donde[LANG])),
      grupo, h("p", { class: "chica" }, t("p1b_chica")),
      h("div", { class: "acciones" }, sig, enlaceSalir()));
    return { nodo: nodo, titulo: t("p1b_grupo") };
  };

  // ---------- P1c · Ver cómo · 10 s ----------
  var ctxAudio = null;
  function clic() {
    try {
      var AC = raiz.AudioContext || raiz.webkitAudioContext; if (!AC) return;
      ctxAudio = ctxAudio || new AC();
      var ahora = ctxAudio.currentTime, o = ctxAudio.createOscillator(), g = ctxAudio.createGain();
      o.type = "square"; o.frequency.setValueAtTime(1900, ahora); o.frequency.exponentialRampToValueAtTime(280, ahora + 0.03);
      g.gain.setValueAtTime(0.0001, ahora); g.gain.exponentialRampToValueAtTime(0.18, ahora + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.06);
      o.connect(g); g.connect(ctxAudio.destination); o.start(ahora); o.stop(ahora + 0.07);
    } catch (e) { /* el sonido es un extra */ }
  }
  P.p1c = function () {
    var cuarto = h("div", { class: "cuarto", "data-luz": "prendida" });
    var techo = h("div", { class: "capa techo", "aria-hidden": "true" });
    techo.innerHTML = S.puntos({ w: 360, h: 360, cx: 180, cy: 20, rNucleo: 36, rHalo: 150, paso: 12, color: "#D7DBE0", perfil: 1.2 });
    var noche = h("div", { class: "capa noche", "aria-hidden": "true" });
    noche.innerHTML = S.puntos({ w: 360, h: 360, cx: 180, cy: 165, rNucleo: 22, rHalo: 118, paso: 9, color: "#FFB547", perfil: 1.4 });
    var btn = h("button", { class: "interruptor", type: "button", aria: { pressed: "false" } },
      h("span", { class: "caja", "aria-hidden": "true" }, h("span", { class: "tecla" })), h("span", { class: "rot2" }, t("p1c_interruptor")));
    btn.addEventListener("click", function () {
      var fuera = cuarto.getAttribute("data-luz") !== "fuera";
      cuarto.setAttribute("data-luz", fuera ? "fuera" : "prendida");
      btn.setAttribute("aria-pressed", fuera ? "true" : "false");
      clic(); N.vivo(fuera ? t("p1c_apagada") : t("p1c_prendida"));
    });
    var brazo = h("div", { class: "cella", "aria-hidden": "true" }, N.cella({ brazo: 55, lado: "izq", ojos: true }));
    cuarto.appendChild(techo); cuarto.appendChild(noche);
    cuarto.appendChild(h("div", { class: "nombre", "aria-hidden": "true" }, t("p1c_nombre")));
    cuarto.appendChild(brazo); cuarto.appendChild(btn);
    var nodo = h("section", { class: "pantalla" }, cabecera(), h("h1", { class: "sr" }, t("p1a_verComo")),
      h("div", { class: "escena" }, cuarto, h("div", { class: "acciones", style: "width:100%" }, h("a", { class: "btn", href: "#p1a" }, t("volver")), enlaceSalir())));
    return { nodo: nodo, titulo: t("p1a_verComo"), foco: btn };
  };

  // ---------- la tarjeta de cinta con la palabra (P2 y P3) ----------
  function rotulo() {
    var tipo = st.cuando.tipo, R = t("p2_rot");
    if (st.donde && R[st.donde]) return R[st.donde];
    if (tipo === "alarma") return R.alarma;
    if (tipo === "hora") return R.hora;
    if (tipo === "aparato") return R.aparato;
    if (tipo === "sin-lugar") return R.sinlugar;
    return R.llave;
  }
  function tarjetaPalabra(conPunto) {
    var inp = h("input", { type: "text", maxlength: "14", value: st.palabra, autocomplete: "off", autocapitalize: "none", spellcheck: "false", aria: { label: t("p2_palabraAria") } });
    function ajustar() { var n = inp.value.length; inp.style.fontSize = n <= 9 ? "56px" : n <= 11 ? "48px" : n <= 13 ? "40px" : "36px"; }
    ajustar();
    inp.addEventListener("input", function () { st.palabra = inp.value; ajustar(); });
    inp.addEventListener("blur", function () { if (!inp.value.trim()) { inp.value = F.palabra_etiqueta[LANG]; st.palabra = inp.value; ajustar(); } });
    var cls = st.fuerza === "con-lugar" ? "lleno" : st.fuerza === "cita" ? "medio" : "", lbl = st.fuerza === "con-lugar" ? t("p2_puntoLleno") : st.fuerza === "cita" ? t("p2_puntoCita") : t("p2_puntoVacio");
    var rotTxt = h("span", { class: "rot-txt" }, rotulo());
    var rot = h("div", { class: "rot" }, h("span", { class: "punto " + cls, role: "img", aria: { label: lbl } }), rotTxt);
    if (conPunto && st.fuerza === "debil" && st.gate === "igual" && !st.avisoDebilMostrado) { rot.appendChild(h("span", { class: "debil" }, t("p2_debil"))); st.avisoDebilMostrado = true; }
    return { nodo: h("div", { class: "tarjeta" }, inp, rot), rotTxt: rotTxt, input: inp };
  }

  // ---------- P2 · Dónde vive ----------
  P.p2 = function () {
    asegurar();
    var tipo = st.cuando.tipo, sinLugar = (tipo === "sin-lugar" || tipo === "aparato") && st.gate !== "igual";
    var pies = h("div", { class: "pies" }, h("details", { class: "pleg" }, h("summary", {}, t("p1a_porque")),
      h("div", { class: "cuerpo" }, h("p", {}, sinLugar ? t("p2_porqueGate") : t("p2_porqueTxt")), enlaceP9())));
    var nodo;
    if (sinLugar) {
      nodo = h("section", { class: "pantalla" }, cabecera(), h("h1", {}, t("p2_gate")),
        h("div", { class: "acciones" },
          h("button", { class: "btn", type: "button", on: { click: function () { go("p1b"); } } }, t("p2_elegir")),
          h("button", { class: "btn sec", type: "button", on: { click: function () { st.gate = "igual"; st.fuerza = "debil"; go("p2", { reemplazar: true }); } } }, t("p2_igual")),
          h("a", { class: "enlace", href: "#hoy" }, t("p2_ninguno")),
          enlaceSalir("enlace")),
        pies);
      return { nodo: nodo, titulo: t("p2_gate") };
    }
    var tarj = tarjetaPalabra(true);
    var btnOtro = h("button", { class: "btn sec", type: "button", aria: { expanded: "false" } }, t("p2_otroLugar"));
    var listaOp = h("div", { class: "lista-op", hidden: true });
    var btnLista = h("button", { class: "btn sec", type: "button", aria: { expanded: "false" } }, t("p2_lista"));
    var btnAlarma = h("button", { class: "btn sec", type: "button", aria: { expanded: "false" } }, t("p2_alarma"));
    var pLista = h("div", { class: "panelito", hidden: true }), pAlarma = h("div", { class: "panelito", hidden: true });
    function abrir(btn, panel, otros) {
      var abre = panel.hidden;
      otros.forEach(function (o) { o[0].setAttribute("aria-expanded", "false"); o[1].hidden = true; });
      panel.hidden = !abre; btn.setAttribute("aria-expanded", abre ? "true" : "false");
    }
    var todos = [[btnOtro, listaOp], [btnLista, pLista], [btnAlarma, pAlarma]];
    btnOtro.addEventListener("click", function () { abrir(btnOtro, listaOp, todos.filter(function (x) { return x[0] !== btnOtro; })); });
    btnLista.addEventListener("click", function () { llenarLista(); abrir(btnLista, pLista, todos.filter(function (x) { return x[0] !== btnLista; })); });
    btnAlarma.addEventListener("click", function () { llenarAlarma(); abrir(btnAlarma, pAlarma, todos.filter(function (x) { return x[0] !== btnAlarma; })); });

    // hoja grande: la palabra a 72 pt, la frase en voz de 6 s, imprimir
    function llenarLista() {
      pLista.textContent = "";
      pLista.appendChild(h("div", { class: "hoja-grande", role: "img", aria: { label: t("p2_hoja") + ": " + st.palabra } }, st.palabra));
      pLista.appendChild(h("p", { class: "nota" }, t("p2_hojaAyuda")));
      if ("speechSynthesis" in raiz) pLista.appendChild(h("button", { class: "btn sec", type: "button", on: { click: function () {
        try { var u = new SpeechSynthesisUtterance(frase()); u.lang = LANG === "es" ? "es-CO" : "en-US"; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { /* sin voz */ }
      } } }, t("p2_oir")));
      pLista.appendChild(h("button", { class: "btn sec", type: "button", on: { click: function () {
        document.documentElement.classList.add("imprimiendo");
        var fin = function () { document.documentElement.classList.remove("imprimiendo"); raiz.removeEventListener("afterprint", fin); };
        raiz.addEventListener("afterprint", fin);
        try { raiz.print(); } catch (e) { fin(); }
      } } }, t("p2_hoja")));
      pLista.appendChild(h("a", { class: "enlace", href: hojaUrl() }, t("p2_abrirHoja")));
    }
    function llenarAlarma() {
      pAlarma.textContent = "";
      var msg = h("span", { class: "nota", aria: { live: "polite" } });
      pAlarma.appendChild(h("p", { class: "nota" }, t("p2_alarmaAyuda")));
      pAlarma.appendChild(h("div", { class: "hoja-grande", style: "font-size:44px;line-height:52px" }, st.palabra));
      pAlarma.appendChild(h("button", { class: "btn", type: "button", on: { click: function () { S.copiar(st.palabra).then(function (ok) { msg.textContent = ok ? t("copiado") : ""; }); } } }, t("copiar")));
      pAlarma.appendChild(msg);
    }
    // "Otro lugar": la segunda opción y el resto
    function opcionDonde(k) {
      var activo = function () { return st.donde === k || (st.donde == null && k === "llave" && tipo === "lugar"); };
      var b = h("button", { class: "btn-op", type: "button", aria: { pressed: activo() ? "true" : "false" } }, t("p2_lugares")[k], N.check());
      b.addEventListener("click", function () {
        st.donde = k; tarj.rotTxt.textContent = rotulo();
        Array.prototype.forEach.call(listaOp.querySelectorAll("button[data-donde]"), function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-donde") === k ? "true" : "false"); });
      });
      b.setAttribute("data-donde", k);
      return b;
    }
    var stubs = ["foto", "fondo"].map(function (k) { return h("div", { class: "btn-op", "aria-disabled": "true", style: "opacity:.7;border-style:dashed" }, t("p2_lugares")[k], h("span", { class: "etq" }, t("maqueta"))); });
    listaOp.appendChild(opcionDonde("llave")); listaOp.appendChild(opcionDonde("marco")); listaOp.appendChild(opcionDonde("interruptor"));
    listaOp.appendChild(h("button", { class: "btn-op", type: "button", on: { click: function () { llenarAlarma(); pAlarma.hidden = false; btnAlarma.setAttribute("aria-expanded", "true"); pAlarma.scrollIntoView({ block: "nearest" }); } } }, t("p2_lugares").alarma));
    stubs.forEach(function (s) { listaOp.appendChild(s); });
    listaOp.appendChild(h("a", { class: "btn-op", href: hojaUrl() }, t("p2_lugares").hoja, h("span", { class: "etq" }, t("maqueta"))));

    var caminos = [btnLista, pLista, btnAlarma, pAlarma];
    var sig = h("button", { class: "btn", type: "button", on: { click: function () { go("p3"); } } }, t("siguiente"));
    var acciones = h("div", { class: "acciones" });
    if (prefiereCaminos()) { acciones.append.apply(acciones, caminos.concat([sig, btnOtro, listaOp])); }
    else { acciones.append.apply(acciones, [sig, btnOtro, listaOp].concat(caminos)); }
    acciones.appendChild(h("a", { class: "enlace", href: "#hoy" }, t("p2_ninguno")));
    acciones.appendChild(enlaceSalir("enlace"));
    nodo = h("section", { class: "pantalla" }, cabecera(), h("h1", {}, t("p2_titulo")), tarj.nodo,
      h("p", { class: "cambia" }, F.cambia_respecto_de_hoy[LANG]), h("p", { class: "nota" }, t("p2_cambiar")), acciones, pies);
    return { nodo: nodo, titulo: t("p2_titulo") };
  };

  // ---------- P3 · Llévatela ----------
  P.p3 = function () {
    asegurar();
    S.mantenerEncendida();   // la pantalla se mantiene encendida y nunca se atenúa; sin soporte, no hace nada y no avisa
    var onVis = function () { if (document.visibilityState === "visible") S.mantenerEncendida(); };
    document.addEventListener("visibilitychange", onVis);
    var tarj = tarjetaPalabra(false);
    var cs = st.casillas;

    // más objetos
    var msg = h("p", { class: "nota", aria: { live: "polite" } });
    var figura = h("figure", { class: "img-etq", hidden: true });
    var urlImg = null;
    async function guardarImagen() {
      try {
        var cn = S.dibujarEtiqueta(st.palabra || F.palabra_etiqueta[LANG], "#0E1116", "#FFFFFF");
        try { await document.fonts.load('600 120px "IBM Plex Sans Condensed"'); cn = S.dibujarEtiqueta(st.palabra || F.palabra_etiqueta[LANG], "#0E1116", "#FFFFFF"); } catch (e) { /* sigue con la fuente de respaldo */ }
        var blob = await S.aBlob(cn);
        if (urlImg) URL.revokeObjectURL(urlImg);
        urlImg = URL.createObjectURL(blob);
        figura.textContent = "";
        figura.appendChild(h("img", { src: urlImg, alt: t("p3_imgAlt", { x: st.palabra }), width: "1080", height: "540" }));
        figura.appendChild(h("figcaption", {}, t("p3_pulsar")));
        figura.hidden = false;
        var file = new File([blob], "naos-etiqueta.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: "NAOS" }); msg.textContent = t("p3_compartida"); return; } catch (e) { /* la persona cerró la hoja */ }
        }
        var a = document.createElement("a"); a.href = urlImg; a.download = "naos-etiqueta.png"; document.body.appendChild(a); a.click(); a.remove();
        msg.textContent = t("p3_guardada");
      } catch (e) { msg.textContent = t("p3_pulsar"); }
    }
    function opcionesCita() { return { hoy: st.hoy, franja: cs.franja, palabra: st.palabra, frase: frase(), incluirFrase: cs.incluir_frase, lang: LANG }; }
    function ayudaCal() {
      if (!cs.preguntas_7_28) calHint.textContent = t("p3_calApagado");
      else if (!cs.franja) calHint.textContent = t("p3_calFranja");
      else calHint.textContent = "";
      var listo = cs.preguntas_7_28 && !!cs.franja;
      btnCal.setAttribute("aria-disabled", listo ? "false" : "true"); btnCopCita.setAttribute("aria-disabled", listo ? "false" : "true");
    }
    var calHint = h("p", { class: "nota", aria: { live: "polite" } });
    var btnCal = h("button", { class: "btn sec", type: "button", on: { click: function () {
      if (btnCal.getAttribute("aria-disabled") === "true") { ayudaCal(); return; }
      var ics = S.construirICS(opcionesCita()), blob = new Blob([ics], { type: "text/calendar;charset=utf-8" }), u = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = u; a.download = "naos-senal.ics"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000); calHint.textContent = t("p3_calListo");
    } } }, t("p3_calendario"));
    var btnCopCita = h("button", { class: "btn sec", type: "button", on: { click: function () {
      if (btnCopCita.getAttribute("aria-disabled") === "true") { ayudaCal(); return; }
      var c = S.citas(opcionesCita())[0];
      S.copiar(c.resumen + "\n" + c.descripcion).then(function (ok) { calHint.textContent = ok ? t("copiado") : ""; });
    } } }, t("p3_copiarCita"));
    var mas = pleg(t("p3_mas"), [
      h("div", { class: "sub" },
        h("button", { class: "btn sec", type: "button", on: { click: guardarImagen } }, t("p3_guardar")), figura,
        btnCal, btnCopCita, calHint,
        h("button", { class: "btn sec", type: "button", on: { click: function () { S.copiar(st.palabra).then(function (ok) { msg.textContent = ok ? t("copiado") : ""; }); } } }, t("p3_copiarAlarma")),
        h("a", { class: "btn sec", href: hojaUrl() }, t("p3_imprimir")), msg,
        S.esNavegadorInterno() ? h("p", { class: "nota" }, t("p3_interno")) : null)]);

    // plan B (plegado): campo vacío, el ejemplo de la ficha es texto fantasma y nunca valor
    var ta = h("textarea", { class: "ghost", maxlength: "140", placeholder: t("p3_planBEjemplo"), aria: { label: t("p3_planBCampo") } });
    ta.value = st.plan_b || "";
    ta.addEventListener("input", function () { st.plan_b = ta.value; });
    var planB = pleg(t("p3_planB"), [h("p", { class: "nota" }, t("p3_minima")), h("label", { class: "sr", for: "planb" }, t("p3_planBCampo")), ta]);
    ta.id = "planb";

    // ensayo en tu lugar (P4): un solo botón, sin temporizador
    var yaFui = h("button", { class: "btn sec", type: "button", aria: { pressed: st.yaFui ? "true" : "false" } }, t("p3_yaFui"), N.check());
    yaFui.addEventListener("click", function () { st.yaFui = !st.yaFui; yaFui.setAttribute("aria-pressed", st.yaFui ? "true" : "false"); });
    var ensayo = pleg(t("p3_ensayo"), [h("p", {}, t("p3_ensayoTxt")), yaFui]);

    // casilla apagada: preguntas el día 7 y el 28
    var sub = h("div", { class: "sub", hidden: !cs.preguntas_7_28 });
    var sel = h("select", { class: "franja", id: "franja", aria: { label: t("p3_franja") } }, h("option", { value: "" }, t("p3_franjaVacia")),
      ["manana", "mediodia", "tarde"].map(function (k) { return h("option", { value: k }, t("p3_franjas")[k]); }));
    sel.value = cs.franja || "";
    sel.addEventListener("change", function () { cs.franja = sel.value || null; ayudaCal(); });
    var incl = h("input", { type: "checkbox", id: "incluir" }); incl.checked = !!cs.incluir_frase;
    incl.addEventListener("change", function () { cs.incluir_frase = incl.checked; inclAyuda.hidden = !incl.checked; });
    var inclAyuda = h("span", { class: "chica", hidden: !cs.incluir_frase }, t("p3_incluirAyuda"));
    sub.appendChild(h("label", { class: "chica", for: "franja" }, t("p3_franja")));
    sub.appendChild(sel);
    sub.appendChild(h("p", { class: "nota" }, t("p3_calendarioVe")));
    sub.appendChild(h("div", { class: "casilla" }, incl, h("label", { for: "incluir" }, t("p3_incluir"), inclAyuda)));
    var chk = h("input", { type: "checkbox", id: "casilla" }); chk.checked = !!cs.preguntas_7_28;
    chk.addEventListener("change", function () { cs.preguntas_7_28 = chk.checked; sub.hidden = !chk.checked; if (!chk.checked) { cs.franja = null; sel.value = ""; cs.incluir_frase = false; incl.checked = false; inclAyuda.hidden = true; } ayudaCal(); });
    var casilla = h("div", {}, h("div", { class: "casilla" }, chk, h("label", { for: "casilla" }, t("p3_casilla"), h("span", { class: "chica" }, t("p3_casillaAyuda")))), sub);

    var listo = h("button", { class: "btn", type: "button", on: { click: function () { st.listo = true; N.guardarCuarto(); go("p3b"); } } }, t("p3_listo"));
    ayudaCal();
    var nodo = h("section", { class: "pantalla" }, cabecera(), h("h1", { class: "sr" }, t("p3_titulo")), tarj.nodo,
      h("p", { class: "manos m1" }, t("p3_cinta")), h("p", { class: "manos" }, t("p3_escribe")),
      h("div", { class: "pies", style: "margin-top:16px" }, mas, planB, ensayo),
      h("div", { style: "margin-top:16px" }, casilla),
      h("div", { class: "acciones" }, listo, enlaceSalir("enlace")),
      h("p", { class: "chica" }, t("p3_guarda")));
    return { nodo: nodo, titulo: t("p3_titulo"), limpiar: function () { S.soltarPantalla(); document.removeEventListener("visibilitychange", onVis); if (urlImg) URL.revokeObjectURL(urlImg); } };
  };

  // ---------- P3b · La luz que queda ----------
  P.p3b = function () {
    asegurar();
    var escena = h("div", { id: "p3b-escena" });
    var volver = h("button", { class: "btn-volver", type: "button", aria: { label: t("p3b_volver") }, on: { click: function () { go("p3"); } } });
    var disco = h("div", { class: "disco", "aria-hidden": "true" });
    disco.innerHTML = S.puntos({ w: 320, h: 320, cx: 160, cy: 160, rNucleo: 60, rHalo: 152, paso: 10, color: "#FFB547", perfil: 1.4 });
    var lineaCella = h("div", { class: "cella linea" }, N.cella({ brazo: 0 }), h("p", { class: "voz", style: "margin:0" }, t("p3b_cella")));
    var acciones = h("div", { class: "acciones" },
      h("a", { class: "btn", href: "#hoy" }, t("salir")),
      h("button", { class: "btn sec", type: "button", on: { click: function () { N.almacen.borrar(); N.reiniciar(); go("p1a"); N.vivo(t("p6_borrado")); } } }, t("p3b_borrar")));
    escena.append(volver, h("h1", { class: "sr" }, t("p3b_titulo")), disco, lineaCella, acciones);
    var nodo = h("section", { class: "pantalla" }, cabecera(), escena);
    // el cierre lo provoca la persona (tocó "Listo"): 1,2 s hasta un disco de puntos ámbar sobre noche; sin cuenta regresiva
    var t0 = performance.now(), origen = null;
    requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.setAttribute("data-escena", "noche"); escena.classList.add("dim"); N.vivo(t("p3b_vivo")); }); });
    function volverP3() { go("p3"); }
    function alTecla(e) {
      if (["Tab", "Shift", "Control", "Alt", "Meta", "Escape"].indexOf(e.key) >= 0) return;
      var el = e.target && e.target.closest ? e.target.closest("button, a") : null;
      if (el && el !== volver && (e.key === "Enter" || e.key === " ")) return;   // activar Salir o Apagar y borrar con el teclado
      volverP3();
    }
    function alMover(e) {
      if (performance.now() - t0 < 700 || e.pointerType !== "mouse") return;
      if (e.target && e.target.closest && e.target.closest(".acciones")) { origen = null; return; }
      if (!origen) { origen = [e.clientX, e.clientY]; return; }
      if (Math.hypot(e.clientX - origen[0], e.clientY - origen[1]) > 110) volverP3();
    }
    document.addEventListener("keydown", alTecla); document.addEventListener("pointermove", alMover);
    return { nodo: nodo, titulo: t("p3b_titulo"),
      limpiar: function () { document.removeEventListener("keydown", alTecla); document.removeEventListener("pointermove", alMover); document.body.removeAttribute("data-escena"); N.vivo(""); } };
  };

  // ---------- /hoy/ ----------
  P.hoy = function () {
    var sem = N.D.SEMANA, nodo = h("section", { class: "pantalla" }, cabecera(),
      h("h1", {}, t("hoy_titulo")),
      h("p", { class: "inicio", style: "font-size:32px;line-height:40px" }, h("a", { href: "#p1a" }, sem.actual.nombre[LANG])),
      sem.siguiente ? h("p", { class: "chica" }, sem.siguiente.dia[LANG] + ": " + sem.siguiente.nombre[LANG]) : null,
      h("p", { class: "etq" }, t("hoy_nota")));
    if (N.hojaCampo && N.campo.activo) nodo.appendChild(N.hojaCampo());
    var res = { nodo: nodo, titulo: "/hoy/" };
    N.reiniciar();
    return res;
  };

  // ---------- P5 · Pregunta del día 7 o 28 ----------
  P.p5 = function (cola) {
    var q = N.params.get("q") === "28" ? 28 : 7, palabra = S.leerFragmento(cola) || "";
    var cont = h("div", { class: "p5-cont" });
    var tit = h("h1", {});
    function titulo() { tit.textContent = palabra ? t("p5_pregunta", { x: palabra }) : t("p5_sinPalabra"); }
    function registrar(o) { o.q = q; o.palabra = palabra || null; o.t = new Date().toISOString(); console.info("[naos-proto] P5 (no se envía)", o); N.campo.respuestas.push(o); }
    function fin(extra) {
      cont.textContent = "";
      cont.appendChild(extra);
      cont.appendChild(h("div", { class: "cella linea" }, N.cella({ brazo: 0 }), h("p", { class: "voz", style: "margin:0" }, t("p5_cella"))));
      cont.appendChild(h("div", { class: "acciones" }, enlaceSalir("btn")));
      cont.appendChild(h("p", { class: "chica" }, t("p5_privado")));
      N.vivo(t("p5_cella"));
    }
    function planBBloque(razon) {
      var g = N.almacen.leer(), pb = g && g.senales.length && g.senales[g.senales.length - 1].plan_b || F.plan_b.es && (LANG === "es" ? F.plan_b.es : t("p3_planBEjemplo"));
      if (razon === 3) return h("div", { class: "bloque" }, h("p", {}, t("p5_culpa")));
      return h("div", { class: "bloque" }, h("p", { style: "font-weight:600" }, "«" + t("p5_razones")[razon] + "»"),
        h("p", {}, h("b", {}, t("p5_planB") + ": "), pb), h("p", {}, t("p3_minima")));
    }
    function razones(i) {
      cont.textContent = "";
      cont.appendChild(h("p", { class: "nota" }, t("p5_razonesTit")));
      var lista = h("div", { class: "resp" });
      t("p5_razones").forEach(function (txt, j) {
        lista.appendChild(h("button", { class: "btn-op", type: "button", on: { click: function () { registrar({ respuesta: t("p5_resp")[i], razon: txt }); fin(planBBloque(j)); } } }, txt));
      });
      cont.appendChild(lista);
      cont.appendChild(enlaceSalir("enlace"));
      lista.querySelector("button").focus();
    }
    function preguntar() {
      cont.textContent = "";
      var lista = h("div", { class: "resp" });
      t("p5_resp").forEach(function (txt, i) {
        lista.appendChild(h("button", { class: "btn-op", type: "button", on: { click: function () {
          if (i === 1 || i === 2) { razones(i); return; }
          registrar({ respuesta: txt }); fin(i === 3 ? h("div", { class: "bloque" }, h("p", {}, t("p5_soloTuya"))) : h("span"));
        } } }, txt));
      });
      cont.appendChild(lista);
      if (!palabra) {
        var inp = h("input", { type: "text", maxlength: "14", id: "p5-palabra", style: "width:100%;min-height:48px;padding:0 12px;border:2px solid var(--fg);border-radius:12px;background:var(--bg)" });
        var det = h("details", { class: "pleg" }, h("summary", {}, t("p5_escribir")), h("div", { class: "cuerpo" },
          h("label", { for: "p5-palabra", class: "chica" }, t("p5_palabraCampo")), inp,
          h("button", { class: "btn sec", type: "button", style: "margin-top:8px", on: { click: function () { palabra = inp.value.trim(); titulo(); det.open = false; } } }, t("p5_ok"))));
        cont.appendChild(det);
      }
      cont.appendChild(h("p", { class: "chica" }, t("p5_privado")));
      cont.appendChild(h("div", { class: "acciones" }, enlaceSalir("enlace")));
    }
    titulo(); preguntar();
    return { nodo: h("section", { class: "pantalla" }, cabecera(), tit, cont), titulo: tit.textContent };
  };

  // ---------- P6 · Tu cuarto ----------
  P.p6 = function (cola) {
    var g = N.almacen.leer();
    if (!g || !g.senales.length) { history.replaceState(null, "", location.pathname + location.search + "#p1a"); return P.p1a(); }   // vacío: la pantalla no aparece
    var propio = /propio/.test(cola || "");
    var ult = g.senales[g.senales.length - 1], dias = N.diasEntre(ult.creada, st.hoy);
    var cont = h("div", {});
    function guardar() { g.visto = st.hoy; N.almacen.escribir(g); }
    function tarjeta(s) {
      var caja = h("div", { class: "bloque", style: "border-width:0;padding:0" });
      var nota = h("p", { class: "nota", aria: { live: "polite" } });
      var cuenta = h("p", { class: "contador" }, t("p6_veces", { n: s.veces || 0 }));
      var detalle = h("div", { class: "bloque", hidden: true }, h("p", {}, t("p6_noPude")),
        h("p", {}, h("b", {}, t("p5_planB") + ": "), s.plan_b || (LANG === "es" ? F.plan_b.es : t("p3_planBEjemplo"))));
      var acc = h("div", { class: "fila3" });
      function botones3() {
        acc.textContent = "";
        [["p6_sigue", function () { guardar(); N.salir(); }],
         ["p6_movi", function () { cargarSenal(s); go("p1a"); }],
         ["p6_sola", function () { s.estado = "sola"; guardar(); acc.textContent = ""; nota.textContent = ""; caja.insertBefore(h("div", { class: "bloque" }, h("p", {}, t("p5_soloTuya"))), caja.children[1]); caja.appendChild(enlaceSalir("btn")); }]
        ].forEach(function (b) { acc.appendChild(h("button", { class: "btn sec", type: "button", style: "min-height:56px;font-size:15px", on: { click: b[1] } }, t(b[0]))); });
      }
      botones3();
      caja.appendChild(h("div", { class: "tarj-cuarto" }, t("p6_card", { x: s.cuando })));
      caja.appendChild(acc);
      if (propio) {
        caja.appendChild(h("div", { class: "fila3" },
          h("button", { class: "btn", type: "button", on: { click: function () { s.veces = (s.veces || 0) + 1; guardar(); cuenta.textContent = t("p6_veces", { n: s.veces }); nota.textContent = t("p6_anotado"); detalle.hidden = true; } } }, t("p6_hice")),
          h("button", { class: "btn sec", type: "button", on: { click: function () { detalle.hidden = false; nota.textContent = ""; } } }, t("p6_nopude")),
          h("button", { class: "btn sec", type: "button", on: { click: function () { nota.textContent = t("p6_anotado"); detalle.hidden = true; } } }, t("p6_hoyno"))));
        caja.appendChild(cuenta); caja.appendChild(detalle); caja.appendChild(nota);
        caja.appendChild(h("p", { class: "chica" }, t("p6_nota")));
      }
      return caja;
    }
    g.senales.forEach(function (s) { cont.appendChild(tarjeta(s)); });
    var borrar = h("button", { class: "btn sec", type: "button", on: { click: function () { N.almacen.borrar(); N.reiniciar(); go("p1a"); N.vivo(t("p6_borrado")); } } }, t("p6_borrar"));
    var nodo = h("section", { class: "pantalla" }, cabecera(), h("h1", {}, dias > 7 ? t("p6_titVuelta") : t("p6_tit")), cont,
      h("div", { class: "acciones" }, borrar, enlaceSalir("enlace")));
    return { nodo: nodo, titulo: t("tuCuarto") };
  };

  // ---------- P7 · Pausa de entrada de Eat (descrita, no construida) ----------
  P.p7 = function () {
    return { nodo: h("section", { class: "pantalla" }, cabecera(), h("h1", {}, t("p7_titulo")), h("span", { class: "etq" }, t("mapa_estado").descrita),
      h("div", { class: "bloque" }, h("p", {}, t("p7_txt"))), h("p", { class: "nota" }, t("p7_botones")), enlaceP9(), enlaceSalir()), titulo: t("p7_titulo") };
  };

  // ---------- P8a y P8b · Puerta de seguridad ----------
  function puerta(tipo) {
    var crisis = tipo === "crisis", lista = h("div", { class: "panelito", hidden: true });
    var btnOtras = h("button", { class: "btn sec", type: "button", aria: { expanded: "false" }, on: { click: function () {
      lista.hidden = !lista.hidden; btnOtras.setAttribute("aria-expanded", lista.hidden ? "false" : "true"); } } }, t("p8_otras"));
    lista.appendChild(h("p", { style: "font-weight:600;margin:0" }, t("p8_otrasTit")));
    lista.appendChild(h("ul", { class: "sin" }, N.D.PUERTAS.map(function (d) {
      return h("li", {}, d[LANG], d.id === "sleep" ? "" : " ", d.id === "sleep" ? null : h("span", { class: "etq" }, t("maqueta")));
    })));
    lista.appendChild(h("p", { class: "nota", style: "margin:0" }, t("p8_soloSleep")));
    var texto = crisis ? [t("p8a"), h("a", { href: "https://findahelpline.com", rel: "noopener noreferrer" }, "findahelpline.com")]
                       : [t("p8b"), h("a", { href: "https://findahelpline.com", rel: "noopener noreferrer" }, "findahelpline.com"), ". " + t("p8b_fin")];
    return { nodo: h("section", { class: "pantalla" }, cabecera(), h("h1", {}, t(crisis ? "p8a_t" : "p8b_t")),
      h("div", { class: "seguridad", role: "region", aria: { label: t(crisis ? "p8a_t" : "p8b_t") } }, texto),
      h("div", { class: "acciones" }, btnOtras, lista, enlaceSalir("btn"))), titulo: t("p8a_t") };
  }
  P.p8a = function () { return puerta("crisis"); };
  P.p8b = function () { return puerta("restriccion"); };
})(window);
