import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupLibrary, libraryItems, moveCollection, moveItem, newCollection, normalizeCollections, placeItem, removeCollection, renameCollection, setItems, toggleCollection } from './colecoes.ts';
import { emptyStudy, library, normalizeStudy } from './estudos.ts';
import { applyPack, PACK_FORMAT, type StudyPack } from './studyPack.ts';

const NOW = '2026-11-18T10:00:00.000Z';
const pack = (id: string, area: StudyPack['area'], temas = 1): StudyPack => ({
  formato: PACK_FORMAT, versao: 1, id, nome: `Curso ${id}`, area,
  temas: Array.from({ length: temas }, (_, i) => ({ nome: `Tema ${i}`, trilhas: [{ nome: `Trilha ${i}`, topicos: [{ nome: 'A' }, { nome: 'B' }] }] })),
});

function setup() {
  let s = emptyStudy();
  s = applyPack(s, pack('claude', { nome: 'IA', catalogo: 'ia' }), NOW).study; // curso dentro de área do app
  s = applyPack(s, pack('github', { nome: 'Dev', catalogo: 'dev' }, 2), NOW).study; // 2 temas
  s = applyPack(s, pack('excel', { nome: 'Planilhas' }), NOW).study; // área própria
  return s;
}

test('itens da Biblioteca: áreas, curso com área própria e cursos dentro de áreas do app', () => {
  const s = setup();
  const items = libraryItems(s, library(s));
  const keys = items.map((i) => i.key);
  assert.ok(keys.includes('a:idiomas') && keys.includes('a:ia') && keys.includes('a:dev'));
  const excel = items.find((i) => i.key === 'a:pk-excel')!;
  assert.equal(excel.course, true);
  assert.equal(excel.icon, 'cap');
  // Curso com área própria aparece uma vez só (como a área), nunca também como "c:".
  assert.equal(keys.includes('c:excel'), false);
  const claude = items.find((i) => i.key === 'c:claude')!;
  assert.deepEqual([claude.course, claude.tracks, claude.topics, claude.to], [true, 1, 2, 'estudos/tema/pk-claude-t-tema-0']);
  // Curso com mais de um tema abre a área.
  assert.equal(items.find((i) => i.key === 'c:github')!.to, 'estudos/area/dev');
  // Área arquivada some, e o curso dentro dela também.
  const arq = { ...s, archived: ['ia'] };
  const k2 = libraryItems(arq, library(arq)).map((i) => i.key);
  assert.equal(k2.includes('a:ia') || k2.includes('c:claude'), false);
});

test('coleções: agrupar, um lugar só e o resto em "Outras áreas"', () => {
  const s = setup();
  const items = libraryItems(s, library(s));
  const ia = newCollection(' Desenvolvimento com IA ', ['c:claude', 'c:github', 'a:ia', 'a:ia']);
  assert.equal(ia.name, 'Desenvolvimento com IA');
  assert.deepEqual(ia.items, ['c:claude', 'c:github', 'a:ia']);
  let cols = [ia, newCollection('Trabalho', ['a:pk-excel', 'a:prod', 'a:sumiu'])];
  const g = groupLibrary(cols, items);
  assert.deepEqual(g.groups.map((x) => x.items.map((i) => i.key)), [['c:claude', 'c:github', 'a:ia'], ['a:pk-excel', 'a:prod']]);
  assert.ok(!g.loose.some((i) => ['c:claude', 'a:prod', 'a:pk-excel'].includes(i.key)));
  assert.equal(g.loose.length + 5, items.length);
  // Marcar na coleção um item de outra: ele muda (e conta quantos mudaram).
  const r = setItems(cols, cols[1].id, ['a:prod', 'c:claude']);
  assert.equal(r.moved, 1);
  assert.deepEqual(r.cols.map((c) => c.items), [['c:github', 'a:ia'], ['a:prod', 'c:claude']]);
  // Mudar de coleção pelo "Organizar", e tirar de todas.
  cols = placeItem(r.cols, 'a:ia', cols[1].id);
  assert.deepEqual(cols.map((c) => c.items), [['c:github'], ['a:prod', 'c:claude', 'a:ia']]);
  assert.deepEqual(placeItem(cols, 'a:ia', null).map((c) => c.items), [['c:github'], ['a:prod', 'c:claude']]);
});

test('coleções: ordem, renomear, recolher e excluir sem apagar nada', () => {
  const a = newCollection('A', ['a:idiomas', 'a:x', 'a:dev', 'a:ia']);
  const b = newCollection('B');
  let cols = [a, b];
  assert.deepEqual(moveCollection(cols, b.id, -1).map((c) => c.name), ['B', 'A']);
  assert.equal(moveCollection(cols, a.id, -1), cols);
  // Mover item pula o que não aparece (área que sumiu ou foi arquivada).
  const vis = new Set(['a:idiomas', 'a:dev', 'a:ia']);
  assert.deepEqual(moveItem(cols, a.id, 'a:dev', -1, vis)[0].items, ['a:dev', 'a:x', 'a:idiomas', 'a:ia']);
  assert.deepEqual(moveItem(cols, a.id, 'a:ia', 1, vis)[0].items, a.items);
  cols = renameCollection(cols, a.id, '  Novo nome ');
  assert.equal(cols[0].name, 'Novo nome');
  assert.equal(renameCollection(cols, a.id, '  ')[0].name, 'Novo nome');
  assert.equal(toggleCollection(cols, a.id)[0].open, false);
  const s = setup();
  const items = libraryItems(s, library(s));
  const sem = removeCollection(cols, a.id);
  assert.equal(groupLibrary(sem, items).loose.length, items.length);
});

test('coleções: dados antigos, backup e item repetido em duas coleções', () => {
  assert.deepEqual(normalizeStudy({}).collections, []);
  assert.deepEqual(normalizeCollections([{ id: 'x', name: '  ', open: false, items: ['a:ia', 3, 'lixo', 'c:claude'] }, { id: 'y', items: ['a:ia', 'a:dev'] }, { name: 'sem id' }]), [
    { id: 'x', name: 'Coleção', open: false, items: ['a:ia', 'c:claude'] },
    { id: 'y', name: 'Coleção', open: true, items: ['a:dev'] },
  ]);
  const s = { ...setup(), collections: [newCollection('IA', ['c:claude'])] };
  assert.deepEqual(normalizeStudy(JSON.parse(JSON.stringify(s))).collections, s.collections);
  // Importar curso não mexe nas coleções.
  assert.deepEqual(applyPack(s, pack('novo', { nome: 'Z' }), NOW).study.collections, s.collections);
});
