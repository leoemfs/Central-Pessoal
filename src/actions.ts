import type { AppData, Collection } from './types';
import { todayISO } from './utils';

type Item<K extends Collection> = AppData[K][number];

/** Cria ou substitui (pelo id) um item de uma coleção. */
export function upsert<K extends Collection>(key: K, item: Item<K>) {
  return (d: AppData): AppData => {
    const items = d[key] as Item<K>[];
    const exists = items.some((x) => x.id === item.id);
    const next = exists ? items.map((x) => (x.id === item.id ? item : x)) : [item, ...items];
    return { ...d, [key]: next };
  };
}

export function remove(key: Collection, id: string) {
  return (d: AppData): AppData => ({
    ...d,
    [key]: (d[key] as { id: string }[]).filter((x) => x.id !== id),
    deleted: { ...d.deleted, [id]: new Date().toISOString() },
  });
}

export function toggleTask(id: string) {
  return (d: AppData): AppData => ({
    ...d,
    tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done, doneAt: t.done ? null : new Date().toISOString() } : t)),
  });
}

export function toggleHabit(id: string, day: string = todayISO()) {
  return (d: AppData): AppData => ({
    ...d,
    habits: d.habits.map((h) => {
      if (h.id !== id) return h;
      const checks = h.checks.includes(day) ? h.checks.filter((c) => c !== day) : [...h.checks, day].sort();
      return { ...h, checks };
    }),
  });
}
