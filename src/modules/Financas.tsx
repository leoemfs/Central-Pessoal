import { useMemo, useState, type FormEvent } from 'react';
import { useStore } from '../store';
import { remove, upsert } from '../actions';
import type { Transaction, TxType } from '../types';
import { addMonths, formatDate, formatMoney, formatMonth, monthKey, parseMoney, todayISO, uid } from '../utils';
import { Card, Empty, Icon, IconButton, MonthNav, PageHeader } from '../ui';

const DEFAULT_CATEGORIES: Record<TxType, string[]> = {
  despesa: ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Contas', 'Outros'],
  receita: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'],
};

export function monthTotals(txs: Transaction[], month: string) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (monthKey(t.date) !== month) continue;
    if (t.type === 'receita') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

interface Draft {
  type: TxType;
  amount: string;
  category: string;
  description: string;
  date: string;
}

const emptyDraft = (type: TxType = 'despesa'): Draft => ({ type, amount: '', category: '', description: '', date: todayISO() });

export function Financas() {
  const { data, update } = useStore();
  const [month, setMonth] = useState(monthKey(todayISO()));
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const monthTxs = useMemo(
    () => data.transactions.filter((t) => monthKey(t.date) === month).sort((a, b) => b.date.localeCompare(a.date)),
    [data.transactions, month],
  );
  const totals = useMemo(() => monthTotals(data.transactions, month), [data.transactions, month]);
  const overall = useMemo(
    () => data.transactions.reduce((s, t) => s + (t.type === 'receita' ? t.amount : -t.amount), 0),
    [data.transactions],
  );

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of monthTxs) if (t.type === 'despesa') m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [monthTxs]);

  const categories = useMemo(() => {
    const used = data.transactions.filter((t) => t.type === draft.type).map((t) => t.category);
    return [...new Set([...DEFAULT_CATEGORIES[draft.type], ...used])];
  }, [data.transactions, draft.type]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const amount = parseMoney(draft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    setError('');
    const tx: Transaction = {
      id: editingId ?? uid(),
      type: draft.type,
      amount: Math.round(amount * 100) / 100,
      category: draft.category.trim() || 'Outros',
      description: draft.description.trim(),
      date: draft.date || todayISO(),
    };
    update(upsert('transactions', tx));
    setEditingId(null);
    setDraft(emptyDraft(draft.type));
    setMonth(monthKey(tx.date));
  }

  function edit(t: Transaction) {
    setEditingId(t.id);
    setError('');
    setDraft({
      type: t.type,
      amount: t.amount.toFixed(2).replace('.', ','),
      category: t.category,
      description: t.description,
      date: t.date,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditingId(null);
    setError('');
    setDraft(emptyDraft(draft.type));
  }

  function del(t: Transaction) {
    if (confirm(`Excluir "${t.description || t.category}" (${formatMoney(t.amount)})?`)) {
      update(remove('transactions', t.id));
      if (editingId === t.id) cancel();
    }
  }

  return (
    <>
      <PageHeader
        title="Finanças"
        subtitle={`Saldo geral: ${formatMoney(overall)}`}
        actions={<MonthNav label={formatMonth(month)} onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} onToday={() => setMonth(monthKey(todayISO()))} />}
      />

      <div className="stats">
        <div className="stat">
          <span className="stat-label">Receitas</span>
          <span className="stat-value positive">{formatMoney(totals.income)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Despesas</span>
          <span className="stat-value negative">{formatMoney(totals.expense)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Saldo do mês</span>
          <span className={`stat-value ${totals.balance >= 0 ? 'positive' : 'negative'}`}>{formatMoney(totals.balance)}</span>
        </div>
      </div>

      <div className="grid-2">
        <Card title={editingId ? 'Editar lançamento' : 'Novo lançamento'}>
          <form className="form" onSubmit={submit}>
            <div className="segmented full" role="radiogroup" aria-label="Tipo">
              {(['despesa', 'receita'] as TxType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={draft.type === t}
                  className={draft.type === t ? `on ${t}` : ''}
                  onClick={() => setDraft({ ...draft, type: t, category: '' })}
                >
                  {t === 'despesa' ? 'Despesa' : 'Receita'}
                </button>
              ))}
            </div>
            <div className="form-row">
              <label className="field">
                <span>Valor (R$)</span>
                <input
                  className="input"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={draft.amount}
                  onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Data</span>
                <input type="date" className="input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} required />
              </label>
            </div>
            <label className="field">
              <span>Categoria</span>
              <input className="input" list="tx-categories" placeholder="Escolha ou digite" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
              <datalist id="tx-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>Descrição</span>
              <input className="input" placeholder="ex.: Mercado" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </label>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              {editingId && (
                <button type="button" className="btn ghost" onClick={cancel}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn primary">
                <Icon name={editingId ? 'check' : 'plus'} size={18} />
                {editingId ? 'Salvar' : 'Lançar'}
              </button>
            </div>
          </form>
        </Card>

        <Card title="Despesas por categoria">
          {byCategory.length === 0 ? (
            <Empty>Sem despesas neste mês.</Empty>
          ) : (
            <ul className="bars">
              {byCategory.map(([cat, value]) => {
                const pct = totals.expense > 0 ? (value / totals.expense) * 100 : 0;
                return (
                  <li key={cat}>
                    <div className="bar-head">
                      <span>{cat}</span>
                      <span className="muted">
                        {formatMoney(value)} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="bar">
                      <div style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card title={`Lançamentos · ${formatMonth(month)}`}>
        {monthTxs.length === 0 ? (
          <Empty>Nenhum lançamento neste mês.</Empty>
        ) : (
          <ul className="list">
            {monthTxs.map((t) => (
              <li key={t.id} className="row">
                <span className={`tx-dot ${t.type}`} aria-hidden="true" />
                <div className="row-body">
                  <span className="row-title">{t.description || t.category}</span>
                  <span className="row-meta">
                    <span className="chip">{t.category}</span>
                    <span className="muted">{formatDate(t.date)}</span>
                  </span>
                </div>
                <span className={`amount ${t.type === 'receita' ? 'positive' : 'negative'}`}>
                  {t.type === 'receita' ? '+' : '−'} {formatMoney(t.amount)}
                </span>
                <div className="row-actions">
                  <IconButton icon="edit" label="Editar" onClick={() => edit(t)} />
                  <IconButton icon="trash" label="Excluir" tone="danger" onClick={() => del(t)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
