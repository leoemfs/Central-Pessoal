/**
 * M40: coleções na Biblioteca.
 * Uma coleção agrupa itens da Biblioteca do mesmo assunto e recolhe/expande.
 * Itens: `a:<id da área>` (área do app, da pessoa ou de um curso com área própria)
 *     e `c:<id do curso>` (curso importado dentro de uma área do app, ex.: o de Claude em Inteligência artificial).
 * Cada item fica em uma coleção por vez; o que não está em nenhuma aparece em "Outras áreas".
 * Excluir uma coleção nunca apaga nada: os itens só voltam para "Outras áreas".
 */
import type { StudyCollection, StudyData } from './types.ts';
import { listCourses } from './curso.ts';
import type { Library } from './estudos.ts';
import { uid } from './utils.ts';

export interface LibItem {
  key: string;
  name: string;
  /** Ícone (nome em ui.tsx). */
  icon: string;
  course: boolean;
  mine: boolean;
  themes: number;
  tracks: number;
  topics: number;
  /** Para onde o toque leva (sem o "#/"). */
  to: string;
}

/** Tudo o que pode entrar numa coleção, na ordem da Biblioteca (áreas visíveis, depois cursos dentro de áreas do app). */
export function libraryItems(study: StudyData, lib: Library): LibItem[] {
  const out: LibItem[] = [];
  const courses = listCourses(study);
  for (const a of lib.areas) {
    if (study.archived.includes(a.id)) continue;
    const trs = lib.tracks.filter((t) => t.areaId === a.id);
    const ownCourse = a.id.startsWith('pk-') && courses.some((c) => `pk-${c.id}` === a.id);
    out.push({ key: `a:${a.id}`, name: a.name, icon: ownCourse ? 'cap' : a.icon, course: ownCourse, mine: a.mine, themes: a.themes.length, tracks: trs.length, topics: trs.reduce((s, t) => s + t.topics.length, 0), to: `estudos/area/${a.id}` });
  }
  for (const c of courses) {
    const themes = study.themes.filter((t) => t.id.startsWith(`pk-${c.id}-t-`));
    if (!themes.length) continue;
    const areaId = themes[0].areaId;
    // Curso com área própria já aparece como a área; arquivado some junto com a área.
    if (areaId === `pk-${c.id}` || study.archived.includes(areaId)) continue;
    const trs = lib.tracks.filter((t) => t.id.startsWith(`pk-${c.id}-tr-`));
    out.push({ key: `c:${c.id}`, name: c.name, icon: 'cap', course: true, mine: true, themes: themes.length, tracks: trs.length, topics: trs.reduce((s, t) => s + t.topics.length, 0), to: themes.length === 1 ? `estudos/tema/${themes[0].id}` : `estudos/area/${areaId}` });
  }
  return out;
}

/** Monta a tela: cada coleção com seus itens (na ordem escolhida) e o que sobrou, em "Outras áreas". */
export function groupLibrary(cols: StudyCollection[], items: LibItem[]): { groups: { col: StudyCollection; items: LibItem[] }[]; loose: LibItem[] } {
  const byKey = new Map(items.map((i) => [i.key, i]));
  const used = new Set<string>();
  const groups = cols.map((col) => ({
    col,
    items: col.items
      .filter((k) => byKey.has(k) && !used.has(k) && (used.add(k), true))
      .map((k) => byKey.get(k)!),
  }));
  return { groups, loose: items.filter((i) => !used.has(i.key)) };
}

export function newCollection(name: string, items: string[] = []): StudyCollection {
  return { id: uid(), name: name.trim() || 'Nova coleção', open: true, items: [...new Set(items)] };
}

/** Define o que fica na coleção. Item que estava em outra coleção sai de lá (um lugar só). */
export function setItems(cols: StudyCollection[], id: string, keys: string[]): { cols: StudyCollection[]; moved: number } {
  const want = new Set(keys);
  let moved = 0;
  const next = cols.map((c) => {
    if (c.id === id) return { ...c, open: true, items: [...c.items.filter((k) => want.has(k)), ...keys.filter((k) => !c.items.includes(k))] };
    const kept = c.items.filter((k) => !want.has(k));
    moved += c.items.length - kept.length;
    return kept.length === c.items.length ? c : { ...c, items: kept };
  });
  return { cols: next, moved };
}

/** Leva um item para outra coleção (ou para nenhuma, com `to = null`), no fim da lista. */
export function placeItem(cols: StudyCollection[], key: string, to: string | null): StudyCollection[] {
  return cols.map((c) => {
    const has = c.items.includes(key);
    if (c.id === to) return has ? c : { ...c, items: [...c.items, key] };
    return has ? { ...c, items: c.items.filter((k) => k !== key) } : c;
  });
}

const swap = <T,>(list: T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const out = [...list];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

export const moveCollection = (cols: StudyCollection[], id: string, dir: -1 | 1) => swap(cols, cols.findIndex((c) => c.id === id), dir);

/** Sobe ou desce um item dentro da coleção, pulando os que não aparecem (ex.: área arquivada). */
export function moveItem(cols: StudyCollection[], id: string, key: string, dir: -1 | 1, visible: Set<string>): StudyCollection[] {
  return cols.map((c) => {
    if (c.id !== id) return c;
    const i = c.items.indexOf(key);
    let j = i + dir;
    while (j >= 0 && j < c.items.length && !visible.has(c.items[j])) j += dir;
    if (i < 0 || j < 0 || j >= c.items.length) return c;
    const items = [...c.items];
    [items[i], items[j]] = [items[j], items[i]];
    return { ...c, items };
  });
}

export const renameCollection = (cols: StudyCollection[], id: string, name: string) => cols.map((c) => (c.id === id && name.trim() ? { ...c, name: name.trim() } : c));
export const toggleCollection = (cols: StudyCollection[], id: string) => cols.map((c) => (c.id === id ? { ...c, open: !c.open } : c));
export const removeCollection = (cols: StudyCollection[], id: string) => cols.filter((c) => c.id !== id);

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Dados antigos e backups: sem coleções, começa vazio; item repetido fica só na primeira coleção. */
export function normalizeCollections(raw: unknown): StudyCollection[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw
    .filter((c): c is Rec => isRec(c) && typeof c.id === 'string' && !!c.id)
    .map((c) => ({
      id: c.id as string,
      name: typeof c.name === 'string' && c.name.trim() ? c.name.trim() : 'Coleção',
      open: c.open !== false,
      items: (Array.isArray(c.items) ? c.items : []).filter((k): k is string => typeof k === 'string' && /^[ac]:.+/.test(k) && !seen.has(k) && (seen.add(k), true)),
    }));
}
