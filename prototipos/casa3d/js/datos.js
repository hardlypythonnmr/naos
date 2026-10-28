/* Datos de la casa. Paletas: 13-v2.7/casa/lib/paletas.json. Shorts: 13-v2.7/casa/dias/*.
 * Texto: ingles (la voz del sitio), hecho con las palabras de N. */
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
      nombre: "Kitchen", palabra: "Eat", linea: "The pot boils over.", poster: "c1-lun-v5", pisos: ["ab"], pal: "cocina",
      que: "The kitchen is where I eat, and where a pot can boil over, like a feeling can.",
      relacion: "Interoception: hearing what my body says, even in the middle of cooking.",
      conducta: "In the kitchen: when the pot boils over, I ______.",
      invitacion: "Each card leaves a blank to fill, even only in your head. Cella's way: I turn the heat down and go with the breath.",
      biblioteca: [
        v("c1-lun-v5", "Today the pot boiled over.", "In the kitchen: when the pot boils over, I ______."),
        im("c3-cocina", "The last plate is clean.", "In the kitchen: when the last plate is clean, I ______.")
      ]
    },
    alcoba: {
      nombre: "Bedroom", palabra: "Sleep", linea: "The house goes quiet.", poster: "c1-mar", pisos: ["ar"], pal: "alcoba",
      que: "The bedroom is where I sleep well, and where I walk back through the day.",
      relacion: "Connection with myself: where was I today, and where was I gone?",
      conducta: "In the bedroom: when the house goes quiet, I ______.",
      invitacion: "Each card leaves a blank to fill, even only in your head. Cella's way: I let my shoulders come home too.",
      biblioteca: [
        v("c1-mar", "The house goes quiet.", "In the bedroom: when the house goes quiet, I ______."),
        v("c6-pregunta", "Scrolling in bed.", "In the bedroom: when I reach for the phone, I ______."),
        im("c3-alcoba", "Quiet in the bedroom.", "In the bedroom: when the house goes quiet, I ______.")
      ]
    },
    escaleras: {
      nombre: "Stairs", palabra: "Move", linea: "First step.", poster: "c1-mie", pisos: ["ab", "ar"], pal: "escaleras",
      que: "The stairs are the way between rooms, and where I get moving.",
      relacion: "Autonomy: the pace is mine.",
      conducta: "On the stairs: when I reach the first step, I ______.",
      invitacion: "Each card leaves a blank to fill, even only in your head. Cella's way: I take the stairs up and back.",
      biblioteca: [ v("c1-mie", "Keys hit the bowl.", "On the stairs: when I reach the first step, I ______.") ]
    },
    mesa: {
      nombre: "Table", palabra: "Gather", linea: "Someone asks how I am.", poster: "c1-jue", pisos: ["ab"], pal: "mesa",
      que: "The table is where I sit with my people to talk, eat and laugh.",
      relacion: "Authenticity: I say what is true when someone asks.",
      conducta: "At the table: when someone asks how I am, I ______.",
      invitacion: "Each card leaves a blank to fill, even only in your head. Cella's way: I listen to my chest first.",
      biblioteca: [
        v("c1-jue", "Someone asks how I am.", "At the table: when someone asks how I am, I ______."),
        v("c4-palabra", "My one true word.", "At the table: when someone asks how I am, my one true word is ______."),
        v("c2-cuerpo-v5", "Today a message landed.", "At the table: when a message lands, I ______.")
      ]
    },
    puerta: {
      nombre: "Door", palabra: "Arrive", linea: "Keys go in.", poster: "c3-puerta", pisos: ["ab"], pal: "puerta",
      que: "The door is where people come in, and where I come back in.",
      relacion: "Love shows up most with the people closest to me, and it is everywhere.",
      conducta: "At the front door: when the keys go in, I ______.",
      invitacion: "Come in. Each card asks one thing, and leaves a blank to fill, even only in your head. Cella's way: I leave the day on this side of the door.",
      biblioteca: [ im("c3-puerta", "Keys go in.", "At the front door: when the keys go in, I ______.") ]
    },
    ventana: {
      nombre: "Window", palabra: "The divine", linea: "The window is open.", poster: "c1-vie-v5", pisos: ["ab", "ar"], pal: "ventana",
      que: "Every room has a window onto the courtyard and the sky. I look out, then up.",
      relacion: "Faith begins when I trust myself first.",
      conducta: "At the window: when the phone is still face down, I ______.",
      invitacion: "Each card leaves a blank to fill, even only in your head. Cella's way: I stop here. I breathe. Then I move on.",
      biblioteca: [
        v("c1-vie-v5", "The house is still quiet.", "At the window: when the house is still quiet, I ______."),
        v("c5-ventana", "Still dark. Phone face down.", "At the window: when the phone is still face down, I ______.")
      ]
    },
    patio: {
      nombre: "Courtyard", palabra: "The divine", linea: "No roof. Every room opens here.", poster: "c1-vie-v5", pisos: ["ab", "ar"], pal: "patio",
      que: "The courtyard has no roof. Every room opens onto it, and the divine is here, where everything else meets.",
      relacion: "Hearing the divine from within, and trusting myself.",
      conducta: "In the courtyard: when I doubt, I ______.",
      invitacion: "Each card leaves a blank to fill, even only in your head. Cella's way: I trust myself first.",
      biblioteca: [
        v("c1-vie-v5", "The house is still quiet.", "At the window: when the house is still quiet, I ______."),
        v("c5-ventana", "Still dark. Phone face down.", "At the window: when the phone is still face down, I ______.")
      ],
      nota: "These two come from the window, which opens onto the courtyard."
    }
  };

  return { P: P, cuartos: cuartos, yt: "https://www.youtube.com/@Naos-v3" };
})();
