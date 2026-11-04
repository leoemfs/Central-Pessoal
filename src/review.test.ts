import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalizeHabit } from './data.ts';
import { addExpense, payExpense, splitAmount, type ExpenseInput } from './finance.ts';
import { defaultReviewWeek, weekReview, weekStart } from './review.ts';
import type { AppData } from './types.ts';

test('semana começa na segunda; na segunda a revisão abre a semana anterior', () => {
  assert.equal(weekStart('2026-11-04'), '2026-11-02'); // quarta
  assert.equal(weekStart('2026-11-08'), '2026-11-02'); // domingo
  assert.equal(weekStart('2026-11-09'), '2026-11-09'); // segunda
  assert.equal(defaultReviewWeek('2026-11-09'), '2026-11-02');
  assert.equal(defaultReviewWeek('2026-11-08'), '2026-11-02');
});

test('revisão junta núcleo, finanças, agenda e diário da semana', () => {
  const TODAY = '2026-11-08'; // domingo, fim da semana 02–08/11
  let d: AppData = {
    ...emptyData(),
    cards: [{ id: 'c', name: 'PicPay', closingDay: 10, dueDay: 17, limit: null, color: '#22c55e', paidInvoices: {}, createdAt: '' }],
    categories: [{ id: 'a', name: 'Alimentação', icon: 'utensils', color: '#f97316' }, { id: 'b', name: 'Compras', icon: 'bag', color: '#22c55e' }],
    habits: [
      normalizeHabit({ id: 'r', name: 'Fio dental', kind: 'ritual', createdAt: '2026-10-01T08:00:00', checks: ['2026-11-02', '2026-11-03', '2026-11-05'] }),
      normalizeHabit({ id: 'q', name: 'Refri', kind: 'abandonar', startDate: '2026-10-01', slips: ['2026-11-04'] }),
    ],
    events: [{ id: 'e', title: 'Dentista', date: '2026-11-04', time: '', location: '', description: '' }, { id: 'f', title: 'Viagem', date: '2026-11-12', time: '', location: '', description: '' }],
    tasks: [{ id: 't', title: 'X', notes: '', due: '2026-11-03', priority: 'media', tag: '', done: true, createdAt: '', doneAt: '2026-11-03T10:00:00' }],
    journal: [{ id: 'j', createdAt: '2026-11-05T21:00:00', title: 'Dia bom', summary: '', content: '', tag: '', updatedAt: '' }],
  };
  const inp = (p: Partial<ExpenseInput>): ExpenseInput => ({ kind: 'avulsa', description: 'M', categoryId: 'a', method: 'pix', cardId: null, date: '2026-11-03', amounts: [100], paidAt: null, ...p });
  d = addExpense(d, inp({ paidAt: '2026-11-03' }), TODAY);
  d = addExpense(d, inp({ kind: 'parcelada', method: 'cartao', cardId: 'c', categoryId: 'b', date: '2026-11-06', amounts: splitAmount(600, 6) }), TODAY);
  d = addExpense(d, inp({ description: 'Luz', date: '2026-11-12', amounts: [180] }), TODAY);
  d = addExpense(d, inp({ description: 'Gás', date: '2026-11-01', amounts: [90] }), TODAY); // semana anterior, ainda aberto
  d = payExpense(d, d.expenses.find((e) => e.description === 'Gás')!.id, '2026-11-04', 90);

  const r = weekReview(d, '2026-11-02', TODAY);
  assert.equal(r.end, '2026-11-08');
  assert.deepEqual([r.routineDone, r.routineScheduled], [3, 7]);
  assert.equal(r.quitting[0].slips, 1);
  assert.equal(r.spent, 700, 'R$ 100 no pix + compra de R$ 600 no cartão (pelo total)');
  assert.equal(r.byCategory[0].categoryId, 'b');
  assert.equal(r.paid, 190, 'mercado pago dia 03 + gás pago dia 04');
  assert.ok(r.nextBills.some((b) => b.title === 'Luz'));
  assert.equal(r.events, 1);
  assert.equal(r.nextEvents, 1);
  assert.equal(r.tasksDone, 1);
  assert.equal(r.journal.length, 1);
});
