import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize } from './data.ts';
import { addExpense, payExpense } from './finance.ts';
import {
  addIncome, deleteIncome, editIncome, incomeStatus, incomeSummary, materializeIncomes, monthBalance, monthIncomes, receiveIncome,
  sourceTotals, type IncomeInput,
} from './incomes.ts';

const TODAY = '2026-11-04';
const base = () => ({ ...emptyData(), incomeSources: [{ id: 'sal', name: 'Salário', icon: 'briefcase', color: '#22c55e' }, { id: 'free', name: 'Freelance', icon: 'bolt', color: '#3b82f6' }] });
const input = (p: Partial<IncomeInput>): IncomeInput => ({ description: 'Salário', sourceId: 'sal', amount: 5000, date: '2026-11-05', recurring: false, receivedAt: null, ...p });
const ofSeries = (d: ReturnType<typeof base>) => d.incomes.filter((i) => i.seriesId).sort((a, b) => (a.installment ?? 0) - (b.installment ?? 0));

test('receita avulsa, prevista ou recebida', () => {
  let d = addIncome(base(), input({ description: 'Site da Ana', sourceId: 'free', amount: 1200, date: '2026-11-20' }), TODAY);
  d = addIncome(d, input({ description: 'Bônus', amount: 800, date: '2026-11-02', receivedAt: '2026-11-02' }), TODAY);
  const list = monthIncomes(d, '2026-11');
  assert.deepEqual(list.map((i) => i.description), ['Bônus', 'Site da Ana']);
  assert.deepEqual(incomeSummary(list), { total: 2000, received: 800, pending: 1200, pct: 40 });
  assert.equal(incomeStatus(list[1], TODAY), 'previsto');
  assert.equal(incomeStatus({ receivedAt: null, date: '2026-11-01' }, TODAY), 'atrasado');
});

test('salário mensal: gera os próximos meses e continua com o tempo', () => {
  let d = addIncome(base(), input({ recurring: true, receivedAt: '2026-11-05' }), TODAY);
  const xs = ofSeries(d);
  assert.deepEqual(xs.map((i) => i.date), ['2026-11-05', '2026-12-05', '2027-01-05']);
  assert.equal(xs[0].receivedAt, '2026-11-05', 'só o primeiro já entrou');
  assert.equal(xs[1].receivedAt, null);
  d = materializeIncomes(d, '2027-03');
  assert.equal(ofSeries(d).length, 5);
  assert.equal(materializeIncomes(d, '2027-03'), d);
});

test('receber com outro valor ajusta a previsão dos próximos meses', () => {
  let d = addIncome(base(), input({ recurring: true }), TODAY);
  const [nov] = ofSeries(d);
  d = receiveIncome(d, nov.id, '2026-11-06', 5300);
  assert.deepEqual(ofSeries(d).map((i) => i.amount), [5300, 5300, 5300]);
  assert.equal(ofSeries(d)[0].receivedAt, '2026-11-06');
});

test('editar "este e os próximos" e excluir encerrando a série', () => {
  let d = addIncome(base(), input({ recurring: true }), TODAY);
  const xs = ofSeries(d);
  d = receiveIncome(d, xs[0].id, '2026-11-05', 5000);
  d = editIncome(d, xs[0].id, { description: 'Salário (novo emprego)', sourceId: 'sal', amount: 6000, date: '2026-11-10' }, 'next');
  assert.deepEqual(ofSeries(d).map((i) => i.amount), [5000, 6000, 6000], 'o já recebido mantém o valor');
  assert.deepEqual(ofSeries(d).map((i) => i.date), ['2026-11-05', '2026-12-10', '2027-01-10']);
  assert.ok(ofSeries(d).every((i) => i.description === 'Salário (novo emprego)'));
  d = deleteIncome(d, ofSeries(d)[1].id, 'next');
  assert.equal(ofSeries(d).length, 1);
  assert.equal(materializeIncomes(d, '2027-12'), d, 'não volta a gerar');
});

test('balanço do mês: previsto e realizado contra as despesas', () => {
  let d = addIncome(base(), input({ receivedAt: '2026-11-05' }), TODAY);
  d = addIncome(d, input({ description: 'Freela', sourceId: 'free', amount: 1000, date: '2026-11-25' }), TODAY);
  d = { ...d, categories: [{ id: 'c', name: 'Casa', icon: 'home', color: '#3b82f6' }] };
  d = addExpense(d, { kind: 'avulsa', description: 'Aluguel', categoryId: 'c', method: 'boleto', cardId: null, date: '2026-11-10', amounts: [1500], paidAt: null }, TODAY);
  d = payExpense(d, d.expenses[0].id, '2026-11-09', 1500);
  d = addExpense(d, { kind: 'avulsa', description: 'Luz', categoryId: 'c', method: 'boleto', cardId: null, date: '2026-11-20', amounts: [200], paidAt: null }, TODAY);
  const b = monthBalance(d, '2026-11', TODAY);
  assert.deepEqual(b, { incomeTotal: 6000, incomeReceived: 5000, expenseTotal: 1700, expensePaid: 1500, planned: 4300, current: 3500 });
  assert.deepEqual(sourceTotals(d, '2026-11').map((s) => s.sourceId), ['sal', 'free']);
});

test('receitas do protótipo voltam como receitas recebidas', () => {
  const d = normalize({ version: 1, transactions: [{ id: 'r', type: 'receita', amount: 5000, category: 'Salário', description: '', date: '2026-11-01' }] });
  assert.equal(d.incomes.length, 1);
  assert.equal(d.incomes[0].receivedAt, '2026-11-01');
  assert.equal(d.incomeSources.find((s) => s.id === d.incomes[0].sourceId)?.name, 'Salário');
  assert.equal(d.legacy.receitas, undefined);
  assert.equal(normalize(d).incomes.length, 1, 'normalizar de novo não duplica');
});
