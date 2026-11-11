/**
 * N9.1: conversa com a API do Google Drive (v3), na pasta escondida do app (`appDataFolder`).
 * Só regras e chamadas HTTP: o login fica em `googleAuth.ts` e a tela em Configurações.
 * O `fetch` é recebido de fora para os testes poderem simular o Drive.
 */

/** Só a pasta do app: não dá acesso ao resto do Drive. */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
export const DATA_FILE = 'dados.json';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FIELDS = 'id,modifiedTime,size,appProperties';

type Fetch = typeof fetch;

/** A cópia dos dados que está no Drive. */
export interface CloudFile {
  id: string;
  /** Data do Drive (serve para saber se outro aparelho salvou depois). */
  modifiedTime: string;
  /** Aparelho que salvou por último. */
  device: string;
  size: number;
}

export class DriveError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** 401: o acesso venceu (precisa entrar de novo). */
export const isAuthError = (e: unknown) => e instanceof DriveError && e.status === 401;

async function call(f: Fetch, token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await f(url, { ...init, headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new DriveError(res.status, `Drive respondeu ${res.status}`);
  return res;
}

function toCloud(x: Record<string, unknown>): CloudFile {
  const props = (x.appProperties ?? {}) as Record<string, string>;
  return { id: String(x.id), modifiedTime: String(x.modifiedTime ?? ''), device: props.device ?? '', size: Number(x.size ?? 0) };
}

/** Procura a cópia dos dados; null se ainda não existe. */
export async function findData(token: string, f: Fetch = fetch): Promise<CloudFile | null> {
  const q = encodeURIComponent(`name = '${DATA_FILE}' and trashed = false`);
  const res = await call(f, token, `${API}/files?spaces=appDataFolder&q=${q}&orderBy=modifiedTime desc&pageSize=1&fields=files(${FIELDS})`);
  const body = (await res.json()) as { files?: Record<string, unknown>[] };
  return body.files?.length ? toCloud(body.files[0]) : null;
}

export async function downloadData(token: string, id: string, f: Fetch = fetch): Promise<unknown> {
  const res = await call(f, token, `${API}/files/${encodeURIComponent(id)}?alt=media`);
  return res.json();
}

/** Cria (sem `existingId`) ou substitui a cópia dos dados. */
export async function uploadData(token: string, json: string, device: string, existingId: string | null, f: Fetch = fetch): Promise<CloudFile> {
  const boundary = `central${Date.now().toString(36)}`;
  const meta = existingId ? { appProperties: { device } } : { name: DATA_FILE, parents: ['appDataFolder'], mimeType: 'application/json', appProperties: { device } };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${json}\r\n--${boundary}--`;
  const url = existingId
    ? `${UPLOAD}/files/${encodeURIComponent(existingId)}?uploadType=multipart&fields=${FIELDS}`
    : `${UPLOAD}/files?uploadType=multipart&fields=${FIELDS}`;
  const res = await call(f, token, url, { method: existingId ? 'PATCH' : 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
  return toCloud((await res.json()) as Record<string, unknown>);
}

/** Nome e e-mail da conta, para mostrar em Configurações. */
export async function whoAmI(token: string, f: Fetch = fetch): Promise<{ email: string; name: string }> {
  const res = await call(f, token, `${API}/about?fields=user(emailAddress,displayName)`);
  const body = (await res.json()) as { user?: { emailAddress?: string; displayName?: string } };
  return { email: body.user?.emailAddress ?? '', name: body.user?.displayName ?? '' };
}

// ---------- N9.3: arquivos (fotos) ----------

/** Nome do arquivo no Drive para o id do app. */
export const attachmentName = (id: string) => `arquivo-${id}`;

/** Arquivos guardados na pasta do app: id do app → id do Drive. */
export async function listAttachments(token: string, f: Fetch = fetch): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const q = encodeURIComponent("name contains 'arquivo-' and trashed = false");
  let page = '';
  do {
    const res = await call(f, token, `${API}/files?spaces=appDataFolder&q=${q}&pageSize=1000&fields=nextPageToken,files(id,name)${page ? `&pageToken=${encodeURIComponent(page)}` : ''}`);
    const body = (await res.json()) as { files?: { id: string; name: string }[]; nextPageToken?: string };
    for (const x of body.files ?? []) if (x.name.startsWith('arquivo-')) out.set(x.name.slice('arquivo-'.length), x.id);
    page = body.nextPageToken ?? '';
  } while (page);
  return out;
}

export async function uploadAttachment(token: string, id: string, blob: Blob, f: Fetch = fetch): Promise<string> {
  const boundary = `central${Date.now().toString(36)}`;
  const meta = { name: attachmentName(id), parents: ['appDataFolder'], mimeType: blob.type || 'application/octet-stream' };
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${meta.mimeType}\r\n\r\n`,
    blob,
    `\r\n--${boundary}--`,
  ]);
  const res = await call(f, token, `${UPLOAD}/files?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
  return String(((await res.json()) as { id: string }).id);
}

export async function downloadAttachment(token: string, driveId: string, f: Fetch = fetch): Promise<Blob> {
  const res = await call(f, token, `${API}/files/${encodeURIComponent(driveId)}?alt=media`);
  return res.blob();
}

export async function deleteAttachment(token: string, driveId: string, f: Fetch = fetch): Promise<void> {
  await call(f, token, `${API}/files/${encodeURIComponent(driveId)}`, { method: 'DELETE' });
}
