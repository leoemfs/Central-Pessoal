/**
 * Objetivos (N10.1): central de todas as metas do app.
 * Regra principal: a meta continua morando no módulo dela. Aqui só se lê e se muda a mesma informação
 * (caixinhas, hábitos, ciclos, orçamento, metas do Você). As metas de carreira moram aqui (career.goals).
 */
import type { AppData, CareerGoal } from './types.ts';
import { balance } from './boxes.ts';
import { budgetRows } from './budget.ts';
import { atRiskToday, isPaused, progressToRitual } from './habits.ts';
import { cycleCounts } from './estudos.ts';
import { formatMoney, monthKey, todayISO, uid } from './utils.ts';

export type GoalArea = 'financas' | 'corpo' | 'estudos' | 'carreira' | 'voce';
export type GoalKind = 'caixinha' | 'habito' | 'ciclo' | 'orcamento' | 'carreira' | 'voce';
export type GoalStatus = 'andando' | 'atrasada' | 'concluida';

export const AREAS: { id: GoalArea; label: string }[] = [
  { id: 'financas', label: 'Finanças' },
  { id: 'corpo', label: 'Corpo e mente' },
  { id: 'estudos', label: 'Estudos' },
  { id: 'carreira', label: 'Carreira' },
  { id: 'voce', label: 'Você' },
];

export interface GoalView {
  /** `${kind}:${refId}` */
  id: string;
  kind: GoalKind;
  refId: string;
  area: GoalArea;
  title: string;
  /** Onde a meta mora ("Finanças › Caixinhas"). */
  where: string;
  /** 0 a 100. */
  pct: number;
  /** "R$ 300 de R$ 1.000", "12 de 66 dias"… */
  value: string;
  deadline: string | null;
  status: GoalStatus;
  /** Por que está atrasada ("passou do prazo", "passou do limite"…). */
  late: string;
  doneAt: string | null;
  /** Endereço para abrir no módulo (sem "#/"). */
  to: string;
}

const pct = (a: number, b: number) => (b > 0 ? Math.max(0, Math.min(100, Math.round((a / b) * 100))) : 0);
const brl = (n: number) => formatMoney(n).replace(/,00$/, '');

/** Todas as metas do app, na ordem: atrasadas, andando (prazo mais perto primeiro) e concluídas (mais recentes primeiro). */
export function allGoals(d: AppData, today: string = todayISO()): GoalView[] {
  const out: GoalView[] = [];

  for (const b of d.boxes) {
    if (!b.target) continue;
    const bal = balance(b);
    const reached = bal >= b.target - 0.001;
    const done = b.realizedAt ?? (reached ? b.moves.map((m) => m.date).sort().at(-1) ?? today : null);
    const past = !done && !!b.deadline && b.deadline < today;
    out.push({
      id: `caixinha:${b.id}`, kind: 'caixinha', refId: b.id, area: 'financas',
      title: b.name, where: 'Finanças › Caixinhas',
      pct: pct(bal, b.target), value: `${brl(bal)} de ${brl(b.target)}`,
      deadline: b.deadline, status: done ? 'concluida' : past ? 'atrasada' : 'andando', late: past ? 'passou do prazo' : '',
      doneAt: done, to: 'financas/caixinhas',
    });
  }

  for (const h of d.habits) {
    if (h.archivedAt || isPaused(h, today)) continue;
    const building = h.kind === 'construir';
    if (!building && !h.goal) continue;
    const risk = atRiskToday(h, today);
    if (building) {
      const p = progressToRitual(h);
      out.push({
        id: `habito:${h.id}`, kind: 'habito', refId: h.id, area: 'corpo',
        title: h.name, where: 'Núcleo › Hábitos',
        pct: pct(p.done, p.target), value: `${Math.min(p.done, p.target)} de ${p.target} dias`,
        deadline: null, status: p.ready ? 'concluida' : risk ? 'atrasada' : 'andando', late: risk ? 'falhou no último dia' : '',
        doneAt: p.ready ? [...h.checks].sort().at(-1) ?? today : null, to: 'nucleo',
      });
    } else {
      const got = h.amounts[today] ?? 0;
      out.push({
        id: `habito:${h.id}`, kind: 'habito', refId: h.id, area: 'corpo',
        title: h.name, where: 'Núcleo › Hábitos',
        pct: pct(got, h.goal!), value: `hoje ${got} de ${h.goal} ${h.unit}`.trim(),
        deadline: null, status: risk ? 'atrasada' : 'andando', late: risk ? 'falhou no último dia' : '',
        doneAt: null, to: 'nucleo',
      });
    }
  }

  for (const c of d.study.cycles) {
    const n = cycleCounts(c);
    const done = c.finishedAt ?? (n.total > 0 && n.done === n.total ? c.topics.map((t) => t.doneAt ?? '').sort().at(-1) || today : null);
    out.push({
      id: `ciclo:${c.id}`, kind: 'ciclo', refId: c.id, area: 'estudos',
      title: c.name, where: 'Estudos › Ciclos',
      pct: n.pct, value: `${n.done} de ${n.total} tópicos`,
      deadline: null, status: done ? 'concluida' : 'andando', late: '',
      doneAt: done, to: `ciclos/${c.id}`,
    });
  }

  for (const r of budgetRows(d, monthKey(today), today)) {
    const cat = d.categories.find((c) => c.id === r.categoryId);
    const over = r.tone === 'red';
    out.push({
      id: `orcamento:${r.categoryId}`, kind: 'orcamento', refId: r.categoryId, area: 'financas',
      title: `Gastar até ${brl(r.budget)} com ${cat?.name ?? 'categoria'}`, where: 'Finanças › Orçamento',
      pct: Math.round(r.pct * 100), value: `${brl(r.spent)} de ${brl(r.budget)} este mês`,
      deadline: null, status: over ? 'atrasada' : 'andando', late: over ? 'passou do limite' : '',
      doneAt: null, to: 'orcamento',
    });
  }

  for (const g of d.career.goals) {
    const st = careerGoalProgress(g);
    const past = !g.doneAt && !!g.deadline && g.deadline < today;
    out.push({
      id: `carreira:${g.id}`, kind: 'carreira', refId: g.id, area: 'carreira',
      title: g.title || 'Meta sem nome', where: 'Objetivos › Carreira',
      pct: st.pct, value: st.total ? `${st.done} de ${st.total} passos` : g.doneAt ? 'alcançada' : 'sem passos',
      deadline: g.deadline, status: g.doneAt ? 'concluida' : past ? 'atrasada' : 'andando', late: past ? 'passou do prazo' : '',
      doneAt: g.doneAt, to: 'objetivos',
    });
  }

  for (const [list, label] of [[d.profile.shortGoals, 'curto prazo'], [d.profile.longGoals, 'longo prazo']] as const) {
    for (const g of list) {
      if (!g.text.trim()) continue;
      out.push({
        id: `voce:${g.id}`, kind: 'voce', refId: g.id, area: 'voce',
        title: g.text, where: `Você › Metas de ${label}`,
        pct: g.doneAt ? 100 : 0, value: g.when ? g.when : label,
        deadline: null, status: g.doneAt ? 'concluida' : 'andando', late: '',
        doneAt: g.doneAt ? g.doneAt.slice(0, 10) : null, to: 'voce',
      });
    }
  }

  const rank: Record<GoalStatus, number> = { atrasada: 0, andando: 1, concluida: 2 };
  return out.sort((a, b) => {
    if (a.status !== b.status) return rank[a.status] - rank[b.status];
    if (a.status === 'concluida') return (b.doneAt ?? '').localeCompare(a.doneAt ?? '');
    if (!!a.deadline !== !!b.deadline) return a.deadline ? -1 : 1;
    return (a.deadline ?? '').localeCompare(b.deadline ?? '');
  });
}

