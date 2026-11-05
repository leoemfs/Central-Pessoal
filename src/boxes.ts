/**
 * Caixinhas: metas de dinheiro guardado, com plano ("R$ 100 toda semana"), guardar e tirar.
 * O app não move dinheiro: só registra o que a pessoa guardou no banco ou na poupança.
 */
import type { AppData, BoxMove, SavingsBox } from './types.ts';
import { addDays, addMonths, clampDay, dayOf, monthKey, sum, todayISO, uid } from './utils.ts';
import { diffDays } from './habits.ts';

export const BOX_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#ec4899', '#06b6d4', '#eab308'];
export const MARKS = [25, 50, 75, 100];

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);

export function normalizeBox(b: Rec): SavingsBox {
  const plan = isRec(b.plan) && num(b.plan.amount) && typeof b.plan.startDate === 'string'
    ? { amount: b.plan.amount as number, every: b.plan.every === 'mes' ? ('mes' as const) : ('semana' as const), startDate: b.plan.startDate }
    : null;
  const moves: BoxMove[] = Array.isArray(b.moves)
    ? b.moves
        .filter((m): m is Rec => isRec(m) && typeof m.date === 'string' && (num(m.amount) ?? 0) > 0)
        .map((m) => ({
          id: typeof m.id === 'string' ? m.id : uid(),
          date: m.date as string,
          amount: m.amount as number,
          kind: m.kind === 'plano' || m.kind === 'retirada' ? m.kind : 'extra',
          reason: m.reason === 'realizei' || m.reason === 'emergencia' || m.reason === 'outro' ? m.reason : null,
          note: typeof m.note === 'string' ? m.note : '',
        }))
    : [];
  const target = num(b.target);
  return {
    id: b.id as string,
    name: typeof b.name === 'string' && b.name.trim() ? b.name : 'Caixinha',
    color: typeof b.color === 'string' ? b.color : BOX_COLORS[0],
    target: target && target > 0 ? target : null,
    deadline: typeof b.deadline === 'string' ? b.deadline : null,
    plan,
    moves,
    marks: Array.isArray(b.marks) ? b.marks.filter((m): m is number => typeof m === 'number') : [],
    realizedAt: typeof b.realizedAt === 'string' ? b.realizedAt : null,
    createdAt: typeof b.createdAt === 'string' ? b.createdAt : new Date().toISOString(),
  };
}

/** Saldo: tudo o que foi guardado menos o que foi tirado. */
export const balance = (b: SavingsBox) => sum(b.moves.map((m) => (m.kind === 'retirada' ? -m.amount : m.amount)));

/** Fração da meta (0–1). Sem meta, 0. */
export const progress = (b: SavingsBox, bal: number = balance(b)) => (b.target ? Math.max(0, Math.min(1, bal / b.target)) : 0);

/** Período do plano que contém o dia (semana ou mês a partir da data de início). Antes do início: null. */
export function planPeriod(b: SavingsBox, day: string): { start: string; end: string } | null {
  const p = b.plan;
  if (!p || day < p.startDate) return null;
  if (p.every === 'semana') {
    const start = addDays(p.startDate, Math.floor(diffDays(p.startDate, day) / 7) * 7);
    return { start, end: addDays(start, 6) };
  }
  const dom = dayOf(p.startDate);
  let m = monthKey(day);
  let start = clampDay(m, dom);
  if (day < start) {
    m = addMonths(m, -1);
    start = clampDay(m, dom);
  }
  return { start, end: addDays(clampDay(addMonths(m, 1), dom), -1) };
}

/** Situação do plano hoje: já guardou neste período? Quando é a próxima vez? */
export function planStatus(b: SavingsBox, today: string = todayISO()) {
  if (!b.plan || b.realizedAt) return null;
  const cur = planPeriod(b, today);
  if (!cur) return { pending: false, due: b.plan.startDate, next: b.plan.startDate, amount: b.plan.amount };
  const done = b.moves.some((m) => m.kind === 'plano' && m.date >= cur.start && m.date <= cur.end);
  return { pending: !done, due: cur.start, next: done ? addDays(cur.end, 1) : cur.start, amount: b.plan.amount };
}

