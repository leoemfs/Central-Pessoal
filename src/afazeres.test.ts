import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './data.ts';
import { allTodos, filterTodos, toggleTodo } from './afazeres.ts';

const d = normalize({
  version: 2,
  tasks: [
    { id: 't1', title: 'Renovar RG', due: '2026-11-18', priority: 'alta', done: false },
    { id: 't2', title: 'Pagar conta', due: null, priority: 'media', done: true },
  ],
  career: {
    meetings: [{ id: 'm1', title: '', with: 'Ana', date: '2026-11-10', todos: [{ id: 'c1', text: 'Mandar planilha', done: false }] }],
    projects: [
      { id: 'p1', name: 'Repasse', status: 'andando', deliveries: [{ id: 'e1', text: 'Relatório', date: '2026-11-19', done: false }] },
      { id: 'p2', name: 'Velho', status: 'concluido', deliveries: [{ id: 'e2', text: 'X', date: null, done: false }] },
    ],
    goals: [
      { id: 'g1', title: 'Ser líder', steps: [{ id: 's1', text: 'Curso', done: false }] },
      { id: 'g2', title: 'Feita', doneAt: '2026-11-01', steps: [{ id: 's2', text: 'Y', done: false }] },
    ],
  },
});

test('junta tarefas, combinados, entregas e passos com a origem', () => {
  const all = allTodos(d);
  assert.deepEqual(all.map((t) => t.key), ['tarefa:t1', 'tarefa:t2', 'combinado:m1:c1', 'entrega:p1:e1', 'passo:g1:s1']);
  const c = all.find((t) => t.source === 'combinado')!;
  assert.equal(c.from, 'Reunião com Ana');
  assert.equal(c.to, 'carreira/abrir-m-m1');
  assert.equal(all.find((t) => t.source === 'entrega')!.to, 'carreira/abrir-p-p1');
  assert.equal(all.find((t) => t.source === 'passo')!.to, 'objetivos');
});

test('filtros: pendentes, hoje e atrasadas, concluídas', () => {
  const all = allTodos(d);
  assert.deepEqual(filterTodos(all, 'pendentes', '2026-11-18').map((t) => t.key), ['tarefa:t1', 'entrega:p1:e1', 'combinado:m1:c1', 'passo:g1:s1']);
  assert.deepEqual(filterTodos(all, 'hoje', '2026-11-18').map((t) => t.key), ['tarefa:t1']);
  assert.deepEqual(filterTodos(all, 'hoje', '2026-11-19').map((t) => t.key), ['tarefa:t1', 'entrega:p1:e1']);
  assert.deepEqual(filterTodos(all, 'concluidas', '2026-11-18').map((t) => t.key), ['tarefa:t2']);
});

test('marcar aqui marca na origem (e desmarca)', () => {
  const all = allTodos(d);
  let x = d;
  for (const it of all.filter((t) => !t.done)) x = toggleTodo(it, '2026-11-18T10:00:00.000Z')(x);
  assert.equal(x.tasks[0].done, true);
  assert.equal(x.tasks[0].doneAt, '2026-11-18T10:00:00.000Z');
  assert.equal(x.career.meetings[0].todos[0].done, true);
  assert.equal(x.career.projects[0].deliveries[0].done, true);
  assert.equal(x.career.goals[0].steps[0].done, true);
  assert.equal(x.career.projects[1].deliveries[0].done, false);
  const back = toggleTodo(all[2])(x);
  assert.equal(back.career.meetings[0].todos[0].done, false);
  assert.equal(allTodos(x).filter((t) => !t.done).length, 0);
});
