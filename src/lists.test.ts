import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize, seedCategories } from './data.ts';
import { addExpense } from './finance.ts';
import {
  ensureProduct, linkMarketItems, marketEstimate, matchKey, priceRange, productSuggestions, productsWithoutPrice, sizeOptions,
  addItemFromText, addListCategory, addPrice, bestPrice, deleteListCategory, finishShopping, kindOf, launchBought, listEstimate, newItem, newList, purchaseHistory,
  parseItemText, priceCheck, qtyText, scaledQty, sendIngredients, toggleItem, uncheckAll, updateListCategory,
} from './lists.ts';
import type { AppData, UserList } from './types.ts';

const TODAY = '2026-11-18';

/** Base de preços de exemplo: arroz (2 marcas, 5 kg), feijão 1 kg e leite 1 L em 2 mercados. */
function withPrices(): AppData {
  let d = seedCategories(emptyData());
  d = addPrice({ storeName: 'Atacadão', productName: 'Arroz branco', aisle: 'Mercearia', unit: 'kg', brand: 'Tio João', size: 5, sizeUnit: 'kg', price: 27.9, date: '2026-10-01' })(d);
  d = addPrice({ storeName: 'Atacadão', productName: 'Arroz branco', brand: 'Tio João', size: 5, sizeUnit: 'kg', price: 29.9, date: '2026-11-10' })(d);
  d = addPrice({ storeName: 'Assaí', productName: 'Arroz branco', brand: 'Tio João', size: 5, sizeUnit: 'kg', price: 26.5 })(d);
  d = addPrice({ storeName: 'Atacadão', productName: 'Arroz branco', brand: 'Camil', size: 5, sizeUnit: 'kg', price: 24.9 })(d);
  d = addPrice({ storeName: 'Atacadão', productName: 'Feijão carioca', aisle: 'Mercearia', unit: 'kg', brand: 'Kicaldo', size: 1, sizeUnit: 'kg', price: 8.49 })(d);
  d = addPrice({ storeName: 'Assaí', productName: 'Feijão carioca', brand: 'Kicaldo', size: 1, sizeUnit: 'kg', price: 8.99 })(d);
  d = addPrice({ storeName: 'assaí', productName: 'leite integral', aisle: 'Laticínios', unit: 'L', brand: 'Italac', size: 1, sizeUnit: 'L', price: 4.59 })(d);
  return d;
}

test('anotar preços cria mercado, produto e marca uma vez só (sem diferenciar maiúsculas e acentos)', () => {
  const d = withPrices();
  assert.deepEqual(d.stores.map((s) => s.name), ['Atacadão', 'Assaí']);
  assert.deepEqual(d.products.map((p) => p.name), ['Arroz branco', 'Feijão carioca', 'Leite integral'.replace('L', 'l')]);
  assert.equal(d.variants.length, 4);
  assert.equal(d.prices.length, 7);
});

test('menor preço por unidade usa o último preço de cada mercado', () => {
  const d = withPrices();
  const arroz = d.products[0].id;
  const b = bestPrice(d, arroz)!;
  assert.equal(b.variant.brand, 'Camil');
  assert.equal(Math.round(b.perUnit * 100) / 100, 4.98);
  // No Atacadão, o Tio João agora custa 29,90 (o 27,90 é antigo).
  const tio = d.variants.find((v) => v.brand === 'Tio João')!;
  const check = priceCheck(d, tio.id, 31.9)!;
  assert.equal(Math.round(check.diff * 100), 28);
  assert.equal(priceCheck(d, tio.id, 20)!.diff < 0, true);
});

