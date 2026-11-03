import { useMemo, useState, type FormEvent } from 'react';
import { useStore } from '../store';
import { remove, toggleTask, upsert } from '../actions';
import type { CalendarEvent, Task } from '../types';
import { addDays, addMonths, daysInMonth, formatLongDate, formatMonth, fromISO, monthKey, relativeDay, todayISO, uid, WEEKDAYS } from '../utils';
import { Card, Empty, Icon, IconButton, MonthNav, PageHeader } from '../ui';
import { TaskItem } from './Tarefas';

export function sortEvents(a: CalendarEvent, b: CalendarEvent): number {
  return a.date.localeCompare(b.date) || (a.time || '00:00').localeCompare(b.time || '00:00');
}

export function EventItem({ ev, showDate, onEdit, onDelete }: { ev: CalendarEvent; showDate?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <li className="row">
      <span className="event-time">{ev.time || 'Dia todo'}</span>
      <div className="row-body">
        <span className="row-title">{ev.title}</span>
        <span className="row-meta">
          {showDate && <span className="chip">{relativeDay(ev.date)}</span>}
          {ev.location && (
            <span className="muted with-icon">
              <Icon name="mapPin" size={13} /> {ev.location}
            </span>
          )}
          {ev.description && <span className="row-notes">{ev.description}</span>}
        </span>
      </div>
      {(onEdit || onDelete) && (
        <div className="row-actions">
          {onEdit && <IconButton icon="edit" label="Editar" onClick={onEdit} />}
          {onDelete && <IconButton icon="trash" label="Excluir" tone="danger" onClick={onDelete} />}
        </div>
      )}
    </li>
  );
}

interface Draft {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

export function Agenda() {
  const { data, update } = useStore();
  const today = todayISO();
  const [month, setMonth] = useState(monthKey(today));
  const [selected, setSelected] = useState(today);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyDraft = (date: string): Draft => ({ title: '', date, time: '', location: '', description: '' });
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(today));

  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of data.events) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    for (const list of m.values()) list.sort(sortEvents);
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
    const start = addDays(first, -offset);
    return Array.from({ length: count }, (_, i) => addDays(start, i));
  }, [month]);

  const upcoming = useMemo(() => data.events.filter((e) => e.date >= today).sort(sortEvents).slice(0, 6), [data.events, today]);

  const dayEvents = eventsByDay.get(selected) ?? [];
  const dayTasks = tasksByDay.get(selected) ?? [];

  function pick(day: string) {
    setSelected(day);
    if (monthKey(day) !== month) setMonth(monthKey(day));
    if (!editingId) setDraft((d) => ({ ...d, date: day }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    const ev: CalendarEvent = {
      id: editingId ?? uid(),
      title,
      date: draft.date || selected,
      time: draft.time,
      location: draft.location.trim(),
      description: draft.description.trim(),
    };
    update(upsert('events', ev));
    setEditingId(null);
    setSelected(ev.date);
    setMonth(monthKey(ev.date));
    setDraft(emptyDraft(ev.date));
  }

  function edit(ev: CalendarEvent) {
    setEditingId(ev.id);
    setDraft({ title: ev.title, date: ev.date, time: ev.time, location: ev.location, description: ev.description });
  }

  function cancel() {
    setEditingId(null);
    setDraft(emptyDraft(selected));
  }

  function del(ev: CalendarEvent) {
    if (confirm(`Excluir o evento "${ev.title}"?`)) {
      update(remove('events', ev.id));
      if (editingId === ev.id) cancel();
    }
  }

  function goToday() {
    setMonth(monthKey(today));
    pick(today);
  }

  return (
    <>
      <PageHeader title="Agenda" subtitle="Eventos e prazos de tarefas" actions={<MonthNav label={formatMonth(month)} onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} onToday={goToday} />} />

      <div className="grid-agenda">
        <Card className="calendar-card">
          <div className="calendar" role="grid" aria-label={formatMonth(month)}>
            {WEEKDAYS.map((w) => (
              <div key={w} className="cal-weekday" role="columnheader">
                {w}
              </div>
            ))}
            {cells.map((d) => {
              const evs = eventsByDay.get(d) ?? [];
              const tks = (tasksByDay.get(d) ?? []).filter((t) => !t.done);
              const classes = ['cal-day', monthKey(d) !== month && 'outside', d === today && 'today', d === selected && 'selected'].filter(Boolean).join(' ');
              return (
                <button key={d} type="button" role="gridcell" className={classes} onClick={() => pick(d)} aria-selected={d === selected} aria-label={`${formatLongDate(d)}: ${evs.length} evento(s), ${tks.length} tarefa(s)`}>
                  <span className="cal-num">{fromISO(d).getDate()}</span>
                  <span className="cal-marks">
                    {evs.slice(0, 2).map((e) => (
                      <span key={e.id} className="cal-event">
                        {e.title}
                      </span>
                    ))}
                    {evs.length > 2 && <span className="cal-more">+{evs.length - 2}</span>}
                    {tks.length > 0 && <span className="cal-task-dot" title={`${tks.length} tarefa(s)`} />}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="muted small legend">
            <span className="cal-event sample">Evento</span>
            <span className="cal-task-dot" /> Tarefa com prazo
          </p>
        </Card>

        <div className="stack">
          <Card title={relativeDay(selected) === 'Hoje' ? `Hoje · ${formatLongDate(selected)}` : formatLongDate(selected)}>
            {dayEvents.length === 0 && dayTasks.length === 0 ? (
              <Empty>Nada marcado para este dia.</Empty>
            ) : (
              <ul className="list">
                {dayEvents.map((ev) => (
                  <EventItem key={ev.id} ev={ev} onEdit={() => edit(ev)} onDelete={() => del(ev)} />
                ))}
                {dayTasks.map((t) => (
                  <TaskItem key={t.id} task={t} onToggle={() => update(toggleTask(t.id))} />
                ))}
              </ul>
            )}
          </Card>

          <Card title={editingId ? 'Editar evento' : 'Novo evento'}>
            <form className="form" onSubmit={submit}>
              <input className="input" placeholder="Título do evento" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} aria-label="Título do evento" required />
              <div className="form-row">
                <label className="field">
                  <span>Data</span>
                  <input type="date" className="input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} required />
                </label>
                <label className="field">
                  <span>Horário</span>
                  <input type="time" className="input" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
                </label>
              </div>
              <input className="input" placeholder="Local (opcional)" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} aria-label="Local" />
              <textarea className="input" rows={2} placeholder="Descrição (opcional)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} aria-label="Descrição" />
              <div className="form-actions">
                {editingId && (
                  <button type="button" className="btn ghost" onClick={cancel}>
                    Cancelar
                  </button>
                )}
                <button type="submit" className="btn primary">
                  <Icon name={editingId ? 'check' : 'plus'} size={18} />
                  {editingId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </Card>

          <Card title="Próximos eventos">
            {upcoming.length === 0 ? (
              <Empty>Nenhum evento futuro.</Empty>
            ) : (
              <ul className="list">
                {upcoming.map((ev) => (
                  <EventItem key={ev.id} ev={ev} showDate onEdit={() => { pick(ev.date); edit(ev); }} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
