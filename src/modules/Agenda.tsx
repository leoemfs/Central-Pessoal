import { useMemo, useState } from 'react';
import { CardScreen } from '../Cards';
import type { ViewProps } from '../App';
import { useStore } from '../store';
import { go, useSubAction } from '../router';
import { remove, upsert } from '../actions';
import { getInvoice, invoiceMonths } from '../finance';
import type { CalendarEvent, Task } from '../types';
import { addDays, addMonths, daysInMonth, formatLongDate, formatMonth, fromISO, monthKey, relativeDay, todayISO, uid, WEEKDAYS } from '../utils';
import { Empty, Field, Icon, MonthNav, PageHeader, Pill, Segmented, Sheet } from '../ui';
import { TaskForm, TasksPanel } from './Tarefas';
import { DaySheet } from './DaySheet';

export function sortEvents(a: CalendarEvent, b: CalendarEvent): number {
  return a.date.localeCompare(b.date) || (a.time || '00:00').localeCompare(b.time || '00:00');
}

export function EventItem({ ev, showDate, onClick }: { ev: CalendarEvent; showDate?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <span className="event-time">{ev.time || 'Dia todo'}</span>
      <div className="row-body">
        <span className="row-title">{ev.title}</span>
        <span className="row-meta">
          {showDate && <Pill>{relativeDay(ev.date)}</Pill>}
          {ev.origin?.startsWith('carreira/') && <Pill tone="blue">Carreira</Pill>}
          {ev.location && (
            <span>
              <Icon name="mapPin" size={13} /> {ev.location}
            </span>
          )}
        </span>
      </div>
    </>
  );
  return <li>{onClick ? <button type="button" className="row" onClick={onClick}>{body}</button> : <div className="row">{body}</div>}</li>;
}

interface DayBill {
  key: string;
  title: string;
  amount: number;
  paid: boolean;
  date: string;
}

/** Vencimentos (contas fora do cartão e faturas) por dia. */
function useBillsByDay(): Map<string, DayBill[]> {
  const { data } = useStore();
  return useMemo(() => {
    const m = new Map<string, DayBill[]>();
    const add = (b: DayBill) => m.set(b.date, [...(m.get(b.date) ?? []), b]);
    for (const e of data.expenses) if (!e.cardId) add({ key: e.id, title: e.description, amount: e.amount, paid: e.paidAt !== null, date: e.dueDate });
    for (const card of data.cards)
      for (const month of invoiceMonths(data, card.id)) {
        const inv = getInvoice(data, card, month);
        add({ key: `${card.id}:${month}`, title: `Fatura ${card.name}`, amount: inv.total, paid: inv.paidAt !== null, date: inv.dueDate });
      }
    return m;
  }, [data]);
}

type Tab = 'calendario' | 'tarefas';

