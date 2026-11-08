/**
 * Estudos e Carreira: regras puras.
 * - Biblioteca = catálogo do app (`estudosCatalogo.ts`) + áreas, temas e trilhas criados pela pessoa.
 * - Ciclo = seleção pessoal de tópicos de uma trilha. Criar, mudar ou concluir um ciclo nunca mexe na trilha.
 * - Recomendações ("estude X antes") são só avisos.
 */
import type { SourceKind, StudyBlock, StudyCycle, StudyData, StudyMap, StudyNotebook, StudyStatus } from './types.ts';
import { CATALOG, slug, type CatMap, type CatSource, type CatTopic } from './estudosCatalogo.ts';
import { uid } from './utils.ts';

export const SOURCE_KINDS: { value: SourceKind; label: string; icon: string }[] = [
  { value: 'site', label: 'Site', icon: 'globe' },
  { value: 'video', label: 'Vídeo', icon: 'play' },
  { value: 'artigo', label: 'Artigo', icon: 'note' },
  { value: 'livro', label: 'Livro', icon: 'book' },
  { value: 'pdf', label: 'PDF', icon: 'note' },
  { value: 'doc', label: 'Documentação', icon: 'list' },
  { value: 'curso', label: 'Curso', icon: 'cap' },
  { value: 'podcast', label: 'Podcast', icon: 'mic' },
  { value: 'outro', label: 'Outro', icon: 'link' },
];
export const sourceKind = (k: SourceKind) => SOURCE_KINDS.find((x) => x.value === k) ?? SOURCE_KINDS[SOURCE_KINDS.length - 1];

export const STATUS_LABEL: Record<StudyStatus, string> = { afazer: 'A estudar', andando: 'Estudando', feito: 'Concluído' };
export const nextStatus = (s: StudyStatus): StudyStatus => (s === 'afazer' ? 'andando' : s === 'andando' ? 'feito' : 'afazer');

export function emptyStudy(): StudyData {
  return { archived: [], areas: [], themes: [], tracks: [], cycles: [], notebooks: [], sources: [], maps: [] };
}

// ---------- Biblioteca (catálogo + pessoal) ----------

export interface TrackView {
  id: string;
  name: string;
  desc: string;
  areaId: string;
  themeId: string;
  levelId: string | null;
  topics: CatTopic[];
  sources: CatSource[];
  mine: boolean;
}
export interface LevelView {
  id: string;
  name: string;
  title: string;
  desc: string;
  tracks: TrackView[];
}
export interface ThemeView {
  id: string;
  areaId: string;
  name: string;
  mine: boolean;
  levels: LevelView[] | null;
  tracks: TrackView[];
}
export interface AreaView {
  id: string;
  name: string;
  icon: string;
  desc: string;
  mine: boolean;
  themes: ThemeView[];
}
export interface Library {
  areas: AreaView[];
  area: (id: string) => AreaView | undefined;
  theme: (id: string) => ThemeView | undefined;
  level: (themeId: string, id: string) => LevelView | undefined;
  track: (id: string) => TrackView | undefined;
  topic: (id: string) => (CatTopic & { trackId: string }) | undefined;
  /** Todas as trilhas, na ordem da biblioteca. */
  tracks: TrackView[];
}

let cache: { key: unknown[]; lib: Library } | null = null;

