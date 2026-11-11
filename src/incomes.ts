/**
 * Receitas: entradas avulsas ou mensais (salário, vale…), previstas ou recebidas,
 * e o balanço do mês contra as despesas. Sem dependência de interface.
 */
import type { AppData, Income, IncomeSeries } from './types.ts';
import { addMonths, clampDay, dayOf, monthKey, sum, todayISO, stableId, uid } from './utils.ts';
import { monthBills, summarize } from './finance.ts';

/** Meses à frente em que as receitas mensais já ficam geradas. */
export const INCOME_AHEAD = 2;

export interface IncomeInput {
  description: string;
  sourceId: string;
  amount: number;
  date: string;
  /** Repete todo mês (ex.: salário). */
  recurring: boolean;
  /** Já entrou? Data em que entrou. */
  receivedAt: string | null;
}

function occurrence(s: Pick<IncomeSeries, 'id' | 'description' | 'sourceId' | 'startDate'>, k: number, amount: number, stamp: string): Income {
  return {
    id: stableId(s.id, k + 1),
    seriesId: s.id,
    installment: k + 1,
    description: s.description,
    sourceId: s.sourceId,
    amount,
    date: clampDay(addMonths(monthKey(s.startDate), k), dayOf(s.startDate)),
    receivedAt: null,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function addIncome(d: AppData, input: IncomeInput, today: string = todayISO()): AppData {
  const stamp = new Date().toISOString();
  if (!input.recurring) {
    const inc: Income = {
      id: uid(), seriesId: null, installment: null, description: input.description, sourceId: input.sourceId,
      amount: input.amount, date: input.date, receivedAt: input.receivedAt, createdAt: stamp, updatedAt: stamp,
    };
    return { ...d, incomes: [...d.incomes, inc] };
  }
  const series: IncomeSeries = {
    id: uid(), description: input.description, sourceId: input.sourceId, amount: input.amount,
    startDate: input.date, count: null, generated: 0, createdAt: stamp,
  };
  let next = materializeIncomes({ ...d, incomeSeries: [...d.incomeSeries, series] }, addMonths(monthKey(today), INCOME_AHEAD));
  if (input.receivedAt) {
    next = { ...next, incomes: next.incomes.map((i) => (i.seriesId === series.id && i.installment === 1 ? { ...i, receivedAt: input.receivedAt } : i)) };
  }
  return next;
}

/** Gera as receitas mensais até o mês `target` (sempre gera ao menos a 1ª). */
export function materializeIncomes(d: AppData, target: string): AppData {
  const stamp = new Date().toISOString();
  const created: Income[] = [];
  let changed = false;
  const incomeSeries = d.incomeSeries.map((s) => {
    const limit = s.count ?? Infinity;
    const start = monthKey(s.startDate);
    let g = s.generated;
    while (g < limit && (g === 0 || addMonths(start, g) <= target)) {
      created.push(occurrence(s, g, s.amount, stamp));
      g++;
    }
    if (g === s.generated) return s;
    changed = true;
    return { ...s, generated: g };
  });
  return changed ? { ...d, incomeSeries, incomes: [...d.incomes, ...created] } : d;
}

/** Marca como recebida (com data e valor reais). Numa receita mensal, um valor diferente vira a previsão dos próximos meses. */
export function receiveIncome(d: AppData, id: string, receivedAt: string, amount: number): AppData {
  const inc = d.incomes.find((i) => i.id === id);
  if (!inc) return d;
  const stamp = new Date().toISOString();
  const old = inc.amount;
  const propagate = inc.seriesId !== null && amount !== old;
  const incomes = d.incomes.map((i) => {
    if (i.id === id) return { ...i, receivedAt, amount, updatedAt: stamp };
    if (propagate && i.seriesId === inc.seriesId && (i.installment ?? 0) > (inc.installment ?? 0) && !i.receivedAt && i.amount === old) {
      return { ...i, amount, updatedAt: stamp };
    }
    return i;
  });
  const incomeSeries = propagate ? d.incomeSeries.map((s) => (s.id === inc.seriesId ? { ...s, amount } : s)) : d.incomeSeries;
  return { ...d, incomes, incomeSeries };
}

export function unreceiveIncome(d: AppData, id: string): AppData {
  const stamp = new Date().toISOString();
  return { ...d, incomes: d.incomes.map((i) => (i.id === id ? { ...i, receivedAt: null, updatedAt: stamp } : i)) };
}

/** Escopo nas receitas mensais: só este mês, ou este e os próximos. */
export type IncomeScope = 'one' | 'next';

export interface IncomePatch {
  description: string;
  sourceId: string;
  amount: number;
  date: string;
}

export function editIncome(d: AppData, id: string, patch: IncomePatch, scope: IncomeScope): AppData {
  const inc = d.incomes.find((i) => i.id === id);
  if (!inc) return d;
  const stamp = new Date().toISOString();
  if (!inc.seriesId || scope === 'one') {
    return { ...d, incomes: d.incomes.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: stamp } : i)) };
  }
  // Este e os próximos: descrição e fonte em todos; valor e dia só nos que ainda não entraram.
  const newDay = dayOf(patch.date);
  const incomes = d.incomes.map((i) => {
    if (i.seriesId !== inc.seriesId || (i.installment ?? 0) < (inc.installment ?? 0)) return i;
    const base = { ...i, description: patch.description, sourceId: patch.sourceId, updatedAt: stamp };
    return i.receivedAt ? base : { ...base, amount: patch.amount, date: clampDay(monthKey(i.date), newDay) };
  });
  const incomeSeries = d.incomeSeries.map((s) =>
    s.id === inc.seriesId ? { ...s, description: patch.description, sourceId: patch.sourceId, amount: patch.amount, startDate: clampDay(monthKey(s.startDate), newDay) } : s,
  );
  return { ...d, incomes, incomeSeries };
}

