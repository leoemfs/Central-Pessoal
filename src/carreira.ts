/**
 * Carreira (N8): regras puras das vagas e candidaturas.
 * Etapas em andamento: interesse → enviei → entrevista → proposta.
 * Encerrar: contratado, não passei ou desisti (a vaga vai para "Encerradas").
 */
import type { CalendarEvent, CareerData, JobApp, JobOutcome, JobStage } from './types';

export const STAGES: { id: JobStage; label: string }[] = [
  { id: 'interesse', label: 'Interesse' },
  { id: 'enviei', label: 'Enviei' },
  { id: 'entrevista', label: 'Entrevista' },
  { id: 'proposta', label: 'Proposta' },
];

export const OUTCOMES: { id: JobOutcome; label: string; tone: 'green' | 'red' | 'gray' }[] = [
  { id: 'contratado', label: 'Contratado', tone: 'green' },
  { id: 'naopassei', label: 'Não passei', tone: 'red' },
  { id: 'desisti', label: 'Desisti', tone: 'gray' },
];

const STAGE_IDS = STAGES.map((s) => s.id);
const OUTCOME_IDS = OUTCOMES.map((o) => o.id);

export const stageLabel = (s: JobStage | JobOutcome) => STAGES.find((x) => x.id === s)?.label ?? OUTCOMES.find((x) => x.id === s)?.label ?? s;
export const stageIndex = (s: JobStage) => STAGE_IDS.indexOf(s);

export function emptyCareer(): CareerData {
  return { jobs: [] };
}

const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

export function normalizeCareer(raw: unknown): CareerData {
  const r = isRec(raw) ? raw : {};
  const jobs = (Array.isArray(r.jobs) ? r.jobs : []).filter(isRec).filter((j) => typeof j.id === 'string');
  return {
    jobs: jobs.map((j): JobApp => {
      const stage = STAGE_IDS.includes(j.stage as JobStage) ? (j.stage as JobStage) : 'interesse';
      const outcome = OUTCOME_IDS.includes(j.outcome as JobOutcome) ? (j.outcome as JobOutcome) : null;
      const history = (Array.isArray(j.history) ? j.history : [])
        .filter(isRec)
        .filter((h) => isDate(h.date) && (STAGE_IDS.includes(h.stage as JobStage) || OUTCOME_IDS.includes(h.stage as JobOutcome)))
        .map((h) => ({ stage: h.stage as JobStage | JobOutcome, date: h.date as string }));
      return {
        id: j.id as string,
        company: str(j.company),
        role: str(j.role),
        link: str(j.link),
        salary: str(j.salary),
        notes: str(j.notes),
        stage,
        next: str(j.next),
        nextDate: isDate(j.nextDate) ? j.nextDate : null,
        nextTime: str(j.nextTime),
        eventId: typeof j.eventId === 'string' ? j.eventId : null,
        outcome,
        closedAt: outcome && isDate(j.closedAt) ? j.closedAt : null,
        history,
        createdAt: typeof j.createdAt === 'string' ? j.createdAt : new Date().toISOString(),
      };
    }),
  };
}

export function newJob(id: string, today: string, nowISO: string): JobApp {
  return {
    id,
    company: '',
    role: '',
    link: '',
    salary: '',
    notes: '',
    stage: 'interesse',
    next: '',
    nextDate: null,
    nextTime: '',
    eventId: null,
    outcome: null,
    closedAt: null,
    history: [{ stage: 'interesse', date: today }],
    createdAt: nowISO,
  };
}

export const isBlankJob = (j: JobApp) => !j.company.trim() && !j.role.trim();
export const isOpen = (j: JobApp) => j.outcome === null;

/** Muda a etapa (para frente ou para trás) e registra no histórico. */
export function setStage(j: JobApp, stage: JobStage, today: string): JobApp {
  if (j.stage === stage && isOpen(j)) return j;
  return { ...j, stage, outcome: null, closedAt: null, history: [...j.history, { stage, date: today }] };
}

/** Avança uma etapa; na última (proposta) não muda. */
export function advance(j: JobApp, today: string): JobApp {
  const i = stageIndex(j.stage);
  return i >= STAGE_IDS.length - 1 ? j : setStage(j, STAGE_IDS[i + 1], today);
}

/** Encerra a vaga. O próximo passo some (não há mais o que fazer). */
export function closeJob(j: JobApp, outcome: JobOutcome, today: string): JobApp {
  return { ...j, outcome, closedAt: today, next: '', nextDate: null, nextTime: '', history: [...j.history, { stage: outcome, date: today }] };
}

/** Traz de volta uma vaga encerrada, na etapa em que estava. */
export function reopenJob(j: JobApp, today: string): JobApp {
  return { ...j, outcome: null, closedAt: null, history: [...j.history, { stage: j.stage, date: today }] };
}

/** Quantas vagas em andamento há em cada etapa. */
export function stageCounts(jobs: JobApp[]): Record<JobStage, number> {
  const out = { interesse: 0, enviei: 0, entrevista: 0, proposta: 0 } as Record<JobStage, number>;
  for (const j of jobs) if (isOpen(j)) out[j.stage]++;
  return out;
}

/** Data em que entrou na etapa atual (último registro dela no histórico). */
export function stageSince(j: JobApp): string | null {
  for (let i = j.history.length - 1; i >= 0; i--) if (j.history[i].stage === j.stage) return j.history[i].date;
  return null;
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00') - Date.parse(a + 'T12:00:00')) / 86400000);

/** "Enviei" há 7 dias ou mais e sem próximo passo marcado: vale cobrar um retorno. */
export function waitingDays(j: JobApp, today: string): number | null {
  if (!isOpen(j) || j.stage !== 'enviei' || j.nextDate) return null;
  const since = stageSince(j);
  if (!since) return null;
  const d = dayDiff(since, today);
  return d >= 7 ? d : null;
}

/**
 * Vagas em andamento na ordem de atenção: primeiro as com próximo passo datado (mais cedo antes),
 * depois as mais adiantadas no processo.
 */
export function openJobs(jobs: JobApp[]): JobApp[] {
  return jobs
    .filter(isOpen)
    .slice()
    .sort((a, b) => {
      if (a.nextDate && b.nextDate) return (a.nextDate + a.nextTime).localeCompare(b.nextDate + b.nextTime);
      if (a.nextDate) return -1;
      if (b.nextDate) return 1;
      return stageIndex(b.stage) - stageIndex(a.stage) || b.createdAt.localeCompare(a.createdAt);
    });
}

export function closedJobs(jobs: JobApp[]): JobApp[] {
  return jobs.filter((j) => !isOpen(j)).sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''));
}

/** Compromisso da Agenda para o próximo passo (só com data). */
export function jobEvent(j: JobApp, id: string): CalendarEvent | null {
  if (!j.nextDate) return null;
  const what = j.next.trim() || stageLabel(j.stage);
  const who = [j.role.trim(), j.company.trim()].filter(Boolean).join(' · ');
  return { id, title: who ? `${what} (${who})` : what, date: j.nextDate, time: j.nextTime, location: '', description: 'Criado em Carreira › Vagas.' };
}
