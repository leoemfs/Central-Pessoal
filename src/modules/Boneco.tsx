import { useEffect, useMemo, useRef } from 'react';
import { centerX, FIGURES, figureSvg, VIEW } from '../bonecos';

const reduced = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/** Boneco animado do exercício (vai e volta entre as duas posições). Parado: mostra a posição principal. */
export function Boneco({ fig, label, play = true, slow = false, className = '' }: { fig: string; label: string; play?: boolean; slow?: boolean; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const dx = useMemo(() => centerX(FIGURES[fig] ?? FIGURES.respirar), [fig]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!play || reduced()) {
      el.innerHTML = figureSvg(fig, 1, dx);
      return;
    }
    const period = slow ? 4200 : 2400;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const ph = ((now - t0) % period) / period;
      const s = 0.5 - 0.5 * Math.cos(ph * 2 * Math.PI);
      el.innerHTML = figureSvg(fig, slow ? Math.min(1, s * 1.4) : s, dx);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fig, play, slow, dx]);
  return <svg ref={ref} className={`boneco ${className}`} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={label} />;
}
