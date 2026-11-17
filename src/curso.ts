/**
 * M36: importar um curso feito por IA.
 * - A IA entrega um arquivo `curso.md` (formato abaixo) ou o pacote em JSON do M31.
 * - `readCourse` aceita os dois, inclusive colados no meio de uma resposta, e devolve o mesmo
 *   pacote do importador (`applyPack`). Arquivo sem a marca de fim é recusado (veio cortado).
 * - `listCourses` e `removeCourse` são o "Gerenciar cursos" da Biblioteca.
 */
import type { StudyData } from './types.ts';
import { PACK_FORMAT, parsePack, slug, type PackNode, type PackTopic, type StudyPack } from './studyPack.ts';

export const COURSE_FORMAT = 'central-pessoal/curso';
export const COURSE_END = '<!-- fim do curso -->';
const KINDS = ['site', 'video', 'artigo', 'livro', 'pdf', 'doc', 'curso', 'podcast', 'outro'];

// ---------- Ler o arquivo ----------

/** Dentro dos textos, #### vira título e ##### vira subtítulo (o importador entende # e ##). */
const pageLine = (l: string) => l.replace(/^#####\s+/, '## ').replace(/^####\s+/, '# ');

/** Lê o `curso.md`. Devolve o pacote ou o motivo, em português, de não dar para importar. */
export function mdCourseToPack(md: string): StudyPack | string {
  const text = md.replace(/\r/g, '').replace(/^﻿/, '');
  const end = text.indexOf(COURSE_END);
  if (end < 0) return 'O arquivo veio incompleto (falta a linha final "<!-- fim do curso -->"). Peça para a IA gerar o arquivo de novo, inteiro.';
  const lines = text.slice(0, end).split('\n');
  // Cabeçalho entre --- e --- (pode haver texto da IA antes).
  const start = lines.findIndex((l) => l.trim() === '---');
  const close = start < 0 ? -1 : lines.findIndex((l, i) => i > start && l.trim() === '---');
  if (start < 0 || close < 0) return 'Falta o cabeçalho do curso (entre as linhas ---) com id, nome e área.';
  const head: Record<string, string> = {};
  for (const l of lines.slice(start + 1, close)) {
    const m = /^\s*([a-z_]+)\s*:\s*(.*)$/i.exec(l);
    if (m) head[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  if (head.formato && head.formato !== COURSE_FORMAT) return 'Este arquivo não é um curso do Central Pessoal (o "formato" do cabeçalho está diferente).';
  if (!head.nome) return 'Falta o "nome" do curso no cabeçalho.';
  if (!head.area) return 'Falta a "area" do curso no cabeçalho.';

  const temas: StudyPack['temas'] = [];
  const fontes: NonNullable<StudyPack['fontes']> = [];
  const mapas: NonNullable<StudyPack['mapas']> = [];
  const ciclos: NonNullable<StudyPack['ciclos']> = [];
  type Track = StudyPack['temas'][number]['trilhas'][number];
  let mode: 'texto' | 'fontes' | 'mapa' | 'nada' = 'nada';
  let track: Track | null = null;
  let topic: (PackTopic & { _lines: string[] }) | null = null;
  let trackLines: string[] = [];
  let mapItems: { depth: number; text: string }[] = [];
  let mapName = '';
  let fence = false;

  const closeTopic = () => {
    if (topic && track) {
      const body = topic._lines.join('\n').trim();
      track.topicos.push({ nome: topic.nome, ...(body ? { pagina: body } : {}), ...(topic.fontes?.length ? { fontes: topic.fontes } : {}) });
    }
    topic = null;
  };
  const closeTrack = () => {
    closeTopic();
    if (track) {
      const body = trackLines.join('\n').trim();
      if (body) track.pagina = body;
    }
    track = null;
    trackLines = [];
  };
  const closeMap = () => {
    if (mapName && mapItems.length) {
      const roots: PackNode[] = [];
      const stack: { depth: number; node: PackNode }[] = [];
      for (const it of mapItems) {
        const node: PackNode = { texto: it.text };
        while (stack.length && stack[stack.length - 1].depth >= it.depth) stack.pop();
        if (stack.length) (stack[stack.length - 1].node.filhos ??= []).push(node);
        else roots.push(node);
        stack.push({ depth: it.depth, node });
      }
      mapas.push({ nome: mapName, raiz: roots.length === 1 ? roots[0] : { texto: mapName, filhos: roots } });
    }
    mapName = '';
    mapItems = [];
  };
  const theme = () => {
    if (!temas.length) temas.push({ nome: 'Geral', trilhas: [] });
    return temas[temas.length - 1];
  };

  for (const raw of lines.slice(close + 1)) {
    const line = raw.replace(/\s+$/, '');
    // Dentro de um bloco de código, nada é estrutura.
    if (fence || line.trimStart().startsWith('```')) {
      if (line.trimStart().startsWith('```')) fence = !fence;
      if (topic) topic._lines.push(line);
      else if (track) trackLines.push(line);
      continue;
    }
    let m: RegExpExecArray | null;
    if ((m = /^#\s+Tema\s*:\s*(.+)$/i.exec(line))) {
      closeTrack();
      closeMap();
      temas.push({ nome: m[1].trim(), trilhas: [] });
      mode = 'nada';
    } else if ((m = /^##\s+Trilha\s*:\s*(.+)$/i.exec(line))) {
      closeTrack();
      closeMap();
      track = { nome: m[1].trim(), topicos: [] };
      theme().trilhas.push(track);
      mode = 'texto';
    } else if ((m = /^###\s+T[óo]pico\s*:\s*(.+)$/i.exec(line))) {
      if (!track) return `O tópico "${m[1].trim()}" está fora de uma trilha (falta um "## Trilha:" antes dele).`;
      closeTopic();
      topic = { nome: m[1].trim(), _lines: [] };
      mode = 'texto';
    } else if (/^#\s+Fontes\s*$/i.test(line)) {
      closeTrack();
      closeMap();
      mode = 'fontes';
    } else if ((m = /^#\s+Mapa\s*:\s*(.+)$/i.exec(line))) {
      closeTrack();
      closeMap();
      mapName = m[1].trim();
      mode = 'mapa';
    } else if ((m = /^#\s+Ciclo\s*:\s*(.+)$/i.exec(line))) {
      closeTrack();
      closeMap();
      const [nome, trilha] = m[1].split('|').map((x) => x.trim());
      if (nome && trilha) ciclos.push({ nome, trilha });
      mode = 'nada';
    } else if (mode === 'fontes') {
      const f = /^\s*[-*]\s+(?:\[([^\]]+)\]\(([^)\s]+)\)|(.+?)\s*\|\s*(https?:\/\/\S+))\s*(?:\|\s*([^|]*?)\s*)?(?:\|\s*(.*))?$/.exec(line);
      if (f) {
        const tipo = (f[5] ?? '').toLowerCase();
        fontes.push({ titulo: (f[1] ?? f[3]).trim(), url: (f[2] ?? f[4]).trim(), ...(KINDS.includes(tipo) ? { tipo: tipo as never } : {}), ...(f[6]?.trim() ? { nota: f[6].trim() } : {}) });
      }
    } else if (mode === 'mapa') {
      const it = /^(\s*)[-*]\s+(.+)$/.exec(line.replace(/\t/g, '  '));
      if (it) mapItems.push({ depth: Math.floor(it[1].length / 2), text: it[2].trim() });
    } else if (mode === 'texto') {
      if (topic) {
        const f = /^Fontes\s*:\s*(.+)$/i.exec(line);
        if (f && !topic._lines.some((l) => l.trim())) topic.fontes = f[1].split(/[\s,]+/).filter((u) => /^https?:\/\//.test(u));
        else if (!/^Antes\s*:/i.test(line) || topic._lines.some((l) => l.trim())) topic._lines.push(pageLine(line));
      } else if (track) {
        const d = /^Descri[çc][ãa]o\s*:\s*(.+)$/i.exec(line);
        if (d && !trackLines.some((l) => l.trim())) track.descricao = d[1].trim();
        else trackLines.push(pageLine(line));
      }
    }
  }
  closeTrack();
  closeMap();

  const pack = {
    formato: PACK_FORMAT,
    versao: 1,
    id: slug(head.id || head.nome),
    nome: head.nome,
    area: { nome: head.area, ...(head.area_descricao ? { descricao: head.area_descricao } : {}), ...(head.catalogo ? { catalogo: head.catalogo } : {}) },
    ...(head.notebook ? { notebook: { nome: head.notebook, ...(head.notebook_descricao ? { descricao: head.notebook_descricao } : {}) } } : {}),
    temas: temas.filter((t) => t.trilhas.length),
    fontes,
    mapas,
    ciclos,
  };
  if (!pack.temas.length) return 'O curso não tem nenhuma trilha ("## Trilha:") com tópicos ("### Tópico:").';
  return parsePack(pack);
}

/**
 * Aceita o `curso.md`, o pacote em JSON ou a resposta inteira da IA colada (com texto antes/depois
 * e com as crases de bloco de código): acha o curso sozinho.
 */
export function readCourse(text: string): StudyPack | string {
  const t = text.replace(/\r/g, '').trim();
  if (!t) return 'Nada para importar: escolha o arquivo ou cole o curso.';
  if (/^\s*formato\s*:\s*central-pessoal\/curso/m.test(t) || /^##\s+Trilha\s*:/m.test(t)) {
    // Se a IA pôs o arquivo dentro de um bloco ```markdown, tira as crases de fora.
    const inner = /```(?:markdown|md)?\n([\s\S]*?---[\s\S]*?)\n```\s*$/.exec(t);
    return mdCourseToPack(inner && inner[1].includes(COURSE_END) ? inner[1] : t);
  }
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a < 0 || b <= a) return 'Não encontrei um curso neste texto. Use o arquivo curso.md que a IA gerou.';
  return parsePack(t.slice(a, b + 1));
}

/** Mensagem para colar na IA quando o arquivo vem com problema. */
export const fixRequest = (error: string) =>
  `O app Central Pessoal não conseguiu importar o curso. Motivo: ${error}\n\nGere de novo o arquivo curso.md completo, no mesmo formato combinado, terminando com a linha ${COURSE_END}`;

// ---------- Prompt para a IA ----------

export type CourseLevel = 'iniciante' | 'intermediario' | 'avancado';
export type CourseSize = 'curto' | 'medio' | 'completo';
export const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
];
export const SIZES: { value: CourseSize; label: string; rule: string }[] = [
  { value: 'curto', label: 'Curto', rule: '1 tema, 2 trilhas, 4 a 6 tópicos por trilha' },
  { value: 'medio', label: 'Médio', rule: '2 temas, 2 a 3 trilhas por tema, 5 a 8 tópicos por trilha' },
  { value: 'completo', label: 'Completo', rule: '3 a 4 temas, 3 trilhas por tema, 6 a 10 tópicos por trilha (pode dividir em partes)' },
];

/** O prompt pronto para colar numa IA (Claude, ChatGPT, Gemini…). */
export function coursePrompt(tema: string, nivel: CourseLevel, tamanho: CourseSize): string {
  const lv = LEVELS.find((l) => l.value === nivel)!.label.toLowerCase();
  const sz = SIZES.find((s) => s.value === tamanho)!;
  return `Crie um curso para eu importar no app "Central Pessoal" (módulo Estudos).

TEMA DO CURSO: ${tema.trim() || '(escreva aqui o tema)'}
NÍVEL: ${lv}
TAMANHO: ${sz.label.toLowerCase()} (${sz.rule})
IDIOMA: português do Brasil, linguagem simples e didática.

ENTREGA: crie um ARQUIVO chamado curso.md para eu baixar. Se você não conseguir criar arquivos, mostre o conteúdo inteiro num único bloco de código markdown, sem nada fora dele.

O arquivo precisa seguir EXATAMENTE este formato:

---
formato: ${COURSE_FORMAT}
versao: 1
id: nome-curto-sem-acentos-com-hifens
nome: Nome do curso
area: Nome da área
area_descricao: Uma frase sobre a área
catalogo:
notebook: Nome do caderno de anotações
parte: 1
---

# Tema: Nome do tema

## Trilha: Nome da trilha
Descrição: Uma frase curta sobre a trilha.

Texto de abertura da trilha: para que serve e o que a pessoa vai aprender.

### Tópico: Nome do tópico
Fontes: https://endereco-de-uma-fonte-da-lista

#### Explicação
Texto didático, com palavras simples.

#### Exemplo
Um exemplo prático.

#### Exercício
1. Uma tarefa curta para praticar.

> Dica: uma dica útil.

# Fontes
- [Nome da fonte](https://endereco-real) | site | Por que usar esta fonte

# Mapa: Nome do mapa
- Ideia central
  - Ramo
    - Sub-ramo

# Ciclo: Nome do ciclo | Nome exato de uma trilha

${COURSE_END}

REGRAS:
1. "catalogo": escreva idiomas, dev, ia, prod ou carreira se o curso for dessas áreas (idiomas, programação, inteligência artificial, produtividade, carreira); senão deixe vazio.
2. Use "# Tema:", "## Trilha:" e "### Tópico:" só para a estrutura. Dentro dos textos, títulos só com #### e #####.
3. Cada tópico tem explicação, exemplo e exercício. Nos textos use só: #### título, ##### subtítulo, - lista, 1. lista, > destaque, **negrito**, \`código\` e blocos de código com três crases. Sem tabelas e sem imagens.
4. Links só na seção "# Fontes", com endereços REAIS e conhecidos (documentação oficial, sites educativos, canais confiáveis). Não invente endereços. Na linha "Fontes:" de um tópico, repita exatamente endereços da lista.
5. Tipos de fonte: site, video, artigo, livro, pdf, doc, curso, podcast ou outro.
6. Faça um "# Mapa:" por tema, com até 4 níveis e até 6 ramos, resumindo as ideias principais (2 espaços por nível).
7. Faça um "# Ciclo:" para a primeira trilha (por onde começar).
8. A ÚLTIMA linha do arquivo tem que ser exatamente: ${COURSE_END}
9. Se o curso não couber numa resposta, faça a parte 1 (com "parte: 1") e me avise. Depois eu peço a parte 2: use o MESMO id e "parte: 2", trazendo só os temas novos.`;
}

// ---------- Gerenciar cursos ----------

export interface CourseInfo {
  /** Prefixo dos ids do curso (slug do id do pacote). */
  id: string;
  name: string;
  importedAt: string;
  parts: number;
  tracks: number;
  topics: number;
  pages: number;
  maps: number;
  notebookId: string | null;
}

/** Cursos importados: os registrados e os de antes do registro (achados pelo notebook "pk-<id>-nb"). */
export function listCourses(study: StudyData): CourseInfo[] {
  const ids = new Map<string, { name: string; importedAt: string; parts: number }>();
  for (const p of study.packs) ids.set(p.id, { name: p.name, importedAt: p.importedAt, parts: p.parts });
  for (const n of study.notebooks) {
    const m = /^pk-(.+)-nb$/.exec(n.id);
    if (m && !ids.has(m[1])) ids.set(m[1], { name: n.name, importedAt: n.createdAt, parts: 1 });
  }
  for (const t of study.tracks) {
    const m = /^pk-(.+?)-tr-/.exec(t.id);
    if (m && ![...ids.keys()].some((k) => t.id.startsWith(`pk-${k}-tr-`))) ids.set(m[1], { name: t.name, importedAt: '', parts: 1 });
  }
  return [...ids.entries()]
    .map(([id, v]) => {
      const tracks = study.tracks.filter((t) => t.id.startsWith(`pk-${id}-tr-`));
      const nb = study.notebooks.find((n) => n.id === `pk-${id}-nb`);
      return {
        id,
        name: v.name,
        importedAt: v.importedAt,
        parts: v.parts,
        tracks: tracks.length,
        topics: tracks.reduce((s, t) => s + t.topics.length, 0),
        pages: nb?.pages.length ?? 0,
        maps: study.maps.filter((m) => m.id.startsWith(`pk-${id}-m-`)).length,
        notebookId: nb?.id ?? null,
      };
    })
    .sort((a, b) => b.importedAt.localeCompare(a.importedAt));
}

/**
 * Exclui um curso importado.
 * - `tudo = false` (padrão): sai o que veio do curso na Biblioteca (temas, trilhas, área própria sem outros temas),
 *   os ciclos dessas trilhas e os mapas do curso. O notebook fica (tem as anotações da pessoa), só perde a ligação.
 * - `tudo = true`: também o notebook do curso, os mapas dele e as fontes do curso que nenhum outro notebook usa.
 */
export function removeCourse(study: StudyData, id: string, tudo = false): StudyData {
  const pre = `pk-${id}`;
  const trackIds = new Set(study.tracks.filter((t) => t.id.startsWith(`${pre}-tr-`)).map((t) => t.id));
  const topicIds = new Set(study.tracks.filter((t) => trackIds.has(t.id)).flatMap((t) => t.topics.map((x) => x.id)));
  const themes = study.themes.filter((t) => !t.id.startsWith(`${pre}-t-`));
  const nbId = `${pre}-nb`;
  const areaGone = !themes.some((t) => t.areaId === pre);
  const unlinkPages = (n: StudyData['notebooks'][number]) => {
    const touched = n.pages.some((p) => p.topicId && topicIds.has(p.topicId)) || (n.trackId !== null && trackIds.has(n.trackId));
    return touched ? { ...n, trackId: n.trackId && trackIds.has(n.trackId) ? null : n.trackId, pages: n.pages.map((p) => (p.topicId && topicIds.has(p.topicId) ? { ...p, topicId: null } : p)) } : n;
  };
  let notebooks = study.notebooks.map(unlinkPages);
  let maps = study.maps.filter((m) => !m.id.startsWith(`${pre}-m-`));
  let sources = study.sources;
  if (tudo) {
    notebooks = notebooks.filter((n) => n.id !== nbId);
    maps = maps.filter((m) => m.notebookId !== nbId);
    const usedElsewhere = new Set(notebooks.flatMap((n) => n.pages.flatMap((p) => p.sourceIds)));
    sources = sources
      .filter((f) => !(f.id.startsWith(`${pre}-f-`) && !usedElsewhere.has(f.id) && f.notebookIds.every((x) => x === nbId)))
      .map((f) => (f.notebookIds.includes(nbId) ? { ...f, notebookIds: f.notebookIds.filter((x) => x !== nbId) } : f));
  }
  return {
    ...study,
    areas: areaGone ? study.areas.filter((a) => a.id !== pre) : study.areas,
    archived: areaGone ? study.archived.filter((a) => a !== pre) : study.archived,
    themes,
    tracks: study.tracks.filter((t) => !trackIds.has(t.id)),
    cycles: study.cycles.filter((c) => !trackIds.has(c.trackId)),
    notebooks,
    maps,
    sources,
    packs: study.packs.filter((p) => p.id !== id),
  };
}
