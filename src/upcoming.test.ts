import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, seedCategories } from './data.ts';
import { addExpense } from './finance.ts';
import { upcoming } from './upcoming.ts';

const TODAY = '2026-11-18';

test('próximos: compromissos, tarefas e contas por dia; atrasados à parte', () => {
  let d = seedCategories(emptyData());
  const cat = d.categories[0].id;
  d = {
    ...d,
    events: [
      { id: 'e1', title: 'Dentista', date: '2026-11-19', time: '15:00', location: '', description: '' },
      { id: 'e2', title: 'Café', date: '2026-11-19', time: '09:00', location: '', description: '' },
      { id: 'e3', title: 'Passado', date: '2026-11-10', time: '', location: '', description: '' },
      { id: 'e4', title: 'Longe', date: '2027-02-01', time: '', location: '', description: '' },
    ],
    tasks: [
      { id: 't1', title: 'Renovar CNH', notes: '', due: '2026-11-15', priority: 'media', tag: '', done: false, createdAt: '', doneAt: null },
      { id: 't2', title: 'Feita', notes: '', due: '2026-11-19', priority: 'media', tag: '', done: true, createdAt: '', doneAt: null },
      { id: 't3', title: 'Sem prazo', notes: '', due: null, priority: 'media', tag: '', done: false, createdAt: '', doneAt: null },
    ],
  } as typeof d;
  d = addExpense(d, { kind: 'avulsa', description: 'Luz', categoryId: cat, method: 'pix', cardId: null, date: '2026-11-19', amounts: [180], paidAt: null }, TODAY);
  const u = upcoming(d, TODAY);
  assert.deepEqual(u.overdue.map((i) => i.title), ['Renovar CNH']);
  assert.deepEqual(u.days.map((x) => [x.day, x.items.map((i) => i.title)]), [['2026-11-19', ['Café', 'Dentista', 'Luz']]]);
  assert.equal(u.days[0].items[2].amount, 180);
  assert.equal(u.total, 4);
});

test('próximos: cada item sabe de que módulo veio (para a cor do ícone)', () => {
  let d = seedCategories(emptyData());
  const cat = d.categories[0].id;
  d = {
    ...d,
    events: [
      { id: 'e1', title: 'Dentista', date: '2026-11-19', time: '15:00', location: '', description: '' },
      { id: 'e2', title: 'Alinhamento', date: '2026-11-19', time: '14:00', location: '', description: '', origin: 'carreira/abrir-m-1' },
    ],
    tasks: [{ id: 't1', title: 'Renovar CNH', notes: '', due: '2026-11-20', priority: 'media', tag: '', done: false, createdAt: '', doneAt: null }],
  } as typeof d;
  d = addExpense(d, { kind: 'avulsa', description: 'Luz', categoryId: cat, method: 'pix', cardId: null, date: '2026-11-19', amounts: [180], paidAt: null }, TODAY);
  const all = upcoming(d, TODAY).days.flatMap((x) => x.items);
  const mod = (t: string) => all.find((i) => i.title === t)?.module;
  assert.equal(mod('Dentista'), 'agenda');
  assert.equal(mod('Alinhamento'), 'carreira');
  assert.equal(mod('Renovar CNH'), 'agenda');
  assert.equal(mod('Luz'), 'financas');
});
