import { useMemo, useState } from 'react';
import type { ViewProps } from '../App';
import { go, useSubAction } from '../router';
import { useStore } from '../store';
import type { CareerGoal } from '../types';
import { formatDate, todayISO, uid } from '../utils';
import { Chips, Empty, Field, Icon, MoneyInput, notify, PageHeader, Pill, Progress, Segmented, Sheet, type IconName } from '../ui';
import { setBudget } from '../budget';
import { toggleCheck } from '../habits';
import {
  allGoals, AREAS, careerGoalProgress, goalSummary, goalsToWatch, isOwnGoal, newCareerGoal, removeCareerGoal, saveCareerGoal, setBoxGoal, setHabitGoal,
  type GoalArea, type GoalView,
} from '../objetivos';
import { MoveSheet } from './financas/Caixinhas';

/**
 * Objetivos (N10.1): central de todas as metas do app. Endereços:
 * #/objetivos (casa: todas as metas) · #/objetivos/menu (+) · #/objetivos/carreira e /voce (nova meta)
 * #/objetivos/area-carreira e /area-voce (já filtrado na área; E5: a ferramenta Metas da Carreira abre assim)
 * #/grandes (objetivos grandes, N10.2) · #/concluidos (histórico).
 * A meta continua morando no módulo dela: editar aqui muda lá.
 */

const KIND_ICON: Record<GoalView['kind'], IconName> = { caixinha: 'piggy', habito: 'sprout', ciclo: 'cap', orcamento: 'gauge', carreira: 'briefcase', voce: 'user' };
type Filter = 'todas' | GoalArea;
type Sit = 'tudo' | 'andando' | 'atrasada';

function useGoals() {
  const { data } = useStore();
  const today = todayISO();
  return useMemo(() => allGoals(data, today), [data, today]);
}

function GoalRow({ g, onOpen }: { g: GoalView; onOpen: (g: GoalView) => void }) {
  return (
    <li>
      <button type="button" className="row goal-row" onClick={() => onOpen(g)}>
        <span className="tile-icon small"><Icon name={KIND_ICON[g.kind]} size={18} /></span>
        <span className="row-body">
          <span className="row-title">{g.title}</span>
          <Progress pct={g.pct} tone={g.status === 'atrasada' ? 'red' : 'green'} />
          <span className="row-meta">
            {g.value}
            {g.deadline && g.status !== 'concluida' ? ` · até ${formatDate(g.deadline)}` : ''}
            {g.status === 'concluida' && g.doneAt ? ` · em ${formatDate(g.doneAt)}` : ''}
          </span>
          <span className="muted small">{g.where}</span>
        </span>
        {g.status === 'atrasada' && <Pill tone="red">{g.late}</Pill>}
        {g.status === 'concluida' && <Pill tone="green">alcançada</Pill>}
      </button>
    </li>
  );
}

