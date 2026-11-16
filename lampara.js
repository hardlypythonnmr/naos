/* lampara.js · NAOS · The lamp (sitio 5, vuelta 2, pieza D)
 * Un tapiz de Cellas casi invisibles; el visitante es una lampara. Figura de figura40.js sin editar, cacheada como imagenes y pintada en canvas.
 * Todo sale de la fecha (dia, luna, toma de la sombra) y de un alma.json opcional. Sin servidor, sin dependencias. */
(function () {
  "use strict";
  var F = window.NAOS_FIGURA, T = window.NAOS_TOMAS, Q = new URLSearchParams(location.search);
  var cv = document.getElementById("lienzo"), ctx = cv.getContext("2d");
  var BG = "#0E1116", RED = "#A8362A", GOLD = "#F6D365", CREMA = "#F4F6F8";
  var PM = window.NAOS_PARAMS, CAMPOS = PM.CAMPOS, num = PM.num;
  var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- fecha, luna, toma ---------- */
  var ahora = Q.get("fecha") && /^\d{4}-\d{2}-\d{2}$/.test(Q.get("fecha")) ? Date.parse(Q.get("fecha") + "T12:00:00Z") : Date.now();
  var hoy = new Date(ahora).toISOString().slice(0, 10), p3 = hoy.split("-").map(Number);
  var dia = Math.max(0, Math.round((Date.UTC(p3[0], p3[1] - 1, p3[2]) - Date.UTC(2026, 10, 15)) / 864e5));
  var edad = T.edad(ahora), ilum = T.luz(ahora);
  var SEMILLA = Math.floor(+Q.get("seed") || 7);

  /* ---------- parametros (lista blanca de alma.json, con rango) ---------- */
  var P = PM.defecto();
  var capas = [];
  function cargaAlma() {
    return new Promise(function (ok) {
      var fin = setTimeout(function () { ok(); }, 900);
      try {
        fetch("alma.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
          try {
            P = PM.vigentes(j, hoy);
            if (j && Array.isArray(j.capas)) capas = j.capas.filter(function (e) { return e && typeof e.fecha === "string" && e.fecha <= hoy && e.que && typeof e.que === "object"; });
          } catch (e) { capas = []; }
          clearTimeout(fin); ok();
        }).catch(function () { clearTimeout(fin); ok(); });
      } catch (e) { clearTimeout(fin); ok(); }
    });
  }

  /* ---------- utiles ---------- */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hex(c) { return [1, 3, 5].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
  function mezcla(a, b, k) { var x = hex(a), y = hex(b); return "#" + x.map(function (v, i) { var n = Math.round(v + (y[i] - v) * k); return (n < 16 ? "0" : "") + n.toString(16); }).join(""); }
  function ease(x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); }

  /* ---------- sprites: cada variante de la figura como imagen, rasterizada una vez ---------- */
  var OJOS = ["dot", "wide", "happy", "closed", "chevron", "flat", "tiltin", "tiltout", "lidded", "smile"];
  function todasLasClaves() {
    var k = [];
    OJOS.forEach(function (e) { [1, -1].forEach(function (h) { [0, 1].forEach(function (b) { k.push(e + "|" + h + "|" + b + "|0"); if (e === "dot" || e === "wide") { k.push(e + "|" + h + "|" + b + "|7"); k.push(e + "|" + h + "|" + b + "|-7"); } }); }); });
    return k;
  }
  var CLAVES = todasLasClaves();
  function svgDe(clave, ink, ojosC, sombra) {
    var p = clave.split("|"), o = { estado: "humanity", b: +p[2], r: 0, hacia: +p[1], p: { tx: ink, bg: ojosC }, ojos: "none", s: 1 };
    if (sombra) o.estado40 = "alostasis";
    var s = F.cella(null, o);
    if (!sombra || sombra === 2) {
      var o2 = sombra === 2 ? { estado: "humanity", b: +p[2], r: 0, hacia: +p[1], p: { tx: ink, bg: ojosC }, ojos: "none", s: 1 } : o, g = F.cellaGeo(o2);
      s = s.replace(/<\/g><\/svg>$/, F.v40.ojos(p[0], { y: g.ojos[0][1], dx: g.ojos[0][0] - 92 + (+p[3]), color: ojosC }) + "</g></svg>");
    }
    return s;
  }
  function juego(claves, ink, ojosC, sombra, SP) {
    var out = {};
    return Promise.all(claves.map(function (k) {
      return new Promise(function (ok) {
        var im = new Image();
        im.onload = function () {
          var c = document.createElement("canvas"); c.width = c.height = SP; c.getContext("2d").drawImage(im, 0, 0, SP, SP);
          if (window.createImageBitmap) createImageBitmap(c).then(function (bm) { out[k] = bm; ok(); }, function () { out[k] = c; ok(); });   // bitmap: se pinta sin copiar el lienzo cada vez
          else { out[k] = c; ok(); }
        };
        im.onerror = ok;
        im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgDe(k, ink, ojosC, sombra));
      });
    })).then(function () { return out; });
  }

  /* ---------- el tapiz: Poisson con semilla, mas huecos llenados dia a dia ---------- */
  /* resolucion adaptativa: si el aparato no sostiene 50 fps, baja el lienzo (2, 1.5, 1.25, 1, 0.8 px por px css) */
  var ESC = [2, 1.5, 1.25, 1, 0.8], nivel = 0, medida = { n: 0, suma: 0, ult: 0, vivo: false };
  var w, h, dpr, r, WB, cells, pro, base, S = {}, toma = false, tomaInfo, cargado = false;
  function mundo() {
    w = innerWidth; h = innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2, ESC[nivel]);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var N = (w < 700 ? 580 : 880) * P.densidad; r = Math.sqrt(w * h / (N * 1.45)); WB = 1.9 * r;
    var rng = mulberry(SEMILLA * 7919 + 13), cs = r, gw = Math.ceil((w + 2 * r) / cs) + 2, gh = Math.ceil((h + 2 * r) / cs) + 2, grid = {};
    pro = { x: 0.64 * w, y: 0.6 * h, sc: 1.45 };
    var rv = mulberry(SEMILLA * 31 + 5), claros = [0, 1, 2].map(function () { return [0.08 * w + rv() * 0.84 * w, 0.08 * h + rv() * 0.84 * h, (2.2 + rv() * 1.2) * r]; });
    function vacio(x, y) {
      for (var i = 0; i < claros.length; i++) if (Math.hypot(x - claros[i][0], y - claros[i][1]) < claros[i][2]) return true;
      var xc = w * (0.16 + 0.5 * y / h) + Math.sin(y / h * 9 + SEMILLA) * 0.9 * r;      // la grieta: una diagonal que se abre
      return Math.abs(x - xc) < 0.5 * r + 0.4 * r * Math.sin(y * 0.021 + 1);
    }
    var lista = [];
    function cel(x, y) { return Math.floor((x + r) / cs) + "," + Math.floor((y + r) / cs); }
    function libre(x, y, minD) {
      if (Math.hypot(x - pro.x, y - pro.y) < 3 * r || vacio(x, y)) return false;
      var cx = Math.floor((x + r) / cs), cy = Math.floor((y + r) / cs);
      for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var a = grid[(cx + i) + "," + (cy + j)]; if (a) for (var k = 0; k < a.length; k++) if (Math.hypot(a[k].x - x, a[k].y - y) < minD) return false; }
      return true;
    }
    function mete(x, y, d) { var c = nueva(x, y, d, rng); (grid[cel(x, y)] = grid[cel(x, y)] || []).push(c); lista.push(c); return c; }
    // Bridson
    var act = [], x0 = rng() * w, y0 = rng() * h;
    while (!libre(x0, y0, r)) { x0 = rng() * w; y0 = rng() * h; }
    act.push(mete(x0, y0, 0));
    while (act.length) {
      var i = Math.floor(rng() * act.length), a = act[i], hecho = false;
      for (var t = 0; t < 24; t++) {
        var an = rng() * 6.2832, rr = r * (1 + rng()), x = a.x + Math.cos(an) * rr, y = a.y + Math.sin(an) * rr;
        if (x < -0.2 * r || x > w + 0.2 * r || y < 0 || y > h + 0.7 * r || !libre(x, y, r)) continue;
        act.push(mete(x, y, 0)); hecho = true; break;
      }
      if (!hecho) act.splice(i, 1);
    }
    // un puñado de Cellas nuevas por dia, en los huecos; las de ayer no se mueven
    for (var d = 1; d <= Math.min(dia, 90); d++) {
      var rd = mulberry(SEMILLA * 104729 + d * 31), n = 0;
      for (var q = 0; q < 400 && n < 5; q++) {
        var xx = rd() * w, yy = rd() * (h + 0.5 * r);
        if (libre(xx, yy, 0.8 * r)) { var cc = nueva(xx, yy, d, rd); (grid[cel(xx, yy)] = grid[cel(xx, yy)] || []).push(cc); lista.push(cc); n++; }
      }
    }
    // las de 2x desplazan a sus vecinas
    var grandes = lista.filter(function (c) { return c.big; });
    lista = lista.filter(function (c) { return c.big || !grandes.some(function (g) { return Math.hypot(g.x - c.x, g.y - c.y) < 1.15 * r; }); });
    // capas de alma.json
    var m = Math.min(w, h);
    capas.forEach(function (L) {
      var q = L.que, tp = L.tipo;
      if (tp === "cella" && CAMPOS[q.paleta] && num(q.x, 0, 1) && num(q.y, 0, 1)) {
        var px = q.x * w, py = q.y * h;
        lista = lista.filter(function (c) { return Math.hypot(c.x - px, c.y - py) > 0.8 * r; });
        var c = nueva(px, py, 0, rng); c.pose = "pie"; c.eyes = "happy"; c.hacia = 1; c.b = 0; c.rot = 0; c.sc = 1.15; c.col = q.paleta; c.vis = true; c.kd = "happy|1|0|0"; lista.push(c);
      } else if (tp === "ascua") {
        var cand = lista.filter(function (c) { return !c.col && !c.ras && Math.hypot(c.x - pro.x, c.y - pro.y) > 5 * r && c.y < h * 0.95 && c.y > 0.1 * h; });
        var sem = Math.max(0, Math.floor((Date.UTC(p3[0], p3[1] - 1, p3[2]) - Date.UTC(2026, 10, 15)) / (7 * 864e5)));
        if (cand.length) cand[T.fnv1a("ascua" + sem) % cand.length].asc = true;
      } else if (tp === "oro" && num(q.x, 0, 1) && num(q.y, 0, 1) && num(q.radio, 0.01, 0.3)) {
        lista.forEach(function (c) { if (Math.hypot(c.x - q.x * w, c.y - q.y * h) < q.radio * m) c.oro = true; });
      } else if (tp === "rastro" && Array.isArray(q.de) && Array.isArray(q.a) && num(q.de[0], 0, 1) && num(q.de[1], 0, 1) && num(q.a[0], 0, 1) && num(q.a[1], 0, 1)) {
        var ax = q.de[0] * w, ay = q.de[1] * h, bx = q.a[0] * w, by = q.a[1] * h, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
        lista.forEach(function (c) {
          var u = Math.max(0, Math.min(1, ((c.x - ax) * dx + (c.y - ay) * dy) / L2));
          if (Math.hypot(c.x - (ax + u * dx), c.y - (ay + u * dy)) < 0.045 * m) { c.ras = true; c.vis = true; c.pose = "pie"; c.eyes = "wide"; c.b = 0; c.rot = 0.04 * c.hacia; c.kd = "wide|" + c.hacia + "|0|0"; }
        });
      }
    });
    lista.sort(function (a, b) { return a.y - b.y; });
    cells = lista;
  }
  function nueva(x, y, d, rng) {
    var pw = P.poses, tot = pw[0] + pw[1] + pw[2] + pw[3], u = rng() * tot, pose = u < pw[0] ? "pie" : u < pw[0] + pw[1] ? "hund" : u < pw[0] + pw[1] + pw[2] ? "dorm" : "mira";
    function el(a) { return a[Math.floor(rng() * a.length)]; }
    var eyes = pose === "pie" ? el(["lidded", "happy", "flat", "tiltin", "tiltout", "smile", "closed", "chevron"]) : pose === "hund" ? el(["lidded", "flat", "closed", "chevron", "lidded"]) : pose === "dorm" ? "closed" : el(["dot", "wide", "tiltin", "tiltout", "dot", "wide"]);
    var ue = rng(), esc = d > 0 ? 1 : ue < 0.2 ? 0.5 : ue < 0.86 ? 1 : 2;
    var hacia = rng() < 0.5 ? 1 : -1, b = rng() < 0.5 ? 0 : 1, dx = 0;
    if (pose === "mira" && (eyes === "dot" || eyes === "wide")) dx = rng() < 0.5 ? 7 : -7;
    var rot = (rng() - 0.5) * (pose === "pie" ? 0.3 : pose === "hund" ? 0.5 : 0.35); if (pose === "pie" && Math.abs(rot) < 0.05) rot = rot < 0 ? -0.06 : 0.06;
    return { x: x, y: y, sc: (0.92 + rng() * 0.2) * esc, big: esc > 1.5, vis: rng() < 0.5, pose: pose, eyes: eyes, hacia: hacia, b: b, rot: rot, sg: rng() < 0.5 ? 1 : -1, ph: rng() * 6.28, h1: rng(), h2: rng(), dia: d, g: 0, ll: -1e9,
      kd: eyes + "|" + hacia + "|" + b + "|" + dx, col: null, oro: false, ras: false };
  }

  /* ---------- sprites del tapiz ---------- */
  var campo, sombraC, SP, boca;
  var NOCHE = "#2B2F66";
  function construye() {
    SP = Math.ceil(WB * 1.5 * dpr);
    var colores = {}, claves2 = ["happy|1|0|0", "dot|1|0|0"], shK = ["none|1|0|0", "none|1|1|0", "none|-1|0|0", "none|-1|1|0"];
    cells.forEach(function (c) { if (c.col) colores[c.col] = 1; });
    var trabajos = [
      ["dim", juego(CLAVES, "#131820", "#363E49", false, SP)],
      ["lit", juego(CLAVES, BG, CREMA, false, SP)],
      ["gold", juego(CLAVES, GOLD, BG, false, SP)],
      ["pale", juego(CLAVES, "#A9B2EC", NOCHE, false, SP)],
      ["dimB", juego(["dot|1|0|0", "wide|1|0|0", "wide|-1|0|0"], "#131820", "#7A828E", false, SP)],
      ["shC", juego(shK, sombraC, BG, true, SP)],
      ["shD", juego(shK, "#1B212A", BG, true, SP)],
      ["shG", juego(["dot|1|0|0"], GOLD, mezcla(GOLD, BG, 0.62), 2, SP)]
    ];
    Object.keys(colores).forEach(function (k) {
      trabajos.push(["dim_" + k, juego(claves2, mezcla(CAMPOS[k], BG, 0.93), "#4A525E", false, SP)]);
      trabajos.push(["lit_" + k, juego(claves2, CAMPOS[k], BG, false, SP)]);
    });
    return Promise.all(trabajos.map(function (t) { return t[1].then(function (o) { S[t[0]] = o; }); })).then(function () {
      // la boca de la sombra: su silueta y, dentro, Cellas pequeñas con corona (segunda profundidad)
      boca = document.createElement("canvas"); boca.width = boca.height = SP; var b = boca.getContext("2d");
      b.drawImage(S.shD["none|1|0|0"], 0, 0, SP, SP); b.globalCompositeOperation = "source-atop";
      var filas = [[0.56, 0.255, 3], [0.68, 0.29, 3], [0.8, 0.26, 3], [0.9, 0.3, 3]], n = 0;
      filas.forEach(function (f, j) { for (var q = 0; q < f[2]; q++) { var sz = f[1] * SP, x = (0.34 + 0.16 * q + (j % 2) * 0.05) * SP; b.drawImage(S.shC["none|" + (n % 2 ? 1 : -1) + "|" + (n % 3 ? 0 : 1) + "|0"], x - sz / 2, f[0] * SP - 0.8833 * sz, sz, sz); n++; } });
    });
  }
  function conjunto(c, tipo) { if (tipo === "pale") return S.pale; return c.col ? S[tipo + "_" + c.col] : c.ras && tipo === "dim" ? S.dimB : S[tipo]; }
  function pinta(c, img, W, x, y, alfa) {
    if (!img) return;
    var d = dpr, rot = c.pose === "dorm" ? c.sg * 1.5 : c.rot, co = Math.cos(rot), si = Math.sin(rot), sy = c.pose === "hund" ? 0.7 : 1;
    ctx.setTransform(d * co, d * si, -d * si * sy, d * co * sy, d * x, d * y);
    if (alfa != null) ctx.globalAlpha = alfa;
    if (c.pose === "dorm") ctx.drawImage(img, -W / 2 - c.sg * 0.225 * W, -0.8833 * W, W, W); else ctx.drawImage(img, -W / 2, -0.8833 * W, W, W);
    if (alfa != null) ctx.globalAlpha = 1;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  var capaToma = null;
  function pintaCapaToma() {   // las sombras coronadas de la toma, pintadas una vez (una de cada diez, mas alta o torcida)
    capaToma = document.createElement("canvas"); capaToma.width = cv.width; capaToma.height = cv.height;
    var g = capaToma.getContext("2d"), gc = ctx; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    cells.forEach(function (c) {
      var W = WB * c.sc, im = S.shD["none|" + c.hacia + "|" + c.b + "|0"]; if (!im) return;
      var rara = Math.floor(c.h1 * 10) === 3;
      g.save(); g.translate(c.x + 0.1 * W, c.y); if (rara) { g.rotate(0.32 * c.sg); g.translate(0, -0.1 * W); g.scale(1, 1.18); }
      g.drawImage(im, -W / 2, -0.8833 * W, W, W); g.restore();
    });
  }
  function pintaBase() {
    base = document.createElement("canvas"); base.width = cv.width; base.height = cv.height;
    var b = base.getContext("2d"); b.setTransform(dpr, 0, 0, dpr, 0, 0); b.fillStyle = BG; b.fillRect(0, 0, w, h);
    var gc = ctx; ctx = b;
    cells.forEach(function (c) { var s = conjunto(c, "dim"); if (s) pinta(c, s[c.kd] || s["dot|1|0|0"], WB * c.sc, c.x, c.y); });
    ctx = gc;
  }

  /* ---------- la sombra cosida al pie; en el acto se suelta ---------- */
  function sombra(set, c, W, lamp, hacia, ev) {
    var dx = c.x - lamp.x, dy = c.y - 0.3 * W - lamp.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, k = W / 240;
    var lam = Math.min(1.9, 0.35 + 0.95 * d / Math.max(lamp.r, 1) + 0.9 * ev), ax = c.x + ux * ev * 0.55 * W, ay = c.y + uy * ev * 0.55 * W;
    var img = set["none|" + hacia + "|" + c.b + "|0"] || set["none|1|0|0"]; if (!img) return;
    var Px = -uy * 1.15, Py = ux * 1.15, Dx = ux * lam, Dy = uy * lam;
    ctx.setTransform(dpr * k * Px, dpr * k * Py, -dpr * k * Dx, -dpr * k * Dy, dpr * (ax - 120 * k * Px + 212 * k * Dx), dpr * (ay - 120 * k * Py + 212 * k * Dy));
    ctx.drawImage(img, 0, 0, 240, 240); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function sentada(img, x, y, W, alfa, sx, sy) {
    if (!img || alfa <= 0.003) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, alfa); ctx.translate(x, y); ctx.scale(sx, sy); ctx.drawImage(img, -W / 2, -0.8833 * W, W, W); ctx.restore();
  }

  /* ---------- estado ---------- */
  var L = { x: 0, y: 0, tx: 0, ty: 0, r: 0, on: true }, Rb, interactuo = false, dwell = 0, sit = 0, sat = false, ap = 0, ge = 0, ult = 0, T0 = 0, keys = {}, lastPtr = 0, tk = 0, actos = [];
  function radio() { return Rb * P.radioLampara * (0.7 + 0.45 * ilum); }
  function centroC(c) { return c.y - 0.3 * WB * c.sc; }
  function actoEn(t) {
    var e = 0; for (var i = 0; i < actos.length; i++) { var x = t - actos[i]; if (x >= 0 && x <= 3.5) e = Math.max(e, ease(Math.min(1, x / 0.7, (3.5 - x) / 0.7))); }
    return e;
  }
  function planActos() {
    var rf = mulberry(T.fnv1a(hoy) ^ 0x5bd1e995), t = Q.get("acto") ? +Q.get("acto") : 40 + 50 * rf(); actos = [];
    for (var i = 0; i < 40; i++) { actos.push(t); t += 40 + 50 * rf(); }
  }

  /* Repintado parcial: la capa estatica (base) solo se vuelve a copiar donde algo cambio (lampara ahora y antes,
     protagonista, figuras doradas encendidas). Al arrancar y en la toma se repinta todo. */
  var completo = true, rectsAntes = [];
  function rectsSucios(lamps) {
    var R = [], Wq = WB * pro.sc;
    lamps.forEach(function (l) { var m = Math.max(l.r, 0) + 22; R.push([l.x - m, l.y - m, 2 * m, 2 * m]); });
    R.push([pro.x - 3.2 * Wq, pro.y - 2.4 * Wq, 5.2 * Wq, 3 * Wq]);
    cells.forEach(function (c) { if (c.g > 0.02) { var W = WB * c.sc; R.push([c.x - W, c.y - W, 2 * W, 1.6 * W]); } });
    return R;
  }
  function dibuja(t, dt, lamps, ev) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var parcial = !completo && tk === 0;
    if (parcial) {
      ctx.save(); ctx.beginPath();
      rectsAntes.concat(rectsSucios(lamps)).forEach(function (q) { var x = Math.floor(q[0]), y = Math.floor(q[1]); ctx.rect(x, y, Math.ceil(q[0] + q[2]) - x, Math.ceil(q[1] + q[3]) - y); });
      ctx.clip();
    }
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1 - tk; ctx.drawImage(base, 0, 0, w, h); ctx.globalAlpha = 1;
    // la toma: las sombras con corona son lo que se ve; una de cada diez, mas alta o torcida
    if (tk > 0 && capaToma) { ctx.globalAlpha = tk; ctx.drawImage(capaToma, 0, 0, w, h); ctx.globalAlpha = 1; }
    // la protagonista, fuera de la luz
    var Wq = WB * pro.sc, sitE = Math.max(sit, tk), off = sitE * 0.62 * Wq;
    pinta({ pose: "pie", rot: 0, sg: 1 }, S.dimB["dot|1|0|0"], Wq, pro.x + off, pro.y, 1 - tk);
    dibujaSombraPro(Wq, sitE);
    // oro fugaz, escaso, y la ascua
    cells.forEach(function (c) {
      var inL = false;
      lamps.forEach(function (l) { if (l.r > 1 && Math.hypot(c.x - l.x, centroC(c) - l.y) < l.r + 4) inL = true; });
      if (inL) c.ll = t;
      if (!quieto) {
        var ini = P.oroRetraso + c.h1 * 0.9, fin = ini + P.oroDuracion * (0.6 + 0.8 * c.h2), ed = t - c.ll;
        var tg = (!toma && c.oro) ? 1 : (!toma && !inL && c.h2 < 0.3 && ed >= ini && ed <= fin) ? 1 : 0;
        if (c.asc && !toma) tg = Math.max(tg, 0.55 * ease((t - 2.5) / 1.5));
        c.g += (tg - c.g) * Math.min(1, dt * 6);
      }
      if (c.g > 0.02 && !inL) pinta(c, S.gold[c.kd] || S.gold["dot|1|0|0"], WB * c.sc, c.x, c.y, c.g);
    });
    // la figura dorada: sale de la sombra y se queda en la pared
    // las lamparas: campo calido de paletas, dos anillos planos que respiran, sin halo
    var campoC = mezcla(campo, NOCHE, tk), campoV = mezcla(campoC, BG, 0.5 * ev), a1 = mezcla(campoV, BG, 0.5), a2 = mezcla(campoV, BG, 0.78);
    lamps.forEach(function (l) {
      if (l.r < 1) return;
      var resp = quieto ? 0 : 2 * Math.sin(t * 1.3 + l.x * 0.01);
      ctx.fillStyle = a2; ctx.beginPath(); ctx.arc(l.x, l.y, l.r + 16 + resp, 0, 6.2832); ctx.fill();
      ctx.fillStyle = a1; ctx.beginPath(); ctx.arc(l.x, l.y, l.r + 8 + resp * 0.5, 0, 6.2832); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, 6.2832); ctx.clip();
      ctx.fillStyle = campoV; ctx.fillRect(l.x - l.r, l.y - l.r, 2 * l.r, 2 * l.r);
      var m = l.r + WB * 1.8, ver = function (c) { return c.vis || c.col || c.ras || c.asc; };
      if (tk < 0.5) cells.forEach(function (c) { if (ver(c) && Math.hypot(c.x - l.x, centroC(c) - l.y) <= m + WB * c.sc) sombra(S.shC, c, WB * c.sc, l, c.hacia, ev); });
      if (tk < 0.5 && !sit) sombra(S.shC, { x: pro.x, y: pro.y, b: 0 }, Wq, l, 1, ev);
      cells.forEach(function (c) {
        var W = WB * c.sc, dd = Math.hypot(c.x - l.x, centroC(c) - l.y); if (dd > m + W || !ver(c)) return;
        var set = conjunto(c, tk > 0.5 ? "pale" : "lit"), key = c.kd, e = c.eyes;
        if ((e === "dot" || e === "wide") && !c.col && !c.ras) { var sx = l.x - c.x, g = Math.abs(sx) < 8 ? 0 : (sx > 0 ? 7 : -7) * c.hacia; key = e + "|" + c.hacia + "|" + c.b + "|" + g; }
        if (c.g > 0.5 && tk < 0.5) set = S.gold;
        pinta(c, set[key] || set[c.kd] || set["dot|1|0|0"], W, c.x, c.y);
      });
      if (tk < 0.99) {
        var keyp = "dot|1|0|" + (Math.abs(l.x - (pro.x + off)) < 8 ? 0 : (l.x - (pro.x + off) > 0 ? 7 : -7));
        pinta({ pose: "pie", rot: 0, sg: 1 }, S.lit[keyp] || S.lit["dot|1|0|0"], Wq, pro.x + off, pro.y, 1 - tk);
      }
      dibujaSombraPro(Wq, sitE, true);
      ctx.restore();
    });
    dorada(Wq);
    if (parcial) ctx.restore();
    rectsAntes = tk === 0 ? rectsSucios(lamps) : []; completo = false;
  }
  function dorada(Wq) { if (ge > 0.003) { var e = ease(ge), sc = (0.7 + 0.45 * e) * Wq; sentada(S.shG["dot|1|0|0"], pro.x - 0.95 * Wq * e, pro.y, sc, Math.min(1, ge * 3), 1, 1); } }
  // la sombra de la protagonista: sentada, y al abrirse crece y deja ver Cellas coronadas dentro
  function dibujaSombraPro(Wq, sitE, enLampara) {
    if (sitE <= 0.003) return;
    var s = 1 + 0.7 * ap, sy = (0.72 + 0.28 * ap) * s;
    sentada(enLampara ? S.shC["none|1|0|0"] : S.shD["none|1|0|0"], pro.x, pro.y, Wq, sitE * (1 - ap), s, sy);
    if (ap > 0.003 && boca) { ctx.save(); ctx.globalAlpha = Math.min(1, sitE) * Math.min(1, ap * 1.5); ctx.translate(pro.x, pro.y); ctx.scale(s, sy); ctx.drawImage(boca, -Wq / 2, -0.8833 * Wq, Wq, Wq); ctx.restore(); }
  }

  /* ---------- bucle ---------- */
  function paso(ms) {
    var t = (ms - T0) / 1000, dt = Math.min(0.05, Math.max(0.001, t - ult)); ult = t;
    var vx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), vy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
    if (vx || vy) { interactuo = true; L.on = true; L.tx = Math.max(0, Math.min(w, L.tx + vx * 340 * dt)); L.ty = Math.max(0, Math.min(h, L.ty + vy * 340 * dt)); }
    if (!interactuo) { var u = t; L.on = true; L.tx = w * (0.5 + 0.34 * Math.sin(u * 0.42 + 0.8)); L.ty = h * (0.5 + 0.34 * Math.sin(u * 0.27 + 2.2)); }
    var ox = L.x, oy = L.y; L.x += (L.tx - L.x) * Math.min(1, dt * 14); L.y += (L.ty - L.y) * Math.min(1, dt * 14);
    var ev = actoEn(t);
    L.r += ((L.on ? radio() * (1 - 0.35 * ev) : 0) - L.r) * Math.min(1, dt * 10);
    var vel = Math.hypot(L.x - ox, L.y - oy) / dt;
    tk = toma ? ease(t / 2) : 0;
    if (!toma) {
      var Wq = WB * pro.sc, d = Math.hypot(L.x - (pro.x + sit * 0.62 * Wq), L.y - (pro.y - 0.3 * Wq));
      if (L.r > 5 && d < 0.5 * L.r && vel < 40 && !sat) dwell += dt; else if (!sat) dwell = Math.max(0, dwell - dt * 1.5);
      if (dwell >= P.segundosProta) sat = true;
      sit += ((sat ? 1 : 0) - sit) * Math.min(1, dt * 2.6); if (sat && sit > 0.995) sit = 1;
      if (sit > 0.95) ap = Math.min(1, ap + dt / 2);
      if (ap > 0.55) ge = Math.min(1, ge + dt / 2.2);
      cv.dataset.sit = sit.toFixed(2); cv.dataset.ap = ap.toFixed(2); cv.dataset.ge = ge.toFixed(2);
    }
    dibuja(t, dt, [L], ev);
    mide(ms);
    requestAnimationFrame(paso);
  }
  function mide(ms) {
    if (!medida.vivo || nivel >= ESC.length - 1 || !cargado) { medida.ult = ms; return; }
    var d = ms - medida.ult; medida.ult = ms; if (d <= 0 || d > 250) return;   // pestaña oculta o pausa: no cuenta
    medida.suma += d; medida.n++;
    if (medida.n >= 24) {
      var fps = 1000 * medida.n / medida.suma; medida.n = 0; medida.suma = 0;
      if (fps < 50 && (interactuo || performance.now() - T0 > 3000)) { nivel = Math.min(ESC.length - 1, nivel + (fps < 30 ? 2 : 1)); medida.vivo = false; cargado = false; arranca(); }
    }
  }
  function estatico() {
    var Wq = WB * pro.sc, R = radio();
    var lamps = [{ x: pro.x, y: pro.y - 0.3 * Wq, r: R }, { x: 0.24 * w, y: 0.3 * h, r: R * 0.9 }, { x: 0.78 * w, y: 0.74 * h, r: R * 0.8 }];
    tk = toma ? 1 : 0;
    if (!toma) { sit = 1; ap = 1; ge = 1; cells.forEach(function (c) { var dd = Math.hypot(c.x - lamps[1].x, centroC(c) - lamps[1].y); if (c.asc) c.g = 0.55; else if (dd > 1.25 * lamps[1].r && dd < 1.8 * lamps[1].r && c.h2 < 0.3) c.g = 1; }); }
    dibuja(0, 0.016, lamps, 0);
  }

  /* ---------- arranque ---------- */
  var gen = 0;
  function arranca() {
    var mi = ++gen;
    completo = true; mundo(); Rb = Math.max(88, Math.min(190, Math.min(w, h) * 0.32));
    campo = CAMPOS[P.campo]; sombraC = NOCHE; planActos();
    cv.dataset.cellas = cells.length; cv.dataset.dia = dia; cv.dataset.toma = toma ? "1" : "0"; cv.dataset.prot = Math.round(pro.x) + "," + Math.round(pro.y - 0.3 * WB * pro.sc);
    cv.dataset.radio = Math.round(radio());
    construye().then(function () {
      if (mi !== gen) return; pintaBase(); if (toma) pintaCapaToma(); cargado = true;
      if (!L.tx) { L.x = L.tx = w / 2; L.y = L.ty = h / 2; }
      if (quieto) estatico(); else if (!arranca.corre) { arranca.corre = true; T0 = performance.now(); requestAnimationFrame(paso); }
      cv.dataset.listo = "1"; cv.dataset.dpr = dpr; medida.vivo = !quieto && !Q.get("fija"); medida.n = 0; medida.suma = 0;
    });
  }
  function alPuntero(e) {
    if (e.pointerType === "touch" && (e.type === "pointerup" || e.type === "pointercancel")) { L.on = false; return; }
    if (!interactuo && e.pointerType !== "touch") cv.style.cursor = "none";
    interactuo = true; L.on = true; L.tx = e.clientX; L.ty = e.clientY;
    if (e.type === "pointerdown" || !lastPtr) { L.x = L.tx; L.y = L.ty; } lastPtr = 1;
  }
  if (!quieto) {
    ["pointermove", "pointerdown", "pointerup", "pointercancel"].forEach(function (n) { window.addEventListener(n, alPuntero, { passive: true }); });
    document.addEventListener("mouseleave", function () { if (interactuo) L.on = false; });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); interactuo = true; L.on = true; L.tx = L.x; L.ty = L.y; keys = {}; return; }   // la deja quieta donde esta
      if (e.key.indexOf("Arrow") === 0) { keys[e.key] = true; e.preventDefault(); if (!interactuo) { L.tx = L.x; L.ty = L.y; } } });
    window.addEventListener("keyup", function (e) { delete keys[e.key]; });
  }
  var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (cargado) arranca(); }, 250); });
  cargaAlma().then(function () {
    tomaInfo = T.tomaDe(hoy, P.tomaExtra);   // misma regla que C (tomas.js compartido)
    toma = tomaInfo.toma;
    if (toma) cv.setAttribute("aria-label", "The same tapestry on a day the shadows take over. Within two seconds the Cellas sink and their shadows, each wearing a red crown, are what you see. The lamp, moved by pointer, finger or arrow keys, shows the Cellas pale, and the Cella who stands apart is gone: her shadow sits in her place. The shadows say nothing. It passes by tomorrow.");
    arranca();
  });
})();
