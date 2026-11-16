import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalizeHabit } from './data.ts';
import type { AppData, Habit, JournalEntry, Task } from './types.ts';
import { missionsToday, missionsWeek, mondayOf, weeklyBonus } from './jornada/missions.ts';
import { journeyStats } from './journey.ts';

// 2026-11-16 é segunda-feira.
const MON = '2026-11-16';
const habit = (p: Partial<Habit>): Habit => normalizeHabit({ id: 'h', name: 'X', createdAt: '2026-09-01T12:00:00', ...p });
const entry = (day: string, tag = ''): JournalEntry => ({ id: `j${day}${tag}`, createdAt: `${day}T12:00:00`, title: '', summary: '', content: 'x', tag }) as JournalEntry;
const task = (p: Partial<Task>): Task => ({ id: 't', title: 'Tarefa', notes: '', due: MON, priority: 'media', tag: '', done: false, createdAt: '2026-11-01T10:00:00', doneAt: null, ...p }) as Task;
const withData = (p: Partial<AppData>, rhythm?: Partial<AppData['settings']['journalRhythm']>): AppData => {
  const d = emptyData();
  return { ...d, ...p, settings: { ...d.settings, journalRhythm: { ...d.settings.journalRhythm, ...rhythm } } };
};

test('mondayOf: segunda da semana (domingo fica na semana anterior)', () => {
  assert.equal(mondayOf('2026-11-16'), MON);
  assert.equal(mondayOf('2026-11-22'), MON);
  assert.equal(mondayOf('2026-11-23'), '2026-11-23');
});

test('missões de hoje: só hábitos do dia, tarefas do dia e atrasadas, e marcar vem dos dados reais', () => {
  const d = withData(
    {
      habits: [
        habit({ id: 'a', name: 'Arrumar a cama', kind: 'ritual', days: [1], time: '07:00', checks: [MON], attrs: ['DIS'] }),
        habit({ id: 'b', name: 'Ler', kind: 'construir', days: [2], attrs: ['INT'] }),
        habit({ id: 'c', name: 'refrigerante', kind: 'abandonar', startDate: '2026-11-10', slips: [] }),
      ],
      tasks: [task({ id: 't1', due: MON }), task({ id: 't2', due: '2026-11-10' }), task({ id: 't3', due: '2026-11-20' }), task({ id: 't4', due: '2026-11-10', done: true, doneAt: '2026-11-11T09:00:00' })],
    },
    { mode: 'livre' },
  );
  const ms = missionsToday(d, MON);
  assert.deepEqual(
    ms.map((m) => m.id),
    ['h:a', 't:t1', 't:t2', 'a:c'],
  );
  assert.equal(ms[0].done, true);
  assert.deepEqual(ms[0].attrs, { DIS: 3 });
  assert.match(ms[2].meta, /atrasada/);
  assert.equal(ms[3].title, 'Dia sem refrigerante');
  assert.match(ms[3].meta, /6 dias sem/);
});

test('missões de hoje: conta que vence hoje e diário no ritmo', () => {
  const e = { id: 'e1', description: 'Luz', amount: 187.4, cardId: null, dueDate: MON, paidAt: null } as AppData['expenses'][number];
  const d = withData({ expenses: [e, { ...e, id: 'e2', dueDate: '2026-11-17' }] }, { mode: 'todo-dia' });
  const ms = missionsToday(d, MON);
  assert.deepEqual(
    ms.map((m) => m.id),
    ['c:e1', 'diario'],
  );
  assert.equal(ms[0].action.type, 'bill');
  // Ritmo "3x por semana": depois de cumprir, o diário só aparece no dia em que escreveu.
  const w = withData({ journal: [entry('2026-11-17'), entry('2026-11-18'), entry('2026-11-19')] }, { mode: 'semana', perWeek: 3 });
  assert.equal(missionsToday(w, '2026-11-20').some((m) => m.id === 'diario'), false);
  assert.equal(missionsToday(w, '2026-11-19').find((m) => m.id === 'diario')?.done, true);
});

test('missões da semana: diário no ritmo (dias certos contam só nesses dias) e revisão', () => {
  const d = withData({ journal: [entry('2026-11-17'), entry('2026-11-18'), entry('2026-11-19'), entry('2026-11-22', 'Revisão')] }, { mode: 'dias', days: [2, 4, 0] });
  const [diario, revisao] = missionsWeek(d, '2026-11-22');
  assert.equal(diario.goal, 3);
  assert.equal(diario.done, 2, 'quarta (18) não é dia combinado');
  assert.equal(diario.bonus, 30);
  assert.equal(revisao.done, 1);
  assert.equal(missionsWeek(withData({}, { mode: 'livre' }), MON).length, 1, '"quando der" não tem meta do diário');
});

test('bônus da semana: 10 XP por vez combinada, só desde o desbloqueio, e entra no XP total', () => {
  const journal = ['2026-11-09', '2026-11-10', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-24'].map((x) => entry(x));
  const d = withData({ journal }, { mode: 'semana', perWeek: 2 });
  assert.deepEqual(weeklyBonus(d, '2026-11-25'), { weeks: 0, xp: 0 }, 'sem desbloqueio, sem bônus');
  const u = { ...d, settings: { ...d.settings, journeyUnlockedAt: '2026-11-16' } };
  assert.deepEqual(weeklyBonus(u, '2026-11-25'), { weeks: 1, xp: 20 }, 'semana de 09/11 é antes do desbloqueio; semana atual (1 de 2) ainda não conta');
  assert.deepEqual(weeklyBonus(u, '2026-11-17'), { weeks: 1, xp: 20 }, 'a semana atual conta assim que a meta é cumprida');
  const base = journeyStats(d, '2026-11-25').xp;
  assert.equal(journeyStats(u, '2026-11-25').xp - base, 20);
});
