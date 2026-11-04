import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import {
  addIncome, deleteIncome, editIncome, incomeStatus, incomeSummary, monthBalance, monthIncomes, receiveIncome, sourceTotals, unreceiveIncome,
  type IncomePatch, type IncomeScope,
} from '../../incomes';
import type { Category, Income } from '../../types';
import { formatDMY, formatMoney, formatMonth, todayISO } from '../../utils';
import { CategoryBadge, Field, Icon, MoneyInput, Pill, Progress, Sheet, Toggle } from '../../ui';
import { CategorySheet } from './CategorySheet';
import { PaySheet } from './PaySheet';

const NO_SOURCE: Category = { id: '', name: 'Sem fonte', icon: 'tag', color: '#94a3b8' };

export function useSourceOf() {
  const { data } = useStore();
  return (id: string): Category => data.incomeSources.find((c) => c.id === id) ?? NO_SOURCE;
}

export function IncomeStatusPill({ income, today = todayISO() }: { income: Pick<Income, 'receivedAt' | 'date'>; today?: string }) {
  const s = incomeStatus(income, today);
  if (s === 'recebido') return <Pill tone="green">Recebido</Pill>;
  if (s === 'atrasado') return <Pill tone="orange">A receber</Pill>;
  return <Pill tone="blue">Previsto</Pill>;
}

export function IncomeRow({ income, onClick, today = todayISO() }: { income: Income; onClick?: () => void; today?: string }) {
  const sourceOf = useSourceOf();
  const src = sourceOf(income.sourceId);
  const when = income.receivedAt ? `entrou em ${formatDMY(income.receivedAt)}` : `previsto ${formatDMY(income.date)}`;
  return (
    <button type="button" className="row" onClick={onClick}>
      <CategoryBadge icon={src.icon} color={src.color} />
      <div className="row-body">
        <span className="row-title">{income.description}</span>
        <span className="row-meta">
          {income.seriesId ? 'Mensal · ' : ''}
          {when}
        </span>
      </div>
      <div className="row-end">
        <span className="amount green">+ {formatMoney(income.amount)}</span>
        <IncomeStatusPill income={income} today={today} />
      </div>
    </button>
  );
}

