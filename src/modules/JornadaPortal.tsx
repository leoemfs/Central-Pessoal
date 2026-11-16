/**
 * Jornada (N2.14): animação de entrada, opção B da prévia "Entrada na Jornada" (portal em degraus).
 * Um quadrado escuro com estrelas nasce no centro e cresce aos saltos, com borda dourada e roxa;
 * no fim, um clarão e a cena aparece. Toca só ao entrar na Jornada vindo de outra tela
 * (o componente monta uma vez por entrada). Com "menos movimento", não aparece.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const STEPS = [1, 2, 4, 7, 11, 16, 23, 32, 44, 60];
const DURATION = 1300;

function hash(i: number, j: number, s: number) {
  let h = (i * 374761393 + j * 668265263 + s * 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function JornadaPortal() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(() => typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (!on) return;
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return setOn(false);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(window.innerWidth * dpr);
    cv.height = Math.round(window.innerHeight * dpr);
    ctx.imageSmoothingEnabled = false;
    const size = Math.round(10 * dpr);
    const cols = Math.ceil(cv.width / size);
    const rows = Math.ceil(cv.height / size);
    const W = cv.width;
    const H = cv.height;
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const k = Math.min(1, (now - t0) / DURATION);
      ctx.clearRect(0, 0, W, H);
      const cx = Math.floor(cols / 2);
      const cy = Math.floor(rows / 2);
      if (k < 0.62) {
        // Fundo escuro que some aos poucos enquanto o portal cresce em degraus.
        ctx.fillStyle = '#050506';
        ctx.fillRect(0, 0, W, H);
        const idx = Math.min(STEPS.length - 1, Math.floor((k / 0.62) * STEPS.length));
        const half = STEPS[idx];
        const x0 = (cx - half) * size;
        const y0 = (cy - Math.round(half * 1.15)) * size;
        const w = half * 2 * size;
        const h = Math.round(half * 2.3) * size;
        ctx.fillStyle = '#0b1020';
        ctx.fillRect(x0, y0, w, h);
        for (let s = 0; s < 18; s++) {
          ctx.fillStyle = hash(s, idx, 3) > 0.5 ? '#fde047' : '#e2e8f0';
          ctx.fillRect(x0 + Math.floor((hash(s, idx, 4) * w) / size) * size, y0 + Math.floor((hash(s, idx, 5) * h) / size) * size, size, size);
        }
        ctx.lineWidth = size;
        ctx.strokeStyle = '#facc15';
        ctx.strokeRect(x0 - size / 2, y0 - size / 2, w + size, h + size);
        ctx.strokeStyle = '#7c3aed';
        ctx.strokeRect(x0 - size * 1.5, y0 - size * 1.5, w + size * 3, h + size * 3);
      } else {
        // Clarão e pixels dourados e roxos se desfazendo sobre a cena.
        const f = (k - 0.62) / 0.38;
        ctx.fillStyle = `rgba(255,255,240,${Math.max(0, 0.9 - f * 1.6).toFixed(2)})`;
        ctx.fillRect(0, 0, W, H);
        if (f > 0.05)
          for (let j = 0; j < rows; j++)
            for (let i = 0; i < cols; i++) {
              if (hash(i, j, 7) > 1 - f * 1.3 || hash(i, j, 9) >= 0.08) continue;
              ctx.fillStyle = hash(i, j, 8) > 0.5 ? `rgba(250,204,21,${(1 - f).toFixed(2)})` : `rgba(124,58,237,${(1 - f).toFixed(2)})`;
              ctx.fillRect(i * size, j * size, size, size);
            }
      }
      if (k < 1) raf = requestAnimationFrame(frame);
      else setOn(false);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  if (!on) return null;
  return createPortal(<canvas ref={ref} className="jn-portal" aria-hidden="true" />, document.body);
}