/** Caixinhas com o plano pendente hoje (missão do dia no Início). */
export const pendingBoxes = (boxes: SavingsBox[], today: string = todayISO()) => boxes.filter((b) => planStatus(b, today)?.pending);

/** Marcos (25/50/75/100%) que passam a valer com este saldo e ainda não foram comemorados. */
export function newMarks(b: SavingsBox, newBalance: number): number[] {
  if (!b.target) return [];
  const pct = (newBalance / b.target) * 100;
  return MARKS.filter((m) => pct >= m && !b.marks.includes(m));
}

function patch(id: string, fn: (b: SavingsBox) => SavingsBox) {
  return (d: AppData): AppData => ({ ...d, boxes: d.boxes.map((b) => (b.id === id ? fn(b) : b)) });
}

/** Guardar. "plano" só quando o período ainda não foi cumprido; senão vira "extra". */
export function deposit(id: string, amount: number, date: string, asPlan: boolean) {
  return patch(id, (b) => {
    const per = planPeriod(b, date);
    const planDone = per ? b.moves.some((m) => m.kind === 'plano' && m.date >= per.start && m.date <= per.end) : true;
    const kind: BoxMove['kind'] = asPlan && b.plan && !planDone ? 'plano' : 'extra';
    const next = { ...b, moves: [...b.moves, { id: uid(), date, amount, kind, reason: null, note: '' }] };
    return { ...next, marks: [...b.marks, ...newMarks(b, balance(next))].sort((x, y) => x - y) };
  });
}

/** Tirar, com o motivo. "Realizei o objetivo" fecha a caixinha (fica no histórico). Tirar nunca desfaz marcos. */
export function withdraw(id: string, amount: number, date: string, reason: 'realizei' | 'emergencia' | 'outro') {
  return patch(id, (b) => ({
    ...b,
    moves: [...b.moves, { id: uid(), date, amount, kind: 'retirada', reason, note: '' }],
    realizedAt: reason === 'realizei' ? date : b.realizedAt,
  }));
}

export function removeMove(id: string, moveId: string) {
  return patch(id, (b) => ({ ...b, moves: b.moves.filter((m) => m.id !== moveId) }));
}

/** Quanto entrou (menos o que saiu) nas caixinhas num mês. */
export function savedInMonth(boxes: SavingsBox[], month: string): number {
  return sum(boxes.flatMap((b) => b.moves.filter((m) => monthKey(m.date) === month).map((m) => (m.kind === 'retirada' ? -m.amount : m.amount))));
}

/** Quanto os planos pedem num mês (para o balanço previsto). */
export function plannedInMonth(boxes: SavingsBox[], month: string): number {
  let total = 0;
  const first = `${month}-01`;
  const last = addDays(`${addMonths(month, 1)}-01`, -1);
  for (const b of boxes) {
    if (!b.plan || b.realizedAt) continue;
    let d = b.plan.startDate;
    for (let guard = 0; d <= last && guard < 600; guard++) {
      if (d >= first) total += b.plan.amount;
      d = b.plan.every === 'semana' ? addDays(d, 7) : clampDay(addMonths(monthKey(d), 1), dayOf(b.plan.startDate));
    }
  }
  return sum([total]);
}

/** No ritmo do plano, quanto tempo falta para a meta ("uns 14 meses", "umas 6 semanas"). */
export function timeToGoal(b: SavingsBox, bal: number = balance(b)): string | null {
  if (!b.target || !b.plan || bal >= b.target) return null;
  const n = Math.ceil((b.target - bal) / b.plan.amount);
  if (b.plan.every === 'mes') return n === 1 ? 'mais 1 mês' : `uns ${n} meses`;
  if (n <= 8) return n === 1 ? 'mais 1 semana' : `umas ${n} semanas`;
  const months = Math.max(2, Math.round(n / 4.33));
  return `uns ${months} meses`;
}

export function newBox(p: { name: string; target: number | null; color: string; plan: SavingsBox['plan']; deadline?: string | null }): SavingsBox {
  return { id: uid(), name: p.name.trim(), color: p.color, target: p.target, deadline: p.deadline ?? null, plan: p.plan, moves: [], marks: [], realizedAt: null, createdAt: new Date().toISOString() };
}
