import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backStack, nextStack, replaceTop } from './navStack.ts';

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

test('caso do print: módulo → ferramenta → Mais → outro módulo; voltar = Mais → Início, sem ciclo', () => {
  let s = go(['inicio'], 'financas', 'switch');
  s = go(s, 'orcamento', 'switch');
  s = go(s, 'mais', 'switch');
  assert.deepEqual(s, ['inicio', 'mais']);
  s = go(s, 'diario'); // tocou no Diário dentro do Mais
  assert.deepEqual(backAll(s), ['mais', 'inicio']);
});

test('Mais pela barra sempre volta ao Início', () => {
  assert.deepEqual(backAll(go(['inicio', 'diario', 'humor'], 'mais', 'switch')), ['inicio']);
});

test('abrir uma tela que já está na trilha volta até ela', () => {
  assert.deepEqual(go(['inicio', 'mais', 'financas', 'orcamento'], 'mais'), ['inicio', 'mais']);
  assert.deepEqual(go(['inicio', 'mais', 'financas', 'orcamento'], 'financas', 'switch'), ['inicio', 'mais', 'financas']);
});

test('ir e voltar muitas vezes nunca passa do limite nem repete telas', () => {
  let s = ['inicio'];
  for (let k = 0; k < 50; k++) s = go(s, k % 2 ? 'mais' : `estudos/notebook/${k}`);
  assert.ok(s.length <= 8);
  assert.equal(new Set(s).size, s.length);
});

test('ferramenta aberta por um link fora do módulo passa pela casa do módulo', () => {
  assert.deepEqual(go(['inicio'], 'orcamento'), ['inicio', 'financas', 'orcamento']);
});

test('menu ☰ e barra: módulo fica logo acima do Início', () => {
  assert.deepEqual(go(['inicio', 'mais', 'estudos/notebook/1'], 'diario', 'switch'), ['inicio', 'diario']);
});

test('trocar a tela de cima no lugar não deixa a mesma tela duas vezes', () => {
  assert.deepEqual(replaceTop(['inicio', 'financas', 'financas/nova'], 'financas'), ['inicio', 'financas']);
  assert.deepEqual(replaceTop(['inicio'], 'agenda/hoje'), ['inicio', 'agenda/hoje']);
  assert.deepEqual(replaceTop(['inicio', 'financas'], 'inicio'), ['inicio']);
});

test('no Início, voltar continua no Início (o celular decide se sai do app)', () => {
  assert.deepEqual(backStack(['inicio']), ['inicio']);
});
