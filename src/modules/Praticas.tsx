import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { useStore } from '../store';
import { upsert } from '../actions';
import {
  BREATH, breathRounds, GUIDED, linkedToMark, markLinked, MED_DURATIONS, recommended, recordSession, setFeel, STRETCH, weekPractice, WORKOUTS, type NewSession,
} from '../practices';
import type { PracticeSession } from '../types';
import { todayISO, uid } from '../utils';
import { Chips, Fullscreen, Icon, notify, Pill, type IconName } from '../ui';

export type Practice =
  | { kind: 'med'; minutes: number }
  | { kind: 'guided'; id: string }
  | { kind: 'breath'; id: string }
  | { kind: 'stretch'; id: string }
  | { kind: 'workout'; id: string }
  | { kind: 'walk' };

/** Abre a prática de um hábito ligado ("meditacao", "alongamento:lombar"…). Gratidão não tem tela cheia. */
export function practiceFromLink(link: string, rec: ReturnType<typeof recommended>): Practice | 'gratidao' | null {
  const [t, s = ''] = link.split(':');
  if (t === 'meditacao') return GUIDED[s] ? { kind: 'guided', id: s } : { kind: 'med', minutes: 5 };
  if (t === 'respiracao') return { kind: 'breath', id: BREATH[s] ? s : rec.breath || '478' };
  if (t === 'alongamento') return { kind: 'stretch', id: STRETCH[s] ? s : rec.stretch || 'acordar' };
  if (t === 'treino') return { kind: 'workout', id: WORKOUTS[s] ? s : rec.workout || 'A' };
  if (t === 'caminhada') return { kind: 'walk' };
  if (t === 'gratidao') return 'gratidao';
  return null;
}

// ---------- Som ----------

const BELL_KEY = 'central-pessoal:sino';
const bellOn = () => {
  try {
    return localStorage.getItem(BELL_KEY) !== '0';
  } catch {
    return true;
  }
};
let audio: AudioContext | null = null;
/** Sino suave gerado no aparelho (sem arquivo de som). */
function bell(soft = false) {
  if (!bellOn()) return;
  try {
    audio ??= new AudioContext();
    const t = audio.currentTime;
    for (const [f, v] of [[528, 0.2], [1056, 0.07], [792, 0.05]]) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v * (soft ? 0.4 : 1), t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (soft ? 0.8 : 3));
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + 3.2);
    }
  } catch {
    /* sem som */
  }
}

