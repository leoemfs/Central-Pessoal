/**
 * Carreira (N8): regras puras das vagas e candidaturas.
 * Etapas em andamento: interesse → enviei → entrevista → proposta.
 * Encerrar: contratado, não passei ou desisti (a vaga vai para "Encerradas").
 */
import type { AppData, CalendarEvent, CareerChange, CareerChangeKind, CareerData, JobApp, JobOutcome, JobStage, Meeting, MeetingKind, ProjectStatus, WorkProject } from './types';
import { editIncome } from './incomes.ts';
import { addDays } from './utils.ts';

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
  return { jobs: [], changes: [], meetings: [], projects: [] };
}

const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

const CHANGE_KINDS: CareerChangeKind[] = ['entrada', 'promocao', 'aumento', 'novoemprego'];
const MEETING_KINDS: MeetingKind[] = ['reuniao', 'umum', 'apresentacao', 'feedback', 'avaliacao'];

function normalizeChange(c: Record<string, unknown>): CareerChange {
  return {
    id: c.id as string,
    date: c.date as string,
    kind: CHANGE_KINDS.includes(c.kind as CareerChangeKind) ? (c.kind as CareerChangeKind) : 'aumento',
    role: str(c.role),
    company: str(c.company),
    salary: typeof c.salary === 'number' && c.salary > 0 ? c.salary : 0,
    note: str(c.note),
  };
}

function normalizeMeeting(m: Record<string, unknown>): Meeting {
  return {
    id: m.id as string,
    kind: MEETING_KINDS.includes(m.kind as MeetingKind) ? (m.kind as MeetingKind) : 'reuniao',
    title: str(m.title),
    with: str(m.with),
    date: m.date as string,
    time: str(m.time),
    notes: str(m.notes),
    todos: (Array.isArray(m.todos) ? m.todos : []).filter(isRec).filter((t) => typeof t.id === 'string').map((t) => ({ id: t.id as string, text: str(t.text), done: t.done === true })),
    link: str(m.link),
    repeatDays: typeof m.repeatDays === 'number' && m.repeatDays > 0 ? Math.round(m.repeatDays) : 0,
    projectIds: Array.isArray(m.projectIds) ? m.projectIds.filter((x): x is string => typeof x === 'string') : [],
    nextCreated: m.nextCreated === true,
    eventId: typeof m.eventId === 'string' ? m.eventId : null,
  };
}

const PROJECT_STATUS: ProjectStatus[] = ['andando', 'parado', 'concluido'];
function normalizeProject(p: Record<string, unknown>): WorkProject {
  return {
    id: p.id as string,
    name: str(p.name),
    area: str(p.area),
    deadline: isDate(p.deadline) ? p.deadline : null,
    status: PROJECT_STATUS.includes(p.status as ProjectStatus) ? (p.status as ProjectStatus) : 'andando',
    deliveries: (Array.isArray(p.deliveries) ? p.deliveries : [])
      .filter(isRec)
      .filter((x) => typeof x.id === 'string')
      .map((x) => ({ id: x.id as string, text: str(x.text), date: isDate(x.date) ? x.date : null, done: x.done === true })),
    notes: str(p.notes),
    link: str(p.link),
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
  };
}

const withIdDate = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v : []).filter(isRec).filter((x) => typeof x.id === 'string' && isDate(x.date));

