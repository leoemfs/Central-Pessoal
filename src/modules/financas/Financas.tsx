import { useEffect, useMemo, useState } from 'react';
import type { ViewProps } from '../../App';
import { useStore } from '../../store';
import { useSubAction } from '../../router';
import {
  billStatus, cardUsed, categoryTotals, FIXA_AHEAD, getInvoice, installmentLabel, materialize, monthBills, summarize, type Bill,
} from '../../finance';
import { addMonths, formatDMY, formatMoney, formatMonth, monthKey, todayISO } from '../../utils';
import { CategoryBadge, Empty, Icon, MonthNav, PageHeader, Pill, Progress, Segmented } from '../../ui';
import { CardForm } from './CardForm';
import { ExpenseDetail } from './ExpenseDetail';
import { ExpenseForm } from './ExpenseForm';
import { InvoiceSheet } from './InvoiceSheet';
import { IncomeForm, ReceitasTab } from './Receitas';
import { CaixinhasTab } from './Caixinhas';
import { BillStatusPill, CreditCardVisual, InvoiceStatusPill, useCategoryOf } from './shared';

type Tab = 'mes' | 'receitas' | 'cartoes' | 'caixinhas';
const pctFmt = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

export function Financas({ route }: ViewProps) {
  const { data, update } = useStore();
  const categoryOf = useCategoryOf();
  const today = todayISO();
  const [month, setMonth] = useState(monthKey(today));
  const [tab, setTab] = useState<Tab>('mes');
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<{ cardId: string; month: string } | null>(null);
  const [cardForm, setCardForm] = useState(false);
  const [incomeForm, setIncomeForm] = useState(false);
  const [boxForm, setBoxForm] = useState(false);

  useSubAction(route, 'financas', {
    nova: () => (tab === 'cartoes' ? setCardForm(true) : tab === 'receitas' ? setIncomeForm(true) : tab === 'caixinhas' ? setBoxForm(true) : setFormOpen(true)),
    cartoes: () => setTab('cartoes'),
    caixinhas: () => setTab('caixinhas'),
    receitas: () => setTab('receitas'),
    'nova-receita': () => {
      setTab('receitas');
      setIncomeForm(true);
    },
  });

  // Ao navegar para meses futuros, gera as contas fixas desses meses.
  useEffect(() => {
    if (month > addMonths(monthKey(today), FIXA_AHEAD)) update((d) => materialize(d, month));
  }, [month, today, update]);

  const bills = useMemo(() => monthBills(data, month, today), [data, month, today]);
  const summary = summarize(bills);
  const cats = useMemo(() => categoryTotals(data, month), [data, month]);
  const catTotal = cats.reduce((s, c) => s + c.amount, 0);

  function openBill(b: Bill) {
    if (b.invoice) setInvoice({ cardId: b.invoice.card.id, month: b.invoice.month });
    else if (b.expense) setDetailId(b.expense.id);
  }

  return (
    <>
      <PageHeader title="Finanças" actions={<MonthNav label={formatMonth(month)} onPrev={() => setMonth(addMonths(month, -1))} onNext={() => setMonth(addMonths(month, 1))} onLabel={() => setMonth(monthKey(today))} />} />
      <Segmented label="Visão" value={tab} onChange={setTab} options={[{ value: 'mes', label: 'Despesas' }, { value: 'receitas', label: 'Receitas' }, { value: 'cartoes', label: 'Cartões' }, { value: 'caixinhas', label: 'Caixinhas' }]} />

      {tab === 'caixinhas' ? (
        <CaixinhasTab month={month} newOpen={boxForm} onNewClose={() => setBoxForm(false)} />
      ) : tab === 'receitas' ? (
        <ReceitasTab month={month} />
      ) : tab === 'mes' ? (
        <>
          <div className="btn-row fin-links">
            <a className="btn" href="#/orcamento">
              <Icon name="target" size={18} /> Orçamento
            </a>
            <a className="btn" href="#/relatorios">
              <Icon name="pie" size={18} /> Relatórios
            </a>
          </div>
          <section className="card" aria-label="Resumo do mês">
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
                <span className="label">
                  Em aberto {summary.open > 0 ? <Pill tone="orange">Pendente</Pill> : summary.total > 0 ? <Pill tone="green">Tudo pago</Pill> : null}
                </span>
                <span className={`value ${summary.open > 0 ? 'orange' : ''}`}>{formatMoney(summary.open)}</span>
                <Progress pct={summary.pct} />
                <p className="summary-foot">
                  {pctFmt(summary.pct)} pago · {pctFmt(summary.total ? 100 - summary.pct : 0)} em aberto
                </p>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Contas por vencimento</h2>
              <span className="muted small">{bills.length} lançamento(s)</span>
            </div>
            {bills.length === 0 ? (
              <div className="empty">
                <p>Nenhuma despesa em {formatMonth(month).toLowerCase()}. Toque em + para lançar.</p>
              </div>
            ) : (
              <ul className="list">
                {bills.map((b) => (
                  <li key={b.key}>
                    <BillRow bill={b} today={today} onClick={() => openBill(b)} categoryOf={categoryOf} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {cats.length > 0 && (
            <section className="card">
              <div className="card-head">
                <h2>Distribuição de despesas</h2>
                <span className="muted small">{formatMoney(catTotal)}</span>
              </div>
              <SplitBar parts={cats.map((c) => ({ id: c.categoryId, label: categoryOf(c.categoryId).name, color: categoryOf(c.categoryId).color, amount: c.amount }))} total={catTotal} />
              <ul className="bars">
                {cats.map((c) => {
                  const cat = categoryOf(c.categoryId);
                  const pct = catTotal ? (c.amount / catTotal) * 100 : 0;
                  return (
                    <li key={c.categoryId} className="bar-row">
                      <CategoryBadge icon={cat.icon} color={cat.color} size={34} />
                      <div className="bar-body">
                        <div className="bar-head">
                          <span>{cat.name}</span>
                          <span className="muted tabular">
                            {formatMoney(c.amount)} · {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="bar">
                          <div style={{ width: `${pct}%`, background: cat.color }} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      ) : (
        <>
          {data.cards.length === 0 ? (
            <section className="card">
              <Empty>Nenhum cartão cadastrado. Toque em + para cadastrar e as compras caem sozinhas na fatura certa.</Empty>
            </section>
          ) : (
            <div className="cards-list">
              {data.cards.map((card) => {
                // Fatura que vence no mês escolhido acima (a mesma que aparece na aba Mês).
                const current = month;
                const inv = getInvoice(data, card, current, today);
                const used = cardUsed(data, card);
                return (
                  <button key={card.id} type="button" className="card-tile" onClick={() => setInvoice({ cardId: card.id, month: current })}>
                    <CreditCardVisual name={card.name} color={card.color}>
                      Fecha dia {card.closingDay} · Vence dia {card.dueDay}
                    </CreditCardVisual>
                    <div className="card-stats">
                      <div>
                        <span className="muted">Fatura de {formatMonth(month).split(' ')[0].toLowerCase()}</span>
                        <strong>{formatMoney(inv.total)}</strong>
                      </div>
                      <div>
                        <span className="muted">Vencimento</span>
                        <strong>{formatDMY(inv.dueDate)}</strong>
                      </div>
                    </div>
                    <div className="toggle-row">
                      <InvoiceStatusPill invoice={inv} />
                      {card.limit ? <span className="muted small">Disponível {formatMoney(card.limit - used)}</span> : null}
                    </div>
                    {card.limit ? <Progress pct={(used / card.limit) * 100} tone={used > card.limit * 0.8 ? 'orange' : 'green'} /> : null}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {formOpen && <ExpenseForm onClose={() => setFormOpen(false)} />}
      {detailId && (
        <ExpenseDetail
          id={detailId}
          onClose={() => setDetailId(null)}
          onOpenInvoice={(cardId, m) => {
            setDetailId(null);
            setInvoice({ cardId, month: m });
          }}
        />
      )}
      {invoice && <InvoiceSheet cardId={invoice.cardId} month={invoice.month} onClose={() => setInvoice(null)} />}
      {cardForm && <CardForm onClose={() => setCardForm(false)} />}
      {incomeForm && <IncomeForm initialDate={month === monthKey(today) ? undefined : `${month}-01`} onClose={() => setIncomeForm(false)} />}
    </>
  );
}

export function BillRow({ bill, today, onClick, categoryOf }: { bill: Bill; today: string; onClick?: () => void; categoryOf: ReturnType<typeof useCategoryOf> }) {
  const status = billStatus(bill, today);
  const e = bill.expense;
  const cat = e ? categoryOf(e.categoryId) : null;
  const parcel = e ? installmentLabel(e) : null;
  const meta = bill.invoice
    ? `${bill.invoice.items.length} compra(s) · vence ${formatDMY(bill.dueDate)}`
    : `${parcel ? `Parcela ${parcel} · ` : e?.kind === 'fixa' ? 'Mensal · ' : ''}${status === 'pago' && bill.paidAt ? `pago em ${formatDMY(bill.paidAt)}` : `vence ${formatDMY(bill.dueDate)}`}`;
  return (
    <button type="button" className="row" onClick={onClick}>
      {bill.invoice ? <CreditCardVisual name={bill.invoice.card.name} color={bill.invoice.card.color} mini /> : cat && <CategoryBadge icon={cat.icon} color={cat.color} />}
      <div className="row-body">
        <span className="row-title">{bill.title}</span>
        <span className="row-meta">{meta}</span>
      </div>
      <div className="row-end">
        <span className="amount">{formatMoney(bill.amount)}</span>
        <BillStatusPill bill={bill} today={today} />
      </div>
    </button>
  );
}

const MAX_SEGMENTS = 5;

/**
 * Barra segmentada (parte do todo, num relance). Sem texto: a lista logo abaixo traz nome e valor de cada parte.
 * Mais de 5 partes: o restante vira "Outros", em cinza neutro.
 */
function SplitBar({ parts, total }: { parts: { id: string; label: string; color: string; amount: number }[]; total: number }) {
  if (total <= 0) return null;
  const shown = parts.slice(0, parts.length > MAX_SEGMENTS + 1 ? MAX_SEGMENTS : parts.length);
  const rest = parts.slice(shown.length);
  const segs = rest.length ? [...shown, { id: 'outros', label: `Outros (${rest.length})`, color: '#52525b', amount: rest.reduce((a, b) => a + b.amount, 0) }] : shown;
  return (
    <div className="split-bar" role="img" aria-label={segs.map((p) => `${p.label}: ${Math.round((p.amount / total) * 100)}%`).join(', ')}>
      {segs.map((p) => (
        <span key={p.id} style={{ flexGrow: p.amount, background: p.color }} title={`${p.label}: ${formatMoney(p.amount)} (${Math.round((p.amount / total) * 100)}%)`} />
      ))}
    </div>
  );
}
