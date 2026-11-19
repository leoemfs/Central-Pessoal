/**
 * Listas (por categoria) e Preços.
 * Cada categoria escolhe como as listas dela funcionam: mercado (corredores + preços), compras (valor por item),
 * receita (ingredientes, porções e preparo) ou checklist.
 */
import type { AppData, ListCategory, ListItem, ListKind, PriceEntry, Product, ProductVariant, Purchase, Store, UserList } from './types.ts';
import { addExpense } from './finance.ts';
import { CATALOG, type CatalogProduct } from './precosCatalogo.ts';
import { todayISO, uid } from './utils.ts';

export const LIST_KINDS: Record<ListKind, { label: string; hint: string }> = {
  mercado: { label: 'Mercado', hint: 'Itens por corredor, com os preços dos mercados' },
  compras: { label: 'Compras', hint: 'Valor de cada item, total e lançar em Finanças' },
  receita: { label: 'Receita', hint: 'Ingredientes, porções e modo de preparo' },
  checklist: { label: 'Checklist', hint: 'Só marcar o que já foi' },
};

export const DEFAULT_LIST_CATEGORIES: ListCategory[] = [
  { id: 'lc-mercado', name: 'Mercado', icon: 'cart', color: '#f97316', kind: 'mercado' },
  { id: 'lc-receitas', name: 'Cozinha', icon: 'pot', color: '#8b5cf6', kind: 'receita' },
  { id: 'lc-roupas', name: 'Roupas', icon: 'shirt', color: '#ec4899', kind: 'compras' },
  { id: 'lc-casa', name: 'Casa', icon: 'home', color: '#3b82f6', kind: 'compras' },
  { id: 'lc-viagem', name: 'Viagem', icon: 'plane', color: '#06b6d4', kind: 'checklist' },
];
export const LIST_ICONS = ['cart', 'pot', 'shirt', 'home', 'plane', 'gift', 'bag', 'book', 'heart', 'paw', 'tasks', 'tag'];
export const LIST_COLORS = ['#f97316', '#8b5cf6', '#ec4899', '#3b82f6', '#06b6d4', '#22c55e', '#eab308', '#ef4444'];
export const AISLES = ['Hortifrúti', 'Mercearia', 'Carnes', 'Laticínios', 'Padaria', 'Bebidas', 'Limpeza', 'Higiene', 'Congelados', 'Pet', 'Outros'];

type Rec = Record<string, unknown>;
/** M4: categoria padrão de Preços (dados antigos eram só de mercado). */
export const MARKET_CAT = 'lc-mercado';
const SIZE_UNITS = ['g', 'kg', 'ml', 'L', 'un'] as const;
function normPack(x: unknown): ListItem['pack'] {
  if (typeof x !== 'object' || x === null) return null;
  const p = x as Rec;
  return typeof p.size === 'number' && p.size > 0 && SIZE_UNITS.includes(p.sizeUnit as 'g') ? { size: p.size, sizeUnit: p.sizeUnit as ProductVariant['sizeUnit'] } : null;
}
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown, def = '') => (typeof x === 'string' ? x : def);
const numOrNull = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const recs = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is Rec => isRec(i) && typeof i.id === 'string') : []);
const KINDS = Object.keys(LIST_KINDS) as ListKind[];

export function normalizeListData(r: Rec) {
  const listCategories: ListCategory[] = Array.isArray(r.listCategories)
    ? recs(r.listCategories).map((c) => ({ id: c.id as string, name: c.id === 'lc-receitas' && c.name === 'Receitas' ? 'Cozinha' : str(c.name, 'Lista'), icon: str(c.icon, 'tasks'), color: str(c.color, '#94a3b8'), kind: KINDS.includes(c.kind as ListKind) ? (c.kind as ListKind) : 'checklist' }))
    : DEFAULT_LIST_CATEGORIES.map((c) => ({ ...c }));
  const item = (i: Rec): ListItem => ({
    id: i.id as string, text: str(i.text, 'Item'), qty: numOrNull(i.qty), unit: str(i.unit), aisle: str(i.aisle), productId: typeof i.productId === 'string' ? i.productId : null,
    price: numOrNull(i.price), store: str(i.store), paid: numOrNull(i.paid), pack: normPack(i.pack), done: i.done === true, launched: i.launched === true,
  });
  const lists: UserList[] = recs(r.lists).map((l) => ({
    id: l.id as string, name: str(l.name, 'Lista'), categoryId: str(l.categoryId, listCategories[0]?.id ?? ''), pinned: l.pinned === true,
    items: recs(l.items).map(item), serves: numOrNull(l.serves) ?? 4, baseServes: numOrNull(l.baseServes) ?? 4, minutes: numOrNull(l.minutes),
    tags: Array.isArray(l.tags) ? l.tags.filter((t): t is string => typeof t === 'string') : [], steps: Array.isArray(l.steps) ? l.steps.filter((t): t is string => typeof t === 'string') : [],
    createdAt: str(l.createdAt, new Date().toISOString()),
  }));
  const products: Product[] = recs(r.products).map((p) => ({ id: p.id as string, name: str(p.name, 'Produto'), aisle: str(p.aisle, 'Outros'), unit: p.unit === 'L' || p.unit === 'un' ? p.unit : 'kg', categoryId: str(p.categoryId, MARKET_CAT) }));
  const variants: ProductVariant[] = recs(r.variants).filter((v) => typeof v.productId === 'string').map((v) => ({ id: v.id as string, productId: v.productId as string, brand: str(v.brand), size: numOrNull(v.size) ?? 1, sizeUnit: (['g', 'kg', 'ml', 'L', 'un'] as const).includes(v.sizeUnit as 'g') ? (v.sizeUnit as ProductVariant['sizeUnit']) : 'un' }));
  const stores: Store[] = recs(r.stores).map((s) => ({ id: s.id as string, name: str(s.name, 'Mercado'), categoryId: str(s.categoryId, MARKET_CAT) }));
  const prices: PriceEntry[] = recs(r.prices).filter((p) => typeof p.variantId === 'string' && typeof p.storeId === 'string' && (numOrNull(p.price) ?? 0) > 0).map((p) => ({ id: p.id as string, variantId: p.variantId as string, storeId: p.storeId as string, price: p.price as number, date: str(p.date, todayISO()), promo: p.promo === true }));
  return { listCategories, lists, products, variants, stores, prices };
}

