# NAOS

**Yourself, sharper.** The NAOS home page: today's headlines in plain English first, then four sections (Market, News, AI,
Behavior): markets, rates and the dollar, fear and greed, the economic calendar, a news wire by area, stories of the day,
prediction markets, AI and technology, with room to breathe.

Live at <https://hardlypythonnmr.github.io/naos/>. Static site, no build step, served by GitHub Pages from `main`, root.

**Descriptive, not financial advice.** Nothing here is a recommendation to buy or sell anything. Prediction market
prices are market prices, not NAOS forecasts. Stale readings and sample placeholders are kept off the page (D-216); the
builder lists them, with the reason and the plan to get real data, in `escondido` inside `data/situacion.json`.

## Layout

| path | what |
|---|---|
| `index.html` | the page |
| `assets/css/`, `assets/js/` | page styles and script (`v1plus.css`, `v1plus.js`); `sala.js` and `sala.css`: the monitor room per story, the story map and "How NAOS reads the day" (D-221) |
| `assets/comun/` | shared design tokens, base styles and the page engine (`naos.js`) |
| `assets/fuentes/` | self-hosted fonts (woff2) with their licenses |
| `assets/vendor/` | GSAP + ScrollTrigger, Lenis, with their licenses |
| `data/situacion.json` | every value the page shows, rebuilt every 30 minutes |
| `data/mapa.json` | the map (Natural Earth via world-atlas) |
| `data/mapa-predicciones.json` | NAOS's curated map: storyline, keywords, Polymarket market, related tickers, global rules (copy of the radar's map) |
| `data/mundo.json` | world land for the story map and the monitor room (Natural Earth 110m, public domain, from G3 `geo.json`) |
| `data/rasgos.json` | the Behavior tape: traits from the NAOS videos, one line each; edit here, not in HTML |
| `data/semana.json` | the public week grid (D-224), built by `node scripts/construir-semana.mjs [--desde=YYYY-MM-DD]`; schema below |
| `data/agenda.json` | scheduled events outside the Forex Factory calendar, one year ahead (central banks, US data, elections, summits, tech, market holidays, religious and cultural dates), each with the source URL that states its date: `{ eventos: [{ titulo, fecha: "YYYY-MM-DD", fecha_fin?, hora: "YYYY-MM-DDTHH:MMZ" \| null, hora_local, hora_estado: "official" \| "expected" \| "time not set", fecha_estado?: "expected", categoria, pais, angulo, fuente, url, nota?, tendencias?: true }], sin_fecha: [...] }`; `categoria` is `central_bank`, `us_data`, `election`, `summit`, `tech_ai`, `energy`, `state_visit`, `market_holiday` or `religioso/cultural`; `fecha_estado: "expected"` marks a date that is itself provisional (moon sighting, official calendar not out yet); `tendencias: true` flags events the trends radar watches; `angulo` is the market or attention angle in one neutral line; an event with `hora: null` goes to the London brief of its day (the week's last brief if it falls on a weekend) |
| `data/assets.json` | the Assets library: categories and pieces with their status (all "planned" for now); add pieces here, not in HTML. While planned, a piece carries `texto` (60 to 120 words), `mapa` (`{ raiz, ramas: [{ t, hojas }] }`, 3 to 6 branches), `fuentes` (`[{ titulo, autor, anio, url }]`, each opened before citing; date in `fuentes_consultadas`) and `pdf` |
| `pieza.html` | the page of one Assets piece (`?id=`): video, transcript, prompts, sources (D-212); noindex while planned |
| `assets/pdf/<id>.pdf` | one-page PDF per planned piece (what you will learn, the map, the sources), printed from `pieza.html` by `NODE_PATH=$(npm root -g) node scripts/pdf-piezas.mjs [id ...]` (Playwright + Chromium; checks one page and under 300 KB) |
| `scripts/construir-datos.mjs` | the data builder (Node 18+, no dependencies, no keys required) |
| `scripts/animo.py` | the "Credit and dollar" reading of NAOS Fear & Greed (Python 3, standard library only) |
| `.github/workflows/datos.yml` | the data refresh Action |
| `privacidad.html`, `terminos.html` | privacy policy and terms (linked from the Google OAuth consent screen; keep) |
| `googlec0e927a7df959aad.html` | Google Search Console verification (keep) |
| `archivo/index-anterior.html` | the previous home page, kept for reference |

## Data sources and attribution

| on the page | source | attribution shown |
|---|---|---|
| US 2, 10 and 30-year yields, 2s10s | U.S. Treasury, daily par yield curve (public domain) | "Source: U.S. Treasury" |
| EUR/USD, USD/JPY, NAOS dollar index | ECB euro reference rates | "Source: ECB"; "NAOS dollar index, computed from ECB reference rates. Not ICE's DXY." |
| Bitcoin, Ethereum, Solana | CoinGecko API | "Data provided by CoinGecko", linked |
| Gold, silver | gold-api.com | "Metals: gold-api.com" |
| WTI, Brent, Henry Hub (dated trend, never on the tape) | U.S. Energy Information Administration (public domain) | "Source: U.S. Energy Information Administration" |
| Crypto Fear & Greed | alternative.me | "Crypto Fear & Greed Index by alternative.me", linked |
| Credit and dollar (NAOS Fear & Greed) | Office of Financial Research Financial Stress Index and ECB rates (public domain), NAOS calculation in `scripts/animo.py` | "Credit and dollar: Office of Financial Research, ECB (NAOS calculation)" |
| Next red US event, the week's red US rows with forecast and previous | Forex Factory weekly calendar (`ff_calendar_thisweek.json`) | "Forex Factory weekly calendar", linked; each release linked to its official publisher (BLS, Federal Reserve, BEA, Census) |
| AI on the front page | Hacker News API | titles verbatim, linked |
| Wire and stories of the day | Federal Reserve, SEC, BBC News, CoinDesk, MarketWatch, Hacker News | source and time on every headline, linked |
| Indices, commodities, AI stocks, Nasdaq 100 heatmap, economic calendar | TradingView widgets, embedded as provided | TradingView's own attribution, intact |
| Prediction markets | Polymarket Gamma API (public), read only for markets in `data/mapa-predicciones.json`: one number per story, with time, only if the market passes the map's rules and only on one story; Kalshi is a link only | "Polymarket" with the reading time; the map's stamp once on the page. Kalshi's data terms allow personal, non-commercial use only. No odds history, tables or charts |
| Map | Natural Earth via world-atlas (public domain) | "Map: Natural Earth via world-atlas" |

Rules the builder follows:

- `data/situacion.json` holds only the values the page displays. Raw API responses are never committed: they land in
  `data/crudo/`, which is in `.gitignore`. CoinGecko responses are not even written there (CoinGecko's terms forbid
  storing them); only BTC and ETH carry a 30-day series, because the page charts it.
- If a public source fails in a run, the value already published stays, with its own date. The freshness rule then takes
  it off the tape and the readings board once it is older than its window (crypto and metals the same day, Treasury and
  ECB four calendar days, EIA never on the tape).
- No OKX data or headlines anywhere.
- Stale and sample (D-216): stale means older than the source's rhythm plus a margin (daily sources: 3 business days;
  EIA, weekly: 10 days). Stale readings, headlines and the calendar get `viejo: true`; anything sample stays off the page.
  Each hidden item goes to `escondido: [{ id, que, motivo, desde, plan }]`. It is a list for NAOS, not shown on the page.
