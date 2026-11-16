import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCrumbs } from './crumbs.ts';

const LABELS: Record<string, string> = { inicio: 'Início', financas: 'Finanças', orcamento: 'Orçamento', mais: 'Mais', estudos: 'Estudos', diario: 'Diário' };
const labelOf = (p: string) => LABELS[p] ?? null;
const none = { items: null, title: null };
const show = (c: { label: string; to?: string }[]) => c.map((x) => (x.to ? `${x.label}→${x.to}` : `[${x.label}]`)).join(' › ');

test('ferramenta do módulo: Início › Finanças › Orçamento', () => {
  assert.equal(show(buildCrumbs(['inicio', 'financas', 'orcamento'], labelOf, none)), 'Início→inicio › Finanças→financas › [Orçamento]');
});

test('no Início: só Início, sem link', () => {
  assert.equal(show(buildCrumbs(['inicio'], labelOf, none)), '[Início]');
});

test('tela de dentro com nome próprio entra como último nível', () => {
  assert.equal(show(buildCrumbs(['inicio', 'diario'], labelOf, { items: null, title: 'Humor' })), 'Início→inicio › Diário→diario › [Humor]');
  // nome igual ao da seção não repete
  assert.equal(show(buildCrumbs(['inicio', 'diario'], labelOf, { items: null, title: 'Diário' })), 'Início→inicio › [Diário]');
});

test('Estudos: o caminho da própria tela entra inteiro e as telas de Estudos da trilha não repetem', () => {
  const items = [{ label: 'Biblioteca', to: 'estudos/biblioteca' }, { label: 'Idiomas', to: 'estudos/area/1' }, { label: 'Inglês' }];
  assert.equal(
    show(buildCrumbs(['inicio', 'estudos', 'estudos/biblioteca', 'estudos/area/1', 'estudos/tema/2'], labelOf, { items, title: 'Inglês' })),
    'Início→inicio › Estudos→estudos › Biblioteca→estudos/biblioteca › Idiomas→estudos/area/1 › [Inglês]',
  );
});

test('vindo pelo Mais: Início › Mais › Diário', () => {
  assert.equal(show(buildCrumbs(['inicio', 'mais', 'diario'], labelOf, none)), 'Início→inicio › Mais→mais › [Diário]');
});
