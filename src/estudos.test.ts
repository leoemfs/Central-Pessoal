import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, SUGGESTED_MAPS } from './estudosCatalogo.ts';
import {
  addTopicsAsPages,
  cycleCounts,
  defaultCycleName,
  emptyStudy,
  library,
  mapFromSuggestion,
  missingBefore,
  moveItem,
  newCycle,
  movePage,
  newNotebook,
  newPage,
  pageTree,
  removePage,
  setPageParent,
  nextStatus,
  normalizeStudy,
  remainingTopics,
  setTopicStatus,
  topicState,
  trackPath,
  trackProgress,
} from './estudos.ts';
import { normalize } from './data.ts';

const TODAY = '2026-11-08';

test('catálogo: ids únicos, recomendações apontam para tópicos da mesma trilha', () => {
  const lib = library(emptyStudy());
  const trackIds = lib.tracks.map((t) => t.id);
  assert.equal(new Set(trackIds).size, trackIds.length);
  const topicIds = lib.tracks.flatMap((t) => t.topics.map((x) => x.id));
  assert.equal(new Set(topicIds).size, topicIds.length);
  for (const tr of lib.tracks)
    for (const tp of tr.topics) if (tp.before) assert.ok(tr.topics.some((x) => x.id === tp.before), `${tp.id} → ${tp.before}`);
  // Cinco áreas, com variedade de temas e trilhas.
  assert.deepEqual(CATALOG.map((a) => a.id), ['idiomas', 'dev', 'ia', 'prod', 'carreira']);
  assert.ok(lib.tracks.length >= 30);
  const a1 = lib.track('en-a1-contatos')!;
  assert.equal(a1.topics.length, 10);
  assert.deepEqual(trackPath(lib, a1), ['Idiomas', 'Inglês', 'A1']);
  assert.deepEqual(trackPath(lib, lib.track('dev-logica')!), ['Desenvolvimento de software', 'Lógica de programação']);
  assert.ok(SUGGESTED_MAPS.every((m) => CATALOG.some((a) => a.id === m.areaId)));
});

test('biblioteca junta áreas, temas e trilhas criados pela pessoa', () => {
  const s = emptyStudy();
  s.areas = [{ id: 'musica', name: 'Música', desc: '' }];
  s.themes = [
    { id: 'violao', areaId: 'musica', name: 'Violão' },
    { id: 'frances', areaId: 'idiomas', name: 'Francês' },
  ];
  s.tracks = [{ id: 'acordes', themeId: 'violao', name: 'Primeiros acordes', desc: '', topics: [{ id: 'ac1', name: 'Dó maior' }] }];
  const lib = library(s);
  assert.equal(lib.area('musica')?.mine, true);
  assert.equal(lib.theme('frances')?.areaId, 'idiomas');
  assert.equal(lib.track('acordes')?.areaId, 'musica');
  assert.equal(lib.topic('ac1')?.trackId, 'acordes');
  assert.deepEqual(trackPath(lib, lib.track('acordes')!), ['Música', 'Violão']);
});

test('ciclo: escolher tópicos não muda a trilha; ordem é a da pessoa', () => {
  const lib = library(emptyStudy());
  const tr = lib.track('en-a1-contatos')!;
  const before = JSON.stringify(tr.topics);
  const ids = [tr.topics[3].id, tr.topics[0].id, tr.topics[0].id];
  const c = newCycle({ trackId: tr.id, topicIds: ids, name: '  ', notebookId: null, today: TODAY });
  assert.deepEqual(c.topics.map((t) => t.id), [tr.topics[3].id, tr.topics[0].id]);
  assert.equal(c.name, 'Novo ciclo');
  assert.equal(JSON.stringify(lib.track('en-a1-contatos')!.topics), before);
  assert.equal(defaultCycleName([], tr, lib), 'Inglês A1 · Ciclo 1');
  assert.equal(defaultCycleName([c], tr, lib), 'Inglês A1 · Ciclo 2');
  assert.equal(defaultCycleName([], lib.track('dev-logica')!, lib), 'Primeiros passos · Ciclo 1');
});

