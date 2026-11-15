import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { MaisPanel } from './modules/Mais';
import { Icon, useBackToClose } from './ui';
import { useStore } from './store';

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

/**
 * E22: a barra de baixo inteira se move com a gaveta (só visual; a barra continua a mesma).
 * - Puxando: acompanha o dedo, subindo e sumindo aos poucos.
 * - Abriu: impulso curto para baixo e é lançada para cima, por cima da gaveta.
 * - Fechou: cai de cima e assenta no lugar original. Soltou antes de abrir: só volta.
 * Com "menos movimento" no celular, só some e volta.
 */
const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function barFollow(el: HTMLElement, p: number) {
  el.getAnimations().forEach((a) => a.cancel());
  el.style.transition = 'none';
  el.style.zIndex = '112';
  el.style.pointerEvents = 'none';
  el.style.transform = `translateY(${-p * 70}px) scale(${1 - p * 0.04})`;
  el.style.opacity = String(Math.max(0, 1 - p * 1.3));
}
function barClear(el: HTMLElement) {
  el.getAnimations().forEach((a) => a.cancel());
  for (const k of ['transition', 'zIndex', 'pointerEvents', 'transform', 'opacity'] as const) el.style[k] = '';
}
function barLaunch(el: HTMLElement) {
  const from = { transform: el.style.transform || 'none', opacity: el.style.opacity || '1' };
  el.style.transition = 'none';
  el.style.zIndex = '112';
  el.style.pointerEvents = 'none';
  el.style.opacity = '0';
  if (reduceMotion()) return;
  el.animate(
    [
      from,
      { transform: 'translateY(6px) scale(0.98)', opacity: 1, offset: 0.22 }, // impulso
      { transform: 'translateY(-260px) scale(0.96)', opacity: 0 }, // lançada
    ],
    { duration: 380, easing: 'cubic-bezier(0.25, 0.7, 0.3, 1)', fill: 'forwards' },
  );
}
function barFall(el: HTMLElement) {
  el.getAnimations().forEach((a) => a.cancel());
  el.style.transition = 'none';
  el.style.zIndex = '112';
  el.style.pointerEvents = '';
  el.style.transform = '';
  el.style.opacity = '';
  if (reduceMotion()) return barClear(el);
  const a = el.animate(
    [
      { transform: 'translateY(-160px) scale(0.97)', opacity: 0 },
      { transform: 'translateY(5px) scale(1)', opacity: 1, offset: 0.74 }, // passa um pouquinho
      { transform: 'none', opacity: 1 }, // assenta no lugar
    ],
    { duration: 420, easing: 'cubic-bezier(0.35, 0, 0.25, 1)' },
  );
  a.onfinish = () => barClear(el);
}
function barSettle(el: HTMLElement) {
  const from = { transform: el.style.transform || 'none', opacity: el.style.opacity || '1' };
  el.style.transform = '';
  el.style.opacity = '';
  if (reduceMotion()) return barClear(el);
  const a = el.animate([from, { transform: 'none', opacity: 1 }], { duration: 280, easing: 'ease-out' });
  a.onfinish = () => barClear(el);
}

function BackCloser({ onClose }: { onClose: () => void }) {
  useBackToClose(onClose);
  return null;
}