export function ObjetivosPage({ route }: ViewProps) {
  const goals = useGoals();
  const [area, setArea] = useState<Filter>('todas');
  const [sit, setSit] = useState<Sit>('tudo');
  const [open, setOpen] = useState<GoalView | null>(null);
  const [menu, setMenu] = useState(false);
  const [career, setCareer] = useState<CareerGoal | null>(null);
  const { data } = useStore();

  useSubAction(route, 'objetivos', {
    menu: () => setMenu(true),
    carreira: () => setCareer(newCareerGoal()),
    voce: () => setCareer(newCareerGoal(undefined, 'voce')),
    'area-carreira': () => setArea('carreira'),
    'area-voce': () => setArea('voce'),
  });

  const current = goals.filter((g) => g.status !== 'concluida');
  const sum = goalSummary(goals);
  const shown = current.filter((g) => (area === 'todas' || g.area === area) && (sit === 'tudo' || g.status === sit));
  const areas = AREAS.filter((a) => a.id === 'carreira' || a.id === 'voce' || goals.some((g) => g.area === a.id));

  const openGoal = (g: GoalView) => {
    if (isOwnGoal(g)) setCareer(data.career.goals.find((x) => x.id === g.refId) ?? null);
    else setOpen(g);
  };

  return (
    <>
      <PageHeader
        title="Objetivos"
        tabs={
          <Chips<Filter>
            label="Área"
            value={area}
            onChange={setArea}
            options={[{ value: 'todas', label: 'Todas' }, ...areas.map((a) => ({ value: a.id as Filter, label: a.label }))]}
          />
        }
      />

      <section className="card" aria-label="Resumo das metas">
        <div className="summary three">
          <button type="button" className={`summary-box${sit === 'andando' ? ' on' : ''}`} onClick={() => setSit(sit === 'andando' ? 'tudo' : 'andando')}>
            <span className="label">Andando</span>
            <span className="value">{sum.andando}</span>
          </button>
          <button type="button" className={`summary-box${sit === 'atrasada' ? ' on' : ''}`} onClick={() => setSit(sit === 'atrasada' ? 'tudo' : 'atrasada')}>
            <span className="label">Atrasadas</span>
            <span className={`value${sum.atrasadas ? ' red' : ''}`}>{sum.atrasadas}</span>
          </button>
          <a className="summary-box" href="#/concluidos">
            <span className="label">Concluídas no ano</span>
            <span className="value green">{sum.concluidasNoAno}</span>
          </a>
        </div>
      </section>

      <section className="card">
        {shown.length ? (
          <ul className="list">{shown.map((g) => <GoalRow key={g.id} g={g} onOpen={openGoal} />)}</ul>
        ) : (
          <Empty>
            {current.length
              ? 'Nenhuma meta com esse filtro.'
              : 'Aqui aparecem todas as suas metas: caixinhas, hábitos, ciclos de estudo, limites do orçamento, metas de carreira e as suas metas pessoais (Você). Toque no + para criar a primeira.'}
          </Empty>
        )}
        {(area === 'carreira' || area === 'voce') && (
          <button type="button" className="btn soft block" style={{ marginTop: 12 }} onClick={() => setCareer(newCareerGoal(undefined, area))}>
            <Icon name="plusCircle" size={18} /> {area === 'voce' ? 'Nova meta pessoal' : 'Nova meta de carreira'}
          </button>
        )}
      </section>

      {menu && <NewMenu onClose={() => setMenu(false)} onOwn={(a) => { setMenu(false); setCareer(newCareerGoal(undefined, a)); }} />}
      {open && <GoalSheet g={open} onClose={() => setOpen(null)} />}
      {career && <CareerGoalSheet goal={career} onClose={() => setCareer(null)} />}
    </>
  );
}

function NewMenu({ onClose, onOwn }: { onClose: () => void; onOwn: (a: CareerGoal['area']) => void }) {
  const items: { icon: IconName; title: string; hint: string; run: () => void }[] = [
    { icon: 'user', title: 'Meta pessoal', hint: 'Algo que você quer para você (ex.: correr 5 km), com prazo e passos', run: () => onOwn('voce') },
    { icon: 'briefcase', title: 'Meta de carreira', hint: 'Cargo, área ou salário, com prazo e passos', run: () => onOwn('carreira') },
    { icon: 'piggy', title: 'Caixinha', hint: 'Juntar dinheiro para algo (mora em Finanças)', run: () => go('financas/nova-caixinha') },
    { icon: 'sprout', title: 'Hábito', hint: 'Criar um hábito novo (mora no Núcleo)', run: () => go('nucleo/novo') },
    { icon: 'cap', title: 'Ciclo de estudo', hint: 'Escolher tópicos para estudar (mora em Estudos)', run: () => go('ciclos') },
    { icon: 'gauge', title: 'Limite de gasto', hint: 'Quanto gastar por mês numa categoria (mora em Finanças)', run: () => go('orcamento') },
  ];
  return (
    <Sheet title="Nova meta" onClose={onClose}>
      <p className="muted small" style={{ marginBottom: 10 }}>A meta mora no módulo dela e aparece aqui também.</p>
      <div className="quick-list">
        {items.map((it) => (
          <button key={it.title} type="button" className="tile" onClick={() => { onClose(); it.run(); }}>
            <span className="tile-icon"><Icon name={it.icon} /></span>
            <span className="tile-text"><strong>{it.title}</strong><span className="muted">{it.hint}</span></span>
            <Icon name="right" size={18} />
          </button>
        ))}
        <div className="tile disabled" aria-disabled="true">
          <span className="tile-icon"><Icon name="flag" /></span>
          <span className="tile-text"><strong>Objetivo grande</strong><span className="muted">Juntar várias metas (em breve)</span></span>
        </div>
      </div>
    </Sheet>
  );
}

