import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, normalizeHabit, seedCategories } from './data.ts';
import { addExpense } from './finance.ts';
import { setBudget } from './budget.ts';
import { deposit, newBox } from './boxes.ts';
import { allGoals, goalSummary, goalsToWatch, newCareerGoal, removeCareerGoal, saveCareerGoal, setBoxGoal, setHabitGoal } from './objetivos.ts';
import { moveProfileGoals, setProfile, suggestions } from './profile.ts';
import type { AppData } from './types.ts';

const TODAY = '2026-11-15';

test('metas de carreira: backup antigo ganha lista vazia; passos e prazo são lidos', () => {
  assert.deepEqual(normalize({ version: 2, career: { jobs: [] } }).career.goals, []);
  const d = normalize({ version: 2, career: { goals: [{ id: 'g', title: 'Ser líder', deadline: '2027-06-01', steps: [{ id: 's', text: 'Curso', done: true }, { id: 'x' }], doneAt: 'lixo' }] } });
  const g = d.career.goals[0];
  assert.equal(g.title, 'Ser líder');
  assert.equal(g.deadline, '2027-06-01');
  assert.equal(g.doneAt, null);
  assert.deepEqual(g.steps.map((s) => s.done), [true, false]);
});

test('caixinha com meta aparece com progresso; prazo vencido = atrasada; meta alcançada = concluída', () => {
  let d: AppData = { ...emptyData(), boxes: [newBox({ name: 'Viagem', target: 1000, color: '#000', plan: null, deadline: '2026-11-01' })] };
  const id = d.boxes[0].id;
  d = deposit(id, 300, '2026-10-20', false)(d);
  let g = allGoals(d, TODAY).find((x) => x.kind === 'caixinha')!;
  assert.equal(g.pct, 30);
  assert.equal(g.status, 'atrasada');
  d = deposit(id, 700, '2026-11-10', false)(d);
  g = allGoals(d, TODAY).find((x) => x.kind === 'caixinha')!;
  assert.equal(g.status, 'concluida');
  assert.equal(g.doneAt, '2026-11-10');
  // Caixinha sem meta não entra.
  d = setBoxGoal(id, null, null)(d);
  assert.equal(allGoals(d, TODAY).length, 0);
});

test('hábito a construir e hábito com quantidade viram metas; pausado e arquivado não', () => {
  const build = normalizeHabit({ id: 'a', name: 'Ler', kind: 'construir', target: 10, checks: ['2026-11-13', '2026-11-14'], days: [0, 1, 2, 3, 4, 5, 6], createdAt: '2026-11-01T10:00:00' });
  const water = normalizeHabit({ id: 'b', name: 'Água', kind: 'ritual', goal: 2000, unit: 'ml', amounts: { [TODAY]: 500 }, createdAt: '2026-11-01T10:00:00' });
  const archived = normalizeHabit({ id: 'c', name: 'X', kind: 'construir', archivedAt: '2026-11-02', createdAt: '2026-11-01T10:00:00' });
  let d: AppData = { ...emptyData(), habits: [build, water, archived] };
  const gs = allGoals(d, TODAY);
  assert.deepEqual(gs.map((g) => g.refId).sort(), ['a', 'b']);
  assert.equal(gs.find((g) => g.refId === 'a')!.pct, 20);
  assert.equal(gs.find((g) => g.refId === 'b')!.pct, 25);
  d = setHabitGoal('a', { target: 2 })(d);
  assert.equal(allGoals(d, TODAY).find((g) => g.refId === 'a')!.status, 'concluida');
});

test('orçamento conta como meta e passa a atrasada quando estoura o limite', () => {
  let d = seedCategories(emptyData());
  const cat = d.categories[0].id;
  d = addExpense(d, { kind: 'avulsa', description: 'X', categoryId: cat, method: 'pix', cardId: null, date: '2026-11-05', amounts: [150], paidAt: null }, '2026-11-05');
  d = setBudget(cat, 100)(d);
  const g = allGoals(d, TODAY).find((x) => x.kind === 'orcamento')!;
  assert.equal(g.status, 'atrasada');
  assert.equal(g.late, 'passou do limite');
});

