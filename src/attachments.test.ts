import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planFiles, referencedFiles } from './attachments.ts';
import { emptyData } from './data.ts';
import { trackChanges } from './sync.ts';
import type { AppData, JournalEntry } from './types.ts';

const entry = (id: string, photos: string[]): JournalEntry => ({
  id, createdAt: '2026-11-11T10:00:00.000Z', title: 'Dia', summary: '', content: '', tag: '', updatedAt: '',
  photos: photos.map((p) => ({ id: p, type: 'image/jpeg', w: 10, h: 10 })),
});
const S = (...x: string[]) => new Set(x);

test('fotos usadas pelos registros do Diário', () => {
  const d: AppData = { ...emptyData(), journal: [entry('e1', ['f1', 'f2']), entry('e2', ['f3'])] };
  assert.deepEqual([...referencedFiles(d)].sort(), ['f1', 'f2', 'f3']);
});

test('plano: sobe o que falta na nuvem, baixa o que falta no aparelho', () => {
  const p = planFiles(S('a', 'b', 'c'), S('a', 'b'), S('b', 'c'), {});
  assert.deepEqual(p.upload, ['a']);
  assert.deepEqual(p.download, ['c']);
  assert.deepEqual(p.deleteCloud, []);
  assert.deepEqual(p.deleteLocal, []);
});

test('plano: só apaga o que foi excluído (arquivo novo de outro aparelho fica)', () => {
  const p = planFiles(S(), S('velha', 'nova'), S('velha', 'nova'), { velha: 'T' });
  assert.deepEqual(p.deleteCloud, ['velha']);
  assert.deepEqual(p.deleteLocal, ['velha']);
});

test('tirar a foto ou excluir o registro entra nas exclusões', () => {
  const a: AppData = { ...emptyData(), journal: [entry('e1', ['f1', 'f2'])] };
  const semFoto = trackChanges(a, { ...a, journal: [entry('e1', ['f1'])] }, 'T1');
  assert.ok('f2' in semFoto.deleted);
  const semRegistro = trackChanges(semFoto, { ...semFoto, journal: [] }, 'T2');
  assert.ok('f1' in semRegistro.deleted && 'e1' in semRegistro.deleted);
});
