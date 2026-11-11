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
