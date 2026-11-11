import { CardScreen, type CardDef } from '../Cards';
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { toggleTask } from '../actions';
import { cleanDays, habitsOfDay, habitStreak } from '../habits';
import { UNLOCK_DAYS, unlockProgress } from '../journey';
import { HabitCheck, qtyText, RiskPill } from './Habitos';
import { monthBills, openBills, summarize } from '../finance';
import { monthBalance } from '../incomes';
import { addDays, formatDateTime, formatLongDate, formatMoney, formatMonth, greeting, monthKey, relativeDay, toISO, todayISO } from '../utils';
import { Empty, Icon, Pill, Progress, type IconName } from '../ui';
import { sortTasks, TaskItem } from './Tarefas';
import { AskCard, ForYou, Interview } from './Voce';
import { WeekPractice } from './Praticas';
import { SaveToday } from './financas/Caixinhas';
import { MoodCard } from './Humor';
import { BudgetAlerts } from './financas/Orcamento';
import { PinnedLists } from './Listas';
import { VoucherAlerts } from './financas/Vale';
import { EventItem, sortEvents } from './Agenda';
import { entrySummary, entryTitle } from './Diario';
import { BillRow } from './financas/Financas';
import { useCategoryOf } from './financas/shared';
import { JournalRhythmCard, SetupInvite } from './Montagem';
import { isHidden } from '../setup';
import { activeCycles, cycleCounts, library } from '../estudos';

function SeeAll({ href, label = 'Ver tudo' }: { href: string; label?: string }) {
  return (
    <a className="link" href={href}>
      {label}
    </a>
  );
}


function greetingEmoji(): string {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? '☀️' : h >= 12 && h < 18 ? '🌤️' : '🌙';
}

