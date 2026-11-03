import { useMemo } from 'react';
import { useStore } from '../store';
import { toggleHabit, toggleTask } from '../actions';
import { formatLongDate, formatMoney, formatMonth, greeting, monthKey, streak, todayISO } from '../utils';
import { Card, Empty, Icon } from '../ui';
import { sortTasks, TaskItem } from './Tarefas';
import { monthTotals } from './Financas';
import { EventItem, sortEvents } from './Agenda';

function SeeAll({ href }: { href: string }) {
  return (
    <a className="link" href={href}>
      Ver tudo
    </a>
  );
}

export function Dashboard() {
  const { data, update } = useStore();
  const today = todayISO();
  const month = monthKey(today);

  const dueTasks = useMemo(() => data.tasks.filter((t) => !t.done && t.due !== null && t.due <= today).sort(sortTasks), [data.tasks, today]);
  const otherPending = data.tasks.filter((t) => !t.done).length - dueTasks.length;
  const todayEvents = useMemo(() => data.events.filter((e) => e.date === today).sort(sortEvents), [data.events, today]);
  const nextEvents = useMemo(() => data.events.filter((e) => e.date > today).sort(sortEvents).slice(0, 3), [data.events, today]);
  const totals = useMemo(() => monthTotals(data.transactions, month), [data.transactions, month]);
  const pinned = useMemo(() => data.notes.filter((n) => n.pinned).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4), [data.notes]);
  const habitsDone = data.habits.filter((h) => h.checks.includes(today)).length;

  const isEmpty = data.tasks.length + data.events.length + data.transactions.length + data.habits.length + data.notes.length === 0;

  return (
    <>
      <header className="page-header hero">
        <div>
          <h1>{greeting()}!</h1>
          <p className="muted">{formatLongDate(today)}</p>
        </div>
      </header>

      {isEmpty && (
        <Card className="welcome">
          <h2>Bem-vindo à sua Central Pessoal</h2>
          <p className="muted">Tudo fica salvo apenas neste aparelho, no seu navegador. Comece por onde quiser:</p>
          <div className="quick-links">
            <a className="btn" href="#/tarefas"><Icon name="tasks" size={18} /> Criar tarefa</a>
            <a className="btn" href="#/financas"><Icon name="wallet" size={18} /> Lançar gasto</a>
            <a className="btn" href="#/habitos"><Icon name="target" size={18} /> Criar hábito</a>
            <a className="btn" href="#/notas"><Icon name="note" size={18} /> Escrever nota</a>
            <a className="btn" href="#/agenda"><Icon name="calendar" size={18} /> Marcar evento</a>
          </div>
        </Card>
      )}

      <div className="stats">
        <a className="stat" href="#/tarefas">
          <span className="stat-label">Tarefas para hoje</span>
          <span className="stat-value">{dueTasks.length}</span>
        </a>
        <a className="stat" href="#/habitos">
          <span className="stat-label">Hábitos hoje</span>
          <span className="stat-value">
            {habitsDone}/{data.habits.length}
          </span>
        </a>
        <a className="stat" href="#/financas">
          <span className="stat-label">Saldo de {formatMonth(month).split(' ')[0].toLowerCase()}</span>
          <span className={`stat-value ${totals.balance >= 0 ? 'positive' : 'negative'}`}>{formatMoney(totals.balance)}</span>
        </a>
        <a className="stat" href="#/agenda">
          <span className="stat-label">Eventos hoje</span>
          <span className="stat-value">{todayEvents.length}</span>
        </a>
      </div>

      <div className="grid-2">
        <Card title="Tarefas de hoje e atrasadas" action={<SeeAll href="#/tarefas" />}>
          {dueTasks.length === 0 ? (
            <Empty>{otherPending > 0 ? `Nada vencendo hoje. Você tem ${otherPending} outra(s) pendente(s).` : 'Tudo em dia!'}</Empty>
          ) : (
            <ul className="list">
              {dueTasks.slice(0, 8).map((t) => (
                <TaskItem key={t.id} task={t} onToggle={() => update(toggleTask(t.id))} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Agenda" action={<SeeAll href="#/agenda" />}>
          {todayEvents.length === 0 && nextEvents.length === 0 ? (
            <Empty>Nenhum evento marcado.</Empty>
          ) : (
            <ul className="list">
              {todayEvents.map((e) => (
                <EventItem key={e.id} ev={e} />
              ))}
              {todayEvents.length === 0 && <li className="list-note muted small">Nada hoje. Próximos:</li>}
              {nextEvents.map((e) => (
                <EventItem key={e.id} ev={e} showDate />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Hábitos de hoje" action={<SeeAll href="#/habitos" />}>
          {data.habits.length === 0 ? (
            <Empty>Nenhum hábito cadastrado.</Empty>
          ) : (
            <ul className="list">
              {data.habits.map((h) => {
                const on = h.checks.includes(today);
                const s = streak(h.checks);
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
                    <span className="chip">
                      <Icon name="flame" size={13} /> {s}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={`Finanças · ${formatMonth(month)}`} action={<SeeAll href="#/financas" />}>
          <dl className="kv">
            <div>
              <dt>Receitas</dt>
              <dd className="positive">{formatMoney(totals.income)}</dd>
            </div>
            <div>
              <dt>Despesas</dt>
              <dd className="negative">{formatMoney(totals.expense)}</dd>
            </div>
            <div>
              <dt>Saldo</dt>
              <dd className={totals.balance >= 0 ? 'positive' : 'negative'}>{formatMoney(totals.balance)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {pinned.length > 0 && (
        <Card title="Notas fixadas" action={<SeeAll href="#/notas" />}>
          <div className="pinned">
            {pinned.map((n) => (
              <a key={n.id} className="pinned-note" href="#/notas">
                <strong>{n.title.trim() || 'Sem título'}</strong>
                <span className="note-preview">{n.content.slice(0, 160)}</span>
              </a>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
