/**
 * Saúde › Consultas, exames e check-ups (N1.4) e Peso e medidas (N1.5): regras puras.
 * - Consulta com data entra na Agenda sozinha (como Carreira) e se atualiza; some se for apagada ou feita.
 * - Check-up que se repete: intervalo em meses. Ao marcar uma consulta como feita, a "última vez" anda.
 *   Quando vence e não há consulta marcada, aparece "Marcar: …" na Agenda no dia previsto.
 * - Peso e medidas: escondidos por padrão; nunca dão recompensa na Jornada.
 * O app só registra: nada de diagnóstico.
 */
import type { AppData, Appointment, ApptKind, BodyData, BodyEntry, CalendarEvent, CheckupRoutine } from './types.ts';
import { addDays } from './utils.ts';

export const APPT_KINDS: { id: ApptKind; label: string; icon: string; emoji: string; months: number; hint: string }[] = [
  { id: 'consulta', label: 'Consulta', icon: 'stethoscope', emoji: '🩺', months: 12, hint: 'Especialidade (ex.: Cardiologista)' },
  { id: 'dentista', label: 'Dentista', icon: 'tooth', emoji: '🦷', months: 6, hint: 'Motivo (ex.: Limpeza)' },
  { id: 'exame', label: 'Exame', icon: 'flask', emoji: '🧪', months: 12, hint: 'Exame (ex.: Hemograma)' },
  { id: 'checkup', label: 'Check-up', icon: 'heartPulse', emoji: '🩺', months: 12, hint: 'Ex.: Check-up anual' },
  { id: 'outro', label: 'Outro', icon: 'calendar', emoji: '📅', months: 12, hint: 'O que é' },
];
export const kindInfo = (k: ApptKind) => APPT_KINDS.find((x) => x.id === k) ?? APPT_KINDS[0];

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown) => (typeof x === 'string' ? x : '');
const isKind = (x: unknown): x is ApptKind => APPT_KINDS.some((k) => k.id === x);

export function normalizeAppts(raw: unknown): Appointment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a): a is Rec => isRec(a) && typeof a.id === 'string' && a.id !== '')
    .map((a) => ({
      id: a.id as string,
      kind: isKind(a.kind) ? a.kind : 'consulta',
      title: str(a.title),
      who: str(a.who),
      place: str(a.place),
      date: DAY.test(str(a.date)) ? str(a.date) : null,
      time: HHMM.test(str(a.time)) ? str(a.time) : '',
      bring: str(a.bring),
      notes: str(a.notes),
      done: a.done === true,
      result: str(a.result),
      routineId: typeof a.routineId === 'string' && a.routineId ? a.routineId : null,
      createdAt: str(a.createdAt),
    }));
}

export function normalizeRoutines(raw: unknown): CheckupRoutine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Rec => isRec(r) && typeof r.id === 'string' && r.id !== '')
    .map((r) => ({
      id: r.id as string,
      label: str(r.label) || 'Check-up',
      kind: isKind(r.kind) ? r.kind : 'checkup',
      months: Number.isInteger(r.months) && (r.months as number) >= 1 && (r.months as number) <= 120 ? (r.months as number) : 12,
      last: DAY.test(str(r.last)) ? str(r.last) : null,
    }));
}

export function newAppt(id: string, kind: ApptKind, createdAt: string, extra: Partial<Appointment> = {}): Appointment {
  return { id, kind, title: '', who: '', place: '', date: null, time: '', bring: '', notes: '', done: false, result: '', routineId: null, createdAt, ...extra };
}

/** Título curto: "Dentista: Limpeza", "Exame: Hemograma", "Cardiologista". */
export function apptTitle(a: Pick<Appointment, 'kind' | 'title'>): string {
  const k = kindInfo(a.kind);
  const t = a.title.trim();
  if (a.kind === 'consulta') return t || 'Consulta';
  return t ? `${k.label}: ${t}` : k.label;
}

// ---------- Agenda automática ----------

/** O que a Saúde coloca na Agenda: consultas marcadas (não feitas) e check-ups vencendo sem consulta marcada. */
export function healthEvents(d: Pick<AppData, 'health'>, today: string): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const a of d.health.appts) {
    if (a.done || !a.date) continue;
    out.push({ id: `sau-c-${a.id}`, title: `${kindInfo(a.kind).emoji} ${apptTitle(a)}`, date: a.date, time: a.time, location: a.place, description: [a.who && `Com: ${a.who}`, a.bring && `Levar: ${a.bring}`].filter(Boolean).join('\n'), origin: `saude/abrir-c-${a.id}` });
  }
  for (const r of d.health.routines) {
    const st = routineStatus(d, r, today);
    if (st.state === 'marcado' || !st.due) continue;
    out.push({ id: `sau-r-${r.id}`, title: `Marcar: ${r.label}`, date: st.due < today ? today : st.due, time: '', location: '', description: 'Check-up que se repete (Saúde)', origin: `saude/abrir-r-${r.id}` });
  }
  return out;
}

