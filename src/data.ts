import type { AppData, Category, Expense } from './types.ts';
import { uid } from './utils.ts';

export const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', '#94a3b8', '#eab308', '#ec4899', '#06b6d4'];
/** As 6 cores do cartão, como na referência visual. */
export const CARD_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', '#94a3b8'];

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Contas de casa', icon: 'home', color: '#3b82f6' },
  { name: 'Alimentação', icon: 'utensils', color: '#f97316' },
  { name: 'Transporte', icon: 'car', color: '#06b6d4' },
  { name: 'Saúde', icon: 'heart', color: '#ef4444' },
  { name: 'Educação', icon: 'book', color: '#8b5cf6' },
  { name: 'Lazer', icon: 'smile', color: '#ec4899' },
  { name: 'Streaming', icon: 'play', color: '#eab308' },
  { name: 'Compras', icon: 'bag', color: '#22c55e' },
  { name: 'Outros', icon: 'tag', color: '#94a3b8' },
];

export function emptyData(): AppData {
  return {
    version: 2,
    tasks: [],
    events: [],
    habits: [],
    notes: [],
    journal: [],
    expenses: [],
    series: [],
    cards: [],
    categories: [],
    settings: { seededCategories: false, lastBackupAt: null },
    deleted: {},
    legacy: {},
  };
}

/** Cria as categorias padrão uma única vez (se o usuário apagar, não voltam). */
export function seedCategories(d: AppData): AppData {
  if (d.settings.seededCategories) return d;
  const existing = new Set(d.categories.map((c) => c.name.toLowerCase()));
  const added = DEFAULT_CATEGORIES.filter((c) => !existing.has(c.name.toLowerCase())).map((c) => ({ ...c, id: uid() }));
  return { ...d, categories: [...d.categories, ...added], settings: { ...d.settings, seededCategories: true } };
}

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
function list<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x.filter((i) => isRec(i) && typeof i.id === 'string') as T[]) : [];
}

/** Aceita dados da versão 1 (protótipo) ou 2, de armazenamento ou de backup. */
export function normalize(raw: unknown): AppData {
  const r = isRec(raw) ? raw : {};
  const base = emptyData();
  const settings = isRec(r.settings) ? r.settings : {};
  let d: AppData = {
    ...base,
    tasks: list(r.tasks),
    events: list(r.events),
    habits: list(r.habits),
    notes: list(r.notes),
    journal: list(r.journal),
    expenses: list(r.expenses),
    series: list(r.series),
    cards: list(r.cards),
    categories: list(r.categories),
    settings: {
      seededCategories: settings.seededCategories === true,
      lastBackupAt: typeof settings.lastBackupAt === 'string' ? settings.lastBackupAt : null,
    },
    deleted: isRec(r.deleted) ? (r.deleted as Record<string, string>) : {},
    legacy: isRec(r.legacy) ? r.legacy : {},
  };
  d = seedCategories(d);
  if (r.version !== 2 && Array.isArray(r.transactions)) d = migrateV1Transactions(d, r.transactions);
  return d;
}

/** Protótipo v1: despesas viram despesas avulsas já pagas; receitas ficam guardadas para quando houver tela. */
function migrateV1Transactions(d: AppData, txs: unknown[]): AppData {
  const categories = [...d.categories];
  const expenses: Expense[] = [];
  const receitas: unknown[] = [];
  for (const t of txs) {
    if (!isRec(t) || typeof t.amount !== 'number' || typeof t.date !== 'string') continue;
    if (t.type !== 'despesa') {
      receitas.push(t);
      continue;
    }
    const name = typeof t.category === 'string' && t.category.trim() ? t.category.trim() : 'Outros';
    let cat = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!cat) {
      cat = { id: uid(), name, icon: 'tag', color: '#94a3b8' };
      categories.push(cat);
    }
    const stamp = new Date().toISOString();
    expenses.push({
      id: typeof t.id === 'string' ? t.id : uid(),
      kind: 'avulsa',
      seriesId: null,
      installment: null,
      installments: null,
      description: typeof t.description === 'string' && t.description ? t.description : name,
      categoryId: cat.id,
      amount: t.amount,
      method: 'pix',
      cardId: null,
      dueDate: t.date,
      purchaseDate: null,
      invoiceMonth: null,
      paidAt: t.date,
      createdAt: stamp,
      updatedAt: stamp,
    });
  }
  return {
    ...d,
    categories,
    expenses: [...d.expenses, ...expenses],
    legacy: receitas.length ? { ...d.legacy, receitas } : d.legacy,
  };
}
