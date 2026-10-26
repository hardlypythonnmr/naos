# Prototipo NAOS 2.0 · Taller: la regla se aprende jugando

Prototipo navegable de la web app (entrega A del brief `4-directores/b-taller/brief-prototipos.md`, con las secciones 3 y 8 de `propuesta.md`). No está publicado: lleva `noindex,nofollow`, una cinta fija arriba que lo dice ("Prototipo NAOS 2.0 · Taller: la regla se aprende jugando · no publicado"), no hace ninguna petición de red y no carga contadores. Reutiliza de la página V3 `assets/comun/tokens.css`, las fuentes (Newsreader, IBM Plex Sans, Plex Condensed) y `assets/js/figura.js` (Cella, un solo estado: respira, D-263), todo por rutas relativas; no se editó nada fuera de esta carpeta.

La conducta de prueba es **Move** ("Cuando pongo el agua al fuego, me siento y me levanto"), provisional hasta K0: lleva la cinta "Provisional until K0 / Provisional hasta K0" en el pie de P1. Ninguna pieza de Move se publica antes de K0. G3 se respeta: ningún color nuevo (campo de la puerta con tinta `#0E1116`; Divine `#3B4BB5` con texto blanco), ningún cambio de tipografía ni de figura.

## Cómo abrirlo

Desde `/home/user/naos`: `python3 -m http.server 8772` y abrir `http://localhost:8772/prototipos/2-0-b-taller/` (inglés) o `.../es/` (español, tuteo). También abre con doble clic (los datos van en `js/datos.js`, no se leen por red), pero entonces el navegador puede negar el almacenamiento y la app funciona sin recordar.

Parámetros (todos opcionales):

| Parámetro | Qué hace |
|---|---|
| `?lang=en\|es` | Cambia de archivo (EN en la raíz del prototipo, ES en `es/`). También sirve el enlace EN / ES del pie. |
| `?dev=1` | Panel del equipo abajo: fecha simulada (2 a 30 de noviembre), "volver como si hubieran pasado N días", primera visita / regreso, idioma, interruptores `opaca`, lista de eventos, "Borrar todo". |
| `?fase=1` | Enciende P5 (Regreso), P6 (Quitar apoyos), el cajón de ayer con hueco y la línea gris "Puedes quitar apoyos cuando quieras". |
| `?quieto` | Movimiento reducido: todo pasa a corte directo y el anillo es una barra. También se respeta `prefers-reduced-motion`. |
| `?puerta=<id>` | Entra a esa regla como desde una pieza (`move`, `breathe`, `community`, `sleep`, `divine`, `eat`, `week`). |
| `?src=<código>` | Igual, con la regla de la pieza: `story-AAAAMMDD` lleva a la regla de esa fecha; cualquier otro código, a la de hoy. Con `?src=` o `?puerta=` aparece la línea "La regla de la pieza". |
| `?opaca=o1\|o2\|o3` | Enciende una variante opaca (o varias separadas por coma). Cambia solo el rótulo o la línea, no la mecánica. Por defecto, apagadas. |
| `?hoy=AAAA-MM-DD` | Fecha simulada sin pasar por el panel. |
| `?vista=obstruccion` | Entra a P7 (como desde el sticker de la story). |

La fecha simulada por defecto es el jueves 5 de noviembre (Breathe, la regla de la semana); si la fecha real cae entre el 2 y el 15 de noviembre, se usa la real. El cambio de día es a medianoche de Colombia (UTC-5).

## Qué muestra cada pantalla