- Plain-English text is built from templates over real data only: `portada` (3 to 5 headlines: what happened, what moved
  and how much, one connected reading, the prediction market link), `explica` (what the BTC move and the 2s10s curve
  mean, and over what timeframe) and `graficos` (one headline per TradingView chart: what moved and why, or nothing).

### Monitor rooms (D-221)

The builder writes `salas` in `data/situacion.json`: one room per front-page story, plus, for each story-map entry the front
page does not use, the newest wire headline that names it. Each room carries the place (from the headline's words, else from
the story-map entry), its own linked assets, the one prediction-market price (same rules, one market per story), related
headlines with source and time, Hacker News points and comments when the link is there, and how the tie was made. A room
opens from a headline, a story card, the wire or the story map, and links as `#sala/<id>` (or `?sala=<id>`). Without data a
tile is left out. `lectura` holds the run's counts for "How NAOS reads the day".

### The week grid (`data/semana.json`, D-224)

```json
{ "semana": { "desde": "2026-10-19", "hasta": "2026-10-25" },
  "secciones": [{ "id": "market", "titulo": "Market" }, "..."], "formatos": [{ "id": "brief", "titulo": "Brief" }, "..."],
  "slots": [{ "id": "london", "titulo": "London open brief", "local": "08:20 UK" }, "..."],
  "eventos_nota": "why the briefs list no events yet, or null",
  "items": [{ "seccion": "market|news|ai|behavior", "dia": "YYYY-MM-DD or null (date TBD)", "slot": "london|ny|close|null",
              "hora_utc": "brief time", "hora_local": "08:20 UK", "format": "brief|short|medium|special", "title": "...",
              "asset_id": "id in data/assets.json (optional)", "status": "planned|scheduled|out",
              "eventos": [{ "titulo": "USD CPI m/m", "hora": "YYYY-MM-DDTHH:MMZ", "fuente": "...", "url": "optional" }] }] }
```

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
6. Set `revisado` to the review date, rebuild the week with `node scripts/construir-semana.mjs`, and commit
   `data/agenda.json` and `data/semana.json`.

