/* escena.js · renderer, camara orbital limitada, vuelo suave a cada cuarto, clic/toque, etiquetas.
 * La camara nunca baja del suelo ni cruza los muros: dentro de la huella de la casa se queda por encima del tejado (y >= 6,8)
 * y fuera se puede acercar al suelo (y >= 1,8). prefers-reduced-motion: los saltos son instantaneos. */
import * as THREE from "three";
import { construirMundo, FL, PAL } from "./mundo.js";

const $ = (s, r = document) => r.querySelector(s);
const reducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* vista de camara por cuarto, en coordenadas locales del cuarto (z hacia el patio): c = camara, t = punto que mira */
const VISTA = {
  cocina: { c: [1.0, 8.4, 11.5], t: [-0.2, 1.0, -0.4] },
  mesa: { c: [-1.0, 7.4, 9.4], t: [0, 0.9, 0.0] },
  alcoba: { c: [-1.0, 8.6, 12.0], t: [-1.5, 0.8, -0.6] },
  escaleras: { c: [-1.5, 8.4, 11.0], t: [-0.5, 1.2, -0.6] },
  puerta: { c: [0, 7.8, 11.2], t: [0, 1.1, -0.6] },
  ventana: { c: [0, 8.6, 12.0], t: [0, 1.2, -0.2] }
};

