import { useEffect, useState, type ReactNode } from 'react';
import { CardScreen } from '../Cards';
import type { ViewProps } from '../App';
import { go, useSubAction } from '../router';
import { useStore } from '../store';
import type { AppData, CareerChange, CareerChangeKind, JobApp, JobStage, Meeting, ProjectStatus, WorkProject } from '../types';
import { addDays, formatDate, formatMoney, relativeDay, todayISO, uid } from '../utils';
import { Chips, Empty, Field, Icon, MoneyInput, MultiChips, notify, PageHeader, Pill, Progress, Segmented, Sheet, Toggle, type IconName } from '../ui';
import { cyclesToResume, removeResume, RESUME_KINDS, resumeOf, upsertResume } from '../carreira';
import type { ResumeItem, ResumeKind } from '../types';
import {
  applySalaryToFinance,
  CHANGE_LABEL,
  currentWork,
  isBlankMeeting,
  projectName,
  projectProgress,
  sortProjects,
  syncCareerEvents,
  newProject,
  isBlankProject,
  PROJECT_STATUS_UI,
  meetingKindLabel,
  MEETING_KINDS_UI,
  meetingTitle,
  newMeeting,
  nextMeeting,
  openTodos,
  REPEAT_OPTIONS,
  salaryChanges,
  salaryIncomeFrom,
  splitMeetings,
  tenure,
  advance,
  closedJobs,
  closeJob,
  isBlankJob,
  isOpen,
  newJob,
  openJobs,
  OUTCOMES,
  reopenJob,
  setStage,
  stageCounts,
  stageIndex,
  stageLabel,
  STAGES,
  waitingDays,
} from '../carreira';

/**
 * Carreira (N8). Endereços:
 * #/carreira (casa: trabalho atual, reuniões, próximos passos) · #/carreira/menu · #/carreira/reuniao · #/carreira/mudanca
 * #/vagas (lista com etapas) · #/vagas/nova · #/metas (em breve). Currículo e Metas chegam na N8.3 e N8.4.
 */

const STAGE_TONE: Record<JobStage, 'gray' | 'blue' | 'orange' | 'green'> = { interesse: 'gray', enviei: 'blue', entrevista: 'orange', proposta: 'green' };

/** Toda mudança em Carreira deixa a Agenda igual (N8.5). */
const synced = (fn: (d: AppData) => AppData) => (d: AppData) => syncCareerEvents(fn(d));

function saveJob(job: JobApp) {
  return synced((d: AppData): AppData => {
    const jobs = d.career.jobs.some((j) => j.id === job.id) ? d.career.jobs.map((j) => (j.id === job.id ? job : j)) : [job, ...d.career.jobs];
    return { ...d, career: { ...d.career, jobs } };
  });
}

function removeJob(id: string) {
  return synced((d: AppData): AppData => ({ ...d, career: { ...d.career, jobs: d.career.jobs.filter((j) => j.id !== id) }, deleted: { ...d.deleted, [id]: new Date().toISOString() } }));
}

const title = (j: JobApp) => j.role.trim() || 'Vaga sem cargo';
const sub = (j: JobApp) => [j.company.trim() || 'Empresa não informada', j.salary.trim()].filter(Boolean).join(' · ');

function nextText(j: JobApp, today: string): string | null {
  if (j.nextDate) return `${j.next.trim() || 'Próximo passo'} · ${relativeDay(j.nextDate)}${j.nextTime ? `, ${j.nextTime}` : ''}`;
  const w = waitingDays(j, today);
  if (w) return `Sem resposta há ${w} dias: vale mandar uma mensagem?`;
  return j.next.trim() || null;
}

function JobCard({ j, onOpen }: { j: JobApp; onOpen: () => void }) {
  const today = todayISO();
  const next = nextText(j, today);
  const late = j.nextDate !== null && j.nextDate < today;
  return (
    <button type="button" className="card job-card" onClick={onOpen}>
      <span className="job-top">
        <span className="job-name">
          <span className="row-title">{title(j)}</span>
          <span className="muted small">{sub(j)}</span>
        </span>
        <Pill tone={STAGE_TONE[j.stage]}>{stageLabel(j.stage)}</Pill>
      </span>
      {next && (
        <span className={`job-next${late ? ' late' : ''}`}>
          <Icon name="calendar" size={16} /> {late ? `Atrasado: ${next}` : next}
        </span>
      )}
    </button>
  );
}

