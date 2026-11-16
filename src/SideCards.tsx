import { useState } from 'react';
import { useStore } from './store';
import { moveSide, sideCandidates } from './cardLayout';
import { FAVORITABLE, favoriteItems } from './moduleBar';
import { isHidden } from './setup';
import { useHomeCards } from './modules/Dashboard';
import { Icon } from './ui';
import { useWideScreen } from './wide';

/**
 * E35.2: coluna "Sempre à vista" do computador (janela de 1280 px ou mais).
 * Usa os mesmos cartões do Início; os que estão aqui saem do Início enquanto a coluna aparece.
 */
export function SideCards() {
  const wide = useWideScreen();
  return wide ? <SideColumn /> : null;
}

function SideColumn() {
  const { data, update } = useStore();
  const { cards, extra } = useHomeCards();
  const [editing, setEditing] = useState(false);
  const ids = data.settings.sideCards;
  const byId = new Map(cards.map((c) => [c.id, c]));
  const shown = ids.flatMap((id) => byId.get(id) ?? []);
  const available = sideCandidates(cards).filter((c) => !ids.includes(c.id));
  const save = (sideCards: string[]) => update((d) => ({ ...d, settings: { ...d.settings, sideCards } }));
  const shortcuts = favoriteItems(data.settings.sideShortcuts).filter((it) => !isHidden(data, it.to));
  const moreShortcuts = FAVORITABLE.filter((f) => !data.settings.sideShortcuts.includes(f.id) && !isHidden(data, f.to));
  const saveShortcuts = (sideShortcuts: string[]) => update((d) => ({ ...d, settings: { ...d.settings, sideShortcuts } }));

  return (
    <aside className={`quick${editing ? ' editing' : ''}`} aria-label="Sempre à vista">
      <div className="quick-head">
        <b>Sempre à vista</b>
        <button type="button" className="quick-edit" aria-pressed={editing} onClick={() => setEditing(!editing)}>
          {editing ? 'Pronto' : (
            <>
              <Icon name="edit" size={14} /> Editar
            </>
          )}
        </button>
      </div>
      <div className="quick-list">
        {(shortcuts.length > 0 || editing) && (
          <nav className="quick-shortcuts" aria-label="Atalhos">
            {shortcuts.map((it) => (
              <span key={it.id} className="quick-sc-wrap">
                <a className="quick-sc" href={`#/${it.to}`}>
                  <span className="mg-icon" data-mod={it.id}>
                    <Icon name={it.icon} size={20} />
                  </span>
                  <span className="quick-sc-name">{it.label}</span>
                </a>
                {editing && (
                  <button type="button" className="quick-sc-x" aria-label={`Tirar o atalho ${it.label}`} onClick={() => saveShortcuts(data.settings.sideShortcuts.filter((x) => x !== it.id))}>
                    <Icon name="x" size={12} />
                  </button>
                )}
              </span>
            ))}
          </nav>
        )}
        {editing && moreShortcuts.length > 0 && (
          <div className="quick-add">
            <span className="muted small">Adicionar atalho</span>
            <div className="quick-add-chips">
              {moreShortcuts.map((f) => (
                <button key={f.id} type="button" onClick={() => saveShortcuts([...data.settings.sideShortcuts, f.id])}>
                  <Icon name="plus" size={14} /> {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {shown.map((c, i) => (
          <div key={c.id} className="quick-item">
            {editing && (
              <div className="quick-ctl">
                <strong>{c.label}</strong>
                <button type="button" aria-label={`Subir ${c.label}`} disabled={i === 0} onClick={() => save(moveSide(ids, c.id, -1))}>
                  <Icon name="up" size={16} />
                </button>
                <button type="button" aria-label={`Descer ${c.label}`} disabled={i === shown.length - 1} onClick={() => save(moveSide(ids, c.id, 1))}>
                  <Icon name="down" size={16} />
                </button>
                <button type="button" aria-label={`Tirar ${c.label} da coluna (volta para o Início)`} onClick={() => save(ids.filter((x) => x !== c.id))}>
                  <Icon name="x" size={16} />
                </button>
              </div>
            )}
            <div className="quick-slot" data-empty={`${c.label} (aparece quando houver algo)`}>
              {c.node}
            </div>
          </div>
        ))}
        {shown.length === 0 && !editing && <p className="muted small quick-empty">Nenhum cartão aqui. Toque em Editar para escolher.</p>}
        {editing && available.length > 0 && (
          <div className="quick-add">
            <span className="muted small">Adicionar (sai do Início enquanto estiver aqui)</span>
            {available.map((c) => (
              <button key={c.id} type="button" onClick={() => save([...ids, c.id])}>
                <Icon name="plus" size={14} /> {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {extra}
    </aside>
  );
}
