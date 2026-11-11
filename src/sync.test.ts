import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, seedCategories } from './data.ts';
import { pruneDeleted, trackChanges } from './sync.ts';
import { addExpense, materialize } from './finance.ts';
import { addIncome } from './incomes.ts';
import { stableId } from './utils.ts';
import type { AppData, CalendarEvent } from './types.ts';

const T1 = '2026-11-11T10:00:00.000Z';
const T2 = '2026-11-11T11:00:00.000Z';
const ev = (id: string, title: string): CalendarEvent => ({ id, title, date: '2026-11-12', time: '', location: '', description: '' });

test('item novo ou alterado ganha data de alteração; a parte também', () => {
  const a = emptyData();
  const b = trackChanges(a, { ...a, events: [ev('e1', 'Dentista')] }, T1);
  assert.equal(b.stamps.e1, T1);
  assert.equal(b.stamps['@events'], T1);
  const c = trackChanges(b, { ...b, events: [ev('e1', 'Dentista 15h')] }, T2);
  assert.equal(c.stamps.e1, T2);
});

test('item que não mudou mantém a data antiga', () => {
  const a = { ...emptyData(), events: [ev('e1', 'A'), ev('e2', 'B')] };
  const b = trackChanges(a, { ...a, events: [a.events[0], ev('e2', 'B2')] }, T1);
  assert.equal(b.stamps.e1, undefined);
  assert.equal(b.stamps.e2, T1);
});

test('item apagado vai para as exclusões; se voltar, sai delas', () => {
  const a = { ...emptyData(), events: [ev('e1', 'A')], stamps: { e1: T1 } };
  const b = trackChanges(a, { ...a, events: [] }, T2);
  assert.equal(b.deleted.e1, T2);
  assert.equal(b.stamps.e1, undefined);
  const c = trackChanges(b, { ...b, events: [ev('e1', 'A')] }, T2);
  assert.equal(c.deleted.e1, undefined);
  assert.equal(c.stamps.e1, T2);
});

test('vale para itens dentro de Estudos e Carreira (listas dentro de listas)', () => {
  const a = emptyData();
  const job = { id: 'j1' } as unknown as AppData['career']['jobs'][number];
  const b = trackChanges(a, { ...a, career: { ...a.career, jobs: [job] } }, T1);
  assert.equal(b.stamps.j1, T1);
  assert.equal(b.stamps['@career'], T1);
  const c = trackChanges(b, { ...b, career: { ...b.career, jobs: [] } }, T2);
  assert.equal(c.deleted.j1, T2);
});

test('partes sem itens (humor, configurações) ganham só a data da parte', () => {
  const a = emptyData();
  const b = trackChanges(a, { ...a, workoutGoal: 5 }, T1);
  assert.equal(b.stamps['@workoutGoal'], T1);
});

test('sem mudança de verdade, devolve os mesmos dados', () => {
  const a = emptyData();
  assert.equal(trackChanges(a, a, T1), a);
  const copy = { ...a, events: [...a.events] };
  assert.equal(trackChanges(a, copy, T1), copy);
});

test('item que só mudou de lugar não conta como excluído', () => {
  const a = { ...emptyData(), notes: [{ id: 'x' }] } as unknown as AppData;
  const moved = { ...a, notes: [], journal: [{ id: 'x' }] } as unknown as AppData;
  const b = trackChanges(a, moved, T1);
  assert.equal(b.deleted.x, undefined);
});

test('exclusões com mais de 90 dias são esquecidas', () => {
  const d = { ...emptyData(), deleted: { velho: '2026-07-01T00:00:00.000Z', novo: '2026-11-01T00:00:00.000Z' } };
  const p = pruneDeleted(d, new Date('2026-11-11T00:00:00Z'));
  assert.deepEqual(Object.keys(p.deleted), ['novo']);
  assert.equal(pruneDeleted(p, new Date('2026-11-11T00:00:00Z')), p);
});

test('backup antigo sem datas abre normal (valores padrão)', () => {
  const d = normalize({ events: [ev('e1', 'A')] });
  assert.deepEqual(d.stamps, {});
  assert.deepEqual(d.deleted, {});
  assert.deepEqual(normalize({ stamps: { a: T1, b: 3 } }).stamps, { a: T1 });
});

test('itens gerados pelo app têm o mesmo id em qualquer aparelho', () => {
  assert.equal(stableId('categoria', 'Alimentação'), 'categoria~alimentacao');
  // Categorias padrão.
  const fresh = () => seedCategories({ ...emptyData(), settings: { ...emptyData().settings, seededCategories: false, seededIncomeSources: false } });
  assert.deepEqual(fresh().categories.map((c) => c.id), fresh().categories.map((c) => c.id));
  // Parcelas e contas fixas: série + número.
  const base = { ...emptyData(), categories: [{ id: 'cat', name: 'Outros', icon: 'tag', color: '#94a3b8' }] };
  const p = addExpense(base, { kind: 'parcelada', description: 'TV', categoryId: 'cat', method: 'pix', cardId: null, date: '2026-11-03', amounts: [50, 50], paidAt: null }, '2026-11-03');
  const sid = p.series[0].id;
  assert.deepEqual(p.expenses.map((e) => e.id), [`${sid}~1`, `${sid}~2`]);
  const f = materialize(addExpense(base, { kind: 'fixa', description: 'Luz', categoryId: 'cat', method: 'pix', cardId: null, date: '2026-11-03', amounts: [90], paidAt: null }, '2026-11-03'), '2027-01');
  assert.ok(f.expenses.every((e, i) => e.id === `${f.series[0].id}~${i + 1}`));
  // Receitas mensais.
  const r = addIncome(emptyData(), { description: 'Salário', sourceId: '', amount: 5000, date: '2026-11-05', recurring: true, receivedAt: null }, '2026-11-03');
  assert.equal(r.incomes[0].id, `${r.incomeSeries[0].id}~1`);
});