test('situação dos tópicos e progresso', () => {
  const lib = library(emptyStudy());
  const tr = lib.track('ia-prompts')!;
  let c = newCycle({ trackId: tr.id, topicIds: tr.topics.slice(0, 3).map((t) => t.id), name: 'Prompts', notebookId: null, today: TODAY });
  assert.deepEqual(cycleCounts(c), { total: 3, done: 0, doing: 0, todo: 3, pct: 0 });
  c = setTopicStatus(c, tr.topics[0].id, 'feito', TODAY);
  c = setTopicStatus(c, tr.topics[1].id, 'andando', TODAY);
  assert.deepEqual(cycleCounts(c), { total: 3, done: 1, doing: 1, todo: 1, pct: 33 });
  assert.equal(c.topics[0].doneAt, TODAY);
  assert.equal(setTopicStatus(c, tr.topics[0].id, 'afazer', TODAY).topics[0].doneAt, null);
  assert.equal(topicState([c], tr.topics[0].id)?.status, 'feito');
  assert.equal(topicState([c], tr.topics[4].id), null);
  assert.deepEqual(trackProgress([c], tr), { done: 1, total: 5 });
  // Livres para o próximo ciclo: nem concluídos, nem no ciclo em andamento.
  assert.deepEqual(remainingTopics(tr, [c]).map((t) => t.id), [tr.topics[3].id, tr.topics[4].id]);
  // Ciclo encerrado libera o que não foi concluído.
  const fim = { ...c, finishedAt: TODAY };
  assert.deepEqual(remainingTopics(tr, [fim]).map((t) => t.id), tr.topics.slice(1).map((t) => t.id));
  assert.equal(nextStatus('afazer'), 'andando');
  assert.equal(nextStatus('andando'), 'feito');
  assert.equal(nextStatus('feito'), 'afazer');
});

test('recomendações são avisos: somem se o anterior foi escolhido ou já estudado', () => {
  const lib = library(emptyStudy());
  const tr = lib.track('en-a1-contatos')!;
  const pron = tr.topics.find((t) => t.name === 'Pronomes e verbo to be')!;
  const perg = tr.topics.find((t) => t.name === 'Perguntas e respostas')!;
  assert.deepEqual(missingBefore(tr, [perg.id], []).map((m) => m.beforeId), [pron.id]);
  assert.deepEqual(missingBefore(tr, [perg.id, pron.id], []), []);
  const feito = setTopicStatus(newCycle({ trackId: tr.id, topicIds: [pron.id], name: 'x', notebookId: null, today: TODAY }), pron.id, 'feito', TODAY);
  assert.deepEqual(missingBefore(tr, [perg.id], [feito]), []);
});

test('notebook a partir da trilha, assuntos sem duplicar e mapa sugerido', () => {
  const lib = library(emptyStudy());
  const tr = lib.track('en-a1-contatos')!;
  const nb = newNotebook('Inglês A1', tr, [tr.topics[0].id, tr.topics[1].id], 'agora');
  assert.deepEqual(nb.pages.map((s) => s.name), ['Cumprimentos e apresentações', 'Alfabeto e pronúncia']);
  assert.equal(nb.trackId, tr.id);
  const nb2 = addTopicsAsPages(nb, [tr.topics[1], tr.topics[2]]);
  assert.equal(nb2.pages.length, 3);
  const livre = newNotebook('', null, null, 'agora');
  assert.equal(livre.name, 'Novo notebook');
  assert.equal(livre.pages.length, 1);
  const m = mapFromSuggestion(SUGGESTED_MAPS[0], 'agora');
  assert.equal(m.branches.length, SUGGESTED_MAPS[0].branches.length);
  m.branches[0].leaves.push('x');
  assert.notEqual(SUGGESTED_MAPS[0].branches[0][1].length, m.branches[0].leaves.length);
  assert.deepEqual(moveItem([1, 2, 3], 0, 1), [2, 1, 3]);
  assert.deepEqual(moveItem([1, 2, 3], 2, 1), [1, 2, 3]);
});

