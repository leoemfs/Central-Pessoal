import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, seedCategories } from './data.ts';
import { addExpense, editExpense, monthBills, openBills } from './finance.ts';
import { monthBalance } from './incomes.ts';
import { adjustVoucherBalance, materializeVouchers, newVoucher, nextRecharge, voucherBalance, voucherStatus } from './vouchers.ts';
import type { AppData } from './types.ts';

// Cadastro em 05/11/2026; recarga de R$ 800 todo dia 1º.
const D0 = '2026-11-05';
function setup(): AppData {
  const d = seedCategories(emptyData());
  return { ...d, vouchers: [newVoucher({ name: 'VR Alelo', color: '#f97316', recharge: { amount: 800, day: 1 }, balance: 650 }, D0)] };
}
const food = (d: AppData) => d.categories.find((c) => c.name === 'Alimentação')!.id;
const buy = (d: AppData, amount: number, date: string) =>
  addExpense(d, { kind: 'avulsa', description: 'Almoço', categoryId: food(d), method: 'vale', cardId: null, date, amounts: [amount], paidAt: null, voucherId: d.vouchers[0].id }, date);

test('compra no vale já nasce paga, desconta do saldo e não vira conta a vencer', () => {
  let d = setup();
  d = buy(d, 45.5, '2026-11-06');
  const e = d.expenses[0];
  assert.equal(e.method, 'vale');
  assert.equal(e.voucherId, d.vouchers[0].id);
  assert.equal(e.paidAt, '2026-11-06');
  assert.equal(e.cardId, null);
  assert.equal(voucherBalance(d, d.vouchers[0], '2026-11-06'), 604.5);
  assert.equal(openBills(d, '2026-12-31', '2026-11-06').length, 0);
  assert.equal(monthBills(d, '2026-11', '2026-11-06')[0].paidAt, '2026-11-06');
});

test('a recarga cai sozinha no dia, uma vez por mês, como receita recebida', () => {
  let d = setup();
  // A recarga de novembro (dia 1º) já estava no saldo informado.
  assert.equal(materializeVouchers(d, D0).incomes.length, 0);
  d = materializeVouchers(d, '2026-12-01');
  d = materializeVouchers(d, '2026-12-15');
  assert.equal(d.incomes.length, 1);
  const r = d.incomes[0];
  assert.equal(r.amount, 800);
  assert.equal(r.date, '2026-12-01');
  assert.equal(r.receivedAt, '2026-12-01');
  assert.equal(r.voucherId, d.vouchers[0].id);
  assert.equal(d.incomeSources.find((s) => s.id === r.sourceId)!.name, 'Vale-alimentação');
  assert.equal(voucherBalance(d, d.vouchers[0], '2026-12-15'), 1450);
  // Apagar a receita não faz a recarga voltar.
  d = { ...d, incomes: [] };
  assert.equal(materializeVouchers(d, '2026-12-20').incomes.length, 0);
  // Entra no balanço do mês.
  const b = monthBalance(materializeVouchers(setup(), '2026-12-02'), '2026-12', '2026-12-02');
  assert.equal(b.incomeReceived, 800);
});

test('saldo, próxima recarga, quanto dá por dia e saldo baixo', () => {
  let d = setup();
  d = buy(d, 600, '2026-11-20');
  const s = voucherStatus(d, d.vouchers[0], '2026-11-21');
  assert.equal(s.balance, 50);
  assert.equal(s.usedThisMonth, 600);
  assert.equal(s.next, '2026-12-01');
  assert.equal(s.daysToNext, 10);
  assert.equal(s.perDay, 5);
  assert.equal(s.low, true);
  assert.equal(nextRecharge({ ...d.vouchers[0], recharge: { amount: 800, day: 31 } }, '2026-02-10'), '2026-02-28');
});

test('ajustar o saldo: o informado passa a valer a partir de hoje', () => {
  let d = setup();
  d = buy(d, 100, '2026-11-10');
  d = adjustVoucherBalance(d.vouchers[0].id, 520, '2026-11-10')(d);
  assert.equal(voucherBalance(d, d.vouchers[0], '2026-11-10'), 520);
  d = buy(d, 20, '2026-11-11');
  assert.equal(voucherBalance(d, d.vouchers[0], '2026-11-11'), 500);
});

test('editar despesa: trocar para vale e de volta para Pix', () => {
  let d = setup();
  d = addExpense(d, { kind: 'avulsa', description: 'Mercado', categoryId: food(d), method: 'pix', cardId: null, date: '2026-11-07', amounts: [80], paidAt: null }, '2026-11-07');
  const id = d.expenses[0].id;
  const patch = { description: 'Mercado', categoryId: food(d), amount: 80, date: '2026-11-07', cardId: null };
  d = editExpense(d, id, { ...patch, method: 'vale', voucherId: d.vouchers[0].id }, 'one');
  assert.equal(d.expenses[0].voucherId, d.vouchers[0].id);
  assert.equal(d.expenses[0].paidAt, '2026-11-07');
  assert.equal(voucherBalance(d, d.vouchers[0], '2026-11-08'), 570);
  d = editExpense(d, id, { ...patch, method: 'pix' }, 'one');
  assert.equal(d.expenses[0].voucherId, null);
  assert.equal(voucherBalance(d, d.vouchers[0], '2026-11-08'), 650);
});

test('vale sobrevive ao backup', () => {
  let d = setup();
  d = buy(d, 30, '2026-11-06');
  const back = normalize(JSON.parse(JSON.stringify(d)));
  assert.equal(back.vouchers[0].name, 'VR Alelo');
  assert.deepEqual(back.vouchers[0].recharge, { amount: 800, day: 1 });
  assert.equal(voucherBalance(back, back.vouchers[0], '2026-11-06'), 620);
});
