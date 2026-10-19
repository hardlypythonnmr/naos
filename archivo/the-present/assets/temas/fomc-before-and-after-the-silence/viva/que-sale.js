// Qué sale y en qué orden · mini animación de proceso (6 pasos), sin librerías. montar(el, {quieto}).
// Sin JS o con quieto el SVG ya está en su estado final (paso 6). Nada arranca solo; Pausar detiene el reloj de verdad.
export function montar(el, { quieto = false } = {}) {
  const svg = el.querySelector('svg.qv'), est = el.querySelector('.qv-estado'), bar = el.querySelector('.qv-ctl'), dj = el.querySelector('.qv-dat');
  if (!svg || !est || !bar || !dj) return;
  const D = JSON.parse(dj.textContent), G = D.geo, X = D.txt, T = D.tiempos, P = D.pasos, N = P.length;
  const cur = svg.querySelector('.qv-cur'), band = svg.querySelector('.qv-band'), filas = [...svg.querySelectorAll('.qv-f')];
  const at = [0], lv = [];                              // llegada y salida de cada paso, en ms
  for (let k = 0; k < N; k++) { lv[k] = at[k] + T.base + P[k].texto.length * T.char; at[k + 1] = lv[k] + T.viaje; }
  const FIN = at[N - 1];
  const pos = t => { for (let k = 0; k < N - 1; k++) { if (t < lv[k]) return k; if (t < at[k + 1]) return k + (t - lv[k]) / T.viaje; } return N - 1; };
  let et = quieto ? FIN : 0, jugando = false, ult = 0, raf = 0, clave = -1;
  const pintar = () => {
    const u = pos(et), dy = (u * G.paso).toFixed(2), llego = Number.isInteger(u), pas = Math.floor(u + 1e-9);
    cur.setAttribute('transform', `translate(0 ${dy})`); band.setAttribute('transform', `translate(0 ${dy})`);
    filas.forEach((f, k) => { f.classList.toggle('is-pas', k <= pas); f.classList.toggle('is-now', llego && k === u); });
    if (llego && u !== clave) { clave = u; est.textContent = P[u].texto; }
  };
  const rotular = () => { if (bJ) bJ.textContent = jugando ? X.pause : et >= FIN ? X.again : X.play; bS.textContent = et >= FIN ? X.restart : X.next; };
  const paso = ahora => { if (!jugando) return; et = Math.min(FIN, et + Math.min(100, ahora - ult)); ult = ahora; pintar();
    if (et >= FIN) { jugando = false; rotular(); } else raf = requestAnimationFrame(paso); };
  const parar = () => { jugando = false; cancelAnimationFrame(raf); };
  const jugar = () => { if (et >= FIN) et = 0; jugando = true; ult = performance.now(); rotular(); raf = requestAnimationFrame(paso); };
  const sig = () => { parar(); const u = pos(et); et = u >= N - 1 ? 0 : at[Math.floor(u + 1e-9) + 1]; pintar(); rotular(); };
  const boton = (t, f) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.addEventListener('click', f); bar.append(b); return b; };
  const bJ = quieto ? null : boton(X.play, () => (jugando ? (parar(), rotular()) : jugar())), bS = boton(X.next, sig);
  pintar(); rotular();
  // La región en vivo se activa después de la primera pintura: así no se anuncia nada al cargar, solo lo que el lector pide.
  est.setAttribute('role', 'status'); est.setAttribute('aria-live', 'polite');
}