| Ancla | Qué muestra | Ids de innovación |
|---|---|---|
| `#hoy` (P8) | Pizarra de menú del día: rótulo con el día, la frase, la línea "Siempre visible" de la puerta, el objeto en silueta con Cella, "Juégala", "Ayer" (cajón) y "La obstrucción de hoy". Regla por `rotacion.json`; si la fecha no está, la de la semana del último jueves. Al mover la fecha, la de ayer entra al cajón con un barrido de 700 ms. Sin cuenta regresiva ni números sociales. | S11, S29, B11, B106, B175, B180 |
| `#r/<id>` (P1) | Llegada: la frase partida, silueta con Cella, cuatro tamaños (Una marcado), el tope escrito, botón de 56 px, "Solo hazla" (lleva a la V3 de la página, sin banco), la línea de seguridad con "Antes de empezar ›" (hoja con la lista completa) y la cinta de Move. Seis cosas, sin scroll a 390 x 844 (lo comprueba `qa.mjs`). Tras dos "Hoy no" o "A medias" con el mismo tamaño, marca el menor y dice "Hoy te toca: Una"; tras un mareo, Una es el tope por 7 días (Tres y Cinco quedan deshabilitados). | S1, S24, S28, S29, B02, B148, B172, B175, O3 (B178) |
| `#juega` (P2) | Primero la tarea, la oferta de sonido (una vez, apagada) y Empezar; 3 s de "Lista"; anillo de cuatro tiempos con la palabra grande (Sit / Stand o In / Out), Cella que baja y sube, puntos sin número y "paro" en Cinco; "Descansar" siempre visible. Ritmo parejo, lento o libre. Tamaño 0: instrucción grande y "Listo". Las reglas sin gesto de vaivén (Community, Sleep, Divine, Eat, Week) se juegan por pasos, una frase por pantalla. Región `aria-live` que anuncia cada compás; barra `role=progressbar` de 0 a 4. | S6, S22, B07, B08, B146 |
| `#despues` (P3) | Tres chips (Salió, A medias, Hoy no) y una línea de Cella sobre la tarea. "Hoy no" pregunta qué se interpuso (cinco chips) y sugiere dos cambios (tamaño más chico o cambiar el cuándo). "Me dolió o me mareé" muestra la línea de seguridad y guarda solo `tope_hasta`. Después de Salió o A medias: "Hazla tuya" (si no hay cuándo) y los dos botones de igual peso "Otra vez" y "Cerrar por hoy". | S7, S28, B01, B172, O2 (B177) |
| `#tuya` (P4) | La tarjeta con tu frase; tres anclas que rellenan la línea; tipo de señal (un sonido, algo que veo, algo que hago); línea libre de 60 caracteres; la pregunta de la silla (solo Move); "Queda en tu teléfono. Nosotros no lo vemos."; "Llévatela". Read-back de Cella por plantilla, y si el texto trae una hora (expresión regular EN y ES), "Eso es una hora, y las horas se corren. ¿Qué pasa justo antes?" con el campo editable; "Saltar" guarda tal cual. "No tengo silla" cambia el tamaño 0 a "Mano en el mesón, pies planos, dos respiros" y lo guarda como plan B. | S5, S20, B06, B83, B158 |
| hoja "Llévatela" (P4b) | Cuatro filas de 56 px: guardar la tarjeta (PNG 1080 x 1350 hecho en canvas, en el color de la puerta), mandársela a alguien (`navigator.share` con "Cuando ____, ¿tú qué haces?", respaldo a copiar; vista previa simulada), agendar en mi calendario (`.ics` local), imprimir la etiqueta. | S10, S26, B17, B25, B90, B120, B132, B157 |
| `#etiqueta` | Vista con CSS de impresión: etiqueta de 6 x 3 cm con "Cuando ____, ____." y la tira para el respaldo de la silla con la línea "Siempre visible". `window.print()` imprime solo eso. | B90, B132 |
| `#obs` (P7) | La situación del día del banco (`obstrucciones.json`), tres planes B, una línea libre de 60 caracteres y "Saltar". Al elegir muestra el plan B de antes junto al nuevo y "Lo que siempre queda: tu cuándo y tu gesto"; desde la sexta, esa frase pasa a ser la pantalla. En semanas alternas desde la semana 3 (16 de noviembre en adelante) reemplaza a la regla de hoy como entrada. Sin puntos ni comparación. | S25, B152, B156, B179 |
| `#cierre` (P9) | Cuadro de 1,2 s: la silueta y una línea de Cella sobre la tarea; baja un 4 % y se desvanece en 240 ms (corte directo con `?quieto`); vuelve a la regla de hoy. Sin racha, sin número, sin pregunta. | B159 |
| `#repaso` (P5, `?fase=1`) | La tarjeta con tu frase tapada; escribes (o Enter), "Lo diré en voz alta" o "No me acuerdo", los tres con el mismo peso; pista de la primera palabra; "Muéstrame" muestra la frase guardada sin "acierto". Con `?opaca=o1` el título dice "Tu regla de hoy". Se abre sola al entrar si la regla se guardó hace 2 días o más. | S3, S4, B04, B118, B150, O1 (B176) |
| `#apoyos` (P6, `?fase=1`) | Cuatro apoyos con "Quitar" (y "Volver a poner"); al quitar el último: "Esa era la última. Una tarjeta para imprimir, si la quieres." y la tarjeta imprimible. Sin título ni celebración. | S9, S21, B14, B112 |
| `#ajustes` | Idioma, ritmo, sonido, Sin ayudas, Quitar apoyos (con `?fase=1`), No contar mi visita, Exportar (JSON), Borrar todo (con confirmación) y, con `?opaca=o2`, "Ver por qué cambió mi tamaño". Al pie, "Cómo te acompañamos". | B18, B19 |
| `#como` | La página pública "Cómo te acompañamos", generada de un arreglo (`js/como.js`): una fila por mecanismo (qué hacemos, por qué, lo que no hemos demostrado, evidencia con su tamaño, cómo apagarlo), las marcas † ‡ y "preprint" explicadas, las tres variantes opacas, y las frases sobre Cella, las stories y la privacidad. | B19, B20, B21 |
| `#mapa` | Índice de las pantallas con atajos y la lista de parámetros. | |

