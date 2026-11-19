import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { ViewProps } from '../App';
import { useStore } from '../store';
import { useSubAction } from '../router';
import { remove, upsert } from '../actions';
import type { JournalEntry, Photo } from '../types';
import { saveFile, shrinkImage } from '../files';
import { PhotoThumb, PhotoViewer } from './Fotos';
import { addMonths, formatDate, formatDateTime, formatDMY, formatMonth, monthKey, nowTime, pad, relativeDay, toISO, todayISO, uid } from '../utils';
import { Chips, Empty, Field, Icon, IconButton, MonthNav, PageHeader, Pill, Sheet } from '../ui';
import { usePageMenu } from '../PageMenu';
import { DiarioGuideCard, DiarioGuideSheet } from './DiarioGuia';
import { CardScreen, type CardDef } from '../Cards';
import { currentStreak, dailyPrompt, memories, mondayOf, weekDays, writtenDays } from '../journal';

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
  const today = todayISO();
  const [month, setMonth] = useState(monthKey(today));
  const [editing, setEditing] = useState<JournalEntry | 'new' | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<string> | null>(null);
  const [tagFilter, setTagFilter] = useState('');
  // M44: a ordem fica no menu ⋮ e é lembrada.
  const order = data.settings.journalOrder;
  const [guide, setGuide] = useState(false);
  // E43: o guia fica no ⋮ (antes da busca); com o cartão arquivado, dá para trazê-lo de volta.
  const guideOff = data.settings.guidesOff.includes('diario');

  useSubAction(route, 'diario', {
    nova: () => setEditing('new'),
    buscar: () => {
      setSearching(true);
      setQuery('');
      setOpen(null);
      setTagFilter('');
    },
  });

  usePageMenu([
    {
      id: 'ordem',
      label: order === 'antigos' ? 'Mais recentes primeiro' : 'Mais antigos primeiro',
      icon: order === 'antigos' ? 'down' : 'up',
      run: () => {
        update((d) => ({ ...d, settings: { ...d.settings, journalOrder: d.settings.journalOrder === 'antigos' ? 'recentes' : 'antigos' } }));
        setOpen(null);
      },
    },
    { id: 'guia', label: 'Como usar Diário', icon: 'info', run: () => setGuide(true) },
    guideOff && { id: 'guia-card', label: 'Mostrar o cartão "Como usar"', icon: 'info', run: () => update((d) => ({ ...d, settings: { ...d.settings, guidesOff: d.settings.guidesOff.filter((x) => x !== 'diario'), guidesSeen: d.settings.guidesSeen.filter((x) => x !== 'diario') } })) },
  ]);

  const sorted = useMemo(() => [...data.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data.journal]);
  const counts = useMemo(() => monthCounts(data.journal), [data.journal]);
  const q = query.trim().toLowerCase();
  const pool = searching && q
    ? sorted.filter((e) => [e.title, e.summary, e.content, e.tag, e.prompt ?? ''].some((t) => t.toLowerCase().includes(q)))
    : searching
      ? []
      : sorted.filter((e) => monthKey(localDate(e.createdAt)) === month);
  const visible = tagFilter ? pool.filter((e) => e.tag === tagFilter) : [...pool];
  if (!(searching && q) && order === 'antigos') visible.reverse();
  // M44: fichas das etiquetas que têm registro (a escolhida fica mesmo sem registro).
  const tagOptions = [
    { value: '', label: <>Todas <span className="chip-count">{pool.length}</span></> },
    ...JOURNAL_TAGS.map((t) => ({ t, n: pool.filter((e) => e.tag === t).length }))
      .filter((x) => x.n > 0 || x.t === tagFilter)
      .map((x) => ({ value: x.t, label: <>{x.t} <span className="chip-count">{x.n}</span></> })),
  ];

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
    setTagFilter('');
  }

  function del(e: JournalEntry) {
    if (confirm(`Excluir o registro "${entryTitle(e)}"?`)) update(remove('journal', e.id));
  }

  const cards: CardDef[] = searching
    ? []
    : [
        { id: 'semana', label: 'Esta semana', node: <WeekCard entries={data.journal} today={today} /> },
        {
          id: 'neste-dia',
          label: 'Neste dia',
          node:
            data.settings.journalMemoHiddenOn === today ? null : (
              <MemoriesCard entries={data.journal} today={today} onHide={() => update((d) => ({ ...d, settings: { ...d.settings, journalMemoHiddenOn: today } }))} />
            ),
        },
      ];

  return (
    <>
      <PageHeader
        title="Meu diário"
        actions={!searching && <MonthNav label={formatMonth(month)} onPrev={() => changeMonth(addMonths(month, -1))} onNext={() => changeMonth(addMonths(month, 1))} pick={{ month, onPick: changeMonth, badge: (m) => { const n = counts.get(m) ?? 0; return n ? `${n} ${n === 1 ? 'registro' : 'registros'}` : null; } }} />}
        tabs={(!searching || q) && pool.length > 0 ? <Chips label="Etiqueta" value={tagFilter} onChange={(v) => { setTagFilter(v === tagFilter ? '' : v); setOpen(null); }} options={tagOptions} /> : undefined}
      />

      {searching && (
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
              setTagFilter('');
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </label>
      )}

      {!searching && <DiarioGuideCard />}
      {guide && <DiarioGuideSheet onClose={() => setGuide(false)} />}

      {cards.length > 0 && <CardScreen screen="diario" cards={cards} />}

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
              {e.prompt && (
                <p className="entry-prompt">
                  <Icon name="note" size={14} /> {e.prompt}
                </p>
              )}
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

        {!searching && visible.length === 0 && <Empty>{tagFilter ? `Nenhum registro de ${tagFilter.toLowerCase()} em ${formatMonth(month).toLowerCase()}.` : `Nenhum registro em ${formatMonth(month).toLowerCase()}. Toque em + para escrever.`}</Empty>}
      </div>

      {editing && <EntryForm entry={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSaved={(e) => { changeMonth(monthKey(localDate(e.createdAt))); setOpen(new Set([e.id])); setSearching(false); }} />}
      {viewing && <PhotoViewer photos={viewing.photos} start={viewing.start} onClose={() => setViewing(null)} />}
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
  // M44: pergunta do dia (só em registro novo). `answered` = a pergunta que a pessoa escolheu responder.
  const [skip, setSkip] = useState(0);
  const [answered, setAnswered] = useState(entry?.prompt ?? '');
  const question = dailyPrompt(todayISO(), skip);
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
      prompt: answered,
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
      {!entry && (
        <section className={`prompt-card${answered ? ' used' : ''}`}>
          <span className="prompt-label">Pergunta do dia</span>
          <p className="prompt-q">{question}</p>
          <div className="prompt-actions">
            <button
              type="button"
              className="btn small primary"
              onClick={() => {
                setAnswered(question);
                if (!title.trim() || title === answered) setTitle(question);
              }}
            >
              Responder
            </button>
            <button type="button" className="btn small soft" onClick={() => setSkip((n) => n + 1)}>
              Outra pergunta
            </button>
          </div>
        </section>
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

/** Registros por mês (AAAA-MM), para o histórico por ano e mês. */
function monthCounts(entries: JournalEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const m = monthKey(localDate(e.createdAt));
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return counts;
}

/** M44: cartão "Esta semana": dias com registro, sequência e o ritmo escolhido. */
function WeekCard({ entries, today }: { entries: JournalEntry[]; today: string }) {
  const { data } = useStore();
  const days = writtenDays(entries);
  const week = weekDays(mondayOf(today));
  const streak = currentStreak(days, today);
  const done = week.filter((d) => d <= today && days.has(d)).length;
  const r = data.settings.journalRhythm;
  const rhythm = r.mode === 'semana' ? `${Math.min(done, r.perWeek)} de ${r.perWeek} no seu ritmo` : `${done} ${done === 1 ? 'dia escrito' : 'dias escritos'} nesta semana`;
  return (
    <section className="card raised journal-week">
      <div className="card-head">
        <h2>Esta semana</h2>
        <a className="link" href="#/revisao">
          Ver na Revisão
        </a>
      </div>
      <div className="jw-days">
        {week.map((d, i) => (
          <div key={d} className="jw-day">
            {'STQQSSD'[i]}
            <span className={`jw-dot${days.has(d) ? ' on' : ''}${d === today ? ' today' : ''}${d > today ? ' fut' : ''}`}>{Number(d.slice(8))}</span>
          </div>
        ))}
      </div>
      <div className="jw-foot">
        {streak > 0 && <Pill tone="green">{streak === 1 ? '1 dia seguido' : `${streak} dias seguidos`}</Pill>}
        <span className="muted small">{rhythm}</span>
      </div>
    </section>
  );
}

/** M44: "Neste dia": registros de 1 mês, 6 meses e 1 ano atrás. Some quando não há nenhum. */
function MemoriesCard({ entries, today, onHide }: { entries: JournalEntry[]; today: string; onHide: () => void }) {
  const list = memories(entries, today);
  const [open, setOpen] = useState<string | null>(null);
  if (!list.length) return null;
  return (
    <section className="card raised">
      <div className="card-head">
        <h2>Neste dia</h2>
        <button type="button" className="link link-like" onClick={onHide}>
          Fechar por hoje
        </button>
      </div>
      <div className="memories">
        {list.map(({ label, day, entry }) => (
          <button key={entry.id} type="button" className={`memory${open === entry.id ? ' open' : ''}`} onClick={() => setOpen(open === entry.id ? null : entry.id)}>
            <span className="memory-when">
              {label} · {formatDMY(day)}
            </span>
            <strong>{entryTitle(entry)}</strong>
            {(entry.content.trim() || entrySummary(entry)) && <span className="memory-text">{entry.content.trim() || entrySummary(entry)}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
