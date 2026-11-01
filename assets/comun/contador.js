// contador.js · contador de visitas sin cookies (Umami Cloud, D-317). Se carga en cada página con una sola línea:
//   <script defer src="<raíz>assets/comun/contador.js"></script>
// Lee data/sitio.json (ruta relativa a este archivo, sirve desde cualquier carpeta). Si contador.umami_website_id está vacío
// no carga nada más: ni el script de Umami ni ninguna petición a terceros. Dónde pegar el id: LEEME-contador.md.
// Privacidad: Umami no usa cookies ni guarda nada en el navegador. Mide la página con su ?src= (la parte después del ?),
// nunca el fragmento (#nombre=... de /invita/ y las tarjetas): data-exclude-hash lo quita y antesDeEnviar lo vuelve a quitar
// por si acaso, también del referente. Respeta "Do Not Track". Solo cuenta en el dominio público (no en pruebas locales).
(function () {
  var yo = document.currentScript;
  if (!yo || !window.fetch) return;
  var conf = new URL("../../data/sitio.json", yo.src);
  var sinFragmento = function (u) { return typeof u === "string" ? u.split("#")[0] : u; };
  window.naosAntesDeEnviar = function (tipo, carga) {
    if (carga) { carga.url = sinFragmento(carga.url); carga.referrer = sinFragmento(carga.referrer); }
    return carga;
  };
  fetch(conf, { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      var c = d && d.contador, id = c && String(c.umami_website_id || "").trim();
      if (!id || !/^[0-9a-f-]{36}$/i.test(id) || !/^https:\/\//.test(c.script || "")) return;
      var s = document.createElement("script");
      s.defer = true;
      s.src = c.script;
      s.setAttribute("data-website-id", id);
      s.setAttribute("data-exclude-hash", "true");
      s.setAttribute("data-do-not-track", "true");
      s.setAttribute("data-before-send", "naosAntesDeEnviar");
      if (c.dominios) s.setAttribute("data-domains", c.dominios);
      document.head.appendChild(s);
    })
    .catch(function () {});
})();
