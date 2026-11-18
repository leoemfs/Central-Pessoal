import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Icon, useBackToClose, type IconName } from './ui';
import type { MenuEntry } from './menuItems';

/**
 * E41: ações da tela que vão para o menu ⋮ da barra de cima.
 * A tela chama usePageMenu([...]); ao sair, as ações somem sozinhas.
 */
export interface PageAction extends MenuEntry {
  run: () => void;
}

const owners = new Map<number, PageAction[]>();
let snapshot: PageAction[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => {
  snapshot = [...owners.values()].flat();
  listeners.forEach((l) => l());
};

export function usePageMenu(items: (PageAction | false | null | undefined)[]) {
  const list = items.filter((i): i is PageAction => !!i);
  const latest = useRef(list);
  latest.current = list;
  const [id] = useState(() => ++seq);
  const key = list.map((i) => `${i.id}:${i.label}`).join('|');
  useEffect(() => {
    owners.set(
      id,
      latest.current.map((i) => ({ ...i, run: () => latest.current.find((x) => x.id === i.id)?.run() })),
    );
    emit();
    return () => {
      owners.delete(id);
      emit();
    };
  }, [id, key]);
}

export function useCurrentPageMenu(): PageAction[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
  );
}

/** Botão ⋮ e a lista de opções. `tip`: mostra uma vez o balão "Mais opções aqui". */
export function PageMenuButton({ items, onPick, tip, onTipSeen }: { items: MenuEntry[]; onPick: (id: string) => void; tip?: boolean; onTipSeen?: () => void }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const [tipOn, setTipOn] = useState(false);
  useEffect(() => {
    if (!tip) return;
    setTipOn(true);
    const t = window.setTimeout(() => {
      setTipOn(false);
      onTipSeen?.();
    }, 6000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tip]);
  function toggle() {
    if (tipOn) {
      setTipOn(false);
      onTipSeen?.();
    }
    setOpen((v) => !v);
  }
  /** Fecha o menu e só depois faz a ação (o voltar do menu termina antes de abrir outra tela ou janela). */
  function pick(id: string) {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      window.removeEventListener('popstate', run);
      onPick(id);
    };
    window.addEventListener('popstate', run);
    window.setTimeout(run, 400);
    setOpen(false);
  }
  return (
    <>
      <button ref={btn} type="button" className={`icon-btn page-menu-btn${open ? ' on' : ''}`} onClick={toggle} aria-label="Mais opções" aria-haspopup="menu" aria-expanded={open}>
        <Icon name="moreV" />
      </button>
      {tipOn && !open && <MenuTip anchor={btn.current} />}
      {open && <MenuPop anchor={btn.current} items={items} onPick={pick} onClose={() => setOpen(false)} />}
    </>
  );
}

function place(anchor: HTMLElement | null) {
  const r = anchor?.getBoundingClientRect();
  return r ? { top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) } : { top: 60, right: 8 };
}

function MenuTip({ anchor }: { anchor: HTMLElement | null }) {
  return createPortal(
    <div className="page-menu-tip" style={place(anchor)} role="status">
      Mais opções aqui
    </div>,
    document.body,
  );
}

function MenuPop({ anchor, items, onPick, onClose }: { anchor: HTMLElement | null; items: MenuEntry[]; onPick: (id: string) => void; onClose: () => void }) {
  useBackToClose(onClose);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus({ preventScroll: true }), []);
  // Fecha ao encostar o dedo fora (inclusive começando a rolar) e ao rolar a página.
  useEffect(() => {
    const y0 = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - y0) > 24) onClose();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return createPortal(
    <>
      <div
        className="page-menu-shade"
        onPointerDown={(e) => {
          e.preventDefault();
          onClose();
        }}
        onClick={onClose}
      />
      <div className="page-menu" role="menu" style={place(anchor)} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        {items.map((it, i) => (
          <button key={it.id} ref={i === 0 ? first : undefined} type="button" role="menuitem" className={it.search ? 'search' : undefined} onClick={() => onPick(it.id)}>
            {it.icon && <Icon name={it.icon as IconName} size={18} />}
            <span>{it.label}</span>
          </button>
        ))}
      </div>
    </>,
    document.body,
  );
}
