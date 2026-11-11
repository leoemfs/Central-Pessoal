/**
 * Regras do módulo financeiro, sem nenhuma dependência de interface.
 * Todas as funções recebem o estado e devolvem um novo estado (sem mutação).
 */
import type { AppData, CreditCard, Expense, ExpenseKind, ExpenseSeries, PaymentMethod } from './types.ts';
import { addMonths, clampDay, dayOf, monthKey, pad, sum, todayISO, uid } from './utils.ts';

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: 'Pix',
  debito: 'Débito',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
  cartao: 'Cartão de crédito',
  vale: 'Vale (VR/VA)',
};

export const KIND_LABEL: Record<ExpenseKind, string> = {
  avulsa: 'Avulsa',
  fixa: 'Conta fixa',
  parcelada: 'Parcelada',
};

/** Meses à frente em que as contas fixas já ficam geradas. */
export const FIXA_AHEAD = 2;

// ---------- Cartão de crédito ----------

type CardDays = Pick<CreditCard, 'closingDay' | 'dueDay'>;

/**
 * Fatura (mês do vencimento, AAAA-MM) em que uma compra entra.
 * Compra antes do dia de fechamento → fatura que está fechando.
 * Compra no dia do fechamento ou depois → próxima fatura.
 */
export function invoiceMonthFor(card: CardDays, purchaseDate: string): string {
  const month = monthKey(purchaseDate);
  const closingThisMonth = dayOf(clampDay(month, card.closingDay));
  const closeMonth = dayOf(purchaseDate) < closingThisMonth ? month : addMonths(month, 1);
  // Se o vencimento é depois do fechamento no calendário, vence no mesmo mês; senão, no seguinte.
  return card.dueDay > card.closingDay ? closeMonth : addMonths(closeMonth, 1);
}

export function invoiceDueDate(card: CardDays, invoiceMonth: string): string {
  return clampDay(invoiceMonth, card.dueDay);
}

export function invoiceClosingDate(card: CardDays, invoiceMonth: string): string {
  const closeMonth = card.dueDay > card.closingDay ? invoiceMonth : addMonths(invoiceMonth, -1);
  return clampDay(closeMonth, card.closingDay);
}

/** Fatura aberta hoje: a que está recebendo as compras agora (M8). */
export function openInvoiceMonth(card: CardDays, today: string = todayISO()): string {
  return invoiceMonthFor(card, today);
}

/**
 * Faturas que a pessoa pode escolher ao lançar uma compra (M8): a calculada pela data, a anterior
 * (quando ainda não venceu na data da compra; ex.: cartão recém-cadastrado, compra que o banco já pôs
 * na fatura que está fechando) e a seguinte.
 */
export function invoiceChoices(card: CardDays, purchaseDate: string): string[] {
  const calc = invoiceMonthFor(card, purchaseDate);
  const prev = addMonths(calc, -1);
  return [...(invoiceDueDate(card, prev) >= purchaseDate ? [prev] : []), calc, addMonths(calc, 1)];
}

// ---------- Parcelas ----------

/** Divide um total em N parcelas; os centavos que sobram vão para a última (100/3 → 33,33 + 33,33 + 33,34). */
export function splitAmount(total: number, n: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const rest = cents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i === n - 1 ? rest : 0)) / 100);
}

export function installmentLabel(e: Pick<Expense, 'kind' | 'installment' | 'installments'>): string | null {
  if (e.kind !== 'parcelada' || !e.installment || !e.installments) return null;
  return `${pad(e.installment)}/${pad(e.installments)}`;
}

// ---------- Geração de ocorrências ----------

interface Template {
  kind: ExpenseKind;
  seriesId: string | null;
  description: string;
  categoryId: string;
  method: PaymentMethod;
  startDate: string;
  installments: number | null;
  /** Fatura escolhida para a 1ª ocorrência no cartão (M8); sem escolha, vale a calculada pela data. */
  invoiceMonth?: string | null;
}

