import type { AppData, Category, DayPeriod, Expense, Habit, HabitKind, Income, PracticeSession } from './types.ts';
import { toISO, uid } from './utils.ts';
import { suggestAttributes } from './habits.ts';
import { emptyProfile, normalizeProfile } from './profile.ts';
import { normalizeBox } from './boxes.ts';
import { normalizeMoods } from './mood.ts';
import { normalizeVoucher } from './vouchers.ts';
import { normalizeAccent } from './theme.ts';
import { DEFAULT_FAVORITES, normalizeFavorites } from './moduleBar.ts';
import { normalizeLayouts } from './cardLayout.ts';
import { DEFAULT_LIST_CATEGORIES, normalizeListData } from './lists.ts';
import { emptyStudy, normalizeStudy } from './estudos.ts';
import { emptyCareer, normalizeCareer } from './carreira.ts';

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

export const DEFAULT_INCOME_SOURCES: Omit<Category, 'id'>[] = [
  { name: 'Salário', icon: 'briefcase', color: '#22c55e' },
  { name: 'Freelance', icon: 'bolt', color: '#3b82f6' },
  { name: 'Bônus', icon: 'gift', color: '#eab308' },
  { name: 'Vale-alimentação', icon: 'utensils', color: '#f97316' },
  { name: 'Investimentos', icon: 'coins', color: '#8b5cf6' },
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
    vouchers: [],
    categories: [],
    incomes: [],
    incomeSeries: [],
    incomeSources: [],
    settings: { theme: 'dark', accent: null, favorites: [...DEFAULT_FAVORITES], cards: {}, barLayout: 'fixo', tapToFavorites: true, hideOnScroll: true, seededCategories: false, seededIncomeSources: false, lastBackupAt: null, activeDays: [], visitDays: [], journeyUnlockedAt: null, journeyChoice: null },
    profile: emptyProfile('novo'),
    boxes: [],
    moods: {},
    budgets: {},
    listCategories: DEFAULT_LIST_CATEGORIES.map((c) => ({ ...c })),
    lists: [],
    products: [],
    variants: [],
    stores: [],
    prices: [],
    purchases: [],
    sessions: [],
    study: emptyStudy(),
    career: emptyCareer(),
    lastLoads: {},
    deleted: {},
    legacy: {},
  };
}

/** Cria as categorias e fontes de receita padrão uma única vez (se o usuário apagar, não voltam). */
export function seedCategories(d: AppData): AppData {
  let next = d;
  if (!next.settings.seededCategories) {
    const existing = new Set(next.categories.map((c) => c.name.toLowerCase()));
    const added = DEFAULT_CATEGORIES.filter((c) => !existing.has(c.name.toLowerCase())).map((c) => ({ ...c, id: uid() }));
    next = { ...next, categories: [...next.categories, ...added], settings: { ...next.settings, seededCategories: true } };
  }
  if (!next.settings.seededIncomeSources) {
    const existing = new Set(next.incomeSources.map((c) => c.name.toLowerCase()));
    const added = DEFAULT_INCOME_SOURCES.filter((c) => !existing.has(c.name.toLowerCase())).map((c) => ({ ...c, id: uid() }));
    next = { ...next, incomeSources: [...next.incomeSources, ...added], settings: { ...next.settings, seededIncomeSources: true } };
  }
  return next;
}

type Rec = Record<string, unknown>;
const strings = (x: unknown): string[] => (Array.isArray(x) ? x.filter((i): i is string => typeof i === 'string') : []);
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
    habits: list<Record<string, unknown>>(r.habits).map(normalizeHabit),
    notes: list(r.notes),
    journal: list(r.journal),
    expenses: list(r.expenses),
    series: list(r.series),
    cards: list(r.cards),
    vouchers: list<Record<string, unknown>>(r.vouchers).map(normalizeVoucher),
    categories: list(r.categories),
    incomes: list(r.incomes),
    incomeSeries: list(r.incomeSeries),
    incomeSources: list(r.incomeSources),
    settings: {
      // Só a versão 2 tem tema escolhido pelo usuário; o protótipo começa no escuro.
      theme: r.version === 2 && (settings.theme === 'light' || settings.theme === 'system') ? settings.theme : 'dark',
      accent: normalizeAccent(settings.accent),
      favorites: normalizeFavorites(settings.favorites),
      cards: normalizeLayouts(settings.cards),
      barLayout: settings.barLayout === 'lado' || settings.barLayout === 'centro' ? settings.barLayout : 'fixo',
      tapToFavorites: settings.tapToFavorites !== false,
      hideOnScroll: settings.hideOnScroll !== false,
      seededCategories: settings.seededCategories === true,
      seededIncomeSources: settings.seededIncomeSources === true,
      lastBackupAt: typeof settings.lastBackupAt === 'string' ? settings.lastBackupAt : null,
      activeDays: strings(settings.activeDays),
      visitDays: strings(settings.visitDays),
      journeyUnlockedAt: typeof settings.journeyUnlockedAt === 'string' ? settings.journeyUnlockedAt : null,
      journeyChoice: settings.journeyChoice === 'quero' || settings.journeyChoice === 'depois' ? settings.journeyChoice : null,
    },
    // Quem já tinha dados (atualização ou backup) não vê a entrevista de surpresa.
    profile: normalizeProfile(r.profile, Object.keys(r).length > 0),
    boxes: list<Record<string, unknown>>(r.boxes).map(normalizeBox),
    moods: normalizeMoods(r.moods),
    budgets: isRec(r.budgets) ? Object.fromEntries(Object.entries(r.budgets).filter((e): e is [string, number] => typeof e[1] === 'number' && e[1] > 0)) : {},
    ...normalizeListData(r),
    sessions: list<PracticeSession>(r.sessions).filter((x) => typeof x.date === 'string' && typeof x.type === 'string' && typeof x.minutes === 'number'),
    purchases: list<Record<string, unknown>>(r.purchases)
      .filter((p) => typeof p.id === 'string' && typeof p.date === 'string' && typeof p.total === 'number')
      .map((p) => ({ id: p.id as string, date: p.date as string, listId: String(p.listId ?? ''), listName: String(p.listName ?? ''), store: String(p.store ?? ''), total: p.total as number, items: typeof p.items === 'number' ? p.items : 0 })),
    study: normalizeStudy(r.study),
    career: normalizeCareer(r.career),
    lastLoads: isRec(r.lastLoads) ? Object.fromEntries(Object.entries(r.lastLoads).filter((e): e is [string, number] => typeof e[1] === 'number')) : {},
    deleted: isRec(r.deleted) ? (r.deleted as Record<string, string>) : {},
    legacy: isRec(r.legacy) ? r.legacy : {},
  };
  d = seedCategories(d);
  if (r.version !== 2 && Array.isArray(r.transactions)) d = migrateV1Transactions(d, r.transactions);
  return migrateLegacyIncomes(d);
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

