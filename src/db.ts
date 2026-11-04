/** Armazenamento local em IndexedDB, com localStorage como reserva se o IndexedDB não estiver disponível. */
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

export async function dbSet(key: string, value: unknown): Promise<void> {
  try {
    await run('readwrite', (s) => s.put(value, key));
  } catch {
    localStorage.setItem(FALLBACK_PREFIX + key, JSON.stringify(value));
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
