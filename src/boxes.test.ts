import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize } from './data.ts';
import { balance, deposit, newBox, newMarks, pendingBoxes, planPeriod, planStatus, plannedInMonth, progress, savedInMonth, timeToGoal, withdraw } from './boxes.ts';
import { acceptSuggestion, emptyProfile, suggestions } from './profile.ts';
import type { AppData, SavingsBox } from './types.ts';

// 2026-11-04 é uma quarta-feira.
const TODAY = '2026-11-04';
const viagem = (plan: SavingsBox['plan'] = { amount: 100, every: 'semana', startDate: '2026-11-02' }) => newBox({ name: 'Viagem', target: 1000, color: '#22c55e', plan });
const withBox = (b: SavingsBox): AppData => ({ ...emptyData(), boxes: [b] });

test('período do plano: semanal a partir do início; mensal no mesmo dia (dia 31 em mês curto)', () => {
  const b = viagem();
  assert.equal(planPeriod(b, '2026-11-01'), null);
  assert.deepEqual(planPeriod(b, TODAY), { start: '2026-11-02', end: '2026-11-08' });
  assert.deepEqual(planPeriod(b, '2026-11-09'), { start: '2026-11-09', end: '2026-11-15' });
  const m = viagem({ amount: 200, every: 'mes', startDate: '2026-01-31' });
  assert.deepEqual(planPeriod(m, '2026-02-15'), { start: '2026-01-31', end: '2026-02-27' });
  assert.deepEqual(planPeriod(m, '2026-02-28'), { start: '2026-02-28', end: '2026-03-30' });
});

test('guardar no plano cumpre a semana; outro depósito na mesma semana vira extra', () => {
  let d = withBox(viagem());
  const id = d.boxes[0].id;
  assert.equal(planStatus(d.boxes[0], TODAY)!.pending, true);
  assert.equal(pendingBoxes(d.boxes, TODAY).length, 1);
  d = deposit(id, 100, TODAY, true)(d);
  d = deposit(id, 50, TODAY, true)(d);
  const b = d.boxes[0];
  assert.deepEqual(b.moves.map((m) => m.kind), ['plano', 'extra']);
  assert.equal(balance(b), 150);
  assert.equal(planStatus(b, TODAY)!.pending, false);
  assert.equal(planStatus(b, TODAY)!.next, '2026-11-09');
  assert.equal(planStatus(b, '2026-11-09')!.pending, true);
});

test('marcos de 25/50/75/100% valem uma vez só; tirar não desfaz', () => {
  let d = withBox(viagem());
  const id = d.boxes[0].id;
  assert.deepEqual(newMarks(d.boxes[0], 600), [25, 50]);
  d = deposit(id, 600, TODAY, false)(d);
  assert.deepEqual(d.boxes[0].marks, [25, 50]);
  d = withdraw(id, 500, TODAY, 'emergencia')(d);
  assert.equal(balance(d.boxes[0]), 100);
  d = deposit(id, 500, '2026-11-10', false)(d);
  assert.deepEqual(d.boxes[0].marks, [25, 50], 'voltar a 60% não comemora de novo');
  assert.equal(progress(d.boxes[0]), 0.6);
});

test('"Realizei o objetivo" fecha a caixinha e o plano para de cobrar', () => {
  let d = withBox(viagem());
  const id = d.boxes[0].id;
  d = deposit(id, 1000, TODAY, true)(d);
  d = withdraw(id, 1000, '2026-11-20', 'realizei')(d);
  assert.equal(d.boxes[0].realizedAt, '2026-11-20');
  assert.equal(planStatus(d.boxes[0], '2026-11-23'), null);
  assert.equal(pendingBoxes(d.boxes, '2026-11-23').length, 0);
});

test('balanço do mês: guardado (líquido) e o que o plano pede', () => {
  let d = withBox(viagem());
  const id = d.boxes[0].id;
  d = deposit(id, 100, TODAY, true)(d);
  d = withdraw(id, 30, TODAY, 'outro')(d);
  d = deposit(id, 100, '2026-12-01', true)(d);
  assert.equal(savedInMonth(d.boxes, '2026-11'), 70);
  // Segundas de novembro a partir de 02/11: 2, 9, 16, 23, 30.
  assert.equal(plannedInMonth(d.boxes, '2026-11'), 500);
  assert.equal(timeToGoal(d.boxes[0]), 'uns 2 meses');
});

test('caixinhas sobrevivem ao backup', () => {
  let d = withBox(viagem());
  d = deposit(d.boxes[0].id, 100, TODAY, true)(d);
  const back = normalize(JSON.parse(JSON.stringify(d)));
  assert.equal(balance(back.boxes[0]), 100);
  assert.equal(back.boxes[0].plan!.every, 'semana');
  assert.equal(back.boxes[0].target, 1000);
});

test('sugestão de caixinha pelo "quero juntar para" e pelas metas, sem repetir', () => {
  let d: AppData = { ...emptyData(), profile: { ...emptyProfile('feito'), areas: ['dinheiro'], longGoals: [{ id: 'g', text: 'Juntar R$ 10 mil', when: '', doneAt: null }], money: { challenge: '', saveFor: 'reserva', amount: 6000 } } };
  const ids = suggestions(d, TODAY).map((s) => s.id);
  assert.deepEqual(ids, ['s-caixa-g', 's-caixa-juntar']);
  const s = suggestions(d, TODAY)[1];
  d = acceptSuggestion(s, TODAY)(d);
  assert.equal(d.boxes[0].name, 'Reserva de emergência');
  assert.equal(d.boxes[0].target, 6000);
  assert.deepEqual(d.boxes[0].plan, { amount: 100, every: 'semana', startDate: TODAY });
  d = acceptSuggestion(suggestions(d, TODAY)[0], TODAY)(d);
  assert.equal(d.boxes[1].target, 10000);
  assert.deepEqual(suggestions(d, TODAY), []);
});
