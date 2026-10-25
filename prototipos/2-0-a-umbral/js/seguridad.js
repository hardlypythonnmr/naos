/* seguridad.js · la puerta local del campo libre (propuesta 3.6, brief P8). Sin modelo, sin red, no guarda el texto.
 * Dos listas separadas, en ES y EN. Es una red gruesa y se dice: si hay duda, no atrapa.
 * Las listas completas y sus 20 + 20 frases de prueba irían en tests/seguridad.test.mjs; aquí viven las del prototipo. */
(function (raiz) {
  "use strict";
  // minúsculas, sin tildes, signos como espacio, espacios colapsados
  function norm(t) {
    return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9ñ]+/g, " ").trim();
  }
  var PALABRAS_CRISIS = {
    es: [/quiero morir/, /no quiero vivir/, /hacerme dano/, /suicid/, /quitarme la vida/, /acabar con mi vida/],
    en: [/want to die/, /kill myself/, /hurt myself/, /suicid/, /end my life/]
  };
  var PALABRAS_RESTRICCION = {
    es: [/saltarme (la|las) comidas?/, /\bayun(o|ar|ando)\b/, /contar calorias/, /\bpurgar(me)?\b/, /no comer en todo el dia/],
    en: [/skip(ping)? (a )?meals?/, /\bfasting\b/, /count(ing)? calories/, /\bpurg(e|ing)\b/, /not eat all day/]
  };
  // frases inocentes que contienen una palabra de la lista: se quitan antes de mirar ("ayuno de pantallas")
  var INOCENTES = [/ayuno (de|del) (pantallas?|celular|redes|internet|noticias|digital)/g, /ayuno digital/g,
                   /(digital|screen|phone|social media) fasting/g, /fasting from (screens?|phones?|social media|news|the news)/g];
  function toca(lista, t) { return lista.some(function (re) { return re.test(t); }); }
  // devuelve "crisis", "restriccion" o null. La crisis manda sobre la restricción.
  function revisar(texto, lang) {
    var t = norm(texto), l = lang === "en" ? "en" : "es";
    INOCENTES.forEach(function (re) { t = t.replace(re, " "); });
    if (toca(PALABRAS_CRISIS[l], t) || toca(PALABRAS_CRISIS[l === "es" ? "en" : "es"], t)) return "crisis";
    if (toca(PALABRAS_RESTRICCION[l], t)) return "restriccion";
    return null;
  }
  raiz.NAOS_SEGURIDAD = { revisar: revisar, norm: norm, PALABRAS_CRISIS: PALABRAS_CRISIS, PALABRAS_RESTRICCION: PALABRAS_RESTRICCION };
})(window);
