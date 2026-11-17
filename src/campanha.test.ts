import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalizeHabit } from './data.ts';
import type { AppData } from './types.ts';
import { campaign, campaignIds, chapters, clearChapter } from './jornada/campaign.ts';
import { defaultJourneyState, earnedChests, equip, normalizeJourney, titleProgress, attributes, type JourneyState } from './jornada/rules.ts';
import { defaultProfile } from './jornada/interview.ts';

const DAY = '2026-11-16';
const arrived = (): JourneyState => ({ ...defaultJourneyState(), chests: [{ key: 'boas-vindas', kind: 'dourado' as const, openedAt: '2026-11-10', gold: 50, crystals: 1, item: 'couro' }] });

test('campanha: regiões da entrevista (Vila, áreas, Floresta se curta, Montanha e Castelo)', () => {
  assert.deepEqual(campaignIds(null), ['vila', 'floresta', 'montanha', 'castelo']);
  const p = { ...defaultProfile(DAY), areas: ['dinheiro', 'largar'] as const };
  assert.deepEqual(campaignIds({ ...p, areas: [...p.areas] }), ['vila', 'mercado', 'pantano', 'montanha', 'castelo']);
  const fast = chapters({ ...defaultProfile(DAY), areas: ['rotina'], pace: 'desafiador' });
  assert.equal(fast[1].goals[0].need, 9, 'ritmo desafiador: 7 × 1,3');
});

test('campanha: Vila conta os dados reais desde a chegada e conclui sem chefe', () => {
  const h = normalizeHabit({ id: 'h', name: 'Cama', kind: 'ritual', days: [0, 1, 2, 3, 4, 5, 6], checks: ['2026-11-05', '2026-11-12'], createdAt: '2026-11-01T10:00:00' });
  let d: AppData = { ...emptyData(), habits: [h], journal: [{ id: 'j', createdAt: '2026-11-12T10:00:00', title: '', summary: '', content: 'x', tag: '' } as AppData['journal'][number]] };
  let s = arrived();
  let v = campaign(d, s, DAY);
  assert.equal(v.current, 0);
  assert.equal(v.goals.find((g) => g.key === 'ritual')!.have, 1, 'só o check depois da chegada');
  assert.equal(v.goals.find((g) => g.key === 'diario')!.have, 1);
  assert.equal(v.stage, 'objetivos');
  // Vestir um item conta para a Vila.
  s = equip({ ...s, owned: [...s.owned, 'capuz'] }, 'elmo', 'capuz', 1) as typeof s;
  assert.equal(s.camp.dressed, true);
  // Conta paga no prazo e dia completo.
  d = { ...d, expenses: [{ id: 'e', kind: 'avulsa', description: 'Luz', categoryId: '', amount: 10, method: 'pix', cardId: null, dueDate: '2026-11-13', purchaseDate: null, invoiceMonth: null, paidAt: '2026-11-13', seriesId: null, installment: null, installments: null, createdAt: '2026-11-01T10:00:00', updatedAt: '2026-11-01T10:00:00' } as AppData['expenses'][number]] };
  v = campaign(d, s, DAY);
  assert.equal(v.goals.find((g) => g.key === 'conta')!.have, 1);
  assert.equal(v.goals.find((g) => g.key === 'diaCompleto')!.have, 1, '12/11: o único hábito do dia foi feito');
  assert.equal(v.stage, 'pronto');
  s = clearChapter(s, v, DAY);
  const dd = { ...d, journey: s };
  assert.equal(campaign(dd, s, DAY).current, 1);
  assert.ok(earnedChests(dd, DAY).some((c) => c.key === 'prata:campanha:vila'));
  assert.ok(titleProgress({ d: dd, today: DAY, attrs: attributes(dd, DAY) }).find((t) => t.id === 'viajante')!.earned);
  // Região com chefe não conclui sozinha (o chefe chega na N2.10b).
  assert.equal(clearChapter(s, { ...campaign(dd, s, DAY), stage: 'chefe' }, DAY), s);
  assert.deepEqual(normalizeJourney({}).camp, { cleared: [], intro: [], dressed: false, boss: null });
});

test('N2.10b: chefe aparece, cada missão é um golpe, foge sem perda e, vencido, conclui a região', async () => {
  const { bossView, bossMax, startBoss } = await import('./jornada/campaign.ts');
  const days = (from: string, n: number) => Array.from({ length: n }, (_, i) => { const d = new Date(from + 'T12:00:00'); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10); });
  // Floresta logo depois da Vila: rotina com 7 dias seguidos e 20 rituais (ritmo desafiador para ser rápido: 9 e 26).
  const p = { ...defaultProfile('2026-11-01'), areas: ['rotina' as const], pace: 'tranquilo' as const };
  const h = normalizeHabit({ id: 'h', name: 'Cama', kind: 'ritual', days: [0, 1, 2, 3, 4, 5, 6], checks: days('2026-10-21', 26), createdAt: '2026-10-01T10:00:00' });
  const h2 = normalizeHabit({ id: 'h2', name: 'Ler', kind: 'construir', days: [0, 1, 2, 3, 4, 5, 6], checks: days('2026-10-21', 26), createdAt: '2026-10-01T10:00:00' });
  let s: JourneyState = { ...arrived(), profile: p, camp: { cleared: [{ id: 'vila', at: '2026-10-21' }], intro: [], dressed: true, boss: null } };
  const d: AppData = { ...emptyData(), habits: [h, h2] };
  let v = campaign(d, s, '2026-11-14');
  assert.equal(v.chapters[v.current].id, 'floresta');
  assert.equal(v.stage, 'aparece', 'objetivos cumpridos: o chefe se apresenta');
  assert.equal(bossMax(d, '2026-11-14', 7, 'tranquilo'), Math.max(6, Math.round(2 * 7 * 0.6)));
  s = startBoss(d, s, '2026-11-14');
  assert.equal(s.camp.boss?.base, 2, 'o que já estava feito no dia não conta');
  v = campaign(d, s, '2026-11-14');
  assert.equal(v.stage, 'chefe');
  assert.equal(v.boss!.hp, v.boss!.max);
  // Dias seguintes: 2 golpes por dia (até 15/11 nos dados).
  const b = bossView(d, s.camp.boss!, '2026-11-15');
  assert.equal(b.hp, b.max - 2);
  // Sem missões, o prazo passa: ele foge e volta com a vida cheia (nada se perde).
  const fled = bossView(d, { ...s.camp.boss!, start: '2026-10-01' }, '2026-10-09');
  assert.ok(fled.fled >= 1);
  // Vencer (vida pequena): a região fica pronta e, ao concluir, dá o Manto da floresta.
  const easy = { ...s, camp: { ...s.camp, boss: { ...s.camp.boss!, max: 2 } } };
  v = campaign(d, easy, '2026-11-15');
  assert.equal(v.stage, 'pronto');
  const won = clearChapter(easy, v, '2026-11-15');
  assert.ok(won.owned.includes('mantoFloresta'));
  assert.equal(won.camp.boss, null);
});
