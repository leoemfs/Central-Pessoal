/**
 * Listas (por categoria) e Preços.
 * Cada categoria escolhe como as listas dela funcionam: mercado (corredores + preços), compras (valor por item),
 * receita (ingredientes, porções e preparo) ou checklist.
 */
import type { AppData, ListCategory, ListItem, ListKind, PriceEntry, Product, ProductVariant, Purchase, Store, UserList } from './types.ts';
import { addExpense } from './finance.ts';
import { todayISO, uid } from './utils.ts';

export const LIST_KINDS: Record<ListKind, { label: string; hint: string }> = {
  mercado: { label: 'Mercado', hint: 'Itens por corredor, com os preços dos mercados' },
  compras: { label: 'Compras', hint: 'Valor de cada item, total e lançar em Finanças' },
  receita: { label: 'Receita', hint: 'Ingredientes, porções e modo de preparo' },
  checklist: { label: 'Checklist', hint: 'Só marcar o que já foi' },
};

export const DEFAULT_LIST_CATEGORIES: ListCategory[] = [
  { id: 'lc-mercado', name: 'Mercado', icon: 'cart', color: '#f97316', kind: 'mercado' },
  { id: 'lc-receitas', name: 'Receitas', icon: 'pot', color: '#8b5cf6', kind: 'receita' },
  { id: 'lc-roupas', name: 'Roupas', icon: 'shirt', color: '#ec4899', kind: 'compras' },
  { id: 'lc-casa', name: 'Casa', icon: 'home', color: '#3b82f6', kind: 'compras' },
  { id: 'lc-viagem', name: 'Viagem', icon: 'plane', color: '#06b6d4', kind: 'checklist' },
];
export const LIST_ICONS = ['cart', 'pot', 'shirt', 'home', 'plane', 'gift', 'bag', 'book', 'heart', 'paw', 'tasks', 'tag'];
export const LIST_COLORS = ['#f97316', '#8b5cf6', '#ec4899', '#3b82f6', '#06b6d4', '#22c55e', '#eab308', '#ef4444'];
export const AISLES = ['Hortifrúti', 'Mercearia', 'Carnes', 'Laticínios', 'Padaria', 'Bebidas', 'Limpeza', 'Higiene', 'Congelados', 'Pet', 'Outros'];

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown, def = '') => (typeof x === 'string' ? x : def);
const numOrNull = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const recs = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is Rec => isRec(i) && typeof i.id === 'string') : []);
const KINDS = Object.keys(LIST_KINDS) as ListKind[];

