import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { addMoodTag, clearMood, MOOD_GROUPS, moodInfo, moodInsights, MOODS, quickMoodTags, removeMoodTag, setMood, setMoodNote, toggleMoodPin, toggleMoodTag, weekMood } from '../mood';
import { todayISO, WEEKDAYS, fromISO } from '../utils';
import { Icon, notify, PageHeader, Pill, Sheet } from '../ui';
import { weekStart } from '../review';

/** Início: "Como você está hoje?" Um toque; depois, opcionalmente, o que pesou ou ajudou e uma anotação. */
export function MoodCard() {
  const { data, update } = useStore();
  const today = todayISO();
  const m = data.moods[today];
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [all, setAll] = useState(false);
  const [note, setNote] = useState(m?.note ?? '');
  useEffect(() => setNote(m?.note ?? ''), [m?.note]);

  if (!m) {
    return (
      <section className="card mood-card">
        <div className="card-head">
          <h2>Como você está hoje?</h2>
          <span className="muted small">1 toque</span>
        </div>
        <div className="moods" role="group" aria-label="Humor de hoje">
          {MOODS.map((x) => (
            <button
              key={x.v}
              type="button"
              onClick={() => {
                update(setMood(x.v, today));
                setEditing(true);
              }}
            >
              <span aria-hidden="true">{x.emoji}</span>
              <small>{x.label}</small>
            </button>
          ))}
        </div>
      </section>
    );
  }

  const info = moodInfo(m.v);
  if (!editing) {
    return (
      <section className="card mood-card">
        <div className="mood-compact">
          <span className="mood-emoji" aria-hidden="true">
            {info.emoji}
          </span>
          <div className="row-body">
            <span className="row-title">Hoje: {info.label}</span>
            <span className="row-meta">
              {m.tags.length ? m.tags.join(' · ') : 'Sem detalhes'}
              {m.note ? ' · anotado no Diário' : ''}
            </span>
          </div>
          <button type="button" className="btn small" onClick={() => setEditing(true)}>
            Editar
          </button>
        </div>
      </section>
    );
  }

  const saveNote = () => {
    if (note.trim() !== m.note) {
      update(setMoodNote(note, today));
      if (note.trim()) notify('Salvo no Diário', `${info.emoji} ${info.label}`);
    }
  };
  return (
    <section className="card mood-card">
      <div className="card-head">
        <h2>Hoje você está</h2>
        <button type="button" className="link" onClick={() => update(clearMood(today))}>
          Mudar
        </button>
      </div>
      <div className="moods small" role="group" aria-label="Humor de hoje">
        {MOODS.map((x) => (
          <button key={x.v} type="button" aria-pressed={x.v === m.v} className={x.v === m.v ? 'on' : ''} onClick={() => update(setMood(x.v, today))}>
            <span aria-hidden="true">{x.emoji}</span>
            <small>{x.label}</small>
          </button>
        ))}
      </div>
      <div className="field">
        <span className="field-label">
          O que mais pesou ou ajudou? <span className="muted">(opcional)</span>
        </span>
        <div className="chips" role="group" aria-label="O que pesou ou ajudou">
          {quickMoodTags(data, today).map((t) => (
            <button key={t} type="button" aria-pressed={m.tags.includes(t)} className={`chip-btn${m.tags.includes(t) ? ' on' : ''}`} onClick={() => update(toggleMoodTag(t, today))}>
              {t}
            </button>
          ))}
          <button type="button" className="chip-btn chip-add" onClick={() => setAdding(true)}>
            + Nova
          </button>
          <button type="button" className="chip-btn" onClick={() => setAll(true)}>
            Ver todas ›
          </button>
        </div>
        {adding && <NewMoodTag day={today} onDone={() => setAdding(false)} />}
      </div>
      {all && <AllMoodTags day={today} onClose={() => setAll(false)} />}
      <label className="field">
        <span className="field-label">
          Quer anotar algo? <span className="muted">(vai para o Diário)</span>
        </span>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} onBlur={saveNote} placeholder="Ex.: dia corrido, mas fechei o projeto" />
      </label>
      <button
        type="button"
        className="btn primary block"
        onClick={() => {
          saveNote();
          setEditing(false);
        }}
      >
        Pronto
      </button>
    </section>
  );
}

/** M46: "+ Nova" — cria uma opção sua (ou marca a que já existe com esse nome). */
function NewMoodTag({ day, onDone }: { day: string; onDone: () => void }) {
  const { update } = useStore();
  const [name, setName] = useState('');
  const create = () => {
    if (name.trim()) {
      update(addMoodTag(name, day));
      notify('Opção marcada', name.trim());
    }
    onDone();
  };
  return (
    <div className="mood-new">
      <input
        className="input"
        autoFocus
        maxLength={30}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && create()}
        placeholder="Ex.: Pet, Terapia, Igreja"
        aria-label="Nome da nova opção"
      />
      <button type="button" className="btn primary" onClick={create}>
        Criar
      </button>
    </div>
  );
}

