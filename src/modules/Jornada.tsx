import { useStore } from '../store';
import { journeyStats, UNLOCK_DAYS, unlockProgress } from '../journey';
import { formatDMY, fromISO, todayISO, WEEKDAYS } from '../utils';
import { Icon, PageHeader, Pill, Pixels, Progress } from '../ui';

const HERO = ['....HHHH....', '...HHHHHH...', '...HSSSSH...', '...SESSES...', '...SSSSSS...', '....SSSS....', '..DGGGGGGD..', '.SDGGGGGGDS.', '.S.GGBBGG.S.', '...GGGGGG...', '...PPPPPP...', '...PP..PP...', '...PP..PP...', '..KKK..KKK..'];
const HERO_PAL = { H: '#7c4a2d', S: '#f1c27d', E: '#141414', G: '#22c55e', D: '#15803d', B: '#8b5a2b', P: '#3b3f5c', K: '#27272a' };
const LOCK = ['..AAAA..', '.A....A.', '.A....A.', 'BBBBBBBB', 'BBBYYBBB', 'BBBYYBBB', 'BBBBBBBB', 'BBBBBBBB'];
const LOCK_PAL = { A: '#a1a1aa', B: '#a16207', Y: '#facc15' };
const fmt = (n: number) => n.toLocaleString('pt-BR');

export function Jornada() {
  const { data, update } = useStore();
  const today = todayISO();
  const prog = unlockProgress(data, today);
  const choice = data.settings.journeyChoice;
  const setChoice = (c: 'quero' | 'depois' | null) => update((d) => ({ ...d, settings: { ...d.settings, journeyChoice: c } }));

  if (!prog.unlocked) {
    const left = UNLOCK_DAYS - prog.active;
    return (
      <>
        <PageHeader title="Jornada" />
        <section className="card raised journey-locked">
          <div className="journey-scene">
            <Pixels rows={LOCK} pal={LOCK_PAL} size={9} />
          </div>
          <h2>Jornada bloqueada</h2>
          <p className="muted">Use o app em {UNLOCK_DAYS} dias dentro de 3 semanas para desbloquear. Faltar um dia não zera nada.</p>
          <div className="journey-count">
            <span className="pixel-num">{prog.active}</span>
            <span className="muted">de {UNLOCK_DAYS} dias</span>
          </div>
          <Progress pct={(prog.active / UNLOCK_DAYS) * 100} />
          <p className="small muted center">{left === 0 ? 'Pronto! Faça qualquer registro hoje para abrir.' : `Faltam ${left} ${left === 1 ? 'dia' : 'dias'} de uso.`}</p>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Últimas 3 semanas</h2>
          </div>
          <div className="usage-strip" role="list" aria-label="Dias de uso nas últimas 3 semanas">
            {prog.days.map((x) => (
              <span key={x.day} role="listitem" className={`usage-day${x.active ? ' on' : ''}${x.day === today ? ' today' : ''}`} title={`${formatDMY(x.day)}${x.active ? ' · usado' : ''}`}>
                <small>{WEEKDAYS[fromISO(x.day).getDay()].charAt(0)}</small>
              </span>
            ))}
          </div>
          <p className="muted small" style={{ marginTop: 12 }}>
            Um dia conta quando você registra algo: marcar um ritual ou hábito, lançar ou pagar uma despesa, escrever no diário, concluir uma tarefa, marcar um compromisso.
          </p>
        </section>

        <section className="card">
          <div className="info-box">
            <Icon name="sword" />
            <div>
              <strong>O que vem ao desbloquear</strong>
              A Jornada calcula o XP, o nível e o ouro que você teria ganhado com tudo o que fez nessas semanas — com os seus dados reais. Aí você decide se quer seguir com ela ou deixar para depois.
            </div>
          </div>
        </section>
      </>
    );
  }

  const s = journeyStats(data, today);
  return (
    <>
      <PageHeader title="Jornada" />
      <section className="card raised journey-hero">
        <div className="journey-scene night">
          <Pixels rows={HERO} pal={HERO_PAL} size={8} />
        </div>
        <div className="journey-info">
          <div className="toggle-row">
            <div>
              <strong>Jornada desbloqueada</strong>
              <span className="muted small">em {formatDMY(data.settings.journeyUnlockedAt!)} · com o que você fez até hoje</span>
            </div>
            <span className="pixel-num small-num">LV {s.level}</span>
          </div>
          <div>
            <div className="toggle-row small muted">
              <span>XP</span>
              <span className="tabular">
                {fmt(s.xpInLevel)} / {fmt(s.xpForNext)}
              </span>
            </div>
            <div className="xp-bar">
              <div style={{ width: `${(s.xpInLevel / s.xpForNext) * 100}%` }} />
            </div>
          </div>
          <div className="summary">
            <div className="summary-box">
              <span className="label">XP total</span>
              <span className="value">{fmt(s.xp)}</span>
            </div>
            <div className="summary-box">
              <span className="label">Ouro</span>
              <span className="value gold">{fmt(s.gold)}</span>
            </div>
            <div className="summary-box full">
              <span className="label">Missões cumpridas</span>
              <span className="value">{fmt(s.missions)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>De onde veio</h2>
        </div>
        {s.sources.length === 0 ? (
          <p className="empty">Ainda sem registros que rendam XP.</p>
        ) : (
          <ul className="list">
            {s.sources.map((src) => (
              <li key={src.id} className="row">
                <div className="row-body">
                  <span className="row-title">{src.label}</span>
                  <span className="row-meta">
                    {src.count}× · {src.rule}
                  </span>
                </div>
                <span className="pixel-num tiny-num">+{fmt(src.xp)} XP</span>
              </li>
            ))}
          </ul>
        )}
        <p className="muted small" style={{ marginTop: 10 }}>
          Sem punição: faltar nunca tira XP. Gastar dinheiro não rende nada — pagar no prazo, sim.
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>E agora?</h2>
          {choice && <Pill tone={choice === 'quero' ? 'green' : 'gray'}>{choice === 'quero' ? 'Quero a Jornada' : 'Fica para depois'}</Pill>}
        </div>
        {choice === null ? (
          <>
            <p className="muted">Com esses números na mão: a Jornada (missões diárias, personagem, loja e conquistas) faz sentido para você?</p>
            <div className="btn-row" style={{ marginTop: 14 }}>
              <button type="button" className="btn primary" onClick={() => setChoice('quero')}>
                Quero a Jornada
              </button>
              <button type="button" className="btn" onClick={() => setChoice('depois')}>
                Agora não
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">
              {choice === 'quero'
                ? 'Combinado. Próxima etapa: a Fase 1 — missões do dia, personagem e o aviso “+XP” ao concluir algo. O seu XP atual já entra.'
                : 'Tudo certo: a Jornada fica guardada aqui, com o XP continuando a contar em segundo plano.'}
            </p>
            <button type="button" className="btn ghost small" style={{ marginTop: 10 }} onClick={() => setChoice(null)}>
              Mudar resposta
            </button>
          </>
        )}
      </section>
    </>
  );
}
