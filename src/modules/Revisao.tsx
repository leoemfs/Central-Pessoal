import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { upsert } from '../actions';
import { defaultReviewWeek, weekReview, weekStart } from '../review';
import type { JournalEntry } from '../types';
import { addDays, formatDate, formatDateTime, formatMoney, todayISO, uid } from '../utils';
import { CategoryBadge, Empty, Field, Icon, MonthNav, PageHeader, Pill } from '../ui';
import { BillRow } from './financas/Financas';
import { useCategoryOf } from './financas/shared';
import { entryTitle } from './Diario';

const short = (d: string) => formatDate(d, { day: '2-digit', month: 'short' });

/** Revisão da semana: o que aconteceu em todas as áreas + uma reflexão que vai para o diário. */
export function Revisao() {
  const { data, update } = useStore();
  const categoryOf = useCategoryOf();
  const today = todayISO();
  const [start, setStart] = useState(defaultReviewWeek(today));
  const r = useMemo(() => weekReview(data, start, today), [data, start, today]);
  const label = `${short(start)} – ${short(r.end)}`;
  const title = `Revisão da semana ${label}`;
  const existing = data.journal.find((j) => j.tag === 'Revisão' && j.title === title);
  const [worked, setWorked] = useState('');
  const [didnt, setDidnt] = useState('');
  const [adjust, setAdjust] = useState('');
  const [saved, setSaved] = useState(false);
  const inProgress = today >= start && today < r.end;
  const routinePct = r.routineScheduled ? Math.round((r.routineDone / r.routineScheduled) * 100) : null;

  function changeWeek(s: string) {
    setStart(s);
    setWorked('');
    setDidnt('');
    setAdjust('');
    setSaved(false);
  }

  function saveReflection() {
    const parts = [
      worked.trim() && `O que funcionou:\n${worked.trim()}`,
      didnt.trim() && `O que não funcionou:\n${didnt.trim()}`,
      adjust.trim() && `O que ajustar na próxima semana:\n${adjust.trim()}`,
    ].filter(Boolean);
    if (!parts.length) return;
    const summary = [routinePct !== null && `Rotina ${routinePct}%`, `gastos ${formatMoney(r.spent)}`, `${r.tasksDone} tarefa(s) concluída(s)`].filter(Boolean).join(' · ');
    const now = new Date().toISOString();
    const entry: JournalEntry = {
      id: existing?.id ?? uid(),
      createdAt: existing?.createdAt ?? now,
      title,
      summary,
      content: existing ? `${existing.content}\n\n${parts.join('\n\n')}` : parts.join('\n\n'),
      tag: 'Revisão',
      updatedAt: now,
    };
    update(upsert('journal', entry));
    setWorked('');
    setDidnt('');
    setAdjust('');
    setSaved(true);
  }

  return (
    <>
      <PageHeader title="Revisão semanal" actions={<MonthNav label={label} onPrev={() => changeWeek(addDays(start, -7))} onNext={() => changeWeek(addDays(start, 7))} onLabel={() => changeWeek(weekStart(today))} />} />
      {inProgress && <p className="muted small center">Semana em andamento — os números vão até hoje.</p>}

      <section className="card">
        <div className="summary">
          <div className="summary-box">
            <span className="label">Rotina</span>
            <span className="value">{routinePct === null ? '—' : `${routinePct}%`}</span>
            <span className="muted small">{r.routineScheduled ? `${r.routineDone} de ${r.routineScheduled} feitos` : 'nada programado'}</span>
          </div>
          <div className="summary-box">
            <span className="label">Gastos</span>
            <span className="value">{formatMoney(r.spent)}</span>
            <span className="muted small">{formatMoney(r.paid)} pagos · {formatMoney(r.received)} entrou</span>
          </div>
          <div className="summary-box">
            <span className="label">Tarefas</span>
            <span className="value">{r.tasksDone}</span>
            <span className="muted small">concluída(s)</span>
          </div>
          <div className="summary-box">
            <span className="label">Diário</span>
            <span className="value">{r.journal.length}</span>
            <span className="muted small">registro(s)</span>
          </div>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Núcleo pessoal</h2>
            <a className="link" href="#/nucleo">Abrir</a>
          </div>
          {r.routine.length === 0 && r.quitting.length === 0 ? (
            <Empty>Nenhum ritual ou hábito nesta semana.</Empty>
          ) : (
            <ul className="bars">
              {r.routine.map(({ habit: h, done, scheduled }) => {
                const pct = (done / scheduled) * 100;
                return (
                  <li key={h.id}>
                    <div className="bar-head">
                      <span>
                        {h.name} {pct < 50 && <Pill tone="orange">Atenção</Pill>}
                      </span>
                      <span className="muted tabular">
                        {done}/{scheduled}
                      </span>
                    </div>
                    <div className="bar">
                      <div style={{ width: `${pct}%`, background: h.color }} />
                    </div>
                  </li>
                );
              })}
              {data.settings.journeyUnlockedAt && r.attributes.length > 0 && (
                <li className="attr-week">
                  <span className="muted small">Atributos treinados</span>
                  <span className="attr-week-list">
                    {r.attributes.map((a) => (
                      <span key={a.code} className="pill">
                        <span className="attr-code" style={{ color: a.color }}>
                          {a.code}
                        </span>{' '}
                        +{a.points}
                      </span>
                    ))}
                  </span>
                </li>
              )}
              {r.quitting.map(({ habit: h, slips }) => (
                <li key={h.id} className="toggle-row">
                  <span>Sem {h.name.charAt(0).toLowerCase() + h.name.slice(1)}</span>
                  {slips ? <Pill tone="red">{slips} recaída(s)</Pill> : <Pill tone="green">Sem recaídas</Pill>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Finanças</h2>
            <a className="link" href="#/financas">Abrir</a>
          </div>
          {r.byCategory.length === 0 ? (
            <Empty>Nenhum gasto nesta semana.</Empty>
          ) : (
            <>
              <p className="day-sub">Onde mais gastou</p>
              <ul className="list">
                {r.byCategory.slice(0, 3).map((c) => {
                  const cat = categoryOf(c.categoryId);
                  return (
                    <li key={c.categoryId} className="row">
                      <CategoryBadge icon={cat.icon} color={cat.color} size={34} />
                      <div className="row-body">
                        <span className="row-title">{cat.name}</span>
                      </div>
                      <span className="amount">{formatMoney(c.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {r.overdue.length > 0 && (
            <p className="risk-note">
              <Icon name="alert" size={16} /> {r.overdue.length} conta(s) vencida(s) em aberto.
            </p>
          )}
          {r.nextBills.length > 0 && (
            <>
              <p className="day-sub">Vencem na semana seguinte</p>
              <ul className="list">
                {r.nextBills.slice(0, 5).map((b) => (
                  <li key={b.key}>
                    <BillRow bill={b} today={today} categoryOf={categoryOf} onClick={() => (location.hash = '/financas')} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Agenda</h2>
            <a className="link" href="#/agenda">Abrir</a>
          </div>
          <dl className="detail-rows">
            <div>
              <dt>Compromissos na semana</dt>
              <dd>{r.events}</dd>
            </div>
            <div>
              <dt>Tarefas concluídas</dt>
              <dd>{r.tasksDone}</dd>
            </div>
            <div>
              <dt>Tarefas atrasadas</dt>
              <dd className={r.tasksOverdue ? 'orange' : undefined}>{r.tasksOverdue}</dd>
            </div>
            <div>
              <dt>Compromissos na semana seguinte</dt>
              <dd>{r.nextEvents}</dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Diário da semana</h2>
            <a className="link" href="#/diario">Abrir</a>
          </div>
          {r.journal.length === 0 ? (
            <Empty>Nenhum registro nesta semana.</Empty>
          ) : (
            <ul className="list">
              {r.journal.map((j) => (
                <li key={j.id} className="row">
                  <div className="row-body">
                    <span className="row-title">{entryTitle(j)}</span>
                    <span className="row-meta">{formatDateTime(j.createdAt)}</span>
                  </div>
                  {j.tag && <Pill>{j.tag}</Pill>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card raised">
        <div className="card-head">
          <h2>Reflexão</h2>
          {existing && <Pill tone="green">Salva no diário</Pill>}
        </div>
        <div className="form">
          <Field label="O que funcionou?">
            <textarea className="input" rows={2} value={worked} onChange={(e) => setWorked(e.target.value)} placeholder="Ex.: dormi no horário 4 dias" />
          </Field>
          <Field label="O que não funcionou?">
            <textarea className="input" rows={2} value={didnt} onChange={(e) => setDidnt(e.target.value)} placeholder="Ex.: gastei mais com delivery" />
          </Field>
          <Field label="O que ajustar na próxima semana?">
            <textarea className="input" rows={2} value={adjust} onChange={(e) => setAdjust(e.target.value)} placeholder="Ex.: preparar marmitas no domingo" />
          </Field>
          <button type="button" className="btn primary block" disabled={!worked.trim() && !didnt.trim() && !adjust.trim()} onClick={saveReflection}>
            <Icon name="journal" size={18} /> {existing ? 'Acrescentar ao registro da revisão' : 'Salvar no diário'}
          </button>
          {saved && <p className="muted small center">Reflexão salva no diário com a etiqueta “Revisão”.</p>}
        </div>
      </section>
    </>
  );
}