test('dados antigos e backups: estudos começam vazios e campos ruins são corrigidos', () => {
  assert.deepEqual(normalize({ version: 2 }).study, emptyStudy());
  const s = normalizeStudy({
    archived: ['prod', 3],
    cycles: [{ id: 'c', trackId: 't', topics: [{ id: 'a', status: 'xyz' }, { id: 'b', status: 'feito', doneAt: TODAY }] }],
    sources: [{ id: 's', title: 'X', kind: 'nada' }],
    notebooks: [{ id: 'n', subjects: [{ id: 'su', blocks: [{ id: 'b', kind: 'pares', pairs: [['a', 'b'], [1, 2]] }] }] }],
  });
  assert.deepEqual(s.archived, ['prod']);
  assert.equal(s.cycles[0].topics[0].status, 'afazer');
  assert.equal(s.cycles[0].topics[1].doneAt, TODAY);
  assert.equal(s.sources[0].kind, 'outro');
  assert.deepEqual(s.notebooks[0].pages[0].blocks[0].pairs, [['a', 'b']]);
});

test('páginas e subpáginas: ordem, mover, mudar de lugar e excluir', () => {
  const lib = library(emptyStudy());
  let nb = newNotebook('IA', null, null, 'agora', ' Estudos de IA ');
  assert.equal(nb.desc, 'Estudos de IA');
  // Tópicos de áreas diferentes no mesmo notebook, sem duplicar, com a origem guardada.
  const a = lib.track('ia-prompts')!.topics[0];
  const b = lib.track('dev-python')!.topics[0];
  nb = addTopicsAsPages(nb, [a, b, a], 'agora');
  assert.deepEqual(nb.pages.map((p) => p.topicId), [null, a.id, b.id]);
  const [p0, p1, p2] = nb.pages;
  const sub = newPage('Exemplos', null, p1.id, 'agora');
  nb = { ...nb, pages: [...nb.pages, sub] };
  assert.deepEqual(pageTree(nb).map((x) => [x.page.name, x.depth]), [[p0.name, 0], [p1.name, 0], ['Exemplos', 1], [p2.name, 0]]);
  // Mover só entre irmãs.
  assert.deepEqual(pageTree(movePage(nb, p2.id, -1)).map((x) => x.page.id), [p0.id, p2.id, p1.id, sub.id]);
  assert.equal(movePage(nb, sub.id, 1), nb);
  // Um nível só: página com subpágina não vira subpágina; subpágina não recebe subpágina.
  assert.equal(setPageParent(nb, p1.id, p0.id), nb);
  assert.equal(setPageParent(nb, p2.id, sub.id), nb);
  assert.equal(setPageParent(nb, p2.id, p0.id).pages.find((p) => p.id === p2.id)!.parentId, p0.id);
  assert.equal(setPageParent(nb, sub.id, null).pages.find((p) => p.id === sub.id)!.parentId, null);
  // Excluir a página leva as subpáginas junto.
  assert.deepEqual(removePage(nb, p1.id).pages.map((p) => p.id), [p0.id, p2.id]);
});

test('notebooks antigos: assuntos viram páginas principais, sem perder nada', () => {
  const s = normalizeStudy({ notebooks: [{ id: 'n', name: 'Inglês', updatedAt: 'ontem', subjects: [{ id: 'a', name: 'Cumprimentos', topicId: 't1', blocks: [{ id: 'b', kind: 'nota', title: 'Anotações', text: 'oi' }] }] }] });
  const nb = s.notebooks[0];
  assert.equal(nb.desc, '');
  assert.deepEqual(nb.pages.map((p) => [p.id, p.name, p.parentId, p.topicId, p.updatedAt]), [['a', 'Cumprimentos', null, 't1', 'ontem']]);
  assert.equal(nb.pages[0].blocks[0].text, 'oi');
  // Subpágina apontando para página que não existe (ou para outra subpágina) vira principal.
  const t = normalizeStudy({ notebooks: [{ id: 'n', pages: [{ id: 'a' }, { id: 'b', parentId: 'a' }, { id: 'c', parentId: 'b' }, { id: 'd', parentId: 'x' }] }] });
  assert.deepEqual(t.notebooks[0].pages.map((p) => p.parentId), [null, 'a', null, null]);
});
