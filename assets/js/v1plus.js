/* V1+ · Sala de monitoreo con piezas de V3. Necesita gsap, ScrollTrigger y assets/comun/naos.js (defer, en orden).
 * Widgets de terceros (TradingView) se cargan solo al acercarse (IntersectionObserver), con su atribución intacta. */
(async function () {
  const N = window.NAOS;
  let d;
  try { d = await N.cargar("data/situacion.json"); } catch (e) { return N.error(e); }
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // D-216: lo viejo y lo de muestra no se muestran; el armado los lista en d.escondido con su plan
  for (const a of d.activos) if (a.viejo) delete d.porId[a.id];
  const A = d.porId, MENOS = "−";
  const vigente = (xs) => (xs || []).filter((x) => !x.viejo);
  if (d.calendario?.viejo) d.calendario = null;
  const DIAS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], MESES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const g = new Date(d.generado);
  $$(".gen").forEach((e) => (e.textContent = d.genTxt));
  $("#dia").textContent = `${DIAS[g.getUTCDay()]} ${g.getUTCDate()} ${MESES[g.getUTCMonth()]} ${g.getUTCFullYear()}`;

  /* ---------- formato propio por activo ---------- */
  const DEC = { BTC: 0, ETH: 0, SOL: 2, XAU: 0, XAG: 2, EURUSD: 4, USDJPY: 2, USD: 2, US2Y: 2, US10Y: 2, US30Y: 2, S2S10: 2, WTI: 2, BRENT: 2, NG: 2 };
  const val = (a) => (a.unidad === "USD" ? "$" : a.unidad.startsWith("USD/") ? "$" : "") + N.fmt(a.ultimo, DEC[a.id] ?? 2) + (a.unidad === "%" ? "%" : a.unidad === "pp" ? " pp" : "");
  const camTxt = (a) => (a.cambio == null ? "" : N.cambioTxt(a));
  const camHTML = (a) => (a.cambio == null ? "" : N.cambioHTML(a));
  const fechaSello = (a) => `${N.fecha(a.fecha)}${a.fecha.length > 10 ? " " + N.hora(a.fecha) : ""}`;
  const nombreCorto = { BTC: "BTC", ETH: "ETH", SOL: "SOL", XAU: "Gold", XAG: "Silver", US2Y: "US 2Y", US10Y: "US 10Y", US30Y: "US 30Y", S2S10: "2s10s", USD: "NAOS $ index", EURUSD: "EUR/USD", USDJPY: "USD/JPY" };

  /* ---------- cinta: solo lecturas dentro de su ventana; la energía nunca ---------- */
  const fng = d.miedo?.cripto?.viejo ? null : d.miedo?.cripto, prox = d.calendario?.proximo;
  const items = ["BTC", "ETH", "SOL", "XAU", "XAG", "US10Y", "US2Y", "S2S10", "US30Y", "USD", "EURUSD", "USDJPY"].map((k) => A[k]).filter((a) => a && a.fresco)
    .map((a) => ({ s: nombreCorto[a.id], v: val(a), c: a.cambio == null ? null : a }));
  if (fng) items.splice(3, 0, { s: "Crypto F&G", v: String(fng.valor), t: fng.clase });
  if (prox) items.splice(7, 0, { s: "Next red", t: `${prox.evento.replace(/ [my]\/[my]$/, "")} · ${N.hora(prox.hora)}` });
  const topIA = (d.hn || [])[0];
  if (topIA) items.push({ s: "AI · HN", t: `${topIA.titulo} · ${N.fmt(topIA.puntos)} pts` });
  N.cinta($("#cinta"), items);

  /* ---------- sellos, cifras, odómetros, líneas ---------- */
  $$("[data-sello]").forEach((e) => { const a = A[e.dataset.sello]; if (a) e.textContent = `${a.fuente} · ${fechaSello(a)}`; });
  $$("[data-val]").forEach((e) => { const a = A[e.dataset.val]; if (a) e.textContent = val(a); });
  $$("[data-cam]").forEach((e) => { const a = A[e.dataset.cam]; if (!a) return; e.innerHTML = camHTML(a) + (e.classList.contains("cam") ? `<small>${a.cambio_base}</small>` : ""); });
  $$("[data-odo]").forEach((e) => { const a = A[e.dataset.odo]; if (a) N.odo(e, val(a), { dir: N.dir(a.cambio || 1), aria: `${a.nombre} ${val(a)}` }); });
  $$("[data-linea]").forEach((e) => { const a = A[e.dataset.linea]; if (a?.serie) N.linea(e, a.serie, { h: Number(e.dataset.h) || 100, dec: DEC[a.id] ?? 2, pre: a.unidad === "USD" ? "$" : "", titulo: a.nombre }); });
  const tarjeta = (a) => `<b>${a.nombre}, last 30 days</b><br>${N.signo(a.cambio30)} over the window. High $${N.fmt(Math.max(...a.serie.map((p) => p[1])))}, low $${N.fmt(Math.min(...a.serie.map((p) => p[1])))}. The needle shows the 30-day change on a scale of ten percent each way. Move along the chart, or focus it and use the arrow keys.<div class="sello">Data provided by CoinGecko · ${a.fecha.replace("T", " ").replace("Z", " UTC")} · not financial advice</div>`;
  $$("[data-tarjeta]").forEach((e) => { const a = A[e.dataset.tarjeta]; if (a) e.innerHTML = tarjeta(a); });
  // paneles cuyo dato quedó escondido (viejo): fuera
  [["BTC", ".p-btc"], ["ETH", ".p-eth"]].forEach(([k, c]) => { if (!A[k]) $(c).hidden = true; });
  if (!A.XAU && !A.XAG) $(".p-metales").hidden = true;
  // texto en llano bajo BTC y bajo la curva (PAG-02.5), armado por construir-datos.mjs
  const explicar = (el, x) => { if (!el || !x?.texto) return; el.innerHTML = x.texto.map((t) => `<p>${N.esc(t)}</p>`).join("") +
    `<p class="sello">${N.esc(x.fuente)} · as of ${N.fecha(x.fecha)}${x.fecha.length > 10 ? " " + N.hora(x.fecha) : ""}</p>`; };
  if (A.BTC) explicar($("#btc-explica"), d.explica?.BTC);
  if (A.S2S10) explicar($("#curva-explica"), d.explica?.S2S10);

  /* ---------- diales (pieza mecánica de V3) ---------- */
  const xy = (t, r) => [(Math.sin(t) * r).toFixed(1), (-Math.cos(t) * r).toFixed(1)];
  const arco = (a0, a1, r) => { const [x0, y0] = xy(a0, r), [x1, y1] = xy(a1, r); return `M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`; };
  function dial(svg, { ang, marcas, bandas = [], centro = "", aguja = true }) {
    let s = bandas.map((b) => `<path class="banda${b.on ? " on" : ""}" d="${arco(b.a0, b.a1, 162)}"/>`).join("");
    s += `<path class="arco" d="M-180,0 A180,180 0 0 1 180,0"/>`;
    for (const m of marcas) { const [x1, y1] = xy(m.t, m.l ? 150 : 164), [x2, y2] = xy(m.t, 180); s += `<line class="t${m.l ? " l" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      if (m.txt) { const [tx, ty] = xy(m.t, 206); s += `<text class="tl" x="${tx}" y="${Number(ty) + 7}">${m.txt}</text>`; } }
    if (aguja) s += `<line class="aguja" x1="0" y1="0" x2="0" y2="-148"/>`;
    s += `<circle class="cubo" r="16"/><circle class="cubo2" r="6"/>` + (centro ? `<text class="tl" x="0" y="48">${centro}</text>` : "");
    svg.innerHTML = s;
    const ag = $(".aguja", svg); if (!ag) return;
    if (N.rm) gsap.set(ag, { rotation: ang, svgOrigin: "0 0" });
    else { gsap.set(ag, { rotation: -90, svgOrigin: "0 0" });
      ScrollTrigger.create({ trigger: svg, start: "top 92%", once: true, onEnter: () => gsap.to(ag, { rotation: ang, svgOrigin: "0 0", duration: 1.2, delay: .3 }) }); }
  }
  const marcasPct = []; for (let k = -10; k <= 10; k++) marcasPct.push({ t: k / 10 * Math.PI / 2, l: k % 5 === 0, txt: k % 10 === 0 ? (k > 0 ? "+10%" : k < 0 ? "−10%" : "0") : "" });
  $$("[data-dial]").forEach((svg) => { const a = A[svg.dataset.dial]; if (a) dial(svg, { ang: Math.max(-10, Math.min(10, a.cambio30)) / 10 * 90, marcas: marcasPct }); });
  // miedo y codicia: 0 a 100, franjas de alternative.me
  const t100 = (v) => (v / 100 - .5) * Math.PI;
  const marcas100 = []; for (let v = 0; v <= 100; v += 5) marcas100.push({ t: t100(v), l: v % 25 === 0, txt: v % 50 === 0 ? String(v) : "" });
  const franjas = [[0, 25, "Extreme fear"], [25, 46, "Fear"], [46, 54, "Neutral"], [54, 75, "Greed"], [75, 100, "Extreme greed"]];
  if (fng) {
    dial($("#fng-dial"), { ang: (fng.valor / 100 - .5) * 180, marcas: marcas100, bandas: franjas.map(([a, b]) => ({ a0: t100(a) + .02, a1: t100(b) - .02, on: fng.valor >= a && fng.valor < b })) });
    $("#fng-v").textContent = fng.valor; $("#fng-c").textContent = fng.clase;
    $("#fng-sello").textContent = `alternative.me ${N.fecha(fng.fecha)} · OFR, ECB`;
    $("#fng-nota").innerHTML = `<a href="${fng.url}" rel="noopener">Crypto Fear &amp; Greed Index by alternative.me</a>. Yesterday ${fng.ayer}, a week ago ${fng.semana}, a month ago ${fng.mes}.`;
  }
  if (fng?.serie) N.linea($("#fng-serie"), fng.serie, { h: 64, dec: 0, barras: true, titulo: "Crypto Fear and Greed Index, daily", dir: "flat" });
  if (A.XAU && A.XAG) $("#ratio").textContent = N.fmt(A.XAU.ultimo / A.XAG.ultimo, 1);
  const animo = d.miedo?.naos?.viejo ? { estado: "review" } : d.miedo?.naos || { estado: "review" };
  const enRevision = animo.valor == null;
  const franjasM = [[0, 25, "Extreme fear"], [25, 45, "Fear"], [45, 56, "Neutral"], [56, 76, "Greed"], [76, 100, "Extreme greed"]]; // bandas de animo.py
  dial($("#animo-dial"), enRevision ? { marcas: marcas100.map((m) => ({ ...m, txt: "" })), aguja: false, centro: "in review" }
    : { ang: (animo.valor / 100 - .5) * 180, marcas: marcas100, bandas: franjasM.map(([a, b]) => ({ a0: t100(a) + .02, a1: t100(b) - .02, on: animo.valor >= a && animo.valor < b })) });
  if (!enRevision) {
    $(".fg.revision").classList.remove("revision");
    $("#animo-c").outerHTML = `<b class="num">${animo.valor}</b> <span>${N.esc(animo.clase || "")}</span><span class="sello animo-v">credit as of ${N.fecha(animo.desde)} · dollar ${N.fecha(animo.hasta)}</span>`;
  }
  $("#fng-tarjeta").innerHTML = enRevision
    ? `<b>Two dials, two markets</b><br>Crypto: alternative.me's index. NAOS Mood, for markets in general, shows no number until its method is published.<div class="sello">alternative.me · NAOS method in review · not financial advice</div>`
    : `<b>NAOS Fear &amp; Greed: two dated readings</b><br><b>Credit and dollar ${animo.valor}, ${N.esc(animo.clase || "")}</b>: equal-weight average of ${animo.vivos} of ${animo.total} live inputs, each scored 0 to 100 (higher means calmer, greedier): ${(animo.componentes || []).map((c) => `${N.esc(c.nombre.replace(/ \(.*\)$/, "").replace("OFR FSI category: ", ""))} ${Math.round(c.sub)}`).join(", ")}. Credit stress runs two or three business days behind. The crypto dial is alternative.me's index, shown as published with its attribution.<div class="sello">Credit and dollar: Office of Financial Research, ECB (NAOS calculation), animo.py v${N.esc(animo.version || "")} · Crypto: alternative.me · not financial advice</div>`;

  /* ---------- Tikr, el guardián (G3): reacciona al NAOS Mood ---------- */
  (function tikr() {
    const svg = $("#tikr"), dirM = enRevision ? null : animo.valor >= 56 ? "u" : animo.valor <= 44 ? "d" : null;
    const texto = enRevision ? "MOOD IN REVIEW" : `CREDIT+USD ${animo.valor}`;
    const col = "currentColor"; // el ánimo no es un precio: Tikr lo dice en tinta, sin esmeralda ni borgoña
    let s = `<defs><clipPath id="tk-o"><circle cx="120" cy="104" r="36"/></clipPath><clipPath id="tk-p"><rect x="192" y="0" width="240" height="240"/></clipPath></defs><g class="tk-cuerpo">`;
    s += `<path d="M92 188 L86 222 M74 222 H100 M148 188 L154 222 M140 222 H166" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="square"/>`;
    s += `<g clip-path="url(#tk-p)"><g class="tk-papel"><rect x="190" y="146" width="236" height="30" fill="var(--naos-paper)" stroke="currentColor" stroke-width="3"/><text x="414" y="169" text-anchor="end" font-family="IBM Plex Sans Condensed" font-weight="600" font-size="20" fill="${col}">${texto}</text></g></g>`;
    s += `<rect x="50" y="56" width="140" height="132" rx="20" fill="var(--naos-paper)" stroke="currentColor" stroke-width="6"/><path d="M190 146 V176" stroke="currentColor" stroke-width="8"/>`;
    s += `<g class="tk-estilete"><path d="M120 56 V34" stroke="currentColor" stroke-width="6"/><circle cx="120" cy="26" r="8" fill="currentColor"/></g>`;
    s += `<circle cx="120" cy="104" r="36" fill="var(--naos-paper)" stroke="currentColor" stroke-width="5"/>`;
    for (let a = -60; a <= 60; a += 20) { const ra = a * Math.PI / 180; s += `<line x1="${(120 + 25 * Math.sin(ra)).toFixed(1)}" y1="${(104 - 25 * Math.cos(ra)).toFixed(1)}" x2="${(120 + 31 * Math.sin(ra)).toFixed(1)}" y2="${(104 - 31 * Math.cos(ra)).toFixed(1)}" stroke="currentColor" stroke-width="3"/>`; }
    s += `<line class="tk-aguja" x1="120" y1="104" x2="120" y2="78" stroke="${dirM ? col : "currentColor"}" stroke-width="5" stroke-linecap="round"/><circle cx="120" cy="104" r="6" fill="currentColor"/>`;
    s += `<rect class="tk-parpado" clip-path="url(#tk-o)" x="80" y="68" width="80" height="72" fill="currentColor" transform="scale(1 0)" transform-origin="120 68"/>`;
    s += `<path d="M92 158 H148" stroke="currentColor" stroke-width="5" stroke-linecap="square"/></g>`;
    svg.innerHTML = s;
    const cuerpo = $(".tk-cuerpo", svg), aguja = $(".tk-aguja", svg), papel = $(".tk-papel", svg), estilete = $(".tk-estilete", svg), parpado = $(".tk-parpado", svg);
    const lean = dirM === "u" ? 5 : dirM === "d" ? -5 : 0, angA = dirM === "u" ? 48 : dirM === "d" ? -48 : 0;
    $("#tikr-dice").textContent = enRevision ? "Mood in review: Tikr waits" : `Credit and dollar ${animo.valor}, ${(animo.clase || "").toLowerCase()}: Tikr leans ${dirM === "u" ? "forward" : dirM === "d" ? "back" : "level"}`;
    $("#tikr-tarjeta").innerHTML = `<b>Tikr keeps the page</b><br>It reads the Credit and dollar reading of NAOS Fear &amp; Greed. It leans forward when the reading runs to greed and back when it runs to fear, and prints it on its paper, in ink: a mood is not a price. While a reading is in review it stays level and prints that.<div class="sello">NAOS · character from the G3 system</div>`;
    if (N.rm) { gsap.set(cuerpo, { rotation: lean, svgOrigin: "120 222" }); gsap.set(aguja, { rotation: angA, svgOrigin: "120 104" }); gsap.set(papel, { x: 0 }); return; }
    gsap.set(papel, { x: -236 });
    const tl = gsap.timeline({ delay: 1.2 });
    tl.to(cuerpo, { rotation: lean, svgOrigin: "120 222", duration: .6 }).to(aguja, { rotation: angA, svgOrigin: "120 104", duration: 1.2 }, "<")
      .to(papel, { x: 0, duration: 1.4, ease: "none" }, "-=.4")
      .to(estilete, { y: 4, duration: .1, repeat: 13, yoyo: true, ease: "none" }, "<");
    const parpadeo = () => { gsap.timeline().to(parpado, { scaleY: 1, duration: .1, ease: "none" }).to(parpado, { scaleY: 0, duration: .1, ease: "none" }); gsap.delayedCall(6.5, parpadeo); };
    gsap.delayedCall(4, parpadeo);
  })();

  /* ---------- tablero de aletas ---------- */
  const fichas = (txt, cls = "") => [...txt].map((c) => `<span class="ficha ${cls}" aria-hidden="true">${c === " " ? "&nbsp;" : N.esc(c)}</span>`).join("");
  const codigo = { BTC: "BTC", ETH: "ETH", SOL: "SOL", XAU: "GOLD", XAG: "SILV", US2Y: "2Y", US10Y: "10Y", US30Y: "30Y", S2S10: "2S10S", USD: "NAOS$", EURUSD: "EUR", USDJPY: "JPY" };
  const enTablero = ["BTC", "ETH", "SOL", "XAU", "XAG", "US2Y", "US10Y", "US30Y", "S2S10", "USD", "EURUSD", "USDJPY"].map((k) => A[k]).filter((a) => a && a.fresco);
  $("#tablero").innerHTML = enTablero.map((a) => {
    const v = N.fmt(a.ultimo, a.id === "BTC" || a.id === "ETH" || a.id === "XAU" ? 0 : DEC[a.id]) + (a.unidad === "%" ? "%" : "");
    const m = a.cambio == null ? "" : (N.tri(a.cambio) + N.cambioTxt(a).replace(" ", ""));
    return `<div class="fila-t" role="row"><span class="tiras" role="cell" aria-label="${a.nombre}">${fichas(codigo[a.id].padEnd(5))}</span><span class="tiras" role="cell" aria-label="${val(a)}">${fichas(v)}</span>` +
      `<span class="tiras" role="cell" aria-label="${m ? camTxt(a) : "no change given"}">${m ? fichas(m, "chica " + N.dir(a.cambio)) : ""}</span></div>`;
  }).join("");
  if (!N.rm) {
    const filas = $$("#tablero .fila-t");
    gsap.set("#tablero .ficha", { rotateX: -90, opacity: 0 });
    ScrollTrigger.create({ trigger: "#tablero", start: "top 92%", once: true, onEnter: () => filas.forEach((f, i) =>
      gsap.to($$(".ficha", f), { rotateX: 0, opacity: 1, duration: .27, stagger: .03, ease: "none", delay: .3 + i * .12 })) });
  }

  /* ---------- curva y dólar ---------- */
  $("#tasas").innerHTML = ["US2Y", "US10Y", "US30Y"].map((k) => A[k]).filter(Boolean).map((a) => `<div class="tasa"><span class="cond">${nombreCorto[a.id]}</span><b class="num">${val(a)}</b><span>${camHTML(a)}</span></div>`).join("");
  if (A.S2S10) {
    $("#curva-sello").textContent = `Treasury ${N.fecha(A.S2S10.fecha)} · ECB ${N.fecha(A.USD?.fecha || A.S2S10.fecha)}`;
    N.linea($("#g-curva"), A.S2S10.serie90 || A.S2S10.serie, { h: Number($("#g-curva").dataset.h), dec: 2, suf: " pp", titulo: "2s10s spread, 10-year minus 2-year Treasury yield, percentage points" });
  }
  if (A.USD) N.linea($("#g-dolar"), A.USD.serie90 || A.USD.serie, { h: Number($("#g-dolar").dataset.h), dec: 2, titulo: "NAOS dollar index, computed from ECB reference rates" });
  if (A.USDJPY) N.linea($("#g-yen"), A.USDJPY.serie90 || A.USDJPY.serie, { h: Number($("#g-yen").dataset.h), dec: 2, titulo: "USD/JPY from ECB reference rates" });
  $("#curva-tarjeta").innerHTML = A.S2S10 ? `<b>Curve and dollar, ${N.fecha(A.S2S10.fecha)}</b><br>2-year ${val(A.US2Y)}, 10-year ${val(A.US10Y)}, 30-year ${val(A.US30Y)}. The 10-year sits ${val(A.S2S10)} above the 2-year (${camTxt(A.S2S10)} on the day). NAOS dollar index ${val(A.USD)} (${camTxt(A.USD)}): the DXY formula applied to ECB reference rates at 14:15 CET, so it can differ from ICE's DXY.<div class="sello">Source: U.S. Treasury · Source: ECB · not financial advice</div>` : "";

  /* ---------- cierres citados: línea propia con puntos tomados de notas de prensa ---------- */
  (function citados() {
    const c = d.cierres_citados; if (!c || c.muestra) { $("#citados-r").hidden = true; return; }
    $("#citados-sello").innerHTML = `Each point is a close quoted in a news report, linked · last ${c.indices[0]?.puntos.at(-1)?.fecha ? N.fecha(c.indices[0].puntos.at(-1).fecha) : ""}`;
    const W = 260, H = 46;
    $("#citados-l").innerHTML = c.indices.map((ix) => {
      const p = ix.puntos; if (!p.length) return `<div class="cit"><span class="cond">${ix.nombre}</span><span class="sello">No cited close yet</span></div>`;
      const t = p.map((x) => Date.parse(x.fecha + "T12:00:00Z")), v = p.map((x) => x.cierre);
      const t0 = t[0], t1 = t.at(-1) === t0 ? t0 + 864e5 : t.at(-1), lo = Math.min(...v), hi = Math.max(...v), rg = hi - lo || 1;
      const X = (k) => 4 + (t[k] - t0) / (t1 - t0) * (W - 8), Y = (k) => 5 + (1 - (v[k] - lo) / rg) * (H - 10);
      // la línea se corta si faltan más de 4 días seguidos (un fin de semana largo no la corta); cada punto citado lleva su marca
      let dd = ""; p.forEach((x, k) => { dd += (k && t[k] - t[k - 1] <= 4 * 864e5 ? "L" : "M") + X(k).toFixed(1) + "," + Y(k).toFixed(1); });
      const u = p.at(-1), dir = u.cambio == null ? "flat" : N.dir(u.cambio);
      const dec = ix.id === "VIX" ? 2 : 2;
      const de = `per <a href="${N.esc(u.url)}" rel="noopener">${N.esc(u.fuente)}</a>, ${N.fecha(u.fecha)}`;
      return `<div class="cit"><div class="cit-t"><span class="cond">${ix.nombre}</span><b class="num">${N.fmt(u.cierre, dec)}</b>${u.cambio == null ? "" : `<span class="${dir}">${N.tri(u.cambio)} ${N.signo(u.cambio)}</span>`}</div>` +
        `<svg class="cit-g" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ix.nombre}, ${p.length} cited closes from ${N.fecha(p[0].fecha)} to ${N.fecha(u.fecha)}"><path d="${dd}"/>${p.map((x, k) => `<circle cx="${X(k).toFixed(1)}" cy="${Y(k).toFixed(1)}" r="${k === p.length - 1 ? 3.5 : 2}"/>`).join("")}</svg>` +
        `<span class="sello">${de} · ${p.length} cited close${p.length > 1 ? "s" : ""}</span></div>`;
    }).join("");
  })();

  /* ---------- energía, tendencia fechada ---------- */
  const en = ["WTI", "BRENT", "NG"].map((k) => A[k]).filter(Boolean);
  if (!en.length) $(".p-energia").hidden = true;
  $("#energia-filas").innerHTML = en.map((a) => `<div class="en-fila"><div class="mini-t"><span class="cond">${a.nombre}</span> <b class="num">${val(a)}</b> <span class="sello">data as of ${N.fecha(a.fecha)}</span></div><div class="graf-c" data-en="${a.id}" data-h="58"></div></div>`).join("");
  en.forEach((a) => N.linea($(`[data-en="${a.id}"]`), a.serie, { h: 58, dec: 2, pre: "$", titulo: `${a.nombre}, EIA, data as of ${N.fecha(a.fecha)}`, etiquetas: false, dir: "flat" }));
  if (en[0]) $("#eia-sello").textContent = `EIA · data as of ${N.fecha(en[0].fecha)}`;

  /* ---------- próximo evento rojo ---------- */
  const cal = d.calendario;
  if (cal?.semana?.length) {
    const ahora = N.captura ? (() => { const t0 = Date.parse(d.generado), p0 = performance.now(); return () => t0 + performance.now() - p0; })() : () => Date.now(); // el reloj virtual de la captura fija Date en 2026-01-01
    const grupos = []; for (const e of cal.semana) { const gr = grupos.find((x) => x.hora === e.hora); if (gr) gr.ev.push(e); else grupos.push({ hora: e.hora, ev: [e], publicador: e.publicador, url: e.url }); }
    const nombreG = (gr) => { const t = gr.ev.map((e) => e.evento.replace(/ [my]\/[my]$/, "").replace(/^Core /, "")); return [...new Set(t)].join(", ").replace(/Fed Chairman (\w+) Speaks/, "Fed Chair $1 speaks"); };
    const et = (iso) => new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false });
    const dia3 = (iso) => DIAS[new Date(iso).getUTCDay()].slice(0, 3);
    const diaET = (iso) => new Date(iso).toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "short" });
    let gr = grupos.find((x) => Date.parse(x.hora) > ahora()) || null;
    const pintar = () => {
      if (!gr) { $("#rojo-ev").textContent = "No more red US events this week"; $("#rojo-cuenta").innerHTML = ""; return; }
      $("#rojo-ev").innerHTML = `US ${N.esc(nombreG(gr))}`;
      const ms = Math.max(0, Date.parse(gr.hora) - ahora()), h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4);
      const dd = Math.floor(h / 24);
      const bloques = dd >= 1 ? [[String(dd).padStart(2, "0"), "days"], [String(h % 24).padStart(2, "0"), "hours"]] : [[String(h).padStart(2, "0"), "hours"], [String(m).padStart(2, "0"), "min"]];
      $("#rojo-cuenta").innerHTML = bloques.map(([v, l]) => `<span class="bloque"><span class="tiras">${fichas(v)}</span><span>${l}</span></span>`).join("");
      $("#rojo-cuenta").setAttribute("aria-label", `In ${dd >= 1 ? dd + " days " + (h % 24) + " hours" : h + " hours " + m + " minutes"}`);
      $("#rojo-pie").innerHTML = `${dia3(gr.hora)} ${N.hora(gr.hora)} · ${et(gr.hora)} ET · ${gr.url ? `<a href="${gr.url}" rel="noopener">${N.esc(gr.publicador)}</a>` : "public calendar"}`;
    };
    pintar();
    setInterval(() => { const antes = $("#rojo-cuenta").textContent; gr = grupos.find((x) => Date.parse(x.hora) > ahora()) || null; pintar();
      if (!N.rm && $("#rojo-cuenta").textContent !== antes) gsap.from("#rojo-cuenta .ficha", { rotateX: -90, duration: .27, stagger: .05, ease: "none" }); }, 15000);
    // filas rojas reales de la semana con pronóstico y previo (DAT-07.4)
    $("#rojo-tabla tbody").innerHTML = cal.semana.map((e) => `<tr${Date.parse(e.hora) < ahora() ? ' class="pasado"' : ""}><td class="h">${diaET(e.hora)} ${et(e.hora)}</td>` +
      `<td>${e.url ? `<a href="${N.esc(e.url)}" rel="noopener">${N.esc(e.evento)}</a>` : N.esc(e.evento)}</td><td class="num">${N.esc(e.pronostico || "")}</td><td class="num">${N.esc(e.previo || "")}</td></tr>`).join("");
    $("#rojo-fuente").innerHTML = `Times, forecasts and previous values: <a href="${N.esc(cal.fuente_url || "https://www.forexfactory.com/calendar")}" rel="noopener">${N.esc(cal.fuente || "Forex Factory weekly calendar")}</a>${cal.fecha ? `, as of ${N.fecha(cal.fecha)} ${N.hora(cal.fecha)}` : ""}. Each event links to its publisher. Passed rows in grey; results come from the publisher.`;
  } else { $(".rojo-s").hidden = true; $("#rojo").hidden = true; }

  /* ---------- wire por área ---------- */
  const AREAS = ["Politics", "Economy", "AI", "Energy", "Crypto", "Culture"];
  const wire = vigente(d.wire);
  // wire, historias y cierres citados vienen del radar privado; en el repo público se conservan con su fecha (d.radar)
  const rf = d.radar?.fecha || d.generado, radarTxt = `${N.fecha(rf)} ${N.hora(rf)}`;
  $("#wire-sello").textContent = `${wire.length} headlines · as of ${radarTxt}`;
  if ($("#historias-fecha")) $("#historias-fecha").textContent = `As of ${radarTxt}. `;
  const cuenta = (a) => wire.filter((t) => t.area === a).length;
  $("#filtros").innerHTML = `<button type="button" aria-pressed="true" data-area="">All<span class="n">${wire.length}</span></button>` + AREAS.filter(cuenta).map((a) => `<button type="button" aria-pressed="false" data-area="${a}">${a}<span class="n">${cuenta(a)}</span></button>`).join("");
  const horaCorta = (iso) => (iso ? `${N.fecha(iso)} ${iso.slice(11, 16)}` : "");
  $("#wire-l").innerHTML = wire.map((t) => `<li data-area="${t.area}" data-entra><span class="w-m"><span class="w-area">${t.area}</span><span>${N.esc(t.fuente)} · ${horaCorta(t.hora)}</span>${t.movio ? `<span class="w-mov">moved: ${N.esc(t.movio)}</span>` : ""}${t.odds ? `<a class="w-mov" href="${N.esc(t.odds.url)}" rel="noopener">odds: ${N.esc(t.odds.nombre)}</a>` : ""}</span><a href="${N.esc(t.url)}" rel="noopener">${N.esc(t.titulo)}</a></li>`).join("");
  $("#filtros").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return;
    $$("#filtros button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $$("#wire-l li").forEach((li) => { li.hidden = !!b.dataset.area && li.dataset.area !== b.dataset.area; if (!li.hidden) li.style.opacity = 1; }); });

  /* ---------- portada: titulares en texto (PAG-01.2) ----------
     Cada historia: qué pasó (titular textual con fuente y hora), qué se movió y cuánto, una cosa conectada y el mercado de
     predicción como enlace. Las frases las arma construir-datos.mjs con plantillas sobre datos reales. */
  const oddsHtml = (o) => (o ? `<a href="${N.esc(o.url)}" rel="noopener">${N.esc(o.texto)}</a>` : "");
  const tits = (d.portada || []).filter((p) => !p.viejo);
  const horaTit = (p) => (p.tipo === "agenda" ? `${N.esc(p.fuente)}` : `${N.esc(p.fuente)} · ${horaCorta(p.hora)} UTC`);
  $("#tits").innerHTML = tits.map((p, i) => `<li class="tit${i === 0 ? " lead" : ""}${p.tipo === "agenda" ? " agenda" : ""}" data-entra>` +
    `<p class="tit-m"><span class="tit-a">${N.esc(p.area === "Politics" ? "Politics, as market impact" : p.area)}</span><span>${horaTit(p)}</span></p>` +
    `<h2 class="tit-t">${p.url ? `<a href="${N.esc(p.url)}" rel="noopener">${N.esc(p.titulo)}</a>` : N.esc(p.titulo)}</h2>` +
    (p.mercado ? `<p class="tit-l"><span class="tit-k">${N.esc(p.mercado_etiqueta || "Moved")}</span>${N.esc(p.mercado)}</p>` : "") +
    (p.conectado ? `<p class="tit-l"><span class="tit-k">Connected</span>${N.esc(p.conectado)}</p>` : "") +
    (p.odds ? `<p class="tit-l"><span class="tit-k">Odds</span>${oddsHtml(p.odds)}</p>` : "") + `</li>`).join("");
  if (tits.some((p) => p.odds) && d.odds_sello) $("#tits-pie").textContent = `Descriptive. ${d.odds_sello}`;
  if (!tits.length) { $("#tits").hidden = true; $("#tits-pie").hidden = true; }

  // una línea de texto con cada gráfico de TradingView (PAG-02.6): qué se movió y por qué, del titular que le corresponde
  const lineaTV = (k) => { const t = d.graficos?.[k]; if (!t) return "";
    return `<p class="tv-linea"><span class="tit-k">${t.movio ? "What moved and why" : "In the news"}</span>${N.esc(t.fuente)}${t.hora ? `, ${horaCorta(t.hora)}${t.hora.length > 10 ? " UTC" : ""}` : ""}: <a href="${N.esc(t.url)}" rel="noopener">${N.esc(t.titulo)}</a></p>`; };
  $$("[data-tv-linea]").forEach((el) => { const h = lineaTV(el.dataset.tvLinea); if (h) { el.outerHTML = h; } });

  /* ---------- widgets de terceros, perezosos ---------- */
  const tema = (el) => (el.closest(".noche") ? "dark" : "light");
  const TV = {
    indices: () => ["market-overview", { dateRange: "1D", showChart: true, showSymbolLogo: false, showFloatingTooltip: false,
      tabs: [{ title: "Indices", symbols: [{ s: "FOREXCOM:SPXUSD", d: "S&P 500 (CFD)" }, { s: "FOREXCOM:NSXUSD", d: "Nasdaq 100 (CFD)" }, { s: "FOREXCOM:DJI", d: "Dow 30 (CFD)" }, { s: "CBOE:VX1!", d: "VIX futures" }] },
        { title: "Commodities", symbols: [{ s: "TVC:USOIL", d: "WTI crude (CFD)" }, { s: "TVC:UKOIL", d: "Brent crude (CFD)" }, { s: "OANDA:NATGASUSD", d: "Natural gas (CFD)" }, { s: "TVC:GOLD", d: "Gold" }] }] }],
    ia: () => ["market-overview", { dateRange: "1M", showChart: true, showSymbolLogo: true, showFloatingTooltip: false,
      tabs: [{ title: "AI stocks", symbols: [["NASDAQ:NVDA", "Nvidia"], ["NASDAQ:MSFT", "Microsoft"], ["NASDAQ:GOOGL", "Alphabet"], ["NASDAQ:AMZN", "Amazon"], ["NASDAQ:META", "Meta"], ["NASDAQ:AMD", "AMD"], ["NASDAQ:AVGO", "Broadcom"], ["NYSE:TSM", "TSMC"], ["NASDAQ:ASML", "ASML"]].map(([s, dd]) => ({ s, d: dd })) },
        { title: "AI ETFs", symbols: [["NASDAQ:BOTZ", "Global X Robotics & AI"], ["NASDAQ:AIQ", "Global X AI & Technology"], ["NASDAQ:SMH", "VanEck Semiconductor"], ["NASDAQ:SOXX", "iShares Semiconductor"]].map(([s, dd]) => ({ s, d: dd })) }] }],
    calendario: () => ["events", { importanceFilter: "1", countryFilter: "us,eu,gb,jp,cn" }],
    calor: () => ["stock-heatmap", { exchanges: [], dataSource: "NASDAQ100", grouping: "sector", blockSize: "market_cap_basic", blockColor: "change", symbolUrl: "", hasTopBar: false, isDataSetEnabled: false, isZoomEnabled: true, hasSymbolTooltip: true, isMonoSize: false }],
  };
  const tinta = (t) => (t === "dark" ? "rgba(244, 246, 248, 1)" : "rgba(14, 17, 22, 1)");
  function montarTV(el, widget, cfg, intento = 0) {
    const t = tema(el);
    const base = { colorTheme: t, isTransparent: true, locale: "en", width: "100%", height: "100%", autosize: true };
    if (widget === "market-overview") Object.assign(base, { plotLineColorGrowing: tinta(t), plotLineColorFalling: tinta(t), gridLineColor: "rgba(0, 0, 0, 0)", scaleFontColor: t === "dark" ? "rgba(154, 163, 176, 1)" : "rgba(89, 97, 109, 1)",
      belowLineFillColorGrowing: "rgba(0, 0, 0, 0)", belowLineFillColorFalling: "rgba(0, 0, 0, 0)", belowLineFillColorGrowingBottom: "rgba(0, 0, 0, 0)", belowLineFillColorFallingBottom: "rgba(0, 0, 0, 0)", symbolActiveColor: t === "dark" ? "rgba(42, 48, 58, 1)" : "rgba(215, 219, 224, 0.5)" });
    if (widget === "mini-symbol-overview") Object.assign(base, { trendLineColor: tinta(t), underLineColor: "rgba(0, 0, 0, 0)", underLineBottomColor: "rgba(0, 0, 0, 0)", chartOnly: false, noTimeScale: false });
    // estructura y atribución tal como las entrega TradingView
    el.innerHTML = `<div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:calc(100% - 26px);width:100%"></div>` +
      `<div class="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a></div></div>`;
    const s = document.createElement("script");
    s.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js`; s.async = true; s.type = "text/javascript";
    s.textContent = JSON.stringify(Object.assign(base, cfg));
    s.onerror = () => { if (intento < 2) setTimeout(() => montarTV(el, widget, cfg, intento + 1), 1500 * (intento + 1)); }; // red inestable: dos reintentos
    el.firstChild.appendChild(s);
  }
  // los widgets de terceros esperan a que la página propia termine de cargar (+1,5 s) y a que el panel se acerque:
  // así no compiten con el primer pliegue aunque el panel asome en la primera pantalla
  const despues = new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true }))).then(() => new Promise((r) => setTimeout(r, N.captura ? 0 : 1500)));
  const perezoso = (el, fn) => despues.then(() => {
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: "500px 0px" });
    io.observe(el);
  });
  $$("[data-tv]").forEach((el) => perezoso(el, () => { const [w, c] = TV[el.dataset.tv](); montarTV(el, w, c); }));

  /* ---------- historias del día ---------- */
  // regla del titular (D-208): las mismas líneas que la portada; odds y "on the tape" salen del mapa curado (una cifra por historia)
  const ladosHtml = (l) => {
    if (!l || typeof l.conectado === "object") return ""; // datos de antes del mapa: nada
    const partes = [l.odds ? oddsHtml(l.odds) : null, l.conectado ? N.esc(l.conectado) : null].filter(Boolean);
    return partes.length ? `<p class="lados sello">${partes.join(" · ")}</p>` : "";
  };
  const corto = { AI: "AI", Politics: "Politics, as market impact", Crypto: "Crypto" };
  const historias = vigente(d.historias);
  if (!historias.length) $("#historias").hidden = true;
  $("#cartas").innerHTML = historias.map((h, i) => {
    const a = h.grafico.tipo === "propio" ? A[h.grafico.activo] : null;
    const pasos = [{ h: h.hora, t: `Published by ${h.fuente}`, ya: true },
      a ? { h: a.fecha.length > 10 ? a.fecha : null, t: `${nombreCorto[a.id] || a.nombre} ${val(a)}${a.cambio != null ? ", " + camTxt(a) : ""}`, ya: true, f: a.fecha } : { h: d.generado, t: "NAOS scan", ya: true },
      prox ? { h: prox.hora, t: `Next: US ${prox.evento.replace(/ [my]\/[my]$/, "").replace(/^Core /, "")}`, ya: false } : null].filter(Boolean);
    return `<article class="carta" data-entra><span class="area"><span>${corto[h.area]}</span><span>${String(i + 1).padStart(2, "0")}</span></span>` +
      `<h3 class="tt"><a href="${N.esc(h.url)}" rel="noopener">${N.esc(h.titulo)}</a></h3><span class="sello">${N.esc(h.fuente)} · ${horaCorta(h.hora)} UTC · headline verbatim</span>` +
      ladosHtml(h.lados) +
      (h.contexto && !h.contexto_sample ? `<p class="ctx">${N.esc(h.contexto)}</p>` : "") +
      `<ol class="mtl" aria-label="Timeline">${pasos.map((p) => `<li class="${p.ya ? "ya" : ""}"><span class="h">${p.h ? p.h.slice(11, 16) : N.fecha(p.f)}</span>${N.esc(p.t)}</li>`).join("")}</ol>` +
      `<div class="reac"><p class="cond rot">Market reaction · ${a ? N.esc(a.nombre) + ", 30 days" : N.esc(h.grafico.etiqueta)}</p>${a ? `<div class="graf-c" data-h-linea="${a.id}"></div><p class="sello">${a.id === "BTC" ? "Data provided by CoinGecko" : a.fuente}</p>` : `${lineaTV(h.grafico.simbolo)}<div class="tv" data-tv-mini="${h.grafico.simbolo}"><p class="tv-espera sello">TradingView chart loads when it comes into view</p></div>`}</div></article>`;
  }).join("");
  $$("[data-h-linea]").forEach((e) => { const a = A[e.dataset.hLinea]; N.linea(e, a.serie, { h: 120, dec: DEC[a.id], pre: a.unidad === "USD" ? "$" : "", titulo: a.nombre + ", 30 days" }); });
  $$("[data-tv-mini]").forEach((el) => perezoso(el, () => montarTV(el, "mini-symbol-overview", { symbol: el.dataset.tvMini, dateRange: "1M" })));
  const cartas = $$("#cartas .carta");
  if (!N.rm && N.fino) cartas.forEach((c) => { const rx = gsap.quickTo(c, "rotateX", { duration: .4 }), ry = gsap.quickTo(c, "rotateY", { duration: .4 });
    c.addEventListener("pointermove", (e) => { const r = c.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 6); rx(-((e.clientY - r.top) / r.height - .5) * 6); });
    c.addEventListener("pointerleave", () => { rx(0); ry(0); }); });

  /* ---------- mercados de predicción: tarjetas con enlace, sin cifras ----------
     N quiere mercados de predicción dentro de cada informe (en estudio). Mientras tanto la página no muestra odds ni botones
     de operar: solo el nombre del mercado y un enlace a Polymarket. Kalshi: solo enlace (sus Data Terms prohíben mostrar sus datos).
     AQUÍ PUEDE VOLVER el embed oficial de Polymarket o una cifra citada con fecha y fuente, cuando N lo decida. El embed era:
       <iframe src="https://embed.polymarket.com/market.html?market=${m.slug}&features=volume&theme=${tema(el)}"></iframe>
     cargado con perezoso(el, fn) como los widgets de TradingView. */
  const pmTema = { Fed: "Fed decision", Geopolitics: "Geopolitics", AI: "AI" };
  const pmNombre = (m) => m.nombre || m.evento.replace(/-\d{6,}$/, "").replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
  $("#pm").innerHTML = (d.prediccion?.polymarket || []).map((m) => `<div class="pm-c pm-k"><span class="tema">${N.esc(pmTema[m.tema] || m.tema)}</span>` +
    `<p class="pm-n">${N.esc(pmNombre(m))}</p><a class="ir" href="https://polymarket.com/event/${encodeURIComponent(m.evento)}" rel="noopener">Odds on Polymarket</a></div>`).join("") +
    `<div class="pm-c pm-k"><span class="tema">Kalshi</span><p>Kalshi's data terms do not allow showing its odds on another site, so here is a link instead.</p><a class="ir" href="https://kalshi.com/markets" rel="noopener">Open Kalshi markets</a><span class="sello">Kalshi Data Terms of Use, personal non-commercial use only</span></div>`;

  /* ---------- Lab ---------- */
  const hn = d.hn || [];
  $("#hn-hora").textContent = `Hacker News · ${N.hora(d.generado)}`;
  $("#pila").innerHTML = hn.slice(0, 8).map((h, i) => `<article class="carta" data-revela><span class="i">${String(i + 1).padStart(2, "0")}</span><span class="tt">${N.esc(h.titulo)}</span><span class="pt"><span>Hacker News</span><span>${N.fmt(h.puntos)} points</span></span>` +
    `<span class="revela-tarjeta"><b>${N.fmt(h.puntos)} points, ${N.fmt(h.comentarios || 0)} comments</b>, posted ${N.hora(h.hora)} ${N.fecha(h.hora)}.<br><a href="${N.esc(h.url)}" rel="noopener">Open the source</a> · <a href="${N.esc(h.hn || "https://news.ycombinator.com")}" rel="noopener">Discussion</a><span class="sello">Title verbatim from Hacker News</span></span></article>`).join("");
  const pila = $$("#pila .carta");
  if (!N.rm) { gsap.set(pila, { y: (i) => -24 - (i % 4) * 14, rotateX: -35, opacity: 0, transformOrigin: "50% 0" });
    ScrollTrigger.create({ trigger: "#pila", start: "top 85%", once: true, onEnter: () => gsap.to(pila, { y: 0, rotateX: 0, opacity: 1, duration: .6, stagger: .09 }) }); }
  const repos = (d.muestra?.repos || []).filter((r) => !r.sample);
  if (!repos.length) { $("#repos-p").hidden = true; $(".p-hn").classList.add("solo"); }
  $("#repos").innerHTML = repos.map((r) => `<li><span class="i">${r.i}</span><span class="rn">${N.esc(r.repo)}</span><span class="st"><span class="up">▲ +${N.fmt(r.estrellas7d)}</span> <span class="sello">stars, 7 d</span></span>` +
    `<span class="q"><b>What it does</b>${N.esc(r.que_hace || r.que)}</span><span class="q"><b>What it's for</b>${N.esc(r.para_que || "")}</span></li>`).join("");

  /* ---------- interludios ---------- */
  N.respira($("#resp"), { etiqueta: $("#resp-t"), r: 60, min: .38 });
  N.leer($("#mantra"));

  /* ---------- mapa en capas (V3) con el recuadro de Ormuz (V1) ---------- */
  const capas = $("#capas");
  const montarMapa = async () => {
    const m = await N.cargarMapa("data/mapa.json");
    const vb = `viewBox="0 0 ${m.w} ${m.h}" preserveAspectRatio="xMidYMid slice"`;
    capas.innerHTML = `<div class="capa c1"><svg ${vb} aria-hidden="true"><path class="tierra" d="${m.land}"/></svg></div>` +
      `<div class="capa c2"><svg ${vb} aria-hidden="true">${m.rutas.map((r) => `<path class="${r.id === "lane" ? "carril" : "ruta"}" d="${r.d}"><title>${N.esc(r.label || "")}</title></path>`).join("")}</svg></div>` +
      `<div class="capa c3">${m.marcas.map((k) => `<span class="capa-n${k.id === "hormuz" ? " foco" : ""}${k.xy[0] > m.w * .6 ? " izq" : ""}" data-x="${k.xy[0]}" data-y="${k.xy[1]}">${N.esc(k.label)}</span>`).join("")}</div>` +
      "";
    $("#inset").innerHTML = `<div class="m-inset"><span class="i-t">Hormuz, detail</span><svg viewBox="0 0 ${m.inset.w} ${m.inset.h}" aria-hidden="true"><path class="i-tierra" d="${m.inset.land}"/><path class="i-in" d="${m.inset.lane_in}"/><path class="i-out" d="${m.inset.lane_out}"/>` +
      m.inset.marcas.map((k) => `<circle cx="${k.xy[0]}" cy="${k.xy[1]}" r="5" fill="none" stroke="#C3C9D2" stroke-width="2"/><text class="i-l" x="${k.xy[0] + 10}" y="${k.xy[1] + 7}">${k.label}</text>`).join("") + `</svg></div>`;
    const esc = (d.muestra?.escenarios || []).filter((e) => !e.sample);
    if (esc.length) { $("#esc-c").hidden = false; $("#esc").innerHTML = esc.map((e, i) => `<div class="e"><span class="n">${String(i + 1).padStart(2, "0")}</span><span class="si"><b>If</b>${N.esc(e.si)}</span><span class="en">${N.esc(e.entonces)}</span></div>`).join(""); }
    const colocar = () => { const W = capas.clientWidth, H = capas.clientHeight + 80, s = Math.max(W / m.w, H / m.h), ox = (W - m.w * s) / 2, oy = (H - m.h * s) / 2 - 40;
      $$(".capa-n", capas).forEach((b) => { b.style.left = ox + b.dataset.x * s + "px"; b.style.top = oy + 40 + b.dataset.y * s + "px"; }); };
    colocar(); new ResizeObserver(colocar).observe(capas);
    N.revelar(capas);
    if (N.rm) return;
    [[".c1", 10], [".c2", 26], [".c3", 44]].forEach(([c, k]) => gsap.fromTo($(c, capas), { y: k }, { y: -k, ease: "none", scrollTrigger: { trigger: capas, start: "top bottom", end: "bottom top", scrub: true } }));
    const rutas = $$(".ruta, .carril", capas); rutas.forEach((p) => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: p.classList.contains("ruta") ? "5 4" : L, strokeDashoffset: L }); });
    gsap.to(rutas, { strokeDashoffset: 0, duration: 1.6, ease: "none", stagger: .15, scrollTrigger: { trigger: capas, start: "top 70%", once: true } });
    gsap.from($$(".capa-n", capas), { opacity: 0, y: 8, stagger: .12, scrollTrigger: { trigger: capas, start: "top 60%", once: true } });
  };
  perezoso(capas, () => montarMapa().then(() => ScrollTrigger.refresh()));

  N.revelar(document);
  N.planos();
  N.entradas();
  N.suave("assets/vendor/lenis/lenis.min.js");
  window.__guion = { hasta: 99999 }; // video de revisión: recorre la página entera
  N.listo();
})();
