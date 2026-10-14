"""NAOS Mood (índice de ánimo del mercado), v0.1. Informe: empresa/investigacion/2026-10-14-indice-animo/informe.md

  python3 animo.py               # imprime el JSON de hoy
  python3 animo.py --guardar     # además escribe earn/naos/radar/animo-AAAA-MM-DD.json
  python3 animo.py --historia 30 # agrega los últimos 30 valores diarios (solo de nuestro cálculo)

Solo librería estándar. Fuentes públicas y sin clave:
  OFR Financial Stress Index (Office of Financial Research, Tesoro de EE. UU.): 5 categorías, diario, ~2 días hábiles de rezago.
  BCE, tasas de referencia: índice del dólar calculado por NAOS con la fórmula del DXY (no es el DXY de ICE).
  alternative.me Crypto Fear & Greed: se muestra tal cual, aparte, con atribución al lado.

Fórmula (fija, no se ajusta mirando a otro índice):
  Cada categoría del OFR (estrés, signo invertido): brecha = valor - promedio de 50 sesiones;
    z = brecha / desviación estándar de la brecha en 252 sesiones; sub = 100 * Phi(-z), z recortado a +-3.
  Dólar NAOS: r = ln(I_t / I_t-20); z de r contra sus últimas 252 sesiones; sub = 100 * Phi(-z) (dólar que sube = miedo).
  Valor = promedio simple de las sub-notas vivas (pesos iguales). Se necesitan 4 de 6 vivas; si no, valor = null.
  Bandas: 0-24 miedo extremo, 25-44 miedo, 45-55 neutral, 56-75 codicia, 76-100 codicia extrema.
Descriptivo, no es asesoría financiera. No es el Fear & Greed Index de CNN.
"""
import csv
import datetime as dt
import io
import json
import math
import os
import sys
import time
import urllib.request
import zipfile

AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.abspath(os.path.join(AQUI, "..", "..", "radar"))
UA = {"User-Agent": "curl/8.5.0"}
VERSION = "0.1"
OFR_URL = "https://www.financialresearch.gov/financial-stress-index/data/fsi.csv"
ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip"
FNG_URL = "https://api.alternative.me/fng/?limit=1&format=json"
OFR_CAT = {  # clave: (columna del CSV, nombre público)
    "volatilidad": ("Volatility", "Volatility"),
    "acciones": ("Equity valuation", "Equity valuation"),
    "credito": ("Credit", "Credit"),
    "refugio": ("Safe assets", "Safe assets"),
    "fondeo": ("Funding", "Funding"),
}
MAX_EDAD = {"ofr": 5, "ecb": 3}  # días hábiles antes de marcar un input como viejo y sacarlo
MINIMO_VIVOS = 4
BANDAS = [(24, "Extreme fear"), (44, "Fear"), (55, "Neutral"), (75, "Greed"), (100, "Extreme greed")]


def bajar(url, t=60, intentos=3):
    req = urllib.request.Request(url, headers=UA)
    for i in range(intentos):
        try:
            with urllib.request.urlopen(req, timeout=t) as r:
                return r.read()
        except Exception:
            if i == intentos - 1:
                raise
            time.sleep(3 * (i + 1))


