import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './data.ts';
import { attributes } from './jornada/rules.ts';
import { wantedEvents } from './calendarSync.ts';
import { healthWeeks } from './saude.ts';
import {
  allTaken, daysText, dosesOn, endMed, isActiveOn, linkMedsHabit, medCount, medFullDays, medHabitCandidate, newMed, normalizeMeds, removeMed, saveMed,
  timesText, toggleTaken,
} from './remedios.ts';
import type { AppData, Medicine } from './types.ts';

const SUN = '2026-11-15';
const MON = '2026-11-16';

const med = (extra: Partial<Medicine> = {}): Medicine => ({ ...newMed('m1', '2026-11-10', 'x'), name: 'Vitamina D', dose: '1 cápsula', ...extra });
const withMeds = (...ms: Medicine[]): AppData => ms.reduce((d, m) => saveMed(m)(d), normalize({}));

test('dados antigos ganham Remédios vazios; lixo é limpo', () => {
  const h = normalize({}).health;
  assert.deepEqual([h.meds, h.taken, h.medsHabitId], [[], {}, null]);
  const ms = normalizeMeds([{ id: 'a', times: ['20:00', '8h', '08:00', '20:00'], days: [9], start: 'ontem', end: '2026-12-01', remind: 'x', createdAt: '2026-11-01T10:00:00Z' }, { sem: 'id' }]);
  assert.equal(ms.length, 1);
  assert.deepEqual(ms[0].times, ['08:00', '20:00']);
  assert.deepEqual(ms[0].days, [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(ms[0].start, '2026-11-01');
  assert.equal(ms[0].end, '2026-12-01');
  assert.equal(ms[0].remind, true);
  assert.deepEqual(normalize({ health: { taken: { [SUN]: { 'a@08:00': '08:05', ruim: '08:00', 'a@20:00': 'já' }, ontem: {} } } }).health.taken, { [SUN]: { 'a@08:00': '08:05' } });
});

test('doses do dia: horários, dias da semana e período do tratamento', () => {
  const d = withMeds(med({ times: ['08:00', '20:00'] }), med({ id: 'm2', name: 'Antibiótico', times: ['12:00'], days: [1, 3, 5], end: '2026-11-20' }));
  assert.deepEqual(dosesOn(d, SUN).map((x) => `${x.time} ${x.med.name}`), ['08:00 Vitamina D', '20:00 Vitamina D']);
  assert.deepEqual(dosesOn(d, MON).map((x) => x.time), ['08:00', '12:00', '20:00']);
  const antibiotico = d.health.meds.find((m) => m.id === 'm2')!;
  assert.equal(isActiveOn(antibiotico, '2026-11-23'), false); // depois do fim
  assert.equal(isActiveOn(med(), '2026-11-09'), false); // antes do início
  assert.equal(dosesOn(endMed('m1', SUN)(d), MON).length, 1);
  assert.equal(dosesOn(removeMed('m2')(d), MON).length, 2);
});

test('tomei: marca com a hora, desfaz, e todas tomadas fecha o dia', () => {
  let d = withMeds(med({ times: ['08:00', '20:00'] }));
  d = toggleTaken(SUN, 'm1', '08:00', '08:07')(d);
  assert.equal(dosesOn(d, SUN)[0].taken, '08:07');
  assert.equal(allTaken(d, SUN), false);
  d = toggleTaken(SUN, 'm1', '20:00', '21:00')(d);
  assert.equal(allTaken(d, SUN), true);
  d = toggleTaken(SUN, 'm1', '20:00', '21:00')(d);
  assert.equal(dosesOn(d, SUN)[1].taken, null);
  d = toggleTaken(SUN, 'm1', '08:00', '')(d);
  assert.deepEqual(d.health.taken, {});
});

test('hábito ligado é marcado sozinho quando todas as doses do dia foram tomadas', () => {
  const base = withMeds(med({ times: ['08:00', '20:00'] }));
  const habit = normalize({ habits: [{ id: 'h', name: 'Tomar remédio', kind: 'ritual' }] }).habits[0];
  assert.equal(medHabitCandidate([habit])?.id, 'h');
  assert.equal(medHabitCandidate([{ ...habit, name: 'Ler' }]), null);
  let d = linkMedsHabit('h')({ ...base, habits: [habit] });
  d = toggleTaken(SUN, 'm1', '08:00', '08:00')(d);
  assert.deepEqual(d.habits[0].checks, []);
  d = toggleTaken(SUN, 'm1', '20:00', '20:00')(d);
  assert.deepEqual(d.habits[0].checks, [SUN]);
  d = toggleTaken(SUN, 'm1', '20:00', '20:00')(d);
  assert.deepEqual(d.habits[0].checks, []);
  // ligar depois marca os dias que já estavam completos
  let e = toggleTaken(SUN, 'm1', '20:00', '20:00')(toggleTaken(SUN, 'm1', '08:00', '08:00')({ ...base, habits: [habit] }));
  e = linkMedsHabit('h')(e);
  assert.deepEqual(e.habits[0].checks, [SUN]);
});

test('semana e Jornada: doses previstas e tomadas; dia completo vale +3 RES (sem hábito ligado)', () => {
  let d = withMeds(med({ times: ['08:00'] }));
  d = toggleTaken(SUN, 'm1', '08:00', '08:00')(d);
  d = toggleTaken('2026-11-14', 'm1', '08:00', '08:00')(d);
  assert.deepEqual(medCount(d, '2026-11-09', SUN), { planned: 6, taken: 2, fullDays: 2 }); // começou em 10/11
  assert.equal(medFullDays(d, '2026-11-01', SUN), 2);
  assert.equal(attributes(d, SUN).RES, 6);
  assert.equal(medFullDays(linkMedsHabit('h')(d), '2026-11-01', SUN), 0);
  assert.deepEqual(healthWeeks(d, SUN, 1)[0].meds, { planned: 6, taken: 2, fullDays: 2 });
});

test('Google Agenda: um aviso por dose nos próximos 14 dias, só com lembrete ligado e conta ligada', () => {
  const d = withMeds(med({ times: ['08:00', '20:00'] }), med({ id: 'm2', name: 'Sem aviso', remind: false }));
  assert.equal(wantedEvents(d, SUN).filter((e) => e.summary.startsWith('💊')).length, 0); // Google desligado
  const on = { ...d, settings: { ...d.settings, googleCalendar: { ...d.settings.googleCalendar, on: true } } };
  const evs = wantedEvents(on, SUN).filter((e) => e.summary.startsWith('💊'));
  assert.equal(evs.length, 28);
  assert.equal(evs[0].summary, '💊 Vitamina D · 1 cápsula');
  assert.equal(evs[0].start, `${SUN}T08:00:00`);
  assert.equal(new Set(evs.map((e) => e.id)).size, 28);
  assert.ok(evs.every((e) => /^[a-v0-9]+$/.test(e.id)));
});

test('textos de dias e horários', () => {
  assert.equal(daysText([0, 1, 2, 3, 4, 5, 6]), 'todo dia');
  assert.equal(daysText([1, 3, 5]), 'seg, qua e sex');
  assert.equal(timesText(['08:00', '14:00', '20:00']), '08:00, 14:00 e 20:00');
});