Never invent a date: if no source states it, it goes to `sin_fecha`. Islamic dates depend on moon sighting and stay
`expected` until announced.

## How the data refresh works

`.github/workflows/datos.yml` runs at minute 7 and 37 of every hour (and on demand from the Actions tab):

1. checks out `main`, sets up Node 22 and Python 3.12;
2. runs `node scripts/construir-datos.mjs`, which fetches the public sources, runs `python3 scripts/animo.py --historia 30`
   and writes `data/situacion.json` (about 2 minutes, mostly Hacker News and a courtesy pause for CoinGecko);
3. checks the output (enough readings, no OKX, `data/crudo/` not tracked);
4. commits `data/situacion.json` only if it changed, pushes to `main` with the workflow's `GITHUB_TOKEN`
   (`contents: write`), and asks GitHub Pages for a build.

Optional repository secrets (Settings > Secrets and variables > Actions); the refresh works without them:

- `COINGECKO_DEMO_KEY`: CoinGecko Demo plan key, recommended for steadier rate limits.
- `EIA_KEY`: EIA API key; without it the builder uses EIA's shared `DEMO_KEY`.

Run it locally: `node scripts/construir-datos.mjs` (or `--sin-red` to rebuild from the last copies in `data/crudo/`).
Behind a proxy, add `NODE_USE_ENV_PROXY=1`.

### Sections from the private radar

The wire, the stories of the day, the cited index closes and the London and New York briefs come from the NAOS radar,
which lives in a private repository. A public Action cannot read it, so for now the builder keeps the last values already
in `data/situacion.json` for those sections and never wipes them. The page shows their date ("as of ..."), taken from
`radar.fecha` in `situacion.json`. Cited closes stay marked `SAMPLE` until the New York routine writes real ones.

Later step (not set up yet): N creates a fine-grained personal access token limited to this repository with
"Contents: read and write", and stores it as a secret in the private radar repository. After each London and New York
run, the radar pushes `data/radar.json` here with its sections:

```json
{ "fecha": "2026-10-14T12:30Z", "wire": [], "historias": [], "cierres_csv": "fecha,indice,cierre,cambio_pct,fuente,url\n...", "temas": {}, "titulares": [] }
```

The builder already reads that file when it exists and uses it instead of the kept values. Only displayed values go in
it, with the same rules as above. (`node scripts/construir-datos.mjs --wire-rss` can also rebuild the wire and stories
from the public RSS feeds the radar uses; the Action does not do this.)

## Licenses

- **Site code and text**: NAOS, all rights reserved unless stated otherwise.
- **GSAP 3.15.0** and ScrollTrigger: GreenSock Standard "no charge" License, <https://gsap.com/standard-license>
  (`assets/vendor/gsap/LICENSE.md`).
- **Lenis 1.3.26**: MIT, darkroom.engineering (`assets/vendor/lenis/LICENSE`).
- **Fonts**: IBM Plex Sans and IBM Plex Sans Condensed (IBM) and Newsreader (Production Type), SIL Open Font License 1.1
  (`assets/fuentes/OFL-*.txt`).
- **Third-party widgets** (TradingView) load from their own servers under their own terms.
- **Data** stays under its sources' terms (see the table above).

Contact: n1.selfdetermination@gmail.com
