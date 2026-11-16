import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAT_HD, catHdPalette, moodNow, petAction, petWish, roomOf } from './jornada/bichinho.ts';
import { finishGame } from './jornada/games.ts';
import { defaultJourneyState, normalizeJourney } from './jornada/rules.ts';

const T0 = new Date('2026-11-16T10:00:00Z');
const later = (h: number) => new Date(T0.getTime() + h * 3_600_000);

test('bichinho: o humor desce devagar com o tempo, mas nunca abaixo de 20', () => {
  const v = { joy: 70, full: 60, rest: 80, clean: 60, at: T0.toISOString() };
  const m = moodNow(v, later(5));
  assert.deepEqual([m.joy, m.full, m.rest, m.clean], [55, 40, 70, 50]);
  const old = moodNow(v, later(500));
  assert.deepEqual([old.joy, old.full, old.rest, old.clean], [20, 20, 20, 20], 'nunca fica triste demais');
  assert.equal(moodNow({ ...v, at: '' }, later(50)).full, 60, 'sem data, não desce');
});

test('bichinho: ações sobem o humor; petisco custa 2 fichas', () => {
  let s = { ...defaultJourneyState(), vpet: { joy: 50, full: 40, rest: 50, clean: 30, at: T0.toISOString() } };
  assert.match(petAction(s, 'petisco', T0) as string, /Faltam fichas/);
  s = finishGame(s, 'corrida', 600, 60, '2026-11-16').state; // 5 fichas
  const fed = petAction(s, 'petisco', T0) as typeof s;
  assert.equal(fed.vpet.full, 70);
  assert.equal(fed.games.fichasSpent, 2);
  const played = petAction(fed, 'brincar', T0) as typeof s;
  assert.deepEqual([played.vpet.joy, played.vpet.rest], [66, 44]);
  assert.equal((petAction(played, 'dormir', T0) as typeof s).vpet.rest, 100);
  assert.equal((petAction(played, 'escovar', T0) as typeof s).vpet.clean, 45);
  assert.equal(petWish({ joy: 80, full: 30, rest: 80, clean: 80, at: '' }, 'Mingau'), 'Mingau está com fome');
  assert.equal(petWish({ joy: 80, full: 80, rest: 80, clean: 80, at: '' }, 'Mingau'), 'Mingau está feliz');
  assert.deepEqual(normalizeJourney({}).vpet, { joy: 70, full: 60, rest: 80, clean: 60, at: '' });
});

test('bichinho: gatinho com mais pixels e quarto de cada moradia', () => {
  assert.equal(CAT_HD.length, 20);
  assert.ok(CAT_HD.every((r) => r.length === 24));
  const p = catHdPalette({ C: '#f59e0b', E: '#16a34a', N: '#f472b6' });
  assert.match(p.D, /^#[0-9a-f]{6}$/);
  assert.notEqual(p.D, p.C);
  assert.ok(roomOf('castelo').extra.includes('torch'));
  assert.equal(roomOf('nada'), roomOf('casinha'));
});

test('N2.18c: banheiro e lá fora; desenhos de lado e de costas', async () => {
  const { CAT_HD_BACK, CAT_HD_SIDE } = await import('./jornada/bichinho.ts');
  const s = { ...defaultJourneyState(), vpet: { joy: 50, full: 50, rest: 50, clean: 30, at: T0.toISOString() } };
  assert.equal((petAction(s, 'banho', T0) as typeof s).vpet.clean, 100);
  assert.equal((petAction(s, 'dentes', T0) as typeof s).vpet.clean, 40);
  assert.deepEqual([(petAction(s, 'passear', T0) as typeof s).vpet.joy, (petAction(s, 'passear', T0) as typeof s).vpet.rest], [60, 42]);
  assert.equal((petAction(s, 'sol', T0) as typeof s).vpet.rest, 65);
  assert.ok(CAT_HD_BACK.every((r) => r.length === 24));
  assert.ok(CAT_HD_SIDE.every((r) => r.length === 28));
  assert.ok(!CAT_HD_BACK.join('').includes('E'), 'de costas não tem olhos');
});
