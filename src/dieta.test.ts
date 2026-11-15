import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './data.ts';
import {
  activePlan, allRecipes, dayLine, newMeal, recipesOf, toggleRecipe, DEFAULT_MEALS, dietCount, emptyDiet, markMeal, mealsOf, newPlan, normalizeDiet, pickOption, removePlan, savePlan, setDayVariant, setExtra,
  setSplit, toggleVariantDay, choosePlan, variantFor,
} from './dieta.ts';
import { healthWeeks } from './saude.ts';
import { newList } from './lists.ts';
import type { AppData } from './types.ts';

const SUN = '2026-11-15'; // domingo
const MON = '2026-11-16';
const WED = '2026-11-18';

function counter() {
  let n = 0;
  return () => `id${++n}`;
}

function withPlan(split = false): AppData {
  const ids = counter();
  let p = newPlan(ids, 'nutri', '2026-11-15T10:00:00Z');
  p = { ...p, variants: [{ ...p.variants[0], meals: p.variants[0].meals.slice(0, 3).map((m, i) => ({ ...m, food: `comida ${i}`, alts: i === 0 ? ['iogurte + aveia'] : [] })) }] };
  if (split) p = setSplit(p, true, ids);
  return savePlan(p)(normalize({}));
}

test('dados antigos ganham Dieta vazia; lixo é limpo', () => {
  assert.deepEqual(normalize({}).health.diet, emptyDiet());
  const d = normalizeDiet({
    plans: [{ id: 'p', name: '', split: true, variants: [{ id: 'v', days: [9, 1, 1], meals: [{ id: 'm', time: '7h', alts: ['ok', '', 3] }, { sem: 'id' }] }] }, { sem: 'id' }],
    activeId: 'outro',
    log: { '2026-11-15': { m: { mark: 'segui', option: -1 }, x: { mark: 'talvez' } }, ontem: { m: { mark: 'fugi' } } },
    extras: { '2026-11-15': 'pizza', '2026-11-14': '' },
  });
  assert.equal(d.plans.length, 1);
  assert.equal(d.plans[0].name, 'Minha dieta');
  assert.equal(d.plans[0].split, false); // dias diferentes precisa de 2 variações
  assert.deepEqual(d.plans[0].variants[0].days, [1]);
  assert.deepEqual(d.plans[0].variants[0].meals[0], { id: 'm', name: 'Refeição', time: '', food: '', alts: ['ok'], recipes: [] });
  assert.equal(d.activeId, null);
  assert.deepEqual(d.log, { '2026-11-15': { m: { mark: 'segui', option: 0 } } });
  assert.deepEqual(d.extras, { '2026-11-15': 'pizza' });
});

test('plano novo: refeições comuns, origem escolhida, e o primeiro fica em uso', () => {
  const p = newPlan(counter(), 'eu', 'x');
  assert.equal(p.name, 'Minha dieta');
  assert.deepEqual(p.variants[0].meals.map((m) => m.name), DEFAULT_MEALS.map((m) => m.name));
  const d = withPlan();
  assert.equal(activePlan(d)?.source, 'nutri');
  const outro = newPlan(() => 'z' + Math.random(), 'eu', 'x');
  const d2 = savePlan(outro)(d);
  assert.equal(activePlan(d2)?.id, activePlan(d)?.id); // o novo não troca o que está em uso
  assert.equal(activePlan(choosePlan(outro.id)(d2))?.id, outro.id);
  assert.equal(activePlan(removePlan(activePlan(d)!.id)(d2))?.id, outro.id);
});

test('refeições do dia em ordem de horário', () => {
  const d = withPlan();
  assert.deepEqual(mealsOf(d, SUN)?.meals.map((m) => m.name), ['Café da manhã', 'Lanche da manhã', 'Almoço']);
  assert.equal(mealsOf(normalize({}), SUN), null);
});

