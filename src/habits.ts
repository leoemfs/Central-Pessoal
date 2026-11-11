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

/** Dia dentro de uma pausa? (a sequência congela e não conta falta) */
export function isPaused(h: Habit, day: string): boolean {
  return h.pauses.some((p) => p.from <= day && (p.to === null || day <= p.to));
}

/** Arquivado neste dia (ou antes)? O histórico de antes continua valendo. */
export const isArchived = (h: Habit, day: string = todayISO()): boolean => h.archivedAt !== null && h.archivedAt <= day;

/** O ritual/hábito está programado para este dia? (não conta dias pausados nem depois de arquivado) */
export function isScheduled(h: Habit, day: string): boolean {
  return h.kind !== 'abandonar' && h.days.includes(weekday(day)) && !isPaused(h, day) && !isArchived(h, day);
}

/** Pausa em andamento hoje (ou null). `to` = último dia pausado; volta no dia seguinte. */
export function currentPause(h: Habit, today: string = todayISO()): { from: string; to: string | null } | null {
  return h.pauses.find((p) => p.from <= today && (p.to === null || today <= p.to)) ?? null;
}

/** A pausa acabou ontem: "voltou hoje". */
export const resumedToday = (h: Habit, today: string = todayISO()): boolean => h.pauses.some((p) => p.to === addDays(today, -1));

/** Pausar a partir de hoje, até o dia anterior a `until` (null = sem data). */
export function pauseHabit(id: string, today: string, until: string | null) {
  return (d: AppData): AppData => ({
    ...d,
    habits: d.habits.map((h) =>
      h.id === id && h.kind !== 'abandonar' && !currentPause(h, today)
        ? { ...h, pauses: [...h.pauses, { from: today, to: until && until > today ? addDays(until, -1) : null }] }
        : h,
    ),
  });
}

/** Retomar agora: a pausa termina ontem (se começou hoje, é desfeita). */
export function resumeHabit(id: string, today: string) {
  return (d: AppData): AppData => ({
    ...d,
    habits: d.habits.map((h) => {
      if (h.id !== id) return h;
      const pauses = h.pauses
        .map((p) => (p.from <= today && (p.to === null || today <= p.to) ? { ...p, to: addDays(today, -1) } : p))
        .filter((p) => p.to === null || p.to >= p.from);
      return { ...h, pauses };
    }),
  });
}

/** Arquivar (sai de tudo, histórico fica) ou restaurar. */
export function archiveHabit(id: string, today: string | null) {
  return (d: AppData): AppData => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, archivedAt: today } : h)) });
}

/** Hábitos ativos: nem arquivados (pausados continuam na lista, numa seção própria). */
export const activeHabits = (habits: Habit[], today: string = todayISO()) => habits.filter((h) => !isArchived(h, today));

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
  if (h.archivedAt && h.archivedAt < today) today = h.archivedAt;
  const slips = h.slips.filter((d) => d <= today).sort();
  const from = slips.length ? slips[slips.length - 1] : h.startDate;
  return Math.max(0, diffDays(from, today));
}

/** Maior período sem recaída. */
export function bestClean(h: Habit, today: string = todayISO()): number {
  if (h.archivedAt && h.archivedAt < today) today = h.archivedAt;
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
    quitting: habits.filter((h) => h.kind === 'abandonar' && !isArchived(h, day) && h.startDate <= day),
  };
}

// ---------- Atributos (para a Jornada) ----------

export interface Attribute {
  code: string;
  name: string;
  color: string;
  /** Pedaços de palavras (sem acento) que sugerem este atributo pelo nome do hábito. */
  words: string[];
}

export const ATTRIBUTES: Attribute[] = [
  { code: 'FOR', name: 'Força', color: '#f87171', words: ['academia', 'muscul', 'treino', 'flexao', 'forca', 'peso', 'crossfit', 'correr', 'corrida'] },
  { code: 'AGI', name: 'Agilidade', color: '#38bdf8', words: ['correr', 'corrida', 'caminh', 'bike', 'pedal', 'alongar', 'alongamento', 'yoga', 'danca', 'futebol', 'nadar', 'natacao'] },
  { code: 'INT', name: 'Inteligência', color: '#a78bfa', words: ['ler', 'leitura', 'estud', 'curso', 'ingles', 'idioma', 'livro', 'aprender', 'pagina', 'aula'] },
  { code: 'RES', name: 'Resistência', color: '#60a5fa', words: ['agua', 'dormir', 'sono', 'fruta', 'salada', 'vitamina', 'nadar', 'correr', 'refrigerante', 'acucar', 'alimenta'] },
  { code: 'SAB', name: 'Sabedoria', color: '#e879f9', words: ['meditar', 'meditacao', 'diario', 'orar', 'oracao', 'gratidao', 'refletir', 'respirar', 'terapia'] },
  { code: 'DIS', name: 'Disciplina', color: '#4ade80', words: ['arrumar', 'cama', 'organizar', 'conta', 'acordar', 'planejar', 'fio dental', 'limpar', 'celular', 'rede social', 'fumar', 'cigarro'] },
];

