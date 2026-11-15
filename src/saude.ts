/**
 * Saúde (N1.1): regras puras de Água e Sono.
 * - Água: se há um hábito de água ligado, o número mora nele (o mesmo anel do Núcleo);
 *   sem hábito ligado, mora em `health.water.days`. Nunca nos dois lugares.
 * - Sono: uma noite por dia em que acordou (hora de dormir, de acordar e como acordou).
 * O app só registra: nada de diagnóstico.
 */
import type { AppData, Habit, HealthData, SleepEntry, SleepFeel } from './types.ts';
import { setAmount } from './habits.ts';
import { addDays } from './utils.ts';

export const WATER_GOAL = 2000;
export const WATER_STEP = 250;

export const FEELS: { id: SleepFeel; label: string }[] = [
  { id: 'bem', label: 'Acordei bem' },
  { id: 'medio', label: 'Mais ou menos' },
  { id: 'cansado', label: 'Cansado' },
];

export function emptyHealth(): HealthData {
  return { water: { goal: WATER_GOAL, step: WATER_STEP, days: {}, habitId: null, asked: false }, sleep: {} };
}

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const posNum = (x: unknown, fallback: number) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : fallback);

/** Dados antigos e backups: tudo com valor padrão. */
export function normalizeHealth(raw: unknown): HealthData {
  const base = emptyHealth();
  if (!isRec(raw)) return base;
  const w = isRec(raw.water) ? raw.water : {};
  const days: Record<string, number> = {};
  if (isRec(w.days)) for (const [k, v] of Object.entries(w.days)) if (DAY.test(k) && typeof v === 'number' && Number.isFinite(v) && v > 0) days[k] = v;
  const sleep: Record<string, SleepEntry> = {};
  if (isRec(raw.sleep))
    for (const [k, v] of Object.entries(raw.sleep)) {
      if (!DAY.test(k) || !isRec(v) || typeof v.bed !== 'string' || typeof v.wake !== 'string' || !HHMM.test(v.bed) || !HHMM.test(v.wake)) continue;
      sleep[k] = { bed: v.bed, wake: v.wake, feel: FEELS.some((f) => f.id === v.feel) ? (v.feel as SleepFeel) : null };
    }
  return {
    water: {
      goal: posNum(w.goal, WATER_GOAL),
      step: posNum(w.step, WATER_STEP),
      days,
      habitId: typeof w.habitId === 'string' && w.habitId ? w.habitId : null,
      asked: w.asked === true,
    },
    sleep,
  };
}

// ---------- Água ----------

/** Hábito de água ligado (se ainda existe e tem meta com quantidade). */
export function waterHabit(d: Pick<AppData, 'health' | 'habits'>): Habit | null {
  const id = d.health.water.habitId;
  if (!id) return null;
  const h = d.habits.find((x) => x.id === id);
  return h && h.goal !== null && h.goal > 0 ? h : null;
}

/** Meta, passo e unidade em uso (do hábito ligado ou da Saúde). */
export function waterSetup(d: Pick<AppData, 'health' | 'habits'>): { goal: number; step: number; unit: string } {
  const h = waterHabit(d);
  if (h) return { goal: h.goal!, step: h.step > 0 ? h.step : WATER_STEP, unit: h.unit || 'ml' };
  return { goal: d.health.water.goal, step: d.health.water.step, unit: 'ml' };
}

export function waterOn(d: Pick<AppData, 'health' | 'habits'>, day: string): number {
  const h = waterHabit(d);
  return h ? (h.amounts[day] ?? 0) : (d.health.water.days[day] ?? 0);
}

export const waterMet = (d: Pick<AppData, 'health' | 'habits'>, day: string) => waterOn(d, day) >= waterSetup(d).goal;

/** Registra quanto bebeu no dia. Com hábito ligado, grava no hábito (e o dia é marcado ao bater a meta). */
export function setWater(day: string, value: number) {
  return (d: AppData): AppData => {
    const h = waterHabit(d);
    if (h) return setAmount(h.id, day, value)(d);
    const v = Math.max(0, Math.round(value));
    const days = { ...d.health.water.days };
    if (v > 0) days[day] = v;
    else delete days[day];
    return { ...d, health: { ...d.health, water: { ...d.health.water, days } } };
  };
}

export function addWater(day: string, delta: number) {
  return (d: AppData): AppData => setWater(day, waterOn(d, day) + delta)(d);
}

/** Meta e passo da Saúde (sem hábito ligado; com hábito, a meta é a dele). */
export function setWaterGoal(goal: number, step: number) {
  return (d: AppData): AppData => ({
    ...d,
    health: { ...d.health, water: { ...d.health.water, goal: posNum(Math.round(goal), d.health.water.goal), step: posNum(Math.round(step), d.health.water.step) } },
  });
}

/** Hábito que parece de água (para oferecer a ligação): meta com quantidade e "água" no nome ou ml/L/copos. */
export function waterCandidate(habits: Habit[]): Habit | null {
  const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return (
    habits.find((h) => h.archivedAt === null && h.goal !== null && h.goal > 0 && h.kind !== 'abandonar' && (/\bagua\b/.test(plain(h.name)) || /^(ml|l|litros?|copos?)$/.test(plain(h.unit.trim())))) ?? null
  );
}

/** Mostrar a pergunta "Ligar o hábito … à Saúde?" uma vez só. */
export function shouldAskLink(d: Pick<AppData, 'health' | 'habits'>): Habit | null {
  if (d.health.water.asked || d.health.water.habitId) return null;
  return waterCandidate(d.habits);
}

