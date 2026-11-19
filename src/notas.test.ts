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

import { becameRoute, linesOf, titleOf, transformNote } from './notas.ts';

const base = () => normalize({ notes: [newNote('n1', 'ideia', T, { title: 'Organizar a área', content: '- Separar ferramentas\n- Comprar caixas\n\n[ ] Pintar' })] });

test('linesOf tira marcadores e linhas vazias; titleOf usa a 1ª linha sem título', () => {
  assert.deepEqual(linesOf('- a\n* b\n1. c\n[x] d\n\n  e  '), ['a', 'b', 'c', 'd', 'e']);
  assert.equal(titleOf(newNote('x', 'nota', T, { content: 'Primeira\nsegunda' })), 'Primeira');
  assert.equal(titleOf(newNote('x', 'nota', T)), 'Sem título');
});

test('virar tarefa: cria na Agenda com prazo e manda a nota para Arquivados com o atalho', () => {
  const d = transformNote(base(), 'n1', { kind: 'tarefa', date: '2026-11-20' }, 't1', T);
  const t = d.tasks.find((x) => x.id === 't1')!;
  assert.equal(t.title, 'Organizar a área');
  assert.equal(t.due, '2026-11-20');
  assert.match(t.notes, /Separar ferramentas/);
  assert.deepEqual([d.notes[0].archived, d.notes[0].became], [true, { kind: 'tarefa', id: 't1' }]);
  assert.equal(becameRoute(d, d.notes[0].became!), 'tarefas');
  // De novo não faz nada (já virou).
  assert.equal(transformNote(d, 'n1', { kind: 'tarefa' }, 't2', T), d);
});

test('compromisso precisa de dia', () => {
  const d0 = base();
  assert.equal(transformNote(d0, 'n1', { kind: 'compromisso' }, 'e1', T), d0);
  const d = transformNote(d0, 'n1', { kind: 'compromisso', date: '2026-11-21', time: '15:00' }, 'e1', T);
  assert.deepEqual(d.events.map((e) => [e.title, e.date, e.time]), [['Organizar a área', '2026-11-21', '15:00']]);
});

test('virar lista: cada linha vira item; virar notebook: o texto vira a página', () => {
  const d0 = normalize({ ...base(), listCategories: [{ id: 'c1', name: 'Casa', icon: 'home', color: '#000', kind: 'compras' }] });
  const d = transformNote(d0, 'n1', { kind: 'lista', categoryId: 'c1' }, 'x', T);
  const list = d.lists.find((l) => l.name === 'Organizar a área')!;
  assert.deepEqual(list.items.map((i) => i.text), ['Separar ferramentas', 'Comprar caixas', 'Pintar']);
  assert.equal(list.categoryId, 'c1');
  assert.equal(becameRoute(d, d.notes[0].became!), `listas/${list.id}`);
  const d2 = transformNote(base(), 'n1', { kind: 'notebook' }, 'x', T);
  const nb = d2.study.notebooks.find((x) => x.id === d2.notes[0].became!.id)!;
  assert.equal(nb.name, 'Organizar a área');
  assert.equal(nb.pages.length, 1);
  assert.match(JSON.stringify(nb.pages[0].doc), /Comprar caixas/);
});

test('virar meta de carreira; atalho some se a meta foi apagada', () => {
  const d = transformNote(base(), 'n1', { kind: 'meta' }, 'x', T);
  const b = d.notes[0].became!;
  assert.equal(d.career.goals.find((g) => g.id === b.id)!.title, 'Organizar a área');
  assert.equal(becameRoute({ ...d, career: { ...d.career, goals: [] } }, b), null);
});

test('became estranho volta a null', () => {
  const d = normalize({ notes: [{ id: 'a', became: { kind: 'foguete', id: 'x' } }, { id: 'b', became: { kind: 'lista', id: 'l1' } }] });
  assert.deepEqual(d.notes.map((n) => n.became), [null, { kind: 'lista', id: 'l1' }]);
});