/** Uma meta que mora em outro módulo: ação rápida e "Editar meta". */
function GoalSheet({ g, onClose }: { g: GoalView; onClose: () => void }) {
  const { data, update } = useStore();
  const today = todayISO();
  const box = g.kind === 'caixinha' ? data.boxes.find((b) => b.id === g.refId) : undefined;
  const habit = g.kind === 'habito' ? data.habits.find((h) => h.id === g.refId) : undefined;
  const [money, setMoney] = useState(Math.round((box?.target ?? (g.kind === 'orcamento' ? data.budgets[g.refId] ?? 0 : 0)) * 100));
  const [deadline, setDeadline] = useState(box?.deadline ?? '');
  const [days, setDays] = useState(String(habit?.target ?? 66));
  const [qty, setQty] = useState(String(habit?.goal ?? ''));
  const [move, setMove] = useState(false);
  const [editing, setEditing] = useState(false);

  function save() {
    if (box) update(setBoxGoal(box.id, money / 100, deadline || null));
    else if (g.kind === 'orcamento') update(setBudget(g.refId, money / 100 || null));
    else if (habit) update(setHabitGoal(habit.id, habit.kind === 'construir' ? { target: Number(days) || habit.target } : { goal: Number(qty) || null }));
    notify('Meta salva', `Mudou também em ${g.where.split(' › ')[0]}.`);
    onClose();
  }

  const doneToday = habit ? habit.checks.includes(today) : false;
  const editable = !!box || !!habit || g.kind === 'orcamento';

  return (
    <Sheet title={g.title} onClose={onClose}>
      <p className="muted small">Mora em {g.where}</p>
      <Progress pct={g.pct} tone={g.status === 'atrasada' ? 'red' : 'green'} />
      <p className="row-meta" style={{ marginBottom: 12 }}>
        {g.value}
        {g.deadline ? ` · prazo ${formatDate(g.deadline)}` : ''}
        {g.status === 'atrasada' ? ` · ${g.late}` : ''}
      </p>

      <div className="btn-row">
        {box && !box.realizedAt && <button type="button" className="btn primary" onClick={() => setMove(true)}>Guardar</button>}
        {habit && (
          <button type="button" className={`btn ${doneToday ? 'soft' : 'primary'}`} onClick={() => update(toggleCheck(habit.id, today))}>
            {doneToday ? 'Feito hoje ✓' : 'Marcar hoje'}
          </button>
        )}
        <button type="button" className="btn soft" onClick={() => { onClose(); go(g.to); }}>
          {g.kind === 'ciclo' ? 'Abrir ciclo' : `Abrir em ${g.where.split(' › ')[0]}`}
        </button>
      </div>

      {editable && !editing && (
        <button type="button" className="btn ghost block" style={{ marginTop: 8 }} onClick={() => setEditing(true)}>
          <Icon name="edit" size={16} /> Editar meta
        </button>
      )}
      {editable && editing && (
        <div style={{ marginTop: 12 }}>
          {(box || g.kind === 'orcamento') && <MoneyInput cents={money} onChange={setMoney} label={box ? 'Meta da caixinha' : 'Limite por mês'} />}
          {box && (
            <Field label="Prazo (opcional)">
              <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </Field>
          )}
          {habit?.kind === 'construir' && (
            <Field label="Dias para virar ritual">
              <input className="input" type="number" inputMode="numeric" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
            </Field>
          )}
          {habit && habit.kind !== 'construir' && (
            <Field label={`Meta por dia${habit.unit ? ` (${habit.unit})` : ''}`}>
              <input className="input" type="number" inputMode="numeric" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
          )}
          <button type="button" className="btn primary block" onClick={save}>Salvar meta</button>
        </div>
      )}
      {move && box && <MoveSheet id={box.id} kind="guardar" onClose={() => setMove(false)} />}
    </Sheet>
  );
}