/** M46: gaveta com todas as opções por grupo; em Editar, ★ fixa na fileira e ✕ apaga as suas. */
function AllMoodTags({ day, onClose }: { day: string; onClose: () => void }) {
  const { data, update } = useStore();
  const [edit, setEdit] = useState(false);
  const [adding, setAdding] = useState(false);
  const tags = data.moods[day]?.tags ?? [];
  const pinned = data.settings.moodPinned;
  const groups = [...MOOD_GROUPS, { title: 'Minhas', tags: data.settings.moodTags }];
  return (
    <Sheet
      title="Todas as opções"
      onClose={onClose}
      badge={
        <button type="button" className="btn small" onClick={() => setEdit(!edit)}>
          {edit ? 'Pronto' : 'Editar'}
        </button>
      }
    >
      <p className="muted small">{edit ? '★ deixa a opção sempre na fileira do cartão. ✕ apaga uma opção sua (os dias antigos continuam com o nome).' : 'As fixadas (★) e as que você mais usa aparecem no cartão.'}</p>
      {groups.map((g) => (
        <div key={g.title} className="mood-group">
          <h3>{g.title}</h3>
          <div className="mood-all">
            {g.tags.map((t) =>
              edit ? (
                <span key={t} className={`chip-btn${pinned.includes(t) ? ' on' : ''}`}>
                  <button type="button" className="mood-pin" aria-label={pinned.includes(t) ? `Soltar ${t} da fileira` : `Fixar ${t} na fileira`} onClick={() => update(toggleMoodPin(t))}>
                    {pinned.includes(t) ? '★' : '☆'} {t}
                  </button>
                  {g.title === 'Minhas' && (
                    <button type="button" className="mood-x" aria-label={`Apagar ${t}`} onClick={() => update(removeMoodTag(t))}>
                      ✕
                    </button>
                  )}
                </span>
              ) : (
                <button key={t} type="button" aria-pressed={tags.includes(t)} className={`chip-btn${tags.includes(t) ? ' on' : ''}`} onClick={() => update(toggleMoodTag(t, day))}>
                  {t}
                </button>
              ),
            )}
            {g.title === 'Minhas' && !edit && (
              <button type="button" className="chip-btn chip-add" onClick={() => setAdding(true)}>
                + Nova
              </button>
            )}
          </div>
          {g.title === 'Minhas' && adding && <NewMoodTag day={day} onDone={() => setAdding(false)} />}
        </div>
      ))}
    </Sheet>
  );
}

/** Revisão semanal: as 7 carinhas da semana e o que o app percebe. */
export function MoodWeek({ start }: { start: string }) {
  const { data } = useStore();
  const w = weekMood(data, start);
  const today = todayISO();
  const ins = moodInsights(data, today < start ? today : w.days[6].day < today ? w.days[6].day : today);
  if (!w.days.some((x) => x.mood) && !ins.days) return null;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Humor da semana</h2>
        {w.avg !== null && <Pill tone="green">média {w.avg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</Pill>}
      </div>
      <div className="week-mood">
        {w.days.map((x) => (
          <div key={x.day} className={x.day === today ? 'today' : ''} title={x.mood ? moodInfo(x.mood.v).label : 'Sem registro'}>
            <span className="mood-emoji" aria-hidden="true">
              {x.mood ? moodInfo(x.mood.v).emoji : '·'}
            </span>
            <small>{WEEKDAYS[fromISO(x.day).getDay()]}</small>
          </div>
        ))}
      </div>
      {(ins.withTraining || ins.goodTag || ins.hardTag) && (
        <ul className="list" style={{ marginTop: 8 }}>
          {ins.withTraining && (
            <li className="row">
              <Icon name="dumbbell" size={18} />
              <div className="row-body">
                <span className="row-title">
                  Dias com treino ou caminhada: humor {fmt(ins.withTraining.yes)}. Nos outros: {fmt(ins.withTraining.no)}.
                </span>
                <span className="row-meta">Nas últimas 2 semanas.</span>
              </div>
            </li>
          )}
          {ins.goodTag && (
            <li className="row">
              <Icon name="smile" size={18} />
              <div className="row-body">
                <span className="row-title">Nos dias bons, apareceu mais: {ins.goodTag}</span>
              </div>
            </li>
          )}
          {ins.hardTag && (
            <li className="row">
              <Icon name="heart" size={18} />
              <div className="row-body">
                <span className="row-title">Nos dias difíceis, pesou mais: {ins.hardTag}</span>
                <span className="row-meta">Sem julgamento: é só para você enxergar.</span>
              </div>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Tela do Humor (barra do Diário): o dia de hoje, a semana e os últimos registros. */
export function HumorPage() {
  const { data } = useStore();
  const today = todayISO();
  const recent = Object.entries(data.moods)
    .filter(([day]) => day <= today)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 30);
  return (
    <>
      <PageHeader title="Humor" subtitle="Como você tem se sentido" />
      <MoodCard />
      <MoodWeek start={weekStart(today)} />
      <section className="card">
        <div className="card-head">
          <h2>Últimos registros</h2>
          <span className="muted small">{recent.length}</span>
        </div>
        {recent.length === 0 ? (
          <p className="muted">Ainda não há registros. Marque como você está hoje, logo acima.</p>
        ) : (
          <ul className="list">
            {recent.map(([day, m]) => (
              <li key={day} className="row">
                <span className="mood-emoji" aria-hidden="true">
                  {moodInfo(m.v).emoji}
                </span>
                <div className="row-body">
                  <span className="row-title">{moodInfo(m.v).label}</span>
                  <span className="row-meta">
                    {day === today ? 'Hoje' : `${WEEKDAYS[fromISO(day).getDay()]} ${day.slice(8, 10)}/${day.slice(5, 7)}`}
                    {m.tags.length ? ` · ${m.tags.join(', ')}` : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
