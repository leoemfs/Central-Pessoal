/**
 * Missões da Jornada (N2.9): são os próprios hábitos, tarefas, contas e o diário da pessoa.
 * Nada é criado à parte: marcar uma missão é o mesmo que marcar no Núcleo, na Agenda ou em
 * Finanças. As missões da semana seguem o ritmo escolhido (Diário) e a revisão semanal.
 * Sem punição: o que não foi feito só some no fim do dia ou da semana.
 */
import type { AppData, Habit, JournalRhythm } from '../types.ts';
import { addDays, fromISO, toISO } from '../utils.ts';
import { isArchived, isScheduled } from '../habits.ts';
import { REWARDS } from '../journey.ts';
import type { AttrCode } from './catalog.ts';

export type MissionAction = { type: 'habit'; id: string } | { type: 'task'; id: string } | { type: 'bill'; id: string } | { type: 'go'; to: string } | { type: 'none' };

export interface Mission {
  id: string;
  kind: 'ritual' | 'construir' | 'abandonar' | 'tarefa' | 'conta' | 'diario';
  title: string;
  meta: string;
  xp: number;
  gold: number;
  attrs: Partial<Record<AttrCode, number>>;
  done: boolean;
  action: MissionAction;
}

export interface WeekMission {
  id: 'diario' | 'revisao';
  title: string;
  meta: string;
  done: number;
  goal: number;
  /** XP de bônus ao cumprir (além do XP normal de cada registro). */
  bonus: number;
}

/** Segunda-feira da semana de `day`. */
export function mondayOf(day: string): string {
  const wd = fromISO(day).getDay();
  return addDays(day, wd === 0 ? -6 : 1 - wd);
}

const dayOf = (iso: string) => toISO(new Date(iso));
const isReview = (tag: string) => tag === 'Revisão';

function habitAttrs(h: Habit): Partial<Record<AttrCode, number>> {
  const each = h.attrs.length === 1 ? 3 : 2;
  return Object.fromEntries(h.attrs.map((a) => [a, each]));
}

/** Dias (AAAA-MM-DD) com registro no diário (sem contar as revisões). */
export function diaryDays(d: AppData): Set<string> {
  return new Set(d.journal.filter((j) => !isReview(j.tag)).map((j) => dayOf(j.createdAt)));
}

/** Quantas vezes o ritmo do Diário pede por semana (0 = "quando der", sem meta). */
export function diaryGoal(r: JournalRhythm): number {
  if (r.mode === 'todo-dia') return 7;
  if (r.mode === 'semana') return r.perWeek;
  if (r.mode === 'dias') return r.days.length;
  return 0;
}

/** Registros que contam para a meta da semana que começa em `monday` (até `to`). */
function diaryCount(r: JournalRhythm, days: Set<string>, monday: string, to: string): number {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i);
    if (day > to) break;
    if (!days.has(day)) continue;
    if (r.mode === 'dias' && !r.days.includes(fromISO(day).getDay())) continue;
    n++;
  }
  return n;
}

