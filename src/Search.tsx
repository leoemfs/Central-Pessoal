import { useMemo, useState } from 'react';
import { useStore } from './store';
import { go } from './router';
import type { Expense } from './types';
import { formatDateTime, formatDMY, formatMoney, fromISO, todayISO } from './utils';
import { Empty, Icon, Sheet, type IconName } from './ui';

interface Hit {
  key: string;
  icon: IconName;
  title: string;
  meta: string;
  to: string;
}

/** Contas fixas e parceladas aparecem uma vez só: a ocorrência mais próxima de hoje. */
function nearestPerSeries(xs: Expense[]): Expense[] {
  const now = fromISO(todayISO()).getTime();
  const dist = (e: Expense) => Math.abs(fromISO(e.dueDate).getTime() - now);
  const best = new Map<string, Expense>();
  for (const e of xs) {
    const key = e.seriesId ?? e.id;
    const cur = best.get(key);
    if (!cur || dist(e) < dist(cur)) best.set(key, e);
  }
  return [...best.values()].sort((a, b) => dist(a) - dist(b));
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Busca em todos os módulos: o usuário não precisa lembrar onde guardou a informação. */
export function SearchSheet({ onClose }: { onClose: () => void }) {
  const { data } = useStore();
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const term = norm(q.trim());
    if (term.length < 2) return [];
    const has = (...xs: string[]) => xs.some((x) => norm(x).includes(term));
    const out: { title: string; hits: Hit[] }[] = [
      {
        title: 'Diário',
        hits: data.journal
          .filter((e) => has(e.title, e.summary, e.content, e.tag))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((e) => ({ key: e.id, icon: 'journal', title: e.title || e.summary || e.content.slice(0, 60), meta: formatDateTime(e.createdAt), to: 'diario' })),
      },
      {
        title: 'Despesas',
        hits: nearestPerSeries(data.expenses.filter((e) => has(e.description)))
          .map((e) => ({ key: e.id, icon: 'wallet', title: e.description, meta: `${formatMoney(e.amount)} · ${formatDMY(e.dueDate)}`, to: 'financas' })),
      },
      {
        title: 'Receitas',
        hits: data.incomes
          .filter((i) => has(i.description))
          .sort((a, b) => b.date.localeCompare(a.date))
          .filter((i, idx, arr) => !i.seriesId || arr.findIndex((x) => x.seriesId === i.seriesId) === idx)
          .map((i) => ({ key: i.id, icon: 'coins' as IconName, title: i.description, meta: `+ ${formatMoney(i.amount)} · ${formatDMY(i.date)}`, to: 'financas/receitas' })),
      },
      {
        title: 'Agenda',
        hits: [
          ...data.events.filter((e) => has(e.title, e.location, e.description)).map((e) => ({ key: e.id, icon: 'calendar' as IconName, title: e.title, meta: formatDMY(e.date), to: 'agenda' })),
          ...data.tasks.filter((t) => has(t.title, t.notes, t.tag)).map((t) => ({ key: t.id, icon: 'tasks' as IconName, title: t.title, meta: t.done ? 'Concluída' : t.due ? `Prazo ${formatDMY(t.due)}` : 'Tarefa', to: 'agenda/tarefas' })),
        ],
      },
      {
        title: 'Notas',
        hits: data.notes.filter((n) => has(n.title, n.content)).map((n) => ({ key: n.id, icon: 'note', title: n.title || 'Sem título', meta: n.content.slice(0, 60), to: 'arquivo' })),
      },
    ];
    return out.filter((g) => g.hits.length).map((g) => ({ ...g, hits: g.hits.slice(0, 8) }));
  }, [data, q]);

  return (
    <Sheet title="Buscar" onClose={onClose}>
      <label className="search">
        <Icon name="search" size={18} />
        <input autoFocus placeholder="Buscar em tudo: diário, despesas, agenda…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar em tudo" />
      </label>
      {q.trim().length >= 2 && groups.length === 0 && <Empty>Nada encontrado para “{q.trim()}”.</Empty>}
      {groups.map((g) => (
        <div key={g.title}>
          <p className="nav-group">{g.title}</p>
          <ul className="list">
            {g.hits.map((h) => (
              <li key={h.key}>
                <button
                  type="button"
                  className="row"
                  onClick={() => {
                    onClose();
                    go(h.to);
                  }}
                >
                  <span className="tile-icon small">
                    <Icon name={h.icon} size={18} />
                  </span>
                  <div className="row-body">
                    <span className="row-title">{h.title}</span>
                    <span className="row-meta">{h.meta}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Sheet>
  );
}
