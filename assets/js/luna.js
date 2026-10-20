/* luna.js · la luna de hoy, desde los datos (D-268, D-270). Necesita data/luna.json (las fases principales de USNO) y nada más.
 * NAOS_LUNA.cargar() -> Promise<datos>; NAOS_LUNA.estado(datos, instante) -> { k, pct, cre, psi, edad, dura, dia, fase, prox, hitos }
 *   k      fracción iluminada, 0 a 1; pct es el entero para mostrar; cre es true mientras crece (la parte iluminada va a la derecha)
 *   fase   "nueva" | "creciente" | "cuarto_creciente" | "gibosa_creciente" | "llena" | "gibosa_menguante" | "cuarto_menguante" | "menguante"
 *   edad   días desde la luna nueva anterior; dura, días entre las dos lunas nuevas que rodean la fecha; dia, 0 a 29: el punto de hoy
 *   prox   la próxima llena o nueva ({ fase, ms }); hitos: el punto de cada fase principal de esta lunación
 * Cómo se cuenta: entre una fase principal y la siguiente, la elongación Sol-Luna (0, 90, 180, 270 grados) avanza en línea recta con el
 * tiempo; la fracción iluminada es (1 - cos elongación) / 2. Las horas de las fases salen del dato de USNO, nunca de un número escrito aquí.
 * Un día sin hora (?hoy=AAAA-MM-DD o un día de la franja semanal) se mira a las 09:00 de Colombia (America/Bogota, UTC-5, sin horario de verano).
 * Una fase "es" la del día mientras la fase principal cae a menos de 0,9 días (21,6 h). */
