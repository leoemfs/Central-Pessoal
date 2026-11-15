/**
 * Saúde › Dieta (N1.2): regras puras.
 * - O app não monta dieta nem dá conselho: a pessoa escreve o plano (o dela ou o da nutricionista).
 * - Um ou mais planos; um fica em uso. "Dias diferentes" é opcional (variações por dia da semana).
 * - No dia a dia: cada refeição é marcada como segui · em parte · fugi. "Fugi" é só registro, sem cor de erro.
 */
import type { AppData, DietData, DietLog, DietMark, DietMeal, DietPlan, DietSource, DietVariant } from './types.ts';
import { addDays } from './utils.ts';

export const MARKS: { id: DietMark; label: string }[] = [
  { id: 'segui', label: 'Segui' },
  { id: 'parte', label: 'Em parte' },
  { id: 'fugi', label: 'Fugi' },
];

/** Refeições sugeridas ao criar um plano (dá para apagar e renomear). */
export const DEFAULT_MEALS: { name: string; time: string }[] = [
  { name: 'Café da manhã', time: '07:30' },
  { name: 'Lanche da manhã', time: '10:00' },
  { name: 'Almoço', time: '12:30' },
  { name: 'Lanche da tarde', time: '16:00' },
  { name: 'Jantar', time: '19:30' },
  { name: 'Ceia', time: '22:00' },
];

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function emptyDiet(): DietData {
  return { plans: [], activeId: null, log: {}, dayVariant: {}, extras: {} };
}

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown) => (typeof x === 'string' ? x : '');
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const isMark = (x: unknown): x is DietMark => MARKS.some((m) => m.id === x);

function normMeal(raw: Rec): DietMeal {
  return {
    id: str(raw.id),
    name: str(raw.name) || 'Refeição',
    time: HHMM.test(str(raw.time)) ? str(raw.time) : '',
    food: str(raw.food),
    alts: Array.isArray(raw.alts) ? raw.alts.filter((a): a is string => typeof a === 'string' && a.trim() !== '') : [],
  };
}

function normVariant(raw: Rec): DietVariant {
  const days = Array.isArray(raw.days) ? [...new Set(raw.days.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 6))].sort() : [];
  return {
    id: str(raw.id),
    name: str(raw.name) || 'Todos os dias',
    days: days.length ? days : [...ALL_DAYS],
    meals: Array.isArray(raw.meals) ? raw.meals.filter((m): m is Rec => isRec(m) && typeof m.id === 'string' && m.id !== '').map(normMeal) : [],
  };
}

function normPlan(raw: Rec): DietPlan {
  const variants = Array.isArray(raw.variants) ? raw.variants.filter((v): v is Rec => isRec(v) && typeof v.id === 'string' && v.id !== '').map(normVariant) : [];
  return {
    id: str(raw.id),
    name: str(raw.name) || 'Minha dieta',
    source: raw.source === 'nutri' ? 'nutri' : 'eu',
    nutri: str(raw.nutri),
    consultDate: DAY.test(str(raw.consultDate)) ? str(raw.consultDate) : null,
    notes: str(raw.notes),
    split: raw.split === true && variants.length > 1,
    variants: variants.length ? variants : [{ id: `${str(raw.id)}-v`, name: 'Todos os dias', days: [...ALL_DAYS], meals: [] }],
    createdAt: str(raw.createdAt),
  };
}

export function normalizeDiet(raw: unknown): DietData {
  if (!isRec(raw)) return emptyDiet();
  const plans = Array.isArray(raw.plans) ? raw.plans.filter((p): p is Rec => isRec(p) && typeof p.id === 'string' && p.id !== '').map(normPlan) : [];
  const log: DietData['log'] = {};
  if (isRec(raw.log))
    for (const [day, meals] of Object.entries(raw.log)) {
      if (!DAY.test(day) || !isRec(meals)) continue;
      const m: Record<string, DietLog> = {};
      for (const [id, v] of Object.entries(meals)) if (isRec(v) && isMark(v.mark)) m[id] = { mark: v.mark, option: Number.isInteger(v.option) && (v.option as number) >= 0 ? (v.option as number) : 0 };
      if (Object.keys(m).length) log[day] = m;
    }
  const strRec = (x: unknown) => (isRec(x) ? Object.fromEntries(Object.entries(x).filter((e): e is [string, string] => DAY.test(e[0]) && typeof e[1] === 'string' && e[1] !== '')) : {});
  const activeId = typeof raw.activeId === 'string' && plans.some((p) => p.id === raw.activeId) ? raw.activeId : null;
  return { plans, activeId, log, dayVariant: strRec(raw.dayVariant), extras: strRec(raw.extras) };
}

