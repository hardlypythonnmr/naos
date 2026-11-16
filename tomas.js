/* Las tomas de la sombra: regla determinista, la misma para C y D.
   tomaDe(fechaUTC, extra) -> { toma, desde, hasta, motivo, edad, luz }
   fechaUTC: Date, "AAAA-MM-DD" o milisegundos. extra: probabilidad extra de azar (0 a 0.3). */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.NAOS_TOMAS = fabrica();
})(typeof window !== "undefined" ? window : this, function () {
  var NUEVA = Date.UTC(2000, 0, 6, 18, 14), PERIODO = 29.530588, DIA = 864e5;
  function edad(ms) { var d = (ms - NUEVA) / DIA; return ((d % PERIODO) + PERIODO) % PERIODO; }
  function luz(ms) { return (1 - Math.cos(2 * Math.PI * edad(ms) / PERIODO)) / 2; }   // 0 nueva, 1 llena
  function inicioDia(f) {
    if (typeof f === "string") { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(f); return Date.UTC(+m[1], +m[2] - 1, +m[3]); }
    var ms = f instanceof Date ? f.getTime() : +f;
    return Math.floor(ms / DIA) * DIA;
  }
  function ymd(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function fnv1a(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  function tomaDe(fecha, extra) {
    var d0 = inicioDia(fecha), d1 = d0 + DIA, e = +extra > 0 ? Math.min(+extra, 0.3) : 0;
    var nueva = edad(d0) > edad(d1);                       // la edad vuelve a cero dentro de este dia UTC
    var azar = (fnv1a(ymd(d0)) % 9973) / 9973 < 1 / 9 + e;
    return { toma: nueva || azar, nueva: nueva, azar: azar && !nueva, motivo: nueva ? "luna-nueva" : azar ? "azar" : null, desde: new Date(d0).toISOString(), hasta: new Date(d1).toISOString(), fecha: ymd(d0), edad: edad(d0 + DIA / 2), luz: luz(d0 + DIA / 2) };
  }
  return { tomaDe: tomaDe, edad: edad, luz: luz, fnv1a: fnv1a, inicioDia: inicioDia, ymd: ymd, PERIODO: PERIODO };
});
