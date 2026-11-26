/* NAOS strategies library, version 1 "Stage profile" (chosen by N, 26 Nov 2026): theme, videos on tap, the ideas,
   and Cella on the stage profile. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  /* light and dark: the system setting, or the reader's choice */
  var themeBtn = $("#theme");
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var r = document.documentElement;
    var cur = r.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    r.dataset.theme = cur === "dark" ? "light" : "dark";
    try { localStorage.setItem("naos-biblioteca-tema", r.dataset.theme); } catch (e) {}
  });

  /* ---------- videos: the poster first, the file only on tap; tall on a phone, wide elsewhere ---------- */
  var TALL = matchMedia("(max-width: 640px)");
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest(".vid .play");
    if (!b) return;
    var f = b.closest(".vid"), fr = $(".frame", f), img = $("img", f);
    var fmt = TALL.matches ? "9x16" : "16x9";
    var v = document.createElement("video");
    v.src = f.dataset.v + "_" + fmt + ".mp4";
    v.poster = f.dataset.v + "_" + fmt + ".jpg";
    v.controls = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.preload = "auto";
    v.setAttribute("aria-label", img ? img.alt : "");
    v.addEventListener("error", function () {
      var m = document.createElement("div"); m.className = "miss"; m.textContent = "This video did not load. Try again later.";
      fr.appendChild(m);
    });
    $$("video").forEach(function (o) { if (o !== v) o.pause(); });
    fr.replaceChildren(v);
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    v.focus();
  });

  /* ---------- ideas: a word on the map or a link opens its sentence ---------- */
  function openIdea(id, smooth) {
    var d = document.getElementById(id);
    if (!d) return false;
    if (d.tagName === "DETAILS") {
      d.open = true;
      d.classList.add("flash"); setTimeout(function () { d.classList.remove("flash"); }, 1600);
    } else if (d.classList.contains("anchor")) {
      d.parentElement.open = true;
    } else if (d.classList.contains("vid")) {
      d.classList.add("flash"); setTimeout(function () { d.classList.remove("flash"); }, 1600);
    }
    d.scrollIntoView({ behavior: smooth && !RM ? "smooth" : "auto", block: d.classList.contains("vid") ? "center" : "start" });
    return true;
  }
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest("a[href^='#']");
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (id && document.getElementById(id) && openIdea(id, true)) {
      ev.preventDefault();
      try { history.replaceState(null, "", "#" + id); } catch (e) {}
    }
  });
  if (location.hash.length > 1) setTimeout(function () { openIdea(decodeURIComponent(location.hash.slice(1)), false); }, 60);

  /* the map starts where the essay starts: the right end (uphill runs to the left, as in the mark) */
  var ms = $(".mapa-scroll");
  if (ms) ms.scrollLeft = ms.scrollWidth;

  /* ---------- the stage profile and Cella (C1 Moai: rock, swing, thud; never faster than her weight) ---------- */
  var band = $("#band"), dataEl = $("#banda-datos");
  if (!band || !dataEl) return;
  var DATA = JSON.parse(dataEl.textContent), EL = DATA.elevation, STEPS = DATA.steps;
  var CELLA_D = "M-131 0 V-305.7 Q-131 -344.5 -92.2 -344.5 H92.2 Q131 -344.5 131 -305.7 V0 H63.1 V-145.6 H0 V0 Z";
  var sv = function (t, a) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); return e; };
  function points(w, h, pad, phone) {
    var n = EL.length, pts = [], left = pad + w * 0.06, right = w - pad;
    pts.push({ x: right, y: h - 8 });
    for (var i = 0; i < n; i++) pts.push({ x: right - (right - left) * (i + 1) / n, y: h - 10 - h * (phone ? 0.5 : 0.64) * EL[i] });
    pts.push({ x: 0, y: pts[pts.length - 1].y });
    return pts;
  }
  function area(pts, h) {
    var d = "M" + (pts[0].x + 40) + " " + pts[0].y + " ";
    pts.forEach(function (p) { d += "L" + p.x + " " + p.y + " "; });
    return d + "L-40 " + pts[pts.length - 1].y + " L-40 " + (h + 40) + " L" + (pts[0].x + 40) + " " + (h + 40) + " Z";
  }
  function yAt(pts, x) {
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      if (x <= a.x && x >= b.x) return a.y + (b.y - a.y) * ((a.x - x) / ((a.x - b.x) || 1));
    }
    return x > pts[0].x ? pts[0].y : pts[pts.length - 1].y;
  }
  function angAt(pts, x) { return Math.atan2(yAt(pts, x + 1) - yAt(pts, x - 1), 2) * 180 / Math.PI; }
  var P = null, raf = 0;
  function layout() {
    var svg = $("#prof"), box = svg.getBoundingClientRect();
    if (!box.width) return;
    var w = box.width, h = box.height, phone = w < 640;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var pts = points(w, h, phone ? 12 : 28, phone);
    svg.appendChild(sv("path", { d: area(pts, h), fill: "#EEECE4" }));
    pts.slice(1, -1).forEach(function (p, i) {
      svg.appendChild(sv("line", { x1: p.x, y1: p.y, x2: p.x, y2: h, stroke: "#142620", "stroke-width": 1, "stroke-dasharray": "2 3", opacity: 0.5 }));
      svg.appendChild(sv("circle", { cx: p.x, cy: p.y, r: phone ? 2.5 : 3.5, fill: "#EEECE4", stroke: "#142620", "stroke-width": 1.5 }));
      var t = sv("text", { x: p.x, y: p.y - (phone ? 7 : 24), "text-anchor": "middle", fill: "#EEECE4", "font-family": "Archivo Black, sans-serif", "font-size": phone ? 11 : 14 });
      t.textContent = i + 1; svg.appendChild(t);
      if (!phone) {
        var l = sv("text", { x: p.x, y: p.y - 10, "text-anchor": "middle", fill: "#EEECE4", "font-family": "Archivo, sans-serif", "font-size": 11, "font-weight": 600, opacity: 0.85 });
        l.textContent = STEPS[i].short; svg.appendChild(l);
      }
    });
    var dust = sv("g", {}); svg.appendChild(dust);
    var scale = (phone ? 34 : 48) / 345;
    var g = sv("g", {}), inner = sv("g", { transform: "scale(" + scale + ") translate(0 -18)" }), rock = sv("g", {});
    rock.appendChild(sv("path", { d: CELLA_D, fill: "#EEECE4" }));
    rock.appendChild(sv("circle", { cx: -58.2, cy: -262, r: 18, fill: "#142620" }));
    rock.appendChild(sv("circle", { cx: 4.9, cy: -262, r: 18, fill: "#142620" }));
    inner.appendChild(rock); g.appendChild(inner); svg.appendChild(g);
    var xs = [pts[0].x - 14 * (phone ? 0.7 : 1)].concat(pts.slice(1, -1).map(function (p) { return p.x + (phone ? 10 : 16); }));
    var keepX = P && P.w === w ? P.x : xs[0];
    P = { pts: pts, xs: xs, g: g, rock: rock, dust: dust, scale: scale, x: keepX, target: keepX, w: w, lastStep: 0, puffs: [] };
    place(P.x, 0, -1);
  }
  function place(x, rockAngle, side) {
    P.g.setAttribute("transform", "translate(" + x + " " + yAt(P.pts, x) + ") rotate(" + angAt(P.pts, x) + ")");
    var px = side < 0 ? -131 : 131;
    P.rock.setAttribute("transform", "translate(" + px + " 0) rotate(" + rockAngle + ") translate(" + (-px) + " 0)");
  }
  function puff(x) {
    var y = yAt(P.pts, x);
    for (var i = 0; i < 5; i++) {
      var c = sv("circle", { cx: x, cy: y, r: 1.5 + Math.random() * 2, fill: "#EEECE4" });
      P.dust.appendChild(c);
      P.puffs.push({ c: c, x: x, y: y, vx: (Math.random() - 0.5) * 1.6, vy: -0.4 - Math.random() * 0.9, life: 1 });
    }
  }
  var climbs = $$(".climb[data-i]");
  function target() {
    if (!P) return;
    var line = innerHeight * 0.45, pos = 0;
    climbs.forEach(function (s, i) { var r = s.getBoundingClientRect(); if (r.top < line) pos = i + Math.min(1, (line - r.top) / r.height); });
    var k = Math.min(climbs.length, pos), i = Math.floor(k), f = k - i;
    var a = P.xs[Math.min(i, P.xs.length - 1)], b = P.xs[Math.min(i + 1, P.xs.length - 1)];
    P.target = a + (b - a) * Math.min(1, f * 1.6);
    var cur = k <= 0 ? 0 : Math.min(STEPS.length, Math.floor(k) + 1); /* the climb whose top has passed the line */
    $("#nowNo").textContent = cur ? "Climb " + cur + " of " + STEPS.length : "Start";
    $("#nowLabel").textContent = cur ? STEPS[cur - 1].label : "Cella at the bottom";
    if (RM) { P.x = P.target; place(P.x, 0, -1); } else if (!raf) raf = requestAnimationFrame(tick);
  }
  var STEP = 26; /* px per rock */
  function tick() {
    raf = 0;
    if (!P) return;
    var dx = P.target - P.x, moving = Math.abs(dx) > 0.5;
    P.x += Math.sign(dx) * Math.min(Math.abs(dx), 2.0); /* heavy: never faster than this */
    var travelled = Math.abs(P.xs[0] - P.x) / STEP, k = Math.floor(travelled), f = travelled - k;
    var side = k % 2 === 0 ? -1 : 1; /* rock onto one pillar, then the other */
    place(P.x, moving ? Math.sin(f * Math.PI) * 7 * side : 0, side);
    if (moving && k !== P.lastStep) { P.lastStep = k; puff(P.x + side * 131 * P.scale); }
    P.puffs = P.puffs.filter(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life -= 0.025;
      p.c.setAttribute("cx", p.x); p.c.setAttribute("cy", p.y); p.c.setAttribute("opacity", Math.max(0, p.life));
      if (p.life <= 0) { p.c.remove(); return false; } return true;
    });
    if (moving || P.puffs.length) raf = requestAnimationFrame(tick);
  }
  addEventListener("scroll", target, { passive: true });
  addEventListener("resize", function () { layout(); target(); });
  layout(); target();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); target(); });
})();
