import { useMemo } from 'react';
import { useStore } from '../store';
import { toggleHabit, toggleTask } from '../actions';
import { monthBills, openBills, summarize } from '../finance';
import { addDays, formatDateTime, formatLongDate, formatMoney, formatMonth, greeting, monthKey, relativeDay, streak, toISO, todayISO } from '../utils';
import { Empty, Icon, Pill, Progress, type IconName } from '../ui';
import { sortTasks, TaskItem } from './Tarefas';
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

const QUICK: { to: string; label: string; icon: IconName }[] = [
  { to: 'financas/nova', label: 'Nova despesa', icon: 'plusCircle' },
  { to: 'diario/nova', label: 'Escrever diário', icon: 'notePen' },
  { to: 'agenda/novo-compromisso', label: 'Compromisso', icon: 'calendarPlus' },
  { to: 'agenda/nova-tarefa', label: 'Nova tarefa', icon: 'listPlus' },
];

function greetingEmoji(): string {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? '☀️' : h >= 12 && h < 18 ? '🌤️' : '🌙';
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function Dashboard() {
  const { data, update } = useStore();
  const categoryOf = useCategoryOf();
  const today = todayISO();
  const month = monthKey(today);

  const summary = useMemo(() => summarize(monthBills(data, month, today)), [data, month, today]);
  const dueSoon = useMemo(() => openBills(data, addDays(today, 7), today), [data, today]);
  const tasks = useMemo(() => data.tasks.filter((t) => !t.done && t.due !== null && t.due <= addDays(today, 1)).sort(sortTasks), [data.tasks, today]);
  const otherPending = data.tasks.filter((t) => !t.done).length - tasks.length;
  const events = useMemo(() => data.events.filter((e) => e.date >= today).sort(sortEvents).slice(0, 4), [data.events, today]);
  const journal = useMemo(() => [...data.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2), [data.journal]);
  const habitsDone = data.habits.filter((h) => h.checks.includes(today)).length;
  const eventsToday = data.events.filter((e) => e.date === today).length;
  const pendingTasks = data.tasks.filter((t) => !t.done).length;
  const lastEntry = journal[0];
  const lastEntryLabel = lastEntry ? relativeDay(toISO(new Date(lastEntry.createdAt))).toLowerCase() : null;
  const day: { to: string; icon: IconName; title: string; text: string }[] = [
    { to: 'agenda', icon: 'calendar', title: 'Agenda', text: eventsToday ? `${plural(eventsToday, 'compromisso', 'compromissos')} hoje` : 'Nenhum compromisso hoje' },
    { to: 'financas', icon: 'wallet', title: 'Finanças', text: dueSoon.length ? `${plural(dueSoon.length, 'conta próxima', 'contas próximas')} do vencimento` : 'Nenhuma conta vencendo nos próximos dias' },
    { to: 'diario', icon: 'book', title: 'Diário', text: lastEntryLabel ? `Último registro: ${lastEntryLabel}` : 'Nenhum registro ainda' },
    { to: 'agenda/tarefas', icon: 'tasks', title: 'Tarefas', text: pendingTasks ? plural(pendingTasks, 'tarefa pendente', 'tarefas pendentes') : 'Nenhuma tarefa pendente' },
  ];

  const backupDays = data.settings.lastBackupAt ? Math.floor((Date.now() - new Date(data.settings.lastBackupAt).getTime()) / 864e5) : null;
  const hasData = data.expenses.length + data.journal.length + data.tasks.length + data.events.length > 0;
  const needsBackup = hasData && (backupDays === null || backupDays > 30);

  return (
    <>
      <header className="page-header hero">
        <div className="page-title">
          <h1>
            {greeting()}! <span aria-hidden="true">{greetingEmoji()}</span>
          </h1>
          <p className="muted">{formatLongDate(today)}</p>
        </div>
      </header>

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

      <section className="card">
        <div className="card-head">
          <h2>Acesso rápido</h2>
        </div>
        <div className="quick-grid">
          {QUICK.map((q) => (
            <a key={q.to} href={`#/${q.to}`}>
              <Icon name={q.icon} size={26} />
              <span>{q.label}</span>
            </a>
          ))}
        </div>
      </section>

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

          {data.habits.length > 0 && (
            <section className="card">
              <div className="card-head">
                <h2>Hábitos de hoje</h2>
                <Pill tone={habitsDone === data.habits.length ? 'green' : 'gray'}>
                  {habitsDone}/{data.habits.length}
                </Pill>
              </div>
              <ul className="list">
                {data.habits.map((h) => {
                  const on = h.checks.includes(today);
                  return (
                    <li key={h.id} className="row">
                      <button
                        type="button"
                        className={`check${on ? ' on' : ''}`}
                        style={on ? { background: h.color, borderColor: h.color } : { borderColor: h.color }}
                        onClick={() => update(toggleHabit(h.id))}
                        aria-pressed={on}
                        aria-label={`Marcar "${h.name}" hoje`}
                      >
                        {on && <Icon name="check" size={14} />}
                      </button>
                      <div className="row-body">
                        <span className="row-title">{h.name}</span>
                      </div>
                      <span className="pill">
                        <Icon name="flame" size={13} /> {streak(h.checks)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
