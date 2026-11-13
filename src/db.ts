/** Armazenamento local em IndexedDB, com localStorage como reserva se o IndexedDB falhar ou não estiver disponível. */
import { pickNewest } from './reserva';

const DB_NAME = 'central-pessoal';
const STORE = 'kv';
const FALLBACK_PREFIX = 'central-pessoal:kv:';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB indisponível'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => (dbPromise = null));
  }
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

export async function dbGet<T>(key: string): Promise<T | undefined> {
  try {
    return (await run('readonly', (s) => s.get(key))) as T | undefined;
  } catch {
    const raw = localStorage.getItem(FALLBACK_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  }
}

/**
 * Grava no banco principal. Se ele falhar, grava na reserva e devolve 'reserva' (C4: quem chama avisa).
 * Se a reserva também falhar, dá erro. Depois de gravar no principal, a reserva antiga é apagada.
 */
export async function dbSet(key: string, value: unknown): Promise<'ok' | 'reserva'> {
  try {
    await run('readwrite', (s) => s.put(value, key));
  } catch {
    localStorage.setItem(FALLBACK_PREFIX + key, JSON.stringify(value));
    return 'reserva';
  }
  try {
    localStorage.removeItem(FALLBACK_PREFIX + key);
  } catch {
    /* ignora */
  }
  return 'ok';
}

/** C4: lê as duas cópias (principal e reserva) e devolve a mais nova. */
export async function dbGetNewest<T>(key: string): Promise<{ value: T | undefined; from: 'principal' | 'reserva' }> {
  const main = await dbGet<T>(key);
  let reserve: unknown;
  try {
    const raw = localStorage.getItem(FALLBACK_PREFIX + key);
    reserve = raw ? JSON.parse(raw) : undefined;
  } catch {
    reserve = undefined;
  }
  const r = pickNewest(main, reserve);
  return { value: r.value as T | undefined, from: r.from };
}

export async function dbDelete(key: string): Promise<void> {
  try {
    await run('readwrite', (s) => s.delete(key));
  } catch {
    localStorage.removeItem(FALLBACK_PREFIX + key);
  }
}

/** Chaves que começam com `prefix` (ex.: os arquivos guardados). */
export async function dbKeys(prefix: string): Promise<string[]> {
  try {
    const keys = await run('readonly', (s) => s.getAllKeys(IDBKeyRange.bound(prefix, `${prefix}\uffff`)));
    return keys.map(String);
  } catch {
    return [];
  }
}

/** Pede ao navegador para não apagar os dados automaticamente. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
