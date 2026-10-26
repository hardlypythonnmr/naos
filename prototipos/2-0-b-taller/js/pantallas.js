/* pantallas.js · P8 La regla de hoy, P1 Llegada, P2 Juega, P3 Después, P4 Tuya, P7 La obstrucción de hoy, P9 Cierre (brief A.3).
   Ninguna pantalla nombra un mecanismo: el texto habla de la tarea. Las líneas de Cella son fijas, escritas por personas (ninguna IA). */
(function () {
  "use strict";
  var N = window.TALLER, h = N.h, t = N.t, L = N.L, st = N.st, S = N.S, R = N.R;

  /* ---------- piezas comunes ---------- */
  function chip(txt, pressed, fn, extra) {
    return h("button", { type: "button", class: "chip" + (extra ? " " + extra : ""), "aria-pressed": pressed == null ? null : String(!!pressed), onclick: fn }, txt);
  }
  function btn(txt, fn, cls, attrs) { var a = { type: "button", class: "btn" + (cls ? " " + cls : ""), onclick: fn }; for (var k in attrs || {}) a[k] = attrs[k]; return h("button", a, txt); }
  function tamLabel(r, id) { var x = r.tamanos.filter(function (z) { return z.id === id; })[0]; return x ? (id === "0" ? cero(r) : L(x)) : ""; }
  function cero(r) { var s = S(r.id); return (s.silla === "no" && r.cero_sin_silla) ? L(r.cero_sin_silla) : L(r.cero); }
  function partes(r) { var f = L(r.frase), i = f.indexOf(", "); return { cuando: f.slice(0, i), gesto: f.slice(i + 2) }; }
  function topeLabel(r) { var x = r.tamanos.filter(function (z) { return z.tope; })[0]; return x ? L(x) : ""; }
  function topeActivo(id) { var s = S(id); return !!(s.tope_hasta && N.hoy() < s.tope_hasta); }
  function marcado(id) {
    var r = R(id), s = S(id), m = s.tamano || r.defecto;
    if (topeActivo(id) && (m === "3" || m === "5")) m = "1";
    return m;
  }
  function lcPrimera(s) { return N.lc(s); }
  function almacenAviso() { return N.almacenOk ? null : h("p", { class: "nota" }, t("sin_almacen")); }
  N.pantallasUtil = { chip: chip, btn: btn, tamLabel: tamLabel, partes: partes, marcado: marcado, topeActivo: topeActivo, cero: cero, topeLabel: topeLabel };

  /* ---------- entrada ---------- */
  function semanaIdx() { return Math.floor(N.entre("2026-11-02", N.hoy()) / 7); }
  function alternaObstruccion() { var i = semanaIdx(); return i >= 2 && (i - 2) % 2 === 0; }
  N.porRepasar = function () {
    var s = st(), id = s.actual; if (!id) return null;
    var x = s.reglas[id]; if (!x || !x.cuando || !x.guardada) return null;
    var n = N.entre(x.guardada, N.hoy()); return n >= 2 ? { id: id, dias: n } : null;
  };
  N.entrada = function () {
    var p = N.params, s = st(), pu = p.get("puerta"), src = p.get("src");
    if (p.get("vista") === "obstruccion") { if (pu && R(pu)) N.ctx.regla = pu; return "obs"; }
    if (pu && R(pu)) return "r/" + pu;
    if (src) {
      var m = /^story-(\d{4})(\d{2})(\d{2})$/.exec(src), rid = N.reglaDeHoy(m ? m[1] + "-" + m[2] + "-" + m[3] : N.hoy());
      return "r/" + rid;
    }
    if (s.sin_ayudas && s.actual) return "r/" + s.actual;
    if (N.FASE && s.ayudas.tarjeta && !s.sin_ayudas && N.porRepasar()) return "repaso";
    if (s.actual && s.reglas[s.actual] && s.reglas[s.actual].cuando) return "r/" + s.actual;
    if (alternaObstruccion() && R(N.reglaDeHoy(N.hoy())).obstrucciones.length) return "obs";
    return "hoy";
  };

  /* ---------- P8 · La regla de hoy ---------- */
  var previo = null;
  N.ruta("hoy", function () {
    var s = st(), fecha = N.hoy(), id = N.reglaDeHoy(fecha), r = R(id);
    N.tema(r); N.ctx.regla = id; N.ctx.tamano = null; N.ctx.despues = null;
    if (!s.ultimo_abre || s.ultimo_abre !== fecha) { /* abre se emite una vez al día */ }
    N.ev("abre", { puerta: id, src: N.params.get("src") || "bio", regreso: N.regreso(), vista: "regla" });
    s.ultima_visita = fecha; N.guardar();
    var fr = partes(r), ayer = N.sumar(fecha, -1), idAyer = N.D.rotacion.dias[ayer];
    var boton8 = btn(t("juegala"), function () { N.ir("r/" + id); }, "grande");
    var tarjeta = h("div", { class: "tarjeta-hoy" },
      h("p", { class: "rotulo" }, N.rotulo(fecha)),
      h("h1", { class: "frase" }, h("span", { class: "cuando" }, fr.cuando + ","), " ", h("span", { class: "gesto" }, fr.gesto)),
      h("p", { class: "seguro", "data-siempre": "1" }, L(r.cuando_no.visible)));
    var banco = h("div", { class: "col-b" }, h("div", { class: "escena" }, N.objeto(r.objeto), N.cella(88, "al-lado")), boton8);
    var filas = h("div", { class: "fila-enlaces" },
      h("button", { type: "button", class: "enlace grande-t", onclick: function () { abrirAyer(idAyer, ayer); } }, t("ayer")),
      r.obstrucciones.length ? h("a", { class: "enlace grande-t", href: "#obs" }, t("obs_hoy")) : null);
    var gris = (N.FASE && s.recuerdos.filter(function (x) { return x.cubo === "alta"; }).length >= 3)
      ? h("a", { class: "gris", href: "#apoyos" }, t("quitar_gris")) : null;
    var pieza = h("details", { class: "proto-pieza" }, h("summary", null, t("entrar_pieza"), " ", h("span", { class: "etq" }, t("solo_proto"))),
      h("div", { class: "chips" }, N.reglas.map(function (x) { return h("a", { class: "chip", href: "?puerta=" + x.id + "&src=pieza" + (N.params.get("fase") ? "&fase=1" : "") + (N.LANG === "es" ? "" : "") }, L(x.nombre)); })));
    banco.appendChild(filas);
    var cont = h("div", { class: "cols" }, h("div", { class: "col-a" }, tarjeta), banco);
    var extra = [gris, almacenAviso(), pieza];
    var nodo = N.pantalla("p8", [cont, extra], { sinHoy: true });
    nodo.dataset.titulo = "Today";
    // barrido de 700 ms: la regla de ayer entra al cajón (solo si se movió la fecha)
    if (previo && previo.fecha !== fecha && !N.RM()) {
      var fantasma = h("div", { class: "fantasma", "aria-hidden": "true" }, previo.texto);
      requestAnimationFrame(function () { tarjeta.appendChild(fantasma); setTimeout(function () { fantasma.remove(); }, 760); });
      tarjeta.classList.add("barrido");
    }
    previo = { fecha: fecha, texto: L(r.frase) };
    return nodo;
  });

  function abrirAyer(idAyer, ayer) {
    var cuerpo = h("div", { class: "ayer" });
    if (!idAyer) { cuerpo.appendChild(h("p", null, t("ayer_sin"))); N.hoja(t("ayer"), cuerpo); return; }
    var r = R(idAyer), hoja;
    if (!N.FASE) {
      cuerpo.appendChild(h("p", { class: "frase-chica" }, L(r.frase)));
      cuerpo.appendChild(btn(t("hazla_ahora"), function () { hoja.cerrar(); N.ir("r/" + idAyer); }));
    } else {
      // con ?fase=1: el hueco de ayer, escribir antes de revelar
      var p = partes(r), campo = h("textarea", { rows: "2", maxlength: "120", "aria-label": t("p5_campo"), class: "campo" });
      var rev = h("div", { class: "revela", hidden: true }, h("p", { class: "frase-chica" }, L(r.frase)), btn(t("hazla_ahora"), function () { hoja.cerrar(); N.ir("r/" + idAyer); }));
      var mostrar = btn(t("p5_muestrame"), function () { rev.hidden = false; mostrar.hidden = true; campo.disabled = true; });
      cuerpo.appendChild(h("p", { class: "frase-chica" }, t("ayer_hueco") + " " + L(r.hueco)));
      cuerpo.appendChild(campo); cuerpo.appendChild(mostrar); cuerpo.appendChild(rev);
      void p;
    }
    hoja = N.hoja(t("ayer"), cuerpo);
  }

  /* ---------- P1 · Llegada ---------- */
  N.ruta("r", function (arg) {
    var id = R(arg) ? arg : N.reglaDeHoy(N.hoy()), r = R(id), s = S(id), g = st();
    N.tema(r); N.ctx.regla = id; N.ctx.despues = null; N.ctx.descanso = false;
    g.actual = id; g.ultima_visita = N.hoy(); N.guardar();
    var tam = marcado(id); N.ctx.tamano = tam;
    var viene = N.params.get("src") || N.params.get("puerta");
    N.ev("abre", { puerta: id, src: N.params.get("src") || (N.params.get("puerta") ? "pieza" : "app"), regreso: N.regreso(), vista: "regla" });
    var fr = partes(r), propio = s.cuando || fr.cuando;
    var cab = h("h1", { class: "frase partida" }, h("span", { class: "cuando" }, propio + ","), " ", h("span", { class: "gesto" }, fr.gesto));
    var boton = btn("", function () { s.cambio && (s.cambio.visto = true); N.guardar(); N.ir("juega"); }, "grande");
    var linea = h("p", { class: "nota tope" });
    var grupo = h("div", { class: "chips tamanos", role: "group", "aria-label": t("tamanos") });
    function pinta() {
      boton.textContent = t("hazla", { x: lcPrimera(tamLabel(r, N.ctx.tamano)) });
      [].forEach.call(grupo.children, function (c) { c.setAttribute("aria-pressed", String(c.dataset.id === N.ctx.tamano)); });
      linea.textContent = topeActivo(id) ? t("tope_por_ahora") : t("es_el_tope", { x: topeLabel(r) });
    }
    r.tamanos.forEach(function (x) {
      var lim = topeActivo(id) && (x.id === "3" || x.id === "5");
      var c = h("button", { type: "button", class: "chip", "data-id": x.id, "aria-pressed": "false", disabled: lim ? true : null, onclick: function () {
        N.ctx.tamano = x.id; s.tamano = x.id; if (s.cambio) s.cambio.visto = true; N.guardar(); pinta(); var l = document.getElementById("hoy-te-toca"); if (l) l.hidden = true; } }, x.id === "0" ? cero(r) : L(x));
      grupo.appendChild(c);
    });
    pinta();
    var cambio = (s.cambio && !s.cambio.visto && !N.opaca("o2"))
      ? h("p", { id: "hoy-te-toca", class: "nota fuerte" }, t("hoy_te_toca", { x: tamLabel(r, s.cambio.a) })) : null;
    var deLaPieza = (viene && !N.opaca("o3")) ? h("p", { class: "nota pieza" }, t("de_la_pieza")) : null;
    var seguro = h("div", { class: "seguro-bloque" },
      h("p", { class: "seguro", "data-siempre": "1" }, L(r.cuando_no.visible)),
      h("button", { type: "button", class: "enlace", onclick: function () { abrirAntes(r); } }, t("antes")));
    var solo = h("a", { class: "enlace grande-t", href: N.ROOT + (N.LANG === "es" ? "es/index.html" : "index.html") }, t("solo_hazla"));
    var nodo = N.pantalla("p1", [N.puntos(1, 4),
      h("div", { class: "cols" },
        h("div", { class: "col-a" }, cab, h("div", { class: "escena" }, N.objeto(r.objeto), N.cella(96, "al-lado"))),
        h("div", { class: "col-b" }, cambio, h("div", { class: "controles" }, grupo, linea, deLaPieza, boton, solo), seguro,
          r.publicar === false ? h("p", { class: "provisional" }, t("provisional")) : null, almacenAviso()))]);
    nodo.dataset.titulo = L(r.nombre);
    return nodo;
  });

  function abrirAntes(r) {
    var hj, cuerpo = h("div", null,
      h("p", null, L(r.antes_de_empezar)), h("p", null, L(r.cuando_no.toque)),
      btn(t("entendido"), function () { hj.cerrar(); }, "sec"));
    hj = N.hoja(t("antes_titulo"), cuerpo);
  }

  /* ---------- P2 · Juega ---------- */
  N.ruta("juega", function () {
    var id = N.reglaActiva(), r = R(id), s = S(id), g = st();
    N.tema(r);
    var tam = N.ctx.tamano || marcado(id); N.ctx.tamano = tam;
    var td = r.tamanos.filter(function (x) { return x.id === tam; })[0], ciclos = td.ciclos;
    if (s.cambio) s.cambio.visto = true;
    var cuerpo = h("div", { class: "juega" });
    var nodo = N.pantalla("p2", [N.puntos(2, 4), cuerpo]);
    nodo.dataset.titulo = "Play";
    var raf = 0, vivo = true, ayudas = g.ayudas;
    N.alSalir(function () { vivo = false; cancelAnimationFrame(raf); });
    function descansa() { N.ctx.descanso = true; N.ir("despues"); }
    var rest = btn(t("descansar"), descansa, "sec rest");

    function vistaCero() {
      N.ev("juega", { puerta: id, tamano: tam });
      N.pon(cuerpo, 
        h("p", { class: "nota" }, L(r.antes_de_empezar)),
        h("h1", { class: "palabra-cero" }, tam === "0" ? cero(r) : tamLabel(r, tam)),
        h("div", { class: "escena" }, N.objeto(r.objeto), N.cella(80, "al-lado")),
        btn(t("listo"), function () { N.ir("despues"); }, "grande"), rest);
    }
    if (tam === "0") { vistaCero(); return nodo; }

    // ---- antes: la tarea, la oferta de sonido (una vez) y Empezar ----
    var ofertaBox = null;
    function sonidoOferta() {
      if (g.sonido.ofrecido || !ayudas.sonido || g.sin_ayudas) return null;
      ofertaBox = h("div", { class: "oferta", role: "group", "aria-label": t("sonido_oferta") },
        h("p", { class: "oferta-t" }, t("sonido_oferta")),
        h("div", { class: "chips dos" },
          chip(t("si"), false, function () { elige(true); }), chip(t("no"), true, function () { elige(false); })));
      function elige(v) {
        g.sonido.ofrecido = true; g.sonido.activo = v; N.guardar();
        N.pon(ofertaBox, h("p", { class: "oferta-t" }, v ? t("si") + " · " + t("sonido_oferta") : t("no")));
        if (v) N.audioIniciar();
      }
      return ofertaBox;
    }
    function antes() {
      N.pon(cuerpo, 
        h("h1", { class: "sr" }, L(r.nombre)),
        h("p", { class: "tarea" }, L(r.antes_de_empezar)),
        r.modo === "ciclos" ? h("p", { class: "nota" }, t("telefono_mesa")) : null,
        h("div", { class: "escena" }, N.objeto(r.objeto), N.cella(80, "al-lado")),
        sonidoOferta(), btn(t("empezar"), arranca, "grande"), rest);
    }
    antes();

    function dotsEl() {
      var d = h("div", { class: "puntos-ciclo" }); var ps = [];
      for (var i = 0; i < ciclos; i++) ps.push(h("span", { class: "pc" })); 
      ps.forEach(function (p) { d.appendChild(p); });
      if (tam === "5" || td.tope) d.appendChild(h("span", { class: "paro" }, t("paro")));
      d.ps = ps; return d;
    }

    function arranca() {
      if (r.modo === "pasos") return pasos();
      ciclosModo();
    }

    /* ---- pasos: una frase por pantalla, sin anillo ni tiempos ---- */
    function pasos() {
      N.ev("juega", { puerta: id, tamano: tam });
      var i = 0, txt = h("p", { class: "paso-t", "aria-live": "off" }), barra = h("div", { class: "barra-prog", role: "progressbar", "aria-label": t("progreso_pasos"), "aria-valuemin": "0", "aria-valuemax": String(r.pasos.length), "aria-valuenow": "0" }, h("span", { class: "relleno" }));
      var fin = h("p", { class: "nota fin" });
      var sig = btn("", function () { if (i < r.pasos.length - 1) { i++; pintaP(); } else N.ir("despues"); }, "grande");
      function pintaP() {
        txt.textContent = L(r.pasos[i]);
        var ultimo = i === r.pasos.length - 1;
        sig.textContent = ultimo ? t("listo") : t("siguiente");
        fin.textContent = ultimo && r.fin && r.fin[tam] ? L(r.fin[tam]) : "";
        barra.setAttribute("aria-valuenow", String(i + 1)); barra.firstChild.style.width = ((i + 1) / r.pasos.length * 100) + "%";
        N.vivo(txt.textContent + (fin.textContent ? ". " + fin.textContent : ""));
      }
      N.pon(cuerpo, 
        h("div", { class: "escena" }, N.objeto(r.objeto), N.cella(88, "al-lado")),
        ayudas.cella ? h("p", { class: "voz" }, L(r.cella.empieza)) : null,
        h("h1", { class: "paso-h" }, txt), fin, barra, sig, rest);
      pintaP();
    }

    /* ---- ciclos: anillo de cuatro tiempos, palabra grande, puntos sin número, sonido opcional ---- */
    function ciclosModo() {
      var libre = g.ritmo === "libre", dur = libre ? null : (r.ritmo_ms[g.ritmo] || 1000), total = dur ? dur * 4 : 0;
      var quieto = N.RM() || !ayudas.anillo;
      var CIRC = 2 * Math.PI * 130;
      var palabra = h("div", { class: "palabra", "aria-hidden": "true" }, h("span", null, t("lista")));
      var anillo = h("div", { class: "anillo" + (quieto ? " es-barra" : ""), "aria-hidden": "true" });
      anillo.innerHTML = '<svg viewBox="0 0 300 300" width="300" height="300" focusable="false"><circle cx="150" cy="150" r="130" class="pista"></circle>' +
        '<circle cx="150" cy="150" r="130" class="arco" stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="' + CIRC.toFixed(1) + '" transform="rotate(-90 150 150)"></circle></svg>';
      anillo.appendChild(palabra);
      var arco = anillo.querySelector(".arco");
      var barra = h("div", { class: "barra-prog barra-ciclo" + (quieto ? " visible" : ""), role: "progressbar", "aria-label": t("progreso_ciclo"), "aria-valuemin": "0", "aria-valuemax": "4", "aria-valuenow": "0" }, h("span", { class: "relleno" }));
      var puntos = dotsEl(), cellaEl = N.cella(72, "centro"), voz = h("p", { class: "voz" }, ayudas.cella ? L(r.cella.empieza) : "");
      var hecho = h("button", { type: "button", class: "btn grande", hidden: !libre, onclick: function () { cierraCiclo(); } }, t("listo"));
      if (N.sonidoActivo()) N.audioIniciar();
      N.ev("juega", { puerta: id, tamano: tam });
      N.pon(cuerpo, cellaEl, voz, anillo, barra, puntos, hecho, rest);
      var fase = "prep", t0 = performance.now(), cicloN = 0, beatPrev = -1, dir = r.id === "breathe" ? -1 : 1;
      function cierraCiclo() {
        if (puntos.ps[cicloN]) puntos.ps[cicloN].classList.add("lleno");
        cicloN++; N.vivo(t("ciclo_listo", { n: cicloN }));
        if (cicloN >= ciclos) { fase = "fin"; setTimeout(function () { if (vivo) N.ir("despues"); }, quieto ? 300 : 700); }
      }
      function setProg(frac, beat) {
        arco.setAttribute("stroke-dashoffset", (CIRC * (1 - frac)).toFixed(1));
        barra.firstChild.style.width = (frac * 100) + "%"; barra.setAttribute("aria-valuenow", String(Math.min(4, beat)));
      }
      if (libre) { // sin tempo: la persona cierra cada vuelta con Listo
        fase = "libre"; pon(palabra, L(r.libre_palabra)); setProg(0, 0); N.vivo(L(r.libre_palabra));
        return;
      }
      function paso(ts) {
        if (!vivo) return;
        var now = performance.now(), el = now - t0;
        if (fase === "prep") {
          if (el >= 3000) { fase = "corre"; t0 = now; el = 0; } else { raf = requestAnimationFrame(paso); return; }
        }
        if (fase === "corre") {
          var cyc = Math.floor(el / total);
          while (cicloN < cyc && fase === "corre") cierraCiclo();
          if (fase === "corre") {
            var enC = el - cyc * total, beat = Math.floor(enC / dur), frac = enC / total;
            if (beat !== beatPrev) {
              beatPrev = beat; var cp = r.compases[beat];
              pon(palabra, L(cp));
              var ant = r.compases[beat - 1], igual = ant && L(ant) === L(cp);
              N.vivo(L(cp) + (igual ? ", " + t("de_nuevo") : ""));
              if (N.sonidoActivo()) N.tono(cp.tono === "g" ? 196 : 392);
            }
            setProg(frac, beat + 1);
            if (!quieto) {
              var f2 = frac < 0.5 ? frac / 0.5 : 1 - (frac - 0.5) / 0.5, e = f2 * f2 * (3 - 2 * f2);
              N.cellaMover(cellaEl, dir * 16 * e);
            }
          }
        }
        if (fase !== "fin") raf = requestAnimationFrame(paso);
      }
      pon(palabra, t("lista")); N.vivo(t("lista") + ". " + (voz.textContent || ""));
      raf = requestAnimationFrame(paso);
    }
    return nodo;
  });

  // ajusta la palabra grande al ancho del anillo (96 px o más cuando cabe; el hueco útil es el 74 % del diámetro)
  function fit(el) {
    var span = el.firstChild && el.firstChild.nodeType === 1 ? el.firstChild : null;
    if (!span) return;
    var disp = el.parentNode ? el.parentNode.clientWidth * 0.74 : 230, sz = 112;
    el.style.fontSize = sz + "px";
    while (span.getBoundingClientRect().width > disp && sz > 48) { sz -= 2; el.style.fontSize = sz + "px"; }
  }
  function pon(el, txt) { el.textContent = ""; el.appendChild(h("span", null, txt)); fit(el); }

  /* ---------- P3 · Después ---------- */
  function menor(x) { return { "5": "3", "3": "1" }[x] || null; }
  function trinquete(id) {
    var s = S(id), hh = st().historial.filter(function (x) { return x.regla === id; }).slice(-2);
    if (hh.length < 2) return;
    var malo = function (x) { return x.despues === "no" || x.despues === "medias"; };
    if (malo(hh[0]) && malo(hh[1]) && hh[0].tamano === hh[1].tamano) {
      var m = menor(hh[1].tamano);
      if (m) { s.cambio = { de: hh[1].tamano, a: m, d: N.hoy(), respuesta: hh[1].despues, visto: false }; s.tamano = m; }   // solo baja, nunca sube
    }
  }
  N.ruta("despues", function () {
    var id = N.reglaActiva(), r = R(id), s = S(id), g = st(), ctx = N.ctx;
    N.tema(r);
    var vista = h("div", { class: "despues" });
    var nodo = N.pantalla("p3", [N.puntos(3, 4), h("h1", { class: "sr" }, t("despues")), vista]);
    nodo.dataset.titulo = "After";
    var tam = ctx.tamano || marcado(id);
    function registra(res) {
      ctx.despues = res; g.historial.push({ d: N.hoy(), regla: id, tamano: tam, despues: res });
      s.ultimo = res; trinquete(id); N.guardar(); N.ev("despues", { puerta: id, despues: res });
    }
    var voz = function (k) { return (g.ayudas.cella) ? h("p", { class: "voz grande-voz" }, L(r.cella[k])) : null; };
    function pares() {
      return h("div", { class: "par" }, btn(t("otra_vez"), function () { N.ir("r/" + id); }, "sec"), btn(t("cerrar_hoy"), function () { N.ir("cierre"); }, "sec"));
    }
    function vistaA() {
      N.pon(vista, 
        h("div", { class: "chips tres", role: "group", "aria-label": t("despues") },
          chip(t("salio"), false, function () { registra("salio"); vistaRes("salio"); }),
          chip(t("medias"), false, function () { registra("medias"); vistaRes("medias"); }),
          chip(t("hoy_no"), false, function () { vistaNo(); })),
        h("div", { class: "escena" }, N.objeto(r.objeto), N.cella(80, "al-lado")),
        h("button", { type: "button", class: "enlace grande-t", onclick: function () { N.ir("cierre"); } }, t("saltar")));
    }
    function vistaRes(res) {
      var sug = s.cambio && !s.cambio.visto && res !== "salio" && !N.opaca("o2") ? h("p", { class: "nota" }, t("tamano_nuevo", { x: tamLabel(r, s.cambio.a) })) : null;
      N.pon(vista, 
        h("div", { class: "escena" }, N.objeto(r.objeto), N.cella(80, "al-lado")), voz(res), sug,
        !s.cuando ? btn(t("hazla_tuya"), function () { N.ir("tuya"); }, "grande") : null, pares());
    }
    function vistaNo() {
      // la línea de Cella pregunta; los motivos son chips; "Me dolió o me mareé" no se registra
      var motivos = [L(r.motivo1), t("m_pereza"), t("m_gente"), t("m_dolor"), t("m_otra")];
      N.pon(vista, voz("no"),
        h("h2", { class: "sub" }, t("que_se_interpuso")),
        h("div", { class: "chips col", role: "group", "aria-label": t("que_se_interpuso") }, motivos.map(function (m, i) {
          return chip(m, false, function () { i === 3 ? vistaMareo() : (registra("no"), vistaSugerencia(i)); });
        })));
    }
    function vistaMareo() {
      // solo se guarda tope_hasta (7 días); sin evento, sin historial, sin motivo
      s.tope_hasta = N.sumar(N.hoy(), 7); s.tamano = "1"; N.guardar();
      N.pon(vista, h("p", { class: "voz grande-voz" }, L(r.cella.mareo)), h("p", { class: "nota" }, L(r.cuando_no.toque)),
        btn(t("cerrar_hoy"), function () { N.ir("cierre"); }, "grande"));
    }
    function vistaSugerencia() {
      var pie = h("p", { class: "nota" });
      N.pon(vista, h("h2", { class: "sub" }, t("ajustamos")),
        h("div", { class: "chips col" },
          chip(t("mas_chico"), false, function () {
            var cur = S(id).tamano || tam, m = menor(cur) || (cur === "1" ? "0" : "0");
            s.tamano = m; N.guardar(); pie.textContent = t("tamano_nuevo", { x: tamLabel(r, m) });
          }),
          chip(t("cambiar_cuando"), false, function () { N.ir("tuya"); })),
        pie, pares());
    }
    if (ctx.despues && ctx.despues !== "no") vistaRes(ctx.despues); else vistaA();
    return nodo;
  });

  /* ---------- P4 · Tuya ---------- */
  function sinWhen(txt) { return txt.replace(/^\s*(when|cuando)\s+/i, "").replace(/[.,;:]+\s*$/, ""); }
  function conWhen(txt) { var x = txt.trim().replace(/[.,;:]+\s*$/, ""); return /^(when|cuando)\b/i.test(x) ? x : (N.LANG === "es" ? "Cuando " : "When ") + x; }
  N.lectura = function (r, s) {
    var w = N.lc(s.cuando), d = L(r.devuelve), k = { oigo: "rb_oigo", veo: "rb_veo", hago: "rb_hago" }[s.tipo] || "rb_solo";
    return t(k, { w: w, d: d });
  };
  N.ruta("tuya", function () {
    var id = N.reglaActiva(), r = R(id), s = S(id), g = st();
    N.tema(r);
    var ya = !!s.cuando, fr = partes(r), form = { cuando: s.cuando ? s.cuando : "", tipo: s.tipo || null, silla: s.silla || null }, avisadoHora = false;
    var vista = h("div", { class: "tuya" });
    var nodo = N.pantalla("p4", [N.puntos(4, 4), h("h1", { class: "sr" }, t("tuya_titulo")), vista]);
    nodo.dataset.titulo = "Yours";

    function tarjeta(c) {
      var vacio = g.ayudas.tarjeta ? L(r.hueco).split(",")[0].replace(/_+/, "____") : fr.cuando;
      return h("div", { class: "tarjeta" }, h("p", { class: "frase-chica" }, h("span", { class: "cuando" }, (c || vacio) + ","), " ", h("span", { class: "gesto" }, fr.gesto)));
    }
    function formulario() {
      var campo = h("input", { type: "text", class: "campo", maxlength: "60", id: "cuando-libre", value: form.cuando ? sinWhen(form.cuando) : "", autocomplete: "off", spellcheck: "false", enterkeyhint: "done" });
      var vistaT = tarjeta(form.cuando || null), cont = vistaT.querySelector(".cuando");
      var anclas = h("div", { class: "chips col", role: "group", "aria-label": t("tu_cuando") });
      var tipos = h("div", { class: "chips tres", role: "group", "aria-label": t("tipo_senal") });
      var aviso = h("p", { class: "voz grande-voz", hidden: true, role: "status" });
      function pinta() {
        [].forEach.call(anclas.children, function (c, i) { c.setAttribute("aria-pressed", String(form.cuando === L(r.cuando.anclas[i]))); });
        [].forEach.call(tipos.children, function (c) { c.setAttribute("aria-pressed", String(form.tipo === c.dataset.tipo)); });
        cont.textContent = (form.cuando ? form.cuando : (g.ayudas.tarjeta ? L(r.hueco).split(",")[0] : fr.cuando)) + ",";
      }
      r.cuando.anclas.forEach(function (a) {
        anclas.appendChild(chip(L(a), false, function () { form.cuando = L(a); form.tipo = a.tipo; campo.value = sinWhen(L(a)); avisadoHora = false; aviso.hidden = true; pinta(); }));
      });
      r.cuando.tipos.forEach(function (k) { var c = chip(t("t_" + k), false, function () { form.tipo = k; pinta(); }); c.dataset.tipo = k; tipos.appendChild(c); });
      campo.addEventListener("input", function () { form.cuando = campo.value.trim() ? conWhen(campo.value) : ""; avisadoHora = false; aviso.hidden = true; pinta(); });
      var silla = null;
      if (r.id === "move") {
        silla = h("div", { class: "bloque" }, h("p", { class: "etiqueta" }, t("silla_pregunta")),
          h("div", { class: "chips tres", role: "group", "aria-label": t("silla_pregunta") }, [["dos-pasos", "s_dos"], ["lejos", "s_lejos"], ["no", "s_no"]].map(function (x) {
            var c = chip(t(x[1]), form.silla === x[0], function () { form.silla = x[0]; [].forEach.call(c.parentNode.children, function (b) { b.setAttribute("aria-pressed", String(b === c)); }); }); return c; })));
      }
      var guardarBtn = btn(t("llevatela"), function () {
        var txt = form.cuando;
        if (txt && N.esHora(txt) && !avisadoHora) {
          avisadoHora = true; aviso.hidden = false; aviso.textContent = (g.ayudas.cella ? t("rb_hora") : t("rb_hora")); N.vivo(t("rb_hora")); campo.focus(); return;
        }
        guarda(txt);
      }, "grande");
      var saltar = h("button", { type: "button", class: "enlace grande-t", onclick: function () { if (form.cuando && avisadoHora) guarda(form.cuando); else N.ir("cierre"); } }, t("saltar"));
      N.pon(vista, 
        h("div", { class: "bloque" }, vistaT),
        h("div", { class: "bloque" }, h("p", { class: "etiqueta" }, t("tu_cuando")), anclas),
        h("div", { class: "bloque" }, h("p", { class: "etiqueta" }, t("tipo_senal")), tipos),
        h("div", { class: "bloque" }, h("label", { class: "etiqueta", for: "cuando-libre" }, t("linea_libre")), campo, aviso),
        silla,
        h("p", { class: "nota privacidad" }, t("queda_telefono")), guardarBtn, saltar,
        h("a", { class: "enlace", href: "#como" }, t("como_link")));
      pinta();
    }
    function guarda(txt) {
      if (txt) { s.cuando = txt; s.tipo = form.tipo; s.guardada = N.hoy(); }
      if (form.silla) {
        s.silla = form.silla;
        if (form.silla === "no" && r.cero_sin_silla) { g.obstrucciones.planB = L(r.cero_sin_silla); }
      }
      N.guardar(); N.ev("regla", { regla: txt ? (r.cuando.anclas.some(function (a) { return L(a) === txt; }) ? "chip" : "libre") : "chip" });
      guardada();
    }
    function guardada() {
      var fresca = tarjeta(s.cuando || null);
      var voz = (g.ayudas.cella && s.cuando) ? h("p", { class: "voz grande-voz", role: "status" }, N.lectura(r, s)) : null;
      if (voz) N.vivo(voz.textContent);
      N.pon(vista, fresca, h("div", { class: "escena" }, N.objeto(r.objeto), N.cella(80, "al-lado")), voz,
        h("p", { class: "nota privacidad" }, N.almacenOk ? t("guardada_aqui") : t("sin_almacen")),
        btn(t("llevatela"), function () { N.llevatela(id); }, "grande"),
        h("div", { class: "par" }, btn(t("otra_vez"), function () { N.ir("r/" + id); }, "sec"), btn(t("cerrar_hoy"), function () { N.ir("cierre"); }, "sec")));
    }
    formulario();
    return nodo;
  });

  /* ---------- P7 · La obstrucción de hoy ---------- */
  N.ruta("obs", function () {
    var g = st(), pu = N.params.get("puerta"), id = N.ctx.regla && R(N.ctx.regla).obstrucciones.length ? N.ctx.regla : (!N.ctx.regla && pu && R(pu) && R(pu).obstrucciones.length ? pu : (R(N.reglaDeHoy(N.hoy())).obstrucciones.length ? N.reglaDeHoy(N.hoy()) : (g.actual && R(g.actual).obstrucciones.length ? g.actual : "move")));
    var r = R(id), s = S(id); N.tema(r); N.ctx.regla = id;
    var lista = r.obstrucciones, nodo;
    if (!lista.length) {
      nodo = N.pantalla("p7", [h("h1", { class: "frase" }, t("obs_ninguna")), btn(t("volver_regla"), function () { N.ir("r/" + id); }, "grande")]);
      nodo.dataset.titulo = "Obstruction"; return nodo;
    }
    var o = N.O(lista[((N.diaN(N.hoy()) % lista.length) + lista.length) % lista.length]);
    N.ev("abre", { puerta: id, src: "app", regreso: N.regreso(), vista: "obstruccion" });
    var tras5 = g.obstrucciones.hechas >= 5, vista = h("div", { class: "obs" });
    nodo = N.pantalla("p7", [h("h1", { class: "sr" }, t("obs_titulo")), vista]);
    nodo.dataset.titulo = "Obstruction";
    function responde(plan, libre) {
      var antes = g.obstrucciones.planB, ahora = libre || plan;
      g.obstrucciones.hechas++; g.obstrucciones.ultima = o.id;
      if (!/^(Tomorrow|Mañana)$/.test(ahora)) g.obstrucciones.planB = ahora;
      N.guardar(); N.ev("obstruccion", { id: o.id, respondio: true });
      N.pon(vista, 
        h("p", { class: "situacion" }, L(o.situacion)),
        antes ? h("p", { class: "antes-ahora" }, h("span", { class: "etiqueta" }, t("obs_antes")), " ", antes) : null,
        h("p", { class: "antes-ahora" }, h("span", { class: "etiqueta" }, t("obs_ahora")), " ", ahora),
        h("p", { class: "frase-chica" }, t("obs_queda")),
        btn(t("volver_regla"), function () { N.ir("r/" + id); }, "grande"), btn(t("cerrar_hoy"), function () { N.ir("cierre"); }, "sec"));
      N.vivo(t("obs_queda"));
    }
    var libre = h("input", { type: "text", class: "campo", maxlength: "60", id: "obs-libre", autocomplete: "off" });
    N.pon(vista, 
      tras5 ? h("p", { class: "frase" }, t("obs_queda")) : null,
      h("p", { class: tras5 ? "situacion" : "frase" }, L(o.situacion)),
      s.cuando ? h("p", { class: "nota" }, s.cuando) : null,
      h("div", { class: "chips col", role: "group", "aria-label": t("obs_titulo") }, o.planes.map(function (p) { return chip(L(p), false, function () { responde(L(p)); }); })),
      h("div", { class: "bloque" }, h("label", { class: "etiqueta", for: "obs-libre" }, t("obs_libre")), libre,
        btn(t("obs_guardar"), function () { if (libre.value.trim()) responde(null, libre.value.trim()); else libre.focus(); }, "sec")),
      h("button", { type: "button", class: "enlace grande-t", onclick: function () { N.ev("obstruccion", { id: o.id, respondio: false }); N.ir("r/" + id); } }, t("saltar")));
    return nodo;
  });

  /* ---------- P9 · Cierre (1,2 s) ---------- */
  N.ruta("cierre", function () {
    var id = N.reglaActiva(), r = R(id), g = st(), ctx = N.ctx;
    N.tema(r);
    var linea = (g.ayudas.cella) ? (ctx.despues === "salio" ? L(r.cella.salio) : t("tu_regla_aqui")) : "";
    var sil = h("div", { class: "cierre-sil" }, N.objeto(r.objeto));
    var nodo = h("section", { class: "pantalla cierre", "data-titulo": "Close" }, h("h1", { class: "sr" }, t("cerrar_hoy")), sil, linea ? h("p", { class: "voz grande-voz" }, linea) : null);
    if (linea) N.vivo(linea);
    var quieto = N.RM(), tm = [];
    N.alSalir(function () { tm.forEach(clearTimeout); });
    tm.push(setTimeout(function () {
      if (!quieto) { nodo.classList.add("sale"); }
      tm.push(setTimeout(function () { ctx.despues = null; ctx.tamano = null; N.ir("hoy"); }, quieto ? 0 : 240));
    }, quieto ? 1200 : 960));
    return nodo;
  });
})();
