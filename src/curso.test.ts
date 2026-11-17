import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_END, coursePrompt, fixRequest, listCourses, mdCourseToPack, readCourse, mineReach, removeCourse, removeMine } from './curso.ts';
import { applyPack, type StudyPack } from './studyPack.ts';
import { docText, emptyStudy, isHidden, library, normalizeStudy, shortDesc } from './estudos.ts';

const NOW = '2026-11-17T10:00:00.000Z';
const md = `Aqui está o seu curso!

---
formato: central-pessoal/curso
versao: 1
id: Excel Básico
nome: Excel do básico
area: Planilhas
area_descricao: Organizar dados
catalogo:
notebook: Excel
parte: 1
---

# Tema: Fundamentos

## Trilha: Primeiros passos
Descrição: Conhecer a tela.

Abertura da trilha com **negrito**.

### Tópico: A tela do Excel
Fontes: https://support.microsoft.com/excel

#### Explicação
Células e colunas.

\`\`\`
## isto é código, não é trilha
### Tópico: nem tópico
\`\`\`

#### Exercício
1. Abrir o Excel.

### Tópico: Fórmulas
Antes: A tela do Excel
- SOMA
- MÉDIA

# Tema: Dados

## Trilha: Tabelas
### Tópico: Filtros
Texto.

# Fontes
- [Suporte do Excel](https://support.microsoft.com/excel) | doc | Oficial
- Vídeo do curso | https://youtube.com/watch?v=x | video

# Mapa: Fundamentos
- Excel
  - Tela
    - Faixa
  - Fórmulas

# Mapa: Solto
- A
- B

# Ciclo: Começar | Primeiros passos

${COURSE_END}

Bons estudos!`;