/** Cartões do Início que pertencem a um módulo (somem se ele estiver guardado). */
const OF_MODULE: Record<string, string> = { estudos: 'estudos', guardar: 'financas', orcamento: 'financas', vale: 'financas', listas: 'listas', ritmo: 'diario', revisao: 'diario', paravoce: 'voce' };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** M11: ciclos de Estudos em andamento, com o próximo tópico. Some se não houver ciclo. */
function StudyNow() {
  const { data } = useStore();
  const cycles = useMemo(() => activeCycles(data.study).slice(0, 2), [data.study]);
  if (!cycles.length) return null;
  const lib = library(data.study);
  return (
    <section className="card">
      <div className="card-head">
        <h2>Estudando agora</h2>
        <SeeAll href="#/ciclos" label="Ciclos" />
      </div>
      <ul className="list">
        {cycles.map((c) => {
          const n = cycleCounts(c);
          const next = c.topics.find((t) => t.status === 'andando') ?? c.topics.find((t) => t.status === 'afazer');
          return (
            <li key={c.id}>
              <a className="row study-now" href={`#/ciclos/${c.id}`}>
                <span className="row-body">
                  <span className="row-title">{c.name}</span>
                  <Progress pct={n.pct} />
                  <span className="row-meta">
                    {n.done} de {n.total} tópicos{next ? ` · agora: ${lib.topic(next.id)?.name ?? 'próximo tópico'}` : ''}
                  </span>
                </span>
                <Icon name="right" size={18} />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Dashboard() {
  const { data, update } = useStore();
  const [interview, setInterview] = useState(false);
  const p = data.profile;
  const categoryOf = useCategoryOf();
  const today = todayISO();
  const month = monthKey(today);

  const summary = useMemo(() => summarize(monthBills(data, month, today)), [data, month, today]);
  const balance = useMemo(() => monthBalance(data, month, today), [data, month, today]);
  const dueSoon = useMemo(() => openBills(data, addDays(today, 7), today), [data, today]);
  const tasks = useMemo(() => data.tasks.filter((t) => !t.done && t.due !== null && t.due <= addDays(today, 1)).sort(sortTasks), [data.tasks, today]);
  const otherPending = data.tasks.filter((t) => !t.done).length - tasks.length;
  const events = useMemo(() => data.events.filter((e) => e.date >= today).sort(sortEvents).slice(0, 4), [data.events, today]);
  const journal = useMemo(() => [...data.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2), [data.journal]);
  const journey = unlockProgress(data, today);
  const nucleo = habitsOfDay(data.habits, today);
  const routine = [...nucleo.rituals, ...nucleo.building];
  const routineDone = routine.filter((h) => h.checks.includes(today)).length;
  const eventsToday = data.events.filter((e) => e.date === today).length;
  const pendingTasks = data.tasks.filter((t) => !t.done).length;
  const lastEntry = journal[0];
  const lastEntryLabel = lastEntry ? relativeDay(toISO(new Date(lastEntry.createdAt))).toLowerCase() : null;
  const allDay: { to: string; icon: IconName; title: string; text: string }[] = [
    { to: 'agenda', icon: 'calendar', title: 'Agenda', text: eventsToday ? `${plural(eventsToday, 'compromisso', 'compromissos')} hoje` : 'Nenhum compromisso hoje' },
    { to: 'financas', icon: 'wallet', title: 'Finanças', text: dueSoon.length ? `${plural(dueSoon.length, 'conta próxima', 'contas próximas')} do vencimento` : 'Nenhuma conta vencendo nos próximos dias' },
    { to: 'diario', icon: 'book', title: 'Diário', text: lastEntryLabel ? `Último registro: ${lastEntryLabel}` : 'Nenhum registro ainda' },
    { to: 'agenda/tarefas', icon: 'tasks', title: 'Tarefas', text: pendingTasks ? plural(pendingTasks, 'tarefa pendente', 'tarefas pendentes') : 'Nenhuma tarefa pendente' },
    {
      to: 'jornada',
      icon: journey.unlocked ? 'sword' : 'lock',
      title: 'Jornada',
      text: journey.unlocked ? 'Desbloqueada — veja seu nível' : `${journey.active} de ${UNLOCK_DAYS} dias de uso para desbloquear`,
    },
    { to: 'nucleo', icon: 'sprout', title: 'Núcleo pessoal', text: routine.length ? `${routineDone} de ${routine.length} rituais e hábitos feitos` : 'Nada programado para hoje' },
  ];

  // Módulos guardados (desligados na montagem) saem do "Seu dia" e dos cartões do Início.
  const day = allDay.filter((d) => !isHidden(data, d.to));
  const off = (mod: string) => isHidden(data, mod);

  const backupDays = data.settings.lastBackupAt ? Math.floor((Date.now() - new Date(data.settings.lastBackupAt).getTime()) / 864e5) : null;
  const hasData = data.expenses.length + data.journal.length + data.tasks.length + data.events.length > 0;
  const needsBackup = hasData && (backupDays === null || backupDays > 30);

  const cards: CardDef[] = [
    { id: 'humor', label: 'Humor do dia', lock: 'top', node: (
      <MoodCard />
    ) },
    { id: 'montagem', label: 'Monte o app do seu jeito', node: (
      <SetupInvite />
    ) },
    { id: 'ritmo', label: 'Convite do Diário', node: (
      <JournalRhythmCard />
    ) },
    { id: 'perfil', label: 'Complete seu perfil', node: (
      <AskCard onAnswer={() => setInterview(true)} />
    ) },
    { id: 'dia', label: 'Seu dia', lock: 'keep', node: (
      <section className="card raised">
        <div className="card-head">
          <h2>Seu dia</h2>
        </div>
        <ul className="day-list">
          {day.map((d) => (
            <li key={d.title}>
              <a href={`#/${d.to}`}>
                <Icon name={d.icon} size={22} />
                <span>
                  <strong>{d.title}</strong>
                  <span className="muted">{d.text}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    ) },
    { id: 'orcamento', label: 'Aviso de orçamento', lock: 'keep', node: (
      <BudgetAlerts />
    ) },
    { id: 'vale', label: 'Aviso de vale', lock: 'keep', node: (
      <VoucherAlerts />
    ) },
    { id: 'guardar', label: 'Guardar hoje (caixinhas)', node: (
      <SaveToday />
    ) },
    { id: 'listas', label: 'Listas fixadas', node: (
      <PinnedLists />
    ) },
    { id: 'estudos', label: 'Estudando agora', node: (
      <StudyNow />
    ) },
    { id: 'paravoce', label: 'Para você', node: (
      <ForYou />
    ) },
    { id: 'revisao', label: 'Hora da revisão', node: (
      (new Date().getDay() === 0 || new Date().getDay() === 1) && (
        <a className="card review-cta" href="#/revisao">
          <Icon name="calendarCheck" size={26} />
          <span>
            <strong>Hora da revisão semanal</strong>
            <span className="muted small">Veja como foi a semana em todas as áreas e anote o que ajustar.</span>
          </span>
          <Icon name="right" size={18} />
        </a>
      )
    ) },
    { id: 'backup', label: 'Aviso de backup', lock: 'keep', node: (
      needsBackup && (
        <a className="alert orange" href="#/ajustes" style={{ textDecoration: 'none' }}>
          {backupDays === null ? 'Você ainda não fez um backup.' : `Último backup há ${backupDays} dias.`} Seus dados ficam só neste aparelho — toque para exportar.
        </a>
      )
    ) },
    { id: 'mes', label: 'Resumo do mês', node: (
      <section className="card">
        <div className="card-head">
          <h2>{formatMonth(month)}</h2>
          <SeeAll href="#/financas" label="Finanças" />
        </div>
        <div className="summary">
          <div className="summary-box">
            <span className="label">Total do mês</span>
            <span className="value">{formatMoney(summary.total)}</span>
          </div>
          <div className="summary-box">
            <span className="label">Já pago</span>
            <span className="value green">{formatMoney(summary.paid)}</span>
          </div>
          <div className="summary-box full">
            <span className="label">Em aberto</span>
            <span className={`value ${summary.open > 0 ? 'orange' : ''}`}>{formatMoney(summary.open)}</span>
            <Progress pct={summary.pct} />
          </div>
        </div>
        {balance.incomeTotal > 0 && (
          <a className="balance-line" href="#/financas/receitas">
            <span>
              Receitas <strong className="green">{formatMoney(balance.incomeTotal)}</strong>
            </span>
            <span>
              Sobra prevista <strong className={balance.planned >= 0 ? 'green' : 'red'}>{formatMoney(balance.planned)}</strong>
            </span>
          </a>
        )}
      </section>
    ) },
    { id: 'contas', label: 'Contas a vencer', lock: 'keep', node: (
      <section className="card">
        <div className="card-head">
          <h2>Contas a vencer</h2>
          <span className="muted small">próximos 7 dias</span>
        </div>
        {dueSoon.length === 0 ? (
          <Empty>Nenhuma conta vencendo. 🎉</Empty>
        ) : (
          <ul className="list">
            {dueSoon.slice(0, 6).map((b) => (
              <li key={b.key}>
                <BillRow bill={b} today={today} categoryOf={categoryOf} onClick={() => (location.hash = '/financas')} />
              </li>
            ))}
          </ul>
        )}
      </section>
    ) },
    { id: 'diario', label: 'Meu diário', node: (
      <section className="card">
        <div className="card-head">
          <h2>Meu diário</h2>
          <SeeAll href="#/diario" />
        </div>
        {journal.length === 0 ? (
          <Empty>Nenhum registro ainda.</Empty>
        ) : (
          journal.map((e) => (
            <a key={e.id} className="dash-entry" href="#/diario">
              <span className="row-title">{entryTitle(e)}</span>
              <span className="row-meta">{formatDateTime(e.createdAt)}</span>
              {entrySummary(e) && <p className="muted small" style={{ marginTop: 4 }}>{entrySummary(e)}</p>}
            </a>
          ))
        )}
        <a className="btn soft block" href="#/diario/nova" style={{ marginTop: 12 }}>
          <Icon name="plusCircle" size={18} /> <span className="green">Nova atualização</span>
        </a>
      </section>
    ) },
    { id: 'compromissos', label: 'Compromissos', node: (
      <section className="card">
        <div className="card-head">
          <h2>Compromissos</h2>
          <SeeAll href="#/agenda" />
        </div>
        {events.length === 0 ? (
          <Empty>Nenhum compromisso marcado.</Empty>
        ) : (
          <ul className="list">
            {events.map((e) => (
              <EventItem key={e.id} ev={e} showDate />
            ))}
          </ul>
        )}
      </section>
    ) },
    { id: 'tarefas', label: 'Tarefas', node: (
      <section className="card">
        <div className="card-head">
          <h2>Tarefas</h2>
          <SeeAll href="#/agenda/tarefas" />
        </div>
        {tasks.length === 0 ? (
          <Empty>{otherPending > 0 ? `Nada para hoje. ${otherPending} pendente(s) sem urgência.` : 'Tudo em dia!'}</Empty>
        ) : (
          <ul className="list">
            {tasks.slice(0, 6).map((t) => (
              <TaskItem key={t.id} task={t} onToggle={() => update(toggleTask(t.id))} />
            ))}
          </ul>
        )}
      </section>
    ) },
    { id: 'nucleo', label: 'Núcleo de hoje', node: (
      (routine.length > 0 || nucleo.quitting.length > 0) && (
        <section className="card">
          <div className="card-head">
            <h2>Núcleo de hoje</h2>
            <a className="link" href="#/nucleo">
              Ver tudo
            </a>
          </div>
          <ul className="list">
            {routine.map((h) => (
              <li key={h.id} className="row">
                <HabitCheck h={h} day={today} label={`Marcar "${h.name}" hoje`} />
                <div className="row-body">
                  <span className="row-title">{h.name}</span>
                  <span className="row-meta">
                    {h.kind === 'ritual' ? 'Ritual' : 'Construindo'}
                    {h.time ? ` · ${h.time}` : ''}
                    {qtyText(h, today) ? ` · ${qtyText(h, today)}` : ''}
                  </span>
                </div>
                <RiskPill h={h} today={today} />
                {h.link && !h.checks.includes(today) ? (
                  <a className="btn small" href={`#/nucleo/pratica/${encodeURIComponent(h.link)}`} aria-label={`Iniciar: ${h.name}`}>
                    <Icon name="right" size={14} /> Iniciar
                  </a>
                ) : (
                  <span className="pill">
                    <Icon name="flame" size={13} /> {habitStreak(h, today)}
                  </span>
                )}
              </li>
            ))}
            {nucleo.quitting.map((h) => (
              <li key={h.id} className="row">
                <span className="dot" style={{ background: h.color }} />
                <div className="row-body">
                  <span className="row-title">{h.name}</span>
                  <span className="row-meta">Abandonando</span>
                </div>
                <Pill tone="green">{cleanDays(h, today)} dias sem</Pill>
              </li>
            ))}
          </ul>
        </section>
      )
    ) },
    { id: 'pratica', label: 'Práticas da semana', node: (
      <WeekPractice />
    ) },
  ];

  return (
    <>
      <header className="page-header hero">
        <div className="page-title">
          <h1>
            {greeting()}
            {p.name ? `, ${p.name}` : ''}! <span aria-hidden="true">{greetingEmoji()}</span>
          </h1>
          <p className="muted desktop-only">{formatLongDate(today)}</p>
        </div>
      </header>

      <CardScreen screen="inicio" cards={cards.filter((c) => !OF_MODULE[c.id] || !off(OF_MODULE[c.id]))} />
      {interview && <Interview start={p.onboarding.step} onClose={() => setInterview(false)} />}
    </>
  );
}
