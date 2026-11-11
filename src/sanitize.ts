/**
 * Conferência dos registros ao abrir os dados (C3).
 * Cada registro é consertado quando dá (campos que faltam ganham um valor padrão)
 * ou separado quando falta o essencial (ex.: despesa sem valor ou sem data).
 * Os separados não somem: ficam guardados em `legacy.descartados` e vão junto no backup.
 */
import type { CalendarEvent, Category, CreditCard, Expense, ExpenseSeries, Income, IncomeSeries, JournalEntry, Note, Task } from './types.ts';

type Rec = Record<string, unknown>;

const DATE = /^\d{4}-\d{2}-\d{2}/;
const MONTH = /^\d{4}-\d{2}$/;
const str = (x: unknown, fallback = ''): string => (typeof x === 'string' ? x : fallback);
const strOrNull = (x: unknown): string | null => (typeof x === 'string' && x !== '' ? x : null);
const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const intOrNull = (x: unknown): number | null => (typeof x === 'number' && Number.isInteger(x) && x > 0 ? x : null);
const isDate = (x: unknown): x is string => typeof x === 'string' && DATE.test(x) && !Number.isNaN(Date.parse(x.slice(0, 10)));
const day = (x: unknown, fallback: number): number => (typeof x === 'number' && Number.isInteger(x) && x >= 1 && x <= 31 ? x : fallback);
const oneOf = <T extends string>(x: unknown, options: readonly T[], fallback: T): T => (options.includes(x as T) ? (x as T) : fallback);
const stamp = (x: unknown, now: string): string => (typeof x === 'string' && x !== '' ? x : now);
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);

const METHODS = ['pix', 'debito', 'dinheiro', 'boleto', 'cartao', 'vale'] as const;

export function fixExpense(r: Rec, now: string): Expense | null {
  const amount = num(r.amount);
  if (amount === null || !isDate(r.dueDate)) return null;
  let method = oneOf(r.method, METHODS, 'pix');
  const cardId = strOrNull(r.cardId);
  const voucherId = strOrNull(r.voucherId);
  if (method === 'cartao' && !cardId) method = 'pix';
  if (method === 'vale' && !voucherId) method = 'pix';
  const onCard = method === 'cartao';
  return {
    ...(r as object),
    id: r.id as string,
    kind: oneOf(r.kind, ['avulsa', 'fixa', 'parcelada'] as const, 'avulsa'),
    seriesId: strOrNull(r.seriesId),
    installment: intOrNull(r.installment),
    installments: intOrNull(r.installments),
    description: str(r.description, 'Sem descrição'),
    categoryId: str(r.categoryId),
    amount,
    method,
    cardId: onCard ? cardId : null,
    dueDate: r.dueDate,
    purchaseDate: onCard ? (isDate(r.purchaseDate) ? r.purchaseDate : r.dueDate) : null,
    invoiceMonth: onCard ? (typeof r.invoiceMonth === 'string' && MONTH.test(r.invoiceMonth) ? r.invoiceMonth : r.dueDate.slice(0, 7)) : null,
    paidAt: strOrNull(r.paidAt),
    createdAt: stamp(r.createdAt, now),
    updatedAt: stamp(r.updatedAt, now),
    voucherId: method === 'vale' ? voucherId : null,
  } as Expense;
}

export function fixExpenseSeries(r: Rec, now: string): ExpenseSeries | null {
  const amount = num(r.amount);
  if (amount === null || !isDate(r.startDate)) return null;
  let method = oneOf(r.method, METHODS, 'pix');
  const cardId = strOrNull(r.cardId);
  if (method === 'cartao' && !cardId) method = 'pix';
  return {
    ...(r as object),
    id: r.id as string,
    kind: oneOf(r.kind, ['fixa', 'parcelada'] as const, 'fixa'),
    description: str(r.description, 'Sem descrição'),
    categoryId: str(r.categoryId),
    amount,
    method,
    cardId: method === 'cartao' ? cardId : null,
    startDate: r.startDate,
    count: intOrNull(r.count),
    generated: typeof r.generated === 'number' && r.generated >= 0 ? Math.floor(r.generated) : 0,
    createdAt: stamp(r.createdAt, now),
  } as ExpenseSeries;
}

