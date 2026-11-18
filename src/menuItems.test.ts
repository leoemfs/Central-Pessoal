import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMenu, MENU_EDIT, MENU_SEARCH } from './menuItems.ts';

const ids = (m: { id: string }[]) => m.map((i) => i.id);

test('E41: tela sem ação não tem ⋮', () => {
  assert.deepEqual(buildMenu([], { editable: false, editing: false, search: 'Buscar em Finanças' }), []);
});

test('E41: Personalizar primeiro, ações da tela e a busca por último', () => {
  const m = buildMenu([{ id: 'pdf', label: 'Exportar em PDF' }], { editable: true, editing: false, search: 'Buscar em Estudos' });
  assert.deepEqual(ids(m), [MENU_EDIT, 'pdf', MENU_SEARCH]);
  assert.equal(m[2].search, true);
  assert.equal(m[0].label, 'Personalizar cartões');
});

test('E41: editando, a opção vira "Terminar de personalizar"', () => {
  const m = buildMenu([], { editable: true, editing: true, search: null });
  assert.deepEqual(ids(m), [MENU_EDIT]);
  assert.equal(m[0].label, 'Terminar de personalizar');
});

test('E41: busca própria da tela (Diário) aparece mesmo sem outras ações', () => {
  assert.deepEqual(ids(buildMenu([], { editable: false, editing: false, search: 'Buscar no diário', ownSearch: true })), [MENU_SEARCH]);
});
