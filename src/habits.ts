/**
 * Regras do Núcleo pessoal (rituais e hábitos), sem dependência de interface.
 */
import type { AppData, DayPeriod, Habit, HabitKind } from './types.ts';
import { addDays, fromISO, toISO, todayISO } from './utils.ts';

export const KIND_INFO: Record<HabitKind, { label: string; plural: string; hint: string }> = {
  ritual: { label: 'Ritual', plural: 'Rituais', hint: 'Rotina que já faz parte do seu dia' },
  construir: { label: 'Novo hábito', plural: 'Construindo', hint: 'Algo que você quer começar a fazer' },
  abandonar: { label: 'Deixar um hábito', plural: 'Abandonando', hint: 'Algo que você quer parar de fazer' },
};

export const PERIODS: { id: DayPeriod; label: string }[] = [
  { id: 'manha', label: 'Manhã' },
  { id: 'tarde', label: 'Tarde' },
  { id: 'noite', label: 'Noite' },
  { id: 'livre', label: 'Qualquer hora' },
];

/** Meta padrão para um hábito virar ritual: em média ~66 dias até ficar automático. */
export const DEFAULT_TARGET = 66;

export const weekday = (day: string) => fromISO(day).getDay();
export const diffDays = (a: string, b: string) => Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 864e5);

/** Primeiro dia que conta para o hábito (criação, ou um dia marcado antes dela). */
export function startOf(h: Habit): string {
  const created = toISO(new Date(h.createdAt));
  const first = [...h.checks].sort()[0];
  return first && first < created ? first : created;
}

/** O ritual/hábito está programado para este dia da semana? */
export function isScheduled(h: Habit, day: string): boolean {
  return h.kind !== 'abandonar' && h.days.includes(weekday(day));
}

/**
 * Sequência atual: dias programados seguidos cumpridos.
 * Dias fora da rotina não quebram a sequência, e hoje ainda pendente também não.
 */
export function habitStreak(h: Habit, today: string = todayISO()): number {
  const done = new Set(h.checks);
  const start = startOf(h);
  let day = today;
  if (isScheduled(h, day) && !done.has(day)) day = addDays(day, -1);
  let n = 0;
  for (let guard = 0; day >= start && guard < 3700; guard++) {
    if (isScheduled(h, day)) {
      if (!done.has(day)) break;
      n++;
    }
    day = addDays(day, -1);
  }
  return n;
}

/** Consistência nos últimos `window` dias (só dias programados). Perdoa falhas: uma falta não zera nada. */
export function consistency(h: Habit, today: string = todayISO(), window = 30): number | null {
  const done = new Set(h.checks);
  const start = startOf(h);
  let scheduled = 0;
  let hits = 0;
  for (let i = 0; i < window; i++) {
    const day = addDays(today, -i);
    if (day < start) break;
    if (!isScheduled(h, day)) continue;
    if (day === today && !done.has(day)) continue; // hoje ainda está em andamento
    scheduled++;
    if (done.has(day)) hits++;
  }
  return scheduled ? hits / scheduled : null;
}

/** Hábito a abandonar: dias desde a última recaída (ou desde o início). */
export function cleanDays(h: Habit, today: string = todayISO()): number {
  const slips = h.slips.filter((d) => d <= today).sort();
  const from = slips.length ? slips[slips.length - 1] : h.startDate;
  return Math.max(0, diffDays(from, today));
}

/** Maior período sem recaída. */
export function bestClean(h: Habit, today: string = todayISO()): number {
  const points = [h.startDate, ...h.slips.filter((d) => d >= h.startDate && d <= today).sort(), today];
  let best = 0;
  for (let i = 1; i < points.length; i++) best = Math.max(best, diffDays(points[i - 1], points[i]));
  return best;
}

/** Hábito a construir: quantos dias já cumpridos rumo à meta. */
export function progressToRitual(h: Habit): { done: number; target: number; ready: boolean } {
  const done = new Set(h.checks).size;
  return { done, target: h.target, ready: done >= h.target };
}

/** O que do Núcleo pertence a um dia (para o calendário e o Início). */
export function habitsOfDay(habits: Habit[], day: string) {
  const byTime = (a: Habit, b: Habit) => (a.time || '99').localeCompare(b.time || '99') || a.name.localeCompare(b.name);
  return {
    rituals: habits.filter((h) => h.kind === 'ritual' && isScheduled(h, day)).sort(byTime),
    building: habits.filter((h) => h.kind === 'construir' && isScheduled(h, day)).sort(byTime),
    quitting: habits.filter((h) => h.kind === 'abandonar' && h.startDate <= day),
  };
}

// ---------- Atualizações ----------

export function toggleCheck(id: string, day: string) {
  return (d: AppData): AppData => ({
    ...d,
    habits: d.habits.map((h) =>
      h.id !== id ? h : { ...h, checks: h.checks.includes(day) ? h.checks.filter((c) => c !== day) : [...h.checks, day].sort() },
    ),
  });
}

export function toggleSlip(id: string, day: string) {
  return (d: AppData): AppData => ({
    ...d,
    habits: d.habits.map((h) =>
      h.id !== id ? h : { ...h, slips: h.slips.includes(day) ? h.slips.filter((c) => c !== day) : [...h.slips, day].sort() },
    ),
  });
}

/** Hábito construído vira ritual (mantém o histórico). */
export function graduate(id: string) {
  return (d: AppData): AppData => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, kind: 'ritual' } : h)) });
}