/**
 * Liga o hábito à Água: o histórico do hábito vira o histórico de água.
 * O que já estava só na Saúde passa para o hábito (nos dias em que o hábito não tinha nada). Nada se perde.
 */
export function linkWaterHabit(habitId: string) {
  return (d: AppData): AppData => {
    const h = d.habits.find((x) => x.id === habitId);
    if (!h || h.goal === null || h.goal <= 0) return d;
    let next: AppData = { ...d, health: { ...d.health, water: { ...d.health.water, habitId, asked: true, days: {} } } };
    for (const [day, v] of Object.entries(d.health.water.days)) if (!(day in h.amounts)) next = setAmount(habitId, day, v)(next);
    return next;
  };
}

/** Desliga: a Saúde fica com uma cópia do histórico; o hábito continua com o dele. */
export function unlinkWaterHabit() {
  return (d: AppData): AppData => {
    const h = waterHabit(d);
    const days = h ? { ...h.amounts } : { ...d.health.water.days };
    const goal = h ? h.goal! : d.health.water.goal;
    const step = h && h.step > 0 ? h.step : d.health.water.step;
    return { ...d, health: { ...d.health, water: { ...d.health.water, habitId: null, asked: true, days, goal, step } } };
  };
}

export function dismissLink() {
  return (d: AppData): AppData => ({ ...d, health: { ...d.health, water: { ...d.health.water, asked: true } } });
}

/** Dias em que bateu a meta de água sem hábito ligado (com hábito, a Jornada já conta pelo hábito). */
export function waterGoalDays(d: Pick<AppData, 'health' | 'habits'>, from: string, to: string): number {
  if (!d.health || waterHabit(d)) return 0;
  const goal = d.health.water.goal;
  return Object.entries(d.health.water.days).filter(([day, v]) => day >= from && day <= to && v >= goal).length;
}

// ---------- Sono ----------

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Minutos dormidos (passa da meia-noite quando a hora de acordar é menor). */
export function sleepMinutes(e: Pick<SleepEntry, 'bed' | 'wake'>): number {
  const m = toMin(e.wake) - toMin(e.bed);
  return m > 0 ? m : m + 24 * 60;
}

/** "7h30" / "8h". */
export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function saveSleep(day: string, e: SleepEntry) {
  return (d: AppData): AppData => {
    if (!HHMM.test(e.bed) || !HHMM.test(e.wake)) return d;
    return { ...d, health: { ...d.health, sleep: { ...d.health.sleep, [day]: { bed: e.bed, wake: e.wake, feel: e.feel } } } };
  };
}

export function removeSleep(day: string) {
  return (d: AppData): AppData => {
    const sleep = { ...d.health.sleep };
    delete sleep[day];
    return { ...d, health: { ...d.health, sleep } };
  };
}

/** Sugestão para um registro novo: a última noite registrada, ou os horários do Você, ou 23:00 → 07:00. */
export function sleepDefaults(d: Pick<AppData, 'health'>, wake?: string, bed?: string): Pick<SleepEntry, 'bed' | 'wake'> {
  const last = Object.keys(d.health.sleep).sort().pop();
  if (last) return { bed: d.health.sleep[last].bed, wake: d.health.sleep[last].wake };
  return { bed: bed && HHMM.test(bed) ? bed : '23:00', wake: wake && HHMM.test(wake) ? wake : '07:00' };
}

// ---------- Semanas (Histórico) ----------

export interface HealthWeek {
  /** Segunda-feira da semana. */
  start: string;
  end: string;
  /** Média de água nos dias com registro, e dias que bateram a meta. */
  waterAvg: number | null;
  waterDays: number;
  waterMet: number;
  /** Média de sono nas noites registradas. */
  sleepAvg: number | null;
  nights: number;
  feels: Record<SleepFeel, number>;
}

/** Segunda-feira da semana de `day`. */
export function weekStart(day: string): string {
  const dow = new Date(`${day}T12:00:00`).getDay(); // 0 = domingo
  return addDays(day, dow === 0 ? -6 : 1 - dow);
}

export function healthWeeks(d: Pick<AppData, 'health' | 'habits'>, today: string, count = 4): HealthWeek[] {
  const out: HealthWeek[] = [];
  const goal = waterSetup(d).goal;
  for (let i = 0; i < count; i++) {
    const start = addDays(weekStart(today), -7 * i);
    const end = addDays(start, 6);
    let wSum = 0, wDays = 0, wMet = 0, sSum = 0, nights = 0;
    const feels: Record<SleepFeel, number> = { bem: 0, medio: 0, cansado: 0 };
    for (let k = 0; k < 7; k++) {
      const day = addDays(start, k);
      if (day > today) break;
      const w = waterOn(d, day);
      if (w > 0) {
        wSum += w;
        wDays++;
        if (w >= goal) wMet++;
      }
      const s = d.health.sleep[day];
      if (s) {
        sSum += sleepMinutes(s);
        nights++;
        if (s.feel) feels[s.feel]++;
      }
    }
    out.push({ start, end, waterAvg: wDays ? Math.round(wSum / wDays) : null, waterDays: wDays, waterMet: wMet, sleepAvg: nights ? Math.round(sSum / nights) : null, nights, feels });
  }
  return out;
}

/** Últimos `n` dias (do mais novo ao mais antigo), para as listas de Água e Sono. */
export function lastDays(today: string, n = 7): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, -i));
}