export function iniciar(api) {
  const { datos: D, orden: ORDEN } = api;
  const cont = $("#escena"), lienzo = $("#lienzo");
  const movil = matchMedia("(pointer: coarse)").matches || innerWidth < 800;
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: !movil, powerPreference: "high-performance", alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const escena = new THREE.Scene();
  const mundo = construirMundo({ renderer, escena, movil });
  const cam = new THREE.PerspectiveCamera(40, 1, 0.5, 700);

  /* ---------- orbita ---------- */
  const TGT = new THREE.Vector3(0, 1.4, 0);
  const orb = { az: 0.0, pol: 1.08, r: 60, azO: 0, polO: 1.08, rO: 60 };
  const cur = { pos: new THREE.Vector3(), tgt: TGT.clone() };
  let modo = "orbita", sala = null, volando = true, vista = { x: 0, y: 0 }, vistaObj = { x: 0, y: 0 };
  let ancho = 1, alto = 1;

  function radioInicial() {
    const asp = ancho / alto, fov = asp < 1 ? 52 : 40;
    return clamp(27 / (Math.tan(fov * Math.PI / 360) * Math.min(asp, 1.5)), 60, 130);
  }
  function orbitaPos(out) {
    return out.set(
      TGT.x + orb.r * Math.sin(orb.pol) * Math.sin(orb.az),
      TGT.y + orb.r * Math.cos(orb.pol),
      TGT.z + orb.r * Math.sin(orb.pol) * Math.cos(orb.az));
  }
  const pSala = { pos: new THREE.Vector3(), tgt: new THREE.Vector3() };
  function calcPoseSala(id) {
    const r = mundo.cuartos[id], v = VISTA[r.pal === "ventana" ? "ventana" : id] || VISTA[id];
    if (id === "patio") { pSala.tgt.set(0, 0.9, 0.2); pSala.pos.set(0.5, 9.5, 14.0); }
    else { pSala.tgt.copy(r.loc(...v.t)); pSala.pos.copy(r.loc(...v.c)); }
    // pantallas angostas: se aleja para que el cuarto quepa a lo ancho, y sube un poco
    const asp = Math.max(0.3, (ancho - vistaObj.x * 2) / alto), fov = ancho / alto < 1 ? 52 : 40;
    const W = id === "patio" ? 15 : Math.min(r.W || 10, 10.5);
    const dist = pSala.pos.distanceTo(pSala.tgt);
    const k = clamp((W * 0.74) / (Math.tan(fov * Math.PI / 360) * dist * Math.min(asp, 2)), 1, 2.6);
    if (k > 1) { const d = pSala.pos.clone().sub(pSala.tgt).multiplyScalar(k); pSala.pos.copy(pSala.tgt).add(d); }
    return pSala;
  }

  /* limites: no atravesar muros ni ir bajo el suelo */
  function limita(p) {
    const h = Math.max(Math.abs(p.x), Math.abs(p.z));      // distancia de Chebyshev al centro de la casa
    const minY = h >= 24 ? 1.8 : h <= 17.5 ? 6.8 : 1.8 + (6.8 - 1.8) * (24 - h) / 6.5;
    if (p.y < minY) p.y = minY;
    if (h > 190) { p.x *= 190 / h; p.z *= 190 / h; }
  }

  /* ---------- ajuste de tamano ---------- */
  function ajusta() {
    const r = cont.getBoundingClientRect();
    ancho = Math.max(1, Math.round(r.width)); alto = Math.max(1, Math.round(r.height));
    renderer.setSize(ancho, alto, false);
    cam.aspect = ancho / alto; cam.fov = cam.aspect < 1 ? 52 : 40;
    const nuevo = radioInicial();
    if (!orb.tocado) { orb.r = orb.rO = nuevo; }
    orb.rMax = Math.max(nuevo * 1.25, 80);
    cam.updateProjectionMatrix();
    actualizaVista(true);
  }
  function actualizaVista(salto) {
    const panel = $("#panel"), abierto = !panel.hidden && !panel.classList.contains("mini");
    const ancha = ancho >= 900;
    vistaObj.x = abierto && ancha ? Math.min(460, ancho * 0.42) / 2 : 0;
    vistaObj.y = abierto && !ancha ? alto * 0.17 : 0;
    if (salto || reducido()) { vista.x = vistaObj.x; vista.y = vistaObj.y; }
  }
  new ResizeObserver(ajusta).observe(cont);
  new MutationObserver(() => actualizaVista(false)).observe($("#panel"), { attributes: true, attributeFilter: ["hidden", "class"] });

  /* ---------- entrada: arrastre, rueda, pellizco, toque ---------- */
  const ptrs = new Map(); let ini = null, pinch0 = 0, r0 = 0;
  const rc = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(ev) {
    const r = lienzo.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    rc.setFromCamera(ndc, cam);
    const hs = rc.intersectObjects(mundo.hit, false);
    for (const h of hs) { const id = h.object.userData.sala; if (id && mundo.cuartos[id] && mundo.cuartos[id].slug) return id; }
    return null;
  }
  lienzo.addEventListener("pointerdown", (e) => {
    lienzo.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    ini = { x: e.clientX, y: e.clientY, t: performance.now(), mov: 0 };
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); r0 = orb.rO; }
    lienzo.classList.add("agarra");
  });
  lienzo.addEventListener("pointermove", (e) => {
    const p = ptrs.get(e.pointerId);
    if (!p) {
      if (e.pointerType === "mouse") {
        const id = modo === "orbita" || true ? pick(e) : null;
        mundo.setHover(id); lienzo.style.cursor = id ? "pointer" : "grab";
        marca(id, e);
      }
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (ini) ini.mov += Math.abs(dx) + Math.abs(dy);
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (modo === "orbita" && pinch0) { orb.tocado = true; orb.rO = clamp(r0 * pinch0 / d, 16, orb.rMax); }
      return;
    }
    if (modo === "orbita") {
      orb.tocado = true;
      orb.azO -= dx * 0.0065; orb.polO = clamp(orb.polO - dy * 0.0055, 0.22, 1.36);
    }
  });
  const fin = (e) => {
    const p = ptrs.get(e.pointerId);
    ptrs.delete(e.pointerId); lienzo.classList.remove("agarra"); pinch0 = 0;
    if (!p || !ini) return;
    const mov = ini.mov, dt = performance.now() - ini.t, dx = e.clientX - ini.x, dy = e.clientY - ini.y;
    if (e.type === "pointerup" && mov < 9 && dt < 600) {
      const id = pick(e);
      if (id) { const r = mundo.cuartos[id]; if (id !== sala) api.ir(r.slug); }
      else if (modo === "sala" && e.pointerType !== "mouse" && false) api.ir(null);
    } else if (modo === "sala" && e.pointerType !== "mouse" && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      api.sig(dx < 0 ? 1 : -1);      // deslizar: siguiente o anterior
    }
    ini = null;
  };
  lienzo.addEventListener("pointerup", fin); lienzo.addEventListener("pointercancel", fin);
  lienzo.addEventListener("pointerleave", () => { mundo.setHover(null); marca(null); });
  lienzo.addEventListener("wheel", (e) => {
    if (modo !== "orbita") return;
    e.preventDefault(); orb.tocado = true;
    orb.rO = clamp(orb.rO * Math.exp(e.deltaY * 0.0012), 16, orb.rMax);
  }, { passive: false });
  document.addEventListener("keydown", (e) => {
    if (modo !== "orbita" || e.defaultPrevented || e.target.closest && e.target.closest("a,button,video,input")) return;
    if (e.key === "ArrowLeft") { orb.azO -= 0.25; orb.tocado = true; e.preventDefault(); }
    else if (e.key === "ArrowRight") { orb.azO += 0.25; orb.tocado = true; e.preventDefault(); }
    else if (e.key === "ArrowUp") { orb.polO = clamp(orb.polO - 0.1, 0.22, 1.36); e.preventDefault(); }
    else if (e.key === "ArrowDown") { orb.polO = clamp(orb.polO + 0.1, 0.22, 1.36); e.preventDefault(); }
  });

  /* ---------- etiquetas sobre cada cuarto ---------- */
  const etq = $("#etiquetas"); const etqs = {};
  ORDEN.forEach((o) => {
    const c = D.cuartos[o.key], pal = D.P[c.pal];
    const d = document.createElement("div"); d.className = "etq"; d.textContent = c.nombre;
    d.style.setProperty("--campo", pal.campo); d.style.setProperty("--tinta", pal.tinta);
    etq.appendChild(d); etqs[o.key] = d;
  });
  const idPorKey = { puerta: "puerta", ventana: "ventana", cocina: "cocina", escaleras: "escaleras", alcoba: "alcoba", mesa: "mesa", patio: "patio" };
  const tag = $("#tag");
  function marca(id, e) {
    if (!tag) return;
    if (!id) { tag.hidden = true; return; }
    const r = mundo.cuartos[id], key = ORDEN.find((o) => o.slug === r.slug).key, c = D.cuartos[key];
    tag.textContent = c.nombre + " · " + c.palabra; tag.hidden = false;
    const b = cont.getBoundingClientRect();
    tag.style.left = clamp(e.clientX - b.left + 14, 6, b.width - 160) + "px"; tag.style.top = clamp(e.clientY - b.top + 16, 6, b.height - 40) + "px";
  }
  const v3 = new THREE.Vector3();
  function colocaEtiquetas() {
    const ver = modo === "orbita" && !ptrs.size ? 1 : 0;
    ORDEN.forEach((o) => {
      const r = mundo.cuartos[idPorKey[o.key]], d = etqs[o.key];
      v3.copy(r.centro); v3.y = r.patio ? 4.2 : 5.5;
      if (r.patio) v3.set(0, 4.6, 0);
      v3.project(cam);
      const dentro = v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05;
      d.style.opacity = ver && dentro ? "1" : "0";
      d.style.transform = "translate(-50%,-100%) translate(" + ((v3.x * 0.5 + 0.5) * ancho).toFixed(1) + "px," + ((-v3.y * 0.5 + 0.5) * alto).toFixed(1) + "px)";
    });
  }

  /* ---------- botones ---------- */
  const bT = $("#b-techo"), bV = $("#b-vista");
  bT.addEventListener("click", () => {
    const on = bT.getAttribute("aria-pressed") !== "true";
    bT.setAttribute("aria-pressed", String(on)); bT.textContent = on ? "Roofs: on" : "Roofs: off";
    mundo.setTechos(on);
  });
  bV.addEventListener("click", () => api.ir(null));

  /* ---------- cambio de cuarto ---------- */
  function irA(slug) {
    const id = slug ? Object.values(mundo.cuartos).find((r) => r.slug === slug).id : null;
    sala = id; modo = id ? "sala" : "orbita";
    mundo.setFoco(id);
    if (!id) { orb.azO = orb.az; orb.polO = clamp(orb.polO, 0.5, 1.3); }
    volando = true;
    actualizaVista(false);
    cont.classList.toggle("dentro", !!id);
    if (reducido()) { instante = true; }
  }
  let instante = false;

  /* ---------- bucle ---------- */
  const reloj = new THREE.Clock(); let t = 0, listo = false;
  const dp = new THREE.Vector3(), dt3 = new THREE.Vector3();
  function cuadro() {
    requestAnimationFrame(cuadro);
    const dt = Math.min(0.05, reloj.getDelta()); t += dt;
    // objetivo de camara
    if (modo === "orbita") {
      const k = 1 - Math.exp(-dt * 9);
      orb.az += (orb.azO - orb.az) * k; orb.pol += (orb.polO - orb.pol) * k; orb.r += (orb.rO - orb.r) * k;
      orbitaPos(dp); dt3.copy(TGT);
    } else { const p = calcPoseSala(sala); dp.copy(p.pos); dt3.copy(p.tgt); }
    if (!listo || instante || reducido()) { cur.pos.copy(dp); cur.tgt.copy(dt3); instante = false; volando = false; }
    else {
      const lam = volando ? 2.9 : 14, k = 1 - Math.exp(-dt * lam);
      cur.pos.lerp(dp, k); cur.tgt.lerp(dt3, k);
      if (cur.pos.distanceTo(dp) < 0.08) volando = false;
    }
    cam.position.copy(cur.pos); limita(cam.position);
    cam.lookAt(cur.tgt);
    // el cuarto queda en el area libre cuando el panel esta abierto
    const kv = 1 - Math.exp(-dt * 7);
    vista.x += (vistaObj.x - vista.x) * kv; vista.y += (vistaObj.y - vista.y) * kv;
    if (Math.abs(vista.x) + Math.abs(vista.y) > 0.5 || cam.view) {
      if (Math.abs(vista.x) + Math.abs(vista.y) < 0.5 && Math.abs(vistaObj.x) + Math.abs(vistaObj.y) === 0) cam.clearViewOffset();
      else cam.setViewOffset(ancho, alto, vista.x, vista.y, ancho, alto);
    }
    cam.updateMatrixWorld();
    mundo.actualiza(t, dt, cam, !listo || reducido());
    colocaEtiquetas();
    renderer.render(escena, cam);
    if (!listo) { listo = true; document.documentElement.dataset.listo = "1"; }
  }
  ajusta();
  orb.r = orb.rO = radioInicial();
  mundo.setHover(null);
  const api2 = { irA, mundo, camara: cam, orb, TGT };
  window.__casa3d = api2;
  api.listo(api2);
  cuadro();
}
