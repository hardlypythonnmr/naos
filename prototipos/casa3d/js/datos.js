/* Datos de la casa (prototipo). Paletas: 13-v2.7/casa/lib/paletas.json. Shorts: 13-v2.7/casa/dias/*.
 * Texto: inglés (la voz del sitio). Todo lo marcado N lo escribe N; "borrador" lo propone el equipo. */
window.CASA = (function () {
  "use strict";
  var P = {
    cocina:  { campo: "#F0BC6E", tinta: "#0E1116", placa: "#F4F6F8", luz: "#E9876A", agua: "#3E86B5" },
    alcoba:  { campo: "#A9B2EC", tinta: "#0E1116", placa: "#F4F6F8", luz: "#F6D365", agua: "#3E86B5" },
    escaleras: { campo: "#E9876A", tinta: "#0E1116", placa: "#F4F6F8", luz: "#F6D365", agua: "#3E86B5" },
    mesa:    { campo: "#EE9AA6", tinta: "#0E1116", placa: "#F4F6F8", luz: "#F6D365", agua: "#3E86B5" },
    puerta:  { campo: "#EE9AA6", tinta: "#0E1116", placa: "#F4F6F8", luz: "#F6D365", agua: "#3E86B5" },
    ventana: { campo: "#141A4A", tinta: "#F4F6F8", placa: "#0B0F2E", luz: "#F4F6F8", agua: "#7FB7D6", cuerpo: "#F0BC6E" }
  };
  P.patio = P.ventana;

  function v(id, titulo, tarjeta) { return { tipo: "video", id: id, titulo: titulo, tarjeta: tarjeta }; }
  function im(id, titulo, tarjeta) { return { tipo: "imagen", id: id, titulo: titulo, tarjeta: tarjeta }; }

  var cuartos = {
    cocina: {
      nombre: "Kitchen", palabra: "Eat", linea: "Pot starts boiling.", poster: "c1-lun-v5", pisos: ["ab"], pal: "cocina",
      que: "The kitchen is where hunger, hurry and habit meet.",
      relacion: "Interoception: hearing what the body says, in the middle of a task.",
      conducta: "In the kitchen: when the pot boils, I ______.",
      invitacion: "Small behaviors, one at a time.",
      biblioteca: [
        v("c1-lun-v5", "The pot boils over. I looked away.", "Things boil over at home when ______."),
        v("c2-cuerpo-v5", "A message lands. My jaw locks.", "My jaw locks when ______."),
        im("c3-cocina", "The last plate is clean.", "In the kitchen: when the last plate is clean, I ______.")
      ]
    },
    alcoba: {
      nombre: "Bedroom", palabra: "Sleep", linea: "The house goes quiet.", poster: "c1-mar", pisos: ["ar"], pal: "alcoba",
      que: "The bedroom is where the day is put down.",
      relacion: "Connection with oneself: staying with what the day left.",
      conducta: "In the bedroom: when the house goes quiet, I ______.",
      invitacion: "Small behaviors, one at a time.",
      biblioteca: [
        v("c1-mar", "The house goes quiet.", "In the bedroom: when the house goes quiet, I ______."),
        v("c6-pregunta", "Scrolling at 1 a.m.?", "In the bedroom: when the lamp goes off, I ______."),
        im("c3-alcoba", "Quiet at ten.", "In the bedroom: when the house goes quiet at ten, I ______.")
      ]
    },
    escaleras: {
      nombre: "Stairs", palabra: "Move", linea: "Keys hit the bowl.", poster: "c1-mie", pisos: ["ab", "ar"], pal: "escaleras",
      que: "The stairs are the way between rooms. Every step is a small movement.",
      relacion: "Autonomy: the pace is mine.",
      conducta: "On the stairs: when the keys land, I ______.",
      invitacion: "Small behaviors, one at a time.",
      biblioteca: [ v("c1-mie", "Keys hit the bowl.", "On the stairs: when the keys land, I ______.") ]
    },
    mesa: {
      nombre: "Table", palabra: "Gather", linea: "Someone asks how I am.", poster: "c1-jue", pisos: ["ab"], pal: "mesa",
      que: "The table is where the house talks.",
      relacion: "Authenticity: what is said at the table is what is meant.",
      conducta: "At the table: when someone asks how I am, I ______.",
      invitacion: "Small behaviors, one at a time.",
      biblioteca: [
        v("c1-jue", "Someone asks how I am.", "At the table: when someone asks how I am, I ______."),
        v("c4-palabra", "My one true word.", "At the table: when someone asks how I am, my one true word is ______.")
      ]
    },
    puerta: {
      nombre: "Door", palabra: "Arrive", linea: "Keys go in.", poster: "c3-puerta", pisos: ["ab"], pal: "puerta",
      que: "The door is who comes in, and how.",
      relacion: "Welcome: the first minute of any visit.",
      conducta: "At the front door: when the keys go in, I ______.",
      invitacion: "Small behaviors, one at a time.",
      biblioteca: [ im("c3-puerta", "Keys go in.", "At the front door: when the keys go in, I ______.") ]
    },
    ventana: {
      nombre: "Windows", palabra: "The divine", linea: "Still dark outside.", poster: "c1-vie-v5", pisos: ["ab", "ar"], pal: "ventana",
      que: "Every room has a window to the courtyard and the sky. Shown, not explained.",
      relacion: "Looking out, then up.",
      conducta: "At the window: when it's still dark, I ______.",
      invitacion: "Small behaviors, one at a time.",
      biblioteca: [
        v("c1-vie-v5", "The house is still quiet.", "My quiet ends when ______."),
        v("c5-ventana", "Still dark. Phone face down.", "At the window: when the phone is still face down, I ______.")
      ]
    },
    patio: {
      nombre: "Courtyard", palabra: "The divine", linea: "No roof. Every room opens here.", poster: "c1-vie-v5", pisos: ["ab", "ar"], pal: "patio",
      que: "The courtyard has no roof. Every room opens onto it.",
      relacion: "A pause under the open sky.",
      conducta: null,
      invitacion: "Quiet. Each tradition is named with its source.",
      biblioteca: [
        v("c1-vie-v5", "The house is still quiet.", "My quiet ends when ______."),
        v("c5-ventana", "Still dark. Phone face down.", "At the window: when the phone is still face down, I ______.")
      ],
      faltan: "Courtyard pieces of its own: on the way."
    }
  };

  /* Patio B: la mesa y el cielo (comunidad y the divine juntos) */
  var patioB = {
    nombre: "Courtyard", palabra: "Gather", linea: "A table under the sky.", poster: "c1-jue", pisos: ["ab", "ar"], pal: "patio",
    que: "The courtyard has no roof. The table stands in it, under the sky.",
    relacion: "Authenticity at the table, and a pause under the open sky.",
    conducta: "At the table: when someone asks how I am, I ______.",
    invitacion: "Small behaviors, one at a time.",
    biblioteca: [
      v("c1-jue", "Someone asks how I am.", "At the table: when someone asks how I am, I ______."),
      v("c4-palabra", "My one true word.", "At the table: when someone asks how I am, my one true word is ______."),
      v("c1-vie-v5", "The house is still quiet.", "My quiet ends when ______."),
      v("c5-ventana", "Still dark. Phone face down.", "At the window: when the phone is still face down, I ______.")
    ],
    faltan: "Courtyard pieces of its own: on the way."
  };

  return { P: P, cuartos: cuartos, patioB: patioB, yt: "https://www.youtube.com/@Naos-v3" };
})();
