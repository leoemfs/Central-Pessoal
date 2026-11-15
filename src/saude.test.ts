import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './data.ts';
import { attributes } from './jornada/rules.ts';
import {
  addWater, dismissLink, emptyHealth, fmtDuration, healthWeeks, linkWaterHabit, normalizeHealth, saveSleep, setWater, shouldAskLink,
  sleepDefaults, sleepMinutes, unlinkWaterHabit, waterCandidate, waterGoalDays, waterHabit, waterMet, waterOn, waterSetup, weekStart,
} from './saude.ts';
import type { AppData, Habit } from './types.ts';

const TODAY = '2026-11-15'; // domingo

function habit(extra: Partial<Habit> = {}): Habit {
  return normalize({ habits: [{ id: 'h1', name: 'Beber água', kind: 'construir', goal: 2000, unit: 'ml', step: 250, attrs: ['RES'], ...extra }] }).habits[0];
}
const withHabit = (extra: Partial<Habit> = {}): AppData => ({ ...normalize({}), habits: [habit(extra)] });

test('dados antigos e backups ganham Saúde vazia; lixo é limpo', () => {
  assert.deepEqual(normalize({}).health, emptyHealth());
  const h = normalizeHealth({
    water: { goal: -1, step: 'x', days: { '2026-11-01': 500, ontem: 300, '2026-11-02': -5 }, habitId: '', asked: 'sim' },
    sleep: { '2026-11-01': { bed: '23:10', wake: '07:00', feel: 'bem' }, '2026-11-02': { bed: '25:00', wake: '07:00' }, '2026-11-03': { bed: '22:00', wake: '06:00', feel: 'ótimo' } },
  });
  assert.deepEqual(h.water, { goal: 2000, step: 250, days: { '2026-11-01': 500 }, habitId: null, asked: false });
  assert.deepEqual(h.sleep, { '2026-11-01': { bed: '23:10', wake: '07:00', feel: 'bem' }, '2026-11-03': { bed: '22:00', wake: '06:00', feel: null } });
});

test('água sem hábito ligado: soma, bate a meta e zera', () => {
  let d = normalize({});
  d = addWater(TODAY, 250)(d);
  d = addWater(TODAY, 250)(d);
  assert.equal(waterOn(d, TODAY), 500);
  assert.equal(waterMet(d, TODAY), false);
  d = setWater(TODAY, 2000)(d);
  assert.equal(waterMet(d, TODAY), true);
  d = setWater(TODAY, 0)(d);
  assert.deepEqual(d.health.water.days, {});
});

test('com hábito ligado, o número mora no hábito (um lugar só) e marca o dia ao bater a meta', () => {
  let d = linkWaterHabit('h1')(withHabit());
  assert.equal(waterHabit(d)?.id, 'h1');
  d = addWater(TODAY, 1000)(d);
  d = addWater(TODAY, 1000)(d);
  assert.equal(d.habits[0].amounts[TODAY], 2000);
  assert.ok(d.habits[0].checks.includes(TODAY));
  assert.deepEqual(d.health.water.days, {});
  assert.deepEqual(waterSetup(d), { goal: 2000, step: 250, unit: 'ml' });
});

test('ligar não perde nada: o que estava só na Saúde passa para o hábito', () => {
  let d = withHabit({ amounts: { '2026-11-10': 1500 } });
  d = setWater('2026-11-10', 700)(d); // ainda sem ligação: fica na Saúde
  d = setWater('2026-11-11', 2000)(d);
  d = linkWaterHabit('h1')(d);
  assert.deepEqual(d.habits[0].amounts, { '2026-11-10': 1500, '2026-11-11': 2000 }); // o dia que o hábito já tinha fica como estava
  assert.ok(d.habits[0].checks.includes('2026-11-11'));
  assert.equal(d.health.water.asked, true);
});

