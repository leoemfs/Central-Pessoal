/**
 * N9.0: prepara os dados para a sincronização entre aparelhos.
 *
 * Toda alteração passa por `trackChanges`, num lugar só (a loja), sem mexer em cada módulo:
 * - cada item com `id` (em qualquer lista, inclusive dentro de Estudos e Carreira) ganha em `stamps`
 *   a data da última alteração;
 * - cada parte do app (chave do topo: despesas, configurações, humor…) ganha `stamps['@chave']`;
 * - item que sumiu entra em `deleted` (id → data), para não "ressuscitar" vindo de outro aparelho;
 *   se voltar (desfazer, backup), sai de `deleted`.
 */
import type { AppData } from './types.ts';

/** Partes que não são dados da pessoa (ou que são o próprio registro). */
const SKIP = new Set(['stamps', 'deleted', 'legacy', 'version']);

/** Exclusões mais antigas que isso são esquecidas (os aparelhos já sincronizaram). */
export const DELETED_KEEP_DAYS = 90;

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Junta todos os itens com `id` de um pedaço dos dados (busca em profundidade). */
function collect(node: unknown, out: Map<string, unknown>): void {
  if (Array.isArray(node)) {
    for (const x of node) {
      if (isRec(x) && typeof x.id === 'string' && x.id && !out.has(x.id)) out.set(x.id, x);
      collect(x, out);
    }
  } else if (isRec(node)) {
    for (const v of Object.values(node)) collect(v, out);
  }
}

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** Registra o que mudou entre `prev` e `next`. Sem mudança, devolve o próprio `next`. */
export function trackChanges(prev: AppData, next: AppData, now: string = new Date().toISOString()): AppData {
  if (prev === next) return next;
  const stamps: Record<string, string> = { ...next.stamps };
  const deleted: Record<string, string> = { ...next.deleted };
  let changed = false;
  // Item que só mudou de lugar (de uma parte para outra) não conta como excluído.
  const present = new Set<string>();
  const removed: string[] = [];
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const key of keys) {
    if (SKIP.has(key)) continue;
    const a = (prev as unknown as Rec)[key];
    const b = (next as unknown as Rec)[key];
    if (a === b) continue;
    const before = new Map<string, unknown>();
    const after = new Map<string, unknown>();
    collect(a, before);
    collect(b, after);
    let partChanged = false;
    for (const [id, item] of after) {
      present.add(id);
      const old = before.get(id);
      if (old !== undefined && same(old, item)) continue;
      stamps[id] = now;
      if (id in deleted) delete deleted[id];
      partChanged = true;
    }
    for (const id of before.keys()) {
      if (after.has(id)) continue;
      removed.push(id);
      partChanged = true;
    }
    if (partChanged || !same(a, b)) {
      stamps[`@${key}`] = now;
      changed = true;
      // Partes que são objetos (configurações, humor por dia, Estudos…): data por campo, para a
      // junção escolher campo a campo (abrir o app num aparelho não apaga a configuração do outro).
      if (isRec(a) && isRec(b)) for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (!same(a[k], b[k])) stamps[`@${key}.${k}`] = now;
    }
  }
  for (const id of removed) {
    if (present.has(id)) continue;
    deleted[id] = now;
    delete stamps[id];
  }
  return changed ? { ...next, stamps, deleted } : next;
}

/** Esquece exclusões com mais de 90 dias. */
export function pruneDeleted(d: AppData, now: Date = new Date()): AppData {
  const limit = new Date(now.getTime() - DELETED_KEEP_DAYS * 86400000).toISOString();
  const entries = Object.entries(d.deleted);
  const kept = entries.filter(([, at]) => at >= limit);
  return kept.length === entries.length ? d : { ...d, deleted: Object.fromEntries(kept) };
}

// ---------- N9.2: juntar os dados de dois aparelhos ----------

interface MergeCtx {
  /** Datas de alteração de cada lado. */
  sa: Record<string, string>;
  sb: Record<string, string>;
  /** Exclusões dos dois lados juntas. */
  deleted: Record<string, string>;
}

const isIdItem = (x: unknown): x is Rec => isRec(x) && typeof x.id === 'string' && x.id !== '';

/** As duas listas são de itens com id (e pelo menos uma tem item)? */
function idLists(a: unknown, b: unknown): boolean {
  if (!(Array.isArray(a) || a === undefined) || !(Array.isArray(b) || b === undefined)) return false;
  const all = [...((a as unknown[]) ?? []), ...((b as unknown[]) ?? [])];
  return all.length > 0 && all.every(isIdItem);
}