const KINDS: HabitKind[] = ['ritual', 'construir', 'abandonar'];
const PERIODS: DayPeriod[] = ['manha', 'tarde', 'noite', 'livre'];

/** Completa hábitos antigos (só nome, cor e dias marcados) com os campos novos. */
export function normalizeHabit(h: Record<string, unknown>): Habit {
  const createdAt = typeof h.createdAt === 'string' ? h.createdAt : new Date().toISOString();
  const days = Array.isArray(h.days) ? h.days.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6) : [];
  return {
    id: h.id as string,
    name: typeof h.name === 'string' ? h.name : 'Sem nome',
    color: typeof h.color === 'string' ? h.color : '#22c55e',
    kind: KINDS.includes(h.kind as HabitKind) ? (h.kind as HabitKind) : 'construir',
    checks: strings(h.checks),
    days: Array.isArray(h.days) ? days : [0, 1, 2, 3, 4, 5, 6],
    period: PERIODS.includes(h.period as DayPeriod) ? (h.period as DayPeriod) : 'livre',
    time: typeof h.time === 'string' ? h.time : '',
    cue: typeof h.cue === 'string' ? h.cue : '',
    target: typeof h.target === 'number' && h.target > 0 ? h.target : 66,
    slips: strings(h.slips),
    startDate: typeof h.startDate === 'string' ? h.startDate : toISO(new Date(createdAt)),
    goal: typeof h.goal === 'number' && h.goal > 0 ? h.goal : null,
    unit: typeof h.unit === 'string' ? h.unit : '',
    step: typeof h.step === 'number' && h.step > 0 ? h.step : 1,
    amounts: isRec(h.amounts) ? Object.fromEntries(Object.entries(h.amounts).filter((e): e is [string, number] => typeof e[1] === 'number')) : {},
    // Hábitos de antes desta versão ganham os atributos sugeridos pelo nome.
    attrs: Array.isArray(h.attrs) ? strings(h.attrs) : suggestAttributes(typeof h.name === 'string' ? h.name : ''),
    link: typeof h.link === 'string' ? h.link : '',
    createdAt,
  };
}

/** Receitas do protótipo (guardadas em `legacy.receitas`) viram receitas recebidas na data. */
export function migrateLegacyIncomes(d: AppData): AppData {
  const old = d.legacy.receitas;
  if (!Array.isArray(old) || old.length === 0) return d;
  const sources = [...d.incomeSources];
  const incomes: Income[] = [];
  for (const t of old) {
    if (!isRec(t) || typeof t.amount !== 'number' || typeof t.date !== 'string') continue;
    const name = typeof t.category === 'string' && t.category.trim() ? t.category.trim() : 'Outros';
    let src = sources.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!src) {
      src = { id: uid(), name, icon: 'tag', color: '#94a3b8' };
      sources.push(src);
    }
    const stamp = new Date().toISOString();
    incomes.push({
      id: typeof t.id === 'string' ? t.id : uid(),
      seriesId: null,
      installment: null,
      description: typeof t.description === 'string' && t.description ? t.description : name,
      sourceId: src.id,
      amount: t.amount,
      date: t.date,
      receivedAt: t.date,
      createdAt: stamp,
      updatedAt: stamp,
    });
  }
  const legacy = { ...d.legacy };
  delete legacy.receitas;
  return { ...d, incomeSources: sources, incomes: [...d.incomes, ...incomes], legacy };
}