test('desligar deixa uma cópia do histórico na Saúde', () => {
  let d = linkWaterHabit('h1')(withHabit({ amounts: { '2026-11-12': 800 } }));
  d = unlinkWaterHabit()(d);
  assert.equal(d.health.water.habitId, null);
  assert.deepEqual(d.health.water.days, { '2026-11-12': 800 });
  assert.deepEqual(d.habits[0].amounts, { '2026-11-12': 800 });
});

test('hábito ligado que foi excluído: a Saúde volta a guardar sozinha', () => {
  const d = { ...linkWaterHabit('h1')(withHabit()), habits: [] };
  assert.equal(waterHabit(d), null);
  assert.equal(addWater(TODAY, 250)(d).health.water.days[TODAY], 250);
});

test('pergunta de ligação: só com hábito de água e uma vez só', () => {
  assert.equal(waterCandidate([habit({ name: 'Ler', unit: 'páginas' })]), null);
  assert.equal(waterCandidate([habit({ name: 'Hidratação', unit: 'copos' })])?.id, 'h1');
  assert.equal(waterCandidate([habit({ goal: null })]), null);
  assert.equal(shouldAskLink(withHabit())?.id, 'h1');
  assert.equal(shouldAskLink(dismissLink()(withHabit())), null);
  assert.equal(shouldAskLink(linkWaterHabit('h1')(withHabit())), null);
});

test('Jornada: meta de água sem hábito ligado vale +3 de Resistência; com hábito, conta só pelo hábito', () => {
  let d = setWater('2026-11-14', 2000)(setWater(TODAY, 2000)(normalize({})));
  d = setWater('2026-11-13', 500)(d);
  assert.equal(waterGoalDays(d, '2026-11-01', TODAY), 2);
  assert.equal(attributes(d, TODAY).RES, 6);
  const linked = addWater(TODAY, 2000)(linkWaterHabit('h1')(withHabit()));
  assert.equal(waterGoalDays(linked, '2026-11-01', TODAY), 0);
  assert.equal(attributes(linked, TODAY).RES, attributes({ ...linked, health: emptyHealth() }, TODAY).RES);
});

test('sono: passa da meia-noite e formata a duração', () => {
  assert.equal(sleepMinutes({ bed: '23:40', wake: '07:10' }), 450);
  assert.equal(sleepMinutes({ bed: '01:00', wake: '08:00' }), 420);
  assert.equal(fmtDuration(450), '7h30');
  assert.equal(fmtDuration(480), '8h');
  const d = saveSleep(TODAY, { bed: '23:00', wake: '06:30', feel: 'cansado' })(normalize({}));
  assert.deepEqual(d.health.sleep[TODAY], { bed: '23:00', wake: '06:30', feel: 'cansado' });
  assert.equal(saveSleep(TODAY, { bed: '9h', wake: '06:30', feel: null })(d), d);
  assert.deepEqual(sleepDefaults(d), { bed: '23:00', wake: '06:30' });
  assert.deepEqual(sleepDefaults(normalize({}), '06:00', '22:30'), { bed: '22:30', wake: '06:00' });
});

test('semanas do Histórico: começam na segunda e somam água e sono', () => {
  assert.equal(weekStart(TODAY), '2026-11-09');
  assert.equal(weekStart('2026-11-09'), '2026-11-09');
  let d = setWater('2026-11-10', 2000)(setWater('2026-11-09', 1000)(normalize({})));
  d = saveSleep('2026-11-10', { bed: '23:00', wake: '07:00', feel: 'bem' })(d);
  d = saveSleep('2026-11-11', { bed: '00:00', wake: '07:00', feel: 'bem' })(d);
  const [w, prev] = healthWeeks(d, TODAY, 2);
  assert.equal(w.start, '2026-11-09');
  assert.equal(w.waterAvg, 1500);
  assert.equal(w.waterMet, 1);
  assert.equal(w.sleepAvg, 450);
  assert.equal(w.feels.bem, 2);
  assert.equal(prev.start, '2026-11-02');
  assert.equal(prev.waterAvg, null);
});