/** Aba Receitas de Finanças. */
export function ReceitasTab({ month }: { month: string }) {
  const { data } = useStore();
  const sourceOf = useSourceOf();
  const today = todayISO();
  const [detailId, setDetailId] = useState<string | null>(null);
  const list = monthIncomes(data, month);
  const s = incomeSummary(list);
  const bal = monthBalance(data, month, today);
  const bySource = sourceTotals(data, month);

  return (
    <>
      <section className="card" aria-label="Receitas do mês">
        <div className="summary">
          <div className="summary-box">
            <span className="label">Previsto no mês</span>
            <span className="value">{formatMoney(s.total)}</span>
          </div>
          <div className="summary-box">
            <span className="label">Já entrou</span>
            <span className="value green">{formatMoney(s.received)}</span>
          </div>
          <div className="summary-box full">
            <span className="label">A receber</span>
            <span className="value">{formatMoney(s.pending)}</span>
            <Progress pct={s.pct} />
          </div>
        </div>
      </section>

      <section className="card raised">
        <div className="card-head">
          <h2>Balanço de {formatMonth(month).split(' ')[0].toLowerCase()}</h2>
        </div>
        <table className="balance-table">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Item</span>
              </th>
              <th scope="col">Previsto</th>
              <th scope="col">Até agora</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Entradas</th>
              <td className="green">{`+\u00a0${formatMoney(bal.incomeTotal)}`}</td>
              <td className="green">{`+\u00a0${formatMoney(bal.incomeReceived)}`}</td>
            </tr>
            <tr>
              <th scope="row">Despesas</th>
              <td className="red">{`−\u00a0${formatMoney(bal.expenseTotal)}`}</td>
              <td className="red">{`−\u00a0${formatMoney(bal.expensePaid)}`}</td>
            </tr>
            <tr className="total">
              <th scope="row">Sobra</th>
              <td className={bal.planned >= 0 ? 'green' : 'red'}>{formatMoney(bal.planned)}</td>
              <td className={bal.current >= 0 ? 'green' : 'red'}>{formatMoney(bal.current)}</td>
            </tr>
          </tbody>
        </table>
        <p className="muted small" style={{ marginTop: 8 }}>
          Previsto: tudo o que deve entrar menos tudo o que vence no mês. Até agora: o que já entrou menos o que já foi pago.
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Receitas do mês</h2>
          <span className="muted small">{list.length} lançamento(s)</span>
        </div>
        {list.length === 0 ? (
          <p className="empty">Nenhuma receita em {formatMonth(month).toLowerCase()}. Toque em + para lançar salário, freelance, bônus…</p>
        ) : (
          <ul className="list">
            {list.map((i) => (
              <li key={i.id}>
                <IncomeRow income={i} today={today} onClick={() => setDetailId(i.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {bySource.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>Por fonte</h2>
            <span className="muted small">{formatMoney(s.total)}</span>
          </div>
          <ul className="bars">
            {bySource.map((b) => {
              const src = sourceOf(b.sourceId);
              const pct = s.total ? (b.amount / s.total) * 100 : 0;
              return (
                <li key={b.sourceId} className="bar-row">
                  <CategoryBadge icon={src.icon} color={src.color} size={34} />
                  <div className="bar-body">
                    <div className="bar-head">
                      <span>{src.name}</span>
                      <span className="muted tabular">
                        {formatMoney(b.amount)} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="bar">
                      <div style={{ width: `${pct}%`, background: src.color }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {detailId && <IncomeDetail id={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}

function IncomeScopeSheet({ mode, onPick, onClose }: { mode: 'edit' | 'delete'; onPick: (s: IncomeScope) => void; onClose: () => void }) {
  return (
    <Sheet title={mode === 'edit' ? 'O que deseja alterar?' : 'O que deseja excluir?'} onClose={onClose}>
      <div className="scope-options">
        <button type="button" onClick={() => onPick('one')}>
          <strong>Somente este mês</strong>
          <span className="muted small">{mode === 'edit' ? 'Os outros meses continuam iguais.' : 'Remove só esta entrada.'}</span>
        </button>
        <button type="button" onClick={() => onPick('next')}>
          <strong className={mode === 'delete' ? 'red' : undefined}>Este e os próximos meses</strong>
          <span className="muted small">{mode === 'edit' ? 'Vale daqui para frente. Os meses que já entraram mantêm o valor.' : 'Encerra a receita mensal a partir deste mês.'}</span>
        </button>
      </div>
    </Sheet>
  );
}

export function IncomeDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, update } = useStore();
  const sourceOf = useSourceOf();
  const [editing, setEditing] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inc = data.incomes.find((i) => i.id === id);

  useEffect(() => {
    if (!inc) onClose();
  }, [inc, onClose]);
  if (!inc) return null;
  const src = sourceOf(inc.sourceId);

  function remove(scope: IncomeScope) {
    update((d) => deleteIncome(d, id, scope));
    setDeleting(false);
    onClose();
  }

  return (
    <>
      <Sheet title="Detalhes da receita" badge={<IncomeStatusPill income={inc} />} onClose={onClose}>
        <div>
          <h3 className="detail-title">{inc.description}</h3>
          <p className="muted">{src.name}</p>
        </div>
        <dl className="detail-rows">
          <div>
            <dt>Tipo</dt>
            <dd>{inc.seriesId ? 'Mensal' : 'Avulsa'}</dd>
          </div>
          <div>
            <dt>Valor</dt>
            <dd className="green">{formatMoney(inc.amount)}</dd>
          </div>
          <div>
            <dt>Data prevista</dt>
            <dd>{formatDMY(inc.date)}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>{inc.receivedAt ? <Pill tone="green">Entrou em {formatDMY(inc.receivedAt)}</Pill> : <IncomeStatusPill income={inc} />}</dd>
          </div>
        </dl>

        {inc.receivedAt ? (
          <button type="button" className="pay-cta" onClick={() => update((d) => unreceiveIncome(d, id))}>
            <Icon name="undo" size={28} />
            <strong>Desmarcar recebimento</strong>
            <span className="muted small">Volta para "previsto".</span>
          </button>
        ) : (
          <button type="button" className="pay-cta" onClick={() => setReceiving(true)}>
            <Icon name="checkCircle" size={30} />
            <strong>Marcar como recebido</strong>
            <span className="muted small">Informe a data e o valor que realmente entrou.</span>
          </button>
        )}

        <div className="btn-row">
          <button type="button" className="btn" onClick={() => setEditing(true)}>
            <Icon name="edit" size={18} /> Editar
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (inc.seriesId) setDeleting(true);
              else if (confirm(`Excluir "${inc.description}"?`)) remove('one');
            }}
          >
            <Icon name="trash" size={18} /> Excluir
          </button>
        </div>
      </Sheet>

      {editing && <IncomeForm editing={inc} onClose={() => setEditing(false)} />}
      {deleting && <IncomeScopeSheet mode="delete" onPick={remove} onClose={() => setDeleting(false)} />}
      {receiving && (
        <PaySheet
          title="Marcar como recebido"
          cents={Math.round(inc.amount * 100)}
          editableAmount
          confirmLabel="Confirmar recebimento"
          dateLabel="Data em que entrou"
          amountLabel="Valor recebido"
          note={inc.seriesId ? 'Se o valor mudou, ele vira a previsão dos próximos meses.' : undefined}
          onClose={() => setReceiving(false)}
          onConfirm={(date, cents) => {
            update((d) => receiveIncome(d, id, date, cents / 100));
            setReceiving(false);
          }}
        />
      )}
    </>
  );
}

export function IncomeForm({ editing, initialDate, onClose }: { editing?: Income; initialDate?: string; onClose: () => void }) {
  const { data, update } = useStore();
  const sourceOf = useSourceOf();
  const today = todayISO();
  const [cents, setCents] = useState(editing ? Math.round(editing.amount * 100) : 0);
  const [sourceId, setSourceId] = useState<string | null>(editing?.sourceId ?? null);
  const [description, setDescription] = useState(editing?.description ?? '');
  const [date, setDate] = useState(editing?.date ?? initialDate ?? today);
  const [recurring, setRecurring] = useState(false);
  const [received, setReceived] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  const [sourceSheet, setSourceSheet] = useState(false);
  const [pending, setPending] = useState<IncomePatch | null>(null);
  const [error, setError] = useState('');

  const src = sourceId ? sourceOf(sourceId) : null;

  function submit() {
    if (cents <= 0) return setError('Informe o valor.');
    if (!sourceId) return setError('Escolha a fonte.');
    if (!date) return setError('Informe a data.');
    const desc = description.trim() || src!.name;
    if (editing) {
      const patch: IncomePatch = { description: desc, sourceId, amount: cents / 100, date };
      if (editing.seriesId) return setPending(patch);
      update((d) => editIncome(d, editing.id, patch, 'one'));
      return onClose();
    }
    update((d) => addIncome(d, { description: desc, sourceId, amount: cents / 100, date, recurring, receivedAt: received ? (date > today ? today : date) : null }));
    onClose();
  }

  return (
    <>
      <Sheet
        title={editing ? 'Editar receita' : 'Nova receita'}
        onClose={onClose}
        footer={
          <>
            {error && <p className="form-error">{error}</p>}
            <button type="button" className="btn primary block" onClick={submit}>
              {editing ? 'Salvar alterações' : 'Salvar receita'}
            </button>
          </>
        }
      >
        <Field label="Valor">
          <MoneyInput cents={cents} onChange={setCents} label="Valor da receita" large autoFocus={!editing} />
        </Field>

        <div className="field">
          <span className="field-label">Fonte</span>
          <div className="select-list">
            <button type="button" className="select-trigger" aria-expanded={listOpen} onClick={() => setListOpen((o) => !o)}>
              {src ? <CategoryBadge icon={src.icon} color={src.color} size={30} /> : null}
              <span className={`grow${src ? '' : ' muted'}`}>{src ? src.name : 'Salário, freelance, bônus…'}</span>
              <Icon name={listOpen ? 'up' : 'down'} size={18} />
            </button>
            {listOpen && (
              <>
                {data.incomeSources.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={c.id === sourceId ? 'on' : ''}
                    onClick={() => {
                      setSourceId(c.id);
                      setListOpen(false);
                    }}
                  >
                    <CategoryBadge icon={c.icon} color={c.color} size={30} />
                    <span>{c.name}</span>
                  </button>
                ))}
                <button type="button" className="add" onClick={() => setSourceSheet(true)}>
                  <Icon name="plusCircle" /> Cadastrar nova fonte
                </button>
              </>
            )}
          </div>
        </div>

        <Field label="Descrição (opcional)">
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Salário de novembro, Site da Ana" />
        </Field>

        <Field label={received && !editing ? 'Data em que entrou' : 'Data prevista'}>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        {!editing && (
          <>
            <div className="toggle-row">
              <div>
                <strong>Já entrou</strong>
                <span className="muted small">{received ? 'Conta como recebida.' : 'Fica como prevista até você marcar.'}</span>
              </div>
              <Toggle checked={received} onChange={setReceived} label="Já entrou" />
            </div>
            <div className="toggle-row">
              <div>
                <strong>Repete todo mês</strong>
                <span className="muted small">Para salário, vale-alimentação, aluguel recebido…</span>
              </div>
              <Toggle checked={recurring} onChange={setRecurring} label="Repete todo mês" />
            </div>
          </>
        )}
      </Sheet>

      {sourceSheet && (
        <CategorySheet
          collection="incomeSources"
          onClose={() => setSourceSheet(false)}
          onSaved={(c) => {
            setSourceId(c.id);
            setListOpen(false);
          }}
        />
      )}
      {pending && editing && (
        <IncomeScopeSheet
          mode="edit"
          onClose={() => setPending(null)}
          onPick={(scope) => {
            update((d) => editIncome(d, editing.id, pending, scope));
            setPending(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
