import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, normalizeHabit } from './data.ts';
import { campaignRegions, defaultProfile, normalizeProfile, prefill, steps, type Profile } from './jornada/interview.ts';
import { emptyProfile, interviewQuestions, questionsLeft } from './profile.ts';
import { applyInterview, interviewPlan } from './jornada/interviewApply.ts';

const DAY = '2026-11-16';
const prof = (p: Partial<Profile>): Profile => ({ ...defaultProfile(DAY), ...p });

test('passos: uma pergunta por área (região), na ordem; com áreas já respondidas, começa pela rota', () => {
  assert.deepEqual(steps(prof({ areas: ['dinheiro', 'corpo'] })), ['areas', 'dinheiro', 'corpo', 'ritmo', 'resumo']);
  assert.deepEqual(steps(prof({ areas: ['mente'] }), false), ['rota', 'mente', 'ritmo', 'resumo']);
});

test('E4: a Mestra Lume reaproveita as áreas, o hábito a largar e o dinheiro do Você', () => {
  const v = { ...emptyProfile(), areas: ['largar', 'rotina', 'xyz', 'dinheiro', 'corpo'], quits: ['refri'], money: { challenge: 'naosei' as const, saveFor: 'casa', amount: 20000 } };
  const p = prefill(null, v, DAY);
  assert.deepEqual(p.areas, ['largar', 'rotina', 'dinheiro']);
  assert.deepEqual(p.largar, { habit: 'refrigerante', custom: '' });
  assert.equal(p.dinheiro.issue, 'entrada');
  assert.equal(p.dinheiro.goal, 'outro');
  assert.equal(p.dinheiro.custom, 'Casa');
  assert.equal(p.dinheiro.meta, 20000);
  assert.deepEqual(prefill(null, { ...v, quits: ['unha'] }, DAY).largar, { habit: 'outro', custom: 'Roer unha' });
  // Refazer: as respostas da Jornada ficam; só completa as áreas se estiverem vazias.
  const old = prof({ areas: ['corpo'], largar: { habit: 'doce', custom: '' } });
  assert.deepEqual(prefill(old, v, DAY).areas, ['corpo']);
  assert.equal(prefill(old, v, DAY).largar.habit, 'doce');
  assert.deepEqual(prefill(prof({ areas: [] }), v, DAY).areas, ['largar', 'rotina', 'dinheiro']);
});

test('E4: aplicar a entrevista da Jornada junta as áreas no Você (sem repetir)', () => {
  const d = { ...emptyData(), profile: { ...emptyProfile(), areas: ['rotina', 'mente'] } };
  const out = applyInterview(d, prof({ areas: ['corpo', 'rotina'] }), DAY);
  assert.deepEqual(out.profile.areas, ['corpo', 'rotina', 'mente']);
});

test('E4: Completar o perfil não pergunta as áreas que a montagem já respondeu', () => {
  assert.deepEqual(interviewQuestions({ areas: [] }), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(interviewQuestions({ areas: ['dinheiro'] }), [0, 1, 3, 4, 5, 6]);
  const p = { ...emptyProfile('pulou'), areas: ['dinheiro'] };
  assert.equal(questionsLeft(p), 6);
  assert.equal(questionsLeft({ ...p, onboarding: { ...p.onboarding, step: 4 } }), 3);
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
