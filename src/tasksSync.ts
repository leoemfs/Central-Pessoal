/**
 * N9.6: tarefas do app ↔ lista "CP Hub" do Google Tarefas (ida e volta). Regras puras, com testes.
 *
 * - Cada tarefa no Google leva no fim das notas a marca `CP Hub #<id do app>`; é ela que liga as
 *   duas (não precisa guardar o id do Google nos dados, e dois aparelhos não duplicam).
 * - Mesmo conteúdo dos dois lados: nada a fazer. Diferente: vale o lado que mudou por último
 *   (data de alteração do app × `updated` do Google).
 * - O Google guarda só a data (sem hora), igual às tarefas do app.
 */
import type { AppData, Task } from './types.ts';
import { uid } from './utils.ts';

export interface GTask {
  id: string;
  title: string;
  /** Notas como estão no Google (com a marca). */
  notes: string;
  /** AAAA-MM-DD ou null. */
  due: string | null;
  done: boolean;
  /** Última alteração no Google (ISO). */
  updated: string;
  deleted: boolean;
}

/** O que mandar para o Google (criar ou mudar). */
export interface GTaskWrite {
  title: string;
  notes: string;
  due: string | null;
  done: boolean;
}

export interface TasksPlan {
  create: GTaskWrite[];
  update: { id: string; task: GTaskWrite }[];
  remove: string[];
  /** Tarefas que mudaram (ou nasceram) no Google: entram no app com esta data de alteração. */
  toApp: { task: Task; at: string }[];
  /** Tarefas excluídas no Google: saem do app. */
  deleteInApp: { id: string; at: string }[];
}

const MARK = /\n*CP Hub #([\w-]+)\s*$/;

/** Separa as notas da marca do app. */
export function readMark(notes: string): { body: string; appId: string | null } {
  const m = notes.match(MARK);
  return m ? { body: notes.slice(0, m.index).trim(), appId: m[1] } : { body: notes.trim(), appId: null };
}

export const withMark = (body: string, appId: string) => `${body.trim() ? `${body.trim()}\n\n` : ''}CP Hub #${appId}`;

const toWrite = (t: Task): GTaskWrite => ({ title: t.title, notes: withMark(t.notes, t.id), due: t.due, done: t.done });
const sameContent = (t: Task, g: GTask) => t.title === g.title && t.notes.trim() === readMark(g.notes).body && t.due === g.due && t.done === g.done;

export function planTasks(d: AppData, google: GTask[], now: string = new Date().toISOString()): TasksPlan {
  const plan: TasksPlan = { create: [], update: [], remove: [], toApp: [], deleteInApp: [] };
  const byApp = new Map<string, GTask>();
  for (const g of google) {
    const { appId } = readMark(g.notes);
    if (!appId) continue;
    const seen = byApp.get(appId);
    // Duplicada (dois aparelhos criaram ao mesmo tempo): fica a mais recente, a outra sai.
    if (seen && !seen.deleted && !g.deleted) {
      const [keep, drop] = seen.updated >= g.updated ? [seen, g] : [g, seen];
      byApp.set(appId, keep);
      plan.remove.push(drop.id);
    } else if (!seen || seen.deleted) byApp.set(appId, g);
  }
  const appTasks = new Map(d.tasks.map((t) => [t.id, t]));

  for (const t of d.tasks) {
    const g = byApp.get(t.id);
    const appAt = d.stamps[t.id] ?? t.createdAt ?? '';
    if (!g) {
      if (!t.done) plan.create.push(toWrite(t));
      continue;
    }
    if (g.deleted) {
      // Excluída no Google depois da última mudança no app: sai do app. Senão, volta para o Google.
      if (g.updated >= appAt) plan.deleteInApp.push({ id: t.id, at: g.updated });
      else if (!t.done) plan.create.push(toWrite(t));
      continue;
    }
    if (sameContent(t, g)) continue;
    if (g.updated > appAt) {
      const body = readMark(g.notes).body;
      plan.toApp.push({ task: { ...t, title: g.title, notes: body, due: g.due, done: g.done, doneAt: g.done ? (t.doneAt ?? g.updated) : null }, at: g.updated });
    } else plan.update.push({ id: g.id, task: toWrite(t) });
  }

  for (const [appId, g] of byApp) {
    if (g.deleted || appTasks.has(appId)) continue;
    // Tarefa excluída no app: sai do Google. (Se o app ainda não conhece o id, é de outro aparelho: espera.)
    if (appId in d.deleted) plan.remove.push(g.id);
  }

  // Criada direto no Google (sem marca): entra no app e ganha a marca.
  for (const g of google) {
    if (g.deleted || readMark(g.notes).appId) continue;
    const task: Task = {
      id: uid(),
      title: g.title || 'Tarefa',
      notes: readMark(g.notes).body,
      due: g.due,
      priority: 'media',
      tag: '',
      done: g.done,
      createdAt: now,
      doneAt: g.done ? g.updated : null,
    };
    plan.toApp.push({ task, at: g.updated });
    plan.update.push({ id: g.id, task: toWrite(task) });
  }
  return plan;
}

/** Aplica no app o que veio do Google: devolve dados no formato "da nuvem" (com as datas do Google), para a junção. */
export function applyToApp(d: AppData, plan: TasksPlan): AppData | null {
  if (!plan.toApp.length && !plan.deleteInApp.length) return null;
  const stamps = { ...d.stamps };
  const deleted = { ...d.deleted };
  const byId = new Map(d.tasks.map((t) => [t.id, t]));
  for (const { task, at } of plan.toApp) {
    byId.set(task.id, task);
    stamps[task.id] = at;
  }
  for (const { id, at } of plan.deleteInApp) {
    byId.delete(id);
    delete stamps[id];
    deleted[id] = at;
  }
  const last = [...plan.toApp.map((x) => x.at), ...plan.deleteInApp.map((x) => x.at)].sort().pop()!;
  return { ...d, tasks: [...byId.values()], stamps: { ...stamps, '@tasks': last > (stamps['@tasks'] ?? '') ? last : stamps['@tasks'] }, deleted };
}
