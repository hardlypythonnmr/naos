// Dos ciclos de la luna · mini animación de proceso, sin librerías. montar(el, {quieto}).
// Sin JS o con quieto el SVG ya está en su estado final (llena del 23 dic). Nada arranca solo; Pausa detiene el reloj de verdad.
const DIA = 864e5;
export function montar(el, { quieto = false } = {}) {
  const svg = el.querySelector('svg.mv'), est = el.querySelector('.mv-estado'), bar = el.querySelector('.mv-ctl'), dj = el.querySelector('.mv-dat');
  if (!svg || !est || !bar || !dj) return;
  const D = JSON.parse(dj.textContent), G = D.geo, X = D.txt, N = D.turnos.length - 1;
  const T = D.turnos.map(t => Date.parse(t.utc)), P = D.piezas.map(Date.parse), t0 = Date.parse(G.t0), t1 = Date.parse(G.t1);
  const q = s => svg.querySelector(s), luna = q('.mv-luna'), cab = q('.mv-cab'), fec = q('.mv-fec'), lleno = q('.mv-lleno'), tks = [...svg.querySelectorAll('.mv-tk')];
  const M = [], s = [], a = [0];                       // duración de cada tramo y tiempos de salida y llegada
  for (let k = 0; k < N; k++) { M[k] = (T[k + 1] - T[k]) / DIA * G.ms_dia; s[k] = a[k] + (k ? G.pausa : 0); a[k + 1] = s[k] + M[k]; }
  const FIN = a[N], ANCHO = G.x1 - G.x0;
  const pos = et => { for (let k = 0; k < N; k++) { if (et < s[k]) return k; if (et < a[k + 1]) return k + (et - s[k]) / M[k]; } return N; };
  let et = quieto ? FIN : 0, jugando = false, ult = 0, raf = 0, clave = '', dia = '';
  const pintar = () => {
    const u = pos(et), k = Math.min(N - 1, Math.floor(u)), t = T[k] + (T[k + 1] - T[k]) * (u - k), ang = Math.PI * u;
    luna.setAttribute('transform', `translate(${(G.cx + G.r * Math.cos(ang)).toFixed(2)} ${(G.cy - G.r * Math.sin(ang)).toFixed(2)})`);
    lleno.setAttribute('width', (ANCHO * (1 + Math.cos(ang)) / 2).toFixed(2));
    const x = G.x0 + (t - t0) / (t1 - t0) * ANCHO;
    cab.setAttribute('transform', `translate(${x.toFixed(2)} 0)`); fec.setAttribute('x', (Math.min(Math.max(x, 28), 332) - x).toFixed(2));
    const l = new Date(t + G.tz * 36e5), d = l.getUTCDate() + ' ' + D.meses[l.getUTCMonth()];
    if (d !== dia) { fec.textContent = d; dia = d; }
    tks.forEach((e, i) => e.classList.toggle('mv-pas', P[i] <= t));
    const llego = Number.isInteger(u), c = (llego ? 'l' : 'v') + (llego ? u : Math.ceil(u));
    if (c !== clave) { clave = c; est.textContent = llego ? D.turnos[u].nombre + ': ' + D.turnos[u].cuando + '.' : X.mueve.replace('{sig}', D.turnos[Math.ceil(u)].sig); }
  };
  const rotular = () => { if (bJ) bJ.textContent = jugando ? X.pause : et >= FIN ? X.again : X.play; bS.textContent = et >= FIN ? X.restart : X.next; };
  const paso = ahora => { if (!jugando) return; et = Math.min(FIN, et + Math.min(100, ahora - ult)); ult = ahora; pintar();
    if (et >= FIN) { jugando = false; rotular(); } else raf = requestAnimationFrame(paso); };
  const parar = () => { jugando = false; cancelAnimationFrame(raf); };
  const jugar = () => { if (et >= FIN) et = 0; jugando = true; ult = performance.now(); rotular(); raf = requestAnimationFrame(paso); };
  const sig = () => { parar(); const u = pos(et); et = u >= N ? 0 : a[Math.floor(u + 1e-9) + 1]; pintar(); rotular(); };
  const boton = (t, f) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.addEventListener('click', f); bar.append(b); return b; };
  const bJ = quieto ? null : boton(X.play, () => (jugando ? (parar(), rotular()) : jugar())), bS = boton(X.next, sig);
  pintar(); rotular();
}
