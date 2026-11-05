import { useState } from 'react';
import { useStore } from '../../store';
import { remove, upsert } from '../../actions';
import { balance, BOX_COLORS, deposit, newBox, newMarks, pendingBoxes, planStatus, progress, removeMove, savedInMonth, timeToGoal, withdraw } from '../../boxes';
import type { SavingsBox } from '../../types';
import { formatDMY, formatMoney, formatMonth, relativeDay, todayISO } from '../../utils';
import { Chips, Empty, Field, Icon, MoneyInput, notify, Pill, Progress, Sheet, Toggle } from '../../ui';

const everyLabel = (b: SavingsBox) => (b.plan ? `${formatMoney(b.plan.amount)} ${b.plan.every === 'semana' ? 'toda semana' : 'todo mês'}` : 'Sem plano');
const REASONS = [
  { value: 'realizei' as const, label: 'Realizei o objetivo' },
  { value: 'emergencia' as const, label: 'Emergência' },
  { value: 'outro' as const, label: 'Outro motivo' },
];

/** Aba "Caixinhas" de Finanças. */
export function CaixinhasTab({ month, newOpen, onNewClose }: { month: string; newOpen: boolean; onNewClose: () => void }) {
  const { data } = useStore();
  const today = todayISO();
  const [form, setForm] = useState<SavingsBox | 'new' | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [move, setMove] = useState<{ id: string; kind: 'guardar' | 'tirar' } | null>(null);
  const active = data.boxes.filter((b) => !b.realizedAt);
  const done = data.boxes.filter((b) => b.realizedAt);
  const total = active.reduce((s, b) => s + balance(b), 0);
  const saved = savedInMonth(data.boxes, month);
  const pending = pendingBoxes(data.boxes, today);
  const showForm = form ?? (newOpen ? 'new' : null);
  const closeForm = () => {
    setForm(null);
    onNewClose();
  };

  return (
    <>
      <section className="card" aria-label="Resumo das caixinhas">
        <div className="summary">
          <div className="summary-box">
            <span className="label">Total guardado</span>
            <span className="value green">{formatMoney(total)}</span>
          </div>
          <div className="summary-box">
            <span className="label">Em {formatMonth(month).split(' ')[0].toLowerCase()}</span>
            <span className={`value ${saved < 0 ? 'red' : ''}`}>{saved > 0 ? '+' : ''}{formatMoney(saved)}</span>
          </div>
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>
          O app não mexe no seu dinheiro: ele só anota o que você guardou no banco ou na poupança. Guardar não é gasto.
        </p>
      </section>

      {pending.length > 0 && (
        <section className="card raised">
          <div className="card-head">
            <h2>Hoje é dia de guardar</h2>
          </div>
          <ul className="list">
            {pending.map((b) => (
              <li key={b.id} className="row">
                <span className="dot" style={{ background: b.color }} />
                <div className="row-body">
                  <span className="row-title">{b.name}</span>
                  <span className="row-meta">Plano: {everyLabel(b)}</span>
                </div>
                <button type="button" className="btn small primary" onClick={() => setMove({ id: b.id, kind: 'guardar' })}>
                  Guardar {formatMoney(b.plan!.amount)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="section-head">
        <h2 className="section-title">Minhas caixinhas</h2>
        <button type="button" className="link" onClick={() => setForm('new')}>
          + Nova caixinha
        </button>
      </div>
      {active.length === 0 ? (
        <section className="card">
          <Empty>Uma caixinha é uma meta de dinheiro guardado: viagem, reserva de emergência, um presente. Com um plano ("R$ 100 toda semana"), o app lembra o dia de guardar e mostra quanto falta.</Empty>
          <button type="button" className="btn soft block" style={{ marginTop: 12 }} onClick={() => setForm('new')}>
            <Icon name="plusCircle" size={18} /> <span className="green">Criar a primeira caixinha</span>
          </button>
        </section>
      ) : (
        <div className="stack">
          {active.map((b) => (
            <BoxCard key={b.id} b={b} today={today} onOpen={() => setDetail(b.id)} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>Realizadas</h2>
            <Pill tone="green">{done.length}</Pill>
          </div>
          <ul className="list">
            {done.map((b) => (
              <li key={b.id}>
                <button type="button" className="row" onClick={() => setDetail(b.id)}>
                  <span className="medal" aria-hidden="true">
                    <Icon name="checkCircle" size={18} />
                  </span>
                  <div className="row-body">
                    <span className="row-title">{b.name}</span>
                    <span className="row-meta">Realizada em {formatDMY(b.realizedAt!)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showForm && <BoxForm box={showForm === 'new' ? undefined : showForm} onClose={closeForm} />}
      {detail && <BoxDetail id={detail} onClose={() => setDetail(null)} onEdit={(b) => setForm(b)} onMove={(kind) => setMove({ id: detail, kind })} />}
      {move && <MoveSheet id={move.id} kind={move.kind} onClose={() => setMove(null)} />}
    </>
  );
}

function BoxCard({ b, today, onOpen }: { b: SavingsBox; today: string; onOpen: () => void }) {
  const bal = balance(b);
  const st = planStatus(b, today);
  const eta = timeToGoal(b, bal);
  return (
    <button type="button" className="card box-card" onClick={onOpen}>
      <div className="box-head">
        <span className="dot" style={{ background: b.color }} />
        <strong>{b.name}</strong>
        {st?.pending ? <Pill tone="orange">Guardar hoje</Pill> : b.target && bal >= b.target ? <Pill tone="green">Meta alcançada</Pill> : null}
      </div>
      <div className="box-amount">
        <span className="value">{formatMoney(bal)}</span>
        {b.target && <span className="muted">de {formatMoney(b.target)}</span>}
      </div>
      {b.target && <Progress pct={progress(b, bal) * 100} />}
      <span className="muted small">
        {everyLabel(b)}
        {st && !st.pending ? ` · próxima: ${relativeDay(st.next).toLowerCase()}` : ''}
        {eta ? ` · no ritmo do plano, ${eta}` : ''}
      </span>
    </button>
  );
}

function BoxDetail({ id, onClose, onEdit, onMove }: { id: string; onClose: () => void; onEdit: (b: SavingsBox) => void; onMove: (k: 'guardar' | 'tirar') => void }) {
  const { data, update } = useStore();
  const b = data.boxes.find((x) => x.id === id);
  if (!b) return null;
  const bal = balance(b);
  const eta = timeToGoal(b, bal);
  const moves = [...b.moves].sort((x, y) => y.date.localeCompare(x.date));
  function del() {
    if (confirm(`Excluir a caixinha "${b!.name}" e o histórico dela? O dinheiro no banco não é afetado.`)) {
      update(remove('boxes', b!.id));
      onClose();
    }
  }
  return (
    <Sheet title={b.name} badge={b.realizedAt ? <Pill tone="green">Realizada</Pill> : undefined} onClose={onClose}>
      <div className="preview-box">
        <span className="muted small">Guardado</span>
        <strong className="box-big">{formatMoney(bal)}</strong>
        {b.target && (
          <>
            <Progress pct={progress(b, bal) * 100} />
            <span className="muted small">
              {Math.round(progress(b, bal) * 100)}% de {formatMoney(b.target)}
              {bal < b.target ? ` · faltam ${formatMoney(b.target - bal)}` : ''}
              {eta ? ` · ${eta}` : ''}
            </span>
          </>
        )}
      </div>
      <dl className="detail-rows">
        <div>
          <dt>Plano</dt>
          <dd>{everyLabel(b)}</dd>
        </div>
        {b.deadline && (
          <div>
            <dt>Prazo</dt>
            <dd>{formatDMY(b.deadline)}</dd>
          </div>
        )}
      </dl>
      {!b.realizedAt && (
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={() => onMove('guardar')}>
            <Icon name="plus" size={18} /> Guardar
          </button>
          <button type="button" className="btn" onClick={() => onMove('tirar')} disabled={bal <= 0}>
            Tirar
          </button>
        </div>
      )}
      <div className="field">
        <span className="field-label">Histórico</span>
        {moves.length === 0 ? (
          <Empty>Nada guardado ainda.</Empty>
        ) : (
          <ul className="list">
            {moves.map((m) => (
              <li key={m.id} className="row">
                <div className="row-body">
                  <span className="row-title">{m.kind === 'retirada' ? `Tirou · ${REASONS.find((r) => r.value === m.reason)?.label ?? 'Outro motivo'}` : m.kind === 'plano' ? 'Guardou (plano)' : 'Guardou'}</span>
                  <span className="row-meta">{formatDMY(m.date)}</span>
                </div>
                <strong className={m.kind === 'retirada' ? 'red' : 'green'}>
                  {m.kind === 'retirada' ? '−' : '+'}
                  {formatMoney(m.amount)}
                </strong>
                <button type="button" className="icon-btn" aria-label="Apagar este registro" onClick={() => confirm('Apagar este registro?') && update(removeMove(b.id, m.id))}>
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => onEdit(b)}>
          <Icon name="edit" size={18} /> Editar
        </button>
        <button type="button" className="btn danger" onClick={del}>
          <Icon name="trash" size={18} /> Excluir
        </button>
      </div>
    </Sheet>
  );
}

function BoxForm({ box, onClose }: { box?: SavingsBox; onClose: () => void }) {
  const { data, update } = useStore();
  const [name, setName] = useState(box?.name ?? '');
  const [target, setTarget] = useState(Math.round((box?.target ?? 0) * 100));
  const [deadline, setDeadline] = useState(box?.deadline ?? '');
  const [hasPlan, setHasPlan] = useState(box ? box.plan !== null : true);
  const [planCents, setPlanCents] = useState(Math.round((box?.plan?.amount ?? 100) * 100));
  const [every, setEvery] = useState<'semana' | 'mes'>(box?.plan?.every ?? 'semana');
  const [start, setStart] = useState(box?.plan?.startDate ?? todayISO());
  const [color, setColor] = useState(box?.color ?? BOX_COLORS[data.boxes.length % BOX_COLORS.length]);
  const [error, setError] = useState('');
  function save() {
    if (!name.trim()) return setError('Dê um nome (ex.: Viagem).');
    if (hasPlan && planCents <= 0) return setError('Quanto guardar em cada vez?');
    const plan = hasPlan ? { amount: planCents / 100, every, startDate: start || todayISO() } : null;
    const t = target > 0 ? target / 100 : null;
    const b: SavingsBox = box ? { ...box, name: name.trim(), target: t, deadline: deadline || null, plan, color } : newBox({ name, target: t, color, plan, deadline: deadline || null });
    update(upsert('boxes', b));
    if (!box) notify('Caixinha criada', plan ? `${b.name} · ${everyLabel(b)}` : b.name);
    onClose();
  }
  return (
    <Sheet
      title={box ? 'Editar caixinha' : 'Nova caixinha'}
      onClose={onClose}
      footer={
        <>
          {error && <p className="form-error">{error}</p>}
          <button type="button" className="btn primary block" onClick={save}>
            Salvar
          </button>
        </>
      }
    >
      <Field label="Nome">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Viagem, Reserva de emergência" autoFocus={!box} />
      </Field>
      <Field label="Meta (opcional)" hint="Deixe em R$ 0,00 para guardar sem meta.">
        <MoneyInput cents={target} onChange={setTarget} label="Meta da caixinha" />
      </Field>
      <div className="toggle-row">
        <div>
          <strong>Plano para guardar</strong>
          <span className="muted small">O app lembra no dia e mostra quanto falta.</span>
        </div>
        <Toggle checked={hasPlan} onChange={setHasPlan} label="Plano para guardar" />
      </div>
      {hasPlan && (
        <>
          <div className="form-row">
            <Field label="Quanto">
              <MoneyInput cents={planCents} onChange={setPlanCents} label="Quanto guardar em cada vez" />
            </Field>
            <Field label="A partir de">
              <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
          </div>
          <Chips label="Frequência" value={every} onChange={setEvery} options={[{ value: 'semana', label: 'Toda semana' }, { value: 'mes', label: 'Todo mês' }]} />
        </>
      )}
      <Field label="Prazo (opcional)">
        <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </Field>
      <div className="field">
        <span className="field-label">Cor</span>
        <div className="swatches" role="radiogroup" aria-label="Cor">
          {BOX_COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Cor ${c}`} className={`swatch${color === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setColor(c)}>
              {color === c && <Icon name="check" size={18} />}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/** Guardar ou tirar dinheiro de uma caixinha (também usado no Início). */
export function MoveSheet({ id, kind, onClose }: { id: string; kind: 'guardar' | 'tirar'; onClose: () => void }) {
  const { data, update } = useStore();
  const b = data.boxes.find((x) => x.id === id);
  const today = todayISO();
  const st = b ? planStatus(b, today) : null;
  const [cents, setCents] = useState(Math.round((kind === 'guardar' && b?.plan ? b.plan.amount : 0) * 100));
  const [date, setDate] = useState(today);
  const [asPlan, setAsPlan] = useState(Boolean(st?.pending));
  const [reason, setReason] = useState<'realizei' | 'emergencia' | 'outro' | null>(null);
  if (!b) return null;
  const bal = balance(b);
  const guardar = kind === 'guardar';
  const ok = cents > 0 && date && (guardar || (reason && cents / 100 <= bal + 0.001));
  function confirm() {
    const v = cents / 100;
    if (guardar) {
      const marks = newMarks(b!, bal + v);
      update(deposit(b!.id, v, date, asPlan));
      const top = marks[marks.length - 1];
      if (top === 100) notify('Meta alcançada! 🎉', `${b!.name}: ${formatMoney(bal + v)} guardados.`);
      else if (top) notify(`${b!.name}: ${top}% da meta!`, `Faltam ${formatMoney(b!.target! - bal - v)}.`);
      else notify('Guardado', `${formatMoney(v)} em ${b!.name}.`);
    } else {
      update(withdraw(b!.id, v, date, reason!));
      notify(reason === 'realizei' ? 'Objetivo realizado! 🎉' : 'Registrado', reason === 'realizei' ? `${b!.name} fica no histórico, com a medalha.` : `Saldo de ${b!.name}: ${formatMoney(bal - v)}.`);
    }
    onClose();
  }
  return (
    <Sheet
      title={guardar ? `Guardar em ${b.name}` : `Tirar de ${b.name}`}
      onClose={onClose}
      footer={
        <button type="button" className="btn primary block" disabled={!ok} onClick={confirm}>
          <Icon name="check" /> {guardar ? 'Guardar' : 'Registrar retirada'}
        </button>
      }
    >
      <Field label="Valor" hint={guardar ? 'O valor que você guardou de verdade (pode ser diferente do plano).' : `Saldo atual: ${formatMoney(bal)}.`}>
        <MoneyInput cents={cents} onChange={setCents} label="Valor" large autoFocus />
      </Field>
      {!guardar && (
        <div className="toggle-row">
          {cents / 100 > bal + 0.001 ? <span className="form-error">É mais do que o saldo da caixinha.</span> : <span />}
          <button type="button" className="link" onClick={() => setCents(Math.round(bal * 100))}>
            Tirar tudo ({formatMoney(bal)})
          </button>
        </div>
      )}
      <Field label="Data">
        <input type="date" className="input" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
      </Field>
      {guardar && b.plan && (
        <div className="toggle-row">
          <div>
            <strong>Conta como o plano</strong>
            <span className="muted small">{st?.pending ? `Cumpre o ${b.plan.every === 'semana' ? 'plano desta semana' : 'plano deste mês'}.` : 'O plano deste período já foi cumprido: este valor entra como extra.'}</span>
          </div>
          <Toggle checked={asPlan && Boolean(st?.pending)} onChange={setAsPlan} label="Conta como o plano" />
        </div>
      )}
      {!guardar && (
        <div className="field">
          <span className="field-label">Por que vai tirar?</span>
          <Chips label="Motivo" value={reason} onChange={setReason} options={REASONS} />
          {reason === 'realizei' && <span className="field-hint">A caixinha vira "realizada" e fica no histórico. Parabéns!</span>}
          {reason === 'emergencia' && <span className="field-hint">Tudo bem: para isso serve uma reserva. O plano continua.</span>}
        </div>
      )}
    </Sheet>
  );
}

/** Início: lembrete do dia de guardar. */
export function SaveToday() {
  const { data } = useStore();
  const [move, setMove] = useState<string | null>(null);
  const list = pendingBoxes(data.boxes);
  if (!list.length) return null;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Dia de guardar</h2>
        <a className="link" href="#/financas/caixinhas">
          Caixinhas
        </a>
      </div>
      <ul className="list">
        {list.map((b) => (
          <li key={b.id} className="row">
            <span className="dot" style={{ background: b.color }} />
            <div className="row-body">
              <span className="row-title">{b.name}</span>
              <span className="row-meta">{b.target ? `${formatMoney(balance(b))} de ${formatMoney(b.target)}` : formatMoney(balance(b))}</span>
            </div>
            <button type="button" className="btn small primary" onClick={() => setMove(b.id)}>
              Guardar {formatMoney(b.plan!.amount)}
            </button>
          </li>
        ))}
      </ul>
      {move && <MoveSheet id={move} kind="guardar" onClose={() => setMove(null)} />}
    </section>
  );
}

