import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData } from './data.ts';
import { addExpense, cardUsed, editExpense, getInvoice, invoiceChoices, materialize, openInvoiceMonth, type ExpenseInput } from './finance.ts';
import type { AppData, CreditCard } from './types.ts';

// Fecha dia 5, vence dia 10 (mesmo mês).
const card: CreditCard = { id: 'c', name: 'Novo', closingDay: 5, dueDay: 10, limit: 3000, color: '#22c55e', paidInvoices: {}, createdAt: '' };
const base = (): AppData => ({ ...emptyData(), cards: [card], categories: [{ id: 'cat', name: 'Outros', icon: 'tag', color: '#94a3b8' }] });
const input = (p: Partial<ExpenseInput>): ExpenseInput => ({
  kind: 'avulsa', description: 'X', categoryId: 'cat', method: 'cartao', cardId: 'c', date: '2026-11-07', amounts: [100], paidAt: null, ...p,
});

test('fatura aberta: antes do fechamento, a do mês; no dia e depois, a seguinte', () => {
  assert.equal(openInvoiceMonth(card, '2026-11-04'), '2026-11');
  assert.equal(openInvoiceMonth(card, '2026-11-05'), '2026-12');
  assert.equal(openInvoiceMonth(card, '2026-11-20'), '2026-12');
  const vira: CreditCard = { ...card, closingDay: 31, dueDay: 8 }; // vence antes de fechar → mês seguinte
  assert.equal(openInvoiceMonth(vira, '2026-02-10'), '2026-03');
});

test('opções de fatura: a anterior só se ainda não venceu na data da compra', () => {
  assert.deepEqual(invoiceChoices(card, '2026-11-07'), ['2026-11', '2026-12', '2027-01']);
  assert.deepEqual(invoiceChoices(card, '2026-11-12'), ['2026-12', '2027-01']);
});

test('compra com a fatura escolhida (a atual, em vez da próxima)', () => {
  const d = addExpense(base(), input({ invoiceMonth: '2026-11' }), '2026-11-07');
  const e = d.expenses[0];
  assert.equal(e.invoiceMonth, '2026-11');
  assert.equal(e.dueDate, '2026-11-10');
  assert.equal(getInvoice(d, card, '2026-11', '2026-11-07').total, 100);
  assert.equal(cardUsed(d, card, '2026-11-07'), 100);
  // sem escolha, continua como antes
  assert.equal(addExpense(base(), input({}), '2026-11-07').expenses[0].invoiceMonth, '2026-12');
});

test('parcelada começa na fatura escolhida e segue mês a mês', () => {
  const d = addExpense(base(), input({ kind: 'parcelada', amounts: [50, 50, 50], invoiceMonth: '2026-11' }), '2026-11-07');
  assert.deepEqual(d.expenses.map((e) => e.invoiceMonth).sort(), ['2026-11', '2026-12', '2027-01']);
});

test('conta fixa no cartão guarda a fatura escolhida para as próximas', () => {
  let d = addExpense(base(), input({ kind: 'fixa', invoiceMonth: '2026-11' }), '2026-11-07');
  d = materialize(d, '2027-02');
  const months = d.expenses.map((e) => e.invoiceMonth).sort();
  assert.equal(months[0], '2026-11');
  assert.equal(months[1], '2026-12');
});

test('editar troca a fatura; em parcelas, as próximas andam junto', () => {
  let d = addExpense(base(), input({}), '2026-11-07');
  const id = d.expenses[0].id;
  d = editExpense(d, id, { description: 'X', categoryId: 'cat', amount: 100, date: '2026-11-07', method: 'cartao', cardId: 'c', invoiceMonth: '2026-11' }, 'one');
  assert.equal(d.expenses[0].invoiceMonth, '2026-11');
  assert.equal(d.expenses[0].dueDate, '2026-11-10');

  let p = addExpense(base(), input({ kind: 'parcelada', amounts: [50, 50, 50] }), '2026-11-07');
  const first = p.expenses.find((e) => e.installment === 1)!;
  p = editExpense(p, first.id, { description: 'X', categoryId: 'cat', amount: 50, date: '2026-11-07', method: 'cartao', cardId: 'c', invoiceMonth: '2026-11' }, 'all');
  assert.deepEqual(p.expenses.map((e) => e.invoiceMonth).sort(), ['2026-11', '2026-12', '2027-01']);
});
