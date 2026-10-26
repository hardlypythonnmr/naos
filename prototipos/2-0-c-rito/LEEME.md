# Prototipo web app · Rito (C): volver es el acto, y se hace con otros

Prototipo navegable de la web app de NAOS 2.0, dirección Rito. No está publicado, no tiene red, no tiene contador y no manda nada a nadie. Sigue la sección A de `brief-prototipos.md` y las secciones 3 y 8 de `propuesta.md` (carpeta `c-rito`). La conducta de ejemplo es Community, "Una línea" / "One line", que todavía necesita el sí de N (D-274).

## Cómo abrirlo

Desde la raíz de `/home/user/naos`: `python3 -m http.server 8773` y luego

- EN: `http://localhost:8773/prototipos/2-0-c-rito/index.html`
- ES (tú): `http://localhost:8773/prototipos/2-0-c-rito/es/index.html`

En el teléfono, abre la misma dirección con la IP del computador. Sin servidor también funciona con `file://`, salvo `navigator.share` y el portapapeles, que cae al respaldo de copiar.

Archivos: `index.html` y `es/index.html` (cascarones), `css/app.css`, `js/datos.js` (textos de las dos lenguas, datos y las 30 filas de "Cómo te empuja NAOS"), `js/app.js` (pantallas y lógica), `capturas/` (390 por 844, EN y ES). Usa de la V3 `assets/comun/tokens.css`, las fuentes (`assets/fuentes`), el favicon y el dibujo de Cella (el mismo cuerpo de `assets/marca/cella.svg` y el brazo de D-275, dibujados en línea). Colores: solo los de los tokens y los seis campos de puerta. Sin librerías y sin innerHTML.

Peso: unos 112 KB sin comprimir en total (33 KB comprimido), por encima de los 60 KB del brief; el exceso es el texto de las dos lenguas, las 30 filas del registro y los comentarios. Ninguna petición de red (comprobado con Playwright).

## Parámetros y rutas

Rutas por ancla: `#p1` a `#p8`, `#lugar`, `#registro`. Parámetros: `?lang=en|es` (cambia de página), `?puerta=community|breathe|eat|sleep|move|divine`, `?hueco=0|3|9|25` (días desde la última visita, simulados), `?hora=HHMM` (por ejemplo `2330`), `?primera=1` (primera visita de todas), `?cerca=1` (a 30 min de la cita), `?de=par&t=<herramienta>&h1=AAAA-MM-DDThh:mm&h2=...&h3=...` (entrar como quien recibe), `?compartir=elegir|cancelar|nodisp` (simula la hoja de compartir), `?quieto` (movimiento reducido), `?dev=1` (panel del equipo al pie: puerta, hora, hueco, primera visita, cerca de la cita, compartir, movimiento reducido, ver el estado, atajos a cada pantalla y los seis eventos del contador, que solo se muestran ahí). También se llega al panel desde "Mi lugar".

Camino sin parámetros: primera visita en P1, luego P2, P3, P7. Al volver, según los días, P2 o P6. Para probar P4 sin armar un enlace, en P3 abre "Mandar" o "Hazla con alguien" y toca la ayuda "Prototipo: abrir este enlace como quien lo recibe".

## Qué muestra cada pantalla y qué ids implementa

