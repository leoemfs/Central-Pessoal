import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { ViewProps } from '../App';
import { cleanAddress, go, useSubAction } from '../router';
import { useStore } from '../store';
import { remove, upsert } from '../actions';
import type { BecomeKind, Note, NoteKind } from '../types';
import { todayISO, uid } from '../utils';
import { Empty, Icon, IconButton, notify, PageHeader, Pill, Segmented, Sheet } from '../ui';
import {
  archived as archivedOf, BECOME, becameRoute, categoryCounts, transformNote, dropCategory, IDEA_STATUSES, ideaGroups, isBlankNote, newNote, noteSection, renameCategory, switchKind, visibleNotes,
} from '../notas';

/**
 * Notas e Banco de ideias (M17). Telas: #/arquivo (Notas, fichas de categoria) · #/ideias (situação e etiqueta)
 * · #/notasarq (Arquivados). Endereços de ação: <tela>/menu (+), /nova, /ideia, /categorias, /abrir-<id> (busca).
 */

type Mode = 'notas' | 'ideias' | 'arquivados';
const BASE: Record<Mode, string> = { notas: 'arquivo', ideias: 'ideias', arquivados: 'notasarq' };

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', '');
}

const nowISO = () => new Date().toISOString();

export const NotasPage = ({ route }: ViewProps) => <NotesScreen route={route} mode="notas" />;
export const IdeiasPage = ({ route }: ViewProps) => <NotesScreen route={route} mode="ideias" />;
export const ArquivadosPage = ({ route }: ViewProps) => <NotesScreen route={route} mode="arquivados" />;

