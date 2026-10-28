/* landing.js: slides before the house. Loads the 3D house (three.js) only when you step in. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, C = window.CASA, P = C.P;
  var loaded = false;
  function store(v) { try { localStorage.setItem("naos-landing", v); } catch (e) {} }

  function loadHouse() {
    if (loaded) return; loaded = true;
    import("../../prototipos/casa3d/js/app.js").catch(function (e) { console.warn("landing: house did not load", e); });
  }
  function enter(viaHash) {
    store("1");
    root.classList.remove("landing-on");
    if (!viaHash && !/^#\/[a-z]/.test(location.hash)) { try { history.replaceState(null, "", location.pathname + "#/"); } catch (e) { location.hash = "#/"; } }
    else if (/[?&]intro\b/.test(location.search)) { try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {} }
    loadHouse();
  }
  if (!root.classList.contains("landing-on")) { loadHouse(); return; }

  // ---- palettes per slide ----
  var PAL = { papel: { campo: "#F6E8CB", tinta: "#0E1116", cuerpo: "#0E1116" } };
  function pal(k) { return PAL[k] || P[k]; }
  var slides = [].slice.call(doc.querySelectorAll(".l-slide"));
  slides.forEach(function (s) {
    var p = pal(s.dataset.pal);
    s.style.setProperty("--bg", p.campo); s.style.setProperty("--fg", p.tinta);
  });

  // ---- Cella with white eyes, drawn with figura.js + cella-brazos.js ----
  var arms = { 1: [0, 0], 3: [0, 40], 8: [34, 34] };
  [].forEach.call(doc.querySelectorAll("[data-cella]"), function (el) {
    var i = +el.dataset.cella, p = pal(el.closest(".l-slide").dataset.pal), a = arms[i] || [0, 0];
    try {
      var g = window.NAOS_BRAZOS.cella({ cx: 120, base: 212, s: 1, p: { tx: p.cuerpo || p.tinta, bg: "#FFFFFF" }, b: 0.3, abre: 1, izq: a[0], der: a[1], id: "lc" + i });
      el.innerHTML = '<svg viewBox="0 0 240 240" style="overflow:visible" focusable="false">' + g + "</svg>";
    } catch (e) { console.warn("landing: Cella", e); }
  });

  // ---- the rooms (slide 5) ----
  var lines = { cocina: "Eat your next meal with someone.", alcoba: "Sleeping well is a quiet rebellion.", escaleras: "Movement snacks, at my pace.",
    mesa: "Come over, sit down.", puerta: "Open the door.", ventana: "A window out.", patio: "The heart where everything meets." };
  var ul = doc.getElementById("l-rooms");
  ["cocina", "alcoba", "escaleras", "mesa", "puerta", "ventana", "patio"].forEach(function (k) {
    var r = C.cuartos[k], p = P[r.pal], li = doc.createElement("li");
    li.style.setProperty("--c", p.campo); li.style.setProperty("--t", p.tinta);
    li.innerHTML = "<span></span><b></b><em></em>";
    li.children[0].textContent = r.nombre; li.children[1].textContent = r.palabra; li.children[2].textContent = lines[k];
    ul.appendChild(li);
  });

  // ---- carousel ----
  var track = doc.getElementById("l-track"), prev = doc.getElementById("l-prev"), next = doc.getElementById("l-next"), dots = doc.getElementById("l-dots");
  var cur = 0, reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  slides.forEach(function (s, i) {
    var li = doc.createElement("li"), b = doc.createElement("button");
    b.type = "button"; b.setAttribute("aria-label", "Go to slide " + (i + 1) + " of " + slides.length);
    b.addEventListener("click", function () { go(i); });
    li.appendChild(b); dots.appendChild(li);
  });
  function go(i, focus) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? "auto" : "smooth" });
    if (focus) set(i);
  }
  function set(i) {
    cur = i;
    slides.forEach(function (s, k) { if (k === i) s.removeAttribute("inert"); else s.setAttribute("inert", ""); s.setAttribute("aria-hidden", k === i ? "false" : "true"); });
    [].forEach.call(dots.querySelectorAll("button"), function (b, k) { if (k === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    doc.getElementById("l-count").textContent = (i + 1) + " / " + slides.length;
    prev.disabled = i === 0; next.disabled = i === slides.length - 1;
    var p = pal(slides[i].dataset.pal);
    root.style.setProperty("--l-fg", p.tinta);
    doc.getElementById("landing").style.background = p.campo;
    doc.querySelector(".l-brand").style.color = p.tinta;
  }

  track.addEventListener("scroll", function () {
    var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    if (i !== cur) set(i);
  }, { passive: true });
  window.addEventListener("resize", function () { track.scrollTo({ left: cur * track.clientWidth, behavior: "auto" }); });
  prev.addEventListener("click", function () { go(cur - 1); });
  next.addEventListener("click", function () { go(cur + 1); });
  doc.addEventListener("keydown", function (e) {
    if (!root.classList.contains("landing-on") || e.altKey || e.ctrlKey || e.metaKey) return;
    var tg = e.target && e.target.tagName;
    if (e.key === "ArrowRight" || (e.key === "PageDown")) { go(cur + 1); e.preventDefault(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { go(cur - 1); e.preventDefault(); }
    else if (e.key === "Home" && tg !== "A") { go(0); e.preventDefault(); }
    else if (e.key === "End" && tg !== "A") { go(slides.length - 1); e.preventDefault(); }
  });
  doc.getElementById("l-step").addEventListener("click", function () { enter(false); });
  [].forEach.call(doc.querySelectorAll("[data-enter]"), function (b) { b.addEventListener("click", function () { enter(false); }); });
  window.addEventListener("hashchange", function () { if (/^#\/[a-z]/.test(location.hash) && root.classList.contains("landing-on")) enter(true); });
  set(0);
  if (!window.CASA_RAIZ) window.CASA_RAIZ = "prototipos/casa3d/";
})();
