import { useState } from 'react';
import { useStore } from '../store';
import {
  amountText, cleanVideoUrl, EQUIPS, homeKey, homeWorkout, LEVELS, partsFor, weekTrainDays, youtubeSearch, type Equip, type Exercise, type Part,
} from '../treinos';
import { Chips, Fullscreen, Icon, notify, Pill, Segmented, Sheet } from '../ui';
import { Boneco } from './Boneco';

const WEEK_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const minutes = (s: number) => `${Math.max(1, Math.round(s / 60))} min`;

/** Núcleo › Corpo: cartão do Treino em casa com a meta da semana. */
export function HomeCard({ onOpen }: { onOpen: () => void }) {
  const { data, update } = useStore();
  const [edit, setEdit] = useState(false);
  const days = weekTrainDays(data.sessions);
  const done = days.filter((d) => d.done).length;
  const goal = data.workoutGoal;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Treino em casa</h2>
        <button type="button" className="tc-goal" onClick={() => setEdit(true)} aria-label={`Meta da semana: ${done} de ${goal}. Mudar a meta`}>
          <strong className={done >= goal ? 'green' : ''}>{done}</strong>/{goal} <Icon name="edit" size={14} />
        </button>
      </div>
      <div className="tc-week" aria-label="Dias com treino nesta semana">
        {days.map((d, i) => (
          <span key={d.day} className={`tc-day${d.done ? ' done' : ''}${d.today ? ' today' : ''}`}>
            <small>{WEEK_LETTERS[i]}</small>
            <b>{d.done ? <Icon name="check" size={14} /> : Number(d.day.slice(8))}</b>
          </span>
        ))}
      </div>
      <button type="button" className="btn primary block" onClick={onOpen}>
        Escolher treino
      </button>
      {edit && (
        <Sheet title="Meta da semana" onClose={() => setEdit(false)}>
          <p className="muted small">Em quantos dias da semana você quer treinar? Conta qualquer treino do Núcleo (em casa ou fichas A, B e C).</p>
          <Chips
            label="Dias por semana"
            value={String(goal)}
            onChange={(v) => {
              update((d) => ({ ...d, workoutGoal: Number(v) }));
              setEdit(false);
            }}
            options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: `${n} ${n === 1 ? 'dia' : 'dias'}` }))}
          />
        </Sheet>
      )}
    </section>
  );
}

function Bolts({ n }: { n: number }) {
  return (
    <span className="tc-bolts" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? 'on' : ''}>
          <Icon name="bolt" size={13} />
        </span>
      ))}
    </span>
  );
}