/** Casa do módulo: trabalho atual, reuniões e os próximos passos das vagas. */
export function CarreiraPage({ route }: ViewProps) {
  const { data } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [changeOpen, setChangeOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showDoneProjects, setShowDoneProjects] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const { update } = useStore();
  const today = todayISO();

  function createMeeting() {
    const m = newMeeting(uid(), today);
    update(saveMeeting(m));
    setMeetingId(m.id);
  }
  function createProject() {
    const pr = newProject(uid(), new Date().toISOString());
    update(saveProject(pr));
    setProjectId(pr.id);
  }
  const [tab, setTab] = useState<'trabalho' | 'curriculo'>('trabalho');
  const [resumeEdit, setResumeEdit] = useState<ResumeItem | ResumeKind | null>(null);
  useSubAction(route, 'carreira', { menu: () => setMenu(true), reuniao: createMeeting, mudanca: () => setChangeOpen(true), projeto: createProject, curriculo: () => setTab('curriculo'), 'novo-item': () => { setTab('curriculo'); setResumeEdit('conquista'); } });
  // Vindo da Agenda: #/carreira/abrir-m-<id> (reunião), abrir-j-<id> (vaga), abrir-p-<id> (projeto).
  useEffect(() => {
    const m = /^abrir-([mjp])-(.+)$/.exec(route.sub);
    if (!m) return;
    if (m[1] === 'm') setMeetingId(m[2]);
    else if (m[1] === 'j') setOpenId(m[2]);
    else setProjectId(m[2]);
    window.history.replaceState(null, '', '#/carreira');
  }, [route.n, route.sub]);
  const projects = sortProjects(data.career.projects);

  const jobs = data.career.jobs;
  const open = openJobs(jobs);
  const pending = open.filter((j) => j.nextDate || waitingDays(j, today)).slice(0, 3);
  const work = currentWork(data.career.changes);
  const history = salaryChanges(data.career.changes).reverse();
  const { upcoming, past } = splitMeetings(data.career.meetings, today);
  const todos = openTodos(data.career.meetings);
  const money = (n: number) => (showSalary ? formatMoney(n) : 'R$ ••••');

  return (
    <>
      <PageHeader
        title="Carreira"
        subtitle="Onde você está, para onde quer ir e as vagas no caminho."
        tabs={
          <Segmented
            label="Seção"
            swipe
            value={tab}
            onChange={setTab}
            options={[
              { value: 'trabalho', label: 'Trabalho' },
              { value: 'curriculo', label: 'Currículo' },
            ]}
          />
        }
      />
      {tab === 'curriculo' ? (
        <ResumeTab onEdit={setResumeEdit} />
      ) : (

      <CardScreen
        screen="carreira"
        cards={[
          { id: 'trabalho', label: 'Trabalho atual', lock: 'top', node: (
      <section className="card">
        <div className="card-head">
          <h2>Trabalho atual</h2>
          {work?.since && <Pill tone="green">Há {tenure(work.since, today)}</Pill>}
        </div>
        {work ? (
          <div className="stack">
            <div>
              <div className="career-role">{work.role || 'Cargo não informado'}</div>
              <div className="muted small">
                {work.company || 'Empresa não informada'}
                {work.roleSince ? ` · neste cargo desde ${formatDate(work.roleSince, { month: 'short', year: 'numeric' })}` : ''}
              </div>
            </div>
            <button type="button" className="career-salary" onClick={() => setShowSalary(!showSalary)} aria-label={showSalary ? 'Esconder salário' : 'Mostrar salário'}>
              <span className="muted small">Salário mensal · toque para {showSalary ? 'esconder' : 'mostrar'}</span>
              <b>{work.salary ? money(work.salary) : 'Não informado'}</b>
            </button>
          </div>
        ) : (
          <Empty>Registre seu cargo atual para acompanhar promoções, aumentos e tempo de casa.</Empty>
        )}
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button type="button" className="btn primary" onClick={() => setChangeOpen(true)}>
            {work ? 'Registrar mudança' : 'Registrar cargo atual'}
          </button>
        </div>
      </section>
      ) },
          { id: 'reunioes', label: 'Reuniões', node: (
      <section className="card">
        <div className="card-head">
          <h2>Reuniões</h2>
          <button type="button" className="link" onClick={createMeeting}>
            + Nova
          </button>
        </div>
        {upcoming.length === 0 && past.length === 0 ? (
          <Empty>Guarde pautas, anotações e combinados das reuniões, 1:1 e apresentações. As que repetem (ex.: a cada 2 semanas) já marcam a próxima.</Empty>
        ) : (
          <ul className="list">
            {upcoming.map((m) => (
              <MeetingRow key={m.id} m={m} onOpen={() => setMeetingId(m.id)} />
            ))}
            {past.slice(0, 4).map((m) => (
              <MeetingRow key={m.id} m={m} past onOpen={() => setMeetingId(m.id)} />
            ))}
          </ul>
        )}
      </section>
      ) },
          { id: 'projetos', label: 'Projetos', node: (
      <section className="card">
        <div className="card-head">
          <h2>Projetos</h2>
          <button type="button" className="link" onClick={createProject}>
            + Novo
          </button>
        </div>
        {projects.active.length ? (
          <ul className="list">
            {projects.active.map((pr) => {
              const g = projectProgress(pr);
              const st = PROJECT_STATUS_UI.find((x) => x.id === pr.status)!;
              const late = (pr.deadline && pr.deadline < today) || (g.next?.date && g.next.date < today);
              return (
                <li key={pr.id}>
                  <button type="button" className="row career-plain career-project" onClick={() => setProjectId(pr.id)}>
                    <span className="row-body">
                      <span className="row-title">{projectName(pr)}</span>
                      <span className="muted small">
                        {[pr.area.trim(), pr.deadline ? `prazo ${formatDate(pr.deadline)}` : ''].filter(Boolean).join(' · ') || 'Sem prazo'}
                      </span>
                      {g.total > 0 && <Progress pct={(g.done / g.total) * 100} tone={late ? 'orange' : 'green'} />}
                      {g.next && (
                        <span className={`small ${g.next.date && g.next.date < today ? 'career-late' : 'muted'}`}>
                          Próxima entrega: {g.next.text || 'sem nome'}
                          {g.next.date ? ` · ${relativeDay(g.next.date)}` : ''}
                        </span>
                      )}
                    </span>
                    <span className="career-amount">
                      <Pill tone={st.tone}>{st.label}</Pill>
                      {g.total > 0 && (
                        <span className="muted small tabular">
                          {g.done}/{g.total}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Projetos do seu setor (ex.: repasse, contratos de prestadores) com prazo e entregas. Prazos e entregas aparecem sozinhos na Agenda.</Empty>
        )}
        {projects.done.length > 0 && (
          <>
            <button type="button" className="link small" style={{ marginTop: 10 }} onClick={() => setShowDoneProjects(!showDoneProjects)}>
              {showDoneProjects ? 'Esconder' : 'Ver'} concluídos ({projects.done.length})
            </button>
            {showDoneProjects && (
              <ul className="list">
                {projects.done.map((pr) => (
                  <li key={pr.id}>
                    <button type="button" className="row career-plain career-past" onClick={() => setProjectId(pr.id)}>
                      <span className="row-body">
                        <span className="row-title">{projectName(pr)}</span>
                        <span className="muted small">{pr.area}</span>
                      </span>
                      <Pill tone="gray">Concluído</Pill>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
      ) },
          { id: 'combinados', label: 'Combinados em aberto', node: todos.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>Combinados em aberto</h2>
            <span className="muted small">{todos.length}</span>
          </div>
          <ul className="list">
            {todos.slice(0, 6).map(({ meeting, todo }) => (
              <li key={todo.id} className="row">
                <button type="button" className="career-check" aria-label="Marcar como feito" onClick={() => update(saveMeeting({ ...meeting, todos: meeting.todos.map((t) => (t.id === todo.id ? { ...t, done: true } : t)) }))} />
                <button type="button" className="row-body career-plain" onClick={() => setMeetingId(meeting.id)}>
                  <span>{todo.text || 'Sem texto'}</span>
                  <span className="muted small">
                    {meetingTitle(meeting)} · {formatDate(meeting.date)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) },
          { id: 'cargos', label: 'Cargos e salários', node: history.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>Cargos e salários</h2>
          </div>
          <ul className="list">
            {history.map(({ change: c, pct }) => (
              <li key={c.id} className="row">
                <span className="row-body">
                  <span className="row-title">
                    {CHANGE_LABEL[c.kind]}
                    {c.role ? ` · ${c.role}` : ''}
                  </span>
                  <span className="muted small">
                    {formatDate(c.date, { month: 'short', year: 'numeric' })}
                    {c.company ? ` · ${c.company}` : ''}
                    {c.note ? ` · ${c.note}` : ''}
                  </span>
                </span>
                <span className="career-amount">
                  {c.salary > 0 && <b className="tabular">{money(c.salary)}</b>}
                  {pct !== null && <span className={`small ${pct >= 0 ? 'career-up' : 'career-down'}`}>{pct >= 0 ? `+${pct}%` : `${pct}%`}</span>}
                </span>
                <button type="button" className="icon-btn" aria-label="Excluir registro" onClick={() => confirm('Excluir este registro do histórico?') && update(removeChange(c.id))}>
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) },
          { id: 'vagas', label: 'Vagas: próximos passos', node: (
      <section className="card">
        <div className="card-head">
          <h2>Vagas: próximos passos</h2>
          <a className="link" href="#/vagas">
            Ver vagas
          </a>
        </div>
        {pending.length ? (
          <div className="stack">
            {pending.map((j) => (
              <JobCard key={j.id} j={j} onOpen={() => setOpenId(j.id)} />
            ))}
          </div>
        ) : (
          <Empty>{open.length ? `${open.length} vaga(s) em andamento, nenhuma com passo marcado.` : 'Nenhuma vaga em andamento.'}</Empty>
        )}
      </section>
      ) },
          { id: 'breve', label: 'Chegando em breve', node: (
      <section className="card">
        <div className="card-head">
          <h2>Chegando em breve</h2>
        </div>
        <ul className="list">
          <li className="row">
            <Icon name="star" />
            <span className="row-body">
              <span className="row-title">Currículo e conquistas</span>
              <span className="muted small">Experiências, cursos, certificados e o que você conquistou</span>
            </span>
          </li>
          <li className="row">
            <Icon name="target" />
            <span className="row-body">
              <span className="row-title">Metas de carreira</span>
              <span className="muted small">Onde quer chegar, com passos ligados a Estudos e Vagas</span>
            </span>
          </li>
        </ul>
      </section>
      ) },
        ]}
      />
      )}

      {menu && (
        <Sheet title="Criar em Carreira" onClose={() => setMenu(false)}>
          <div className="quick-list">
            <button type="button" className="tile" onClick={() => { setMenu(false); go('vagas/nova'); }}>
              <span className="tile-icon"><Icon name="send" /></span>
              <span className="tile-text"><strong>Nova vaga</strong><span className="muted">Empresa, cargo, etapa e próximo passo</span></span>
              <Icon name="right" size={18} />
            </button>
            <button type="button" className="tile" onClick={() => { setMenu(false); createMeeting(); }}>
              <span className="tile-icon"><Icon name="calendar" /></span>
              <span className="tile-text"><strong>Nova reunião</strong><span className="muted">Reunião, 1:1, apresentação, feedback ou avaliação</span></span>
              <Icon name="right" size={18} />
            </button>
            <button type="button" className="tile" onClick={() => { setMenu(false); createProject(); }}>
              <span className="tile-icon"><Icon name="folder" /></span>
              <span className="tile-text"><strong>Novo projeto</strong><span className="muted">Projeto do setor com prazo e entregas</span></span>
              <Icon name="right" size={18} />
            </button>
            <button type="button" className="tile" onClick={() => { setMenu(false); setTab('curriculo'); setResumeEdit('conquista'); }}>
              <span className="tile-icon"><Icon name="star" /></span>
              <span className="tile-text"><strong>Item no currículo</strong><span className="muted">Conquista, experiência, curso, idioma ou habilidade</span></span>
              <Icon name="right" size={18} />
            </button>
            <button type="button" className="tile" onClick={() => { setMenu(false); setChangeOpen(true); }}>
              <span className="tile-icon"><Icon name="briefcase" /></span>
              <span className="tile-text"><strong>Mudança de cargo ou salário</strong><span className="muted">Entrada, promoção, aumento ou novo emprego</span></span>
              <Icon name="right" size={18} />
            </button>
          </div>
        </Sheet>
      )}
      {changeOpen && <ChangeSheet onClose={() => setChangeOpen(false)} />}
      {resumeEdit && <ResumeSheet item={typeof resumeEdit === 'string' ? null : resumeEdit} kind={typeof resumeEdit === 'string' ? resumeEdit : resumeEdit.kind} onClose={() => setResumeEdit(null)} />}
      {meetingId && <MeetingSheet id={meetingId} onClose={() => setMeetingId(null)} onOpen={setMeetingId} onOpenProject={(pid) => { setMeetingId(null); setProjectId(pid); }} />}
      {projectId && <ProjectSheet id={projectId} onClose={() => setProjectId(null)} onOpenMeeting={(mid) => { setProjectId(null); setMeetingId(mid); }} />}
      {openId && <JobSheet id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function saveMeeting(m: Meeting) {
  return synced((d: AppData): AppData => {
    const ms = d.career.meetings.some((x) => x.id === m.id) ? d.career.meetings.map((x) => (x.id === m.id ? m : x)) : [m, ...d.career.meetings];
    return { ...d, career: { ...d.career, meetings: ms } };
  });
}
function removeMeeting(id: string) {
  return synced((d: AppData): AppData => ({ ...d, career: { ...d.career, meetings: d.career.meetings.filter((m) => m.id !== id) }, deleted: { ...d.deleted, [id]: new Date().toISOString() } }));
}
function saveProject(pr: WorkProject) {
  return synced((d: AppData): AppData => {
    const ps = d.career.projects.some((x) => x.id === pr.id) ? d.career.projects.map((x) => (x.id === pr.id ? pr : x)) : [pr, ...d.career.projects];
    return { ...d, career: { ...d.career, projects: ps } };
  });
}
function removeProject(id: string) {
  return synced((d: AppData): AppData => ({
    ...d,
    career: { ...d.career, projects: d.career.projects.filter((x) => x.id !== id), meetings: d.career.meetings.map((m) => (m.projectIds.includes(id) ? { ...m, projectIds: m.projectIds.filter((x) => x !== id) } : m)) },
    deleted: { ...d.deleted, [id]: new Date().toISOString() },
  }));
}
function removeChange(id: string) {
  return (d: AppData): AppData => ({ ...d, career: { ...d.career, changes: d.career.changes.filter((c) => c.id !== id) }, deleted: { ...d.deleted, [id]: new Date().toISOString() } });
}

function MeetingRow({ m, past, onOpen }: { m: Meeting; past?: boolean; onOpen: () => void }) {
  const open = m.todos.filter((t) => !t.done).length;
  return (
    <li>
      <button type="button" className={`row career-plain${past ? ' career-past' : ''}`} onClick={onOpen}>
        <Icon name={m.kind === 'apresentacao' ? 'bars' : m.kind === 'umum' ? 'user' : 'calendar'} />
        <span className="row-body">
          <span className="row-title">{meetingTitle(m)}</span>
          <span className="muted small">
            {relativeDay(m.date)}
            {m.time ? `, ${m.time}` : ''}
            {m.repeatDays ? ` · ${REPEAT_OPTIONS.find((r) => r.days === m.repeatDays)?.label.toLowerCase() ?? `a cada ${m.repeatDays} dias`}` : ''}
            {open ? ` · ${open} combinado(s)` : ''}
          </span>
        </span>
        <Pill tone={m.kind === 'apresentacao' ? 'orange' : m.kind === 'umum' ? 'blue' : 'gray'}>{meetingKindLabel(m.kind)}</Pill>
      </button>
    </li>
  );
}

/** Registrar entrada, promoção, aumento ou novo emprego. Pergunta antes de mexer em Finanças. */
function ChangeSheet({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const work = currentWork(data.career.changes);
  const [kind, setKind] = useState<CareerChangeKind>(work ? 'aumento' : 'entrada');
  const [date, setDate] = useState(todayISO());
  const [role, setRole] = useState(work?.role ?? '');
  const [company, setCompany] = useState(work?.company ?? '');
  const [cents, setCents] = useState(Math.round((work?.salary ?? 0) * 100));
  const [note, setNote] = useState('');
  const [toFinance, setToFinance] = useState(true);
  const salary = cents / 100;
  const salaryChanged = salary > 0 && salary !== (work?.salary ?? 0);
  const income = salaryChanged ? salaryIncomeFrom(data, date) : null;
  const pct = work?.salary && salaryChanged ? Math.round(((salary - work.salary) / work.salary) * 100) : null;

  function save() {
    const c: CareerChange = { id: uid(), date, kind, role: role.trim(), company: company.trim(), salary, note: note.trim() };
    update((d) => {
      const next = { ...d, career: { ...d.career, changes: [...d.career.changes, c] } };
      return income && toFinance ? applySalaryToFinance(next, salary, date) : next;
    });
    notify('Registrado', income && toFinance ? 'Receita de salário atualizada em Finanças.' : CHANGE_LABEL[kind]);
    onClose();
  }

  return (
    <Sheet
      title={work ? 'Registrar mudança' : 'Cargo atual'}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" onClick={save} disabled={!role.trim() && !company.trim() && !salary}>
          Salvar
        </button>
      }
    >
      <div className="stack">
        <Group label="O que mudou">
          <Chips label="O que mudou" options={(Object.keys(CHANGE_LABEL) as CareerChangeKind[]).map((k) => ({ value: k, label: CHANGE_LABEL[k] }))} value={kind} onChange={setKind} />
        </Group>
        <Field label="A partir de">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value || todayISO())} />
        </Field>
        <Field label="Cargo">
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex.: Analista de Contratos" />
        </Field>
        <Field label="Empresa">
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Onde você trabalha" />
        </Field>
        <Field label="Salário mensal" hint={pct !== null ? `${pct >= 0 ? '+' : ''}${pct}% sobre o anterior` : 'Opcional. Fica escondido na tela até você tocar.'}>
          <MoneyInput cents={cents} onChange={setCents} label="Salário mensal" />
        </Field>
        <Field label="Observação">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: dissídio + mérito" />
        </Field>
        {income && (
          <div className="job-ask">
            <Toggle checked={toFinance} onChange={setToFinance} label={`Atualizar também a receita "${income.description}" em Finanças a partir de ${formatDate(income.date)}`} />
          </div>
        )}
      </div>
    </Sheet>
  );
}

/** Ficha da reunião (salva sozinha). Reunião vazia some ao fechar. */
function MeetingSheet({ id, onClose, onOpen, onOpenProject }: { id: string; onClose: () => void; onOpen: (id: string) => void; onOpenProject?: (id: string) => void }) {
  const { data, update } = useStore();
  const projects = sortProjects(data.career.projects).active;
  const [todo, setTodo] = useState('');
  const m = data.career.meetings.find((x) => x.id === id);
  if (!m) return null;
  const set = (patch: Partial<Meeting>) => update(saveMeeting({ ...m, ...patch }));
  const linked = data.career.projects.filter((x) => m.projectIds.includes(x.id));

  function close() {
    if (m && isBlankMeeting(m)) update(removeMeeting(m.id));
    onClose();
  }
  function addTodo() {
    if (!m || !todo.trim()) return;
    set({ todos: [...m.todos, { id: uid(), text: todo.trim(), done: false }] });
    setTodo('');
  }
  function scheduleNext() {
    if (!m) return;
    const n = nextMeeting(m, uid());
    if (!n) return;
    update((d) => saveMeeting(n)(saveMeeting({ ...m, nextCreated: true })(d)));
    notify('Próxima marcada', `${formatDate(n.date)}${n.todos.length ? ` · ${n.todos.length} combinado(s) levados` : ''}`);
    onOpen(n.id);
  }

  return (
    <Sheet title={isBlankMeeting(m) ? 'Nova reunião' : meetingTitle(m)} onClose={close}>
      <div className="stack">
        <Group label="Tipo">
          <Chips label="Tipo" options={MEETING_KINDS_UI.map((k) => ({ value: k.id, label: k.label }))} value={m.kind} onChange={(kind) => set({ kind })} />
        </Group>
        <Field label="Assunto">
          <input className="input" value={m.title} onChange={(e) => set({ title: e.target.value })} placeholder={m.kind === 'apresentacao' ? 'Ex.: Avanços do repasse e contratos' : 'Ex.: Alinhamento da semana'} />
        </Field>
        <Field label="Com quem">
          <input className="input" value={m.with} onChange={(e) => set({ with: e.target.value })} placeholder="Pessoa, equipe ou setor" />
        </Field>
        <div className="grid-2">
          <Field label="Dia">
            <input className="input" type="date" value={m.date} onChange={(e) => e.target.value && set({ date: e.target.value })} />
          </Field>
          <Field label="Hora (opcional)">
            <input className="input" type="time" value={m.time} onChange={(e) => set({ time: e.target.value })} />
          </Field>
        </div>
        <Group label="Repete">
          <Chips label="Repete" options={REPEAT_OPTIONS.map((r) => ({ value: String(r.days), label: r.label }))} value={String(m.repeatDays)} onChange={(v) => set({ repeatDays: Number(v) })} />
        </Group>
        <p className="muted small career-sync">
          <Icon name="calendar" size={14} /> Aparece sozinha na Agenda e se atualiza quando você muda aqui.
        </p>
        {projects.length > 0 && (
          <Group label="Projetos desta reunião">
            <MultiChips label="Projetos" options={projects.map((x) => [x.id, projectName(x)])} value={m.projectIds} onToggle={(pid) => set({ projectIds: m.projectIds.includes(pid) ? m.projectIds.filter((x) => x !== pid) : [...m.projectIds, pid] })} />
          </Group>
        )}
        {linked.map((pr) => {
          const g = projectProgress(pr);
          const open = pr.deliveries.filter((x) => !x.done);
          return (
            <div key={pr.id} className="career-linked">
              <button type="button" className="career-plain career-linked-head" onClick={() => onOpenProject?.(pr.id)}>
                <b>{projectName(pr)}</b>
                <span className="muted small tabular">
                  {g.done}/{g.total} entregas
                </span>
              </button>
              {open.length ? (
                <ul className="career-mini">
                  {open.slice(0, 5).map((x) => (
                    <li key={x.id}>
                      {x.text || 'Sem nome'}
                      {x.date ? <span className={x.date < todayISO() ? 'career-late' : 'muted'}> · {formatDate(x.date)}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="muted small">Nenhuma entrega em aberto.</span>
              )}
            </div>
          );
        })}
        <Field label="Pauta e anotações">
          <textarea className="input" rows={5} value={m.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="O que levar, o que foi falado, decisões…" />
        </Field>
        <Field label="Link dos slides ou material" hint="Anexar o arquivo dentro do app fica para depois; por enquanto, o link (Drive, OneDrive…).">
          <input className="input" value={m.link} onChange={(e) => set({ link: e.target.value })} placeholder="https://…" inputMode="url" />
        </Field>
        {m.link.trim() && (
          <a className="link small" href={/^https?:\/\//.test(m.link.trim()) ? m.link.trim() : `https://${m.link.trim()}`} target="_blank" rel="noreferrer">
            <Icon name="ext" size={14} /> Abrir material
          </a>
        )}
        <div>
          <p className="field-label">Combinados</p>
          <ul className="list">
            {m.todos.map((t) => (
              <li key={t.id} className="row">
                <button type="button" className={`career-check${t.done ? ' on' : ''}`} aria-label={t.done ? 'Desmarcar' : 'Marcar como feito'} onClick={() => set({ todos: m.todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) })}>
                  {t.done && <Icon name="check" size={13} />}
                </button>
                <span className={`row-body${t.done ? ' career-done' : ''}`}>{t.text}</span>
                <button type="button" className="icon-btn" aria-label="Remover combinado" onClick={() => set({ todos: m.todos.filter((x) => x.id !== t.id) })}>
                  <Icon name="x" size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="career-add">
            <input className="input" value={todo} onChange={(e) => setTodo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTodo()} placeholder="Novo combinado" aria-label="Novo combinado" />
            <button type="button" className="btn soft" onClick={addTodo} disabled={!todo.trim()}>
              Adicionar
            </button>
          </div>
        </div>
        {m.repeatDays > 0 && !m.nextCreated && (
          <button type="button" className="btn soft" onClick={scheduleNext}>
            Marcar a próxima ({formatDate(addDays(m.date, m.repeatDays))})
          </button>
        )}
        {!isBlankMeeting(m) && (
          <button type="button" className="btn danger" onClick={() => confirm('Excluir esta reunião? Ela sai da Agenda também.') && (update(removeMeeting(m.id)), onClose())}>
            <Icon name="trash" size={16} /> Excluir reunião
          </button>
        )}
      </div>
    </Sheet>
  );
}

/** Ficha do projeto (salva sozinha). Projeto vazio some ao fechar. */
function ProjectSheet({ id, onClose, onOpenMeeting }: { id: string; onClose: () => void; onOpenMeeting: (id: string) => void }) {
  const { data, update } = useStore();
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const pr = data.career.projects.find((x) => x.id === id);
  if (!pr) return null;
  const set = (patch: Partial<WorkProject>) => update(saveProject({ ...pr, ...patch }));
  const meetings = splitMeetings(data.career.meetings.filter((m) => m.projectIds.includes(pr.id)), todayISO());
  const today = todayISO();

  function close() {
    if (pr && isBlankProject(pr)) update(removeProject(pr.id));
    onClose();
  }
  function addDelivery() {
    if (!pr || !text.trim()) return;
    set({ deliveries: [...pr.deliveries, { id: uid(), text: text.trim(), date: date || null, done: false }] });
    setText('');
    setDate('');
  }
  const sorted = pr.deliveries.slice().sort((a, b) => Number(a.done) - Number(b.done) || (a.date ?? '9999').localeCompare(b.date ?? '9999'));

  return (
    <Sheet title={isBlankProject(pr) ? 'Novo projeto' : projectName(pr)} onClose={close}>
      <div className="stack">
        <Field label="Nome">
          <input className="input" value={pr.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex.: Revisão dos contratos de prestadores" autoFocus={isBlankProject(pr)} />
        </Field>
        <div className="grid-2">
          <Field label="Área ou setor">
            <input className="input" value={pr.area} onChange={(e) => set({ area: e.target.value })} placeholder="Ex.: Repasse" />
          </Field>
          <Field label="Prazo">
            <input className="input" type="date" value={pr.deadline ?? ''} onChange={(e) => set({ deadline: e.target.value || null })} />
          </Field>
        </div>
        <Group label="Situação">
          <Chips label="Situação" options={PROJECT_STATUS_UI.map((x) => ({ value: x.id, label: x.label }))} value={pr.status} onChange={(status: ProjectStatus) => set({ status })} />
        </Group>
        <div>
          <p className="field-label">Entregas</p>
          <ul className="list">
            {sorted.map((x) => (
              <li key={x.id} className="row">
                <button type="button" className={`career-check${x.done ? ' on' : ''}`} aria-label={x.done ? 'Desmarcar entrega' : 'Marcar entrega como feita'} onClick={() => set({ deliveries: pr.deliveries.map((y) => (y.id === x.id ? { ...y, done: !y.done } : y)) })}>
                  {x.done && <Icon name="check" size={13} />}
                </button>
                <span className={`row-body${x.done ? ' career-done' : ''}`}>
                  <span>{x.text || 'Sem nome'}</span>
                  {x.date && <span className={`small ${!x.done && x.date < today ? 'career-late' : 'muted'}`}>{relativeDay(x.date)}</span>}
                </span>
                <button type="button" className="icon-btn" aria-label="Remover entrega" onClick={() => set({ deliveries: pr.deliveries.filter((y) => y.id !== x.id) })}>
                  <Icon name="x" size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="career-add">
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDelivery()} placeholder="Nova entrega" aria-label="Nova entrega" />
            <input className="input career-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Data da entrega" />
          </div>
          <button type="button" className="btn soft block" style={{ marginTop: 8 }} onClick={addDelivery} disabled={!text.trim()}>
            Adicionar entrega
          </button>
        </div>
        <p className="muted small career-sync">
          <Icon name="calendar" size={14} /> Prazo e entregas com data aparecem sozinhos na Agenda.
        </p>
        <Field label="Anotações">
          <textarea className="input" rows={4} value={pr.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Contexto, contatos, pendências…" />
        </Field>
        <Field label="Link (planilha, pasta, slides)">
          <input className="input" value={pr.link} onChange={(e) => set({ link: e.target.value })} placeholder="https://…" inputMode="url" />
        </Field>
        {meetings.upcoming.length + meetings.past.length > 0 && (
          <div>
            <p className="field-label">Reuniões deste projeto</p>
            <ul className="list">
              {[...meetings.upcoming, ...meetings.past].map((m) => (
                <MeetingRow key={m.id} m={m} past={m.date < today} onOpen={() => onOpenMeeting(m.id)} />
              ))}
            </ul>
          </div>
        )}
        {!isBlankProject(pr) && (
          <button type="button" className="btn danger" onClick={() => confirm(`Excluir o projeto "${projectName(pr)}"? Prazo e entregas saem da Agenda.`) && (update(removeProject(pr.id)), onClose())}>
            <Icon name="trash" size={16} /> Excluir projeto
          </button>
        )}
      </div>
    </Sheet>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field" role="group" aria-label={label}>
      <span className="field-label">{label}</span>
      {children}
    </div>
  );
}

function Funnel({ counts, value, onPick }: { counts: Record<JobStage, number>; value: JobStage | null; onPick: (s: JobStage) => void }) {
  return (
    <div className="job-funnel" role="group" aria-label="Vagas por etapa">
      {STAGES.map((s) => (
        <button key={s.id} type="button" className={value === s.id ? 'on' : ''} aria-pressed={value === s.id} onClick={() => onPick(s.id)}>
          <b>{counts[s.id]}</b>
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}

export function VagasPage({ route }: ViewProps) {
  const { data, update } = useStore();
  const [filter, setFilter] = useState<JobStage | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const jobs = data.career.jobs;

  function create() {
    const j = newJob(uid(), todayISO(), new Date().toISOString());
    update(saveJob(j));
    setOpenId(j.id);
  }
  const etapa = Object.fromEntries(STAGES.map((s) => [`etapa-${s.id}`, () => setFilter(s.id)]));
  useSubAction(route, 'vagas', { nova: create, ...etapa });

  const open = openJobs(jobs).filter((j) => !filter || j.stage === filter);
  const closed = closedJobs(jobs);
  return (
    <>
      <PageHeader title="Vagas" subtitle="Suas candidaturas, etapa por etapa." />
      <Funnel counts={stageCounts(jobs)} value={filter} onPick={(s) => setFilter(filter === s ? null : s)} />
      <div className="job-filter-line">
        <span className="muted small">{filter ? `${stageLabel(filter)}: ${open.length}` : `${open.length} em andamento`}</span>
        {filter && (
          <button type="button" className="link" onClick={() => setFilter(null)}>
            Ver todas
          </button>
        )}
      </div>
      {open.length ? (
        <div className="stack">
          {open.map((j) => (
            <JobCard key={j.id} j={j} onOpen={() => setOpenId(j.id)} />
          ))}
        </div>
      ) : (
        <section className="card">
          <Empty>{filter ? 'Nenhuma vaga nesta etapa.' : 'Nenhuma vaga em andamento. Toque no + para guardar uma vaga que te interessa.'}</Empty>
        </section>
      )}
      {closed.length > 0 && (
        <section className="card">
          <button type="button" className="card-head job-closed-head" onClick={() => setShowClosed(!showClosed)} aria-expanded={showClosed}>
            <h2>Encerradas</h2>
            <span className="muted small">
              {closed.length} <Icon name={showClosed ? 'up' : 'down'} size={14} />
            </span>
          </button>
          {showClosed && (
            <ul className="list">
              {closed.map((j) => {
                const o = OUTCOMES.find((x) => x.id === j.outcome)!;
                return (
                  <li key={j.id}>
                    <button type="button" className="row job-closed-row" onClick={() => setOpenId(j.id)}>
                      <span className="row-body">
                        <span className="row-title">{title(j)}</span>
                        <span className="muted small">
                          {sub(j)}
                          {j.closedAt ? ` · ${formatDate(j.closedAt)}` : ''}
                        </span>
                      </span>
                      <Pill tone={o.tone}>{o.label}</Pill>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
      {openId && <JobSheet id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

/** Ficha da vaga: tudo editável na hora (salva sozinho). Vaga sem empresa e sem cargo some ao fechar. */
function JobSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, update } = useStore();
  const [closing, setClosing] = useState(false);
  const j = data.career.jobs.find((x) => x.id === id);
  if (!j) return null;
  const today = todayISO();
  const set = (patch: Partial<JobApp>) => update(saveJob({ ...j, ...patch }));

  function close() {
    if (j && isBlankJob(j)) update(removeJob(j.id));
    onClose();
  }


  function del() {
    if (!j) return;
    if (confirm(`Excluir a vaga "${title(j)}"? O passo sai da Agenda também.`)) {
      update(removeJob(j.id));
      onClose();
    }
  }

  const outcome = OUTCOMES.find((o) => o.id === j.outcome);

  return (
    <Sheet title={isBlankJob(j) ? 'Nova vaga' : title(j)} onClose={close} badge={outcome ? <Pill tone={outcome.tone}>{outcome.label}</Pill> : undefined}>
      <div className="stack">
        <Field label="Cargo">
          <input className="input" value={j.role} onChange={(e) => set({ role: e.target.value })} placeholder="Ex.: Analista de Dados Pleno" autoFocus={isBlankJob(j)} />
        </Field>
        <Field label="Empresa">
          <input className="input" value={j.company} onChange={(e) => set({ company: e.target.value })} placeholder="Ex.: Nuvem Pay" />
        </Field>
        <div className="grid-2">
          <Field label="Salário">
            <input className="input" value={j.salary} onChange={(e) => set({ salary: e.target.value })} placeholder="R$ 8.000 ou a combinar" />
          </Field>
          <Field label="Link da vaga">
            <input className="input" value={j.link} onChange={(e) => set({ link: e.target.value })} placeholder="site.com/vaga" inputMode="url" />
          </Field>
        </div>
        {j.link.trim() && (
          <a className="link small" href={/^https?:\/\//.test(j.link.trim()) ? j.link.trim() : `https://${j.link.trim()}`} target="_blank" rel="noreferrer">
            <Icon name="ext" size={14} /> Abrir a vaga
          </a>
        )}

        {isOpen(j) ? (
          <>
            <Group label="Etapa">
              <div className="job-steps" role="radiogroup" aria-label="Etapa">
                {STAGES.map((s) => (
                  <button key={s.id} type="button" role="radio" aria-checked={j.stage === s.id} className={stageIndex(s.id) < stageIndex(j.stage) ? 'done' : j.stage === s.id ? 'cur' : ''} onClick={() => update(saveJob(setStage(j, s.id, today)))}>
                    <i />
                    {s.label}
                  </button>
                ))}
              </div>
            </Group>
            <div className="btn-row">
              {j.stage !== 'proposta' && (
                <button type="button" className="btn primary" onClick={() => update(saveJob(advance(j, today)))}>
                  Avançar etapa
                </button>
              )}
              <button type="button" className="btn soft" onClick={() => setClosing(!closing)}>
                Encerrar
              </button>
            </div>
            {closing && (
              <div className="job-ask">
                <span>Como terminou? Ela sai da lista e fica em Encerradas.</span>
                <Chips
                  label="Como terminou"
                  options={OUTCOMES.map((o) => ({ value: o.id, label: o.label }))}
                  value={null}
                  onChange={(o) => {
                    update(saveJob(closeJob(j, o, today)));
                    setClosing(false);
                    notify('Vaga encerrada', o === 'contratado' ? 'Parabéns!' : 'Ela fica guardada em Encerradas.');
                  }}
                />
              </div>
            )}

            <Field label="Próximo passo" hint="Ex.: entrevista técnica, mandar portfólio, cobrar retorno.">
              <input className="input" value={j.next} onChange={(e) => set({ next: e.target.value })} placeholder="O que fazer agora" />
            </Field>
            <div className="grid-2">
              <Field label="Quando">
                <input className="input" type="date" value={j.nextDate ?? ''} onChange={(e) => set({ nextDate: e.target.value || null })} />
              </Field>
              <Field label="Hora (opcional)">
                <input className="input" type="time" value={j.nextTime} onChange={(e) => set({ nextTime: e.target.value })} />
              </Field>
            </div>
            {j.nextDate && (
              <p className="muted small career-sync">
                <Icon name="calendar" size={14} /> Este passo aparece sozinho na Agenda.
              </p>
            )}
          </>
        ) : (
          <div className="btn-row">
            <button type="button" className="btn soft" onClick={() => update(saveJob(reopenJob(j, today)))}>
              <Icon name="restore" size={16} /> Reabrir vaga
            </button>
          </div>
        )}

        <Field label="Anotações">
          <textarea className="input" rows={4} value={j.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Recrutador, perguntas da entrevista, impressões…" />
        </Field>

        {j.history.length > 0 && (
          <div>
            <p className="field-label">Histórico</p>
            <ul className="list">
              {j.history
                .slice()
                .reverse()
                .map((h, i) => (
                  <li key={i} className="row">
                    <span className="row-body">
                      <span>{stageLabel(h.stage)}</span>
                    </span>
                    <span className="muted small tabular">{formatDate(h.date, { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {!isBlankJob(j) && (
          <button type="button" className="btn danger" onClick={del}>
            <Icon name="trash" size={16} /> Excluir vaga
          </button>
        )}
      </div>
    </Sheet>
  );
}

/** Metas de carreira chegam na N8.4. */
export function MetasPage() {
  return (
    <>
      <PageHeader title="Metas" />
      <section className="card">
        <Empty>
          Em breve: onde você quer chegar (cargo, área, salário), com prazo e passos ligados às trilhas de Estudos e às suas vagas.
        </Empty>
      </section>
    </>
  );
}

// ---------- Currículo e conquistas (N8.3) ----------

const monthLabel = (m: string) => (m ? `${m.slice(5, 7)}/${m.slice(0, 4)}` : '');
function period(i: ResumeItem): string {
  if (!i.from && !i.to) return '';
  if (i.from && !i.to) return i.kind === 'experiencia' || i.kind === 'formacao' ? `desde ${monthLabel(i.from)} (atual)` : monthLabel(i.from);
  return i.from && i.from !== i.to ? `${monthLabel(i.from)} – ${monthLabel(i.to)}` : monthLabel(i.to);
}

function ResumeTab({ onEdit }: { onEdit: (x: ResumeItem | ResumeKind) => void }) {
  const { data, update } = useStore();
  const items = data.career.resume;
  const fromStudy = cyclesToResume(data);
  return (
    <>
      {fromStudy.length > 0 && (
        <section className="card raised">
          <div className="card-head">
            <h2>Trazer de Estudos</h2>
          </div>
          <p className="muted small">Ciclos concluídos que podem entrar no currículo como curso.</p>
          <ul className="list">
            {fromStudy.map((c) => (
              <li key={c.id} className="row">
                <div className="row-body">
                  <span className="row-title">{c.name}</span>
                  <span className="row-meta">Concluído em {monthLabel(c.to)}</span>
                </div>
                <button
                  type="button"
                  className="btn soft small"
                  onClick={() => {
                    update(upsertResume({ id: uid(), kind: 'curso', title: c.name, org: 'Estudos (Central Pessoal)', from: c.from, to: c.to, note: '', cycleId: c.id, createdAt: new Date().toISOString() }));
                    notify('Entrou no currículo', `${c.name}, em Cursos e certificados.`);
                  }}
                >
                  Adicionar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {items.length === 0 && (
        <section className="card">
          <Empty>O que você já fez: experiências, formação, cursos, idiomas, habilidades e conquistas com resultado. O app só guarda e organiza; o currículo em PDF fica para depois.</Empty>
        </section>
      )}
      {RESUME_KINDS.map((k) => {
        const list = resumeOf(items, k.id);
        return (
          <section key={k.id} className="card">
            <div className="card-head">
              <h2 className="cat-title">
                <Icon name={k.icon as IconName} size={18} /> {k.plural}
              </h2>
              <button type="button" className="link" onClick={() => onEdit(k.id)}>
                + Adicionar
              </button>
            </div>
            {list.length === 0 ? (
              <p className="muted small">Nada ainda.</p>
            ) : (
              <ul className="list">
                {list.map((i) => (
                  <li key={i.id}>
                    <button type="button" className="row" onClick={() => onEdit(i)}>
                      <div className="row-body">
                        <span className="row-title">{i.title || 'Sem título'}</span>
                        <span className="row-meta">{[i.org, period(i), i.note].filter(Boolean).join(' · ')}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}

function ResumeSheet({ item, kind: initialKind, onClose }: { item: ResumeItem | null; kind: ResumeKind; onClose: () => void }) {
  const { update } = useStore();
  const [kind, setKind] = useState<ResumeKind>(item?.kind ?? initialKind);
  const [title, setTitle] = useState(item?.title ?? '');
  const [org, setOrg] = useState(item?.org ?? '');
  const [from, setFrom] = useState(item?.from ?? '');
  const [to, setTo] = useState(item?.to ?? '');
  const [note, setNote] = useState(item?.note ?? '');
  const info = RESUME_KINDS.find((k) => k.id === kind)!;
  function save() {
    if (!title.trim()) return notify('Falta o nome', info.titleHint);
    update(upsertResume({ id: item?.id ?? uid(), kind, title: title.trim(), org: org.trim(), from, to, note: note.trim(), cycleId: item?.cycleId ?? null, createdAt: item?.createdAt ?? new Date().toISOString() }));
    onClose();
  }
  return (
    <Sheet title={item ? 'Editar no currículo' : 'Adicionar ao currículo'} onClose={onClose}>
      <div className="chips" role="radiogroup" aria-label="Tipo">
        {RESUME_KINDS.map((k) => (
          <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} className={`chip-btn${kind === k.id ? ' on' : ''}`} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <Field label={info.titleHint}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus={!item} />
      </Field>
      {info.orgHint && (
        <Field label={info.orgHint}>
          <input className="input" value={org} onChange={(e) => setOrg(e.target.value)} />
        </Field>
      )}
      {kind !== 'idioma' && kind !== 'habilidade' && (
        <div className="form-row">
          <Field label={kind === 'conquista' || kind === 'curso' ? 'Quando' : 'Início'}>
            <input type="month" className="input" value={kind === 'conquista' || kind === 'curso' ? to || from : from} onChange={(e) => (kind === 'conquista' || kind === 'curso' ? (setTo(e.target.value), setFrom(e.target.value)) : setFrom(e.target.value))} />
          </Field>
          {(kind === 'experiencia' || kind === 'formacao') && (
            <Field label="Fim" hint="Vazio = atual">
              <input type="month" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          )}
        </div>
      )}
      <Field label={info.noteHint}>
        <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="btn-row">
        <button type="button" className="btn primary" onClick={save}>
          Salvar
        </button>
        {item && (
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (!confirm(`Excluir "${item.title}" do currículo?`)) return;
              update(removeResume(item.id));
              onClose();
            }}
          >
            <Icon name="trash" size={18} /> Excluir
          </button>
        )}
      </div>
    </Sheet>
  );
}
