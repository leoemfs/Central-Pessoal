/** Entrevista da Mestra Lume: o que ela cria no app (separado para não criar ciclo com data.ts). */
import type { AppData, DayPeriod, SavingsBox } from '../types.ts';
import { normalizeHabit } from '../data.ts';
import { normalizeBox } from '../boxes.ts';
import { isArchived } from '../habits.ts';
import { uid } from '../utils.ts';
import { campaignRegions, goalName, plannedHabits, PLANS, type Profile } from './interview.ts';

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** O que a entrevista vai criar e o que já existe (mesmo nome, sem acento e sem maiúsculas). */
export function interviewPlan(d: AppData, p: Profile, today: string) {
  const existing = new Set(d.habits.filter((h) => !isArchived(h, today)).map((h) => plain(h.name)));
  const planned = plannedHabits(p);
  const create = planned.filter((h) => !existing.has(plain(h.name)));
  const kept = planned.filter((h) => existing.has(plain(h.name)));
  const wantsBox = p.areas.includes('dinheiro') && p.dinheiro.goal !== 'nenhum' && p.dinheiro.meta > 0;
  const boxName = goalName(p);
  const boxExists = wantsBox && d.boxes.some((b) => !b.realizedAt && plain(b.name) === plain(boxName));
  return { create, kept, box: wantsBox && !boxExists ? { name: boxName, meta: p.dinheiro.meta, plan: p.dinheiro.plan } : null, boxExists, regions: campaignRegions(p) };
}

const PERIOD: Record<Profile['period'], DayPeriod> = { manha: 'manha', tarde: 'tarde', noite: 'noite' };

/** Aplica a entrevista: guarda as respostas e cria os hábitos e a caixinha que faltam. */
export function applyInterview(d: AppData, p: Profile, today: string): AppData {
  const plan = interviewPlan(d, p, today);
  const now = new Date().toISOString();
  const habits = plan.create.map((h) =>
    normalizeHabit({ id: uid(), name: h.name, kind: h.kind, days: h.days, period: h.kind === 'abandonar' ? 'livre' : PERIOD[p.period], attrs: h.attrs, startDate: today, createdAt: now }),
  );
  const boxes: SavingsBox[] = plan.box
    ? [normalizeBox({ id: uid(), name: plan.box.name, target: plan.box.meta, plan: { amount: PLANS[plan.box.plan][0], every: PLANS[plan.box.plan][1], startDate: today }, createdAt: now })]
    : [];
  return { ...d, habits: [...d.habits, ...habits], boxes: [...d.boxes, ...boxes], journey: { ...d.journey, profile: { ...p, at: today } } };
}

