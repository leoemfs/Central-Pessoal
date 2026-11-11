/**
 * N9.1 + N9.2: conta Google e sincronização automática pelo Drive (pasta escondida do app).
 *
 * - O login usa o Google Identity Services (só no navegador, sem servidor). O acesso vale ~1 hora;
 *   depois disso o app não abre janelas sozinho: aparece "Continuar sincronizando" (um toque).
 * - A situação da conexão é **deste aparelho** (localStorage), não vai nos dados nem no backup.
 * - Se outro aparelho salvou na nuvem, junta item por item (`mergeData`) antes de salvar.
 */
import { useSyncExternalStore } from 'react';
import type { AppData } from './types';
import { deleteAttachment, downloadAttachment, DRIVE_SCOPE, downloadData, findData, isAuthError, listAttachments, uploadAttachment, uploadData, whoAmI, type CloudFile } from './drive';
import { planFiles, referencedFiles } from './attachments';
import { loadFile, localFileIds, removeFile, saveFile } from './files';
import { normalize } from './data';
import { mergeData } from './sync';
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
/** Com o app aberto, confere a nuvem de tempos em tempos. */
const SYNC_EVERY = 5 * 60_000;

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
// Ficou "salvando" quando o app fechou, ou na escolha de cópia da v0.40 (o N9.2 junta sozinho): volta ao normal.
if (state && (state.status === 'salvando' || state.status === 'escolher')) state = { ...state, status: 'ok', cloud: null };
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

// ---------- sincronização ----------
let getData: () => AppData | null = () => null;
let mergeSink: (remote: AppData) => void = () => undefined;
/** A loja informa como ler os dados atuais e como juntar os que vieram da nuvem. */
export function setDataSource(read: () => AppData | null, merge: (remote: AppData) => void) {
  getData = read;
  mergeSink = merge;
}

let busy = false;
let again = false;
let timer: number | undefined;

function failed(e: unknown) {
  if (isAuthError(e)) {
    write(TOKEN_KEY, null);
    patch({ status: 'reconectar' });
  } else if (typeof navigator !== 'undefined' && navigator.onLine === false) patch({ status: 'offline' });
  else patch({ status: 'erro' });
}

/** Partes que não entram na comparação (a cópia da nuvem não precisa delas iguais). */
const comparable = (d: AppData) => JSON.stringify({ ...d, legacy: null });

/**
 * Sincroniza agora: se outro aparelho salvou na nuvem, junta item por item (N9.2) e, se este
 * aparelho tem algo que a nuvem não tem, salva a junção. Sem acesso válido, só abre a janela do
 * Google se `interactive` (veio de um toque).
 */
export async function syncNow(interactive = false): Promise<void> {
  if (!state || !getData()) return;
  if (busy) {
    again = true;
    return;
  }
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
  // Mudanças feitas durante a sincronização ficam para a próxima.
  const started = new Date().toISOString();
  try {
    const cloud = await findData(token);
    let toSave = getData()!;
    let upload = !cloud || hasUnsaved(toSave, state);
    if (cloud && cloud.modifiedTime !== state.lastCloudTime) {
      const remote = normalize(await downloadData(token, cloud.id));
      toSave = mergeData(toSave, remote);
      mergeSink(remote);
      upload = comparable(toSave) !== comparable(remote);
      patch({ lastCloudTime: cloud.modifiedTime });
    }
    if (upload) {
      const saved = await uploadData(token, JSON.stringify(toSave), state.device, cloud?.id ?? null);
      patch({ lastCloudTime: saved.modifiedTime });
    }
    // Fotos: um problema aqui não desfaz a sincronização dos dados (tenta de novo na próxima).
    await syncFiles(token, toSave).catch((e: unknown) => {
      if (isAuthError(e)) throw e;
    });
    patch({ status: 'ok', lastSavedAt: started, cloud: null });
  } catch (e) {
    failed(e);
  } finally {
    busy = false;
    if (again) {
      again = false;
      scheduleSave();
    }
  }
}

/** Até quantos arquivos sobem ou descem por vez (o resto vai na próxima sincronização). */
const FILES_PER_SYNC = 10;

/** N9.3: fotos. Sobe as que faltam na nuvem, baixa as que faltam aqui e apaga as excluídas. */
async function syncFiles(token: string, d: AppData) {
  const referenced = referencedFiles(d);
  const cloud = await listAttachments(token);
  const plan = planFiles(referenced, await localFileIds(), new Set(cloud.keys()), d.deleted);
  for (const id of plan.upload.slice(0, FILES_PER_SYNC)) {
    const blob = await loadFile(id);
    if (blob) await uploadAttachment(token, id, blob);
  }
  for (const id of plan.download.slice(0, FILES_PER_SYNC)) await saveFile(id, await downloadAttachment(token, cloud.get(id)!));
  for (const id of plan.deleteCloud) await deleteAttachment(token, cloud.get(id)!);
  for (const id of plan.deleteLocal) await removeFile(id);
  // Ficou algo para depois: continua em seguida.
  if (plan.upload.length > FILES_PER_SYNC || plan.download.length > FILES_PER_SYNC) again = true;
}

/** Mudou algo: sincroniza daqui a pouco (se estiver conectado). */
export function scheduleSave() {
  if (!state) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void syncNow(false), SAVE_DELAY);
}

/** Saindo do app: tenta salvar já o que estiver pendente. */
export function flushSave() {
  const d = getData();
  if (!state || !d || !hasUnsaved(d, state)) return;
  window.clearTimeout(timer);
  void syncNow(false);
}

let started = false;
/** App aberto: sincroniza agora, ao voltar para o app e a cada 5 minutos com ele aberto. */
export function startCloud() {
  if (started || typeof window === 'undefined') return;
  started = true;
  const visible = () => document.visibilityState === 'visible';
  void syncNow(false);
  document.addEventListener('visibilitychange', () => visible() && void syncNow(false));
  window.setInterval(() => visible() && void syncNow(false), SYNC_EVERY);
}

/** "Entrar com Google" (vem de um toque). Se já houver dados na nuvem, junta com os deste aparelho. */
export async function connect(): Promise<'ok' | 'cancelado' | 'erro'> {
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
    await syncNow(false);
    return state?.status === 'ok' ? 'ok' : 'erro';
  } catch (e) {
    failed(e);
    return 'erro';
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
