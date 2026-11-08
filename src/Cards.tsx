import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { useStore } from './store';
import { arrange, hideCard, moveCard, showCard, type CardInfo } from './cardLayout';
import { Icon, notify } from './ui';

/**
 * Lápis ao lado da lupa: a tela que usa <CardScreen> fica personalizável.
 * A barra de cima mostra o lápis quando há uma tela assim aberta.
 */
let state: { screen: string | null; editing: boolean } = { screen: null, editing: false };
const listeners = new Set<() => void>();
const set = (next: Partial<typeof state>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useCardEditor() {
  const s = useSyncExternalStore(subscribe, () => state);
  return { screen: s.screen, editing: s.editing, toggle: () => set({ editing: !s.editing }) };
}

export interface CardDef extends CardInfo {
  node: ReactNode;
}

const LOCK_TEXT = { top: 'Fixo no topo', keep: 'Aviso importante: não some, só muda de lugar' } as const;

export function CardScreen({ screen, cards }: { screen: string; cards: CardDef[] }) {
  const { data, update } = useStore();
  const { editing } = useSyncExternalStore(subscribe, () => state);
  useEffect(() => {
    set({ screen, editing: false });
    return () => set({ screen: null, editing: false });
  }, [screen]);
  const layout = data.settings.cards[screen];
  const { shown, hidden } = arrange(cards, layout);
  const movable = shown.filter((c) => c.lock !== 'top');
  const save = (next: ReturnType<typeof moveCard> | null) =>
    update((d) => {
      const cardsSettings = { ...d.settings.cards };
      if (next) cardsSettings[screen] = next;
      else delete cardsSettings[screen];
      return { ...d, settings: { ...d.settings, cards: cardsSettings } };
    });

  return (
    <>
      {editing && (
        <div className="editbar" role="status">
          <span>Personalizando esta tela</span>
          <button
            type="button"
            className="btn-reset"
            onClick={() => {
              save(null);
              notify('Voltou ao padrão');
            }}
          >
            Restaurar padrão
          </button>
          <button type="button" className="btn-done" onClick={() => set({ editing: false })}>
            Pronto
          </button>
        </div>
      )}
      {shown.map((c) => {
        const i = movable.indexOf(c);
        return (
          <div key={c.id} className={`card-slot${editing ? ' editing' : ''}`}>
            <div className="card-slot-body" data-empty={`${c.label} (aparece quando houver algo)`}>
              {c.node}
            </div>
            {editing && (
              <div className="card-slot-ctl">
                <span className="card-slot-name">
                  {c.lock === 'top' && <Icon name="lock" size={14} />} <strong>{c.label}</strong>
                  {c.lock && <span className="muted small">{LOCK_TEXT[c.lock]}</span>}
                </span>
                {c.lock !== 'top' && (
                  <>
                    <button type="button" aria-label={`Subir ${c.label}`} disabled={i === 0} onClick={() => save(moveCard(cards, layout, c.id, -1))}>
                      <Icon name="up" size={18} />
                    </button>
                    <button type="button" aria-label={`Descer ${c.label}`} disabled={i === movable.length - 1} onClick={() => save(moveCard(cards, layout, c.id, 1))}>
                      <Icon name="down" size={18} />
                    </button>
                  </>
                )}
                {!c.lock && (
                  <button type="button" aria-label={`Ocultar ${c.label}`} onClick={() => save(hideCard(cards, layout, c.id))}>
                    <Icon name="eyeOff" size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {editing && hidden.length > 0 && (
        <div className="hidden-cards">
          <h4>Cartões ocultos</h4>
          {hidden.map((c) => (
            <div key={c.id} className="hidden-card-row">
              <span>{c.label}</span>
              <button type="button" onClick={() => save(showCard(cards, layout, c.id))}>
                Mostrar
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