export const categoryOf = (d: Pick<AppData, 'listCategories'>, l: UserList): ListCategory | undefined => d.listCategories.find((c) => c.id === l.categoryId);
export const kindOf = (d: Pick<AppData, 'listCategories'>, l: UserList): ListKind => categoryOf(d, l)?.kind ?? 'checklist';

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// ---------- Preços ----------

/** Quanto da unidade de comparação tem na embalagem (500 g = 0,5 kg; 12 rolos = 12 un). */
export function unitFactor(v: ProductVariant): number {
  return v.sizeUnit === 'g' || v.sizeUnit === 'ml' ? v.size / 1000 : v.size;
}
export const perUnit = (v: ProductVariant, price: number) => price / (unitFactor(v) || 1);
export const sizeText = (v: ProductVariant) => `${v.size.toLocaleString('pt-BR')} ${v.sizeUnit}`;
export const variantLabel = (v: ProductVariant) => [v.brand, sizeText(v)].filter(Boolean).join(' ');

/** Último preço de cada marca/tamanho em cada mercado. */
export function latestPrices(d: Pick<AppData, 'prices'>): Map<string, PriceEntry> {
  const m = new Map<string, PriceEntry>();
  for (const p of d.prices) {
    const k = `${p.variantId}|${p.storeId}`;
    const cur = m.get(k);
    if (!cur || p.date >= cur.date) m.set(k, p);
  }
  return m;
}

export interface BestPrice {
  variant: ProductVariant;
  storeId: string;
  price: number;
  perUnit: number;
  date: string;
}

/** Menor preço por unidade de um produto (opcionalmente só num mercado), entre os últimos preços anotados. */
export function bestPrice(d: Pick<AppData, 'prices' | 'variants'>, productId: string, storeId?: string, latest = latestPrices(d), pack?: ListItem['pack']): BestPrice | null {
  let best: BestPrice | null = null;
  for (const v of d.variants.filter((x) => x.productId === productId && (!pack || (x.size === pack.size && x.sizeUnit === pack.sizeUnit)))) {
    for (const p of latest.values()) {
      if (p.variantId !== v.id || (storeId && p.storeId !== storeId)) continue;
      const u = perUnit(v, p.price);
      if (!best || u < best.perUnit) best = { variant: v, storeId: p.storeId, price: p.price, perUnit: u, date: p.date };
    }
  }
  return best;
}

/** O preço digitado comparado ao menor já anotado do produto (para avisar "28% acima"). */
export function priceCheck(d: Pick<AppData, 'prices' | 'variants'>, variantId: string, price: number) {
  const v = d.variants.find((x) => x.id === variantId);
  if (!v || !(price > 0)) return null;
  const best = bestPrice(d, v.productId);
  const u = perUnit(v, price);
  if (!best) return { perUnit: u, best: null, diff: 0 };
  return { perUnit: u, best, diff: u / best.perUnit - 1 };
}

/** Quanto a lista de mercado sai em cada mercado (itens sem preço naquele mercado ficam de fora e são contados). */
export function listEstimate(d: Pick<AppData, 'prices' | 'variants' | 'stores' | 'products'>, l: UserList, onlyDone = false) {
  const latest = latestPrices(d);
  return d.stores
    .map((s) => {
      let total = 0;
      let missing = 0;
      for (const it of l.items) {
        if (onlyDone && !it.done) continue;
        const b = it.productId ? bestPrice(d, it.productId, s.id, latest, it.pack) : null;
        if (b) total += itemCost(it, b, d.products.find((x) => x.id === it.productId));
        else missing++;
      }
      return { storeId: s.id, total: Math.round(total * 100) / 100, missing };
    })
    .filter((e) => e.total > 0)
    .sort((a, b) => a.missing - b.missing || a.total - b.total);
}

/**
 * Custo de um item com o melhor preço do mercado: por peso/volume ("2 kg", "6 L", "500 g") usa o preço por unidade;
 * por embalagem ("2 un", "1 pacote", sem quantidade) usa o preço da embalagem.
 */
export function itemCost(it: Pick<ListItem, 'qty' | 'unit'> & { pack?: ListItem['pack'] }, b: BestPrice, product?: Product): number {
  const q = it.qty && it.qty > 0 ? it.qty : 1;
  const u = it.unit.toLowerCase();
  const amount = u === 'g' || u === 'ml' ? q / 1000 : q;
  const measured = (u === 'kg' || u === 'g') && product?.unit === 'kg' ? true : (u === 'l' || u === 'ml') && product?.unit === 'L';
  // M41: com embalagem escolhida, a conta é por pacote ("2 kg" em pacote de 1 kg = 2 pacotes; arredonda para cima).
  if (it.pack && measured) return b.price * Math.max(1, Math.ceil(amount / (unitFactor(b.variant) || 1) - 1e-9));
  return measured ? b.perUnit * amount : b.price * q;
}

