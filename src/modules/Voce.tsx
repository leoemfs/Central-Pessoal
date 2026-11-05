import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ViewProps } from '../App';
import { useStore } from '../store';
import {
  acceptSuggestion, AREAS, completeness, DAY, dismissSuggestion, EX_LONG, EX_SHORT, FREE, INTERVIEW_STEPS, LIKES, LIMITS, MONEY, QUITS, SAVE,
  setProfile, showAsk, snoozeAsk, suggestions, type Suggestion,
} from '../profile';
import type { AppData, Goal, Profile } from '../types';
import { formatMoney, uid } from '../utils';
import { Fullscreen, Icon, MultiChips, notify, PageHeader, Pill, Ring, type IconName, type PillTone } from '../ui';

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const strOpts = (xs: [number, string][]) => xs.map(([v, l]) => [String(v), l] as [string, string]);

/** "**destaque**" vira negrito. */
function Why({ text }: { text: string }) {
  return (
    <p className="sug-why">
      {text.split('**').map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))}
    </p>
  );
}

const KIND_TONE: Record<Suggestion['kind'], PillTone> = { Hábito: 'green', Ritual: 'green', Prática: 'blue', Troca: 'orange', Abandonar: 'orange', Agenda: 'blue', Dica: 'gray' };

export function SuggestionCard({ s }: { s: Suggestion }) {
  const { update } = useStore();
  const [leaving, setLeaving] = useState(false);
  const after = (fn: (d: AppData) => AppData, msg?: [string, string]) => {
    setLeaving(true);
    window.setTimeout(() => {
      update(fn);
      if (msg) notify(...msg);
    }, 200);
  };
  const label = s.act.type === 'habit' ? 'Adicionar ao Núcleo' : s.act.type === 'events' ? 'Pôr na Agenda' : 'Entendi';
  return (
    <div className={`sug${leaving ? ' out' : ''}`}>
      <div className="sug-head">
        <span className="sug-icon">
          <Icon name={s.icon as IconName} size={18} />
        </span>
        <div className="sug-title">
          <Pill tone={KIND_TONE[s.kind]}>{s.kind}</Pill>
          <strong>{s.title}</strong>
        </div>
      </div>
      <Why text={s.why} />
      <div className="sug-acts">
        <button
          type="button"
          className="btn primary small"
          onClick={() =>
            s.act.type === 'none'
              ? after(dismissSuggestion(s.id))
              : after(acceptSuggestion(s), s.act.type === 'habit' ? ['Adicionado ao Núcleo', s.act.habit.name] : ['Adicionado à Agenda', `${s.act.events.length} ${s.act.events.length === 1 ? 'compromisso' : 'compromissos'}`])
          }
        >
          {label}
        </button>
        <button type="button" className="btn ghost small" onClick={() => after(dismissSuggestion(s.id))}>
          Agora não
        </button>
      </div>
    </div>
  );
}

/** Início: "Para você", com as 2 sugestões principais. */
export function ForYou() {
  const { data } = useStore();
  const list = suggestions(data);
  if (!list.length) return null;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Para você</h2>
        <span className="muted small">com base no seu perfil</span>
      </div>
      <div className="sug-list">
        {list.slice(0, 2).map((s) => (
          <SuggestionCard key={s.id} s={s} />
        ))}
      </div>
      {list.length > 2 && (
        <a className="btn ghost small block" href="#/voce/sugestoes" style={{ marginTop: 12 }}>
          Ver todas as sugestões ({list.length})
        </a>
      )}
    </section>
  );
}

/** Início: "Conte um pouco sobre você", para quem pulou a entrevista. */
export function AskCard({ onAnswer }: { onAnswer: () => void }) {
  const { data, update } = useStore();
  const p = data.profile;
  if (!showAsk(p)) return null;
  const pc = completeness(p);
  const left = INTERVIEW_STEPS - p.onboarding.step;
  const resume = p.onboarding.step > 0;
  return (
    <section className="card raised ask-card">
      <div className="profile-head">
        <Ring pct={pc} />
        <div>
          <strong>Conte um pouco sobre você</strong>
          <span className="muted small">
            {resume ? `Faltam ${left} ${left === 1 ? 'pergunta' : 'perguntas'}. Continue de onde parou.` : `${INTERVIEW_STEPS} perguntas, uns 2 minutos. Com elas, o app sugere hábitos, práticas e metas do seu jeito.`}
          </span>
        </div>
      </div>
      <div className="btn-row">
        <button type="button" className="btn primary small" onClick={onAnswer}>
          {resume ? 'Continuar' : 'Responder agora'}
        </button>
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            update(snoozeAsk());
            notify('Tudo bem', 'Dá para responder quando quiser, em Você.');
          }}
        >
          Agora não
        </button>
      </div>
    </section>
  );
}