function NotesScreen({ route, mode }: ViewProps & { mode: Mode }) {
  const base = BASE[mode];
  const { data, update } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [menu, setMenu] = useState(false);
  const [cats, setCats] = useState(false);
  const [quick, setQuick] = useState('');
  const [transform, setTransform] = useState(false);

  const selected = data.notes.find((n) => n.id === selectedId) ?? null;
  const names = mode === 'ideias' ? data.settings.ideaTags : data.settings.noteCategories;
  // A ficha escolhida pode ter sido apagada em Categorias.
  const active = filter && names.includes(filter) ? filter : '';

  useSubAction(route, base, {
    menu: () => setMenu(true),
    nova: () => create('nota'),
    ideia: () => create('ideia'),
    categorias: () => setCats(true),
  });
  // Vindo da busca ou de outra tela: #/<tela>/abrir-<id>.
  useEffect(() => {
    const m = /^abrir-(.+)$/.exec(route.sub);
    if (!m) return;
    setSelectedId(m[1]);
    cleanAddress(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.n, route.sub]);

  /** Troca a nota aberta, descartando a anterior se ela ficou vazia. */
  function select(id: string | null) {
    if (selected && selected.id !== id && isBlankNote(selected)) update(remove('notes', selected.id));
    setSelectedId(id);
  }

  function create(kind: NoteKind) {
    const category = (kind === 'ideia') === (mode === 'ideias') ? active : '';
    const note = newNote(uid(), kind, nowISO(), { category });
    if (selected && isBlankNote(selected)) update(remove('notes', selected.id));
    update(upsert('notes', note));
    const target = noteSection(note);
    if (target === base) setSelectedId(note.id);
    // Depois do useSubAction limpar o endereço desta tela.
    else setTimeout(() => go(`${target}/abrir-${note.id}`), 0);
  }

  function change(patch: Partial<Note>) {
    if (!selected) return;
    update(upsert('notes', { ...selected, ...patch, updatedAt: nowISO() }));
  }

  function toggleArchive() {
    if (!selected) return;
    const was = selected.archived;
    change({ archived: !was });
    setSelectedId(null);
    notify(was ? `Voltou para ${selected.kind === 'ideia' ? 'Ideias' : 'Notas'}` : 'Foi para Arquivados');
  }

  function toggleKind() {
    if (!selected) return;
    const next = switchKind(selected, nowISO());
    update(upsert('notes', next));
    setSelectedId(null);
    notify(next.kind === 'ideia' ? 'Agora é uma ideia' : 'Agora é uma nota', next.archived ? undefined : next.kind === 'ideia' ? 'Está em Ideias.' : 'Está em Notas.');
  }

  function del() {
    if (!selected) return;
    if (isBlankNote(selected) || confirm(`Excluir "${selected.title || 'Sem título'}"?`)) {
      update(remove('notes', selected.id));
      setSelectedId(null);
    }
  }

  function addQuick(e: FormEvent) {
    e.preventDefault();
    const title = quick.trim();
    if (!title) return;
    update(upsert('notes', newNote(uid(), 'ideia', nowISO(), { title, category: active })));
    setQuick('');
    notify('Ideia anotada');
  }

  const counts = useMemo(() => {
    if (mode === 'notas') return categoryCounts(data.notes);
    const out: Record<string, number> = {};
    for (const n of data.notes) if (n.kind === 'ideia' && !n.archived && n.category) out[n.category] = (out[n.category] ?? 0) + 1;
    return out;
  }, [data.notes, mode]);

  const sections = useMemo((): { label: string | null; items: Note[] }[] => {
    if (mode === 'notas') return [{ label: null, items: visibleNotes(data.notes, active) }];
    if (mode === 'ideias') return ideaGroups(data.notes, active).map((g) => ({ label: `${g.label} · ${g.items.length}`, items: g.items }));
    const a = archivedOf(data.notes);
    return [
      { label: a.ideas.length ? `Ideias · ${a.ideas.length}` : null, items: a.ideas },
      { label: a.notes.length ? `Notas · ${a.notes.length}` : null, items: a.notes },
    ].filter((s) => s.items.length);
  }, [data.notes, mode, active]);
  const total = sections.reduce((s, x) => s + x.items.length, 0);
  const kindTotal = mode === 'arquivados' ? 0 : data.notes.filter((n) => !n.archived && n.kind === (mode === 'ideias' ? 'ideia' : 'nota')).length;

  const emptyText =
    mode === 'notas'
      ? active ? 'Nenhuma nota nessa categoria.' : 'Nenhuma nota ainda. Toque no + para criar.'
      : mode === 'ideias'
        ? active ? 'Nenhuma ideia com essa etiqueta.' : 'Seu banco de ideias está vazio. Anote a primeira aqui em cima.'
        : 'Nada arquivado. Pelo botão de arquivar, dentro de uma nota ou ideia, ela vem para cá.';

  return (
    <>
      <PageHeader
        title={mode === 'notas' ? 'Notas' : mode === 'ideias' ? 'Ideias' : 'Arquivados'}
        tabs={
          mode === 'arquivados' ? undefined : (
            <div className="chips" role="radiogroup" aria-label={mode === 'ideias' ? 'Etiqueta' : 'Categoria'}>
              {['', ...names].map((c) => (
                <button key={c || '_todas'} type="button" role="radio" aria-checked={active === c} className={`chip-btn${active === c ? ' on' : ''}`} onClick={() => setFilter(c)}>
                  {c || 'Todas'} <span className="chip-count">{c ? counts[c] ?? 0 : kindTotal}</span>
                </button>
              ))}
              <button type="button" className="chip-btn chip-add" onClick={() => setCats(true)}>
                <Icon name="plus" size={14} /> Nova
              </button>
            </div>
          )
        }
      />

      <div className={`notes${selected ? ' has-selection' : ''}`}>
        <aside className="card notes-list">
          {mode === 'ideias' && (
            <form className="idea-quick" onSubmit={addQuick}>
              <input id="idea-quick" placeholder="Anotar uma ideia…" value={quick} onChange={(e) => setQuick(e.target.value)} aria-label="Anotar uma ideia" autoComplete="off" />
              <button type="submit" className="btn primary small" disabled={!quick.trim()}>Anotar</button>
            </form>
          )}
          {mode === 'arquivados' && total > 0 && <p className="muted small notes-hint">Aqui ficam as notas e ideias arquivadas. Abra uma para trazer de volta.</p>}
          {total === 0 ? (
            <Empty>{emptyText}</Empty>
          ) : (
            sections.map((s, i) => (
              <div key={s.label ?? i}>
                {s.label && <h3 className="notes-group">{s.label}</h3>}
                <ul className="list">
                  {s.items.map((n) => (
                    <li key={n.id}>
                      <button type="button" className={`note-item${n.id === selectedId ? ' on' : ''}`} onClick={() => select(n.id)}>
                        <span className="row-title">
                          {n.kind === 'ideia' && <Icon name="bulb" size={14} />}
                          {n.pinned && <Icon name="pin" size={13} />} {n.title.trim() || 'Sem título'}
                        </span>
                        {n.content.trim() && <span className="note-preview">{n.content.trim().slice(0, 90)}</span>}
                        <span className="note-meta">
                          {n.category && <Pill tone={n.kind === 'ideia' ? 'green' : 'gray'}>{n.category}</Pill>}
                          {n.kind === 'ideia' && mode === 'arquivados' && <Pill>{IDEA_STATUSES.find((x) => x.value === n.status)?.label}</Pill>}
                          <span className="muted small">{formatUpdated(n.updatedAt)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </aside>

        <section className="card notes-editor">
          {selected ? (
            <>
              <div className="editor-bar">
                <button type="button" className="btn ghost small back" onClick={() => select(null)}>
                  <Icon name="left" size={16} /> Voltar
                </button>
                <span className="muted small note-saved">{formatUpdated(selected.updatedAt)}</span>
                <div className="row-actions">
                  <IconButton icon="pin" label={selected.pinned ? 'Desafixar' : 'Fixar no início'} active={selected.pinned} onClick={() => change({ pinned: !selected.pinned })} />
                  <IconButton icon={selected.kind === 'ideia' ? 'note' : 'bulb'} label={selected.kind === 'ideia' ? 'Virar nota comum' : 'Mandar para o Banco de ideias'} onClick={toggleKind} />
                  <IconButton icon="archive" label={selected.archived ? 'Desarquivar' : 'Arquivar'} active={selected.archived} onClick={toggleArchive} />
                  <IconButton icon="trash" label="Excluir" tone="danger" onClick={del} />
                </div>
              </div>
              <input className="note-title" placeholder={selected.kind === 'ideia' ? 'Qual é a ideia?' : 'Título'} value={selected.title} onChange={(e) => change({ title: e.target.value })} aria-label="Título" autoFocus={isBlankNote(selected)} />
              <CategoryPicker
                label={selected.kind === 'ideia' ? 'Etiqueta' : 'Categoria'}
                names={selected.kind === 'ideia' ? data.settings.ideaTags : data.settings.noteCategories}
                value={selected.category}
                onChange={(category) => change({ category })}
              />
              {selected.kind === 'ideia' && (
                <div className="note-status">
                  <Segmented label="Situação da ideia" options={IDEA_STATUSES.map((s) => ({ value: s.value, label: s.label }))} value={selected.status} onChange={(status) => change({ status })} />
                </div>
              )}
              {selected.became ? (
                <BecameBanner note={selected} />
              ) : (
                <button type="button" className="btn soft block note-transform" onClick={() => setTransform(true)}>
                  <Icon name="send" size={16} /> Transformar em…
                </button>
              )}
              <textarea className="note-body" placeholder={selected.kind === 'ideia' ? 'Detalhes, por que vale a pena, primeiros passos…' : 'Escreva aqui…'} value={selected.content} onChange={(e) => change({ content: e.target.value })} aria-label="Texto" />
            </>
          ) : (
            <Empty>{mode === 'ideias' ? 'Toque numa ideia para abrir.' : 'Selecione uma nota ou crie uma nova.'}</Empty>
          )}
        </section>
      </div>

      {menu && (
        <Sheet title="Criar" onClose={() => setMenu(false)}>
          <div className="quick-list">
            {([
              { kind: 'nota', icon: 'note', title: 'Nova nota', hint: 'Texto livre, com categoria' },
              { kind: 'ideia', icon: 'bulb', title: 'Nova ideia', hint: 'Vai para o Banco de ideias' },
            ] as const).map((it) => (
              <button key={it.kind} type="button" className="tile" onClick={() => { setMenu(false); create(it.kind); }}>
                <span className="tile-icon"><Icon name={it.icon} /></span>
                <span className="tile-text"><strong>{it.title}</strong><span className="muted">{it.hint}</span></span>
                <Icon name="right" size={18} />
              </button>
            ))}
          </div>
          <div className="add-menu-sep" />
          <button type="button" className="tile" onClick={() => { setMenu(false); setCats(true); }}>
            <span className="tile-icon"><Icon name="tag" /></span>
            <span className="tile-text"><strong>Categorias</strong><span className="muted">Das notas e etiquetas das ideias</span></span>
            <Icon name="right" size={18} />
          </button>
        </Sheet>
      )}
      {cats && <CategoriesSheet onClose={() => setCats(false)} />}
      {transform && selected && (
        <TransformSheet
          note={selected}
          onClose={() => setTransform(false)}
          onDone={(kind) => {
            setTransform(false);
            setSelectedId(null);
            notify(`${BECOME[kind].done} ✓`, 'A nota foi para Arquivados, com o atalho.');
          }}
        />
      )}
    </>
  );
}

/** "✓ Virou tarefa" com o atalho para abrir (ou o aviso, se lá foi apagado). */
function BecameBanner({ note }: { note: Note }) {
  const { data } = useStore();
  const b = note.became!;
  const to = becameRoute(data, b);
  return (
    <div className="note-became">
      <span>
        <Icon name="check" size={16} /> <strong>{BECOME[b.kind].done}</strong>
        <span className="muted small"> · {to ? BECOME[b.kind].where : `foi apagada em ${BECOME[b.kind].where}`}</span>
      </span>
      {to && (
        <button type="button" className="btn primary small" onClick={() => go(to)}>
          Abrir
        </button>
      )}
    </div>
  );
}

const TRANSFORM_OPTIONS: { kind: BecomeKind; icon: 'tasks' | 'calendar' | 'cap' | 'cart' | 'target'; hint: string }[] = [
  { kind: 'tarefa', icon: 'tasks', hint: 'Agenda · prazo opcional, vai para o Google Tarefas' },
  { kind: 'compromisso', icon: 'calendar', hint: 'Agenda · dia e hora, aviso pelo Google Agenda' },
  { kind: 'notebook', icon: 'cap', hint: 'Estudos · o texto vira a primeira página' },
  { kind: 'lista', icon: 'cart', hint: 'Listas · cada linha vira um item' },
  { kind: 'meta', icon: 'target', hint: 'Meta de carreira · aparece em Objetivos' },
];

/** M17 parte 2: escolher no que a nota vira; tarefa, compromisso e lista pedem um detalhe antes. */
function TransformSheet({ note, onClose, onDone }: { note: Note; onClose: () => void; onDone: (k: BecomeKind) => void }) {
  const { data, update } = useStore();
  const [kind, setKind] = useState<BecomeKind | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [categoryId, setCategoryId] = useState(data.listCategories.find((c) => c.kind === 'checklist')?.id ?? data.listCategories[0]?.id ?? '');

  function run(k: BecomeKind) {
    update((d) => transformNote(d, note.id, { kind: k, date: date || null, time, categoryId }, uid(), nowISO()));
    onDone(k);
  }
  function pick(k: BecomeKind) {
    if (k === 'compromisso') setDate((v) => v || todayISO());
    if (k === 'tarefa' || k === 'compromisso' || k === 'lista') setKind(k);
    else run(k);
  }

  if (kind) {
    const ok = kind !== 'compromisso' || !!date;
    return (
      <Sheet
        title={`Virar ${BECOME[kind].label.toLowerCase()}`}
        onClose={onClose}
        footer={
          <button type="button" className="btn primary block" disabled={!ok || (kind === 'lista' && !categoryId)} onClick={() => run(kind)}>
            Criar {BECOME[kind].label.toLowerCase()}
          </button>
        }
      >
        <p className="muted small" style={{ marginBottom: 12 }}>
          “{note.title.trim() || 'Sem título'}”{kind === 'lista' ? ' · cada linha do texto vira um item.' : ''}
        </p>
        {kind === 'tarefa' && (
          <label className="field">
            <span className="field-label">Prazo (opcional)</span>
            <input className="input" type="date" id="tr-date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        )}
        {kind === 'compromisso' && (
          <div className="tr-row">
            <label className="field">
              <span className="field-label">Dia</span>
              <input className="input" type="date" id="tr-date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Hora (vazio = dia todo)</span>
              <input className="input" type="time" id="tr-time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
          </div>
        )}
        {kind === 'lista' && (
          <div className="chips" role="radiogroup" aria-label="Categoria da lista">
            {data.listCategories.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={categoryId === c.id} className={`chip-btn${categoryId === c.id ? ' on' : ''}`} onClick={() => setCategoryId(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet title="Transformar em" onClose={onClose}>
      <p className="muted small" style={{ marginBottom: 10 }}>O texto vai junto. {note.kind === 'ideia' ? 'A ideia' : 'A nota'} vai para Arquivados, com o atalho para o que virou.</p>
      <div className="quick-list">
        {TRANSFORM_OPTIONS.map((o) => (
          <button key={o.kind} type="button" className="tile" onClick={() => pick(o.kind)}>
            <span className="tile-icon"><Icon name={o.icon} /></span>
            <span className="tile-text"><strong>{BECOME[o.kind].label}</strong><span className="muted">{o.hint}</span></span>
            <Icon name="right" size={18} />
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/** Fichas para escolher a categoria (tocar de novo na escolhida tira). */
function CategoryPicker({ label, names, value, onChange }: { label: string; names: string[]; value: string; onChange: (v: string) => void }) {
  if (!names.length) return null;
  return (
    <div className="chips note-cats" role="radiogroup" aria-label={label}>
      {names.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} className={`chip-btn${value === c ? ' on' : ''}`} onClick={() => onChange(value === c ? '' : c)}>
          {c}
        </button>
      ))}
    </div>
  );
}

/** Categorias das notas e etiquetas das ideias: criar, renomear e apagar. */
function CategoriesSheet({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const groups: { key: 'noteCategories' | 'ideaTags'; kind: NoteKind; title: string; hint: string }[] = [
    { key: 'noteCategories', kind: 'nota', title: 'Categorias das notas', hint: 'Ex.: Inspiração, Ideia solta, Lembrete' },
    { key: 'ideaTags', kind: 'ideia', title: 'Etiquetas das ideias', hint: 'Ex.: App, Pessoal, Casa' },
  ];
  const [draft, setDraft] = useState<Record<string, string>>({});

  function setNames(key: 'noteCategories' | 'ideaTags', names: string[], notes?: (n: Note[]) => Note[]) {
    update((d) => ({ ...d, notes: notes ? notes(d.notes) : d.notes, settings: { ...d.settings, [key]: names } }));
  }

  return (
    <Sheet title="Categorias" onClose={onClose}>
      {groups.map((g) => {
        const names = data.settings[g.key];
        const value = draft[g.key] ?? '';
        const add = (e: FormEvent) => {
          e.preventDefault();
          const name = value.trim().slice(0, 30);
          if (!name) return;
          if (names.some((n) => n.toLowerCase() === name.toLowerCase())) return notify('Essa já existe');
          setNames(g.key, [...names, name]);
          setDraft({ ...draft, [g.key]: '' });
        };
        return (
          <section key={g.key} className="cat-group">
            <h3>{g.title}</h3>
            <ul className="cat-names">
              {names.map((name) => (
                <li key={name}>
                  <input
                    className="input"
                    defaultValue={name}
                    aria-label={`Renomear ${name}`}
                    maxLength={30}
                    onBlur={(e) => {
                      const to = e.target.value.trim();
                      if (!to || to === name) { e.target.value = name; return; }
                      if (names.some((n) => n !== name && n.toLowerCase() === to.toLowerCase())) { e.target.value = name; notify('Essa já existe'); return; }
                      setNames(g.key, names.map((n) => (n === name ? to : n)), (ns) => renameCategory(ns, g.kind, name, to));
                    }}
                  />
                  <IconButton icon="trash" label={`Apagar ${name}`} tone="danger" onClick={() => setNames(g.key, names.filter((n) => n !== name), (ns) => dropCategory(ns, g.kind, name))} />
                </li>
              ))}
            </ul>
            <form className="cat-add" onSubmit={add}>
              <input className="input" id={`cat-add-${g.key}`} placeholder={g.hint} value={value} maxLength={30} onChange={(e) => setDraft({ ...draft, [g.key]: e.target.value })} aria-label={`Nova em ${g.title}`} />
              <button type="submit" className="btn soft small" disabled={!value.trim()}><Icon name="plus" size={16} /> Criar</button>
            </form>
          </section>
        );
      })}
    </Sheet>
  );
}