/** Chave de busca: sem acento, sem maiúscula e sem plural ("Bananas" = "banana", "limões" = "limão"). */
export function matchKey(s: string): string {
  return plain(s)
    .split(/\s+/)
    .map((w) => (w.length > 3 ? w.replace(/(oe|ae)s$/, 'ao').replace(/s$/, '') : w))
    .join(' ');
}

export function findProduct(d: Pick<AppData, 'products'>, text: string): Product | undefined {
  const t = matchKey(text);
  return t ? d.products.find((p) => matchKey(p.name) === t) : undefined;
}

export const findCatalog = (text: string): CatalogProduct | undefined => {
  const t = matchKey(text);
  return CATALOG.find((c) => matchKey(c.name) === t);
};

/** Catálogo para um nome genérico: o igual ou, se não houver, o primeiro que começa com ele ("Arroz" → Arroz branco). */
export const catalogFor = (text: string): CatalogProduct | undefined => {
  const t = matchKey(text);
  return t ? (findCatalog(text) ?? CATALOG.find((c) => matchKey(c.name).startsWith(`${t} `))) : undefined;
};

/** Id fixo pelo nome, para dois aparelhos criarem o mesmo produto sem duplicar. */
export const productIdFor = (name: string) => `prod-${matchKey(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

/**
 * Garante um produto de Preços para o nome do item: o já cadastrado, o do catálogo pronto ou um novo
 * (unidade pelo jeito do item: kg/g → R$/kg; L/ml → R$/L; o resto → R$/un).
 */
export function ensureProduct<T extends Pick<AppData, 'products'>>(d: T, name: string, unitHint = ''): { data: T; product: Product } {
  const own = findProduct(d, name);
  if (own) return { data: d, product: own };
  const exact = findCatalog(name);
  const cat = exact ?? catalogFor(name);
  const u = unitHint.toLowerCase();
  const product: Product = cat
    ? { id: productIdFor(exact ? cat.name : name), name: exact ? cat.name : name.trim(), aisle: cat.aisle, unit: cat.unit, categoryId: MARKET_CAT }
    : { id: productIdFor(name), name: name.trim(), aisle: 'Outros', unit: u === 'kg' || u === 'g' ? 'kg' : u === 'l' || u === 'ml' ? 'L' : 'un', categoryId: MARKET_CAT };
  const clash = d.products.find((p) => p.id === product.id);
  if (clash) return { data: d, product: clash };
  return { data: { ...d, products: [...d.products, product] }, product };
}

/**
 * M43 (E6): produto de Preços para um item de lista de compras (Roupas, Casa…), na categoria da lista.
 * Usa o produto da mesma categoria com o mesmo nome; senão cria um (sem catálogo de mercado).
 */
export function ensureCategoryProduct<T extends Pick<AppData, 'products'>>(d: T, name: string, categoryId: string): { data: T; product: Product } {
  if (categoryId === MARKET_CAT) return ensureProduct(d, name);
  const own = findProduct({ products: d.products.filter((p) => p.categoryId === categoryId) }, name);
  if (own) return { data: d, product: own };
  const id = `${productIdFor(name)}--${categoryId}`;
  const clash = d.products.find((p) => p.id === id);
  if (clash) return { data: d, product: clash };
  const product: Product = { id, name: name.trim(), aisle: 'Outros', unit: 'un', categoryId };
  return { data: { ...d, products: [...d.products, product] }, product };
}

/** M43 (E6): o menor preço anotado de um produto (qualquer loja), com o nome da loja. */
export function cheapest(d: Pick<AppData, 'prices' | 'variants' | 'stores'>, productId: string): { price: number; store: string } | null {
  const b = bestPrice(d, productId);
  if (!b) return null;
  return { price: b.price, store: d.stores.find((s) => s.id === b.storeId)?.name ?? '' };
}

/**
 * M43 (E6): item novo numa lista de compras: já vira produto em Preços (na categoria da lista).
 * Sem valor digitado, usa o menor preço anotado (e a loja dele).
 */
export function addShopItem(listId: string, text: string, price: number | null) {
  return (d: AppData): AppData => {
    const l = d.lists.find((x) => x.id === listId);
    if (!l || !text.trim()) return d;
    const name = text.trim().charAt(0).toUpperCase() + text.trim().slice(1);
    const r = ensureCategoryProduct(d, name, l.categoryId);
    const best = price === null ? cheapest(r.data, r.product.id) : null;
    const item = newItem({ text: name, productId: r.product.id, price: price ?? best?.price ?? null, store: best?.store ?? '' });
    return patchList(listId, (x) => ({ ...x, items: [...x.items, item] }))(r.data);
  };
}

/** E6: despesa criada a partir de uma lista; devolve o id para a compra apontar para ela. */
function addListExpense(d: AppData, input: Parameters<typeof addExpense>[1], listId: string, today: string): { data: AppData; id: string | null } {
  const before = d.expenses.length;
  const next = addExpense(d, input, today);
  const e = next.expenses[next.expenses.length - 1];
  if (next.expenses.length === before || !e) return { data: next, id: null };
  return { data: { ...next, expenses: next.expenses.map((x) => (x.id === e.id ? { ...x, listId } : x)) }, id: e.id };
}

/**
 * M2: todo item das listas de mercado fica ligado a um produto de Preços (os antigos, na primeira abertura).
 * Item que estava em "Outros" passa para o corredor do produto.
 */
export function linkMarketItems<T extends Pick<AppData, 'products' | 'lists' | 'listCategories'>>(d: T): T {
  const market = new Set(d.listCategories.filter((c) => c.kind === 'mercado').map((c) => c.id));
  const shop = new Set(d.listCategories.filter((c) => c.kind === 'compras').map((c) => c.id));
  let next = d;
  let changed = false;
  const lists = d.lists.map((l) => {
    if (!market.has(l.categoryId) && !shop.has(l.categoryId)) return l;
    const isShop = shop.has(l.categoryId);
    let touched = false;
    const items = l.items.map((it) => {
      if (it.productId && next.products.some((p) => p.id === it.productId)) return it;
      touched = true;
      if (isShop) {
        const r = ensureCategoryProduct(next, it.text, l.categoryId);
        next = r.data;
        return { ...it, productId: r.product.id };
      }
      const r = ensureProduct(next, it.text, it.unit);
      next = r.data;
      return { ...it, productId: r.product.id, aisle: !it.aisle || it.aisle === 'Outros' ? r.product.aisle : it.aisle };
    });
    if (!touched) return l;
    changed = true;
    return { ...l, items };
  });
  return changed ? { ...next, lists } : d;
}

/** Sugestões ao digitar na lista: os seus produtos primeiro, depois o catálogo pronto. */
export function productSuggestions(d: Pick<AppData, 'products'>, query: string, max = 6, withCatalog = true): { name: string; aisle: string; productId: string | null }[] {
  const q = matchKey(query);
  if (q.length < 2) return [];
  const hit = (name: string) => {
    const k = matchKey(name);
    return k.startsWith(q) || k.includes(` ${q}`);
  };
  const own = d.products.filter((p) => hit(p.name)).map((p) => ({ name: p.name, aisle: p.aisle, productId: p.id as string | null }));
  const keys = new Set(d.products.map((p) => matchKey(p.name)));
  const cat = (withCatalog ? CATALOG : []).filter((c) => hit(c.name) && !keys.has(matchKey(c.name))).map((c) => ({ name: c.name, aisle: c.aisle, productId: null }));
  const exact = (n: string) => Number(matchKey(n) !== q);
  return [...own.sort((a, b) => exact(a.name) - exact(b.name)), ...cat.sort((a, b) => exact(a.name) - exact(b.name))].slice(0, max);
}

/** Faixa do preço por unidade (R$/kg, R$/L, R$/un) entre as lojas: o melhor de cada loja. */
export function priceRange(d: Pick<AppData, 'prices' | 'variants' | 'stores'>, productId: string, latest = latestPrices(d)): { min: number; max: number } | null {
  let r: { min: number; max: number } | null = null;
  for (const s of d.stores) {
    const b = bestPrice(d, productId, s.id, latest);
    if (!b) continue;
    r = r ? { min: Math.min(r.min, b.perUnit), max: Math.max(r.max, b.perUnit) } : { min: b.perUnit, max: b.perUnit };
  }
  return r;
}

/** Tamanhos para escolher ao dar preço: os já anotados do produto e os comuns do catálogo. */
export function sizeOptions(d: Pick<AppData, 'variants'>, p: Product): { size: number; sizeUnit: ProductVariant['sizeUnit'] }[] {
  const out: { size: number; sizeUnit: ProductVariant['sizeUnit'] }[] = [];
  const add = (x: { size: number; sizeUnit: ProductVariant['sizeUnit'] }) => {
    if (!out.some((o) => o.size === x.size && o.sizeUnit === x.sizeUnit)) out.push({ size: x.size, sizeUnit: x.sizeUnit });
  };
  d.variants.filter((v) => v.productId === p.id).forEach(add);
  catalogFor(p.name)?.sizes.forEach(add);
  // M41: sempre dá para anotar o preço do quilo (ou do litro), como na carne e nos frios.
  add({ size: 1, sizeUnit: p.unit });
  return out;
}

/**
 * M2: produtos das listas de mercado ainda sem preço (em nenhuma loja, ou só na loja indicada),
 * na ordem em que aparecem nas listas. Itens já comprados ficam de fora.
 */
export function productsWithoutPrice(d: Pick<AppData, 'lists' | 'listCategories' | 'products' | 'prices' | 'variants'>, o: { listId?: string; storeId?: string } = {}): Product[] {
  const market = new Set(d.listCategories.filter((c) => c.kind === 'mercado').map((c) => c.id));
  const latest = latestPrices(d);
  const out: Product[] = [];
  for (const l of d.lists) {
    if (!market.has(l.categoryId) || (o.listId && l.id !== o.listId)) continue;
    for (const it of l.items) {
      if (it.done || !it.productId || out.some((p) => p.id === it.productId)) continue;
      const p = d.products.find((x) => x.id === it.productId);
      if (p && !bestPrice(d, p.id, o.storeId, latest)) out.push(p);
    }
  }
  return out;
}

/** M24: o catálogo pronto por corredor (na ordem dos corredores), filtrado pela busca. */
export function catalogByAisle(query = ''): { aisle: string; names: string[] }[] {
  const q = matchKey(query);
  const hit = (n: string) => !q || matchKey(n).startsWith(q) || matchKey(n).includes(` ${q}`);
  return AISLES.map((aisle) => ({ aisle, names: CATALOG.filter((c) => c.aisle === aisle && hit(c.name)).map((c) => c.name) })).filter((g) => g.names.length > 0);
}

/** M24: cria a lista já com os itens escolhidos (cada um ligado ao produto de Preços). */
export function createListWithItems(l: UserList, names: string[]) {
  return (d: AppData): AppData => names.reduce((acc, n) => addItemFromText(l.id, n)(acc), { ...d, lists: [...d.lists, l] });
}

export interface StoreQuote {
  storeId: string;
  /** Soma dos itens com preço nesta loja. */
  total: number;
  /** Itens sem preço aqui, mas com preço em outras lojas, e a faixa deles. */
  missing: number;
  estMin: number;
  estMax: number;
}

/**
 * M2: "Quanto vai sair" sem prender a lista a uma loja. Cada loja soma os itens com preço ali e estima os que
 * faltam pela faixa das outras lojas. Também a melhor combinação (cada item onde é mais barato) e os itens sem preço.
 */
export function marketEstimate(d: Pick<AppData, 'prices' | 'variants' | 'stores' | 'products'>, l: UserList) {
  const latest = latestPrices(d);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const quotes = l.items.map((it) => {
      const prod = d.products.find((x) => x.id === it.productId);
      const byStore = new Map<string, number>();
      if (it.productId) {
        for (const s of d.stores) {
          const b = bestPrice(d, it.productId, s.id, latest, it.pack);
          if (b) byStore.set(s.id, itemCost(it, b, prod));
        }
      }
      const costs = [...byStore.values()];
      return { item: it, byStore, min: costs.length ? Math.min(...costs) : 0, max: costs.length ? Math.max(...costs) : 0 };
    });
  const priced = quotes.filter((q) => q.byStore.size > 0);
  const stores: StoreQuote[] = d.stores
    .map((s) => {
      const e = { storeId: s.id, total: 0, missing: 0, estMin: 0, estMax: 0 };
      for (const q of priced) {
        const c = q.byStore.get(s.id);
        if (c !== undefined) e.total += c;
        else {
          e.missing++;
          e.estMin += q.min;
          e.estMax += q.max;
        }
      }
      return { ...e, total: r2(e.total), estMin: r2(e.estMin), estMax: r2(e.estMax) };
    })
    .filter((e) => e.missing < priced.length)
    .sort((a, b) => a.total + (a.estMin + a.estMax) / 2 - (b.total + (b.estMin + b.estMax) / 2));
  const combo = r2(priced.reduce((a, q) => a + q.min, 0));
  const best = stores[0];
  const savings = best ? r2(best.total + (best.estMin + best.estMax) / 2 - combo) : 0;
  return { stores, combo, savings, unpriced: quotes.filter((q) => q.byStore.size === 0).map((q) => q.item), quotes: new Map(quotes.map((q) => [q.item.id, q])) };
}

/** "2 kg tomate" → 2, kg, Tomate · "Leite" → sem quantidade. */
export function parseItemText(text: string): { qty: number | null; unit: string; text: string } {
  const m = text.trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|un|pct|pacotes?|cx|caixas?|dz|duzias?)?\s+(.+)$/i);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (!m) return { qty: null, unit: '', text: cap(text.trim()) };
  const unit = (m[2] ?? 'un').toLowerCase();
  return { qty: Number(m[1].replace(',', '.')), unit: unit === 'l' ? 'L' : unit, text: cap(m[3].trim()) };
}

/** Receita: quantidade nas porções escolhidas, arredondada (unidades inteiras; o resto em meias medidas). */
export function scaledQty(qty: number, unit: string, factor: number): number {
  const q = qty * factor;
  return unit === 'un' ? Math.max(1, Math.round(q)) : Math.max(0.5, Math.round(q * 2) / 2);
}
export function qtyText(q: number): string {
  const w = Math.floor(q);
  const half = q - w >= 0.5;
  return `${w || ''}${half ? (w ? ' ½' : '½') : ''}` || '0';
}

// ---------- Ações ----------

function patchList(id: string, fn: (l: UserList) => UserList) {
  return (d: AppData): AppData => ({ ...d, lists: d.lists.map((l) => (l.id === id ? fn(l) : l)) });
}

export function newList(name: string, categoryId: string): UserList {
  return { id: uid(), name: name.trim(), categoryId, pinned: false, items: [], serves: 4, baseServes: 4, minutes: null, tags: [], steps: [], createdAt: new Date().toISOString() };
}

export function newItem(p: Partial<ListItem> & { text: string }): ListItem {
  return { id: uid(), qty: null, unit: '', aisle: '', productId: null, price: null, store: '', paid: null, pack: null, done: false, launched: false, ...p };
}

/** Mercado: adiciona um item a partir do texto ("2 kg tomate"), já ligado a um produto de Preços (o seu, do catálogo ou novo) e ao corredor. */
export function addItemFromText(listId: string, text: string, extra: Partial<ListItem> = {}) {
  return (d: AppData): AppData => {
    const p = parseItemText(text);
    const { data, product } = ensureProduct(d, p.text, p.unit);
    return patchList(listId, (l) => ({ ...l, items: [...l.items, newItem({ text: p.text, qty: p.qty, unit: p.unit, productId: product.id, aisle: product.aisle, ...extra })] }))(data);
  };
}

export function updateItem(listId: string, itemId: string, patch: Partial<ListItem>) {
  return patchList(listId, (l) => ({ ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }));
}
export function removeItem(listId: string, itemId: string) {
  return patchList(listId, (l) => ({ ...l, items: l.items.filter((i) => i.id !== itemId) }));
}
export function toggleItem(listId: string, itemId: string) {
  return patchList(listId, (l) => ({ ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, done: !i.done, launched: i.done ? false : i.launched, paid: i.done ? null : i.paid } : i)) }));
}
export function uncheckAll(listId: string) {
  return patchList(listId, (l) => ({ ...l, items: l.items.map((i) => ({ ...i, done: false, launched: false, paid: null })) }));
}
export function updateList(id: string, patch: Partial<UserList>) {
  return patchList(id, (l) => ({ ...l, ...patch }));
}

/** Concluir a compra do mercado: vira uma despesa paga hoje e, se quiser, a lista fica pronta para a próxima. */
export function finishShopping(listId: string, o: { total: number; storeName: string; categoryId: string | null; reset: boolean; voucherId?: string | null }, today: string = todayISO()) {
  return (d: AppData): AppData => {
    let next = d;
    const l = d.lists.find((x) => x.id === listId);
    const bought = l ? l.items.filter((i) => i.done).length : 0;
    const lines = l ? l.items.filter((i) => i.done && (i.paid ?? 0) > 0).map((i) => ({ productId: i.productId, text: i.text, price: i.paid! })) : [];
    const expenseIds: string[] = [];
    if (o.categoryId && o.total > 0) {
      const r = addListExpense(next, { kind: 'avulsa', description: `Mercado · ${o.storeName}`, categoryId: o.categoryId, method: o.voucherId ? 'vale' : 'pix', cardId: null, date: today, amounts: [o.total], paidAt: today, voucherId: o.voucherId ?? null }, listId, today);
      next = r.data;
      if (r.id) expenseIds.push(r.id);
    }
    if (l && (o.total > 0 || bought > 0)) next = recordPurchase(next, { date: today, listId, listName: l.name, store: o.storeName, total: o.total, items: bought, lines, expenseIds });
    return o.reset ? uncheckAll(listId)(next) : next;
  };
}

function recordPurchase(d: AppData, p: Omit<Purchase, 'id'>): AppData {
  return { ...d, purchases: [...d.purchases, { id: uid(), ...p }] };
}

/** M3: quantas embalagens o item pede ("2 kg" de arroz em pacote de 1 kg = 2; "3 un" = 3; sem quantidade = 1). */
export function packCount(it: Pick<ListItem, 'qty' | 'unit'>, product: Product | undefined, pack: { size: number; sizeUnit: ProductVariant['sizeUnit'] }): number {
  const q = it.qty && it.qty > 0 ? it.qty : 1;
  const u = it.unit.toLowerCase();
  const amount = u === 'g' || u === 'ml' ? q / 1000 : q;
  const measured = (u === 'kg' || u === 'g') && product?.unit === 'kg' ? true : (u === 'l' || u === 'ml') && product?.unit === 'L';
  if (!measured) return q;
  const f = unitFactor({ id: '', productId: '', brand: '', ...pack });
  return f > 0 ? Math.max(1, Math.round((amount / f) * 100) / 100) : 1;
}

/**
 * M3: "Quanto custou aqui?" ao marcar o item. Marca o item, guarda quanto pagou (embalagem × quantidade)
 * e anota o preço da embalagem em Preços, na loja da compra.
 */
export function payItem(listId: string, itemId: string, o: { storeId: string; price: number; count: number; brand?: string; size: number; sizeUnit: ProductVariant['sizeUnit'] }, today: string = todayISO()) {
  return (d: AppData): AppData => {
    const it = d.lists.find((l) => l.id === listId)?.items.find((i) => i.id === itemId);
    if (!it || !(o.price > 0)) return d;
    let next = d;
    if (it.productId) next = addPrice({ storeId: o.storeId, productId: it.productId, brand: o.brand ?? '', size: o.size, sizeUnit: o.sizeUnit, price: o.price, date: today })(next);
    const paid = Math.round(o.price * (o.count > 0 ? o.count : 1) * 100) / 100;
    return updateItem(listId, itemId, { done: true, paid })(next);
  };
}

/** M3: soma do que foi anotado como pago nos itens marcados. */
export function paidTotal(l: UserList): { total: number; count: number } {
  const xs = l.items.filter((i) => i.done && (i.paid ?? 0) > 0);
  return { total: Math.round(xs.reduce((a, i) => a + (i.paid ?? 0), 0) * 100) / 100, count: xs.length };
}

/** M3: a última compra concluída desta lista (para comparar com a de agora). */
export function lastPurchase(d: Pick<AppData, 'purchases'>, listId: string): Purchase | undefined {
  return d.purchases.filter((p) => p.listId === listId).sort((a, b) => b.date.localeCompare(a.date))[0];
}

export interface PurchaseRow {
  key: string;
  date: string;
  title: string;
  store: string;
  total: number;
  items: number | null;
  /** E6: despesas em Finanças desta compra. */
  expenseIds: string[];
}

/**
 * Listas › Compras: as compras concluídas, da mais recente para a mais antiga.
 * Compras feitas antes deste histórico existir entram pelas despesas "Mercado · Loja".
 */
export function purchaseHistory(d: Pick<AppData, 'purchases' | 'expenses'>): PurchaseRow[] {
  const alive = new Set(d.expenses.map((e) => e.id));
  // Compras antigas (antes do E6) não guardavam a despesa: acha a do mercado pela data, loja e valor.
  const legacy = (p: Purchase) => d.expenses.filter((e) => e.description === `Mercado · ${p.store}` && (e.paidAt ?? e.dueDate) === p.date && Math.abs(e.amount - p.total) < 0.005).slice(0, 1).map((e) => e.id);
  const rows: PurchaseRow[] = d.purchases.map((p) => {
    const saved = p.expenseIds ?? [];
    const own = saved.filter((id) => alive.has(id));
    return { key: p.id, date: p.date, title: p.listName, store: p.store, total: p.total, items: p.items, expenseIds: saved.length ? own : legacy(p) };
  });
  const first = d.purchases.reduce<string | null>((m, p) => (m === null || p.date < m ? p.date : m), null);
  for (const e of d.expenses) {
    if (!e.description.startsWith('Mercado · ')) continue;
    if (first !== null && e.dueDate >= first) continue;
    rows.push({ key: `e:${e.id}`, date: e.dueDate, title: 'Compra de mercado', store: e.description.slice('Mercado · '.length), total: e.amount, items: null, expenseIds: [e.id] });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || b.key.localeCompare(a.key));
}

/**
 * Lista de compras: cada item comprado (com valor) vira uma despesa paga hoje, marcada como "veio da lista".
 * E6: item com loja anota o preço em Preços (na categoria da lista).
 */
export function launchBought(listId: string, categoryId: string, today: string = todayISO()) {
  return (d: AppData): AppData => {
    const l = d.lists.find((x) => x.id === listId);
    if (!l) return d;
    let next = d;
    const toLaunch = l.items.filter((i) => i.done && !i.launched && (i.price ?? 0) > 0);
    const expenseIds: string[] = [];
    for (const it of toLaunch) {
      const r = addListExpense(next, { kind: 'avulsa', description: it.text, categoryId, method: 'pix', cardId: null, date: today, amounts: [it.price!], paidAt: today }, listId, today);
      next = r.data;
      if (r.id) expenseIds.push(r.id);
      if (it.productId && it.store.trim() && next.products.some((p) => p.id === it.productId)) {
        next = addPrice({ storeName: it.store, productId: it.productId, price: it.price!, date: today, categoryId: l.categoryId })(next);
      }
    }
    const stores = [...new Set(toLaunch.map((i) => i.store.trim()).filter(Boolean))];
    if (toLaunch.length) next = recordPurchase(next, { date: today, listId, listName: l.name, store: stores.join(', '), total: Math.round(toLaunch.reduce((a, i) => a + (i.price ?? 0), 0) * 100) / 100, items: toLaunch.length, lines: toLaunch.map((i) => ({ productId: i.productId, text: i.text, price: i.price! })), expenseIds });
    return patchList(listId, (x) => ({ ...x, items: x.items.map((i) => (i.done && (i.price ?? 0) > 0 ? { ...i, launched: true } : i)) }))(next);
  };
}

/** Receita → lista de mercado: os ingredientes escolhidos, já nas porções da receita. */
export function sendIngredients(fromId: string, toId: string, itemIds: string[]) {
  return (d: AppData): AppData => {
    const from = d.lists.find((l) => l.id === fromId);
    if (!from) return d;
    const f = from.serves / (from.baseServes || 1);
    let next = d;
    const items = from.items
      .filter((i) => itemIds.includes(i.id))
      .map((i) => {
        const own = findProduct(next, i.text) ?? findCatalog(i.text);
        const r = ensureProduct(next, i.text, i.unit);
        next = r.data;
        return newItem({ text: i.text, qty: i.qty ? scaledQty(i.qty, i.unit, f) : null, unit: i.unit, productId: r.product.id, aisle: own ? r.product.aisle : `Receita: ${from.name}` });
      });
    return patchList(toId, (l) => ({ ...l, items: [...l.items, ...items] }))(next);
  };
}

/** Anotar um preço. Cria o mercado, o produto e a marca/tamanho na hora, se forem novos. */
export function addPrice(p: {
  storeId?: string; storeName?: string;
  productId?: string; productName?: string; aisle?: string; unit?: Product['unit'];
  variantId?: string; brand?: string; size?: number; sizeUnit?: ProductVariant['sizeUnit'];
  price: number; promo?: boolean; date?: string; categoryId?: string;
}) {
  return (d: AppData): AppData => {
    let next = d;
    let storeId = p.storeId;
    if (!storeId) {
      const name = (p.storeName ?? 'Mercado').trim();
      const ex = next.stores.find((s) => plain(s.name) === plain(name));
      storeId = ex?.id ?? uid();
      if (!ex) next = { ...next, stores: [...next.stores, { id: storeId, name, categoryId: p.categoryId ?? MARKET_CAT }] };
    }
    let productId = p.productId;
    if (!productId) {
      const ex = findProduct(next, p.productName ?? '');
      productId = ex?.id ?? uid();
      if (!ex) next = { ...next, products: [...next.products, { id: productId, name: (p.productName ?? 'Produto').trim(), aisle: p.aisle ?? 'Outros', unit: p.unit ?? 'un', categoryId: p.categoryId ?? MARKET_CAT }] };
    }
    let variantId = p.variantId;
    if (!variantId) {
      const ex = next.variants.find((v) => v.productId === productId && plain(v.brand) === plain(p.brand ?? '') && v.size === (p.size ?? 1) && v.sizeUnit === (p.sizeUnit ?? 'un'));
      variantId = ex?.id ?? uid();
      if (!ex) next = { ...next, variants: [...next.variants, { id: variantId, productId, brand: (p.brand ?? '').trim(), size: p.size ?? 1, sizeUnit: p.sizeUnit ?? 'un' }] };
    }
    return { ...next, prices: [...next.prices, { id: uid(), variantId, storeId, price: p.price, date: p.date ?? todayISO(), promo: p.promo === true }] };
  };
}

export function addListCategory(c: Omit<ListCategory, 'id'>) {
  return (d: AppData): AppData => ({ ...d, listCategories: [...d.listCategories, { ...c, id: uid() }] });
}
export function updateListCategory(id: string, patch: Partial<ListCategory>) {
  return (d: AppData): AppData => {
    const has = d.lists.some((l) => l.categoryId === id);
    return { ...d, listCategories: d.listCategories.map((c) => (c.id === id ? { ...c, ...patch, kind: has ? c.kind : (patch.kind ?? c.kind) } : c)) };
  };
}
/** Só exclui categoria vazia (nenhuma lista se perde). */
export function deleteListCategory(id: string) {
  return (d: AppData): AppData => (d.lists.some((l) => l.categoryId === id) ? d : { ...d, listCategories: d.listCategories.filter((c) => c.id !== id) });
}

// ---------- M4: categorias de Preços e edição ----------

/** Categorias de Preços: as mesmas das Listas, menos Cozinha (receitas). */
export const priceCategories = (d: Pick<AppData, 'listCategories'>) => d.listCategories.filter((c) => c.kind !== 'receita');

export function updateProduct(id: string, patch: Partial<Pick<Product, 'name' | 'aisle' | 'unit' | 'categoryId'>>) {
  return (d: AppData): AppData => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, ...patch, name: (patch.name ?? p.name).trim() || p.name } : p)) });
}

/** Exclui o produto com as marcas e os preços dele; itens de lista ficam, só sem o vínculo. */
export function deleteProduct(id: string) {
  return (d: AppData): AppData => {
    const vs = new Set(d.variants.filter((v) => v.productId === id).map((v) => v.id));
    return {
      ...d,
      products: d.products.filter((p) => p.id !== id),
      variants: d.variants.filter((v) => !vs.has(v.id)),
      prices: d.prices.filter((p) => !vs.has(p.variantId)),
      lists: d.lists.map((l) => (l.items.some((i) => i.productId === id) ? { ...l, items: l.items.map((i) => (i.productId === id ? { ...i, productId: null } : i)) } : l)),
    };
  };
}

/** Corrige um preço anotado: marca, loja, quantidade/peso e valor. Marca e tamanho novos viram outra variação. */
export function updatePriceEntry(id: string, o: { brand: string; size: number; sizeUnit: ProductVariant['sizeUnit']; storeId: string; price: number; date?: string }) {
  return (d: AppData): AppData => {
    const e = d.prices.find((p) => p.id === id);
    const v0 = e && d.variants.find((v) => v.id === e.variantId);
    if (!e || !v0 || !(o.price > 0)) return d;
    let next = d;
    let v = d.variants.find((v) => v.productId === v0.productId && plain(v.brand) === plain(o.brand) && v.size === o.size && v.sizeUnit === o.sizeUnit);
    if (!v) {
      v = { id: uid(), productId: v0.productId, brand: o.brand.trim(), size: o.size, sizeUnit: o.sizeUnit };
      next = { ...next, variants: [...next.variants, v] };
    }
    const vid = v.id;
    next = { ...next, prices: next.prices.map((p) => (p.id === id ? { ...p, variantId: vid, storeId: o.storeId, price: o.price, date: o.date ?? p.date } : p)) };
    // Marca/tamanho que ficou sem nenhum preço some.
    return next.prices.some((p) => p.variantId === v0.id) ? next : { ...next, variants: next.variants.filter((x) => x.id !== v0.id) };
  };
}

export function deletePriceEntry(id: string) {
  return (d: AppData): AppData => ({ ...d, prices: d.prices.filter((p) => p.id !== id) });
}

/** M41: nome da embalagem nas fichas ("5 kg"; a de 1 kg/1 L vira "Preço do quilo"/"Preço do litro"). */
export function packLabel(x: { size: number; sizeUnit: ProductVariant['sizeUnit'] }): string {
  if (x.size === 1 && x.sizeUnit === 'kg') return 'Preço do quilo';
  if (x.size === 1 && x.sizeUnit === 'L') return 'Preço do litro';
  return `${x.size.toLocaleString('pt-BR')} ${x.sizeUnit}`;
}

/**
 * M42: junta dois produtos (o outro entra neste). Marcas e tamanhos iguais viram um só; preços e itens das listas
 * passam para o que fica; o outro some.
 */
export function mergeProducts(keepId: string, dropId: string) {
  return (d: AppData): AppData => {
    if (keepId === dropId || !d.products.some((p) => p.id === keepId) || !d.products.some((p) => p.id === dropId)) return d;
    const keepVars = d.variants.filter((v) => v.productId === keepId);
    const remap = new Map<string, string>();
    const variants: ProductVariant[] = [];
    for (const v of d.variants) {
      if (v.productId !== dropId) {
        variants.push(v);
        continue;
      }
      const same = keepVars.find((k) => plain(k.brand) === plain(v.brand) && k.size === v.size && k.sizeUnit === v.sizeUnit);
      if (same) remap.set(v.id, same.id);
      else variants.push({ ...v, productId: keepId });
    }
    return {
      ...d,
      products: d.products.filter((p) => p.id !== dropId),
      variants,
      prices: d.prices.map((p) => (remap.has(p.variantId) ? { ...p, variantId: remap.get(p.variantId)! } : p)),
      lists: d.lists.map((l) => (l.items.some((i) => i.productId === dropId) ? { ...l, items: l.items.map((i) => (i.productId === dropId ? { ...i, productId: keepId } : i)) } : l)),
    };
  };
}