/** Junta o catálogo do app com o que a pessoa criou. Temas e trilhas da pessoa entram no fim de cada área/tema. */
export function library(study: StudyData): Library {
  const key = [study.areas, study.themes, study.tracks];
  if (cache && cache.key.every((k, i) => k === key[i])) return cache.lib;
  const mineTracks = (themeId: string, areaId: string): TrackView[] =>
    study.tracks.filter((t) => t.themeId === themeId).map((t) => ({ id: t.id, name: t.name, desc: t.desc, areaId, themeId, levelId: null, topics: t.topics, sources: [], mine: true }));
  const mineThemes = (areaId: string): ThemeView[] =>
    study.themes.filter((t) => t.areaId === areaId).map((t) => ({ id: t.id, areaId, name: t.name, mine: true, levels: null, tracks: mineTracks(t.id, areaId) }));

  const areas: AreaView[] = [
    ...CATALOG.map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
      desc: a.desc,
      mine: false,
      themes: [
        ...a.themes.map((t): ThemeView => {
          const levels = t.levels
            ? t.levels.map((l) => ({ id: l.id, name: l.name, title: l.title, desc: l.desc, tracks: l.tracks.map((tr) => ({ ...tr, areaId: a.id, themeId: t.id, levelId: l.id, mine: false })) }))
            : null;
          const direct = (t.tracks ?? []).map((tr) => ({ ...tr, areaId: a.id, themeId: t.id, levelId: null, mine: false }));
          return { id: t.id, areaId: a.id, name: t.name, mine: false, levels, tracks: [...direct, ...mineTracks(t.id, a.id)] };
        }),
        ...mineThemes(a.id),
      ],
    })),
    ...study.areas.map((a) => ({ id: a.id, name: a.name, icon: 'folder', desc: a.desc, mine: true, themes: mineThemes(a.id) })),
  ];

  const themeMap = new Map<string, ThemeView>();
  const trackMap = new Map<string, TrackView>();
  const topicMap = new Map<string, CatTopic & { trackId: string }>();
  const tracks: TrackView[] = [];
  for (const a of areas)
    for (const t of a.themes) {
      themeMap.set(t.id, t);
      for (const tr of [...(t.levels ?? []).flatMap((l) => l.tracks), ...t.tracks]) {
        trackMap.set(tr.id, tr);
        tracks.push(tr);
        for (const tp of tr.topics) topicMap.set(tp.id, { ...tp, trackId: tr.id });
      }
    }
  const lib: Library = {
    areas,
    tracks,
    area: (id) => areas.find((a) => a.id === id),
    theme: (id) => themeMap.get(id),
    level: (themeId, id) => themeMap.get(themeId)?.levels?.find((l) => l.id === id),
    track: (id) => trackMap.get(id),
    topic: (id) => topicMap.get(id),
  };
  cache = { key, lib };
  return lib;
}

/** Nomes do caminho até a trilha: ["Idiomas", "Inglês", "A1"]. */
export function trackPath(lib: Library, tr: TrackView): string[] {
  const out = [lib.area(tr.areaId)?.name ?? '', lib.theme(tr.themeId)?.name ?? ''];
  if (tr.levelId) out.push(lib.level(tr.themeId, tr.levelId)?.name ?? '');
  return out.filter(Boolean);
}

// ---------- Tópicos e progresso ----------

/** Situação de um tópico na vida da pessoa: concluído em algum ciclo vale mais; senão, o do ciclo ativo. */
export function topicState(cycles: StudyCycle[], topicId: string): { status: StudyStatus; cycle: StudyCycle } | null {
  let found: { status: StudyStatus; cycle: StudyCycle } | null = null;
  for (const c of cycles) {
    const t = c.topics.find((x) => x.id === topicId);
    if (!t) continue;
    if (t.status === 'feito') return { status: 'feito', cycle: c };
    if (!c.finishedAt && (!found || t.status === 'andando')) found = { status: t.status, cycle: c };
  }
  return found;
}

export function trackProgress(cycles: StudyCycle[], tr: { topics: { id: string }[] }) {
  const done = tr.topics.filter((t) => topicState(cycles, t.id)?.status === 'feito').length;
  return { done, total: tr.topics.length };
}

