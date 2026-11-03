import { useMemo, useState } from 'react';
import type { ViewProps } from '../App';
import { useStore } from '../store';
import { useSubAction } from '../router';
import { remove, upsert } from '../actions';
import type { JournalEntry } from '../types';
import { addMonths, formatDate, formatDateTime, formatDMY, formatMonth, monthKey, nowTime, pad, relativeDay, toISO, todayISO, uid } from '../utils';
import { Chips, Empty, Field, Icon, IconButton, Pill, Sheet } from '../ui';

export const JOURNAL_TAGS = ['Pessoal', 'Trabalho', 'Família', 'Saúde', 'Estudos', 'Viagem'];

const localDate = (iso: string) => toISO(new Date(iso));
const localTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Resumo exibido: o informado, ou o começo do texto. */
export function entrySummary(e: JournalEntry): string {
  if (e.summary.trim()) return e.summary.trim();
  const t = e.content.trim().replace(/\s+/g, ' ');
  return t.length > 120 ? `${t.slice(0, 117)}…` : t;
}

export function entryTitle(e: JournalEntry): string {
  return e.title.trim() || `Registro das ${localTime(e.createdAt)}`;
}

function dayLabel(iso: string): string {
  const day = localDate(iso);
  const rel = relativeDay(day);
  return rel === 'Hoje' || rel === 'Ontem' ? rel : formatDate(day, { day: '2-digit', month: 'long' });
}