export function deleteIncome(d: AppData, id: string, scope: IncomeScope): AppData {
  const inc = d.incomes.find((i) => i.id === id);
  if (!inc) return d;
  const stamp = new Date().toISOString();
  const gone = (i: Income) => i.id === id || (scope === 'next' && inc.seriesId !== null && i.seriesId === inc.seriesId && (i.installment ?? 0) >= (inc.installment ?? 0));
  const removed = d.incomes.filter(gone);
  const incomes = d.incomes.filter((i) => !gone(i));
  const deleted = { ...d.deleted };
  for (const r of removed) deleted[r.id] = stamp;
  let incomeSeries = d.incomeSeries;
  if (inc.seriesId && scope === 'next') {
    incomeSeries = incomeSeries.map((s) => (s.id === inc.seriesId ? { ...s, count: (inc.installment ?? 1) - 1 } : s));
  }
  incomeSeries = incomeSeries.filter((s) => {
    const keep = s.count === null || incomes.some((i) => i.seriesId === s.id);
    if (!keep) deleted[s.id] = stamp;
    return keep;
  });
  return { ...d, incomes, incomeSeries, deleted };
}

// ---------- Visão do mês ----------

export function monthIncomes(d: AppData, month: string): Income[] {
  return d.incomes.filter((i) => monthKey(i.date) === month).sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));
}

export function incomeSummary(list: Income[]) {
  const total = sum(list.map((i) => i.amount));
  const received = sum(list.filter((i) => i.receivedAt).map((i) => i.amount));
  return { total, received, pending: sum([total, -received]), pct: total > 0 ? (received / total) * 100 : 0 };
}

export type IncomeStatus = 'recebido' | 'atrasado' | 'previsto';

export function incomeStatus(i: Pick<Income, 'receivedAt' | 'date'>, today: string = todayISO()): IncomeStatus {
  if (i.receivedAt) return 'recebido';
  return i.date < today ? 'atrasado' : 'previsto';
}

/**
 * Balanço do mês: previsto (tudo o que deve entrar − tudo o que vence) e realizado
 * (o que já entrou − o que já foi pago).
 */
export function monthBalance(d: AppData, month: string, today: string = todayISO()) {
  const inc = incomeSummary(monthIncomes(d, month));
  const exp = summarize(monthBills(d, month, today));
  return {
    incomeTotal: inc.total,
    incomeReceived: inc.received,
    expenseTotal: exp.total,
    expensePaid: exp.paid,
    planned: sum([inc.total, -exp.total]),
    current: sum([inc.received, -exp.paid]),
  };
}

export function sourceTotals(d: AppData, month: string): { sourceId: string; amount: number }[] {
  const m = new Map<string, number>();
  for (const i of monthIncomes(d, month)) m.set(i.sourceId, (m.get(i.sourceId) ?? 0) + i.amount);
  return [...m.entries()].map(([sourceId, amount]) => ({ sourceId, amount: Math.round(amount * 100) / 100 })).sort((a, b) => b.amount - a.amount);
}
