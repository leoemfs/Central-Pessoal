/**
 * M37: exportar um notebook (ou o notebook de um curso) em PDF (M37a) e Word (M37b).
 * Aqui só a estrutura do documento, igual para os dois formatos:
 * capa → sumário → seções (página = 1º nível, subpágina = 2º) → anexos (mapas) → referências (fontes).
 */
import type { MapNode, RichNode, SourceKind, StudyData, StudyNotebook, StudyStatus } from './types.ts';
import { docIsEmpty, pageTree, sourceKind, STATUS_LABEL, topicState, trackPath, type Library } from './estudos.ts';
import { countNodes, layoutMap } from './mapas.ts';

export type MapChoice = 'tudo' | 'nivel2' | 'fora';

export interface ExportOptions {
  /** 'tudo' ou o id de uma página (exporta a página com as subpáginas). */
  scope: string;
  cover: boolean;
  toc: boolean;
  status: boolean;
  maps: boolean;
  refs: boolean;
  emptyPages: boolean;
  /** Nome na capa. */
  name: string;
  /** O que fazer com cada mapa que não cabe legível (id → escolha). */
  mapChoice: Record<string, MapChoice>;
}

export const defaultOptions = (name: string): ExportOptions => ({ scope: 'tudo', cover: true, toc: true, status: true, maps: true, refs: true, emptyPages: false, name, mapChoice: {} });

export interface ExportSection {
  id: string;
  /** 1, 1.1, 2… */
  num: string;
  depth: 1 | 2;
  title: string;
  doc: RichNode;
  empty: boolean;
  /** Situação do tópico no ciclo (se a página veio da Biblioteca e há ciclo). */
  status: StudyStatus | null;
  /** "Idiomas › Inglês › A1 › Primeiros contatos". */
  origin: string | null;
}

export type Orientation = 'retrato' | 'paisagem' | 'nao-cabe';
export interface ExportMap {
  id: string;
  name: string;
  root: MapNode;
  orientation: Orientation;
  /** Mapa grande que entra só até o 2º nível (escolha da pessoa). */
  trimmed: boolean;
  /** Página a que o mapa pertence (nome), se houver. */
  page: string | null;
  ideas: number;
}

export interface ExportRef {
  num: number;
  title: string;
  kind: string;
  url: string;
  note: string;
  /** Páginas onde a fonte foi usada. */
  usedIn: string[];
}

export interface ExportDoc {
  title: string;
  desc: string;
  name: string;
  date: string;
  /** Curso de onde o notebook veio (se for de um curso importado). */
  course: string | null;
  sections: ExportSection[];
  maps: ExportMap[];
  /** Mapas que não cabem legíveis e ainda esperam a escolha da pessoa. */
  oversized: { id: string; name: string; ideas: number }[];
  refs: ExportRef[];
  options: ExportOptions;
}

// ---------- Mapas na folha ----------

/** Área útil de uma folha A4 (em px de tela, 96 por polegada), descontando as margens e o título do mapa. */
const PORTRAIT = { w: 680, h: 900 };
const LANDSCAPE = { w: 960, h: 600 };
/** Menor letra das ideias no mapa (12,5 px) não pode ficar abaixo de ~7 pt (9,3 px) no papel. */
const MIN_SCALE = 9.3 / 12.5;
const PAD = 24;

export const expandAll = (n: MapNode): MapNode => ({ ...n, collapsed: false, children: n.children.map(expandAll) });
export const limitDepth = (n: MapNode, levels: number): MapNode => ({ ...n, collapsed: false, children: levels > 0 ? n.children.map((c) => limitDepth(c, levels - 1)) : [] });

/** Cabe em pé, deitado ou não cabe legível? (o mapa vai inteiro, com todos os ramos abertos) */
export function mapFit(root: MapNode): { orientation: Orientation; scale: number } {
  const l = layoutMap(root);
  const w = l.maxX - l.minX + PAD * 2;
  const h = l.maxY - l.minY + PAD * 2;
  const fit = (box: { w: number; h: number }) => Math.min(1, box.w / w, box.h / h);
  const p = fit(PORTRAIT);
  if (p >= MIN_SCALE) return { orientation: 'retrato', scale: p };
  const ls = fit(LANDSCAPE);
  if (ls >= MIN_SCALE) return { orientation: 'paisagem', scale: ls };
  return { orientation: 'nao-cabe', scale: Math.max(p, ls) };
}

// ---------- Documento ----------

/** Linha da referência: "Título. Tipo. Disponível em: endereço." */
export function refLine(r: Pick<ExportRef, 'title' | 'kind' | 'url' | 'note'>): string {
  return [`${r.title}.`, `${r.kind}.`, r.url ? `Disponível em: ${r.url}.` : '', r.note ? `${r.note}${/[.!?]$/.test(r.note) ? '' : '.'}` : ''].filter(Boolean).join(' ');
}

const formatDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export function buildExport(study: StudyData, lib: Library, notebookId: string, opts: ExportOptions, today: string): ExportDoc | null {
  const nb: StudyNotebook | undefined = study.notebooks.find((n) => n.id === notebookId);
  if (!nb) return null;
  const tree = pageTree(nb);
  // Escopo: tudo, ou uma página com as subpáginas dela.
  const scoped = opts.scope === 'tudo' ? tree : tree.filter(({ page }) => page.id === opts.scope || page.parentId === opts.scope);
  const sections: ExportSection[] = [];
  let a = 0;
  let b = 0;
  for (const { page, depth } of scoped) {
    const empty = docIsEmpty(page.doc);
    const hasKids = nb.pages.some((p) => p.parentId === page.id && scoped.some((x) => x.page.id === p.id));
    // Página vazia sai, a não ser que a pessoa peça ou que ela seja o "título" de subpáginas.
    if (empty && !opts.emptyPages && !hasKids) continue;
    const top = depth === 0 || opts.scope === page.id;
    if (top) {
      a++;
      b = 0;
    } else b++;
    const topic = page.topicId ? lib.topic(page.topicId) : undefined;
    const track = topic ? lib.track(topic.trackId) : undefined;
    sections.push({
      id: page.id,
      num: top ? `${a}` : `${a}.${b}`,
      depth: top ? 1 : 2,
      title: page.name,
      doc: page.doc,
      empty,
      status: opts.status && page.topicId ? (topicState(study.cycles, page.topicId)?.status ?? 'afazer') : null,
      origin: track ? [...trackPath(lib, track), track.name].join(' › ') : null,
    });
  }
  const pageIds = new Set(scoped.map((x) => x.page.id));

  // Anexos: mapas do notebook (ou só das páginas exportadas, quando é uma página).
  const maps: ExportMap[] = [];
  const oversized: ExportDoc['oversized'] = [];
  if (opts.maps) {
    for (const m of study.maps.filter((x) => x.notebookId === nb.id && (opts.scope === 'tudo' || (x.pageId && pageIds.has(x.pageId))))) {
      const full = expandAll(m.root);
      const fit = mapFit(full);
      const page = m.pageId ? (nb.pages.find((p) => p.id === m.pageId)?.name ?? null) : null;
      if (fit.orientation !== 'nao-cabe') {
        maps.push({ id: m.id, name: m.name, root: full, orientation: fit.orientation, trimmed: false, page, ideas: countNodes(full) - 1 });
        continue;
      }
      const choice = opts.mapChoice[m.id];
      if (!choice) oversized.push({ id: m.id, name: m.name, ideas: countNodes(full) - 1 });
      if (choice === 'nivel2') {
        // Resumo: até o 2º nível; se ainda não couber, só os ramos principais.
        let cut = limitDepth(full, 2);
        let f2 = mapFit(cut);
        if (f2.orientation === 'nao-cabe') {
          cut = limitDepth(full, 1);
          f2 = mapFit(cut);
        }
        maps.push({ id: m.id, name: m.name, root: cut, orientation: f2.orientation === 'nao-cabe' ? 'paisagem' : f2.orientation, trimmed: true, page, ideas: countNodes(cut) - 1 });
      }
    }
  }

  // Referências: fontes do notebook e das páginas exportadas, com onde foram usadas.
  const refs: ExportRef[] = [];
  if (opts.refs) {
    const used = new Map<string, string[]>();
    for (const s of sections) for (const id of nb.pages.find((p) => p.id === s.id)?.sourceIds ?? []) used.set(id, [...(used.get(id) ?? []), `${s.num} ${s.title}`]);
    const coursePre = /^pk-(.+)-nb$/.exec(nb.id)?.[1];
    const ids = new Set([
      ...used.keys(),
      ...(opts.scope === 'tudo' ? study.sources.filter((f) => f.notebookIds.includes(nb.id) || (coursePre && f.id.startsWith(`pk-${coursePre}-f-`))).map((f) => f.id) : []),
    ]);
    const list = study.sources.filter((f) => ids.has(f.id)).sort((x, y) => x.title.localeCompare(y.title, 'pt-BR'));
    list.forEach((f, i) => refs.push({ num: i + 1, title: f.title, kind: sourceKind(f.kind as SourceKind).label, url: f.url, note: f.note, usedIn: used.get(f.id) ?? [] }));
  }

  const course = study.packs.find((p) => nb.id === `pk-${p.id}-nb`)?.name ?? null;
  const scopePage = opts.scope !== 'tudo' ? nb.pages.find((p) => p.id === opts.scope) : undefined;
  return {
    title: scopePage ? scopePage.name : nb.name,
    desc: scopePage ? `Do notebook ${nb.name}` : nb.desc,
    name: opts.name.trim(),
    date: formatDate(today),
    course,
    sections,
    maps,
    oversized,
    refs,
    options: opts,
  };
}

export const statusLabel = (s: StudyStatus) => STATUS_LABEL[s];

/** Nome do arquivo: "Inglês A1 - 18-11-2026". */
export const fileName = (doc: Pick<ExportDoc, 'title' | 'date'>) => `${doc.title.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Notebook'} - ${doc.date.replace(/\//g, '-')}`;
