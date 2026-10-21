# NAOS

**Closer to yourself.** NAOS is Humanity only (D-263): eat well, sleep well, get moving, have a relationship with the
divine, and build community, with small behaviors and old tales. Since D-282 the home page is V3 of page v5: you arrive inside Breathe with Cella, under "Something like…" and one word for how it feels
(a knot, a rush, a weight); below it the other six doors as a carousel, a "Pick a door" box of the seven libraries (each with its shelf,
open and on the way, D-281) and the days as when something new arrives. English first, Spanish with `?lang=es` (the button in the bar).
The D-270 lunar-calendar home is kept in `archivo/portada-2026-10-20.html`.

Since 19 Oct 2026 there is no second side. The Present (news, markets, AI, the radar, the monitor room, the guide, the two
doors) left the site: its topic URLs, hubs and short links redirect (noindex) to the home or the closest Humanity page, as
listed in `data/archivo.json`; the archived sources live in `archivo/the-present/` and in git history.

Live at <https://hardlypythonnmr.github.io/naos/>. Static site, no build step, served by GitHub Pages from `main`, root.

## Layout

| path | what |
|---|---|
| `index.html` | the page: V3 of page v5 (D-282), one file with its CSS and JS inline, built by `python3 build.py --sitio v3` in n-system (`earn/naos/empresa/estrategia/2026-10-20-pagina-v5/taller/`; do not edit by hand). Fonts and `figura.js` are linked from `assets/`; `assets/js/cella-brazos.js` (Cella's two arms) is a copy from n-system and is never edited here. A library item with an `id` or `yt` shows a "Watch" link once `data/enlaces.json` has it |
| `es/index.html` | the Spanish home (D-284): the same V3 page as `index.html`, from the same source and the same command (`python3 build.py --sitio v3` writes both), with Spanish as the default language, paths relative to `es/`, `<html lang="es">`, canonical `/es/`, hreflang en/es/x-default and the Spanish footer with the verified helplines; the language button goes to the other home. `scripts/construir-temas.mjs` keeps it as it is (it no longer generates it). The previous Spanish cover (moon board) is `archivo/es-portada-2026-10-20.html` (noindex) |
| `assets/css/`, `assets/js/` | page styles and scripts: `tablero.js` + `tablero.css` (the board of 18 tiles and everything under it, in both editions), `luna.js` (today's moon from `data/luna.json`: age, lit fraction, the SVG disc), `semana.js` ("This week"), `cella.js` + `figura.js` (Cella: breathes 8 s; her eyes have three simple shapes, D-270; `figura.js` is a copy from n-system and is never edited here), `franja.js` (the Spanish home's "Hoy y lo próximo"); `v1plus.css`, `sala.css` and `puertas.css` keep only what the Humanity home and Upcoming use (the names are historical) |
| `data/luna.json` | the main moon phases (new, first quarter, full, last quarter) from 1 Oct 2026 to 31 Dec 2027, in UTC, as the U.S. Naval Observatory phases API gives them (`aa.usno.navy.mil/api/moon/phases/year`), each with its source; the file carries the URL and the day it was fetched. `luna.js` interpolates the Sun-Moon elongation between phases and computes age and lit fraction on Colombia time (America/Bogota); a day without an hour (`?hoy=YYYY-MM-DD`, a day of the week strip) is read at 09:00 Colombia. Never type a phase time by hand: ask the API again |
| `assets/comun/` | shared design tokens, base styles and the page engine (`naos.js`) |
| `assets/fuentes/` | self-hosted fonts (woff2) with their licenses |
| `assets/vendor/` | GSAP + ScrollTrigger, Lenis, with their licenses |
| `data/rasgos.json` | the Behavior tape: traits from the NAOS videos, one line each; edit here, not in HTML |
| `data/semana.json` | briefs, what is already published and the undated library (D-224); the dated month plan of D-227 left with lot E (D-252), the dated pieces live in `data/temas.json`. Built by `node scripts/construir-semana.mjs [--desde=YYYY-MM-DD]`; schema below |
| `data/agenda.json` | scheduled events outside the Forex Factory calendar, one year ahead (central banks, US data, elections, summits, tech, market holidays, religious and cultural dates), each with the source URL that states its date: `{ eventos: [{ titulo, fecha: "YYYY-MM-DD", fecha_fin?, hora: "YYYY-MM-DDTHH:MMZ" \| null, hora_local, hora_estado: "official" \| "expected" \| "time not set", fecha_estado?: "expected", categoria, pais, angulo, fuente, url, nota?, tendencias?: true }], sin_fecha: [...] }`; `categoria` is `central_bank`, `us_data`, `election`, `summit`, `tech_ai`, `energy`, `state_visit`, `market_holiday` or `religioso/cultural`; `fecha_estado: "expected"` marks a date that is itself provisional (moon sighting, official calendar not out yet); `tendencias: true` flags events the trends radar watches; `angulo` is the market or attention angle in one neutral line; an event with `hora: null` goes to the London brief of its day (the week's last brief if it falls on a weekend) |
| `data/assets.json` | the Assets library: categories and pieces with their status (all "planned" for now); add pieces here, not in HTML. While planned, a piece carries `texto` (60 to 120 words), `mapa` (`{ raiz, ramas: [{ t, hojas }] }`, 3 to 6 branches), `fuentes` (`[{ titulo, autor, anio, url }]`, each opened before citing; date in `fuentes_consultadas`) and `pdf` |
| `data/temas.json` | the public projection of the content grid for the topic pages (D-252): `paginas` (32 topics: slug, title, section, pillar, date range, piece ids, inherited sources) and `piezas` (265 pieces: date, hour ET and Medellín, UTC, format, title or null, one line or null, voice, news and markets flags, moon for Humanity, `codigo`). Written by `scripts/construir-temas.mjs --grilla=<grilla.json> --paginas=<paginas.json> [--afirmaciones=<csv>] [--solo=slug,slug]` where the private grid lives (`--solo`: only those topics and their pieces come from the grid, the rest stays as it is); never edited by hand. Page `es` (lot 2, N's decision 2): the Spanish pieces land on `/es/temas/es/` (`pilar: null`, no shelf; linked from the Spanish home); each Spanish piece has `pagina: "es"` and `tema`, the topic page of the English piece it versions, which still lists it with a link to its card on `es` |
| `data/temas/` | the body of each sealed topic page (lot 0+1 on): `<slug>.en.md` and `<slug>.es.md` (blocks 0 to 8 of the sealed text, HTML comments stripped, so no claim ids or internal notes), `<slug>.json` (title, description, OG, short-link landing and "You came from" titles, share text, where each visual goes, its modules). Written by `node scripts/construir-temas.mjs --cuerpo=<private lot folder> --sellados=slug,slug`; edit the text there and re-import, never the HTML. An unsealed page has no file here and keeps its lot-E skeleton. A `desde` in `<slug>.json` is a date gate: before it the page stays a skeleton; "now" is `generado` of `data/semana.json` (so the output is still a function of the data; `NAOS_AHORA=<ISO>` only for previews) |
| `assets/temas/<slug>/` | the visuals of a sealed page: concept map, chart and living thing as SVG (wide and narrow, still versions), their data JSON (cleaned of internal ids), their modules (`montar(el, {quieto})`, reduced motion respected) and CSS; `fig/` holds the figure fragments the builder inlines |
| `scripts/cuerpo-temas.mjs` | the body importer and renderer used by `construir-temas.mjs` (grammar of the sealed texts, folds, before/after versions of an event page, cards with their text, sources with links, lang marks for parts) |
| `temas/` | generated topic pages: `temas/<slug>/index.html` (one per topic: threshold, the pieces as cards, sources, the common footer with helplines), hubs `temas/`, `temas/humanity/` (library by pillar) and `temas/pilar/<id>/` (`temas/the-present/` and the Markets, News and AI hubs are archive redirects). Built by `node scripts/construir-temas.mjs` from `data/temas.json` and `data/enlaces.json`; deterministic; no Lenis, no GSAP, no guide |
| `s/<codigo>/` | one stable short link per Short (`/naos/s/1019h/`), a static redirect to its card on its topic page with `?src=<codigo>` ("You came from this Short") |
| `sitemap.xml` | home, Upcoming, hubs and topic pages (built with `temas/`) |
| `agenda.html` | "Upcoming" (D-226): the year of `data/agenda.json` month by month, next event with countdown, filters by category, period bars for multi-day dates, "Add to calendar" per event and "Subscribe" per category. Shared ids and categories in `assets/js/agenda-comun.js` |
| `assets/ics/` | calendar files (RFC 5545) built by `node scripts/construir-ics.mjs` (also run by `construir-semana.mjs`): `<id>.ics` per event, `<category>.ics` per category for subscribing, `naos-agenda.ics` with everything. Timed events in UTC with a 30 min reminder; date-only and multi-day periods all-day (`VALUE=DATE`, exclusive `DTEND`) with a reminder at 09:00 the day before; expected dates or times say so in `SUMMARY`. `DTSTAMP` is the agenda's `revisado`, so files only change when the agenda does |
| `pieza.html` | the page of one Assets piece (`?id=`): video, transcript, prompts, sources (D-212); noindex while planned |
| `assets/pdf/<id>.pdf` | one-page PDF per planned piece (what you will learn, the map, the sources), printed from `pieza.html` by `NODE_PATH=$(npm root -g) node scripts/pdf-piezas.mjs [id ...]` (Playwright + Chromium; checks one page and under 300 KB) |
| `data/enlaces.json` | links of what is published (D-234), the single source for the Short and Reel URLs: `{ generado, piezas: { "YYYY-MM-DD\|slot", "YYYY-MM-DD\|asset_id" or, for a grid piece, "YYYY-MM-DD\|codigo" (its `codigo` in `data/temas.json`): { yt, ig, publicado_utc, teaser_de } } }`; a grid piece turns "Out" on its topic page and in the Spanish home's strip once its key has a `yt`; `yt` is a YouTube Shorts, watch or youtu.be URL, `ig` an Instagram Reel URL and only with `yt`; no builder rewrites it; checked by `scripts/validar.mjs` |
| `scripts/validar.mjs` | `node scripts/validar.mjs [--grilla=<grilla.json>]`: JSON parses, `enlaces.json` prefixes and keys, local link targets and anchors exist, no OKX, no em dashes in our own data; topic pages: only public fields in `temas.json`, one card per piece on one page (with `--grilla`, one card per grid slot), every short link lands on its card, fixed card and footer rules, nothing private, sitemap complete (Node 18+, no dependencies) |
| `scripts/construir-temas.mjs` | the topic-page generator (lot E, D-252); also run at the end of `construir-semana.mjs`, so the data Action rebuilds it |
| `scripts/qa.mjs` | `NODE_PATH=$(npm root -g) node scripts/qa.mjs <url> [--out DIR] [--nombre x]`: screenshots at 320, 390, 1440 and 200 % zoom, console errors, horizontal scroll, Tab reach and reduced motion (Playwright + Chromium). `... qa.mjs <base-url> --temas`: every internal link of hubs and topic pages answers 200 with its anchor, every short link lands on its card, the guide opens only on a clean home arrival, Cella's pause stops every Cella, the English home has no strip and the Spanish home's strip reads the grid |
| `.github/workflows/datos.yml` | the refresh Action: rebuilds the week grid, topic pages, short links, calendar files and sitemap |
| `privacidad.html`, `terminos.html` | privacy policy and terms (linked from the Google OAuth consent screen; keep) |
| `googlec0e927a7df959aad.html` | Google Search Console verification (keep) |
| `archivo/index-anterior.html` | the previous home page, kept for reference |
| `archivo/portada-2026-10-20.html` | the lunar-calendar home of D-270, archived on 21 Oct 2026 (noindex; `<base href="../">` keeps its asset paths) |

### The week grid (`data/semana.json`, D-224)

```json
{ "semana": { "desde": "2026-10-19", "hasta": "2026-10-25" }, "semanas": [{ "desde": "2026-10-19", "hasta": "2026-10-25" }, "..."],
  "secciones": [{ "id": "market", "titulo": "Market" }, "..."], "formatos": [{ "id": "brief", "titulo": "Brief" }, "..."],
  "slots": [{ "id": "london", "titulo": "London open brief", "local": "08:20 UK" }, "..."],
  "eventos_nota": "why the briefs list no events yet, or null",
  "items": [{ "seccion": "market|news|ai|behavior", "dia": "YYYY-MM-DD or null (date TBD)", "slot": "london|ny|close|null",
              "hora_utc": "brief time", "hora_local": "08:20 UK", "format": "brief|short|medium|special|page", "title": "...",
              "video": "brief only: true for the close (Short EN) and one opening on a red-event day", "nota": "optional",
              "asset_id": "id in data/assets.json (optional)", "status": "planned|scheduled|out",
              "eventos": [{ "titulo": "USD CPI m/m", "hora": "YYYY-MM-DDTHH:MMZ", "fuente": "...", "url": "optional" }] }] }
```

Pieces already out before the month plan (the launch promo of 15 Oct) go in `PUBLICADOS` in the builder with
`status: "published"`, so their `enlaces.json` key exists and "Today's Short" shows them. The builder covers the four weeks of the board's month plan (19 Oct to 15 Nov 2026, `acta-r1` §3, D-227) plus the dates
the plan sets after it; the home page opens on the current week and switches with "Previous week" / "Next week". Pieces the
plan does not date (Strategies, Indicator 1: waiting for the lawyer) keep `dia: null` with the reason in `nota`.
Briefs: three fixed slots each weekday (London open 08:20 UK, New York open 09:41 ET, US close 16:22 ET). Each lists the
high-impact events of the Forex Factory weekly calendar (title and time only, once the feed covers that week; it is published
over the weekend) and `data/agenda.json`, from its slot to the next brief. Pieces without a known date carry `dia: null`.
The home page shows the grid in "This week"; each piece page shows its "Upcoming" card from the same file.

### Weekly agenda review (D-226)

`data/agenda.json` maps a rolling year of dated events. A routine reviews it **every Sunday**:

1. **Re-check the next 8 weeks.** For every event dated from Monday to eight weeks out, open its `url` and confirm the date
   and time still stand. If a date or time changed, update `fecha`, `hora`, `hora_local` and `hora_estado`, and say what
   changed in `nota`. If the event was cancelled, remove it and note it in the commit message.
2. **Firm up expected dates.** Events with `fecha_estado: "expected"` or `hora_estado: "expected"` inside those 8 weeks get
   checked against the official source (moon-sighting announcements for Islamic dates, the State Council holiday notice for
   China, exchange holiday lists). Drop `fecha_estado` once the date is official.
3. **Add newly announced events.** Go through `sin_fecha` and the usual sources (central bank calendars, BLS and BEA
   schedules, summit hosts, exchange holiday lists, company event pages such as WWDC, Google I/O, Build, GTC). Add anything
   now dated inside the window, with a source URL you opened; take it out of `sin_fecha`.
4. **Extend the window.** Add events so the agenda still reaches one year ahead of the review date.
5. **Flag for trends.** Set `tendencias: true` on events worth watching in the trends radar (rate decisions with forecasts,
   CPI and payrolls, big elections and summits, major tech keynotes, holidays that move search, travel or spending).
6. Set `revisado` to the review date, rebuild the week with `node scripts/construir-semana.mjs` (it also rebuilds
   `assets/ics/`), and commit `data/agenda.json`, `data/semana.json` and `assets/ics/`.

Never invent a date: if no source states it, it goes to `sin_fecha`. Islamic dates depend on moon sighting and stay
`expected` until announced.

## How the refresh works

`.github/workflows/datos.yml` runs at minute 7 and 37 of every hour (and on demand from the Actions tab). Each run loops for
up to ~5.5 h; every 30 minutes it:

1. pulls `main` and runs `node scripts/construir-semana.mjs`, which writes `data/semana.json` and then runs
   `construir-ics.mjs` and `construir-temas.mjs` (topic pages, short links, sitemap);
2. keeps `data/semana.json` only when the grid changed or the committed one is over 12 hours old;
3. commits only if something changed ("Refresh page data"), pushes to `main` with the workflow's `GITHUB_TOKEN`
   (`contents: write`), and asks GitHub Pages for a build.

The market data builder (`construir-datos.mjs`, `animo.py`, `data/situacion.json`, `data/radar.json`, the maps) left with
D-263; it is in git history.

## Licenses

- **Site code and text**: NAOS, all rights reserved unless stated otherwise.
- **GSAP 3.15.0** and ScrollTrigger: GreenSock Standard "no charge" License, <https://gsap.com/standard-license>
  (`assets/vendor/gsap/LICENSE.md`).
- **Lenis 1.3.26**: MIT, darkroom.engineering (`assets/vendor/lenis/LICENSE`).
- **Fonts**: IBM Plex Sans and IBM Plex Sans Condensed (IBM) and Newsreader (Production Type), SIL Open Font License 1.1
  (`assets/fuentes/OFL-*.txt`).
- **Data** stays under its sources' terms (see the table above).

Contact: n1.selfdetermination@gmail.com
