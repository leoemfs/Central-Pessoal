import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, closeJob, closedJobs, jobEvent, newJob, normalizeCareer, openJobs, reopenJob, setStage, stageCounts, waitingDays } from './carreira.ts';
import { normalize } from './data.ts';

const TODAY = '2026-11-08';
const job = (id: string, extra = {}) => ({ ...newJob(id, '2026-11-01', '2026-11-01T10:00:00Z'), company: 'Acme', role: 'Analista', ...extra });

test('dados antigos e backups ganham Carreira vazia; lixo é limpo', () => {
  assert.deepEqual(normalize({}).career, { jobs: [] });
  const c = normalizeCareer({ jobs: [{ id: 'a', stage: 'xpto', outcome: 'talvez', nextDate: '12/11', history: [{ stage: 'enviei', date: '2026-11-02' }, { stage: 'nada', date: '2026-11-03' }] }, { sem: 'id' }] });
  assert.equal(c.jobs.length, 1);
  assert.equal(c.jobs[0].stage, 'interesse');
  assert.equal(c.jobs[0].outcome, null);
  assert.equal(c.jobs[0].nextDate, null);
  assert.deepEqual(c.jobs[0].history, [{ stage: 'enviei', date: '2026-11-02' }]);
});

test('avançar etapa registra no histórico e para na proposta', () => {
  let j = job('a');
  j = advance(j, TODAY);
  assert.equal(j.stage, 'enviei');
  assert.deepEqual(j.history.at(-1), { stage: 'enviei', date: TODAY });
  j = advance(advance(advance(j, TODAY), TODAY), TODAY);
  assert.equal(j.stage, 'proposta');
  assert.equal(j.history.length, 4);
  assert.equal(setStage(j, 'proposta', TODAY), j);
});

test('encerrar tira o próximo passo; reabrir volta na mesma etapa', () => {
  const j = closeJob(job('a', { stage: 'entrevista', next: 'Entrevista', nextDate: '2026-11-12' }), 'naopassei', TODAY);
  assert.equal(j.outcome, 'naopassei');
  assert.equal(j.closedAt, TODAY);
  assert.equal(j.nextDate, null);
  const r = reopenJob(j, TODAY);
  assert.equal(r.outcome, null);
  assert.equal(r.stage, 'entrevista');
});

test('contagem por etapa ignora as encerradas; ordem de atenção', () => {
  const jobs = [
    job('a', { stage: 'proposta' }),
    job('b', { stage: 'enviei', nextDate: '2026-11-20' }),
    job('c', { stage: 'interesse', nextDate: '2026-11-12', nextTime: '14:00' }),
    closeJob(job('d', { stage: 'enviei' }), 'desisti', TODAY),
    job('e', { stage: 'enviei' }),
  ];
  assert.deepEqual(stageCounts(jobs), { interesse: 1, enviei: 2, entrevista: 0, proposta: 1 });
  assert.deepEqual(openJobs(jobs).map((j) => j.id), ['c', 'b', 'a', 'e']);
  assert.deepEqual(closedJobs(jobs).map((j) => j.id), ['d']);
});

test('sem resposta: enviei há 7 dias ou mais e sem próximo passo', () => {
  const j = setStage(job('a'), 'enviei', '2026-11-01');
  assert.equal(waitingDays(j, '2026-11-07'), null);
  assert.equal(waitingDays(j, TODAY), 7);
  assert.equal(waitingDays({ ...j, nextDate: '2026-11-10' }, TODAY), null);
});

test('compromisso da Agenda só com data, com o nome da vaga', () => {
  assert.equal(jobEvent(job('a'), 'ev'), null);
  const ev = jobEvent(job('a', { next: 'Entrevista técnica', nextDate: '2026-11-12', nextTime: '14:00' }), 'ev');
  assert.equal(ev?.title, 'Entrevista técnica (Analista · Acme)');
  assert.equal(ev?.time, '14:00');
});