export function normalizeCareer(raw: unknown): CareerData {
  const r = isRec(raw) ? raw : {};
  const changes = withIdDate(r.changes).map(normalizeChange);
  const meetings = withIdDate(r.meetings).map(normalizeMeeting);
  const projects = (Array.isArray(r.projects) ? r.projects : []).filter(isRec).filter((p) => typeof p.id === 'string').map(normalizeProject);
  const jobs = (Array.isArray(r.jobs) ? r.jobs : []).filter(isRec).filter((j) => typeof j.id === 'string');
  return {
    changes,
    meetings,
    projects,
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

/** Título do compromisso do próximo passo de uma vaga. */
export function jobEventTitle(j: JobApp): string {
  const what = j.next.trim() || stageLabel(j.stage);
  const who = [j.role.trim(), j.company.trim()].filter(Boolean).join(' · ');
  return who ? `${what} (${who})` : what;
}

// ---------- Trabalho atual (N8.2) ----------

export const CHANGE_LABEL: Record<CareerChangeKind, string> = { entrada: 'Entrada', promocao: 'Promoção', aumento: 'Aumento', novoemprego: 'Novo emprego' };

/** Mudanças da mais antiga para a mais recente. */
export const sortedChanges = (cs: CareerChange[]) => cs.slice().sort((a, b) => a.date.localeCompare(b.date));

/** Trabalho atual: cargo e empresa da última mudança que os informou; salário da última com valor; desde quando está na empresa. */
export function currentWork(cs: CareerChange[]): { role: string; company: string; salary: number; since: string | null; roleSince: string | null } | null {
  const list = sortedChanges(cs);
  if (!list.length) return null;
  let role = '';
  let company = '';
  let salary = 0;
  let since: string | null = null;
  let roleSince: string | null = null;
  for (const c of list) {
    if (c.kind === 'entrada' || c.kind === 'novoemprego' || (c.company.trim() && c.company.trim() !== company)) since = c.date;
    if (c.company.trim()) company = c.company.trim();
    if (c.role.trim() && c.role.trim() !== role) {
      role = c.role.trim();
      roleSince = c.date;
    }
    if (c.salary > 0) salary = c.salary;
  }
  return { role, company, salary, since: since ?? list[0].date, roleSince };
}

/** Variação do salário de cada mudança em relação ao salário anterior (em %; null sem base). */
export function salaryChanges(cs: CareerChange[]): { change: CareerChange; pct: number | null }[] {
  let last = 0;
  return sortedChanges(cs).map((c) => {
    const pct = c.salary > 0 && last > 0 ? Math.round(((c.salary - last) / last) * 100) : null;
    if (c.salary > 0) last = c.salary;
    return { change: c, pct };
  });
}

/** "1 ano e 8 meses", "3 meses", "menos de 1 mês". */
export function tenure(since: string, today: string): string {
  const [y1, m1, d1] = since.split('-').map(Number);
  const [y2, m2, d2] = today.split('-').map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
  if (months < 1) return 'menos de 1 mês';
  const y = Math.floor(months / 12);
  months %= 12;
  const ys = y ? `${y} ano${y > 1 ? 's' : ''}` : '';
  const ms = months ? `${months} ${months > 1 ? 'meses' : 'mês'}` : '';
  return [ys, ms].filter(Boolean).join(' e ');
}

/** Receita mensal de salário em Finanças: a primeira ainda não recebida, de uma série cuja fonte ou descrição é "Salário", a partir da data. */
export function salaryIncomeFrom(d: AppData, from: string) {
  const sal = d.incomeSources.filter((s) => /sal[aá]rio/i.test(s.name)).map((s) => s.id);
  return d.incomes
    .filter((i) => i.seriesId && !i.receivedAt && i.date >= from && (sal.includes(i.sourceId) || /sal[aá]rio/i.test(i.description)))
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}

/** Atualiza o valor da receita de salário em Finanças a partir da data (esta e as próximas ainda não recebidas). */
export function applySalaryToFinance(d: AppData, amount: number, from: string): AppData {
  const inc = salaryIncomeFrom(d, from);
  if (!inc || amount <= 0) return d;
  return editIncome(d, inc.id, { description: inc.description, sourceId: inc.sourceId, amount, date: inc.date }, 'next');
}

// ---------- Reuniões ----------

export const MEETING_KINDS_UI: { id: MeetingKind; label: string }[] = [
  { id: 'reuniao', label: 'Reunião' },
  { id: 'umum', label: '1:1' },
  { id: 'apresentacao', label: 'Apresentação' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'avaliacao', label: 'Avaliação' },
];
export const meetingKindLabel = (k: MeetingKind) => MEETING_KINDS_UI.find((x) => x.id === k)?.label ?? 'Reunião';

export const REPEAT_OPTIONS: { days: number; label: string }[] = [
  { days: 0, label: 'Não repete' },
  { days: 7, label: 'Toda semana' },
  { days: 14, label: 'A cada 2 semanas' },
  { days: 28, label: 'A cada 4 semanas' },
];

export function newMeeting(id: string, date: string): Meeting {
  return { id, kind: 'reuniao', title: '', with: '', date, time: '', notes: '', todos: [], link: '', repeatDays: 0, projectIds: [], nextCreated: false, eventId: null };
}

export const meetingTitle = (m: Meeting) => m.title.trim() || meetingKindLabel(m.kind) + (m.with.trim() ? ` com ${m.with.trim()}` : '');
export const isBlankMeeting = (m: Meeting) => !m.title.trim() && !m.with.trim() && !m.notes.trim() && !m.todos.length && !m.link.trim();

/** Próximas (a partir de hoje, mais cedo antes) e anteriores (mais recente antes). */
export function splitMeetings(ms: Meeting[], today: string) {
  const key = (m: Meeting) => m.date + (m.time || '99:99');
  return {
    upcoming: ms.filter((m) => m.date >= today).sort((a, b) => key(a).localeCompare(key(b))),
    past: ms.filter((m) => m.date < today).sort((a, b) => key(b).localeCompare(key(a))),
  };
}

/** Combinados ainda abertos, de todas as reuniões. */
export const openTodos = (ms: Meeting[]) => ms.flatMap((m) => m.todos.filter((t) => !t.done).map((t) => ({ meeting: m, todo: t })));

/**
 * Próxima reunião da série: mesma pauta-base, N dias depois, sem anotações;
 * combinados não feitos vão junto, para cobrar na próxima.
 */
export function nextMeeting(m: Meeting, id: string): Meeting | null {
  if (!m.repeatDays) return null;
  return { ...m, id, date: addDays(m.date, m.repeatDays), notes: '', todos: m.todos.filter((t) => !t.done), nextCreated: false, eventId: null };
}


// ---------- Projetos do trabalho (N8.6) ----------

export const PROJECT_STATUS_UI: { id: ProjectStatus; label: string; tone: 'green' | 'orange' | 'gray' }[] = [
  { id: 'andando', label: 'Andando', tone: 'green' },
  { id: 'parado', label: 'Parado', tone: 'orange' },
  { id: 'concluido', label: 'Concluído', tone: 'gray' },
];

export function newProject(id: string, nowISO: string): WorkProject {
  return { id, name: '', area: '', deadline: null, status: 'andando', deliveries: [], notes: '', link: '', createdAt: nowISO };
}
export const isBlankProject = (p: WorkProject) => !p.name.trim() && !p.area.trim() && !p.deliveries.length && !p.notes.trim();
export const projectName = (p: WorkProject) => p.name.trim() || 'Projeto sem nome';

/** Entregas feitas/total e a próxima entrega aberta (com data, a mais cedo; senão a primeira sem data). */
export function projectProgress(p: WorkProject) {
  const done = p.deliveries.filter((d) => d.done).length;
  const open = p.deliveries.filter((d) => !d.done);
  const dated = open.filter((d) => d.date).sort((a, b) => a.date!.localeCompare(b.date!));
  return { done, total: p.deliveries.length, next: dated[0] ?? open[0] ?? null };
}

/** Em andamento primeiro (prazo mais cedo antes), depois parados; concluídos à parte. */
export function sortProjects(ps: WorkProject[]) {
  const rank = (p: WorkProject) => (p.status === 'andando' ? 0 : 1);
  const active = ps.filter((p) => p.status !== 'concluido').sort((a, b) => rank(a) - rank(b) || (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'));
  return { active, done: ps.filter((p) => p.status === 'concluido') };
}

// ---------- Agenda automática (N8.5) ----------

/**
 * Compromissos que Carreira mantém na Agenda: reuniões, próximo passo das vagas em andamento,
 * prazo dos projetos não concluídos e entregas abertas com data.
 * `origin` é o endereço que abre a ficha de origem.
 */
export function careerEvents(c: CareerData): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const ev = (id: string, title: string, date: string, time: string, origin: string, description: string) =>
    out.push({ id, title, date, time, location: '', description, origin: `carreira/${origin}` });
  for (const m of c.meetings) ev(m.eventId ?? `car-m-${m.id}`, meetingTitle(m), m.date, m.time, `abrir-m-${m.id}`, 'Reunião de Carreira');
  for (const j of c.jobs) if (isOpen(j) && j.nextDate) ev(j.eventId ?? `car-j-${j.id}`, jobEventTitle(j), j.nextDate, j.nextTime, `abrir-j-${j.id}`, 'Vaga de Carreira');
  for (const p of c.projects) {
    if (p.status === 'concluido') continue;
    if (p.deadline) ev(`car-p-${p.id}`, `Prazo: ${projectName(p)}`, p.deadline, '', `abrir-p-${p.id}`, 'Projeto de Carreira');
    for (const d of p.deliveries) if (!d.done && d.date) ev(`car-e-${d.id}`, `Entrega: ${d.text.trim() || 'sem nome'} (${projectName(p)})`, d.date, '', `abrir-p-${p.id}`, 'Projeto de Carreira');
  }
  return out;
}

/**
 * Deixa a Agenda igual a Carreira: cria e atualiza os compromissos de Carreira e tira os que não existem mais.
 * Compromissos antigos do botão "Pôr na Agenda" (pelo eventId) passam a ser mantidos aqui.
 * O local escrito na Agenda é preservado. Sem mudanças, devolve o mesmo objeto.
 */
export function syncCareerEvents(d: AppData): AppData {
  const want = careerEvents(d.career);
  const byId = new Map(want.map((e) => [e.id, e]));
  let changed = false;
  const kept = d.events.flatMap((e) => {
    const w = byId.get(e.id);
    if (!w) {
      if (e.origin?.startsWith('carreira/')) {
        changed = true;
        return [];
      }
      return [e];
    }
    byId.delete(e.id);
    const next = { ...w, location: e.location };
    if (e.title === next.title && e.date === next.date && e.time === next.time && e.origin === next.origin && e.description === next.description) return [e];
    changed = true;
    return [next];
  });
  if (byId.size) changed = true;
  return changed ? { ...d, events: [...kept, ...byId.values()] } : d;
}
