import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, normalizeHabit } from './data.ts';
import type { AppData } from './types.ts';
import { dayNumbers, levelRewards, nearUnlocks, streakDays } from './jornada/home.ts';
import { defaultJourneyState } from './jornada/rules.ts';

const DAY = '2026-11-16';

test('sequência: dias seguidos terminando hoje ou ontem', () => {
  assert.equal(streakDays(['2026-11-14', '2026-11-15', '2026-11-16'], DAY), 3);
  assert.equal(streakDays(['2026-11-14', '2026-11-15'], DAY), 2, 'hoje ainda sem registro não zera');
  assert.equal(streakDays(['2026-11-13'], DAY), 0);
});

test('seu dia em números: XP e ouro de hoje vêm só do que foi feito hoje', () => {
  const h = normalizeHabit({ id: 'h', name: 'Cama', kind: 'ritual', days: [0, 1, 2, 3, 4, 5, 6], checks: ['2026-11-15', DAY], createdAt: '2026-11-01T10:00:00' });
  const d: AppData = { ...emptyData(), habits: [h] };
  const n = dayNumbers(d, DAY);
  assert.equal(n.xp, 10);
  assert.equal(n.gold, 5);
  assert.deepEqual([n.done, n.total], [1, 1]);
});

test('perto de desbloquear: mais perto primeiro, no máximo 3, sem o que já tem', () => {
  const h = normalizeHabit({ id: 'h', name: 'Ler', kind: 'construir', days: [0, 1, 2, 3, 4, 5, 6], attrs: ['INT'], checks: Array.from({ length: 15 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`), createdAt: '2026-10-01T10:00:00' });
  const d: AppData = { ...emptyData(), habits: [h] };
  const list = nearUnlocks(d, defaultJourneyState(), DAY, 4);
  assert.ok(list.length <= 3);
  assert.equal(list[0].id, 'item:chapeu', 'Inteligência 45 de 50 é o mais perto');
  assert.equal(list[0].progress, '45/50');
  assert.ok(list.some((x) => x.id === 'bau:dourado' && x.progress === 'LV 4/5'));
  for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].have / list[i - 1].need >= list[i].have / list[i].need);
});

test('subiu de nível: baú dourado a cada 5, casas e pets do nível; nível guardado com padrão 0', () => {
  assert.deepEqual(levelRewards(5).map((r) => r.kind), ['bau', 'casa']);
  assert.deepEqual(levelRewards(7).map((r) => r.title), ['Pet liberado: Gatinho', 'Pet liberado: Cãozinho']);
  assert.equal(levelRewards(8).length, 0);
  assert.equal(normalize({ ...emptyData(), journey: { avatar: null } }).journey.levelSeen, 0);
});
