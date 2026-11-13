import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { MaisPanel } from './modules/Mais';
import { useBackToClose } from './ui';

/**
 * E21.2: puxar a barra de baixo para cima abre o Mais como uma gaveta.
 * - Arrastar (sem precisar segurar) puxa a gaveta junto com o dedo; soltou depois de 1/4 do caminho
 *   ou com um puxão rápido, abre; antes disso, volta.
 * - Segurar sem mexer continua mostrando o nome do ícone (TabLink consulta `barDrag`).
 * - Fecha puxando a alcinha para baixo, tocando fora, no voltar do celular ou ao escolher algo.
 */
export const barDrag = { active: false, until: 0 };

const OPEN_SHARE = 0.25;
const FLICK = 0.6; // px por ms
const HINT_KEY = 'cp-puxar-dica';

function BackCloser({ onClose }: { onClose: () => void }) {
  useBackToClose(onClose);
  return null;
}

export function PullToMais({ bar, resetKey }: { bar: RefObject<HTMLElement | null>; resetKey: string }) {
  const [shown, setShown] = useState(0); // quanto da gaveta aparece (px) durante o arrasto
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const height = () => panel.current?.offsetHeight ?? window.innerHeight * 0.8;

  const close = () => {
    setDragging(false);
    setOpen(false);
    setShown(0);
    setClosing(true);
    window.setTimeout(() => setClosing(false), 280);
  };
  // Trocou de tela (escolheu um módulo na gaveta, voltou etc.): fecha.
  useEffect(() => {
    setOpen(false);
    setShown(0);
    setDragging(false);
  }, [resetKey]);

  // A alcinha pisca nas 3 primeiras vezes que o app abre.
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    let n = 0;
    try {
      n = Number(localStorage.getItem(HINT_KEY) ?? '0');
      localStorage.setItem(HINT_KEY, String(n + 1));
    } catch {
      /* sem armazenamento: só não pisca */
    }
    if (n >= 3) return;
    el.classList.add('pull-hint');
    const t = window.setTimeout(() => el.classList.remove('pull-hint'), 3200);
    return () => window.clearTimeout(t);
  }, [bar]);

  // Arrastar a barra para cima.
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    let g: { y: number; t: number; id: number; drag: boolean } | null = null;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      g = { y: e.clientY, t: performance.now(), id: e.pointerId, drag: false };
    };
    const move = (e: PointerEvent) => {
      if (!g) return;
      const dy = g.y - e.clientY;
      if (!g.drag && dy > 12) {
        g.drag = true;
        barDrag.active = true;
        try {
          el.setPointerCapture(g.id);
        } catch {
          /* ignora */
        }
        setClosing(false);
        setDragging(true);
      }
      if (g.drag) setShown(Math.max(0, dy));
    };
    const up = (e: PointerEvent) => {
      if (!g) return;
      const was = g;
      g = null;
      barDrag.active = false;
      if (!was.drag) return;
      barDrag.until = performance.now() + 400; // o "soltar" não vale como toque num ícone
      const dy = was.y - e.clientY;
      const v = dy / Math.max(1, performance.now() - was.t);
      setDragging(false);
      if (dy > height() * OPEN_SHARE || v > FLICK) setOpen(true);
      else close();
    };
    const click = (e: MouseEvent) => {
      if (performance.now() < barDrag.until) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click, true);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('click', click, true);
    };
  }, [bar]); // eslint-disable-line react-hooks/exhaustive-deps

  // Puxar a alcinha da gaveta para baixo fecha.
  const head = useRef<{ y: number } | null>(null);
  const headDown = (e: React.PointerEvent) => {
    head.current = { y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const headMove = (e: React.PointerEvent) => {
    if (!head.current) return;
    const dy = Math.max(0, e.clientY - head.current.y);
    if (dy > 4) {
      setDragging(true);
      setShown(height() - dy);
    }
  };
  const headUp = (e: React.PointerEvent) => {
    if (!head.current) return;
    const dy = e.clientY - head.current.y;
    head.current = null;
    setDragging(false);
    if (dy > height() * OPEN_SHARE || dy < 4) close();
    else setOpen(true);
  };

  if (!open && !dragging && !closing) return null;
  const h = typeof window === 'undefined' ? 600 : window.innerHeight * 0.8;
  const transform = dragging ? `translateY(max(0px, calc(100% - ${Math.round(shown)}px)))` : open ? 'translateY(0)' : 'translateY(100%)';
  const shade = dragging ? Math.min(1, shown / h) * 0.55 : open ? 0.55 : 0;
  return createPortal(
    <>
      <div className={`pull-shade${dragging ? '' : ' anim'}`} style={{ opacity: shade }} onClick={close} />
      <section ref={panel} className={`pull-drawer${dragging ? '' : ' anim'}`} style={{ transform }} role="dialog" aria-modal="true" aria-label="Mais">
        <div className="pull-head" onPointerDown={headDown} onPointerMove={headMove} onPointerUp={headUp}>
          <span className="pull-grab" aria-hidden="true" />
          <strong>Mais</strong>
        </div>
        <div className="pull-body" onClick={(e) => (e.target as Element).closest('button') && close()}>
          <MaisPanel />
        </div>
        {open && <BackCloser onClose={close} />}
      </section>
    </>,
    document.body,
  );
}