export function normalizeListData(r: Rec) {
  const listCategories: ListCategory[] = Array.isArray(r.listCategories)
    ? recs(r.listCategories).map((c) => ({ id: c.id as string, name: str(c.name, 'Lista'), icon: str(c.icon, 'tasks'), color: str(c.color, '#94a3b8'), kind: KINDS.includes(c.kind as ListKind) ? (c.kind as ListKind) : 'checklist' }))
    : DEFAULT_LIST_CATEGORIES.map((c) => ({ ...c }));
  const item = (i: Rec): ListItem => ({
    id: i.id as string, text: str(i.text, 'Item'), qty: numOrNull(i.qty), unit: str(i.unit), aisle: str(i.aisle), productId: typeof i.productId === 'string' ? i.productId : null,
    price: numOrNull(i.price), store: str(i.store), done: i.done === true, launched: i.launched === true,
  });
  const lists: UserList[] = recs(r.lists).map((l) => ({
    id: l.id as string, name: str(l.name, 'Lista'), categoryId: str(l.categoryId, listCategories[0]?.id ?? ''), pinned: l.pinned === true,
    items: recs(l.items).map(item), serves: numOrNull(l.serves) ?? 4, baseServes: numOrNull(l.baseServes) ?? 4, minutes: numOrNull(l.minutes),
    tags: Array.isArray(l.tags) ? l.tags.filter((t): t is string => typeof t === 'string') : [], steps: Array.isArray(l.steps) ? l.steps.filter((t): t is string => typeof t === 'string') : [],
    createdAt: str(l.createdAt, new Date().toISOString()),
  }));
  const products: Product[] = recs(r.products).map((p) => ({ id: p.id as string, name: str(p.name, 'Produto'), aisle: str(p.aisle, 'Outros'), unit: p.unit === 'L' || p.unit === 'un' ? p.unit : 'kg' }));
  const variants: ProductVariant[] = recs(r.variants).filter((v) => typeof v.productId === 'string').map((v) => ({ id: v.id as string, productId: v.productId as string, brand: str(v.brand), size: numOrNull(v.size) ?? 1, sizeUnit: (['g', 'kg', 'ml', 'L', 'un'] as const).includes(v.sizeUnit as 'g') ? (v.sizeUnit as ProductVariant['sizeUnit']) : 'un' }));
  const stores: Store[] = recs(r.stores).map((s) => ({ id: s.id as string, name: str(s.name, 'Mercado') }));
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
export function bestPrice(d: Pick<AppData, 'prices' | 'variants'>, productId: string, storeId?: string, latest = latestPrices(d)): BestPrice | null {
  let best: BestPrice | null = null;
  for (const v of d.variants.filter((x) => x.productId === productId)) {
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
        const b = it.productId ? bestPrice(d, it.productId, s.id, latest) : null;
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
export function itemCost(it: Pick<ListItem, 'qty' | 'unit'>, b: BestPrice, product?: Product): number {
  const q = it.qty && it.qty > 0 ? it.qty : 1;
  const u = it.unit.toLowerCase();
  const amount = u === 'g' || u === 'ml' ? q / 1000 : q;
  const measured = (u === 'kg' || u === 'g') && product?.unit === 'kg' ? true : (u === 'l' || u === 'ml') && product?.unit === 'L';
  return measured ? b.perUnit * amount : b.price * q;
}

export function findProduct(d: Pick<AppData, 'products'>, text: string): Product | undefined {
  const t = plain(text);
  return d.products.find((p) => plain(p.name) === t);
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
  return { id: uid(), qty: null, unit: '', aisle: '', productId: null, price: null, store: '', done: false, launched: false, ...p };
}

/** Adiciona um item a partir do texto ("2 kg tomate"); no mercado, liga ao produto de Preços e ao corredor. */
export function addItemFromText(listId: string, text: string, extra: Partial<ListItem> = {}) {
  return (d: AppData): AppData => {
    const p = parseItemText(text);
    const prod = findProduct(d, p.text);
    return patchList(listId, (l) => ({ ...l, items: [...l.items, newItem({ text: p.text, qty: p.qty, unit: p.unit, productId: prod?.id ?? null, aisle: prod?.aisle ?? 'Outros', ...extra })] }))(d);
  };
}

export function updateItem(listId: string, itemId: string, patch: Partial<ListItem>) {
  return patchList(listId, (l) => ({ ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }));
}
export function removeItem(listId: string, itemId: string) {
  return patchList(listId, (l) => ({ ...l, items: l.items.filter((i) => i.id !== itemId) }));
}
export function toggleItem(listId: string, itemId: string) {
  return patchList(listId, (l) => ({ ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, done: !i.done, launched: i.done ? false : i.launched } : i)) }));
}
export function uncheckAll(listId: string) {
  return patchList(listId, (l) => ({ ...l, items: l.items.map((i) => ({ ...i, done: false, launched: false })) }));
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
    if (l && (o.total > 0 || bought > 0)) next = recordPurchase(next, { date: today, listId, listName: l.name, store: o.storeName, total: o.total, items: bought });
    if (o.categoryId && o.total > 0) {
      next = addExpense(next, { kind: 'avulsa', description: `Mercado · ${o.storeName}`, categoryId: o.categoryId, method: o.voucherId ? 'vale' : 'pix', cardId: null, date: today, amounts: [o.total], paidAt: today, voucherId: o.voucherId ?? null }, today);
    }
    return o.reset ? uncheckAll(listId)(next) : next;
  };
}

function recordPurchase(d: AppData, p: Omit<Purchase, 'id'>): AppData {
  return { ...d, purchases: [...d.purchases, { id: uid(), ...p }] };
}

