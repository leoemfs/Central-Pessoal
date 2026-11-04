import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalizeHabit } from './data.ts';
import { checkUnlock, journeyStats, levelFromXp, markActive, markVisit, unlockProgress } from './journey.ts';
import { addDays } from './utils.ts';
import type { AppData } from './types.ts';

const TODAY = '2026-11-25';
const withDays = (days: string[]): AppData => {
  const d = emptyData();
  return { ...d, settings: { ...d.settings, activeDays: days } };
};

test('registra o uso uma vez por dia', () => {
  let d = markActive(emptyData(), TODAY);
  const again = markActive(d, TODAY);
  assert.equal(again, d, 'mesmo dia: não muda nada');
  d = markActive(d, '2026-11-26');
  assert.deepEqual(d.settings.activeDays, [TODAY, '2026-11-26']);
});

test('desbloqueia com 14 dias de uso em 3 semanas (faltas no meio não zeram)', () => {
  // 14 dias de uso alternando com faltas dentro de 21 dias.
  const days = Array.from({ length: 21 }, (_, i) => addDays(TODAY, -i)).filter((_, i) => i % 3 !== 2);
  assert.equal(days.length, 14);
  const d = checkUnlock(withDays(days), TODAY);
  assert.equal(d.settings.journeyUnlockedAt, TODAY);
  assert.equal(unlockProgress(d, TODAY).active, 14);
  // 13 dias: ainda não.
  assert.equal(checkUnlock(withDays(days.slice(1)), TODAY).settings.journeyUnlockedAt, null);
  // Dias muito antigos (fora da janela) não contam.
  const old = Array.from({ length: 14 }, (_, i) => addDays(TODAY, -30 - i));
  assert.equal(checkUnlock(withDays(old), TODAY).settings.journeyUnlockedAt, null);
});

test('depois de desbloquear, continua desbloqueada para sempre', () => {
  const d = withDays([]);
  const unlocked = { ...d, settings: { ...d.settings, journeyUnlockedAt: '2026-11-01' } };
  assert.equal(unlockProgress(unlocked, TODAY).unlocked, true);
  assert.equal(checkUnlock(unlocked, TODAY), unlocked);
});

test('nível: do N para o N+1 são 100 × N XP', () => {
  assert.deepEqual(levelFromXp(0), { level: 1, xpInLevel: 0, xpForNext: 100 });
  assert.deepEqual(levelFromXp(100), { level: 2, xpInLevel: 0, xpForNext: 200 });
  assert.deepEqual(levelFromXp(350), { level: 3, xpInLevel: 50, xpForNext: 300 });
});

test('XP retroativo vem dos dados reais e nunca de gastos', () => {
  const d: AppData = {
    ...emptyData(),
    habits: [
      normalizeHabit({ id: 'r', name: 'Fio', kind: 'ritual', checks: ['2026-11-20', '2026-11-21', '2026-11-22'] }),
      normalizeHabit({ id: 'q', name: 'Refri', kind: 'abandonar', startDate: '2026-11-01', slips: ['2026-11-10'] }),
    ],
    tasks: [{ id: 't', title: 'X', notes: '', due: null, priority: 'media', tag: '', done: true, createdAt: '', doneAt: '2026-11-20T10:00:00' }],
    journal: [
      { id: 'j', createdAt: '2026-11-20T21:00:00', title: 'Dia', summary: '', content: '', tag: '', updatedAt: '' },
      { id: 'k', createdAt: '2026-11-22T21:00:00', title: 'Revisão', summary: '', content: '', tag: 'Revisão', updatedAt: '' },
    ],
  };
  const s = journeyStats(d, TODAY);
  // Rituais 3×10 + abandonar (01→10: 1 semana; 10→25: 2 semanas) 3×30 + tarefa 15 + diário 10 + revisão 40
  assert.equal(s.xp, 30 + 90 + 15 + 10 + 40);
  assert.equal(s.missions, 3 + 3 + 1 + 1 + 1);
  assert.equal(s.level, 2);
});

test('registra a visita do dia uma vez, mesmo sem registrar nada', () => {
  let d = markVisit(emptyData(), TODAY);
  assert.deepEqual(d.settings.visitDays, [TODAY]);
  assert.equal(markVisit(d, TODAY), d);
  d = markVisit(d, '2026-11-26');
  assert.deepEqual(d.settings.visitDays, [TODAY, '2026-11-26']);
  assert.deepEqual(d.settings.activeDays, [], 'visitar não conta como dia de uso');
});
