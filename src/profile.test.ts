import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, normalizeHabit } from './data.ts';
import { acceptSuggestion, completeness, dismissSuggestion, emptyProfile, parseMoneyText, shiftTime, showAsk, snoozeAsk, suggestions } from './profile.ts';
import type { AppData, Profile } from './types.ts';

// 2026-11-04 é uma quarta-feira.
const TODAY = '2026-11-04';
const withProfile = (p: Partial<Profile>, extra: Partial<AppData> = {}): AppData => ({ ...emptyData(), profile: { ...emptyProfile('feito'), ...p }, ...extra });
const ids = (d: AppData) => suggestions(d, TODAY).map((s) => s.id);

test('quem começa do zero vê a entrevista; quem já tinha dados, não', () => {
  assert.equal(normalize(undefined).profile.onboarding.state, 'novo');
  assert.equal(normalize({}).profile.onboarding.state, 'novo');
  assert.equal(normalize({ version: 2, tasks: [] }).profile.onboarding.state, 'pulou');
  const saved = normalize({ version: 2, profile: { name: 'Ana', areas: ['corpo'], onboarding: { state: 'feito' }, money: { challenge: 'xx', amount: -3 } } });
  assert.equal(saved.profile.name, 'Ana');
  assert.equal(saved.profile.onboarding.state, 'feito');
  assert.equal(saved.profile.money.challenge, '');
  assert.equal(saved.profile.money.amount, null);
  assert.equal(normalizeHabit({ id: 'h', name: 'Ler' }).link, '');
});

test('perfil completo: 9 partes, e "nenhum" conta como resposta', () => {
  assert.equal(completeness(emptyProfile()), 0);
  const p = { ...emptyProfile(), name: 'Ana', areas: ['corpo'], noQuit: true };
  assert.equal(completeness(p), 33);
});

test('cartão do Início: só para quem pulou, some com "Agora não" por 7 dias e de vez depois de 2', () => {
  const p = emptyProfile('pulou');
  assert.equal(showAsk(emptyProfile('novo'), TODAY), false);
  assert.equal(showAsk(p, TODAY), true);
  let d = withProfile(p);
  d = snoozeAsk(TODAY)(d);
  assert.equal(showAsk(d.profile, TODAY), false);
  assert.equal(showAsk(d.profile, '2026-11-11'), true);
  d = snoozeAsk('2026-11-11')(d);
  assert.equal(showAsk(d.profile, '2027-01-01'), false);
});

test('valores em texto: R$ 3.000, 10 mil, 2,5 mil', () => {
  assert.deepEqual(['R$ 3.000', 'Juntar R$ 10 mil', '6.000', '2,5 mil', 'viajar'].map(parseMoneyText), [3000, 10000, 6000, 2500, 0]);
  assert.equal(shiftTime('23:00', -30), '22:30');
  assert.equal(shiftTime('00:10', -20), '23:50');
});

test('sugestões seguem o perfil e a prioridade das áreas', () => {
  const d = withProfile({ day: ['sentado'], areas: ['bemestar', 'corpo'], limits: ['costas', 'ansiedade'], likes: ['casa'], quits: ['redes'] });
  const list = ids(d);
  for (const id of ['s-ombros', 's-lombar', 's-478', 's-casa', 's-meditar', 's-gratidao', 's-redes1', 's-redes2']) assert.ok(list.includes(id), id);
  // Bem-estar vem antes de corpo; largar por último.
  assert.ok(list.indexOf('s-478') < list.indexOf('s-ombros'));
  assert.equal(list[list.length - 1], 's-redes2');
  // Sem joelho: nada de bike; com joelho, bike no lugar do treino em casa.
  assert.ok(!list.includes('s-bike'));
  assert.ok(ids(withProfile({ areas: ['corpo'], limits: ['joelho'] })).includes('s-bike'));
  // Perfil vazio: nenhuma sugestão.
  assert.deepEqual(ids(withProfile({})), []);
});

test('sugestões de dinheiro pelas respostas da entrevista', () => {
  assert.ok(ids(withProfile({ money: { challenge: 'atraso', saveFor: '', amount: null } })).includes('s-contas'));
  assert.ok(ids(withProfile({ money: { challenge: 'gasto', saveFor: '', amount: null } })).includes('s-domingo'));
  assert.ok(ids(withProfile({ money: { challenge: 'naosei', saveFor: '', amount: null } })).includes('s-anotar'));
  const contas = suggestions(withProfile({ money: { challenge: 'atraso', saveFor: '', amount: null } }), TODAY)[0];
  assert.equal(contas.act.type === 'events' && contas.act.events[0].date, '2026-12-01');
});

test('aceitar cria o hábito ligado à prática; dispensar e aceitar somem da lista', () => {
  let d = withProfile({ day: ['sentado'], areas: ['corpo'], shortGoals: [{ id: 'g', text: 'Correr 5 km', when: '', doneAt: null }] });
  const [ombros] = suggestions(d, TODAY);
  assert.equal(ombros.id, 's-ombros');
  d = acceptSuggestion(ombros, TODAY)(d);
  const h = d.habits[0];
  assert.equal(h.name, 'Alongar pescoço e ombros');
  assert.equal(h.link, 'alongamento:ombros');
  assert.deepEqual(h.days, [1, 2, 3, 4, 5]);
  assert.equal(h.time, '15:00');
  assert.equal(h.period, 'tarde');
  assert.ok(h.attrs.includes('AGI'));
  assert.ok(!ids(d).includes('s-ombros'));
  // Corrida: 3 compromissos em seg, qua e sex a partir de amanhã.
  const corrida = suggestions(d, TODAY).find((s) => s.id === 's-corrida')!;
  d = acceptSuggestion(corrida, TODAY)(d);
  assert.deepEqual(d.events.map((e) => e.date), ['2026-11-06', '2026-11-09', '2026-11-11']);
  d = dismissSuggestion('s-academia')(d);
  assert.deepEqual(ids(d), []);
});

test('não sugere o que já existe (mesmo nome ou mesma prática ligada)', () => {
  const d = withProfile({ areas: ['bemestar', 'mente'], quits: ['redes'] }, { habits: [normalizeHabit({ id: 'm', name: 'Meditação da manhã' }), normalizeHabit({ id: 'l', name: 'ler 10 MIN' })] });
  const list = ids(d);
  assert.ok(!list.includes('s-meditar'));
  assert.ok(!list.includes('s-ler'));
  assert.ok(!list.includes('s-redes2'), 'mesmo hábito, outra sugestão');
});
