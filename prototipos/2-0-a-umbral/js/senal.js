/* senal.js · funciones de la fábrica de señales del prototipo (propuesta 3.6, brief A.5).
 * escapar y plegar son las de scripts/construir-ics.mjs, copiadas. No se importa nada de assets/ics/ ni de agenda-comun.js.
 * Todo corre en el navegador: el .ics y la imagen de la etiqueta salen de un blob, nada se envía. */
(function (raiz) {
  "use strict";
  var SITIO = "https://hardlypythonnmr.github.io/naos/";
  var FRANJAS = { manana: "090000", mediodia: "123000", tarde: "160000" };

  // ---- RFC 5545 (copiadas de construir-ics.mjs) ----
  function esc(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n"); }
  // pliega a 75 octetos sin partir un carácter UTF-8; la continuación empieza con un espacio
  function plegar(linea) {
    var out = [], cur = "", n = 0, lim = 75, enc = new TextEncoder();
    for (var ch of linea) {
      var b = enc.encode(ch).length;
      if (n + b > lim) { out.push(cur); cur = " "; n = 1; lim = 75; }
      cur += ch; n += b;
    }
    out.push(cur);
    return out.join("\r\n");
  }

  // ---- fechas (hora flotante, sin Z ni TZID en DTSTART) ----
  function sumarDias(iso, d) { return new Date(Date.parse(iso + "T00:00:00Z") + d * 864e5).toISOString().slice(0, 10); }
  function ymd(iso) { return iso.replace(/-/g, ""); }

  // hash corto y estable (no criptográfico) para el UID
  function hashCorto(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  // ---- fragmento #s= (una palabra por defecto; la frase solo si la persona lo marca) ----
  function codificarFragmento(texto) { return "s=" + encodeURIComponent(texto); }
  function leerFragmento(hash) {
    var m = /(?:^#|&)s=([^&]*)/.exec(hash || "");
    if (!m) return null;
    try { return decodeURIComponent(m[1]); } catch (e) { return null; }
  }

  // ---- las citas de Sleep: dos (día 7 y 28), ninguna el primer día ni de noche ----
  // o = { hoy:"AAAA-MM-DD", franja:"manana|mediodia|tarde", palabra, frase, incluirFrase, lang }
  function citas(o) {
    if (!FRANJAS[o.franja]) throw new Error("franja requerida: ninguna viene elegida");
    var es = o.lang !== "en";
    var contenido = o.incluirFrase && o.frase ? o.frase : o.palabra;
    return [7, 28].map(function (n) {
      var url = SITIO + "?q=" + n + "#" + codificarFragmento(contenido);
      var pregunta = n === 7 ? (es ? "¿Cómo va tu señal?" : "How's your cue going?") : (es ? "¿Sigue sirviendo?" : "Is it still working?");
      var resumen = es ? "NAOS · tu señal" : "NAOS · your cue";
      var desc = (es ? "Cita contigo. Invitado: tú. Se acaba sola. " : "A date with yourself. Guest: you. It ends by itself. ") + pregunta + " " + url;
      return { n: n, url: url, resumen: resumen, descripcion: desc, inicio: ymd(sumarDias(o.hoy, n)) + "T" + FRANJAS[o.franja] };
    });
  }
  // el .ics: hora flotante (sin Z ni TZID en DTSTART), ningún VALARM, ningún ORGANIZER ni ATTENDEE, título neutro
  function construirICS(o) {
    var es = o.lang !== "en";
    var uidBase = hashCorto(o.hoy + "|" + (o.palabra || "") + "|" + o.franja);
    var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NAOS//senal//" + (es ? "ES" : "EN"), "CALSCALE:GREGORIAN"];
    citas(o).forEach(function (c) {
      L.push("BEGIN:VEVENT", "UID:naos-senal-" + c.n + "-" + uidBase + "@naos", "DTSTAMP:" + ymd(o.hoy) + "T000000Z",
        "DTSTART:" + c.inicio, "DURATION:PT5M", "SUMMARY:" + esc(c.resumen), "DESCRIPTION:" + esc(c.descripcion), "URL:" + c.url,
        "TRANSP:TRANSPARENT", "END:VEVENT");
    });
    L.push("END:VCALENDAR");
    return L.map(plegar).join("\r\n") + "\r\n";
  }

  // ---- la imagen de la etiqueta: cinta de enmascarar dibujada en puntos y la palabra ----
  // dibuja en un canvas de 1080 x 540; devuelve el canvas. Las fuentes ya deben estar cargadas.
  function dibujarEtiqueta(palabra, tinta, papel) {
    var W = 1080, H = 540, c = document.createElement("canvas");
    c.width = W; c.height = H;
    var g = c.getContext("2d");
    g.fillStyle = papel; g.fillRect(0, 0, W, H);
    // cinta: rectángulo con bordes dentados, relleno de puntos Ben-Day (paso 18, 60 % del paso, 45 grados)
    var x0 = 60, y0 = 120, x1 = W - 60, y1 = H - 120;
    g.save();
    g.beginPath();
    g.moveTo(x0, y0);
    for (var x = x0; x <= x1; x += 18) g.lineTo(x + 9, y0 + ((x / 18) % 2 ? 7 : 0));
    g.lineTo(x1, y1);
    for (x = x1; x >= x0; x -= 18) g.lineTo(x - 9, y1 - ((x / 18) % 2 ? 7 : 0));
    g.closePath();
    g.fillStyle = papel; g.fill();
    g.lineWidth = 4; g.strokeStyle = tinta; g.stroke();
    g.clip();
    g.fillStyle = tinta; g.globalAlpha = 0.16;
    for (var j = 0, y = y0; y < y1; y += 9, j++) for (var i = (j % 2) * 9, xx = x0; xx < x1; xx += 18) { g.beginPath(); g.arc(xx + i, y, 5.4, 0, 7); g.fill(); }
    g.restore();
    g.fillStyle = tinta; g.textAlign = "center"; g.textBaseline = "middle";
    var tam = 220;
    g.font = '600 ' + tam + 'px "IBM Plex Sans Condensed", "IBM Plex Sans", sans-serif';
    while (g.measureText(palabra).width > W - 220 && tam > 60) { tam -= 8; g.font = '600 ' + tam + 'px "IBM Plex Sans Condensed", "IBM Plex Sans", sans-serif'; }
    g.fillText(palabra, W / 2, H / 2 + 8);
    return c;
  }
  function aBlob(canvas) { return new Promise(function (ok) { canvas.toBlob(ok, "image/png"); }); }

  // ---- ayudas ----
  function esNavegadorInterno() { return /Instagram|FBAN|FBAV|GSA\/|YouTube/i.test(navigator.userAgent || ""); }
  async function copiar(texto) {
    try { await navigator.clipboard.writeText(texto); return true; } catch (e) { /* sigue con el plan B */ }
    try {
      var t = document.createElement("textarea");
      t.value = texto; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(t); t.select();
      var ok = document.execCommand("copy"); t.remove(); return ok;
    } catch (e2) { return false; }
  }
  // Wake Lock: si el navegador no lo soporta, no hace nada y no avisa
  var candado = null;
  async function mantenerEncendida() {
    try { if (navigator.wakeLock && !candado) { candado = await navigator.wakeLock.request("screen"); candado.addEventListener("release", function () { candado = null; }); } } catch (e) { candado = null; }
  }
  function soltarPantalla() { try { if (candado) candado.release(); } catch (e) { /* nada */ } candado = null; }

  // ---- puntos Ben-Day: la luz se dibuja con densidad de puntos, nunca con degradé ----
  // lampara: núcleo de puntos densos y halo de densidad decreciente (tramado ordenado, puntos del mismo tamaño).
  var BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function puntos(o) {
    // o = { w, h, cx, cy, rNucleo, rHalo, paso, color, perfil }
    var p = o.paso || 10, r = p * 0.3, s = [], d, i, j, x, y;
    for (j = 0; j * p < o.h + p; j++) for (i = 0; i * p < o.w + p; i++) {
      x = i * p + (j % 2 ? p / 2 : 0); y = j * p;
      d = Math.hypot(x - o.cx, y - o.cy);
      if (d > o.rHalo) continue;
      var dens = d <= o.rNucleo ? 1 : Math.pow(1 - (d - o.rNucleo) / (o.rHalo - o.rNucleo), o.perfil || 1.6);
      if (dens * 16 > BAYER[j & 3][i & 3] + 0.5) s.push('<circle cx="' + Math.round(x) + '" cy="' + Math.round(y) + '" r="' + r.toFixed(1) + '"/>');
    }
    return '<svg class="puntos" viewBox="0 0 ' + o.w + " " + o.h + '" width="100%" height="100%" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice" fill="' + o.color + '">' + s.join("") + "</svg>";
  }

  raiz.NAOS_SENAL = { construirICS: construirICS, citas: citas, esc: esc, plegar: plegar, codificarFragmento: codificarFragmento, leerFragmento: leerFragmento,
    dibujarEtiqueta: dibujarEtiqueta, aBlob: aBlob, esNavegadorInterno: esNavegadorInterno, copiar: copiar,
    mantenerEncendida: mantenerEncendida, soltarPantalla: soltarPantalla, puntos: puntos, sumarDias: sumarDias, SITIO: SITIO, FRANJAS: FRANJAS };
})(window);