export function cycleCounts(c: StudyCycle) {
  const total = c.topics.length;
  const done = c.topics.filter((t) => t.status === 'feito').length;
  const doing = c.topics.filter((t) => t.status === 'andando').length;
  return { total, done, doing, todo: total - done - doing, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** Tópicos selecionados cujo recomendado-antes não está selecionado nem concluído (só aviso). */
export function missingBefore(tr: TrackView, selected: string[], cycles: StudyCycle[]): { topicId: string; beforeId: string; why: string }[] {
  const sel = new Set(selected);
  return tr.topics
    .filter((t) => sel.has(t.id) && t.before && !sel.has(t.before) && topicState(cycles, t.before)?.status !== 'feito')
    .map((t) => ({ topicId: t.id, beforeId: t.before!, why: t.why ?? '' }));
}

/** Tópicos da trilha ainda livres para um próximo ciclo (nem concluídos, nem num ciclo em andamento). */
export function remainingTopics(tr: TrackView, cycles: StudyCycle[]): CatTopic[] {
  return tr.topics.filter((t) => !topicState(cycles, t.id));
}

// ---------- Ciclos ----------

export function defaultCycleName(cycles: StudyCycle[], tr: TrackView, lib: Library): string {
  const n = cycles.filter((c) => c.trackId === tr.id).length + 1;
  const path = trackPath(lib, tr);
  const base = tr.levelId ? `${path[1]} ${path[2]}` : tr.name;
  return `${base} · Ciclo ${n}`;
}

/** Cria o ciclo na ordem escolhida. A trilha não é tocada. */
export function newCycle(p: { trackId: string; topicIds: string[]; name: string; notebookId: string | null; today: string; now?: string }): StudyCycle {
  const ids = [...new Set(p.topicIds)];
  return {
    id: uid(),
    name: p.name.trim() || 'Novo ciclo',
    trackId: p.trackId,
    topics: ids.map((id) => ({ id, status: 'afazer', doneAt: null })),
    notebookId: p.notebookId,
    startedAt: p.today,
    finishedAt: null,
    createdAt: p.now ?? new Date().toISOString(),
  };
}

export function setTopicStatus(c: StudyCycle, topicId: string, status: StudyStatus, today: string): StudyCycle {
  return { ...c, topics: c.topics.map((t) => (t.id === topicId ? { ...t, status, doneAt: status === 'feito' ? (t.doneAt ?? today) : null } : t)) };
}

export function moveItem<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (i < 0 || j < 0 || i >= list.length || j >= list.length) return list;
  const out = [...list];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

// ---------- Notebooks, fontes e mapas ----------

export function block(kind: StudyBlock['kind'], title: string, text = ''): StudyBlock {
  return { id: uid(), kind, title, text, pairs: [], sourceIds: [] };
}

/** Notebook novo; se vier de uma trilha, ganha um assunto por tópico escolhido (ou por todos). */
export function newNotebook(name: string, tr: TrackView | null, topicIds: string[] | null, now: string): StudyNotebook {
  const topics = tr ? tr.topics.filter((t) => !topicIds || topicIds.includes(t.id)) : [];
  return {
    id: uid(),
    name: name.trim() || 'Novo notebook',
    trackId: tr?.id ?? null,
    subjects: topics.length
      ? topics.map((t) => ({ id: uid(), name: t.name, topicId: t.id, blocks: [block('nota', 'Anotações')] }))
      : [{ id: uid(), name: 'Primeiro assunto', topicId: null, blocks: [block('nota', 'Anotações')] }],
    log: [{ at: now, text: tr ? `Criado a partir da trilha ${tr.name}` : 'Criado do zero' }],
    createdAt: now,
    updatedAt: now,
  };
}

/** Registra uma mudança no histórico do notebook (o mais novo primeiro, até 50). */
export function touch(nb: StudyNotebook, text: string, now: string): StudyNotebook {
  return { ...nb, updatedAt: now, log: [{ at: now, text }, ...nb.log].slice(0, 50) };
}

/** Garante que os tópicos do ciclo existam como assuntos do notebook (sem duplicar). */
export function addTopicsAsSubjects(nb: StudyNotebook, topics: { id: string; name: string }[]): StudyNotebook {
  const have = new Set(nb.subjects.map((s) => s.topicId).filter(Boolean));
  const extra = topics.filter((t) => !have.has(t.id)).map((t) => ({ id: uid(), name: t.name, topicId: t.id, blocks: [block('nota', 'Anotações')] }));
  return extra.length ? { ...nb, subjects: [...nb.subjects, ...extra] } : nb;
}

export function mapFromSuggestion(s: CatMap, now: string): StudyMap {
  return { id: uid(), name: s.name, center: s.center, branches: s.branches.map(([label, leaves]) => ({ id: uid(), label, leaves: [...leaves] })), notebookId: null, createdAt: now, updatedAt: now };
}

/** Uma fonte já guardada com o mesmo endereço (ou mesmo título, se não houver endereço). */
export function findSource(study: StudyData, s: { title: string; url: string }) {
  return study.sources.find((x) => (s.url ? x.url === s.url : slug(x.title) === slug(s.title)));
}

// ---------- Dados antigos e backups ----------

type Rec = Record<string, unknown>;
const isRec = (x: unknown): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown, d = '') => (typeof x === 'string' ? x : d);
const strs = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is string => typeof i === 'string') : []);
const recs = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is Rec => isRec(i) && typeof i.id === 'string') : []);
const STATUSES: StudyStatus[] = ['afazer', 'andando', 'feito'];
const KINDS = SOURCE_KINDS.map((k) => k.value);