export function PullToMais({ bar, resetKey }: { bar: RefObject<HTMLElement | null>; resetKey: string }) {
  const [shown, setShown] = useState(0); // quanto da gaveta aparece (px) durante o arrasto
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const [editing, setEditing] = useState(false);
  const { data, update } = useStore();
  const panel = useRef<HTMLElement>(null);
  const height = () => panel.current?.offsetHeight ?? window.innerHeight * 0.8;

  const openRef = useRef(false);
  openRef.current = open;
  const close = () => {
    setEditing(false);
    if (bar.current) (openRef.current ? barFall : barSettle)(bar.current);
    setDragging(false);
    setOpen(false);
    setShown(0);
    setClosing(true);
    window.setTimeout(() => setClosing(false), 280);
  };
  // Trocou de tela (escolheu um módulo na gaveta, voltou etc.): fecha.
  useEffect(() => {
    if (openRef.current && bar.current) barFall(bar.current);
    setOpen(false);
    setShown(0);
    setDragging(false);
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
    let g: { x: number; y: number; t: number; id: number; drag: boolean; target: HTMLElement | null; touch: boolean } | null = null;
    let synthAt = 0;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = (e.target as Element).closest('a, button') as HTMLElement | null;
      g = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, drag: false, target, touch: e.pointerType !== 'mouse' };
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
      if (g.drag) {
        setShown(Math.max(0, dy));
        barFollow(el, Math.min(1, Math.max(0, dy) / height()));
      }
    };
    const up = (e: PointerEvent) => {
      if (!g) return;
      const was = g;
      g = null;
      barDrag.active = false;
      if (!was.drag) {
        // C14: depois de um gesto (abrir/fechar o Mais), o celular às vezes não gera o clique do toque seguinte
        // na barra. Toque curto, sem arrastar, no mesmo ícone: a barra mesma faz o clique.
        const same = was.target && (e.target as Element).closest('a, button') === was.target;
        if (was.touch && same && Math.hypot(e.clientX - was.x, e.clientY - was.y) <= 10 && performance.now() - was.t <= 600) {
          synthAt = performance.now();
          was.target!.click();
        }
        return;
      }
      barDrag.until = performance.now() + 400; // o "soltar" não vale como toque num ícone
      const dy = was.y - e.clientY;
      const v = dy / Math.max(1, performance.now() - was.t);
      setDragging(false);
      if (dy > height() * OPEN_SHARE || v > FLICK) {
        barLaunch(el);
        setOpen(true);
      } else close();
    };
    const click = (e: MouseEvent) => {
      // Bloqueia só cliques "de verdade": o "soltar" do arrasto e o clique repetido depois do toque já tratado.
      if (e.isTrusted && (performance.now() < barDrag.until || performance.now() - synthAt < 700)) {
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

  // C14: logo depois do gesto de puxar, o celular às vezes não gera o "clique" do primeiro toque
  // (o dedo encosta e solta no módulo, mas nada acontece). Na gaveta, o toque é reconhecido aqui:
  // encostou e soltou no mesmo item, sem arrastar → abre; o clique do navegador que vier depois é ignorado.
  const tap = useRef<{ x: number; y: number; t: number; target: HTMLElement } | null>(null);
  const tapAt = useRef(0);
  const bodyDown = (e: React.PointerEvent) => {
    const target = (e.target as Element).closest('a, button') as HTMLElement | null;
    tap.current = target && e.pointerType !== 'mouse' ? { x: e.clientX, y: e.clientY, t: performance.now(), target } : null;
  };
  const bodyUp = (e: React.PointerEvent) => {
    const t = tap.current;
    tap.current = null;
    if (!t) return;
    const same = (e.target as Element).closest('a, button') === t.target;
    if (!same || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 10 || performance.now() - t.t > 600) return;
    tapAt.current = performance.now();
    t.target.click(); // abre o módulo (ou o atalho) pelo mesmo caminho do clique normal
  };
  const bodyClickCapture = (e: React.MouseEvent) => {
    // O clique "de verdade" que às vezes chega depois do toque já tratado: não abre duas vezes.
    if (e.nativeEvent.isTrusted && performance.now() - tapAt.current < 700) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Puxar a alcinha da gaveta para baixo fecha.
  const head = useRef<{ y: number } | null>(null);
  const headDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('button')) return; // botões do cabeçalho (jeito, lápis) não puxam a gaveta
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
      <div className={`pull-shade${dragging ? '' : ' anim'}`} style={{ opacity: shade }} onPointerUp={() => openRef.current && close()} onClick={() => openRef.current && close()} />
      <section ref={panel} className={`pull-drawer${dragging ? '' : ' anim'}`} style={{ transform }} role="dialog" aria-modal="true" aria-label="Mais">
        <div className="pull-head" onPointerDown={headDown} onPointerMove={headMove} onPointerUp={headUp}>
          <span className="pull-grab" aria-hidden="true" />
          <div className="pull-title">
            <strong>Menu</strong>
            <span className="pull-views" role="group" aria-label="Jeito do menu">
              {(['misto', 'grade', 'lista'] as const).map((v) => (
                <button key={v} type="button" aria-pressed={data.settings.drawerView === v} onClick={() => update((d) => ({ ...d, settings: { ...d.settings, drawerView: v } }))}>
                  {v === 'misto' ? 'Misto' : v === 'grade' ? 'Grade' : 'Lista'}
                </button>
              ))}
            </span>
            <button type="button" className={`icon-btn${editing ? ' on' : ''}`} aria-pressed={editing} aria-label={editing ? 'Terminar de mudar a ordem' : 'Mudar a ordem'} onClick={() => setEditing((x) => !x)}>
              <Icon name="edit" size={18} />
            </button>
          </div>
        </div>
        <div
          className="pull-body"
          onPointerDown={bodyDown}
          onPointerUp={bodyUp}
          onPointerCancel={() => (tap.current = null)}
          onClickCapture={bodyClickCapture}
          onClick={(e) => !editing && (e.target as Element).closest('button') && close()}
        >
          <MaisPanel editing={editing} />
        </div>
        {open && <BackCloser onClose={close} />}
      </section>
    </>,
    document.body,
  );
}
