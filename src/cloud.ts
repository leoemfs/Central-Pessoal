/**
 * N9.1: conta Google e cópia automática dos dados no Drive (pasta escondida do app).
 *
 * - O login usa o Google Identity Services (só no navegador, sem servidor). O acesso vale ~1 hora;
 *   depois disso o app não abre janelas sozinho: a cópia para e aparece "Continuar salvando" (um toque).
 * - A situação da conexão é **deste aparelho** (localStorage), não vai nos dados nem no backup.
 * - Antes de salvar por cima, confere se outro aparelho salvou depois (`decide`). Se sim, pergunta
 *   qual fica (a junção automática chega no N9.2).
 */
import { useSyncExternalStore } from 'react';
import type { AppData } from './types';
import { DRIVE_SCOPE, decide, downloadData, findData, isAuthError, uploadData, whoAmI, type CloudFile } from './drive';
import { uid } from './utils';

/**
 * ID do cliente OAuth (Google Cloud Console › Clientes, termina em .apps.googleusercontent.com).
 * Não é segredo: vai no código do site. Vazio = o cartão "Conta Google" não aparece.
 */
const CLIENT_ID = '997356157870-6pk11auqsjpliq8eth7o3vp3tdcpeo7k.apps.googleusercontent.com';
export const GOOGLE_CLIENT_ID: string = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || CLIENT_ID;

const STATE_KEY = 'central-pessoal:google';
const TOKEN_KEY = 'central-pessoal:google-token';
/** Espera depois da última mudança antes de salvar (agrupa digitação). */
const SAVE_DELAY = 15_000;

export type CloudStatus = 'ok' | 'salvando' | 'reconectar' | 'escolher' | 'offline' | 'erro';

export interface CloudState {
  email: string;
  name: string;
  /** Id deste aparelho (para saber quem salvou por último). */
  device: string;
  /** Quando este aparelho salvou (ou trouxe) a cópia pela última vez. */
  lastSavedAt: string | null;
  /** Data do Drive da cópia que este aparelho conhece (a que salvou ou trouxe). */
  lastCloudTime: string | null;
  status: CloudStatus;
  /** Com status 'escolher': a cópia que está na nuvem. */
  cloud: CloudFile | null;
}

// ---------- estado (com aviso para as telas) ----------
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sem armazenamento: segue só na memória */
  }
}

let state: CloudState | null = read<CloudState>(STATE_KEY);
// Ficou "salvando" quando o app fechou: volta ao normal.
if (state && state.status === 'salvando') state = { ...state, status: 'ok' };
const listeners = new Set<() => void>();

function set(next: CloudState | null) {
  state = next;
  write(STATE_KEY, next);
  listeners.forEach((fn) => fn());
}
const patch = (p: Partial<CloudState>) => state && set({ ...state, ...p });

export function useCloud(): CloudState | null {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => state,
  );
}

/** Há mudanças depois da última cópia na nuvem? */
export function hasUnsaved(d: AppData, s: CloudState | null): boolean {
  if (!s) return false;
  if (!s.lastSavedAt) return true;
  const last = s.lastSavedAt;
  return Object.values(d.stamps).some((t) => t > last);
}

// ---------- login (Google Identity Services) ----------
interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}
interface Gis {
  accounts: {
    oauth2: {
      initTokenClient(cfg: {
        client_id: string;
        scope: string;
        callback: (r: TokenResponse) => void;
        error_callback?: (e: { type: string }) => void;
      }): { requestAccessToken(o?: { prompt?: string; login_hint?: string }): void };
      revoke(token: string, done?: () => void): void;
    };
  };
}
declare global {
  interface Window {
    google?: Gis;
  }
}

let gisPromise: Promise<Gis> | null = null;
/** Carrega o script do Google (uma vez). Chamar antes do toque, para a janela abrir na hora. */
export function loadGis(): Promise<Gis> {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google);
  if (!gisPromise) {
    gisPromise = new Promise<Gis>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => (window.google?.accounts?.oauth2 ? resolve(window.google) : reject(new Error('Google indisponível')));
      s.onerror = () => reject(new Error('Sem conexão com o Google'));
      document.head.appendChild(s);
    });
    gisPromise.catch(() => (gisPromise = null));
  }
  return gisPromise;
}

/** Acesso guardado e ainda válido (com 1 minuto de folga), ou null. */
function storedToken(): string | null {
  const t = read<{ token: string; exp: number }>(TOKEN_KEY);
  return t && t.exp > Date.now() + 60_000 ? t.token : null;
}

