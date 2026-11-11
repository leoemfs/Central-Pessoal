/**
 * Humor do dia: um toque no Início, com o que pesou ou ajudou e uma anotação que vai para o Diário.
 * A Revisão semanal mostra a semana e cruza o humor com os treinos e as etiquetas.
 */
import type { AppData, JournalEntry, MoodEntry } from './types.ts';
import { addDays, todayISO, uid } from './utils.ts';

export const MOODS: { v: MoodEntry['v']; emoji: string; label: string }[] = [
  { v: 1, emoji: '😞', label: 'Mal' },
  { v: 2, emoji: '😕', label: 'Mais ou menos' },
  { v: 3, emoji: '😐', label: 'Ok' },
  { v: 4, emoji: '🙂', label: 'Bem' },
  { v: 5, emoji: '😄', label: 'Ótimo' },
];
export const MOOD_TAGS = ['Trabalho', 'Sono', 'Família', 'Exercício', 'Dinheiro', 'Saúde', 'Amigos', 'Tempo livre'];
export const moodInfo = (v: number) => MOODS[Math.min(5, Math.max(1, v)) - 1];

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);

export function normalizeMoods(raw: unknown): Record<string, MoodEntry> {
  if (!isRec(raw)) return {};
  const out: Record<string, MoodEntry> = {};
  for (const [day, m] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isRec(m) || typeof m.v !== 'number' || m.v < 1 || m.v > 5) continue;
    out[day] = {
      v: Math.round(m.v) as MoodEntry['v'],
      tags: Array.isArray(m.tags) ? m.tags.filter((t): t is string => typeof t === 'string') : [],
      note: typeof m.note === 'string' ? m.note : '',
      journalId: typeof m.journalId === 'string' ? m.journalId : null,
    };
  }
  return out;
}

/** Escolhe (ou troca) o humor do dia. Se já havia anotação no Diário, o título acompanha. */
export function setMood(v: MoodEntry['v'], day: string = todayISO()) {
  return (d: AppData): AppData => {
    const cur = d.moods[day];
    const next: AppData = { ...d, moods: { ...d.moods, [day]: { v, tags: cur?.tags ?? [], note: cur?.note ?? '', journalId: cur?.journalId ?? null } } };
    return cur?.journalId ? syncJournal(next, day) : next;
  };
}

export function clearMood(day: string = todayISO()) {
  return (d: AppData): AppData => {
    const moods = { ...d.moods };
    delete moods[day];
    return { ...d, moods };
  };
}

export function toggleMoodTag(tag: string, day: string = todayISO()) {
  return (d: AppData): AppData => {
    const m = d.moods[day];
    if (!m) return d;
    const tags = m.tags.includes(tag) ? m.tags.filter((t) => t !== tag) : [...m.tags, tag];
    const next = { ...d, moods: { ...d.moods, [day]: { ...m, tags } } };
    return m.journalId ? syncJournal(next, day) : next;
  };
}

/** Anotação do humor: cria (ou atualiza) um registro no Diário com a etiqueta "Humor". */
export function setMoodNote(note: string, day: string = todayISO()) {
  return (d: AppData): AppData => {
    const m = d.moods[day];
    if (!m) return d;
    const text = note.trim();
    if (!text && !m.journalId) return { ...d, moods: { ...d.moods, [day]: { ...m, note: '' } } };
    return syncJournal({ ...d, moods: { ...d.moods, [day]: { ...m, note: text } } }, day);
  };
}

function syncJournal(d: AppData, day: string): AppData {
  const m = d.moods[day];
  const info = moodInfo(m.v);
  const title = `${info.emoji} ${info.label}`;
  const summary = m.tags.join(' · ');
  const existing = m.journalId ? d.journal.find((j) => j.id === m.journalId) : undefined;
  if (!m.note && existing) {
    // Apagou a anotação: some o registro do Diário.
    return { ...d, journal: d.journal.filter((j) => j.id !== existing.id), moods: { ...d.moods, [day]: { ...m, journalId: null } } };
  }
  if (!m.note) return d;
  const now = new Date().toISOString();
  if (existing) {
    return { ...d, journal: d.journal.map((j) => (j.id === existing.id ? { ...j, title, summary, content: m.note, updatedAt: now } : j)) };
  }
  const created = day === todayISO() ? now : `${day}T20:00:00`;
  const entry: JournalEntry = { id: uid(), createdAt: created, title, summary, content: m.note, tag: 'Humor', photos: [], updatedAt: now };
  return { ...d, journal: [entry, ...d.journal], moods: { ...d.moods, [day]: { ...m, journalId: entry.id } } };
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** A semana (segunda a domingo) com o humor de cada dia e a média. */
export function weekMood(d: AppData, start: string) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((day) => ({ day, mood: d.moods[day] ?? null }));
  return { days, avg: avg(days.filter((x) => x.mood).map((x) => x.mood!.v)) };
}

/** O que o app percebe nas últimas 2 semanas: humor com e sem treino e as etiquetas dos dias bons e difíceis. */
export function moodInsights(d: AppData, today: string = todayISO(), span = 14) {
  const days = Array.from({ length: span }, (_, i) => addDays(today, -i)).filter((day) => d.moods[day]);
  const trained = new Set(d.sessions.filter((s) => s.type === 'treino' || s.type === 'caminhada').map((s) => s.date));
  const withT = days.filter((day) => trained.has(day)).map((day) => d.moods[day].v);
  const noT = days.filter((day) => !trained.has(day)).map((day) => d.moods[day].v);
  const count = (filter: (v: number) => boolean) => {
    const m = new Map<string, number>();
    for (const day of days) if (filter(d.moods[day].v)) for (const t of d.moods[day].tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };
  return {
    days: days.length,
    withTraining: withT.length >= 2 && noT.length >= 2 ? { yes: avg(withT)!, no: avg(noT)! } : null,
    goodTag: count((v) => v >= 4),
    hardTag: count((v) => v <= 2),
  };
}
