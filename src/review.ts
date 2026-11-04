/**
 * Revisão semanal: junta Núcleo, Finanças, Agenda e Diário de uma semana (segunda a domingo).
 */
import type { AppData, Expense, Habit, JournalEntry } from './types.ts';
import { getInvoice, invoiceMonths, openBills, type Bill } from './finance.ts';
import { isScheduled } from './habits.ts';
import { addDays, fromISO, sum, toISO, todayISO } from './utils.ts';

/** Segunda-feira da semana de `day`. */
export function weekStart(day: string): string {
  const wd = fromISO(day).getDay(); // 0 = domingo
  return addDays(day, wd === 0 ? -6 : 1 - wd);
}

/** Semana que a revisão abre por padrão: na segunda, a semana que acabou; nos outros dias, a atual. */
export function defaultReviewWeek(today: string = todayISO()): string {
  const start = weekStart(today);
  return fromISO(today).getDay() === 1 ? addDays(start, -7) : start;
}

export interface HabitWeek {
  habit: Habit;
  done: number;
  scheduled: number;
}

export interface WeekReview {
  start: string;
  end: string;
  routine: HabitWeek[];
  routineDone: number;
  routineScheduled: number;
  quitting: { habit: Habit; slips: number }[];
  spent: number;
  paid: number;
  byCategory: { categoryId: string; amount: number }[];
  nextBills: Bill[];
  overdue: Bill[];
  events: number;
  tasksDone: number;
  tasksOverdue: number;
  journal: JournalEntry[];
  nextEvents: number;
}

const inRange = (d: string | null | undefined, a: string, b: string) => !!d && d >= a && d <= b;

export function weekReview(d: AppData, start: string, today: string = todayISO()): WeekReview {
  const end = addDays(start, 6);
  const last = end < today ? end : today; // só conta dias que já passaram
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)).filter((x) => x <= last);

  // Núcleo
  const routine: HabitWeek[] = d.habits
    .filter((h) => h.kind !== 'abandonar')
    .map((h) => {
      const created = toISO(new Date(h.createdAt));
      const planned = days.filter((x) => isScheduled(h, x) && (x >= created || h.checks.includes(x)));
      return { habit: h, scheduled: planned.length, done: planned.filter((x) => h.checks.includes(x)).length };
    })
    .filter((r) => r.scheduled > 0)
    .sort((a, b) => a.done / a.scheduled - b.done / b.scheduled);
  const quitting = d.habits.filter((h) => h.kind === 'abandonar' && h.startDate <= last).map((h) => ({ habit: h, slips: h.slips.filter((x) => inRange(x, start, last)).length }));

  // Finanças: gasto = contas fora do cartão que vencem na semana + compras no cartão feitas na semana
  // (uma compra parcelada conta pelo total, no dia da compra).
  const seriesTotal = (e: Expense) => sum(d.expenses.filter((x) => x.seriesId === e.seriesId).map((x) => x.amount));
  const spentItems: { categoryId: string; amount: number }[] = [];
  for (const e of d.expenses) {
    if (!e.cardId && inRange(e.dueDate, start, end)) spentItems.push({ categoryId: e.categoryId, amount: e.amount });
    if (e.cardId && inRange(e.purchaseDate, start, end) && (e.kind !== 'parcelada' || e.installment === 1)) {
      spentItems.push({ categoryId: e.categoryId, amount: e.kind === 'parcelada' && e.seriesId ? seriesTotal(e) : e.amount });
    }
  }
  const cat = new Map<string, number>();
  for (const i of spentItems) cat.set(i.categoryId, (cat.get(i.categoryId) ?? 0) + i.amount);
  const invoicesPaid = d.cards.flatMap((c) => invoiceMonths(d, c.id).map((m) => getInvoice(d, c, m, today))).filter((i) => inRange(i.paidAt, start, end));
  const paid = sum([...d.expenses.filter((e) => !e.cardId && inRange(e.paidAt, start, end)).map((e) => e.amount), ...invoicesPaid.map((i) => i.total)]);
  const upcoming = openBills(d, addDays(end, 7), today);

  return {
    start,
    end,
    routine,
    routineDone: sum(routine.map((r) => r.done)),
    routineScheduled: sum(routine.map((r) => r.scheduled)),
    quitting,
    spent: sum(spentItems.map((i) => i.amount)),
    paid,
    byCategory: [...cat.entries()].map(([categoryId, amount]) => ({ categoryId, amount: Math.round(amount * 100) / 100 })).sort((a, b) => b.amount - a.amount),
    nextBills: upcoming.filter((b) => b.dueDate > end),
    overdue: upcoming.filter((b) => b.dueDate < today),
    events: d.events.filter((e) => inRange(e.date, start, end)).length,
    tasksDone: d.tasks.filter((t) => t.done && t.doneAt && inRange(toISO(new Date(t.doneAt)), start, end)).length,
    tasksOverdue: d.tasks.filter((t) => !t.done && t.due !== null && t.due < today).length,
    journal: d.journal.filter((j) => inRange(toISO(new Date(j.createdAt)), start, end)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    nextEvents: d.events.filter((e) => e.date > end && e.date <= addDays(end, 7)).length,
  };
}