function buildOccurrence(t: Template, k: number, amount: number, card: CreditCard | undefined, stamp: string): Expense {
  const base = {
    id: uid(),
    kind: t.kind,
    seriesId: t.seriesId,
    installment: t.kind === 'avulsa' ? null : k + 1,
    installments: t.kind === 'parcelada' ? t.installments : null,
    description: t.description,
    categoryId: t.categoryId,
    amount,
    paidAt: null,
    createdAt: stamp,
    updatedAt: stamp,
  };
  if (card) {
    // Parcelas de uma compra mantêm a data da compra; uma assinatura no cartão "compra" de novo todo mês.
    const purchaseDate = t.kind === 'fixa' ? clampDay(addMonths(monthKey(t.startDate), k), dayOf(t.startDate)) : t.startDate;
    const invoiceMonth = addMonths(t.invoiceMonth ?? invoiceMonthFor(card, t.startDate), k);
    return { ...base, method: 'cartao', cardId: card.id, purchaseDate, invoiceMonth, dueDate: invoiceDueDate(card, invoiceMonth) };
  }
  return {
    ...base,
    method: t.method,
    cardId: null,
    purchaseDate: null,
    invoiceMonth: null,
    dueDate: clampDay(addMonths(monthKey(t.startDate), k), dayOf(t.startDate)),
  };
}

/** Mês de referência da 1ª ocorrência de uma série (vencimento ou fatura). */
function firstMonth(s: ExpenseSeries, card: CreditCard | undefined): string {
  return card ? (s.invoiceMonth ?? invoiceMonthFor(card, s.startDate)) : monthKey(s.startDate);
}

export interface ExpenseInput {
  kind: ExpenseKind;
  description: string;
  categoryId: string;
  method: PaymentMethod;
  cardId: string | null;
  /** Vencimento, ou data da compra quando é no cartão. */
  date: string;
  /** Avulsa/fixa: [valor]. Parcelada: um valor por parcela. */
  amounts: number[];
  /** Só para avulsa fora do cartão: data em que já foi paga. */
  paidAt: string | null;
  /** Pago com vale (VR/VA). A despesa já nasce paga. */
  voucherId?: string | null;
  /** No cartão: fatura escolhida (AAAA-MM) para a compra (ou a 1ª parcela). Sem escolha, a calculada pela data. */
  invoiceMonth?: string | null;
}

export function addExpense(d: AppData, input: ExpenseInput, today: string = todayISO()): AppData {
  const stamp = new Date().toISOString();
  const card = input.method === 'cartao' ? d.cards.find((c) => c.id === input.cardId) : undefined;
  const method: PaymentMethod = card ? 'cartao' : input.method === 'cartao' ? 'pix' : input.method;
  const template: Template = {
    kind: input.kind,
    seriesId: null,
    description: input.description,
    categoryId: input.categoryId,
    method,
    startDate: input.date,
    installments: input.kind === 'parcelada' ? input.amounts.length : null,
    invoiceMonth: card ? (input.invoiceMonth ?? null) : null,
  };

  if (input.kind === 'avulsa') {
    const e = buildOccurrence(template, 0, input.amounts[0], card, stamp);
    const voucher = method === 'vale' && input.voucherId ? input.voucherId : null;
    // No vale, a compra já está paga (desconta do saldo na hora).
    const paidAt = card ? null : voucher ? (input.paidAt ?? (input.date > today ? today : input.date)) : input.paidAt;
    return { ...d, expenses: [...d.expenses, { ...e, paidAt, voucherId: voucher }] };
  }

  const series: ExpenseSeries = {
    id: uid(),
    kind: input.kind,
    description: input.description,
    categoryId: input.categoryId,
    amount: input.amounts[0],
    method,
    cardId: card?.id ?? null,
    startDate: input.date,
    count: input.kind === 'parcelada' ? input.amounts.length : null,
    generated: 0,
    createdAt: stamp,
    ...(card && input.invoiceMonth ? { invoiceMonth: input.invoiceMonth } : {}),
  };
  template.seriesId = series.id;

  if (input.kind === 'parcelada') {
    const expenses = input.amounts.map((a, k) => buildOccurrence(template, k, a, card, stamp));
    return { ...d, series: [...d.series, { ...series, generated: expenses.length }], expenses: [...d.expenses, ...expenses] };
  }
  return materialize({ ...d, series: [...d.series, series] }, addMonths(monthKey(today), FIXA_AHEAD));
}

/** Gera as ocorrências das contas fixas até o mês `target` (sempre gera ao menos a 1ª). */
export function materialize(d: AppData, target: string): AppData {
  const stamp = new Date().toISOString();
  const created: Expense[] = [];
  let changed = false;
  const series = d.series.map((s) => {
    if (s.kind !== 'fixa') return s;
    const card = s.cardId ? d.cards.find((c) => c.id === s.cardId) : undefined;
    if (s.cardId && !card) return s;
    const limit = s.count ?? Infinity;
    const start = firstMonth(s, card);
    const t: Template = { ...s, seriesId: s.id, installments: null };
    let g = s.generated;
    while (g < limit && (g === 0 || addMonths(start, g) <= target)) {
      created.push(buildOccurrence(t, g, s.amount, card, stamp));
      g++;
    }
    if (g === s.generated) return s;
    changed = true;
    return { ...s, generated: g };
  });
  return changed ? { ...d, series, expenses: [...d.expenses, ...created] } : d;
}

