import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latestStamp, pickNewest } from './reserva.ts';

const copy = (stamp: string, del = '') => ({ stamps: { a: stamp, '@tasks': stamp }, deleted: del ? { x: del } : {} });

test('latestStamp pega a data mais nova de stamps e deleted', () => {
  assert.equal(latestStamp(copy('2026-11-10T10:00:00.000Z', '2026-11-12T08:00:00.000Z')), '2026-11-12T08:00:00.000Z');
  assert.equal(latestStamp(copy('2026-11-13T10:00:00.000Z')), '2026-11-13T10:00:00.000Z');
  assert.equal(latestStamp({}), '');
  assert.equal(latestStamp(null), '');
  assert.equal(latestStamp('lixo'), '');
});

test('sem reserva, vale a principal', () => {
  const main = copy('2026-11-10T10:00:00.000Z');
  assert.deepEqual(pickNewest(main, undefined), { value: main, from: 'principal' });
  assert.deepEqual(pickNewest(main, null), { value: main, from: 'principal' });
});

test('sem principal, vale a reserva', () => {
  const res = copy('2026-11-10T10:00:00.000Z');
  assert.deepEqual(pickNewest(undefined, res), { value: res, from: 'reserva' });
});

test('reserva mais nova ganha', () => {
  const main = copy('2026-11-10T10:00:00.000Z');
  const res = copy('2026-11-13T09:00:00.000Z');
  assert.equal(pickNewest(main, res).from, 'reserva');
});

test('reserva antiga (esquecida de outra vez) não apaga o que é mais novo', () => {
  const main = copy('2026-11-13T09:00:00.000Z');
  const res = copy('2026-11-01T09:00:00.000Z');
  assert.equal(pickNewest(main, res).from, 'principal');
});

test('empate ou reserva sem datas: fica a principal', () => {
  const main = copy('2026-11-13T09:00:00.000Z');
  assert.equal(pickNewest(main, copy('2026-11-13T09:00:00.000Z')).from, 'principal');
  assert.equal(pickNewest(main, {}).from, 'principal');
});
