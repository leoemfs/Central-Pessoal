/**
 * Orçamento por categoria e relatórios de gastos.
 * O mês de uma despesa segue Finanças: vencimento, ou a fatura quando é no cartão.
 * Contas fixas e parcelas contam inteiras; gastos avulsos entram no ritmo do mês.
 */
import type { AppData, Expense } from './types.ts';
import { addMonths, dayOf, daysInMonth, monthKey, sum, todayISO } from './utils.ts';

const monthOf = (e: Expense) => (e.cardId ? e.invoiceMonth ?? monthKey(e.dueDate) : monthKey(e.dueDate));
/** Dia em que o gasto "aconteceu" (compra no cartão = data da compra). */
const dayOfSpend = (e: Expense) => (e.cardId && e.purchaseDate ? e.purchaseDate : e.dueDate);

export interface CategorySpend {
  total: number;
  /** Contas fixas e parcelas. */
  fixed: number;
  /** Avulsas até hoje. */
  variableToDate: number;
  /** Avulsas marcadas para depois de hoje. */
  variableLater: number;
}

export function monthSpend(d: AppData, month: string, today: string = todayISO()): Map<string, CategorySpend> {
  const m = new Map<string, CategorySpend>();
  for (const e of d.expenses) {
    if (monthOf(e) !== month) continue;
    const c = m.get(e.categoryId) ?? { total: 0, fixed: 0, variableToDate: 0, variableLater: 0 };
    c.total += e.amount;
    if (e.kind !== 'avulsa') c.fixed += e.amount;
    else if (dayOfSpend(e) <= today) c.variableToDate += e.amount;
    else c.variableLater += e.amount;
    m.set(e.categoryId, c);
  }
  for (const c of m.values()) {
    c.total = sum([c.total]);
    c.fixed = sum([c.fixed]);
    c.variableToDate = sum([c.variableToDate]);
    c.variableLater = sum([c.variableLater]);
  }
  return m;
}

const EMPTY: CategorySpend = { total: 0, fixed: 0, variableToDate: 0, variableLater: 0 };

/** Projeção de um gasto no fim do mês: fixas inteiras + avulsas no ritmo atual. Meses passados: o total. */
export function project(c: CategorySpend, month: string, today: string = todayISO()): number {
  const cur = monthKey(today);
  if (month < cur) return c.total;
  if (month > cur) return c.total;
  const dim = daysInMonth(month);
  const day = dayOf(today);
  return sum([c.fixed, c.variableLater, (c.variableToDate / day) * dim]);
}

/** Antes deste dia do mês, o app não faz previsão de fechamento. */
export const EARLY_DAYS = 10;

export interface BudgetRow {
  categoryId: string;
  budget: number;
  spent: number;
  pct: number;
  left: number;
  /** Quanto dá por dia até o fim do mês (só no mês atual e com gastos avulsos). */
  perDay: number | null;
  daysLeft: number;
  /** Só contas fixas (aluguel, luz…): não avisa aos 80%, só se passar. */
  onlyFixed: boolean;
  tone: 'green' | 'orange' | 'red';
  /** Aparece no Início? */
  alert: boolean;
}

export function budgetRows(d: AppData, month: string, today: string = todayISO()): BudgetRow[] {
  const spend = monthSpend(d, month, today);
  const cur = month === monthKey(today);
  const daysLeft = cur ? Math.max(1, daysInMonth(month) - dayOf(today)) : 0;
  return Object.entries(d.budgets)
    .filter(([id, b]) => b > 0 && d.categories.some((c) => c.id === id))
    .map(([categoryId, budget]) => {
      const c = spend.get(categoryId) ?? EMPTY;
      const pct = c.total / budget;
      const onlyFixed = c.fixed > 0 && c.variableToDate + c.variableLater === 0;
      const over = pct > 1.001;
      return {
        categoryId, budget, spent: c.total, pct, left: sum([budget, -c.total]), daysLeft,
        perDay: cur && !onlyFixed ? Math.max(0, budget - c.total) / daysLeft : null,
        onlyFixed,
        tone: over ? 'red' : pct >= 0.8 && !onlyFixed ? 'orange' : 'green',
        alert: cur && (over || (pct >= 0.8 && !onlyFixed)),
      } as BudgetRow;
    })
    .sort((a, b) => b.pct - a.pct);
}