export interface PurchaseRow {
  key: string;
  date: string;
  title: string;
  store: string;
  total: number;
  items: number | null;
}

/**
 * Listas › Compras: as compras concluídas, da mais recente para a mais antiga.
 * Compras feitas antes deste histórico existir entram pelas despesas "Mercado · Loja".
 */
export function purchaseHistory(d: Pick<AppData, 'purchases' | 'expenses'>): PurchaseRow[] {
  const rows: PurchaseRow[] = d.purchases.map((p) => ({ key: p.id, date: p.date, title: p.listName, store: p.store, total: p.total, items: p.items }));
  const first = d.purchases.reduce<string | null>((m, p) => (m === null || p.date < m ? p.date : m), null);
  for (const e of d.expenses) {
    if (!e.description.startsWith('Mercado · ')) continue;
    if (first !== null && e.dueDate >= first) continue;
    rows.push({ key: `e:${e.id}`, date: e.dueDate, title: 'Compra de mercado', store: e.description.slice('Mercado · '.length), total: e.amount, items: null });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || b.key.localeCompare(a.key));
}

/** Lista de compras: cada item comprado (com valor) vira uma despesa paga hoje. */
export function launchBought(listId: string, categoryId: string, today: string = todayISO()) {
  return (d: AppData): AppData => {
    const l = d.lists.find((x) => x.id === listId);
    if (!l) return d;
    let next = d;
    const toLaunch = l.items.filter((i) => i.done && !i.launched && (i.price ?? 0) > 0);
    if (toLaunch.length) next = recordPurchase(next, { date: today, listId, listName: l.name, store: '', total: toLaunch.reduce((a, i) => a + (i.price ?? 0), 0), items: toLaunch.length });
    for (const it of toLaunch) {
      next = addExpense(next, { kind: 'avulsa', description: it.text, categoryId, method: 'pix', cardId: null, date: today, amounts: [it.price!], paidAt: today }, today);
    }
    return patchList(listId, (x) => ({ ...x, items: x.items.map((i) => (i.done && (i.price ?? 0) > 0 ? { ...i, launched: true } : i)) }))(next);
  };
}

/** Receita → lista de mercado: os ingredientes escolhidos, já nas porções da receita. */
export function sendIngredients(fromId: string, toId: string, itemIds: string[]) {
  return (d: AppData): AppData => {
    const from = d.lists.find((l) => l.id === fromId);
    if (!from) return d;
    const f = from.serves / (from.baseServes || 1);
    const items = from.items
      .filter((i) => itemIds.includes(i.id))
      .map((i) => {
        const prod = findProduct(d, i.text);
        return newItem({ text: i.text, qty: i.qty ? scaledQty(i.qty, i.unit, f) : null, unit: i.unit, productId: prod?.id ?? null, aisle: prod?.aisle ?? `Receita: ${from.name}` });
      });
    return patchList(toId, (l) => ({ ...l, items: [...l.items, ...items] }))(d);
  };
}

/** Anotar um preço. Cria o mercado, o produto e a marca/tamanho na hora, se forem novos. */
export function addPrice(p: {
  storeId?: string; storeName?: string;
  productId?: string; productName?: string; aisle?: string; unit?: Product['unit'];
  variantId?: string; brand?: string; size?: number; sizeUnit?: ProductVariant['sizeUnit'];
  price: number; promo?: boolean; date?: string;
}) {
  return (d: AppData): AppData => {
    let next = d;
    let storeId = p.storeId;
    if (!storeId) {
      const name = (p.storeName ?? 'Mercado').trim();
      const ex = next.stores.find((s) => plain(s.name) === plain(name));
      storeId = ex?.id ?? uid();
      if (!ex) next = { ...next, stores: [...next.stores, { id: storeId, name }] };
    }
    let productId = p.productId;
    if (!productId) {
      const ex = findProduct(next, p.productName ?? '');
      productId = ex?.id ?? uid();
      if (!ex) next = { ...next, products: [...next.products, { id: productId, name: (p.productName ?? 'Produto').trim(), aisle: p.aisle ?? 'Outros', unit: p.unit ?? 'un' }] };
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
