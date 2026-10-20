// construir-temas.mjs · el esqueleto de las páginas de tema (lote E de la junta de llenado, D-252).
// Node 18+, sin dependencias. Dos pasos:
//   1. Proyección (solo donde está la grilla privada): lee paginas.json + grilla.json (+ afirmaciones.csv) y escribe
//      data/temas.json con lo que la página pública necesita y nada más (sin notas internas, sin revisa_N, sin rutas).
//        node scripts/construir-temas.mjs --grilla=<grilla.json> --paginas=<paginas.json> [--afirmaciones=<afirmaciones.csv>] [--solo=slug,slug]
//      (--solo: solo esos temas y sus piezas salen de la grilla; lo demás queda como está en data/temas.json)
//   2. Páginas (siempre; es lo que corre la Action): desde data/temas.json, data/enlaces.json y data/agenda.json escribe
//      temas/<slug>/index.html (una por tema), los hubs (temas/, temas/humanity/, temas/pilar/<id>/),
//      un enlace corto estático por Short (s/<codigo>/index.html, redirige a su tarjeta con ?src=<codigo>) y sitemap.xml.
//        node scripts/construir-temas.mjs
//   3. Cuerpo (lote 0+1 en adelante; solo donde está el lote privado): copia el texto, la meta y los visuales de las páginas
//      selladas por I4 a data/temas/ y assets/temas/ (scripts/cuerpo-temas.mjs); desde ahí el paso 2 arma esas páginas con sus
//      bloques 0 a 8 y las demás siguen como esqueleto.
//        node scripts/construir-temas.mjs --cuerpo=<carpeta del lote> --sellados=slug,slug
// Salida determinista: mismo dato, mismos bytes (sin hora de corrida). Las tarjetas pasan a "Out" solo con enlace en
// data/enlaces.json (clave "AAAA-MM-DD|<codigo>"). Lo corre construir-semana.mjs al final, como construir-ics.mjs.
// Reglas (D-252, D-253): títulos con estado "Coming", salvo noticias y elecciones (solo fecha y tema); dos ediciones, EN
// (temas/) y ES (es/temas/, con su portada es/ y la franja), cada página con hreflang hacia su par; las piezas ES viven en la
// edición ES, las EN en las dos (en la ES con lang="en"); luna solo en Humanity, lo medido a la vista y el signo tras un toque
// ("Western tropical zodiac"), salvo en las páginas de una tradición con calendario propio; "Voice: synthetic" en cada pieza
// con voz; "Descriptive, not financial advice" en Markets; líneas de ayuda en el mismo lugar de cada página; sin Lenis ni
// GSAP; bloques vacíos ausentes, nunca de relleno. Enlaces cortos: registro solo de suma (data/cortos.json), así un código
// ya compartido nunca da 404 aunque la grilla mueva su Short.
// Archivo (19-oct): no hay segundo lado; NAOS es Humanity. The Present sale de la proyección, de los hubs y de la navegación;
// data/archivo.json dice a dónde redirige cada página archivada (EN y ES) y cada enlace corto que apuntaba a ella (noindex).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importar, cuerpoTema } from "./cuerpo-temas.mjs";

const V = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://hardlypythonnmr.github.io/naos/";
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const leerJSON = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- textos fijos de la página (D-252); los mismos en la portada (index.html) ----------
// el 123 lleva su fuente (decisión 18 de N): la página de Colombia de findahelpline.com da el 123 como "Emergency Services"
export const AYUDA_HTML = 'If this is weighing on you, talk to someone now. Colombia: <a href="tel:106">106</a>, national mental health line, 24/7, or <a href="tel:123">123</a> in immediate danger (<a href="https://findahelpline.com/countries/co" rel="noopener">source</a>). US: <a href="tel:988">988</a>. Anywhere else: <a href="https://findahelpline.com" rel="noopener">findahelpline.com</a>.';
const LINEA_N = { Humanity: "Eat well, sleep well, get moving, have a relationship with the divine, and build community." };
const NO_CONSEJO = "Descriptive, not financial advice.";
// D-265, literal (DECISIONS.md): la leyenda de la portada, en español (N) y su traducción literal al inglés
const LEYENDA_ES = "Naos hoy es una invitación a reconectar con la humanidad dentro de cada uno a través de conductas básicas y fundamentales a la vida humana, para identificar y fortalecer los valores que encontremos dentro de nosotros, afuera.";
const LEYENDA_EN = "NAOS today is an invitation to reconnect with the humanity within each of us through basic behaviors fundamental to human life, to identify and strengthen the values we find within ourselves, outside.";
// páginas de una tradición con calendario propio: ahí no va el signo occidental (acta 2c, rojo 23) hasta que I3 traiga el dato
// de esa tradición; quedan la fase y la iluminación, que son medidas
const SIN_SIGNO = new Set(["a-lamp-on-the-night-without-a-moon", "light-in-the-window", "walk-to-the-water", "the-longest-night", "how-a-month-is-announced"]);
// títulos de página en español (D-253; latinoamericano general, D-242). Traducción del constructor: N la revisa con el lote
const TITULO_ES = {
  "the-cella": "La sala vacía, la sala llena", "the-full-moon-table": "La mesa de luna llena", "walks-by-the-moon": "Caminatas con la luna",
  "saints-and-souls": "Santos y Difuntos", "keep-your-hour": "Cambie o no el reloj, mantén tu hora.", "a-lamp-on-the-night-without-a-moon": "Una lámpara en la noche sin luna",
  moon: "La luna esta temporada", "walk-to-the-water": "Camina hasta el agua", "phones-in-the-bread-basket": "Los teléfonos en la panera",
  "a-good-party": "Una buena fiesta", "advent-waiting": "Adviento: la espera", "light-in-the-window": "Luz en la ventana",
  "how-a-month-is-announced": "Cómo se anuncia un mes", "the-longest-night": "La noche más larga", "back-to-the-hour": "De vuelta a la hora",
  "who-is-telling-you-this": "¿Quién te está contando esto?", "from-chat-to-code": "Del chat al código", "built-here": "Hecho aquí",
  "how-a-vote-is-counted": "Cómo se cuenta un voto", "who-writes-the-rules": "¿Quién escribe las reglas?",
  "fomc-before-and-after-the-silence": "El FOMC, antes y después del silencio", "look-up-from-the-news": "Levanta la vista de las noticias",
  "payrolls-before-the-number": "Las nóminas, antes del número", "one-number-and-its-range": "Un número y su rango",
  "the-radar-that-tells-you-when-it-is-blind": "El radar que te avisa cuando no ve", "money-at-the-table": "El dinero en la mesa",
  "how-we-test-an-idea": "Cómo probamos una idea antes de creerla", "two-clocks": "Dos relojes", "fomc-with-projections": "El FOMC con proyecciones",
  "four-banks-one-table": "Cuatro bancos, una mesa", errata: "Fe de erratas: en qué nos equivocamos", "open-questions": "Preguntas abiertas",
  es: "Más cerca de ti, en español",
};
// la página de las piezas en español (decisión 2 de N, lote 2): su título en inglés no está en la grilla (allí va en español)
const TITULO_EN = { es: "Closer to yourself, in Spanish" };
// etiqueta de fuente en español dentro de una página en inglés (WCAG 3.1.2): misma regla que agenda-comun.js
const ES_FUENTE = /[¿¡ñ]|\b(calendario|agenda|anuncios|política|económica|elecciones|año|según)\b/i;
// fuentes de elecciones: solo la autoridad electoral, el diario oficial o el texto de ley hasta el sello I4 (acta, rojo 6)
const ELECCION = /\b(elections?|electoral|ballots?|votes?|voting|voters?|runoffs?|midterms?|referendum|presidential|elecci[oó]n|balotaje)\b/i;
// fuentes heredadas que una página no lleva, por su revisión de fuentes (moon-40: Wikipedia fuera de la página de la luna)
// hindutone (R-05 del lote 2, decidido por evidencia el 19-oct): fuera de la página de la lámpara
const FUERA_DE_PAGINA = { moon: /(^|\.)wikipedia\.org$/, "a-lamp-on-the-night-without-a-moon": /(^|\.)hindutone\.com$/ };
const OFICIAL_ELECCION = /(^|\.)(fec\.gov|eac\.gov|tse\.jus\.br|boe\.es|juntaelectoralcentral\.es|law\.cornell\.edu|ine\.mx|service-public\.gouv\.fr)$/;

// ---------- vocabulario público ----------
const PILARES = [ // orden de los estantes; frase de N como lomos en Humanity
  { id: "eat", grilla: "comer", titulo: "Eat", seccion: "Humanity", lomo: "Eat well," },
  { id: "sleep", grilla: "dormir", titulo: "Sleep", seccion: "Humanity", lomo: "sleep well," },
  { id: "move", grilla: "moverse", titulo: "Move", seccion: "Humanity", lomo: "get moving," },
  { id: "the-divine", grilla: "lo divino", titulo: "The divine", seccion: "Humanity", lomo: "have a relationship with the divine," },
  { id: "community", grilla: "comunidad", titulo: "Community", seccion: "Humanity", lomo: "and build community." },
];
const SECCIONES = [{ id: "humanity", titulo: "Humanity" }]; // NAOS es solo Humanity (D-263)
const FORMATO = { "short+reel": "Short and Reel", medio: "Medium video on YouTube", carrusel: "Instagram carousel", historia: "Instagram story", es: "Short and Reel in Spanish" };
const CON_VOZ = new Set(["short+reel", "medio", "es"]);
const FASE = { "gibosa menguante": "waning gibbous", "gibosa creciente": "waxing gibbous", creciente: "waxing crescent", menguante: "waning crescent",
  "cuarto menguante": "last quarter", "cuarto creciente": "first quarter", llena: "full moon", "llena, víspera": "eve of the full moon",
  "llena, un día después": "day after the full moon", nueva: "new moon", "nueva, víspera": "eve of the new moon", "nueva, un día después": "day after the new moon" };
