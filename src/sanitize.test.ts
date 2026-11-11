import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discardedCount, normalize } from './data.ts';
import { fixExpense } from './sanitize.ts';

const NOW = '2026-11-11T10:00:00.000Z';

test('despesa só com id é separada, não derruba o resto', () => {
  const d = normalize({
    version: 2,
    expenses: [{ id: 'quebrada' }, { id: 'boa', amount: 10, dueDate: '2026-11-05', description: 'Pão' }],
  });
  assert.deepEqual(d.expenses.map((e) => e.id), ['boa']);
  assert.equal(discardedCount(d), 1);
  assert.deepEqual((d.legacy.descartados as Record<string, unknown[]>).expenses, [{ id: 'quebrada' }]);
});

test('despesa incompleta mas com valor e data é consertada', () => {
  const e = fixExpense({ id: 'x', amount: 50, dueDate: '2026-11-10' }, NOW)!;
  assert.equal(e.kind, 'avulsa');
  assert.equal(e.method, 'pix');
  assert.equal(e.description, 'Sem descrição');
  assert.equal(e.categoryId, '');
  assert.equal(e.cardId, null);
  assert.equal(e.paidAt, null);
  assert.equal(e.createdAt, NOW);
});

test('compra no cartão sem fatura ganha a fatura do vencimento; sem cartão vira pix', () => {
  const a = fixExpense({ id: 'a', amount: 5, dueDate: '2026-12-10', method: 'cartao', cardId: 'c1' }, NOW)!;
  assert.equal(a.invoiceMonth, '2026-12');
  assert.equal(a.purchaseDate, '2026-12-10');
  const b = fixExpense({ id: 'b', amount: 5, dueDate: '2026-12-10', method: 'cartao' }, NOW)!;
  assert.equal(b.method, 'pix');
  assert.equal(b.invoiceMonth, null);
});

test('valor não numérico ou data inválida separa a despesa', () => {
  assert.equal(fixExpense({ id: 'a', amount: '10', dueDate: '2026-11-10' }, NOW), null);
  assert.equal(fixExpense({ id: 'a', amount: NaN, dueDate: '2026-11-10' }, NOW), null);
  assert.equal(fixExpense({ id: 'a', amount: 10, dueDate: 'ontem' }, NOW), null);
});

test('cartão, receita, nota, diário, tarefa e compromisso incompletos', () => {
  const d = normalize({
    version: 2,
    cards: [{ id: 'c' }],
    incomes: [{ id: 'i' }, { id: 'i2', amount: 100, date: '2026-11-05' }],
    notes: [{ id: 'n' }],
    journal: [{ id: 'j' }],
    tasks: [{ id: 't' }],
    events: [{ id: 'e' }, { id: 'e2', date: '2026-11-12' }],
  });
  assert.equal(d.cards[0].name, 'Cartão');
  assert.equal(d.cards[0].closingDay, 1);
  assert.deepEqual(d.cards[0].paidInvoices, {});
  assert.deepEqual(d.incomes.map((i) => i.id), ['i2']);
  assert.equal(d.notes[0].title, '');
  assert.equal(d.notes[0].pinned, false);
  assert.equal(typeof d.journal[0].createdAt, 'string');
  assert.equal(d.tasks[0].title, 'Sem título');
  assert.equal(d.tasks[0].priority, 'media');
  assert.deepEqual(d.events.map((e) => e.id), ['e2']);
  assert.equal(d.events[0].time, '');
  assert.equal(discardedCount(d), 2);
});

test('registros que já estavam bons passam sem mudança', () => {
  const exp = {
    id: 'ok', kind: 'parcelada', seriesId: 's', installment: 2, installments: 3, description: 'TV', categoryId: 'cat',
    amount: 300, method: 'cartao', cardId: 'c', dueDate: '2026-12-10', purchaseDate: '2026-11-02', invoiceMonth: '2026-12',
    paidAt: null, createdAt: '2026-11-02T00:00:00Z', updatedAt: '2026-11-02T00:00:00Z', voucherId: null,
  };
  const d = normalize({ version: 2, expenses: [exp] });
  assert.deepEqual(d.expenses[0], exp);
  assert.equal(discardedCount(d), 0);
});

test('separados se acumulam entre aberturas sem duplicar o que já foi conferido', () => {
  const first = normalize({ version: 2, expenses: [{ id: 'q1' }] });
  const second = normalize({ ...first, expenses: [...first.expenses, { id: 'q2' }] });
  assert.equal(discardedCount(second), 2);
  const third = normalize(second);
  assert.equal(discardedCount(third), 2);
});
