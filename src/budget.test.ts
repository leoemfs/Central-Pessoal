import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, seedCategories } from './data.ts';
import { addExpense } from './finance.ts';
import { budgetRows, budgetSummary, categoryAverage, lastMonths, monthReport, setBudget, suggestBudgets } from './budget.ts';
import type { AppData } from './types.ts';

// 2026-11-18: dia 18 de 30.
const TODAY = '2026-11-18';
const base = () => seedCategories(emptyData());
const cat = (d: AppData, name: string) => d.categories.find((c) => c.name === name)!.id;
function spend(d: AppData, name: string, date: string, amount: number, kind: 'avulsa' | 'fixa' = 'avulsa'): AppData {
  return addExpense(d, { kind, description: name, categoryId: cat(d, name), method: 'pix', cardId: null, date, amounts: [amount], paidAt: null }, date);
}

test('orçamento: % usado, quanto sobra por dia e cores', () => {
  let d = base();
  d = spend(d, 'Alimentação', '2026-11-03', 500);
  d = spend(d, 'Alimentação', '2026-11-15', 242);
  d = spend(d, 'Lazer', '2026-11-08', 340);
  d = spend(d, 'Contas de casa', '2026-11-01', 655, 'fixa');
  d = setBudget(cat(d, 'Alimentação'), 900)(d);
  d = setBudget(cat(d, 'Lazer'), 300)(d);
  d = setBudget(cat(d, 'Contas de casa'), 700)(d);
  const rows = budgetRows(d, '2026-11', TODAY);
  const by = (n: string) => rows.find((r) => r.categoryId === cat(d, n))!;
  assert.equal(by('Lazer').tone, 'red');
  assert.equal(by('Lazer').left, -40);
  assert.equal(by('Alimentação').tone, 'orange');
  assert.equal(by('Alimentação').left, 158);
  assert.equal(Math.round(by('Alimentação').perDay! * 100) / 100, 13.17);
  // Só contas fixas: 94% não avisa.
  assert.equal(by('Contas de casa').onlyFixed, true);
  assert.equal(by('Contas de casa').tone, 'green');
  assert.equal(by('Contas de casa').alert, false);
  assert.deepEqual(rows.filter((r) => r.alert).map((r) => r.categoryId), [cat(d, 'Lazer'), cat(d, 'Alimentação')]);
  // Projeção: fixas inteiras + avulsas no ritmo (742 + 340) / 18 × 30.
  const s = budgetSummary(d, '2026-11', TODAY);
  assert.equal(s.budget, 1900);
  assert.equal(s.spent, 1737);
  assert.equal(Math.round(s.projected), Math.round(655 + (1082 / 18) * 30));
  // Fixas do mês seguinte geradas pelo app não contam neste mês.
  assert.equal(budgetSummary(d, '2026-12', TODAY).spent, 655);
});

test('sugerir orçamento pela média dos 3 meses anteriores; remover', () => {
  let d = base();
  d = spend(d, 'Lazer', '2026-08-10', 200);
  d = spend(d, 'Lazer', '2026-09-10', 300);
  d = spend(d, 'Lazer', '2026-10-10', 250);
  d = spend(d, 'Transporte', '2026-10-05', 6);
  assert.equal(categoryAverage(d, cat(d, 'Lazer'), '2026-11', 3, TODAY), 250);
  d = suggestBudgets('2026-11', TODAY)(d);
  assert.equal(d.budgets[cat(d, 'Lazer')], 250);
  assert.equal(d.budgets[cat(d, 'Transporte')], undefined, 'média abaixo de R$ 10 não vira orçamento');
  d = setBudget(cat(d, 'Lazer'), null)(d);
  assert.equal(d.budgets[cat(d, 'Lazer')], undefined);
  const back = normalize(JSON.parse(JSON.stringify(setBudget(cat(d, 'Lazer'), 280)(d))));
  assert.equal(back.budgets[cat(d, 'Lazer')], 280);
});

test('relatório do mês: divisão, mês anterior e o que chama atenção', () => {
  let d = base();
  for (const m of ['08', '09', '10']) d = spend(d, 'Lazer', `2026-${m}-10`, 200);
  d = spend(d, 'Alimentação', '2026-10-10', 800);
  d = spend(d, 'Alimentação', '2026-11-05', 400);
  d = spend(d, 'Lazer', '2026-11-06', 300);
  d = spend(d, 'Streaming', '2026-11-01', 40, 'fixa');
  const r = monthReport(d, '2026-11', TODAY);
  assert.equal(r.total, 740);
  assert.equal(r.rows[0].categoryId, cat(d, 'Alimentação'));
  assert.equal(Math.round(r.rows[0].share * 100), 54);
  assert.equal(r.prevTotal, 1000);
  assert.equal(r.partial, true);
  // Lazer: 300 em 18 dias → 500 no ritmo, contra média de 200.
  assert.equal(r.above!.categoryId, cat(d, 'Lazer'));
  assert.equal(Math.round(r.above!.delta * 100), 150);
  assert.equal(r.fixedPerYear, 480);
  assert.deepEqual(lastMonths('2026-11', 3), ['2026-09', '2026-10', '2026-11']);
});

test('nos primeiros dias do mês não há previsão (uma compra grande distorceria)', () => {
  let d = base();
  d = spend(d, 'Lazer', '2026-10-10', 300);
  d = spend(d, 'Lazer', '2026-11-04', 500);
  d = setBudget(cat(d, 'Lazer'), 600)(d);
  assert.equal(budgetSummary(d, '2026-11', '2026-11-05').early, true);
  assert.equal(budgetSummary(d, '2026-11', '2026-11-10').early, false);
  assert.equal(monthReport(d, '2026-11', '2026-11-05').delta, null);
  assert.ok(monthReport(d, '2026-11', '2026-11-12').delta! > 0);
});
