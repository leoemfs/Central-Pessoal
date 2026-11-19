import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { remove, upsert } from '../actions';
import type { Priority, Task } from '../types';
import { relativeDay, todayISO, uid } from '../utils';
import { allTodos, filterTodos, SOURCE_LABEL, toggleTodo, type TodoFilter, type TodoItem } from '../afazeres';
import { go } from '../router';
import { Chips, Empty, Field, Icon, IconButton, Pill, Segmented, Sheet } from '../ui';

const PRIORITY_LABEL: Record<Priority, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
const PRIORITY_ORDER: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 };

export function sortTasks(a: Task, b: Task): number {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const ad = a.due ?? '9999-99-99';
  const bd = b.due ?? '9999-99-99';
  if (ad !== bd) return ad < bd ? -1 : 1;
  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
}

export function TaskItem({ task, onToggle, onEdit }: { task: Task; onToggle: () => void; onEdit?: () => void }) {
  const today = todayISO();
  const overdue = !task.done && task.due !== null && task.due < today;
  return (
    <li className={`row task${task.done ? ' done' : ''}`}>
      <button type="button" className={`check${task.done ? ' on' : ''}`} onClick={onToggle} aria-label={task.done ? `Reabrir "${task.title}"` : `Concluir "${task.title}"`} aria-pressed={task.done}>
        {task.done && <Icon name="check" size={14} />}
      </button>
      <div className="row-body">
        <span className="row-title">{task.title}</span>
        <span className="row-meta">
          {task.due && <Pill tone={overdue ? 'red' : task.due === today ? 'orange' : 'gray'}>{relativeDay(task.due)}</Pill>}
          {task.priority === 'alta' && <Pill tone="red">Alta</Pill>}
          {task.tag && <span>#{task.tag}</span>}
        </span>
      </div>
      {onEdit && <IconButton icon="edit" label="Editar" onClick={onEdit} />}
    </li>
  );
}

export function TasksPanel({ onEdit }: { onEdit: (t: Task) => void }) {
  const { data, update } = useStore();
  const [filter, setFilter] = useState<TodoFilter>('pendentes');
  const today = todayISO();
  const all = useMemo(() => allTodos(data), [data]);
  const visible = useMemo(() => filterTodos(all, filter, today), [all, filter, today]);
  const doneCount = data.tasks.filter((t) => t.done).length;

  return (
    <>
      <Segmented
        label="Filtro"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'pendentes', label: 'Pendentes' },
          { value: 'hoje', label: 'Hoje e atrasadas' },
          { value: 'concluidas', label: 'Concluídas' },
        ]}
      />
      <section className="card">
        {visible.length === 0 ? (
          <Empty>{all.length === 0 ? 'Nenhuma tarefa ainda.' : 'Nada por aqui.'}</Empty>
        ) : (
          <ul className="list">
            {visible.map((it) => {
              if (it.source === 'tarefa') {
                const t = data.tasks.find((x) => x.id === it.itemId)!;
                return <TaskItem key={it.key} task={t} onToggle={() => update(toggleTodo(it))} onEdit={() => onEdit(t)} />;
              }
              return <TodoRow key={it.key} item={it} onToggle={() => update(toggleTodo(it))} />;
            })}
          </ul>
        )}
        {filter === 'concluidas' && doneCount > 0 && (
          <button
            type="button"
            className="btn small ghost red"
            style={{ marginTop: 8 }}
            onClick={() => confirm(`Excluir ${doneCount} tarefa(s) concluída(s)? Combinados, entregas e passos continuam na origem.`) && update((d) => ({ ...d, tasks: d.tasks.filter((t) => !t.done) }))}
          >
            Limpar tarefas concluídas
          </button>
        )}
      </section>
    </>
  );
}

/** Combinado, entrega ou passo: marcar marca na origem; tocar no texto abre a origem. */
function TodoRow({ item, onToggle }: { item: TodoItem; onToggle: () => void }) {
  const today = todayISO();
  const overdue = !item.done && item.due !== null && item.due < today;
  return (
    <li className={`row task${item.done ? ' done' : ''}`}>
      <button type="button" className={`check${item.done ? ' on' : ''}`} onClick={onToggle} aria-label={item.done ? `Reabrir "${item.title}"` : `Concluir "${item.title}"`} aria-pressed={item.done}>
        {item.done && <Icon name="check" size={14} />}
      </button>
      <button type="button" className="row-body todo-open" onClick={() => go(item.to)} aria-label={`${item.title}: abrir ${SOURCE_LABEL[item.source].toLowerCase()} ${item.from}`}>
        <span className="row-title">{item.title}</span>
        <span className="row-meta">
          <Pill tone="blue">{SOURCE_LABEL[item.source]}</Pill>
          {item.due && <Pill tone={overdue ? 'red' : item.due === today ? 'orange' : 'gray'}>{relativeDay(item.due)}</Pill>}
          <span>{item.from}</span>
        </span>
      </button>
      <span className="todo-go" aria-hidden><Icon name="right" size={16} /></span>
    </li>
  );
}

export function TaskForm({ task, defaultDue, onClose }: { task?: Task; defaultDue?: string; onClose: () => void }) {
  const { update } = useStore();
  const [title, setTitle] = useState(task?.title ?? '');
  const [due, setDue] = useState(task?.due ?? defaultDue ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'media');
  const [tag, setTag] = useState(task?.tag ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');

  function save() {
    if (!title.trim()) return;
    update(
      upsert('tasks', {
        id: task?.id ?? uid(),
        title: title.trim(),
        notes: notes.trim(),
        due: due || null,
        priority,
        tag: tag.trim().replace(/^#/, ''),
        done: task?.done ?? false,
        doneAt: task?.doneAt ?? null,
        createdAt: task?.createdAt ?? new Date().toISOString(),
      }),
    );
    onClose();
  }

  return (
    <Sheet
      title={task ? 'Editar tarefa' : 'Nova tarefa'}
      onClose={onClose}
      footer={
        <div className="btn-row">
          {task && (
            <button type="button" className="btn danger" onClick={() => { if (confirm(`Excluir "${task.title}"?`)) { update(remove('tasks', task.id)); onClose(); } }}>
              <Icon name="trash" size={18} /> Excluir
            </button>
          )}
          <button type="button" className="btn primary" disabled={!title.trim()} onClick={save}>
            Salvar tarefa
          </button>
        </div>
      }
    >
      <Field label="O que precisa ser feito?">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Renovar documento" autoFocus={!task} />
      </Field>
      <Field label="Prazo" hint="Tarefas com prazo aparecem na agenda e no Início.">
        <input type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
      </Field>
      <div className="field">
        <span className="field-label">Prioridade</span>
        <Chips label="Prioridade" value={priority} onChange={setPriority} options={(['alta', 'media', 'baixa'] as Priority[]).map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))} />
      </div>
      <Field label="Etiqueta (opcional)">
        <input className="input" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Ex.: casa, trabalho" />
      </Field>
      <Field label="Observações (opcional)">
        <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </Sheet>
  );
}
