/**
 * M17: Notas e Banco de ideias. Uma ideia é uma nota com `kind: 'ideia'`.
 * Telas: Notas (só notas, fichas de categoria) · Ideias (situação e etiqueta) · Arquivados.
 */
import type { AppData, BecomeKind, CalendarEvent, IdeaStatus, Note, NoteKind, Task } from './types.ts';
import { emptyDoc, newNotebook } from './estudos.ts';
import { mdToDoc } from './studyPack.ts';
import { newItem, newList } from './lists.ts';
import { newCareerGoal } from './objetivos.ts';

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
  return { id, title: '', content: '', pinned: false, updatedAt: now, kind, category: '', status: 'nova', archived: false, became: null, ...extra };
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

// ---------- Parte 2: "Transformar em" ----------

export const BECOME: Record<BecomeKind, { label: string; done: string; where: string }> = {
  tarefa: { label: 'Tarefa', done: 'Virou tarefa', where: 'Agenda' },
  compromisso: { label: 'Compromisso', done: 'Virou compromisso', where: 'Agenda' },
  notebook: { label: 'Notebook', done: 'Virou notebook', where: 'Estudos' },
  lista: { label: 'Lista', done: 'Virou lista', where: 'Listas' },
  meta: { label: 'Meta', done: 'Virou meta', where: 'Objetivos' },
};

/** Linhas do texto, sem marcadores de lista ("- ", "* ", "1. ", "[ ] "). */
export function linesOf(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim().replace(/^([-*•]|\d+[.)]|\[[ xX]?\])\s+/, '').replace(/^\[[ xX]?\]\s*/, '').trim())
    .filter(Boolean);
}

/** Título para o que vai ser criado: o da nota ou, sem ele, a primeira linha do texto. */
export function titleOf(n: Note): string {
  return n.title.trim() || linesOf(n.content)[0]?.slice(0, 80) || 'Sem título';
}

export interface BecomeOptions {
  kind: BecomeKind;
  /** Tarefa (prazo, opcional) e compromisso (dia, obrigatório). */
  date?: string | null;
  /** Compromisso: HH:MM ou vazio (dia todo). */
  time?: string;
  /** Lista: categoria escolhida. */
  categoryId?: string;
}

/** Cria a coisa nova no módulo dela e manda a nota para Arquivados, com o atalho. */
export function transformNote(d: AppData, noteId: string, o: BecomeOptions, id: string, now: string): AppData {
  const n = d.notes.find((x) => x.id === noteId);
  if (!n || n.became) return d;
  const title = titleOf(n);
  // Sem título, a primeira linha já virou o título e não se repete no texto.
  const body = n.title.trim() ? n.content.trim() : linesOf(n.content).slice(1).join('\n');
  let out = d;
  let made = id;
  if (o.kind === 'tarefa') {
    const t: Task = { id, title, notes: body, due: o.date || null, priority: 'media', tag: '', done: false, createdAt: now, doneAt: null };
    out = { ...d, tasks: [t, ...d.tasks] };
  } else if (o.kind === 'compromisso') {
    if (!o.date) return d;
    const e: CalendarEvent = { id, title, date: o.date, time: o.time ?? '', location: '', description: body };
    out = { ...d, events: [...d.events, e] };
  } else if (o.kind === 'notebook') {
    const nb = newNotebook(title, null, null, now);
    const page = { ...nb.pages[0], name: title, doc: body.trim() ? mdToDoc(body) : emptyDoc() };
    made = nb.id;
    out = { ...d, study: { ...d.study, notebooks: [{ ...nb, pages: [page], log: [{ at: now, text: 'Criado a partir de uma nota' }] }, ...d.study.notebooks] } };
  } else if (o.kind === 'lista') {
    const cat = d.listCategories.find((c) => c.id === o.categoryId) ?? d.listCategories[0];
    if (!cat) return d;
    const list = newList(title, cat.id);
    const lines = n.title.trim() ? linesOf(n.content) : linesOf(n.content).slice(1);
    made = list.id;
    out = { ...d, lists: [{ ...list, items: lines.map((text) => newItem({ text })) }, ...d.lists] };
  } else {
    const g = { ...newCareerGoal(now), title, note: body };
    made = g.id;
    out = { ...d, career: { ...d.career, goals: [g, ...d.career.goals] } };
  }
  return {
    ...out,
    notes: out.notes.map((x) => (x.id === noteId ? { ...x, archived: true, pinned: false, became: { kind: o.kind, id: made }, updatedAt: now } : x)),
  };
}

/** Endereço para abrir o que a nota virou; null se já foi apagado lá. */
export function becameRoute(d: AppData, b: NonNullable<Note['became']>): string | null {
  switch (b.kind) {
    case 'tarefa':
      return d.tasks.some((t) => t.id === b.id) ? 'agenda/tarefas' : null;
    case 'compromisso':
      return d.events.some((e) => e.id === b.id) ? 'agenda' : null;
    case 'notebook':
      return d.study.notebooks.some((x) => x.id === b.id) ? `estudos/notebook/${b.id}` : null;
    case 'lista':
      return d.lists.some((l) => l.id === b.id) ? `listas/${b.id}` : null;
    case 'meta':
      return d.career.goals.some((g) => g.id === b.id) ? 'metas' : null;
  }
}
