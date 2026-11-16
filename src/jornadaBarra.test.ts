import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAME_TABS, gameBarOn, journeyTab } from './jornada/tabs.ts';

test('N2.11: cada endereço abre a sua tela da Jornada; o resto abre a principal', () => {
  assert.equal(journeyTab(''), 'inicio');
  assert.equal(journeyTab('arsenal'), 'arsenal');
  assert.equal(journeyTab('baus'), 'baus');
  assert.equal(journeyTab('ficha/algo'), 'ficha');
  assert.equal(journeyTab('codex'), 'codex');
});

test('N2.11/N2.15: barra do jogo só com a Jornada em uso; 10 botões, Campanha, Codex e Mini games com cadeado', () => {
  const on = { journeyUnlockedAt: '2026-11-16', journeyChoice: 'quero' };
  assert.equal(gameBarOn(on, true), true);
  assert.equal(gameBarOn(on, false), false, 'antes de criar o personagem');
  assert.equal(gameBarOn({ ...on, journeyChoice: 'depois' }, true), false);
  assert.equal(gameBarOn({ ...on, journeyUnlockedAt: null }, true), false);
  assert.equal(GAME_TABS.length, 10);
  assert.deepEqual(GAME_TABS.filter((t) => t.locked).map((t) => t.id), ['campanha', 'jogos']);
  assert.equal(journeyTab('loja'), 'loja');
  assert.equal(journeyTab('pet'), 'pet');
});