| Pantalla | Qué muestra y qué hace | Ids |
|---|---|---|
| **P1 Entrada** (`#p1`) | Campo de la puerta; un dintel oscuro se corre en 600 ms, la línea "Puerta abierta. Domingo, 10:00." entra a los 600 ms con 200 ms de fundido; luna del día; objeto de la semana (taza, apagable); botón Entrar; un toque en cualquier parte la salta. Solo en la primera visita o a 30 min de la cita (entonces dice "Mi rato."). Con el sonido activado, tocar suena el motivo de tres notas y sale un pulso de 300 ms | R01, R16, R97, R161, S5, S8, S19 |
| **P2 Acto** (`#p2`) | Para Community: título "Una línea", frase, campo de una línea con siete puntos que se encienden por palabra (tope de siete; en mínimo, dos), Cella con anillo de 10 s, "Terminé". Al terminar: "Tu cuándo" con tres anclas y "Escribe el tuyo" (se guarda). Nada se envía y la línea se borra. Las otras cinco puertas muestran su nombre y el marcador "[acto de la V3, sin cambios]" con el mismo anillo | R17, R23 |
| **P3 Devolver** (`#p3`) | Tres filas de 56 px con divulgación progresiva (solo una abierta); orden por la tabla de puerta y hora; desde la segunda vez va primero la última elegida; "¿Sirvió? Sí · Un poco · No sé"; enlaces "No pude" y "Poner una cita semanal" (solo la primera vez, nunca en Sleep). Sleep de 20:00 a 5:59: una sola fila "Hasta mañana." | R03, R14, R22, R95, R131, R201, R202, S4, S13, S18 |
| **P3a Mandar** | "Solo el enlace" o "Con una línea" (tres líneas, ninguna preseleccionada, editables; "Mándasela a quien quiera recibirla." una sola vez). Usa `navigator.share`; sin hoja, "Copiar el enlace" y un botón de copiar por línea; si el portapapeles falla, el enlace queda en un campo seleccionado | R04, R150, R192, R205, S24 |
| **P3b No pude** | "¿Qué se interpuso?" con cuatro fichas y una regla que se acepta o no ("No tuve tiempo" deja el mínimo para la próxima vez; "Se me olvidó" lleva a P8); "Pídele a alguien que la haga contigo otro día" (no se ofrece con "Me pesó") | R96, R148, S23 |
| **P4 Recibir** (`#p4`) | "¿Con permiso?" con tres botones de igual tamaño; "Siga" muestra "Te mandaron esto. No te pide nada." y las horas propuestas; elegir una hora arma una respuesta para copiar, compartir o abrir en WhatsApp. Contrato del enlace: `t` contra la lista cerrada, hasta tres horas en formato estricto y dentro de 60 días, todo con `textContent`; si no cumple, "Este enlace no abre nada. Aquí está la puerta." | R05, R94, R126, S17 |
| **P5 Contestar** (`#p5`) | Acuses y respuestas a la invitación que pesan igual, vista previa, Compartir, Copiar, Cerrar; "Mandarla a otra persona" queda abajo y pequeña | R121, R133, R136 |
| **P6 Volver** (`#p6`) | Cuatro pantallas según el hueco: 0 a 1 ("Hoy ya la hiciste." o la puerta), 2 a 6 ("Aquí está, en tamaño mínimo." con el arco dibujado una vez en 900 ms), 7 a 20 ("¿Cuál era tu cuándo?" saltable, y la fila discreta "¿Qué se interpuso?"), 21 o más ("¿Cambió algo en tu semana?" y re-elegir el cuándo). Nunca muestra días, "te extrañamos" ni premio | R06, R07, R09, R23, S2, S3, S9 |
| **P7 Cierre** (`#p7`) | Con otra persona: la mesa de color se borra (320 ms) solo cuando la hoja devolvió una elección, y queda "En tus manos." con campo vacío, fecha, luna y la pareja de Cella. Solo: botón "Borrar la mesa" o gesto (deslizar o mantener 1,2 s), queda "Hasta la próxima." / "Hasta mañana."; "Deshacer" 6 s; tras "Solo yo hoy", "Dejarla a la vista" (ocultable). No dice que el mensaje salió | R02, R188, R190, R203, S8, S25 |
| **P8 Cita** (`#p8`) | Día, hora (17:30 sugerida, con su explicación), evento "Mi rato", motivo de sonido (1 a 6, suena al tocarlo), 12 semanas o sin fin; descarga un `.ics` real. No se ofrece en Sleep | R10, R11, R162, S1 |
| **Mi lugar** (`#lugar`) | Mis cuándos (quitar), mi cita (cambiar, quitar), interruptores (objeto, sonido y motivo, ver todos los días, no enviar nada, modo sin huella, mostrar "Dejarla a la vista"), copiar mis cuándos, borrar todo, enlaces a "Cómo te empuja NAOS" y al panel | R19, R151, R20 |
| **Cómo te empuja NAOS** (`#registro`) | Página pública con la cabecera del brief ("No sabemos si estos empujones funcionan...") y 30 filas (S1 a S26, R190, R192, R201, R202) con su línea pública en EN y ES, estado, evidencia y lectura de la Mesa. Enlazada desde el pie de toda pantalla y desde "Mi lugar" | R20, R21, S12, S16 |

