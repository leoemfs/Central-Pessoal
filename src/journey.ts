/**
 * Jornada (RPG) — por enquanto, só o desbloqueio e a prévia com dados reais.
 * Desbloqueia com 14 dias de uso dentro de 3 semanas. Ao desbloquear, mostra o XP, o nível
 * e o ouro que a pessoa teria ganhado com o que já fez (tudo calculado a partir dos dados,
 * sem guardar nada à parte e sem nunca tirar pontos por faltas).
 */
import type { AppData } from './types.ts';
import { addDays, sum, toISO, todayISO } from './utils.ts';
import { diffDays } from './habits.ts';

export const UNLOCK_DAYS = 14;
export const UNLOCK_WINDOW = 21;

/** Registra que houve uso hoje (guarda só os últimos 120 dias). */
export function markActive(d: AppData, today: string = todayISO()): AppData {
  if (d.settings.activeDays.includes(today)) return d;
  const activeDays = [...d.settings.activeDays, today].sort().slice(-120);
  return { ...d, settings: { ...d.settings, activeDays } };
}

/** Registra que o app foi aberto hoje (guarda só os últimos 400 dias). Não depende de registrar nada. */
export function markVisit(d: AppData, today: string = todayISO()): AppData {
  if (d.settings.visitDays.includes(today)) return d;
  const visitDays = [...d.settings.visitDays, today].sort().slice(-400);
  return { ...d, settings: { ...d.settings, visitDays } };
}

export function unlockProgress(d: AppData, today: string = todayISO()) {
  const set = new Set(d.settings.activeDays);
  const days = Array.from({ length: UNLOCK_WINDOW }, (_, i) => addDays(today, i - (UNLOCK_WINDOW - 1)));
  const active = days.filter((x) => set.has(x)).length;
  return {
    active: Math.min(active, UNLOCK_DAYS),
    needed: UNLOCK_DAYS,
    days: days.map((x) => ({ day: x, active: set.has(x) })),
    unlocked: d.settings.journeyUnlockedAt !== null,
  };
}

/** Desbloqueia (uma vez, para sempre) quando atinge 14 dias de uso na janela de 3 semanas. */
export function checkUnlock(d: AppData, today: string = todayISO()): AppData {
  if (d.settings.journeyUnlockedAt) return d;
  const start = addDays(today, -(UNLOCK_WINDOW - 1));
  const active = d.settings.activeDays.filter((x) => x >= start && x <= today).length;
  return active >= UNLOCK_DAYS ? { ...d, settings: { ...d.settings, journeyUnlockedAt: today } } : d;
}

// ---------- Prévia de XP, nível e ouro ----------

export interface SourceStats {
  id: string;
  label: string;
  count: number;
  xp: number;
  gold: number;
  rule: string;
}

/** Tabela de recompensas (configurável no futuro). Nada é ganho por gastar dinheiro. */
export const REWARDS = {
  ritual: { xp: 10, gold: 5, label: 'Rituais cumpridos', rule: '10 XP · 5 ouro por dia' },
  construir: { xp: 20, gold: 10, label: 'Hábitos em construção', rule: '20 XP · 10 ouro por dia' },
  abandonar: { xp: 30, gold: 15, label: 'Semanas sem um hábito a abandonar', rule: '30 XP · 15 ouro por semana sem recaída' },
  tarefa: { xp: 15, gold: 8, label: 'Tarefas concluídas', rule: '15 XP · 8 ouro' },
  conta: { xp: 20, gold: 10, label: 'Contas pagas no prazo', rule: '20 XP · 10 ouro' },
  diario: { xp: 10, gold: 5, label: 'Registros no diário', rule: '10 XP · 5 ouro' },
  revisao: { xp: 40, gold: 20, label: 'Revisões semanais', rule: '40 XP · 20 ouro' },
} as const;

/** Nível a partir do XP: do nível N para o N+1 são necessários 100 × N XP. */
export function levelFromXp(xp: number) {
  let level = 1;
  let floor = 0;
  while (xp >= floor + 100 * level) {
    floor += 100 * level;
    level++;
  }
  return { level, xpInLevel: xp - floor, xpForNext: 100 * level };
}

export function journeyStats(d: AppData, today: string = todayISO()) {
  const count = (k: keyof typeof REWARDS, n: number): SourceStats => ({ id: k, label: REWARDS[k].label, rule: REWARDS[k].rule, count: n, xp: n * REWARDS[k].xp, gold: n * REWARDS[k].gold });
  const checks = (kind: 'ritual' | 'construir') => sum(d.habits.filter((h) => h.kind === kind).map((h) => new Set(h.checks.filter((c) => c <= today)).size));
  const cleanWeeks = sum(
    d.habits
      .filter((h) => h.kind === 'abandonar' && h.startDate <= today)
      .map((h) => {
        const points = [h.startDate, ...h.slips.filter((s) => s >= h.startDate && s <= today).sort(), today];
        let weeks = 0;
        for (let i = 1; i < points.length; i++) weeks += Math.floor(diffDays(points[i - 1], points[i]) / 7);
        return weeks;
      }),
  );
  const tasks = d.tasks.filter((t) => t.done && t.doneAt && toISO(new Date(t.doneAt)) <= today).length;
  const billsOnTime =
    d.expenses.filter((e) => !e.cardId && e.paidAt && e.paidAt <= e.dueDate && e.paidAt <= today).length +
    sum(d.cards.map((c) => Object.entries(c.paidInvoices).filter(([month, paid]) => paid <= `${month}-${String(c.dueDay).padStart(2, '0')}` && paid <= today).length));
  const reviews = d.journal.filter((j) => j.tag === 'Revisão').length;
  const entries = d.journal.length - reviews;

  const sources = [
    count('ritual', checks('ritual')),
    count('construir', checks('construir')),
    count('abandonar', cleanWeeks),
    count('tarefa', tasks),
    count('conta', billsOnTime),
    count('diario', entries),
    count('revisao', reviews),
  ];
  const xp = sum(sources.map((s) => s.xp));
  return {
    xp,
    gold: sum(sources.map((s) => s.gold)),
    missions: sum(sources.map((s) => s.count)),
    sources: sources.filter((s) => s.count > 0),
    ...levelFromXp(xp),
  };
}