test('lista de mercado: itens pelo texto, estimativa por mercado e concluir compra', () => {
  let d = withPrices();
  const mercado = d.listCategories.find((c) => c.kind === 'mercado')!;
  const l = newList('Mercado do mês', mercado.id);
  d = { ...d, lists: [l] };
  d = addItemFromText(l.id, 'arroz branco')(d);
  d = addItemFromText(l.id, '2 kg feijão carioca')(d);
  d = addItemFromText(l.id, '6 L leite integral')(d);
  d = addItemFromText(l.id, 'Tomate')(d);
  const items = d.lists[0].items;
  assert.equal(items[1].qty, 2);
  assert.equal(items[1].unit, 'kg');
  assert.equal(items[1].aisle, 'Mercearia');
  // M2: item sem preço também vira produto (o Tomate vem do catálogo pronto, já no Hortifrúti).
  assert.ok(items[3].productId);
  assert.equal(items[3].aisle, 'Hortifrúti');
  const est = listEstimate(d, d.lists[0]);
  // Assaí: arroz 26,50 + feijão 2 × 8,99 + leite 6 × 4,59 = 72,02 (só o tomate sem preço).
  // Atacadão: arroz 24,90 + feijão 2 × 8,49 = 41,88 (leite e tomate sem preço).
  assert.deepEqual(est.map((e) => [d.stores.find((s) => s.id === e.storeId)!.name, e.total, e.missing]), [['Assaí', 72.02, 1], ['Atacadão', 41.88, 2]]);
  d = toggleItem(l.id, items[0].id)(d);
  const food = d.categories.find((c) => c.name === 'Alimentação')!.id;
  d = finishShopping(l.id, { total: 71.5, storeName: 'Assaí', categoryId: food, reset: true }, TODAY)(d);
  assert.equal(d.expenses.length, 1);
  assert.equal(d.expenses[0].amount, 71.5);
  assert.equal(d.expenses[0].paidAt, TODAY);
  assert.equal(d.expenses[0].description, 'Mercado · Assaí');
  assert.equal(d.lists[0].items.every((i) => !i.done), true);
  // Fica no histórico de compras (Listas › Compras).
  assert.deepEqual(purchaseHistory(d).map((r) => [r.date, r.store, r.total, r.items]), [[TODAY, 'Assaí', 71.5, 1]]);
});

test('lista de compras: lançar os comprados uma vez só', () => {
  let d = seedCategories(emptyData());
  const roupas = d.listCategories.find((c) => c.name === 'Roupas')!;
  const l: UserList = { ...newList('Inverno', roupas.id), items: [newItem({ text: 'Jaqueta', price: 249.9 }), newItem({ text: 'Bota', price: 320 }), newItem({ text: 'Cachecol', price: null })] };
  d = { ...d, lists: [l] };
  assert.equal(kindOf(d, l), 'compras');
  for (const it of l.items) d = toggleItem(l.id, it.id)(d);
  const comp = d.categories.find((c) => c.name === 'Compras')!.id;
  d = launchBought(l.id, comp, TODAY)(d);
  d = launchBought(l.id, comp, TODAY)(d);
  assert.deepEqual(d.expenses.map((e) => e.amount), [249.9, 320]);
  // Uma compra só no histórico, com o total dos itens lançados.
  assert.deepEqual(d.purchases.map((p) => [p.listName, p.total, p.items]), [['Inverno', 569.9, 2]]);
  assert.deepEqual(d.lists[0].items.map((i) => i.launched), [true, true, false]);
  d = uncheckAll(l.id)(d);
  assert.equal(d.lists[0].items.some((i) => i.launched || i.done), false);
});

test('receita: porções arredondadas e ingredientes para a lista de mercado', () => {
  let d = withPrices();
  const rec: UserList = { ...newList('Bolo', 'lc-receitas'), serves: 10, baseServes: 8, items: [newItem({ text: 'Ovos', qty: 4, unit: 'un' }), newItem({ text: 'Óleo', qty: 1, unit: 'xícara' }), newItem({ text: 'Feijão carioca', qty: 1, unit: 'kg' })] };
  const shop = newList('Mercado', 'lc-mercado');
  d = { ...d, lists: [rec, shop] };
  assert.equal(scaledQty(3, 'un', 10 / 8), 4);
  assert.equal(scaledQty(1, 'xícara', 10 / 8), 1.5);
  assert.equal(qtyText(1.5), '1 ½');
  assert.equal(qtyText(0.5), '½');
  d = sendIngredients(rec.id, shop.id, [rec.items[0].id, rec.items[2].id])(d);
  const got = d.lists[1].items;
  assert.deepEqual(got.map((i) => [i.text, i.qty, i.aisle]), [['Ovos', 5, 'Hortifrúti'], ['Feijão carioca', 1.5, 'Mercearia']]);
  assert.ok(got[1].productId);
});

