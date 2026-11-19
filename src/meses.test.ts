import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, monthsOfYear } from './utils.ts';

test('E44: os 12 meses do ano, em ordem', () => {
  const m = monthsOfYear(2026);
  assert.equal(m.length, 12);
  assert.equal(m[0], '2026-01');
  assert.equal(m[11], '2026-12');
});

test('E44: trocar de ano mantém o mês escolhido', () => {
  assert.equal(addMonths('2026-11', -12), '2025-11');
  assert.equal(addMonths('2026-11', 12), '2027-11');
});
