/**
 * Agenda › Próximos: compromissos, tarefas com prazo e contas em aberto, numa lista corrida por dia.
 * O que já passou e não foi resolvido (tarefa ou conta) aparece em "Atrasados".
 */
import type { AppData } from './types.ts';
import { openBills } from './finance.ts';
import { addDays, todayISO } from './utils.ts';

export interface UpcomingItem {
  key: string;
  kind: 'evento' | 'tarefa' | 'conta';
  title: string;
  day: string;
  /** Hora do compromisso (HH:MM) ou vazio. */
  time: string;
  amount: number | null;
  /** id do compromisso ou da tarefa; na conta, a chave da conta. */
  ref: string;
  /** 🔔 Me lembrar ligado (N3). */
  remind: boolean;
  /** Módulo de onde veio (para a cor do ícone): conta = Finanças; compromisso criado por outro módulo = esse módulo. */
  module: string;
}

export interface Upcoming {
  overdue: UpcomingItem[];
  days: { day: string; items: UpcomingItem[] }[];
  total: number;
}

const ORDER = { evento: 0, tarefa: 1, conta: 2 } as const;

export function upcoming(d: AppData, today: string = todayISO(), horizon = 30): Upcoming {
  const until = addDays(today, horizon);
  const items: UpcomingItem[] = [];
  for (const e of d.events) {
    if (e.date >= today && e.date <= until) items.push({ key: `e:${e.id}`, kind: 'evento', title: e.title, day: e.date, time: e.time, amount: null, ref: e.id, remind: e.remind !== false, module: e.origin ? e.origin.split('/')[0] || 'agenda' : 'agenda' });
  }
  for (const t of d.tasks) {
    if (!t.done && t.due && t.due <= until) items.push({ key: `t:${t.id}`, kind: 'tarefa', title: t.title, day: t.due, time: '', amount: null, ref: t.id, remind: t.remind === true, module: 'agenda' });
  }
  for (const b of openBills(d, until, today)) {
    items.push({ key: `b:${b.key}`, kind: 'conta', title: b.title, day: b.dueDate, time: '', amount: b.amount, ref: b.key, remind: d.settings.googleCalendar.on && d.settings.googleCalendar.bills, module: 'financas' });
  }
  const sort = (a: UpcomingItem, b: UpcomingItem) => a.day.localeCompare(b.day) || ORDER[a.kind] - ORDER[b.kind] || (a.time || '99').localeCompare(b.time || '99') || a.title.localeCompare(b.title);
  items.sort(sort);
  const overdue = items.filter((i) => i.day < today);
  const byDay = new Map<string, UpcomingItem[]>();
  for (const i of items.filter((x) => x.day >= today)) byDay.set(i.day, [...(byDay.get(i.day) ?? []), i]);
  return { overdue, days: [...byDay].map(([day, its]) => ({ day, items: its })), total: items.length };
}

/**
 * N3: liga/desliga o 🔔 de um item do Próximos. Reunião de Carreira muda na própria reunião;
 * os outros compromissos e as tarefas mudam neles mesmos. Conta não muda aqui (null): o aviso das contas é geral.
 */
export function toggleRemind(d: AppData, it: UpcomingItem): AppData | null {
  const on = !it.remind;
  if (it.kind === 'tarefa') return { ...d, tasks: d.tasks.map((t) => (t.id === it.ref ? { ...t, remind: on } : t)) };
  if (it.kind !== 'evento') return null;
  const ev = d.events.find((e) => e.id === it.ref);
  if (!ev) return null;
  const meetingId = ev.origin?.match(/^carreira\/abrir-m-(.+)$/)?.[1];
  const events = d.events.map((e) => (e.id === it.ref ? { ...e, remind: on } : e));
  if (meetingId) return { ...d, events, career: { ...d.career, meetings: d.career.meetings.map((m) => (m.id === meetingId ? { ...m, remind: on } : m)) } };
  return { ...d, events };
}
