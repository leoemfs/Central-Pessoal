/**
 * Personalizar cartões (lápis ao lado da lupa): a ordem e os cartões ocultos de cada tela.
 * - 'top': sempre no topo, não sai do lugar nem some (Humor no Início, resumo do mês em Finanças).
 * - 'keep': aviso importante; nunca some, mas pode subir e descer.
 * - sem trava: pode subir, descer e ser ocultado.
 */
export type CardLock = 'top' | 'keep';

export interface CardInfo {
  id: string;
  label: string;
  lock?: CardLock;
}

export interface CardLayout {
  order: string[];
  hidden: string[];
}

export type CardLayouts = Record<string, CardLayout>;

/** Cartões na ordem escolhida: primeiro os do topo, depois os outros; os novos entram na posição padrão. */
export function arrange<T extends CardInfo>(cards: T[], layout: CardLayout | undefined): { shown: T[]; hidden: T[]; order: T[] } {
  const top = cards.filter((c) => c.lock === 'top');
  const rest = cards.filter((c) => c.lock !== 'top');
  const order = layout?.order ?? [];
  const pos = (c: T) => {
    const i = order.indexOf(c.id);
    // Cartão que ainda não estava na ordem salva: fica perto do vizinho padrão.
    return i >= 0 ? i : order.length + rest.indexOf(c);
  };
  const sorted = [...rest].sort((a, b) => pos(a) - pos(b) || rest.indexOf(a) - rest.indexOf(b));
  const hiddenIds = new Set((layout?.hidden ?? []).filter((id) => rest.some((c) => c.id === id && !c.lock)));
  return { shown: [...top, ...sorted.filter((c) => !hiddenIds.has(c.id))], hidden: sorted.filter((c) => hiddenIds.has(c.id)), order: sorted };
}

/** Sobe (-1) ou desce (+1) um cartão entre os que estão à mostra (os do topo não se movem). Os ocultos guardam o lugar. */
export function moveCard(cards: CardInfo[], layout: CardLayout | undefined, id: string, dir: -1 | 1): CardLayout {
  const { shown, order } = arrange(cards, layout);
  const base = normalizeLayout(cards, layout);
  const movable = shown.filter((c) => c.lock !== 'top').map((c) => c.id);
  const i = movable.indexOf(id);
  const other = movable[i + dir];
  if (i < 0 || !other) return base;
  const full = order.map((c) => c.id);
  const a = full.indexOf(id);
  const b = full.indexOf(other);
  [full[a], full[b]] = [full[b], full[a]];
  return { order: full, hidden: base.hidden };
}

export function hideCard(cards: CardInfo[], layout: CardLayout | undefined, id: string): CardLayout {
  const c = cards.find((x) => x.id === id);
  const base = normalizeLayout(cards, layout);
  if (!c || c.lock) return base;
  return { order: base.order, hidden: [...new Set([...base.hidden, id])] };
}

export function showCard(cards: CardInfo[], layout: CardLayout | undefined, id: string): CardLayout {
  const base = normalizeLayout(cards, layout);
  return { order: base.order, hidden: base.hidden.filter((x) => x !== id) };
}

/** Ordem completa e válida a partir do que está salvo. */
export function normalizeLayout(cards: CardInfo[], layout: CardLayout | undefined): CardLayout {
  const { hidden, order } = arrange(cards, layout);
  return { order: order.map((c) => c.id), hidden: hidden.map((c) => c.id) };
}

/** Lê o que veio do backup: só listas de textos, por tela. */
export function normalizeLayouts(raw: unknown): CardLayouts {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const strs = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))] : []);
  const out: CardLayouts = {};
  for (const [screen, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    out[screen] = { order: strs(r.order), hidden: strs(r.hidden) };
  }
  return out;
}