/** Deixa a Agenda igual à Saúde (cria, atualiza e tira). Sem mudança, devolve o mesmo objeto. */
export function syncHealthEvents(d: AppData, today: string): AppData {
  if (!d.health) return d;
  const want = healthEvents(d, today);
  const byId = new Map(want.map((e) => [e.id, e]));
  let changed = false;
  const kept = d.events.flatMap((e) => {
    const w = byId.get(e.id);
    if (!w) {
      if (e.origin?.startsWith('saude/')) {
        changed = true;
        return [];
      }
      return [e];
    }
    byId.delete(e.id);
    if (e.title === w.title && e.date === w.date && e.time === w.time && e.location === w.location && e.description === w.description && e.origin === w.origin) return [e];
    changed = true;
    return [w];
  });
  if (byId.size) changed = true;
  return changed ? { ...d, events: [...kept, ...byId.values()] } : d;
}

// ---------- Consultas ----------

export function saveAppt(a: Appointment, today: string) {
  return (d: AppData): AppData => {
    const appts = d.health.appts.some((x) => x.id === a.id) ? d.health.appts.map((x) => (x.id === a.id ? a : x)) : [...d.health.appts, a];
    return syncHealthEvents(syncRoutineLast({ ...d, health: { ...d.health, appts } }), today);
  };
}

export function removeAppt(id: string, today: string) {
  return (d: AppData): AppData => syncHealthEvents(syncRoutineLast({ ...d, health: { ...d.health, appts: d.health.appts.filter((a) => a.id !== id) } }), today);
}

/** "Última vez" de cada check-up = a consulta feita mais recente ligada a ele (sem apagar uma data maior escrita à mão). */
function syncRoutineLast(d: AppData): AppData {
  const routines = d.health.routines.map((r) => {
    const done = d.health.appts.filter((a) => a.routineId === r.id && a.done && a.date).map((a) => a.date!).sort();
    const last = done[done.length - 1] ?? null;
    return last && (!r.last || last > r.last) ? { ...r, last } : r;
  });
  return { ...d, health: { ...d.health, routines } };
}

/** Marcadas (com data, não feitas), a marcar (sem data) e feitas (mais recentes primeiro). */
export function splitAppts(d: Pick<AppData, 'health'>) {
  const list = d.health.appts;
  const key = (a: Appointment) => `${a.date ?? '9999'} ${a.time || '99'}`;
  return {
    scheduled: list.filter((a) => !a.done && a.date).sort((a, b) => key(a).localeCompare(key(b))),
    toSchedule: list.filter((a) => !a.done && !a.date),
    done: list.filter((a) => a.done).sort((a, b) => key(b).localeCompare(key(a))),
  };
}

/** Retorno: nova consulta igual (mesmo tipo, título, profissional e local), na data dada ou a marcar. */
export function followUp(a: Appointment, id: string, date: string | null, createdAt: string): Appointment {
  return newAppt(id, a.kind, createdAt, { title: a.title, who: a.who, place: a.place, date, routineId: a.routineId });
}

/** Pedidos de exame: cada linha vira um exame "a marcar". */
export function examRequests(text: string, ids: () => string, createdAt: string): Appointment[] {
  return text
    .split('\n')
    .map((l) => l.replace(/^[-•*\s]+/, '').trim())
    .filter(Boolean)
    .map((title) => newAppt(ids(), 'exame', createdAt, { title }));
}

// ---------- Check-ups que se repetem ----------