// ---------- Situação de pagamento ----------

/** Data do pagamento, ou null se está em aberto. No cartão, depende da fatura. */
export function paidDate(e: Expense, cards: CreditCard[]): string | null {
  if (e.cardId) {
    const card = cards.find((c) => c.id === e.cardId);
    return card && e.invoiceMonth ? (card.paidInvoices[e.invoiceMonth] ?? null) : null;
  }
  return e.paidAt;
}

export function payExpense(d: AppData, id: string, paidAt: string, amount: number): AppData {
  const e = d.expenses.find((x) => x.id === id);
  if (!e || e.cardId) return d;
  const stamp = new Date().toISOString();
  const old = e.amount;
  // Conta fixa de valor variável: o valor pago vira a previsão dos próximos meses ainda não pagos.
  const propagate = e.kind === 'fixa' && e.seriesId !== null && amount !== old;
  const expenses = d.expenses.map((x) => {
    if (x.id === id) return { ...x, paidAt, amount, updatedAt: stamp };
    if (propagate && x.seriesId === e.seriesId && (x.installment ?? 0) > (e.installment ?? 0) && !x.paidAt && x.amount === old) {
      return { ...x, amount, updatedAt: stamp };
    }
    return x;
  });
  const series = propagate ? d.series.map((s) => (s.id === e.seriesId ? { ...s, amount } : s)) : d.series;
  return { ...d, expenses, series };
}

export function unpayExpense(d: AppData, id: string): AppData {
  const stamp = new Date().toISOString();
  return { ...d, expenses: d.expenses.map((x) => (x.id === id ? { ...x, paidAt: null, updatedAt: stamp } : x)) };
}

export function payInvoice(d: AppData, cardId: string, month: string, date: string): AppData {
  return { ...d, cards: d.cards.map((c) => (c.id === cardId ? { ...c, paidInvoices: { ...c.paidInvoices, [month]: date } } : c)) };
}

export function unpayInvoice(d: AppData, cardId: string, month: string): AppData {
  return {
    ...d,
    cards: d.cards.map((c) => {
      if (c.id !== cardId) return c;
      const paidInvoices = { ...c.paidInvoices };
      delete paidInvoices[month];
      return { ...c, paidInvoices };
    }),
  };
}

// ---------- Editar e excluir (somente esta / esta e as próximas / todas) ----------

export type Scope = 'one' | 'next' | 'all';

export interface ExpensePatch {
  description: string;
  categoryId: string;
  amount: number;
  /** Vencimento, ou data da compra no cartão. */
  date: string;
  method: PaymentMethod;
  cardId: string | null;
  voucherId?: string | null;
  /** No cartão: trocar a fatura (AAAA-MM). Em série, as próximas parcelas andam junto. */
  invoiceMonth?: string | null;
}

function scopeTargets(d: AppData, e: Expense, scope: Scope): Expense[] {
  if (!e.seriesId || scope === 'one') return [e];
  return d.expenses.filter((x) => x.seriesId === e.seriesId && (scope === 'all' || (x.installment ?? 0) >= (e.installment ?? 0)));
}

