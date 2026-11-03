import { useState } from 'react';
import { useStore } from '../../store';
import { cardUsed, getInvoice, installmentLabel, payInvoice, unpayInvoice } from '../../finance';
import { addMonths, formatDMY, formatMoney, formatMonth } from '../../utils';
import { CategoryBadge, Empty, Icon, IconButton, Progress, Sheet } from '../../ui';
import { CardForm } from './CardForm';
import { ExpenseDetail } from './ExpenseDetail';
import { PaySheet } from './PaySheet';
import { CreditCardVisual, InvoiceStatusPill, useCategoryOf } from './shared';

export function InvoiceSheet({ cardId, month: initialMonth, onClose }: { cardId: string; month: string; onClose: () => void }) {
  const { data, update } = useStore();
  const categoryOf = useCategoryOf();
  const [month, setMonth] = useState(initialMonth);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [editingCard, setEditingCard] = useState(false);
  const card = data.cards.find((c) => c.id === cardId);
  if (!card) return null;
  const inv = getInvoice(data, card, month);
  const used = cardUsed(data, card);

  function deleteCard() {
    const n = data.expenses.filter((e) => e.cardId === cardId).length;
    const msg = n ? `Excluir o cartão "${card!.name}" e as ${n} compra(s) lançadas nele?` : `Excluir o cartão "${card!.name}"?`;
    if (!confirm(msg)) return;
    update((d) => {
      const stamp = new Date().toISOString();
      const deleted = { ...d.deleted, [cardId]: stamp };
      for (const e of d.expenses) if (e.cardId === cardId) deleted[e.id] = stamp;
      return {
        ...d,
        cards: d.cards.filter((c) => c.id !== cardId),
        expenses: d.expenses.filter((e) => e.cardId !== cardId),
        series: d.series.filter((s) => s.cardId !== cardId),
        deleted,
      };
    });
    onClose();
  }

  return (
    <>
      <Sheet title={card.name} onClose={onClose} size="wide">
        <div className="card-form-head">
          <CreditCardVisual name={card.name} color={card.color} mini />
          <div className="month-nav" style={{ flex: 1, justifyContent: 'space-between' }}>
            <IconButton icon="left" label="Fatura anterior" onClick={() => setMonth(addMonths(month, -1))} />
            <span className="month-label">Fatura de {formatMonth(month).toLowerCase()}</span>
            <IconButton icon="right" label="Próxima fatura" onClick={() => setMonth(addMonths(month, 1))} />
          </div>
        </div>

        <div className="invoice-head">
          <div className="toggle-row">
            <span className="muted">Valor da fatura</span>
            <InvoiceStatusPill invoice={inv} />
          </div>
          <span className="value">{formatMoney(inv.total)}</span>
          <span className="muted small">
            Fecha em {formatDMY(inv.closingDate)} · Vence em {formatDMY(inv.dueDate)}
            {inv.paidAt ? ` · Paga em ${formatDMY(inv.paidAt)}` : ''}
          </span>
        </div>

        {inv.items.length > 0 &&
          (inv.paidAt ? (
            <button type="button" className="btn block" onClick={() => update((d) => unpayInvoice(d, card.id, month))}>
              <Icon name="undo" size={18} /> Reabrir fatura
            </button>
          ) : (
            <button type="button" className="btn primary block" onClick={() => setPaying(true)}>
              <Icon name="check" size={18} /> Pagar fatura
            </button>
          ))}

        <div>
          <h3 className="section-title" style={{ marginTop: 0, marginBottom: 4 }}>
            Compras ({inv.items.length})
          </h3>
          {inv.items.length === 0 ? (
            <Empty>Nenhuma compra nesta fatura.</Empty>
          ) : (
            <ul className="list">
              {inv.items.map((e) => {
                const cat = categoryOf(e.categoryId);
                const parcel = installmentLabel(e);
                return (
                  <li key={e.id}>
                    <button type="button" className="row" onClick={() => setDetailId(e.id)}>
                      <CategoryBadge icon={cat.icon} color={cat.color} />
                      <div className="row-body">
                        <span className="row-title">{e.description}</span>
                        <span className="row-meta">
                          {e.purchaseDate && formatDMY(e.purchaseDate)}
                          {parcel && <span className="pill">Parcela {parcel}</span>}
                          {e.kind === 'fixa' && <span className="pill">Mensal</span>}
                        </span>
                      </div>
                      <span className="amount">{formatMoney(e.amount)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {card.limit && (
          <div className="preview-box">
            <div className="toggle-row">
              <span className="muted small">Limite disponível</span>
              <span className="muted small">de {formatMoney(card.limit)}</span>
            </div>
            <strong className={card.limit - used < 0 ? 'red' : undefined}>{formatMoney(card.limit - used)}</strong>
            <Progress pct={(used / card.limit) * 100} tone={used > card.limit * 0.8 ? 'orange' : 'green'} />
            <span className="muted small">Considera compras e parcelas futuras ainda não pagas.</span>
          </div>
        )}

        <div className="btn-row">
          <button type="button" className="btn" onClick={() => setEditingCard(true)}>
            <Icon name="edit" size={18} /> Editar cartão
          </button>
          <button type="button" className="btn danger" onClick={deleteCard}>
            <Icon name="trash" size={18} /> Excluir
          </button>
        </div>
      </Sheet>

      {detailId && <ExpenseDetail id={detailId} onClose={() => setDetailId(null)} onOpenInvoice={(_, m) => { setMonth(m); setDetailId(null); }} />}
      {editingCard && <CardForm initial={card} onClose={() => setEditingCard(false)} />}
      {paying && (
        <PaySheet
          title={`Pagar fatura ${card.name}`}
          cents={Math.round(inv.total * 100)}
          editableAmount={false}
          onClose={() => setPaying(false)}
          onConfirm={(date) => {
            update((d) => payInvoice(d, card.id, month, date));
            setPaying(false);
          }}
        />
      )}
    </>
  );
}
