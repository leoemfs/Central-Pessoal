import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize } from './data.ts';
import { cleanVideoUrl, EQUIPS, EXERCISES, homeKey, homeWorkout, LEVELS, partsFor, PARTS, weekTrainDays } from './treinos.ts';
import { FIGURES, figureSvg, mix, skeleton, stretchFigure, VIEW } from './bonecos.ts';
import { STRETCH } from './practices.ts';
import type { PracticeSession } from './types.ts';

test('todo exercício tem boneco, parte e passo a passo, sem id repetido', () => {
  const ids = new Set<string>();
  for (const e of EXERCISES) {
    assert.ok(FIGURES[e.fig], e.id);
    assert.ok(PARTS.some((p) => p.value === e.part), e.id);
    assert.ok(e.how.length >= 2, e.id);
    assert.ok(!ids.has(e.id), e.id);
    ids.add(e.id);
  }
});

test('as 8 partes têm treino sem equipamento; com equipamento também', () => {
  for (const eq of EQUIPS) assert.equal(partsFor(eq.value).length, 8, eq.value);
});

test('treino pronto: voltas e quantidades por nível', () => {
  const ini = homeWorkout(homeKey('sem', 'pernas', 'ini'))!;
  const ava = homeWorkout(homeKey('sem', 'pernas', 'ava'))!;
  assert.equal(ini.title, 'Pernas · Iniciante');
  assert.equal(ini.count, 4);
  assert.equal(ini.steps.length, 8);
  assert.equal(ava.steps.length, 15);
  assert.ok(ava.steps[0].amount > ini.steps[0].amount);
  assert.ok(ini.seconds > 0 && ini.seconds < ava.seconds);
  for (const s of ava.steps) if (s.ex.kind === 'tempo') assert.equal(s.amount % 5, 0);
  assert.equal(homeWorkout('sem:nada:ini'), null);
  assert.equal(homeWorkout('sem:pernas:x'), null);
  assert.equal(LEVELS.length, 3);
});

test('semana de treino: segunda a domingo, marca os dias com treino', () => {
  const s = (date: string, type: PracticeSession['type']) => ({ id: date + type, date, type, sub: '', title: '', minutes: 10, km: null, sets: null, volume: null, feel: null, createdAt: '' }) as PracticeSession;
  const w = weekTrainDays([s('2026-11-09', 'treino'), s('2026-11-11', 'alongamento'), s('2026-11-08', 'treino')], '2026-11-11');
  assert.equal(w[0].day, '2026-11-09');
  assert.deepEqual(w.map((d) => d.done), [true, false, false, false, false, false, false]);
  assert.equal(w[2].today, true);
});

test('link de vídeo', () => {
  assert.equal(cleanVideoUrl(' youtu.be/abc '), 'https://youtu.be/abc');
  assert.equal(cleanVideoUrl('https://www.youtube.com/watch?v=1'), 'https://www.youtube.com/watch?v=1');
  assert.equal(cleanVideoUrl('agachamento'), '');
  assert.equal(cleanVideoUrl(''), '');
});

test('dados antigos ganham meta 3 e nenhum vídeo; valores ruins são corrigidos', () => {
  const old = normalize({ ...emptyData(), workoutGoal: undefined, exerciseVideos: undefined } as never);
  assert.equal(old.workoutGoal, 3);
  assert.deepEqual(old.exerciseVideos, {});
  const bad = normalize({ ...emptyData(), workoutGoal: 12, exerciseVideos: { a: 'x', b: 5 } } as never);
  assert.equal(bad.workoutGoal, 7);
  assert.deepEqual(bad.exerciseVideos, { a: 'x' });
});

test('bonecos: encostam no chão nas duas posições e todo alongamento tem boneco', () => {
  for (const [id, f] of Object.entries(FIGURES)) {
    for (const s of [0, 1]) {
      const d = skeleton(mix(f, s), f.front);
      const ys = [...d.back.flat(), ...d.front.flat()].map((p) => p[1]);
      assert.ok(Math.max(...ys) <= VIEW.ground + 0.01, id);
      assert.ok(figureSvg(id, s).includes('<circle'), id);
    }
  }
  for (const x of Object.values(STRETCH)) for (const m of x.moves) assert.ok(FIGURES[stretchFigure(m[0])], m[0]);
  assert.equal(stretchFigure('Quadríceps · direito'), 'quadriceps');
});
