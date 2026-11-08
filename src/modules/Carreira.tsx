import { useState } from 'react';
import type { ViewProps } from '../App';
import { useSubAction } from '../router';
import { useStore } from '../store';
import type { AppData, JobApp, JobStage } from '../types';
import { formatDate, relativeDay, todayISO, uid } from '../utils';
import { Chips, Empty, Field, Icon, notify, PageHeader, Pill, Sheet } from '../ui';
import {
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
 * #/carreira (casa: próximos passos e resumo) · #/vagas (lista com etapas) · #/vagas/nova · #/metas (em breve).
 * Trabalho atual, Currículo e Metas chegam nas próximas partes (N8.2 a N8.4).
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

/** Casa do módulo: o que fazer agora nas vagas e o que vem nas próximas versões. */
export function CarreiraPage() {
  const { data } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const jobs = data.career.jobs;
  const today = todayISO();
  const open = openJobs(jobs);
  const pending = open.filter((j) => j.nextDate || waitingDays(j, today)).slice(0, 3);
  const counts = stageCounts(jobs);
  return (
    <>
      <PageHeader title="Carreira" subtitle="Onde você está, para onde quer ir e as vagas no caminho." />
      <section className="card">
        <div className="card-head">
          <h2>Próximos passos</h2>
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
          <Empty>{open.length ? 'Nenhum passo com data. Abra uma vaga e marque o próximo passo.' : 'Nenhuma vaga ainda. Toque no + para guardar a primeira.'}</Empty>
        )}
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Vagas em andamento</h2>
          <span className="muted small">{open.length}</span>
        </div>
        <Funnel counts={counts} value={null} onPick={(s) => (window.location.hash = `/vagas/etapa-${s}`)} />
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Chegando em breve</h2>
        </div>
        <ul className="list">
          <li className="row">
            <Icon name="briefcase" />
            <span className="row-body">
              <span className="row-title">Trabalho atual</span>
              <span className="muted small">Cargo, salários e aumentos, feedbacks e 1:1</span>
            </span>
          </li>
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
      {openId && <JobSheet id={openId} onClose={() => setOpenId(null)} />}
    </>
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
            <Field label="Etapa">
              <div className="job-steps" role="radiogroup" aria-label="Etapa">
                {STAGES.map((s) => (
                  <button key={s.id} type="button" role="radio" aria-checked={j.stage === s.id} className={stageIndex(s.id) < stageIndex(j.stage) ? 'done' : j.stage === s.id ? 'cur' : ''} onClick={() => update(saveJob(setStage(j, s.id, today)))}>
                    <i />
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>
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
