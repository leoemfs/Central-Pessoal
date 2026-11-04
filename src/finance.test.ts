import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize } from './data.ts';
import {
  addExpense, cardUsed, categoryTotals, deleteExpense, editExpense, getInvoice, invoiceClosingDate, invoiceDueDate,
  invoiceMonthFor, materialize, monthBills, openBills, payExpense, payInvoice, splitAmount, summarize, type ExpenseInput,
} from './finance.ts';
import type { AppData, CreditCard } from './types.ts';

const TODAY = '2026-11-03';
const card: CreditCard = { id: 'c1', name: 'PicPay', closingDay: 10, dueDay: 17, limit: 2000, color: '#22c55e', paidInvoices: {}, createdAt: '' };

function base(): AppData {
  const d = emptyData();
  return { ...d, cards: [card], categories: [{ id: 'cat', name: 'Outros', icon: 'tag', color: '#94a3b8' }] };
}
const input = (p: Partial<ExpenseInput>): ExpenseInput => ({
  kind: 'avulsa', description: 'X', categoryId: 'cat', method: 'pix', cardId: null, date: TODAY, amounts: [100], paidAt: null, ...p,
});
const ofSeries = (d: AppData) => d.expenses.filter((e) => e.seriesId).sort((a, b) => (a.installment ?? 0) - (b.installment ?? 0));

test('fatura: compra antes do fechamento entra na fatura que fecha; no dia ou depois, na próxima', () => {
  assert.equal(invoiceMonthFor(card, '2026-11-05'), '2026-11');
  assert.equal(invoiceMonthFor(card, '2026-11-09'), '2026-11');
  assert.equal(invoiceMonthFor(card, '2026-11-10'), '2026-12');
  assert.equal(invoiceMonthFor(card, '2026-11-25'), '2026-12');
  assert.equal(invoiceDueDate(card, '2026-12'), '2026-12-17');
  assert.equal(invoiceClosingDate(card, '2026-12'), '2026-12-10');
});

test('fatura: vencimento antes do fechamento no calendário vence no mês seguinte', () => {
  const c = { closingDay: 28, dueDay: 5 };
  assert.equal(invoiceMonthFor(c, '2026-11-20'), '2026-12'); // fecha 28/11, vence 05/12
  assert.equal(invoiceMonthFor(c, '2026-11-28'), '2027-01'); // fecha 28/12, vence 05/01
  assert.equal(invoiceClosingDate(c, '2026-12'), '2026-11-28');
});

test('fatura: fechamento no dia 31 em fevereiro usa o último dia do mês', () => {
  const c = { closingDay: 31, dueDay: 10 };
  assert.equal(invoiceMonthFor(c, '2027-02-27'), '2027-03');
  assert.equal(invoiceMonthFor(c, '2027-02-28'), '2027-04');
  assert.equal(invoiceClosingDate(c, '2027-03'), '2027-02-28');
});

test('parcelas: centavos que sobram vão para a última', () => {
  assert.deepEqual(splitAmount(100, 3), [33.33, 33.33, 33.34]);
  assert.deepEqual(splitAmount(600, 6), [100, 100, 100, 100, 100, 100]);
});