export function goalSummary(goals: GoalView[], today: string = todayISO()) {
  const year = today.slice(0, 4);
  return {
    andando: goals.filter((g) => g.status === 'andando').length,
    atrasadas: goals.filter((g) => g.status === 'atrasada').length,
    concluidasNoAno: goals.filter((g) => g.status === 'concluida' && (g.doneAt ?? '').startsWith(year)).length,
  };
}

/** Para o Início: atrasadas e prazos dos próximos 30 dias (no máximo `n`). */
export function goalsToWatch(goals: GoalView[], today: string = todayISO(), n = 3): GoalView[] {
  const limit = new Date(`${today}T12:00:00`);
  limit.setDate(limit.getDate() + 30);
  const until = limit.toISOString().slice(0, 10);
  return goals.filter((g) => g.status === 'atrasada' || (g.status === 'andando' && g.deadline && g.deadline <= until)).slice(0, n);
}

// ---------- Metas de carreira (moram em Objetivos) ----------

export function careerGoalProgress(g: CareerGoal) {
  const total = g.steps.length;
  const done = g.steps.filter((s) => s.done).length;
  return { total, done, pct: g.doneAt ? 100 : pct(done, total) };
}

export function newCareerGoal(now: string = new Date().toISOString()): CareerGoal {
  return { id: uid(), title: '', note: '', deadline: null, steps: [], doneAt: null, createdAt: now };
}

export function saveCareerGoal(g: CareerGoal) {
  return (d: AppData): AppData => {
    const goals = d.career.goals.some((x) => x.id === g.id) ? d.career.goals.map((x) => (x.id === g.id ? g : x)) : [g, ...d.career.goals];
    return { ...d, career: { ...d.career, goals } };
  };
}

export function removeCareerGoal(id: string) {
  return (d: AppData): AppData => ({
    ...d,
    career: { ...d.career, goals: d.career.goals.filter((g) => g.id !== id) },
    deleted: { ...d.deleted, [id]: new Date().toISOString() },
  });
}

/** Concluir ou reabrir uma meta do Você (curto ou longo prazo). */
export function toggleProfileGoal(id: string, today: string = todayISO()) {
  return (d: AppData): AppData => {
    const flip = (list: AppData['profile']['shortGoals']) => list.map((g) => (g.id === id ? { ...g, doneAt: g.doneAt ? null : today } : g));
    return { ...d, profile: { ...d.profile, shortGoals: flip(d.profile.shortGoals), longGoals: flip(d.profile.longGoals) } };
  };
}

/** Editar a meta e o prazo de uma caixinha (é a mesma caixinha de Finanças). */
export function setBoxGoal(id: string, target: number | null, deadline: string | null) {
  return (d: AppData): AppData => ({
    ...d,
    boxes: d.boxes.map((b) => (b.id === id ? { ...b, target: target && target > 0 ? Math.round(target * 100) / 100 : null, deadline } : b)),
  });
}

/** Editar a meta de um hábito: dias para virar ritual (construir) ou quantidade por dia. */
export function setHabitGoal(id: string, p: { target?: number; goal?: number | null }) {
  return (d: AppData): AppData => ({
    ...d,
    habits: d.habits.map((h) =>
      h.id !== id ? h : { ...h, ...(p.target !== undefined ? { target: Math.max(1, Math.round(p.target)) } : {}), ...(p.goal !== undefined ? { goal: p.goal && p.goal > 0 ? p.goal : null } : {}) },
    ),
  });
}
