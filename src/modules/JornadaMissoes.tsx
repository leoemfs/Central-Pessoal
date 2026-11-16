/**
 * Jornada (N2.9): missões de hoje e da semana. São os hábitos, tarefas, contas e o diário da
 * pessoa: marcar aqui é o mesmo que marcar no Núcleo, na Agenda ou em Finanças.
 */
import { useStore } from '../store';
import { toggleCheck } from '../habits';
import { toggleTask } from '../actions';
import { payExpense, unpayExpense } from '../finance';
import { go } from '../router';
import { ATTRIBUTES } from '../habits';
import { formatDMY, todayISO } from '../utils';
import { Icon, notify, type IconName } from '../ui';
import { floatTexts, flyCoins } from './jornadaFx';
import { COIN_ICON } from '../jornada/catalog';
import { missionsToday, missionsWeek, type Mission } from '../jornada/missions';

const ICONS: Record<Mission['kind'], IconName> = { ritual: 'sun', construir: 'sprout', abandonar: 'shield', tarefa: 'tasks', conta: 'bolt', diario: 'notePen' };
const color = (code: string) => ATTRIBUTES.find((a) => a.code === code)?.color ?? 'var(--green-text)';

export function MissionsCard() {
  const { data, update } = useStore();
  const today = todayISO();
  const ms = missionsToday(data, today);
  const done = ms.filter((m) => m.done).length;
  const act = (m: Mission, btn?: HTMLElement) => {
    const a = m.action;
    if (a.type !== 'go' && a.type !== 'none') {
      if (m.done) notify('Missão desmarcada', 'A recompensa saiu junto. Desmarcar algo marcado por engano tira os pontos.');
      else if (btn) {
        const r = btn.getBoundingClientRect();
        floatTexts(r, [{ text: `+${m.xp} XP`, color: 'var(--jn-xp)' }, ...Object.entries(m.attrs).map(([k, v]) => ({ text: `+${v} ${k}`, color: color(k) }))]);
        if (m.gold) flyCoins(r, COIN_ICON, Math.min(6, Math.ceil(m.gold / 3)));
      }
    }
    if (a.type === 'habit') update(toggleCheck(a.id, today));
    else if (a.type === 'task') update(toggleTask(a.id));
    else if (a.type === 'bill')
      update((d) => {
        const e = d.expenses.find((x) => x.id === a.id);
        if (!e) return d;
        return e.paidAt ? unpayExpense(d, a.id) : payExpense(d, a.id, today, e.amount);
      });
    else if (a.type === 'go') go(a.to);
  };
  return (
    <section className="card">
      <div className="card-head">
        <h2>Missões de hoje</h2>
        {ms.length > 0 && (
          <span className="jn-px muted" aria-label={`${done} de ${ms.length} cumpridas`}>
            {done}/{ms.length}
          </span>
        )}
      </div>
      <span className="muted small">{formatDMY(today)}</span>
      {ms.length === 0 ? (
        <p className="empty">Nenhuma missão hoje. Rituais e hábitos do Núcleo, tarefas da Agenda e contas que vencem hoje aparecem aqui.</p>
      ) : (
        <ul className="jn-missions">
          {ms.map((m) => {
            const tone = Object.keys(m.attrs)[0];
            return (
              <li key={m.id} className={`jn-mission${m.done ? ' done' : ''}${m.kind === 'abandonar' && !m.done ? ' slipped' : ''}`}>
                <span className="jn-mico" style={{ color: tone ? color(tone) : 'var(--green-text)' }}>
                  <Icon name={ICONS[m.kind]} size={20} />
                </span>
                <div className="jn-mbody">
                  <span className="jn-mtitle">{m.title}</span>
                  <span className="muted small">{m.meta}</span>
                  {!(m.kind === 'abandonar' && !m.done) && (
                    <div className="jn-chips">
                      <span className="jn-chip xp">+{m.xp} XP{m.kind === 'abandonar' ? ' por semana' : ''}</span>
                      <span className="jn-chip gold">
                        <img alt="" src={COIN_ICON} />
                        {m.gold}
                      </span>
                      {Object.entries(m.attrs).map(([k, v]) => (
                        <span key={k} className="jn-chip" style={{ color: color(k) }}>
                          +{v} {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {m.action.type === 'none' ? (
                  m.done && (
                    <span className="jn-check on static" aria-label="Limpo hoje">
                      <Icon name="check" size={20} />
                    </span>
                  )
                ) : m.action.type === 'go' && !m.done ? (
                  <button type="button" className="jn-check go" aria-label={`Abrir: ${m.title}`} onClick={() => act(m)}>
                    <Icon name="right" size={20} />
                  </button>
                ) : (
                  <button type="button" className={`jn-check${m.done ? ' on' : ''}`} aria-pressed={m.done} aria-label={`${m.done ? 'Desmarcar' : 'Marcar'}: ${m.title}`} onClick={(e) => act(m, e.currentTarget)} disabled={m.action.type === 'go'}>
                    <Icon name="check" size={20} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {ms.length > 0 && done === ms.length && <div className="jn-daydone">Dia completo! Hoje à noite aparece uma estrela nova no céu.</div>}
      <p className="muted small" style={{ marginTop: 10 }}>
        Estas missões são os seus próprios hábitos, tarefas, contas e diário. Marcar aqui é o mesmo que marcar no Núcleo, na Agenda ou em Finanças. O que ficar para trás só some à meia-noite, sem perder nada.
      </p>
    </section>
  );
}

export function WeekCard() {
  const { data } = useStore();
  const ws = missionsWeek(data, todayISO());
  return (
    <section className="card">
      <div className="card-head">
        <h2>Missões da semana</h2>
      </div>
      <ul className="jn-week">
        {ws.map((w) => {
          const ok = w.done >= w.goal;
          return (
            <li key={w.id}>
              <div className="toggle-row">
                <div>
                  <strong>{w.title}</strong>
                  <span className="muted small">{w.meta}</span>
                </div>
                <span className={`jn-px${ok ? '' : ' muted'}`} style={ok ? { color: 'var(--green-text)' } : undefined}>
                  {w.done}/{w.goal}
                </span>
              </div>
              <div className="xp-bar">
                <div style={{ width: `${(w.done / w.goal) * 100}%` }} />
              </div>
              {w.bonus > 0 && <span className={`jn-chip xp${ok ? ' won' : ''}`}>{ok ? `Bônus ganho: +${w.bonus} XP` : `Bônus ao cumprir: +${w.bonus} XP`}</span>}
            </li>
          );
        })}
      </ul>
      <p className="muted small" style={{ marginTop: 10 }}>
        A meta do Diário segue o ritmo que você escolheu (Configurações › Início e módulos). Não cumpriu? A missão só recomeça na segunda, sem perder nada.
      </p>
    </section>
  );
}