/** Junta dois valores. `aNewer`: o lado A é o mais recente (vale quando não dá para juntar). */
function mergeValue(a: unknown, b: unknown, aNewer: boolean, ctx: MergeCtx): unknown {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (idLists(a, b)) return mergeById(a as Rec[], b as Rec[], aNewer, ctx);
  if (isRec(a) && isRec(b)) {
    const out: Rec = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = mergeValue(a[k], b[k], aNewer, ctx);
    return out;
  }
  return aNewer ? a : b;
}

/** Junta listas pelo id: item dos dois lados → o mais recente (e as listas dentro dele, item a item);
 * item de um lado só → fica, a não ser que o outro lado tenha excluído depois da última alteração. */
function mergeById(la: Rec[], lb: Rec[], aNewer: boolean, ctx: MergeCtx): Rec[] {
  const A = new Map(la.map((x) => [x.id as string, x]));
  const B = new Map(lb.map((x) => [x.id as string, x]));
  // A ordem é a do lado mais recente; o que só existe do outro lado vai no fim.
  const order = aNewer ? [...la, ...lb] : [...lb, ...la];
  const seen = new Set<string>();
  const out: Rec[] = [];
  for (const x of order) {
    const id = x.id as string;
    if (seen.has(id)) continue;
    seen.add(id);
    const a = A.get(id);
    const b = B.get(id);
    if (a && b) {
      const sa = ctx.sa[id] ?? '';
      const sb = ctx.sb[id] ?? '';
      out.push(mergeValue(a, b, sa === sb ? aNewer : sa > sb, ctx) as Rec);
    } else {
      const stamp = (a ? ctx.sa[id] : ctx.sb[id]) ?? '';
      const del = ctx.deleted[id];
      if (del && del >= stamp) continue; // excluído depois da última alteração
      out.push((a ?? b) as Rec);
    }
  }
  return out;
}

const maxMap = (a: Record<string, string>, b: Record<string, string>) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) if (!(k in out) || v > out[k]) out[k] = v;
  return out;
};
const union = (a: string[], b: string[]) => [...new Set([...a, ...b])].sort();

/**
 * Junta os dados deste aparelho (`local`) com os da nuvem (`remote`), item por item.
 * Nada some sem motivo: o que foi criado num aparelho entra no outro; no mesmo item, vale a
 * alteração mais recente; exclusão só vence se veio depois da última alteração do item.
 */
export function mergeData(local: AppData, remote: AppData): AppData {
  const ctx: MergeCtx = { sa: local.stamps, sb: remote.stamps, deleted: maxMap(local.deleted, remote.deleted) };
  const L = local as unknown as Rec;
  const R = remote as unknown as Rec;
  const out: Rec = { ...L };
  for (const key of new Set([...Object.keys(L), ...Object.keys(R)])) {
    if (SKIP.has(key)) continue;
    const aNewer = (local.stamps[`@${key}`] ?? '') >= (remote.stamps[`@${key}`] ?? '');
    const a = L[key];
    const b = R[key];
    if (isRec(a) && isRec(b)) {
      // Campo a campo: vale o aparelho que mudou aquele campo por último.
      const part: Rec = {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
        const sa = local.stamps[`@${key}.${k}`] ?? '';
        const sb = remote.stamps[`@${key}.${k}`] ?? '';
        part[k] = mergeValue(a[k], b[k], sa === '' && sb === '' ? aNewer : sa >= sb, ctx);
      }
      out[key] = part;
    } else out[key] = mergeValue(a, b, aNewer, ctx);
  }
  const merged = out as unknown as AppData;
  // Dias de uso e de visita: os dos dois aparelhos contam.
  merged.settings = {
    ...merged.settings,
    activeDays: union(local.settings.activeDays, remote.settings.activeDays),
    visitDays: union(local.settings.visitDays, remote.settings.visitDays),
  };
  merged.stamps = maxMap(local.stamps, remote.stamps);
  // O que continua existindo sai das exclusões.
  const present = new Map<string, unknown>();
  for (const key of Object.keys(out)) if (!SKIP.has(key)) collect(out[key], present);
  merged.deleted = Object.fromEntries(Object.entries(ctx.deleted).filter(([id]) => !present.has(id)));
  for (const id of Object.keys(merged.deleted)) delete merged.stamps[id];
  return merged;
}
