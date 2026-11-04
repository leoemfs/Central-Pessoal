import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, normalizeHabit } from './data.ts';
import { bestClean, cleanDays, consistency, habitsOfDay, habitStreak, isScheduled, progressToRitual } from './habits.ts';
import type { Habit } from './types.ts';

// 2026-11-04 é uma quarta-feira.
const TODAY = '2026-11-04';
const make = (p: Partial<Habit>): Habit => normalizeHabit({ id: 'h', name: 'X', createdAt: '2026-10-01T12:00:00', ...p });

test('hábitos antigos ganham os campos novos', () => {
  const h = normalizeHabit({ id: 'a', name: 'Água', color: '#000', checks: ['2026-11-01'], createdAt: '2026-10-01T10:00:00Z' });
  assert.equal(h.kind, 'construir');
  assert.deepEqual(h.days, [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(h.target, 66);
  assert.deepEqual(h.checks, ['2026-11-01']);
  const d = normalize({ version: 2, habits: [{ id: 'b', name: 'Ler', checks: [] }] });
  assert.equal(d.habits[0].period, 'livre');
});

test('programação por dia da semana', () => {
  const uteis = make({ kind: 'ritual', days: [1, 2, 3, 4, 5] });
  assert.equal(isScheduled(uteis, '2026-11-04'), true); // quarta
  assert.equal(isScheduled(uteis, '2026-11-07'), false); // sábado
  assert.equal(isScheduled(make({ kind: 'abandonar' }), TODAY), false);
});

test('sequência: fim de semana fora da rotina não quebra; hoje pendente não quebra', () => {
  // Dias úteis: seg 26/10 … sex 30/10, seg 02/11, ter 03/11 feitos; hoje (qua) ainda não.
  const h = make({ kind: 'ritual', days: [1, 2, 3, 4, 5], checks: ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-11-02', '2026-11-03'] });
  assert.equal(habitStreak(h, TODAY), 7);
  assert.equal(habitStreak({ ...h, checks: [...h.checks, TODAY] }, TODAY), 8);
  // Faltou na sexta 30/10: a sequência volta a contar a partir de segunda.
  assert.equal(habitStreak({ ...h, checks: h.checks.filter((c) => c !== '2026-10-30') }, TODAY), 2);
});

test('consistência: % dos dias programados cumpridos, sem contar hoje pendente', () => {
  const h = make({ kind: 'construir', days: [0, 1, 2, 3, 4, 5, 6], createdAt: '2026-10-30T08:00:00', checks: ['2026-10-30', '2026-11-01', '2026-11-03'] });
  // Dias contados: 30/10, 31/10, 01/11, 02/11, 03/11 → 3 de 5.
  assert.equal(consistency(h, TODAY), 3 / 5);
  assert.equal(consistency(make({ createdAt: '2026-11-04T08:00:00' }), TODAY), null, 'criado hoje: ainda sem dado');
});

test('abandonar: dias sem e recorde', () => {
  const h = make({ kind: 'abandonar', startDate: '2026-10-01', slips: ['2026-10-11', '2026-10-31'] });
  assert.equal(cleanDays(h, TODAY), 4);
  assert.equal(bestClean(h, TODAY), 20);
  assert.equal(cleanDays(make({ kind: 'abandonar', startDate: TODAY }), TODAY), 0);
});

test('construir: progresso até virar ritual', () => {
  const h = make({ kind: 'construir', target: 3, checks: ['2026-11-01', '2026-11-02'] });
  assert.deepEqual(progressToRitual(h), { done: 2, target: 3, ready: false });
  assert.equal(progressToRitual({ ...h, checks: [...h.checks, '2026-11-03'] }).ready, true);
});

test('itens do Núcleo de um dia, ordenados pelo horário', () => {
  const list = [
    make({ id: '1', name: 'Dormir', kind: 'ritual', time: '23:00' }),
    make({ id: '2', name: 'Fio dental', kind: 'ritual', time: '07:30' }),
    make({ id: '3', name: 'Academia', kind: 'construir', days: [1, 3, 5] }),
    make({ id: '4', name: 'Refrigerante', kind: 'abandonar', startDate: '2026-11-10' }),
  ];
  const day = habitsOfDay(list, TODAY);
  assert.deepEqual(day.rituals.map((h) => h.name), ['Fio dental', 'Dormir']);
  assert.deepEqual(day.building.map((h) => h.name), ['Academia']);
  assert.equal(day.quitting.length, 0, 'ainda não começou');
});

test('meta com quantidade: conta como feito ao atingir a meta', async () => {
  const { setAmount, toggleCheck, amountOn } = await import('./habits.ts');
  const { emptyData } = await import('./data.ts');
  const water = make({ id: 'w', kind: 'ritual', goal: 2000, unit: 'ml', step: 250 });
  let d = { ...emptyData(), habits: [water] };
  d = setAmount('w', TODAY, 1250)(d);
  assert.equal(amountOn(d.habits[0], TODAY), 1250);
  assert.equal(d.habits[0].checks.includes(TODAY), false, 'parcial ainda não conta');
  d = setAmount('w', TODAY, 2000)(d);
  assert.equal(d.habits[0].checks.includes(TODAY), true);
  d = setAmount('w', TODAY, 1500)(d);
  assert.equal(d.habits[0].checks.includes(TODAY), false, 'voltou abaixo da meta');
  d = toggleCheck('w', TODAY)(d);
  assert.equal(amountOn(d.habits[0], TODAY), 2000, 'marcar feito completa a meta');
  d = toggleCheck('w', TODAY)(d);
  assert.equal(amountOn(d.habits[0], TODAY), 0);
});

test('nunca falhe duas vezes: alerta só quando o último dia programado falhou e hoje está pendente', async () => {
  const { atRiskToday } = await import('./habits.ts');
  // Dias úteis; hoje é quarta (04/11). Último programado antes: terça 03/11.
  const base = make({ kind: 'ritual', days: [1, 2, 3, 4, 5], checks: ['2026-11-02'] });
  assert.equal(atRiskToday(base, TODAY), true);
  assert.equal(atRiskToday({ ...base, checks: [...base.checks, '2026-11-03'] }, TODAY), false, 'ontem feito');
  assert.equal(atRiskToday({ ...base, checks: [...base.checks, TODAY] }, TODAY), false, 'hoje já feito');
  // Segunda (09/11): o último dia programado é sexta (06/11); fim de semana não conta.
  const fri = { ...base, checks: ['2026-11-06'] };
  assert.equal(atRiskToday(fri, '2026-11-09'), false);
  assert.equal(atRiskToday(make({ kind: 'ritual', createdAt: '2026-11-04T08:00:00' }), TODAY), false, 'criado hoje');
});

test('atributos: sugeridos pelo nome e somados por período', async () => {
  const { suggestAttributes, attributeTotals } = await import('./habits.ts');
  assert.deepEqual(suggestAttributes('Correr 3 km'), ['FOR', 'AGI', 'RES']);
  assert.deepEqual(suggestAttributes('Ler 10 páginas'), ['INT']);
  assert.deepEqual(suggestAttributes('Beber 2 L de água'), ['RES']);
  assert.deepEqual(suggestAttributes('Meditação guiada'), ['SAB']);
  assert.deepEqual(suggestAttributes('Tocar violão'), []);
  // Hábitos antigos (sem o campo) ganham a sugestão; com o campo, respeita a escolha.
  assert.deepEqual(make({ name: 'Ler um livro' }).attrs, ['INT']);
  assert.deepEqual(normalizeHabit({ id: 'x', name: 'Ler', attrs: ['SAB'] }).attrs, ['SAB']);
  const list = [
    make({ id: 'a', name: 'Ler', attrs: ['INT'], checks: ['2026-11-02', '2026-11-03', '2026-10-01'] }),
    make({ id: 'b', name: 'Correr', attrs: ['FOR', 'AGI'], checks: ['2026-11-03'] }),
    make({ id: 'c', name: 'Refri', kind: 'abandonar', attrs: ['RES'], startDate: '2026-11-01', slips: ['2026-11-03'] }),
  ];
  const t = attributeTotals(list, '2026-11-02', '2026-11-04');
  assert.deepEqual(t.map((x) => `${x.code}:${x.points}`), ['INT:2', 'RES:2', 'FOR:1', 'AGI:1']);
});
