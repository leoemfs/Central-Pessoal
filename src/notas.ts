/**
 * M17: Notas e Banco de ideias. Uma ideia é uma nota com `kind: 'ideia'`.
 * Telas: Notas (só notas, fichas de categoria) · Ideias (situação e etiqueta) · Arquivados.
 */
import type { Note, NoteKind, IdeaStatus } from './types.ts';

export const DEFAULT_NOTE_CATEGORIES = ['Inspiração', 'Ideia solta', 'Lembrete', 'Trabalho'];
export const DEFAULT_IDEA_TAGS = ['App', 'Pessoal', 'Trabalho', 'Casa'];
export const IDEA_STATUSES: { value: IdeaStatus; label: string; group: string }[] = [
  { value: 'nova', label: 'Nova', group: 'Novas' },
  { value: 'pensando', label: 'Pensando', group: 'Pensando' },
  { value: 'guardada', label: 'Guardada', group: 'Guardadas' },
];

/** Lista de nomes limpa: sem vazios, sem repetidos (ignorando maiúsculas), até 30 caracteres. */
export function cleanNames(raw: unknown, fallback: string[]): string[] {
  if (!Array.isArray(raw)) return [...fallback];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== 'string') continue;
    const name = x.trim().slice(0, 30);
    if (name && !out.some((o) => o.toLowerCase() === name.toLowerCase())) out.push(name);
  }
  return out;
}

export function newNote(id: string, kind: NoteKind, now: string, extra: Partial<Note> = {}): Note {
  return { id, title: '', content: '', pinned: false, updatedAt: now, kind, category: '', status: 'nova', archived: false, ...extra };
}

export const isBlankNote = (n: Note) => !n.title.trim() && !n.content.trim();

const byPinThenDate = (a: Note, b: Note) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt);

/** Notas à vista (não arquivadas), filtradas pela categoria ('' = todas). */
export function visibleNotes(notes: Note[], category = ''): Note[] {
  return notes.filter((n) => n.kind === 'nota' && !n.archived && (!category || n.category === category)).sort(byPinThenDate);
}

/** Quantas notas à vista há em cada categoria. */
export function categoryCounts(notes: Note[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of notes) if (n.kind === 'nota' && !n.archived && n.category) out[n.category] = (out[n.category] ?? 0) + 1;
  return out;
}

/** Ideias à vista, separadas por situação (só os grupos com algo). */
export function ideaGroups(notes: Note[], tag = ''): { status: IdeaStatus; label: string; items: Note[] }[] {
  const ideas = notes.filter((n) => n.kind === 'ideia' && !n.archived && (!tag || n.category === tag)).sort(byPinThenDate);
  return IDEA_STATUSES.map((s) => ({ status: s.value, label: s.group, items: ideas.filter((n) => n.status === s.value) })).filter((g) => g.items.length);
}

/** Arquivados: ideias primeiro, depois notas, os mais recentes antes. */
export function archived(notes: Note[]): { ideas: Note[]; notes: Note[] } {
  const all = notes.filter((n) => n.archived).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { ideas: all.filter((n) => n.kind === 'ideia'), notes: all.filter((n) => n.kind === 'nota') };
}

/** Tela onde a nota mora (para abrir pela busca). */
export const noteSection = (n: Note): string => (n.archived ? 'notasarq' : n.kind === 'ideia' ? 'ideias' : 'arquivo');

/** Trocar nota ↔ ideia: a categoria não serve na outra lista, então sai. */
export function switchKind(n: Note, now: string): Note {
  return { ...n, kind: n.kind === 'nota' ? 'ideia' : 'nota', category: '', status: 'nova', updatedAt: now };
}

/** Apagar uma categoria (ou etiqueta) tira ela das notas daquele tipo. */
export function dropCategory(notes: Note[], kind: NoteKind, name: string): Note[] {
  return notes.map((n) => (n.kind === kind && n.category === name ? { ...n, category: '' } : n));
}

/** Renomear uma categoria leva as notas junto. */
export function renameCategory(notes: Note[], kind: NoteKind, from: string, to: string): Note[] {
  return notes.map((n) => (n.kind === kind && n.category === from ? { ...n, category: to } : n));
}
