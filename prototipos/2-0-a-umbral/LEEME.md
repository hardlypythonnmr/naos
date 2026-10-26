# Prototipo NAOS 2.0 · Umbral: la herramienta sale de la pantalla

Prototipo navegable de la web app (entrega A del brief), con la conducta de Sleep, "Una lámpara". No está publicado, lleva `noindex,nofollow` y una cinta fija arriba que lo dice. No hace ninguna petición de red ni usa rastreadores. Pesa unos 165 KB de código propio (las fuentes son las de `../../assets/fuentes`).

## Cómo abrirlo

Desde `/home/user/naos`: `python3 -m http.server 8771` y abrir `http://localhost:8771/prototipos/2-0-a-umbral/` (inglés) o `.../es/` (español, tuteo). También abre con doble clic, pero el almacenamiento del navegador puede variar. Toca la cinta de arriba para abrir el panel del prototipo: mapa de pantallas, idioma, tema, fecha simulada, "sin movimiento", cargar un ejemplo en Tu cuarto, borrar y modo de campo.

Parámetros: `?lang=es|en`, `?src=sleep-una-lampara`, `?quieto`, `?hoy=AAAA-MM-DD`, `?campo=1`, `?nomedir` (se respeta: no existe contador), `?tema=oscuro`. Ayudas para capturas que no están en el brief: `?tipo=lugar|alarma|hora|aparato|sin-lugar` (entra directo a P2 con ese tipo) y `?texto=...` (rellena P1a). Anclas: `#p1a #p1b #p1c #p2 #p3 #p3b #p5 #p6 #p6&propio #p7 #p8a #p8b #p9 #hoy #mapa`. La cita se simula con `?q=7#s=lámpara`.

## Qué muestra cada pantalla

| Ancla | Qué muestra | Ids de innovación |
|---|---|---|
| `#p1a` | El último cuadro del Short como componente, "Cuando ___ :", tres chips, campo de 60 caracteres con recorte propuesto (nunca corta solo), "Ver cómo · 10 s", pie plegado "¿Por qué?" y "Cuándo no" (con la línea de edad), línea de lunes y primero de mes, y el teclado abierto oculta el pie. Al tocar Siguiente corre la puerta de seguridad una sola vez | U01, U02, U28, U172, U177, U176, U189 |
| `#p1b` | Cella con un brazo (el de D-275) pregunta el cuarto; cinco opciones sin preselección; "Otro" cambia a "Una alarma / Una hora / No sé" con flecha de vuelta | U154, U182, U81 |
| `#p1c` | Cuarto claro, interruptor de 64 px, 1,2 s hasta la noche con una lámpara de puntos y su nombre; clic WebAudio solo al tocar; se deshace al salir y no cambia el tema | U29 |
| `#p2` | Tarjeta de cinta con la palabra editable (14 caracteres), punto de fuerza, línea "antes / ahora", "Otro lugar", los dos caminos accesibles (hoja grande con voz y "Imprimir"; nombre de alarma con "Copiar"; van primero con contraste alto o `forced-colors`), "Ninguno, solo quería verla", y la compuerta de falla ("¿Dónde estás cuando pasa? Ponla ahí.") con "Elegir un lugar" y "Ponerla igual" ("señal débil" una sola vez) | U81, U82, U117, U157, U168, U186, U193, U194 |
| `#p3` | La palabra en grande, "Cinta y esfero.", plegables (más objetos, plan B con texto fantasma, ensayo "Ya fui"), casilla apagada de las preguntas del día 7 y 28 con franja sin valor por defecto y "Incluir mi frase", "Listo". Mantiene la pantalla encendida (Wake Lock) y nunca la atenúa | U01, U21, U82, U85, U101, U129, U173, U185 |
| `#p3b` | Tras "Listo", 1,2 s hasta un disco de puntos ámbar sobre noche; "Salir" y "Apagar y borrar" del mismo tamaño; línea de Cella; un toque, una tecla o mover el ratón devuelven P3; texto de lector de pantalla con `aria-live` | U83, U122, U169 |
| `#hoy` | La página tranquila a la que lleva "Salir": la herramienta de la semana y, en letra chica, "El jueves: la taza", sin botón | U180, U22 (fila 22 de la tabla) |
| `#p5` | Pregunta del día 7 o 28 con la palabra tomada del fragmento `#s=`; cuatro respuestas, razones (incluida "culpa o presión", con respuesta que baja la presión), plan B con el obstáculo nombrado; no se envía nada, solo `console.info` | U14, U88, U129 |
| `#p6` | Tu cuarto: tarjeta, "Sigue puesta / La moví / Ya la hago sola"; con `&propio` (entrada por el enlace de P1a) suma "La hice / No pude / Hoy no" y el contador sin racha; "Apagar y borrar" siempre. Si está vacío no aparece | U13, U14, U19, U170 |
| `#p7` | Descrita, no construida (condicionada a la auditoría de ética de Eat) | U151 |
| `#p8a`, `#p8b` | Texto fijo A (crisis) y B (regla sobre comer, sin teléfono propio), "Ver otras puertas" y "Salir". Dos listas, ES y EN, sin modelo; no guarda el texto | fila 15 de la tabla |
| `#p9` | "Cómo NAOS te empuja": las 26 filas de la propuesta 2.4 generadas de `js/empujones.js`, con filtro por estado, qué ves, qué hace, por qué, dónde se explica, cómo apagarlo, fecha y etiqueta "cambió" por 30 días, los tres fallos de Sleep, mapa de señal viva por puerta, lo que NAOS no hace, edad mínima y la línea H7 | U18, U104, U200 |
| `#mapa` | Índice de las pantallas con su estado y atajos de prueba | |

