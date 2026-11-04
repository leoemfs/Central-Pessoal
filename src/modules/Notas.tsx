import { useMemo, useState } from 'react';
import type { ViewProps } from '../App';
import { useSubAction } from '../router';
import { useStore } from '../store';
import { remove, upsert } from '../actions';
import type { Note } from '../types';
import { uid } from '../utils';
import { Empty, Icon, IconButton, PageHeader } from '../ui';

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', '');
}

const isBlank = (n: Note) => !n.title.trim() && !n.content.trim();

export function Notas({ route }: ViewProps) {
  const { data, update } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const notes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.notes
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [data.notes, query]);

  const selected = data.notes.find((n) => n.id === selectedId) ?? null;
  useSubAction(route, 'arquivo', { nova: () => create() });

  /** Troca a nota aberta, descartando a anterior se ela ficou vazia. */
  function select(id: string | null) {
    if (selected && selected.id !== id && isBlank(selected)) update(remove('notes', selected.id));
    setSelectedId(id);
  }

  function create() {
    const note: Note = { id: uid(), title: '', content: '', pinned: false, updatedAt: new Date().toISOString() };
    if (selected && isBlank(selected)) update(remove('notes', selected.id));
    update(upsert('notes', note));
    setSelectedId(note.id);
    setQuery('');
  }

  function change(patch: Partial<Note>) {
    if (!selected) return;
    update(upsert('notes', { ...selected, ...patch, updatedAt: new Date().toISOString() }));
  }

  function del() {
    if (!selected) return;
    if (isBlank(selected) || confirm(`Excluir a nota "${selected.title || 'Sem título'}"?`)) {
      update(remove('notes', selected.id));
      setSelectedId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Notas"
        subtitle={`${data.notes.length} nota(s)`}
      />

      <div className={`notes${selected ? ' has-selection' : ''}`}>
        <aside className="card notes-list">
          <label className="search">
            <Icon name="search" size={16} />
            <input placeholder="Buscar notas" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar notas" />
          </label>
          {notes.length === 0 ? (
            <Empty>{data.notes.length === 0 ? 'Nenhuma nota ainda.' : 'Nenhuma nota encontrada.'}</Empty>
          ) : (
            <ul className="list">
              {notes.map((n) => (
                <li key={n.id}>
                  <button type="button" className={`note-item${n.id === selectedId ? ' on' : ''}`} onClick={() => select(n.id)}>
                    <span className="row-title">
                      {n.pinned && <Icon name="pin" size={13} />} {n.title.trim() || 'Sem título'}
                    </span>
                    <span className="note-preview">{n.content.trim().slice(0, 90) || 'Vazia'}</span>
                    <span className="muted small">{formatUpdated(n.updatedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="card notes-editor">
          {selected ? (
            <>
              <div className="editor-bar">
                <button type="button" className="btn ghost small back" onClick={() => select(null)}>
                  <Icon name="left" size={16} /> Voltar
                </button>
                <span className="muted small">Salvo automaticamente · {formatUpdated(selected.updatedAt)}</span>
                <div className="row-actions">
                  <IconButton icon="pin" label={selected.pinned ? 'Desafixar' : 'Fixar no início'} active={selected.pinned} onClick={() => change({ pinned: !selected.pinned })} />
                  <IconButton icon="trash" label="Excluir" tone="danger" onClick={del} />
                </div>
              </div>
              <input className="note-title" placeholder="Título" value={selected.title} onChange={(e) => change({ title: e.target.value })} aria-label="Título da nota" autoFocus={isBlank(selected)} />
              <textarea className="note-body" placeholder="Escreva aqui…" value={selected.content} onChange={(e) => change({ content: e.target.value })} aria-label="Conteúdo da nota" />
            </>
          ) : (
            <Empty>Selecione uma nota ou crie uma nova.</Empty>
          )}
        </section>
      </div>
    </>
  );
}