/** Meta própria: mora aqui em Objetivos (área Carreira ou Você). */
function CareerGoalSheet({ goal, onClose }: { goal: CareerGoal; onClose: () => void }) {
  const { data, update } = useStore();
  const isNew = !data.career.goals.some((g) => g.id === goal.id);
  const [g, setG] = useState<CareerGoal>(goal);
  const [step, setStep] = useState('');
  const p = careerGoalProgress(g);

  const addStep = () => {
    const t = step.trim();
    if (!t) return;
    setG({ ...g, steps: [...g.steps, { id: uid(), text: t, done: false }] });
    setStep('');
  };
  function save(next: CareerGoal = g) {
    if (!next.title.trim()) return notify('Dê um nome à meta', next.area === 'voce' ? 'Ex.: "Correr 5 km".' : 'Ex.: "Ser coordenador até 2027".');
    update(saveCareerGoal({ ...next, title: next.title.trim() }));
    onClose();
  }

  return (
    <Sheet
      title={isNew ? 'Nova meta' : g.area === 'voce' ? 'Meta pessoal' : 'Meta de carreira'}
      onClose={onClose}
      footer={<button type="button" className="btn primary block" onClick={() => save()}>Salvar</button>}
    >
      <Field label="Área">
        <Segmented<CareerGoal['area']>
          label="Área"
          value={g.area}
          onChange={(area) => setG({ ...g, area })}
          options={[{ value: 'voce', label: 'Você' }, { value: 'carreira', label: 'Carreira' }]}
        />
      </Field>
      <Field label="Onde quer chegar">
        <input className="input" value={g.title} placeholder={g.area === 'voce' ? 'Ex.: Correr 5 km, juntar R$ 10 mil' : 'Ex.: Ser coordenador, ganhar R$ 8.000'} onChange={(e) => setG({ ...g, title: e.target.value })} autoFocus={isNew} />
      </Field>
      <Field label="Prazo (opcional)">
        <input className="input" type="date" value={g.deadline ?? ''} onChange={(e) => setG({ ...g, deadline: e.target.value || null })} />
      </Field>
      <Field label="Anotação (opcional)">
        <textarea className="input" rows={2} value={g.note} onChange={(e) => setG({ ...g, note: e.target.value })} />
      </Field>

      <h3 className="section-title">Passos {p.total ? `(${p.done} de ${p.total})` : ''}</h3>
      {p.total > 0 && <Progress pct={p.pct} />}
      <ul className="list">
        {g.steps.map((s) => (
          <li key={s.id} className="row">
            <button type="button" className={`career-check${s.done ? ' on' : ''}`} aria-label={s.done ? 'Desmarcar' : 'Marcar como feito'} onClick={() => setG({ ...g, steps: g.steps.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })}>
              {s.done && <Icon name="check" size={13} />}
            </button>
            <span className={`row-body${s.done ? ' career-done' : ''}`}>{s.text}</span>
            <button type="button" className="icon-btn" aria-label="Tirar passo" onClick={() => setG({ ...g, steps: g.steps.filter((x) => x.id !== s.id) })}>
              <Icon name="x" size={16} />
            </button>
          </li>
        ))}
      </ul>
      <div className="career-add">
        <input className="input" aria-label="Novo passo" value={step} placeholder="Novo passo (ex.: fazer curso de gestão)" onChange={(e) => setStep(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addStep()} />
        <button type="button" className="btn soft" onClick={addStep} disabled={!step.trim()}>Adicionar</button>
      </div>

      {!isNew && (
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button type="button" className="btn soft" onClick={() => save({ ...g, doneAt: g.doneAt ? null : todayISO() })}>
            {g.doneAt ? 'Reabrir meta' : 'Concluir meta'}
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (confirm(`Excluir a meta "${goal.title}"?`)) {
                update(removeCareerGoal(goal.id));
                onClose();
              }
            }}
          >
            <Icon name="trash" size={16} /> Excluir
          </button>
        </div>
      )}
    </Sheet>
  );
}