// ---------- Criar e editar ----------

export function newMeal(id: string, name = 'Refeição', time = ''): DietMeal {
  return { id, name, time, food: '', alts: [] };
}

/** Plano novo com as refeições comuns (vazias). `ids` gera ids únicos. */
export function newPlan(ids: () => string, source: DietSource, createdAt: string): DietPlan {
  const id = ids();
  return {
    id,
    name: source === 'nutri' ? 'Dieta da nutricionista' : 'Minha dieta',
    source,
    nutri: '',
    consultDate: null,
    notes: '',
    split: false,
    variants: [{ id: ids(), name: 'Todos os dias', days: [...ALL_DAYS], meals: DEFAULT_MEALS.map((m) => newMeal(ids(), m.name, m.time)) }],
    createdAt,
  };
}

/**
 * Liga "dias diferentes": a variação atual vira "Dia de treino" (seg, qua, sex) e ganha uma cópia "Dia de descanso" (os outros dias).
 * Desligar fica só com a primeira variação, valendo todos os dias.
 */
export function setSplit(p: DietPlan, on: boolean, ids: () => string): DietPlan {
  if (on === p.split) return p;
  if (!on) return { ...p, split: false, variants: [{ ...p.variants[0], name: 'Todos os dias', days: [...ALL_DAYS] }] };
  const base = p.variants[0];
  const second = p.variants[1] ?? { id: ids(), name: 'Dia de descanso', days: [0, 2, 4, 6], meals: base.meals.map((m) => ({ ...m, id: ids() })) };
  return { ...p, split: true, variants: [{ ...base, name: base.name === 'Todos os dias' ? 'Dia de treino' : base.name, days: base.days.length === 7 ? [1, 3, 5] : base.days }, second, ...p.variants.slice(2)] };
}

/** Um dia da semana pertence a uma variação só: marcar num tira das outras. */
export function toggleVariantDay(p: DietPlan, variantId: string, dow: number): DietPlan {
  const v = p.variants.find((x) => x.id === variantId);
  if (!v) return p;
  const on = v.days.includes(dow);
  return {
    ...p,
    variants: p.variants.map((x) =>
      x.id === variantId ? { ...x, days: on ? x.days.filter((d) => d !== dow) : [...x.days, dow].sort() } : on ? x : { ...x, days: x.days.filter((d) => d !== dow) },
    ),
  };
}

export function savePlan(p: DietPlan) {
  return (d: AppData): AppData => {
    const diet = d.health.diet;
    const exists = diet.plans.some((x) => x.id === p.id);
    const plans = exists ? diet.plans.map((x) => (x.id === p.id ? p : x)) : [...diet.plans, p];
    return { ...d, health: { ...d.health, diet: { ...diet, plans, activeId: diet.activeId ?? p.id } } };
  };
}

export function choosePlan(id: string) {
  return (d: AppData): AppData => ({ ...d, health: { ...d.health, diet: { ...d.health.diet, activeId: d.health.diet.plans.some((p) => p.id === id) ? id : d.health.diet.activeId } } });
}

/** Apaga o plano; as marcações antigas ficam no histórico (contam pelo que foi marcado). */
export function removePlan(id: string) {
  return (d: AppData): AppData => {
    const plans = d.health.diet.plans.filter((p) => p.id !== id);
    const activeId = d.health.diet.activeId === id ? (plans[0]?.id ?? null) : d.health.diet.activeId;
    return { ...d, health: { ...d.health, diet: { ...d.health.diet, plans, activeId } } };
  };
}

// ---------- O dia ----------

export function activePlan(d: Pick<AppData, 'health'>): DietPlan | null {
  const diet = d.health.diet;
  return diet.plans.find((p) => p.id === diet.activeId) ?? null;
}

const dow = (day: string) => new Date(`${day}T12:00:00`).getDay();

