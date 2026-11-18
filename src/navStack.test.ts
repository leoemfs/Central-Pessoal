import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backStack, historyMoves, nextStack, replaceTop } from './navStack.ts';

const HOMES: Record<string, string> = { financas: 'financas', orcamento: 'financas', relatorios: 'financas', diario: 'diario', humor: 'diario' };
const homeOf = (p: string) => HOMES[p] ?? null;
const go = (s: string[], to: string, kind: 'open' | 'switch' = 'open') => nextStack(s, to, kind, homeOf);

/** Aperta voltar até o Início, guardando as telas por onde passou. */
function backAll(s: string[]): string[] {
  const seen: string[] = [];
  while (s.length > 1) {
    s = backStack(s);
    seen.push(s[s.length - 1]);
  }
  return seen;
}

test('ferramenta → casa do módulo → Início', () => {
  let s = go(['inicio'], 'financas', 'switch');
  s = go(s, 'orcamento', 'switch');
  assert.deepEqual(s, ['inicio', 'financas', 'orcamento']);
  assert.deepEqual(backAll(s), ['financas', 'inicio']);
});

test('trocar de ferramenta não empilha: volta direto para a casa', () => {
  let s = go(['inicio', 'financas', 'orcamento'], 'relatorios', 'switch');
  assert.deepEqual(s, ['inicio', 'financas', 'relatorios']);
});

test('abrir uma tela que já está na trilha volta até ela', () => {
  assert.deepEqual(go(['inicio', 'guardados', 'financas', 'orcamento'], 'guardados'), ['inicio', 'guardados']);
  assert.deepEqual(go(['inicio', 'guardados', 'financas', 'orcamento'], 'financas', 'switch'), ['inicio', 'guardados', 'financas']);
});

test('ir e voltar muitas vezes nunca passa do limite nem repete telas', () => {
  let s = ['inicio'];
  for (let k = 0; k < 50; k++) s = go(s, k % 2 ? 'guardados' : `estudos/notebook/${k}`);
  assert.ok(s.length <= 8);
  assert.equal(new Set(s).size, s.length);
});

test('ferramenta aberta por um link fora do módulo passa pela casa do módulo', () => {
  assert.deepEqual(go(['inicio'], 'orcamento'), ['inicio', 'financas', 'orcamento']);
});

test('gaveta e barra: módulo fica logo acima do Início', () => {
  assert.deepEqual(go(['inicio', 'guardados', 'estudos/notebook/1'], 'diario', 'switch'), ['inicio', 'diario']);
});

test('trocar a tela de cima no lugar não deixa a mesma tela duas vezes', () => {
  assert.deepEqual(replaceTop(['inicio', 'financas', 'financas/nova'], 'financas'), ['inicio', 'financas']);
  assert.deepEqual(replaceTop(['inicio'], 'agenda/hoje'), ['inicio', 'agenda/hoje']);
  assert.deepEqual(replaceTop(['inicio', 'financas'], 'inicio'), ['inicio']);
});

test('no Início, voltar continua no Início (o celular decide se sai do app)', () => {
  assert.deepEqual(backStack(['inicio']), ['inicio']);
});

test('E39: entradas do histórico a voltar e a criar ao trocar de trilha', () => {
  assert.deepEqual(historyMoves(1, 2), { back: 0, push: 1 });
  assert.deepEqual(historyMoves(2, 4), { back: 0, push: 2 });
  assert.deepEqual(historyMoves(3, 2), { back: 1, push: 0 });
  assert.deepEqual(historyMoves(3, 3), { back: 0, push: 0 });
  assert.deepEqual(historyMoves(3, 1, 2), { back: 4, push: 0 });
  assert.deepEqual(historyMoves(2, 3, 1), { back: 1, push: 1 });
});