Una línea de Cella es una frase fija escrita por una persona, una por evento (sin IA). La comparación de P5 es una lista de palabras en el teléfono; el texto no se guarda ni sale.

## Qué es real y qué se finge

Real: la rotación por fecha con fecha simulada y el cajón de ayer; el anillo, el tempo y los tonos de Web Audio (196 Hz y 392 Hz, 140 ms, con `navigator.audioSession.type = 'playback'` si existe); el `aria-live`; movimiento reducido; el `.ics` local con hora flotante, `RRULE:FREQ=WEEKLY` y `VALARM` solo si se marca (en Sleep, solo horas de 07:00 a 18:30, sin aviso y con el texto "Hoy, antes de apagar la lámpara: papel"); la tarjeta PNG; `navigator.share` con respaldo; el read-back por chips y expresión regular; la comparación léxica de P5; el tope de 7 días y el trinquete (solo baja); `localStorage` (clave `naos-proto-v1`, todo en try/catch, funciona sin él); Exportar y Borrar todo.

Se finge o se cambia:

- **Eventos**: se registran en el panel `?dev=1` (lista cerrada del brief) y no salen del teléfono. `abre` se marca "ya enviado hoy" tras la primera vez del día; "No contar mi visita" los marca como no contados. "Me dolió o me mareé" no emite nada ni queda en el historial.
- **Datos**: `data/reglas.json`, `obstrucciones.json` y `rotacion.json` son la fuente; `build-datos.mjs` los junta en `js/datos.js` para que el prototipo abra también sin servidor (`node build-datos.mjs` tras editarlos).
- **Reglas**: Move, Breathe y Community están escritas a mano (anclas, "cuándo no", líneas de Cella, obstrucciones); Sleep, Divine, Eat y Week tienen ficha mínima (sin banco de obstrucciones Eat y Week, y Eat y Move fuera de la rotación). Los textos de Breathe, Community y las fichas mínimas, y las obstrucciones que no son de Move, los escribí yo para el prototipo y están por revisar con la sala de escritura. Las "frases" de Sleep y Divine usan el vocabulario de la página V3; ningún texto cita un estudio sobre lo divino.
- **Vista previa de WhatsApp**: es una imagen estática por regla e idioma (`img/og-*.png`, hechas con `build-og.mjs` y el mismo dibujo de la tarjeta), no la vista previa real de ninguna app.
- **PDF de la etiqueta**: se imprime una vista con CSS, no se genera PDF.
- **"Solo hazla"** lleva a la portada de la V3 (`../../index.html` o `../../../es/index.html`), no a la herramienta desnuda de la puerta (la V3 no tiene un enlace profundo estable por herramienta).
- **Cella con IA, chat, contador, cuentas, brazos de prueba, Leitner, veta, aviso de bache, día en blanco, mazo de fallas, PWA y modo ahorro**: no existen (brief A.1). El enlace `r/<código>` del `.ics` y de "Mandársela" apunta a esta misma página con `?puerta=` y `?src=`.
- **Tiempos**: 1,0 s por tiempo (parejo), 1,5 s (lento) y libre son de referencia hasta K0. Cuál canal sigue el cuerpo (anillo o sonido) lo mide K0; el prototipo no lo afirma.