export function Agenda({ route }: ViewProps) {
  const { data } = useStore();
  const today = todayISO();
  const [tab, setTab] = useState<Tab>('calendario');
  const [month, setMonth] = useState(monthKey(today));
  const [selected, setSelected] = useState(today);
  const [dayOpen, setDayOpen] = useState(false);
  const [eventForm, setEventForm] = useState<CalendarEvent | 'new' | null>(null);
  const [taskForm, setTaskForm] = useState<Task | 'new' | null>(null);
  const billsByDay = useBillsByDay();

  useSubAction(route, 'agenda', {
    tarefas: () => setTab('tarefas'),
    calendario: () => setTab('calendario'),
    hoje: () => {
      setTab('calendario');
      setSelected(today);
      setMonth(monthKey(today));
      setDayOpen(true);
    },
    novo: () => (tab === 'tarefas' ? setTaskForm('new') : setEventForm('new')),
    'nova-tarefa': () => {
      setTab('tarefas');
      setTaskForm('new');
    },
    'novo-compromisso': () => setEventForm('new'),
  });

  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of data.events) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    for (const l of m.values()) l.sort(sortEvents);
    return m;
  }, [data.events]);
  const tasksByDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of data.tasks) if (t.due) m.set(t.due, [...(m.get(t.due) ?? []), t]);
    return m;
  }, [data.tasks]);

  const cells = useMemo(() => {
    const first = `${month}-01`;
    const offset = fromISO(first).getDay();
    const count = Math.ceil((offset + daysInMonth(month)) / 7) * 7;
    return Array.from({ length: count }, (_, i) => addDays(first, i - offset));
  }, [month]);

  function pick(day: string) {
    setSelected(day);
    if (monthKey(day) !== month) setMonth(monthKey(day));
  }

  const upcoming = data.events.filter((e) => e.date >= today).sort(sortEvents).slice(0, 5);

  return (
    <>
      <PageHeader
        title="Agenda"
        actions={<MonthNav label={formatMonth(month)} onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} onLabel={() => pick(today)} />}
        tabs={<Segmented label="Visão" swipe value={tab} onChange={setTab} options={[{ value: 'calendario', label: 'Calendário' }, { value: 'tarefas', label: 'Tarefas' }]} />}
      />

      {tab === 'tarefas' ? (
        <>
          <TasksPanel onEdit={(t) => setTaskForm(t)} />
        </>
      ) : (
        <div className="grid-2">
          <CardScreen
            screen="agenda"
            cards={[
              { id: 'calendario', label: 'Calendário', lock: 'top', node: (
          <section className="card">
            <div className="calendar" role="grid" aria-label={formatMonth(month)}>
              {WEEKDAYS.map((w) => (
                <div key={w} className="cal-weekday" role="columnheader">
                  {w}
                </div>
              ))}
              {cells.map((d) => {
                const ev = (eventsByDay.get(d) ?? []).length;
                const tk = (tasksByDay.get(d) ?? []).filter((t) => !t.done).length;
                const bl = (billsByDay.get(d) ?? []).filter((b) => !b.paid).length;
                const cls = ['cal-day', monthKey(d) !== month && 'outside', d === today && 'today', d === selected && 'selected'].filter(Boolean).join(' ');
                return (
                  <button key={d} type="button" role="gridcell" className={cls} aria-selected={d === selected} onClick={() => { pick(d); setDayOpen(true); }} aria-label={`${formatLongDate(d)}: ${ev} compromisso(s), ${tk} tarefa(s), ${bl} conta(s)`}>
                    <span className="cal-num">{fromISO(d).getDate()}</span>
                    <span className="cal-marks">
                      {ev > 0 && <span className="mark-event" />}
                      {tk > 0 && <span className="mark-task" />}
                      {bl > 0 && <span className="mark-bill" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="legend">
              <span><i className="mark-event" /> Compromisso</span>
              <span><i className="mark-task" /> Tarefa</span>
              <span><i className="mark-bill" /> Conta a pagar</span>
            </div>
            <p className="muted small" style={{ marginTop: 6 }}>Toque num dia para ver tudo o que acontece nele.</p>
          </section>
          ) },
              { id: 'proximos', label: 'Próximos compromissos', node: (
            <section className="card">
              <div className="card-head">
                <h2>Próximos compromissos</h2>
              </div>
              {upcoming.length === 0 ? (
                <Empty>Nenhum compromisso marcado.</Empty>
              ) : (
                <ul className="list">
                  {upcoming.map((e) => (
                    <EventItem key={e.id} ev={e} showDate onClick={() => (e.origin ? go(e.origin) : (pick(e.date), setEventForm(e)))} />
                  ))}
                </ul>
              )}
            </section>
          ) },
            ]}
          />
        </div>
      )}

      {dayOpen && (
        <DaySheet
          day={selected}
          onClose={() => setDayOpen(false)}
          onAddEvent={() => setEventForm('new')}
          onAddTask={() => setTaskForm('new')}
          onEditEvent={(e) => (e.origin ? go(e.origin) : setEventForm(e))}
          onEditTask={(t) => setTaskForm(t)}
        />
      )}
      {eventForm && <EventForm event={eventForm === 'new' ? undefined : eventForm} defaultDate={selected} onClose={() => setEventForm(null)} onSaved={pick} />}
      {taskForm && <TaskForm task={taskForm === 'new' ? undefined : taskForm} defaultDue={tab === 'calendario' ? selected : undefined} onClose={() => setTaskForm(null)} />}
    </>
  );
}

function EventForm({ event, defaultDate, onClose, onSaved }: { event?: CalendarEvent; defaultDate: string; onClose: () => void; onSaved: (date: string) => void }) {
  const { update } = useStore();
  const [title, setTitle] = useState(event?.title ?? '');
  const [date, setDate] = useState(event?.date ?? defaultDate);
  const [time, setTime] = useState(event?.time ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [description, setDescription] = useState(event?.description ?? '');

  function save() {
    if (!title.trim() || !date) return;
    update(upsert('events', { id: event?.id ?? uid(), title: title.trim(), date, time, location: location.trim(), description: description.trim() }));
    onSaved(date);
    onClose();
  }

  return (
    <Sheet
      title={event ? 'Editar compromisso' : 'Novo compromisso'}
      onClose={onClose}
      footer={
        <div className="btn-row">
          {event && (
            <button type="button" className="btn danger" onClick={() => { if (confirm(`Excluir "${event.title}"?`)) { update(remove('events', event.id)); onClose(); } }}>
              <Icon name="trash" size={18} /> Excluir
            </button>
          )}
          <button type="button" className="btn primary" disabled={!title.trim()} onClick={save}>
            Salvar compromisso
          </button>
        </div>
      }
    >
      <Field label="Título">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Dentista" autoFocus={!event} />
      </Field>
      <div className="form-row">
        <Field label="Data">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Horário" hint="Vazio = dia todo">
          <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <Field label="Local (opcional)">
        <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>
      <Field label="Descrição (opcional)">
        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
    </Sheet>
  );
}