export function editExpense(d: AppData, id: string, patch: ExpensePatch, scope: Scope): AppData {
  const e = d.expenses.find((x) => x.id === id);
  if (!e) return d;
  const stamp = new Date().toISOString();
  const common = { description: patch.description, categoryId: patch.categoryId, updatedAt: stamp };

  if (!e.seriesId || scope === 'one') {
    let next: Expense = { ...e, ...common, amount: patch.amount };
    if (e.kind === 'avulsa') {
      // Despesa avulsa pode trocar forma de pagamento, cartão e data livremente.
      const card = patch.method === 'cartao' ? d.cards.find((c) => c.id === patch.cardId) : undefined;
      if (card) {
        const invoiceMonth = patch.invoiceMonth ?? invoiceMonthFor(card, patch.date);
        next = { ...next, method: 'cartao', cardId: card.id, purchaseDate: patch.date, invoiceMonth, dueDate: invoiceDueDate(card, invoiceMonth), paidAt: null };
      } else {
        const method = patch.method === 'cartao' ? 'pix' : patch.method;
        const voucherId = method === 'vale' ? (patch.voucherId ?? null) : null;
        next = { ...next, method, cardId: null, purchaseDate: null, invoiceMonth: null, dueDate: patch.date, voucherId, paidAt: voucherId ? (next.paidAt ?? patch.date) : next.paidAt };
      }
    } else if (!e.cardId) {
      next.dueDate = patch.date;
    } else if (patch.invoiceMonth && patch.invoiceMonth !== e.invoiceMonth) {
      const card = d.cards.find((c) => c.id === e.cardId);
      if (card) next = { ...next, invoiceMonth: patch.invoiceMonth, dueDate: invoiceDueDate(card, patch.invoiceMonth) };
    }
    return { ...d, expenses: d.expenses.map((x) => (x.id === id ? next : x)) };
  }

  // Cartão em série: trocar a fatura desta empurra as do escopo pelo mesmo número de meses.
  const shift = e.cardId && e.invoiceMonth && patch.invoiceMonth && patch.invoiceMonth !== e.invoiceMonth ? monthsBetween(e.invoiceMonth, patch.invoiceMonth) : 0;
  const seriesCard = shift ? d.cards.find((c) => c.id === e.cardId) : undefined;

  // Em série: descrição e categoria mudam em todas do escopo; valor e dia só nas que ainda não foram pagas.
  const ids = new Set(scopeTargets(d, e, scope).map((x) => x.id));
  const newDay = dayOf(patch.date);
  const expenses = d.expenses.map((x) => {
    if (!ids.has(x.id)) return x;
    if (paidDate(x, d.cards) !== null) return { ...x, ...common };
    if (seriesCard && x.invoiceMonth) {
      const invoiceMonth = addMonths(x.invoiceMonth, shift);
      return { ...x, ...common, amount: patch.amount, invoiceMonth, dueDate: invoiceDueDate(seriesCard, invoiceMonth) };
    }
    const dueDate = x.cardId ? x.dueDate : clampDay(monthKey(x.dueDate), newDay);
    return { ...x, ...common, amount: patch.amount, dueDate };
  });
  const series = d.series.map((s) => {
    if (s.id !== e.seriesId) return s;
    const base = { ...s, description: patch.description, categoryId: patch.categoryId, amount: patch.amount, startDate: s.cardId ? s.startDate : clampDay(monthKey(s.startDate), newDay) };
    // Conta fixa no cartão: as próximas ocorrências geradas seguem a nova fatura.
    if (seriesCard) return { ...base, invoiceMonth: addMonths(firstMonth(s, seriesCard), shift) };
    return base;
  });
  return { ...d, expenses, series };
}

export function deleteExpense(d: AppData, id: string, scope: Scope): AppData {
  const e = d.expenses.find((x) => x.id === id);
  if (!e) return d;
  const stamp = new Date().toISOString();
  const ids = new Set(scopeTargets(d, e, scope).map((x) => x.id));
  const expenses = d.expenses.filter((x) => !ids.has(x.id));
  const deleted = { ...d.deleted };
  for (const x of ids) deleted[x] = stamp;

  let series = d.series;
  if (e.seriesId && scope !== 'one') {
    series = series.map((s) => {
      if (s.id !== e.seriesId) return s;
      if (scope === 'all') return { ...s, count: 0 };
      // "Esta e as próximas" numa conta fixa encerra a conta antes desta ocorrência.
      return s.kind === 'fixa' ? { ...s, count: (e.installment ?? 1) - 1 } : s;
    });
  }
  // Remove séries encerradas que ficaram sem nenhuma ocorrência.
  series = series.filter((s) => {
    const finished = s.kind === 'parcelada' || s.count !== null;
    const keep = !finished || expenses.some((x) => x.seriesId === s.id);
    if (!keep) deleted[s.id] = stamp;
    return keep;
  });
  return { ...d, expenses, series, deleted };
}