// ---------- Entrevista ----------

function GoalTags({ goals }: { goals: Goal[] }) {
  if (!goals.length) return null;
  return (
    <div className="chips">
      {goals.map((g) => (
        <Pill key={g.id} tone="green">
          {g.text}
        </Pill>
      ))}
    </div>
  );
}

const addGoal = (list: Goal[], text: string): Goal[] => {
  const t = text.trim();
  return t && !list.some((g) => g.text.toLowerCase() === t.toLowerCase()) ? [...list, { id: uid(), text: t, when: '', doneAt: null }] : list;
};

const parseAmount = (s: string) => {
  const n = Number(s.replace(/[^\d,]/g, '').replace(',', '.'));
  return n > 0 ? n : null;
};

/**
 * Entrevista "Vamos nos conhecer?": na primeira abertura (com boas-vindas) ou pela página Você.
 * Cada resposta é salva na hora; "Terminar depois" guarda até onde foi.
 */
export function Interview({ start, onClose }: { start: number; onClose: () => void }) {
  const { data, update } = useStore();
  const p = data.profile;
  const [i, setI] = useState(start);
  const [name, setName] = useState(p.name);
  const [shortText, setShortText] = useState('');
  const [longText, setLongText] = useState('');
  const [amount, setAmount] = useState(p.money.amount ? String(p.money.amount) : '');
  const firstTime = p.onboarding.state === 'novo';

  const set = (fn: (p: Profile) => Profile) => update(setProfile(fn));
  /** Guarda os campos de texto da pergunta atual. */
  function keep(q: Profile): Profile {
    if (i === 0) return { ...q, name: name.trim() };
    if (i === 3) return { ...q, shortGoals: addGoal(q.shortGoals, shortText), longGoals: addGoal(q.longGoals, longText) };
    if (i === 4) return { ...q, money: { ...q.money, amount: q.money.saveFor && q.money.saveFor !== 'nada' ? parseAmount(amount) : null } };
    if (i === 5) return { ...q, noQuit: q.quits.length === 0 };
    if (i === 6) return { ...q, noLimit: q.limits.length === 0 };
    return q;
  }
  function goTo(n: number, save: boolean) {
    if (i === 3) {
      setShortText('');
      setLongText('');
    }
    set((q) => {
      const next = save ? keep(q) : q;
      if (n >= INTERVIEW_STEPS) return { ...next, onboarding: { ...next.onboarding, state: 'feito', step: 0 } };
      return { ...next, onboarding: { ...next.onboarding, step: Math.max(0, n) } };
    });
    setI(n);
  }
  function later() {
    set((q) => ({ ...keep(q), onboarding: { ...q.onboarding, state: q.onboarding.state === 'feito' ? 'feito' : 'pulou', step: i < 0 ? 0 : i, askHiddenUntil: null } }));
    onClose();
    notify(i < 0 ? 'Tudo certo' : 'Salvo até aqui', i < 0 ? 'O app já está pronto. Quando quiser, responda em Você.' : 'Continue quando quiser, no Início ou em Você.');
  }

  let body: ReactNode;
  const foot: ReactNode = (
    <>
      <button type="button" className="btn ghost" onClick={() => goTo(i + 1, false)}>
        Pular
      </button>
      <button type="button" className="btn primary" onClick={() => goTo(i + 1, true)}>
        Continuar
      </button>
    </>
  );
  const q = (title: string, sub: string, content: ReactNode) => (
    <>
      <span className="iv-step">
        {i + 1} de {INTERVIEW_STEPS}
      </span>
      <h2>{title}</h2>
      <p className="muted">{sub}</p>
      {content}
    </>
  );

  if (i < 0) {
    return (
      <Fullscreen onClose={later} label="Vamos nos conhecer?" className="iv">
        <div className="iv-center">
          <span className="iv-logo">
            <Icon name="smile" size={32} />
          </span>
          <h2>Vamos nos conhecer?</h2>
          <p className="muted">São {INTERVIEW_STEPS} perguntas rápidas, uns 2 minutos. Com elas, o app sugere hábitos, práticas e metas do seu jeito.</p>
          <ul className="iv-points">
            <li>
              <Icon name="lock" size={18} /> Tudo fica só neste aparelho.
            </li>
            <li>
              <Icon name="right" size={18} /> Qualquer pergunta pode ser pulada.
            </li>
            <li>
              <Icon name="edit" size={18} /> Dá para responder ou mudar depois, em Você.
            </li>
          </ul>
        </div>
        <div className="iv-foot col">
          <button type="button" className="btn primary" onClick={() => setI(0)}>
            Começar
          </button>
          <button type="button" className="btn ghost" onClick={later}>
            Pular e usar o app
          </button>
        </div>
      </Fullscreen>
    );
  }

  if (i >= INTERVIEW_STEPS) {
    const list = suggestions(data);
    return (
      <Fullscreen onClose={onClose} label="Pronto" className="iv">
        <div className="iv-center">
          <span className="iv-logo">
            <Icon name="check" size={32} />
          </span>
          <h2>Pronto{p.name ? `, ${p.name}` : ''}!</h2>
          {list.length ? (
            <>
              <p className="muted">
                Com o que você contou, o app preparou <b>{list.length} {list.length === 1 ? 'sugestão' : 'sugestões'}</b>. As principais:
              </p>
              <ul className="list iv-sum">
                {list.slice(0, 3).map((s) => (
                  <li key={s.id} className="row">
                    <span className="sug-icon">
                      <Icon name={s.icon as IconName} size={18} />
                    </span>
                    <div className="row-body">
                      <span className="row-title">{s.title}</span>
                      <span className="row-meta">{s.kind}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="muted small">Elas ficam no Início, em "Para você". Nada é adicionado sem você tocar.</p>
            </>
          ) : (
            <p className="muted">Você pulou quase tudo, e tudo bem. O app funciona normalmente. Quando quiser, conte mais em Você.</p>
          )}
        </div>
        <div className="iv-foot">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              onClose();
              if (location.hash !== '#/inicio') window.setTimeout(() => (location.hash = '/inicio'), 50);
            }}
          >
            Ver no Início
          </button>
        </div>
      </Fullscreen>
    );
  }

  if (i === 0)
    body = q(
      'Como quer ser chamado(a)?',
      'E em que horário costuma acordar e dormir.',
      <>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={30} autoComplete="given-name" aria-label="Seu nome" />
        <div className="form-row">
          <label className="field">
            <span className="field-label">Acordo</span>
            <input type="time" className="input" value={p.wake} onChange={(e) => e.target.value && set((x) => ({ ...x, wake: e.target.value }))} />
          </label>
          <label className="field">
            <span className="field-label">Durmo</span>
            <input type="time" className="input" value={p.sleep} onChange={(e) => e.target.value && set((x) => ({ ...x, sleep: e.target.value }))} />
          </label>
        </div>
      </>,
    );
  else if (i === 1)
    body = q(
      'Como é o seu dia a dia?',
      'Pode marcar mais de um.',
      <>
        <MultiChips label="Dia a dia" options={DAY} value={p.day} onToggle={(v) => set((x) => ({ ...x, day: toggle(x.day, v) }))} />
        <div className="field">
          <span className="field-label">Quanto tempo livre por dia só para você?</span>
          <MultiChips label="Tempo livre" options={strOpts(FREE)} value={[String(p.free)]} onToggle={(v) => set((x) => ({ ...x, free: Number(v) }))} />
        </div>
      </>,
    );
  else if (i === 2)
    body = q('O que você quer melhorar?', 'Toque na ordem de importância. O primeiro é a prioridade.', <MultiChips label="Áreas" numbered options={AREAS} value={p.areas} onToggle={(v) => set((x) => ({ ...x, areas: toggle(x.areas, v) }))} />);
  else if (i === 3)
    body = q(
      'Tem alguma meta?',
      'Uma para os próximos meses e outra maior, para daqui a um ano ou mais. Pode tocar num exemplo.',
      <>
        <div className="field">
          <span className="field-label">Nos próximos meses</span>
          <GoalTags goals={p.shortGoals} />
          <input className="input" value={shortText} onChange={(e) => setShortText(e.target.value)} placeholder="Ex.: correr 5 km" aria-label="Meta para os próximos meses" />
          <div className="chips ex">
            {EX_SHORT.map((t) => (
              <button key={t} type="button" className="chip-btn" onClick={() => setShortText(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Daqui a um ano ou mais</span>
          <GoalTags goals={p.longGoals} />
          <input className="input" value={longText} onChange={(e) => setLongText(e.target.value)} placeholder="Ex.: juntar R$ 10 mil" aria-label="Meta para daqui a um ano ou mais" />
          <div className="chips ex">
            {EX_LONG.map((t) => (
              <button key={t} type="button" className="chip-btn" onClick={() => setLongText(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </>,
    );
  else if (i === 4)
    body = q(
      'E o dinheiro, como está?',
      'Ajuda o app a sugerir o que faz sentido em Finanças. Não pedimos dados da sua conta.',
      <>
        <MultiChips label="Como está o dinheiro" options={MONEY} value={[p.money.challenge]} onToggle={(v) => set((x) => ({ ...x, money: { ...x.money, challenge: x.money.challenge === v ? '' : (v as Profile['money']['challenge']) } }))} />
        <div className="field">
          <span className="field-label">Quer juntar dinheiro para algo?</span>
          <MultiChips label="Juntar para" options={SAVE} value={[p.money.saveFor]} onToggle={(v) => set((x) => ({ ...x, money: { ...x.money, saveFor: x.money.saveFor === v ? '' : v } }))} />
        </div>
        {p.money.saveFor && p.money.saveFor !== 'nada' && (
          <label className="field">
            <span className="field-label">Quanto, mais ou menos (R$)? Opcional.</span>
            <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex.: 3.000" />
          </label>
        )}
      </>,
    );
  else if (i === 5) body = q('Algum hábito que quer largar?', 'Sem julgamento: serve só para sugerir trocas que ajudam.', <MultiChips label="Hábitos a largar" options={QUITS} value={p.quits} onToggle={(v) => set((x) => ({ ...x, quits: toggle(x.quits, v) }))} />);
  else
    body = q(
      'Algo que o app deve levar em conta?',
      'Assim ele não sugere o que não serve para você.',
      <>
        <MultiChips label="Limitações" options={LIMITS} value={p.limits} onToggle={(v) => set((x) => ({ ...x, limits: toggle(x.limits, v) }))} />
        <div className="field">
          <span className="field-label">Prefiro fazer as coisas</span>
          <MultiChips label="Preferências" options={LIKES} value={p.likes} onToggle={(v) => set((x) => ({ ...x, likes: toggle(x.likes, v) }))} />
        </div>
      </>,
    );

  return (
    <Fullscreen onClose={later} label="Conhecer você" className="iv">
      <div className="iv-top">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={() => (i === 0 && !firstTime ? later() : goTo(i - 1, true))}>
          <Icon name="left" />
        </button>
        <div className="progress" role="progressbar" aria-valuenow={i + 1} aria-valuemin={1} aria-valuemax={INTERVIEW_STEPS}>
          <div className="green" style={{ width: `${((i + 1) / INTERVIEW_STEPS) * 100}%` }} />
        </div>
        <button type="button" className="btn ghost small" onClick={later}>
          Terminar depois
        </button>
      </div>
      <div className="iv-body" key={i}>
        {body}
      </div>
      <div className="iv-foot">{foot}</div>
    </Fullscreen>
  );
}

// ---------- Página Você ----------

function GoalList({ kind, placeholder }: { kind: 'shortGoals' | 'longGoals'; placeholder: string }) {
  const { data, update } = useStore();
  const [text, setText] = useState('');
  const goals = data.profile[kind];
  const add = () => {
    if (!text.trim()) return;
    update(setProfile((p) => ({ ...p, [kind]: addGoal(p[kind], text) })));
    setText('');
  };
  return (
    <>
      {goals.length > 0 && (
        <ul className="list">
          {goals.map((g) => (
            <li key={g.id} className="row">
              <span className="sug-icon" style={{ color: kind === 'longGoals' ? 'var(--blue-text)' : 'var(--green-text)' }}>
                <Icon name="target" size={16} />
              </span>
              <div className="row-body">
                <span className="row-title">{g.text}</span>
                {g.when && <span className="row-meta">{g.when}</span>}
              </div>
              <button type="button" className="icon-btn" aria-label={`Remover "${g.text}"`} onClick={() => update(setProfile((p) => ({ ...p, [kind]: p[kind].filter((x) => x.id !== g.id) })))}>
                <Icon name="x" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="add-row">
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={placeholder} aria-label={placeholder} />
        <button type="button" className="btn" onClick={add} aria-label="Adicionar meta">
          <Icon name="plus" size={18} />
        </button>
      </div>
    </>
  );
}

export function Voce({ route }: ViewProps) {
  const { data, update } = useStore();
  const p = data.profile;
  const [iv, setIv] = useState<number | null>(null);
  const list = suggestions(data);
  const pc = completeness(p);
  const set = (fn: (p: Profile) => Profile) => update(setProfile(fn));
  const [notes, setNotes] = useState(p.notes);
  const [amount, setAmount] = useState(p.money.amount ? String(p.money.amount) : '');
  const st = p.onboarding;
  const sugRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (route.sub === 'sugestoes') requestAnimationFrame(() => sugRef.current?.scrollIntoView({ block: 'start' }));
  }, [route.n, route.sub]);
  const ivLabel = st.state === 'feito' ? 'Refazer a entrevista' : st.step > 0 ? `Continuar a entrevista (faltam ${INTERVIEW_STEPS - st.step})` : 'Responder a entrevista (2 min)';

  return (
    <>
      <PageHeader title="Você" />
      <section className="card raised">
        <div className="profile-head">
          <Ring pct={pc} />
          <div>
            <strong>{p.name || 'Seu perfil'}</strong>
            <span className="muted small">O que você contar aqui vira sugestões de hábitos, práticas e compromissos. Se ligar a Jornada, ela usa estas respostas também.</span>
          </div>
        </div>
        <p className="private">
          <Icon name="lock" size={16} /> Fica só neste aparelho e entra no backup.
        </p>
        <button type="button" className={`btn small ${st.state === 'feito' ? '' : 'primary'}`} onClick={() => setIv(st.state === 'feito' ? 0 : st.step)}>
          <Icon name="edit" size={16} /> {ivLabel}
        </button>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Sobre você</h2>
        </div>
        <div className="stack-sm">
          <label className="field">
            <span className="field-label">Como quer ser chamado(a)?</span>
            <input className="input" defaultValue={p.name} onBlur={(e) => set((x) => ({ ...x, name: e.target.value.trim() }))} placeholder="Seu nome" maxLength={30} />
          </label>
          <div className="form-row">
            <label className="field">
              <span className="field-label">Acordo</span>
              <input type="time" className="input" value={p.wake} onChange={(e) => e.target.value && set((x) => ({ ...x, wake: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">Durmo</span>
              <input type="time" className="input" value={p.sleep} onChange={(e) => e.target.value && set((x) => ({ ...x, sleep: e.target.value }))} />
            </label>
          </div>
          <div className="field">
            <span className="field-label">Meu dia a dia</span>
            <MultiChips label="Dia a dia" options={DAY} value={p.day} onToggle={(v) => set((x) => ({ ...x, day: toggle(x.day, v) }))} />
          </div>
          <div className="field">
            <span className="field-label">Tempo livre por dia para mim</span>
            <MultiChips label="Tempo livre" options={strOpts(FREE)} value={[String(p.free)]} onToggle={(v) => set((x) => ({ ...x, free: Number(v) }))} />
          </div>
          <div className="field">
            <span className="field-label">Prefiro</span>
            <MultiChips label="Preferências" options={LIKES} value={p.likes} onToggle={(v) => set((x) => ({ ...x, likes: toggle(x.likes, v) }))} />
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>O que quero melhorar</h2>
          <span className="muted small">a ordem é a prioridade</span>
        </div>
        <MultiChips label="Áreas" numbered options={AREAS} value={p.areas} onToggle={(v) => set((x) => ({ ...x, areas: toggle(x.areas, v) }))} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Metas de curto prazo</h2>
          <span className="muted small">até 3 meses</span>
        </div>
        <GoalList kind="shortGoals" placeholder="Ex.: correr 5 km sem parar" />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Metas de longo prazo</h2>
          <span className="muted small">1 ano ou mais</span>
        </div>
        <GoalList kind="longGoals" placeholder="Ex.: juntar R$ 10 mil" />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Dinheiro</h2>
          <span className="muted small">para Finanças</span>
        </div>
        <div className="stack-sm">
          <div className="field">
            <span className="field-label">Como está hoje</span>
            <MultiChips label="Como está o dinheiro" options={MONEY} value={[p.money.challenge]} onToggle={(v) => set((x) => ({ ...x, money: { ...x.money, challenge: x.money.challenge === v ? '' : (v as Profile['money']['challenge']) } }))} />
          </div>
          <div className="field">
            <span className="field-label">Quero juntar para</span>
            <MultiChips label="Juntar para" options={SAVE} value={[p.money.saveFor]} onToggle={(v) => set((x) => ({ ...x, money: { ...x.money, saveFor: x.money.saveFor === v ? '' : v, amount: x.money.saveFor === v || v === 'nada' ? null : x.money.amount } }))} />
          </div>
          {p.money.saveFor && p.money.saveFor !== 'nada' && (
            <label className="field">
              <span className="field-label">Quanto, mais ou menos (R$)</span>
              <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={() => set((x) => ({ ...x, money: { ...x.money, amount: parseAmount(amount) } }))} placeholder="Ex.: 3.000" />
              {p.money.amount && <span className="field-hint">Guardando R$ 100 por semana, você chega a {formatMoney(p.money.amount)} em uns {Math.max(1, Math.ceil(p.money.amount / 100 / 4.33))} meses.</span>}
            </label>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Hábitos que quero largar</h2>
        </div>
        <MultiChips label="Hábitos a largar" options={QUITS} value={p.quits} onToggle={(v) => set((x) => ({ ...x, quits: toggle(x.quits, v), noQuit: false }))} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Limitações e cuidados</h2>
        </div>
        <div className="stack-sm">
          <MultiChips label="Limitações" options={LIMITS} value={p.limits} onToggle={(v) => set((x) => ({ ...x, limits: toggle(x.limits, v), noLimit: false }))} />
          <label className="field">
            <span className="field-label">Algo mais que o app deve saber?</span>
            <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== p.notes && set((x) => ({ ...x, notes }))} placeholder="Ex.: tenho dois filhos pequenos, trabalho de casa às sextas" />
          </label>
        </div>
      </section>

      <section className="card" id="sugestoes" ref={sugRef}>
        <div className="card-head">
          <h2>Sugestões para você</h2>
          <span className="muted small">{list.length}</span>
        </div>
        {list.length ? (
          <div className="sug-list">
            {list.map((s) => (
              <SuggestionCard key={s.id} s={s} />
            ))}
          </div>
        ) : (
          <p className="empty">{pc ? 'Nenhuma sugestão nova agora. Mude algo no seu perfil e veja as sugestões mudarem.' : 'Conte um pouco sobre você e as sugestões aparecem aqui.'}</p>
        )}
        {p.dismissed.length > 0 && (
          <button type="button" className="link" onClick={() => set((x) => ({ ...x, dismissed: [] }))}>
            Mostrar de novo as {p.dismissed.length} dispensadas
          </button>
        )}
      </section>

      {iv !== null && <Interview start={iv} onClose={() => setIv(null)} />}
    </>
  );
}

/** Abre a entrevista sozinha na primeira abertura do app. */
export function FirstRun() {
  const { data } = useStore();
  const [open, setOpen] = useState(data.profile.onboarding.state === 'novo');
  if (!open) return null;
  return <Interview start={-1} onClose={() => setOpen(false)} />;
}

