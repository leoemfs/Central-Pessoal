import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appearanceSummary, SETTINGS_GROUPS, SETTINGS_PAGES, settingsPage } from './settingsPages.ts';

test('endereço abre a página do tema', () => {
  assert.equal(settingsPage('aparencia')?.label, 'Aparência');
  assert.equal(settingsPage('backup/algo')?.id, 'backup');
});

test('endereço vazio ou desconhecido mostra a lista', () => {
  assert.equal(settingsPage(''), null);
  assert.equal(settingsPage('xyz'), null);
});

test('cada tema aparece em um lugar só', () => {
  const inGroups = SETTINGS_GROUPS.flat();
  assert.equal(new Set(inGroups).size, inGroups.length);
  // A conta fica no topo, fora dos grupos; todas as outras estão em algum grupo.
  for (const p of SETTINGS_PAGES) assert.equal(inGroups.includes(p.id), p.id !== 'conta', p.id);
});

test('resumo da aparência', () => {
  assert.equal(appearanceSummary('dark', null), 'Escuro · cor padrão');
  assert.equal(appearanceSummary('system', 'Roxo'), 'Automático · Roxo');
});