/** Variação do dia: a escolhida à mão, senão a do dia da semana, senão a primeira. */
export function variantFor(p: DietPlan, day: string, picked?: string): DietVariant {
  if (picked) {
    const v = p.variants.find((x) => x.id === picked);
    if (v) return v;
  }
  if (!p.split) return p.variants[0];
  return p.variants.find((v) => v.days.includes(dow(day))) ?? p.variants[0];
}

/** Refeições do dia no plano em uso, em ordem de horário (sem horário vai para o fim, na ordem do plano). */
export function mealsOf(d: Pick<AppData, 'health'>, day: string): { plan: DietPlan; variant: DietVariant; meals: DietMeal[] } | null {
  const p = activePlan(d);
  if (!p) return null;
  const variant = variantFor(p, day, d.health.diet.dayVariant[day]);
  const meals = variant.meals.map((m, i) => ({ m, i })).sort((a, b) => (a.m.time || '99') .localeCompare(b.m.time || '99') || a.i - b.i).map((x) => x.m);
  return { plan: p, variant, meals };
}

/** Marca (ou desmarca, tocando de novo na mesma) uma refeição no dia. */
export function markMeal(day: string, mealId: string, mark: DietMark, option = 0) {
  return (d: AppData): AppData => {
    const diet = d.health.diet;
    const dayLog = { ...(diet.log[day] ?? {}) };
    const cur = dayLog[mealId];
    if (cur && cur.mark === mark && cur.option === option) delete dayLog[mealId];
    else dayLog[mealId] = { mark, option };
    const log = { ...diet.log };
    if (Object.keys(dayLog).length) log[day] = dayLog;
    else delete log[day];
    return { ...d, health: { ...d.health, diet: { ...diet, log } } };
  };
}

/** Escolhe a opção comida sem mudar a marcação (se ainda não marcou, conta como "segui"). */
export function pickOption(day: string, mealId: string, option: number) {
  return (d: AppData): AppData => {
    const cur = d.health.diet.log[day]?.[mealId];
    const diet = d.health.diet;
    const log = { ...diet.log, [day]: { ...(diet.log[day] ?? {}), [mealId]: { mark: cur?.mark ?? 'segui', option } } };
    return { ...d, health: { ...d.health, diet: { ...diet, log } } };
  };
}

export function setDayVariant(day: string, variantId: string) {
  return (d: AppData): AppData => ({ ...d, health: { ...d.health, diet: { ...d.health.diet, dayVariant: { ...d.health.diet.dayVariant, [day]: variantId } } } });
}

export function setExtra(day: string, text: string) {
  return (d: AppData): AppData => {
    const extras = { ...d.health.diet.extras };
    if (text.trim()) extras[day] = text;
    else delete extras[day];
    return { ...d, health: { ...d.health, diet: { ...d.health.diet, extras } } };
  };
}

// ---------- Resumos ----------

export interface DietCount {
  segui: number;
  parte: number;
  fugi: number;
  /** Refeições previstas no plano (nos dias com plano em uso). */
  planned: number;
}

/** Conta as marcações de um período (do dia `from` ao `to`, inclusive). */
export function dietCount(d: Pick<AppData, 'health'>, from: string, to: string): DietCount {
  const c: DietCount = { segui: 0, parte: 0, fugi: 0, planned: 0 };
  // Só conta refeições previstas a partir do dia em que o primeiro plano foi criado.
  const first = d.health.diet.plans.map((p) => p.createdAt.slice(0, 10)).filter(Boolean).sort()[0] ?? '';
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const today = mealsOf(d, day);
    const marks = d.health.diet.log[day] ?? {};
    for (const v of Object.values(marks)) c[v.mark]++;
    if (today && day >= first) c.planned += Math.max(today.meals.length, Object.keys(marks).length);
    else c.planned += Object.keys(marks).length;
  }
  return c;
}

/** Texto curto do dia: "2 de 5 seguidas". */
export function dayLine(d: Pick<AppData, 'health'>, day: string): string | null {
  const t = mealsOf(d, day);
  if (!t || !t.meals.length) return null;
  const marks = d.health.diet.log[day] ?? {};
  const segui = t.meals.filter((m) => marks[m.id]?.mark === 'segui').length;
  return `${segui} de ${t.meals.length} seguidas`;
}
