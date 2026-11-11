/**
 * N9.3: arquivos (fotos) guardados no aparelho, à parte dos dados (IndexedDB, chave `arquivo:<id>`).
 * As telas leem com `useFileUrl`; quando a sincronização baixa um arquivo, as telas são avisadas.
 */
import { useEffect, useState } from 'react';
import { dbDelete, dbGet, dbKeys, dbSet } from './db';

const PREFIX = 'arquivo:';
/** Lado maior das fotos (px): boa para ver no celular e leve para o Drive. */
const MAX_SIDE = 1600;

const listeners = new Set<(id: string) => void>();
const urls = new Map<string, string>();

export async function saveFile(id: string, blob: Blob): Promise<void> {
  await dbSet(PREFIX + id, blob);
  listeners.forEach((fn) => fn(id));
}

export async function loadFile(id: string): Promise<Blob | null> {
  const b = await dbGet<Blob>(PREFIX + id).catch(() => undefined);
  return b instanceof Blob ? b : null;
}

export async function removeFile(id: string): Promise<void> {
  await dbDelete(PREFIX + id);
  const url = urls.get(id);
  if (url) URL.revokeObjectURL(url);
  urls.delete(id);
}

/** Ids dos arquivos guardados neste aparelho. */
export async function localFileIds(): Promise<Set<string>> {
  return new Set((await dbKeys(PREFIX)).map((k) => k.slice(PREFIX.length)));
}

/** Endereço para mostrar o arquivo; null enquanto não está no aparelho (ainda vai baixar). */
export function useFileUrl(id: string): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(() => urls.get(id));
  useEffect(() => {
    let alive = true;
    const load = () =>
      loadFile(id).then((b) => {
        if (!alive) return;
        if (!b) return setUrl(null);
        const u = urls.get(id) ?? URL.createObjectURL(b);
        urls.set(id, u);
        setUrl(u);
      });
    if (!urls.has(id)) void load();
    const on = (changed: string) => changed === id && void load();
    listeners.add(on);
    return () => {
      alive = false;
      listeners.delete(on);
    };
  }, [id]);
  return url;
}

/** Reduz a foto (lado maior 1600 px, JPEG) antes de guardar. */
export async function shrinkImage(file: Blob): Promise<{ blob: Blob; w: number; h: number }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('foto'))), 'image/jpeg', 0.82));
  return { blob, w, h };
}

/** Apaga do aparelho os arquivos de fotos excluídas (vale também sem conta Google). */
export async function cleanFiles(referenced: Set<string>, deleted: Record<string, string>): Promise<void> {
  for (const id of await localFileIds()) if (!referenced.has(id) && id in deleted) await removeFile(id);
}