/** Total do orçamento, gasto e projeção do mês (só nas categorias com orçamento). */
export function budgetSummary(d: AppData, month: string, today: string = todayISO()) {
  const spend = monthSpend(d, month, today);
  const ids = Object.keys(d.budgets).filter((id) => d.budgets[id] > 0 && d.categories.some((c) => c.id === id));
  const budget = sum(ids.map((id) => d.budgets[id]));
  const spent = sum(ids.map((id) => spend.get(id)?.total ?? 0));
  const projected = sum(ids.map((id) => project(spend.get(id) ?? EMPTY, month, today)));
  const dim = daysInMonth(month);
  /** Nos primeiros dias, uma compra grande distorce a previsão: só prevê a partir do dia 10. */
  const early = month === monthKey(today) && dayOf(today) < EARLY_DAYS;
  return { budget, spent, projected, early, monthPct: month === monthKey(today) ? dayOf(today) / dim : month < monthKey(today) ? 1 : 0 };
}

/** Média dos `n` meses anteriores (para sugerir orçamento e comparar nos relatórios). */
export function categoryAverage(d: AppData, categoryId: string, month: string, n = 3, today: string = todayISO()): number {
  const vals = Array.from({ length: n }, (_, i) => monthSpend(d, addMonths(month, -(i + 1)), today).get(categoryId)?.total ?? 0);
  return sum([vals.reduce((a, b) => a + b, 0) / n]);
}

export function setBudget(categoryId: string, value: number | null) {
  return (d: AppData): AppData => {
    const budgets = { ...d.budgets };
    if (value && value > 0) budgets[categoryId] = Math.round(value * 100) / 100;
    else delete budgets[categoryId];
    return { ...d, budgets };
  };
}

/** Preenche as categorias sem orçamento com a média dos últimos 3 meses (arredondada para R$ 10). */
export function suggestBudgets(month: string, today: string = todayISO()) {
  return (d: AppData): AppData => {
    const budgets = { ...d.budgets };
    for (const c of d.categories) {
      if (budgets[c.id]) continue;
      const a = categoryAverage(d, c.id, month, 3, today);
      if (a >= 10) budgets[c.id] = Math.round(a / 10) * 10;
    }
    return { ...d, budgets };
  };
}

// ---------- Relatórios ----------

export function lastMonths(month: string, n = 6): string[] {
  return Array.from({ length: n }, (_, i) => addMonths(month, i - (n - 1)));
}

export function monthTotal(d: AppData, month: string, today: string = todayISO()): number {
  return sum([...monthSpend(d, month, today).values()].map((c) => c.total));
}

export interface ReportRow {
  categoryId: string;
  amount: number;
  share: number;
  prev: number;
  avg: number;
}

export function monthReport(d: AppData, month: string, today: string = todayISO()) {
  const spend = monthSpend(d, month, today);
  const prev = monthSpend(d, addMonths(month, -1), today);
  const total = sum([...spend.values()].map((c) => c.total));
  const ids = new Set([...spend.keys(), ...prev.keys()]);
  const rows: ReportRow[] = [...ids]
    .map((id) => ({ categoryId: id, amount: spend.get(id)?.total ?? 0, share: total ? (spend.get(id)?.total ?? 0) / total : 0, prev: prev.get(id)?.total ?? 0, avg: categoryAverage(d, id, month, 3, today) }))
    .filter((r) => r.amount > 0 || r.prev > 0)
    .sort((a, b) => b.amount - a.amount);
  const projectedTotal = sum([...spend.values()].map((c) => project(c, month, today)));
  const prevTotal = sum([...prev.values()].map((c) => c.total));
  const partial = month === monthKey(today);
  const early = partial && dayOf(today) < EARLY_DAYS;
  // O que chama atenção: a categoria mais acima da própria média (no ritmo, se o mês está em andamento).
  const above = rows
    .filter((r) => r.avg >= 30)
    .map((r) => ({ categoryId: r.categoryId, delta: project(spend.get(r.categoryId) ?? EMPTY, month, today) / r.avg - 1 }))
    .sort((a, b) => b.delta - a.delta)[0];
  const fixedPerYear = sum(d.series.filter((s) => s.kind === 'fixa' && s.count === null).map((s) => s.amount * 12));
  return {
    total,
    rows,
    partial,
    prevTotal,
    /** Variação contra o mês anterior (no ritmo, se o mês está em andamento). */
    delta: prevTotal > 0 && !early ? (partial ? projectedTotal : total) / prevTotal - 1 : null,
    above: above && above.delta > 0.1 && !early ? above : null,
    fixedPerYear,
    top: rows[0] ?? null,
  };
}