test('categorias: criar, não mudar o jeito com listas dentro, não excluir com listas', () => {
  let d = seedCategories(emptyData());
  assert.equal(d.listCategories.length, 5);
  d = addListCategory({ name: 'Presentes', icon: 'gift', color: '#22c55e', kind: 'compras' })(d);
  const pres = d.listCategories[5];
  d = { ...d, lists: [newList('Natal', pres.id)] };
  d = updateListCategory(pres.id, { name: 'Presentes de Natal', kind: 'checklist' })(d);
  assert.equal(d.listCategories[5].name, 'Presentes de Natal');
  assert.equal(d.listCategories[5].kind, 'compras');
  d = deleteListCategory(pres.id)(d);
  assert.equal(d.listCategories.length, 6);
  d = deleteListCategory('lc-viagem')(d);
  assert.equal(d.listCategories.length, 5);
});

test('texto do item e backup', () => {
  assert.deepEqual(parseItemText('2 kg tomate'), { qty: 2, unit: 'kg', text: 'Tomate' });
  assert.deepEqual(parseItemText('1,5 l suco'), { qty: 1.5, unit: 'L', text: 'Suco' });
  assert.deepEqual(parseItemText('3 bananas'), { qty: 3, unit: 'un', text: 'Bananas' });
  assert.deepEqual(parseItemText('pão'), { qty: null, unit: '', text: 'Pão' });
  let d = withPrices();
  d = { ...d, lists: [{ ...newList('X', 'lc-mercado'), items: [newItem({ text: 'Arroz', qty: 1, unit: 'un', productId: d.products[0].id })] }] };
  const back = normalize(JSON.parse(JSON.stringify(d)));
  assert.equal(back.lists[0].items[0].productId, d.products[0].id);
  assert.equal(back.prices.length, 7);
  assert.equal(back.listCategories.length, 5);
  // Backup antigo (sem listas): ganha as categorias padrão.
  assert.equal(normalize({ version: 2 }).listCategories.length, 5);
});

