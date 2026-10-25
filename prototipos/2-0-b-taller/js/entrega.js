/* entrega.js · P4b "Llévatela": guardar la tarjeta (canvas 1080 x 1350), mandarla en blanco (navigator.share con respaldo), agendar (.ics local, hora flotante)
   e imprimir la etiqueta (vista con CSS de impresión). Todo en el teléfono: nada sale, no se piden contactos ni se cuentan envíos. */
(function () {
  "use strict";
  var N = window.TALLER, h = N.h, t = N.t, L = N.L, st = N.st, S = N.S, R = N.R, F = N.F;

  function fuentes() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(['300 80px "Newsreader"', '600 40px "IBM Plex Sans Condensed"', '400 28px "IBM Plex Sans"'].map(function (f) { return document.fonts.load(f); })).catch(function () {});
  }
  function envuelve(ctx, texto, ancho) {
    var pal = texto.split(" "), lineas = [], cur = "";
    pal.forEach(function (w) { var p = cur ? cur + " " + w : w; if (ctx.measureText(p).width > ancho && cur) { lineas.push(cur); cur = w; } else cur = p; });
    if (cur) lineas.push(cur); return lineas;
  }
  /* tarjeta en el color de la puerta: la frase con el hueco, Cella quieta, tinta sobre el campo (ningún color nuevo) */
  N.dibujarTarjeta = function (ctx, W, H, r) {
    var campo = r.campo, tinta = r.tinta, esq = W / 1080;
    ctx.fillStyle = campo; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = tinta; ctx.textBaseline = "alphabetic";
    ctx.font = "600 " + Math.round(40 * esq) + 'px "IBM Plex Sans Condensed", sans-serif';
    ctx.fillText(L(r.nombre).toUpperCase(), 80 * esq, 120 * esq);
    var tam = Math.round((W > H ? 76 : 92) * esq);
    ctx.font = "300 " + tam + 'px "Newsreader", Georgia, serif';
    var lineas = envuelve(ctx, L(r.hueco), W - 160 * esq), y = (W > H ? 250 : 330) * esq;
    lineas.forEach(function (ln, i) { ctx.fillText(ln, 80 * esq, y + i * tam * 1.12); });
    var c = (W > H ? 1.0 : 1.9) * esq;
    F.cella(ctx, { estado: "humanity", b: 0.35, s: c, x: (W > H ? W - 400 * esq : 60 * esq) - 54 * c, y: H - 90 * esq - 224 * c, p: { tx: tinta, bg: campo } });
    ctx.font = "400 " + Math.round(30 * esq) + 'px "IBM Plex Sans", sans-serif';
    ctx.fillText("Closer to yourself.", (W > H ? 80 : 80) * esq, H - 60 * esq);
  };
  function lienzo(r, W, H) { var cv = document.createElement("canvas"); cv.width = W; cv.height = H; N.dibujarTarjeta(cv.getContext("2d"), W, H, r); return cv; }

  /* ---------- .ics local ---------- */
  function plegar(linea) {
    var enc = new TextEncoder(), out = [], cur = "", n = 0;
    for (var ch of linea) { var b = enc.encode(ch).length; if (n + b > 73) { out.push(cur); cur = " " + ch; n = 1 + b; } else { cur += ch; n += b; } }
    out.push(cur); return out.join("\r\n");
  }
  function esc(x) { return String(x).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  N.horasIcs = function (r) {
    var out = [], desde = 7 * 60, hasta = r.ics === "diurno" ? 18 * 60 + 30 : 22 * 60;
    for (var m = desde; m <= hasta; m += 30) out.push(("0" + Math.floor(m / 60)).slice(-2) + ":" + ("0" + (m % 60)).slice(-2));
    return out;
  };
  N.armarIcs = function (id, hora, aviso) {
    var r = R(id), s = S(id), sleep = r.ics === "diurno";
    var fr = L(r.frase), cuando = s.cuando || fr.slice(0, fr.indexOf(", "));
    var titulo = sleep ? t("sleep_agenda") : cuando + ", ____";
    var f = N.hoy().replace(/-/g, ""), hh = hora.replace(":", "") + "00";
    var u = new URL(location.href); u.search = "?puerta=" + id + "&src=ics"; u.hash = "";
    var desc = (N.LANG === "es" ? "Tu regla: " : "Your rule: ") + u.href;
    var L2 = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NAOS//Taller prototype//" + N.LANG.toUpperCase(), "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      "UID:" + id + "-" + f + "-" + hh + "@naos-prototipo", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      "DTSTART:" + f + "T" + hh, "DURATION:PT5M", "RRULE:FREQ=WEEKLY", "SUMMARY:" + esc(titulo), "DESCRIPTION:" + esc(desc)];
    if (aviso && !sleep) L2.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + esc(titulo), "TRIGGER:PT0M", "END:VALARM");
    L2.push("END:VEVENT", "END:VCALENDAR");
    return { texto: L2.map(plegar).join("\r\n") + "\r\n", titulo: titulo };
  };
  function bajar(nombre, blob) {
    var u = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  N.bajar = bajar;

  /* ---------- la hoja ---------- */
  N.llevatela = function (id) {
    var r = R(id), s = S(id), hoja, msg = h("p", { class: "nota", role: "status" });
    function fila(txt, fn) { var b = h("button", { type: "button", class: "fila-llev", "aria-expanded": "false" }, txt); b.addEventListener("click", function () { fn(b); }); return b; }
    var panelT = h("div", { class: "panel-llev", hidden: true }), panelM = h("div", { class: "panel-llev", hidden: true }), panelA = h("div", { class: "panel-llev", hidden: true });
    function abre(b, p, otros) { var v = p.hidden; otros.forEach(function (o) { o.p.hidden = true; o.b.setAttribute("aria-expanded", "false"); }); p.hidden = !v; b.setAttribute("aria-expanded", String(v)); msg.textContent = ""; return v; }
    var bT, bM, bA;
    function todos() { return [{ b: bT, p: panelT }, { b: bM, p: panelM }, { b: bA, p: panelA }]; }

    /* guardar la tarjeta (real) */
    bT = fila(t("l_tarjeta"), function (b) {
      if (!abre(b, panelT, todos().filter(function (x) { return x.b !== b; }))) return;
      fuentes().then(function () {
        var cv = lienzo(r, 1080, 1350); cv.className = "mini-tarjeta"; cv.setAttribute("role", "img"); cv.setAttribute("aria-label", L(r.hueco));
        var a = h("button", { type: "button", class: "btn sec", onclick: function () { cv.toBlob(function (bl) { bajar("naos-" + id + "-" + N.LANG + ".png", bl); msg.textContent = t("tarjeta_lista"); }, "image/png"); } }, t("bajar_img"));
        N.pon(panelT, cv, a);
      });
    });
    /* mandársela a alguien (real: share con respaldo; la vista previa es una imagen estática simulada) */
    bM = fila(t("l_mandar"), function (b) {
      if (!abre(b, panelM, todos().filter(function (x) { return x.b !== b; }))) return;
      var u = new URL(location.href); u.search = "?puerta=" + id + "&src=wa"; u.hash = "";
      var texto = t("mandar_texto"), url = u.href;
      var img = h("img", { class: "og", src: "img/og-" + id + "-" + N.LANG + ".png", width: "600", height: "315", alt: L(r.hueco) });
      img.onerror = function () { img.remove(); };
      var campo = h("input", { type: "text", class: "campo", readonly: true, value: texto + " " + url, "aria-label": t("l_mandar"), hidden: true });
      var b2 = h("button", { type: "button", class: "btn sec" }, t("l_mandar"));
      b2.addEventListener("click", function () {
        N.ev("comparte");
        var done = function () { msg.textContent = t("compartido"); };
        var copiar = function () {
          var f = function () { campo.hidden = false; campo.focus(); campo.select(); msg.textContent = t("copiada"); };
          try { navigator.clipboard.writeText(texto + " " + url).then(function () { msg.textContent = t("copiada"); }, f); } catch (e) { f(); }
        };
        if (navigator.share) navigator.share({ text: texto, url: url }).then(done, function (e) { if (e && e.name !== "AbortError") copiar(); }); else copiar();
      });
      N.pon(panelM, h("p", { class: "etiqueta" }, t("vista_wa")), h("div", { class: "wa" }, img, h("p", { class: "wa-t" }, texto)), b2, campo);
    });
    /* agendar (real: .ics local, hora flotante, RRULE semanal) */
    bA = fila(t("l_agenda"), function (b) {
      if (!abre(b, panelA, todos().filter(function (x) { return x.b !== b; }))) return;
      var horas = N.horasIcs(r), sleep = r.ics === "diurno";
      var sel = h("select", { class: "campo", id: "ics-hora", "aria-label": t("hora") }, horas.map(function (x) { return h("option", { value: x }, x); }));
      if (sleep) sel.appendChild(h("option", { value: "" }, t("ninguna")));
      sel.value = sleep ? horas[2] : "17:00";
      var chk = h("input", { type: "checkbox", id: "ics-aviso", disabled: sleep ? true : null });
      var dice = h("p", { class: "nota" });
      var go = h("button", { type: "button", class: "btn sec" }, t("bajar_ics"));
      function pinta() {
        go.disabled = !sel.value; if (!sel.value) { dice.textContent = t("ninguna"); return; }
        dice.textContent = t("evento_dice") + " " + N.armarIcs(id, sel.value, chk.checked).titulo;
      }
      sel.addEventListener("change", pinta); chk.addEventListener("change", pinta);
      go.addEventListener("click", function () {
        if (!sel.value) return;
        var e = N.armarIcs(id, sel.value, chk.checked); N.ultimoIcs = e.texto;
        bajar("naos-" + id + ".ics", new Blob([e.texto], { type: "text/calendar;charset=utf-8" })); N.ev("agenda"); msg.textContent = t("evento_nota");
      });
      N.pon(panelA, h("div", { class: "bloque" }, h("label", { class: "etiqueta", for: "ics-hora" }, t("hora")), sel),
        sleep ? h("p", { class: "nota" }, t("sleep_horas")) : h("label", { class: "casilla", for: "ics-aviso" }, chk, " ", t("aviso")), dice, go);
      pinta();
    });
    var bP = fila(t("l_imprimir"), function () { hoja.cerrar(); N.ir("etiqueta"); });
    hoja = N.hoja(t("llev_titulo"), h("div", { class: "llev" }, bT, panelT, bM, panelM, bA, panelA, bP, msg));
  };

  /* ---------- etiqueta para imprimir: 6 x 3 cm y la tira del respaldo ---------- */
  N.ruta("etiqueta", function () {
    var id = N.reglaActiva(), r = R(id); N.tema(r);
    var gesto = L(r.frase).slice(L(r.frase).indexOf(", ") + 2);
    var nodo = N.pantalla("etiqueta-vista", [
      h("h1", { class: "frase-chica" }, t("etiqueta_titulo")), h("p", { class: "nota" }, t("etiqueta_nota")),
      h("div", { class: "impresion" },
        h("div", { class: "etq-hoja" }, h("p", null, (N.LANG === "es" ? "Cuando ____, " : "When ____, ") + "____.")),
        h("p", { class: "etiqueta noprint-tag" }, t("tira")),
        h("div", { class: "etq-tira" }, h("p", null, L(r.cuando_no.visible)))),
      h("button", { type: "button", class: "btn grande", onclick: function () { window.print(); } }, t("imprimir")),
      h("a", { class: "enlace grande-t", href: "#tuya" }, t("volver_regla"))]);
    void gesto; nodo.dataset.titulo = "Label"; return nodo;
  });
})();