test('dias diferentes: opcional; treino seg/qua/sex e descanso nos outros; dá para trocar no dia', () => {
  const d = withPlan(true);
  const p = activePlan(d)!;
  assert.equal(p.split, true);
  assert.deepEqual(p.variants.map((v) => [v.name, v.days]), [['Dia de treino', [1, 3, 5]], ['Dia de descanso', [0, 2, 4, 6]]]);
  assert.equal(variantFor(p, MON).name, 'Dia de treino');
  assert.equal(variantFor(p, SUN).name, 'Dia de descanso');
  assert.equal(mealsOf(setDayVariant(SUN, p.variants[0].id)(d), SUN)?.variant.name, 'Dia de treino');
  // um dia da semana fica numa variação só
  const q = toggleVariantDay(p, p.variants[0].id, 0);
  assert.deepEqual(q.variants[0].days, [0, 1, 3, 5]);
  assert.deepEqual(q.variants[1].days, [2, 4, 6]);
  // desligar volta a valer todos os dias, com a primeira variação
  const off = setSplit(p, false, counter());
  assert.equal(off.variants.length, 1);
  assert.deepEqual(off.variants[0].days, [0, 1, 2, 3, 4, 5, 6]);
});

test('marcar refeição: segui, em parte, fugi; tocar de novo desmarca; opção escolhida', () => {
  let d = withPlan();
  const [cafe, lanche, almoco] = mealsOf(d, WED)!.meals;
  d = markMeal(WED, cafe.id, 'segui')(d);
  d = markMeal(WED, lanche.id, 'fugi')(d);
  d = markMeal(WED, almoco.id, 'parte')(d);
  assert.equal(dayLine(d, WED), '1 de 3 seguidas');
  d = pickOption(WED, cafe.id, 1)(d);
  assert.deepEqual(d.health.diet.log[WED][cafe.id], { mark: 'segui', option: 1 });
  d = markMeal(WED, lanche.id, 'fugi')(d);
  assert.equal(d.health.diet.log[WED][lanche.id], undefined);
  d = setExtra(WED, 'um doce à tarde')(d);
  assert.equal(d.health.diet.extras[WED], 'um doce à tarde');
  assert.equal(setExtra(WED, '  ')(d).health.diet.extras[WED], undefined);
});

test('resumo da semana conta as marcações e as refeições previstas', () => {
  let d = withPlan();
  const meals = mealsOf(d, MON)!.meals;
  d = markMeal(MON, meals[0].id, 'segui')(d);
  d = markMeal(MON, meals[1].id, 'segui')(d);
  d = markMeal(WED, meals[2].id, 'fugi')(d);
  assert.deepEqual(dietCount(d, MON, WED), { segui: 2, parte: 0, fugi: 1, planned: 9 });
  const [w] = healthWeeks(d, WED, 1);
  assert.deepEqual(w.diet, { segui: 2, parte: 0, fugi: 1, planned: 9 });
  // antes de o plano existir, não há refeições previstas
  assert.equal(dietCount(d, '2026-11-01', '2026-11-14').planned, 0);
});

test('receitas ligadas: moram em Listas; a refeição só aponta; apagada some sozinha', () => {
  const base = normalize({});
  const recipeCat = base.listCategories.find((c) => c.kind === 'receita')!.id;
  const otherCat = base.listCategories.find((c) => c.kind !== 'receita')!.id;
  const omelete = { ...newList('Omelete de legumes', recipeCat), id: 'r1' };
  const bolo = { ...newList('Bolo de banana', recipeCat), id: 'r2' };
  const mercado = { ...newList('Mercado', otherCat), id: 'm1' };
  const d = { ...base, lists: [omelete, mercado, bolo] };
  assert.deepEqual(allRecipes(d).map((r) => r.name), ['Bolo de banana', 'Omelete de legumes']);
  let meal = newMeal('x', 'Jantar');
  meal = toggleRecipe(toggleRecipe(meal, 'r1'), 'r2');
  assert.deepEqual(recipesOf(d, meal).map((r) => r.id), ['r1', 'r2']);
  assert.deepEqual(toggleRecipe(meal, 'r1').recipes, ['r2']);
  // apagada em Listas: some da refeição, sem erro
  assert.deepEqual(recipesOf({ ...d, lists: [mercado, bolo] }, meal).map((r) => r.id), ['r2']);
  // lista que não é receita não conta
  assert.deepEqual(recipesOf(d, { recipes: ['m1'] }), []);
  // dados antigos ganham recipes vazio; repetidos e lixo saem
  const n = normalizeDiet({ plans: [{ id: 'p', variants: [{ id: 'v', meals: [{ id: 'a' }, { id: 'b', recipes: ['r1', 'r1', 3, ''] }] }] }] });
  assert.deepEqual(n.plans[0].variants[0].meals.map((m) => m.recipes), [[], ['r1']]);
});
