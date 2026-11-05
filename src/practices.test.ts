import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, normalizeHabit } from './data.ts';
import { BREATH, breathRounds, linkMatches, linkedToMark, recommended, recordSession, weekPractice } from './practices.ts';
import { emptyProfile } from './profile.ts';
import type { AppData } from './types.ts';

// 2026-11-04 é uma quarta-feira.
const TODAY = '2026-11-04';

test('respiração dura uns 2 minutos', () => {
  assert.equal(breathRounds(BREATH['478']), 6);
  assert.equal(breathRounds(BREATH.caixa), 8);
  assert.equal(breathRounds(BREATH.coerencia), 12);
});

test('ligação entre hábito e prática', () => {
  assert.equal(linkMatches('treino', 'treino', 'A'), true);
  assert.equal(linkMatches('alongamento:lombar', 'alongamento', 'lombar'), true);
  assert.equal(linkMatches('alongamento:lombar', 'alongamento', 'ombros'), false);
  assert.equal(linkMatches('', 'meditacao', ''), false);
  assert.equal(linkMatches('meditacao', 'respiracao', ''), false);
});

test('concluir a prática guarda a sessão e marca só os hábitos ligados', () => {
  let d: AppData = {
    ...emptyData(),
    habits: [
      normalizeHabit({ id: 'm', name: 'Meditar 5 min', link: 'meditacao' }),
      normalizeHabit({ id: 'l', name: 'Ler' }),
      normalizeHabit({ id: 'a', name: 'Água', link: 'meditacao', goal: 2000 }),
    ],
  };
  assert.deepEqual(linkedToMark(d.habits, 'meditacao', 'dormir', TODAY).map((h) => h.id), ['m']);
  d = recordSession({ type: 'meditacao', sub: 'dormir', title: 'Antes de dormir', minutes: 0.4 }, TODAY)(d);
  assert.equal(d.sessions.length, 1);
  assert.equal(d.sessions[0].minutes, 1);
  assert.deepEqual(d.habits.find((h) => h.id === 'm')!.checks, [TODAY]);
  assert.deepEqual(d.habits.find((h) => h.id === 'l')!.checks, []);
  // Segunda sessão no mesmo dia não desmarca.
  d = recordSession({ type: 'meditacao', sub: '', title: 'Meditação', minutes: 5 }, TODAY)(d);
  assert.deepEqual(d.habits.find((h) => h.id === 'm')!.checks, [TODAY]);
});

test('treino guarda as cargas para a próxima vez', () => {
  let d = emptyData();
  d = recordSession({ type: 'treino', sub: 'A', title: 'Treino A', minutes: 40, sets: 2, volume: 450, loads: { 'Supino reto': 22.5 } }, TODAY)(d);
  assert.equal(d.lastLoads['Supino reto'], 22.5);
  const back = normalize(JSON.parse(JSON.stringify(d)));
  assert.equal(back.lastLoads['Supino reto'], 22.5);
  assert.equal(back.sessions[0].volume, 450);
});

test('resumo da semana (segunda a domingo)', () => {
  let d = emptyData();
  d = recordSession({ type: 'meditacao', sub: '', title: 'M', minutes: 5 }, '2026-11-02')(d);
  d = recordSession({ type: 'respiracao', sub: '478', title: 'R', minutes: 2 }, TODAY)(d);
  d = recordSession({ type: 'treino', sub: 'A', title: 'T', minutes: 40 }, TODAY)(d);
  d = recordSession({ type: 'caminhada', sub: '', title: 'C', minutes: 20 }, '2026-11-01')(d); // domingo da semana anterior
  assert.deepEqual(weekPractice(d.sessions, TODAY), { mindMinutes: 7, workouts: 1, moves: 0, total: 3 });
});

test('práticas indicadas pelo perfil', () => {
  const r = recommended({ ...emptyProfile(), day: ['sentado'], limits: ['ansiedade'], likes: ['casa'] });
  assert.deepEqual(r, { guided: 'consciente', breath: '478', stretch: 'ombros', workout: 'casa' });
});
