import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeIndex, addFavorite, barFor, crumb, DEFAULT_FAVORITES, favoriteItems, MODULE_BARS, normalizeFavorites } from './moduleBar.ts';

test('favoritos: sempre 3, válidos e sem repetir', () => {
  assert.deepEqual(normalizeFavorites(undefined), DEFAULT_FAVORITES);
  assert.deepEqual(normalizeFavorites(['listas', 'listas', 'xyz']), ['listas', 'financas', 'diario']);
  assert.deepEqual(normalizeFavorites(['nucleo', 'listas', 'voce', 'jornada']), ['nucleo', 'listas', 'voce']);
  assert.deepEqual(normalizeFavorites('lixo'), DEFAULT_FAVORITES);
});

test('marcar favorito: entra no fim e o mais antigo sai', () => {
  const r = addFavorite(['financas', 'diario', 'agenda'], 'nucleo');
  assert.deepEqual(r.favorites, ['diario', 'agenda', 'nucleo']);
  assert.equal(r.removed, 'financas');
  const same = addFavorite(['financas', 'diario', 'agenda'], 'diario');
  assert.equal(same.removed, null);
  assert.deepEqual(same.favorites, ['financas', 'diario', 'agenda']);
  assert.equal(addFavorite(['financas', 'diario', 'agenda'], 'nao-existe').removed, null);
  assert.deepEqual(favoriteItems(['financas', 'listas', 'voce']).map((f) => f.label), ['Finanças', 'Listas', 'Você']);
});

test('cada tela cai na barra do seu módulo', () => {
  assert.equal(barFor('orcamento')?.id, 'financas');
  assert.equal(barFor('relatorios')?.id, 'financas');
  assert.equal(barFor('revisao')?.id, 'diario');
  assert.equal(barFor('humor')?.id, 'diario');
  assert.equal(barFor('inicio'), null);
  assert.equal(barFor('mais'), null);
  assert.equal(barFor('arquivo'), null);
  // Nenhuma tela em dois módulos, e cada barra tem 3 itens com a casa no centro.
  const all = MODULE_BARS.flatMap((b) => b.sections);
  assert.equal(new Set(all).size, all.length);
  for (const b of MODULE_BARS) assert.equal(b.items.length, 3);
});

test('item ativo e texto do topo', () => {
  const fin = barFor('financas')!;
  assert.equal(activeIndex(fin, 'financas', null), 1);
  assert.equal(activeIndex(fin, 'orcamento', null), 0);
  assert.deepEqual(crumb(fin, 0), { module: 'Finanças', page: 'Orçamento' });
  assert.deepEqual(crumb(fin, 1), { module: 'Finanças', page: null });
  const ag = barFor('agenda')!;
  assert.equal(activeIndex(ag, 'agenda', 'tarefas'), 0);
  assert.equal(activeIndex(ag, 'agenda', 'calendario'), 1);
  const nu = barFor('nucleo')!;
  assert.equal(activeIndex(nu, 'nucleo', 'habitos'), 1);
  assert.equal(activeIndex(nu, 'nucleo', 'corpo'), 2);
  assert.deepEqual(crumb(nu, 0), { module: 'Núcleo', page: 'Mente' });
  const li = barFor('listas')!;
  assert.equal(activeIndex(li, 'listas', 'precos'), 2);
  assert.equal(activeIndex(li, 'listas', 'receitas'), 0);
});
