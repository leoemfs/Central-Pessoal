/**
 * C4: escolhe entre a cópia principal (IndexedDB) e a cópia de reserva (localStorage).
 * A reserva só é gravada quando o banco principal falha; vale a cópia com a alteração mais recente,
 * lida das datas que o app já registra em `stamps` e `deleted` (N9.0).
 */

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Data (ISO) da última alteração registrada nos dados; vazio se não houver nenhuma. */
export function latestStamp(raw: unknown): string {
  if (!isRec(raw)) return '';
  let best = '';
  for (const part of [raw.stamps, raw.deleted]) {
    if (!isRec(part)) continue;
    for (const v of Object.values(part)) if (typeof v === 'string' && v > best) best = v;
  }
  return best;
}

/** Qual cópia usar ao abrir: a reserva só ganha se for mais nova (ou se a principal não existir). */
export function pickNewest(main: unknown, reserve: unknown): { value: unknown; from: 'principal' | 'reserva' } {
  if (reserve === undefined || reserve === null) return { value: main, from: 'principal' };
  if (main === undefined || main === null) return { value: reserve, from: 'reserva' };
  return latestStamp(reserve) > latestStamp(main) ? { value: reserve, from: 'reserva' } : { value: main, from: 'principal' };
}