export function fixCard(r: Rec, now: string): CreditCard {
  const limit = num(r.limit);
  return {
    ...(r as object),
    id: r.id as string,
    name: str(r.name) || 'Cartão',
    closingDay: day(r.closingDay, 1),
    dueDay: day(r.dueDay, 10),
    limit: limit !== null && limit > 0 ? limit : null,
    color: str(r.color) || '#94a3b8',
    paidInvoices: isRec(r.paidInvoices) ? (Object.fromEntries(Object.entries(r.paidInvoices).filter((e) => typeof e[1] === 'string')) as Record<string, string>) : {},
    createdAt: stamp(r.createdAt, now),
  } as CreditCard;
}

export function fixIncome(r: Rec, now: string): Income | null {
  const amount = num(r.amount);
  if (amount === null || !isDate(r.date)) return null;
  return {
    ...(r as object),
    id: r.id as string,
    seriesId: strOrNull(r.seriesId),
    installment: intOrNull(r.installment),
    description: str(r.description, 'Sem descrição'),
    sourceId: str(r.sourceId),
    amount,
    date: r.date,
    receivedAt: strOrNull(r.receivedAt),
    createdAt: stamp(r.createdAt, now),
    updatedAt: stamp(r.updatedAt, now),
    voucherId: strOrNull(r.voucherId),
  } as Income;
}

export function fixIncomeSeries(r: Rec, now: string): IncomeSeries | null {
  const amount = num(r.amount);
  if (amount === null || !isDate(r.startDate)) return null;
  return {
    ...(r as object),
    id: r.id as string,
    description: str(r.description, 'Sem descrição'),
    sourceId: str(r.sourceId),
    amount,
    startDate: r.startDate,
    count: intOrNull(r.count),
    generated: typeof r.generated === 'number' && r.generated >= 0 ? Math.floor(r.generated) : 0,
    createdAt: stamp(r.createdAt, now),
  } as IncomeSeries;
}

export function fixNote(r: Rec, now: string): Note {
  return { ...(r as object), id: r.id as string, title: str(r.title), content: str(r.content), pinned: r.pinned === true, updatedAt: stamp(r.updatedAt, now) } as Note;
}

export function fixJournal(r: Rec, now: string): JournalEntry {
  const createdAt = isDate(r.createdAt) ? r.createdAt : isDate(r.updatedAt) ? r.updatedAt : now;
  return {
    ...(r as object),
    id: r.id as string,
    createdAt,
    title: str(r.title),
    summary: str(r.summary),
    content: str(r.content),
    tag: str(r.tag),
    updatedAt: stamp(r.updatedAt, createdAt),
  } as JournalEntry;
}

export function fixTask(r: Rec, now: string): Task {
  return {
    ...(r as object),
    id: r.id as string,
    title: str(r.title) || 'Sem título',
    notes: str(r.notes),
    due: isDate(r.due) ? r.due : null,
    priority: oneOf(r.priority, ['baixa', 'media', 'alta'] as const, 'media'),
    tag: str(r.tag),
    done: r.done === true,
    createdAt: stamp(r.createdAt, now),
    doneAt: strOrNull(r.doneAt),
  } as Task;
}

export function fixEvent(r: Rec): CalendarEvent | null {
  if (!isDate(r.date)) return null;
  return {
    ...(r as object),
    id: r.id as string,
    title: str(r.title) || 'Sem título',
    date: r.date,
    time: typeof r.time === 'string' && /^\d{2}:\d{2}$/.test(r.time) ? r.time : '',
    location: str(r.location),
    description: str(r.description),
  } as CalendarEvent;
}

export function fixCategory(r: Rec): Category {
  return { ...(r as object), id: r.id as string, name: str(r.name) || 'Sem nome', icon: str(r.icon) || 'tag', color: str(r.color) || '#94a3b8' } as Category;
}

/** Confere uma lista: devolve os registros bons (consertados) e os separados. */
export function sanitizeList<T>(items: unknown[], fix: (r: Rec, now: string) => T | null, now: string): { ok: T[]; bad: unknown[] } {
  const ok: T[] = [];
  const bad: unknown[] = [];
  for (const item of items) {
    const fixed = isRec(item) ? fix(item, now) : null;
    if (fixed) ok.push(fixed);
    else bad.push(item);
  }
  return { ok, bad };
}
