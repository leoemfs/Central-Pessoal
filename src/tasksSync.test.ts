import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyToApp, planTasks, readMark, withMark, type GTask } from './tasksSync.ts';
import { emptyData } from './data.ts';
import { mergeData } from './sync.ts';
import type { AppData, Task } from './types.ts';

const T1 = '2026-11-12T10:00:00.000Z';
const T2 = '2026-11-12T11:00:00.000Z';
const task = (id: string, p: Partial<Task> = {}): Task => ({ id, title: 'Renovar CNH', notes: '', due: '2026-11-20', priority: 'media', tag: '', done: false, createdAt: T1, doneAt: null, ...p });
const g = (id: string, appId: string | null, p: Partial<GTask> = {}): GTask => ({
  id, title: 'Renovar CNH', notes: appId ? withMark('', appId) : '', due: '2026-11-20', done: false, updated: T1, deleted: false, ...p,
});
const data = (tasks: Task[], stamps: Record<string, string> = {}, deleted: Record<string, string> = {}): AppData => ({ ...emptyData(), tasks, stamps, deleted });

test('marca: separa as notas do id do app', () => {
  assert.deepEqual(readMark(withMark('levar RG', 'abc-1')), { body: 'levar RG', appId: 'abc-1' });
  assert.deepEqual(readMark('só notas'), { body: 'só notas', appId: null });
});

test('tarefa aberta do app vai para o Google; concluída que nunca foi, não', () => {
  const p = planTasks(data([task('a'), task('b', { done: true })]), []);
  assert.equal(p.create.length, 1);
  assert.equal(readMark(p.create[0].notes).appId, 'a');
});

test('concluir no Google conclui no app (mudança mais recente lá)', () => {
  const d = data([task('a')], { a: T1 });
  const p = planTasks(d, [g('g1', 'a', { done: true, updated: T2 })]);
  assert.equal(p.toApp[0].task.done, true);
  const m = mergeData(d, applyToApp(d, p)!);
  assert.equal(m.tasks[0].done, true);
});

test('mudar no app depois: o Google é atualizado', () => {
  const p = planTasks(data([task('a', { title: 'Renovar CNH e RG' })], { a: T2 }), [g('g1', 'a', { updated: T1 })]);
  assert.deepEqual(p.update.map((u) => [u.id, u.task.title]), [['g1', 'Renovar CNH e RG']]);
  assert.equal(p.toApp.length, 0);
});

test('igual dos dois lados: nada a fazer', () => {
  const p = planTasks(data([task('a')], { a: T1 }), [g('g1', 'a', { updated: T2 })]);
  assert.deepEqual([p.create.length, p.update.length, p.remove.length, p.toApp.length], [0, 0, 0, 0]);
});

test('excluir no app tira do Google; excluir no Google tira do app', () => {
  const p1 = planTasks(data([], {}, { a: T2 }), [g('g1', 'a')]);
  assert.deepEqual(p1.remove, ['g1']);
  const d = data([task('a')], { a: T1 });
  const p2 = planTasks(d, [g('g1', 'a', { deleted: true, updated: T2 })]);
  const m = mergeData(d, applyToApp(d, p2)!);
  assert.equal(m.tasks.length, 0);
});

test('tarefa de outro aparelho que este ainda não conhece não é apagada do Google', () => {
  const p = planTasks(data([]), [g('g1', 'de-outro-aparelho')]);
  assert.deepEqual(p.remove, []);
});

test('criada direto no Google entra no app e ganha a marca', () => {
  const d = data([]);
  const p = planTasks(d, [g('g9', null, { title: 'Comprar pilhas', due: null })], T2);
  assert.equal(p.toApp[0].task.title, 'Comprar pilhas');
  assert.equal(readMark(p.update[0].task.notes).appId, p.toApp[0].task.id);
  assert.equal(mergeData(d, applyToApp(d, p)!).tasks[0].title, 'Comprar pilhas');
});

test('duplicada no Google (dois aparelhos): fica uma', () => {
  const p = planTasks(data([task('a')], { a: T1 }), [g('g1', 'a', { updated: T1 }), g('g2', 'a', { updated: T2 })]);
  assert.deepEqual(p.remove, ['g1']);
});