def phi(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


def media(v):
    return sum(v) / len(v)


def desv(v):
    m = media(v)
    return math.sqrt(sum((x - m) ** 2 for x in v) / (len(v) - 1))


def nota(z):
    return round(100 * phi(max(-3.0, min(3.0, z))), 1)


def puntaje_brecha(serie, n=50, w=252):
    """serie: [(fecha, nivel de estrés)]. Devuelve [(fecha, sub-nota 0-100)] con 'menos estrés que su promedio de n' = codicia."""
    vals = [v for _, v in serie]
    brechas, out = [], []
    for i in range(len(vals)):
        if i + 1 < n // 2:
            brechas.append(None)
            continue
        ventana = vals[max(0, i + 1 - n): i + 1]
        brechas.append(vals[i] - media(ventana))
        hist = [b for b in brechas[max(0, i + 1 - w): i + 1] if b is not None]
        if len(hist) >= 120:
            sd = desv(hist)
            if sd > 0:
                out.append((serie[i][0], nota(-brechas[i] / sd)))
    return out


def puntaje_momento(serie, k=20, w=252):
    """Retorno logarítmico de k sesiones contra su propia historia de w; sube = miedo (se invierte)."""
    vals = [v for _, v in serie]
    rets, out = [], []
    for i in range(k, len(vals)):
        rets.append(math.log(vals[i] / vals[i - k]))
        hist = rets[-w:]
        if len(hist) >= 120:
            sd = desv(hist)
            if sd > 0:
                out.append((serie[i][0], nota(-(rets[-1] - media(hist)) / sd)))
    return out


def leer_ofr():
    filas = list(csv.DictReader(io.StringIO(bajar(OFR_URL).decode())))
    return {k: [(f["Date"], float(f[col])) for f in filas if f.get(col) not in (None, "")][-1500:] for k, (col, _) in OFR_CAT.items()}


def leer_dolar():
    z = zipfile.ZipFile(io.BytesIO(bajar(ECB_URL)))
    filas = list(csv.DictReader(io.StringIO(z.read(z.namelist()[0]).decode())))
    out = []
    for f in filas:
        try:
            usd, jpy, gbp, cad, sek, chf = (float(f[c]) for c in ("USD", "JPY", "GBP", "CAD", "SEK", "CHF"))
        except (ValueError, KeyError, TypeError):
            continue
        i = (50.14348112 * usd ** -0.576 * (jpy / usd) ** 0.136 * (usd / gbp) ** -0.119 * (cad / usd) ** 0.091
             * (sek / usd) ** 0.042 * (chf / usd) ** 0.036)
        out.append((f["Date"], i))
    return sorted(out)[-1500:]


def dias_habiles(desde, hasta):
    a, b = dt.date.fromisoformat(desde), dt.date.fromisoformat(hasta)
    return sum(1 for d in range(1, (b - a).days + 1) if (a + dt.timedelta(d)).weekday() < 5)


def banda(v):
    for tope, nombre in BANDAS:
        if v <= tope:
            return nombre


def combinar(subs, fecha):
    """subs: {clave: [(fecha, nota)]}; toma la última nota de cada input con fecha <= fecha y la saca si está vieja."""
    detalle, vivas = {}, []
    for k, s in subs.items():
        previas = [x for x in s if x[0] <= fecha]
        if not previas:
            detalle[k] = {"sub": None, "fecha": None, "vivo": False}
            continue
        f, v = previas[-1]
        fuente = "ecb" if k == "dolar" else "ofr"
        vivo = dias_habiles(f, fecha) <= MAX_EDAD[fuente]
        detalle[k] = {"sub": v, "fecha": f, "vivo": vivo}
        if vivo:
            vivas.append(v)
    valor = round(media(vivas)) if len(vivas) >= MINIMO_VIVOS else None
    return valor, detalle


def cripto():
    try:
        d = json.loads(bajar(FNG_URL, 20))["data"][0]
        return {"valor": int(d["value"]), "banda_fuente": d["value_classification"],
                "fecha": dt.datetime.fromtimestamp(int(d["timestamp"]), dt.timezone.utc).date().isoformat(),
                "fuente": "Crypto Fear & Greed Index by alternative.me", "url": "https://alternative.me/crypto/fear-and-greed-index/",
                "nota": "Se muestra tal cual, con la atribución al lado. No entra en NAOS Mood."}
    except Exception as e:
        return {"error": e.__class__.__name__}


def correr(historia=0):
    errores, subs = [], {}
    try:
        for k, s in leer_ofr().items():
            subs[k] = puntaje_brecha(s)
    except Exception as e:
        errores.append(f"OFR: {e.__class__.__name__}")
    try:
        subs["dolar"] = puntaje_momento(leer_dolar())
    except Exception as e:
        errores.append(f"BCE: {e.__class__.__name__}")
    hoy = dt.date.today().isoformat()
    valor, detalle = combinar(subs, hoy)
    nombres = {**{k: f"OFR FSI category: {pub} (inverted, vs 50-day average)" for k, (_, pub) in OFR_CAT.items()},
               "dolar": "NAOS dollar index, 20-day change (inverted; ECB reference rates)"}
    fuentes = {k: "Office of Financial Research, OFR Financial Stress Index" for k in OFR_CAT}
    fuentes["dolar"] = "NAOS calculation with ECB euro reference rates (not ICE's DXY)"
    for k in detalle:
        detalle[k].update({"nombre": nombres.get(k, k), "fuente": fuentes.get(k, ""), "peso": "igual"})
    r = {"indice": "NAOS Mood", "version": VERSION, "valor": valor, "banda": banda(valor) if valor is not None else None,
         "vivos": sum(1 for d in detalle.values() if d["vivo"]), "total_inputs": len(detalle),
         "datos_desde": min((d["fecha"] for d in detalle.values() if d["vivo"]), default=None),
         "datos_hasta": max((d["fecha"] for d in detalle.values() if d["vivo"]), default=None),
         "generado": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"),
         "inputs": detalle, "cripto": cripto(), "errores": errores,
         "aviso": "Descriptive, not financial advice. Not CNN's Fear & Greed Index. Sources: Office of Financial Research; European Central Bank (NAOS calculation)."}
    if historia:
        fechas = sorted({f for s in subs.values() for f, _ in s})[-historia:]
        r["historia"] = [{"fecha": f, "valor": combinar(subs, f)[0]} for f in fechas]
    return r


if __name__ == "__main__":
    h = int(sys.argv[sys.argv.index("--historia") + 1]) if "--historia" in sys.argv else 0
    r = correr(h)
    txt = json.dumps(r, ensure_ascii=False, indent=1)
    if "--guardar" in sys.argv:
        os.makedirs(SALIDA, exist_ok=True)
        with open(os.path.join(SALIDA, f"animo-{dt.date.today().isoformat()}.json"), "w") as fh:
            fh.write(txt + "\n")
    print(txt)
