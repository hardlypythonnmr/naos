/* sala.js · PAG-03.2, PAG-03.3, PAG-01.4 (D-221). Necesita assets/comun/naos.js. Lo llama v1plus.js con los datos ya filtrados.
 * Sala de monitoreo por historia (diálogo en bento, enlazable con #sala/<id> o ?sala=<id>, Esc cierra, foco atrapado, el botón
 * atrás cierra), mapa de historias en la portada (lugares encendidos unidos a sus activos y a su mercado) y el gráfico
 * "cómo leemos el día". Todo sale de d.salas y d.lectura (construir-datos.mjs); sin dato, la pieza no se dibuja. */
(function () {
  "use strict";
  const N = window.NAOS;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => N.esc(s ?? "");
  const SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- geografía: Mercator propio (mundo.json) y el del mapa regional (mapa.json, ajustado a sus marcas) ---------- */
  const merc = (lat) => -Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI;
  const Y_N = merc(80), Y_S = merc(-58);
  let mundo = null, tierra = null;
  const cargarMundo = async () => (mundo = mundo || (await (await fetch("data/mundo.json")).json()));
  const tierraMundo = () => tierra || (tierra = mundo.mundo.map((r) => "M" + r.map(([x, y]) => x + "," + merc(y).toFixed(1)).join("L") + "Z").join(""));
  // mapa.json no trae su proyección: se ajusta x = a·lon + b, y = c·merc(lat) + e por mínimos cuadrados sobre sus marcas
  const ajuste = (m) => {
    if (m.__P) return m.__P;
    const lsq = (p) => { const n = p.length, sx = p.reduce((s, [a]) => s + a, 0), sy = p.reduce((s, [, b]) => s + b, 0),
      sxx = p.reduce((s, [a]) => s + a * a, 0), sxy = p.reduce((s, [a, b]) => s + a * b, 0); const k = (n * sxy - sx * sy) / (n * sxx - sx * sx); return [k, (sy - k * sx) / n]; };
    const [a, b] = lsq(m.marcas.map((k) => [k.lon, k.xy[0]])), [c, e] = lsq(m.marcas.map((k) => [merc(k.lat), k.xy[1]]));
    return (m.__P = (lon, lat) => [a * lon + b, c * merc(lat) + e]);
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ---------- formato ---------- */
  const horaTxt = (iso) => (!iso ? "" : iso.length > 10 ? `${N.fecha(iso)} ${iso.slice(11, 16)} UTC` : N.fecha(iso));
  const AREA = { Politics: "Politics, as market impact" };
  // la cifra de predicción ya armada por el constructor: "Markets price it: 14% that ... (Polymarket, 14 Oct 17:00 UTC)"
  const partesOdds = (o) => { const m = /:\s*(\d+)%\s*(.*?)\s*\((Polymarket),\s*([^)]+)\)/.exec(o.texto || "");
    return m ? { p: m[1], resultado: m[2], fuente: m[3], hora: m[4] } : { p: o.p, resultado: "", fuente: "Polymarket", hora: horaTxt(o.leido_utc) }; };

  /* ---------- odds: "Market odds of <resultado>: 14%" a la vista; "The market's odds of <resultado> are inside" cuando la cifra está en la sala.
     Polymarket se nombra como fuente, en letra chica, con la hora. Una cifra por historia. */
  const resultadoDe = (o) => o.resultado || partesOdds(o).resultado || "this outcome";
  const deQue = (o) => (/^that /.test(resultadoDe(o)) ? "" : "of ") + resultadoDe(o);
  N.oddsTxt = (o) => `Market odds ${deQue(o)}`;
  N.oddsDentro = (o) => `The market's odds ${deQue(o)} are inside`;
  N.oddsFuente = (o) => `Polymarket, ${horaTxt(o.leido_utc)}`;
  N.oddsHTML = (o) => !o ? "" : `<a href="${esc(o.url)}" rel="noopener">${esc(N.oddsTxt(o))}: <b class="num">${esc(o.p)}%</b></a> <span class="sello">${esc(N.oddsFuente(o))}</span>`;

  /* ---------- cifras clave en la cabecera (D-221 r3): una a tres, los movimientos y la única cifra de odds; lo hondo va abajo ---------- */
  N.cifras = (items) => { const xs = items.filter(Boolean).slice(0, 3); if (!xs.length) return "";
    return `<span class="cifras">${xs.map((x) => x.odds
      ? `<span class="cf cf-o" title="${esc(N.oddsTxt(x.odds))}. ${esc(N.oddsFuente(x.odds))}"><span class="cf-k">Odds</span><b class="num">${esc(x.odds.p)}%</b></span>`
      : `<span class="cf"><span class="cf-k">${esc(x.k)}</span><b class="num">${esc(x.v)}</b>${x.a && x.a.cambio != null ? ` <span class="${N.dir(x.a.cambio)}">${N.tri(x.a.cambio)} ${esc(N.cambioTxt(x.a))}</span>` : ""}</span>`).join("")}</span>`; };
  N.cifrasSala = (s, ctx, n = 2) => [...s.activos.map((id) => ctx.A[id]).filter((a) => a && a.fresco).slice(0, n).map((a) => ({ k: ctx.nombreCorto[a.id] || a.nombre, v: ctx.val(a), a })), s.odds ? { odds: s.odds } : null];

  /* ---------- conectores: líneas entre elementos (mapa de historias y gráfico "cómo leemos") ---------- */
  function conectar(svg, caja, pares) {
    const r0 = caja.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${r0.width} ${r0.height}`);
    svg.setAttribute("width", r0.width); svg.setAttribute("height", r0.height);
    svg.innerHTML = pares.map(([a, b, cls, modo, dato]) => {
      if (!a || !b || !a.offsetParent || !b.offsetParent) return "";
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      let d;
      if (modo === "pin") { // del centro del alfiler al borde izquierdo de su fila, en ángulo recto, cada una en su carril
        const x1 = ra.left + ra.width / 2 - r0.left, y1 = ra.top + ra.height / 2 - r0.top, x2 = rb.left - r0.left - 6, y2 = rb.top + Math.min(22, rb.height / 2) - r0.top;
        if (x2 - x1 < 30) return "";
        const xm = x2 - 10 - (pares.indexOf(pares.find((q) => q[1] === b)) % 6) * 5; d = `M${x1.toFixed(1)},${y1.toFixed(1)}H${xm.toFixed(1)}V${y2.toFixed(1)}H${x2.toFixed(1)}`;
      } else if (rb.left - ra.right > 24) { // de lado: curva del borde derecho al izquierdo
        const x1 = ra.right - r0.left, y1 = ra.top + ra.height / 2 - r0.top, x2 = rb.left - r0.left, y2 = rb.top + rb.height / 2 - r0.top, k = (x2 - x1) / 2;
        d = `M${x1.toFixed(1)},${y1.toFixed(1)}C${(x1 + k).toFixed(1)},${y1.toFixed(1)} ${(x2 - k).toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
      } else { // apilado: de abajo hacia arriba
        const x1 = ra.left + ra.width / 2 - r0.left, y1 = ra.bottom - r0.top, x2 = rb.left + rb.width / 2 - r0.left, y2 = rb.top - r0.top;
        if (y2 - y1 < 8) return "";
        const k = (y2 - y1) / 2; d = `M${x1.toFixed(1)},${y1.toFixed(1)}C${x1.toFixed(1)},${(y1 + k).toFixed(1)} ${x2.toFixed(1)},${(y2 - k).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
      }
      return `<path class="${cls || ""}" d="${d}"${dato ? ` data-lugar="${esc(dato)}"` : ""}/>`;
    }).join("");
    return $$("path", svg);
  }
  // las líneas se dibujan una vez, a velocidad constante (G3); con movimiento reducido quedan dibujadas
  const trazar = (paths, retraso = 0) => { if (N.rm || !window.gsap) return;
    paths.forEach((p, i) => { const L = p.getTotalLength(); gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: Math.max(.4, L / 700), ease: "none", delay: retraso + i * .12,
      onComplete: () => gsap.set(p, { clearProps: "strokeDasharray,strokeDashoffset" }) }); }); };

  /* ================= cómo leemos el día (PAG-01.4) ================= */
  N.comoLeemos = (el, d, ctx) => {
    const L = d.lectura; if (!el || !L) { if (el) el.hidden = true; return; }
    const hoy = (L.hoy || []).filter((x) => x && x.t);
    const ol = $("#hoy");
    if (!ol) {} else if (hoy.length) { ol.innerHTML = hoy.map((x, i) => `<li data-k="${esc(x.k)}"><span class="hoy-i num">${String(i + 1).padStart(2, "0")}</span><span>${x.k === "liga" ? '<span class="beta">Beta</span> ' : ""}${esc(x.t)}</span></li>`).join("");
      $("#hoy-h").textContent = `Today's read · ${horaTxt(d.generado)}`; }
    else { ol.hidden = true; $("#hoy-h").hidden = true; }
    const pl = (n, s, p = s + "s") => `${N.fmt(n)} ${n === 1 ? s : p}`;
    const ej = (d.salas || []).find((s) => s.id === L.ejemplo) || null, A = ctx?.A || {};
    const a = ej && ej.activos.map((id) => A[id]).find((x) => x && x.fresco);
    const nodo = (k, t, ejemplo, cuenta, extra = "") => `<div class="cn ${extra}" data-n="${k}"><span class="cn-t cond">${t}</span>${ejemplo ? `<span class="cn-e">${ejemplo}</span>` : ""}<span class="cn-s">${cuenta}</span></div>`;
    const g = $(".como-g", el);
    g.innerHTML = `<svg class="como-l" aria-hidden="true"></svg>` +
      `<div class="cn-col">` +
      nodo("noticias", "News", ej ? `${esc(ej.fuente)}, ${esc(horaTxt(ej.hora))}: “${esc(ej.titulo)}”` : "", `${pl(L.wire, "headline")} on the wire, ${pl(L.titulares, "headline")} scanned`) +
      nodo("datos", "US data and prices", a ? `${esc(ctx.nombreCorto[a.id] || a.nombre)} ${esc(ctx.val(a))}${a.cambio != null ? " " + N.cambioHTML(a) : ""} <span class="sello">${esc(a.fuente)}</span>` : "", `${pl(L.frescas, "fresh reading")}: Treasury yields, the BLS calendar, the dollar, crypto, metals`) +
      nodo("mercados", "Prediction markets", ej?.odds ? `${esc(N.oddsTxt(ej.odds))}: <b class="num">${esc(ej.odds.p)}%</b> <span class="sello">${esc(N.oddsFuente(ej.odds))}</span>` : "", `${pl(L.mercados_leidos, "market")} checked against the rules, odds shown for ${pl(L.mercados_mostrados, "story", "stories")}`) +
      `</div><div class="cn-col">` + nodo("mapa", `NAOS story map <span class="beta">Beta</span>`, ej?.ligado?.historia ? `${ej.ligado.palabras.map((w) => `“${esc(w)}”`).join(" and ")} → ${esc(ej.ligado.historia)}` : "", "words in a headline point to a place, its assets and one market", "centro") +
      `</div><div class="cn-col">` + nodo("sala", "Monitor room", ej ? `<a href="#sala/${esc(ej.id)}" data-sala="${esc(ej.id)}">Open today's example</a>` : "", `${pl(L.salas, "story", "stories")} with a room today`, "fin") + `</div>`;
    g.setAttribute("aria-label", `How NAOS reads the day${ej ? ", with today's example" : ""}: news, US data and prices, and prediction markets feed the NAOS story map, which opens a monitor room for each of ${L.salas} stories.`);
    const svg = $(".como-l", g), n = (k) => $(`[data-n="${k}"]`, g);
    let hecho = false;
    const dibujar = () => { const ps = conectar(svg, g, [[n("noticias"), n("mapa")], [n("datos"), n("mapa")], [n("mercados"), n("mapa")], [n("mapa"), n("sala"), "fuerte"]]);
      if (!hecho && ps.length) { hecho = true; if (!N.rm && window.ScrollTrigger) { ps.forEach((p) => { const Lp = p.getTotalLength(); gsap.set(p, { strokeDasharray: Lp, strokeDashoffset: Lp }); });
        ScrollTrigger.create({ trigger: g, start: "top 85%", once: true, onEnter: () => trazar(ps, .2) }); } } };
    new ResizeObserver(dibujar).observe(g);
  };

  /* ================= la sala ================= */
  N.salas = (d, ctx) => {
    const salas = (d.salas || []).filter((s) => s && s.id && s.titulo);
    const porId = Object.fromEntries(salas.map((s) => [s.id, s]));
    const porUrl = Object.fromEntries(salas.map((s) => [s.url, s]));
    const dlg = $("#sala");
    const api = { porId, porUrl, salas, abrir: () => {}, enlace: (url) => porUrl[url] || null };
    if (!dlg || !salas.length) return api;
    const A = ctx.A;
    const vivoFresco = (id) => A[id] && A[id].fresco ? A[id] : null;
    const fechado = (id) => A[id] && !A[id].fresco ? A[id] : null;

    /* ---------- piezas del bento ---------- */
    const tile = (cls, titulo, cuerpo, sello = "", beta = false) => `<section class="t ${cls}" aria-label="${esc(titulo)}"><header class="t-h"><h3>${esc(titulo)}${beta ? ' <span class="beta">Beta</span>' : ""}</h3>${sello ? `<span class="sello">${sello}</span>` : ""}</header>${cuerpo}</section>`;
    const fichas = (txt, cls = "") => [...txt].map((c) => `<span class="ficha ${cls}" aria-hidden="true">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
    const CODIGO = { BTC: "BTC", ETH: "ETH", SOL: "SOL", XAU: "GOLD", XAG: "SILV", US2Y: "2Y", US10Y: "10Y", US30Y: "30Y", S2S10: "2S10S", USD: "NAOS$", EURUSD: "EUR", USDJPY: "JPY" };

    function piezaOdds(s) {
      if (!s.odds) return "";
      const o = partesOdds(s.odds);
      return tile("t-odds", "Market odds", `<p class="odds-n num">${esc(o.p)}<span>%</span></p><p class="odds-r">${esc(N.oddsTxt(s.odds))}</p>` +
        `<p class="sello">Source: ${esc(o.fuente)} · read ${esc(o.hora)} · <a href="${esc(s.odds.url)}" rel="noopener">Open the market</a></p>` +
        `<p class="sello odds-s">${esc(d.odds_sello || "Market odds are prices set by traders, not NAOS forecasts. Not financial advice.")} No odds history is kept.</p>`, "one number for this story", true);
    }
    function piezaCinta(s) {
      const fr = s.activos.map(vivoFresco).filter(Boolean), fe = s.activos.map(fechado).filter(Boolean), ot = s.otros || [];
      if (!fr.length && !fe.length && !ot.length) return "";
      const filas = fr.map((a) => { const m = a.cambio == null ? "" : N.tri(a.cambio) + N.cambioTxt(a).replace(" ", "");
        return `<div class="fila-t" role="row"><span class="tiras" role="cell" aria-label="${esc(a.nombre)}">${fichas((CODIGO[a.id] || a.id).padEnd(5))}</span>` +
          `<span class="tiras" role="cell" aria-label="${esc(ctx.val(a))}">${fichas(ctx.val(a).replace("$", ""))}</span>` +
          `<span class="tiras" role="cell" aria-label="${m ? esc(N.cambioTxt(a)) : "no change given"}">${m ? fichas(m, "chica " + N.dir(a.cambio)) : ""}</span></div>`; }).join("");
      const sellos = [...new Set(fr.map((a) => `${a.fuente} ${a.fecha.length > 10 ? a.fecha.slice(11, 16) + " UTC" : N.fecha(a.fecha)}`))].join(" · ");
      return tile("t-cinta", "Assets", (fr.length ? `<div class="tablero" role="table" aria-label="Assets, fresh readings">${filas}</div><p class="sello">${esc(sellos)}${fr.some((a) => a.cambio == null) ? " · metals: price only, the source gives no change" : ""}</p>` : "") +
        (fe.length ? `<p class="t-nota"><span class="tit-k">Dated, kept off the tape</span>${fe.map((a) => `${esc(a.nombre)} ${esc(ctx.val(a))}, as of ${N.fecha(a.fecha)} (${esc(a.fuente)})`).join("; ")}.</p>` : "") +
        (ot.length ? `<p class="t-nota"><span class="tit-k">Also named, no quote here</span>${ot.map((x) => `${esc(x.simbolo)} ${esc(x.nombre)}`).join(" · ")}</p>` : ""), "from the story map", true);
    }
    function piezaGrafico(s) {
      const a = s.activos.map(vivoFresco).find((x) => x && x.serie?.length > 4);
      if (a) return tile("t-graf", "Market reaction", `<div class="graf-c" data-sala-linea="${a.id}"></div><p class="sello">${esc(a.nombre)}, ${N.fecha((a.serie90 || a.serie)[0][0])} to ${N.fecha((a.serie90 || a.serie).at(-1)[0])} · ${esc(a.id === "BTC" || a.id === "ETH" || a.id === "SOL" ? "Data provided by CoinGecko" : a.fuente)}</p>`);
      if (s.tv) return tile("t-graf", "Market reaction", `<div class="tv" data-sala-tv="${esc(s.tv.simbolo)}" style="--tvh:220px"><p class="tv-espera sello">TradingView chart loads here</p></div><p class="sello">${esc(s.tv.etiqueta)}</p>`);
      return "";
    }
    function piezaTiempo(s) {
      const ev = [{ h: s.hora, t: `${s.fuente} publishes the headline`, yo: true }];
      for (const r of s.relacionados || []) ev.push({ h: r.hora, t: r.titulo, f: r.fuente, url: r.url });
      for (const a of s.activos.map(vivoFresco).filter(Boolean)) ev.push({ h: a.fecha, t: `${ctx.nombreCorto[a.id] || a.nombre} ${ctx.val(a)}${a.cambio != null ? ", " + N.cambioTxt(a) : ""}`, f: a.fuente, lectura: true });
      if (s.odds) ev.push({ h: s.odds.leido_utc, t: "Market odds read for this story", f: "Polymarket", url: s.odds.url, lectura: true });
      const prox = d.calendario?.proximo;
      if (prox && s.lugar?.id === "washington") ev.push({ h: prox.hora, t: `Next: US ${prox.evento.replace(/ [my]\/[my]$/, "")}`, f: prox.publicador, url: prox.url, futuro: true });
      const t = (x) => Date.parse(x.h.length === 10 ? x.h + "T12:00:00Z" : x.h);
      ev.sort((a, b) => t(a) - t(b));
      return tile("t-tiempo", "Timeline", `<ol class="tl">${ev.map((x) => `<li class="${x.futuro ? "futuro" : "ya"}${x.yo ? " yo" : ""}${x.lectura ? " lectura" : ""}"><span class="tl-h num">${esc(horaTxt(x.h))}</span>` +
        `<span class="tl-t">${x.url ? `<a href="${esc(x.url)}" rel="noopener">${esc(x.t)}</a>` : esc(x.t)}</span>${x.f ? `<span class="sello">${esc(x.f)}</span>` : ""}</li>`).join("")}</ol>`,
        (s.relacionados || []).length ? `${s.relacionados.length} related headline${s.relacionados.length > 1 ? "s" : ""}, verbatim` : "the headline and its readings");
    }
    const piezaDicen = (s) => !s.dicen ? "" : tile("t-dicen", "What people are saying", `<p class="dicen-n"><b class="num">${N.fmt(s.dicen.puntos)}</b> points <b class="num">${N.fmt(s.dicen.comentarios)}</b> comments</p><p class="t-nota">On ${esc(s.dicen.fuente)}, where readers ranked and discussed this link.</p><p class="sello"><a href="${esc(s.dicen.url)}" rel="noopener">Read the discussion</a></p>`);
    function piezaLigado(s) {
      const L = s.ligado || {}, q = (w) => `“${esc(w)}”`, partes = [];
      if (L.historia) partes.push(`The headline uses ${L.palabras.map(q).join(" and ")}, words NAOS files under “${esc(L.historia)}”. That entry lists the assets in this room` +
        (s.odds ? " and its market odds." : ". Its market did not pass the NAOS rules this run, so no odds show here."));
      else partes.push("No entry on the NAOS story map matched this headline, so this room has no market odds.");
      if (s.lugar) partes.push(L.lugar_palabra ? `${q(L.lugar_palabra)} in the headline places it in ${esc(s.lugar.nombre)}.` : `The story map entry places it in ${esc(s.lugar.nombre)}.`);
      return tile("t-liga", "Why this room", partes.map((p) => `<p>${p}</p>`).join("") + `<p class="sello">Descriptive, not advice. A match of words, not a finding.</p>`, "", true);
    }
    function piezaFuentes(s) {
      const f = [[s.fuente, s.url, "headline"]];
      for (const r of s.relacionados || []) if (!f.some((x) => x[0] === r.fuente)) f.push([r.fuente, r.url, "related"]);
      for (const a of s.activos.map((id) => A[id]).filter(Boolean)) { const n = /CoinGecko/.test(a.fuente) ? "Data provided by CoinGecko" : a.fuente; if (!f.some((x) => x[0] === n)) f.push([n, a.fuente_url, "readings"]); }
      if (s.odds) f.push(["Polymarket", s.odds.url, "market price"]);
      if (s.tv) f.push(["TradingView", "https://www.tradingview.com/", "chart"]);
      if (s.dicen) f.push([s.dicen.fuente + (f.some((x) => x[0] === s.dicen.fuente) ? " discussion" : ""), s.dicen.url, "discussion"]);
      if (s.lugar) f.push(["Natural Earth", "https://www.naturalearthdata.com", "map"]);
      return tile("t-fuentes", "Sources", `<ul class="fu">${f.map(([n, u, k]) => `<li>${u ? `<a href="${esc(u)}" rel="noopener">${esc(n)}</a>` : esc(n)}<span class="sello">${k}</span></li>`).join("")}</ul>`);
    }
    const piezaMapa = (s) => !s.lugar ? "" : tile("t-mapa", "Where", `<div class="m-caja" data-sala-mapa></div>`, `${esc(s.lugar.nombre)} · Natural Earth`);

    async function dibujarMapa(caja, s) {
      const otras = salas.filter((x) => x.lugar && x.id !== s.id);
      const reg = await N.cargarMapa("data/mapa.json"), P = ajuste(reg);
      const [x, y] = P(s.lugar.lon, s.lugar.lat);
      let vb, svg, pt, pts = [];
      if (x > 30 && x < reg.w - 30 && y > 30 && y < reg.h - 30) { // dentro del arco: el mapa regional de la página
        const W = 640, H = 470, vx = clamp(x - W / 2, 0, reg.w - W), vy = clamp(y - H / 2, 0, reg.h - H); vb = [vx, vy, W, H];
        svg = `<path class="m-t" d="${reg.land}"/><path class="m-b" d="${reg.borders}"/>${reg.rutas.map((r) => `<path class="${r.id === "lane" ? "m-c" : "m-r"}" d="${r.d}"/>`).join("")}`;
        pt = [x, y]; pts = otras.map((o) => [o, ...P(o.lugar.lon, o.lugar.lat)]);
      } else { // fuera del arco: el mundo, Mercator
        await cargarMundo();
        const W = 96, H = 64, my = merc(s.lugar.lat), vx = clamp(s.lugar.lon - W / 2, -180, 180 - W), vy = clamp(my - H / 2, Y_N, Y_S - H); vb = [vx, vy, W, H];
        svg = `<path class="m-t" d="${tierraMundo()}"/>`; pt = [s.lugar.lon, my]; pts = otras.map((o) => [o, o.lugar.lon, merc(o.lugar.lat)]);
      }
      const pc = (px, py) => [((px - vb[0]) / vb[2] * 100).toFixed(2), ((py - vb[1]) / vb[3] * 100).toFixed(2)];
      const dentro = (px, py) => px > vb[0] && px < vb[0] + vb[2] && py > vb[1] && py < vb[1] + vb[3];
      const [lx, ly] = pc(...pt);
      caja.style.aspectRatio = `${vb[2]} / ${vb[3]}`;
      caja.innerHTML = `<svg viewBox="${vb.join(" ")}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${svg}</svg>` +
        pts.filter(([, px, py]) => dentro(px, py) && Math.hypot(px - pt[0], py - pt[1]) > vb[2] * .04).map(([o, px, py]) => { const [a, b] = pc(px, py);
          return `<a class="m-otra${Number(a) > 70 ? " izq" : ""}" href="#sala/${esc(o.id)}" data-sala="${esc(o.id)}" style="left:${a}%;top:${b}%" aria-label="Open the monitor room: ${esc(o.titulo)}"><span>${esc(o.lugar.nombre)}</span></a>`; }).join("") +
        `<span class="m-aqui${Number(lx) > 62 ? " izq" : ""}" style="left:${lx}%;top:${ly}%"><span>${esc(s.lugar.nombre)}</span></span>`;
      // rótulos siempre dentro del marco: si se salen por un lado, pasan al otro
      const dentro2 = () => { const rc = caja.getBoundingClientRect();
        $$(".m-aqui, .m-otra", caja).forEach((m) => { const sp = $("span", m); if (!sp) return; let r = sp.getBoundingClientRect();
          if (r.right > rc.right - 2) m.classList.add("izq"); else if (r.left < rc.left + 2) m.classList.remove("izq");
          r = sp.getBoundingClientRect(); if (r.left < rc.left + 2 || r.right > rc.right - 2) sp.style.maxWidth = (Math.max(rc.right - r.left, r.right - rc.left) - 6) + "px"; }); };
      dentro2(); new ResizeObserver(dentro2).observe(caja);
    }

    // bento sin huecos: cada fila suma 12 columnas con las piezas que esta sala sí tiene
    function maquetar(b) {
      const t = (c) => $(".t-" + c, b), pon = (el, n, filas = 1) => { if (el) { el.style.gridColumn = `span ${n}`; el.style.gridRow = filas > 1 ? `span ${filas}` : ""; } };
      const mapa = t("mapa"); let lado = [t("odds"), t("cinta")].filter(Boolean), graf = t("graf");
      if (mapa && !lado.length && graf) { lado = [graf]; graf = null; }
      if (mapa) { pon(mapa, lado.length ? 7 : 12, Math.max(1, lado.length)); lado.forEach((x) => pon(x, 5)); }
      else if (lado.length === 2) { pon(lado[0], 5); pon(lado[1], 7); } else lado.forEach((x) => pon(x, 12));
      const tiempo = t("tiempo"); if (tiempo && graf) { pon(tiempo, 7); pon(graf, 5); } else pon(tiempo || graf, 12);
      const resto = [t("dicen"), t("liga"), t("fuentes")].filter(Boolean); resto.forEach((x) => pon(x, 12 / resto.length));
      [mapa, ...lado, tiempo, graf, ...resto].filter(Boolean).forEach((x) => b.appendChild(x)); // el orden del DOM sigue al de las filas
    }

    /* ---------- abrir, cerrar, historia del navegador ---------- */
    let abierta = null, porPush = false, antes = null;
    function pintar(s) {
      const i = salas.indexOf(s), ant = salas[(i - 1 + salas.length) % salas.length], sig = salas[(i + 1) % salas.length];
      dlg.innerHTML = `<div class="sala-in">` +
        `<header class="sala-cab"><p class="sala-k"><span class="cond">Monitor room</span><span class="cond sala-area">${esc(AREA[s.area] || s.area || "")}</span><span class="sello">${i + 1} of ${salas.length}</span>` +
        `<button type="button" class="sala-x" data-cerrar>Close <kbd>Esc</kbd></button></p>` +
        `<div class="sala-tc"><h2 class="sala-t" id="sala-t" tabindex="-1">${esc(s.titulo)}</h2>${N.cifras(N.cifrasSala(s, ctx))}</div>` +
        `<p class="sala-m">${esc(s.fuente)} · ${esc(horaTxt(s.hora))} · headline verbatim · <a href="${esc(s.url)}" rel="noopener">Read the original</a></p><p class="sello beta-l"><span class="beta">Beta</span> Experimental: these may be related; we do not claim one causes the other.</p></header>` +
        `<div class="bento">${piezaMapa(s)}${piezaOdds(s)}${piezaCinta(s)}${piezaTiempo(s)}${piezaGrafico(s)}${piezaDicen(s)}${piezaLigado(s)}${piezaFuentes(s)}</div>` +
        (salas.length > 1 ? `<nav class="sala-nav" aria-label="Other monitor rooms"><a href="#sala/${esc(ant.id)}" data-sala="${esc(ant.id)}"><span class="cond">Previous room</span>${esc(ant.titulo)}</a>` +
          `<a href="#sala/${esc(sig.id)}" data-sala="${esc(sig.id)}"><span class="cond">Next room</span>${esc(sig.titulo)}</a></nav>` : "") +
        `<p class="sello sala-pie">Descriptive, not financial advice. Prices and headlines carry their source and time. Data as of ${esc(d.genTxt)}.</p></div>`;
      maquetar($(".bento", dlg));
      const caja = $("[data-sala-mapa]", dlg); if (caja) dibujarMapa(caja, s).catch((e) => { console.error(e); caja.closest(".t").hidden = true; });
      $$("[data-sala-linea]", dlg).forEach((e) => { const a = A[e.dataset.salaLinea]; N.linea(e, a.serie90 || a.serie, { h: 170, dec: ctx.DEC[a.id] ?? 2, pre: a.unidad === "USD" ? "$" : "", suf: a.unidad === "%" ? "%" : "", titulo: a.nombre, start: "top 100%" }); });
      $$("[data-sala-tv]", dlg).forEach((e) => ctx.montarTV(e, "mini-symbol-overview", { symbol: e.dataset.salaTv, dateRange: "1M" }));
      dlg.scrollTop = 0;
      if (!N.rm && window.gsap) gsap.fromTo($$(".sala-cab, .bento > .t, .sala-nav", dlg), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .6, stagger: .06, clearProps: "transform,opacity",
        onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh() });
    }
    function abrir(id, { push = false, desde = null } = {}) {
      const s = porId[id]; if (!s) return false;
      if (!abierta) { antes = desde || document.activeElement; document.documentElement.classList.add("sala-abierta"); N.lenis?.stop?.();
        if (dlg.showModal && !dlg.open) dlg.showModal(); else dlg.setAttribute("open", ""); }
      if (push) { if (abierta) history.replaceState({ sala: id }, "", "#sala/" + id); else { history.pushState({ sala: id }, "", "#sala/" + id); porPush = true; } }
      abierta = s; pintar(s);
      document.title = `${s.titulo} · NAOS monitor room`;
      ($("#sala-t", dlg) || dlg).focus({ preventScroll: true });
      return true;
    }
    const TITULO = document.title;
    function cerrarYa() {
      if (!abierta) return;
      abierta = null; porPush = false;
      if (dlg.open) dlg.close ? dlg.close() : dlg.removeAttribute("open");
      dlg.innerHTML = ""; document.title = TITULO;
      document.documentElement.classList.remove("sala-abierta"); N.lenis?.start?.();
      if (antes && document.contains(antes)) antes.focus({ preventScroll: true });
    }
    function cerrar() { // la X, Esc o el fondo: si la sala se abrió con un clic, atrás; si llegó por enlace, se limpia la dirección
      if (!abierta) return;
      if (porPush) history.back();
      else { history.replaceState(null, "", location.pathname + location.search.replace(/([?&])sala=[^&]*&?/, "$1").replace(/[?&]$/, "")); cerrarYa(); }
    }
    const idDeDireccion = () => { const h = decodeURIComponent(location.hash || ""); const m = /^#sala\/(.+)$/.exec(h); return m ? m[1] : new URLSearchParams(location.search).get("sala"); };
    addEventListener("popstate", () => { const id = idDeDireccion(); if (id && porId[id]) { if (abierta?.id !== id) abrir(id); } else cerrarYa(); });
    addEventListener("hashchange", () => { const id = idDeDireccion(); if (id && porId[id]) { if (abierta?.id !== id) abrir(id); return; }
      if (abierta) cerrarYa(); if (id) history.replaceState(null, "", location.pathname + location.search); });

    // clics: en fase de captura, antes del ancla suave de Lenis
    addEventListener("click", (e) => {
      const a = e.target.closest("[data-sala]");
      if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) { e.preventDefault(); e.stopPropagation(); abrir(a.dataset.sala, { push: true, desde: abierta ? null : a }); return; }
      if (abierta && e.target.closest("[data-cerrar]")) { e.preventDefault(); cerrar(); }
    }, true);
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); cerrar(); });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); cerrar(); return; }
      if (e.key !== "Tab") return; // foco atrapado dentro de la sala
      const f = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), iframe', dlg).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });

    // enlace directo: #sala/<id> o ?sala=<id>; si la historia ya no está en la página, la dirección se limpia
    const id0 = idDeDireccion();
    if (id0) { if (porId[id0]) { history.replaceState(null, "", location.pathname + location.search.replace(/([?&])sala=[^&]*&?/, "$1").replace(/[?&]$/, "") + "#sala/" + encodeURIComponent(id0)); abrir(id0); }
      else history.replaceState(null, "", location.pathname + location.search.replace(/([?&])sala=[^&]*&?/, "$1").replace(/[?&]$/, "")); }
    Object.assign(api, { abrir: (id) => abrir(id, { push: true }), cerrar });
    return api;
  };

  /* ================= mapa chico del bento: los lugares encendidos, sin rótulos; lleva al mapa de historias ================= */
  N.mapaMini = async (el, d) => {
    const ls = []; for (const s of (d.salas || []).filter((x) => x.lugar)) if (!ls.some((l) => l.id === s.lugar.id)) ls.push({ ...s.lugar, y: merc(s.lugar.lat) });
    if (!el || !ls.length) return false;
    await cargarMundo();
    const R = Math.max(1.1, el.clientWidth / Math.max(120, el.clientHeight - 40));
    let x0 = Math.min(...ls.map((l) => l.lon)) - 18, x1 = Math.max(...ls.map((l) => l.lon)) + 18, y0 = Math.min(...ls.map((l) => l.y)) - 14, y1 = Math.max(...ls.map((l) => l.y)) + 14;
    if ((x1 - x0) / (y1 - y0) > R) { const c = (y0 + y1) / 2, h = (x1 - x0) / R; y0 = c - h / 2; y1 = c + h / 2; } else { const c = (x0 + x1) / 2, w = (y1 - y0) * R; x0 = c - w / 2; x1 = c + w / 2; }
    const vb = [x0, y0, x1 - x0, y1 - y0], pc = (px, py) => [((px - vb[0]) / vb[2] * 100).toFixed(2), ((py - vb[1]) / vb[3] * 100).toFixed(2)];
    el.innerHTML = `<span class="b-k cond">Where the stories are <span class="beta">Beta</span></span><span class="b-mapa-c" style="aspect-ratio:${vb[2]} / ${vb[3]}"><svg viewBox="${vb.join(" ")}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path class="m-t" d="${tierraMundo()}"/></svg>` +
      ls.map((l) => { const [a, b] = pc(l.lon, l.y); return `<span class="pin-m" style="left:${a}%;top:${b}%" title="${esc(l.nombre)}"></span>`; }).join("") + `</span>` +
      `<span class="b-pie sello">${ls.length} places lit · ${ls.map((l) => esc(l.nombre)).join(", ")}</span>`;
    el.setAttribute("aria-label", `Story map: ${ls.map((l) => l.nombre).join(", ")}. Go to the map.`);
    if (!N.rm && window.gsap) gsap.from($$(".pin-m", el), { scale: 0, duration: .4, stagger: .12, delay: .9 });
    return true;
  };

  /* ================= mapa de historias en la portada (PAG-03.3) ================= */
  N.mapaHistorias = async (el, d, ctx) => {
    const salas = (d.salas || []).filter((s) => s.lugar);
    if (!el || !salas.length) { if (el) el.hidden = true; return; }
    await cargarMundo();
    const lugares = []; for (const s of salas) { let l = lugares.find((x) => x.id === s.lugar.id); if (!l) lugares.push(l = { ...s.lugar, y: merc(s.lugar.lat), salas: [] }); l.salas.push(s); }
    lugares.sort((a, b) => a.y - b.y); // filas de norte a sur: así las líneas no se cruzan
    const caja = $(".geo-mapa", el), lista = $(".geo-lista", el);
    const A = ctx.A;
    const chip = (a) => `<span class="chip-a"><span class="cond">${esc(ctx.nombreCorto[a.id] || a.nombre)}</span> ${esc(ctx.val(a))}${a.cambio != null ? " " + N.cambioHTML(a) : ""}</span>`;
    let k = 0;
    lista.innerHTML = lugares.map((l) => l.salas.map((s) => { k++;
      const fr = s.activos.map((id) => A[id]).filter((a) => a && a.fresco);
      return `<li><a class="geo-f" href="#sala/${esc(s.id)}" data-sala="${esc(s.id)}" data-lugar="${esc(l.id)}">` +
        `<span class="geo-k"><span class="geo-lg"><span class="cond">${esc(l.nombre)}</span><span class="cond geo-ar">${esc(AREA[s.area] || s.area)}</span></span>${N.cifras(N.cifrasSala(s, ctx))}</span>` +
        `<span class="geo-t">${esc(s.titulo)}</span>` +
        `<span class="geo-d2 sello">${esc(s.fuente)} · ${esc(horaTxt(s.hora))}${s.odds ? ` · ${esc(N.oddsTxt(s.odds))}, ${esc(N.oddsFuente(s.odds))}` : ""}</span>` +
        `<span class="geo-ir cond">Open the room</span></a></li>`; }).join("")).join("");
    // encuadre: todos los lugares encendidos con margen, en la proporción que acompaña a la lista (en teléfono, casi cuadrado)
    const R = caja.clientWidth > 600 ? clamp(caja.clientWidth / Math.max(1, lista.offsetHeight * .8), 1.3, 2.1) : 1.25;
    let x0 = Math.min(...lugares.map((l) => l.lon)) - 22, x1 = Math.max(...lugares.map((l) => l.lon)) + 22, y0 = Math.min(...lugares.map((l) => l.y)) - 16, y1 = Math.max(...lugares.map((l) => l.y)) + 16;
    if ((x1 - x0) / (y1 - y0) > R) { const c = (y0 + y1) / 2, h = (x1 - x0) / R; y0 = c - h / 2; y1 = c + h / 2; } else { const c = (x0 + x1) / 2, w = (y1 - y0) * R; x0 = c - w / 2; x1 = c + w / 2; }
    if (x1 - x0 > 360) { x0 = -180; x1 = 180; }
    const dx = x0 < -180 ? -180 - x0 : x1 > 180 ? 180 - x1 : 0; x0 += dx; x1 += dx;
    const dy = y0 < Y_N ? Y_N - y0 : y1 > Y_S ? Y_S - y1 : 0; y0 += dy; y1 += dy;
    const vb = [x0, y0, x1 - x0, y1 - y0], pc = (px, py) => [((px - vb[0]) / vb[2] * 100).toFixed(2), ((py - vb[1]) / vb[3] * 100).toFixed(2)];
    caja.style.aspectRatio = `${vb[2]} / ${vb[3]}`;
    caja.innerHTML = `<svg viewBox="${vb.join(" ")}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path class="m-t" d="${tierraMundo()}"/></svg>` +
      lugares.map((l, i) => { const [a, b] = pc(l.lon, l.y);
        return `<a class="pin${Number(a) > 70 ? " izq" : ""}" href="#sala/${esc(l.salas[0].id)}" data-sala="${esc(l.salas[0].id)}" data-lugar="${esc(l.id)}" style="left:${a}%;top:${b}%"` +
          ` aria-label="${esc(l.nombre)}: ${l.salas.length} ${l.salas.length > 1 ? "stories" : "story"}. Open the monitor room"><span class="pin-n">${esc(l.nombre)}</span></a>`; }).join("");
    $(".geo-cab .sello", el).textContent = `${salas.length} ${salas.length > 1 ? "stories" : "story"} in ${lugares.length} ${lugares.length > 1 ? "places" : "place"} · as of ${horaTxt(d.radar?.fecha || d.generado)}`;
    const colocar = () => {
      const rc = caja.getBoundingClientRect(), puestas = $$(".pin", caja).map((p) => { const r = p.getBoundingClientRect(); return { left: r.left + 3, right: r.right - 3, top: r.top + 3, bottom: r.bottom - 3 }; });
      const choca = (r) => r.left < rc.left + 2 || r.right > rc.right - 2 || r.top < rc.top || r.bottom > rc.bottom || puestas.some((q) => !(r.right <= q.left || r.left >= q.right || r.bottom <= q.top || r.top >= q.bottom));
      for (const pin of $$(".pin", caja)) { const n = $(".pin-n", pin), pref = pin.classList.contains("izq");
        const ops = [[pref, 3], [!pref, 3], [pref, 22], [!pref, 22], [pref, -16], [!pref, -16]];
        let ok = false; for (const [izq, top] of ops) { pin.classList.toggle("izq", izq); n.style.top = top + "px"; if (!choca(n.getBoundingClientRect())) { ok = true; break; } }
        if (!ok) { pin.classList.toggle("izq", pref); n.style.top = "3px"; }
        puestas.push(n.getBoundingClientRect()); } };
    // líneas: cada lugar a sus filas; al pasar por una, se resaltan las dos puntas
    const svg = $(".geo-l-svg", el);
    let ps = [], primera = true;
    const unir = () => { ps = conectar(svg, el, $$(".geo-f", lista).map((f) => [$(`.pin[data-lugar="${f.dataset.lugar}"]`, caja), f, "", "pin", f.dataset.lugar]));
      if (primera && ps.length && !N.rm && window.ScrollTrigger) { primera = false; ps.forEach((p) => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); });
        ScrollTrigger.create({ trigger: el, start: "top 75%", once: true, onEnter: () => { trazar(ps, .3); gsap.from($$(".pin", caja), { scale: 0, duration: .3, stagger: .1 }); } }); } };
    new ResizeObserver(() => { colocar(); unir(); }).observe(el);
    const marcar = (lid, on) => $$(`[data-lugar="${lid}"]`, el).forEach((x) => x.classList.toggle("activo", on));
    el.addEventListener("pointerover", (e) => { const x = e.target.closest("[data-lugar]"); if (x) marcar(x.dataset.lugar, true); });
    el.addEventListener("pointerout", (e) => { const x = e.target.closest("[data-lugar]"); if (x) marcar(x.dataset.lugar, false); });
    el.addEventListener("focusin", (e) => { const x = e.target.closest("[data-lugar]"); if (x) marcar(x.dataset.lugar, true); });
    el.addEventListener("focusout", (e) => { const x = e.target.closest("[data-lugar]"); if (x) marcar(x.dataset.lugar, false); });
  };
})();

