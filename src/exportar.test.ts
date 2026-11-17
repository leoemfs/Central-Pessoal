import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildExport, defaultOptions, expandAll, fileName, limitDepth, mapFit, refLine } from './exportar.ts';
import { emptyStudy, library, newPage } from './estudos.ts';
import { applyPack, PACK_FORMAT, type StudyPack } from './studyPack.ts';
import { countNodes, fromBranches, mapNode } from './mapas.ts';
import type { StudyData } from './types.ts';

const NOW = '2026-11-18T10:00:00.000Z';
const pack: StudyPack = {
  formato: PACK_FORMAT, versao: 1, id: 'ingles', nome: 'Inglês do zero', area: { nome: 'Idiomas', catalogo: 'idiomas' },
  notebook: { nome: 'Inglês A1', descricao: 'Do zero até conversar' },
  temas: [{ nome: 'Base', trilhas: [
    { nome: 'Primeiros contatos', pagina: '## Para que serve\nComeçar.', topicos: [{ nome: 'Cumprimentos', pagina: 'Hello e hi.', fontes: ['https://bbc.co.uk'] }, { nome: 'Vazio' }] },
    { nome: 'Números', pagina: 'Contar.', topicos: [{ nome: 'Um a dez', pagina: 'one, two' }] },
  ] }],
  fontes: [{ titulo: 'BBC', url: 'https://bbc.co.uk', tipo: 'site', nota: 'Áudios curtos' }, { titulo: 'Anki', url: '', tipo: 'outro' }],
  mapas: [{ nome: 'Pequeno', raiz: { texto: 'Inglês', filhos: [{ texto: 'A' }, { texto: 'B' }] }, pagina: 'Primeiros contatos' }],
  ciclos: [{ nome: 'C1', trilha: 'Primeiros contatos' }],
};
const setup = (): StudyData => {
  const s = applyPack(emptyStudy(), pack, NOW).study;
  // Uma fonte da pessoa ligada ao notebook (sem página) também entra nas referências.
  return { ...s, sources: s.sources.map((f) => (f.title === 'Anki' ? { ...f, notebookIds: ['pk-ingles-nb'] } : f)) };
};

test('documento: capa, seções numeradas, situação, origem e páginas vazias', () => {
  const s = setup();
  const d = buildExport(s, library(s), 'pk-ingles-nb', defaultOptions('Leonardo'), NOW)!;
  assert.deepEqual([d.title, d.desc, d.name, d.date, d.course], ['Inglês A1', 'Do zero até conversar', 'Leonardo', '18/11/2026', 'Inglês do zero']);
  // Curso com o mesmo nome do notebook continua sendo curso na capa.
  const same = { ...s, packs: s.packs.map((p) => ({ ...p, name: 'Inglês A1' })) };
  assert.equal(buildExport(same, library(same), 'pk-ingles-nb', defaultOptions(''), NOW)!.course, 'Inglês A1');
  assert.deepEqual(d.sections.map((x) => `${x.num} ${x.title}`), ['1 Primeiros contatos', '1.1 Cumprimentos', '2 Números', '2.1 Um a dez']);
  const cump = d.sections[1];
  assert.equal(cump.depth, 2);
  assert.equal(cump.status, 'afazer');
  assert.match(cump.origin!, /Primeiros contatos$/);
  assert.equal(d.sections[0].status, null);
  // Com "páginas vazias", o tópico sem texto entra.
  const all = buildExport(s, library(s), 'pk-ingles-nb', { ...defaultOptions(''), emptyPages: true, status: false }, NOW)!;
  assert.deepEqual(all.sections.map((x) => x.num), ['1', '1.1', '1.2', '2', '2.1']);
  assert.ok(all.sections.every((x) => x.status === null));
  assert.equal(buildExport(s, library(s), 'nao-existe', defaultOptions(''), NOW), null);
});

test('documento: só uma página com as subpáginas', () => {
  const s = setup();
  const nb = s.notebooks[0];
  const top = nb.pages.find((p) => p.name === 'Números')!;
  const d = buildExport(s, library(s), nb.id, { ...defaultOptions(''), scope: top.id }, NOW)!;
  assert.deepEqual(d.sections.map((x) => `${x.num} ${x.title}`), ['1 Números', '1.1 Um a dez']);
  assert.equal(d.title, 'Números');
  assert.equal(d.desc, 'Do notebook Inglês A1');
  // Mapa e fonte de outra página não entram.
  assert.equal(d.maps.length, 0);
  assert.equal(d.refs.length, 0);
});

