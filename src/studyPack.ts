/**
 * Pacotes de estudo (arquivo .json): criam de uma vez uma área com temas, trilhas e tópicos,
 * um notebook com uma página por tópico, fontes, mapas mentais e ciclos.
 * Os ids saem do id do pacote, então importar de novo (ou uma parte nova do mesmo pacote)
 * só acrescenta o que falta e nunca apaga nem sobrescreve o que a pessoa já mudou.
 */
import { CATALOG } from './estudosCatalogo.ts';
import type { MapNode, RichNode, SourceKind, StudyData, StudyMap, StudyNotebook, StudyPage } from './types.ts';

export const PACK_FORMAT = 'central-pessoal/pacote-de-estudo';

export interface PackTopic {
  nome: string;
  /** Texto da página, num markdown simples (## título, - lista, 1. lista, ``` código, > destaque, **negrito**, `código`). */
  pagina?: string;
  /** Endereços de fontes do pacote ligadas a esta página. */
  fontes?: string[];
}
export interface PackNode {
  texto: string;
  filhos?: PackNode[];
}
export interface StudyPack {
  formato: typeof PACK_FORMAT;
  versao: 1;
  id: string;
  nome: string;
  /** `catalogo`: id de uma área do catálogo (ex.: "dev") para os temas entrarem nela; sem isso, cria uma área própria. */
  area: { nome: string; descricao?: string; catalogo?: string };
  /** `descricao`: frase curta (aparece na Biblioteca); `pagina`: texto da página de abertura da trilha no notebook (markdown simples). */
  temas: { nome: string; trilhas: { nome: string; descricao?: string; pagina?: string; topicos: PackTopic[] }[] }[];
  notebook?: { nome: string; descricao?: string };
  fontes?: { titulo: string; url: string; tipo?: SourceKind; nota?: string }[];
  /** `pagina`: nome de uma trilha ou tópico; o mapa aparece em "Mapas desta página". */
  mapas?: { nome: string; raiz: PackNode; pagina?: string }[];
  /** Ciclos com todos os tópicos de uma trilha (pelo nome). */
  ciclos?: { nome: string; trilha: string }[];
}

const KINDS: SourceKind[] = ['site', 'video', 'artigo', 'livro', 'pdf', 'doc', 'curso', 'podcast', 'outro'];
const isRec = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const str = (x: unknown) => typeof x === 'string' && x.trim().length > 0;

export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/** Confere o arquivo. Devolve o pacote ou o motivo, em português, de não dar para importar. */
export function parsePack(raw: unknown): StudyPack | string {
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return 'O arquivo não é um pacote de estudo (não deu para ler).';
    }
  }
  if (!isRec(raw) || raw.formato !== PACK_FORMAT) return 'Este arquivo não é um pacote de estudo do Central Pessoal.';
  if (raw.versao !== 1) return 'Pacote de uma versão mais nova. Atualize o app e tente de novo.';
  if (!str(raw.id) || !str(raw.nome) || !isRec(raw.area) || !str(raw.area.nome)) return 'Pacote incompleto: falta o nome ou a área.';
  if (!Array.isArray(raw.temas) || !raw.temas.length) return 'Pacote sem temas.';
  for (const t of raw.temas) {
    if (!isRec(t) || !str(t.nome) || !Array.isArray(t.trilhas)) return 'Há um tema sem nome ou sem trilhas.';
    for (const tr of t.trilhas) {
      if (!isRec(tr) || !str(tr.nome) || !Array.isArray(tr.topicos) || !tr.topicos.length) return `A trilha de "${t.nome}" está sem nome ou sem tópicos.`;
      if (!tr.topicos.every((x) => isRec(x) && str(x.nome))) return `Há um tópico sem nome em "${tr.nome}".`;
    }
  }
  return raw as unknown as StudyPack;
}

// ---------- Texto da página ----------

/** **negrito** e `código` dentro de uma linha. */
function inline(text: string): RichNode[] {
  const out: RichNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ type: 'text', text: text.slice(last, m.index) });
    const t = m[0];
    out.push(t.startsWith('**') ? { type: 'text', text: t.slice(2, -2), marks: [{ type: 'bold' }] } : { type: 'text', text: t.slice(1, -1), marks: [{ type: 'code' }] });
    last = m.index! + t.length;
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
  return out;
}
const p = (text: string): RichNode => ({ type: 'paragraph', content: inline(text) });

