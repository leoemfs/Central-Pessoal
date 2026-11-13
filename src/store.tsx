import { syncCareerEvents } from './carreira';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppData } from './types';
import { normalize } from './data';
import { FIXA_AHEAD, materialize } from './finance';
import { checkUnlock, markActive, markVisit } from './journey';
import { INCOME_AHEAD, materializeIncomes } from './incomes';
import { materializeVouchers } from './vouchers';
import { dbGet, dbGetNewest, dbSet, requestPersistence } from './db';
import { addMonths, monthKey, todayISO } from './utils';
import { mergeData, pruneDeleted, trackChanges } from './sync';
import { flushSave, scheduleSave, setDataSource, startCloud } from './cloud';
import { cleanFiles } from './files';
import { referencedFiles } from './attachments';

const KEY = 'data';
const LEGACY_LOCALSTORAGE_KEY = 'central-pessoal:v1';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('central-pessoal') : null;

/** Gera as contas fixas que já deveriam existir (ex.: virou o mês com o app aberto) e registra a visita do dia. */
const generate = (d: AppData) =>
  syncCareerEvents(markVisit(checkUnlock(materializeVouchers(materializeIncomes(materialize(d, addMonths(monthKey(todayISO()), FIXA_AHEAD)), addMonths(monthKey(todayISO()), INCOME_AHEAD))))));
/** Igual, registrando as datas de alteração e as exclusões (N9.0). */
const catchUp = (d: AppData) => trackChanges(d, generate(d));

async function loadData(): Promise<AppData> {
  // C4: se a última gravação foi para a reserva, ela é a mais nova e vale ela.
  let { value: raw } = await dbGetNewest<unknown>(KEY);
  if (raw === undefined) {
    // Primeira vez nesta versão: traz os dados do protótipo (localStorage), se houver.
    try {
      const old = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
      if (old) raw = JSON.parse(old);
    } catch {
      /* ignora */
    }
  }
  return catchUp(pruneDeleted(normalize(raw)));
}

type Updater = (d: AppData) => AppData;
export type SaveProblem = null | 'reserva' | 'falhou';

interface Store {
  data: AppData;
  update: (fn: Updater) => void;
  replace: (d: AppData) => void;
  /** C4: 'reserva' = salvo só na cópia de reserva; 'falhou' = não salvou em lugar nenhum. */
  saveError: SaveProblem;
  persisted: boolean;
}

const StoreContext = createContext<Store | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [saveError, setSaveError] = useState<SaveProblem>(null);
  const [persisted, setPersisted] = useState(false);
  const fromOtherTab = useRef(false);
  const pending = useRef<AppData | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    loadData()
      .then(setData)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e : new Error(String(e))));
    requestPersistence().then(setPersisted);
  }, []);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const d = pending.current;
    if (!d) return;
    pending.current = null;
    dbSet(KEY, d)
      .then((where) => {
        setSaveError(where === 'reserva' ? 'reserva' : null);
        channel?.postMessage('saved');
        // N9.3: fotos excluídas saem do aparelho.
        cleanFiles(referencedFiles(d), d.deleted).catch(() => undefined);
      })
      .catch(() => setSaveError('falhou'));
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
    // N9.1: cópia na nuvem, alguns segundos depois da última mudança (se a conta Google estiver ligada).
    scheduleSave();
  }, [data, flush]);

  // A cópia na nuvem lê sempre os dados mais recentes.
  const latest = useRef<AppData | null>(null);
  latest.current = data;
  // N9.2: o que veio da nuvem é juntado com os dados mais atuais deste aparelho, sem mudar as datas
  // de alteração (só o que as regras geram depois da junção ganha data nova).
  useEffect(() => {
    setDataSource(
      () => latest.current,
      (remote) =>
        setData((prev) => {
          if (!prev) return prev;
          const merged = mergeData(prev, remote);
          return trackChanges(merged, generate(merged));
        }),
    );
  }, []);
  useEffect(() => {
    if (data) startCloud();
  }, [data]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== 'hidden') return;
      flush();
      flushSave();
    };
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

  // Toda alteração feita pela pessoa conta o dia como "dia de uso" (para desbloquear a Jornada).
  const update = useCallback(
    (fn: Updater) =>
      setData((d) => {
        if (!d) return d;
        const next = fn(d);
        return next === d ? d : trackChanges(d, checkUnlock(markActive(next)));
      }),
    [],
  );
  // Backup restaurado: o que não está nele conta como excluído; o que está, como alterado agora.
  const replace = useCallback((d: AppData) => setData((prev) => (prev ? trackChanges(prev, generate({ ...d, deleted: { ...prev.deleted, ...d.deleted } })) : catchUp(d))), []);

  // Os dados não abriram: a rede de proteção (ErrorBoundary) mostra a saída.
  if (loadError) throw loadError;
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