test('carreira: salvar, concluir, excluir; ordem atrasadas → andando → concluídas; resumo e Início', () => {
  let d = emptyData();
  const a = { ...newCareerGoal(), title: 'Promoção', deadline: '2026-11-01' };
  const b = { ...newCareerGoal(), title: 'Inglês', deadline: '2026-12-01', steps: [{ id: '1', text: 'Aula', done: true }, { id: '2', text: 'Prova', done: false }] };
  const c = { ...newCareerGoal(), title: 'Curso', doneAt: '2026-03-01' };
  d = saveCareerGoal(a)(saveCareerGoal(b)(saveCareerGoal(c)(d)));
  const gs = allGoals(d, TODAY);
  assert.deepEqual(gs.map((g) => g.title), ['Promoção', 'Inglês', 'Curso']);
  assert.equal(gs[1].pct, 50);
  assert.deepEqual(goalSummary(gs, TODAY), { andando: 1, atrasadas: 1, concluidasNoAno: 1 });
  assert.deepEqual(goalsToWatch(gs, TODAY).map((g) => g.title), ['Promoção', 'Inglês']);
  d = removeCareerGoal(a.id)(d);
  assert.equal(d.career.goals.length, 2);
  assert.ok(d.deleted[a.id]);
});

test('E5: metas curtas e longas do Você vão para Objetivos uma vez, sem perder nada', () => {
  const raw = {
    version: 2,
    profile: {
      shortGoals: [{ id: 'v', text: 'Correr 5 km', when: 'até março', doneAt: null }],
      longGoals: [{ id: 'w', text: 'Juntar R$ 10 mil', when: '', doneAt: '2026-05-02T10:00:00Z' }, { id: 'x', text: '  ', when: '', doneAt: null }],
    },
    career: { goals: [{ id: 'c', title: 'Promoção' }] },
  };
  const d = normalize(raw);
  assert.deepEqual(d.profile.shortGoals, []);
  assert.deepEqual(d.profile.longGoals, []);
  assert.deepEqual(d.career.goals.map((g) => [g.id, g.area, g.title, g.note, g.doneAt]), [
    ['c', 'carreira', 'Promoção', '', null],
    ['v', 'voce', 'Correr 5 km', 'Curto prazo · até março', null],
    ['w', 'voce', 'Juntar R$ 10 mil', 'Longo prazo', '2026-05-02'],
  ]);
  // De novo (backup antigo importado outra vez): nada entra em dobro.
  const again = moveProfileGoals({ ...d, profile: { ...d.profile, shortGoals: raw.profile.shortGoals } });
  assert.equal(again.career.goals.length, 3);
  // Em Objetivos, aparecem na área Você e mudam ali mesmo.
  const gs = allGoals(d, TODAY);
  assert.deepEqual(gs.filter((g) => g.area === 'voce').map((g) => [g.title, g.status, g.where]), [
    ['Correr 5 km', 'andando', 'Objetivos › Você'],
    ['Juntar R$ 10 mil', 'concluida', 'Objetivos › Você'],
  ]);
  // A entrevista do Você continua salvando metas, que vão direto para Objetivos.
  const e = setProfile((p) => ({ ...p, shortGoals: [{ id: 'n', text: 'Ler 1 livro', when: '', doneAt: null }] }))(emptyData());
  assert.equal(e.profile.shortGoals.length, 0);
  assert.deepEqual(e.career.goals.map((g) => [g.area, g.title]), [['voce', 'Ler 1 livro']]);
  // Excluída antes? Não volta.
  const del = moveProfileGoals({ ...emptyData(), deleted: { v: '2026-01-01' }, profile: { ...emptyData().profile, shortGoals: raw.profile.shortGoals } });
  assert.equal(del.career.goals.length, 0);
  assert.ok(Array.isArray(suggestions(d)));
});
