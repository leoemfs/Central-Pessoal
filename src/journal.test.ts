import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bestStreak, currentStreak, dailyPrompt, memories, monthWeeks, mondayOf, PROMPTS, sameDayMonthsAgo, weekDays, writtenDays } from './journal.ts';

const at = (day: string, time = '21:00') => ({ createdAt: new Date(`${day}T${time}:00`).toISOString() });

test('dias escritos usam a data local', () => {
  const s = writtenDays([at('2026-11-18', '23:50'), at('2026-11-18', '08:00'), at('2026-11-17')]);
  assert.deepEqual([...s].sort(), ['2026-11-17', '2026-11-18']);
});

test('sequência conta até hoje, ou até ontem se hoje ainda não tem registro', () => {
  const days = new Set(['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17']);
  assert.equal(currentStreak(days, '2026-11-18'), 4);
  assert.equal(currentStreak(new Set([...days, '2026-11-18']), '2026-11-18'), 5);
  assert.equal(currentStreak(days, '2026-11-19'), 0);
  assert.equal(currentStreak(new Set(), '2026-11-18'), 0);
});

test('melhor sequência', () => {
  assert.equal(bestStreak(new Set(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-03'])), 3);
  assert.equal(bestStreak(new Set()), 0);
});

test('semana de segunda a domingo', () => {
  assert.equal(mondayOf('2026-11-18'), '2026-11-16');
  assert.equal(mondayOf('2026-11-22'), '2026-11-16');
  assert.equal(mondayOf('2026-11-16'), '2026-11-16');
  assert.deepEqual(weekDays('2026-11-16'), ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']);
});

test('semanas do calendário do mês', () => {
  // Novembro de 2026 começa num domingo e termina numa segunda.
  assert.deepEqual(monthWeeks('2026-11'), ['2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30']);
  assert.equal(monthWeeks('2027-02').length, 4);
});

test('mesmo dia meses antes, sem inventar dia que não existe', () => {
  assert.equal(sameDayMonthsAgo('2026-11-18', 1), '2026-10-18');
  assert.equal(sameDayMonthsAgo('2026-11-18', 12), '2025-11-18');
  assert.equal(sameDayMonthsAgo('2026-03-31', 1), null);
  assert.equal(sameDayMonthsAgo('2026-01-15', 6), '2025-07-15');
});

test('Neste dia: 1 mês, 6 meses e 1 ano atrás', () => {
  const list = [at('2026-10-18'), at('2026-05-18'), at('2025-11-18'), at('2026-11-17'), at('2025-11-17')];
  const m = memories(list, '2026-11-18');
  assert.deepEqual(m.map((x) => [x.label, x.day]), [
    ['Há 1 mês', '2026-10-18'],
    ['Há 6 meses', '2026-05-18'],
    ['Há 1 ano', '2025-11-18'],
  ]);
  assert.equal(memories([at('2026-11-17')], '2026-11-18').length, 0);
});

test('pergunta do dia muda a cada dia e "Outra" avança', () => {
  assert.notEqual(dailyPrompt('2026-11-18'), dailyPrompt('2026-11-19'));
  assert.equal(dailyPrompt('2026-11-18', 1), dailyPrompt('2026-11-19'));
  assert.equal(dailyPrompt('2026-11-18', PROMPTS.length), dailyPrompt('2026-11-18'));
  assert.ok(PROMPTS.includes(dailyPrompt('1999-01-01') as (typeof PROMPTS)[number]));
});
