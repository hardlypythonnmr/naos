# Contador de visitas (Umami, sin cookies)

El contador de NAOS es Umami Cloud (D-317). Hasta que tenga un id, la página no carga nada de Umami.

## Dónde pegar el id

1. Crea la cuenta gratis en <https://cloud.umami.is> y agrega el sitio con el dominio `hardlypythonnmr.github.io`.
2. En el sitio, abre **Settings > Tracking code** y copia el valor de `data-website-id` (un código como `1a2b3c4d-....`).
3. Pégalo en `data/sitio.json`, entre las comillas de `umami_website_id`:

```json
{ "contador": { "umami_website_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", "script": "https://cloud.umami.is/script.js", "dominios": "hardlypythonnmr.github.io" } }
```

4. Commit a `main`. Desde ese momento cuenta cada página que tiene la línea `<script defer src=".../assets/comun/contador.js">`.

## Qué mide y qué no

- Cuenta visitas por página, con su `?src=` (los enlaces cortos `/s/<código>/` llegan con `?src=<código>`; las invitaciones con `?src=invita`), el país y el tipo de aparato, en agregado.
- Cuenta los toques de los botones que llevan `data-umami-event` (en `/invita/`: crear enlace, compartir por WhatsApp, copiar, responder).
- No usa cookies ni guarda nada en el navegador, respeta "Do Not Track" y nunca manda el fragmento de la dirección (lo que va después de `#`, como `#nombre=Ana`).
- Solo cuenta en `hardlypythonnmr.github.io`: las pruebas locales no suman.

## Dónde está cada cosa

- `data/sitio.json`: el id (lo único que se edita).
- `assets/comun/contador.js`: lee el id y carga Umami solo si existe.
- Páginas con la línea: `index.html`, `es/index.html`, `agenda.html`, `pieza.html`, las páginas de tema (las escribe `scripts/construir-temas.mjs`) y `/invita/` (las escribe `scripts/construir-invita.mjs`). `es/index.html` sale de `taller/build.py` en n-system: si se reconstruye, esa línea tiene que estar en su plantilla.
