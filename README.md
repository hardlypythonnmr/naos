# NAOS

**Yourself, sharper.** The NAOS home page: a situation room for markets, rates and the dollar, fear and greed, the
economic calendar, a news wire by area, stories of the day, prediction markets, AI and technology, with room to breathe.

Live at <https://hardlypythonnmr.github.io/naos/>. Static site, no build step, served by GitHub Pages from `main`, root.

**Descriptive, not financial advice.** Nothing here is a recommendation to buy or sell anything. Prediction market
prices are market prices, not NAOS forecasts. Items marked `SAMPLE` on the page are design placeholders, not data.

## Layout

| path | what |
|---|---|
| `index.html` | the page |
| `assets/css/`, `assets/js/` | page styles and script (`v1plus.css`, `v1plus.js`) |
| `assets/comun/` | shared design tokens, base styles and the page engine (`naos.js`) |
| `assets/fuentes/` | self-hosted fonts (woff2) with their licenses |
| `assets/vendor/` | GSAP + ScrollTrigger, Lenis, with their licenses |
| `data/situacion.json` | every value the page shows, rebuilt every 30 minutes |
| `data/mapa.json` | the map (Natural Earth via world-atlas) |
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
| Next red US event | public release calendars | the official publisher (BLS, Federal Reserve, BEA, Census), linked |
| AI on the front page | Hacker News API | titles verbatim, linked |
| Wire and stories of the day | Federal Reserve, SEC, BBC News, CoinDesk, MarketWatch, Hacker News | source and time on every headline, linked |
| Indices, commodities, AI stocks, Nasdaq 100 heatmap, economic calendar | TradingView widgets, embedded as provided | TradingView's own attribution, intact |
| Prediction markets | links to Polymarket and Kalshi; no odds are shown | Kalshi's data terms allow personal, non-commercial use only, so it is a link only |
| Map | Natural Earth via world-atlas (public domain) | "Map: Natural Earth via world-atlas" |

Rules the builder follows:

- `data/situacion.json` holds only the values the page displays. Raw API responses are never committed: they land in
  `data/crudo/`, which is in `.gitignore`. CoinGecko responses are not even written there (CoinGecko's terms forbid
  storing them); only BTC and ETH carry a 30-day series, because the page charts it.
- If a public source fails in a run, the value already published stays, with its own date. The freshness rule then takes
  it off the tape and the readings board once it is older than its window (crypto and metals the same day, Treasury and
  ECB four calendar days, EIA never on the tape).
- No OKX data or headlines anywhere.

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
