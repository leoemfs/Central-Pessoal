import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Uma chave esquecida numa junção de PRs prende todos os estilos seguintes dentro do bloco anterior.
test('styles.css: todo bloco aberto com { é fechado com }', () => {
  const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  css.split('\n').forEach((line, i) => {
    for (const ch of line) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      assert.ok(depth >= 0, `chave } sobrando na linha ${i + 1}`);
    }
  });
  assert.equal(depth, 0, 'algum bloco ficou sem a chave } de fechamento');
});
