import { useStore } from '../store';
import { activeHabits, ATTRIBUTES, attributeTotals, bestClean, cleanDays, consistency, habitStreak, KIND_INFO, progressToRitual } from '../habits';
import type { Habit, HabitKind, PracticeSession, PracticeType } from '../types';
import { addDays, formatDMY, todayISO } from '../utils';
import { Empty, Icon, PageHeader, Pill, Progress, type IconName } from '../ui';

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);

/** Núcleo › Progresso (barra de baixo): como os rituais e hábitos estão indo. */
export function ProgressoPage() {
  const { data } = useStore();
  const today = todayISO();
  const habits = activeHabits(data.habits, today);
  const doing = habits.filter((h) => h.kind !== 'abandonar');
  const values = doing.map((h) => consistency(h, today, 30)).filter((v): v is number => v !== null);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const doneWeek = doing.reduce((a, h) => a + week.filter((d) => h.checks.includes(d)).length, 0);
  const attrs = attributeTotals(habits, addDays(today, -29), today);
  const maxAttr = Math.max(1, ...attrs.map((a) => a.points));
  const groups: HabitKind[] = ['ritual', 'construir', 'abandonar'];

  if (!habits.length) {
    return (
      <>
        <PageHeader title="Progresso" />
        <section className="card">
          <Empty>Crie um ritual ou hábito no Núcleo. O progresso deles aparece aqui: constância, sequências e os atributos que você está treinando.</Empty>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Progresso" subtitle="Constância, sequências e atributos" />
      <section className="card">
        <div className="summary">
          <div className="summary-box">
            <span className="label">Constância (30 dias)</span>
            <span className="value">{pct(avg)}</span>
          </div>
          <div className="summary-box">
            <span className="label">Marcados nos últimos 7 dias</span>
            <span className="value">{doneWeek}</span>
          </div>
        </div>
      </section>

      {groups.map((kind) => {
        const list = habits.filter((h) => h.kind === kind);
        if (!list.length) return null;
        return (
          <section key={kind} className="card">
            <div className="card-head">
              <h2>{KIND_INFO[kind].plural}</h2>
              <span className="muted small">{list.length}</span>
            </div>
            <ul className="list">
              {list.map((h) => (
                <ProgressRow key={h.id} h={h} today={today} />
              ))}
            </ul>
          </section>
        );
      })}

      <section className="card">
        <div className="card-head">
          <h2>Atributos (30 dias)</h2>
        </div>
        {attrs.every((a) => a.points === 0) ? (
          <p className="muted small">Escolha os atributos de cada ritual ou hábito (Força, Inteligência…) para ver aqui o que você está treinando.</p>
        ) : (
          <ul className="list">
            {attrs.map((a) => (
              <li key={a.code} className="row attr-row">
                <span className="attr-code" style={{ color: a.color }}>
                  {a.code}
                </span>
                <div className="row-body">
                  <span className="row-title">{ATTRIBUTES.find((x) => x.code === a.code)?.name ?? a.name}</span>
                  <div className="attr-bar">
                    <i style={{ width: `${(a.points / maxAttr) * 100}%`, background: a.color }} />
                  </div>
                </div>
                <strong className="tabular">{a.points}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ProgressRow({ h, today }: { h: Habit; today: string }) {
  if (h.kind === 'abandonar') {
    return (
      <li className="row">
        <span className="dot" style={{ background: h.color }} />
        <div className="row-body">
          <span className="row-title">{h.name}</span>
          <span className="row-meta">Melhor marca: {bestClean(h, today)} dias</span>
        </div>
        <Pill tone="green">{cleanDays(h, today)} dias sem</Pill>
      </li>
    );
  }
  const c = consistency(h, today, 30);
  const prog = h.kind === 'construir' ? progressToRitual(h) : null;
  return (
    <li className="row progress-row">
      <span className="dot" style={{ background: h.color }} />
      <div className="row-body">
        <span className="row-title">{h.name}</span>
        <span className="row-meta">
          <Icon name="flame" size={12} /> {habitStreak(h, today)} seguidos · constância {pct(c)}
          {prog ? ` · ${prog.done} de ${prog.target} para virar ritual` : ''}
        </span>
        <Progress pct={(c ?? 0) * 100} />
      </div>
    </li>
  );
}

const TYPE: Record<PracticeType, { label: string; icon: IconName }> = {
  meditacao: { label: 'Meditação', icon: 'heart' },
  respiracao: { label: 'Respiração', icon: 'heart' },
  alongamento: { label: 'Alongamento', icon: 'smile' },
  treino: { label: 'Treino', icon: 'dumbbell' },
  caminhada: { label: 'Caminhada', icon: 'flag' },
};

function sessionMeta(s: PracticeSession): string {
  const bits = [`${s.minutes} min`];
  if (s.km) bits.push(`${s.km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`);
  if (s.sets) bits.push(`${s.sets} séries`);
  if (s.volume) bits.push(`${Math.round(s.volume).toLocaleString('pt-BR')} kg levantados`);
  return bits.join(' · ');
}

/** Núcleo › Histórico (barra de baixo): meditações, respirações, alongamentos, treinos e caminhadas feitos. */
export function HistoricoPage() {
  const { data } = useStore();
  const month = todayISO().slice(0, 7);
  const sessions = [...data.sessions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const inMonth = sessions.filter((s) => s.date.startsWith(month));
  const mind = inMonth.filter((s) => s.type === 'meditacao' || s.type === 'respiracao').reduce((a, s) => a + s.minutes, 0);
  const workouts = inMonth.filter((s) => s.type === 'treino').length;
  const km = inMonth.reduce((a, s) => a + (s.km ?? 0), 0);
  const days = new Map<string, PracticeSession[]>();
  for (const s of sessions.slice(0, 80)) days.set(s.date, [...(days.get(s.date) ?? []), s]);
  return (
    <>
      <PageHeader title="Histórico" subtitle="Práticas de mente e corpo" />
      <section className="card">
        <div className="summary">
          <div className="summary-box">
            <span className="label">Mente no mês</span>
            <span className="value">{mind} min</span>
          </div>
          <div className="summary-box">
            <span className="label">Treinos no mês</span>
            <span className="value">{workouts}</span>
          </div>
          {km > 0 && (
            <div className="summary-box full">
              <span className="label">Caminhada e corrida no mês</span>
              <span className="value">{km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km</span>
            </div>
          )}
        </div>
      </section>
      {sessions.length === 0 ? (
        <section className="card">
          <Empty>Nada feito ainda. Comece uma meditação, respiração, alongamento ou treino nas abas Mente e Corpo do Núcleo.</Empty>
        </section>
      ) : (
        [...days].map(([day, list]) => (
          <section key={day} className="card">
            <div className="card-head">
              <h2>{day === todayISO() ? 'Hoje' : formatDMY(day)}</h2>
              <span className="muted small">{list.reduce((a, s) => a + s.minutes, 0)} min</span>
            </div>
            <ul className="list">
              {list.map((s) => (
                <li key={s.id} className="row">
                  <span className="tile-icon">
                    <Icon name={TYPE[s.type].icon} size={18} />
                  </span>
                  <div className="row-body">
                    <span className="row-title">{s.title}</span>
                    <span className="row-meta">
                      {TYPE[s.type].label} · {sessionMeta(s)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