Modo de campo (`?campo=1`, U199): cronometra cada pantalla en memoria y, en `/hoy/`, muestra cuatro preguntas más las dos de la luz que queda y arma el texto para el issue. Las cuatro preguntas son mi redacción a partir de las cinco de A.1 (la hoja de N no está en el brief; la quinta, la puerta de seguridad, se prueba con S2 y S3). N debe cambiarlas si su hoja dice otra cosa.

## Qué es real y qué se finge

Real: navegación y estado en memoria, los parámetros de URL, edición de la palabra, chips y recorte, la puerta de seguridad, la compuerta de falla, la atenuación, el clic, el Wake Lock si el navegador lo trae, el `.ics` (dos citas, hora flotante, sin `VALARM`, `ORGANIZER` ni `ATTENDEE`, URL plegado a 75 octetos; la URL lleva la palabra con porcentaje, p. ej. `l%C3%A1mpara`, a diferencia del ejemplo del brief), la imagen de la etiqueta por `canvas` con `navigator.canShare` o descarga, copiar, la hoja grande con voz e impresión, "Tu cuarto" en `localStorage` con `try/catch` (clave `naos-v6-senales`).

Se finge o no se construye: las otras seis puertas (solo Sleep, con la ficha de 6.1 copiada sin cambios en `js/datos.js`); el enrutador por palabras (apagado); Cella con voz o chat (sus líneas son texto); el contador; "Foto de tu lugar" y "Fondo de pantalla" (rótulos con la nota "no construido"); la hoja de etiquetas es una página estática de prueba (`hoja.html`); la fecha de cambio de cada fila de P9 es de maqueta (todas 2026-10-25; el generador real la saca de git); "Ver otras puertas" lista las puertas como rótulos; el service worker y el manifiesto; P7. No se prueba cómo trata cada calendario el `.ics` (U94), ni el guardado en iOS o Android, ni el navegador interno de Instagram y YouTube (U153); solo se muestra una línea de ayuda si el agente de usuario lo sugiere.

## Decisiones que tomé donde el brief calla

- Salir lleva a `#hoy` sin diálogo; "Ninguno, solo quería verla" también.
- En P3 hay "Salir" como enlace pequeño y una línea de privacidad bajo "Listo" ("Se guarda en tu aparato, en «Tu cuarto»"), porque "Listo" guarda la señal. N puede quitarla si le parece ruido.
- El selector de franja es un `select` (un solo tocable), así P3 cuenta 7 tocables, 9 con la casilla encendida.
- Un cuándo de tipo "hora" muestra un punto medio y rótulo de cita; "aparato" y "sin lugar" pasan por la compuerta.
- Al llegar con algo guardado y menos de 28 días, la primera pantalla es P6; con una ancla explícita no.
- El EN en un navegador en español pasa a `es/` si no hay `?lang`; la cinta lleva el texto en español en las dos páginas (es mobiliario del equipo).
- No se simula `src` más allá de seleccionar la ficha de Sleep; sin `src`, la herramienta de ahora sería Sleep de noche y Breathe de día, y aquí siempre es Sleep.

## Pruebas

`qa.mjs` (Playwright): tocables por pantalla a 390 px, blancos de 48 px, sin scroll horizontal a 320 y 390, S1 a S7, S9 y S10, el `.ics`, las dos páginas sin errores de consola y ninguna petición externa. Uso: `NODE_PATH=$(npm root -g) node qa.mjs 8771`. Resultado de la última corrida: todo en verde.

No se hicieron: contraste AA medido por script (los tokens son los de G3, ya medidos en `contraste.txt`), zoom al 200 %, ni capturas en la carpeta de la estrategia. Tampoco hay `tests/ics.test.mjs` ni `tests/seguridad.test.mjs` formales con 20 + 20 frases.