/** Missões de hoje, na ordem: hábitos (pelo horário), tarefas, contas, diário e hábitos a abandonar. */
export function missionsToday(d: AppData, today: string): Mission[] {
  const out: Mission[] = [];
  const habits = d.habits.filter((h) => (h.kind === 'ritual' || h.kind === 'construir') && isScheduled(h, today)).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  for (const h of habits) {
    const r = REWARDS[h.kind as 'ritual' | 'construir'];
    out.push({
      id: `h:${h.id}`,
      kind: h.kind as 'ritual' | 'construir',
      title: h.name,
      meta: `Núcleo · ${h.kind === 'ritual' ? 'Ritual' : 'Hábito em construção'}${h.time ? ` · ${h.time}` : ''}`,
      xp: r.xp,
      gold: r.gold,
      attrs: habitAttrs(h),
      done: h.checks.includes(today),
      action: { type: 'habit', id: h.id },
    });
  }
  for (const t of d.tasks) {
    if (!t.due) continue;
    const doneToday = t.done && t.doneAt !== null && dayOf(t.doneAt) === today;
    if (!(doneToday || (!t.done && t.due <= today))) continue;
    out.push({
      id: `t:${t.id}`,
      kind: 'tarefa',
      title: t.title,
      meta: `Agenda · Tarefa${t.due < today ? ' atrasada' : ''}`,
      xp: REWARDS.tarefa.xp,
      gold: REWARDS.tarefa.gold,
      attrs: {},
      done: t.done,
      action: { type: 'task', id: t.id },
    });
  }
  for (const e of d.expenses) {
    if (e.cardId || e.dueDate !== today || (e.paidAt !== null && e.paidAt !== today)) continue;
    out.push({
      id: `c:${e.id}`,
      kind: 'conta',
      title: `Pagar ${e.description}`,
      meta: `Finanças · vence hoje · ${e.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      xp: REWARDS.conta.xp,
      gold: REWARDS.conta.gold,
      attrs: { DIS: 2 },
      done: e.paidAt === today,
      action: { type: 'bill', id: e.id },
    });
  }
  const r = d.settings.journalRhythm;
  const days = diaryDays(d);
  const wrote = days.has(today);
  const weekGoal = diaryGoal(r);
  const weekDone = diaryCount(r, days, mondayOf(today), today);
  const diaryDay =
    r.mode === 'todo-dia' || (r.mode === 'dias' && r.days.includes(fromISO(today).getDay())) || (r.mode === 'semana' && (wrote || weekDone < weekGoal)) || (r.mode === 'livre' && wrote);
  if (diaryDay)
    out.push({
      id: 'diario',
      kind: 'diario',
      title: 'Escrever no diário',
      meta: r.mode === 'semana' ? `Diário · ${Math.min(weekDone, weekGoal)} de ${weekGoal} nesta semana` : 'Diário',
      xp: REWARDS.diario.xp,
      gold: REWARDS.diario.gold,
      attrs: { SAB: 1 },
      done: wrote,
      action: { type: 'go', to: 'diario/nova' },
    });
  for (const h of d.habits) {
    if (h.kind !== 'abandonar' || isArchived(h, today) || h.startDate > today) continue;
    const last = [h.startDate, ...h.slips.filter((s) => s <= today)].sort().pop()!;
    const clean = Math.max(0, Math.round((fromISO(today).getTime() - fromISO(last).getTime()) / 86_400_000));
    const slipped = h.slips.includes(today);
    out.push({
      id: `a:${h.id}`,
      kind: 'abandonar',
      title: `Dia sem ${h.name.replace(/^(parar de|largar|sem)\s+/i, '')}`,
      meta: slipped ? 'Recaída registrada hoje. O contador recomeça amanhã, e nada do que você ganhou some.' : `Núcleo · ${clean} ${clean === 1 ? 'dia' : 'dias'} sem`,
      xp: REWARDS.abandonar.xp,
      gold: REWARDS.abandonar.gold,
      attrs: habitAttrs(h),
      done: !slipped,
      action: { type: 'none' },
    });
  }
  return out;
}

/** Missões da semana: o Diário no ritmo escolhido (bônus de 10 XP por vez combinada) e a revisão semanal. */
export function missionsWeek(d: AppData, today: string): WeekMission[] {
  const out: WeekMission[] = [];
  const r = d.settings.journalRhythm;
  const monday = mondayOf(today);
  const goal = diaryGoal(r);
  if (goal > 0) {
    const days = r.mode === 'dias' ? ` (${r.days.length} dias certos)` : '';
    out.push({ id: 'diario', title: `Escrever ${goal === 7 ? 'todos os dias' : `${goal} ${goal === 1 ? 'vez' : 'vezes'}`} nesta semana${days}`, meta: 'Diário · no ritmo que você escolheu', done: Math.min(goal, diaryCount(r, diaryDays(d), monday, today)), goal, bonus: 10 * goal });
  }
  const reviewed = d.journal.some((j) => isReview(j.tag) && dayOf(j.createdAt) >= monday && dayOf(j.createdAt) <= addDays(monday, 7));
  out.push({ id: 'revisao', title: 'Fazer a revisão semanal', meta: 'Revisão semanal · olhar a semana que passou', done: reviewed ? 1 : 0, goal: 1, bonus: 0 });
  return out;
}

/**
 * Semanas fechadas (desde o desbloqueio da Jornada) em que a meta do Diário foi cumprida,
 * e o XP de bônus somado. Usa o ritmo atual.
 */
export function weeklyBonus(d: AppData, today: string): { weeks: number; xp: number } {
  const goal = diaryGoal(d.settings.journalRhythm);
  const from = d.settings.journeyUnlockedAt;
  if (goal === 0 || !from) return { weeks: 0, xp: 0 };
  const days = diaryDays(d);
  let weeks = 0;
  for (let m = mondayOf(from.slice(0, 10)); addDays(m, 6) <= today; m = addDays(m, 7)) {
    if (diaryCount(d.settings.journalRhythm, days, m, addDays(m, 6)) >= goal) weeks++;
  }
  // A semana atual conta assim que a meta é cumprida.
  const cur = mondayOf(today);
  if (cur >= mondayOf(from.slice(0, 10)) && addDays(cur, 6) > today && diaryCount(d.settings.journalRhythm, days, cur, today) >= goal) weeks++;
  return { weeks, xp: weeks * 10 * goal };
}