export function ConcluidosPage() {
  const goals = useGoals().filter((g) => g.status === 'concluida');
  const { data } = useStore();
  const [open, setOpen] = useState<GoalView | null>(null);
  const [career, setCareer] = useState<CareerGoal | null>(null);
  const byYear = new Map<string, GoalView[]>();
  for (const g of goals) {
    const y = (g.doneAt ?? '').slice(0, 4) || 'Sem data';
    byYear.set(y, [...(byYear.get(y) ?? []), g]);
  }
  return (
    <>
      <PageHeader title="Concluídos" />
      {goals.length === 0 && (
        <section className="card">
          <Empty>Quando você alcançar uma meta (caixinha cheia, hábito que virou ritual, ciclo terminado…), ela fica guardada aqui.</Empty>
        </section>
      )}
      {[...byYear].map(([year, list]) => (
        <section key={year} className="card">
          <div className="card-head"><h2>{year}</h2><span className="muted small">{list.length}</span></div>
          <ul className="list">
            {list.map((g) => (
              <GoalRow key={g.id} g={g} onOpen={(x) => (isOwnGoal(x) ? setCareer(data.career.goals.find((c) => c.id === x.refId) ?? null) : setOpen(x))} />
            ))}
          </ul>
        </section>
      ))}
      {open && <GoalSheet g={open} onClose={() => setOpen(null)} />}
      {career && <CareerGoalSheet goal={career} onClose={() => setCareer(null)} />}
    </>
  );
}

/** Objetivos grandes chegam na N10.2. */
export function GrandesPage() {
  return (
    <>
      <PageHeader title="Grandes" />
      <section className="card">
        <Empty>
          Em breve: objetivos grandes que juntam várias metas de qualquer módulo (ex.: "Viajar em julho" = caixinha da viagem + passaporte + inglês), com um anel de progresso.
        </Empty>
      </section>
    </>
  );
}

/** Cartão do Início: metas atrasadas e prazos dos próximos 30 dias. Some quando não há nada. */
export function GoalsCard() {
  const goals = useGoals();
  const watch = goalsToWatch(goals);
  if (!watch.length) return null;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Objetivos</h2>
        <a className="link" href="#/objetivos">Ver tudo</a>
      </div>
      <ul className="list">
        {watch.map((g) => (
          <li key={g.id}>
            <a className="row" href={`#/${isOwnGoal(g) ? 'objetivos' : g.to}`}>
              <span className="row-body">
                <span className="row-title">{g.title}</span>
                <Progress pct={g.pct} tone={g.status === 'atrasada' ? 'red' : 'green'} />
                <span className="row-meta">
                  {g.status === 'atrasada' ? g.late : g.deadline ? `até ${formatDate(g.deadline)}` : ''} · {g.value}
                </span>
              </span>
              <Icon name="right" size={18} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