/** Tela do Treino em casa: abas por equipamento, filtros por parte do corpo e os treinos prontos. */
export function HomeWorkouts({ onClose, onStart }: { onClose: () => void; onStart: (key: string) => void }) {
  const [equip, setEquip] = useState<Equip>('sem');
  const parts = partsFor(equip);
  const [part, setPart] = useState<Part>('pernas');
  const cur = parts.find((p) => p.value === part) ?? parts[0];
  const [open, setOpen] = useState<string | null>(null);
  const [exOpen, setExOpen] = useState<Exercise | null>(null);
  const w = open ? homeWorkout(open) : null;
  const tools = [...new Set(w?.steps.map((s) => s.ex.tool).filter(Boolean))];

  return (
    <Fullscreen onClose={onClose} label="Treino em casa" className="tc">
      <div className="iv-top tc-top">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={() => (w ? setOpen(null) : onClose())}>
          <Icon name="left" />
        </button>
        <strong>{w ? w.title : 'Treino em casa'}</strong>
      </div>
      {!w ? (
        <div className="tc-body">
          <Segmented label="Equipamento" value={equip} onChange={setEquip} options={EQUIPS} />
          <Chips label="Parte do corpo" value={cur.value} onChange={setPart} options={parts.map((p) => ({ value: p.value, label: p.label }))} />
          <p className="muted small tc-hint">{cur.hint}</p>
          <div className="tc-list">
            {LEVELS.map((lv, i) => {
              const x = homeWorkout(homeKey(equip, cur.value, lv.value));
              if (!x) return null;
              return (
                <button key={lv.value} type="button" className="tc-level" onClick={() => setOpen(x.key)}>
                  <Boneco fig={x.steps[0].ex.fig} label={x.steps[0].ex.name} play={false} className="tc-thumb" />
                  <span className="row-body">
                    <span className="row-title">
                      {cur.label} · {lv.label}
                    </span>
                    <span className="row-meta">
                      {minutes(x.seconds)} · {x.count} {x.count === 1 ? 'exercício' : 'exercícios'} · {lv.rounds} voltas
                    </span>
                    <Bolts n={i + 1} />
                  </span>
                  <Icon name="right" size={16} />
                </button>
              );
            })}
          </div>
          {equip === 'com' && <p className="muted small">Com o que dá para ter em casa: halteres, elástico e kettlebell. Academia continua nas fichas A, B e C.</p>}
        </div>
      ) : (
        <>
          <div className="tc-body">
            <div className="tc-hero">
              <Boneco fig={w.steps[0].ex.fig} label={w.steps[0].ex.name} />
            </div>
            <div className="tc-meta">
              <span>
                <Icon name="bars" size={14} /> {LEVELS.find((l) => l.value === w.level)?.label}
              </span>
              <span>
                <Icon name="timer" size={14} /> {minutes(w.seconds)}
              </span>
              <span>
                <Icon name="dumbbell" size={14} /> {w.steps.length} séries
              </span>
            </div>
            <p className="muted small">
              {w.count} {w.count === 1 ? 'exercício' : 'exercícios'} em {LEVELS.find((l) => l.value === w.level)?.rounds} voltas, com {w.rest} s de descanso entre eles. {cur.hint} Toque num exercício para ver como fazer e o vídeo.
            </p>
            {tools.length > 0 && <Pill tone="blue">Precisa de: {tools.join(', ')}</Pill>}
            <h3 className="tc-sub">Exercícios</h3>
            <ul className="tc-steps">
              {w.steps.map((s, i) => (
                <li key={i}>
                  <button type="button" className="tc-step" onClick={() => setExOpen(s.ex)}>
                    <Boneco fig={s.ex.fig} label={s.ex.name} play={false} className="tc-thumb" />
                    <span className="row-body">
                      <span className="row-title">{s.ex.name}</span>
                      <span className="row-meta tabular">{amountText(s)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="pr-foot">
            <button type="button" className="btn primary" onClick={() => onStart(w.key)}>
              <Icon name="play" size={18} /> Iniciar
            </button>
          </div>
        </>
      )}
      {exOpen && <ExerciseSheet ex={exOpen} onClose={() => setExOpen(null)} />}
    </Fullscreen>
  );
}

/** Como fazer o exercício, com o boneco animado e o link do vídeo. */
export function ExerciseSheet({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  const { data, update } = useStore();
  const saved = data.exerciseVideos[ex.id] ?? '';
  const [link, setLink] = useState(saved);
  function save() {
    const url = cleanVideoUrl(link);
    if (link.trim() && !url) return notify('Link não reconhecido', 'Cole o endereço do vídeo (ex.: youtube.com/…).');
    if (url === saved) return;
    update((d) => {
      const v = { ...d.exerciseVideos };
      if (url) v[ex.id] = url;
      else delete v[ex.id];
      return { ...d, exerciseVideos: v };
    });
    setLink(url);
    notify(url ? 'Vídeo salvo' : 'Vídeo removido', ex.name);
  }
  return (
    <Sheet title={ex.name} onClose={onClose}>
      <div className="tc-hero small">
        <Boneco fig={ex.fig} label={ex.name} />
      </div>
      {ex.tool && <Pill tone="blue">Precisa de: {ex.tool}</Pill>}
      <ol className="tc-how">
        {ex.how.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ol>
      <label className="field">
        <span className="field-label">Link do vídeo</span>
        <input className="input" inputMode="url" value={link} placeholder="Cole aqui o link (YouTube, Instagram…)" onChange={(e) => setLink(e.target.value)} onBlur={save} />
      </label>
      <div className="tc-links">
        {saved ? (
          <a className="btn soft" href={saved} target="_blank" rel="noreferrer">
            <Icon name="play" size={16} /> Abrir vídeo
          </a>
        ) : (
          <a className="btn soft" href={youtubeSearch(ex.name)} target="_blank" rel="noreferrer">
            <Icon name="search" size={16} /> Procurar no YouTube
          </a>
        )}
      </div>
      <p className="muted small">O vídeo abre fora do app e precisa de internet. O boneco funciona sem internet.</p>
    </Sheet>
  );
}
