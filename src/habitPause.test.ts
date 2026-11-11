import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './data.ts';
import { archiveHabit, cleanDays, consistency, currentPause, habitsOfDay, habitStreak, isScheduled, pauseHabit, resumedToday, resumeHabit } from './habits.ts';
import type { AppData } from './types.ts';

const base = (extra: Record<string, unknown> = {}): AppData =>
  normalize({
    version: 2,
    habits: [{ id: 'h', name: 'Ler', kind: 'ritual', days: [0, 1, 2, 3, 4, 5, 6], createdAt: '2026-11-01T08:00:00', checks: ['2026-11-01', '2026-11-02', '2026-11-03'], ...extra }],
  });

test('dados antigos: sem pausa e sem arquivo', () => {
  const h = base().habits[0];
  assert.deepEqual(h.pauses, []);
  assert.equal(h.archivedAt, null);
});

test('pausado não é programado e a sequência congela', () => {
  // pausa de 04 a 08 (volta em 09); hoje = 10, feito 09
  let d = base({ checks: ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-09'] });
  d = pauseHabit('h', '2026-11-04', '2026-11-09')(d);
  const h = d.habits[0];
  assert.deepEqual(h.pauses, [{ from: '2026-11-04', to: '2026-11-08' }]);
  assert.equal(isScheduled(h, '2026-11-05'), false);
  assert.equal(isScheduled(h, '2026-11-09'), true);
  assert.equal(habitStreak(h, '2026-11-10'), 4); // 01,02,03 + 09; hoje ainda pendente
  assert.equal(consistency(h, '2026-11-10'), 1);
  assert.equal(resumedToday(h, '2026-11-09'), true);
  assert.equal(habitsOfDay(d.habits, '2026-11-06').rituals.length, 0);
});

test('pausa sem data e retomar agora', () => {
  let d = pauseHabit('h', '2026-11-04', null)(base());
  assert.ok(currentPause(d.habits[0], '2026-12-25'));
  d = resumeHabit('h', '2026-11-10')(d);
  assert.deepEqual(d.habits[0].pauses, [{ from: '2026-11-04', to: '2026-11-09' }]);
  assert.equal(currentPause(d.habits[0], '2026-11-10'), null);
  // pausar e retomar no mesmo dia desfaz a pausa
  d = pauseHabit('h', '2026-11-11', null)(d);
  d = resumeHabit('h', '2026-11-11')(d);
  assert.equal(d.habits[0].pauses.length, 1);
});

test('hábito a abandonar não pausa', () => {
  const d = pauseHabit('q', '2026-11-04', null)(normalize({ version: 2, habits: [{ id: 'q', name: 'Doce', kind: 'abandonar', startDate: '2026-10-01' }] }));
  assert.deepEqual(d.habits[0].pauses, []);
});

test('arquivado sai do dia e o histórico fica; "dias sem" congela', () => {
  let d = archiveHabit('h', '2026-11-05')(base());
  assert.equal(isScheduled(d.habits[0], '2026-11-02'), true);
  assert.equal(isScheduled(d.habits[0], '2026-11-06'), false);
  assert.equal(habitsOfDay(d.habits, '2026-11-06').rituals.length, 0);
  d = archiveHabit('h', null)(d);
  assert.equal(isScheduled(d.habits[0], '2026-11-06'), true);
  const q = archiveHabit('q', '2026-11-01')(normalize({ version: 2, habits: [{ id: 'q', name: 'Doce', kind: 'abandonar', startDate: '2026-10-01' }] }));
  assert.equal(cleanDays(q.habits[0], '2026-12-01'), 31);
  assert.equal(habitsOfDay(q.habits, '2026-11-02').quitting.length, 0);
});
