// Un traspaso, paso a paso · mini animación de proceso, sin librerías. montar(el, {quieto}).
// Sin JS, o con quieto, el SVG ya está en su estado final (paso 6). Nada arranca solo: Play corre los 6 pasos, 3 s cada uno, y se pausa.
// Los pasos son estados de data-step en el SVG; el movimiento lo hace el CSS con los tiempos de los tokens (0 ms con reduced-motion).
export function montar(el, { quieto = false } = {}) {
  const svg = el.querySelector('svg.hc'), est = el.querySelector('.hc-estado'), bar = el.querySelector('.hc-ctl'), dj = el.querySelector('.hc-dat');
  if (!svg || !est || !bar || !dj) return;
  const D = JSON.parse(dj.textContent), X = D.txt, N = D.pasos.length;
  let paso = N, reloj = 0, jugando = false, visto = false;
  const pintar = () => {
    svg.dataset.step = paso;
    est.textContent = D.paso_de.replace('{n}', paso).replace('{m}', N) + ' ' + D.pasos[paso - 1];
    if (bJ) bJ.textContent = jugando ? X.pause : paso >= N && visto ? X.again : X.play;
    bS.textContent = paso >= N ? X.restart : X.next;
    // Si Atrás se deshabilita con el foco encima, el foco pasa a Paso siguiente (no se pierde en BODY).
    const enA = document.activeElement === bA;
    bA.disabled = paso <= 1;
    if (enA && bA.disabled) bS.focus();
  };
  const parar = () => { clearTimeout(reloj); jugando = false; };
  const tic = () => { reloj = setTimeout(() => { if (paso < N) paso++; if (paso >= N) jugando = false; else tic(); pintar(); }, D.ms); };
  const jugar = () => { if (paso >= N) paso = 1; jugando = visto = true; pintar(); tic(); };
  const boton = (t, f) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.addEventListener('click', f); bar.append(b); return b; };
  const bJ = quieto ? null : boton(X.play, () => { if (jugando) { parar(); pintar(); } else jugar(); });
  const bA = boton(X.back, () => { parar(); paso = Math.max(1, paso - 1); pintar(); });
  const bS = boton(X.next, () => { parar(); paso = paso >= N ? 1 : paso + 1; pintar(); });
  pintar();
}