## Decisiones donde el brief calla

- La fecha por defecto es el 5 de noviembre para que "Ayer" ya tenga una regla (el 2 de noviembre es el primer día del banco y no tiene ayer).
- En P8, un desplegable "Prototipo: entrar como desde una pieza" (marcado como solo prototipo) deja abrir cualquiera de las siete reglas, porque Move y Eat no están en la rotación.
- En P1 la línea "La regla de la pieza" sale con `?src=` y también con `?puerta=`, porque los dos simulan la entrada desde una pieza.
- Subir el tamaño nunca lo hace la app: solo el toque de la persona. El trinquete baja Cinco a Tres y Tres a Una; "Un tamaño más chico" en P3 puede llegar al tamaño 0.
- En P2, "Descansar" lleva a P3 igual que terminar, sin juicio.
- "Quitar apoyos" también permite "Volver a poner" (una vía de regreso; el brief solo pide quitar).
- "Cerrar por hoy" vuelve sola a la regla de hoy tras el cuadro de 1,2 s. Con lector de pantalla la línea de Cella se anuncia antes de volver.
- La palabra grande del anillo se escribe en minúscula inicial y se reduce solo lo necesario para caber dentro del anillo. A 390 px de ancho, en inglés sale a 106 o 112 px; en español, "Siéntate" a 74 px y "Levántate" a 62 px, por debajo de los 96 px que pide el brief (las palabras son largas). Si N prefiere los 96 px, hay que acortar la palabra o sacarla del anillo; queda como decisión de arte.
- Las variantes opacas no tienen ningún rótulo en la pantalla y están las tres en la página "Cómo te acompañamos".
- El panel `?dev=1` está en español en las dos versiones: es para el equipo.

## Peso

Al abrir una regla en inglés: unos 322 KB sin comprimir (HTML, `tokens.css`, `app.css`, nueve scripts incluido `figura.js`, y cuatro fuentes), bajo los 380 KB del brief. Las vistas previas simuladas (`img/`, 14 PNG de 50 a 75 KB) solo se piden al abrir "Mandársela a alguien".

## Pruebas

`qa.mjs` (Playwright; sirve desde `/home/user/naos` con `python3 -m http.server 8772`): `NODE_PATH=$(npm root -g) node prototipos/2-0-b-taller/qa.mjs 8772`. Tarda unos 3 minutos. Revisa en EN y ES, a 390 y 320 px: errores de consola, peticiones externas, scroll horizontal, controles de 44 px o más, que P1 quepa sin scroll, el camino feliz, el trinquete, el tope de 7 días y que "Me dolió o me mareé" no deje motivo ni evento, el read-back y la hora, el `.ics` (Sleep sin horas nocturnas ni `VALARM`), P5, P6, Ajustes, `?quieto`, movimiento reducido, la app sin almacenamiento y que Tab llegue a todos los controles de P1.

## Archivos

`index.html` (EN) · `es/index.html` (ES) · `css/app.css` · `js/` (`datos.js` generado, `textos.js`, `como.js`, `base.js`, `pantallas.js`, `entrega.js`, `extras.js`, `inicio.js`) · `data/` (las tres fuentes en JSON) · `img/` (vistas previas simuladas) · `build-datos.mjs` · `build-og.mjs` · `qa.mjs`.
