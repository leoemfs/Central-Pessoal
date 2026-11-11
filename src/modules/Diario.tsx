import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { ViewProps } from '../App';
import { useStore } from '../store';
import { useSubAction } from '../router';
import { remove, upsert } from '../actions';
import type { JournalEntry, Photo } from '../types';
import { saveFile, shrinkImage } from '../files';
import { PhotoThumb, PhotoViewer } from './Fotos';
import { addMonths, formatDate, formatDateTime, formatDMY, formatMonth, monthKey, nowTime, pad, relativeDay, toISO, todayISO, uid } from '../utils';
import { Chips, Empty, Field, Icon, IconButton, MonthNav, PageHeader, Pill, Segmented, Sheet } from '../ui';

/** Fotos por registro (N9.3). */
const MAX_PHOTOS = 6;

export const JOURNAL_TAGS = ['Pessoal', 'Trabalho', 'Família', 'Saúde', 'Estudos', 'Viagem', 'Revisão'];

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
  const [viewing, setViewing] = useState<{ photos: Photo[]; start: number } | null>(null);
  const { data, update } = useStore();
  const [month, setMonth] = useState(monthKey(todayISO()));
  const [editing, setEditing] = useState<JournalEntry | 'new' | null>(null);
  const [history, setHistory] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<string> | null>(null);
  const [order, setOrder] = useState<'recentes' | 'antigos'>('recentes');

  useSubAction(route, 'diario', {
    nova: () => setEditing('new'),
    buscar: () => {
      setSearching(true);
      setQuery('');
      setOpen(null);
    },
  });

  const sorted = useMemo(() => [...data.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data.journal]);
  const q = query.trim().toLowerCase();
  const visible = searching && q
    ? sorted.filter((e) => [e.title, e.summary, e.content, e.tag].some((t) => t.toLowerCase().includes(q)))
    : sorted.filter((e) => monthKey(localDate(e.createdAt)) === month);
  if (!(searching && q) && order === 'antigos') visible.reverse();

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
      <PageHeader
        title="Meu diário"
        actions={
          <>
            {!searching && <MonthNav label={formatMonth(month)} onPrev={() => changeMonth(addMonths(month, -1))} onNext={() => changeMonth(addMonths(month, 1))} onLabel={() => setHistory(true)} />}
            <span className="desktop-only">
              <IconButton icon="search" label="Buscar no diário" onClick={() => { setSearching(true); setQuery(''); setOpen(null); }} />
            </span>
          </>
        }
      />

      {searching ? (
        <label className="search">
          <Icon name="search" size={18} />
          <input autoFocus placeholder="Buscar em todos os registros" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar no diário" />
          <button
            type="button"
            className="icon-btn"
            aria-label="Fechar busca"
            onClick={(e) => {
              e.preventDefault();
              setSearching(false);
              setQuery('');
              setOpen(null);
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </label>
      ) : (
        <Segmented
          label="Ordem"
          value={order}
          onChange={(o) => {
            setOrder(o);
            setOpen(null);
          }}
          options={[
            { value: 'recentes', label: 'Mais recentes' },
            { value: 'antigos', label: 'Mais antigos' },
          ]}
        />
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
              {isOpen && e.photos.length > 0 && (
                <div className="photo-grid">
                  {e.photos.map((p, i) => (
                    <PhotoThumb key={p.id} photo={p} onClick={() => setViewing({ photos: e.photos, start: i })} />
                  ))}
                </div>
              )}
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
                    Expandir registro{e.photos.length > 0 && <span className="muted small"> · {e.photos.length} foto{e.photos.length > 1 ? 's' : ''}</span>} <Icon name="down" size={18} />
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {!searching && visible.length === 0 && <Empty>Nenhum registro em {formatMonth(month).toLowerCase()}. Toque em + para escrever.</Empty>}
      </div>

      {editing && <EntryForm entry={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={(e) => { changeMonth(monthKey(localDate(e.createdAt))); setOpen(new Set([e.id])); setSearching(false); }} />}
      {viewing && <PhotoViewer photos={viewing.photos} start={viewing.start} onClose={() => setViewing(null)} />}
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
  // N9.3: fotos. As novas ficam só na tela até salvar (cancelar não guarda nada).
  const [photos, setPhotos] = useState<Photo[]>(entry?.photos ?? []);
  const [fresh, setFresh] = useState<Record<string, { blob: Blob; url: string }>>({});
  const [busy, setBusy] = useState(false);
  const pick = useRef<HTMLInputElement>(null);

  async function addPhotos(ev: ChangeEvent<HTMLInputElement>) {
    const files = [...(ev.target.files ?? [])].slice(0, MAX_PHOTOS - photos.length);
    ev.target.value = '';
    if (!files.length) return;
    setBusy(true);
    const added: Photo[] = [];
    const blobs: Record<string, { blob: Blob; url: string }> = {};
    for (const f of files) {
      try {
        const { blob, w, h } = await shrinkImage(f);
        const p: Photo = { id: uid(), type: 'image/jpeg', w, h };
        added.push(p);
        blobs[p.id] = { blob, url: URL.createObjectURL(blob) };
      } catch {
        setError('Uma das fotos não pôde ser aberta.');
      }
    }
    setPhotos((x) => [...x, ...added]);
    setFresh((x) => ({ ...x, ...blobs }));
    setBusy(false);
  }

  async function save() {
    if (!title.trim() && !content.trim() && !photos.length) return setError('Escreva um título ou o texto do registro.');
    try {
      for (const p of photos) if (fresh[p.id]) await saveFile(p.id, fresh[p.id].blob);
    } catch {
      return setError('Não deu para guardar as fotos neste aparelho.');
    }
    // Novo registro: usa o horário exato da criação. Na edição, o horário pode ser ajustado.
    const createdAt = entry ? new Date(`${date}T${time || '00:00'}:00`).toISOString() : now;
    const e: JournalEntry = {
      id: entry?.id ?? uid(),
      createdAt,
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      tag,
      photos,
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
          <button type="button" className="btn block" onClick={() => void save()} disabled={busy}>
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
      <div className="field">
        <span className="field-label">Fotos {photos.length > 0 && <span className="muted small">({photos.length} de {MAX_PHOTOS})</span>}</span>
        {photos.length > 0 && (
          <div className="photo-grid">
            {photos.map((p) => (
              <PhotoThumb key={p.id} photo={p} src={fresh[p.id]?.url} onRemove={() => setPhotos((x) => x.filter((y) => y.id !== p.id))} />
            ))}
          </div>
        )}
        {photos.length < MAX_PHOTOS && (
          <button type="button" className="btn block" style={{ marginTop: photos.length ? 10 : 0 }} onClick={() => pick.current?.click()} disabled={busy}>
            <Icon name="image" size={18} /> {busy ? 'Preparando fotos…' : 'Adicionar fotos'}
          </button>
        )}
        <input ref={pick} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
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
