import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ACCENTS, accentCss, contrast, effectiveAccent, normalizeAccent } from './theme.ts';

const DARK_SURFACES = ['#000000', '#0f0f10', '#1c1c1e'];
const LIGHT_SURFACES = ['#ffffff', '#f4f5f7', '#f0f1f4'];

test('toda cor de destaque tem bom contraste nos dois temas', () => {
  for (const a of ACCENTS) {
    for (const bg of DARK_SURFACES) assert.ok(contrast(a.dark.text, bg) >= 4.5, `${a.name} (escuro) sobre ${bg}: ${contrast(a.dark.text, bg).toFixed(2)}`);
    for (const bg of LIGHT_SURFACES) assert.ok(contrast(a.light.text, bg) >= 4.5, `${a.name} (claro) sobre ${bg}: ${contrast(a.light.text, bg).toFixed(2)}`);
    assert.ok(contrast(a.dark.on, a.dark.fill) >= 4.5, `${a.name}: texto do botão no escuro`);
    assert.ok(contrast(a.light.on, a.light.fill) >= 4.5, `${a.name}: texto do botão no claro`);
  }
});

test('padrão: escuro verde, claro azul; escolha vale nos dois', () => {
  assert.equal(effectiveAccent(null, 'dark').id, 'verde');
  assert.equal(effectiveAccent(null, 'light').id, 'azul');
  assert.equal(effectiveAccent('roxo', 'light').id, 'roxo');
  assert.equal(effectiveAccent('nao-existe', 'dark').id, 'verde');
});

test('valor salvo inválido volta ao padrão', () => {
  assert.equal(normalizeAccent('rosa'), 'rosa');
  assert.equal(normalizeAccent('pink'), null);
  assert.equal(normalizeAccent(undefined), null);
  assert.equal(normalizeAccent(3), null);
});

test('styles.css tem exatamente as cores da paleta', () => {
  const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
  assert.ok(css.includes(accentCss()), 'o bloco "Cores de destaque" do styles.css está diferente da paleta (gere de novo com accentCss() de src/theme.ts)');
});
