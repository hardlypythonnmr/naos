/* datos.js · datos de Sleep del prototipo (A.3 y F.3 del brief). Todo inline: el archivo abre sin red.
 * FICHA es exactamente el JSON de la propuesta 6.1 (copiado por script, sin cambios). CONFIG, SEMANA y EMPUJONES
 * reproducen data/config.json, data/semana.json y data/empujones.json del brief; las fechas de EMPUJONES son de maqueta
 * (el generador real las saca de git). */
window.NAOS_DATOS = {
FICHA: {
  "id": "sleep-una-lampara",
  "puerta": "sleep",
  "nombre": {
    "en": "One lamp",
    "es": "Una lámpara"
  },
  "senal_fija": {
    "cuando": {
      "en": "Water stops:",
      "es": "Cierras la llave:"
    },
    "haz": {
      "en": "big light off, one lamp.",
      "es": "luz grande fuera, una lámpara."
    }
  },
  "voz_dice_igual": true,
  "dato_tarjeta_apertura": {
    "en": "6 lights on. 10 p.m.",
    "es": "6 luces prendidas. 10 p.m."
  },
  "palabra_etiqueta": {
    "en": "lamp",
    "es": "lámpara"
  },
  "donde_pegarla": {
    "primaria": "junto-a-la-llave",
    "secundaria": "marco-puerta-cuarto",
    "tercera": "interruptor"
  },
  "cambia_respecto_de_hoy": {
    "es": "Antes: todas las luces prendidas hasta acostarte. Ahora: al cerrar la llave se apaga la grande y queda una lámpara.",
    "en": "Before: every light on until bed. Now: when the water stops the big light goes off and one lamp stays."
  },
  "lugar_validado": false,
  "para_que": {
    "en": "That's how the house says the day is over.",
    "es": "Así la casa avisa que el día terminó."
  },
  "permiso": {
    "en": "The rest, tomorrow.",
    "es": "Lo demás, mañana."
  },
  "minima": {
    "es": "Apagas solo la luz grande."
  },
  "plan_b": {
    "es": "Sin lámpara, dejas la luz del baño con la puerta entreabierta."
  },
  "cuando_no": [
    "turnos de noche",
    "escaleras o poca vista",
    "semanas durmiendo mal"
  ],
  "cuando_no_texto": {
    "es": "Si trabajas de noche o cuidas a alguien de noche, si ves poco o puedes caerte en un cuarto oscuro, deja la luz del pasillo. Si llevas semanas durmiendo mal, habla con un profesional.",
    "en": "If you work nights or care for someone at night, if you don't see well or could fall in a dark room, keep the hallway light on. If you've had weeks of bad sleep, talk to a professional."
  },
  "anclas": [
    {
      "texto": "cierro la llave",
      "tipo": "lugar"
    },
    {
      "texto": "pongo el celular a cargar",
      "tipo": "lugar"
    },
    {
      "texto": "me cepillo",
      "tipo": "lugar"
    }
  ],
  "pregunta_donde": {
    "en": "Which room are you in when it happens?",
    "es": "¿En qué cuarto estás cuando pasa?"
  },
  "cella_primer_comentario": {
    "en": "example from the video: when the water stops, one lamp. yours: when ___, ___ .",
    "es": "ejemplo del video: cuando se cierra la llave, una lámpara. el tuyo: cuando ___, ___ ."
  },
  "portador_por_tipo": {
    "lugar": "etiqueta-a-mano",
    "alarma": "nombre-de-alarma",
    "hora": "cita-de-calendario",
    "aparato": "etiqueta-en-borde"
  },
  "fuerza_por_tipo": {
    "lugar": "con-lugar",
    "alarma": "con-lugar",
    "hora": "cita",
    "aparato": "debil"
  },
  "fallos_previstos": [
    "el interruptor esta fuera del cuarto",
    "cuarto compartido",
    "sin lampara"
  ],
  "citas": {
    "primer_dia": false,
    "pregunta_7_y_28": false,
    "con_aviso": false,
    "hora_defecto": null,
    "franjas": [
      "manana",
      "mediodia",
      "tarde"
    ],
    "fragmento": "una-palabra",
    "primer_dia_existe": false
  },
  "ensayo_en_lugar": {
    "es": "Ve a tu interruptor. Señálalo y di tu frase en voz baja. Vuelve."
  },
  "pictograma": "lampara-pantalla-torcida",
  "escena": "cuarto-cama",
  "fuente": {
    "ids": [
      "f10-22",
      "f10-23",
      "f10-19"
    ],
    "tamano": "pequeño; las metas de luz son un consenso de expertos"
  },
  "tradicion": null,
  "revision_etica": "no-requerida",
  "version_hash": "sha256 del texto aprobado"
},
CONFIG: { enrutador: "apagado", cuando_prellenado: false, contador: "apagado", semana: "data/semana.json" },
SEMANA: {
  actual: { puerta: "sleep", nombre: { es: "Una lámpara", en: "One lamp" }, enlace: "?puerta=sleep&src=hoy" },
  siguiente: { dia: { es: "El jueves", en: "On Thursday" }, nombre: { es: "la taza", en: "the cup" } }
},
PUERTAS: [
  { id: "breathe", es: "Breathe", en: "Breathe" }, { id: "eat", es: "Eat", en: "Eat" }, { id: "sleep", es: "Sleep", en: "Sleep" },
  { id: "move", es: "Move", en: "Move" }, { id: "community", es: "Community", en: "Community" }, { id: "divine", es: "The Divine", en: "The Divine" }
]
};
