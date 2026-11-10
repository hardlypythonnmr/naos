# NAOS 4.0 (carpeta v4/)

Sitio estático de la casa de cinco escalones (Tenderness, Emptiness, Saturation, Body, Courtyard). "Choose friction." es lo primero que se lee. HTML, CSS y JS a mano, sin build. Hoy está en publicación oscura (`noindex`); la página de la raíz sigue intacta.

## Archivos
- `index.html` (EN) y `es/index.html` (ES): mismo `assets/v4.js` y `assets/v4.css`; el idioma sale de `<html lang>`.
- `data/niveles.json`, `data/protocolos.json`: los datos (no se editan a mano). `data/temas-disponibles.json`: qué carpetas `temas/<slug>/` existen (los que no, salen con "soon"/"pronto"); hay que actualizarlo cuando se cree la página de un tema (hoy falta `breathe`).
- `assets/figura*.js`, `cella-brazos.js`: Cella 4.0. `Fraunces-Suave-*.ttf`: títulos.
- `prueba.mjs` y `capturas/`.

## Cómo se prueba
`node v4/prueba.mjs` (Node + Playwright). Levanta un servidor local, revisa 5 escalones, 40 herramientas con un solo hogar, redirecciones viejas, 0 errores de consola, 0 desborde a 390 y 1280 (EN y ES), texto mínimo de 12 px, la capa de respirar y reduced-motion, y guarda capturas en `v4/capturas/`. Debe terminar en `OK`. A mano: abrir `/v4/` y `/v4/es/` con cualquier servidor estático.

## Cambio de raíz el 1-dic (un solo cambio)
1. Dejar la v3 en `v3/` (`git mv` de la raíz actual a `v3/`, o copia) y copiar el contenido de `v4/` a la raíz, ajustando las rutas: en `index.html` y `es/index.html` cambiar `data-v4` y `data-raiz` (en la raíz: `data-v4=""`, `data-raiz=""`; en `es/`: `"../"` y `"../"`), las rutas `assets/` y quitar `noindex`.
2. Alternativa sin mover archivos: hacer que la raíz `index.html` redirija a `v4/` (`<meta http-equiv="refresh" content="0;url=v4/">`) y quitar `noindex` en v4. Es el cambio más corto.

## Vuelta atrás
Revertir ese commit (`git revert`) o devolver la raíz anterior; `v3/` o el `index.html` anterior siguen en el historial. Debería tomar menos de 10 minutos.

## Qué falta
- "Watch" por herramienta: no hay una correspondencia fiable video-herramienta (las claves de `data/enlaces.json` son `fecha|slot`). Cada escalón muestra "Latest Shorts" (los 3 más recientes). Si una clave llega como `fecha|<id de herramienta>`, el botón Watch aparece solo.
- Los textos de protocolos, herramientas y temas siguen en inglés en `/es/`.
- Textos en español de la interfaz y los subtítulos de escalón los tradujo la sesión: N los revisa.
- Redirecciones del sitio viejo y enlaces cortos `/s/` (H7), medición (H11), favicon/avatar 4.0 y SEO por escalón.
- Cambiar `canonical`/`hreflang` y quitar `noindex` el 1-dic.