test('parcelada: 12 vezes mantendo o dia 10, numeradas 1..12', () => {
  const d = addExpense(base(), input({ kind: 'parcelada', date: '2026-11-10', amounts: Array(12).fill(671.96) }), TODAY);
  const xs = ofSeries(d);
  assert.equal(xs.length, 12);
  assert.equal(xs[0].dueDate, '2026-11-10');
  assert.equal(xs[11].dueDate, '2027-10-10');
  assert.deepEqual(xs.map((x) => x.installment), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.ok(xs.every((x) => x.installments === 12));
});

test('parcelada no dia 31 cai no último dia dos meses curtos', () => {
  const d = addExpense(base(), input({ kind: 'parcelada', date: '2027-01-31', amounts: [10, 10, 10] }), TODAY);
  assert.deepEqual(ofSeries(d).map((x) => x.dueDate), ['2027-01-31', '2027-02-28', '2027-03-31']);
});

test('parcelada no cartão: cada parcela numa fatura seguida e o limite desconta as futuras', () => {
  const d = addExpense(base(), input({ kind: 'parcelada', method: 'cartao', cardId: 'c1', date: '2026-11-12', amounts: splitAmount(600, 6) }), TODAY);
  const xs = ofSeries(d);
  assert.deepEqual(xs.map((x) => x.invoiceMonth), ['2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05']);
  assert.ok(xs.every((x) => x.purchaseDate === '2026-11-12'));
  assert.equal(xs[0].dueDate, '2026-12-17');
  assert.equal(cardUsed(d, card, TODAY), 600);
  const paid = payInvoice(d, 'c1', '2026-12', '2026-12-15');
  assert.equal(cardUsed(paid, paid.cards[0], TODAY), 500);
});

test('limite: mensalidades futuras no cartão não ocupam o limite', () => {
  const d = addExpense(base(), input({ kind: 'fixa', method: 'cartao', cardId: 'c1', date: TODAY, amounts: [13.5] }), TODAY);
  assert.equal(d.expenses.length, 3, 'gera os próximos meses');
  assert.equal(cardUsed(d, card, TODAY), 13.5);
});

test('conta fixa: gera até 2 meses à frente e continua gerando com o tempo', () => {
  let d = addExpense(base(), input({ kind: 'fixa', description: 'Aluguel', date: '2026-11-05', amounts: [1200] }), TODAY);
  assert.deepEqual(ofSeries(d).map((x) => x.dueDate), ['2026-11-05', '2026-12-05', '2027-01-05']);
  d = materialize(d, '2027-03');
  assert.equal(ofSeries(d).length, 5);
  assert.equal(materialize(d, '2027-03'), d, 'sem mudanças não cria um novo estado');
});

test('conta fixa de valor variável: valor pago vira previsão dos próximos não pagos', () => {
  let d = addExpense(base(), input({ kind: 'fixa', description: 'Luz', date: '2026-11-10', amounts: [150] }), TODAY);
  const [nov] = ofSeries(d);
  d = payExpense(d, nov.id, '2026-11-12', 182.4);
  const xs = ofSeries(d);
  assert.equal(xs[0].paidAt, '2026-11-12');
  assert.equal(xs[0].amount, 182.4);
  assert.equal(xs[1].amount, 182.4);
  assert.equal(materialize(d, '2027-02').expenses.at(-1)?.amount, 182.4);
});

test('editar "todas": descrição muda em todas, valor só nas não pagas', () => {
  let d = addExpense(base(), input({ kind: 'parcelada', date: '2026-10-10', amounts: [250, 250, 250] }), TODAY);
  const [p1, p2] = ofSeries(d);
  d = payExpense(d, p1.id, '2026-10-10', 250);
  d = editExpense(d, p2.id, { description: 'Moto', categoryId: 'cat', amount: 300, date: '2026-11-15', method: 'pix', cardId: null }, 'all');
  const xs = ofSeries(d);
  assert.deepEqual(xs.map((x) => x.description), ['Moto', 'Moto', 'Moto']);
  assert.deepEqual(xs.map((x) => x.amount), [250, 300, 300]);
  assert.deepEqual(xs.map((x) => x.dueDate), ['2026-10-10', '2026-11-15', '2026-12-15']);
});

test('editar "somente esta" e "esta e as próximas"', () => {
  let d = addExpense(base(), input({ kind: 'parcelada', date: '2026-11-10', amounts: [100, 100, 100, 100] }), TODAY);
  const xs0 = ofSeries(d);
  const patch = { description: 'Novo', categoryId: 'cat', amount: 90, date: '2026-12-10', method: 'pix' as const, cardId: null };
  d = editExpense(d, xs0[1].id, patch, 'one');
  assert.deepEqual(ofSeries(d).map((x) => x.amount), [100, 90, 100, 100]);
  d = editExpense(d, xs0[2].id, { ...patch, amount: 80, date: '2027-01-10' }, 'next');
  assert.deepEqual(ofSeries(d).map((x) => x.amount), [100, 90, 80, 80]);
  assert.deepEqual(ofSeries(d).map((x) => x.description), ['X', 'Novo', 'Novo', 'Novo']);
});

test('excluir "esta e as próximas" encerra a conta fixa', () => {
  let d = addExpense(base(), input({ kind: 'fixa', date: '2026-11-05', amounts: [50] }), TODAY);
  const xs = ofSeries(d);
  d = deleteExpense(d, xs[1].id, 'next');
  assert.equal(ofSeries(d).length, 1);
  assert.equal(materialize(d, '2027-12'), d, 'não volta a gerar');
  d = deleteExpense(d, xs[0].id, 'one');
  assert.equal(d.series.length, 0, 'série encerrada e vazia é removida');
  assert.ok(d.deleted[xs[0].id]);
});

test('excluir "todas" remove a série inteira', () => {
  let d = addExpense(base(), input({ kind: 'parcelada', date: '2026-11-10', amounts: [1, 1, 1] }), TODAY);
  d = deleteExpense(d, ofSeries(d)[1].id, 'all');
  assert.equal(d.expenses.length, 0);
  assert.equal(d.series.length, 0);
});

test('resumo do mês: fatura entra como uma conta; pago e em aberto', () => {
  let d = base();
  d = addExpense(d, input({ description: 'Internet', date: '2026-11-15', amounts: [100], paidAt: '2026-11-01' }), TODAY);
  d = addExpense(d, input({ description: 'Aluguel', date: '2026-11-05', amounts: [1000] }), TODAY);
  d = addExpense(d, input({ description: 'Mercado', method: 'cartao', cardId: 'c1', date: '2026-11-02', amounts: [200] }), TODAY);
  d = addExpense(d, input({ description: 'Farmácia', method: 'cartao', cardId: 'c1', date: '2026-11-08', amounts: [50] }), TODAY);
  const bills = monthBills(d, '2026-11', TODAY);
  assert.deepEqual(bills.map((b) => b.title), ['Aluguel', 'Internet', 'Fatura PicPay']);
  assert.equal(bills[2].amount, 250);
  assert.deepEqual(summarize(bills), { total: 1350, paid: 100, open: 1250, pct: (100 / 1350) * 100 });
  assert.equal(categoryTotals(d, '2026-11')[0].amount, 1350);
  assert.deepEqual(openBills(d, '2026-11-10', TODAY).map((b) => b.title), ['Aluguel']);
  assert.equal(getInvoice(d, card, '2026-11', TODAY).status, 'aberta');
  assert.equal(getInvoice(d, card, '2026-11', '2026-11-10').status, 'fechada');
});

test('migração do protótipo v1: despesas viram avulsas pagas e receitas viram receitas', () => {
  const d = normalize({
    version: 1,
    tasks: [{ id: 't', title: 'a' }],
    transactions: [
      { id: 'a', type: 'despesa', amount: 10, category: 'Lazer', description: 'Cinema', date: '2026-11-01' },
      { id: 'b', type: 'despesa', amount: 5, category: 'Pet', description: '', date: '2026-11-02' },
      { id: 'c', type: 'receita', amount: 5000, category: 'Salário', description: '', date: '2026-11-05' },
    ],
  });
  assert.equal(d.tasks.length, 1);
  assert.equal(d.expenses.length, 2);
  assert.equal(d.expenses[0].paidAt, '2026-11-01');
  assert.ok(d.categories.some((c) => c.name === 'Pet'));
  assert.equal(d.incomes.length, 1, 'a receita do protótipo vira uma receita recebida');
  assert.equal(normalize(d).expenses.length, 2, 'normalizar de novo não duplica');
});
