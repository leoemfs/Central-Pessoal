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
  assert.deepEqual(fitFavorites(['listas', 'nucleo', 'diario'], ['financas', 'diario', 'listas']), ['listas', 'diario', 'financas', 'agenda']);
  // E1: Revisão não é mais favorito (mora no Diário).
  assert.ok(!fitFavorites(['revisao'], ['financas', 'diario', 'listas']).includes('revisao'));
  assert.deepEqual(fitFavorites(['agenda'], ['financas', 'diario', 'agenda', 'listas', 'estudos']), ['agenda', 'financas', 'diario', 'listas']);
  assert.deepEqual(tapFavorite(['a', 'b', 'c', 'd'], 'e'), ['b', 'c', 'd', 'e']);
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

test('E26: o nome embaixo dos ícones aparece por padrão (inclusive para quem tinha o antigo barLabels desligado)', () => {
  assert.equal(normalize(undefined).settings.hideBarLabels, false);
  assert.equal(normalize({ version: 2, settings: { barLabels: false } }).settings.hideBarLabels, false);
  assert.equal(normalize({ version: 2, settings: { hideBarLabels: true } }).settings.hideBarLabels, true);
});

test('E25: a gaveta começa no jeito Misto (valores estranhos também)', () => {
  assert.equal(normalize(undefined).settings.drawerView, 'misto');
  assert.equal(normalize({ version: 2, settings: { drawerView: 'lista' } }).settings.drawerView, 'lista');
  assert.equal(normalize({ version: 2, settings: { drawerView: 'mosaico' } }).settings.drawerView, 'misto');
});

test('E29: ícones começam monocromáticos (valores estranhos também)', () => {
  assert.equal(normalize(undefined).settings.iconColors, 'mono');
  assert.equal(normalize({ version: 2, settings: { iconColors: 'cores' } }).settings.iconColors, 'cores');
  assert.equal(normalize({ version: 2, settings: { iconColors: 'arco-iris' } }).settings.iconColors, 'mono');
  assert.equal(normalize({ version: 2, settings: { iconColors: 'flat' } }).settings.iconColors, 'cores');
  assert.equal(normalize({ version: 2, settings: { iconColors: 'flat' } }).settings.iconStyle, 'flat');
  assert.equal(normalize(undefined).settings.iconStyle, 'classico');
  assert.equal(normalize(undefined).settings.frostedGlass, false);
  assert.equal(normalize({ version: 2, settings: { frostedGlass: true } }).settings.frostedGlass, true);
  assert.equal(normalize(undefined).settings.menuTipSeen, false);
  assert.deepEqual(normalize(undefined).settings.guidesSeen, []);
  assert.deepEqual(normalize({ version: 2, settings: { guidesSeen: ['estudos', 3] } }).settings.guidesSeen, ['estudos']);
  assert.equal(normalize({ version: 2, settings: { menuTipSeen: true } }).settings.menuTipSeen, true);
  assert.equal(normalize({ version: 2, settings: { iconStyle: 'flat', iconColors: 'mono' } }).settings.iconColors, 'mono');
  assert.equal(normalize(undefined).settings.iconSize, 'm');
  assert.equal(normalize({ version: 2, settings: { iconSize: 'g' } }).settings.iconSize, 'g');
  assert.equal(normalize({ version: 2, settings: { iconSize: 'xg' } }).settings.iconSize, 'm');
});
