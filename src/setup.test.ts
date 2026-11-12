import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './data.ts';
import { fitFavorites, isHidden, journalInvite, modulesFromAreas, moduleOf, normalizeRhythm, tapFavorite, toggleModule } from './setup.ts';

test('áreas marcam os módulos; sempre pelo menos 3 além de Notas e Você', () => {
  assert.deepEqual(modulesFromAreas(['dinheiro', 'casa']), ['financas', 'diario', 'listas', 'arquivo', 'voce']);
  assert.deepEqual(modulesFromAreas([]), ['financas', 'diario', 'agenda', 'arquivo', 'voce']);
  assert.ok(modulesFromAreas(['estudos', 'carreira', 'rotina']).includes('nucleo'));
});

test('desligar módulo nunca deixa menos de 3 à vista', () => {
  assert.deepEqual(toggleModule(['financas', 'diario', 'agenda'], 'diario'), ['financas', 'diario', 'agenda']);
  assert.deepEqual(toggleModule(['financas', 'diario', 'agenda', 'listas'], 'diario'), ['financas', 'agenda', 'listas']);
  assert.deepEqual(toggleModule(['agenda', 'financas', 'diario'], 'nucleo'), ['financas', 'diario', 'agenda', 'nucleo']);
  assert.deepEqual(toggleModule(['financas', 'diario', 'agenda'], 'nada'), ['financas', 'diario', 'agenda']);
});

test('favoritos só entre módulos à vista, na ordem dos toques', () => {
  assert.deepEqual(fitFavorites(['listas', 'nucleo', 'diario'], ['financas', 'diario', 'listas']), ['listas', 'diario', 'financas']);
  assert.deepEqual(tapFavorite(['a', 'b', 'c'], 'd'), ['b', 'c', 'd']);
  assert.deepEqual(tapFavorite(['a', 'b'], 'a'), ['b']);
});

test('telas pertencem aos módulos; guardado some do menu', () => {
  assert.equal(moduleOf('orcamento'), 'financas');
  assert.equal(moduleOf('agenda/tarefas'), 'agenda');
  assert.equal(moduleOf('ajustes'), null);
  const d = normalize({ version: 2, settings: { hiddenModules: ['listas'] } });
  assert.ok(isHidden(d, 'precos'));
  assert.ok(!isHidden(d, 'financas'));
});

test('quem já usa recebe o convite; instalação nova abre a montagem', () => {
  assert.equal(normalize(undefined).settings.setup, 'novo');
  assert.equal(normalize({ version: 2, expenses: [] }).settings.setup, 'convite');
  assert.equal(normalize({ version: 2, settings: { setup: 'feito' } }).settings.setup, 'feito');
  const old = normalize({ version: 2 });
  assert.deepEqual(old.settings.hiddenModules, []);
  assert.equal(old.settings.journalRhythm.mode, 'livre');
});

test('ritmo inválido vira "quando der"', () => {
  assert.equal(normalizeRhythm({ mode: 'dias', days: [] }).mode, 'livre');
  assert.equal(normalizeRhythm({ mode: 'semana', perWeek: 9 }).perWeek, 3);
  assert.deepEqual(normalizeRhythm({ mode: 'dias', days: [4, 2, 2, 9] }).days, [2, 4]);
});

test('convite do Diário segue o ritmo e nunca cobra', () => {
  const wed = '2026-11-11'; // quarta
  assert.equal(journalInvite({ mode: 'livre', perWeek: 3, days: [] }, [], wed), null);
  assert.equal(journalInvite({ mode: 'todo-dia', perWeek: 3, days: [] }, [], wed)!.invite, true);
  assert.equal(journalInvite({ mode: 'todo-dia', perWeek: 3, days: [] }, [wed], wed)!.invite, false);
  assert.equal(journalInvite({ mode: 'dias', perWeek: 3, days: [2, 4] }, [], wed), null);
  assert.equal(journalInvite({ mode: 'dias', perWeek: 3, days: [3] }, [], wed)!.invite, true);
  const week = journalInvite({ mode: 'semana', perWeek: 3, days: [] }, ['2026-11-09', '2026-11-08'], wed)!;
  assert.equal(week.done, 1); // domingo 08 é da semana anterior
  assert.equal(week.invite, true);
  const hit = journalInvite({ mode: 'semana', perWeek: 2, days: [] }, ['2026-11-09', '2026-11-10'], wed)!;
  assert.equal(hit.invite, false);
  assert.match(hit.text, /Meta da semana feita/);
});

test('Mais em lista ou grade: dados antigos e valores estranhos ficam em lista', () => {
  assert.equal(normalize(undefined).settings.moreLayout, 'lista');
  assert.equal(normalize({ version: 2, settings: {} }).settings.moreLayout, 'lista');
  assert.equal(normalize({ version: 2, settings: { moreLayout: 'mosaico' } }).settings.moreLayout, 'lista');
  assert.equal(normalize({ version: 2, settings: { moreLayout: 'grade' } }).settings.moreLayout, 'grade');
});
