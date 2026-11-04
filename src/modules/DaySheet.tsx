import { useState, type ReactNode } from 'react';
import { useStore } from '../store';
import { go } from '../router';
import { toggleTask } from '../actions';
import { billStatus, getInvoice, installmentLabel, invoiceMonths, type Invoice } from '../finance';
import { habitsOfDay, toggleSlip } from '../habits';
import type { CalendarEvent, Expense, Task } from '../types';
import { formatLongDate, formatMoney, relativeDay, sum, todayISO, toISO } from '../utils';
import { CategoryBadge, Icon, Pill, Sheet, type IconName } from '../ui';
import { EventItem, sortEvents } from './Agenda';
import { TaskItem } from './Tarefas';
import { HabitCheck } from './Habitos';
import { entrySummary, entryTitle } from './Diario';
import { ExpenseDetail } from './financas/ExpenseDetail';
import { ExpenseForm } from './financas/ExpenseForm';
import { InvoiceSheet } from './financas/InvoiceSheet';
import { BillStatusPill, CreditCardVisual, useCategoryOf } from './financas/shared';

function Section({ icon, title, extra, children }: { icon: IconName; title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="day-section">
      <div className="day-section-head">
        <Icon name={icon} size={18} />
        <h3>{title}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

const localDay = (iso: string) => toISO(new Date(iso));
const localTime = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** Tudo o que acontece num dia, de todos os módulos: o "ecossistema" visto pelo calendário. */
export function DaySheet({
  day,
  onClose,
  onAddEvent,
  onAddTask,
  onEditEvent,
  onEditTask,
}: {
  day: string;
  onClose: () => void;
  onAddEvent: () => void;
  onAddTask: () => void;
  onEditEvent: (e: CalendarEvent) => void;
  onEditTask: (t: Task) => void;
}) {
  const { data, update } = useStore();
  const categoryOf = useCategoryOf();
  const today = todayISO();
  const [expenseId, setExpenseId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<{ cardId: string; month: string } | null>(null);
  const [newExpense, setNewExpense] = useState(false);

  // Agenda
  const events = data.events.filter((e) => e.date === day).sort(sortEvents);
  const tasks = data.tasks.filter((t) => t.due === day);

  // Finanças
  const invoices: Invoice[] = [];
  for (const card of data.cards) for (const m of invoiceMonths(data, card.id)) invoices.push(getInvoice(data, card, m, today));
  const dueExpenses = data.expenses.filter((e) => !e.cardId && e.dueDate === day);
  const dueInvoices = invoices.filter((i) => i.dueDate === day && i.items.length);
  // Compra parcelada aparece uma vez só (pela 1ª parcela), com o total.
  const purchases = data.expenses.filter((e) => e.cardId && e.purchaseDate === day && (e.kind !== 'parcelada' || e.installment === 1));
  const seriesTotal = (e: Expense) => sum(data.expenses.filter((x) => x.seriesId === e.seriesId).map((x) => x.amount));
  const paidExpenses = data.expenses.filter((e) => !e.cardId && e.paidAt === day && e.dueDate !== day);
  const paidInvoices = invoices.filter((i) => i.paidAt === day && i.dueDate !== day);
  const dueTotal = sum([...dueExpenses.map((e) => e.amount), ...dueInvoices.map((i) => i.total)]);
  const hasMoney = dueExpenses.length + dueInvoices.length + purchases.length + paidExpenses.length + paidInvoices.length > 0;

  // Núcleo pessoal
  const nucleo = habitsOfDay(data.habits, day);
  const routine = [...nucleo.rituals, ...nucleo.building];
  const past = day <= today;
  const routineDone = routine.filter((h) => h.checks.includes(day)).length;

  // Diário
  const entries = data.journal.filter((e) => localDay(e.createdAt) === day).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const empty = events.length + tasks.length + routine.length + nucleo.quitting.length + entries.length === 0 && !hasMoney;
  const rel = relativeDay(day);

  const summary = [
    events.length && `${events.length} compromisso${events.length > 1 ? 's' : ''}`,
    tasks.length && `${tasks.length} tarefa${tasks.length > 1 ? 's' : ''}`,
    dueTotal > 0 && `${formatMoney(dueTotal)} em contas`,
    routine.length && (past ? `${routineDone} de ${routine.length} na rotina` : `${routine.length} na rotina`),
  ].filter(Boolean);

  const expenseRow = (e: Expense, meta: string, amount: number = e.amount) => {
    const cat = categoryOf(e.categoryId);
    return (
      <li key={e.id}>
        <button type="button" className="row" onClick={() => setExpenseId(e.id)}>
          <CategoryBadge icon={cat.icon} color={cat.color} size={36} />
          <div className="row-body">
            <span className="row-title">{e.description}</span>
            <span className="row-meta">{meta}</span>
          </div>
          <div className="row-end">
            <span className="amount">{formatMoney(amount)}</span>
          </div>
        </button>
      </li>
    );
  };

  const invoiceRow = (inv: Invoice, paid: boolean) => (
    <li key={`${inv.card.id}:${inv.month}`}>
      <button type="button" className="row" onClick={() => setInvoice({ cardId: inv.card.id, month: inv.month })}>
        <CreditCardVisual name={inv.card.name} color={inv.card.color} mini />
        <div className="row-body">
          <span className="row-title">Fatura {inv.card.name}</span>
          <span className="row-meta">{paid ? 'Paga neste dia' : `${inv.items.length} compra(s)`}</span>
        </div>
        <div className="row-end">
          <span className="amount">{formatMoney(inv.total)}</span>
          {!paid && <BillStatusPill bill={{ paidAt: inv.paidAt, dueDate: inv.dueDate }} today={today} />}
        </div>
      </button>
    </li>
  );

  return (
    <>
      <Sheet
        title={formatLongDate(day)}
        badge={rel === 'Hoje' || rel === 'Amanhã' || rel === 'Ontem' ? <Pill tone={rel === 'Hoje' ? 'green' : 'gray'}>{rel}</Pill> : undefined}
        onClose={onClose}
        footer={
          <div className="day-actions">
            <button type="button" className="btn soft small" onClick={onAddEvent}>
              <Icon name="calendarPlus" size={16} /> Compromisso
            </button>
            <button type="button" className="btn soft small" onClick={onAddTask}>
              <Icon name="listPlus" size={16} /> Tarefa
            </button>
            <button type="button" className="btn soft small" onClick={() => setNewExpense(true)}>
              <Icon name="wallet" size={16} /> Despesa
            </button>
          </div>
        }
      >
        {summary.length > 0 && <p className="muted small">{summary.join(' · ')}</p>}
        {empty && <p className="empty">Nada registrado neste dia.</p>}

        {events.length > 0 && (
          <Section icon="calendar" title="Compromissos">
            <ul className="list">
              {events.map((e) => (
                <EventItem key={e.id} ev={e} onClick={() => onEditEvent(e)} />
              ))}
            </ul>
          </Section>
        )}

        {tasks.length > 0 && (
          <Section icon="tasks" title="Tarefas">
            <ul className="list">
              {tasks.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={() => update(toggleTask(t.id))} onEdit={() => onEditTask(t)} />
              ))}
            </ul>
          </Section>
        )}

        {hasMoney && (
          <Section icon="wallet" title="Finanças" extra={dueTotal > 0 ? <span className="muted small">{formatMoney(dueTotal)} vencendo</span> : undefined}>
            {(dueExpenses.length > 0 || dueInvoices.length > 0) && (
              <>
                <p className="day-sub">Vencem neste dia</p>
                <ul className="list">
                  {dueExpenses.map((e) => {
                    const parcel = installmentLabel(e);
                    const status = billStatus({ paidAt: e.paidAt, dueDate: e.dueDate }, today);
                    return expenseRow(e, `${parcel ? `Parcela ${parcel} · ` : e.kind === 'fixa' ? 'Mensal · ' : ''}${status === 'pago' ? 'Pago' : status === 'vencida' ? 'Vencida' : 'A pagar'}`);
                  })}
                  {dueInvoices.map((i) => invoiceRow(i, false))}
                </ul>
              </>
            )}
            {purchases.length > 0 && (
              <>
                <p className="day-sub">Compras no cartão</p>
                <ul className="list">
                  {purchases.map((e) => {
                    const card = data.cards.find((c) => c.id === e.cardId)?.name ?? 'Cartão';
                    if (e.kind === 'parcelada' && e.installments) {
                      return expenseRow(e, `${card} · ${e.installments}x de ${formatMoney(e.amount)}`, seriesTotal(e));
                    }
                    return expenseRow(e, e.kind === 'fixa' ? `${card} · mensal` : card);
                  })}
                </ul>
              </>
            )}
            {(paidExpenses.length > 0 || paidInvoices.length > 0) && (
              <>
                <p className="day-sub">Pagamentos feitos</p>
                <ul className="list">
                  {paidExpenses.map((e) => expenseRow(e, 'Pago neste dia'))}
                  {paidInvoices.map((i) => invoiceRow(i, true))}
                </ul>
              </>
            )}
          </Section>
        )}

        {(routine.length > 0 || nucleo.quitting.length > 0) && (
          <Section icon="target" title="Núcleo pessoal" extra={routine.length ? <span className="muted small">{past ? `${routineDone} de ${routine.length}` : `${routine.length} planejados`}</span> : undefined}>
            <ul className="list">
              {routine.map((h) => (
                <li key={h.id} className="row">
                  {past ? <HabitCheck h={h} day={day} label={`Marcar "${h.name}" neste dia`} /> : <span className="dot" style={{ background: h.color }} />}
                  <div className="row-body">
                    <span className="row-title">{h.name}</span>
                    <span className="row-meta">
                      {h.kind === 'ritual' ? 'Ritual' : 'Hábito em construção'}
                      {h.time ? ` · ${h.time}` : ''}
                    </span>
                  </div>
                  {!past && <Pill>Planejado</Pill>}
                </li>
              ))}
              {past &&
                nucleo.quitting.map((h) => {
                  const slip = h.slips.includes(day);
                  return (
                    <li key={h.id} className="row">
                      <span className="dot" style={{ background: h.color }} />
                      <div className="row-body">
                        <span className="row-title">Sem {h.name.charAt(0).toLowerCase() + h.name.slice(1)}</span>
                        <span className="row-meta">Hábito a abandonar</span>
                      </div>
                      <button type="button" className="link-row" onClick={() => update(toggleSlip(h.id, day))} aria-label={slip ? 'Desfazer recaída' : 'Registrar recaída neste dia'}>
                        {slip ? <Pill tone="red">Recaída</Pill> : <Pill tone="green">Livre</Pill>}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </Section>
        )}

        {entries.length > 0 && (
          <Section icon="journal" title="Diário">
            <ul className="list">
              {entries.map((e) => (
                <li key={e.id}>
                  <button type="button" className="row" onClick={() => go('diario')}>
                    <span className="event-time">{localTime(e.createdAt)}</span>
                    <div className="row-body">
                      <span className="row-title">{entryTitle(e)}</span>
                      {entrySummary(e) && <span className="row-meta">{entrySummary(e)}</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </Sheet>

      {expenseId && <ExpenseDetail id={expenseId} onClose={() => setExpenseId(null)} onOpenInvoice={(cardId, month) => { setExpenseId(null); setInvoice({ cardId, month }); }} />}
      {invoice && <InvoiceSheet cardId={invoice.cardId} month={invoice.month} onClose={() => setInvoice(null)} />}
      {newExpense && <ExpenseForm initialDate={day} onClose={() => setNewExpense(false)} />}
    </>
  );
}