const mmss = (s: number) => {
  const x = Math.max(0, Math.ceil(s));
  return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`;
};
const minText = (m: number) => {
  const n = Math.max(1, Math.round(m));
  return `${n} ${n === 1 ? 'minuto' : 'minutos'}`;
};
const kg = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Relógio que anda de meio em meio segundo, com pausa. Devolve os segundos passados. */
function useStopwatch() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  const [pauseAt, setPauseAt] = useState<number | null>(null);
  const [paused, setPaused] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);
  const elapsed = ((pauseAt ?? now) - start - paused) / 1000;
  const toggle = () => {
    if (pauseAt) {
      setPaused((p) => p + Date.now() - pauseAt);
      setPauseAt(null);
    } else setPauseAt(Date.now());
  };
  return { elapsed: Math.max(0, elapsed), isPaused: pauseAt !== null, toggle };
}

interface Done {
  title: string;
  lines: string;
  marked: string;
  sessionId: string;
}

/** Tela cheia de uma prática. Ao concluir, mostra o resumo e "Como você está agora?". */
export function PracticeScreen({ p, onClose }: { p: Practice; onClose: () => void }) {
  const { data, update } = useStore();
  const [done, setDone] = useState<Done | null>(null);
  const [feel, setFeelState] = useState<PracticeSession['feel']>(null);
  const [sound, setSound] = useState(bellOn);
  const mind = p.kind === 'med' || p.kind === 'guided' || p.kind === 'breath';

  function finish(s: NewSession, title: string, lines: string) {
    const id = uid();
    const marked = linkedToMark(data.habits, s.type, s.sub, todayISO()).map((h) => h.name).join(', ');
    update(recordSession({ ...s, id }));
    setDone({ title, lines, marked, sessionId: id });
  }
  function toggleSound() {
    try {
      localStorage.setItem(BELL_KEY, sound ? '0' : '1');
    } catch {
      /* ignora */
    }
    setSound(!sound);
  }

  let screen: ReactNode;
  if (done) {
    screen = (
      <>
        <div className="pr-body">
          <span className="pr-label">Sessão concluída</span>
          <h2>{done.title}</h2>
          <p className="muted">{done.lines}</p>
          {done.marked && (
            <Pill tone="green">
              <Icon name="check" size={14} /> Marcado no Núcleo: {done.marked}
            </Pill>
          )}
          <div className="field pr-feel">
            <span className="field-label">Como você está agora?</span>
            <Chips
              label="Como você está agora?"
              value={feel}
              onChange={(v) => {
                setFeelState(v);
                update(setFeel(done.sessionId, v));
              }}
              options={[
                { value: 'calmo', label: mind ? 'Mais calmo(a)' : 'Bem' },
                { value: 'igual', label: 'Igual' },
                { value: 'agitado', label: mind ? 'Ainda agitado(a)' : 'Cansado(a)' },
              ]}
            />
          </div>
        </div>
        <div className="pr-foot">
          <button type="button" className="btn primary" onClick={onClose}>
            Concluir
          </button>
        </div>
      </>
    );
  } else if (p.kind === 'med' || p.kind === 'guided') screen = <Meditate p={p} finish={finish} onCancel={onClose} />;
  else if (p.kind === 'breath') screen = <Breathe id={p.id} finish={finish} onCancel={onClose} />;
  else if (p.kind === 'stretch') screen = <StretchRun id={p.id} finish={finish} onCancel={onClose} />;
  else if (p.kind === 'workout') screen = <WorkoutRun id={p.id} finish={finish} onCancel={onClose} />;
  else screen = <Walk finish={finish} onCancel={onClose} />;

  return (
    <Fullscreen onClose={onClose} label="Prática" className={`practice${mind ? ' mind' : ''}`}>
      {!done && (
        <div className="pr-top">
          <button type="button" className="pr-round" onClick={onClose} aria-label="Sair sem salvar">
            <Icon name="x" />
          </button>
          <button type="button" className="pr-round" onClick={toggleSound} aria-label={sound ? 'Desligar o sino' : 'Ligar o sino'} aria-pressed={sound}>
            <Icon name="bell" size={18} />
            {!sound && <span className="pr-mute" aria-hidden="true" />}
          </button>
        </div>
      )}
      {screen}
    </Fullscreen>
  );
}

type RunProps = { finish: (s: NewSession, title: string, lines: string) => void; onCancel: () => void };

function Meditate({ p, finish, onCancel }: RunProps & { p: Extract<Practice, { kind: 'med' | 'guided' }> }) {
  const g = p.kind === 'guided' ? GUIDED[p.id] : null;
  const total = (g ? g.minutes : p.kind === 'med' ? p.minutes : 5) * 60;
  const sw = useStopwatch();
  const ended = useRef(false);
  const step = g ? Math.min(g.steps.length - 1, Math.floor(sw.elapsed / (total / g.steps.length))) : 0;
  useEffect(() => bell(), []);
  function end(full: boolean) {
    if (ended.current) return;
    ended.current = true;
    bell();
    if (!full && sw.elapsed < 30) return onCancel();
    finish({ type: 'meditacao', sub: g ? (p as { id: string }).id : '', title: g ? g.title : 'Meditação', minutes: sw.elapsed / 60 }, g ? g.title : 'Meditação', `${minText(sw.elapsed / 60)}. ${full ? 'Você ficou até o fim.' : 'Cada minuto conta.'}`);
  }
  useEffect(() => {
    if (sw.elapsed >= total) end(true);
  });
  return (
    <>
      <div className="pr-body">
        <span className="pr-label">{g ? 'Meditação guiada' : 'Meditação'}</span>
        <h2>{g ? g.title : `${Math.round(total / 60)} minutos`}</h2>
        <div className={`orb calm${sw.isPaused ? ' paused' : ''}`}>
          <i />
          <b className="tabular">{mmss(total - sw.elapsed)}</b>
        </div>
        <p className="pr-guide" key={step}>
          {g ? g.steps[step] : 'Respire no seu ritmo. Se a mente fugir, volte com gentileza.'}
        </p>
      </div>
      <div className="pr-foot">
        <button type="button" className="btn" onClick={sw.toggle}>
          <Icon name={sw.isPaused ? 'right' : 'timer'} size={18} /> {sw.isPaused ? 'Continuar' : 'Pausar'}
        </button>
        <button type="button" className="btn ghost" onClick={() => end(false)}>
          Terminar agora
        </button>
      </div>
    </>
  );
}

function Breathe({ id, finish, onCancel }: RunProps & { id: string }) {
  const b = BREATH[id];
  const rounds = breathRounds(b);
  const [pos, setPos] = useState({ round: 0, phase: -1, left: 3 });
  const start = useRef(Date.now());
  const finished = useRef(false);
  function end(complete: number) {
    if (finished.current) return;
    finished.current = true;
    bell();
    if (complete < 1) return onCancel();
    finish({ type: 'respiracao', sub: id, title: b.title, minutes: (Date.now() - start.current) / 60000 }, b.title, `${complete} ${complete === 1 ? 'ciclo completo' : 'ciclos completos'}.`);
  }
  useEffect(() => {
    const t = window.setInterval(() => {
      setPos((cur) => {
        if (cur.left > 1) return { ...cur, left: cur.left - 1 };
        let { round, phase } = cur;
        phase++;
        if (phase >= b.phases.length) {
          phase = 0;
          round++;
        }
        if (round >= rounds) return { round, phase: -2, left: 0 };
        return { round, phase, left: b.phases[phase][1] };
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [b, rounds]);
  useEffect(() => {
    if (pos.phase === -2) end(rounds);
  });
  const ph = pos.phase >= 0 ? b.phases[pos.phase] : null;
  const scale = ph ? (ph[2] ? 1 : 0.62) : 0.62;
  const dur = ph && (ph[0] === 'Inspire' || ph[0] === 'Expire') ? ph[1] : 0.4;
  return (
    <>
      <div className="pr-body">
        <span className="pr-label">Respiração</span>
        <h2>{b.title}</h2>
        <div className="orb">
          <i style={{ transform: `scale(${scale})`, transitionDuration: `${dur}s` } as CSSProperties} />
          <b>{ph ? ph[0] : 'Prepare-se'}</b>
        </div>
        <p className="pr-count tabular">{pos.left > 0 ? pos.left : ''}</p>
        <span className="muted small">{pos.phase >= 0 ? `Ciclo ${Math.min(rounds, pos.round + 1)} de ${rounds}` : 'Começa em instantes'}</span>
      </div>
      <div className="pr-foot">
        <button type="button" className="btn ghost" onClick={() => end(pos.round)}>
          Terminar
        </button>
      </div>
    </>
  );
}

function StretchRun({ id, finish }: RunProps & { id: string }) {
  const x = STRETCH[id];
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(x.moves[0][1]);
  const [paused, setPaused] = useState(false);
  const start = useRef(Date.now());
  const ended = useRef(false);
  function go(n: number) {
    if (n >= x.moves.length) {
      if (ended.current) return;
      ended.current = true;
      bell();
      finish({ type: 'alongamento', sub: id, title: `Alongamento · ${x.title}`, minutes: (Date.now() - start.current) / 60000 }, x.title, `${x.moves.length} movimentos. O corpo agradece.`);
      return;
    }
    if (n > 0) bell(true);
    setIdx(n);
    setLeft(x.moves[n][1]);
  }
  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setLeft((l) => l - 1), 1000);
    return () => window.clearInterval(t);
  }, [paused, idx]);
  useEffect(() => {
    if (left <= 0) go(idx + 1);
  });
  const m = x.moves[idx];
  const pct = ((m[1] - left) / m[1]) * 100;
  return (
    <>
      <div className="pr-body">
        <span className="pr-label">Alongamento · {x.title}</span>
        <div className="pr-dots" aria-label={`Movimento ${idx + 1} de ${x.moves.length}`}>
          {x.moves.map((_, i) => (
            <i key={i} className={i <= idx ? 'on' : ''} />
          ))}
        </div>
        <h2>{m[0]}</h2>
        <div className="ring-timer" style={{ '--p': pct } as CSSProperties}>
          <div>
            <span className="pr-clock tabular">{Math.max(0, left)}</span>
            <span className="muted small">segundos</span>
          </div>
        </div>
        <p className="pr-guide">{m[2]}</p>
        <span className="muted small">{x.moves[idx + 1] ? `Depois: ${x.moves[idx + 1][0]}` : 'Último movimento'}</span>
      </div>
      <div className="pr-foot">
        <button type="button" className="btn" onClick={() => idx > 0 && go(idx - 1)} disabled={idx === 0}>
          Voltar
        </button>
        <button type="button" className="btn" onClick={() => setPaused(!paused)}>
          {paused ? 'Continuar' : 'Pausar'}
        </button>
        <button type="button" className="btn" onClick={() => go(idx + 1)}>
          Pular
        </button>
      </div>
    </>
  );
}

function WorkoutRun({ id, finish, onCancel }: RunProps & { id: string }) {
  const { data } = useStore();
  const w = WORKOUTS[id];
  const [loads, setLoads] = useState<Record<string, number>>(() => Object.fromEntries(w.ex.map((e) => [e[0], data.lastLoads[e[0]] ?? e[3]])));
  const [sets, setSets] = useState<Set<string>>(new Set());
  const [rest, setRest] = useState<{ left: number; total: number } | null>(null);
  const start = useRef(Date.now());
  useEffect(() => {
    if (!rest) return;
    const t = window.setTimeout(() => {
      if (rest.left <= 1) {
        setRest(null);
        bell(true);
        notify('Descanso terminado', 'Próxima série!');
      } else setRest({ ...rest, left: rest.left - 1 });
    }, 1000);
    return () => window.clearTimeout(t);
  }, [rest]);
  function toggleSet(k: string) {
    const next = new Set(sets);
    if (next.has(k)) next.delete(k);
    else {
      next.add(k);
      setRest({ left: w.rest, total: w.rest });
    }
    setSets(next);
  }
  function end() {
    if (!sets.size) return onCancel();
    let volume = 0;
    const used: Record<string, number> = {};
    for (const k of sets) {
      const e = w.ex[Number(k.split(':')[0])];
      if (e[3]) {
        volume += loads[e[0]] * e[2];
        used[e[0]] = loads[e[0]];
      }
    }
    const n = sets.size;
    finish(
      { type: 'treino', sub: id, title: `${w.title} · ${w.sub}`, minutes: (Date.now() - start.current) / 60000, sets: n, volume: volume || null, loads: used },
      `${w.title} · ${w.sub}`,
      `${n} ${n === 1 ? 'série' : 'séries'}${volume ? ` · ${volume.toLocaleString('pt-BR')} kg levantados no total` : ''}. As cargas ficam guardadas para a próxima vez.`,
    );
  }
  return (
    <>
      <div className="pr-scroll">
        <span className="pr-label left">{w.title}</span>
        <h2 className="left">{w.sub}</h2>
        {w.ex.map((e, i) => {
          const prev = data.lastLoads[e[0]];
          return (
            <div key={e[0]} className="ex-card">
              <div className="ex-top">
                <strong>{e[0]}</strong>
                <span className="muted small tabular">
                  {e[1]} × {e[2]}
                </span>
              </div>
              {e[3] > 0 && (
                <div className="ex-load">
                  <button type="button" aria-label={`Menos carga em ${e[0]}`} onClick={() => setLoads({ ...loads, [e[0]]: Math.max(0, loads[e[0]] - 2.5) })}>
                    −
                  </button>
                  <b className="tabular">{kg(loads[e[0]])} kg</b>
                  <button type="button" aria-label={`Mais carga em ${e[0]}`} onClick={() => setLoads({ ...loads, [e[0]]: loads[e[0]] + 2.5 })}>
                    +
                  </button>
                  <span className="muted small">{prev != null ? `Última vez: ${kg(prev)} kg` : 'Primeira vez com esta carga'}</span>
                </div>
              )}
              <div className="ex-sets">
                {Array.from({ length: e[1] }, (_, s) => {
                  const k = `${i}:${s}`;
                  const on = sets.has(k);
                  return (
                    <button key={k} type="button" aria-pressed={on} className={on ? 'on' : ''} onClick={() => toggleSet(k)}>
                      {on && <Icon name="check" size={14} />} Série {s + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {rest && (
        <div className="ex-rest" role="timer">
          <div className="grow">
            <span className="muted small">Descanso</span>
            <div className="progress">
              <div className="green" style={{ width: `${(rest.left / rest.total) * 100}%` }} />
            </div>
          </div>
          <strong className="tabular">{mmss(rest.left)}</strong>
          <button type="button" className="btn small" onClick={() => setRest({ left: rest.left + 15, total: rest.total + 15 })}>
            +15 s
          </button>
          <button type="button" className="btn small" onClick={() => setRest(null)}>
            Pular
          </button>
        </div>
      )}
      <div className="pr-foot">
        <button type="button" className="btn primary" onClick={end}>
          Terminar treino
        </button>
      </div>
    </>
  );
}

function Walk({ finish, onCancel }: RunProps) {
  const sw = useStopwatch();
  const [kind, setKind] = useState<'Caminhada' | 'Corrida'>('Caminhada');
  const [stopped, setStopped] = useState<number | null>(null);
  const [km, setKm] = useState('');
  if (stopped !== null) {
    const save = () => {
      const n = parseFloat(km.replace(',', '.'));
      finish({ type: 'caminhada', sub: kind === 'Corrida' ? 'corrida' : '', title: kind, minutes: stopped / 60, km: n > 0 ? n : null }, kind, `${minText(stopped / 60)}${n > 0 ? ` · ${km.replace('.', ',')} km` : ''}.`);
    };
    return (
      <>
        <div className="pr-body">
          <span className="pr-label">{kind} concluída</span>
          <h2 className="tabular">{minText(stopped / 60)}</h2>
          <label className="field pr-feel">
            <span className="field-label">Distância em km (opcional)</span>
            <input className="input" inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} placeholder="Ex.: 2,5" autoFocus />
          </label>
        </div>
        <div className="pr-foot">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Descartar
          </button>
          <button type="button" className="btn primary" onClick={save}>
            Salvar
          </button>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="pr-body">
        <span className="pr-label">Caminhada e corrida</span>
        <Chips label="Tipo" value={kind} onChange={setKind} options={[{ value: 'Caminhada', label: 'Caminhada' }, { value: 'Corrida', label: 'Corrida' }]} />
        <span className="pr-clock big tabular">{mmss(sw.elapsed)}</span>
        <p className="muted small">O GPS fica para uma próxima versão. No fim, anote a distância se quiser.</p>
      </div>
      <div className="pr-foot">
        <button type="button" className="btn" onClick={sw.toggle}>
          {sw.isPaused ? 'Continuar' : 'Pausar'}
        </button>
        <button type="button" className="btn primary" onClick={() => (sw.elapsed < 30 ? onCancel() : setStopped(sw.elapsed))}>
          Parar
        </button>
      </div>
    </>
  );
}

// ---------- Abas Mente e Corpo do Núcleo ----------

function PracticeRow({ icon, tone, title, meta, rec, onClick }: { icon: IconName; tone: string; title: string; meta: string; rec?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`practice-row${rec ? ' rec' : ''}`} onClick={onClick}>
      <span className="sug-icon" style={{ color: tone }}>
        <Icon name={icon} size={18} />
      </span>
      <span className="row-body">
        <span className="row-title">{title}</span>
        <span className="row-meta">
          {meta}
          {rec ? ' · indicada para você' : ''}
        </span>
      </span>
      <Icon name="right" size={16} />
    </button>
  );
}

export function MindTab({ open, gratRef }: { open: (p: Practice) => void; gratRef: RefObject<HTMLInputElement | null> }) {
  const { data, update } = useStore();
  const rec = recommended(data.profile);
  const [dur, setDur] = useState(5);
  const [grat, setGrat] = useState(['', '', '']);
  const week = weekPractice(data.sessions);
  function saveGratitude() {
    const items = grat.map((g) => g.trim()).filter(Boolean);
    if (!items.length) return gratRef.current?.focus();
    const now = new Date().toISOString();
    const marked = linkedToMark(data.habits, 'gratidao', '', todayISO()).map((h) => h.name).join(', ');
    update((d) => markLinked('gratidao', '')(upsert('journal', { id: uid(), createdAt: now, updatedAt: now, title: 'Três coisas boas', summary: items.join(' · '), content: items.map((x) => `• ${x}`).join('\n'), tag: 'Gratidão' })(d)));
    setGrat(['', '', '']);
    notify('Salvo no Diário', `${items.length} ${items.length === 1 ? 'coisa boa' : 'coisas boas'}${marked ? ` · marcado: ${marked}` : ''}`);
  }
  return (
    <>
      <section className="card">
        <div className="card-head">
          <h2>Meditar</h2>
          <span className="muted small">{week.mindMinutes} min esta semana</span>
        </div>
        <Chips label="Duração" value={String(dur)} onChange={(v) => setDur(Number(v))} options={MED_DURATIONS.map((m) => ({ value: String(m), label: `${m} min` }))} />
        <button type="button" className="btn primary block" style={{ marginTop: 12 }} onClick={() => open({ kind: 'med', minutes: dur })}>
          Começar meditação livre
        </button>
        <p className="muted small" style={{ marginTop: 8 }}>
          Um sino suave no começo e no fim. Funciona sem internet.
        </p>
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Meditações guiadas</h2>
        </div>
        <div className="practice-list">
          {Object.entries(GUIDED).map(([k, g]) => (
            <PracticeRow key={k} icon="heart" tone="var(--blue-text)" title={g.title} meta={`${g.minutes} min · ${g.steps.length} passos`} rec={rec.guided === k} onClick={() => open({ kind: 'guided', id: k })} />
          ))}
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Respiração</h2>
          <span className="muted small">uns 2 minutos</span>
        </div>
        <div className="practice-list">
          {Object.entries(BREATH).map(([k, b]) => (
            <PracticeRow key={k} icon="repeat" tone="var(--blue-text)" title={b.title} meta={b.sub} rec={rec.breath === k} onClick={() => open({ kind: 'breath', id: k })} />
          ))}
        </div>
      </section>
      <section className="card" id="gratidao">
        <div className="card-head">
          <h2>Três coisas boas de hoje</h2>
          <span className="muted small">vai para o Diário</span>
        </div>
        <div className="stack-sm">
          {['Ex.: o café da manhã com calma', 'Ex.: terminei aquela tarefa', 'Ex.: conversei com alguém querido'].map((ph, i) => (
            <input key={i} ref={i === 0 ? gratRef : undefined} className="input" value={grat[i]} placeholder={ph} aria-label={`Coisa boa ${i + 1}`} onChange={(e) => setGrat(grat.map((g, j) => (j === i ? e.target.value : g)))} />
          ))}
          <button type="button" className="btn soft block" onClick={saveGratitude}>
            <span className="green">Salvar no Diário</span>
          </button>
        </div>
      </section>
    </>
  );
}

export function BodyTab({ open }: { open: (p: Practice) => void }) {
  const { data } = useStore();
  const rec = recommended(data.profile);
  const week = weekPractice(data.sessions);
  const walks = data.sessions.filter((x) => x.type === 'caminhada').slice(-3).reverse();
  const plans = Object.keys(WORKOUTS).sort((a, b) => (a === rec.workout ? -1 : b === rec.workout ? 1 : 0));
  return (
    <>
      <section className="card">
        <div className="card-head">
          <h2>Treinos</h2>
          <span className="muted small">
            {week.workouts} {week.workouts === 1 ? 'treino' : 'treinos'} esta semana
          </span>
        </div>
        <div className="practice-list">
          {plans.map((k) => {
            const w = WORKOUTS[k];
            return <PracticeRow key={k} icon="dumbbell" tone="var(--green-text)" title={`${w.title} · ${w.sub}`} meta={`${w.ex.length} exercícios · descanso de ${w.rest} s`} rec={rec.workout === k} onClick={() => open({ kind: 'workout', id: k })} />;
          })}
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Alongamentos guiados</h2>
        </div>
        <div className="practice-list">
          {Object.entries(STRETCH).map(([k, x]) => (
            <PracticeRow key={k} icon="smile" tone="var(--green-text)" title={x.title} meta={`${x.minutes} min · ${x.moves.length} movimentos`} rec={rec.stretch === k} onClick={() => open({ kind: 'stretch', id: k })} />
          ))}
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Caminhada e corrida</h2>
        </div>
        <div className="practice-list">
          <PracticeRow icon="timer" tone="var(--orange-text)" title="Começar cronômetro" meta="No fim, você anota a distância" onClick={() => open({ kind: 'walk' })} />
        </div>
        {walks.length > 0 && (
          <ul className="list" style={{ marginTop: 8 }}>
            {walks.map((x) => (
              <li key={x.id} className="row">
                <div className="row-body">
                  <span className="row-title">{x.title}</span>
                  <span className="row-meta">
                    {x.minutes} min{x.km ? ` · ${String(x.km).replace('.', ',')} km` : ''} · {x.date.split('-').reverse().slice(0, 2).join('/')}
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

/** Início: o que foi feito no Núcleo nesta semana. */
export function WeekPractice() {
  const { data } = useStore();
  const w = weekPractice(data.sessions);
  if (!w.total) return null;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Autocuidado da semana</h2>
        <a className="link" href="#/nucleo">
          Núcleo
        </a>
      </div>
      <div className="week-stats">
        <div>
          <strong className="tabular">{w.mindMinutes}</strong>
          <span className="muted small">min de meditação e respiração</span>
        </div>
        <div>
          <strong className="tabular">{w.workouts}</strong>
          <span className="muted small">{w.workouts === 1 ? 'treino' : 'treinos'}</span>
        </div>
        <div>
          <strong className="tabular">{w.moves}</strong>
          <span className="muted small">alongamentos e caminhadas</span>
        </div>
      </div>
    </section>
  );
}
