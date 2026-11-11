/**
 * N9.3: fotos (e depois PDFs) guardados à parte dos dados.
 * Os dados só têm a referência (`{ id, type, w, h }`); o arquivo fica no aparelho (IndexedDB) e,
 * com a conta Google ligada, no Drive (pasta escondida, `arquivo-<id>`).
 * Como a referência é um item com id, apagar a foto (ou o registro) entra nas exclusões e a
 * sincronização apaga o arquivo nos dois lugares.
 */
import type { AppData } from './types.ts';

/** Todos os arquivos que os dados usam. */
export function referencedFiles(d: AppData): Set<string> {
  const ids = new Set<string>();
  for (const e of d.journal) for (const p of e.photos) ids.add(p.id);
  return ids;
}

export interface FilePlan {
  /** Estão no aparelho e faltam na nuvem. */
  upload: string[];
  /** Estão na nuvem e faltam no aparelho. */
  download: string[];
  /** Foram excluídos: apagar na nuvem (id → id do Drive). */
  deleteCloud: string[];
  /** Foram excluídos: apagar do aparelho. */
  deleteLocal: string[];
}

/**
 * O que fazer com os arquivos numa sincronização.
 * Só apaga o que foi **excluído** (está em `deleted`): um arquivo que outro aparelho acabou de subir,
 * mas cujos dados ainda não chegaram aqui, não é apagado por engano.
 */
export function planFiles(referenced: Set<string>, local: Set<string>, cloud: Set<string>, deleted: Record<string, string>): FilePlan {
  const gone = (id: string) => !referenced.has(id) && id in deleted;
  return {
    upload: [...referenced].filter((id) => local.has(id) && !cloud.has(id)),
    download: [...referenced].filter((id) => cloud.has(id) && !local.has(id)),
    deleteCloud: [...cloud].filter(gone),
    deleteLocal: [...local].filter(gone),
  };
}
