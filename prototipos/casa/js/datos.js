/* Datos de la casa (prototipo, v3: un solo piso). Paletas: 13-v2.7/casa/lib/paletas.json. Shorts: 13-v2.7/casa/dias/*.
 * Texto: inglés (la voz del sitio). Todo lo marcado [N] lo escribe N; el resto es borrador del equipo. */
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

  /* orden del recorrido: alrededor del patio, empezando por la cocina */
  var orden = ["cocina", "alcoba", "escaleras", "ventana", "puerta", "mesa", "patio"];

  var cuartos = {
    cocina: {
      nombre: "Kitchen", palabra: "Eat", linea: "Pot starts boiling.", pal: "cocina",
      que: "The kitchen is where hunger, hurry and habit meet.",
      porque: "It is open to the courtyard because eating is the first thing the body asks for, and the first thing a day makes it skip.",
      conducta: "In the kitchen: when the pot boils, I ______.",
      biblioteca: [
        v("c1-lun-v5", "The pot boils over. I looked away.", "Things boil over at home when ______."),
        v("c2-cuerpo-v5", "A message lands. My jaw locks.", "My jaw locks when ______."),
        im("c3-cocina", "The last plate is clean.", "In the kitchen: when the last plate is clean, I ______.")
      ]
    },
    alcoba: {
      nombre: "Bedroom", palabra: "Sleep", linea: "The house goes quiet.", pal: "alcoba",
      que: "The bedroom is where the day is put down.",
      porque: "It sits at the far side of the courtyard, away from the door, so what the day left can be set down slowly.",
      conducta: "In the bedroom: when the house goes quiet, I ______.",
      biblioteca: [
        v("c1-mar", "The house goes quiet.", "In the bedroom: when the house goes quiet, I ______."),
        v("c6-pregunta", "Scrolling at 1 a.m.?", "In the bedroom: when the lamp goes off, I ______."),
        im("c3-alcoba", "Quiet at ten.", "In the bedroom: when the house goes quiet at ten, I ______.")
      ]
    },
    escaleras: {
      nombre: "Stairs", palabra: "Move", linea: "Keys hit the bowl.", pal: "escaleras",
      que: "The stairs are the way between rooms. Every step is a small movement.",
      porque: "They run along the wall so that moving is part of the house, not a separate errand.",
      conducta: "On the stairs: when the keys land, I ______.",
      biblioteca: [ v("c1-mie", "Keys hit the bowl.", "On the stairs: when the keys land, I ______.") ]
    },
    ventana: {
      nombre: "Windows", palabra: "The divine", linea: "Still dark outside.", pal: "ventana",
      que: "The windows are open: shutters back, the sky in the frame. Shown, not explained.",
      porque: "Every room has one, so that looking out, and then up, is never far.",
      conducta: "At the window: when it is still dark, I ______.",
      biblioteca: [
        v("c1-vie-v5", "The house is still quiet.", "My quiet ends when ______."),
        v("c5-ventana", "Still dark. Phone face down.", "At the window: when the phone is still face down, I ______.")
      ]
    },
    puerta: {
      nombre: "Door", palabra: "Arrive", linea: "Keys go in.", pal: "puerta",
      que: "The door is who comes in, and how.",
      porque: "The entry hall is long and has a rug, so that arriving takes a moment before the courtyard.",
      conducta: "At the front door: when the keys go in, I ______.",
      biblioteca: [ im("c3-puerta", "Keys go in.", "At the front door: when the keys go in, I ______.") ]
    },
    mesa: {
      nombre: "Table", palabra: "Gather", linea: "Someone asks how I am.", pal: "mesa",
      que: "The table is where the house talks.",
      porque: "Chairs on every side, cups in the middle: nobody sits at the head.",
      conducta: "At the table: when someone asks how I am, I ______.",
      biblioteca: [
        v("c1-jue", "Someone asks how I am.", "At the table: when someone asks how I am, I ______."),
        v("c4-palabra", "My one true word.", "At the table: when someone asks how I am, my one true word is ______.")
      ]
    },
    patio: {
      nombre: "Courtyard", palabra: "The divine", linea: "No roof. Every room opens here.", pal: "patio",
      que: "The courtyard has no roof. Every room opens onto it. At its blue center, Cella and a few people are gathered.",
      porque: "The house is built around it, so the center is never more than a few steps away.",
      conducta: null,
      biblioteca: [
        v("c1-vie-v5", "The house is still quiet.", "My quiet ends when ______."),
        v("c5-ventana", "Still dark. Phone face down.", "At the window: when the phone is still face down, I ______.")
      ],
      faltan: "Courtyard pieces of its own: on the way."
    }
  };

  return { P: P, cuartos: cuartos, orden: orden, yt: "https://www.youtube.com/@Naos-v3" };
})();
