"""NAOS · alerta rápida (D-194, D-195).

Corre cada ~5 min en GitHub Actions (.github/workflows/alerta.yml). Sin claves:
precios de la API pública de OKX (velas de 1 h de perpetuos USDT: cripto, índices US500 y US100,
ETF, materias primas y unas 190 acciones), titulares de RSS públicos para el contexto.

Por cada movimiento fuera de lo normal en 1 h, 4 h o 24 h deja en radar/alertas/:
  AAAA-MM-DD-HHMM-<SIM>.md   post en plantilla (título, cinta, hook, caption con contexto y fuentes)
  AAAA-MM-DD-HHMM-<SIM>.svg  gráfico de 7 días (casi negro; esmeralda sube, borgoña baja, más flecha y signo)
y radar/alertas/aviso.md con el resumen que llega a N (issue de GitHub y, si hay bot, Telegram).

Los precios de índices, acciones y materias primas son de perpetuos de OKX: siguen al subyacente pero no son
el índice oficial; el post lo dice ("OKX perp, proxy"). Solo describe: nunca es asesoría financiera.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

AQUI = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(AQUI, "alertas")
ESTADO = os.path.join(DIR, "estado.json")
UA = {"User-Agent": "curl/8.5.0"}
OKX = "https://www.okx.com/api/v5"

# símbolo: (nombre, clase, palabras de titulares). Clase fija los umbrales.
LISTA = {
    "BTC": ("Bitcoin", "cripto", ["bitcoin", "btc", "crypto"]),
    "ETH": ("Ethereum", "cripto", ["ethereum", "ether", "eth"]),
    "SOL": ("Solana", "cripto", ["solana"]),
    "US500": ("S&P 500", "indice", ["s&p", "stocks", "wall street", "equities"]),
    "US100": ("Nasdaq 100", "indice", ["nasdaq", "tech stocks"]),
    "IWM": ("Russell 2000 (IWM)", "indice", ["russell", "small caps", "small-cap"]),
    "JP225": ("Nikkei 225", "indice", ["nikkei", "japan stocks", "japanese stocks"]),
    "XAU": ("Gold", "metal", ["gold"]),
    "XAG": ("Silver", "metal", ["silver"]),
    "XCU": ("Copper", "metal", ["copper"]),
    "CL": ("Oil WTI", "energia", ["oil", "crude", "opec", "wti"]),
    "BZ": ("Oil Brent", "energia", ["brent", "hormuz", "tanker"]),
    "NG": ("Natural gas", "energia", ["natural gas", "lng"]),
}
# nombre en titulares -> símbolo de OKX, para sumar a la cinta lo que está en las noticias
NOTICIA = {"nvidia": "NVDA", "apple": "AAPL", "tesla": "TSLA", "microsoft": "MSFT", "meta": "META", "amazon": "AMZN",
           "alphabet": "GOOGL", "google": "GOOGL", "oracle": "ORCL", "palantir": "PLTR", "coinbase": "COIN",
           "microstrategy": "MSTR", "broadcom": "AVGO", "amd": "AMD", "intel": "INTC", "netflix": "NFLX",
           "exxon": "XOM", "openai": "OPENAI", "anthropic": "ANTHROPIC", "robinhood": "HOOD", "tsmc": "TSM",
           "micron": "MU", "eli lilly": "LLY", "walmart": "WMT", "unitedhealth": "UNH", "kospi": "KR200"}
# % que dispara cada nivel por ventana: (NOTABLE, BIG, EXTREME)
UMBRAL = {"cripto": {"1h": (2, 3.5, 6), "4h": (3, 5, 8), "24h": (5, 8, 12)},
          "indice": {"1h": (0.6, 1, 1.8), "4h": (1, 1.6, 2.5), "24h": (1.5, 2.5, 4)},
          "metal": {"1h": (0.8, 1.3, 2.2), "4h": (1.3, 2, 3.5), "24h": (2, 3, 5)},
          "energia": {"1h": (1.2, 2, 3.5), "4h": (2, 3.5, 6), "24h": (3, 5, 8)},
          "accion": {"1h": (2.5, 4, 7), "4h": (4, 6, 10), "24h": (6, 9, 15)}}
NIVELES = ("NOTABLE", "BIG", "EXTREME")
RSS = {"CoinDesk": "https://www.coindesk.com/arc/outboundfeeds/rss/",
       "MarketWatch": "https://feeds.content.dowjones.io/public/rss/mw_topstories",
       "BBC Business": "https://feeds.bbci.co.uk/news/business/rss.xml"}


def bajar(url, t=20):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=t) as r:
        return r.read()


def velas(sim, n=169):
    """Cierres horarios, del más viejo al más nuevo."""
    d = json.loads(bajar(f"{OKX}/market/candles?instId={sim}-USDT-SWAP&bar=1H&limit={min(n, 300)}"))["data"]
    return [(int(r[0]), float(r[4])) for r in reversed(d)]


def cambio(v, horas):
    return 100 * (v[-1][1] / v[-1 - horas][1] - 1) if len(v) > horas else 0.0


def titulares():
    out = []
    for fuente, url in RSS.items():
        try:
            raiz = ET.fromstring(bajar(url))
        except Exception:
            continue
        for it in list(raiz.iter("item"))[:40]:
            t = (it.findtext("title") or "").strip()
            if t:
                out.append({"titulo": t, "url": (it.findtext("link") or "").strip(), "fuente": fuente})
    return out


def con(t, ws):
    return any(re.search(r"\b" + re.escape(w) + r"\b", t.lower()) for w in ws)


def svg(v, nombre, ch, ventana):
    W, H, M = 1080, 600, 70
    ys = [p for _, p in v]
    lo, hi = min(ys), max(ys)
    rng = (hi - lo) or 1
    pts = " ".join(f"{M + i * (W - 2 * M) / max(1, len(ys) - 1):.1f},{H - M - (y - lo) / rng * (H - 2 * M):.1f}" for i, y in enumerate(ys))
    color, flecha = ("#2E8B6A", "▲") if ch >= 0 else ("#9E2A3A", "▼")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<rect width="100%" height="100%" fill="#0E0F10"/>
<text x="{M}" y="52" fill="#EDEAE3" font-family="Georgia, serif" font-size="34">{nombre} · 7 days</text>
<text x="{W - M}" y="52" fill="{color}" font-family="monospace" font-size="34" text-anchor="end">{flecha} {ch:+.2f}% {ventana}</text>
<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="4"/>
<text x="{M}" y="{H - 24}" fill="#8A8A86" font-family="monospace" font-size="20">low {lo:,.2f} · high {hi:,.2f} · OKX hourly · descriptive, not financial advice</text>
</svg>'''


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--umbral", type=float, default=1.0, help="multiplica los umbrales (0.1 = prueba)")
    o = ap.parse_args()
    os.makedirs(DIR, exist_ok=True)
    estado = json.load(open(ESTADO)) if os.path.exists(ESTADO) else {}
    ahora = dt.datetime.now(dt.timezone.utc)
    sello = ahora.strftime("%Y-%m-%d-%H%M")
    heads = titulares()
    lista = dict(LISTA)
    for nombre, sim in NOTICIA.items():  # lo que está en las noticias entra a la cinta
        if sim not in lista and any(con(h["titulo"], [nombre]) for h in heads):
            lista[sim] = (nombre.title(), "accion", [nombre])

    datos = {}
    for sim in lista:
        try:
            v = velas(sim)
        except Exception:
            continue
        if len(v) > 24:
            datos[sim] = {"v": v, "1h": cambio(v, 1), "4h": cambio(v, 4), "24h": cambio(v, 24)}
    cinta = " · ".join(f"{s} {d['v'][-1][1]:,.2f} {'▲' if d['24h'] >= 0 else '▼'}{abs(d['24h']):.1f}%"
                       for s, d in sorted(datos.items(), key=lambda kv: -abs(kv[1]["24h"]))[:12])

    nuevas = []
    for sim, d in datos.items():
        nombre, clase, palabras = lista[sim]
        mejor = None
        for ventana in ("1h", "4h", "24h"):
            u = [x * o.umbral for x in UMBRAL[clase][ventana]]
            lv = max((i for i, x in enumerate(u) if abs(d[ventana]) >= x), default=None)
            if lv is not None and (mejor is None or lv > mejor[0]):
                mejor = (lv, ventana)
        if mejor is None:
            continue
        lv, ventana = NIVELES[mejor[0]], mejor[1]
        prev = estado.get(sim)
        reciente = prev and ahora - dt.datetime.fromisoformat(prev["t"]) < dt.timedelta(hours=6)
        if reciente and NIVELES.index(lv) <= NIVELES.index(prev["nivel"]):
            continue  # mismo nivel o menor en menos de 6 h: no es noticia nueva
        ch = d[ventana]
        verbo = "up" if ch >= 0 else "down"
        ventana_txt = {"1h": "in the last hour", "4h": "in 4 hours", "24h": "in 24 hours"}[ventana]
        proxy = "" if clase == "cripto" else " (OKX perp, proxy)"
        ctx = [h for h in heads if con(h["titulo"], palabras)][:3]
        open(os.path.join(DIR, f"{sello}-{sim}.svg"), "w").write(svg(d["v"], nombre, ch, ventana))
        L = [f"# [{lv}] {nombre} is {verbo} {abs(ch):.1f}% {ventana_txt}", "",
             f"**Ticker tape:** {cinta}", "",
             f"**Changes:** 1h {d['1h']:+.2f}% · 4h {d['4h']:+.2f}% · 24h {d['24h']:+.2f}% · last {d['v'][-1][1]:,.2f}{proxy}", "",
             f"**Short hook:** {nombre} just {'jumped' if ch >= 0 else 'dropped'} {abs(ch):.1f}% {ventana_txt}. Here's what we know.", "",
             "**Caption (draft, edit before posting):**", "",
             f"{nombre} {verbo} {abs(ch):.1f}% {ventana_txt}{proxy}."]
        L += (["What's in the headlines:"] + [f"- {h['titulo']} ({h['fuente']}: {h['url']})" for h in ctx]) if ctx \
            else ["No headline in our feeds explains it yet. Say so; don't guess."]
        L += ["", "Descriptive only, not financial advice. Prices: OKX public market data.", f"#{sim} #markets", "",
              f"Chart: `{sello}-{sim}.svg`"]
        open(os.path.join(DIR, f"{sello}-{sim}.md"), "w").write("\n".join(L) + "\n")
        estado[sim] = {"nivel": lv, "t": ahora.isoformat(), "ventana": ventana, "cambio": round(ch, 2)}
        nuevas.append(f"[{lv}] {nombre} {ch:+.1f}% {ventana} · radar/alertas/{sello}-{sim}.md")

    json.dump(estado, open(ESTADO, "w"), indent=1)
    aviso = os.path.join(DIR, "aviso.md")
    if nuevas:
        open(aviso, "w").write("\n".join(nuevas) + f"\n\nTicker tape: {cinta}\n")
        print("\n".join(nuevas))
    else:
        if os.path.exists(aviso):
            os.remove(aviso)
        print("no alerts · " + cinta)


if __name__ == "__main__":
    sys.exit(main())
