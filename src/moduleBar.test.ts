import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeIndex, addFavorite, barItems, barFor, crumb, DEFAULT_FAVORITES, favoriteItems, MODULE_BARS, normalizeFavorites } from './moduleBar.ts';

test('favoritos: sempre 4, válidos e sem repetir (quem tinha 3 ganha o 4º)', () => {
  assert.deepEqual(normalizeFavorites(undefined), DEFAULT_FAVORITES);
  assert.deepEqual(normalizeFavorites(['listas', 'listas', 'xyz']), ['listas', 'financas', 'diario', 'agenda']);
  assert.deepEqual(normalizeFavorites(['financas', 'diario', 'agenda']), ['financas', 'diario', 'agenda', 'listas']);
  assert.deepEqual(normalizeFavorites(['nucleo', 'listas', 'voce', 'jornada', 'diario']), ['nucleo', 'listas', 'voce', 'jornada']);
  assert.deepEqual(normalizeFavorites('lixo'), DEFAULT_FAVORITES);
});

test('marcar favorito: entra no fim e o mais antigo sai', () => {
  const r = addFavorite(['financas', 'diario', 'agenda', 'listas'], 'nucleo');
  assert.deepEqual(r.favorites, ['diario', 'agenda', 'listas', 'nucleo']);
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
  assert.equal(activeIndex(fin, 'financas'), 1);
  assert.equal(activeIndex(fin, 'orcamento'), 0);
  assert.deepEqual(crumb(fin, 0), { module: 'Finanças', page: 'Orçamento' });
  assert.deepEqual(crumb(fin, 1), { module: 'Finanças', page: null });
  const ag = barFor('proximos')!;
  assert.equal(ag.id, 'agenda');
  assert.equal(activeIndex(ag, 'agenda'), 1);
  assert.equal(activeIndex(ag, 'proximos'), 2);
  const nu = barFor('progresso')!;
  assert.equal(nu.id, 'nucleo');
  assert.deepEqual(crumb(nu, activeIndex(nu, 'historico')), { module: 'Núcleo', page: 'Histórico' });
  const li = barFor('precos')!;
  assert.equal(li.id, 'listas');
  assert.equal(activeIndex(li, 'compras'), 0);
});

test('regra: cada item da barra é uma tela diferente, e nenhuma tela se repete entre módulos', () => {
  for (const b of MODULE_BARS) {
    const secs = b.items.map((i) => i.section).filter(Boolean);
    assert.equal(new Set(secs).size, secs.length, b.id);
    assert.equal(b.items[1].section, b.id === 'agenda' ? 'agenda' : b.items[1].id, `${b.id}: casa no centro`);
    for (const s of secs) assert.ok(b.sections.includes(s!), `${b.id}: ${s} fora do módulo`);
  }
});

test('E21: dentro do módulo, a casa fica sempre no centro (o jeito antigo da barra é ignorado)', () => {
  const favs = ['financas', 'diario', 'agenda', 'listas'];
  const ids = (x: { items: { id: string }[]; home: number }) => [x.items.map((i) => i.id), x.home];
  assert.deepEqual(ids(barItems(barFor('financas')!, favs)), [['orcamento', 'financas', 'relatorios'], 1]);
  assert.deepEqual(ids(barItems(barFor('relatorios')!, favs, 'fixo')), [['orcamento', 'financas', 'relatorios'], 1]);
  assert.deepEqual(ids(barItems(barFor('agenda')!, favs, 'lado')), [['hoje', 'agenda', 'proximos'], 1]);
  assert.deepEqual(ids(barItems(barFor('listas')!, favs)), [['compras', 'listas', 'precos'], 1]);
});
