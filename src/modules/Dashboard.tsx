import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { toggleTask } from '../actions';
import { cleanDays, habitsOfDay, habitStreak } from '../habits';
import { UNLOCK_DAYS, unlockProgress } from '../journey';
import { HabitCheck, qtyText, RiskPill } from './Habitos';
import { monthBills, openBills, summarize } from '../finance';
import { monthBalance } from '../incomes';
import { addDays, formatDateTime, formatLongDate, formatMoney, formatMonth, greeting, monthKey, relativeDay, toISO, todayISO } from '../utils';
import { Empty, Icon, Pill, Progress, type IconName } from '../ui';
import { sortTasks, TaskItem } from './Tarefas';
import { AskCard, ForYou, Interview } from './Voce';
import { WeekPractice } from './Praticas';
import { SaveToday } from './financas/Caixinhas';
import { completeness } from '../profile';
import { EventItem, sortEvents } from './Agenda';
import { entrySummary, entryTitle } from './Diario';
import { BillRow } from './financas/Financas';
import { useCategoryOf } from './financas/shared';

function SeeAll({ href, label = 'Ver tudo' }: { href: string; label?: string }) {
  return (
    <a className="link" href={href}>
      {label}
    </a>
  );
}


function greetingEmoji(): string {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? '☀️' : h >= 12 && h < 18 ? '🌤️' : '🌙';
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function Dashboard() {
  const { data, update } = useStore();
  const [interview, setInterview] = useState(false);
  const p = data.profile;
  const categoryOf = useCategoryOf();
  const today = todayISO();
  const month = monthKey(today);

  const summary = useMemo(() => summarize(monthBills(data, month, today)), [data, month, today]);
  const balance = useMemo(() => monthBalance(data, month, today), [data, month, today]);
  const dueSoon = useMemo(() => openBills(data, addDays(today, 7), today), [data, today]);
  const tasks = useMemo(() => data.tasks.filter((t) => !t.done && t.due !== null && t.due <= addDays(today, 1)).sort(sortTasks), [data.tasks, today]);
  const otherPending = data.tasks.filter((t) => !t.done).length - tasks.length;
  const events = useMemo(() => data.events.filter((e) => e.date >= today).sort(sortEvents).slice(0, 4), [data.events, today]);
  const journal = useMemo(() => [...data.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2), [data.journal]);
  const journey = unlockProgress(data, today);
  const nucleo = habitsOfDay(data.habits, today);
  const routine = [...nucleo.rituals, ...nucleo.building];
  const routineDone = routine.filter((h) => h.checks.includes(today)).length;
  const eventsToday = data.events.filter((e) => e.date === today).length;
  const pendingTasks = data.tasks.filter((t) => !t.done).length;
  const lastEntry = journal[0];
  const lastEntryLabel = lastEntry ? relativeDay(toISO(new Date(lastEntry.createdAt))).toLowerCase() : null;
  const day: { to: string; icon: IconName; title: string; text: string }[] = [
    { to: 'agenda', icon: 'calendar', title: 'Agenda', text: eventsToday ? `${plural(eventsToday, 'compromisso', 'compromissos')} hoje` : 'Nenhum compromisso hoje' },
    { to: 'financas', icon: 'wallet', title: 'Finanças', text: dueSoon.length ? `${plural(dueSoon.length, 'conta próxima', 'contas próximas')} do vencimento` : 'Nenhuma conta vencendo nos próximos dias' },
    { to: 'diario', icon: 'book', title: 'Diário', text: lastEntryLabel ? `Último registro: ${lastEntryLabel}` : 'Nenhum registro ainda' },
    { to: 'agenda/tarefas', icon: 'tasks', title: 'Tarefas', text: pendingTasks ? plural(pendingTasks, 'tarefa pendente', 'tarefas pendentes') : 'Nenhuma tarefa pendente' },
    {
      to: 'jornada',
      icon: journey.unlocked ? 'sword' : 'lock',
      title: 'Jornada',
      text: journey.unlocked ? 'Desbloqueada — veja seu nível' : `${journey.active} de ${UNLOCK_DAYS} dias de uso para desbloquear`,
    },
    { to: 'nucleo', icon: 'target', title: 'Núcleo pessoal', text: routine.length ? `${routineDone} de ${routine.length} rituais e hábitos feitos` : 'Nada programado para hoje' },
  ];

  const backupDays = data.settings.lastBackupAt ? Math.floor((Date.now() - new Date(data.settings.lastBackupAt).getTime()) / 864e5) : null;
  const hasData = data.expenses.length + data.journal.length + data.tasks.length + data.events.length > 0;
  const needsBackup = hasData && (backupDays === null || backupDays > 30);

  return (
    <>
      <header className="page-header hero">
        <div className="page-title">
          <h1>
            {greeting()}
            {p.name ? `, ${p.name}` : ''}! <span aria-hidden="true">{greetingEmoji()}</span>
          </h1>
          <p className="muted desktop-only">{formatLongDate(today)}</p>
        </div>
        <div className="page-actions">
          <a className="avatar-btn" href="#/voce" aria-label={`Você: perfil ${completeness(p)}% preenchido`} title="Você">
            {p.name ? p.name.charAt(0).toUpperCase() : <Icon name="smile" size={20} />}
          </a>
        </div>
      </header>

      <AskCard onAnswer={() => setInterview(true)} />

      <section className="card raised">
        <div className="card-head">
          <h2>Seu dia</h2>
        </div>
        <ul className="day-list">
          {day.map((d) => (
            <li key={d.title}>
              <a href={`#/${d.to}`}>
                <Icon name={d.icon} size={22} />
                <span>
                  <strong>{d.title}</strong>
                  <span className="muted">{d.text}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <SaveToday />
      <ForYou />


      {(new Date().getDay() === 0 || new Date().getDay() === 1) && (
        <a className="card review-cta" href="#/revisao">
          <Icon name="calendarCheck" size={26} />
          <span>
            <strong>Hora da revisão semanal</strong>
            <span className="muted small">Veja como foi a semana em todas as áreas e anote o que ajustar.</span>
          </span>
          <Icon name="right" size={18} />
        </a>
      )}

      {needsBackup && (
        <a className="alert orange" href="#/ajustes" style={{ textDecoration: 'none' }}>
          {backupDays === null ? 'Você ainda não fez um backup.' : `Último backup há ${backupDays} dias.`} Seus dados ficam só neste aparelho — toque para exportar.
        </a>
      )}

      <div className="grid-2">
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>{formatMonth(month)}</h2>
              <SeeAll href="#/financas" label="Finanças" />
            </div>
            <div className="summary">
              <div className="summary-box">
                <span className="label">Total do mês</span>
                <span className="value">{formatMoney(summary.total)}</span>
              </div>
              <div className="summary-box">
                <span className="label">Já pago</span>
                <span className="value green">{formatMoney(summary.paid)}</span>
              </div>
              <div className="summary-box full">
                <span className="label">Em aberto</span>
                <span className={`value ${summary.open > 0 ? 'orange' : ''}`}>{formatMoney(summary.open)}</span>
                <Progress pct={summary.pct} />
              </div>
            </div>
            {balance.incomeTotal > 0 && (
              <a className="balance-line" href="#/financas/receitas">
                <span>
                  Receitas <strong className="green">{formatMoney(balance.incomeTotal)}</strong>
                </span>
                <span>
                  Sobra prevista <strong className={balance.planned >= 0 ? 'green' : 'red'}>{formatMoney(balance.planned)}</strong>
                </span>
              </a>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Contas a vencer</h2>
              <span className="muted small">próximos 7 dias</span>
            </div>
            {dueSoon.length === 0 ? (
              <Empty>Nenhuma conta vencendo. 🎉</Empty>
            ) : (
              <ul className="list">
                {dueSoon.slice(0, 6).map((b) => (
                  <li key={b.key}>
                    <BillRow bill={b} today={today} categoryOf={categoryOf} onClick={() => (location.hash = '/financas')} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Meu diário</h2>
              <SeeAll href="#/diario" />
            </div>
            {journal.length === 0 ? (
              <Empty>Nenhum registro ainda.</Empty>
            ) : (
              journal.map((e) => (
                <a key={e.id} className="dash-entry" href="#/diario">
                  <span className="row-title">{entryTitle(e)}</span>
                  <span className="row-meta">{formatDateTime(e.createdAt)}</span>
                  {entrySummary(e) && <p className="muted small" style={{ marginTop: 4 }}>{entrySummary(e)}</p>}
                </a>
              ))
            )}
            <a className="btn soft block" href="#/diario/nova" style={{ marginTop: 12 }}>
              <Icon name="plusCircle" size={18} /> <span className="green">Nova atualização</span>
            </a>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>Compromissos</h2>
              <SeeAll href="#/agenda" />
            </div>
            {events.length === 0 ? (
              <Empty>Nenhum compromisso marcado.</Empty>
            ) : (
              <ul className="list">
                {events.map((e) => (
                  <EventItem key={e.id} ev={e} showDate />
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Tarefas</h2>
              <SeeAll href="#/agenda/tarefas" />
            </div>
            {tasks.length === 0 ? (
              <Empty>{otherPending > 0 ? `Nada para hoje. ${otherPending} pendente(s) sem urgência.` : 'Tudo em dia!'}</Empty>
            ) : (
              <ul className="list">
                {tasks.slice(0, 6).map((t) => (
                  <TaskItem key={t.id} task={t} onToggle={() => update(toggleTask(t.id))} />
                ))}
              </ul>
            )}
          </section>

          {(routine.length > 0 || nucleo.quitting.length > 0) && (
            <section className="card">
              <div className="card-head">
                <h2>Núcleo de hoje</h2>
                <a className="link" href="#/nucleo">
                  Ver tudo
                </a>
              </div>
              <ul className="list">
                {routine.map((h) => (
                  <li key={h.id} className="row">
                    <HabitCheck h={h} day={today} label={`Marcar "${h.name}" hoje`} />
                    <div className="row-body">
                      <span className="row-title">{h.name}</span>
                      <span className="row-meta">
                        {h.kind === 'ritual' ? 'Ritual' : 'Construindo'}
                        {h.time ? ` · ${h.time}` : ''}
                        {qtyText(h, today) ? ` · ${qtyText(h, today)}` : ''}
                      </span>
                    </div>
                    <RiskPill h={h} today={today} />
                    {h.link && !h.checks.includes(today) ? (
                      <a className="btn small" href={`#/nucleo/pratica/${encodeURIComponent(h.link)}`} aria-label={`Iniciar: ${h.name}`}>
                        <Icon name="right" size={14} /> Iniciar
                      </a>
                    ) : (
                      <span className="pill">
                        <Icon name="flame" size={13} /> {habitStreak(h, today)}
                      </span>
                    )}
                  </li>
                ))}
                {nucleo.quitting.map((h) => (
                  <li key={h.id} className="row">
                    <span className="dot" style={{ background: h.color }} />
                    <div className="row-body">
                      <span className="row-title">{h.name}</span>
                      <span className="row-meta">Abandonando</span>
                    </div>
                    <Pill tone="green">{cleanDays(h, today)} dias sem</Pill>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <WeekPractice />
        </div>
      </div>
      {interview && <Interview start={p.onboarding.step} onClose={() => setInterview(false)} />}
    </>
  );
}
