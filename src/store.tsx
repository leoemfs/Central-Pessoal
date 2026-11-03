import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppData } from './types';
import { normalize } from './data';
import { FIXA_AHEAD, materialize } from './finance';
import { dbGet, dbSet, requestPersistence } from './db';
import { addMonths, monthKey, todayISO } from './utils';

const KEY = 'data';
const LEGACY_LOCALSTORAGE_KEY = 'central-pessoal:v1';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('central-pessoal') : null;

/** Gera as contas fixas que já deveriam existir (ex.: virou o mês com o app aberto). */
const catchUp = (d: AppData) => materialize(d, addMonths(monthKey(todayISO()), FIXA_AHEAD));

async function loadData(): Promise<AppData> {
  let raw = await dbGet<unknown>(KEY);
  if (raw === undefined) {
    // Primeira vez nesta versão: traz os dados do protótipo (localStorage), se houver.
    try {
      const old = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
      if (old) raw = JSON.parse(old);
    } catch {
      /* ignora */
    }
  }
  return catchUp(normalize(raw));
}

type Updater = (d: AppData) => AppData;

interface Store {
  data: AppData;
  update: (fn: Updater) => void;
  replace: (d: AppData) => void;
  saveError: boolean;
  persisted: boolean;
}

const StoreContext = createContext<Store | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [persisted, setPersisted] = useState(false);
  const fromOtherTab = useRef(false);
  const pending = useRef<AppData | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    loadData().then(setData);
    requestPersistence().then(setPersisted);
  }, []);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const d = pending.current;
    if (!d) return;
    pending.current = null;
    dbSet(KEY, d)
      .then(() => {
        setSaveError(false);
        channel?.postMessage('saved');
      })
      .catch(() => setSaveError(true));
  }, []);

  // Salva com um pequeno atraso para agrupar alterações seguidas (ex.: digitação numa nota).
  useEffect(() => {
    if (!data) return;
    if (fromOtherTab.current) {
      fromOtherTab.current = false;
      return;
    }
    pending.current = data;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 250);
  }, [data, flush]);

  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush();
    const onShow = () => document.visibilityState === 'visible' && setData((d) => (d ? catchUp(d) : d));
    document.addEventListener('visibilitychange', onHide);
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener('pagehide', flush);
    // Outra aba salvou: recarrega.
    const onMessage = () =>
      dbGet<unknown>(KEY).then((raw) => {
        if (raw === undefined) return;
        fromOtherTab.current = true;
        setData(normalize(raw));
      });
    channel?.addEventListener('message', onMessage);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      document.removeEventListener('visibilitychange', onShow);
      window.removeEventListener('pagehide', flush);
      channel?.removeEventListener('message', onMessage);
    };
  }, [flush]);

  const update = useCallback((fn: Updater) => setData((d) => (d ? fn(d) : d)), []);
  const replace = useCallback((d: AppData) => setData(catchUp(d)), []);

  if (!data) {
    return (
      <div className="splash" aria-busy="true">
        <img src="./icon.svg" alt="" width={56} height={56} />
      </div>
    );
  }
  return <StoreContext.Provider value={{ data, update, replace, saveError, persisted }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore precisa estar dentro de <DataProvider>');
  return s;
}