export function Diario({ route }: ViewProps) {
  const { data, update } = useStore();
  const [month, setMonth] = useState(monthKey(todayISO()));
  const [editing, setEditing] = useState<JournalEntry | 'new' | null>(null);
  const [history, setHistory] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<string> | null>(null);

  useSubAction(route, 'diario', { nova: () => setEditing('new') });

  const sorted = useMemo(() => [...data.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data.journal]);
  const q = query.trim().toLowerCase();
  const visible = searching && q
    ? sorted.filter((e) => [e.title, e.summary, e.content, e.tag].some((t) => t.toLowerCase().includes(q)))
    : sorted.filter((e) => monthKey(localDate(e.createdAt)) === month);

  // Por padrão, o registro mais recente da lista aparece aberto.
  const openSet = open ?? new Set(visible[0] ? [visible[0].id] : []);
  function toggle(id: string) {
    const next = new Set(openSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  }
  function changeMonth(m: string) {
    setMonth(m);
    setOpen(null);
  }

  function del(e: JournalEntry) {
    if (confirm(`Excluir o registro "${entryTitle(e)}"?`)) update(remove('journal', e.id));
  }

  return (
    <>
      <header className="page-header">
        <h1>Meu diário</h1>
        <IconButton
          icon={searching ? 'x' : 'search'}
          label={searching ? 'Fechar busca' : 'Buscar no diário'}
          onClick={() => {
            setSearching((s) => !s);
            setQuery('');
            setOpen(null);
          }}
        />
      </header>

      {searching ? (
        <label className="search">
          <Icon name="search" size={18} />
          <input autoFocus placeholder="Buscar em todos os registros" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar no diário" />
        </label>
      ) : (
        <div className="feed-head">
          <div className="month-nav">
            <IconButton icon="left" label="Mês anterior" onClick={() => changeMonth(addMonths(month, -1))} />
            <button type="button" className="link-like" onClick={() => setHistory(true)} aria-label="Abrir histórico">
              <h2>{formatMonth(month).replace(' de ', ' ')}</h2>
            </button>
            <IconButton icon="right" label="Próximo mês" onClick={() => changeMonth(addMonths(month, 1))} />
          </div>
          <span className="count-badge">
            {visible.length} {visible.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      )}

      <div className="feed">
        {searching && q && visible.length === 0 && <Empty>Nenhum registro encontrado.</Empty>}
        {visible.map((e) => {
          const isOpen = openSet.has(e.id) || (searching && q !== '');
          return (
            <article key={e.id} className={`entry${isOpen ? ' open' : ''}`}>
              <div className="entry-top">
                <span className="entry-day">{dayLabel(e.createdAt)}</span>
                <span className="entry-time">{formatDateTime(e.createdAt)}</span>
              </div>
              <h3 className="entry-title">{entryTitle(e)}</h3>
              {entrySummary(e) && <p className="entry-summary">{entrySummary(e)}</p>}
              {isOpen && e.content.trim() && <div className="entry-content">{e.content}</div>}
              <div className="entry-foot">
                {isOpen ? (
                  <>
                    {e.tag ? <span className="tag-pill">Registro {e.tag.toLowerCase()}</span> : <span />}
                    <div className="row-actions">
                      <IconButton icon="edit" label="Editar registro" onClick={() => setEditing(e)} />
                      <IconButton icon="trash" label="Excluir registro" tone="danger" onClick={() => del(e)} />
                      {!searching && <IconButton icon="up" label="Recolher registro" onClick={() => toggle(e.id)} />}
                    </div>
                  </>
                ) : (
                  <button type="button" className="expand-btn" onClick={() => toggle(e.id)}>
                    Expandir registro <Icon name="down" size={18} />
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {!searching && (
          <button type="button" className="new-entry" onClick={() => setEditing('new')}>
            <Icon name="plusCircle" size={36} />
            <strong>Nova atualização</strong>
            <span className="muted">Registrar um acontecimento, pensamento ou experiência.</span>
          </button>
        )}
      </div>

      {editing && <EntryForm entry={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={(e) => { changeMonth(monthKey(localDate(e.createdAt))); setOpen(new Set([e.id])); setSearching(false); }} />}
      {history && <HistorySheet entries={data.journal} month={month} onPick={(m) => { changeMonth(m); setHistory(false); }} onClose={() => setHistory(false)} />}
    </>
  );
}

function EntryForm({ entry, onClose, onSaved }: { entry?: JournalEntry; onClose: () => void; onSaved: (e: JournalEntry) => void }) {
  const { update } = useStore();
  const [now] = useState(() => new Date().toISOString());
  const [date, setDate] = useState(entry ? localDate(entry.createdAt) : todayISO());
  const [time, setTime] = useState(entry ? localTime(entry.createdAt) : nowTime());
  const [title, setTitle] = useState(entry?.title ?? '');
  const [summary, setSummary] = useState(entry?.summary ?? '');
  const [content, setContent] = useState(entry?.content ?? '');
  const [tag, setTag] = useState(entry?.tag ?? '');
  const [error, setError] = useState('');

  function save() {
    if (!title.trim() && !content.trim()) return setError('Escreva um título ou o texto do registro.');
    // Novo registro: usa o horário exato da criação. Na edição, o horário pode ser ajustado.
    const createdAt = entry ? new Date(`${date}T${time || '00:00'}:00`).toISOString() : now;
    const e: JournalEntry = {
      id: entry?.id ?? uid(),
      createdAt,
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      tag,
      updatedAt: new Date().toISOString(),
    };
    update(upsert('journal', e));
    onSaved(e);
    onClose();
  }

  return (
    <Sheet
      title={entry ? 'Editar registro' : 'Nova atualização'}
      badge={entry ? undefined : <Pill tone="green">Novo registro</Pill>}
      onClose={onClose}
      footer={
        <>
          {error && <p className="form-error">{error}</p>}
          <button type="button" className="btn block" onClick={save}>
            <Icon name="send" size={18} />
            <span className="green">{entry ? 'Salvar registro' : 'Publicar atualização'}</span>
          </button>
        </>
      }
    >
      {entry ? (
        <div className="form-row">
          <Field label="Data">
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Horário">
            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
      ) : (
        <div className="when-box">
          <span className="when">
            <Icon name="calendar" size={18} /> {formatDMY(date)}
          </span>
          <span className="when">
            <Icon name="clock" size={18} /> {time}
          </span>
          <span className="muted small">Data e horário preenchidos automaticamente.</span>
        </div>
      )}
      <Field label="Título">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Dê um título para sua atualização…" autoFocus={!entry} />
      </Field>
      <Field label="Resumo" hint="Opcional — se ficar vazio, o começo do texto é usado.">
        <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Uma pequena descrição do registro…" />
      </Field>
      <Field label="Descrição completa">
        <textarea className="input" rows={7} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escreva livremente sobre seu dia, acontecimentos, pensamentos e experiências…" />
      </Field>
      <div className="field">
        <span className="field-label">Etiqueta (opcional)</span>
        <Chips label="Etiqueta" value={tag} onChange={(v) => setTag(v === tag ? '' : v)} options={JOURNAL_TAGS.map((t) => ({ value: t, label: t }))} />
      </div>
      <div className="future-box">
        <Icon name="image" size={24} />
        Adicionar imagens (em breve)
      </div>
    </Sheet>
  );
}

function HistorySheet({ entries, month, onPick, onClose }: { entries: JournalEntry[]; month: string; onPick: (m: string) => void; onClose: () => void }) {
  const byYear = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      const m = monthKey(localDate(e.createdAt));
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    const years = new Map<string, [string, number][]>();
    for (const [m, n] of [...counts.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
      const y = m.slice(0, 4);
      years.set(y, [...(years.get(y) ?? []), [m, n]]);
    }
    return [...years.entries()];
  }, [entries]);

  return (
    <Sheet title="Histórico" onClose={onClose}>
      {byYear.length === 0 ? (
        <Empty>Nenhum registro ainda.</Empty>
      ) : (
        byYear.map(([year, months]) => (
          <div key={year}>
            <p className="history-year">{year}</p>
            <div className="history-months">
              {months.map(([m, n]) => (
                <button key={m} type="button" className={m === month ? 'on' : ''} onClick={() => onPick(m)}>
                  <strong>{formatMonth(m).split(' ')[0]}</strong>
                  <span className="muted small">
                    {n} {n === 1 ? 'registro' : 'registros'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </Sheet>
  );
}