test('curso.md: estrutura, páginas, fontes, mapas e ciclo', () => {
  const p = mdCourseToPack(md) as StudyPack;
  assert.equal(typeof p, 'object', String(p));
  assert.equal(p.id, 'excel-basico');
  assert.deepEqual(p.area, { nome: 'Planilhas', descricao: 'Organizar dados' });
  assert.deepEqual(p.notebook, { nome: 'Excel' });
  assert.deepEqual(p.temas.map((t) => [t.nome, t.trilhas.map((x) => [x.nome, x.topicos.map((y) => y.nome)])]), [
    ['Fundamentos', [['Primeiros passos', ['A tela do Excel', 'Fórmulas']]]],
    ['Dados', [['Tabelas', ['Filtros']]]],
  ]);
  const tr = p.temas[0].trilhas[0];
  assert.equal(tr.descricao, 'Conhecer a tela.');
  assert.equal(tr.pagina, 'Abertura da trilha com **negrito**.');
  const tela = tr.topicos[0];
  assert.deepEqual(tela.fontes, ['https://support.microsoft.com/excel']);
  // #### vira título; o bloco de código fica intacto (não vira trilha nem tópico).
  assert.match(tela.pagina!, /^# Explicação/);
  assert.match(tela.pagina!, /## isto é código/);
  assert.ok(!tr.topicos[1].pagina!.includes('Antes:'));
  assert.deepEqual(p.fontes, [
    { titulo: 'Suporte do Excel', url: 'https://support.microsoft.com/excel', tipo: 'doc', nota: 'Oficial' },
    { titulo: 'Vídeo do curso', url: 'https://youtube.com/watch?v=x', tipo: 'video' },
  ]);
  assert.deepEqual(p.mapas![0].raiz, { texto: 'Excel', filhos: [{ texto: 'Tela', filhos: [{ texto: 'Faixa' }] }, { texto: 'Fórmulas' }] });
  // Vários itens no primeiro nível: o nome do mapa vira o centro.
  assert.deepEqual(p.mapas![1].raiz, { texto: 'Solto', filhos: [{ texto: 'A' }, { texto: 'B' }] });
  assert.deepEqual(p.ciclos, [{ nome: 'Começar', trilha: 'Primeiros passos' }]);
});

test('curso.md: importa com notebook, subpáginas formatadas e registro', () => {
  const r = applyPack(emptyStudy(), mdCourseToPack(md) as StudyPack, NOW);
  assert.deepEqual(r.added, { trilhas: 2, topicos: 3, paginas: 5, fontes: 2, mapas: 2, ciclos: 1 });
  const nb = r.study.notebooks.find((n) => n.id === r.notebookId)!;
  const tela = nb.pages.find((p) => p.name === 'A tela do Excel')!;
  assert.equal(tela.doc.content![0].type, 'heading');
  assert.equal(tela.doc.content!.find((n) => n.type === 'codeBlock')!.content![0].text, '## isto é código, não é trilha\n### Tópico: nem tópico');
  assert.match(docText(tela.doc), /Abrir o Excel/);
  assert.deepEqual(r.study.packs, [{ id: 'excel-basico', name: 'Excel do básico', importedAt: NOW, parts: 1 }]);
  assert.equal(library(r.study).area('pk-excel-basico')?.name, 'Planilhas');
  // Parte 2 com o mesmo id: só acrescenta e conta a parte.
  const r2 = applyPack(r.study, readCourse(md.replace('## Trilha: Tabelas', '## Trilha: Tabelas\n### Tópico: Ordenar')) as StudyPack, NOW);
  assert.equal(r2.added.topicos, 1);
  assert.equal(r2.study.packs[0].parts, 2);
  // Passa pelo backup sem perder o registro.
  assert.deepEqual(normalizeStudy(JSON.parse(JSON.stringify(r2.study))).packs, r2.study.packs);
});

test('curso.md: problemas explicados', () => {
  assert.match(mdCourseToPack(md.replace(COURSE_END, '')) as string, /incompleto/);
  assert.match(mdCourseToPack(`${COURSE_END}`) as string, /cabeçalho/);
  assert.match(mdCourseToPack(md.replace('nome: Excel do básico\n', '')) as string, /"nome"/);
  assert.match(mdCourseToPack(md.replace('formato: central-pessoal/curso', 'formato: outro')) as string, /não é um curso/);
  assert.match(mdCourseToPack(`---\nnome: X\narea: Y\n---\n### Tópico: solto\n${COURSE_END}`) as string, /fora de uma trilha/);
  assert.match(mdCourseToPack(`---\nnome: X\narea: Y\n---\n# Tema: Vazio\n${COURSE_END}`) as string, /nenhuma trilha/);
  assert.match(fixRequest('falta X'), /falta X[\s\S]*fim do curso/);
});

test('ler o que foi colado: .md dentro de crases, JSON no meio do texto, vazio', () => {
  const fenced = 'Segue:\n```markdown\n' + md.slice(md.indexOf('---')) .replace(/\n\nBons estudos!$/, '') + '\n```\n';
  assert.equal((readCourse(fenced) as StudyPack).nome, 'Excel do básico');
  const json = JSON.stringify(mdCourseToPack(md));
  assert.equal((readCourse(`Claro! Aqui está:\n\`\`\`json\n${json}\n\`\`\`\nAbraços`) as StudyPack).id, 'excel-basico');
  assert.match(readCourse('   ') as string, /Nada para importar/);
  assert.match(readCourse('só conversa') as string, /Não encontrei/);
});

test('prompt: leva tema, nível, tamanho e o formato com a marca de fim', () => {
  const p = coursePrompt('Excel do básico ao avançado', 'intermediario', 'medio');
  assert.match(p, /TEMA DO CURSO: Excel do básico ao avançado/);
  assert.match(p, /NÍVEL: intermediário/);
  assert.match(p, /TAMANHO: médio/);
  assert.match(p, /ARQUIVO chamado curso\.md/);
  assert.ok(p.includes(COURSE_END));
  // O exemplo do próprio prompt é um curso válido (o formato que a IA copia funciona).
  const exemplo = p.slice(p.indexOf('---'), p.indexOf(COURSE_END) + COURSE_END.length);
  assert.equal(typeof mdCourseToPack(exemplo), 'object', String(mdCourseToPack(exemplo)));
});

test('gerenciar: listar e excluir só o curso ou tudo', () => {
  let s = applyPack(emptyStudy(), mdCourseToPack(md) as StudyPack, NOW).study;
  // Uma fonte do curso usada também num notebook da pessoa nunca é apagada.
  const shared = s.sources.find((f) => f.url.includes('support.microsoft'))!;
  s = { ...s, notebooks: [...s.notebooks, { id: 'meu', name: 'Meu', desc: '', trackId: null, pages: [{ id: 'pg', parentId: null, name: 'Notas', topicId: s.tracks[0].topics[0].id, doc: { type: 'doc', content: [{ type: 'paragraph' }] }, sourceIds: [shared.id], updatedAt: NOW }], log: [], createdAt: NOW, updatedAt: NOW }] };
  const [c] = listCourses(s);
  assert.deepEqual({ id: c.id, name: c.name, tracks: c.tracks, topics: c.topics, pages: c.pages, maps: c.maps }, { id: 'excel-basico', name: 'Excel do básico', tracks: 2, topics: 3, pages: 5, maps: 2 });

  const soCurso = removeCourse(s, c.id);
  assert.equal(soCurso.tracks.length, 0);
  assert.equal(soCurso.themes.length, 0);
  assert.equal(soCurso.areas.length, 0);
  assert.equal(soCurso.cycles.length, 0);
  assert.equal(soCurso.maps.length, 0);
  assert.equal(soCurso.packs.length, 0);
  // O notebook do curso fica com o texto; as páginas só perdem a ligação com a trilha.
  const nb = soCurso.notebooks.find((n) => n.id === 'pk-excel-basico-nb')!;
  assert.equal(nb.pages.length, 5);
  assert.ok(nb.pages.every((p) => p.topicId === null));
  assert.match(docText(nb.pages.find((p) => p.name === 'A tela do Excel')!.doc), /Células/);
  assert.equal(soCurso.notebooks.find((n) => n.id === 'meu')!.pages[0].topicId, null);
  assert.equal(soCurso.sources.length, 2);
  // Notebook que sobrou ainda aparece na lista (para poder apagar tudo depois).
  assert.equal(listCourses(soCurso).length, 1);

  const tudo = removeCourse(s, c.id, true);
  assert.equal(tudo.notebooks.some((n) => n.id === 'pk-excel-basico-nb'), false);
  assert.deepEqual(tudo.sources.map((f) => f.id), [shared.id]);
  assert.deepEqual(tudo.sources[0].notebookIds, []);
  assert.equal(listCourses(tudo).length, 0);
  assert.equal(tudo.notebooks.find((n) => n.id === 'meu')!.pages.length, 1);

  // Importar de novo depois de excluir traz tudo de volta.
  assert.equal(applyPack(tudo, mdCourseToPack(md) as StudyPack, NOW).added.trilhas, 2);
});

test('gerenciar: curso antigo (sem registro) é achado pelo notebook; área do app não é apagada', () => {
  const p = { ...(mdCourseToPack(md) as StudyPack), area: { nome: 'Produtividade', catalogo: 'prod' } };
  const s = { ...applyPack(emptyStudy(), p, NOW).study, packs: [] };
  const [c] = listCourses(s);
  assert.equal(c.id, 'excel-basico');
  assert.equal(c.name, 'Excel');
  const r = removeCourse(s, c.id, true);
  assert.equal(r.themes.length, 0);
  assert.ok(library(r).area('prod'));
});

test('excluir o que a pessoa criou: área com tema, trilha, ciclo e notebook ligado', () => {
  const s = {
    ...emptyStudy(),
    archived: ['minha'],
    areas: [{ id: 'minha', name: 'Contratos', desc: '' }],
    themes: [{ id: 'th', areaId: 'minha', name: 'Gestão' }, { id: 'th2', areaId: 'lang', name: 'Outro' }],
    tracks: [{ id: 'tr', themeId: 'th', name: 'Base', desc: '', topics: [{ id: 'tp', name: 'Tópico' }] }, { id: 'tr2', themeId: 'th2', name: 'Fica', desc: '', topics: [] }],
    cycles: [{ id: 'c1', trackId: 'tr' } as never, { id: 'c2', trackId: 'tr2' } as never],
    notebooks: [
      { id: 'nb', name: 'Notas', desc: '', trackId: 'tr', pages: [{ id: 'p', parentId: null, name: 'P', topicId: 'tp', doc: { type: 'doc', content: [] }, sourceIds: [], updatedAt: NOW }], log: [], createdAt: NOW, updatedAt: NOW },
    ],
    maps: [{ id: 'm', name: 'M', root: { id: 'r', text: 'R', children: [] }, notebookId: 'nb', pageId: null, createdAt: NOW, updatedAt: NOW } as never],
    sources: [{ id: 'f', title: 'F', url: '', kind: 'site', note: '', notebookIds: ['nb'] } as never],
  };
  assert.deepEqual(mineReach(s, { areas: ['minha'] }), { tracks: 1, cycles: 1, notebooks: 1, pages: 1 });
  const so = removeMine(s, { areas: ['minha'] });
  assert.deepEqual(so.areas, []);
  assert.deepEqual(so.archived, []);
  assert.deepEqual(so.themes.map((t) => t.id), ['th2']);
  assert.deepEqual(so.tracks.map((t) => t.id), ['tr2']);
  assert.deepEqual(so.cycles.map((c) => c.id), ['c2']);
  assert.equal(so.notebooks[0].trackId, null);
  assert.equal(so.notebooks[0].pages[0].topicId, null);
  assert.equal(so.maps.length, 1);
  const tudo = removeMine(s, { areas: ['minha'] }, true);
  assert.equal(tudo.notebooks.length, 0);
  assert.equal(tudo.maps.length, 0);
  assert.deepEqual(tudo.sources[0].notebookIds, []);
  // Só uma trilha: o tema e a área ficam.
  const tr = removeMine(s, { tracks: ['tr'] });
  assert.deepEqual(tr.themes.length, 2);
  assert.deepEqual(tr.tracks.map((t) => t.id), ['tr2']);
});

test('arquivar um curso esconde os temas e trilhas que vieram dele', () => {
  assert.equal(isHidden(['pk-excel'], 'prod', 'pk-excel-tr-base'), true);
  assert.equal(isHidden(['pk-excel'], 'prod', 'pk-excel2-tr-base'), false);
  assert.equal(isHidden(['prod'], 'prod', 'qualquer'), true);
  assert.equal(isHidden([], 'prod', 'pk-excel-tr-base'), false);
});

test('tutorial de Estudos: cartão aparece por padrão e o arquivado sobrevive ao backup', () => {
  assert.equal(normalizeStudy({}).tutorialOff, false);
  assert.equal(normalizeStudy({ tutorialOff: true }).tutorialOff, true);
  assert.equal(emptyStudy().tutorialOff, false);
});

test('descrição curta de trilha: sem marcas de texto (C17)', () => {
  assert.equal(shortDesc('## Sobre esta trilha\nO app por dentro: **para que serve** e `código`.\n> Próximas partes: Parte 2.'), 'O app por dentro: para que serve e código. Próximas partes: Parte 2.');
  assert.equal(shortDesc('## Sobre esta trilha O app que você usa. Cada página tem **para que serve**, **onde ver**.'), 'O app que você usa. Cada página tem para que serve, onde ver.');
  assert.equal(shortDesc('Frase simples.'), 'Frase simples.');
});