export function addMonthsISO(day: string, months: number): string {
  const [y, m, dd] = day.split('-').map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const d = Math.min(dd, last);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export type RoutineState = 'marcado' | 'atrasado' | 'perto' | 'ok' | 'sem-data';

export function routineStatus(d: Pick<AppData, 'health'>, r: CheckupRoutine, today: string): { state: RoutineState; due: string | null; booked: Appointment | null } {
  const booked = d.health.appts.find((a) => a.routineId === r.id && !a.done && a.date && a.date >= today) ?? null;
  const due = r.last ? addMonthsISO(r.last, r.months) : null;
  if (booked) return { state: 'marcado', due, booked };
  if (!due) return { state: 'sem-data', due: null, booked: null };
  if (due < today) return { state: 'atrasado', due, booked: null };
  if (due <= addDays(today, 30)) return { state: 'perto', due, booked: null };
  return { state: 'ok', due, booked: null };
}

export function saveRoutine(r: CheckupRoutine, today: string) {
  return (d: AppData): AppData => {
    const routines = d.health.routines.some((x) => x.id === r.id) ? d.health.routines.map((x) => (x.id === r.id ? r : x)) : [...d.health.routines, r];
    return syncHealthEvents({ ...d, health: { ...d.health, routines } }, today);
  };
}

export function removeRoutine(id: string, today: string) {
  return (d: AppData): AppData =>
    syncHealthEvents({ ...d, health: { ...d.health, routines: d.health.routines.filter((r) => r.id !== id), appts: d.health.appts.map((a) => (a.routineId === id ? { ...a, routineId: null } : a)) } }, today);
}

/** Ao marcar como feita: se não tem check-up ligado, sugere repetir (intervalo padrão do tipo). */
export function suggestRoutine(a: Appointment, id: string): CheckupRoutine | null {
  if (a.routineId || !a.date) return null;
  return { id, label: a.kind === 'consulta' ? a.title.trim() || 'Consulta' : kindInfo(a.kind).label, kind: a.kind, months: kindInfo(a.kind).months, last: a.date };
}

/** "6 meses", "1 ano", "2 anos", "18 meses". */
export function intervalText(months: number): string {
  if (months % 12 === 0) return months === 12 ? '1 ano' : `${months / 12} anos`;
  return months === 1 ? '1 mês' : `${months} meses`;
}

// ---------- Peso e medidas (N1.5) ----------

export const DEFAULT_FIELDS = [{ name: 'Peso', unit: 'kg' }, { name: 'Cintura', unit: 'cm' }];

export function emptyBody(): BodyData {
  return { show: false, fields: DEFAULT_FIELDS.map((f) => ({ ...f })), entries: [] };
}

export function normalizeBody(raw: unknown): BodyData {
  if (!isRec(raw)) return emptyBody();
  const fields = Array.isArray(raw.fields)
    ? raw.fields.filter((f): f is Rec => isRec(f) && typeof f.name === 'string' && f.name.trim() !== '').map((f) => ({ name: (f.name as string).trim(), unit: str(f.unit) }))
    : [];
  const uniq = fields.filter((f, i) => fields.findIndex((x) => x.name.toLowerCase() === f.name.toLowerCase()) === i);
  const entries: BodyEntry[] = Array.isArray(raw.entries)
    ? raw.entries
        .filter((e): e is Rec => isRec(e) && typeof e.id === 'string' && DAY.test(str(e.date)) && isRec(e.values))
        .map((e) => ({ id: e.id as string, date: e.date as string, values: Object.fromEntries(Object.entries(e.values as Rec).filter((v): v is [string, number] => typeof v[1] === 'number' && Number.isFinite(v[1]) && v[1] > 0)) }))
        .filter((e) => Object.keys(e.values).length > 0)
    : [];
  return { show: raw.show === true, fields: uniq.length ? uniq : emptyBody().fields, entries };
}

export function setBodyShow(show: boolean) {
  return (d: AppData): AppData => ({ ...d, health: { ...d.health, body: { ...d.health.body, show } } });
}

export function addBodyField(name: string, unit: string) {
  return (d: AppData): AppData => {
    const n = name.trim();
    if (!n || d.health.body.fields.some((f) => f.name.toLowerCase() === n.toLowerCase())) return d;
    return { ...d, health: { ...d.health, body: { ...d.health.body, fields: [...d.health.body.fields, { name: n, unit: unit.trim() }] } } };
  };
}

/** Salva uma medição (só os valores preenchidos). Sem nenhum valor, não salva. */
export function saveBodyEntry(e: BodyEntry) {
  return (d: AppData): AppData => {
    const values = Object.fromEntries(Object.entries(e.values).filter(([, v]) => Number.isFinite(v) && v > 0));
    if (!Object.keys(values).length || !DAY.test(e.date)) return d;
    const clean = { ...e, values };
    const list = d.health.body.entries;
    const entries = list.some((x) => x.id === e.id) ? list.map((x) => (x.id === e.id ? clean : x)) : [...list, clean];
    return { ...d, health: { ...d.health, body: { ...d.health.body, entries } } };
  };
}

export function removeBodyEntry(id: string) {
  return (d: AppData): AppData => ({ ...d, health: { ...d.health, body: { ...d.health.body, entries: d.health.body.entries.filter((e) => e.id !== id) } } });
}

/** Série de um campo, da medição mais antiga para a mais nova (para o gráfico). */
export function bodySeries(b: BodyData, field: string): { date: string; value: number }[] {
  return b.entries
    .filter((e) => typeof e.values[field] === 'number')
    .map((e) => ({ date: e.date, value: e.values[field] }))
    .sort((a, b2) => a.date.localeCompare(b2.date));
}

/** Último valor e a diferença para o anterior (sem julgar se é bom ou ruim). */
export function bodyLatest(b: BodyData, field: string): { value: number; date: string; diff: number | null } | null {
  const s = bodySeries(b, field);
  if (!s.length) return null;
  const last = s[s.length - 1];
  const prev = s[s.length - 2];
  return { value: last.value, date: last.date, diff: prev ? Math.round((last.value - prev.value) * 10) / 10 : null };
}
