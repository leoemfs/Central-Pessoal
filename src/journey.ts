/**
 * Jornada (RPG) — por enquanto, só o desbloqueio e a prévia com dados reais.
 * Desbloqueia com 14 dias de uso dentro de 3 semanas. Ao desbloquear, mostra o XP, o nível
 * e o ouro que a pessoa teria ganhado com o que já fez (tudo calculado a partir dos dados,
 * sem guardar nada à parte e sem nunca tirar pontos por faltas).
 */
import type { AppData } from './types.ts';
import { addDays, sum, toISO, todayISO } from './utils.ts';
import { diffDays } from './habits.ts';
import { weeklyBonus } from './jornada/missions.ts';

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
  caixinha: { xp: 20, gold: 10, label: 'Guardar na caixinha no dia do plano', rule: '20 XP · 10 ouro por vez do plano, seja qual for o valor' },
  realizar: { xp: 0, gold: 200, label: 'Objetivos realizados com a caixinha', rule: '200 ouro por objetivo realizado' },
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

/** XP e ouro só do que foi feito (sem os bônus dos itens). */
export function baseStats(d: AppData, today: string = todayISO()) {
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
  // N2.17e: caixinhas. Cada vez do plano (guardar na data combinada) e cada objetivo realizado.
  const planSaves = sum((d.boxes ?? []).map((b) => b.moves.filter((m) => m.kind === 'plano' && m.date <= today).length));
  const realized = (d.boxes ?? []).filter((b) => b.realizedAt && b.realizedAt <= today).length;

  const sources = [
    count('ritual', checks('ritual')),
    count('construir', checks('construir')),
    count('abandonar', cleanWeeks),
    count('tarefa', tasks),
    count('conta', billsOnTime),
    count('diario', entries),
    count('revisao', reviews),
    count('caixinha', planSaves),
    count('realizar', realized),
  ];
  // N2.9: semanas com a meta do Diário cumprida (desde o desbloqueio): 10 XP por vez combinada.
  const wk = weeklyBonus(d, today);
  sources.push({ id: 'semana', label: 'Missões da semana cumpridas', rule: '10 XP por vez combinada no Diário', count: wk.weeks, xp: wk.xp, gold: 0 });
  const xp = sum(sources.map((s) => s.xp));
  return {
    xp,
    gold: sum(sources.map((s) => s.gold)),
    missions: sum(sources.map((s) => s.count)),
    sources: sources.filter((s) => s.count > 0),
    ...levelFromXp(xp),
  };
}

// ---------- N2.8b: bônus de XP dos itens vestidos ----------

/** Itens que dão +10% de XP nos hábitos de um atributo (artefatos, anéis, colares, Cajado do saber, Botas aladas). */
export const XP_ATTR_ITEMS: Record<string, string> = {
  pena: 'AGI', bracelete: 'FOR', grimorio: 'INT', gota: 'RES', lanterna: 'SAB', ampulheta: 'DIS',
  anelFoco: 'INT', denteLobo: 'FOR', cajadoSaber: 'INT', aladas: 'AGI', lanternaCalma: 'SAB',
};

/** Desde quando o item está vestido (só se estiver vestido agora; sem registro, conta a partir de hoje). */
export function itemSince(d: AppData, id: string, today: string = todayISO()): string | null {
  const j = d.journey;
  if (!j || !Object.values(j.equipped ?? {}).includes(id)) return null;
  return j.equippedAt?.[id] ?? today;
}

/** XP ganho entre duas datas (inclusive), só pelo que foi feito. */
export const xpBetween = (d: AppData, from: string, to: string) => baseStats(d, to).xp - baseStats(d, addDays(from, -1)).xp;

/** Bônus de XP dos itens vestidos, desde o dia em que cada um foi vestido. */
export function itemXp(d: AppData, today: string = todayISO()): number {
  let bonus = 0;
  // +10% nos hábitos do atributo do item (e no diário, com a Lanterna da calma).
  for (const [id, attr] of Object.entries(XP_ATTR_ITEMS)) {
    const since = itemSince(d, id, today);
    if (!since) continue;
    for (const h of d.habits) {
      if (h.kind === 'abandonar' || !(h.attrs ?? []).includes(attr)) continue;
      const n = new Set(h.checks.filter((c) => c >= since && c <= today)).size;
      bonus += n * REWARDS[h.kind === 'ritual' ? 'ritual' : 'construir'].xp * 0.1;
    }
    if (id === 'lanternaCalma') bonus += d.journal.filter((j) => j.tag !== 'Revisão' && j.createdAt.slice(0, 10) >= since && j.createdAt.slice(0, 10) <= today).length * REWARDS.diario.xp * 0.1;
  }
  // Estrela polar e Lâmina da ordem: +10% de XP em tudo.
  for (const id of ['polar', 'laminaOrdem']) {
    const since = itemSince(d, id, today);
    if (since) bonus += xpBetween(d, since, today) * 0.1;
  }
  // Pena da fênix: depois de uma recaída, os 7 dias seguintes valem XP em dobro.
  const fenix = itemSince(d, 'fenix', today);
  if (fenix) {
    const starts = d.habits.filter((h) => h.kind === 'abandonar').flatMap((h) => h.slips.filter((s) => s >= fenix && s <= today)).sort();
    let end = '';
    for (const st of starts) {
      const from = st > end ? st : addDays(end, 1);
      const to = addDays(st, 6) < today ? addDays(st, 6) : today;
      if (from <= to) bonus += xpBetween(d, from, to);
      if (to > end) end = to;
    }
  }
  return Math.floor(bonus);
}

/** XP, nível e ouro da Jornada: o que foi feito mais o bônus dos itens vestidos. */
export function journeyStats(d: AppData, today: string = todayISO()) {
  const base = baseStats(d, today);
  const extra = itemXp(d, today);
  if (!extra) return base;
  const xp = base.xp + extra;
  const sources = [...base.sources, { id: 'itens', label: 'Itens vestidos', rule: 'Bônus dos itens: +10% no atributo do item, Estrela polar, Pena da fênix…', count: 0, xp: extra, gold: 0 }];
  return { ...base, xp, sources, ...levelFromXp(xp) };
}