(function (raiz) {
  "use strict";
  const DIA = 864e5, SIN = 29.530588853, MEDIA = SIN / 4, BOG = 5 * 36e5, VENTANA = 0.9;
  const ANG = { nueva: 0, cuarto_creciente: 90, llena: 180, cuarto_menguante: 270 };
  const ORDEN = ["nueva", "cuarto_creciente", "llena", "cuarto_menguante"];
  const SRC = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : "";
  let promesa = null;

  const cargar = () => promesa || (promesa = fetch(SRC ? new URL("../../data/luna.json", SRC).href : "data/luna.json").then((r) => r.json()).then((d) => {
    d.fases = (d.fases || []).map((f) => ({ fase: f.fase, ms: Date.parse(f.utc.replace(/Z$/, ":00Z")) })).sort((a, b) => a.ms - b.ms);
    return d;
  }).catch(() => null));

  // 09:00 de Colombia de un día AAAA-MM-DD, en milisegundos UTC
  const manana = (f) => Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10), 9) + BOG;
  // el día de calendario en Colombia de un instante, AAAA-MM-DD
  const diaBogota = (ms) => new Date(ms - BOG).toISOString().slice(0, 10);

  // las fases con una de relleno a cada lado cuando el dato se acaba (media lunación entre cuartos)
  function cadena(F) {
    const xs = F.slice(), i0 = ORDEN.indexOf(xs[0].fase), i1 = ORDEN.indexOf(xs[xs.length - 1].fase);
    xs.unshift({ fase: ORDEN[(i0 + 3) % 4], ms: xs[0].ms - MEDIA * DIA, est: true });
    xs.push({ fase: ORDEN[(i1 + 1) % 4], ms: xs[xs.length - 1].ms + MEDIA * DIA, est: true });
    return xs;
  }

  function estado(D, ms) {
    if (!D || !D.fases || D.fases.length < 3) return null;
    const C = cadena(D.fases);
    let i = 0; while (i < C.length - 2 && C[i + 1].ms <= ms) i++;
    const a = C[i], b = C[i + 1];
    const psi = (ANG[a.fase] + 90 * Math.min(1, Math.max(0, (ms - a.ms) / (b.ms - a.ms)))) % 360;
    const k = (1 - Math.cos(psi * Math.PI / 180)) / 2, cre = psi < 180;
    // la luna nueva anterior y la siguiente (con la media si el dato se acaba)
    let nueva0 = null, nueva1 = null;
    for (const f of C) { if (f.fase !== "nueva") continue; if (f.ms <= ms) nueva0 = f.ms; else if (nueva1 == null) nueva1 = f.ms; }
    if (nueva0 == null) nueva0 = nueva1 != null ? nueva1 - SIN * DIA : ms - (psi / 360) * SIN * DIA;
    if (nueva1 == null) nueva1 = nueva0 + SIN * DIA;
    const edad = (ms - nueva0) / DIA, dura = (nueva1 - nueva0) / DIA;
    // la fase del día: la principal más cercana si cae a menos de 0,9 días; si no, el tramo
    let fase = null, mejor = VENTANA * DIA;
    for (const f of [a, b]) { const d = Math.abs(f.ms - ms); if (d < mejor) { mejor = d; fase = f.fase; } }
    if (!fase) fase = psi < 90 ? "creciente" : psi < 180 ? "gibosa_creciente" : psi < 270 ? "gibosa_menguante" : "menguante";
    const prox = C.find((f) => f.ms > ms && (f.fase === "llena" || f.fase === "nueva"));
    const hitos = C.filter((f) => f.ms >= nueva0 && f.ms < nueva1).map((f) => ({ fase: f.fase, dia: Math.min(29, Math.max(0, Math.floor((f.ms - nueva0) / DIA))) }));
    return { ms, k, pct: Math.round(k * 100), cre, psi, edad, dura, dia: Math.min(29, Math.max(0, Math.floor(edad))), fase,
      prox: prox ? { fase: prox.fase, ms: prox.ms } : null, hitos };
  }

  const NOMBRES = {
    en: { nueva: "New moon", creciente: "Waxing crescent", cuarto_creciente: "First quarter", gibosa_creciente: "Waxing gibbous", llena: "Full moon",
      gibosa_menguante: "Waning gibbous", cuarto_menguante: "Last quarter", menguante: "Waning crescent" },
    es: { nueva: "Luna nueva", creciente: "Creciente", cuarto_creciente: "Cuarto creciente", gibosa_creciente: "Gibosa creciente", llena: "Luna llena",
      gibosa_menguante: "Gibosa menguante", cuarto_menguante: "Cuarto menguante", menguante: "Menguante" },
  };
  const nombre = (fase, lang) => (NOMBRES[lang] || NOMBRES.en)[fase];

  // fecha y hora de un instante en Colombia: { dia: "Oct 25", hora: "11:12 pm" } (EN) o { dia: "25 oct", hora: "23:12" } (ES)
  const MES = { en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] };
  function cuando(ms, lang) {
    const t = new Date(ms - BOG), d = t.getUTCDate(), m = MES[lang][t.getUTCMonth()], h = t.getUTCHours(), mi = String(t.getUTCMinutes()).padStart(2, "0");
    if (lang === "es") return { dia: `${d} ${m}`, hora: `${String(h).padStart(2, "0")}:${mi}` };
    return { dia: `${m} ${d}`, hora: `${((h + 11) % 12) + 1}:${mi} ${h < 12 ? "am" : "pm"}` };
  }

  // el disco en SVG: el círculo oscuro con su filete, y encima la parte iluminada con el terminador elíptico. Dos tonos, sin degradado.
  // La parte iluminada va a la derecha mientras crece y a la izquierda mientras mengua.
  function disco(k, cre, px) {
    const r = 48, rx = r * Math.abs(1 - 2 * k), cre1 = k <= 0.5 ? 0 : 1;
    const lit = k < 0.004 ? "" : k > 0.996 ? `<circle r="${r}" class="lu-l"/>` :
      `<path class="lu-l" d="M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${rx.toFixed(2)} ${r} 0 0 ${cre1} 0 ${-r}Z"${cre ? "" : ' transform="scale(-1 1)"'}/>`;
    return `<svg class="lu-s" viewBox="-50 -50 100 100" width="${px}" height="${px}" aria-hidden="true" focusable="false"><circle r="${r}" class="lu-o"/>${lit}</svg>`;
  }

  // la fracción del hueco de un ojo que queda a la vista cuando un círculo del mismo radio lo cubre a la distancia d (en radios): para cella.js
  // k = 1 - lente(d) / area; se resuelve d por bisección (d = 0 lo cubre todo, d = 2 no lo toca)
  function separacion(k) {
    const lente = (d) => 2 * Math.acos(d / 2) - (d / 2) * Math.sqrt(4 - d * d), meta = (1 - Math.min(1, Math.max(0, k))) * Math.PI;
    let lo = 0, hi = 2;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (lente(m) > meta) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  raiz.NAOS_LUNA = { cargar, estado, manana, diaBogota, nombre, cuando, disco, separacion };
})(window);
