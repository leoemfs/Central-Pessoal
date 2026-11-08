import { useState, type ReactNode } from 'react';
import type { ViewProps } from '../App';
import { go, useSubAction } from '../router';
import { useStore } from '../store';
import type { AppData, CareerChange, CareerChangeKind, JobApp, JobStage, Meeting } from '../types';
import { addDays, formatDate, formatMoney, relativeDay, todayISO, uid } from '../utils';
import { Chips, Empty, Field, Icon, MoneyInput, notify, PageHeader, Pill, Sheet, Toggle } from '../ui';
import {
  applySalaryToFinance,
  CHANGE_LABEL,
  currentWork,
  isBlankMeeting,
  meetingEvent,
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
  jobEvent,
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

function saveJob(job: JobApp) {
  return (d: AppData): AppData => {
    const jobs = d.career.jobs.some((j) => j.id === job.id) ? d.career.jobs.map((j) => (j.id === job.id ? job : j)) : [job, ...d.career.jobs];
    return { ...d, career: { ...d.career, jobs } };
  };
}

function removeJob(id: string) {
  return (d: AppData): AppData => ({ ...d, career: { ...d.career, jobs: d.career.jobs.filter((j) => j.id !== id) }, deleted: { ...d.deleted, [id]: new Date().toISOString() } });
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
  const [showSalary, setShowSalary] = useState(false);
  const { update } = useStore();
  const today = todayISO();

  function createMeeting() {
    const m = newMeeting(uid(), today);
    update(saveMeeting(m));
    setMeetingId(m.id);
  }
  useSubAction(route, 'carreira', { menu: () => setMenu(true), reuniao: createMeeting, mudanca: () => setChangeOpen(true) });

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
      <PageHeader title="Carreira" subtitle="Onde você está, para onde quer ir e as vagas no caminho." />

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

      {todos.length > 0 && (
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
      )}

      {history.length > 0 && (
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
      )}

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
            <button type="button" className="tile" onClick={() => { setMenu(false); setChangeOpen(true); }}>
              <span className="tile-icon"><Icon name="briefcase" /></span>
              <span className="tile-text"><strong>Mudança de cargo ou salário</strong><span className="muted">Entrada, promoção, aumento ou novo emprego</span></span>
              <Icon name="right" size={18} />
            </button>
          </div>
        </Sheet>
      )}
      {changeOpen && <ChangeSheet onClose={() => setChangeOpen(false)} />}
      {meetingId && <MeetingSheet id={meetingId} onClose={() => setMeetingId(null)} onOpen={setMeetingId} />}
      {openId && <JobSheet id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function saveMeeting(m: Meeting) {
  return (d: AppData): AppData => {
    const ms = d.career.meetings.some((x) => x.id === m.id) ? d.career.meetings.map((x) => (x.id === m.id ? m : x)) : [m, ...d.career.meetings];
    return { ...d, career: { ...d.career, meetings: ms } };
  };
}
function removeMeeting(id: string) {
  return (d: AppData): AppData => ({ ...d, career: { ...d.career, meetings: d.career.meetings.filter((m) => m.id !== id) }, deleted: { ...d.deleted, [id]: new Date().toISOString() } });
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
function MeetingSheet({ id, onClose, onOpen }: { id: string; onClose: () => void; onOpen: (id: string) => void }) {
  const { data, update } = useStore();
  const [todo, setTodo] = useState('');
  const m = data.career.meetings.find((x) => x.id === id);
  if (!m) return null;
  const set = (patch: Partial<Meeting>) => update(saveMeeting({ ...m, ...patch }));
  const event = m.eventId ? data.events.find((e) => e.id === m.eventId) : undefined;
  const synced = event && event.date === m.date && event.time === m.time && event.title === meetingTitle(m);

  function close() {
    if (m && isBlankMeeting(m)) update(removeMeeting(m.id));
    onClose();
  }
  function addTodo() {
    if (!m || !todo.trim()) return;
    set({ todos: [...m.todos, { id: uid(), text: todo.trim(), done: false }] });
    setTodo('');
  }
  function toAgenda() {
    if (!m) return;
    const ev = meetingEvent(m, m.eventId ?? uid());
    update((d) => {
      const events = d.events.some((e) => e.id === ev.id) ? d.events.map((e) => (e.id === ev.id ? ev : e)) : [ev, ...d.events];
      return saveMeeting({ ...m, eventId: ev.id })({ ...d, events });
    });
    notify(event ? 'Agenda atualizada' : 'Na Agenda', `${relativeDay(ev.date)}${ev.time ? `, ${ev.time}` : ''}`);
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
        <div className="job-ask">
          {synced ? (
            <span className="muted small">
              <Icon name="check" size={14} /> Está na Agenda.
            </span>
          ) : (
            <>
              <span>{event ? 'A reunião mudou. Atualizar na Agenda?' : 'Pôr esta reunião na Agenda?'}</span>
              <div className="btn-row">
                <button type="button" className="btn primary" onClick={toAgenda}>
                  {event ? 'Atualizar na Agenda' : 'Pôr na Agenda'}
                </button>
              </div>
            </>
          )}
        </div>
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
          <button type="button" className="btn danger" onClick={() => confirm('Excluir esta reunião? O compromisso na Agenda, se houver, continua lá.') && (update(removeMeeting(m.id)), onClose())}>
            <Icon name="trash" size={16} /> Excluir reunião
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
  const event = j.eventId ? data.events.find((e) => e.id === j.eventId) : undefined;

  function close() {
    if (j && isBlankJob(j)) update(removeJob(j.id));
    onClose();
  }

  function toAgenda() {
    if (!j) return;
    const ev = jobEvent(j, j.eventId ?? uid());
    if (!ev) return;
    update((d) => {
      const events = d.events.some((e) => e.id === ev.id) ? d.events.map((e) => (e.id === ev.id ? ev : e)) : [ev, ...d.events];
      return saveJob({ ...j, eventId: ev.id })({ ...d, events });
    });
    notify(event ? 'Agenda atualizada' : 'Na Agenda', `${relativeDay(ev.date)}${ev.time ? `, ${ev.time}` : ''}`);
  }

  function del() {
    if (!j) return;
    if (confirm(`Excluir a vaga "${title(j)}"? O compromisso na Agenda, se houver, continua lá.`)) {
      update(removeJob(j.id));
      onClose();
    }
  }

  const synced = event && event.date === j.nextDate && event.time === j.nextTime;
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
              <div className="job-ask">
                {synced ? (
                  <span className="muted small">
                    <Icon name="check" size={14} /> Está na Agenda.
                  </span>
                ) : (
                  <>
                    <span>{event ? 'A data mudou. Atualizar o compromisso na Agenda?' : 'Pôr este passo na Agenda?'}</span>
                    <div className="btn-row">
                      <button type="button" className="btn primary" onClick={toAgenda}>
                        {event ? 'Atualizar na Agenda' : 'Pôr na Agenda'}
                      </button>
                    </div>
                  </>
                )}
              </div>
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
