/**
 * Projeto Enxuto E3: tudo o que há para fazer, num lugar só (Agenda › Tarefas).
 * Cada item continua morando na origem: tarefas, combinados das reuniões e entregas de projetos (Carreira)
 * e passos das metas de carreira (Objetivos). Marcar aqui marca lá.
 */
import type { AppData } from './types.ts';

export type TodoSource = 'tarefa' | 'combinado' | 'entrega' | 'passo';

export const SOURCE_LABEL: Record<TodoSource, string> = {
  tarefa: 'Tarefa',
  combinado: 'Reunião',
  entrega: 'Projeto',
  passo: 'Meta',
};

export interface TodoItem {
  /** `${source}:${parentId}:${itemId}` (tarefa: `tarefa:${id}`). */
  key: string;
  source: TodoSource;
  /** Tarefa, reunião, projeto ou meta. */
  parentId: string;
  itemId: string;
  title: string;
  /** AAAA-MM-DD ou null. */
  due: string | null;
  done: boolean;
  /** Nome de onde veio ("Reunião com Ana", "Projeto Repasse"). Vazio nas tarefas. */
  from: string;
  /** Endereço da origem (sem "#/"); vazio nas tarefas (editam aqui). */
  to: string;
  /** Só tarefas: prioridade alta e etiqueta. */
  high: boolean;
  tag: string;
}


export function allTodos(d: AppData): TodoItem[] {
  const out: TodoItem[] = [];
  for (const t of d.tasks) {
    out.push({ key: `tarefa:${t.id}`, source: 'tarefa', parentId: t.id, itemId: t.id, title: t.title, due: t.due, done: t.done, from: '', to: '', high: t.priority === 'alta', tag: t.tag });
  }
  for (const m of d.career.meetings) {
    const name = m.title.trim() || (m.with.trim() ? `Reunião com ${m.with.trim()}` : 'Reunião');
    for (const x of m.todos) {
      out.push({ key: `combinado:${m.id}:${x.id}`, source: 'combinado', parentId: m.id, itemId: x.id, title: x.text.trim() || 'Combinado sem nome', due: null, done: x.done, from: name, to: `carreira/abrir-m-${m.id}`, high: false, tag: '' });
    }
  }
  for (const p of d.career.projects) {
    if (p.status === 'concluido') continue;
    const name = p.name.trim() || 'Projeto sem nome';
    for (const x of p.deliveries) {
      out.push({ key: `entrega:${p.id}:${x.id}`, source: 'entrega', parentId: p.id, itemId: x.id, title: x.text.trim() || 'Entrega sem nome', due: x.date, done: x.done, from: name, to: `carreira/abrir-p-${p.id}`, high: false, tag: '' });
    }
  }
  for (const g of d.career.goals) {
    if (g.doneAt) continue;
    const name = g.title.trim() || 'Meta sem nome';
    for (const x of g.steps) {
      out.push({ key: `passo:${g.id}:${x.id}`, source: 'passo', parentId: g.id, itemId: x.id, title: x.text.trim() || 'Passo sem nome', due: null, done: x.done, from: name, to: 'objetivos', high: false, tag: '' });
    }
  }
  return out;
}

/** Pendentes primeiro; depois prazo mais perto; tarefas de prioridade alta antes. */
export function sortTodos(a: TodoItem, b: TodoItem): number {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const ad = a.due ?? '9999-99-99';
  const bd = b.due ?? '9999-99-99';
  if (ad !== bd) return ad < bd ? -1 : 1;
  if (a.high !== b.high) return a.high ? -1 : 1;
  return 0;
}

export type TodoFilter = 'pendentes' | 'hoje' | 'concluidas';

export function filterTodos(items: TodoItem[], filter: TodoFilter, today: string): TodoItem[] {
  return items
    .filter((t) => (filter === 'concluidas' ? t.done : filter === 'hoje' ? !t.done && t.due !== null && t.due <= today : !t.done))
    .sort(sortTodos);
}

/** Marca ou desmarca o item na origem. */
export function toggleTodo(item: Pick<TodoItem, 'source' | 'parentId' | 'itemId'>, nowISO: string = new Date().toISOString()) {
  const { source, parentId, itemId } = item;
  const flip = <T extends { id: string; done: boolean }>(xs: T[]) => xs.map((x) => (x.id === itemId ? { ...x, done: !x.done } : x));
  return (d: AppData): AppData => {
    if (source === 'tarefa') {
      return { ...d, tasks: d.tasks.map((t) => (t.id === itemId ? { ...t, done: !t.done, doneAt: t.done ? null : nowISO } : t)) };
    }
    const c = d.career;
    if (source === 'combinado') return { ...d, career: { ...c, meetings: c.meetings.map((m) => (m.id === parentId ? { ...m, todos: flip(m.todos) } : m)) } };
    if (source === 'entrega') return { ...d, career: { ...c, projects: c.projects.map((p) => (p.id === parentId ? { ...p, deliveries: flip(p.deliveries) } : p)) } };
    return { ...d, career: { ...c, goals: c.goals.map((g) => (g.id === parentId ? { ...g, steps: flip(g.steps) } : g)) } };
  };
}

