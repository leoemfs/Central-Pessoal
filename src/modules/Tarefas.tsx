import { useMemo, useState, type FormEvent } from 'react';
import { useStore } from '../store';
import { remove, toggleTask, upsert } from '../actions';
import type { Priority, Task } from '../types';
import { relativeDay, todayISO, uid } from '../utils';
import { Card, Empty, Icon, IconButton, PageHeader } from '../ui';

const PRIORITY_LABEL: Record<Priority, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
const PRIORITY_ORDER: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 };

export function sortTasks(a: Task, b: Task): number {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const ad = a.due ?? '9999-99-99';
  const bd = b.due ?? '9999-99-99';
  if (ad !== bd) return ad < bd ? -1 : 1;
  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
}

export function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const today = todayISO();
  const overdue = !task.done && task.due !== null && task.due < today;
  return (
    <li className={`row task${task.done ? ' done' : ''}`}>
      <button
        type="button"
        className={`check${task.done ? ' on' : ''}`}
        onClick={onToggle}
        aria-label={task.done ? `Reabrir "${task.title}"` : `Concluir "${task.title}"`}
        aria-pressed={task.done}
      >
        {task.done && <Icon name="check" size={14} />}
      </button>
      <div className="row-body">
        <span className="row-title">{task.title}</span>
        <span className="row-meta">
          {task.due && <span className={`chip${overdue ? ' danger' : task.due === today ? ' warning' : ''}`}>{relativeDay(task.due)}</span>}
          <span className={`chip prio-${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span>
          {task.tag && <span className="chip">#{task.tag}</span>}
          {task.notes && <span className="row-notes">{task.notes}</span>}
        </span>
      </div>
      {(onEdit || onDelete) && (
        <div className="row-actions">
          {onEdit && <IconButton icon="edit" label="Editar" onClick={onEdit} />}
          {onDelete && <IconButton icon="trash" label="Excluir" tone="danger" onClick={onDelete} />}
        </div>
      )}
    </li>
  );
}

type Filter = 'pendentes' | 'hoje' | 'atrasadas' | 'concluidas' | 'todas';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'pendentes', label: 'Pendentes' },
  { id: 'hoje', label: 'Hoje' },
  { id: 'atrasadas', label: 'Atrasadas' },
  { id: 'concluidas', label: 'Concluídas' },
  { id: 'todas', label: 'Todas' },
];

interface Draft {
  title: string;
  due: string;
  priority: Priority;
  tag: string;
  notes: string;
}
const emptyDraft = (): Draft => ({ title: '', due: '', priority: 'media', tag: '', notes: '' });

export function Tarefas() {
  const { data, update } = useStore();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('pendentes');
  const [tag, setTag] = useState('');
  const [query, setQuery] = useState('');
  const today = todayISO();

  const tags = useMemo(() => [...new Set(data.tasks.map((t) => t.tag).filter(Boolean))].sort(), [data.tasks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.tasks
      .filter((t) => {
        switch (filter) {
          case 'pendentes':
            return !t.done;
          case 'hoje':
            return !t.done && t.due !== null && t.due <= today;
          case 'atrasadas':
            return !t.done && t.due !== null && t.due < today;
          case 'concluidas':
            return t.done;
          default:
            return true;
        }
      })
      .filter((t) => !tag || t.tag === tag)
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q))
      .sort(sortTasks);
  }, [data.tasks, filter, tag, query, today]);

  const pending = data.tasks.filter((t) => !t.done).length;
  const doneCount = data.tasks.length - pending;

  function submit(e: FormEvent) {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    const prev = editingId ? data.tasks.find((t) => t.id === editingId) : undefined;
    const task: Task = {
      id: prev?.id ?? uid(),
      title,
      notes: draft.notes.trim(),
      due: draft.due || null,
      priority: draft.priority,
      tag: draft.tag.trim().replace(/^#/, ''),
      done: prev?.done ?? false,
      doneAt: prev?.doneAt ?? null,
      createdAt: prev?.createdAt ?? new Date().toISOString(),
    };
    update(upsert('tasks', task));
    setDraft(emptyDraft());
    setEditingId(null);
  }

  function edit(t: Task) {
    setEditingId(t.id);
    setDraft({ title: t.title, due: t.due ?? '', priority: t.priority, tag: t.tag, notes: t.notes });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditingId(null);
    setDraft(emptyDraft());
  }

  function del(t: Task) {
    if (confirm(`Excluir a tarefa "${t.title}"?`)) {
      update(remove('tasks', t.id));
      if (editingId === t.id) cancel();
    }
  }

  function clearDone() {
    if (confirm(`Excluir ${doneCount} tarefa(s) concluída(s)?`)) {
      update((d) => ({ ...d, tasks: d.tasks.filter((t) => !t.done) }));
    }
  }

  return (
    <>
      <PageHeader title="Tarefas" subtitle={`${pending} pendente(s) · ${doneCount} concluída(s)`} />

      <Card title={editingId ? 'Editar tarefa' : 'Nova tarefa'}>
        <form className="form" onSubmit={submit}>
          <input
            className="input grow"
            placeholder="O que precisa ser feito?"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            aria-label="Título da tarefa"
            required
          />
          <div className="form-row">
            <label className="field">
              <span>Prazo</span>
              <input type="date" className="input" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
            </label>
            <label className="field">
              <span>Prioridade</span>
              <select className="input" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </label>
            <label className="field">
              <span>Etiqueta</span>
              <input className="input" list="task-tags" placeholder="ex.: trabalho" value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} />
              <datalist id="task-tags">
                {tags.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
          </div>
          <textarea
            className="input"
            rows={2}
            placeholder="Observações (opcional)"
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            aria-label="Observações"
          />
          <div className="form-actions">
            {editingId && (
              <button type="button" className="btn ghost" onClick={cancel}>
                Cancelar
              </button>
            )}
            <button type="submit" className="btn primary">
              <Icon name={editingId ? 'check' : 'plus'} size={18} />
              {editingId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Card>

      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="Filtro">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'on' : ''} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <label className="search">
            <Icon name="search" size={16} />
            <input placeholder="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar tarefas" />
          </label>
          {tags.length > 0 && (
            <select className="input compact" value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Filtrar por etiqueta">
              <option value="">Todas as etiquetas</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <Card>
        {visible.length === 0 ? (
          <Empty>{data.tasks.length === 0 ? 'Nenhuma tarefa ainda. Adicione a primeira acima.' : 'Nada por aqui com esse filtro.'}</Empty>
        ) : (
          <ul className="list">
            {visible.map((t) => (
              <TaskItem key={t.id} task={t} onToggle={() => update(toggleTask(t.id))} onEdit={() => edit(t)} onDelete={() => del(t)} />
            ))}
          </ul>
        )}
        {doneCount > 0 && (filter === 'concluidas' || filter === 'todas') && (
          <div className="card-foot">
            <button type="button" className="btn ghost small danger-text" onClick={clearDone}>
              Limpar concluídas
            </button>
          </div>
        )}
      </Card>
    </>
  );
}