const SIGNO = { Aries: "Aries", Tauro: "Taurus", "Géminis": "Gemini", "Cáncer": "Cancer", Leo: "Leo", Virgo: "Virgo", Libra: "Libra", Escorpio: "Scorpio",
  Sagitario: "Sagittarius", Capricornio: "Capricorn", Acuario: "Aquarius", Piscis: "Pisces" };
const MES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], DIA = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fe = (f) => { const t = new Date(f + "T12:00:00Z"); return `${DIA[t.getUTCDay()]} ${t.getUTCDate()} ${MES[t.getUTCMonth()]}`; };
const feCorta = (f) => { const t = new Date(f + "T12:00:00Z"); return `${t.getUTCDate()} ${MES[t.getUTCMonth()]}`; };

// texto de la grilla que puede salir en inglés tal cual (los títulos internos de historias vienen en español)
const ES = /[áéíóúñ¿¡]|\b(de|del|la|las|el|los|con|para|una|un|esta|noche|semana|imagen|quieta|encuesta|tarjeta|registro|calendario|pregunta|abierta|mapa|cercana|citando|como|empieza|cuadro|lámina|guion|se)\b/i;
const enIngles = (t) => !!t && !ES.test(t);
// el signo va detrás de un toque (D-252): un título o línea que lo nombra no sale a la vista
const ZODIACO = /\b(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/;
const publico = (t) => enIngles(t) && !ZODIACO.test(t);

// ---------- 1. proyección ----------
function proyectar({ grilla, paginas, afirmaciones, agenda, tolerante = false }) {
  // archivado: The Present y todo slot "archivado" quedan fuera de la página pública (data/archivo.json)
  const fuera = (s) => s.seccion === "The Present" || /^archivado/.test(s.estado || "");
  const ARCH = leerJSON(path.join(V, "data/archivo.json"), { paginas: {} });
  const slots0 = grilla.slots.filter((s) => s.fecha_et <= "2026-12-31" && !fuera(s));
  const porId = new Map(slots0.map((s) => [s.id, s]));
  // tolerante (solo con --solo): la grilla puede ir por delante de paginas.json en temas que no se tocan; esos slots se saltan aquí
  // y mezclar() deja esos temas como estaban en data/temas.json
  if (tolerante) paginas = paginas.map((p) => ({ ...p, slots: p.slots.filter((id) => porId.has(id)), historias: p.historias.filter((id) => porId.has(id)) })).filter((p) => p.slots.length + p.historias.length);
  const enAlguna = new Set(paginas.flatMap((p) => [...p.slots, ...p.historias]));
  const slots = tolerante ? slots0.filter((s) => enAlguna.has(s.id)) : slots0;
  const pil = (g) => PILARES.find((p) => p.grilla === g);
  // la pieza ES aterriza en la página "es" (decisión 2 de N, lote 2: /naos/es/temas/es/) y lleva como "tema" la página de la pieza
  // EN que versiona; esa página la sigue listando en su edición ES (los textos sellados la traen como lista de la pieza)
  // D-268: la luna pasa a calendario; su página (moon) ya no tiene estante: sin pilar, como la página "es"; la enlaza la casilla de la luna de la portada
  const esPagina = (p) => p.slug === "es" || /español/i.test(p.pilar) || p.pilar === "luna";
  paginas = paginas.filter((p) => ARCH.paginas[p.slug] == null && p.seccion !== "The Present");
  const enPaginas = paginas.filter((p) => !esPagina(p));
  const paginaDe = new Map(), temaDe = new Map();
  for (const p of enPaginas) for (const id of [...p.slots, ...p.historias]) {
    if (!porId.has(id)) throw new Error(`${p.slug}: el slot ${id} no está en la grilla`);
    if (paginaDe.has(id)) throw new Error(`${id} está en dos páginas: ${paginaDe.get(id)} y ${p.slug}`);
    paginaDe.set(id, p.slug);
  }
  for (const p of paginas.filter(esPagina)) for (const id of [...p.slots, ...p.historias]) {
    const s = porId.get(id); if (!s) throw new Error(`es: ${id} no está en la grilla`);
    const m = /Versión de: (.+) \([^\s)]+ (\d+)\)/.exec(s.fuente || ""); if (!m) throw new Error(`${id}: sin "Versión de:" en fuente`);
    const [, tit, dd] = m;
    const en = slots.find((x) => x.canal === "short+reel" && x.seccion === s.seccion && Number(x.fecha_et.slice(8)) === Number(dd) && x.fecha_et <= s.fecha_et && (x.titulo === tit || x.titulo.startsWith(tit)));
    if (!en || !paginaDe.has(en.id)) throw new Error(`${id}: no encuentro la pieza EN "${tit}" del día ${dd}`);
    paginaDe.set(id, p.slug); temaDe.set(id, paginaDe.get(en.id));
  }
  const falta = slots.filter((s) => !paginaDe.has(s.id)).map((s) => s.id);
  if (falta.length) throw new Error("slots de la grilla sin página: " + falta.join(", "));

  // códigos: enlace corto por Short (mmdd + h|p, o mmdd + es) y clave de enlaces.json para el resto
  const codigoDe = (s) => {
    const md = s.fecha_et.slice(5, 7) + s.fecha_et.slice(8, 10), sec = s.seccion === "Humanity" ? "h" : "p";
    return { "short+reel": md + sec, es: md + "es", medio: md + sec + "-medium", carrusel: md + sec + "-carousel", historia: md + sec + "-story-" + s.hora_et.replace(":", "") }[s.canal];
  };
  const tarjetaDe = (s) => "c-" + s.id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");

  // fuentes heredadas: filas verificadas de afirmaciones.csv citadas por id, textos nombrados en la grilla y eventos de la agenda
  const filas = new Map((afirmaciones || []).map((r) => [r.id, r]));
  const ANFITRION = { "doi.org": "DOI", "pmc.ncbi.nlm.nih.gov": "PubMed Central", "pubmed.ncbi.nlm.nih.gov": "PubMed", "europepmc.org": "Europe PMC",
    "en.wikipedia.org": "Wikipedia", "aa.usno.navy.mil": "U.S. Naval Observatory", "ssd.jpl.nasa.gov": "NASA JPL Horizons", "www.bls.gov": "U.S. Bureau of Labor Statistics",
    "www.federalreserve.gov": "Federal Reserve", "www.hebcal.com": "Hebcal, Jewish calendar", "www.sefaria.org": "Sefaria", "arxiv.org": "arXiv", "www.gutenberg.org": "Project Gutenberg",
    "suttacentral.net": "SuttaCentral", "reutersinstitute.politics.ox.ac.uk": "Reuters Institute", "www.chabad.org": "Chabad.org", "sunnah.com": "Sunnah.com",
    "www.who.int": "World Health Organization", "www.nhs.uk": "NHS", "www.britannica.com": "Britannica", "archive.org": "Internet Archive", "www.amsmeteors.org": "American Meteor Society",
    "nssdc.gsfc.nasa.gov": "NASA NSSDCA", "www.ecb.europa.eu": "European Central Bank", "www.bankofengland.co.uk": "Bank of England", "www.boj.or.jp": "Bank of Japan",
    "www.banrep.gov.co": "Banco de la República", "www.unep.org": "UN Environment Programme", "www.law.cornell.edu": "Cornell Law School LII", "www.mpg.de": "Max Planck Society" };
  // herramientas, APIs y datos de nuestra propia medición: no son fuentes del contenido
  const FUERA = /(^|\.)(developers\.google\.com|support\.google\.com|pypi\.org|rhodesmill\.org|raw\.githubusercontent\.com|elicit\.com|dumps\.wikimedia\.org|api\.[\w.]+)$/;
  const rotulo = (u) => {
    const x = new URL(u), host = x.hostname, nombre = ANFITRION[host] || host.replace(/^www\./, "");
    const resto = decodeURIComponent(x.pathname + x.search).replace(/\/$/, "").replace(/^\//, "");
    // extremos de API o con consulta ("hebcal?v=1&cfg=json", "api/seasons?year=2026"): solo el nombre del anfitrión
    if (/[?=&]|^api\b|\.json$/.test(resto)) return nombre;
    return host === "doi.org" ? `DOI ${resto}` : resto && resto.length <= 70 ? `${nombre}: ${resto}` : nombre;
  };
  const deFila = (id) => {
    const r = filas.get(id);
    if (!r || id.startsWith("demanda-") || r.verificado !== "si" || !["vigente", "sobrevive"].includes(r.estado) || !/^https:\/\//.test(r.fuente_url)) return null;
    let host; try { host = new URL(r.fuente_url).hostname; } catch { return null; }
    if (FUERA.test(host)) return null;
    if (host === "ssd.jpl.nasa.gov") return { titulo: "NASA JPL Horizons", url: "https://ssd.jpl.nasa.gov/horizons/" };
    return { titulo: rotulo(r.fuente_url), url: r.fuente_url };
  };
  // ids citados: "conductas-01", "tradiciones-17, -19, -20", "the-present-calendario-03 a -06", "evidencia-35, -27"
  const idsDe = (t) => {
    const out = [];
    for (const m of t.matchAll(/\b(astrologia|cielo|conductas|demanda|evidencia|tradiciones|the-present-calendario)-(\d{2})((?:\s*(?:,|a|y)\s*-\d{2})*)/g)) {
      const pre = m[1], nums = [m[2], ...[...m[3].matchAll(/-(\d{2})/g)].map((x) => x[1])];
      if (/\ba\s*-\d{2}/.test(m[3]) && nums.length === 2) { for (let n = +nums[0]; n <= +nums[1]; n++) out.push(`${pre}-${String(n).padStart(2, "0")}`); }
      else out.push(...nums.map((n) => `${pre}-${n}`));
    }
    return out;
  };
  const TEXTOS = [ // obras nombradas en la grilla, rotuladas en inglés; URL solo donde la grilla o la casa ya la tienen
    [/Hesíodo, Trabajos y días 772-773/, { titulo: "Hesiod, Works and Days 772-773, translated by H. G. Evelyn-White (1914), public domain" }],
    [/Séneca, Epistulae morales 19\.10/, { titulo: "Seneca, Moral Letters 19.10, quoting Epicurus (fr. 542 Usener); Latin text from The Latin Library, our translation", url: "https://www.thelatinlibrary.com/" }],
    [/Séneca Ep\. 19\.10/, { titulo: "Seneca, Moral Letters 19.10, quoting Epicurus (fr. 542 Usener); Latin text from The Latin Library, our translation", url: "https://www.thelatinlibrary.com/" }],
    [/Sanhedrín 42a/, { titulo: "Babylonian Talmud, Sanhedrin 42a, our translation" }],
    [/Oppezzo y Schwartz 2014/, { titulo: "Oppezzo and Schwartz, 2014" }],
    [/AN 5\.29/, { titulo: "Anguttara Nikaya 5.29" }],
    [/Epley y Schroeder 2014/, { titulo: "Epley and Schroeder, 2014" }],
    [/Hebreos 13:2/, { titulo: "Hebrews 13:2" }],
    [/Dunn, Aknin y Norton 2008/, { titulo: "Dunn, Aknin and Norton, 2008" }],
    [/AN 8\.33/, { titulo: "Anguttara Nikaya 8.33" }],
    [/Mateo 6:3/, { titulo: "Matthew 6:3" }],
    [/Maimónides/, { titulo: "Maimonides, on giving" }],
    [/Killingsworth y Gilbert 2010/, { titulo: "Killingsworth and Gilbert, 2010" }],
    [/Regla de san Benito 43\.1/, { titulo: "Rule of Saint Benedict 43.1" }],
    [/Bernardi et al\. 2006/, { titulo: "Bernardi et al., 2006" }],
    [/Gita 17\.16/, { titulo: "Bhagavad Gita 17.16" }],
    [/MN 26/, { titulo: "Majjhima Nikaya 26" }],
    [/Durkheim 1912/, { titulo: "Durkheim, The Elementary Forms of Religious Life (1912)" }],
    [/arXiv 2510\.01171/, { titulo: "Zhang et al., 2025, arXiv:2510.01171", url: "https://arxiv.org/abs/2510.01171" }],
    [/CHATS-lab\/verbalized-sampling/, { titulo: "CHATS-lab/verbalized-sampling (Apache-2.0)", url: "https://github.com/CHATS-lab/verbalized-sampling" }],
    [/Hebcal\.com/, { titulo: "Hebcal (CC BY 4.0)", url: "https://www.hebcal.com/" }],
    [/USNO|calendario-lunar\.json|Informe de la luna/, { titulo: "U.S. Naval Observatory, moon phases", url: "https://aa.usno.navy.mil/data/MoonPhases" }],
    [/Horizons/, { titulo: "NASA JPL Horizons", url: "https://ssd.jpl.nasa.gov/horizons/" }],
    [/\(BLS\)|; BLS\)|BLS, BEA/, { titulo: "U.S. Bureau of Labor Statistics", url: "https://www.bls.gov/" }],
    [/BLS, BEA/, { titulo: "U.S. Bureau of Economic Analysis", url: "https://www.bea.gov/" }],
    [/BEA, Fed/, { titulo: "Federal Reserve", url: "https://www.federalreserve.gov/" }],
  ];
  const CAT = { mercado: ["central_bank", "us_data"], noticias: ["summit"], IA: ["tech_ai"] }; // elecciones fuera hasta el sello I4 (D-252)
  const eventos = (agenda?.eventos || []).filter((e) => e.url && /^https:\/\//.test(e.url) && !/wikipedia\.org/.test(e.url));
  const masDias = (f, n) => new Date(Date.parse(f + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
  const fuentesDe = (s) => {
    const t = s.fuente || "", out = [];
    for (const id of idsDe(t)) { const f = deFila(id); if (f) out.push(f); }
    for (const [re, f] of TEXTOS) if (re.test(t)) out.push(f);
    if (/agenda\.json/.test(t) && CAT[s.pilar_o_tema]) for (const e of eventos)
      // solo lo agendado de la categoría de la pieza en sus días siguientes (mercado: 3 días; cumbres: ese día o el siguiente)
      if (CAT[s.pilar_o_tema].includes(e.categoria) && e.fecha >= s.fecha_et && e.fecha <= masDias(s.fecha_et, s.pilar_o_tema === "noticias" ? 1 : 3)) out.push({ titulo: e.fuente, url: e.url });
    return out;
  };

  const piezas = [];
  for (const s of [...slots].sort((a, b) => a.utc.localeCompare(b.utc) || a.id.localeCompare(b.id))) {
    const slug = paginaDe.get(s.id), tema = temaDe.get(s.id) || null, pag = enPaginas.find((p) => p.slug === (tema || slug)), P = pil(pag.pilar), Ps = pil(s.pilar_o_tema);
    const noticia = s.pilar_o_tema === "noticias" || pag.pilar === "noticias";
    // idioma: "EN", "ES" o una pieza de dos voces ("EN+ES", "ES+EN": una voz después de la otra, cada una en su idioma)
    const idiomas = [...new Set((String(s.idioma || "").toUpperCase().match(/\b(EN|ES)\b/g) || []).map((x) => x.toLowerCase()))];
    const lang = s.canal === "es" || idiomas[0] === "es" ? "es" : "en";
    const titulo = noticia ? null : lang === "es" ? s.titulo : publico(s.titulo) ? s.titulo : null;
    const linea = !noticia && s.canal === "short+reel" && publico(s.gancho_2s) && s.gancho_2s !== s.titulo ? s.gancho_2s : null;
    const luna = s.seccion === "Humanity" && s.luna ? { fase: FASE[s.luna.fase], iluminacion: s.luna.iluminacion_pct, signo: SIGNO[s.luna.signo] } : null;
    if (luna && (!luna.fase || !luna.signo)) throw new Error(`${s.id}: luna sin traducción (${s.luna.fase}, ${s.luna.signo})`);
    if (luna && SIN_SIGNO.has(tema || slug)) luna.signo = null;
    const corto = ["short+reel", "es"].includes(s.canal);
    piezas.push({
      id: tarjetaDe(s), ref: s.id, pagina: slug, ...(tema ? { tema } : {}), fecha: s.fecha_et, hora_et: s.hora_et, hora_medellin: s.medellin.slice(11, 16), utc: s.utc,
      canal: s.canal, formato: FORMATO[s.canal], seccion: s.seccion, pilar: (Ps || P || {}).id ?? null, lang, titulo, linea,
      ...(idiomas.length > 1 ? { idiomas } : {}),
      voz: CON_VOZ.has(s.canal), noticia, mercado: s.pilar_o_tema === "mercado", luna, codigo: codigoDe(s), corto,
      _fuentes: fuentesDe(s),
    });
  }
  const codigos = new Set(); for (const x of piezas) { if (codigos.has(x.codigo)) throw new Error("código repetido: " + x.codigo); codigos.add(x.codigo); }

  const salidaPag = [...enPaginas, ...paginas.filter(esPagina)].map((p) => {
    // un tema lista también la pieza ES que versiona una de las suyas (su tarjeta aterriza en la página "es")
    const xs = piezas.filter((x) => x.pagina === p.slug || x.tema === p.slug), vistos = new Set(), fuentes = [];
    for (const x of xs) for (const f of x._fuentes) {
      const k = f.url || f.titulo; if (vistos.has(k)) continue; vistos.add(k);
      let host = ""; try { host = new URL(f.url).hostname; } catch { /* obra sin URL */ }
      if (ELECCION.test(`${f.titulo} ${f.url || ""}`.replace(/-/g, " ")) && !OFICIAL_ELECCION.test(host)) continue;
      if (FUERA_DE_PAGINA[p.slug] && FUERA_DE_PAGINA[p.slug].test(host)) continue;
      fuentes.push(ES_FUENTE.test(f.titulo) ? { ...f, lang: "es" } : f);
    }
    const P = esPagina(p) ? null : pil(p.pilar);
    if (!P && !esPagina(p)) throw new Error(`${p.slug}: pilar sin nombre público (${p.pilar})`);
    if (!TITULO_ES[p.slug]) throw new Error(`${p.slug}: falta el título en español (TITULO_ES)`);
    // la página "es" no va en un estante (sus piezas son de varios pilares): pilar null; la enlazan la portada ES y cada tarjeta
    return { slug: p.slug, titulo: TITULO_EN[p.slug] || p.titulo_en, titulo_es: TITULO_ES[p.slug], seccion: p.seccion, pilar: P ? P.id : null, desde: xs[0].fecha, hasta: xs.at(-1).fecha, piezas: xs.map((x) => x.id), fuentes };
  });
  for (const x of piezas) delete x._fuentes;
  return {
    nota: "Proyección pública de la grilla para las páginas de tema (ediciones EN y ES). La escribe scripts/construir-temas.mjs; no editar a mano. Solo lo que la página muestra.",
    grilla: grilla.meta?.generado || null,
    secciones: SECCIONES,
    pilares: PILARES.filter((P) => P.seccion === "Humanity").map(({ id, titulo, seccion, lomo }) => ({ id, titulo, seccion, lomo })),
    paginas: salidaPag,
    piezas,
  };
}

// --solo=slug,slug: de la proyección nueva entran solo esos temas y sus piezas (y las piezas ES que aterrizan en uno de ellos o que
// uno de ellos lista); lo demás queda como estaba en data/temas.json. Así un lote monta sus páginas sin arrastrar cambios de la grilla
// a temas que no toca (lote 2: The Present congelado el 19-oct).
function mezclar(viejo, nuevo, solo) {
  const entra = (x) => solo.has(x.pagina) || (x.tema && solo.has(x.tema));
  const nuevas = new Map(nuevo.piezas.filter(entra).map((x) => [x.id, x]));
  const piezas = viejo.piezas.map((x) => nuevas.get(x.id) || x);
  for (const [id, x] of nuevas) if (!viejo.piezas.some((y) => y.id === id)) piezas.push(x);
  piezas.sort((a, b) => a.utc.localeCompare(b.utc) || a.ref.localeCompare(b.ref));
  for (const s of solo) if (!nuevo.paginas.some((p) => p.slug === s)) throw new Error(`--solo: ${s} no está en la proyección`);
  const paginas = viejo.paginas.map((p) => (solo.has(p.slug) ? nuevo.paginas.find((q) => q.slug === p.slug) : p));
  for (const p of nuevo.paginas) if (solo.has(p.slug) && !viejo.paginas.some((q) => q.slug === p.slug)) paginas.push(p);
  return { ...viejo, grilla: nuevo.grilla, paginas, piezas };
}

// CSV con comillas (afirmaciones.csv)
function csv(t) {
  const filas = []; let f = [], c = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { f.push(c); c = ""; } else if (ch === "\n" || ch === "\r") { if (ch === "\r" && t[i + 1] === "\n") i++; f.push(c); filas.push(f); f = []; c = ""; } else c += ch;
  }
  if (c || f.length) { f.push(c); filas.push(f); }
  const [cab, ...resto] = filas.filter((r) => r.length > 1);
  return resto.map((r) => Object.fromEntries(cab.map((k, i) => [k, r[i] ?? ""])));
}

// ---------- 2. páginas ----------
const write = (rel, contenido) => { const p = path.join(V, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, contenido); };

// Dos ediciones (D-253). EN: temas/, sus hubs y la portada de siempre. ES: es/ (portada con la franja), es/temas/ y sus hubs.
// Todo lo que cambia entre una y otra está aquí; la estructura de la página es la misma.
export const AYUDA_HTML_ES = 'Si esto te pesa, habla con alguien ahora. Colombia: <a href="tel:106">106</a>, línea nacional de salud mental, 24/7, o <a href="tel:123">123</a> si hay peligro inmediato (<a href="https://findahelpline.com/countries/co" rel="noopener" hreflang="en">fuente</a>). EE. UU.: <a href="tel:988">988</a>. En cualquier otro lugar: <a href="https://findahelpline.com" rel="noopener" hreflang="en">findahelpline.com</a>.';
const MES_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"], DIA_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const FASE_ES = Object.fromEntries(Object.entries(FASE).map(([es, en]) => [en, es]));
const SIGNO_ES = Object.fromEntries(Object.entries(SIGNO).map(([es, en]) => [en, es]));
const IDIOMA = { en: { en: "English", es: "Spanish" }, es: { en: "inglés", es: "español" } };
export const ED = {
  en: {
    lang: "en", pref: "", ayuda: AYUDA_HTML, lema: "Closer to yourself.", linea: LINEA_N, noConsejo: NO_CONSEJO,
    voz: "Voice: synthetic", proximo: "Coming", salio: "Out", seccion: { Humanity: "Humanity" },
    pilar: (P) => P.titulo, lomo: (P) => P.lomo, titulo: (p) => p.titulo,
    fe, feCorta, rango: (a, b) => (a === b ? fe(a) : `${feCorta(a)} to ${feCorta(b)}`) + " " + b.slice(0, 4),
    formato: FORMATO, enOtro: { es: "In Spanish" }, voces: (xs) => `Voices: ${xs.map((l) => IDIOMA.en[l]).join(", then ")}`,
    noticia: (t) => "News: " + t, noticiaSola: "News", noticiaNota: "Date and topic only. The title comes after the source check.",
    luna: (pct, fase) => `<span class="t-luna-k">Moon </span><span class="t-pct num">${pct}%</span> lit, ${esc(fase)}`, pct: (n) => String(n).replace(/\.0$/, ""),
    fase: (f) => f, signo: (s) => s, zodiaco: "Western tropical zodiac", lunaEn: (s) => `Moon in ${esc(s)}`, lunaDatos: "Moon data: U.S. Naval Observatory.", colLuna: "Moon",
    corto: "Short link", piezas: (n) => `${n} piece${n === 1 ? "" : "s"}`, lasPiezas: "The pieces", fuentes: "Sources",
    fuentesNota: "Sources carried over from our research notes. Each page gets its own source check before its full text is written.",
    saltar: "Skip to the pieces", saltarHub: "Skip to the topics", migas: "Breadcrumb", temas: "Topics", inicio: "Home", agenda: "Upcoming", privacidad: "Privacy", terminos: "Terms",
    nav: "Sections", otra: { lang: "es", txt: "Español" },
    sello: "The voices in NAOS pieces are synthetic. Cella's replies to comments are written with AI; a person reads the hard ones. Times are New York (ET) and Medellín.",
    descTema: (p, n, P, r) => `${p.titulo}: ${n} NAOS pieces in ${p.seccion}${P ? ", " + P.titulo : ""}, ${r}. Dates, times in ET and Medellín, and sources.`,
    temaDe: "Topic page:", aterrizaEn: "Its page:",
    enEspanol: (n, href) => `<p class="t-otra-ed" lang="es"><a href="${href}" hreflang="es">${n === 1 ? "1 pieza" : n + " piezas"} en español sobre este tema, en la página en español</a></p>`,
  },
  es: {
    lang: "es", pref: "es/", ayuda: AYUDA_HTML_ES, lema: "Más cerca de ti.", noConsejo: "Descriptivo, sin asesoría financiera.",
    linea: { Humanity: "Come bien, duerme bien, muévete, ten una relación con lo divino y construye comunidad." },
    voz: "Voz: sintética", proximo: "Próximamente", salio: "Publicada", seccion: { Humanity: "Humanidad" },
    pilar: (P) => ({ eat: "Comer", sleep: "Dormir", move: "Moverse", "the-divine": "Lo divino", community: "Comunidad" }[P.id]),
    lomo: (P) => ({ eat: "Come bien,", sleep: "duerme bien,", move: "muévete,", "the-divine": "ten una relación con lo divino,", community: "y construye comunidad." }[P.id] || null),
    titulo: (p) => p.titulo_es,
    fe: (f) => { const t = new Date(f + "T12:00:00Z"); return `${DIA_ES[t.getUTCDay()]} ${t.getUTCDate()} ${MES_ES[t.getUTCMonth()]}`; },
    feCorta: (f) => { const t = new Date(f + "T12:00:00Z"); return `${t.getUTCDate()} ${MES_ES[t.getUTCMonth()]}`; },
    rango(a, b) { return (a === b ? this.fe(a) : `${this.feCorta(a)} al ${this.feCorta(b)}`) + " de " + b.slice(0, 4); },
    formato: { "short+reel": "Short y Reel", medio: "Video mediano en YouTube", carrusel: "Carrusel de Instagram", historia: "Historia de Instagram", es: "Short y Reel en español" },
    enOtro: { en: "En inglés" }, voces: (xs) => `Voces: ${xs.map((l) => IDIOMA.es[l]).join(", después ")}`,
    noticia: (t) => "Noticias: " + t, noticiaSola: "Noticias", noticiaNota: "Solo fecha y tema. El título llega después de verificar la fuente.",
    luna: (pct, fase) => `<span class="t-luna-k">Luna </span><span class="t-pct num">${pct} %</span> iluminada, ${esc(fase)}`, pct: (n) => String(n).replace(/\.0$/, "").replace(".", ","),
    fase: (f) => FASE_ES[f] || f, signo: (s) => SIGNO_ES[s] || s, zodiaco: "Zodíaco tropical occidental", lunaEn: (s) => `Luna en ${esc(s)}`,
    lunaDatos: "Datos de la luna: Observatorio Naval de los Estados Unidos (USNO).", colLuna: "Luna",
    corto: "Enlace corto", piezas: (n) => `${n} pieza${n === 1 ? "" : "s"}`, lasPiezas: "Las piezas", fuentes: "Fuentes",
    fuentesNota: "Fuentes heredadas de nuestras notas de investigación. Cada página pasa por su propia verificación de fuentes antes de escribir su texto completo.",
    saltar: "Ir a las piezas", saltarHub: "Ir a los temas", migas: "Ruta", temas: "Temas", inicio: "Inicio", agenda: "Agenda", privacidad: "Privacidad", terminos: "Términos",
    nav: "Secciones", otra: { lang: "en", txt: "English" },
    sello: "Las voces de las piezas de NAOS son sintéticas. Las respuestas de Cella a los comentarios se escriben con IA; una persona lee las difíciles. Las horas son de Nueva York (ET) y Medellín.",
    descTema: (p, n, P, r) => `${p.titulo_es}: ${n} piezas de NAOS en ${ED.es.seccion[p.seccion]}${P ? ", " + ED.es.pilar(P) : ""}, ${r}. Fechas, horas en ET y Medellín, y fuentes.`,
    temaDe: "Página del tema:", aterrizaEn: "Su página:",
    enEspanol: () => "",
  },
};
// qué piezas lleva cada edición: la EN, las de una voz en inglés y las de dos voces; la ES, todas. La página "es" (las piezas en
// español, decisión 2 de N del lote 2) las lleva todas en las dos ediciones: la EN es su lectura en inglés, con cada título en español
const enEdicion = (x, L, p = null) => L.lang === "es" || x.lang !== "es" || (x.idiomas || []).length > 1 || (!!p && p.slug === "es");
// una pieza ES con tema: en la página "es" enlaza a la página de su tema; en su tema, a la tarjeta donde aterriza (la página "es")
function conTema(L, D, p, x) {
  if (!x.tema) return x;
  const q = p.slug === "es" ? D.paginas.find((y) => y.slug === x.tema) : D.paginas.find((y) => y.slug === x.pagina);
  if (!q) return x;
  return { ...x, _tema: p.slug === "es" ? { k: L.temaDe, href: `../${q.slug}/`, t: L.titulo(q) } : { k: L.aterrizaEn, href: `../${q.slug}/#${x.id}`, t: L.titulo(q) } };
}
// compuerta de fecha del cuerpo (data/temas/<slug>.json, "desde"; keep-your-hour: el cuerpo se monta desde el 1-nov 02:00 ET):
// "ahora" es el campo "generado" de data/semana.json (lo escribe construir-semana.mjs justo antes de llamar aquí), así el HTML sigue
// siendo función del dato (mismo dato, mismos bytes) y la Action lo cambia sola en la primera ronda después de la hora.
// NAOS_AHORA=<ISO> solo para vistas previas. (Antes leía data/situacion.json, que salió con D-263.)
const ahoraDato = () => Date.parse(process.env.NAOS_AHORA || leerJSON(path.join(V, "data/semana.json"), {})?.generado || "") || 0;
const langAttr = (t, L) => (t && t !== L.lang ? ` lang="${t}"` : "");

function cabeza({ L, titulo, descripcion, ruta, raiz, jsonld, alterna, css = [], og = null }) {
  const url = BASE + L.pref + ruta;
  const alt = alterna ? `\n<link rel="alternate" hreflang="en" href="${esc(BASE + ruta)}">\n<link rel="alternate" hreflang="es" href="${esc(BASE + "es/" + ruta)}">\n<link rel="alternate" hreflang="x-default" href="${esc(BASE + ruta)}">` : "";
  return `<!doctype html>
<html lang="${L.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${esc(url)}">${alt}
<meta property="og:type" content="${og ? og.tipo : "website"}">
<meta property="og:site_name" content="NAOS">
<meta property="og:locale" content="${L.lang === "es" ? "es_419" : "en_US"}">
<meta property="og:title" content="${esc(og ? og.titulo : titulo)}">
<meta property="og:description" content="${esc(og ? og.descripcion : descripcion)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${BASE}assets/marca/avatar-800.png">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${raiz}assets/marca/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${raiz}assets/marca/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${raiz}assets/marca/avatar-800.png">
<link rel="preload" href="${raiz}assets/fuentes/IBMPlexSans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${raiz}assets/comun/tokens.css">
<link rel="stylesheet" href="${raiz}assets/comun/base.css">
<link rel="stylesheet" href="${raiz}assets/css/temas.css">${css.map((c) => `\n<link rel="stylesheet" href="${raiz}${c}">`).join("")}
<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>
<script defer src="${raiz}assets/js/temas.js"></script>
</head>`;
}
// ruta: la de la página dentro de su edición, sin prefijo (temas/x/); el enlace al otro idioma es la misma ruta en la otra edición
function barra(L, raiz, actual, ruta) {
  const a = (href, t, k, extra = "") => `<a href="${href}"${actual === k ? ' aria-current="page"' : ""}${extra}>${t}</a>`;
  const P = raiz + L.pref, otra = L.otra.lang === "es" ? raiz + "es/" + ruta : raiz + ruta;
  return `<header class="t-barra">
  <p class="t-marca"><a class="t-naos" href="${P}">NAOS</a><span class="t-lema">${esc(L.lema)}</span></p>
  <nav class="t-nav" aria-label="${L.nav}">${a(P + "temas/humanity/", L.seccion.Humanity, "humanity")}${a(P + "temas/", L.temas, "temas")}${a(raiz + "agenda.html", L.agenda, "agenda", L.lang === "en" ? "" : ' hreflang="en"')}<a class="t-idioma" href="${otra}" hreflang="${L.otra.lang}" lang="${L.otra.lang}">${L.otra.txt}</a></nav>
</header>`;
}
// texto (páginas con cuerpo): { cita, lineas } del pie del texto sellado. La línea de ayuda sigue siendo la verificada del
// constructor, en el mismo lugar (decisión 1 de N: el pie corto en las páginas que no son sensibles); van después las líneas de
// N y el sello tal como los trae el texto.
function pie(L, raiz, seccion, extra = "", texto = null) {
  const P = raiz + L.pref;
  const N = ["Closer to yourself.", "Eat well, sleep well, get moving, have a relationship with the divine, and build community.", "Más cerca de ti.", "Come bien, duerme bien, muévete, ten una relación con lo divino y construye comunidad."];
  const lineas = texto && texto.lineas.length
    ? texto.lineas.map((t) => typeof t === "object" ? `  ${t.html}` : N.includes(t) ? `  <p class="t-linea-n"${L.lang === "es" && /^Closer/.test(t) ? ' lang="en"' : ""}>${esc(t)}</p>` : `  <p class="sello">${esc(t)}</p>`).join("\n")
    : `  <p class="t-linea-n">${esc(L.linea[seccion] || L.linea.Humanity)}</p>\n  <p class="sello">${extra}${L.sello}</p>`;
  return `<footer class="t-pie">
  <p class="ayuda-l" id="ayuda">${L.ayuda}${texto ? texto.cita : ""}</p>
${lineas}
  <p class="sello"><a href="${P}">${L.inicio}</a> · <a href="${P}temas/">${L.temas}</a> · <a href="${raiz}agenda.html"${L.lang === "en" ? "" : ' hreflang="en"'}>${L.agenda}</a> · <a href="${raiz}privacidad.html"${L.lang === "es" ? "" : ' hreflang="es"'}>${L.privacidad}</a> · <a href="${raiz}terminos.html"${L.lang === "es" ? "" : ' hreflang="es"'}>${L.terminos}</a></p>
</footer>`;
}
const pilarDe = (D, id) => D.pilares.find((p) => p.id === id);
const secId = () => "humanity"; // una sola sección (D-263)

// Tarjeta = fila de un registro por día (pase de arte, 16-oct): columna de cuándo (día, hora ET, hora Medellín, estado),
// cuerpo (título, línea, formato) y, solo en Humanity, la columna de la luna (lo medido a la vista, con su barra de luz).
// El día se escribe una vez: las filas siguientes del mismo día lo llevan solo para lector de pantalla (t-sigue); la luna,
// igual: si no cambió desde la fila anterior del mismo día, no se repite (t-luna-igual).
// extra (páginas con cuerpo): { titulo, cuerpo } del texto sellado; el título y las líneas del texto reemplazan los de la grilla,
// el formato, la voz, el aviso de Markets, la hora y el estado siguen saliendo del dato.
function carta(L, x, pag, enlace, raiz, sigue = false, lunaIgual = false, extra = null) {
  const out = enlace && /^https:\/\/(www\.youtube\.com|youtu\.be)\//.test(enlace.yt || "");
  const estado = out
    ? `<p class="t-estado t-out"><span class="t-tag">${L.salio}</span> <a class="t-ver" href="${esc(enlace.yt)}" rel="noopener">YouTube</a>${/^https:\/\/www\.instagram\.com\//.test(enlace.ig || "") ? ` <a class="t-ver" href="${esc(enlace.ig)}" rel="noopener">Instagram</a>` : ""}</p>`
    : `<p class="t-estado"><span class="t-tag">${L.proximo}</span></p>`;
  const formato = L.formato[x.canal] || x.formato;
  const titulo = extra && extra.titulo ? `<h3 class="t-tit">${extra.titulo}</h3>` : x.noticia
    ? `<h3 class="t-tit">${pag.pilar === "news" ? esc(L.noticia(L.titulo(pag))) : L.noticiaSola}</h3><p class="t-nota">${L.noticiaNota}</p>`
    : x.titulo ? `<h3 class="t-tit"${langAttr(x.lang, L)}>${esc(x.titulo)}</h3>` : `<h3 class="t-tit">${esc(formato)}</h3>`;
  const bil = (x.idiomas || []).length > 1;
  const fmt = [x.titulo || x.noticia || (extra && extra.titulo) ? formato : "", !bil && x.lang !== L.lang && x.canal !== "es" ? L.enOtro[x.lang] : "", bil ? L.voces(x.idiomas) : "",
    x.voz ? L.voz : "", x.mercado ? L.noConsejo.slice(0, -1) : ""].filter(Boolean).join(". ") + (x.mercado ? "." : "");
  const luna = x.luna ? `
  <div class="t-luna">
    <p class="t-luz">${L.luna(L.pct(x.luna.iluminacion), L.fase(x.luna.fase))}</p>
    <span class="t-barra-luz" aria-hidden="true" style="--l:${Number(x.luna.iluminacion)}%"></span>${x.luna.signo ? `
    <details class="t-signo"><summary>${L.zodiaco}</summary><p>${L.lunaEn(L.signo(x.luna.signo))}</p></details>` : ""}
  </div>` : "";
  const corto = x.corto ? `<p class="t-corto">${L.corto} <a href="${raiz}s/${esc(x.codigo)}/">naos/s/${esc(x.codigo)}</a></p>` : "";
  const tema = x._tema ? `<p class="t-tema-l">${esc(x._tema.k)} <a href="${esc(x._tema.href)}">${esc(x._tema.t)}</a></p>` : "";
  return `<li><article class="t-carta${x.lang === "es" ? " t-es" : ""}${sigue ? " t-sigue" : ""}${lunaIgual ? " t-luna-igual" : ""}" id="${esc(x.id)}" data-codigo="${esc(x.codigo)}" data-fecha="${x.fecha}" aria-labelledby="${esc(x.id)}-t">
  <div class="t-when">
    <p class="t-cuando"><time class="t-dia" datetime="${esc(x.utc.replace("Z", ":00Z"))}">${L.fe(x.fecha)}</time> <span class="t-hora num">${esc(x.hora_et)} ET</span> <span class="t-hora num">${esc(x.hora_medellin)} Medellín</span></p>
    ${estado}
  </div>
  <div class="t-cuerpo">
    ${titulo.replace("<h3 class=\"t-tit\"", `<h3 class="t-tit" id="${esc(x.id)}-t"`)}
    ${extra ? extra.cuerpo : x.linea ? `<p class="t-linea"${langAttr(x.lang, L)}>${esc(x.linea)}</p>` : ""}
    ${fmt ? `<p class="t-fmt">${esc(fmt)}</p>` : ""}
    ${corto}
    ${tema}
  </div>${luna}
</article></li>`.replace(/\n\s*\n/g, "\n");
}

function paginaTema(L, D, p, enlaces) {
  const md = path.join(V, `data/temas/${p.slug}.${L.lang}.md`), X = leerJSON(path.join(V, `data/temas/${p.slug}.json`));
  if (fs.existsSync(md) && X && (!X.desde || ahoraDato() >= Date.parse(X.desde))) return paginaCuerpo(L, D, p, enlaces, { ...X, _V: V }, fs.readFileSync(md, "utf8"));
  const raiz = L.lang === "es" ? "../../../" : "../../", P = pilarDe(D, p.pilar);
  const todas = p.piezas.map((id) => D.piezas.find((x) => x.id === id)), xs = todas.filter((x) => enEdicion(x, L, p)).map((x) => conTema(L, D, p, x));
  const desde = xs[0].fecha, hasta = xs.at(-1).fecha, nES = todas.filter((x) => !enEdicion(x, L, p)).length;
  const mercado = p.pilar === "markets" || xs.some((x) => x.mercado);
  const ruta = `temas/${p.slug}/`, r = L.rango(desde, hasta);
  const desc = L.descTema(p, xs.length, P, r);
  const nombre = (x) => (x.noticia ? `${L.noticiaSola}, ${L.fe(x.fecha)}` : x.titulo || `${L.formato[x.canal] || x.formato}, ${L.fe(x.fecha)}`);
  const jsonld = { "@context": "https://schema.org", "@type": "CollectionPage", name: L.titulo(p), description: desc, url: BASE + L.pref + ruta, inLanguage: L.lang,
    isPartOf: { "@type": "WebSite", name: "NAOS", url: BASE + L.pref }, about: P ? L.pilar(P) : L.seccion[p.seccion],
    mainEntity: { "@type": "ItemList", numberOfItems: xs.length, itemListElement: xs.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: BASE + L.pref + ruta + "#" + x.id,
      name: nombre(x), ...(x.titulo && x.lang !== L.lang ? { inLanguage: x.lang } : {}) })) } };
  const fuentes = p.fuentes.length ? `
  <section class="t-bloque t-fuentes" id="fuentes" aria-labelledby="fuentes-t">
    <h2 id="fuentes-t">${L.fuentes}</h2>
    <ul>${p.fuentes.map((f) => { const la = langAttr(f.lang || "en", L); return `<li>${f.url ? `<a href="${esc(f.url)}" rel="noopener"${la}>${esc(f.titulo)}</a>` : `<span${la}>${esc(f.titulo)}</span>`}</li>`; }).join("")}</ul>
    <p class="t-fuentes-n">${L.fuentesNota}</p>
  </section>` : "";
  const humanity = p.seccion === "Humanity", conLuna = xs.some((x) => x.luna);
  return `${cabeza({ L, titulo: `${L.titulo(p)} · NAOS`, descripcion: desc, ruta, raiz, jsonld, alterna: true })}
<body class="t-${secId(p.seccion)}">
<a class="sr" href="#piezas">${L.saltar}</a>
${barra(L, raiz, "", ruta)}
<main id="main">
  <header class="t-umbral" id="umbral">
    <nav class="t-migas" aria-label="${L.migas}"><a href="${raiz}${L.pref}temas/">${L.temas}</a> / <a href="${raiz}${L.pref}temas/${secId(p.seccion)}/">${esc(L.seccion[p.seccion])}</a>${P ? ` / <a href="${raiz}${L.pref}temas/pilar/${P.id}/">${esc(L.pilar(P))}</a>` : ""}</nav>
    <h1>${esc(L.titulo(p))}</h1>
    <p class="t-rango"><span class="t-n num">${xs.length}</span> ${L.piezas(xs.length).replace(/^\d+ /, "")}, ${r}</p>${mercado ? `\n    <p class="t-aviso">${L.noConsejo}</p>` : ""}${nES ? "\n    " + L.enEspanol(nES, `${raiz}es/${ruta}`) : ""}
  </header>
  <section class="t-bloque" id="piezas" aria-labelledby="piezas-t">
    <h2 id="piezas-t">${L.lasPiezas}</h2>${humanity ? `\n    <p class="t-col-luna" aria-hidden="true">${L.colLuna}</p>` : ""}
    <ol class="t-cartas">
${xs.map((x, i) => carta(L, x, p, enlaces[x.fecha + "|" + x.codigo], raiz, i > 0 && xs[i - 1].fecha === x.fecha, i > 0 && xs[i - 1].fecha === x.fecha && !!x.luna && JSON.stringify(xs[i - 1].luna) === JSON.stringify(x.luna))).join("\n")}
    </ol>${conLuna ? `\n    <p class="t-fuentes-n t-luna-datos">${L.lunaDatos}</p>` : ""}
  </section>${fuentes}
</main>
${pie(L, raiz, p.seccion, mercado ? L.noConsejo + " " : "")}
</body>
</html>
`;
}