/* ================= esta semana (PAG-08.1, D-224): grilla pública sección x día, con formato por ícono ================= */
(function () {
  const N = window.NAOS, esc = (s) => N.esc(s ?? "");
  const ICONO = {
    brief: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="1.5" width="10" height="13" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 5h5M5.5 8h5M5.5 11h3" stroke="currentColor" stroke-width="1.5"/></svg>',
    short: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 6.2v3.6L10 8z" fill="currentColor"/></svg>',
    medium: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="3.5" width="14" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 5.8v4.4L10.2 8z" fill="currentColor"/></svg>',
    special: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 14.5 8 8 14.5 1.5 8z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>',
  };
  const SLOT = { london: "London open", ny: "NY open", close: "US close" };
  const DIA = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const diaTxt = (f) => { const t = new Date(f + "T12:00:00Z"); return `${DIA[t.getUTCDay()]} ${t.getUTCDate()}`; };
  N.semana = async (el) => {
    let s, paginas = new Set();
    try { s = await (await fetch("data/semana.json")).json(); } catch (e) { el.hidden = true; return; }
    try { const a = await (await fetch("data/assets.json")).json(); for (const c of a.categorias) for (const x of c.piezas) if (x.pagina) paginas.add(x.id); } catch (e) {}
    const dias = Array.from({ length: 7 }, (_, i) => new Date(Date.parse(s.semana.desde + "T00:00:00Z") + i * 864e5).toISOString().slice(0, 10));
    // los Shorts sin fecha de una misma pieza van juntos en una ficha
    const juntar = (xs) => { const out = []; for (const x of xs) { const g = !x.dia && x.format === "short" && out.find((y) => y.format === "short" && y.asset_id === x.asset_id && y.n);
      if (g) g.n++; else out.push({ ...x, n: !x.dia && x.format === "short" ? 1 : 0 }); } return out; };
    const ficha = (x) => {
      const fmt = s.formatos.find((f) => f.id === x.format)?.titulo || x.format;
      const txt = x.format === "brief" ? SLOT[x.slot] || x.title : x.n > 1 ? `${x.n} Shorts · ${x.title.split(" · ")[0]}` : x.title;
      const ev = (x.eventos || []).length ? ` · ${x.eventos.length} red event${x.eventos.length > 1 ? "s" : ""}` : "";
      const tip = x.format === "brief" ? `${x.title}, ${x.hora_local}${(x.eventos || []).length ? ". Scheduled: " + x.eventos.map((e) => `${e.titulo} ${e.hora.slice(11, 16)} UTC`).join("; ") : ""}` : `${fmt}: ${x.title}${x.dia ? "" : ", date TBD"}`;
      const cuerpo = `<span class="sf-i">${ICONO[x.format] || ""}</span><span class="sf-t">${esc(txt)}${esc(ev)}</span>`;
      const cls = `sf sf-${esc(x.format)}${x.status === "out" ? " out" : ""}`;
      return x.asset_id && paginas.has(x.asset_id) ? `<a class="${cls}" href="pieza.html?id=${encodeURIComponent(x.asset_id)}" title="${esc(tip)}">${cuerpo}</a>` : `<span class="${cls}" title="${esc(tip)}">${cuerpo}</span>`;
    };
    const celda = (sec, f) => juntar(s.items.filter((x) => x.seccion === sec && x.dia === f)).map(ficha).join("");
    // escritorio: filas por sección, columnas por día y "date TBD"
    let g = `<div class="sem-g" role="table" aria-label="This week by section and day"><div class="sem-h" role="row"><span role="columnheader"></span>${dias.map((f) => `<span role="columnheader">${diaTxt(f)}</span>`).join("")}<span role="columnheader">Date TBD</span></div>`;
    for (const sec of s.secciones) g += `<div class="sem-r sec-${esc(sec.id)}" role="row"><span class="sem-s cond" role="rowheader">${esc(sec.titulo)}</span>` +
      dias.map((f) => `<span class="sem-c" role="cell">${celda(sec.id, f)}</span>`).join("") + `<span class="sem-c tbd" role="cell">${celda(sec.id, null)}</span></div>`;
    g += `</div>`;
    // teléfono: por día, cada pieza con el color de su sección
    const sec = (id) => s.secciones.find((x) => x.id === id)?.titulo || id;
    let m = `<div class="sem-m">`;
    for (const f of [...dias, null]) { const xs = juntar(s.items.filter((x) => x.dia === f)); if (!xs.length) continue;
      m += `<div class="sem-d"><p class="sem-dt cond">${f ? diaTxt(f) : "Date TBD"}</p>${xs.map((x) => `<div class="sem-mi sec-${esc(x.seccion)}"><span class="sem-ms cond">${esc(sec(x.seccion))}</span>${ficha(x)}</div>`).join("")}</div>`; }
    m += `</div>`;
    const ley = `<p class="sem-ley">${s.formatos.map((f) => `<span class="sf sf-${esc(f.id)}"><span class="sf-i">${ICONO[f.id]}</span><span class="sf-t">${esc(f.titulo)}</span></span>`).join("")}` +
      `<span class="sem-ley-s">${s.secciones.map((x) => `<span class="sem-sw sec-${esc(x.id)}">${esc(x.titulo)}</span>`).join("")}</span></p>`;
    el.querySelector(".sem-in").innerHTML = ley + g + m +
      `<p class="sello">Briefs at three fixed times each weekday: London open ${s.slots.find((x) => x.id === "london")?.local}, New York open ${s.slots.find((x) => x.id === "ny")?.local}, US close ${s.slots.find((x) => x.id === "close")?.local}. ` +
      `Each brief looks ahead to what is scheduled before the next one.${s.eventos_nota ? " " + esc(s.eventos_nota) : ""} Everything here is planned; dates marked TBD are not set yet.</p>`;
    el.querySelector(".sem-sello").textContent = `${diaTxt(s.semana.desde)} to ${diaTxt(s.semana.hasta)} ${MES[+s.semana.hasta.slice(5, 7) - 1]}`;
  };
})();
