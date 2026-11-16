import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './data.ts';
import { attributes } from './jornada/rules.ts';
import {
  addBodyField, addMonthsISO, apptTitle, bodyLatest, bodySeries, emptyBody, examRequests, followUp, healthEvents, intervalText, newAppt, normalizeAppts, normalizeBody,
  normalizeRoutines, removeAppt, removeBodyEntry, removeRoutine, routineStatus, saveAppt, saveBodyEntry, saveRoutine, setBodyShow, splitAppts, suggestRoutine, syncHealthEvents,
} from './consultas.ts';
import type { AppData } from './types.ts';

const TODAY = '2026-11-16';
let n = 0;
const ids = () => `x${++n}`;

test('dados antigos ganham Consultas e Medidas vazias (medidas escondidas); lixo é limpo', () => {
  const h = normalize({}).health;
  assert.deepEqual([h.appts, h.routines, h.body], [[], [], emptyBody()]);
  assert.equal(h.body.show, false);
  const a = normalizeAppts([{ id: 'a', kind: 'xpto', date: '24/11', time: '9h', done: 'sim' }, { sem: 'id' }]);
  assert.deepEqual([a.length, a[0].kind, a[0].date, a[0].time, a[0].done], [1, 'consulta', null, '', false]);
  const r = normalizeRoutines([{ id: 'r', months: 0, last: 'ontem' }]);
  assert.deepEqual(r[0], { id: 'r', label: 'Check-up', kind: 'checkup', months: 12, last: null });
  const b = normalizeBody({ show: true, fields: [{ name: 'Peso', unit: 'kg' }, { name: 'peso' }, { name: '' }], entries: [{ id: 'e', date: '2026-11-01', values: { Peso: 80, Cintura: -1 } }, { id: 'f', date: 'x', values: { Peso: 1 } }] });
  assert.deepEqual(b.fields, [{ name: 'Peso', unit: 'kg' }]);
  assert.deepEqual(b.entries, [{ id: 'e', date: '2026-11-01', values: { Peso: 80 } }]);
});

test('consulta com data entra na Agenda sozinha, se atualiza e some ao ser feita ou apagada', () => {
  const a = newAppt('c1', 'dentista', 'x', { title: 'Limpeza', who: 'Dra. Ana', place: 'Clínica Sorriso', date: '2026-11-24', time: '14:00', bring: 'raio-x' });
  let d = saveAppt(a, TODAY)(normalize({}));
  let ev = d.events.find((e) => e.id === 'sau-c-c1')!;
  assert.deepEqual([ev.title, ev.date, ev.time, ev.location, ev.origin], ['🦷 Dentista: Limpeza', '2026-11-24', '14:00', 'Clínica Sorriso', 'saude/abrir-c-c1']);
  assert.match(ev.description, /Levar: raio-x/);
  d = saveAppt({ ...a, time: '15:00' }, TODAY)(d);
  assert.equal(d.events.find((e) => e.id === 'sau-c-c1')!.time, '15:00');
  assert.equal(saveAppt({ ...a, done: true }, TODAY)(d).events.some((e) => e.id === 'sau-c-c1'), false);
  assert.equal(removeAppt('c1', TODAY)(d).events.length, 0);
  // sem data: fica "a marcar", fora da Agenda
  assert.equal(saveAppt(newAppt('c2', 'exame', 'x', { title: 'Hemograma' }), TODAY)(normalize({})).events.length, 0);
  // sem mudança, o mesmo objeto (não grava à toa)
  assert.equal(syncHealthEvents(d, TODAY), d);
  // compromissos da pessoa não são tocados
  const own = { ...normalize({}), events: [{ id: 'meu', title: 'Aniversário', date: TODAY, time: '', location: '', description: '' }] };
  assert.equal(syncHealthEvents(own, TODAY), own);
});

test('marcadas, a marcar e feitas; títulos por tipo', () => {
  let d = normalize({});
  d = saveAppt(newAppt('a', 'consulta', 'x', { title: 'Cardiologista', date: '2026-12-10', time: '09:30' }), TODAY)(d);
  d = saveAppt(newAppt('b', 'exame', 'x', { title: 'Hemograma', date: '2026-12-07' }), TODAY)(d);
  d = saveAppt(newAppt('c', 'exame', 'x', { title: 'Glicemia' }), TODAY)(d);
  d = saveAppt(newAppt('e', 'dentista', 'x', { date: '2026-10-01', done: true }), TODAY)(d);
  const s = splitAppts(d);
  assert.deepEqual([s.scheduled.map((a) => a.id), s.toSchedule.map((a) => a.id), s.done.map((a) => a.id)], [['b', 'a'], ['c'], ['e']]);
  assert.equal(apptTitle({ kind: 'consulta', title: 'Cardiologista' }), 'Cardiologista');
  assert.equal(apptTitle({ kind: 'dentista', title: '' }), 'Dentista');
});

