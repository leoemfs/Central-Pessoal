import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, normalizeHabit } from './data.ts';
import { campaignRegions, defaultProfile, normalizeProfile, steps, type Profile } from './jornada/interview.ts';
import { applyInterview, interviewPlan } from './jornada/interviewApply.ts';

const DAY = '2026-11-16';
const prof = (p: Partial<Profile>): Profile => ({ ...defaultProfile(DAY), ...p });

test('passos: uma pergunta por área escolhida, na ordem', () => {
  assert.deepEqual(steps(prof({ areas: ['dinheiro', 'corpo'] })), ['areas', 'dinheiro', 'corpo', 'horario', 'ritmo', 'resumo']);
});

test('campanha: Vila no começo, áreas na ordem, Montanha e Castelo no fim; com 1 área entra a Floresta', () => {
  assert.deepEqual(campaignRegions(prof({ areas: ['mente', 'largar'] })), ['Vila do Começo', 'Torre do Saber', 'Pântano das Tentações', 'Montanha da Disciplina', 'Castelo do Caos']);
  assert.deepEqual(campaignRegions(prof({ areas: ['corpo'] })), ['Vila do Começo', 'Arena de Ferro', 'Floresta da Rotina', 'Montanha da Disciplina', 'Castelo do Caos']);
});

test('aplicar: cria hábitos que faltam (sem duplicar) e a caixinha; guarda as respostas', () => {
  const d = { ...emptyData(), habits: [normalizeHabit({ id: 'x', name: 'arrumar a CAMA', kind: 'ritual', days: [1], createdAt: '2026-11-01T10:00:00' })] };
  const p = prof({
    areas: ['rotina', 'corpo', 'largar', 'dinheiro'].slice(0, 3) as Profile['areas'],
    corpo: { act: 'corrida', freq: 3 },
    largar: { habit: 'outro', custom: 'roer unha' },
    period: 'noite',
  });
  const plan = interviewPlan(d, p, DAY);
  assert.deepEqual(plan.kept.map((h) => h.name), ['Arrumar a cama']);
  assert.deepEqual(plan.create.map((h) => h.name), ['Correr 3 km', 'roer unha']);
  assert.equal(plan.box, null, 'dinheiro não foi escolhido');
  const out = applyInterview(d, p, DAY);
  const corrida = out.habits.find((h) => h.name === 'Correr 3 km')!;
  assert.equal(corrida.kind, 'construir');
  assert.deepEqual(corrida.days, [1, 3, 5]);
  assert.equal(corrida.period, 'noite');
  assert.deepEqual(corrida.attrs, ['FOR', 'AGI', 'RES']);
  const largar = out.habits.find((h) => h.name === 'roer unha')!;
  assert.equal(largar.kind, 'abandonar');
  assert.equal(largar.startDate, DAY);
  assert.equal(out.habits.length, 3);
  assert.deepEqual(out.journey.profile?.areas, ['rotina', 'corpo', 'largar']);
});

test('aplicar: dinheiro com objetivo cria a caixinha com meta e plano (uma vez só)', () => {
  const p = prof({ areas: ['dinheiro'], dinheiro: { issue: 'gasto', goal: 'viagem', meta: 3000, plan: 'mes200', custom: '' } });
  const once = applyInterview(emptyData(), p, DAY);
  assert.equal(once.boxes.length, 1);
  assert.equal(once.boxes[0].name, 'Viagem');
  assert.equal(once.boxes[0].target, 3000);
  assert.deepEqual(once.boxes[0].plan, { amount: 200, every: 'mes', startDate: DAY });
  assert.equal(applyInterview(once, p, DAY).boxes.length, 1, 'refazer não duplica');
  assert.equal(applyInterview(emptyData(), { ...p, dinheiro: { ...p.dinheiro, goal: 'nenhum' } }, DAY).boxes.length, 0);
});

test('respostas: backup antigo fica sem entrevista; valores estranhos voltam ao padrão', () => {
  assert.equal(normalize({ ...emptyData(), journey: { avatar: null } }).journey.profile, null);
  const p = normalizeProfile({ areas: ['corpo', 'xyz', 'corpo', 'mente', 'rotina', 'largar'], corpo: { act: 'voar', freq: 9 }, pace: 'turbo', at: DAY })!;
  assert.deepEqual(p.areas, ['corpo', 'mente', 'rotina']);
  assert.deepEqual(p.corpo, { act: 'academia', freq: 3 });
  assert.equal(p.pace, 'equilibrado');
});
