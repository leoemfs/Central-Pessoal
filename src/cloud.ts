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
import { CALENDAR_DAYS, diffEvents, wantedEvents } from './calendarSync';
import { createTask, deleteList, deleteTask, ensureList, listTasks, TASKS_SCOPE, updateTask } from './gtasks';
import { applyToApp, planTasks } from './tasksSync';
import { CALENDAR_SCOPE, calendarExists, createCalendar, deleteCalendar, deleteEvent, insertEvent, listEvents, updateEvent } from './gcal';
import { addDays, todayISO } from './utils';
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
  /** N9.5, neste aparelho: 'ok', 'permissao' (falta dar acesso à agenda neste aparelho) ou 'erro'. */
  calendar?: 'ok' | 'permissao' | 'erro';
  /** Última vez que a agenda foi atualizada por este aparelho. */
  calendarAt?: string | null;
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
  /** Permissões dadas (separadas por espaço). */
  scope?: string;
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

interface StoredToken {
  token: string;
  exp: number;
  scope?: string;
}
/** Acesso guardado e ainda válido (com 1 minuto de folga), ou null. */
function storedToken(): string | null {
  const t = read<StoredToken>(TOKEN_KEY);
  return t && t.exp > Date.now() + 60_000 ? t.token : null;
}
const tokenHas = (scope: string) => (read<StoredToken>(TOKEN_KEY)?.scope ?? '').split(' ').includes(scope);
/** O acesso guardado inclui a agenda (N9.5)? */
const tokenHasCalendar = () => tokenHas(CALENDAR_SCOPE);
/** O acesso guardado inclui o Google Tarefas (N9.6)? */
const tokenHasTasks = () => tokenHas(TASKS_SCOPE);
/** Lembretes no Google Agenda ligados (configuração que vale para todos os aparelhos)? */
const calendarOn = () => getData()?.settings.googleCalendar.on === true;

/** Abre a janela do Google (precisa vir de um toque). Com a agenda ligada, pede as duas permissões. */
async function askToken(withCalendar = calendarOn()): Promise<string> {
  const gis = await loadGis();
  return new Promise<string>((resolve, reject) => {
    const client = gis.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: withCalendar ? `${DRIVE_SCOPE} ${CALENDAR_SCOPE} ${TASKS_SCOPE}` : DRIVE_SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(new Error(r.error || 'sem acesso'));
        write(TOKEN_KEY, { token: r.access_token, exp: Date.now() + (r.expires_in ?? 3600) * 1000, scope: r.scope ?? '' });
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
    // N9.5: lembretes no Google Agenda (um problema aqui também não desfaz a sincronização).
    await syncCalendar(token, toSave).catch(() => patch({ calendar: 'erro' }));
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

/** Muda a configuração da agenda, com data de alteração (para valer nos outros aparelhos). */
function withCalendar(d: AppData, p: Partial<AppData['settings']['googleCalendar']>): AppData {
  const now = new Date().toISOString();
  return { ...d, settings: { ...d.settings, googleCalendar: { ...d.settings.googleCalendar, ...p } }, stamps: { ...d.stamps, '@settings': now, '@settings.googleCalendar': now } };
}

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

/** Agenda "Central Pessoal": acha a guardada ou cria (e guarda o id nas configurações). */
async function ensureCalendar(token: string, d: AppData): Promise<string> {
  const saved = d.settings.googleCalendar.calendarId;
  if (saved && (await calendarExists(token, saved))) return saved;
  const id = await createCalendar(token, timeZone());
  mergeSink(withCalendar(d, { calendarId: id }));
  return id;
}

/** N9.5 + N9.6: agenda "CP Hub" (só de ida) e lista "CP Hub" do Google Tarefas (ida e volta). */
async function syncCalendar(token: string, d: AppData) {
  const g = d.settings.googleCalendar;
  if (!g.on) return;
  let missing = false;
  if (tokenHasCalendar()) await syncEvents(token, d);
  else missing = true;
  if (g.tasks) {
    if (tokenHasTasks()) await syncTasks(token, d);
    else missing = true;
  }
  patch({ calendar: missing ? 'permissao' : 'ok', calendarAt: new Date().toISOString() });
}

/** N9.6: tarefas ↔ Google Tarefas. */
async function syncTasks(token: string, d: AppData) {
  const listId = await ensureList(token, d.settings.googleCalendar.tasksList);
  if (listId !== d.settings.googleCalendar.tasksList) mergeSink(withCalendar(d, { tasksList: listId }));
  const google = await listTasks(token, listId);
  const cur = getData() ?? d;
  const plan = planTasks(cur, google);
  for (const t of plan.create) await createTask(token, listId, t);
  for (const u of plan.update) await updateTask(token, listId, u.id, u.task);
  for (const id of plan.remove) await deleteTask(token, listId, id);
  const fromGoogle = applyToApp(getData() ?? cur, plan);
  if (fromGoogle) mergeSink(fromGoogle);
}

/** N9.5: deixa a agenda "CP Hub" igual ao que o app tem (só de ida). */
async function syncEvents(token: string, d: AppData) {
  const calId = await ensureCalendar(token, d);
  const today = todayISO();
  const tz = timeZone();
  const wanted = wantedEvents(d, today);
  const existing = await listEvents(token, calId, new Date(`${today}T00:00:00`).toISOString(), new Date(`${addDays(today, CALENDAR_DAYS + 1)}T00:00:00`).toISOString());
  const plan = diffEvents(wanted, existing);
  for (const w of plan.insert) await insertEvent(token, calId, w, tz);
  for (const w of plan.update) await updateEvent(token, calId, w, tz);
  for (const id of plan.remove) await deleteEvent(token, calId, id);
}

/** Liga os lembretes no Google Agenda (vem de um toque: pede a permissão nova). */
export async function enableCalendar(): Promise<'ok' | 'cancelado' | 'erro'> {
  const d = getData();
  if (!state || !d) return 'erro';
  let token: string;
  try {
    token = await askToken(true);
  } catch {
    return 'cancelado';
  }
  if (!tokenHasCalendar()) return 'cancelado'; // a pessoa desmarcou a agenda na janela do Google
  try {
    const calId = await ensureCalendar(token, d);
    const cur = getData() ?? d;
    mergeSink(withCalendar(cur, { on: true, calendarId: calId }));
    patch({ calendar: 'ok' });
    // A configuração entra nos dados no próximo instante; sincroniza logo depois.
    window.setTimeout(() => void syncNow(false), 300);
    return 'ok';
  } catch {
    patch({ calendar: 'erro' });
    return 'erro';
  }
}

/** Desliga os lembretes; com `removeCalendar`, apaga a agenda "Central Pessoal" do Google. */
export async function disableCalendar(removeCalendar: boolean): Promise<void> {
  const d = getData();
  if (!d) return;
  const calId = d.settings.googleCalendar.calendarId;
  const listId = d.settings.googleCalendar.tasksList;
  if (removeCalendar && (calId || listId)) {
    try {
      const token = storedToken() && tokenHasCalendar() ? storedToken()! : await askToken(true);
      if (calId) await deleteCalendar(token, calId);
      if (listId && tokenHasTasks()) await deleteList(token, listId);
    } catch {
      /* ficam lá; dá para apagar no Google */
    }
  }
  mergeSink(withCalendar(d, { on: false, calendarId: removeCalendar ? null : calId, tasksList: removeCalendar ? null : listId }));
  patch({ calendar: undefined, calendarAt: null });
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
