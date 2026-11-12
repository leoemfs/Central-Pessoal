/**
 * N9.6: chamadas à API do Google Tarefas (v1), só na lista "CP Hub".
 * O Google guarda só a data da tarefa (a hora é descartada pela própria API).
 */
import { DriveError } from './drive.ts';
import type { GTask, GTaskWrite } from './tasksSync.ts';

export const TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks';
export const TASKS_LIST_NAME = 'CP Hub';
const API = 'https://tasks.googleapis.com/tasks/v1';

type Fetch = typeof fetch;

async function call(f: Fetch, token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await f(url, {
    ...init,
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new DriveError(res.status, `Tarefas respondeu ${res.status}`);
  return res;
}
const gone = (e: unknown) => e instanceof DriveError && (e.status === 404 || e.status === 410);

/** Acha a lista "CP Hub" (pela id guardada ou pelo nome) ou cria. */
export async function ensureList(token: string, savedId: string | null, f: Fetch = fetch): Promise<string> {
  const res = await call(f, token, `${API}/users/@me/lists?maxResults=100`);
  const items = ((await res.json()) as { items?: { id: string; title: string }[] }).items ?? [];
  const found = items.find((l) => l.id === savedId) ?? items.find((l) => l.title === TASKS_LIST_NAME);
  if (found) return found.id;
  const created = await call(f, token, `${API}/users/@me/lists`, { method: 'POST', body: JSON.stringify({ title: TASKS_LIST_NAME }) });
  return String(((await created.json()) as { id: string }).id);
}

export async function deleteList(token: string, id: string, f: Fetch = fetch): Promise<void> {
  await call(f, token, `${API}/users/@me/lists/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch((e: unknown) => {
    if (!gone(e)) throw e;
  });
}

/** Todas as tarefas da lista, inclusive concluídas, escondidas e excluídas. */
export async function listTasks(token: string, listId: string, f: Fetch = fetch): Promise<GTask[]> {
  const out: GTask[] = [];
  let page = '';
  do {
    const q = new URLSearchParams({ showCompleted: 'true', showHidden: 'true', showDeleted: 'true', maxResults: '100' });
    if (page) q.set('pageToken', page);
    const res = await call(f, token, `${API}/lists/${encodeURIComponent(listId)}/tasks?${q}`);
    const body = (await res.json()) as {
      items?: { id: string; title?: string; notes?: string; due?: string; status?: string; updated?: string; deleted?: boolean }[];
      nextPageToken?: string;
    };
    for (const x of body.items ?? []) {
      out.push({ id: x.id, title: x.title ?? '', notes: x.notes ?? '', due: x.due ? x.due.slice(0, 10) : null, done: x.status === 'completed', updated: x.updated ?? '', deleted: x.deleted === true });
    }
    page = body.nextPageToken ?? '';
  } while (page);
  return out;
}

const body = (t: GTaskWrite) => ({
  title: t.title,
  notes: t.notes,
  due: t.due ? `${t.due}T00:00:00.000Z` : null,
  status: t.done ? 'completed' : 'needsAction',
  ...(t.done ? {} : { completed: null }),
});

export async function createTask(token: string, listId: string, t: GTaskWrite, f: Fetch = fetch): Promise<void> {
  await call(f, token, `${API}/lists/${encodeURIComponent(listId)}/tasks`, { method: 'POST', body: JSON.stringify(body(t)) });
}

export async function updateTask(token: string, listId: string, id: string, t: GTaskWrite, f: Fetch = fetch): Promise<void> {
  await call(f, token, `${API}/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body(t)) });
}

export async function deleteTask(token: string, listId: string, id: string, f: Fetch = fetch): Promise<void> {
  await call(f, token, `${API}/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch((e: unknown) => {
    if (!gone(e)) throw e;
  });
}