test('referências: em ordem, com onde foram usadas', () => {
  const s = setup();
  const d = buildExport(s, library(s), 'pk-ingles-nb', defaultOptions(''), NOW)!;
  assert.deepEqual(d.refs.map((r) => [r.num, r.title, r.kind, r.usedIn]), [
    [1, 'Anki', 'Outro', []],
    [2, 'BBC', 'Site', ['1.1 Cumprimentos']],
  ]);
  // Fonte do curso que nenhuma página usa também entra (é referência do curso).
  const extra = applyPack(s, { ...pack, fontes: [...pack.fontes!, { titulo: 'Cambridge', url: 'https://dictionary.cambridge.org', tipo: 'site' }] }, NOW).study;
  assert.ok(buildExport(extra, library(extra), 'pk-ingles-nb', defaultOptions(''), NOW)!.refs.some((r) => r.title === 'Cambridge'));
  assert.equal(refLine(d.refs[1]), 'BBC. Site. Disponível em: https://bbc.co.uk. Áudios curtos.');
  assert.equal(refLine(d.refs[0]), 'Anki. Outro.');
  assert.equal(buildExport(s, library(s), 'pk-ingles-nb', { ...defaultOptions(''), refs: false }, NOW)!.refs.length, 0);
});

test('mapas: cabe em pé, deitado ou não cabe (e a escolha da pessoa)', () => {
  assert.equal(mapFit(fromBranches('A', [{ label: 'b', leaves: ['c'] }])).orientation, 'retrato');
  // Mais largo que alto (ramos compridos dos dois lados): deitado (girado na folha em pé).
  const wide = mapNode('Centro', [mapNode('Ideia média', [mapNode('Ideia média', [mapNode('Ideia média')])]), mapNode('Ideia média', [mapNode('Ideia média', [mapNode('Ideia média')])])]);
  assert.equal(mapFit(wide).orientation, 'paisagem');
  const huge = fromBranches('Centro', Array.from({ length: 8 }, (_, i) => ({ label: `Ramo com nome comprido ${i}`, leaves: Array.from({ length: 12 }, (_, j) => `Ideia comprida número ${i}.${j}`) })));
  assert.equal(mapFit(huge).orientation, 'nao-cabe');
  // Recolhido no app sai aberto no papel; nível 2 corta os netos.
  const closed = { ...huge, children: huge.children.map((c) => ({ ...c, collapsed: true })) };
  assert.ok(expandAll(closed).children.every((c) => !c.collapsed));
  assert.equal(countNodes(limitDepth(huge, 1)), 9);

  let s = setup();
  const nbId = 'pk-ingles-nb';
  s = { ...s, maps: [...s.maps, { id: 'grande', name: 'Grande', root: huge, notebookId: nbId, pageId: null, createdAt: NOW, updatedAt: NOW }] };
  const lib = library(s);
  const d = buildExport(s, lib, nbId, defaultOptions(''), NOW)!;
  assert.deepEqual(d.maps.map((m) => [m.name, m.orientation, m.page]), [['Pequeno', 'retrato', 'Primeiros contatos']]);
  assert.deepEqual(d.oversized.map((m) => m.name), ['Grande']);
  const two = buildExport(s, lib, nbId, { ...defaultOptions(''), mapChoice: { grande: 'nivel2' } }, NOW)!;
  assert.equal(two.oversized.length, 0);
  assert.equal(two.maps[1].trimmed, true);
  // 2 níveis (8 ramos × 12 ideias) não cabem legíveis: fica só nos ramos principais.
  assert.equal(two.maps[1].ideas, 8);
  assert.notEqual(mapFit(two.maps[1].root).orientation, 'nao-cabe');
  const out = buildExport(s, lib, nbId, { ...defaultOptions(''), mapChoice: { grande: 'fora' } }, NOW)!;
  assert.deepEqual([out.oversized.length, out.maps.length], [0, 1]);
  assert.equal(buildExport(s, lib, nbId, { ...defaultOptions(''), maps: false }, NOW)!.maps.length, 0);
});

test('notebook livre (sem curso) e nome do arquivo', () => {
  let s = emptyStudy();
  const p = newPage('Ideias soltas', null, null, NOW);
  p.doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'oi' }] }] };
  s = { ...s, notebooks: [{ id: 'n', name: 'Meu: caderno/1', desc: '', trackId: null, pages: [p], log: [], createdAt: NOW, updatedAt: NOW }] };
  const d = buildExport(s, library(s), 'n', defaultOptions(''), NOW)!;
  assert.equal(d.course, null);
  assert.deepEqual(d.sections.map((x) => [x.num, x.origin]), [['1', null]]);
  assert.equal(fileName(d), 'Meu caderno 1 - 18-11-2026');
  assert.ok(mapNode('x'));
});