/** Markdown simples → documento do editor. */
export function mdToDoc(md: string): RichNode {
  const lines = md.replace(/\r/g, '').split('\n');
  const content: RichNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      i++;
      content.push({ type: 'codeBlock', content: code.length ? [{ type: 'text', text: code.join('\n') }] : undefined });
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      content.push({ type: 'heading', attrs: { level: Math.min(3, h[1].length + 1) }, content: inline(h[2]) });
      i++;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const q: RichNode[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(p(lines[i++].replace(/^>\s?/, '')));
      content.push({ type: 'blockquote', content: q });
      continue;
    }
    const bullet = /^[-*]\s+/;
    const ordered = /^\d+\.\s+/;
    if (bullet.test(line) || ordered.test(line)) {
      const re = bullet.test(line) ? bullet : ordered;
      const items: RichNode[] = [];
      while (i < lines.length && re.test(lines[i])) items.push({ type: 'listItem', content: [p(lines[i++].replace(re, ''))] });
      content.push({ type: re === bullet ? 'bulletList' : 'orderedList', content: items });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,3}\s|>|[-*]\s|\d+\.\s)/.test(lines[i])) para.push(lines[i++].trim());
    content.push(p(para.join(' ')));
  }
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

/** Texto corrido, sem marcas de markdown (para descrições curtas). */
export function plainText(md: string): string {
  return md
    .split('\n')
    .filter((l) => l.trim() && !/^#{1,3}\s/.test(l) && !l.startsWith('```'))
    .map((l) => l.replace(/^>\s?|^[-*]\s+|^\d+\.\s+/, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim())
    .join(' ')
    .trim();
}

// ---------- Importar ----------

export interface PackResult {
  study: StudyData;
  added: { trilhas: number; topicos: number; paginas: number; fontes: number; mapas: number; ciclos: number };
  /** Id do notebook do pacote (para abrir depois de importar). */
  notebookId: string | null;
}

const toMapNode = (n: PackNode, id: string): MapNode => ({
  id,
  text: n.texto,
  color: null,
  collapsed: false,
  children: (n.filhos ?? []).map((c, i) => toMapNode(c, `${id}.${i}`)),
});

/** Acrescenta ao Estudos tudo o que o pacote traz e ainda não existe. Não mexe no que já existe. */
export function applyPack(study: StudyData, pack: StudyPack, now: string): PackResult {
  const pre = slug(pack.id);
  const added = { trilhas: 0, topicos: 0, paginas: 0, fontes: 0, mapas: 0, ciclos: 0 };
  const s: StudyData = { ...study, areas: [...study.areas], themes: [...study.themes], tracks: [...study.tracks], sources: [...study.sources], maps: [...study.maps], cycles: [...study.cycles], notebooks: [...study.notebooks], packs: [...(study.packs ?? [])] };

  const inCatalog = pack.area.catalogo && CATALOG.some((a) => a.id === pack.area.catalogo) ? pack.area.catalogo : null;
  const areaId = inCatalog ?? `pk-${pre}`;
  if (!inCatalog && !s.areas.some((a) => a.id === areaId)) s.areas.push({ id: areaId, name: pack.area.nome.trim(), desc: (pack.area.descricao ?? '').trim() });
  s.archived = s.archived.filter((x) => x !== areaId);

  // Fontes: reaproveita a que já tem o mesmo endereço.
  const sourceId = new Map<string, string>();
  for (const f of pack.fontes ?? []) {
    if (!str(f.titulo)) continue;
    const found = s.sources.find((x) => (f.url ? x.url === f.url : x.title === f.titulo));
    if (found) {
      sourceId.set(f.url, found.id);
      continue;
    }
    const id = `pk-${pre}-f-${slug(f.url || f.titulo)}`;
    s.sources.push({ id, title: f.titulo.trim(), url: (f.url ?? '').trim(), kind: KINDS.includes(f.tipo as SourceKind) ? (f.tipo as SourceKind) : 'site', note: (f.nota ?? '').trim(), notebookIds: [], createdAt: now });
    sourceId.set(f.url, id);
    added.fontes++;
  }

  // Notebook do pacote: uma página por tópico (só as que ainda não existem).
  const nbId = `pk-${pre}-nb`;
  let nb: StudyNotebook | undefined = s.notebooks.find((n) => n.id === nbId);
  const newPages: StudyPage[] = [];

  const trackIdByName = new Map<string, string>();
  for (const t of pack.temas) {
    const themeId = `pk-${pre}-t-${slug(t.nome)}`;
    if (!s.themes.some((x) => x.id === themeId)) s.themes.push({ id: themeId, areaId, name: t.nome.trim() });
    for (const tr of t.trilhas) {
      const trackId = `pk-${pre}-tr-${slug(tr.nome)}`;
      trackIdByName.set(tr.nome.trim(), trackId);
      const topics = tr.topicos.map((x) => ({ id: `${trackId}-${slug(x.nome)}`, name: x.nome.trim() }));
      const i = s.tracks.findIndex((x) => x.id === trackId);
      const desc = plainText(tr.descricao ?? '');
      if (i < 0) {
        s.tracks.push({ id: trackId, themeId, name: tr.nome.trim(), desc, topics });
        added.trilhas++;
        added.topicos += topics.length;
      } else {
        // Trilha que já existia: só acrescenta tópicos novos, no fim.
        const have = new Set(s.tracks[i].topics.map((x) => x.id));
        const extra = topics.filter((x) => !have.has(x.id));
        if (extra.length) s.tracks[i] = { ...s.tracks[i], topics: [...s.tracks[i].topics, ...extra] };
        // Descrição antiga com marcas de markdown (v0.63): troca pela frase limpa.
        if (/(^|\s)##\s|\*\*/.test(s.tracks[i].desc)) s.tracks[i] = { ...s.tracks[i], desc };
        added.topicos += extra.length;
      }
      const trackPageId = `pk-${pre}-pg-${slug(tr.nome)}`;
      const pageIds = new Set(nb?.pages.map((x) => x.id) ?? []);
      if (!pageIds.has(trackPageId)) newPages.push({ id: trackPageId, parentId: null, name: tr.nome.trim(), topicId: null, doc: mdToDoc(tr.pagina ?? tr.descricao ?? tr.nome), sourceIds: [], updatedAt: now });
      tr.topicos.forEach((x, k) => {
        const pid = `${trackPageId}-${slug(x.nome)}`;
        if (pageIds.has(pid)) return;
        newPages.push({
          id: pid,
          parentId: trackPageId,
          name: x.nome.trim(),
          topicId: topics[k].id,
          doc: mdToDoc(x.pagina ?? ''),
          sourceIds: (x.fontes ?? []).map((u) => sourceId.get(u)).filter((v): v is string => !!v),
          updatedAt: now,
        });
      });
    }
  }
  if (newPages.length || !nb) {
    const firstTrack = trackIdByName.values().next().value ?? null;
    nb = nb
      ? { ...nb, pages: [...nb.pages, ...newPages], updatedAt: now, log: [{ at: now, text: `Pacote "${pack.nome}": ${newPages.length} páginas novas` }, ...nb.log].slice(0, 50) }
      : { id: nbId, name: (pack.notebook?.nome ?? pack.nome).trim(), desc: (pack.notebook?.descricao ?? '').trim(), trackId: firstTrack, pages: newPages, log: [{ at: now, text: `Criado pelo pacote "${pack.nome}"` }], createdAt: now, updatedAt: now };
    s.notebooks = [...s.notebooks.filter((n) => n.id !== nbId), nb];
    added.paginas += newPages.length;
  }
  // As fontes do pacote ficam ligadas ao notebook.
  const used = new Set(nb.pages.flatMap((x) => x.sourceIds));
  s.sources = s.sources.map((f) => (used.has(f.id) && !f.notebookIds.includes(nbId) ? { ...f, notebookIds: [...f.notebookIds, nbId] } : f));

  for (const m of pack.mapas ?? []) {
    const id = `pk-${pre}-m-${slug(m.nome)}`;
    if (s.maps.some((x) => x.id === id)) continue;
    const page = m.pagina ? nb.pages.find((x) => x.name.trim().toLowerCase() === m.pagina!.trim().toLowerCase()) : undefined;
    const map: StudyMap = { id, name: m.nome.trim(), root: toMapNode(m.raiz, `${id}-n`), notebookId: nbId, pageId: page?.id ?? null, createdAt: now, updatedAt: now };
    s.maps.push(map);
    added.mapas++;
  }

  // Ciclo: só se ainda não houver nenhum ciclo daquela trilha (respeita o que a pessoa excluiu ou já fez).
  for (const c of pack.ciclos ?? []) {
    const trackId = trackIdByName.get(c.trilha.trim());
    const track = s.tracks.find((x) => x.id === trackId);
    if (!track || s.cycles.some((x) => x.trackId === track.id)) continue;
    s.cycles.push({
      id: `pk-${pre}-cy-${slug(c.nome)}-${now.slice(0, 10)}`,
      name: c.nome.trim(),
      trackId: track.id,
      topics: track.topics.map((x) => ({ id: x.id, status: 'afazer', doneAt: null })),
      notebookId: nbId,
      startedAt: now.slice(0, 10),
      finishedAt: null,
      createdAt: now,
    });
    added.ciclos++;
  }

  // Registro do curso (Gerenciar cursos). Cada importação conta como uma parte.
  const rec = s.packs.find((x) => x.id === pre);
  s.packs = rec ? s.packs.map((x) => (x.id === pre ? { ...x, name: pack.nome.trim(), parts: x.parts + 1 } : x)) : [...s.packs, { id: pre, name: pack.nome.trim(), importedAt: now, parts: 1 }];

  return { study: s, added, notebookId: nbId };
}
