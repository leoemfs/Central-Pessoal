import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrange, hideCard, moveCard, normalizeLayouts, showCard, type CardInfo } from './cardLayout.ts';

const CARDS: CardInfo[] = [
  { id: 'humor', label: 'Humor', lock: 'top' },
  { id: 'dia', label: 'Seu dia', lock: 'keep' },
  { id: 'orc', label: 'Orçamento' },
  { id: 'listas', label: 'Listas' },
  { id: 'aviso', label: 'Contas a vencer', lock: 'keep' },
];
const ids = (x: CardInfo[]) => x.map((c) => c.id);

test('sem nada salvo: ordem padrão', () => {
  assert.deepEqual(ids(arrange(CARDS, undefined).shown), ['humor', 'dia', 'orc', 'listas', 'aviso']);
});

test('subir e descer: o do topo nunca sai do lugar', () => {
  let l = moveCard(CARDS, undefined, 'aviso', -1);
  assert.deepEqual(ids(arrange(CARDS, l).shown), ['humor', 'dia', 'orc', 'aviso', 'listas']);
  l = moveCard(CARDS, l, 'dia', -1); // já é o primeiro dos que se movem
  assert.deepEqual(ids(arrange(CARDS, l).shown), ['humor', 'dia', 'orc', 'aviso', 'listas']);
  l = moveCard(CARDS, l, 'humor', 1); // trava "top"
  assert.equal(arrange(CARDS, l).shown[0].id, 'humor');
});

test('ocultar: só os sem trava; mostrar de novo volta ao mesmo lugar', () => {
  let l = hideCard(CARDS, undefined, 'orc');
  l = hideCard(CARDS, l, 'aviso'); // aviso importante: não some
  l = hideCard(CARDS, l, 'humor');
  const r = arrange(CARDS, l);
  assert.deepEqual(ids(r.shown), ['humor', 'dia', 'listas', 'aviso']);
  assert.deepEqual(ids(r.hidden), ['orc']);
  l = showCard(CARDS, l, 'orc');
  assert.deepEqual(ids(arrange(CARDS, l).shown), ['humor', 'dia', 'orc', 'listas', 'aviso']);
});

test('cartão novo numa atualização aparece; ordem salva antiga continua valendo', () => {
  const saved = { order: ['listas', 'orc', 'dia', 'aviso'], hidden: [] };
  const withNew = [...CARDS.slice(0, 3), { id: 'novo', label: 'Novo' }, ...CARDS.slice(3)];
  assert.deepEqual(ids(arrange(withNew, saved).shown), ['humor', 'listas', 'orc', 'dia', 'aviso', 'novo']);
  // Cartão que deixou de existir é ignorado.
  assert.deepEqual(ids(arrange(CARDS, { order: ['sumiu', 'aviso'], hidden: ['sumiu'] }).shown), ['humor', 'aviso', 'dia', 'orc', 'listas']);
});

test('backup: só o que é válido', () => {
  assert.deepEqual(normalizeLayouts({ inicio: { order: ['a', 'a', 3, 'b'], hidden: 'x' }, ruim: 5 }), { inicio: { order: ['a', 'b'], hidden: [] } });
  assert.deepEqual(normalizeLayouts(null), {});
});