test('check-up que se repete: próxima data, situação, "Marcar" na Agenda e última vez andando sozinha', () => {
  assert.equal(addMonthsISO('2026-08-31', 6), '2027-02-28');
  assert.equal(intervalText(6), '6 meses');
  assert.equal(intervalText(24), '2 anos');
  const r = { id: 'r1', label: 'Dentista', kind: 'dentista' as const, months: 6, last: '2026-03-10' };
  let d = saveRoutine(r, TODAY)(normalize({}));
  assert.deepEqual(routineStatus(d, r, TODAY), { state: 'atrasado', due: '2026-09-10', booked: null });
  // vencido: "Marcar" aparece hoje na Agenda (não no passado)
  assert.deepEqual(healthEvents(d, TODAY).map((e) => [e.title, e.date]), [['Marcar: Dentista', TODAY]]);
  // marcando a consulta, o "Marcar" sai e a consulta entra
  d = saveAppt(newAppt('c', 'dentista', 'x', { date: '2026-11-30', routineId: 'r1' }), TODAY)(d);
  assert.equal(routineStatus(d, d.health.routines[0], TODAY).state, 'marcado');
  assert.deepEqual(d.events.map((e) => e.id), ['sau-c-c']);
  // feita: a última vez vira a data da consulta; próximo em 6 meses
  d = saveAppt({ ...d.health.appts[0], done: true }, '2026-11-30')(d);
  assert.equal(d.health.routines[0].last, '2026-11-30');
  assert.deepEqual(routineStatus(d, d.health.routines[0], '2026-12-01'), { state: 'ok', due: '2027-05-30', booked: null });
  assert.equal(routineStatus(d, d.health.routines[0], '2027-05-10').state, 'perto');
  // apagar o check-up solta as consultas
  const e = removeRoutine('r1', TODAY)(d);
  assert.deepEqual([e.health.routines.length, e.health.appts[0].routineId], [0, null]);
  // sem última vez: sem data, fora da Agenda
  assert.equal(routineStatus(normalize({}), { ...r, last: null }, TODAY).state, 'sem-data');
});

test('depois da consulta: sugere repetir, retorno e pedidos de exame', () => {
  const a = newAppt('a', 'dentista', 'x', { title: 'Limpeza', who: 'Dra. Ana', place: 'Clínica', date: '2026-11-10', done: true });
  assert.deepEqual(suggestRoutine(a, 'r'), { id: 'r', label: 'Dentista', kind: 'dentista', months: 6, last: '2026-11-10' });
  assert.equal(suggestRoutine({ ...a, routineId: 'x' }, 'r'), null);
  assert.equal(suggestRoutine(newAppt('b', 'consulta', 'x', { title: 'Cardiologista', date: '2026-11-10' }), 'r')!.label, 'Cardiologista');
  const f = followUp(a, 'b', '2027-01-10', 'y');
  assert.deepEqual([f.kind, f.title, f.who, f.place, f.date, f.done], ['dentista', 'Limpeza', 'Dra. Ana', 'Clínica', '2027-01-10', false]);
  const ex = examRequests('- Hemograma\n\n• Glicemia em jejum\n', ids, 'z');
  assert.deepEqual(ex.map((x) => [x.kind, x.title, x.date]), [['exame', 'Hemograma', null], ['exame', 'Glicemia em jejum', null]]);
});

test('peso e medidas: escondidos por padrão, campos novos, medições e série; sem recompensa', () => {
  let d: AppData = normalize({});
  d = setBodyShow(true)(d);
  d = addBodyField('Quadril', 'cm')(d);
  assert.equal(addBodyField('peso', 'kg')(d), d); // repetido
  d = saveBodyEntry({ id: 'e1', date: '2026-11-01', values: { Peso: 82.4, Cintura: 90 } })(d);
  d = saveBodyEntry({ id: 'e2', date: '2026-11-15', values: { Peso: 81.6, Cintura: NaN } })(d);
  assert.equal(saveBodyEntry({ id: 'e3', date: '2026-11-16', values: {} })(d), d); // sem valor, não salva
  assert.deepEqual(bodySeries(d.health.body, 'Peso').map((x) => x.value), [82.4, 81.6]);
  assert.deepEqual(bodyLatest(d.health.body, 'Peso'), { value: 81.6, date: '2026-11-15', diff: -0.8 });
  assert.deepEqual(bodyLatest(d.health.body, 'Cintura'), { value: 90, date: '2026-11-01', diff: null });
  assert.equal(bodyLatest(d.health.body, 'Quadril'), null);
  assert.equal(removeBodyEntry('e2')(d).health.body.entries.length, 1);
  assert.deepEqual(attributes(d, TODAY), attributes(normalize({}), TODAY));
});
