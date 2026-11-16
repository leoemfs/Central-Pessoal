/**
 * Saúde › Remédios (N1.3): regras puras.
 * - Cada remédio tem dose (texto livre), horários, dias da semana e período (fim vazio = uso contínuo).
 * - "Tomei" é marcado por dose (remédio + horário) em cada dia, com a hora em que marcou.
 * - Hábito ligado ("Tomar remédio"): marcado sozinho quando todas as doses do dia foram tomadas.
 * O app só registra: nada de dose sugerida nem conselho médico.
 */
import type { AppData, Habit, Medicine } from './types.ts';
import { addDays } from './utils.ts';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown) => (typeof x === 'string' ? x : '');

export function normalizeMed(raw: Rec): Medicine {
  const times = Array.isArray(raw.times) ? [...new Set(raw.times.filter((t): t is string => typeof t === 'string' && HHMM.test(t)))].sort() : [];
  const days = Array.isArray(raw.days) ? [...new Set(raw.days.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 6))].sort() : [];
  const start = DAY.test(str(raw.start)) ? str(raw.start) : str(raw.createdAt).slice(0, 10) || '2000-01-01';
  return {
    id: str(raw.id),
    name: str(raw.name) || 'Remédio',
    dose: str(raw.dose),
    times: times.length ? times : ['08:00'],
    days: days.length ? days : [...ALL_DAYS],
    start,
    end: DAY.test(str(raw.end)) ? str(raw.end) : null,
    notes: str(raw.notes),
    remind: raw.remind !== false,
    createdAt: str(raw.createdAt),
  };
}

export function normalizeMeds(raw: unknown): Medicine[] {
  return Array.isArray(raw) ? raw.filter((m): m is Rec => isRec(m) && typeof m.id === 'string' && m.id !== '').map(normalizeMed) : [];
}

export function normalizeTaken(raw: unknown): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  if (!isRec(raw)) return out;
  for (const [day, v] of Object.entries(raw)) {
    if (!DAY.test(day) || !isRec(v)) continue;
    const m = Object.fromEntries(Object.entries(v).filter((e): e is [string, string] => e[0].includes('@') && typeof e[1] === 'string' && HHMM.test(e[1])));
    if (Object.keys(m).length) out[day] = m;
  }
  return out;
}

export function newMed(id: string, today: string, createdAt: string): Medicine {
  return { id, name: '', dose: '', times: ['08:00'], days: [...ALL_DAYS], start: today, end: null, notes: '', remind: true, createdAt };
}

// ---------- Editar ----------

export function saveMed(m: Medicine) {
  return (d: AppData): AppData => {
    const clean = normalizeMed(m as unknown as Rec);
    const meds = d.health.meds.some((x) => x.id === m.id) ? d.health.meds.map((x) => (x.id === m.id ? clean : x)) : [...d.health.meds, clean];
    return { ...d, health: { ...d.health, meds } };
  };
}

/** Apaga o remédio (sai do Hoje e do Histórico). Para guardar o histórico, encerrar com `endMed`. */
export function removeMed(id: string) {
  return (d: AppData): AppData => ({ ...d, health: { ...d.health, meds: d.health.meds.filter((m) => m.id !== id) } });
}

/** Encerrar o tratamento hoje: deixa de aparecer a partir de amanhã. */
export function endMed(id: string, today: string) {
  return (d: AppData): AppData => ({ ...d, health: { ...d.health, meds: d.health.meds.map((m) => (m.id === id ? { ...m, end: today } : m)) } });
}

// ---------- O dia ----------

const dow = (day: string) => new Date(`${day}T12:00:00`).getDay();

export function isActiveOn(m: Medicine, day: string): boolean {
  return day >= m.start && (m.end === null || day <= m.end) && m.days.includes(dow(day));
}

export const doseKey = (medId: string, time: string) => `${medId}@${time}`;

export interface Dose {
  med: Medicine;
  time: string;
  key: string;
  /** Hora em que marcou "tomei"; null = ainda não. */
  taken: string | null;
}

/** Doses do dia em ordem de horário. */
export function dosesOn(d: Pick<AppData, 'health'>, day: string): Dose[] {
  const taken = d.health.taken[day] ?? {};
  return d.health.meds
    .filter((m) => isActiveOn(m, day))
    .flatMap((m) => m.times.map((time) => ({ med: m, time, key: doseKey(m.id, time), taken: taken[doseKey(m.id, time)] ?? null })))
    .sort((a, b) => a.time.localeCompare(b.time) || a.med.name.localeCompare(b.med.name, 'pt-BR'));
}

