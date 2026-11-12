import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffEvents, eventId, wantedEvents, type ExistingEvent } from './calendarSync.ts';
import { emptyData } from './data.ts';
import type { AppData } from './types.ts';

const TODAY = '2026-11-11';
function base(on = true): AppData {
  const d = emptyData();
  return {
    ...d,
    settings: { ...d.settings, googleCalendar: { on, events: true, bills: true, tasks: true, calendarId: 'cal', tasksList: null } },
    events: [
      { id: 'ev1', title: 'Dentista', date: '2026-11-12', time: '14:30', location: 'Centro', description: '' },
      { id: 'ev2', title: 'Aniversário', date: '2026-11-13', time: '', location: '', description: '' },
      { id: 'ev3', title: 'Reunião', date: '2026-11-14', time: '09:30', location: '', description: '' },
      { id: 'velho', title: 'Passou', date: '2026-11-01', time: '10:00', location: '', description: '' },
      { id: 'longe', title: 'Longe', date: '2027-03-01', time: '10:00', location: '', description: '' },
    ],
    tasks: [
      { id: 't1', title: 'Renovar CNH', notes: '', due: '2026-11-20', priority: 'media', tag: '', done: false, createdAt: '', doneAt: null },
      { id: 't2', title: 'Feita', notes: '', due: '2026-11-20', priority: 'media', tag: '', done: true, createdAt: '', doneAt: '' },
    ] as AppData['tasks'],
  };
}

test('desligado: nada vai para o Google', () => {
  assert.deepEqual(wantedEvents(base(false), TODAY), []);
});

test('compromisso com hora: na hora, 1 h, aviso 30 min antes; sem hora: 9h; só os próximos 60 dias', () => {
  const w = wantedEvents(base(), TODAY);
  const dent = w.find((x) => x.id === eventId('e', 'ev1'))!;
  assert.equal(dent.start, '2026-11-12T14:30:00');
  assert.equal(dent.end, '2026-11-12T15:30:00');
  assert.equal(dent.reminder, 30);
  assert.match(dent.description, /Local: Centro/);
  const aniv = w.find((x) => x.id === eventId('e', 'ev2'))!;
  assert.equal(aniv.start, '2026-11-13T09:00:00');
  assert.equal(aniv.reminder, 0);
  assert.ok(!w.some((x) => x.id === eventId('e', 'velho') || x.id === eventId('e', 'longe')));
});

test('tarefas não vão para a agenda (vão para o Google Tarefas, N9.6)', () => {
  assert.ok(!wantedEvents(base(), TODAY).some((x) => x.id.startsWith('t')));
});

test('id do evento: só letras a-v e números, fixo para o mesmo item', () => {
  const id = eventId('c', 'fatura:cartão-1:2026-11');
  assert.match(id, /^[a-v0-9]{5,1024}$/);
  assert.equal(id, eventId('c', 'fatura:cartão-1:2026-11'));
  assert.notEqual(eventId('e', 'x1'), eventId('t', 'x1'));
});

test('diferença: cria o novo, muda o alterado, restaura o excluído no Google, tira o que saiu', () => {
  const w = wantedEvents(base(), TODAY);
  const [a, b, c] = w;
  const existing: ExistingEvent[] = [
    { id: a.id, cancelled: false, sig: a.sig }, // igual: nada
    { id: b.id, cancelled: false, sig: 'antigo' }, // mudou
    { id: c.id, cancelled: true, sig: c.sig }, // excluído lá: restaurar
    { id: 'esaiu', cancelled: false, sig: 'x' }, // não existe mais no app
    { id: 'ejaexcluido', cancelled: true, sig: 'x' },
  ];
  const p = diffEvents(w, existing);
  assert.deepEqual(p.update.map((x) => x.id), [b.id, c.id]);
  assert.deepEqual(p.remove, ['esaiu']);
  assert.equal(p.insert.length, w.length - 3);
});
