import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applySalaryToFinance, currentWork, nextMeeting, newMeeting, openTodos, salaryChanges, splitMeetings, tenure } from './carreira.ts';
import { addIncome } from './incomes.ts';
import { advance, closeJob, closedJobs, jobEvent, newJob, normalizeCareer, openJobs, reopenJob, setStage, stageCounts, waitingDays } from './carreira.ts';
import { normalize } from './data.ts';

const TODAY = '2026-11-08';
const job = (id: string, extra = {}) => ({ ...newJob(id, '2026-11-01', '2026-11-01T10:00:00Z'), company: 'Acme', role: 'Analista', ...extra });

test('dados antigos e backups ganham Carreira vazia; lixo é limpo', () => {
  assert.deepEqual(normalize({}).career, { jobs: [], changes: [], meetings: [] });
  assert.deepEqual(normalize({ career: { jobs: [] } }).career.meetings, []);
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

const ch = (id: string, date: string, kind: 'entrada' | 'promocao' | 'aumento' | 'novoemprego', role: string, company: string, salary: number) => ({ id, date, kind, role, company, salary, note: '' });

test('trabalho atual: cargo, empresa, salário e tempo de casa', () => {
  const cs = [ch('c', '2026-06-01', 'aumento', '', '', 7800), ch('a', '2024-03-01', 'entrada', 'Analista Jr', 'Acme', 5200), ch('b', '2025-07-01', 'promocao', 'Analista Pleno', '', 6900)];
  const w = currentWork(cs)!;
  assert.equal(w.role, 'Analista Pleno');
  assert.equal(w.company, 'Acme');
  assert.equal(w.salary, 7800);
  assert.equal(w.since, '2024-03-01');
  assert.equal(w.roleSince, '2025-07-01');
  assert.deepEqual(salaryChanges(cs).map((x) => x.pct), [null, 33, 13]);
  assert.equal(tenure('2024-03-01', TODAY), '2 anos e 8 meses');
  assert.equal(tenure('2026-11-01', TODAY), 'menos de 1 mês');
  assert.equal(currentWork([]), null);
});

test('aumento atualiza a receita de Salário em Finanças só a partir da data', () => {
  let d = normalize({});
  const src = d.incomeSources.find((s) => /sal/i.test(s.name))!.id;
  d = addIncome(d, { description: 'Salário', sourceId: src, amount: 7800, date: '2026-11-05', recurring: true, receivedAt: null }, '2026-11-01');
  const before = d.incomes.filter((i) => i.seriesId).map((i) => i.amount);
  assert.ok(before.length >= 2);
  const after = applySalaryToFinance(d, 8600, '2026-12-01');
  const nov = after.incomes.find((i) => i.date.startsWith('2026-11'))!;
  const dec = after.incomes.find((i) => i.date.startsWith('2026-12'))!;
  assert.equal(nov.amount, 7800);
  assert.equal(dec.amount, 8600);
  assert.equal(applySalaryToFinance(normalize({}), 8600, '2026-12-01').incomes.length, 0);
});

test('reuniões: próximas e anteriores; a próxima da série leva os combinados abertos', () => {
  const m = { ...newMeeting('m1', '2026-11-13'), kind: 'apresentacao' as const, repeatDays: 14, notes: 'Avanços do repasse', todos: [{ id: 't1', text: 'Fechar contrato X', done: false }, { id: 't2', text: 'Enviar slides', done: true }] };
  const old = { ...newMeeting('m0', '2026-10-30'), todos: [{ id: 't0', text: 'Revisar prestadores', done: false }] };
  const { upcoming, past } = splitMeetings([old, m], TODAY);
  assert.deepEqual(upcoming.map((x) => x.id), ['m1']);
  assert.deepEqual(past.map((x) => x.id), ['m0']);
  assert.equal(openTodos([old, m]).length, 2);
  const n = nextMeeting(m, 'm2')!;
  assert.equal(n.date, '2026-11-27');
  assert.equal(n.notes, '');
  assert.deepEqual(n.todos.map((t) => t.id), ['t1']);
  assert.equal(nextMeeting(old, 'x'), null);
});
