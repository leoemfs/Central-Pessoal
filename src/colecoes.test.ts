import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupLibrary, moveCollection, moveItem, newCollection, normalizeCollections, placeItem, removeCollection, renameCollection, setItems, toggleCollection } from './colecoes.ts';
import { emptyStudy, normalizeStudy } from './estudos.ts';
import { applyPack, PACK_FORMAT, type StudyPack } from './studyPack.ts';

// As linhas da Biblioteca: área (id) ou curso importado (pk-<id>).
const items = ['idiomas', 'dev', 'ia', 'prod', 'carreira', 'pk-claude', 'pk-github', 'pk-excel'].map((key) => ({ key, name: key }));

test('coleções: agrupar, um lugar só e o resto fica nas listas', () => {
  const ia = newCollection(' Desenvolvimento com IA ', ['pk-claude', 'pk-github', 'ia', 'ia']);
  assert.equal(ia.name, 'Desenvolvimento com IA');
  assert.deepEqual(ia.items, ['pk-claude', 'pk-github', 'ia']);
  let cols = [ia, newCollection('Trabalho', ['pk-excel', 'prod', 'sumiu'])];
  const g = groupLibrary(cols, items);
  assert.deepEqual(g.groups.map((x) => x.items.map((i) => i.key)), [['pk-claude', 'pk-github', 'ia'], ['pk-excel', 'prod']]);
  assert.deepEqual(g.loose.map((i) => i.key), ['idiomas', 'dev', 'carreira']);
  // Marcar na coleção um item de outra: ele muda (e conta quantos mudaram).
  const r = setItems(cols, cols[1].id, ['prod', 'pk-claude']);
  assert.equal(r.moved, 1);
  assert.deepEqual(r.cols.map((c) => c.items), [['pk-github', 'ia'], ['prod', 'pk-claude']]);
  // Mudar de coleção pelo "Organizar", e tirar de todas.
  cols = placeItem(r.cols, 'ia', cols[1].id);
  assert.deepEqual(cols.map((c) => c.items), [['pk-github'], ['prod', 'pk-claude', 'ia']]);
  assert.deepEqual(placeItem(cols, 'ia', null).map((c) => c.items), [['pk-github'], ['prod', 'pk-claude']]);
  // Item arquivado (fora da lista de visíveis) some da coleção sem perder o lugar.
  const semIa = groupLibrary(cols, items.filter((i) => i.key !== 'ia'));
  assert.deepEqual(semIa.groups[1].items.map((i) => i.key), ['prod', 'pk-claude']);
  assert.deepEqual(cols[1].items, ['prod', 'pk-claude', 'ia']);
});

test('coleções: ordem, renomear, recolher e excluir sem apagar nada', () => {
  const a = newCollection('A', ['idiomas', 'x', 'dev', 'ia']);
  const b = newCollection('B');
  let cols = [a, b];
  assert.deepEqual(moveCollection(cols, b.id, -1).map((c) => c.name), ['B', 'A']);
  assert.equal(moveCollection(cols, a.id, -1), cols);
  // Mover item pula o que não aparece (área que sumiu ou foi arquivada).
  const vis = new Set(['idiomas', 'dev', 'ia']);
  assert.deepEqual(moveItem(cols, a.id, 'dev', -1, vis)[0].items, ['dev', 'x', 'idiomas', 'ia']);
  assert.deepEqual(moveItem(cols, a.id, 'ia', 1, vis)[0].items, a.items);
  cols = renameCollection(cols, a.id, '  Novo nome ');
  assert.equal(cols[0].name, 'Novo nome');
  assert.equal(renameCollection(cols, a.id, '  ')[0].name, 'Novo nome');
  assert.equal(toggleCollection(cols, a.id)[0].open, false);
  assert.equal(groupLibrary(removeCollection(cols, a.id), items).loose.length, items.length);
});

test('coleções: dados antigos, backup e item repetido em duas coleções', () => {
  assert.deepEqual(normalizeStudy({}).collections, []);
  assert.deepEqual(normalizeCollections([{ id: 'x', name: '  ', open: false, items: ['ia', 3, '  ', 'pk-claude'] }, { id: 'y', items: ['ia', 'dev'] }, { name: 'sem id' }]), [
    { id: 'x', name: 'Coleção', open: false, items: ['ia', 'pk-claude'] },
    { id: 'y', name: 'Coleção', open: true, items: ['dev'] },
  ]);
  const pack: StudyPack = { formato: PACK_FORMAT, versao: 1, id: 'novo', nome: 'Novo', area: { nome: 'Z' }, temas: [{ nome: 'T', trilhas: [{ nome: 'Tr', topicos: [{ nome: 'A' }] }] }] };
  const s = { ...emptyStudy(), collections: [newCollection('IA', ['pk-claude'])] };
  assert.deepEqual(normalizeStudy(JSON.parse(JSON.stringify(s))).collections, s.collections);
  // Importar curso não mexe nas coleções.
  assert.deepEqual(applyPack(s, pack, '2026-11-18T10:00:00.000Z').study.collections, s.collections);
});
