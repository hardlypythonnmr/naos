## 0 · Umbral {#top}

# Del chat al código

Tu chat de IA arranca casi vacío cada vez. Aquí va un paso pequeño y luego siete piezas, del 20 de octubre al 17 de noviembre.

Primera pieza: martes 20 de octubre, 09:00 hora de Nueva York (ET), 08:00 en Medellín.

Los videos y los Shorts están en inglés. Aquí tienes en español todo lo que dicen, con los prompts.

[Vienes de: {título del Short}]

## 1 · La pregunta {#the-question}

¿Por qué se olvida tu chat?

Cada chat arranca casi vacío. Si la memoria está activada, el chat nuevo trae algunos temas guardados de los anteriores. [1]
En una conversación larga se pueden perder detalles. La IA aprovecha peor lo que queda en la mitad de un texto largo, y algunos chats descartan lo más viejo. [4]
Una carpeta de proyecto funciona distinto. Guarda tus notas y cada paso fuera del chat, y un agente de código lee esas notas cada vez que arranca. [5]

Nuestro método · Documentación oficial · Estudio · Fuentes [1] [2] [3] [4] [5] [7] [8]

No tienes que aprender nada. Prueba un paso pequeño.

## 2 · Pruébalo {#try-it}

Unos dos minutos, según nuestra estimación. Escoge un proyecto que lleves en un chat: un viaje, un borrador, un plan.

1. **Pide un resumen para retomar.** Pega el prompt de abajo en ese chat.
2. **Léelo y llena los huecos.** Los hilos viejos se desdibujan, así que corrige lo que falte. [3]
3. **Guárdalo fuera del chat.** Una nota en el celular, un documento tuyo. La próxima vez, pégalo como primer mensaje de un chat nuevo.

Cuando un chat se alarga y el proyecto me importa, pido un resumen para retomar.

Eso es todo.

> Voy a seguir este proyecto en otro espacio de trabajo. Escríbeme un resumen para retomarlo allá.
> Pon la meta del proyecto, las decisiones que tomamos y las preguntas que siguen abiertas.
> Hazlo en viñetas cortas que yo pueda guardar en un archivo de notas.
> Deja por fuera contraseñas, claves y datos personales.

[Copiar el prompt]

*Míralo: un resumen para retomar, paso a paso (unos 15 segundos) (plegado)*
[Figura: aquí va la cosa viva "Un resumen para retomar, paso a paso", dentro de este plegado, después de los tres pasos; visuales/fig/viva.es.html]

*Cómo se puede ver un resumen (plegado)*

Meta: organizar la mudanza en diciembre.
Decisiones: el camión va el sábado 12; el sofá se regala.
Pendiente: quién recibe las llaves.

Nuestro método · Documentación oficial [3] [11] [12]

Si alguna clave estuvo en ese chat, desactiva la clave vieja en el sitio donde la creaste y crea una nueva. [11] [12] El 16 de octubre de 2026, Claude corrió una vez este prompt y los otros siete, y guardamos el registro. Todavía no los prueba alguien que nunca haya programado.

