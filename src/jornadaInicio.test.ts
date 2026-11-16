import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, normalizeHabit } from './data.ts';
import type { AppData } from './types.ts';
import { dayNumbers, journeyNews, levelRewards, newsDiff, quaseLa, showWeekSummary, streakDays, weekSummary } from './jornada/home.ts';
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

test('quase lá (prévia): nível, baú de bronze, baú de cristal, item pelo atributo, coroa e título', () => {
  const ler = normalizeHabit({ id: 'h', name: 'Ler', kind: 'construir', days: [0, 1, 2, 3, 4, 5, 6], attrs: ['INT'], checks: Array.from({ length: 15 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`), createdAt: '2026-10-01T10:00:00' });
  const refri = normalizeHabit({ id: 'r', name: 'Refrigerante', kind: 'abandonar', attrs: ['RES'], startDate: '2026-11-06', slips: [], createdAt: '2026-11-06T10:00:00' });
  const base = emptyData();
  const d: AppData = { ...base, habits: [ler, refri], settings: { ...base.settings, visitDays: ['2026-11-14', '2026-11-15', DAY] } };
  const list = quaseLa(d, defaultJourneyState(), DAY);
  const by = Object.fromEntries(list.map((g) => [g.id, g]));
  assert.equal(list[0].id, 'nivel');
  assert.deepEqual([by.bronze.have, by.bronze.need, by.bronze.label], [3, 7, 'faltam 4 dias']);
  assert.deepEqual([by['cristal:r'].have, by['cristal:r'].need, by['cristal:r'].label], [3, 7, 'faltam 4 dias'], '10 dias limpo: próximo marco é 14');
  assert.equal(by['item:chapeu'].label, 'faltam 5 INT', 'Inteligência 45 de 50 é o item mais perto');
  assert.ok(by.coroa);
  assert.ok(list.some((g) => g.id.startsWith('titulo:')));
  // Sem hábito a abandonar, sem baú de cristal; com a coroa, ela sai da lista.
  const sem = quaseLa({ ...d, habits: [ler] }, { ...defaultJourneyState(), owned: [...defaultJourneyState().owned, 'coroa'] }, DAY);
  assert.ok(!sem.some((g) => g.id.startsWith('cristal:') || g.id === 'coroa'));
});

test('subiu de nível: baú dourado a cada 5, casas e pets do nível; nível guardado com padrão 0', () => {
  assert.deepEqual(levelRewards(5).map((r) => r.kind), ['bau', 'casa']);
  assert.deepEqual(levelRewards(7).map((r) => r.title), ['Pet liberado: Gatinho', 'Pet liberado: Cãozinho']);
  assert.equal(levelRewards(8).length, 0);
  assert.equal(normalize({ ...emptyData(), journey: { avatar: null } }).journey.levelSeen, 0);
});

test('resumo da semana: a semana que acabou (seg a dom), uma vez por semana', () => {
  // 16/11/2026 é segunda: resume 09 a 15/11.
  const days = ['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-15', DAY];
  const h = normalizeHabit({ id: 'h', name: 'Ler', kind: 'construir', days: [0, 1, 2, 3, 4, 5, 6], attrs: ['INT'], checks: days, createdAt: '2026-11-01T10:00:00' });
  const d: AppData = { ...emptyData(), habits: [h] };
  const w = weekSummary(d, DAY)!;
  assert.deepEqual([w.start, w.end], ['2026-11-09', '2026-11-15']);
  assert.equal(w.missions, 3, 'só os 3 dias da semana');
  assert.ok(w.xp > 0 && w.gold > 0);
  assert.deepEqual(w.attrs.map((a) => a.code), ['INT']);
  assert.equal(weekSummary({ ...emptyData() }, DAY), null, 'sem nada, sem resumo');
  const s = defaultJourneyState();
  assert.equal(showWeekSummary(s, DAY), true);
  assert.equal(showWeekSummary({ ...s, weekSeen: '2026-11-16' }, '2026-11-20'), false, 'já visto nesta semana');
  assert.equal(normalize({ ...emptyData(), journey: { avatar: null } }).journey.weekSeen, '');
});

test('novidades: só o que apareceu de novo', () => {
  const d = emptyData();
  const a = journeyNews(d, defaultJourneyState(), DAY);
  const b = { ...a, titles: [...a.titles, 'x'], free: [...a.free, 'chapeu'], chests: [...a.chests, { key: 'k', kind: 'bronze' as const, date: DAY, reason: 'r' }] };
  const diff = newsDiff(a, b);
  assert.deepEqual(diff.titles, ['x']);
  assert.deepEqual(diff.free, ['chapeu']);
  assert.deepEqual(diff.chests.map((c) => c.key), ['k']);
  assert.deepEqual(newsDiff(b, b), { titles: [], free: [], forge: [], chests: [], boxGoals: [], realized: [] });
});

test('caixinha: guardar no plano dá XP, ouro e Disciplina; marcos dão baús; missão do dia', async () => {
  const { normalizeBox, deposit } = await import('./boxes.ts');
  const { journeyStats } = await import('./journey.ts');
  const { attributes, earnedChests } = await import('./jornada/rules.ts');
  const { missionsToday } = await import('./jornada/missions.ts');
  const b = normalizeBox({ id: 'bx', name: 'Viagem', target: 1000, plan: { amount: 300, every: 'semana', startDate: '2026-11-02' }, createdAt: '2026-11-02T10:00:00' });
  let d: AppData = { ...emptyData(), boxes: [b] };
  const m0 = missionsToday(d, DAY).find((m) => m.kind === 'caixinha')!;
  assert.equal(m0.done, false);
  assert.equal(m0.xp, 20);
  d = deposit('bx', 300, DAY, true)(d);
  d = deposit('bx', 300, DAY, true)(d); // segunda vez na mesma semana vira "extra"
  assert.equal(missionsToday(d, DAY).find((m) => m.kind === 'caixinha')!.done, true);
  const s = journeyStats(d, DAY);
  assert.equal(s.sources.find((x) => x.id === 'caixinha')!.count, 1);
  assert.equal(attributes(d, DAY).DIS, 3);
  const keys = earnedChests(d, DAY).map((c) => c.key).filter((k) => k.includes('caixinha'));
  assert.deepEqual(keys, ['bronze:caixinha:bx:25', 'prata:caixinha:bx:50']);
  assert.ok(quaseLa(d, defaultJourneyState(), DAY).some((g) => g.id === 'caixinha:bx' && g.title.includes('75%')));
});