/** Abre a janela do Google (precisa vir de um toque). */
async function askToken(): Promise<string> {
  const gis = await loadGis();
  return new Promise<string>((resolve, reject) => {
    const client = gis.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(new Error(r.error || 'sem acesso'));
        write(TOKEN_KEY, { token: r.access_token, exp: Date.now() + (r.expires_in ?? 3600) * 1000 });
        resolve(r.access_token);
      },
      error_callback: (e) => reject(new Error(e.type)),
    });
    client.requestAccessToken({ prompt: state ? '' : 'consent', login_hint: state?.email || undefined });
  });
}

// ---------- cópia na nuvem ----------
let getData: () => AppData | null = () => null;
/** A loja informa como ler os dados atuais. */
export function setDataSource(fn: () => AppData | null) {
  getData = fn;
}

let busy = false;
let timer: number | undefined;

function failed(e: unknown) {
  if (isAuthError(e)) {
    write(TOKEN_KEY, null);
    patch({ status: 'reconectar' });
  } else if (typeof navigator !== 'undefined' && navigator.onLine === false) patch({ status: 'offline' });
  else patch({ status: 'erro' });
}

/** Salva agora. Sem acesso válido: só abre a janela do Google se `interactive` (veio de um toque). */
export async function saveNow(interactive = false, force = false): Promise<void> {
  const d = getData();
  if (!state || !d || busy) return;
  if (state.status === 'escolher' && !force) return;
  let token = storedToken();
  if (!token) {
    if (!interactive) return void patch({ status: 'reconectar' });
    try {
      token = await askToken();
    } catch {
      return; // a pessoa fechou a janela: fica como estava
    }
  }
  busy = true;
  patch({ status: 'salvando' });
  try {
    const cloud = await findData(token);
    if (!force && decide(cloud, state.lastCloudTime) === 'escolher') {
      patch({ status: 'escolher', cloud });
      return;
    }
    const saved = await uploadData(token, JSON.stringify(getData() ?? d), state.device, cloud?.id ?? null);
    patch({ status: 'ok', lastSavedAt: new Date().toISOString(), lastCloudTime: saved.modifiedTime, cloud: null });
  } catch (e) {
    failed(e);
  } finally {
    busy = false;
  }
}

/** Mudou algo: salva daqui a pouco (se estiver conectado). */
export function scheduleSave() {
  if (!state || state.status === 'escolher') return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void saveNow(false), SAVE_DELAY);
}

/** Saindo do app: tenta salvar já o que estiver pendente. */
export function flushSave() {
  const d = getData();
  if (!state || !d || !hasUnsaved(d, state)) return;
  window.clearTimeout(timer);
  void saveNow(false);
}

/** "Entrar com Google" (vem de um toque). */
export async function connect(): Promise<'ok' | 'escolher' | 'cancelado' | 'erro'> {
  let token: string;
  try {
    token = await askToken();
  } catch {
    return 'cancelado';
  }
  try {
    const who = await whoAmI(token);
    const device = state?.device || uid();
    set({ email: who.email, name: who.name, device, lastSavedAt: null, lastCloudTime: null, status: 'ok', cloud: null });
    await saveNow(false);
    return state?.status === 'escolher' ? 'escolher' : state?.status === 'ok' ? 'ok' : 'erro';
  } catch (e) {
    failed(e);
    return 'erro';
  }
}

/** Escolha "Manter a deste aparelho": salva por cima da cópia da nuvem. */
export const keepThisDevice = () => saveNow(true, true);

/** Escolha "Usar a da nuvem" ou "Trazer da nuvem": baixa os dados (quem chama troca os dados do app). */
export async function fetchCloud(): Promise<unknown | null> {
  if (!state) return null;
  let token = storedToken();
  try {
    token ??= await askToken();
  } catch {
    return null;
  }
  try {
    const cloud = await findData(token);
    if (!cloud) return null;
    const raw = await downloadData(token, cloud.id);
    // Os dados trazidos passam a ser a referência: a próxima cópia salva por cima sem perguntar.
    patch({ status: 'ok', lastCloudTime: cloud.modifiedTime, lastSavedAt: new Date().toISOString(), cloud: null });
    return raw;
  } catch (e) {
    failed(e);
    return null;
  }
}

/** Sair da conta: os dados ficam no aparelho; só para de salvar na nuvem. */
export function disconnect() {
  const token = storedToken();
  window.clearTimeout(timer);
  write(TOKEN_KEY, null);
  set(null);
  if (token) window.google?.accounts.oauth2.revoke(token);
}

// A internet voltou: tenta salvar o que ficou esperando.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (state?.status === 'offline' || state?.status === 'erro') {
      patch({ status: 'ok' });
      scheduleSave();
    }
  });
}
