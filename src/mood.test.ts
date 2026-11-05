import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, normalize } from './data.ts';
import { clearMood, moodInsights, setMood, setMoodNote, toggleMoodTag, weekMood } from './mood.ts';
import { recordSession } from './practices.ts';
import type { AppData } from './types.ts';

// 2026-11-04 é uma quarta-feira.
const TODAY = '2026-11-04';

test('humor do dia: escolher, etiquetas e trocar', () => {
  let d = setMood(4, TODAY)(emptyData());
  d = toggleMoodTag('Exercício', TODAY)(d);
  d = toggleMoodTag('Sono', TODAY)(d);
  d = toggleMoodTag('Sono', TODAY)(d);
  assert.deepEqual(d.moods[TODAY], { v: 4, tags: ['Exercício'], note: '', journalId: null });
  d = setMood(2, TODAY)(d);
  assert.equal(d.moods[TODAY].v, 2);
  assert.deepEqual(d.moods[TODAY].tags, ['Exercício'], 'trocar o humor mantém as etiquetas');
  d = clearMood(TODAY)(d);
  assert.equal(d.moods[TODAY], undefined);
});

test('a anotação vira um registro no Diário, que acompanha mudanças e some se a anotação for apagada', () => {
  let d = setMood(5, '2026-11-03')(emptyData());
  d = setMoodNote('Fechei o projeto', '2026-11-03')(d);
  assert.equal(d.journal.length, 1);
  const j = d.journal[0];
  assert.equal(j.tag, 'Humor');
  assert.equal(j.title, '😄 Ótimo');
  assert.equal(j.content, 'Fechei o projeto');
  assert.equal(j.createdAt.slice(0, 10), '2026-11-03');
  d = setMood(4, '2026-11-03')(d);
  d = toggleMoodTag('Trabalho', '2026-11-03')(d);
  assert.equal(d.journal.length, 1);
  assert.equal(d.journal[0].title, '🙂 Bem');
  assert.equal(d.journal[0].summary, 'Trabalho');
  d = setMoodNote('', '2026-11-03')(d);
  assert.equal(d.journal.length, 0);
  assert.equal(d.moods['2026-11-03'].journalId, null);
});

test('semana do humor e o que o app percebe (treino, etiquetas)', () => {
  let d: AppData = emptyData();
  const set = (day: string, v: 1 | 2 | 3 | 4 | 5, tags: string[]) => {
    d = setMood(v, day)(d);
    for (const t of tags) d = toggleMoodTag(t, day)(d);
  };
  set('2026-11-02', 5, ['Exercício']);
  set('2026-11-03', 2, ['Trabalho']);
  set('2026-11-04', 4, ['Exercício', 'Amigos']);
  set('2026-10-30', 2, ['Trabalho', 'Sono']);
  d = recordSession({ type: 'treino', sub: 'A', title: 'Treino A', minutes: 40 }, '2026-11-02')(d);
  d = recordSession({ type: 'caminhada', sub: '', title: 'Caminhada', minutes: 30 }, '2026-11-04')(d);
  const w = weekMood(d, '2026-11-02');
  assert.deepEqual(w.days.map((x) => x.mood?.v ?? null), [5, 2, 4, null, null, null, null]);
  assert.equal(Math.round(w.avg! * 100) / 100, 3.67);
  const ins = moodInsights(d, TODAY);
  assert.deepEqual(ins.withTraining, { yes: 4.5, no: 2 });
  assert.equal(ins.goodTag, 'Exercício');
  assert.equal(ins.hardTag, 'Trabalho');
});

test('humor sobrevive ao backup e ignora lixo', () => {
  let d = setMood(3, TODAY)(emptyData());
  d = { ...d, moods: { ...d.moods, 'xx': { v: 3, tags: [], note: '', journalId: null }, '2026-11-01': { v: 9 as 3, tags: [], note: '', journalId: null } } };
  const back = normalize(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(Object.keys(back.moods), [TODAY]);
});
