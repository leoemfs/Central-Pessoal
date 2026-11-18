import test from 'node:test';
import assert from 'node:assert/strict';
import { archived, categoryCounts, cleanNames, dropCategory, ideaGroups, newNote, noteSection, renameCategory, switchKind, visibleNotes } from './notas.ts';
import { normalize } from './data.ts';

const T = '2026-11-18T10:00:00.000Z';
const n = (id: string, extra: Parameters<typeof newNote>[3] = {}, kind: 'nota' | 'ideia' = 'nota') => newNote(id, kind, T, extra);

test('nota antiga ganha os campos novos com padrão', () => {
  const d = normalize({ notes: [{ id: 'a', title: 'x', content: 'y', pinned: false, updatedAt: T }] });
  assert.deepEqual(
    { kind: d.notes[0].kind, category: d.notes[0].category, status: d.notes[0].status, archived: d.notes[0].archived },
    { kind: 'nota', category: '', status: 'nova', archived: false },
  );
  assert.deepEqual(d.settings.noteCategories, ['Inspiração', 'Ideia solta', 'Lembrete', 'Trabalho']);
  assert.deepEqual(d.settings.ideaTags, ['App', 'Pessoal', 'Trabalho', 'Casa']);
});

test('valores estranhos voltam ao padrão', () => {
  const d = normalize({ notes: [{ id: 'a', kind: 'xx', status: 'zz', archived: 'sim', category: 3 }], settings: { noteCategories: [' A ', 'a', '', 5] } });
  assert.equal(d.notes[0].kind, 'nota');
  assert.equal(d.notes[0].status, 'nova');
  assert.equal(d.notes[0].archived, false);
  assert.equal(d.notes[0].category, '');
  assert.deepEqual(d.settings.noteCategories, ['A']);
});

test('cleanNames: lista vazia vale (a pessoa apagou todas)', () => {
  assert.deepEqual(cleanNames([], ['x']), []);
  assert.deepEqual(cleanNames(undefined, ['x']), ['x']);
});

test('Notas: só notas não arquivadas, fixadas primeiro, e filtro por categoria', () => {
  const list = [
    n('1', { category: 'Trabalho', updatedAt: '2026-11-10T00:00:00Z' }),
    n('2', { pinned: true, updatedAt: '2026-11-01T00:00:00Z' }),
    n('3', { archived: true }),
    n('4', {}, 'ideia'),
  ];
  assert.deepEqual(visibleNotes(list).map((x) => x.id), ['2', '1']);
  assert.deepEqual(visibleNotes(list, 'Trabalho').map((x) => x.id), ['1']);
  assert.deepEqual(categoryCounts(list), { Trabalho: 1 });
});

test('Ideias: grupos por situação, na ordem Novas · Pensando · Guardadas, com filtro de etiqueta', () => {
  const list = [
    n('a', { status: 'guardada', category: 'App' }, 'ideia'),
    n('b', { status: 'nova', category: 'Casa' }, 'ideia'),
    n('c', { status: 'nova', category: 'App', archived: true }, 'ideia'),
    n('d', {}),
  ];
  assert.deepEqual(ideaGroups(list).map((g) => [g.label, g.items.map((x) => x.id)]), [['Novas', ['b']], ['Guardadas', ['a']]]);
  assert.deepEqual(ideaGroups(list, 'App').map((g) => g.label), ['Guardadas']);
});

test('Arquivados separa ideias e notas; noteSection aponta a tela certa', () => {
  const list = [n('a', { archived: true }, 'ideia'), n('b', { archived: true }), n('c')];
  const a = archived(list);
  assert.deepEqual([a.ideas.map((x) => x.id), a.notes.map((x) => x.id)], [['a'], ['b']]);
  assert.equal(noteSection(list[0]), 'notasarq');
  assert.equal(noteSection(list[2]), 'arquivo');
  assert.equal(noteSection(n('d', {}, 'ideia')), 'ideias');
});

test('trocar nota ↔ ideia limpa a categoria; apagar e renomear categoria', () => {
  const x = switchKind(n('1', { category: 'Trabalho' }), T);
  assert.equal(x.kind, 'ideia');
  assert.equal(x.category, '');
  const list = [n('1', { category: 'Trabalho' }), n('2', { category: 'Trabalho' }, 'ideia')];
  assert.deepEqual(dropCategory(list, 'nota', 'Trabalho').map((y) => y.category), ['', 'Trabalho']);
  assert.deepEqual(renameCategory(list, 'ideia', 'Trabalho', 'Job').map((y) => y.category), ['Trabalho', 'Job']);
});