Estado local: una clave, `naos-rito-v1`, siempre en try/catch; con el almacenamiento bloqueado funciona sin memoria (probado). Accesibilidad: controles de 48 px o más, anillo de foco de 2 px, `aria-live` en estados y pantallas, foco al título al cambiar de pantalla, Tab alcanza todo, `prefers-reduced-motion` y `?quieto` dejan el estado final sin tránsito. Contraste medido (tinta sobre los cinco campos 7,3 a 10,9; papel sobre Divine 7,3; cobalto sobre papel 8,5). Sin 320 px de desborde horizontal en ninguna pantalla (comprobado a 320, 390 y 1440).

## Qué se simula

- **Mensajes.** No hay otra persona: P4 se abre con un enlace armado a mano o con la ayuda "Prototipo: abrir este enlace como quien lo recibe". Lo que se comparte sale por la hoja del navegador o se copia; el prototipo no sabe si salió.
- **Contador.** Los seis eventos (`abre`, `hecha`, `devolver`, `cita`, `recibe`, `sirvio`) solo aparecen en `?dev=1` y respetan "No enviar nada".
- **Luna.** Es una aproximación calculada en el aparato; la web real usa las fechas de USNO.
- **Las otras cinco herramientas.** Solo nombre, marcador y anillo; los textos de "Tu cuándo", las líneas de mandar de Breathe y de "Coordinar la luz de la casa" y las respuestas son de muestra y no pasaron por la sala de escritores ni por `detector_ia.py`.
- **Objeto de la semana.** Siempre la taza en pantalla (solo la taza está dibujada); el `.ics` recorre los doce objetos.
- **Sonido.** Los seis motivos son tonos de WebAudio; el WAV para la alarma de Android no se genera ("Bajar el tono" lo dice).
- **Modo sin huella y "Ver todos los días".** Solo el interruptor, sin efecto, como pide el brief. "Mi lugar" no tiene "veces hechas" a la vista.
- **Registro.** "Activo" significa que el prototipo lo hace de verdad; "apagado" es dormido o fuera del prototipo; `lectura_mesa` queda en "aún no". La clasificación `evidencia` (estudio, idea nuestra, sin lectura) es una lectura rápida de la columna de evidencia de 2.5 y debe revisarla quien lleve `fuentes.csv`. Las líneas en inglés son traducción mía de las líneas públicas de 2.5.
- **Un solo enlace externo.** "Abrir en WhatsApp" (P4) es un `wa.me` que solo se abre si la persona lo toca; durante el recorrido no hay peticiones de red.
- **Seguridad (D-148).** El texto de `motor/seguridad.md` (está en voseo) no se pegó en pantalla; "Me pesó" lleva solo la regla del brief. El texto y las líneas de ayuda quedan para cuando el VP decida el registro.
- **No entra** (como pide el brief): cuentas, servidor, contador real, brazos de prueba, "La semana con puentes", PWA real y el Artifact privado (no se publicó nada). Tampoco la salida "sin nadie hoy" de Eat (R24), la pregunta del sábado (R15) ni el selector "¿Cuál viste?" (R18). La re-elección del cuándo en lunes y primero de mes (S9) solo existe en el hueco de 21 días o más.

## Capturas

`capturas/` tiene 17 pantallas por idioma a 390 por 844 (P3 primer pintado y con "Mandar" abierto, P4 en sus tres estados, P5, P6 en sus cuatro huecos, P3 de Sleep de noche, P7 con "En tus manos." y con la mesa, P1, P8, "Mi lugar" y el registro). Las generó Playwright con Chromium y sin errores de consola.

## Para la prueba de N

Abre ES en el teléfono, piensa en una persona real, escribe siete palabras en P2 y recorre P3. Anota: si pesó "pasar" y "yo pongo"; si "Contestar" antes de reenviar suena natural (`?de=par&t=una-linea`); y si el regreso de P6 (`?hueco=3`) suena a reproche o a que alguien espera.
