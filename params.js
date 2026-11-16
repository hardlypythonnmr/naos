/* Parametros vigentes de la obra: lista blanca de alma.json con rangos. Compartido por lampara.js (navegador)
   y registro-tomas.mjs (node), para que ambos vean la misma tomaExtra. Fuera de rango o desconocido se ignora. */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.NAOS_PARAMS = fabrica();
})(typeof window !== "undefined" ? window : this, function () {
  var CAMPOS = { crema: "#F4F6F8", alcoba: "#A9B2EC", cocina: "#F0BC6E", escaleras: "#E9876A", mesa: "#EE9AA6" };   // paletas.json
  function defecto() { return { densidad: 1, radioLampara: 1, campo: "alcoba", oroRetraso: 2, oroDuracion: 2, segundosProta: 6, poses: [0.34, 0.2, 0.18, 0.28], tomaExtra: 0 }; }
  function num(v, a, b) { return typeof v === "number" && isFinite(v) && v >= a && v <= b; }
  function aplica(P, e) {
    if (!e || typeof e !== "object") return;
    if (num(e.densidad, 0.7, 1.5)) P.densidad = e.densidad;
    if (num(e.radioLampara, 0.7, 1.4)) P.radioLampara = e.radioLampara;
    if (typeof e.campo === "string" && CAMPOS.hasOwnProperty(e.campo)) P.campo = e.campo;
    if (num(e.oroRetraso, 1, 6)) P.oroRetraso = e.oroRetraso;
    if (num(e.oroDuracion, 0.8, 4)) P.oroDuracion = e.oroDuracion;
    if (num(e.segundosProta, 3, 15)) P.segundosProta = e.segundosProta;
    if (num(e.tomaExtra, 0, 0.3)) P.tomaExtra = e.tomaExtra;
    if (e.poses && typeof e.poses === "object") {
      var n = ["depie", "hundida", "dormida", "mirando"], w = P.poses.slice(), ok = false;
      n.forEach(function (k, i) { if (num(e.poses[k], 0, 1)) { w[i] = e.poses[k]; ok = true; } });
      if (ok && w[0] + w[1] + w[2] + w[3] > 0.2) P.poses = w;
    }
  }
  // alma: el objeto de alma.json (o null); hoy: "AAAA-MM-DD". Devuelve los params vigentes ese dia.
  function vigentes(alma, hoy) {
    var P = defecto();
    try {
      if (alma && Array.isArray(alma.params)) alma.params.filter(function (e) { return e && typeof e.fecha === "string" && e.fecha <= hoy; })
        .sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; }).forEach(function (e) { aplica(P, e); });
    } catch (e) { return defecto(); }
    return P;
  }
  return { CAMPOS: CAMPOS, defecto: defecto, aplica: aplica, vigentes: vigentes, num: num };
});