export function normalizeStudy(raw: unknown): StudyData {
  const r = isRec(raw) ? raw : {};
  const now = new Date().toISOString();
  return {
    archived: strs(r.archived),
    areas: recs(r.areas).map((a) => ({ id: a.id as string, name: str(a.name, 'Área'), desc: str(a.desc) })),
    themes: recs(r.themes).map((t) => ({ id: t.id as string, areaId: str(t.areaId), name: str(t.name, 'Tema') })),
    tracks: recs(r.tracks).map((t) => ({ id: t.id as string, themeId: str(t.themeId), name: str(t.name, 'Trilha'), desc: str(t.desc), topics: recs(t.topics).map((x) => ({ id: x.id as string, name: str(x.name, 'Tópico') })) })),
    cycles: recs(r.cycles).map((c) => ({
      id: c.id as string,
      name: str(c.name, 'Ciclo'),
      trackId: str(c.trackId),
      topics: recs(c.topics).map((t) => ({ id: t.id as string, status: STATUSES.includes(t.status as StudyStatus) ? (t.status as StudyStatus) : 'afazer', doneAt: typeof t.doneAt === 'string' ? t.doneAt : null })),
      notebookId: typeof c.notebookId === 'string' ? c.notebookId : null,
      startedAt: str(c.startedAt, now.slice(0, 10)),
      finishedAt: typeof c.finishedAt === 'string' ? c.finishedAt : null,
      createdAt: str(c.createdAt, now),
    })),
    notebooks: recs(r.notebooks).map((n) => ({
      id: n.id as string,
      name: str(n.name, 'Notebook'),
      trackId: typeof n.trackId === 'string' ? n.trackId : null,
      subjects: recs(n.subjects).map((s) => ({
        id: s.id as string,
        name: str(s.name, 'Assunto'),
        topicId: typeof s.topicId === 'string' ? s.topicId : null,
        blocks: recs(s.blocks).map((b) => ({
          id: b.id as string,
          kind: b.kind === 'pares' || b.kind === 'fontes' ? b.kind : 'nota',
          title: str(b.title),
          text: str(b.text),
          pairs: Array.isArray(b.pairs) ? b.pairs.filter((p): p is [string, string] => Array.isArray(p) && typeof p[0] === 'string' && typeof p[1] === 'string').map((p) => [p[0], p[1]] as [string, string]) : [],
          sourceIds: strs(b.sourceIds),
        })),
      })),
      log: Array.isArray(n.log) ? n.log.filter((l): l is { at: string; text: string } => isRec(l) && typeof l.at === 'string' && typeof l.text === 'string') : [],
      createdAt: str(n.createdAt, now),
      updatedAt: str(n.updatedAt, now),
    })),
    sources: recs(r.sources).map((s) => ({
      id: s.id as string,
      title: str(s.title, 'Fonte'),
      url: str(s.url),
      kind: KINDS.includes(s.kind as SourceKind) ? (s.kind as SourceKind) : 'outro',
      note: str(s.note),
      notebookIds: strs(s.notebookIds),
      createdAt: str(s.createdAt, now),
    })),
    maps: recs(r.maps).map((m) => ({
      id: m.id as string,
      name: str(m.name, 'Mapa'),
      center: str(m.center, str(m.name, 'Ideia')),
      branches: recs(m.branches).map((b) => ({ id: b.id as string, label: str(b.label, 'Ramo'), leaves: strs(b.leaves) })),
      notebookId: typeof m.notebookId === 'string' ? m.notebookId : null,
      createdAt: str(m.createdAt, now),
      updatedAt: str(m.updatedAt, now),
    })),
  };
}