test('compras: as de antes do histórico vêm das despesas de mercado; backup guarda', () => {
  let d = seedCategories(emptyData());
  const food = d.categories.find((c) => c.name === 'Alimentação')!.id;
  d = addExpense(d, { kind: 'avulsa', description: 'Mercado · Atacadão', categoryId: food, method: 'pix', cardId: null, date: '2026-10-02', amounts: [210], paidAt: '2026-10-02' }, '2026-10-02');
  d = addExpense(d, { kind: 'avulsa', description: 'Padaria', categoryId: food, method: 'pix', cardId: null, date: '2026-10-03', amounts: [12], paidAt: '2026-10-03' }, '2026-10-03');
  d = { ...d, purchases: [{ id: 'p1', date: '2026-11-10', listId: 'x', listName: 'Mercado do mês', store: 'Assaí', total: 380, items: 22 }] };
  const h = purchaseHistory(d);
  assert.deepEqual(h.map((r) => [r.date, r.title, r.store, r.items]), [['2026-11-10', 'Mercado do mês', 'Assaí', 22], ['2026-10-02', 'Compra de mercado', 'Atacadão', null]]);
  const back = normalize(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(back.purchases, d.purchases);
  assert.deepEqual(normalize({ version: 2, purchases: [{ id: 1 }, 'lixo'] }).purchases, []);
});

test('M2: busca sem acento e sem plural, sugestões com os seus produtos e o catálogo', () => {
  const d = withPrices();
  assert.equal(matchKey('Bananas'), matchKey('banana'));
  assert.equal(matchKey('Limões'), matchKey('limão'));
  const s = productSuggestions(d, 'arr');
  assert.equal(s[0].name, 'Arroz branco');
  assert.ok(s[0].productId);
  assert.ok(s.some((x) => x.name === 'Arroz integral' && x.productId === null));
  assert.equal(productSuggestions(d, 'bananas')[0].name, 'Banana');
  const r = priceRange(d, s[0].productId!)!;
  assert.deepEqual([r.min, r.max].map((n) => Math.round(n * 100) / 100), [4.98, 5.3]);
});

test('M2: itens antigos da lista ganham produto na primeira abertura, sem duplicar', () => {
  let d = withPrices();
  const items = [newItem({ text: 'bananas', aisle: 'Outros' }), newItem({ text: 'Arroz Branco' }), newItem({ text: 'Pão caseiro da vó', unit: 'kg' })];
  d = { ...d, lists: [{ ...newList('Mercado', 'lc-mercado'), items }, { ...newList('Viagem', 'lc-viagem'), items: [newItem({ text: 'Mala' })] }] };
  const n = d.products.length;
  d = linkMarketItems(d);
  const got = d.lists[0].items;
  assert.equal(d.products.length, n + 2);
  assert.equal(d.products.find((p) => p.id === got[0].productId)!.name, 'Banana');
  assert.equal(got[0].aisle, 'Hortifrúti');
  assert.equal(got[1].productId, d.products.find((p) => p.name === 'Arroz branco')!.id);
  assert.equal(d.products.find((p) => p.id === got[2].productId)!.unit, 'kg');
  assert.equal(d.lists[1].items[0].productId, null);
  assert.equal(linkMarketItems(d), d);
  // Outro aparelho cria o mesmo id.
  assert.equal(ensureProduct(withPrices(), 'Bananas').product.id, got[0].productId);
});

test('M2: estimativa por loja com faixa dos itens que faltam, melhor combinação e sem preço', () => {
  let d = withPrices();
  const l = newList('Mercado', 'lc-mercado');
  d = { ...d, lists: [l] };
  for (const t of ['arroz branco', '2 kg feijão carioca', '6 L leite integral', 'Tomate']) d = addItemFromText(l.id, t)(d);
  const e = marketEstimate(d, d.lists[0]);
  const name = (id: string) => d.stores.find((s) => s.id === id)!.name;
  // Atacadão: arroz 24,90 + feijão 16,98 = 41,88; o leite (só no Assaí) estimado em 27,54.
  assert.deepEqual(e.stores.map((s) => [name(s.storeId), s.total, s.missing, s.estMin, s.estMax]), [['Atacadão', 41.88, 1, 27.54, 27.54], ['Assaí', 72.02, 0, 0, 0]]);
  assert.equal(e.combo, 69.42);
  assert.equal(e.savings, 0);
  assert.deepEqual(e.unpriced.map((i) => i.text), ['Tomate']);
  // "Sem preço": tomate em geral; no Atacadão, leite e tomate.
  assert.deepEqual(productsWithoutPrice(d).map((p) => p.name), ['Tomate']);
  const ata = d.stores.find((s) => s.name === 'Atacadão')!.id;
  assert.deepEqual(productsWithoutPrice(d, { storeId: ata }).map((p) => p.name), ['leite integral', 'Tomate']);
  const tomate = d.products.find((p) => p.name === 'Tomate')!;
  assert.deepEqual(sizeOptions(d, tomate), [{ size: 1, sizeUnit: 'kg' }]);
  const arroz = d.products.find((p) => p.name === 'Arroz branco')!;
  assert.deepEqual(sizeOptions(d, arroz), [{ size: 5, sizeUnit: 'kg' }, { size: 1, sizeUnit: 'kg' }]);
});

test('M2: backup antigo passa pelo normalize e já liga os itens do mercado', () => {
  const d = normalize({ lists: [{ id: 'l1', name: 'Mercado', categoryId: 'lc-mercado', items: [{ id: 'i1', text: 'Detergente' }] }] });
  const it = d.lists[0].items[0];
  assert.equal(d.products.find((p) => p.id === it.productId)?.aisle, 'Limpeza');
  assert.equal(it.aisle, 'Limpeza');
});

test('M23: nome genérico aproveita o parecido do catálogo, com o nome da pessoa', () => {
  const d = withPrices();
  const { product } = ensureProduct(d, 'Café');
  assert.deepEqual([product.name, product.aisle, product.unit], ['Café', 'Mercearia', 'kg']);
  assert.deepEqual(sizeOptions(d, product), [{ size: 250, sizeUnit: 'g' }, { size: 500, sizeUnit: 'g' }]);
  assert.equal(ensureProduct(d, 'Xampu artesanal').product.aisle, 'Outros');
});