const plain = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Sugere atributos pelo nome (ex.: "Correr 3 km" → FOR, AGI, RES). */
export function suggestAttributes(name: string): string[] {
  const n = plain(name);
  return ATTRIBUTES.filter((a) => a.words.some((w) => n.includes(w))).map((a) => a.code);
}

/** Dias cumpridos por atributo num período (hábitos a abandonar contam os dias sem recaída). */
export function attributeTotals(habits: Habit[], from: string, to: string): { code: string; name: string; color: string; points: number }[] {
  const pts = new Map<string, number>();
  for (const h of habits) {
    if (!h.attrs.length) continue;
    let n = 0;
    if (h.kind === 'abandonar') {
      for (let d = from > h.startDate ? from : h.startDate; d <= to; d = addDays(d, 1)) if (!h.slips.includes(d)) n++;
    } else {
      n = new Set(h.checks.filter((c) => c >= from && c <= to)).size;
    }
    // +3 quando o hábito treina um só atributo; +2 em cada quando treina mais de um.
    const each = h.attrs.length === 1 ? 3 : 2;
    for (const a of h.attrs) pts.set(a, (pts.get(a) ?? 0) + n * each);
  }
  return ATTRIBUTES.map((a) => ({ code: a.code, name: a.name, color: a.color, points: pts.get(a.code) ?? 0 }))
    .filter((a) => a.points > 0)
    .sort((a, b) => b.points - a.points);
}

// ---------- Metas com quantidade ----------

export const isQuantity = (h: Habit) => h.goal !== null && h.goal > 0;
export const amountOn = (h: Habit, day: string) => h.amounts[day] ?? 0;

/** "1.250" / "2" — números no formato brasileiro, sem casas desnecessárias. */
export const fmtQty = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

// ---------- Nunca falhe duas vezes ----------

/** Último dia programado antes de `day` (até 14 dias para trás), dentro do período do hábito. */
export function lastScheduledBefore(h: Habit, day: string): string | null {
  const start = startOf(h);
  for (let i = 1; i <= 14; i++) {
    const d = addDays(day, -i);
    if (d < start) return null;
    if (isScheduled(h, d)) return d;
  }
  return null;
}

/**
 * Falhou no último dia programado e hoje ainda não fez: hoje é o dia de "não falhar duas vezes".
 * Uma falha é normal; duas seguidas é o começo de um novo padrão.
 */
export function atRiskToday(h: Habit, today: string = todayISO()): boolean {
  if (!isScheduled(h, today) || h.checks.includes(today)) return false;
  const prev = lastScheduledBefore(h, today);
  return prev !== null && !h.checks.includes(prev);
}

// ---------- Atualizações ----------

/** Registra a quantidade do dia; o dia conta como feito quando atinge a meta. */
export function setAmount(id: string, day: string, value: number) {
  return (d: AppData): AppData => ({
    ...d,
    habits: d.habits.map((h) => {
      if (h.id !== id || h.goal === null) return h;
      const v = Math.max(0, Math.round(value * 100) / 100);
      const amounts = { ...h.amounts };
      if (v > 0) amounts[day] = v;
      else delete amounts[day];
      const reached = v >= h.goal;
      const checks = reached ? (h.checks.includes(day) ? h.checks : [...h.checks, day].sort()) : h.checks.filter((c) => c !== day);
      return { ...h, amounts, checks };
    }),
  });
}

export function toggleCheck(id: string, day: string) {
  return (d: AppData): AppData => {
    const h = d.habits.find((x) => x.id === id);
    if (h && h.goal !== null) return setAmount(id, day, h.checks.includes(day) ? 0 : h.goal)(d);
    return {
      ...d,
      habits: d.habits.map((x) =>
        x.id !== id ? x : { ...x, checks: x.checks.includes(day) ? x.checks.filter((c) => c !== day) : [...x.checks, day].sort() },
      ),
    };
  };
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
