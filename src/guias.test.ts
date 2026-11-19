import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GUIDES, markSeen, visibleGuides } from './guias.ts';

test('E43: guia de módulo guardado não aparece na central', () => {
  assert.deepEqual(visibleGuides(() => false).map((g) => g.id), GUIDES.map((g) => g.id));
  assert.deepEqual(visibleGuides((m) => m === 'estudos'), []);
});

test('E43: marcar como visto não repete', () => {
  assert.deepEqual(markSeen([], 'estudos'), ['estudos']);
  assert.deepEqual(markSeen(['estudos'], 'estudos'), ['estudos']);
});