*Otras formas de dar este paso (plegado)* {#on-your-own}

Sin pagar: este paso solo necesita un chat que ya uses. Ninguna empresa pagó por aparecer en esta página.

A solas, léelo en voz alta; donde te trabes, a las notas les falta algo. Con alguien, pregúntale si podría seguir el proyecto a partir de ahí.

## 3 · El mapa {#map}

*Mira el mapa: de un chat a un proyecto que recuerda (plegado)*
[Figura: aquí va visuales/fig/mapa.es.html, dentro de este plegado. Con ?src= el plegado sigue cerrado: el bloque 0 ya dice de dónde vienes, y el nodo se ilumina cuando se abre el mapa.]

Título del mapa: De un chat a un proyecto que recuerda

Nodos (2 a 5 palabras, por fecha):
- Mar 20 oct · Las seis partes, en un video
- Mié 21 oct · Por qué se olvida el chat
- Vie 23 oct · Lo que necesitas
- Dom 25 oct · El primer prompt
- Jue 29 oct · Un archivo de memoria
- Sáb 7 nov · Tu primera tarea de verdad
- Mar 17 nov · Reglas de la casa y deshacer

Alt: Mapa de esta página: siete piezas en una sola escalera, desde el video completo del 20 de octubre hasta las reglas de la casa y deshacer el 17 de noviembre.
Qué muestra: Cada peldaño es una pieza, en orden de fecha, desde un chat que se olvida hasta un proyecto con casa, notas, un lugar seguro para probar y una forma de volver atrás. La pieza de la que vienes se ilumina.
Versión en texto: la lista de arriba y las piezas de la sección 5.

## 4 · De dónde sale esto {#where-this-comes-from}

(Plegado. Se abre al tocar.)

Aquí nos guía la gente que escribe la documentación y las guías de estas herramientas. Partimos de sus páginas y cruzamos cada afirmación con otras. Ninguna empresa pagó por aparecer en esta página y no ganamos nada si te registras. Hacemos NAOS con Claude.

[Figura: aquí va visuales/fig/flujo.es.html, dentro del plegado]

### El oficio

Nuestras guías son la documentación de Claude Code, el Centro de ayuda de Claude, GitHub Docs, la documentación de Git, el libro Pro Git y el formato abierto AGENTS.md. Son de adentro del oficio. [1] [5] [6] [7] [8] [10] La guía de seguridad viene de OWASP, una comunidad abierta de seguridad de aplicaciones, y de Simon Willison, que escribe sobre herramientas de IA como practicante. [12] [13] [14] Sobre lo que hace un producto hoy, la página del fabricante es la mejor fuente que hay, y ninguna fuente independiente puede decir más. Por eso muchos datos de abajo llevan fecha: los leímos el 16 de octubre de 2026 y los volvemos a leer el día que sale cada pieza.

### Lo que dice la documentación hoy (16 de octubre de 2026)

- **Planes, GitHub y costo.** Están en la tarjeta del viernes 23 de octubre, más abajo. [15] [20] [21] [22]
- **Dónde corre.** En la app de escritorio, como sesión local o en la nube, y en el navegador. En la web el trabajo corre en una máquina virtual en la nube: clona tu repositorio y sube una rama a GitHub. En una sesión local corre en tu computadora. [16] [17]
- **Preguntar antes.** En modo manual, Claude Code pregunta antes de la mayoría de las acciones que editan archivos o corren comandos. En la terminal y en VS Code, desde la versión 2.1.283, se arranca en modo automático, donde un clasificador (un control automático) decide en tu lugar. Las sesiones en la nube no ofrecen el modo manual, y su modo de aceptar ediciones sube una rama a GitHub sin detenerse a pedir aprobación. La documentación de escritorio no dice con qué modo empieza una sesión local nueva. Mira el selector de modo y lee el plan antes de decir que sí. [18] [16] [17]
- **Archivos de notas.** Claude lee su archivo de notas, CLAUDE.md, al empezar cada sesión. Anthropic sugiere no pasar de unas 200 líneas por archivo, porque los archivos más largos gastan más contexto y se cumplen peor. Claude toma el archivo como "context, not enforced configuration" (contexto, y no una configuración que se haga cumplir; traducción nuestra). Para bloquear una acción pase lo que pase, sirve una regla de permisos o un hook (un pequeño programa que corre en momentos fijos). [5] Otras herramientas usan un archivo parecido con otro nombre. AGENTS.md es un formato abierto que hoy administra la Agentic AI Foundation, dentro de la Linux Foundation, y Claude Code lo lee cuando no hay CLAUDE.md (versión 2.1.277 o posterior). [5] [6]
- **Pasos guardados.** Un punto de control (un commit de Git) guarda una instantánea del proyecto con la que puedes comparar o a la que puedes volver. [7] Un archivo .gitignore deja por fuera los archivos nuevos. No afecta a los que Git ya sigue, así que una clave que ya se guardó sigue en el historial. [10] En esta página, "punto de control" quiere decir commit. Claude Code tiene además su propia función de rebobinar, para deshacer rápido dentro de una sesión. No sigue los archivos que cambian los comandos de terminal (borrar, mover, copiar), y la documentación dice que "no reemplaza al control de versiones" (traducción nuestra). [19]
- **Una clave que llegó a GitHub.** GitHub dice que lo primero es revocarla o rotarla. Los commits pueden seguir accesibles en copias de otras personas (forks y clones) y en vistas en caché, y reescribir el historial no basta. [11]
- **Ramas.** Una rama es un espacio aparte para trabajar. La versión principal queda como estaba hasta que decidas unirlas. [9]

### Lo que dicen los estudios

- **Texto largo.** En un estudio publicado en TACL, los modelos de lenguaje rindieron mejor cuando la información relevante estaba al principio o al final de la entrada, y peor cuando estaba en el medio. [4] La documentación de Anthropic le llama a este efecto "context rot" (algo así como "deterioro del contexto"): entre más largo el texto, peor lo aprovecha el modelo. [3]
- **Código escrito con un asistente de IA.** En un estudio con 47 personas y cinco tareas de programación sobre seguridad, quienes usaron un asistente escribieron código significativamente menos seguro y tuvieron más confianza en que era seguro. Quienes confiaban menos en la IA y reformulaban más sus pedidos cometieron menos errores. El asistente era un modelo de 2022; tómalo como una razón para revisar antes de decir que sí. [25]
- **Archivos de notas.** Un equipo probó archivos de contexto en repositorios de código. En general no mejoraron el éxito de las tareas y subieron más de 20 % en promedio lo que cuesta poner a trabajar a los agentes. Los agentes sí siguieron las instrucciones, y los archivos ayudaron con prácticas de código poco comunes. El artículo va en su tercera versión, del 29 de septiembre de 2026. [24] Probaron repositorios de programadores. No conocemos un estudio sobre un archivo de notas para alguien que viene de un chat.
- **Los asistentes se equivocan con los datos.** En un estudio de respuestas de IA sobre noticias, casi la mitad tuvo al menos un problema significativo: 45 % según el conteo de VRT del estudio de la Unión Europea de Radiodifusión, octubre de 2025. [26] En marzo de 2025, el Tow Center probó ocho buscadores con IA, y más de 60 % de sus respuestas sobre la fuente de un pasaje de prensa fue incorrecta. [27] Son preguntas de noticias, y no las estiramos a precios ni a software. Pedir la página oficial y un enlace, y abrirlo tú, es nuestro método.

### Dónde no coinciden

**Archivos de notas.** Anthropic recomienda escribirlos, y a la vez dice que Claude los toma como "context, not enforced configuration". [5] Gloaguen y colegas no hallaron una mejora general en el éxito de las tareas, y sí un costo de más de 20 % en promedio. [24] Miden cosas distintas: repositorios de programadores frente a un archivo de notas personal. Por eso no te decimos que esto te va a ayudar.

**Memoria entre chats.** Los fabricantes la describen con nombres y ajustes distintos, por chat o por proyecto, y la página de ayuda de OpenAI no abrió para nosotros. Decimos solo que algunos chats guardan notas. [1] [2]

**Qué puede una regla.** Simon Willison, sobre la inyección de prompts: "we still don't know how to 100% reliably prevent this" (todavía no sabemos cómo evitarlo con total seguridad; traducción nuestra). Su consejo es evitar la combinación de datos privados, contenido no confiable y una forma de enviar datos hacia afuera. [14] OWASP pide que el cumplimiento de las reglas quede fuera del modelo y que una persona apruebe las acciones de alto impacto. [13]

### Nuestro experimento

- Los ocho prompts son nuestros. El 16 de octubre de 2026, Claude corrió cada uno una vez, en inglés y en español, en sesiones nuevas de Claude Code (versión 2.1.301, modelo Claude Sonnet 5.5) sobre un proyecto de práctica vacío, y guardamos el registro. Cada uno hizo lo que su tarjeta dice que pide. En el primer prompt explicó su plan y esperó el visto bueno, en un modo que lo dejaba editar sin preguntar. Dos cosas para tener en cuenta: el resumen salió más largo de lo pedido, con una parte de ideas todavía sin decidir, y después de escribir CLAUDE.md no guardó un punto de control hasta una sesión posterior. En esta corrida, GitHub fue una copia en la misma computadora, así que no entraron una cuenta real de GitHub, la app de GitHub de Claude, la app de escritorio ni el navegador. Todavía no prueba los prompts alguien que nunca haya programado.
- Los tiempos son estimaciones nuestras para una persona: unos dos minutos para el resumen, unos veinte para la preparación, de dos a cinco minutos para la primera tarea, de cinco a quince para una tarea real pequeña. En la corrida, cada respuesta de Claude tomó de 7 a 34 segundos, sin contar lo que una persona tarda en leer.
- Un archivo de notas corto puede ayudarte a retomar donde quedaste. Es nuestro experimento. El estudio más cercano, sobre repositorios de código, no lo respalda en éxito ni en costo.
- Pedirle a la IA que liste cada archivo que cambió y por qué, y decir que sí solo cuando quede claro, es nuestro método. OWASP pide aprobación humana antes de las acciones de alto impacto, y el estudio de arriba es una razón para leer antes de aprobar. [13] [25]

## 5 · Las piezas {#pieces}

Las horas son de Nueva York (ET), con Medellín entre paréntesis. Los videos, los Shorts y los Reels están en inglés.

**Mar 20 oct · 09:00 ET (08:00) · Video · Próximamente** {#c-2026-10-20-0900-p-medio}
Del chat al código
Toda la serie en un video: por qué se olvida un chat, qué necesitas y los prompts para pegar. Seis partes, cada una un Short.
Nuestro método · Documentación oficial [1] [5] [15] · En inglés: From chat to code · Voz: sintética

*Más sobre esta pieza (plegado)*

Empieza por el resumen para retomar de la sección 2. Los planes, los modos y los límites cambian con cada versión, así que el 20 de octubre volvemos a leer sus páginas.

**Mié 21 oct · 18:00 ET (17:00) · Short y Reel · Próximamente** {#c-2026-10-21-1800-p-short-reel}
Por qué se olvida el chat
Un chat arranca casi vacío y los hilos largos se desdibujan. Una carpeta de proyecto guarda lo que decidiste. El prompt le pide a tu chat un resumen para retomar.
Nuestro método · Documentación oficial · Estudio [1] [3] [4] [5] · En inglés: Why the chat forgets · Voz: sintética · naos/s/1021p

*Más sobre esta pieza (plegado)*

El prompt es el de "Pruébalo", arriba. Le pide una lista corta: la meta, las decisiones, las preguntas abiertas. Guarda la respuesta en un lugar seguro, porque el archivo de memoria del 29 de octubre la usa.
Si una clave o una contraseña estuvo alguna vez en ese chat, déjala por fuera del resumen y cambia la clave. [12]

**Vie 23 oct · 18:00 ET (17:00) · Short y Reel · Próximamente** {#c-2026-10-23-1800-p-short-reel}
Lo que necesitas
Tres cosas para empezar, y dos no cuestan nada: un plan de IA con un agente de código, una cuenta gratis de GitHub y un repositorio privado vacío.
Nuestro método · Documentación oficial [15] [16] [17] [21] · En inglés: What you need · Voz: sintética · naos/s/1023p

*Más sobre esta pieza (plegado)*

Nuestro ejemplo es Claude Code. Viene con los planes de pago de Claude, Pro y Max, dentro de la misma suscripción que las apps de Claude, y los límites se comparten. Funciona en una app de escritorio o en el navegador. [15] [16] La preparación toma unos veinte minutos, una sola vez, según nuestra estimación; a ti te puede tomar distinto.
Una cuenta gratis de GitHub incluye repositorios privados ilimitados, con funciones limitadas. [21] Crea un repositorio privado vacío. Es la caja donde vive tu proyecto. Si conectas desde el navegador, un repositorio privado necesita la app de GitHub de Claude. Dale a la app solo tu repositorio de práctica. Ese acceso te lo puedes quitar después en la configuración de GitHub: suspender la app, desinstalarla o desautorizarla. [17] [22]
Los agentes pueden gastar tus límites más rápido que el chat. La guía de presupuesto de Anthropic para equipos dice que una sola sesión de depuración puede consumir más que un día de chat. [20]
Ninguna empresa pagó por aparecer en esta página y no ganamos nada si te registras.
Si no sabes qué plan escoger, pídele a tu chat los precios de hoy, sacados de las páginas oficiales, y abre tú esas páginas:

> Quiero probar un agente de IA para programar, en un proyecto personal pequeño. Nunca he usado una terminal.
> Dime en palabras sencillas qué necesito para registrarme y cuánto cuesta hoy.
> Usa solo las páginas oficiales de precios y dame los enlaces.
> Dime también qué no debería pagar todavía.

[Copiar el prompt]

Los asistentes se equivocan con los datos. En un estudio de noticias, casi la mitad de las respuestas de IA tuvo un problema significativo. [26]
Sin pagar: GitHub Copilot Free incluye el modo agente en el editor de código, con límites mensuales: 2.000 autocompletados y una cuota de créditos de IA. [23] Es un ejemplo, y los planes cambian, así que lee la página del plan el día que empieces.

**Dom 25 oct · 18:00 ET (17:00) · Short y Reel · Próximamente** {#c-2026-10-25-1800-p-short-reel}
El primer prompt
Un prompt que le pide a la IA explicar su plan y esperar tu visto bueno, escribir un README, crear un .gitignore, guardar un primer punto de control y contarte qué hizo.
Nuestro método · Documentación oficial [10] [17] [18] [19] · En inglés: The first prompt · Voz: sintética · naos/s/1025p

*Más sobre esta pieza (plegado)*

Si puedes, empieza con una sesión en la nube: trabaja en una máquina virtual aparte, sobre el repositorio que escojas, lejos de los archivos de tu computadora. [17] Abre Claude Code en tu repositorio de práctica y pega esto:

> Soy principiante con las herramientas de programación. Prepárame este proyecto, por favor.
> 1. Explícame tu plan en palabras sencillas y espera mi visto bueno.
> 2. Escribe un README corto que diga de qué trata este proyecto.
> 3. Crea un .gitignore que deje por fuera contraseñas, claves y archivos .env.
> 4. Guarda un primer punto de control (un commit) y envíalo a GitHub.
> 5. Cuéntame en un párrafo qué hiciste y qué debo revisar.
> Regla: pregunta antes de instalar, borrar o tocar algo fuera de esta carpeta.

[Copiar el prompt]

Toma de dos a cinco minutos, según nuestra estimación. Pide dos archivos nuevos, README y .gitignore. Si algo falla, pega el error y pregunta qué significa.
Algunos modos preguntan en cada paso y otros no, así que lee primero el plan. El "espera mi visto bueno" del prompt es un pedido; quien decide es el selector de modo. Los detalles están en la sección 4, en "Preguntar antes". [18]
Si dijiste que sí a un paso que no entendías, pregunta: "¿Qué hizo eso y se puede deshacer? Muéstrame primero y espera mi visto bueno". Lo que hace posible deshacer es el primer punto de control guardado. [19]

**Jue 29 oct · 18:00 ET (17:00) · Short y Reel · Próximamente** {#c-2026-10-29-1800-p-short-reel}
Un archivo de memoria
Un archivo de notas corto que tu IA lee al empezar cada sesión. Nuestro experimento: puede ayudarte a retomar donde quedaste.
Nuestro método · Nuestro experimento · Documentación oficial [5] [6] [24] · En inglés: A memory file · Voz: sintética · naos/s/1029p

*Más sobre esta pieza (plegado)*

No conocemos un estudio que muestre que un archivo de notas le sirve a todo el mundo. El más cercano, sobre repositorios de código, no halló una mejora general. [24]
¿Te acuerdas del resumen del 21 de octubre? Va aquí. Pega esto una sola vez:

> Crea un archivo llamado CLAUDE.md para este proyecto, con cuatro secciones:
> De qué trata el proyecto (dos líneas). Cómo trabajamos. Decisiones hasta ahora. Para la próxima vez.
> Pon en Decisiones el resumen para retomar que me dio mi chat anterior.
> Al final de cada sesión, actualízalo, muéstrame qué cambió y guarda un punto de control.

[Copiar el prompt]

Y empieza cada sesión con una sola línea:

> Lee CLAUDE.md y dime en qué quedamos.

[Copiar el prompt]

Otras herramientas tienen un archivo de notas parecido con otro nombre. Si el archivo pasa de unas 200 líneas, pide una limpieza. Las notas cortas rinden más. [5] [6]
Si después de escribir el archivo no guarda un punto de control, pídeselo. Las notas viejas o equivocadas orientan mal cada sesión nueva, así que léelo de vez en cuando. Si las notas se dañan, pídele a la IA que restaure la versión anterior. Eso funciona si la sesión terminó con un punto de control.
Hoy también: GitHub Universe, en San Francisco, 28 y 29 de octubre, con pase virtual gratis. [28]

**Sáb 7 nov · 18:00 ET (18:00) · Short y Reel · Próximamente** {#c-2026-11-07-1800-p-short-reel}
Tu primera tarea de verdad
Escoge algo pequeño y real. El prompt le pide a la IA trabajar en su propia rama, listar cada archivo que cambió y por qué, y esperar tu visto bueno antes de unir nada a la versión principal.
Nuestro método · Documentación oficial · Estudio [9] [13] [17] [25] · En inglés: Your first real task · Voz: sintética · naos/s/1107p

*Más sobre esta pieza (plegado)*

Cambia la tarea por la tuya:

> Tarea pequeña: hacer una lista semanal de una sola página que pueda abrir en el navegador.
> Trabaja en una rama nueva, no en la versión principal.
> Hazlo pequeño. Nada de herramientas nuevas sin preguntarme.
> Cuando termines, lista cada archivo que cambiaste y por qué, en palabras sencillas.
> Dime todo lo que cambiaste sin que yo lo pidiera.
> Espera mi visto bueno antes de unirlo a la versión principal.

[Copiar el prompt]

Un agente de código planea, escribe, corre pruebas y revisa su trabajo, y a veces corrige su propio error. Le va mejor cuando tiene cómo comprobar, como una prueba. [17] [20]
Una tarea pequeña toma de cinco a quince minutos, según nuestra estimación.
Pide cada archivo que cambió y por qué, y di que sí solo cuando quede claro. OWASP pide que una persona apruebe las acciones de alto impacto antes de que ocurran. [13] En un estudio, quienes usaron un asistente de IA escribieron código menos seguro y se sintieron más seguros de que estaba bien. Lee antes de decir que sí. [25]
Si no te gusta el resultado, escribe: "Muéstrame qué cambió esta rama y espera mi visto bueno. Después descártala y vuelve a la principal".

**Mar 17 nov · 18:00 ET (18:00) · Short y Reel · Próximamente** {#c-2026-11-17-1800-p-short-reel}
Reglas de la casa y deshacer
Cinco reglas de la casa que le das a tu IA una sola vez, y una frase que le pide dejar el proyecto como estaba en el último punto de control.
Nuestro método · Documentación oficial [11] [13] [19] · En inglés: Guardrails and undo · Voz: sintética · naos/s/1117p

*Más sobre esta pieza (plegado)*

Pega estas reglas una sola vez:

> Agrega estas reglas de la casa a CLAUDE.md y síguelas en cada sesión:
> 1. Nunca me pidas pegar contraseñas ni claves de API en el chat.
> 2. Nunca pongas secretos en archivos que se guardan en GitHub.
> 3. Pregunta antes de instalar, borrar o enviar algo a GitHub.
> 4. Mantén este repositorio privado.
> 5. Si tienes dudas, detente y pregunta.

[Copiar el prompt]

Y para cuando algo sale mal:

> Algo salió mal. Deja el proyecto como estaba en el último punto de control.
> Antes muéstrame qué vas a deshacer y espera mi visto bueno.
> Después cuéntame en palabras sencillas qué deshiciste.

[Copiar el prompt]

Las reglas siguen dos ideas de la guía de seguridad: darle a una herramienta el menor acceso que necesite, y pedir que una persona apruebe las acciones de alto impacto. Esa coincidencia es lectura nuestra. [13]
La IA toma las reglas como pedidos y puede que no las cumpla siempre. Lo que bloquea una acción con seguridad es una regla de permisos o un hook. [5]
Deshacer funciona si había un paso guardado antes del malo, así que practícalo antes de necesitarlo. La función de rebobinar de Claude Code no sigue los archivos que cambian los comandos de terminal. [19]
Deshacer no arregla una clave que ya llegó a GitHub o a un chat. Desactiva la clave vieja en el sitio donde la creaste, crea una nueva y después limpia los archivos. [11]
Esta semana también: Microsoft Ignite, en San Francisco, del 17 al 20 de noviembre. [29]

## 6 · Cuéntaselo a alguien {#tell-someone}

Cuéntale a alguien qué se le olvidó a tu chat y mándale esta página.

[Enviar esto]

La frase que te llevas: Habla en el chat. Guarda lo que decidiste en otro lugar.

## 7 · Una cosa más {#one-more-thing}

Lo que sigue: {próxima pieza, día y hora ET}. Por defecto: mar 20 oct, 09:00 ET (08:00 en Medellín) · Del chat al código

Un paso lejos de la pantalla, en la mesa: Los teléfonos en la panera

## 8 · Fuentes {#sources}

Cada fuente con lo que dice. Para el oficio van primero las páginas de los fabricantes, luego los cruces, y decimos cuáles hablan desde adentro. Leídas el 16 de octubre de 2026. Las copias de archivo, donde hay una, van después de "Archivo". Los títulos quedan en su idioma original.

### El oficio

[1] Anthropic. Claude Help Center: Use Claude's chat search and memory to build on previous context. Oficial, desde adentro. Dice que la memoria viene activada por defecto en Free, Pro y Max y que cada proyecto tiene la suya. https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context · Archivo https://web.archive.org/web/20261015201716/https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context

[2] Willison, S. (21 de mayo de 2025). I really don't like ChatGPT's new memory dossier. Practicante. Respalda la descripción de la memoria de ChatGPT como un expediente de las conversaciones pasadas. https://simonwillison.net/2025/May/21/chatgpt-new-memory/ · Archivo https://web.archive.org/web/20261016023134/https://simonwillison.net/2025/May/21/chatgpt-new-memory/ · OpenAI Help Center, Memory FAQ: no abrió para nosotros, https://help.openai.com/en/articles/8590148-memory-faq

[3] Anthropic. Context windows. Oficial. Trae el nombre "context rot" y la nota de que algunos chats descartan lo más viejo de una conversación larga. https://platform.claude.com/docs/en/build-with-claude/context-windows · Archivo https://web.archive.org/web/20261016023115/https://platform.claude.com/docs/en/build-with-claude/context-windows

[4] Liu y otros (2024). Lost in the Middle: How Language Models Use Long Contexts. Transactions of the Association for Computational Linguistics. Estudio, fuerte en lo que midió: los modelos rindieron mejor con la información relevante al principio o al final. https://doi.org/10.1162/tacl_a_00638

[5] Anthropic. Claude Code docs: How Claude remembers your project. Oficial, desde adentro. Explica que cada sesión arranca de cero, y trae CLAUDE.md, la sugerencia de 200 líneas y "context, not enforced configuration". https://code.claude.com/docs/en/memory · Archivo https://web.archive.org/web/20261016022453/https://code.claude.com/docs/en/memory

[6] AGENTS.md. Formato abierto para orientar a los agentes de código, administrado por la Agentic AI Foundation dentro de la Linux Foundation. Las herramientas que lista se declaran solas. https://agents.md/

[7] Chacon, S. y Straub, B. Pro Git (edición en español). Fundamentos de Git: Guardando cambios en el Repositorio. Libro, desde adentro. Dice que cada commit guarda una instantánea con la que se puede comparar o a la que se puede volver. https://git-scm.com/book/es/v2/Fundamentos-de-Git-Guardando-cambios-en-el-Repositorio

[8] GitHub Docs. About repositories. Oficial. Dice que un repositorio guarda tu código, tus archivos y el historial de revisiones de cada uno, y quién puede ver uno privado. https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories

[9] Chacon, S. y Straub, B. Pro Git: Branches in a Nutshell. Libro, desde adentro. https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell · Archivo https://web.archive.org/web/20261016023214/https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell · GitHub Docs, Branches (sección "About branches"), oficial; dice que las ramas permiten trabajar o experimentar en un área aparte: https://docs.github.com/en/pull-requests/reference/branches · Archivo https://web.archive.org/web/20261016023256/https://docs.github.com/en/pull-requests/reference/branches

[10] Documentación de Git: gitignore. Oficial, desde adentro. Dice que los archivos que Git ya sigue no se ven afectados. https://git-scm.com/docs/gitignore · Archivo https://web.archive.org/web/20261016022520/https://git-scm.com/docs/gitignore · GitHub Docs, Ignoring files: https://docs.github.com/en/get-started/git-basics/ignoring-files

[11] GitHub Docs. Removing sensitive data from a repository. Oficial. Dice "revoke and/or rotate" como primer paso, y que los commits pueden seguir accesibles en otros lugares. https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

### Guías de seguridad

[12] OWASP GenAI Security Project. LLM02:2025 Sensitive Information Disclosure. Guía de la comunidad. Pide cuidado con lo que se ingresa y cuenta las credenciales entre los datos sensibles. La frase "contraseñas en un chat" es nuestra. https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/

[13] OWASP GenAI Security Project. LLM06:2025 Excessive Agency. Guía de la comunidad. Pide el menor privilegio, el cumplimiento de reglas fuera del modelo y la aprobación humana de las acciones de alto impacto. https://genai.owasp.org/llmrisk/llm062025-excessive-agency/

[14] Willison, S. (16 de junio de 2025). The lethal trifecta for AI agents: private data, untrusted content, and external communication. Practicante. Trata de la inyección de prompts; no habla de archivos de notas. https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ · Archivo https://web.archive.org/web/20261016023142/https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/

### Planes, nube y permisos

[15] Anthropic. Claude Help Center: Use Claude Code with your Pro or Max plan. Oficial. Respalda los límites compartidos. https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan · Archivo https://web.archive.org/web/20261015162959/https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan

[16] Anthropic. Claude Code docs: Desktop application. Oficial. Respalda las sesiones locales y en la nube de la app de escritorio. https://code.claude.com/docs/en/desktop · Archivo https://web.archive.org/web/20261016023043/https://code.claude.com/docs/en/desktop

[17] Anthropic. Claude Code docs: Get started with Claude Code in the cloud. Oficial. Respalda el requisito de GitHub, la máquina virtual y la rama que se sube a GitHub. https://code.claude.com/docs/en/web-quickstart · Archivo https://web.archive.org/web/20261016023055/https://code.claude.com/docs/en/web-quickstart

[18] Anthropic. Claude Code docs: Choose a permission mode. Oficial, fechada en la versión 2.1.283. https://code.claude.com/docs/en/permission-modes · Archivo https://web.archive.org/web/20261016023036/https://code.claude.com/docs/en/permission-modes

[19] Anthropic. Claude Code docs: Checkpointing. Oficial. Dice que la función de rebobinar no sigue los archivos que cambian los comandos de terminal. https://code.claude.com/docs/en/checkpointing · Archivo https://web.archive.org/web/20261016023055/https://code.claude.com/docs/en/checkpointing

[20] Anthropic. Claude Code docs: Manage costs effectively. Oficial; su sección de presupuesto está escrita para equipos. https://code.claude.com/docs/en/costs · Archivo https://web.archive.org/web/20261016023056/https://code.claude.com/docs/en/costs

[21] GitHub Docs. GitHub's plans. Oficial. Respalda los repositorios privados ilimitados del plan gratis, con funciones limitadas. https://docs.github.com/en/get-started/learning-about-github/githubs-plans · Precios de GitHub: https://github.com/pricing

[22] GitHub Docs. Reviewing and modifying installed GitHub Apps. Oficial. Explica el acceso por repositorio y cómo suspender, desinstalar o desautorizar la app. https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps

[23] GitHub Docs. Plans for GitHub Copilot. Oficial. Respalda el modo agente y los límites mensuales del plan gratis. https://docs.github.com/en/copilot/get-started/plans

### Estudios y conteos

[24] Gloaguen y otros (2026). Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents? arXiv 2602.11988, versión 3, 29 de septiembre de 2026. Preprint, CC BY 4.0. Solo repositorios de código. https://arxiv.org/abs/2602.11988 · Archivo https://web.archive.org/web/20261001113623/https://arxiv.org/abs/2602.11988

[25] Perry, Srivastava, Kumar y Boneh (2023). Do Users Write More Insecure Code with AI Assistants? ACM Conference on Computer and Communications Security. Estudio, moderado: 47 personas, un asistente de 2022. https://doi.org/10.1145/3576915.3623157

[26] Unión Europea de Radiodifusión (EBU) y BBC (21 de octubre de 2025). News Integrity in AI Assistants. Página oficial del informe; dice "almost half". https://www.ebu.ch/research/open/report/news-integrity-in-ai-assistants · VRT, para la EBU (22 de octubre de 2025), comunicado de un miembro de la Unión; de aquí sale el 45 %: https://communication.vrt.be/largest-study-of-its-kind-shows-ai-assistants-misrepresent-news-content-45-of-the-time-regardless-of-language-or-territory

[27] Tow Center for Digital Journalism, Columbia (6 de marzo de 2025). AI Search Has a Citation Problem. Columbia Journalism Review. Centro universitario, sin revisión de pares. https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php

### Fechas de eventos

[28] GitHub Blog (4 de junio de 2026). GitHub Universe is back: All together now, in the agentic era. Oficial. https://github.blog/news-insights/company-news/github-universe-is-back-all-together-now-in-the-agentic-era/ · GitHub Universe: https://githubuniverse.com/

[29] Moscone Center. Microsoft Ignite 2026. Ficha del recinto, del 17 al 20 de noviembre de 2026. https://www.moscone.com/events/microsoft-ignite-2026 · Archivo https://web.archive.org/web/20261016083853/https://www.moscone.com/events/microsoft-ignite-2026 · Blog de Kurt Shintaku (27 de junio de 2026): https://kurtsh.com/2026/06/27/event-microsoft-ignite-2026-san-francisco-ca-november-17-20-2026-registration-is-now-open/ · UC Today, Microsoft Ignite 2026 Returns to San Francisco, But Not Everyone's Thrilled: https://uctoday.com/microsoft-ignite-2026-returns-to-san-francisco-but-not-everyones-thrilled · Archivo https://web.archive.org/web/20261016023554/https://uctoday.com/microsoft-ignite-2026-returns-to-san-francisco-but-not-everyones-thrilled

### Líneas de ayuda

[30] Colombia: Ministerio de Salud, línea 106, gratis, confidencial, 24/7: https://minsalud.gov.co/salud/publica/salud-mental/Paginas/linea-106.aspx · Colombia, 123 si hay peligro inmediato: Find A Helpline, Colombia helplines and hotlines (su botón de emergencia marca el 123): https://findahelpline.com/countries/co · EE. UU.: 988 Lifeline: https://988lifeline.org/get-help/ · En cualquier otro lugar: https://findahelpline.com

### Cómo revisamos esta página

El 16 de octubre de 2026 abrimos las fuentes que pudimos y revisamos cada artículo por retractaciones (ninguna). Ese mismo día Claude corrió una vez los ocho prompts en cada idioma, y guardamos el registro. Donde una página no abrió, lo decimos abajo y leímos la afirmación por una segunda fuente. Donde una cifra descansa en una sola fuente, la página lo dice. La mayoría de los datos de producto descansan en las páginas del propio fabricante, por eso llevan fecha.

### Lo que no pudimos confirmar

- Cómo le van los ocho prompts a alguien que nunca haya programado. Claude los corrió una vez, desde la línea de comandos, con una copia de GitHub en la misma computadora; nadie los ha corrido todavía en la app de escritorio, en el navegador ni con una cuenta real de GitHub.
- Los tiempos: unos dos minutos para el resumen, veinte para la preparación, de dos a cinco para la primera tarea, de cinco a quince para una pequeña. Son estimaciones nuestras y no hemos cronometrado a una persona.
- La página de ayuda de OpenAI sobre la memoria no abrió para nosotros (error 403). Describimos la memoria de ChatGPT solo por el relato de un practicante.
- Con qué modo empieza una sesión local nueva en la app de escritorio. La documentación no lo dice.
- Los modos de permisos y las reglas de los archivos de notas están atados a las versiones 2.1.283 y 2.1.277 de Claude Code. Cambian, y las volvemos a leer el 20 de octubre.
- Los planes y los límites gratis cambian. No leímos la cuota mensual exacta de créditos del plan gratis de Copilot.
- La página propia de Microsoft Ignite no mostraba fechas cuando la leímos. Las fechas salen de la ficha del recinto y de un blog.
- Si un archivo de notas le sirve a quien no programa. No encontramos un estudio, ni tampoco una fuente independiente de practicantes.

Si contamos algo mal, cuéntanoslo. Correcciones bienvenidas.

Lo que hicimos con estas herramientas y lo que dejó cada paso: Hecho aquí

## Pie (fijo, en el mismo lugar en todas las páginas)

Si esto te pesa, habla con alguien ahora. Colombia: 106, línea nacional de salud mental, 24/7, o 123 si hay peligro inmediato. EE. UU.: 988 (marca 2 para español). En cualquier otro lugar: findahelpline.com. [30]

Más cerca de ti.

Come bien, duerme bien, muévete, ten una relación con lo divino y construye comunidad.

Las voces de las piezas de NAOS son sintéticas. Las respuestas de Cella a los comentarios se escriben con IA; una persona lee las difíciles. Las horas son de Nueva York (ET) y Medellín.
