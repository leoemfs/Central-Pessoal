import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppData, Theme } from './types';

const STORAGE_KEY = 'central-pessoal:v1';

export function emptyData(): AppData {
  return {
    version: 1,
    tasks: [],
    transactions: [],
    habits: [],
    notes: [],
    events: [],
    settings: { theme: 'system' },
  };
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function list<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x.filter((i) => isRecord(i) && typeof i.id === 'string') as T[]) : [];
}

/** Garante que dados vindos do armazenamento ou de um backup tenham o formato esperado. */
export function normalize(raw: unknown): AppData {
  const d = isRecord(raw) ? raw : {};
  const base = emptyData();
  const settings = isRecord(d.settings) ? d.settings : {};
  const theme: Theme = settings.theme === 'light' || settings.theme === 'dark' ? settings.theme : 'system';
  return {
    ...base,
    tasks: list(d.tasks),
    transactions: list(d.transactions),
    habits: list(d.habits),
    notes: list(d.notes),
    events: list(d.events),
    settings: { theme },
  };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : emptyData();
  } catch {
    return emptyData();
  }
}

type Updater = (d: AppData) => AppData;

interface Store {
  data: AppData;
  update: (fn: Updater) => void;
  replace: (d: AppData) => void;
  saveError: boolean;
}

const StoreContext = createContext<Store | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load);
  const [saveError, setSaveError] = useState(false);
  const lastSaved = useRef<string | null>(null);

  useEffect(() => {
    const json = JSON.stringify(data);
    if (json === lastSaved.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, json);
      lastSaved.current = json;
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [data]);

  // Mantém abas diferentes do navegador sincronizadas.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null || e.newValue === lastSaved.current) return;
      try {
        lastSaved.current = e.newValue;
        setData(normalize(JSON.parse(e.newValue)));
      } catch {
        /* ignora valor corrompido */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((fn: Updater) => setData(fn), []);
  const replace = useCallback((d: AppData) => setData(d), []);

  return <StoreContext.Provider value={{ data, update, replace, saveError }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore precisa estar dentro de <DataProvider>');
  return s;
}