/** Meses de diferença entre duas faturas (AAAA-MM). */
function monthsBetween(a: string, b: string): number {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

// ---------- Faturas ----------

export type InvoiceStatus = 'aberta' | 'fechada' | 'paga';

export interface Invoice {
  card: CreditCard;
  month: string;
  dueDate: string;
  closingDate: string;
  items: Expense[];
  total: number;
  paidAt: string | null;
  status: InvoiceStatus;
}

export function getInvoice(d: AppData, card: CreditCard, month: string, today: string = todayISO()): Invoice {
  const items = d.expenses
    .filter((e) => e.cardId === card.id && e.invoiceMonth === month)
    .sort((a, b) => (b.purchaseDate ?? '').localeCompare(a.purchaseDate ?? ''));
  const closingDate = invoiceClosingDate(card, month);
  const paidAt = card.paidInvoices[month] ?? null;
  return {
    card,
    month,
    dueDate: invoiceDueDate(card, month),
    closingDate,
    items,
    total: sum(items.map((i) => i.amount)),
    paidAt,
    status: paidAt ? 'paga' : today >= closingDate ? 'fechada' : 'aberta',
  };
}

/** Meses de fatura que têm compras, em ordem. */
export function invoiceMonths(d: AppData, cardId: string): string[] {
  return [...new Set(d.expenses.filter((e) => e.cardId === cardId && e.invoiceMonth).map((e) => e.invoiceMonth as string))].sort();
}

/**
 * Total comprometido do limite: compras em faturas ainda não pagas, incluindo parcelas futuras.
 * Mensalidades (conta fixa) só contam depois de cobradas — as futuras ainda não ocupam o limite.
 */
export function cardUsed(d: AppData, card: CreditCard, today: string = todayISO()): number {
  return sum(
    d.expenses
      .filter((e) => e.cardId === card.id && e.invoiceMonth && !card.paidInvoices[e.invoiceMonth])
      .filter((e) => e.kind !== 'fixa' || (e.purchaseDate ?? '') <= today)
      .map((e) => e.amount),
  );
}

// ---------- Visão mensal ----------

export interface Bill {
  key: string;
  type: 'despesa' | 'fatura';
  title: string;
  dueDate: string;
  amount: number;
  paidAt: string | null;
  expense?: Expense;
  invoice?: Invoice;
}

function expenseBill(e: Expense): Bill {
  return { key: e.id, type: 'despesa', title: e.description, dueDate: e.dueDate, amount: e.amount, paidAt: e.paidAt, expense: e };
}

function invoiceBill(inv: Invoice): Bill {
  return {
    key: `fatura:${inv.card.id}:${inv.month}`,
    type: 'fatura',
    title: `Fatura ${inv.card.name}`,
    dueDate: inv.dueDate,
    amount: inv.total,
    paidAt: inv.paidAt,
    invoice: inv,
  };
}

const byDue = (a: Bill, b: Bill) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title);

/** Contas do mês: despesas fora do cartão + uma linha por fatura de cartão. */
export function monthBills(d: AppData, month: string, today: string = todayISO()): Bill[] {
  const bills = d.expenses.filter((e) => !e.cardId && monthKey(e.dueDate) === month).map(expenseBill);
  for (const card of d.cards) {
    const inv = getInvoice(d, card, month, today);
    if (inv.items.length) bills.push(invoiceBill(inv));
  }
  return bills.sort(byDue);
}

export function summarize(bills: Bill[]) {
  const total = sum(bills.map((b) => b.amount));
  const paid = sum(bills.filter((b) => b.paidAt).map((b) => b.amount));
  const open = sum([total, -paid]);
  return { total, paid, open, pct: total > 0 ? (paid / total) * 100 : 0 };
}

export type BillStatus = 'pago' | 'vencida' | 'hoje' | 'pendente';

export function billStatus(b: Pick<Bill, 'paidAt' | 'dueDate'>, today: string = todayISO()): BillStatus {
  if (b.paidAt) return 'pago';
  if (b.dueDate < today) return 'vencida';
  if (b.dueDate === today) return 'hoje';
  return 'pendente';
}

/** Contas em aberto que vencem até `until` (inclui as já vencidas). */
export function openBills(d: AppData, until: string, today: string = todayISO()): Bill[] {
  const bills = d.expenses.filter((e) => !e.cardId && !e.paidAt && e.dueDate <= until).map(expenseBill);
  for (const card of d.cards) {
    for (const month of invoiceMonths(d, card.id)) {
      const inv = getInvoice(d, card, month, today);
      if (!inv.paidAt && inv.dueDate <= until) bills.push(invoiceBill(inv));
    }
  }
  return bills.sort(byDue);
}

/** Gastos do mês por categoria (despesas que vencem no mês + compras das faturas do mês). */
export function categoryTotals(d: AppData, month: string): { categoryId: string; amount: number }[] {
  const m = new Map<string, number>();
  for (const e of d.expenses) {
    const inMonth = e.cardId ? e.invoiceMonth === month : monthKey(e.dueDate) === month;
    if (inMonth) m.set(e.categoryId, (m.get(e.categoryId) ?? 0) + e.amount);
  }
  return [...m.entries()].map(([categoryId, amount]) => ({ categoryId, amount: Math.round(amount * 100) / 100 })).sort((a, b) => b.amount - a.amount);
}