/** Todas as doses do dia tomadas (e havia pelo menos uma). */
export function allTaken(d: Pick<AppData, 'health'>, day: string): boolean {
  const ds = dosesOn(d, day);
  return ds.length > 0 && ds.every((x) => x.taken !== null);
}

/** Hábito ligado: marca o dia quando todas as doses foram tomadas; desmarca se alguma for desmarcada. */
function syncHabit(d: AppData, day: string): AppData {
  const id = d.health.medsHabitId;
  if (!id) return d;
  const done = allTaken(d, day);
  return {
    ...d,
    habits: d.habits.map((h) => {
      if (h.id !== id) return h;
      const has = h.checks.includes(day);
      if (done === has) return h;
      return { ...h, checks: done ? [...h.checks, day].sort() : h.checks.filter((c) => c !== day) };
    }),
  };
}

/** "Tomei" (ou desfazer). `at` = hora em que marcou. */
export function toggleTaken(day: string, medId: string, time: string, at: string) {
  return (d: AppData): AppData => {
    const key = doseKey(medId, time);
    const dayMap = { ...(d.health.taken[day] ?? {}) };
    if (dayMap[key]) delete dayMap[key];
    else dayMap[key] = HHMM.test(at) ? at : time;
    const taken = { ...d.health.taken };
    if (Object.keys(dayMap).length) taken[day] = dayMap;
    else delete taken[day];
    return syncHabit({ ...d, health: { ...d.health, taken } }, day);
  };
}

// ---------- Hábito ligado ----------

/** Hábito que parece de remédio (para oferecer a ligação): sem meta de quantidade e com remédio/vitamina no nome. */
export function medHabitCandidate(habits: Habit[]): Habit | null {
  const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return habits.find((h) => h.archivedAt === null && h.goal === null && h.kind !== 'abandonar' && /remedio|medicamento|vitamina|suplemento|comprimido/.test(plain(h.name))) ?? null;
}

export function medsHabit(d: Pick<AppData, 'health' | 'habits'>): Habit | null {
  const id = d.health.medsHabitId;
  return id ? (d.habits.find((h) => h.id === id) ?? null) : null;
}

/** Liga o hábito e já marca os dias em que todas as doses foram tomadas. */
export function linkMedsHabit(habitId: string | null) {
  return (d: AppData): AppData => {
    let next: AppData = { ...d, health: { ...d.health, medsHabitId: habitId } };
    if (habitId) for (const day of Object.keys(d.health.taken)) next = syncHabit(next, day);
    return next;
  };
}

// ---------- Resumos ----------

/** Doses previstas e tomadas num período (até `to`, inclusive). */
export function medCount(d: Pick<AppData, 'health'>, from: string, to: string): { planned: number; taken: number; fullDays: number } {
  let planned = 0, taken = 0, fullDays = 0;
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const ds = dosesOn(d, day);
    planned += ds.length;
    const t = ds.filter((x) => x.taken !== null).length;
    taken += t;
    if (ds.length && t === ds.length) fullDays++;
  }
  return { planned, taken, fullDays };
}

/** Jornada: dias com todas as doses tomadas (sem hábito ligado; com hábito, já conta pelo hábito). */
export function medFullDays(d: Pick<AppData, 'health'>, from: string, to: string): number {
  if (!d.health || d.health.medsHabitId) return 0;
  const days = Object.keys(d.health.taken).filter((day) => day >= from && day <= to);
  return days.filter((day) => allTaken(d, day)).length;
}

/** "08:00 e 20:00" / "todo dia" / "seg, qua e sex". */
export function daysText(days: number[]): string {
  if (days.length === 7) return 'todo dia';
  const n = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const l = days.map((x) => n[x]);
  return l.length > 1 ? `${l.slice(0, -1).join(', ')} e ${l[l.length - 1]}` : (l[0] ?? 'nenhum dia');
}

export function timesText(times: string[]): string {
  return times.length > 1 ? `${times.slice(0, -1).join(', ')} e ${times[times.length - 1]}` : (times[0] ?? '');
}