// Página con cuerpo (lote 0+1 en adelante, solo páginas selladas por I4): bloques 0 a 8 del texto (acta 2(b)), el registro de
// tarjetas del constructor dentro del bloque 5, los visuales de assets/temas/<slug>/ y la meta de su meta.json. Misma barra, mismo
// pie, mismas reglas fijas de tarjeta que el esqueleto.
function paginaCuerpo(L, D, p, enlaces, X, md) {
  const raiz = L.lang === "es" ? "../../../" : "../../", P = pilarDe(D, p.pilar);
  const xs = p.piezas.map((id) => D.piezas.find((x) => x.id === id)).filter((x) => enEdicion(x, L, p)).map((x) => conTema(L, D, p, x));
  const nES = p.piezas.map((id) => D.piezas.find((x) => x.id === id)).filter((x) => !enEdicion(x, L, p)).length;
  const mercado = p.pilar === "markets" || xs.some((x) => x.mercado);
  const ruta = `temas/${p.slug}/`, M = X.meta[L.lang];
  const c = cuerpoTema({ L, D, p, X, md, raiz, xs, carta, enlaces });
  const nombre = (x) => (c.nombres[x.id] || "").replace(/\s*·\s*en inglés:.*$/, "") || (x.noticia ? `${L.noticiaSola}, ${L.fe(x.fecha)}` : x.titulo || `${L.formato[x.canal] || x.formato}, ${L.fe(x.fecha)}`);
  const jsonld = { "@context": "https://schema.org", "@type": "CollectionPage", name: M.h1, headline: M.og_title, description: M.description, url: BASE + L.pref + ruta, inLanguage: L.lang,
    isPartOf: { "@type": "WebSite", name: "NAOS", url: BASE + L.pref }, about: P ? L.pilar(P) : L.seccion[p.seccion],
    mainEntity: { "@type": "ItemList", numberOfItems: xs.length, itemListElement: xs.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: BASE + L.pref + ruta + "#" + x.id, name: nombre(x) })) } };
  const pref = (r) => r.replace(/^(?!https?:)/, `${raiz}assets/temas/${p.slug}/`);
  const css = (X.css || []).map((f) => `assets/temas/${p.slug}/${f}`);
  const mods = (X.modulos || []);
  const modulo = mods.length ? `\n<script type="module">${mods.map((m, i) => `import{montar as m${i}}from${JSON.stringify(pref(m.src))};`).join("")}const q=matchMedia("(prefers-reduced-motion: reduce)").matches;${mods.map((m, i) => `document.querySelectorAll(${JSON.stringify(m.sel)}).forEach((e)=>{try{m${i}(e${m.quieto ? ",{quieto:q}" : ",{quieto:false}"})}catch(x){}});`).join("")}</script>` : "";
  const scripts = (X.scripts || []).map((s) => `\n<script defer src="${pref(s)}"></script>`).join("");
  const umbralAviso = mercado && !c.umbral.includes(L.noConsejo) ? `\n    <p class="t-aviso">${L.noConsejo}</p>` : "";
  const piezasId = (md.match(/^## 5 · .*\{#([\w-]+)\}/m) || [])[1] || "main";
  return `${cabeza({ L, titulo: M.title, descripcion: M.description, ruta, raiz, jsonld, alterna: true, css, og: { titulo: M.og_title, descripcion: M.og_description, tipo: "article" } })}
<body class="t-${secId(p.seccion)} t-con-cuerpo">
<a class="sr" href="#${piezasId}">${L.saltar}</a>
${barra(L, raiz, "", ruta)}
<main id="main"${X.cambio ? ` data-cambio="${esc(X.cambio)}"` : ""}>
  <header class="t-umbral" id="${(md.match(/^## 0 · .*\{#([\w-]+)\}/m) || [])[1] || "arriba"}">
    <nav class="t-migas" aria-label="${L.migas}"><a href="${raiz}${L.pref}temas/">${L.temas}</a> / <a href="${raiz}${L.pref}temas/${secId(p.seccion)}/">${esc(L.seccion[p.seccion])}</a>${P ? ` / <a href="${raiz}${L.pref}temas/pilar/${P.id}/">${esc(L.pilar(P))}</a>` : ""}</nav>
${c.umbral}${umbralAviso}${nES ? "\n    " + L.enEspanol(nES, `${raiz}es/${ruta}`) : ""}
  </header>
${c.bloques}
</main>
${pie(L, raiz, p.seccion, "", c.pie)}${scripts}${modulo}
</body>
</html>
`;
}

// Línea de tiempo de los estantes (acta 2(c): "estantes con línea de tiempo"): cada tema lleva una barra de su primera a su
// última pieza sobre la temporada entera, de mes completo a mes completo. Las posiciones salen del dato (salida determinista);
// la marca de hoy la pone temas.js.
const dia = (f) => Date.parse(f + "T00:00:00Z") / 864e5;
function temporada(D) {
  const a = D.paginas.reduce((m, p) => (p.desde < m ? p.desde : m), "9999"), b = D.paginas.reduce((m, p) => (p.hasta > m ? p.hasta : m), "0000");
  const t0 = a.slice(0, 8) + "01", fin = new Date(Date.parse(b.slice(0, 8) + "01T00:00:00Z")); fin.setUTCMonth(fin.getUTCMonth() + 1);
  const t1 = fin.toISOString().slice(0, 10), meses = [];
  for (const m = new Date(t0 + "T00:00:00Z"); m.toISOString().slice(0, 10) < t1; m.setUTCMonth(m.getUTCMonth() + 1)) meses.push(m.toISOString().slice(0, 10));
  const pos = (f) => +(((dia(f) - dia(t0)) / (dia(t1) - dia(t0))) * 100).toFixed(2);
  return { t0, t1, meses, pos };
}
function eje(L, T) {
  const M = L.lang === "es" ? MES_ES : MES;
  return `<div class="t-eje" aria-hidden="true"><span></span><span class="t-eje-m">${T.meses.map((m) => `<span style="--a:${T.pos(m)}%">${M[+m.slice(5, 7) - 1]}</span>`).join("")}</span></div>`;
}
// rango de un tema en la edición: en la EN no cuentan las piezas que solo viven en la ES
function rangoTema(L, D, p) {
  const xs = p.piezas.map((id) => D.piezas.find((x) => x.id === id)).filter((x) => enEdicion(x, L, p));
  return { n: xs.length, desde: xs[0].fecha, hasta: xs.at(-1).fecha };
}
function fichaTema(L, D, p, raiz) {
  const R = rangoTema(L, D, p), T = temporada(D), fin = new Date(Date.parse(R.hasta + "T00:00:00Z") + 864e5).toISOString().slice(0, 10);
  return `<li><a class="t-tema" href="${raiz}${L.pref}temas/${p.slug}/" data-desde="${R.desde}" data-hasta="${R.hasta}"><span class="t-tema-t">${esc(L.titulo(p))}</span>` +
    `<span class="t-tema-m num">${L.piezas(R.n)}, ${L.rango(R.desde, R.hasta)}</span>` +
    `<span class="t-tl" aria-hidden="true"><span style="--a:${T.pos(R.desde)}%;--b:${T.pos(fin)}%"></span></span></a></li>`;
}
// Humanity: estantes con el lomo (la frase de N, en orden) en el tercio izquierdo y los temas a la derecha.
function estantes(L, D, seccion, raiz, nivel = "h2") {
  const T = temporada(D);
  const xs = D.pilares.filter((P) => P.seccion === seccion).map((P) => {
    const ps = D.paginas.filter((p) => p.pilar === P.id); if (!ps.length) return "";
    const lomo = L.lomo(P);
    return `<section class="t-estante${lomo ? "" : " t-estante-sin"}" aria-labelledby="e-${P.id}"><${nivel} class="t-lomo" id="e-${P.id}"><a href="${raiz}${L.pref}temas/pilar/${P.id}/">${esc(lomo || L.pilar(P))}</a>${lomo ? ` <span class="t-lomo-p">${esc(L.pilar(P))}</span>` : ""}</${nivel}><div class="t-anaquel">${eje(L, T)}<ul class="t-temas">${ps.map((p) => fichaTema(L, D, p, raiz)).join("")}</ul></div></section>`;
  }).join("\n");
  return `<div class="t-biblioteca">\n${xs}\n</div>`;
}
function hub({ L, D, ruta, raiz, titulo, h1, desc, cuerpo, seccion, actual, antes = "", css, scripts = [] }) {
  const jsonld = { "@context": "https://schema.org", "@type": "CollectionPage", name: titulo, description: desc, url: BASE + L.pref + ruta, inLanguage: L.lang, isPartOf: { "@type": "WebSite", name: "NAOS", url: BASE + L.pref } };
  const T = temporada(D);
  return `${cabeza({ L, titulo, descripcion: desc, ruta, raiz, jsonld, alterna: true, css })}
<body class="t-hub t-hub-${secId(seccion)}">
<a class="sr" href="#main">${L.saltarHub}</a>
${barra(L, raiz, actual, ruta)}
<main id="main" data-t0="${T.t0}" data-t1="${T.t1}">
${h1 ? `  <header class="t-umbral"><h1>${esc(h1)}</h1></header>\n` : ""}${antes}${cuerpo}
</main>
${pie(L, raiz, seccion)}${scripts.map((s) => `\n<script defer src="${raiz}${s}"></script>`).join("")}
</body>
</html>
`;
}

function hubs(L, D, urls) {
  const p0 = L.pref, R1 = L.lang === "es" ? "../../" : "../", R2 = L.lang === "es" ? "../../../" : "../../", R3 = L.lang === "es" ? "../../../../" : "../../../";
  const S = L.seccion, n = D.paginas.filter((p) => p.pilar).length;
  // D-268: la luna ya no es un estante; su página (moon) la enlaza la casilla de la luna de la portada y esta línea
  const luna = (raiz) => { const m = D.paginas.find((p) => p.slug === "moon"); return m ? `\n  <p class="t-rango"><a href="${raiz}${p0}temas/moon/">${esc(L.titulo(m))}</a></p>` : ""; };
  const lib = (raiz) => `  <section class="t-bloque" aria-labelledby="h-hum"><h2 id="h-hum"><a href="${raiz}${p0}temas/humanity/">${S.Humanity}</a></h2>\n${estantes(L, D, "Humanity", raiz, "h3")}\n  </section>${luna(raiz)}`;
  const es = L.lang === "es";
  write(`${p0}temas/index.html`, hub({ L, D, ruta: "temas/", raiz: R1, titulo: `${L.temas} · NAOS`, h1: L.temas, seccion: "Humanity", actual: "temas",
    desc: es ? `Todas las páginas de tema de NAOS: ${n} temas de Humanidad, con la fecha y la hora de cada pieza y sus fuentes.`
      : `Every NAOS topic page: ${n} topics in Humanity, with the date and time of each piece and its sources.`, cuerpo: lib(R1) }));
  write(`${p0}temas/humanity/index.html`, hub({ L, D, ruta: "temas/humanity/", raiz: R2, titulo: `${S.Humanity} · NAOS`, h1: S.Humanity, seccion: "Humanity", actual: "humanity",
    desc: es ? "La biblioteca de NAOS por pilar: comer, dormir, moverse, lo divino y comunidad. Cada tema con sus piezas, fechas y fuentes."
      : "The NAOS library by pillar: eat, sleep, move, the divine, and community. Each topic with its pieces, dates and sources.",
    cuerpo: estantes(L, D, "Humanity", R2) + luna(R2) }));
  urls.push(`${p0}temas/`, `${p0}temas/humanity/`);
  for (const P of D.pilares) {
    const ps = D.paginas.filter((p) => p.pilar === P.id); if (!ps.length) continue;
    const nom = L.pilar(P), sec = S[P.seccion];
    write(`${p0}temas/pilar/${P.id}/index.html`, hub({ L, D, ruta: `temas/pilar/${P.id}/`, raiz: R3, titulo: `${nom} · NAOS`, h1: nom, seccion: P.seccion, actual: "",
      desc: es ? `Temas de NAOS en ${sec}, ${nom}: ${ps.length} página${ps.length > 1 ? "s" : ""} de tema con fechas, horas y fuentes.`
        : `NAOS topics in ${P.seccion}, ${P.titulo}: ${ps.length} topic page${ps.length > 1 ? "s" : ""} with dates, times and sources.`,
      cuerpo: `  <nav class="t-migas" aria-label="${L.migas}"><a href="${R3}${p0}temas/">${L.temas}</a> / <a href="${R3}${p0}temas/${secId(P.seccion)}/">${esc(sec)}</a></nav>\n  <div class="t-anaquel t-anaquel-solo">${eje(L, temporada(D))}<ul class="t-temas">${ps.map((p) => fichaTema(L, D, p, R3)).join("")}</ul></div>` }));
    urls.push(`${p0}temas/pilar/${P.id}/`);
  }
}

// portada de la edición ES (D-253): la franja de hoy y lo próximo (franja.js en español) y la biblioteca.
// La portada EN es index.html, a mano; esta se genera para que no se desfase del dato.
function portadaES(D) {
  const L = ED.es, raiz = "../";
  const desc = "NAOS en español. Más cerca de ti. Humanidad: comer bien, dormir bien, moverse, tener una relación con lo divino y construir comunidad.";
  // D-270: el mismo tablero lunar de la portada EN (tablero.js lo llena; el centro es estático), con la leyenda de D-265 en español primero
  const antes = `  <section class="tablero" id="tablero" aria-label="El calendario lunar de hoy">
    <div class="tb-in">
      <ul class="tb-g" id="tab">
        <li class="tb-centro">
          <div class="tb-c tb-box">
            <div class="tb-sup">
              <h1 class="tb-h" id="u-hum-t" tabindex="-1">Humanidad</h1>
              <div class="tb-cella" id="cella-hum" aria-hidden="true"></div>
            </div>
            <p class="tb-q">Más cerca de ti.</p>
          </div>
        </li>
      </ul>
      <i class="tb-linea" id="tab-linea" aria-hidden="true"></i>
    </div>
  </section>
  <section class="leyenda" aria-label="Qué es NAOS hoy">
    <p class="ley-es" lang="es">${LEYENDA_ES}</p>
    <p class="ley-en" lang="en">${LEYENDA_EN}</p>
  </section>
  <p class="t-rango"><a href="temas/es/">Las piezas en español</a> salen desde el sábado 24 de octubre. Las demás están en inglés; cada una lleva su hora en Nueva York y en Medellín.</p>
  <div id="secuencia" data-lang="es" data-raiz="${raiz}" hidden></div>
`;
  const cuerpo = `  <section class="t-bloque" aria-labelledby="h-hum"><h2 id="h-hum"><a href="temas/humanity/">${L.seccion.Humanity}</a></h2>\n${estantes(L, D, "Humanity", raiz, "h3")}\n  </section>`;
  return hub({ L, D, ruta: "", raiz, titulo: "NAOS en español · Más cerca de ti.", h1: null, desc, cuerpo, seccion: "Humanity", actual: "", antes,
    css: ["assets/css/tablero.css", "assets/css/franja.css"], scripts: ["assets/comun/naos.js", "assets/js/figura.js", "assets/js/luna.js", "assets/js/cella.js", "assets/js/tablero.js", "assets/js/franja.js"] });
}

// páginas archivadas (19-oct, no hay segundo lado): cada URL vieja de tema y de hub, en las dos ediciones, queda como una
// redirección pequeña (meta refresh + canonical + noindex) a la portada o a la página de Humanity más cercana; fuera del sitemap.
export function redireccion(lang, destinoAbs, rel, texto) {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NAOS</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${esc(destinoAbs)}">
<meta http-equiv="refresh" content="0; url=${esc(rel)}">
<script>location.replace(${JSON.stringify(rel)});</script>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:48px 16px;background:#fff;color:#0E1116}a{color:inherit}</style>
</head>
<body><p><a href="${esc(rel)}">${texto}</a></p></body>
</html>
`;
}
function archivadas(A) {
  if (!A) return 0;
  let n = 0;
  const rutas = [...Object.keys(A.paginas || {}).map((s) => [`temas/${s}/`, A.paginas[s]]), ...Object.entries(A.hubs || {})];
  for (const [ruta, d] of rutas) for (const lang of ["en", "es"]) {
    const pref = lang === "es" ? "es/" : "", destino = pref + d, sube = "../".repeat((pref + ruta).split("/").filter(Boolean).length);
    write(`${pref}${ruta}index.html`, redireccion(lang, BASE + destino, sube + destino, lang === "es" ? "Ir a NAOS" : "Go to NAOS"));
    n++;
  }
  return n;
}

// registro de enlaces cortos (solo de suma): código -> su tarjeta actual; si el Short desapareció de la grilla, su tema o Topics
function registroCortos(D) {
  const f = path.join(V, "data/cortos.json"), R = leerJSON(f, null) || { nota: "", codigos: {} };
  R.nota = "Registro de enlaces cortos, solo de suma. Lo escribe scripts/construir-temas.mjs: un código emitido no se borra nunca, apunta a la tarjeta actual de su Short o, si el Short salió de la grilla, a su página de tema (o a Topics). Así un enlace ya compartido no da 404.";
  const actual = new Map(D.piezas.filter((x) => x.corto).map((x) => [x.codigo, x]));
  for (const [c, x] of actual) R.codigos[c] = { pagina: x.pagina, id: x.id, lang: x.lang === "es" && !(x.idiomas || []).length ? "es" : "en" };
  R.codigos = Object.fromEntries(Object.entries(R.codigos).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(f, JSON.stringify(R, null, 1) + "\n");
  return { R, actual };
}
// destino de una página archivada (data/archivo.json), desde la raíz del sitio y en su edición: "" es la portada
export function destinoArchivo(A, slug, lang) {
  const d = A?.paginas?.[slug]; if (d == null) return null;
  return lang === "es" ? "es/" + d : d;
}
export function destinoCorto(D, c, e, vivo, A = null) {
  const pref = e.lang === "es" ? "es/" : "";
  const arch = !vivo && destinoArchivo(A, e.pagina, e.lang);
  if (arch != null && arch !== false) return "../../" + arch;
  if (vivo) return `../../${pref}temas/${e.pagina}/?src=${encodeURIComponent(c)}#${e.id}`;
  if (D.paginas.some((p) => p.slug === e.pagina)) return `../../${pref}temas/${e.pagina}/?src=${encodeURIComponent(c)}`;
  return `../../${pref}temas/`;
}

export function construirTemas({ silencio = false } = {}) {
  const D = leerJSON(path.join(V, "data/temas.json"));
  if (!D) throw new Error("falta data/temas.json (correr con --grilla y --paginas donde está la grilla)");
  const enlaces = leerJSON(path.join(V, "data/enlaces.json"), { piezas: {} }).piezas || {};
  // lo generado antes y que ya no existe se borra (solo dentro de temas/, es/ y s/, que son de este script)
  for (const dir of ["temas", "es", "s"]) fs.rmSync(path.join(V, dir), { recursive: true, force: true });
  const urls = ["", "agenda.html"];
  for (const L of [ED.en, ED.es]) {
    if (L.lang === "es") { write("es/index.html", portadaES(D)); urls.push("es/"); }
    hubs(L, D, urls);
    for (const p of D.paginas) { write(`${L.pref}temas/${p.slug}/index.html`, paginaTema(L, D, p, enlaces)); urls.push(`${L.pref}temas/${p.slug}/`); }
  }
  // enlaces cortos: uno estable por Short, a su tarjeta en su página de tema (la ES para las piezas en español)
  const A = leerJSON(path.join(V, "data/archivo.json"), null);
  const redirigidas = archivadas(A);
  const { R, actual } = registroCortos(D);
  let cortos = 0, retirados = 0;
  for (const [c, e] of Object.entries(R.codigos)) {
    const vivo = actual.has(c), destino = destinoCorto(D, c, e, vivo, A), es = e.lang === "es", arch = !vivo ? destinoArchivo(A, e.pagina, e.lang) : null;
    write(`s/${c}/index.html`, `<!doctype html>
<html lang="${es ? "es" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NAOS · ${esc(c)}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${arch != null ? BASE + esc(arch) : `${BASE}${es ? "es/" : ""}temas/${esc(D.paginas.some((p) => p.slug === e.pagina) ? e.pagina + "/" : "")}`}">
<meta http-equiv="refresh" content="0; url=${esc(destino)}">
<script>location.replace(${JSON.stringify(destino)});</script>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:48px 16px;background:#fff;color:#0E1116}a{color:inherit}</style>
</head>
<body><p><a href="${esc(destino)}">${es ? "Ir a esta pieza en su página de NAOS" : "Go to this piece on its NAOS page"}</a></p></body>
</html>
`);
    if (vivo) cortos++; else retirados++;
  }
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${BASE}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  const r = { paginas: D.paginas.length, tarjetas: D.piezas.length, cortos, retirados, archivadas: redirigidas, hubs: 2 + D.pilares.filter((P) => D.paginas.some((p) => p.pilar === P.id)).length };
  if (!silencio) console.log(`construir-temas: ${r.paginas} páginas de tema por edición (EN y ES), ${r.tarjetas} tarjetas, ${r.cortos} enlaces cortos vivos${r.retirados ? ` y ${r.retirados} retirados que apuntan a su tema o a su destino de archivo` : ""}, ${r.archivadas} redirecciones de archivo, ${r.hubs} hubs por edición, sitemap con ${urls.length} URL`);
  return r;
}

// ---------- uso directo ----------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const g = arg("grilla"), p = arg("paginas"), a = arg("afirmaciones"), cu = arg("cuerpo"), se = arg("sellados");
  // cuerpo de las páginas selladas (solo donde está el lote privado): texto, meta y visuales a data/temas/ y assets/temas/
  if (cu) { if (!se) { console.error("uso: node scripts/construir-temas.mjs --cuerpo=<carpeta del lote> --sellados=slug,slug"); process.exit(2); } importar({ V, lote: cu, slugs: se.split(",").filter(Boolean) }); }
  if (g || p) {
    if (!g || !p) { console.error("uso: node scripts/construir-temas.mjs --grilla=<grilla.json> --paginas=<paginas.json> [--afirmaciones=<csv>]"); process.exit(2); }
    const so = arg("solo"), solo = so ? new Set(so.split(",").filter(Boolean)) : null;
    let D = proyectar({ grilla: leerJSON(g), paginas: leerJSON(p), afirmaciones: a ? csv(fs.readFileSync(a, "utf8")) : [], agenda: leerJSON(path.join(V, "data/agenda.json")), tolerante: !!solo });
    if (solo) D = mezclar(leerJSON(path.join(V, "data/temas.json")), D, solo);
    fs.writeFileSync(path.join(V, "data/temas.json"), JSON.stringify(D, null, 1) + "\n");
    console.log(`temas.json: ${D.paginas.length} páginas, ${D.piezas.length} piezas (${D.piezas.filter((x) => x.lang === "es").length} en español, en la edición ES), ${D.piezas.filter((x) => x.corto).length} Shorts con enlace corto`);
  }
  construirTemas();
}
