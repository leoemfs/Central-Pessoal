import { test } from 'node:test';
import assert from 'node:assert/strict';
import { archiveGuide, GUIDES, markSeen, showGuideCard, visibleGuides } from './guias.ts';

test('E43: guia de módulo guardado não aparece na central', () => {
  assert.deepEqual(visibleGuides(() => false).map((g) => g.id), GUIDES.map((g) => g.id));
  assert.deepEqual(visibleGuides((m) => m === 'estudos').map((g) => g.id), ['financas', 'diario', 'agenda', 'listas']);
});

test('E43: marcar como visto não repete', () => {
  assert.deepEqual(markSeen([], 'estudos'), ['estudos']);
  assert.deepEqual(markSeen(['estudos'], 'estudos'), ['estudos']);
});

test('E43: Finanças está na central, com 6 passos', () => {
  assert.equal(GUIDES.find((g) => g.id === 'financas')?.steps, 6);
});

test('E43: cartão da 1ª vez some ao arquivar ou depois de abrir o guia', () => {
  assert.equal(showGuideCard([], [], 'financas'), true);
  assert.equal(showGuideCard(['financas'], [], 'financas'), false);
  assert.equal(showGuideCard([], archiveGuide([], 'financas'), 'financas'), false);
  assert.deepEqual(archiveGuide(['financas'], 'financas'), ['financas']);
});

test('E43: Diário está na central, com 6 passos', () => {
  assert.equal(GUIDES.find((g) => g.id === 'diario')?.steps, 6);
});

test('E43: Agenda está na central, com 6 passos', () => {
  assert.equal(GUIDES.find((g) => g.id === 'agenda')?.steps, 6);
});

test('E43: Listas está na central, com 6 passos', () => {
  assert.equal(GUIDES.find((g) => g.id === 'listas')?.steps, 6);
});
