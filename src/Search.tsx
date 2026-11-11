import { useMemo, useState } from 'react';
import { useStore } from './store';
import { go } from './router';
import type { Expense } from './types';
import { formatDateTime, formatDMY, formatMoney, fromISO, todayISO } from './utils';
import { Empty, Icon, Sheet, type IconName } from './ui';
import { docText, library } from './estudos';
import { MODULES } from './setup';

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

/**
 * Busca (E6 + M13). No Início, procura em tudo. Dentro de um módulo, procura só nele,
 * com um toque para ampliar para tudo.
 */
export function SearchSheet({ onClose, scope = null }: { onClose: () => void; scope?: string | null }) {
  const { data } = useStore();
  const [q, setQ] = useState('');
  const [all, setAll] = useState(scope === null);
  const modName = scope ? (MODULES.find((m) => m.id === scope)?.label ?? 'este módulo') : null;
  const only = all ? null : scope;

  const groups = useMemo(() => {
    const term = norm(q.trim());
    if (term.length < 2) return [];
    const has = (...xs: (string | null | undefined)[]) => xs.some((x) => !!x && norm(x).includes(term));
    const want = (mod: string) => only === null || only === mod;
    const out: { title: string; mod: string; hits: Hit[] }[] = [];
    const add = (mod: string, title: string, make: () => Hit[]) => {
      if (want(mod)) out.push({ title, mod, hits: make() });
    };
    add('diario', 'Diário', () =>
      data.journal
        .filter((e) => has(e.title, e.summary, e.content, e.tag))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((e) => ({ key: e.id, icon: 'journal', title: e.title || e.summary || e.content.slice(0, 60), meta: formatDateTime(e.createdAt), to: 'diario' })),
    );
    add('financas', 'Despesas', () =>
      nearestPerSeries(data.expenses.filter((e) => has(e.description))).map((e) => ({ key: e.id, icon: 'wallet', title: e.description, meta: `${formatMoney(e.amount)} · ${formatDMY(e.dueDate)}`, to: 'financas' })),
    );
    add('financas', 'Receitas', () =>
      data.incomes
        .filter((i) => has(i.description))
        .sort((a, b) => b.date.localeCompare(a.date))
        .filter((i, idx, arr) => !i.seriesId || arr.findIndex((x) => x.seriesId === i.seriesId) === idx)
        .map((i) => ({ key: i.id, icon: 'coins' as IconName, title: i.description, meta: `+ ${formatMoney(i.amount)} · ${formatDMY(i.date)}`, to: 'financas/receitas' })),
    );
    add('financas', 'Cartões e caixinhas', () => [
      ...data.cards.filter((c) => has(c.name)).map((c) => ({ key: c.id, icon: 'card' as IconName, title: c.name, meta: `Fecha dia ${c.closingDay} · vence dia ${c.dueDay}`, to: 'financas/cartoes' })),
      ...data.vouchers.filter((v) => has(v.name)).map((v) => ({ key: v.id, icon: 'card' as IconName, title: v.name, meta: 'Vale', to: 'financas/cartoes' })),
      ...data.boxes.filter((b) => has(b.name)).map((b) => ({ key: b.id, icon: 'piggy' as IconName, title: b.name, meta: 'Caixinha', to: 'financas/caixinhas' })),
    ]);
    add('agenda', 'Agenda', () => [
      ...data.events.filter((e) => has(e.title, e.location, e.description)).map((e) => ({ key: e.id, icon: 'calendar' as IconName, title: e.title, meta: formatDMY(e.date), to: e.origin ?? 'agenda' })),
      ...data.tasks.filter((t) => has(t.title, t.notes, t.tag)).map((t) => ({ key: t.id, icon: 'tasks' as IconName, title: t.title, meta: t.done ? 'Concluída' : t.due ? `Prazo ${formatDMY(t.due)}` : 'Tarefa', to: 'agenda/tarefas' })),
    ]);
    add('nucleo', 'Núcleo', () =>
      data.habits.filter((h) => has(h.name, h.cue)).map((h) => ({ key: h.id, icon: 'sprout' as IconName, title: h.name, meta: h.archivedAt ? 'Arquivado' : h.kind === 'abandonar' ? 'Hábito a abandonar' : h.kind === 'ritual' ? 'Ritual' : 'Hábito', to: 'nucleo' })),
    );
    add('listas', 'Listas', () => [
      ...data.lists.filter((l) => has(l.name, ...l.items.map((i) => i.text))).map((l) => {
        const item = l.items.find((i) => has(i.text));
        return { key: l.id, icon: 'cart' as IconName, title: l.name, meta: item && !has(l.name) ? `Tem: ${item.text}` : `${l.items.length} itens`, to: `listas/${l.id}` };
      }),
      ...data.products.filter((p) => has(p.name)).map((p) => ({ key: p.id, icon: 'store' as IconName, title: p.name, meta: 'Produto em Preços', to: 'precos' })),
    ]);
    add('estudos', 'Estudos', () => {
      const st = data.study;
      const lib = library(st);
      const pages = st.notebooks.flatMap((nb) => nb.pages.filter((p) => has(p.name, docText(p.doc))).map((p) => ({ nb, p })));
      return [
        ...st.notebooks.filter((nb) => has(nb.name, nb.desc)).map((nb) => ({ key: nb.id, icon: 'notebook' as IconName, title: nb.name, meta: 'Notebook', to: `estudos/notebook/${nb.id}` })),
        ...pages.map(({ nb, p }) => ({ key: p.id, icon: 'note' as IconName, title: p.name, meta: `Página em ${nb.name}`, to: `estudos/notebook/${nb.id}` })),
        ...st.sources.filter((x) => has(x.title, x.url, x.note)).map((x) => ({ key: x.id, icon: 'link' as IconName, title: x.title, meta: 'Fonte', to: 'estudos/fontes' })),
        ...st.maps.filter((m) => has(m.name)).map((m) => ({ key: m.id, icon: 'mindmap' as IconName, title: m.name, meta: 'Mapa mental', to: `estudos/mapa/${m.id}` })),
        ...lib.tracks.filter((t) => has(t.name)).map((t) => ({ key: t.id, icon: 'route' as IconName, title: t.name, meta: 'Trilha da Biblioteca', to: `estudos/trilha/${t.id}` })),
        ...lib.tracks.flatMap((t) => t.topics.filter((x) => has(x.name)).map((x) => ({ key: `${t.id}:${x.id}`, icon: 'cap' as IconName, title: x.name, meta: `Tópico de ${t.name}`, to: `estudos/trilha/${t.id}` }))),
      ];
    });
    add('carreira', 'Carreira', () => [
      ...data.career.jobs.filter((j) => has(j.role, j.company)).map((j) => ({ key: j.id, icon: 'send' as IconName, title: `${j.role} · ${j.company}`, meta: 'Vaga', to: `carreira/abrir-j-${j.id}` })),
      ...data.career.meetings.filter((m) => has(m.title, m.with, m.notes)).map((m) => ({ key: m.id, icon: 'calendar' as IconName, title: m.title, meta: `Reunião · ${formatDMY(m.date)}`, to: `carreira/abrir-m-${m.id}` })),
      ...data.career.projects.filter((p) => has(p.name, p.area)).map((p) => ({ key: p.id, icon: 'briefcase' as IconName, title: p.name, meta: 'Projeto', to: `carreira/abrir-p-${p.id}` })),
    ]);
    add('arquivo', 'Notas', () =>
      data.notes.filter((n) => has(n.title, n.content)).map((n) => ({ key: n.id, icon: 'note', title: n.title || 'Sem título', meta: n.content.slice(0, 60), to: 'arquivo' })),
    );
    return out.filter((g) => g.hits.length).map((g) => ({ ...g, hits: g.hits.slice(0, 8) }));
  }, [data, q, only]);

  return (
    <Sheet title="Buscar" onClose={onClose}>
      <label className="search">
        <Icon name="search" size={18} />
        <input
          autoFocus
          placeholder={only ? `Buscar em ${modName}…` : 'Buscar em tudo: diário, despesas, agenda…'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={only ? `Buscar em ${modName}` : 'Buscar em tudo'}
        />
      </label>
      {scope && (
        <div className="chips search-scope" role="group" aria-label="Onde buscar">
          <button type="button" className={`chip-btn${!all ? ' on' : ''}`} aria-pressed={!all} onClick={() => setAll(false)}>
            Em {modName}
          </button>
          <button type="button" className={`chip-btn${all ? ' on' : ''}`} aria-pressed={all} onClick={() => setAll(true)}>
            Em tudo
          </button>
        </div>
      )}
      {q.trim().length >= 2 && groups.length === 0 && (
        <Empty>
          Nada encontrado para “{q.trim()}”{only ? ` em ${modName}` : ''}.
          {only && (
            <>
              {' '}
              <button type="button" className="link" onClick={() => setAll(true)}>
                Buscar em tudo
              </button>
            </>
          )}
        </Empty>
      )}
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
